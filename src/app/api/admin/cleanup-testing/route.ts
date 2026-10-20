import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getSheetValues, clearSheetRange } from '@/lib/google-sheets';
import { deleteFileFromDrive } from '@/lib/google-drive';
import { recordAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/cleanup-testing
 * Membersihkan data transaksi uji coba di TRANSAKSI_SUHU dan foto di Drive (FR-026).
 * Seluruh data master (Akun, Warehouse, Lokasi, Jadwal, Settings) tetap aman & utuh.
 * Dilindungi konfirmasi wajib teks "RESET" dan role Administrator.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized: Pembersihan data sistem hanya diizinkan untuk Administrator.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const confirmation = (body?.confirmation || '').trim();
    const clearPhotos = Boolean(body?.clear_photos);
    const reason = (body?.reason || '').trim();

    if (confirmation !== 'RESET') {
      return NextResponse.json(
        { error: 'Konfirmasi tidak valid. Harap ketik "RESET" dengan huruf kapital untuk menyetujui pembersihan.' },
        { status: 400 }
      );
    }

    // Ambil data transaksi yang ada saat ini
    const rows = await getSheetValues('TRANSAKSI_SUHU!A:Z');
    if (!rows || rows.length <= 1) {
      return NextResponse.json({
        success: true,
        message: 'Sheet TRANSAKSI_SUHU sudah bersih, tidak ada transaksi yang perlu dibersihkan.',
        rows_cleared: 0,
        photos_cleared: 0
      });
    }

    const dataRows = rows.slice(1);
    const rowsCleared = dataRows.length;
    let photosCleared = 0;

    // Bersihkan file fisik di Google Drive jika diminta
    if (clearPhotos) {
      const header = rows[0];
      const driveFileIdIdx = header.indexOf('drive_file_id');
      if (driveFileIdIdx !== -1) {
        const fileIds = dataRows.map((r) => r[driveFileIdIdx]).filter(Boolean);
        for (const fId of fileIds) {
          try {
            const ok = await deleteFileFromDrive(fId);
            if (ok) photosCleared++;
          } catch (err) {
            console.warn(`Non-fatal: Gagal menghapus foto Drive ${fId}:`, err);
          }
        }
      }
    }

    // Kosongkan baris data di TRANSAKSI_SUHU (baris 1 header tetap dipertahankan)
    await clearSheetRange('TRANSAKSI_SUHU!A2:Z');

    // Catat Jejak Audit Permanen
    await recordAuditLog({
      actor_user_id: session.user_id,
      actor_username: session.username,
      actor_role: session.role,
      action_category: 'DATA_CLEANUP',
      target_reference: 'TRANSAKSI_SUHU',
      notes_or_reason: reason || `Pembersihan data sampah testing (${rowsCleared} transaksi, ${photosCleared} foto di Google Drive dibersihkan)`
    });

    return NextResponse.json({
      success: true,
      message: `Pembersihan berhasil. Sebanyak ${rowsCleared} baris transaksi testing dan ${photosCleared} foto bukti telah dibersihkan. Seluruh akun dan master data tetap aman.`,
      rows_cleared: rowsCleared,
      photos_cleared: photosCleared
    });
  } catch (error: any) {
    console.error('Error in cleanup-testing:', error);
    return NextResponse.json(
      { error: error?.message || 'Terjadi kesalahan sistem saat membersihkan data testing.' },
      { status: 500 }
    );
  }
}
