import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getSheetValues, updateSheetValues, appendSheetValues, clearSheetCache, clearSheetRange } from '@/lib/google-sheets';
import { formatJakartaISO } from '@/lib/time';
import { recordAuditLog } from '@/lib/audit';
import { parseWarehouseSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

function resolveCanonicalWarehouseId(rawWh: string, whRows: any[][]): string {
  if (!rawWh) return 'WH-001';
  const clean = rawWh.trim();
  const byId = whRows.find(r => r[0] && r[0].trim().toUpperCase() === clean.toUpperCase());
  if (byId) return byId[0];
  const byCode = whRows.find(r => r[1] && r[1].trim().toUpperCase() === clean.toUpperCase());
  if (byCode) return byCode[0];
  return clean;
}

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
    const rawWhId = searchParams.get('warehouse_id') || 'WH-001';

    const [rows, whRows] = await Promise.all([
      getSheetValues('SETTINGS!A2:F'),
      getSheetValues('MASTER_WAREHOUSE!A2:G')
    ]);
    const targetWhId = resolveCanonicalWarehouseId(rawWhId, whRows);
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
    const rawWhId = body.warehouse_id || 'WH-001';
    const [rows, whRows] = await Promise.all([
      getSheetValues('SETTINGS!A2:F'),
      getSheetValues('MASTER_WAREHOUSE!A2:G')
    ]);
    const targetWhId = resolveCanonicalWarehouseId(rawWhId, whRows);
    const nowISO = formatJakartaISO();

    const allowedKeys = [
      'app_name',
      'app_icon',
      'max_temp_limit',
      'lock_sunday',
      'holiday_dates',
      'unlocked_dates',
      'wa_notification_enabled',
      'idle_timeout_minutes',
      'signoff_maker_title',
      'signoff_maker_name',
      'signoff_checker_title',
      'signoff_checker_name',
      'signoff_approver_title',
      'signoff_approver_name'
    ];

    const updates: { key: string; oldValue: any; newValue: any }[] = [];

    // Work with an in-memory mutable rows array
    const mutableRows = rows.map(r => [...r]);

    for (const key of allowedKeys) {
      if (body[key] !== undefined) {
        const whScope = (key === 'app_name' || key === 'app_icon' || key === 'idle_timeout_minutes') ? 'GLOBAL' : targetWhId;
        const rowIndex = mutableRows.findIndex(r => 
          (whScope === 'GLOBAL' ? r[0] === 'GLOBAL' : resolveCanonicalWarehouseId(r[0], whRows) === targetWhId) && r[1] === key
        );

        let newValString = '';
        if (key === 'max_temp_limit') {
          const num = parseFloat(body[key]);
          if (isNaN(num)) continue;
          newValString = String(num);
        } else if (key === 'idle_timeout_minutes') {
          const num = parseInt(body[key], 10);
          if (isNaN(num) || num < 0) continue;
          newValString = String(num);
        } else if (typeof body[key] === 'boolean') {
          newValString = body[key] ? 'TRUE' : 'FALSE';
        } else if (Array.isArray(body[key])) {
          newValString = JSON.stringify(body[key]);
        } else {
          newValString = String(body[key]);
        }

        if (rowIndex !== -1) {
          const oldVal = mutableRows[rowIndex][2];
          if (oldVal !== newValString) {
            mutableRows[rowIndex][0] = whScope; // Ensure canonical ID
            mutableRows[rowIndex][2] = newValString;
            mutableRows[rowIndex][4] = session.username;
            mutableRows[rowIndex][5] = nowISO;
            updates.push({ key, oldValue: oldVal, newValue: newValString });
          }
        } else {
          const newRow = [
            whScope,
            key,
            newValString,
            `Pengaturan ${key} untuk ${whScope}`,
            session.username,
            nowISO
          ];
          mutableRows.push(newRow);
          updates.push({ key, oldValue: null, newValue: newValString });
        }
      }
    }

    if (updates.length > 0) {
      // Deduplicate rows cleanly before writing
      const seen = new Set<string>();
      const cleanRows: any[][] = [];
      for (const r of mutableRows) {
        if (!r[0] || !r[1]) continue;
        const scope = r[0] === 'GLOBAL' ? 'GLOBAL' : resolveCanonicalWarehouseId(r[0], whRows);
        const uniqueKey = `${scope}:${r[1]}`;
        if (!seen.has(uniqueKey)) {
          seen.add(uniqueKey);
          cleanRows.push([
            scope,
            r[1],
            r[2] || '',
            r[3] || `Pengaturan ${r[1]} untuk ${scope}`,
            r[4] || session.username,
            r[5] || nowISO
          ]);
        }
      }

      await clearSheetRange('SETTINGS!A2:F');
      if (cleanRows.length > 0) {
        await updateSheetValues(`SETTINGS!A2:F${cleanRows.length + 1}`, cleanRows, 'RAW');
      }
      clearSheetCache();

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
