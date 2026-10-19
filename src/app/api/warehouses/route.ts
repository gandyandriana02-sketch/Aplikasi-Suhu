import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getSheetValues } from '@/lib/google-sheets';
import { parseWarehouseSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'Sesi tidak ditemukan atau telah kedaluwarsa.' }, { status: 401 });
    }

    const whRows = await getSheetValues('MASTER_WAREHOUSE!A2:G');
    const allWarehouses = whRows
      .filter(r => r[3] === 'TRUE')
      .map(r => ({
        warehouse_id: r[0],
        warehouse_code: r[1],
        warehouse_name: r[2],
        is_active: true
      }));

    const settingsRows = await getSheetValues('SETTINGS!A2:F').catch(() => []);
    const globalSettings = parseWarehouseSettings(settingsRows);
    const app_name = globalSettings.app_name;
    const app_icon = globalSettings.app_icon;

    if (session.role === 'ADMIN') {
      return NextResponse.json({
        warehouses: allWarehouses,
        active_warehouse_id: session.active_warehouse_id || allWarehouses[0]?.warehouse_id,
        app_name,
        app_icon
      });
    }

    // For Member, filter by USER_WAREHOUSE_ACCESS
    const uwaRows = await getSheetValues('USER_WAREHOUSE_ACCESS!A2:G');
    const allowedSet = new Set(
      uwaRows
        .filter(r => r[1] === session.user_id && r[3] === 'TRUE')
        .map(r => r[2])
    );

    const memberWarehouses = allWarehouses.filter(w => allowedSet.has(w.warehouse_id));

    return NextResponse.json({
      warehouses: memberWarehouses,
      active_warehouse_id: session.active_warehouse_id || memberWarehouses[0]?.warehouse_id,
      app_name,
      app_icon
    });
  } catch (error: any) {
    console.error('Error GET /api/warehouses:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
