import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getSheetValues, updateSheetValues } from '@/lib/google-sheets';
import { sendWhatsAppAlert } from '@/lib/whatsapp';
import { recordAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 1. Authorization: Only ADMIN can retry WhatsApp notifications (PRD 12 & 14.3)
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'Sesi tidak ditemukan atau telah berakhir.' }, { status: 401 });
    }
    if (session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak. Fitur ini hanya untuk Admin.' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { transaction_id } = body;

    if (!transaction_id) {
      return NextResponse.json({ error: 'transaction_id wajib disertakan.' }, { status: 400 });
    }

    // 2. Fetch TRANSAKSI_SUHU to locate transaction
    const rows = await getSheetValues('TRANSAKSI_SUHU!A:AB');
    if (!rows || rows.length <= 1) {
      return NextResponse.json({ error: 'Data transaksi tidak ditemukan.' }, { status: 404 });
    }

    let targetRowIndex = -1;
    let targetRow: any[] | null = null;

    // Search row by transaction_id (Col A, index 0)
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === transaction_id) {
        targetRowIndex = i + 1; // 1-based row index for Google Sheets A1 notation
        targetRow = rows[i];
        break;
      }
    }

    if (!targetRow || targetRowIndex === -1) {
      return NextResponse.json({ error: 'Transaksi tidak ditemukan di database.' }, { status: 404 });
    }

    // Column Mapping per PRD 10.7:
    // A: transaction_id (0)
    // C: warehouse_id (2)
    // D: warehouse_code (3)
    // E: warehouse_name (4)
    // F: tanggal (5)
    // I: location_name_snapshot (8)
    // K: period_label_snapshot (10)
    // L: suhu (11)
    // M: max_limit_snapshot (12)
    // T: drive_file_id (19)
    // W: wa_notif_id (22)
    // X: wa_notif_status (23)
    // Y: wa_error_message (24)
    // Z: wa_sent_at (25)

    const currentWaStatus = targetRow[23] || 'NOT_REQUIRED';
    const oldErrorMessage = targetRow[24] || '';

    // 3. Idempotency Check: if already SENT, do not resend (PRD 13.4)
    if (currentWaStatus === 'SENT') {
      return NextResponse.json(
        {
          success: true,
          message: 'Notifikasi WhatsApp untuk transaksi ini sudah terkirim sebelumnya (SENT).',
          wa_notif_status: 'SENT'
        },
        { status: 200 }
      );
    }

    const warehouseId = targetRow[2] || 'WH-001';
    const warehouseCode = targetRow[3] || 'CK01';
    const warehouseName = targetRow[4] || 'Cikupa 1';
    const tanggal = targetRow[5];
    const locationName = targetRow[8];
    const periodLabel = targetRow[10];
    const suhu = parseFloat(targetRow[11]) || 0;
    const maxLimit = parseFloat(targetRow[12]) || 30;
    const driveFileId = targetRow[19];
    const notifId = targetRow[22] || `WA-${transaction_id}`;

    const appBaseUrl = req.nextUrl?.origin || 'http://localhost:3000';

    // 4. Send alert via Fonnte
    const waResult = await sendWhatsAppAlert({
      notifId,
      tanggal,
      locationName,
      periodLabel,
      suhu,
      maxLimit,
      driveFileId,
      appBaseUrl,
      warehouseCode,
      warehouseName
    });

    // 5. Update Sheet columns W..Z in TRANSAKSI_SUHU
    const updateRange = `TRANSAKSI_SUHU!W${targetRowIndex}:Z${targetRowIndex}`;
    const updateValues = [
      [
        notifId,
        waResult.status,
        waResult.errorMessage || '',
        waResult.sentAt || ''
      ]
    ];
    await updateSheetValues(updateRange, updateValues, 'RAW');

    // 6. Record Audit Log for retry action
    await recordAuditLog({
      actor_user_id: session.user_id,
      actor_username: session.username,
      actor_role: session.role,
      action_category: 'WA_RETRY',
      warehouse_id: warehouseId,
      target_reference: transaction_id,
      before_value: {
        wa_notif_status: currentWaStatus,
        wa_error_message: oldErrorMessage
      },
      after_value: {
        wa_notif_status: waResult.status,
        wa_error_message: waResult.errorMessage,
        wa_sent_at: waResult.sentAt
      },
      notes_or_reason: `Kirim ulang notifikasi WhatsApp (Status akhir: ${waResult.status})`
    });

    if (waResult.status === 'SENT') {
      return NextResponse.json({
        success: true,
        message: 'Notifikasi WhatsApp berhasil dikirim ulang ke grup.',
        wa_notif_status: 'SENT',
        sent_at: waResult.sentAt
      });
    } else {
      return NextResponse.json({
        success: false,
        message: `Gagal mengirim ulang WhatsApp: ${waResult.errorMessage || 'Layanan Fonnte tidak merespons.'}`,
        wa_notif_status: 'FAILED',
        error_message: waResult.errorMessage
      }, { status: 502 });
    }
  } catch (error: any) {
    console.error('Error in POST /api/notifications/retry:', error);
    return NextResponse.json(
      { error: 'Gagal memproses pengiriman ulang: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
