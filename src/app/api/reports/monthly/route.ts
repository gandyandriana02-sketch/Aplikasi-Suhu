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
      return NextResponse.json({ error: 'Sesi tidak ditemukan atau telah berakhir.' }, { status: 401 });
    }

    // Role Enforcement: Rekap bulanan is restricted to Administrator (PRD Section 12 & BR-10)
    if (session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Akses ditolak. Rekap bulanan hanya dapat diakses oleh Administrator.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const todayJakarta = getTodayDateStringJakarta(); // YYYY-MM-DD
    const defaultYear = parseInt(todayJakarta.slice(0, 4), 10);
    const defaultMonth = parseInt(todayJakarta.slice(5, 7), 10);

    const year = parseInt(searchParams.get('year') || String(defaultYear), 10);
    const month = parseInt(searchParams.get('month') || String(defaultMonth), 10);
    const warehouseId = searchParams.get('warehouse_id') || session.active_warehouse_id || 'WH-001';

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return NextResponse.json({ error: 'Parameter tahun atau bulan tidak valid.' }, { status: 400 });
    }

    // Access control check (BR-10)
    if (!canAccessWarehouse(session, warehouseId)) {
      return NextResponse.json({ error: 'Akses ke warehouse ini ditolak.' }, { status: 403 });
    }

    const tahunBulan = `${year}-${String(month).padStart(2, '0')}`;

    // 1. Fetch data from Google Sheets in a single batch
    const ranges = [
      'MASTER_WAREHOUSE!A2:G',
      'MASTER_LOKASI!A2:H',
      'MASTER_PERIODE!A2:H',
      'SETTINGS!A2:F',
      'TRANSAKSI_SUHU!A2:AB'
    ];

    const valueRanges = await batchGetSheetValues(ranges);

    const whRows = valueRanges[0]?.values || [];
    const lokasiRows = valueRanges[1]?.values || [];
    const periodeRows = valueRanges[2]?.values || [];
    const settingsRows = valueRanges[3]?.values || [];
    const transaksiRows = valueRanges[4]?.values || [];

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

    // 2. Parse Settings for this warehouse with strict hierarchical resolution
    const whSettings = parseWarehouseSettings(settingsRows, warehouseId);
    const maxTempLimit = whSettings.max_temp_limit;
    const signoff_maker_title = whSettings.signoff_maker_title;
    const signoff_maker_name = whSettings.signoff_maker_name;
    const signoff_checker_title = whSettings.signoff_checker_title;
    const signoff_checker_name = whSettings.signoff_checker_name;
    const signoff_approver_title = whSettings.signoff_approver_title;
    const signoff_approver_name = whSettings.signoff_approver_name;

    // 3. Filter transactions for the requested warehouse & year & month
    // Col G (index 6) is tahun_bulan, Col C (index 2) is warehouse_id
    const monthTransactions = transaksiRows
      .filter(r => r[2] === warehouseId && r[6] === tahunBulan)
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
        server_received_at: r[17] || '',
        drive_file_id: r[19] || '',
        drive_view_url: r[21] || '',
        wa_notif_status: r[23] || 'NOT_REQUIRED'
      }));

    // Sets of IDs that appeared in this month's transactions (BR-08)
    const txLocationIds = new Set(monthTransactions.map(t => t.location_id));
    const txPeriodIds = new Set(monthTransactions.map(t => t.period_id));

    // 4. Locations for this warehouse: active OR has transactions this month (BR-08)
    const locations = lokasiRows
      .filter(r => r[1] === warehouseId && (r[4] === 'TRUE' || txLocationIds.has(r[0])))
      .map(r => ({
        location_id: r[0],
        warehouse_id: r[1],
        location_name: r[2],
        sort_order: parseInt(r[3], 10) || 0,
        is_active: r[4] === 'TRUE'
      }))
      .sort((a, b) => a.sort_order - b.sort_order);

    // Periods for this warehouse: active OR has transactions this month (BR-08)
    const periods = periodeRows
      .filter(r => r[1] === warehouseId && (r[4] === 'TRUE' || txPeriodIds.has(r[0])))
      .map(r => ({
        period_id: r[0],
        warehouse_id: r[1],
        period_label: r[2],
        sort_order: parseInt(r[3], 10) || 0,
        is_active: r[4] === 'TRUE'
      }))
      .sort((a, b) => a.sort_order - b.sort_order);

    // 5. Compute calendar metadata (days in month, weekend days)
    const daysInMonth = new Date(year, month, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const dayNum = i + 1;
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      const d = new Date(`${dateStr}T00:00:00+07:00`);
      const dayOfWeek = d.getDay(); // 0 is Sunday, 6 is Saturday
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      return {
        day: dayNum,
        date: dateStr,
        dayOfWeek,
        isWeekend
      };
    });

    // Parse active warehouses
    const activeWarehouses = whRows
      .filter(r => r[3] === 'TRUE')
      .map(r => ({
        warehouse_id: r[0],
        warehouse_code: r[1],
        warehouse_name: r[2]
      }));

    const allowedWarehouses = session.role === 'ADMIN'
      ? activeWarehouses
      : activeWarehouses.filter(w => session.allowed_warehouses?.some(aw => aw.warehouse_id === w.warehouse_id));

    // 6. Build Matrix Data Structure: Grouped by Period (PRD 16.1)
    const matrix = periods.map(prd => {
      const locationRows = locations.map((loc, idx) => {
        const daysCells = days.map(d => {
          const tx = monthTransactions.find(
            t => t.location_id === loc.location_id && t.period_id === prd.period_id && t.tanggal === d.date
          );

          return {
            day: d.day,
            has_data: !!tx,
            suhu: tx ? tx.suhu : undefined,
            status_suhu: tx ? tx.status_suhu : undefined,
            transaction_id: tx ? tx.transaction_id : undefined,
            drive_file_id: tx ? tx.drive_file_id : undefined,
            drive_view_url: tx ? tx.drive_view_url : undefined,
            petugas_name: tx ? tx.petugas_name : undefined,
            server_received_at: tx ? tx.server_received_at : undefined,
            wa_notif_status: tx ? tx.wa_notif_status : undefined
          };
        });

        return {
          row_number: idx + 1,
          location_id: loc.location_id,
          location_name: loc.location_name,
          is_active: loc.is_active,
          days: daysCells
        };
      });

      return {
        period_id: prd.period_id,
        period_label: prd.period_label,
        is_active: prd.is_active,
        locationRows
      };
    });

    // 7. Calculate overall monthly summary statistics
    let totalTx = monthTransactions.length;
    let overlimitTx = monthTransactions.filter(t => t.status_suhu === 'MELEBIHI_BATAS').length;
    let sumSuhu = 0;
    let maxTempItem: { suhu: number; location_name: string; period_label: string; tanggal: string } | null = null;
    let minTempItem: { suhu: number; location_name: string; period_label: string; tanggal: string } | null = null;

    monthTransactions.forEach(t => {
      sumSuhu += t.suhu;
      if (!maxTempItem || t.suhu > maxTempItem.suhu) {
        maxTempItem = { suhu: t.suhu, location_name: t.location_name, period_label: t.period_label, tanggal: t.tanggal };
      }
      if (!minTempItem || t.suhu < minTempItem.suhu) {
        minTempItem = { suhu: t.suhu, location_name: t.location_name, period_label: t.period_label, tanggal: t.tanggal };
      }
    });

    const avgTemp = totalTx > 0 ? parseFloat((sumSuhu / totalTx).toFixed(1)) : null;
    const maxTempNum: number | null = maxTempItem ? (maxTempItem as any).suhu : null;
    const minTempNum: number | null = minTempItem ? (minTempItem as any).suhu : null;

    return NextResponse.json({
      year,
      month,
      tahun_bulan: tahunBulan,
      active_warehouse: currentWarehouse,
      allowed_warehouses: allowedWarehouses,
      daysInMonth,
      weekendDays: days.filter(d => d.isWeekend).map(d => d.day),
      settings: {
        max_temp_limit: maxTempLimit,
        signoff_maker_title,
        signoff_maker_name,
        signoff_checker_title,
        signoff_checker_name,
        signoff_approver_title,
        signoff_approver_name
      },
      days,
      periods,
      locations,
      matrix,
      matrixByPeriod: matrix,
      summary: {
        totalChecks: totalTx,
        overlimitCount: overlimitTx,
        totalTx,
        overlimitTx,
        avgTemp,
        maxTemp: maxTempNum,
        minTemp: minTempNum,
        maxTempItem,
        minTempItem
      },
      allTransactions: monthTransactions,
      transactions: monthTransactions
    });
  } catch (error: any) {
    console.error('Error GET /api/reports/monthly:', error);
    return NextResponse.json(
      { error: 'Gagal memuat rekap bulanan: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
