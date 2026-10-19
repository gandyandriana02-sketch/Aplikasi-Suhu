import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, canAccessWarehouse } from '@/lib/auth';
import { batchGetSheetValues } from '@/lib/google-sheets';
import { getTodayDateStringJakarta } from '@/lib/time';
import { parseWarehouseSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'Sesi tidak ditemukan atau telah kedaluwarsa.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const todayJakarta = getTodayDateStringJakarta();
    const queryTanggal = searchParams.get('tanggal') || todayJakarta;
    const warehouseId = searchParams.get('warehouse_id') || session.active_warehouse_id || 'WH-001';

    // Validate tanggal format YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(queryTanggal)) {
      return NextResponse.json({ error: 'Format tanggal tidak valid. Gunakan YYYY-MM-DD.' }, { status: 400 });
    }

    // Backend access validation (BR-10 & TS-10)
    if (!canAccessWarehouse(session, warehouseId)) {
      return NextResponse.json({ error: 'Akses ke warehouse ini ditolak.' }, { status: 403 });
    }

    // Single batch read to respect Google Sheets quota (PRD 21.2)
    const ranges = [
      'MASTER_WAREHOUSE!A2:G',
      'MASTER_LOKASI!A2:H',
      'MASTER_PERIODE!A2:H',
      'SETTINGS!A2:F',
      'TRANSAKSI_SUHU!A2:AB',
      'USERS!A2:J'
    ];

    const batchResults = await batchGetSheetValues(ranges);
    const whRows = batchResults[0]?.values || [];
    const lokasiRows = batchResults[1]?.values || [];
    const periodeRows = batchResults[2]?.values || [];
    const settingsRows = batchResults[3]?.values || [];
    const transaksiRows = batchResults[4]?.values || [];
    const userRows = batchResults[5]?.values || [];

    // Synchronize live full_name from database
    const dbUser = userRows.find(u => u[0] === session.user_id);
    if (dbUser && dbUser[3]) {
      session.full_name = dbUser[3];
      if (dbUser[4]) session.role = dbUser[4] as 'ADMIN' | 'MEMBER';
    }

    // Parse active warehouse info
    const currentWhRow = whRows.find(r => r[0] === warehouseId);
    const currentWarehouse = currentWhRow ? {
      warehouse_id: currentWhRow[0],
      warehouse_code: currentWhRow[1],
      warehouse_name: currentWhRow[2]
    } : {
      warehouse_id: warehouseId,
      warehouse_code: 'CK01',
      warehouse_name: 'Cikupa 1'
    };

    // Parse active locations for this warehouse (r[1] = warehouse_id, r[4] = is_active)
    const locations = lokasiRows
      .filter(r => r[1] === warehouseId && r[4] === 'TRUE')
      .map(r => ({
        location_id: r[0],
        warehouse_id: r[1],
        location_name: r[2],
        sort_order: parseInt(r[3] || '0', 10)
      }))
      .sort((a, b) => a.sort_order - b.sort_order);

    // Parse active periods for this warehouse (r[1] = warehouse_id, r[4] = is_active)
    const periods = periodeRows
      .filter(r => r[1] === warehouseId && r[4] === 'TRUE')
      .map(r => ({
        period_id: r[0],
        warehouse_id: r[1],
        period_label: r[2],
        sort_order: parseInt(r[3] || '0', 10)
      }))
      .sort((a, b) => a.sort_order - b.sort_order);

    // Parse settings per warehouse with strict hierarchical resolution
    const whSettings = parseWarehouseSettings(settingsRows, warehouseId);
    const maxTempLimit = whSettings.max_temp_limit;
    const lockSunday = whSettings.lock_sunday;
    const holidayDates = whSettings.holiday_dates;
    const unlockedDates = whSettings.unlocked_dates;

    // Determine Date Lock Status (FR-006 & FR-007)
    let isDateLocked = false;
    let lockReason = '';

    if (session.role === 'MEMBER') {
      if (unlockedDates.includes(queryTanggal)) {
        isDateLocked = false;
      } else if (queryTanggal !== todayJakarta) {
        isDateLocked = true;
        lockReason = 'Member hanya dapat menginput data pada tanggal hari ini.';
      } else {
        const queryDateObj = new Date(`${queryTanggal}T00:00:00+07:00`);
        const dayOfWeek = queryDateObj.getDay(); // 0 is Sunday

        if (lockSunday && dayOfWeek === 0) {
          isDateLocked = true;
          lockReason = 'Input hari ini ditutup. Hubungi Admin untuk membukanya.';
        } else if (holidayDates.includes(queryTanggal)) {
          isDateLocked = true;
          lockReason = 'Input pada tanggal libur dikunci. Hubungi Admin untuk membukanya.';
        }
      }
    }

    // Filter transactions for this date AND warehouse
    // Schema: 0: tx_id, 1: idem_key, 2: wh_id, 3: wh_code, 4: wh_name, 5: tanggal, 6: thn_bln,
    //         7: loc_id, 8: loc_name, 9: prd_id, 10: prd_lbl, 11: suhu, 12: max_lim,
    //         13: status_suhu, 14: user_id, 15: petugas_name, 16: client_captured_at,
    //         17: server_received_at, 18: gps_coords, 19: drive_file_id, 20: drive_file_name,
    //         21: drive_view_url, 22: wa_notif_id, 23: wa_notif_status, 24: wa_error_message,
    //         25: wa_sent_at, 26: updated_by, 27: updated_at
    const transactions = transaksiRows
      .filter(r => r[2] === warehouseId && r[5] === queryTanggal)
      .map(r => ({
        transaction_id: r[0],
        warehouse_id: r[2],
        warehouse_code: r[3] || '',
        warehouse_name: r[4] || '',
        tanggal: r[5],
        location_id: r[7],
        location_name: r[8],
        period_id: r[9],
        period_label: r[10],
        suhu: parseFloat(r[11] || '0'),
        status_suhu: (r[13] || 'NORMAL') as 'NORMAL' | 'MELEBIHI_BATAS',
        petugas_name: r[15] || '',
        drive_file_id: r[19] || '',
        drive_view_url: r[21] || '',
        wa_notif_status: r[23] || 'NOT_REQUIRED',
        wa_error_message: r[24] || '',
        server_received_at: r[17] || ''
      }));

    return NextResponse.json({
      tanggal: queryTanggal,
      today: todayJakarta,
      user: {
        user_id: session.user_id,
        username: session.username,
        full_name: session.full_name,
        role: session.role
      },
      active_warehouse: currentWarehouse,
      locations,
      periods,
      max_temp_limit: maxTempLimit,
      is_date_locked: isDateLocked,
      lock_reason: lockReason,
      transactions
    });
  } catch (error: any) {
    console.error('Error GET /api/form-context:', error);
    return NextResponse.json({ error: error.message || 'Gagal mengambil data form konteks.' }, { status: 500 });
  }
}
