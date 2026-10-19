import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getSheetValues, updateSheetValues, appendSheetValues, clearSheetCache } from '@/lib/google-sheets';
import { formatJakartaISO } from '@/lib/time';
import { recordAuditLog } from '@/lib/audit';
import { parseWarehouseSettings } from '@/lib/settings';

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

    const { searchParams } = new URL(req.url);
    const targetWhId = searchParams.get('warehouse_id') || 'WH-001';

    const rows = await getSheetValues('SETTINGS!A2:F');
    const settings = parseWarehouseSettings(rows, targetWhId);

    return NextResponse.json({ settings, warehouse_id: targetWhId });
  } catch (error: any) {
    console.error('Error GET /api/admin/settings:', error);
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
    const targetWhId = body.warehouse_id || 'WH-001';
    const rows = await getSheetValues('SETTINGS!A2:F');
    const nowISO = formatJakartaISO();

    const allowedKeys = [
      'app_name',
      'app_icon',
      'max_temp_limit',
      'lock_sunday',
      'holiday_dates',
      'unlocked_dates',
      'wa_notification_enabled',
      'signoff_maker_title',
      'signoff_maker_name',
      'signoff_checker_title',
      'signoff_checker_name',
      'signoff_approver_title',
      'signoff_approver_name'
    ];

    const updates: { key: string; oldValue: any; newValue: any }[] = [];

    for (const key of allowedKeys) {
      if (body[key] !== undefined) {
        const whScope = (key === 'app_name' || key === 'app_icon') ? 'GLOBAL' : targetWhId;
        const rowIndex = rows.findIndex(r => r[0] === whScope && r[1] === key);

        let newValString = '';
        if (key === 'max_temp_limit') {
          const num = parseFloat(body[key]);
          if (isNaN(num)) continue;
          newValString = String(num);
        } else if (typeof body[key] === 'boolean') {
          newValString = body[key] ? 'TRUE' : 'FALSE';
        } else if (Array.isArray(body[key])) {
          newValString = JSON.stringify(body[key]);
        } else {
          newValString = String(body[key]);
        }

        if (rowIndex !== -1) {
          const sheetRowNum = rowIndex + 2;
          const oldVal = rows[rowIndex][2];

          if (oldVal !== newValString) {
            await updateSheetValues(`SETTINGS!C${sheetRowNum}`, [[newValString]], 'RAW');
            await updateSheetValues(`SETTINGS!E${sheetRowNum}:F${sheetRowNum}`, [[session.username, nowISO]], 'RAW');
            rows[rowIndex][2] = newValString;
            rows[rowIndex][4] = session.username;
            rows[rowIndex][5] = nowISO;
            updates.push({ key, oldValue: oldVal, newValue: newValString });
          }
        } else {
          // If setting row doesn't exist for this warehouse yet, append it
          const newRow = [
            whScope,
            key,
            newValString,
            `Pengaturan ${key} untuk ${whScope}`,
            session.username,
            nowISO
          ];
          await appendSheetValues('SETTINGS!A:F', [newRow], 'RAW');
          rows.push(newRow);
          updates.push({ key, oldValue: null, newValue: newValString });
        }
      }
    }

    clearSheetCache();

    if (updates.length > 0) {
      await recordAuditLog({
        actor_user_id: session.user_id,
        actor_username: session.username,
        actor_role: session.role,
        action_category: 'SETTING_CHANGE',
        warehouse_id: targetWhId,
        target_reference: `SETTINGS:${targetWhId}`,
        before_value: updates.map(u => ({ [u.key]: u.oldValue })),
        after_value: updates.map(u => ({ [u.key]: u.newValue })),
        notes_or_reason: `Pembaruan pengaturan ${targetWhId}: ${updates.map(u => u.key).join(', ')}`
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Pengaturan berhasil diperbarui.',
      warehouse_id: targetWhId,
      updated_keys: updates.map(u => u.key)
    });
  } catch (error: any) {
    console.error('Error PUT /api/admin/settings:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
