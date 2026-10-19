import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, canAccessWarehouse, createSessionToken, setSessionCookie } from '@/lib/auth';
import { getSheetValues, clearSheetCache } from '@/lib/google-sheets';
import { recordAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'Sesi tidak ditemukan atau telah kedaluwarsa.' }, { status: 401 });
    }

    const body = await req.json();
    const { warehouse_id } = body;

    if (!warehouse_id) {
      return NextResponse.json({ error: 'warehouse_id wajib diberikan.' }, { status: 400 });
    }

    // Verify warehouse exists and is active
    const whRows = await getSheetValues('MASTER_WAREHOUSE!A2:G');
    const targetWhRow = whRows.find(r => r[0] === warehouse_id);
    if (!targetWhRow || targetWhRow[3] !== 'TRUE') {
      return NextResponse.json({ error: 'Warehouse tidak ditemukan atau sedang tidak aktif.' }, { status: 404 });
    }

    const targetWh = {
      warehouse_id: targetWhRow[0],
      warehouse_code: targetWhRow[1],
      warehouse_name: targetWhRow[2]
    };

    // Check user permission (BR-10)
    let isAllowed = false;
    if (session.role === 'ADMIN') {
      isAllowed = true;
    } else {
      const uwaRows = await getSheetValues('USER_WAREHOUSE_ACCESS!A2:G');
      isAllowed = uwaRows.some(
        r => r[1] === session.user_id && r[2] === warehouse_id && r[3] === 'TRUE'
      );
    }

    if (!isAllowed) {
      return NextResponse.json({ error: 'Akses ke warehouse ini ditolak.' }, { status: 403 });
    }

    // Create updated session payload
    const updatedPayload = {
      ...session,
      active_warehouse_id: warehouse_id
    };

    const token = await createSessionToken(updatedPayload);
    setSessionCookie(token);
    clearSheetCache();

    // Record audit log for warehouse switch
    await recordAuditLog({
      actor_user_id: session.user_id,
      actor_username: session.username,
      actor_role: session.role,
      action_category: 'WH_SWITCH',
      warehouse_id: warehouse_id,
      target_reference: warehouse_id,
      notes_or_reason: `User berpindah ke warehouse ${targetWh.warehouse_code} (${targetWh.warehouse_name}).`
    });

    return NextResponse.json({
      success: true,
      active_warehouse_id: warehouse_id,
      active_warehouse: targetWh
    });
  } catch (error: any) {
    console.error('Error in /api/warehouses/switch:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
