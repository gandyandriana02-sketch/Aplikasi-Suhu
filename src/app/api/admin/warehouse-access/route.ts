import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getSheetValues, appendSheetValues, updateSheetValues, clearSheetCache } from '@/lib/google-sheets';
import { formatJakartaISO } from '@/lib/time';
import { recordAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }

    const [uwaRows, usersRows, whRows] = await Promise.all([
      getSheetValues('USER_WAREHOUSE_ACCESS!A2:G'),
      getSheetValues('USERS!A2:J'),
      getSheetValues('MASTER_WAREHOUSE!A2:G')
    ]);

    const activeWarehouses = whRows
      .filter(r => r[3] === 'TRUE')
      .map(r => ({
        warehouse_id: r[0],
        warehouse_code: r[1],
        warehouse_name: r[2],
        is_active: true
      }));

    // Group user warehouse accesses
    const userAccessList = usersRows.map(u => {
      const uId = u[0];
      const username = u[1];
      const fullName = u[3];
      const role = u[4];
      const defaultWarehouseId = u[9] ? u[9].toString().trim() : '';

      const userAllowedWhIds = uwaRows
        .filter(r => r[1] === uId && r[3] === 'TRUE')
        .map(r => r[2]);

      return {
        user_id: uId,
        username,
        full_name: fullName,
        role,
        default_warehouse_id: defaultWarehouseId,
        allowed_warehouse_ids: userAllowedWhIds,
        warehouses: activeWarehouses.map(w => ({
          ...w,
          is_allowed: role === 'ADMIN' || userAllowedWhIds.includes(w.warehouse_id)
        }))
      };
    });

    return NextResponse.json({
      user_access: userAccessList,
      warehouses: activeWarehouses
    });
  } catch (error: any) {
    console.error('Error GET /api/admin/warehouse-access:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }

    const body = await req.json();
    const { user_id, warehouse_id, warehouse_ids, default_warehouse_id, is_active = true } = body;

    if (!user_id) {
      return NextResponse.json({ error: 'user_id wajib diisi.' }, { status: 400 });
    }

    const [uwaRows, whRows] = await Promise.all([
      getSheetValues('USER_WAREHOUSE_ACCESS!A2:G'),
      getSheetValues('MASTER_WAREHOUSE!A2:G')
    ]);

    const nowISO = formatJakartaISO();
    const activeWarehouses = whRows.filter(r => r[3] === 'TRUE');

    if (Array.isArray(warehouse_ids)) {
      // Batch update all active warehouses for this user
      const targetWhSet = new Set(warehouse_ids);

      for (const wh of activeWarehouses) {
        const whId = wh[0];
        const shouldBeActive = targetWhSet.has(whId);
        const existingIdx = uwaRows.findIndex(r => r[1] === user_id && r[2] === whId);
        const activeStr = shouldBeActive ? 'TRUE' : 'FALSE';

        if (existingIdx !== -1) {
          const sheetRowNum = existingIdx + 2;
          await updateSheetValues(
            `USER_WAREHOUSE_ACCESS!D${sheetRowNum}:G${sheetRowNum}`,
            [[activeStr, uwaRows[existingIdx][4], nowISO, session.username]],
            'RAW'
          );
        } else if (shouldBeActive) {
          const nextId = `UWA-${String(uwaRows.length + 1).padStart(3, '0')}`;
          const newRow = [
            nextId,
            user_id,
            whId,
            activeStr,
            nowISO,
            nowISO,
            session.username
          ];
          await appendSheetValues('USER_WAREHOUSE_ACCESS!A:G', [newRow], 'RAW');
          uwaRows.push(newRow);
        }
      }

      // If default_warehouse_id is provided, save it to USERS sheet Column J
      if (default_warehouse_id !== undefined) {
        const usersRows = await getSheetValues('USERS!A2:J');
        const uIdx = usersRows.findIndex(r => r[0] === user_id);
        if (uIdx !== -1) {
          const sheetRowNum = uIdx + 2;
          await updateSheetValues(
            `USERS!J${sheetRowNum}`,
            [[default_warehouse_id ? default_warehouse_id.toString().trim() : '']],
            'RAW'
          );
        }
      }

      clearSheetCache();

      await recordAuditLog({
        actor_user_id: session.user_id,
        actor_username: session.username,
        actor_role: session.role,
        action_category: 'WH_ACCESS_MGMT',
        target_reference: user_id,
        after_value: { user_id, warehouse_ids, default_warehouse_id },
        notes_or_reason: `Admin memperbarui hak akses warehouse user ${user_id} ke [${warehouse_ids.join(', ')}] (Default: ${default_warehouse_id || '-'}).`
      });

      return NextResponse.json({ success: true }, { status: 200 });
    }

    // Single update fallback
    if (!warehouse_id) {
      return NextResponse.json({ error: 'warehouse_id wajib diisi.' }, { status: 400 });
    }

    const existingIdx = uwaRows.findIndex(r => r[1] === user_id && r[2] === warehouse_id);
    const activeStr = is_active ? 'TRUE' : 'FALSE';

    if (existingIdx !== -1) {
      const sheetRowNum = existingIdx + 2;
      await updateSheetValues(
        `USER_WAREHOUSE_ACCESS!D${sheetRowNum}:G${sheetRowNum}`,
        [[activeStr, uwaRows[existingIdx][4], nowISO, session.username]],
        'RAW'
      );
    } else {
      const nextId = `UWA-${String(uwaRows.length + 1).padStart(3, '0')}`;
      const newRow = [
        nextId,
        user_id,
        warehouse_id,
        activeStr,
        nowISO,
        nowISO,
        session.username
      ];
      await appendSheetValues('USER_WAREHOUSE_ACCESS!A:G', [newRow], 'RAW');
    }

    clearSheetCache();

    await recordAuditLog({
      actor_user_id: session.user_id,
      actor_username: session.username,
      actor_role: session.role,
      action_category: 'WH_ACCESS_MGMT',
      warehouse_id: warehouse_id,
      target_reference: `${user_id}:${warehouse_id}`,
      after_value: { user_id, warehouse_id, is_active },
      notes_or_reason: `Admin memperbarui hak akses user ${user_id} ke warehouse ${warehouse_id} (${activeStr}).`
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error POST /api/admin/warehouse-access:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
