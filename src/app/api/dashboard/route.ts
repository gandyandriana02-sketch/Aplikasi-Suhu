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

    const { searchParams } = new URL(req.url);
    const queryTanggal = searchParams.get('tanggal') || getTodayDateStringJakarta();
    let queryWhId = searchParams.get('warehouse_id');

    if (!queryWhId) {
      queryWhId = session.role === 'ADMIN' ? 'all' : (session.active_warehouse_id || 'WH-001');
    }

    // Role Member validation (BR-10 & TS-10)
    if (session.role === 'MEMBER') {
      if (queryWhId === 'all') {
        queryWhId = session.active_warehouse_id || 'WH-001';
      }
      if (!canAccessWarehouse(session, queryWhId)) {
        return NextResponse.json({ error: 'Akses ke warehouse ini ditolak.' }, { status: 403 });
      }
    }

    // 1. Fetch Master Data, Settings, Transaksi, & Users via single batchGet
    const ranges = [
      'MASTER_WAREHOUSE!A2:G',
      'MASTER_LOKASI!A2:H',
      'MASTER_PERIODE!A2:H',
      'SETTINGS!A2:F',
      'TRANSAKSI_SUHU!A2:AB',
      'USERS!A2:J'
    ];

    const valueRanges = await batchGetSheetValues(ranges);

    const whRows = valueRanges[0]?.values || [];
    const lokasiRows = valueRanges[1]?.values || [];
    const periodeRows = valueRanges[2]?.values || [];
    const settingsRows = valueRanges[3]?.values || [];
    const transaksiRows = valueRanges[4]?.values || [];
    const userRows = valueRanges[5]?.values || [];

    // Synchronize live full_name from database
    const dbUser = userRows.find(u => u[0] === session.user_id);
    if (dbUser && dbUser[3]) {
      session.full_name = dbUser[3];
      if (dbUser[4]) session.role = dbUser[4] as 'ADMIN' | 'MEMBER';
    }

    // Parse active warehouses
    const activeWarehouses = whRows
      .filter(r => r[3] === 'TRUE')
      .map(r => ({
        warehouse_id: r[0],
        warehouse_code: r[1],
        warehouse_name: r[2]
      }));

    // Filter warehouses accessible to user
    const allowedWarehouses = session.role === 'ADMIN'
      ? activeWarehouses
      : activeWarehouses.filter(w => session.allowed_warehouses?.some(aw => aw.warehouse_id === w.warehouse_id));

    // Determine target warehouse(s) for the current view
    const isConsolidated = queryWhId === 'all' && session.role === 'ADMIN';
    const targetWhIds = isConsolidated
      ? allowedWarehouses.map(w => w.warehouse_id)
      : [queryWhId];

    // Filter transactions for queryTanggal & targetWhIds
    // Schema in TRANSAKSI_SUHU:
    // r[0]: tx_id, r[2]: wh_id, r[3]: wh_code, r[4]: wh_name, r[5]: tanggal,
    // r[7]: loc_id, r[8]: loc_name, r[9]: prd_id, r[10]: prd_label,
    // r[11]: suhu, r[12]: max_limit, r[13]: status_suhu, r[14]: user_id,
    // r[15]: petugas_name, r[17]: server_received_at, r[19]: drive_file_id,
    // r[20]: drive_file_name, r[21]: drive_view_url, r[23]: wa_notif_status,
    // r[24]: wa_error_message, r[25]: wa_sent_at
    const mapTxRow = (r: any[]) => ({
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
      max_limit_snapshot: parseFloat(r[12] || '30'),
      status_suhu: (r[13] || 'NORMAL') as 'NORMAL' | 'MELEBIHI_BATAS',
      user_id: r[14],
      petugas_name: r[15],
      server_received_at: r[17],
      drive_file_id: r[19],
      drive_file_name: r[20],
      drive_view_url: r[21],
      wa_notif_status: r[23] || 'NOT_REQUIRED',
      wa_error_message: r[24] || '',
      wa_sent_at: r[25] || ''
    });

    const dateTransactions = transaksiRows
      .filter(r => r[5] === queryTanggal && targetWhIds.includes(r[2]))
      .map(mapTxRow);

    // Recent activity feed with fallback to latest warehouse transactions if 0 for today
    let recentTransactions = [...dateTransactions].reverse();
    let isHistoricalFallback = false;
    if (recentTransactions.length === 0) {
      const historicalRows = transaksiRows
        .filter(r => r[0] && targetWhIds.includes(r[2]))
        .slice(-10)
        .reverse()
        .map(mapTxRow);
      if (historicalRows.length > 0) {
        recentTransactions = historicalRows;
        isHistoricalFallback = true;
      }
    }

    // Calculate Summary Metrics per Warehouse (Fitur 4)
    const warehousesSummary = allowedWarehouses.map(wh => {
      const whLocations = lokasiRows.filter(r => r[1] === wh.warehouse_id && r[4] === 'TRUE');
      const whPeriods = periodeRows.filter(r => r[1] === wh.warehouse_id && r[4] === 'TRUE');
      const whTx = dateTransactions.filter(t => t.warehouse_id === wh.warehouse_id);

      const totalSlots = whLocations.length * whPeriods.length;
      const filledSlots = whTx.length;
      const unfilledSlots = Math.max(0, totalSlots - filledSlots);
      const overlimitCount = whTx.filter(t => t.status_suhu === 'MELEBIHI_BATAS').length;
      const waFailedCount = whTx.filter(t => t.wa_notif_status === 'FAILED').length;

      let maxTempItem: { suhu: number; location_name: string; period_label: string } | null = null;
      let minTempItem: { suhu: number; location_name: string; period_label: string } | null = null;
      let sumSuhu = 0;

      whTx.forEach(tx => {
        sumSuhu += tx.suhu;
        if (!maxTempItem || tx.suhu > maxTempItem.suhu) {
          maxTempItem = { suhu: tx.suhu, location_name: tx.location_name, period_label: tx.period_label };
        }
        if (!minTempItem || tx.suhu < minTempItem.suhu) {
          minTempItem = { suhu: tx.suhu, location_name: tx.location_name, period_label: tx.period_label };
        }
      });

      const avgTemp = filledSlots > 0 ? parseFloat((sumSuhu / filledSlots).toFixed(1)) : null;

      return {
        warehouse_id: wh.warehouse_id,
        warehouse_code: wh.warehouse_code,
        warehouse_name: wh.warehouse_name,
        totalSlots,
        filledSlots,
        unfilledSlots,
        overlimitCount,
        waFailedCount,
        maxTemp: maxTempItem,
        minTemp: minTempItem,
        avgTemp
      };
    });

    // Consolidated overall totals
    const totalSlots = warehousesSummary
      .filter(w => targetWhIds.includes(w.warehouse_id))
      .reduce((acc, w) => acc + w.totalSlots, 0);
    const filledSlots = dateTransactions.length;
    const unfilledSlots = Math.max(0, totalSlots - filledSlots);
    const overlimitCount = dateTransactions.filter(t => t.status_suhu === 'MELEBIHI_BATAS').length;
    const waFailedCount = dateTransactions.filter(t => t.wa_notif_status === 'FAILED').length;

    let maxTempItem: { suhu: number; location_name: string; period_label: string; warehouse_code?: string } | null = null;
    let minTempItem: { suhu: number; location_name: string; period_label: string; warehouse_code?: string } | null = null;
    let sumSuhu = 0;

    dateTransactions.forEach(tx => {
      sumSuhu += tx.suhu;
      if (!maxTempItem || tx.suhu > maxTempItem.suhu) {
        maxTempItem = {
          suhu: tx.suhu,
          location_name: tx.location_name,
          period_label: tx.period_label,
          warehouse_code: tx.warehouse_code
        };
      }
      if (!minTempItem || tx.suhu < minTempItem.suhu) {
        minTempItem = {
          suhu: tx.suhu,
          location_name: tx.location_name,
          period_label: tx.period_label,
          warehouse_code: tx.warehouse_code
        };
      }
    });

    const avgTemp = filledSlots > 0 ? parseFloat((sumSuhu / filledSlots).toFixed(1)) : null;

    // Build Grid Matrix for single warehouse view
    const displayWhId = isConsolidated ? targetWhIds[0] : queryWhId;
    const activeLocations = lokasiRows
      .filter(r => r[1] === displayWhId && r[4] === 'TRUE')
      .map(r => ({
        location_id: r[0],
        location_name: r[2],
        sort_order: parseInt(r[3], 10) || 0
      }))
      .sort((a, b) => a.sort_order - b.sort_order);

    const activePeriods = periodeRows
      .filter(r => r[1] === displayWhId && r[4] === 'TRUE')
      .map(r => ({
        period_id: r[0],
        period_label: r[2],
        sort_order: parseInt(r[3], 10) || 0
      }))
      .sort((a, b) => a.sort_order - b.sort_order);

    const gridMap: Record<string, Record<string, any>> = {};
    activeLocations.forEach(loc => {
      gridMap[loc.location_id] = {};
      activePeriods.forEach(prd => {
        const match = dateTransactions.find(
          t => t.warehouse_id === displayWhId && t.location_id === loc.location_id && t.period_id === prd.period_id
        );
        gridMap[loc.location_id][prd.period_id] = match || null;
      });
    });

    // Active warehouse metadata
    const activeWhMeta = allowedWarehouses.find(w => w.warehouse_id === displayWhId) || allowedWarehouses[0] || {
      warehouse_id: displayWhId,
      warehouse_code: 'WH',
      warehouse_name: 'Warehouse'
    };

    // Parse settings for display warehouse with strict hierarchical resolution
    const whSettings = parseWarehouseSettings(settingsRows, displayWhId);
    const maxTempLimit = whSettings.max_temp_limit;

    return NextResponse.json({
      tanggal: queryTanggal,
      today: getTodayDateStringJakarta(),
      user: {
        user_id: session.user_id,
        username: session.username,
        full_name: session.full_name,
        role: session.role
      },
      warehouse_id: queryWhId,
      is_consolidated: isConsolidated,
      active_warehouse: activeWhMeta,
      allowed_warehouses: allowedWarehouses,
      warehouses_summary: warehousesSummary,
      settings: {
        max_temp_limit: maxTempLimit,
        wa_notification_enabled: whSettings.wa_notification_enabled,
        app_name: whSettings.app_name
      },
      locations: activeLocations,
      periods: activePeriods,
      gridMap,
      summary: {
        totalSlots,
        filledSlots,
        unfilledSlots,
        overlimitCount,
        waFailedCount,
        maxTemp: maxTempItem,
        minTemp: minTempItem,
        avgTemp
      },
      recentTransactions,
      is_recent_fallback: isHistoricalFallback
    });
  } catch (error: any) {
    console.error('Error in GET /api/dashboard:', error);
    return NextResponse.json(
      { error: 'Gagal memuat data dashboard: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
