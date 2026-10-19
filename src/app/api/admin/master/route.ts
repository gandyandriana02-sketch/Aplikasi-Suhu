import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getSheetValues, updateSheetValues, appendSheetValues, clearSheetCache } from '@/lib/google-sheets';
import { formatJakartaISO } from '@/lib/time';
import { recordAuditLog } from '@/lib/audit';

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
    const filterWhId = searchParams.get('warehouse_id');

    const [lokasiRows, periodeRows, whRows] = await Promise.all([
      getSheetValues('MASTER_LOKASI!A2:H'),
      getSheetValues('MASTER_PERIODE!A2:H'),
      getSheetValues('MASTER_WAREHOUSE!A2:G')
    ]);

    let locations = lokasiRows.map(r => ({
      location_id: r[0],
      warehouse_id: resolveCanonicalWarehouseId(r[1], whRows),
      location_name: r[2],
      sort_order: parseInt(r[3] || '0', 10),
      is_active: r[4] === 'TRUE',
      created_at: r[5],
      updated_at: r[6],
      updated_by: r[7]
    }));

    let periods = periodeRows.map(r => ({
      period_id: r[0],
      warehouse_id: resolveCanonicalWarehouseId(r[1], whRows),
      period_label: r[2],
      sort_order: parseInt(r[3] || '0', 10),
      is_active: r[4] === 'TRUE',
      created_at: r[5],
      updated_at: r[6],
      updated_by: r[7]
    }));

    if (filterWhId && filterWhId !== 'all') {
      const canonicalFilter = resolveCanonicalWarehouseId(filterWhId, whRows);
      locations = locations.filter(l => l.warehouse_id === canonicalFilter);
      periods = periods.filter(p => p.warehouse_id === canonicalFilter);
    }

    return NextResponse.json({ locations, periods });
  } catch (error: any) {
    console.error('Error GET /api/admin/master:', error);
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
    const { type, warehouse_id = 'WH-001', name_or_label, sort_order } = body;

    if (!type || !name_or_label) {
      return NextResponse.json(
        { error: 'type dan name_or_label wajib diisi.' },
        { status: 400 }
      );
    }

    const whRows = await getSheetValues('MASTER_WAREHOUSE!A2:G');
    const canonicalWhId = resolveCanonicalWarehouseId(warehouse_id, whRows);

    const nowISO = formatJakartaISO();
    const order = typeof sort_order === 'number' ? sort_order : 1;

    if (type === 'LOCATION') {
      const rows = await getSheetValues('MASTER_LOKASI!A2:H');
      let maxNum = 0;
      rows.forEach(r => {
        const match = (r[0] || '').match(/^LOC-(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) maxNum = num;
        }
      });
      const newId = `LOC-${String(maxNum + 1).padStart(3, '0')}`;
      const newRow = [
        newId,
        canonicalWhId,
        name_or_label.trim(),
        order,
        'TRUE',
        nowISO,
        nowISO,
        session.username
      ];
      await appendSheetValues('MASTER_LOKASI!A:H', [newRow], 'RAW');
      clearSheetCache();

      await recordAuditLog({
        actor_user_id: session.user_id,
        actor_username: session.username,
        actor_role: session.role,
        action_category: 'MASTER_MGMT',
        warehouse_id: canonicalWhId,
        target_reference: newId,
        after_value: { location_id: newId, warehouse_id: canonicalWhId, location_name: name_or_label, sort_order: order },
        notes_or_reason: `Tambah master lokasi: ${name_or_label} (${canonicalWhId})`
      });

      return NextResponse.json({ success: true, message: 'Lokasi berhasil ditambahkan.', id: newId }, { status: 201 });
    }

    if (type === 'PERIOD') {
      const rows = await getSheetValues('MASTER_PERIODE!A2:H');
      let maxNum = 0;
      rows.forEach(r => {
        const match = (r[0] || '').match(/^PRD-(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) maxNum = num;
        }
      });
      const newId = `PRD-${String(maxNum + 1).padStart(3, '0')}`;
      const newRow = [
        newId,
        canonicalWhId,
        name_or_label.trim(),
        order,
        'TRUE',
        nowISO,
        nowISO,
        session.username
      ];
      await appendSheetValues('MASTER_PERIODE!A:H', [newRow], 'RAW');
      clearSheetCache();

      await recordAuditLog({
        actor_user_id: session.user_id,
        actor_username: session.username,
        actor_role: session.role,
        action_category: 'MASTER_MGMT',
        warehouse_id: canonicalWhId,
        target_reference: newId,
        after_value: { period_id: newId, warehouse_id: canonicalWhId, period_label: name_or_label, sort_order: order },
        notes_or_reason: `Tambah master jadwal: ${name_or_label} (${canonicalWhId})`
      });

      return NextResponse.json({ success: true, message: 'Jadwal berhasil ditambahkan.', id: newId }, { status: 201 });
    }

    return NextResponse.json({ error: 'type tidak valid. Gunakan LOCATION atau PERIOD.' }, { status: 400 });
  } catch (error: any) {
    console.error('Error POST /api/admin/master:', error);
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
    const { type, id, name_or_label, sort_order, is_active } = body;

    if (!type || !id) {
      return NextResponse.json({ error: 'type dan id wajib diisi.' }, { status: 400 });
    }

    const nowISO = formatJakartaISO();

    if (type === 'LOCATION') {
      const rows = await getSheetValues('MASTER_LOKASI!A2:H');
      const rowIndex = rows.findIndex(r => r[0] === id);
      if (rowIndex === -1) {
        return NextResponse.json({ error: 'Lokasi tidak ditemukan.' }, { status: 404 });
      }

      const sheetRowNum = rowIndex + 2;
      const existing = rows[rowIndex];
      const whId = existing[1] || 'WH-001';
      const updatedName = name_or_label !== undefined ? name_or_label.trim() : existing[2];
      const updatedOrder = sort_order !== undefined ? sort_order : existing[3];
      const updatedActive = is_active !== undefined ? (is_active ? 'TRUE' : 'FALSE') : existing[4];

      await updateSheetValues(
        `MASTER_LOKASI!C${sheetRowNum}:E${sheetRowNum}`,
        [[updatedName, updatedOrder, updatedActive]],
        'RAW'
      );
      await updateSheetValues(
        `MASTER_LOKASI!G${sheetRowNum}:H${sheetRowNum}`,
        [[nowISO, session.username]],
        'RAW'
      );
      clearSheetCache();

      await recordAuditLog({
        actor_user_id: session.user_id,
        actor_username: session.username,
        actor_role: session.role,
        action_category: 'MASTER_MGMT',
        warehouse_id: whId,
        target_reference: id,
        before_value: { name: existing[2], order: existing[3], is_active: existing[4] },
        after_value: { name: updatedName, order: updatedOrder, is_active: updatedActive },
        notes_or_reason: `Ubah master lokasi ${id} (${updatedName})`
      });

      return NextResponse.json({ success: true, message: 'Lokasi berhasil diperbarui.' });
    }

    if (type === 'PERIOD') {
      const rows = await getSheetValues('MASTER_PERIODE!A2:H');
      const rowIndex = rows.findIndex(r => r[0] === id);
      if (rowIndex === -1) {
        return NextResponse.json({ error: 'Jadwal tidak ditemukan.' }, { status: 404 });
      }

      const sheetRowNum = rowIndex + 2;
      const existing = rows[rowIndex];
      const whId = existing[1] || 'WH-001';
      const updatedLabel = name_or_label !== undefined ? name_or_label.trim() : existing[2];
      const updatedOrder = sort_order !== undefined ? sort_order : existing[3];
      const updatedActive = is_active !== undefined ? (is_active ? 'TRUE' : 'FALSE') : existing[4];

      await updateSheetValues(
        `MASTER_PERIODE!C${sheetRowNum}:E${sheetRowNum}`,
        [[updatedLabel, updatedOrder, updatedActive]],
        'RAW'
      );
      await updateSheetValues(
        `MASTER_PERIODE!G${sheetRowNum}:H${sheetRowNum}`,
        [[nowISO, session.username]],
        'RAW'
      );
      clearSheetCache();

      await recordAuditLog({
        actor_user_id: session.user_id,
        actor_username: session.username,
        actor_role: session.role,
        action_category: 'MASTER_MGMT',
        warehouse_id: whId,
        target_reference: id,
        before_value: { label: existing[2], order: existing[3], is_active: existing[4] },
        after_value: { label: updatedLabel, order: updatedOrder, is_active: updatedActive },
        notes_or_reason: `Ubah master jadwal ${id} (${updatedLabel})`
      });

      return NextResponse.json({ success: true, message: 'Jadwal berhasil diperbarui.' });
    }

    return NextResponse.json({ error: 'type tidak valid. Gunakan LOCATION atau PERIOD.' }, { status: 400 });
  } catch (error: any) {
    console.error('Error PUT /api/admin/master:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
