import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getSheetValues, updateSheetValues } from '@/lib/google-sheets';
import { sendWhatsAppBatchAlert, BatchAlertItem } from '@/lib/whatsapp';
import { recordAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'Sesi tidak ditemukan atau telah berakhir.' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { tanggal, period_id, transaction_ids } = body;

    if (!tanggal || !transaction_ids || !Array.isArray(transaction_ids) || transaction_ids.length === 0) {
      return NextResponse.json({ error: 'Data batch notifikasi tidak valid.' }, { status: 400 });
    }

    // 1. Fetch TRANSAKSI_SUHU rows
    const rows = await getSheetValues('TRANSAKSI_SUHU!A:AB');
    if (!rows || rows.length <= 1) {
      return NextResponse.json({ error: 'Data transaksi tidak ditemukan.' }, { status: 404 });
    }

    const targetTxIds = new Set(transaction_ids);
    const matchedRows: { rowIndex: number; row: any[] }[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (targetTxIds.has(row[0])) {
        matchedRows.push({ rowIndex: i + 1, row });
      }
    }

    if (matchedRows.length === 0) {
      return NextResponse.json({ error: 'Tidak ada transaksi yang cocok.' }, { status: 404 });
    }

    // 2. Build items for batch message
    const items: BatchAlertItem[] = [];
    let periodLabel = '';
    let maxLimit = 30;
    const firstRow = matchedRows[0].row;
    const warehouseId = firstRow[2] || 'WH-001';
    const warehouseCode = firstRow[3] || 'WH';
    const warehouseName = firstRow[4] || 'Warehouse';

    matchedRows.forEach(({ row }) => {
      // row[8]: location_name, row[10]: period_label, row[11]: suhu, row[12]: max_limit, row[19]: drive_file_id
      const locationName = row[8] || 'Lokasi';
      periodLabel = row[10] || periodLabel;
      const suhu = parseFloat(row[11]) || 0;
      maxLimit = parseFloat(row[12]) || maxLimit;
      const driveFileId = row[19] || '';

      items.push({
        locationName,
        suhu,
        driveFileId
      });
    });

    const appBaseUrl = req.nextUrl?.origin || 'http://localhost:3000';
    const batchNotifId = `WA-BATCH-${Date.now()}`;

    // 3. Dispatch batch alert via Fonnte with warehouse header
    const waResult = await sendWhatsAppBatchAlert({
      notifId: batchNotifId,
      tanggal,
      periodLabel,
      maxLimit,
      items,
      appBaseUrl,
      warehouseCode,
      warehouseName
    });

    // 4. Update status for all matched rows in Google Sheets (Columns W..Z)
    for (const { rowIndex } of matchedRows) {
      const updateRange = `TRANSAKSI_SUHU!W${rowIndex}:Z${rowIndex}`;
      const updateValues = [
        [
          batchNotifId,
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
      action_category: 'TX_CREATE',
      warehouse_id: warehouseId,
      target_reference: batchNotifId,
      after_value: {
        batchNotifId,
        count: items.length,
        transaction_ids,
        warehouseCode,
        wa_status: waResult.status
      },
      notes_or_reason: `Pengiriman notifikasi batch WA (${items.length} lokasi overlimit di ${warehouseCode}, status: ${waResult.status})`
    });

    return NextResponse.json({
      success: true,
      batch_notif_id: batchNotifId,
      status: waResult.status,
      count: items.length,
      error_message: waResult.errorMessage
    });
  } catch (error: any) {
    console.error('Error in POST /api/notifications/summary:', error);
    return NextResponse.json(
      { error: 'Gagal mengirim ringkasan notifikasi WA: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
