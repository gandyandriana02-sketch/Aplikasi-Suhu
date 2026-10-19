import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getSheetValues, updateSheetValues } from '@/lib/google-sheets';
import { sendWhatsAppBatchAlert, BatchAlertItem } from '@/lib/whatsapp';
import { recordAuditLog } from '@/lib/audit';
import { parseWarehouseSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

/**
 * POST /api/notifications/batch-alert
 * Dispatches a consolidated WhatsApp alert for multiple overlimit transactions
 * after "Simpan Semua" finishes (PRD Section 12, 13.3, FR-010).
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'Sesi tidak ditemukan atau telah berakhir.' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { warehouse_id, tanggal, period_id, transaction_ids } = body;

    if (!warehouse_id || !tanggal || !period_id) {
      return NextResponse.json(
        { error: 'Parameter warehouse_id, tanggal, dan period_id wajib disertakan.' },
        { status: 400 }
      );
    }

    // 1. Fetch TRANSAKSI_SUHU & SETTINGS to locate pending overlimit transactions & verify WA switch
    const [txRows, settingsRows] = await Promise.all([
      getSheetValues('TRANSAKSI_SUHU!A:AB'),
      getSheetValues('SETTINGS!A2:F').catch(() => [])
    ]);

    const whSettings = parseWarehouseSettings(settingsRows, warehouse_id);
    if (!whSettings.wa_notification_enabled) {
      return NextResponse.json({
        success: true,
        count: 0,
        message: 'Notifikasi WhatsApp dinonaktifkan di pengaturan warehouse.'
      });
    }

    if (!txRows || txRows.length <= 1) {
      return NextResponse.json({ success: true, count: 0, message: 'Tidak ada data transaksi.' });
    }

    // Match rows: must be in same warehouse, date, period, status MELEBIHI_BATAS, and PENDING or matching transaction_ids
    const targetRows: Array<{
      sheetRowNum: number;
      txId: string;
      locationName: string;
      periodLabel: string;
      suhu: number;
      maxLimit: number;
      driveFileId: string;
      warehouseCode: string;
      warehouseName: string;
    }> = [];

    for (let i = 1; i < txRows.length; i++) {
      const r = txRows[i];
      const rTxId = r[0];
      const rWhId = r[2];
      const rWhCode = r[3];
      const rWhName = r[4];
      const rTanggal = r[5];
      const rLocName = r[8];
      const rPeriodId = r[9];
      const rPeriodLabel = r[10];
      const rSuhu = parseFloat(r[11]) || 0;
      const rMaxLimit = parseFloat(r[12]) || 30;
      const rStatusSuhu = r[13];
      const rDriveFileId = r[19];
      const rWaStatus = r[23] || 'NOT_REQUIRED';

      const isMatchingId = Array.isArray(transaction_ids) && transaction_ids.includes(rTxId);
      const isContextMatch = rWhId === warehouse_id && rTanggal === tanggal && rPeriodId === period_id;

      if ((isMatchingId || isContextMatch) && rStatusSuhu === 'MELEBIHI_BATAS') {
        // Only include if not already successfully SENT
        if (rWaStatus !== 'SENT') {
          targetRows.push({
            sheetRowNum: i + 1,
            txId: rTxId,
            locationName: rLocName,
            periodLabel: rPeriodLabel,
            suhu: rSuhu,
            maxLimit: rMaxLimit,
            driveFileId: rDriveFileId,
            warehouseCode: rWhCode,
            warehouseName: rWhName
          });
        }
      }
    }

    if (targetRows.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        message: 'Tidak ada transaksi overlimit yang perlu dikirim notifikasi.'
      });
    }

    // 2. Prepare Batch Message Payload
    const firstRow = targetRows[0];
    const notifId = `WA-BATCH-${Date.now()}`;
    const appBaseUrl = req.nextUrl?.origin || 'http://localhost:3000';

    const items: BatchAlertItem[] = targetRows.map(r => ({
      locationName: r.locationName,
      suhu: r.suhu,
      driveFileId: r.driveFileId
    }));

    // 3. Dispatch to Fonnte API
    const waResult = await sendWhatsAppBatchAlert({
      notifId,
      tanggal,
      periodLabel: firstRow.periodLabel,
      maxLimit: firstRow.maxLimit,
      items,
      appBaseUrl,
      warehouseCode: firstRow.warehouseCode,
      warehouseName: firstRow.warehouseName
    });

    // 4. Update TRANSAKSI_SUHU columns W..Z for each row
    for (const r of targetRows) {
      const updateRange = `TRANSAKSI_SUHU!W${r.sheetRowNum}:Z${r.sheetRowNum}`;
      const updateValues = [
        [
          notifId,
          waResult.status,
          waResult.errorMessage || '',
          waResult.sentAt || ''
        ]
      ];
      await updateSheetValues(updateRange, updateValues, 'RAW');
    }

    // 5. Record Audit Log
    await recordAuditLog({
      actor_user_id: session.user_id,
      actor_username: session.username,
      actor_role: session.role,
      action_category: 'WA_RETRY',
      warehouse_id,
      target_reference: notifId,
      after_value: {
        notif_id: notifId,
        count: targetRows.length,
        status: waResult.status,
        transaction_ids: targetRows.map(r => r.txId)
      },
      notes_or_reason: `Pengiriman notifikasi WA Batch Alert untuk ${targetRows.length} lokasi overlimit (${waResult.status})`
    });

    return NextResponse.json({
      success: waResult.status === 'SENT',
      notifId,
      status: waResult.status,
      count: targetRows.length,
      errorMessage: waResult.errorMessage,
      sentAt: waResult.sentAt
    });
  } catch (error: any) {
    console.error('Error in POST /api/notifications/batch-alert:', error);
    return NextResponse.json(
      { error: 'Gagal mengirim batch alert: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
