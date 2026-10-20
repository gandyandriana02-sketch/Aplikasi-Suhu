import { NextRequest, NextResponse } from 'next/server';
import {
  getSpreadsheetMetadata,
  batchUpdateSpreadsheet,
  getSheetValues,
  updateSheetValues
} from '@/lib/google-sheets';
import { hashPassword } from '@/lib/auth';
import { formatJakartaISO } from '@/lib/time';
import { recordAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const EXPECTED_SHEETS = [
  'USERS',
  'MASTER_WAREHOUSE',
  'USER_WAREHOUSE_ACCESS',
  'MASTER_LOKASI',
  'MASTER_PERIODE',
  'SETTINGS',
  'TRANSAKSI_SUHU',
  'AUDIT_LOGS'
];

export async function POST(req: NextRequest) {
  try {
    const setupKeyHeader = req.headers.get('x-setup-key');
    const expectedSetupKey = process.env.SETUP_KEY;

    if (!expectedSetupKey || !setupKeyHeader || setupKeyHeader !== expectedSetupKey) {
      return NextResponse.json(
        { error: 'Akses inisialisasi tidak diizinkan.' },
        { status: 403 }
      );
    }

    // Step 1: Check metadata
    const metadata = await getSpreadsheetMetadata();
    const existingSheets: string[] = (metadata.sheets || []).map(
      (s: any) => s.properties.title
    );

    // Step 2: Check if already initialized (FR-001 permanent lock)
    if (existingSheets.includes('USERS')) {
      try {
        const users = await getSheetValues('USERS!A2:E');
        const adminExists = users.some(row => row[1] === 'admin');
        if (adminExists) {
          return NextResponse.json(
            { error: 'Database sudah diinisialisasi.' },
            { status: 400 }
          );
        }
      } catch {
        // If sheet is empty or error reading, proceed with initialization
      }
    }

    // Step 3: Create missing sheets
    const sheetsToCreate = EXPECTED_SHEETS.filter(s => !existingSheets.includes(s));
    if (sheetsToCreate.length > 0) {
      const addSheetRequests = sheetsToCreate.map(title => ({
        addSheet: { properties: { title } }
      }));
      await batchUpdateSpreadsheet(addSheetRequests);
    }

    const nowISO = formatJakartaISO();

    // Step 4: Write headers and initial data
    // 4.1 USERS
    const usersHeader = [
      'user_id',
      'username',
      'password_hash',
      'full_name',
      'role',
      'is_active',
      'created_at',
      'updated_at',
      'updated_by',
      'default_warehouse_id'
    ];
    const initialAdminHash = await hashPassword('admin123');
    const initialAdminRow = [
      'USR-001',
      'admin',
      initialAdminHash,
      'Administrator Gudang',
      'ADMIN',
      'TRUE',
      nowISO,
      nowISO,
      'SYSTEM',
      'WH-001'
    ];
    await updateSheetValues('USERS!A1:J2', [usersHeader, initialAdminRow], 'RAW');

    // 4.2 MASTER_WAREHOUSE
    const whHeader = [
      'warehouse_id',
      'warehouse_code',
      'warehouse_name',
      'is_active',
      'created_at',
      'updated_at',
      'updated_by'
    ];
    const initialWhRows = [
      ['WH-001', 'CK01', 'Cikupa 1', 'TRUE', nowISO, nowISO, 'SYSTEM'],
      ['WH-002', 'CK02', 'Cikupa Annex', 'TRUE', nowISO, nowISO, 'SYSTEM']
    ];
    await updateSheetValues('MASTER_WAREHOUSE!A1:G3', [whHeader, ...initialWhRows], 'RAW');

    // 4.3 USER_WAREHOUSE_ACCESS
    const uwaHeader = [
      'access_id',
      'user_id',
      'warehouse_id',
      'is_active',
      'created_at',
      'updated_at',
      'updated_by'
    ];
    const initialUwaRows = [
      ['UWA-001', 'USR-001', 'WH-001', 'TRUE', nowISO, nowISO, 'SYSTEM'],
      ['UWA-002', 'USR-001', 'WH-002', 'TRUE', nowISO, nowISO, 'SYSTEM']
    ];
    await updateSheetValues('USER_WAREHOUSE_ACCESS!A1:G3', [uwaHeader, ...initialUwaRows], 'RAW');

    // 4.4 MASTER_LOKASI
    const lokasiHeader = [
      'location_id',
      'warehouse_id',
      'location_name',
      'sort_order',
      'is_active',
      'created_at',
      'updated_at',
      'updated_by'
    ];
    const initialLokasiRows = [
      ['LOC-001', 'WH-001', 'Inbound', 1, 'TRUE', nowISO, nowISO, 'SYSTEM'],
      ['LOC-002', 'WH-001', 'A04', 2, 'TRUE', nowISO, nowISO, 'SYSTEM'],
      ['LOC-003', 'WH-001', 'D05', 3, 'TRUE', nowISO, nowISO, 'SYSTEM'],
      ['LOC-004', 'WH-002', 'Inbound', 1, 'TRUE', nowISO, nowISO, 'SYSTEM'],
      ['LOC-005', 'WH-002', 'Annex A', 2, 'TRUE', nowISO, nowISO, 'SYSTEM'],
      ['LOC-006', 'WH-002', 'Annex B', 3, 'TRUE', nowISO, nowISO, 'SYSTEM']
    ];
    await updateSheetValues('MASTER_LOKASI!A1:H7', [lokasiHeader, ...initialLokasiRows], 'RAW');

    // 4.5 MASTER_PERIODE
    const periodeHeader = [
      'period_id',
      'warehouse_id',
      'period_label',
      'sort_order',
      'is_active',
      'created_at',
      'updated_at',
      'updated_by'
    ];
    const initialPeriodeRows = [
      ['PRD-001', 'WH-001', '09.00', 1, 'TRUE', nowISO, nowISO, 'SYSTEM'],
      ['PRD-002', 'WH-001', '13.00', 2, 'TRUE', nowISO, nowISO, 'SYSTEM'],
      ['PRD-003', 'WH-001', '17.00', 3, 'TRUE', nowISO, nowISO, 'SYSTEM'],
      ['PRD-004', 'WH-002', '09.00', 1, 'TRUE', nowISO, nowISO, 'SYSTEM'],
      ['PRD-005', 'WH-002', '13.00', 2, 'TRUE', nowISO, nowISO, 'SYSTEM'],
      ['PRD-006', 'WH-002', '17.00', 3, 'TRUE', nowISO, nowISO, 'SYSTEM']
    ];
    await updateSheetValues('MASTER_PERIODE!A1:H7', [periodeHeader, ...initialPeriodeRows], 'RAW');

    // 4.6 SETTINGS
    const settingsHeader = [
      'warehouse_id',
      'setting_key',
      'setting_value',
      'description',
      'updated_by',
      'updated_at'
    ];
    const initialSettingsRows = [
      ['GLOBAL', 'app_name', 'Warehouse Temperature Report', 'Nama aplikasi pada header dan cetakan laporan', 'SYSTEM', nowISO],
      ['WH-001', 'max_temp_limit', '30', 'Batas suhu maksimal aktif CK01 dalam °C', 'SYSTEM', nowISO],
      ['WH-001', 'lock_sunday', 'TRUE', 'Kunci input otomatis pada hari Minggu bagi Member di CK01', 'SYSTEM', nowISO],
      ['WH-001', 'holiday_dates', '[]', 'JSON Array tanggal libur CK01', 'SYSTEM', nowISO],
      ['WH-001', 'unlocked_dates', '[]', 'JSON Array tanggal buka khusus CK01', 'SYSTEM', nowISO],
      ['WH-001', 'wa_notification_enabled', 'TRUE', 'Saklar peringatan WhatsApp CK01', 'SYSTEM', nowISO],
      ['WH-002', 'max_temp_limit', '30', 'Batas suhu maksimal aktif CK02 dalam °C', 'SYSTEM', nowISO],
      ['WH-002', 'lock_sunday', 'TRUE', 'Kunci input otomatis pada hari Minggu bagi Member di CK02', 'SYSTEM', nowISO],
      ['WH-002', 'holiday_dates', '[]', 'JSON Array tanggal libur CK02', 'SYSTEM', nowISO],
      ['WH-002', 'unlocked_dates', '[]', 'JSON Array tanggal buka khusus CK02', 'SYSTEM', nowISO],
      ['WH-002', 'wa_notification_enabled', 'TRUE', 'Saklar peringatan WhatsApp CK02', 'SYSTEM', nowISO]
    ];
    await updateSheetValues('SETTINGS!A1:F12', [settingsHeader, ...initialSettingsRows], 'RAW');

    // 4.7 TRANSAKSI_SUHU
    const transaksiHeader = [
      'transaction_id',
      'idempotency_key',
      'warehouse_id',
      'warehouse_code_snapshot',
      'warehouse_name_snapshot',
      'tanggal',
      'tahun_bulan',
      'location_id',
      'location_name_snapshot',
      'period_id',
      'period_label_snapshot',
      'suhu',
      'max_limit_snapshot',
      'status_suhu',
      'user_id',
      'petugas_name',
      'client_captured_at',
      'server_received_at',
      'gps_coordinates',
      'drive_file_id',
      'drive_file_name',
      'drive_view_url',
      'wa_notif_id',
      'wa_notif_status',
      'wa_error_message',
      'wa_sent_at',
      'updated_by',
      'updated_at'
    ];
    await updateSheetValues('TRANSAKSI_SUHU!A1:AB1', [transaksiHeader], 'RAW');

    // 4.8 AUDIT_LOGS
    const auditHeader = [
      'log_id',
      'server_timestamp',
      'actor_user_id',
      'actor_username',
      'actor_role',
      'action_category',
      'warehouse_id',
      'target_reference',
      'before_value',
      'after_value',
      'notes_or_reason'
    ];
    await updateSheetValues('AUDIT_LOGS!A1:K1', [auditHeader], 'RAW');

    // Record system init in audit logs
    await recordAuditLog({
      actor_user_id: 'SYSTEM',
      actor_username: 'SYSTEM',
      actor_role: 'ADMIN',
      action_category: 'SETTING_CHANGE',
      warehouse_id: 'GLOBAL',
      target_reference: 'DATABASE_INIT',
      notes_or_reason: 'Inisialisasi 8 sheet database berhasil dilakukan.'
    });

    await recordAuditLog({
      actor_user_id: 'SYSTEM',
      actor_username: 'SYSTEM',
      actor_role: 'ADMIN',
      action_category: 'MASTER_MGMT',
      warehouse_id: 'WH-001',
      target_reference: 'INIT_WAREHOUSE_MASTER',
      after_value: { warehouse_code: 'CK01', warehouse_name: 'Cikupa 1' },
      notes_or_reason: 'Inisialisasi master data warehouse perdana (Cikupa 1).'
    });

    return NextResponse.json({
      success: true,
      message: 'Inisialisasi sistem berhasil. Mohon segera hapus SETUP_KEY dari Vercel Environment Variables.'
    });
  } catch (error: any) {
    console.error('Error in /api/init:', error);
    return NextResponse.json(
      { error: 'Gagal inisialisasi database: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
