import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { batchGetSheetValues } from '@/lib/google-sheets';
import { recordAuditLog } from '@/lib/audit';
import * as XLSX from 'xlsx';

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
 * GET /api/admin/backup
 * Mengunduh cadangan lengkap seluruh database Google Sheets (8 sheet) (FR-025).
 * Mendukung format:
 * - ?format=json (default): Snapshot JSON terstruktur untuk restore.
 * - ?format=xlsx: Workbook spreadsheet multi-sheet untuk arsip offline.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized: Akses cadangan database hanya diizinkan untuk Administrator.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const format = (searchParams.get('format') || 'json').toLowerCase();

    // Baca seluruh 8 sheet sekaligus via batchGet
    const ranges = SHEET_NAMES.map((name) => `${name}!A:Z`);
    const batchResults = await batchGetSheetValues(ranges);

    const sheetsData: Record<string, any[][]> = {};
    batchResults.forEach((item, idx) => {
      const sheetName = SHEET_NAMES[idx];
      sheetsData[sheetName] = item.values || [];
    });

    const now = new Date();
    const dateStamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);

    if (format === 'xlsx') {
      const wb = XLSX.utils.book_new();

      SHEET_NAMES.forEach((name) => {
        const rows = sheetsData[name] || [];
        const ws = XLSX.utils.aoa_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, name);
      });

      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      // Audit Log
      await recordAuditLog({
        actor_user_id: session.user_id,
        actor_username: session.username,
        actor_role: session.role,
        action_category: 'DATA_BACKUP',
        target_reference: 'ALL_SHEETS_XLSX',
        notes_or_reason: `Admin mengunduh ekspor lengkap seluruh sheet dalam format Excel (.xlsx)`
      });

      return new Response(buf, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="Backup_Database_Suhu_${dateStamp}.xlsx"`
        }
      });
    }

    // Default JSON Snapshot
    const backupPayload = {
      backup_version: '1.0',
      app: 'Warehouse Temperature Report',
      created_at: now.toISOString(),
      exported_by: session.username,
      total_sheets: SHEET_NAMES.length,
      sheets: sheetsData
    };

    // Audit Log
    await recordAuditLog({
      actor_user_id: session.user_id,
      actor_username: session.username,
      actor_role: session.role,
      action_category: 'DATA_BACKUP',
      target_reference: 'ALL_SHEETS_JSON',
      notes_or_reason: `Admin mengunduh cadangan snapshot sistem lengkap format JSON`
    });

    return new Response(JSON.stringify(backupPayload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="Backup_Database_Suhu_${dateStamp}.json"`
      }
    });
  } catch (error: any) {
    console.error('Error generating backup:', error);
    return NextResponse.json(
      { error: error?.message || 'Gagal menghasilkan berkas cadangan database.' },
      { status: 500 }
    );
  }
}
