import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getSheetValues } from '@/lib/google-sheets';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session) {
    return NextResponse.json(
      { error: 'Belum login atau sesi telah berakhir.' },
      { status: 401 }
    );
  }

  // Refresh user data & warehouse permissions directly from USERS & ACCESS sheets
  try {
    const [userRows, whRows, uwaRows] = await Promise.all([
      getSheetValues('USERS!A2:J'),
      getSheetValues('MASTER_WAREHOUSE!A2:G'),
      getSheetValues('USER_WAREHOUSE_ACCESS!A2:G').catch(() => [])
    ]);

    const dbUser = userRows.find(r => r[0] === session.user_id);
    if (dbUser) {
      if (dbUser[5] === 'FALSE') {
        return NextResponse.json({ error: 'Akun Anda telah dinonaktifkan oleh Administrator.' }, { status: 403 });
      }
      session.full_name = dbUser[3] || session.full_name;
      session.role = (dbUser[4] as any) || session.role;
      if (dbUser[9]) {
        session.default_warehouse_id = dbUser[9];
      }
    }

    const activeWarehouses = whRows
      .filter(r => r[3] === 'TRUE')
      .map(r => ({
        warehouse_id: r[0],
        warehouse_code: r[1],
        warehouse_name: r[2]
      }));

    if (session.role === 'ADMIN') {
      session.allowed_warehouses = activeWarehouses;
    } else {
      const allowedIds = new Set(
        uwaRows.filter(r => r[1] === session.user_id && r[3] === 'TRUE').map(r => r[2])
      );
      session.allowed_warehouses = activeWarehouses.filter(w => allowedIds.has(w.warehouse_id));
    }

    if (!session.allowed_warehouses.some(w => w.warehouse_id === session.active_warehouse_id)) {
      session.active_warehouse_id = session.default_warehouse_id || session.allowed_warehouses[0]?.warehouse_id || 'WH-001';
    }
  } catch {
    // Fallback gracefully to session token payload
  }

  return NextResponse.json({ user: session });
}
