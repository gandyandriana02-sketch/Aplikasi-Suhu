import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { clearSheetRange, appendSheetValues } from '@/lib/google-sheets';
import { recordAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const SHEET_NAMES = [
  'USERS',
  'MASTER_WAREHOUSE',
  'USER_WAREHOUSE_ACCESS',
  'MASTER_LOKASI',
  'MASTER_PERIODE',
  'SETTINGS',
  'TRANSAKSI_SUHU',
  'AUDIT_LOGS'
];

/**
 * POST /api/admin/restore
 * Memulihkan data Google Sheets dari berkas snapshot JSON yang diunggah (FR-025).
 * Hanya dapat dieksekusi oleh Administrator.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized: Pemulihan database hanya diizinkan untuk Administrator.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const sheetsData: Record<string, any[][]> = body?.sheets || (body?.backup_data ? body.backup_data.sheets : null);

    if (!sheetsData || typeof sheetsData !== 'object') {
      return NextResponse.json(
        { error: 'Format berkas cadangan tidak valid. Objek sheets tidak ditemukan.' },
        { status: 400 }
      );
    }

    const restoredSheets: string[] = [];

    // Iterasi setiap sheet yang didukung
    for (const sheetName of SHEET_NAMES) {
      if (!Array.isArray(sheetsData[sheetName])) continue;

      const rows = sheetsData[sheetName];
      // Bersihkan data lama mulai baris 2 (mempertahankan baris 1 header skema)
      await clearSheetRange(`${sheetName}!A2:Z`);

      // Jika ada data selain header (baris index 1 ke atas)
      if (rows.length > 1) {
        const dataRows = rows.slice(1);
        await appendSheetValues(`${sheetName}!A2`, dataRows, 'RAW');
      }

      restoredSheets.push(sheetName);
    }

    if (restoredSheets.length === 0) {
      return NextResponse.json(
        { error: 'Tidak ada sheet yang cocok dengan skema database aplikasi.' },
        { status: 400 }
      );
    }

    // Rekam Jejak Audit
    await recordAuditLog({
      actor_user_id: session.user_id,
      actor_username: session.username,
      actor_role: session.role,
      action_category: 'DATA_RESTORE',
      target_reference: 'DATABASE_FULL_RESTORE',
      notes_or_reason: body.reason || `Pemulihan ${restoredSheets.length} sheet dari berkas cadangan JSON`
    });

    return NextResponse.json({
      success: true,
      message: `Database berhasil dipulihkan (${restoredSheets.length} sheet diperbarui).`,
      restored_sheets: restoredSheets
    });
  } catch (error: any) {
    console.error('Error restoring database:', error);
    return NextResponse.json(
      { error: error?.message || 'Terjadi kesalahan sistem saat memulihkan database.' },
      { status: 500 }
    );
  }
}
