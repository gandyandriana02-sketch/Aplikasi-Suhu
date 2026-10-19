import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, hashPassword, createSessionToken, setSessionCookie } from '@/lib/auth';
import { getSheetValues, updateSheetValues, appendSheetValues, clearSheetCache } from '@/lib/google-sheets';
import { formatJakartaISO } from '@/lib/time';
import { recordAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }
    if (session.must_change_password) {
      return NextResponse.json(
        { error: 'Wajib mengganti password awal sebelum mengakses fitur admin.' },
        { status: 403 }
      );
    }

    const rows = await getSheetValues('USERS!A2:J');
    const users = rows.map(r => ({
      user_id: r[0],
      username: r[1],
      full_name: r[3],
      role: r[4],
      is_active: r[5] === 'TRUE',
      created_at: r[6],
      updated_at: r[7],
      updated_by: r[8],
      default_warehouse_id: r[9] ? r[9].toString().trim() : ''
    }));

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('Error GET /api/admin/users:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }
    if (session.must_change_password) {
      return NextResponse.json(
        { error: 'Wajib mengganti password awal sebelum mengakses fitur admin.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { username, password, full_name, role, default_warehouse_id = 'WH-001' } = body;

    if (!username || !password || !full_name || !role) {
      return NextResponse.json(
        { error: 'Semua kolom (username, password, full_name, role) wajib diisi.' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password minimal 8 karakter.' },
        { status: 400 }
      );
    }

    if (!['ADMIN', 'MEMBER'].includes(role)) {
      return NextResponse.json(
        { error: 'Role harus ADMIN atau MEMBER.' },
        { status: 400 }
      );
    }

    const rows = await getSheetValues('USERS!A2:J');
    const exists = rows.some(
      r => r[1] && r[1].toString().trim().toLowerCase() === username.trim().toLowerCase()
    );
    if (exists) {
      return NextResponse.json(
        { error: `Username "${username}" sudah digunakan.` },
        { status: 400 }
      );
    }

    const newId = `USR-${String(rows.length + 1).padStart(3, '0')}`;
    const hash = await hashPassword(password);
    const nowISO = formatJakartaISO();

    const newRow = [
      newId,
      username.trim(),
      hash,
      full_name.trim(),
      role,
      'TRUE',
      nowISO,
      nowISO,
      session.username,
      default_warehouse_id ? default_warehouse_id.toString().trim() : 'WH-001'
    ];

    await appendSheetValues('USERS!A:J', [newRow], 'RAW');
    clearSheetCache();

    await recordAuditLog({
      actor_user_id: session.user_id,
      actor_username: session.username,
      actor_role: session.role,
      action_category: 'USER_MGMT',
      target_reference: newId,
      after_value: { user_id: newId, username, full_name, role, default_warehouse_id },
      notes_or_reason: `Pembuatan akun baru: ${username} (${role}, Default WH: ${default_warehouse_id})`
    });

    return NextResponse.json(
      { success: true, message: 'Akun berhasil dibuat.', user_id: newId },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error POST /api/admin/users:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }
    if (session.must_change_password) {
      return NextResponse.json(
        { error: 'Wajib mengganti password awal sebelum mengakses fitur admin.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    let { user_id, action, full_name, role, is_active, new_password, default_warehouse_id } = body;

    if (!action) {
      if (new_password !== undefined) action = 'RESET_PASSWORD';
      else if (is_active !== undefined) action = 'TOGGLE_STATUS';
      else if (full_name !== undefined || role !== undefined || default_warehouse_id !== undefined) action = 'UPDATE_PROFILE';
    }

    if (!user_id || !action) {
      return NextResponse.json(
        { error: 'user_id dan action wajib diisi.' },
        { status: 400 }
      );
    }

    const rows = await getSheetValues('USERS!A2:J');
    const rowIndex = rows.findIndex(r => r[0] === user_id);
    if (rowIndex === -1) {
      return NextResponse.json(
        { error: 'Pengguna tidak ditemukan.' },
        { status: 404 }
      );
    }

    const sheetRowNum = rowIndex + 2;
    const nowISO = formatJakartaISO();
    const existing = rows[rowIndex];

    if (action === 'TOGGLE_STATUS') {
      const newStatus = is_active ? 'TRUE' : 'FALSE';
      await updateSheetValues(`USERS!F${sheetRowNum}`, [[newStatus]], 'RAW');
      await updateSheetValues(`USERS!H${sheetRowNum}:I${sheetRowNum}`, [[nowISO, session.username]], 'RAW');

      await recordAuditLog({
        actor_user_id: session.user_id,
        actor_username: session.username,
        actor_role: session.role,
        action_category: 'USER_MGMT',
        target_reference: user_id,
        before_value: { is_active: existing[5] },
        after_value: { is_active: newStatus },
        notes_or_reason: `Ubah status akun ${existing[1]} menjadi ${newStatus === 'TRUE' ? 'AKTIF' : 'NONAKTIF'}`
      });

      clearSheetCache();
      return NextResponse.json({ success: true, message: 'Status akun berhasil diubah.' });
    }

    if (action === 'RESET_PASSWORD') {
      if (!new_password || new_password.length < 8) {
        return NextResponse.json(
          { error: 'Password baru minimal 8 karakter.' },
          { status: 400 }
        );
      }
      const hash = await hashPassword(new_password);
      await updateSheetValues(`USERS!C${sheetRowNum}`, [[hash]], 'RAW');
      await updateSheetValues(`USERS!H${sheetRowNum}:I${sheetRowNum}`, [[nowISO, session.username]], 'RAW');

      await recordAuditLog({
        actor_user_id: session.user_id,
        actor_username: session.username,
        actor_role: session.role,
        action_category: 'USER_MGMT',
        target_reference: user_id,
        notes_or_reason: `Reset password akun ${existing[1]} oleh Admin.`
      });

      clearSheetCache();
      return NextResponse.json({ success: true, message: 'Password akun berhasil direset.' });
    }

    if (action === 'UPDATE_PROFILE') {
      if (!full_name || !role) {
        return NextResponse.json(
          { error: 'full_name dan role wajib diisi.' },
          { status: 400 }
        );
      }
      await updateSheetValues(`USERS!D${sheetRowNum}:E${sheetRowNum}`, [[full_name.trim(), role]], 'RAW');
      if (default_warehouse_id !== undefined) {
        await updateSheetValues(`USERS!J${sheetRowNum}`, [[default_warehouse_id ? default_warehouse_id.toString().trim() : '']], 'RAW');
      }
      await updateSheetValues(`USERS!H${sheetRowNum}:I${sheetRowNum}`, [[nowISO, session.username]], 'RAW');

      await recordAuditLog({
        actor_user_id: session.user_id,
        actor_username: session.username,
        actor_role: session.role,
        action_category: 'USER_MGMT',
        target_reference: user_id,
        before_value: { full_name: existing[3], role: existing[4], default_warehouse_id: existing[9] },
        after_value: { full_name, role, default_warehouse_id },
        notes_or_reason: `Pembaruan profil akun ${existing[1]}`
      });

      // If the admin is updating their own profile, refresh their active JWT session cookie
      if (user_id === session.user_id) {
        try {
          const updatedPayload = {
            ...session,
            full_name: full_name.trim(),
            role: role as 'ADMIN' | 'MEMBER',
            ...(default_warehouse_id !== undefined ? { default_warehouse_id: default_warehouse_id ? default_warehouse_id.toString().trim() : undefined } : {})
          };
          const newToken = await createSessionToken(updatedPayload);
          setSessionCookie(newToken);
        } catch (cookieErr) {
          console.warn('Failed to re-issue session cookie:', cookieErr);
        }
      }

      clearSheetCache();
      return NextResponse.json({ success: true, message: 'Profil akun berhasil diperbarui.' });
    }

    return NextResponse.json({ error: 'Action tidak dikenal.' }, { status: 400 });
  } catch (error: any) {
    console.error('Error PUT /api/admin/users:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
