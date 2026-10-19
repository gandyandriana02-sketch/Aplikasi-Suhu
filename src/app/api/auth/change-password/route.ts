import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, hashPassword, comparePassword, createSessionToken, setSessionCookie } from '@/lib/auth';
import { getSheetValues, updateSheetValues, clearSheetCache } from '@/lib/google-sheets';
import { formatJakartaISO } from '@/lib/time';
import { recordAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json(
        { error: 'Belum login atau sesi telah berakhir.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { old_password, new_password } = body;

    if (!old_password || !new_password) {
      return NextResponse.json(
        { error: 'Password lama dan password baru wajib diisi.' },
        { status: 400 }
      );
    }

    if (new_password.length < 8) {
      return NextResponse.json(
        { error: 'Password baru minimal harus 8 karakter.' },
        { status: 400 }
      );
    }

    if (new_password === 'admin123') {
      return NextResponse.json(
        { error: 'Password baru tidak boleh menggunakan password default "admin123".' },
        { status: 400 }
      );
    }

    if (new_password === old_password) {
      return NextResponse.json(
        { error: 'Password baru harus berbeda dari password lama.' },
        { status: 400 }
      );
    }

    // Read USERS sheet to locate user row
    const rows = await getSheetValues('USERS!A2:I');
    const rowIndex = rows.findIndex(r => r[0] === session.user_id);

    if (rowIndex === -1) {
      return NextResponse.json(
        { error: 'Data pengguna tidak ditemukan di database.' },
        { status: 404 }
      );
    }

    const userRow = rows[rowIndex];
    const storedHash = userRow[2];

    const isOldValid = await comparePassword(old_password, storedHash);
    if (!isOldValid) {
      return NextResponse.json(
        { error: 'Password lama yang Anda masukkan salah.' },
        { status: 400 }
      );
    }

    const newHash = await hashPassword(new_password);
    const nowISO = formatJakartaISO();
    const sheetRowNumber = rowIndex + 2; // header is row 1

    // Update password_hash (Col C), updated_at (Col H), updated_by (Col I)
    await updateSheetValues(`USERS!C${sheetRowNumber}`, [[newHash]], 'RAW');
    await updateSheetValues(`USERS!H${sheetRowNumber}:I${sheetRowNumber}`, [[nowISO, session.username]], 'RAW');

    // Record audit log
    await recordAuditLog({
      actor_user_id: session.user_id,
      actor_username: session.username,
      actor_role: session.role,
      action_category: 'USER_MGMT',
      target_reference: session.user_id,
      notes_or_reason: 'Penggantian password akun berhasil.'
    });

    // Re-issue clean session token without must_change_password
    const newSessionToken = await createSessionToken({
      user_id: session.user_id,
      username: session.username,
      full_name: session.full_name,
      role: session.role,
      must_change_password: false
    });
    setSessionCookie(newSessionToken);
    clearSheetCache();

    return NextResponse.json({
      success: true,
      message: 'Password berhasil diperbarui.'
    });
  } catch (error: any) {
    console.error('Error in /api/auth/change-password:', error);
    return NextResponse.json(
      { error: 'Gagal memperbarui password: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
