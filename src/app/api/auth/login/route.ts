import { NextRequest, NextResponse } from 'next/server';
import { getSheetValues } from '@/lib/google-sheets';
import { comparePassword, createSessionToken, setSessionCookie } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';
import { AllowedWarehouseSummary } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username dan password wajib diisi.' },
        { status: 400 }
      );
    }

    // Read USERS sheet: Columns A:J (including default_warehouse_id)
    const rows = await getSheetValues('USERS!A2:J');
    const userRow = rows.find(
      r => r[1] && r[1].toString().trim().toLowerCase() === username.trim().toLowerCase()
    );

    if (!userRow) {
      return NextResponse.json(
        { error: 'Username atau password salah. Periksa lagi, lalu coba masuk kembali.' },
        { status: 401 }
      );
    }

    const [
      user_id,
      stored_username,
      password_hash,
      full_name,
      role,
      is_active,
      _created_at,
      _updated_at,
      _updated_by,
      default_warehouse_id
    ] = userRow;

    if (is_active !== 'TRUE') {
      return NextResponse.json(
        { error: 'Akun ini dinonaktifkan. Hubungi Admin untuk mengaktifkannya.' },
        { status: 401 }
      );
    }

    const passwordMatch = await comparePassword(password, password_hash);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Username atau password salah. Periksa lagi, lalu coba masuk kembali.' },
        { status: 401 }
      );
    }

    // Backend check: mandatory password change for initial admin seed
    const isDefaultAdminPassword =
      stored_username.toLowerCase() === 'admin' && (await comparePassword('admin123', password_hash));

    // Multi-Warehouse access resolution (Fitur 2, FR-018, FR-019 & BR-10)
    let allowed_warehouses: AllowedWarehouseSummary[] = [];
    let active_warehouse_id = '';
    const preferredDefaultWhId = (default_warehouse_id || '').toString().trim();

    try {
      const whRows = await getSheetValues('MASTER_WAREHOUSE!A2:G');
      const activeWarehouses: AllowedWarehouseSummary[] = whRows
        .filter(r => r[3] === 'TRUE')
        .map(r => ({
          warehouse_id: r[0],
          warehouse_code: r[1],
          warehouse_name: r[2]
        }));

      if (role === 'ADMIN') {
        allowed_warehouses = activeWarehouses;
      } else {
        const uwaRows = await getSheetValues('USER_WAREHOUSE_ACCESS!A2:G');
        const userAccessSet = new Set(
          uwaRows
            .filter(r => r[1] === user_id && r[3] === 'TRUE')
            .map(r => r[2])
        );
        allowed_warehouses = activeWarehouses.filter(w => userAccessSet.has(w.warehouse_id));
      }

      // Prioritize admin-configured default_warehouse_id if user has access to it
      if (preferredDefaultWhId && allowed_warehouses.some(w => w.warehouse_id === preferredDefaultWhId)) {
        active_warehouse_id = preferredDefaultWhId;
      } else if (allowed_warehouses.length > 0) {
        active_warehouse_id = allowed_warehouses[0].warehouse_id;
      }
    } catch (whErr) {
      console.error('Failed to resolve user warehouse access:', whErr);
    }

    const sessionPayload = {
      user_id,
      username: stored_username,
      full_name,
      role: role as 'ADMIN' | 'MEMBER',
      must_change_password: isDefaultAdminPassword,
      active_warehouse_id,
      default_warehouse_id: preferredDefaultWhId,
      allowed_warehouses
    };

    const token = await createSessionToken(sessionPayload);
    setSessionCookie(token);

    // Record audit log for login (non-fatal if Sheets rate-limited)
    try {
      await recordAuditLog({
        actor_user_id: user_id,
        actor_username: stored_username,
        actor_role: role as 'ADMIN' | 'MEMBER',
        action_category: 'AUTH_LOGIN',
        warehouse_id: active_warehouse_id || 'GLOBAL',
        target_reference: user_id,
        notes_or_reason: isDefaultAdminPassword
          ? 'Login berhasil (Wajib ganti password aktif).'
          : `Login berhasil (Warehouse aktif: ${active_warehouse_id}).`
      });
    } catch (auditErr) {
      console.warn('Non-fatal: Failed to append login audit log:', auditErr);
    }

    return NextResponse.json({
      user: {
        user_id,
        username: stored_username,
        full_name,
        role,
        must_change_password: isDefaultAdminPassword,
        active_warehouse_id,
        default_warehouse_id: preferredDefaultWhId,
        allowed_warehouses
      }
    });
  } catch (error: any) {
    console.error('Error in /api/auth/login:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem saat memproses login.' },
      { status: 500 }
    );
  }
}
