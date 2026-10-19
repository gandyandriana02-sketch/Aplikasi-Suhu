import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getSheetValues, appendSheetValues, updateSheetValues, clearSheetCache, clearSheetRange } from '@/lib/google-sheets';
import { formatJakartaISO } from '@/lib/time';
import { recordAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }

    const rows = await getSheetValues('MASTER_WAREHOUSE!A2:G');
    const warehouses = rows.map((r, idx) => ({
      warehouse_id: r[0],
      warehouse_code: r[1],
      warehouse_name: r[2],
      is_active: r[3] === 'TRUE',
      created_at: r[4] || '',
      updated_at: r[5] || '',
      updated_by: r[6] || '',
      row_index: idx + 2
    }));

    return NextResponse.json({ warehouses });
  } catch (error: any) {
    console.error('Error GET /api/admin/warehouses:', error);
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
    const { warehouse_code, warehouse_name } = body;

    if (!warehouse_code || !warehouse_name) {
      return NextResponse.json(
        { error: 'Kode dan nama warehouse wajib diisi.' },
        { status: 400 }
      );
    }

    const cleanCode = warehouse_code.trim().toUpperCase();
    const cleanName = warehouse_name.trim();

    // Check code uniqueness (Fitur 1 & TS-09)
    const rows = await getSheetValues('MASTER_WAREHOUSE!A2:G');
    const duplicate = rows.find(r => r[1] && r[1].trim().toUpperCase() === cleanCode);
    if (duplicate) {
      return NextResponse.json(
        { error: `Kode warehouse '${cleanCode}' sudah digunakan.` },
        { status: 409 }
      );
    }

    // Determine next warehouse ID
    let maxNum = 0;
    rows.forEach(r => {
      const match = (r[0] || '').match(/^WH-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    const nextNum = maxNum + 1;
    const warehouse_id = `WH-${String(nextNum).padStart(3, '0')}`;
    const nowISO = formatJakartaISO();

    const newRow = [
      warehouse_id,
      cleanCode,
      cleanName,
      'TRUE',
      nowISO,
      nowISO,
      session.username
    ];

    await appendSheetValues('MASTER_WAREHOUSE!A:G', [newRow], 'RAW');

    // Seed default settings for the new warehouse
    const defaultSettingsRows = [
      [warehouse_id, 'max_temp_limit', '30', `Batas suhu maksimal aktif ${cleanCode} dalam °C`, session.username, nowISO],
      [warehouse_id, 'lock_sunday', 'TRUE', `Kunci input otomatis pada hari Minggu di ${cleanCode}`, session.username, nowISO],
      [warehouse_id, 'holiday_dates', '[]', `JSON Array tanggal libur ${cleanCode}`, session.username, nowISO],
      [warehouse_id, 'unlocked_dates', '[]', `JSON Array tanggal buka khusus ${cleanCode}`, session.username, nowISO],
      [warehouse_id, 'wa_notification_enabled', 'TRUE', `Saklar peringatan WhatsApp ${cleanCode}`, session.username, nowISO]
    ];
    await appendSheetValues('SETTINGS!A:F', defaultSettingsRows, 'RAW');

    // Automatically give access to Admin
    const uwaRows = await getSheetValues('USER_WAREHOUSE_ACCESS!A2:G');
    const nextUwaId = `UWA-${String(uwaRows.length + 1).padStart(3, '0')}`;
    await appendSheetValues('USER_WAREHOUSE_ACCESS!A:G', [[
      nextUwaId,
      session.user_id,
      warehouse_id,
      'TRUE',
      nowISO,
      nowISO,
      session.username
    ]], 'RAW');

    clearSheetCache();

    await recordAuditLog({
      actor_user_id: session.user_id,
      actor_username: session.username,
      actor_role: session.role,
      action_category: 'WH_MGMT',
      warehouse_id: warehouse_id,
      target_reference: warehouse_id,
      after_value: { warehouse_id, cleanCode, cleanName },
      notes_or_reason: `Admin menambah warehouse baru: ${cleanCode} (${cleanName}).`
    });

    return NextResponse.json({
      success: true,
      warehouse: {
        warehouse_id,
        warehouse_code: cleanCode,
        warehouse_name: cleanName,
        is_active: true
      }
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error POST /api/admin/warehouses:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }

    const body = await req.json();
    const { warehouse_id, warehouse_code, warehouse_name, is_active } = body;

    if (!warehouse_id) {
      return NextResponse.json({ error: 'warehouse_id wajib diisi.' }, { status: 400 });
    }

    const rows = await getSheetValues('MASTER_WAREHOUSE!A2:G');
    const idx = rows.findIndex(r => r[0] === warehouse_id);
    if (idx === -1) {
      return NextResponse.json({ error: 'Warehouse tidak ditemukan.' }, { status: 404 });
    }

    const sheetRowNum = idx + 2;
    const existingRow = rows[idx];
    const nowISO = formatJakartaISO();

    const updatedCode = warehouse_code !== undefined ? warehouse_code.trim().toUpperCase() : existingRow[1];
    const updatedName = warehouse_name !== undefined ? warehouse_name.trim() : existingRow[2];
    const updatedActive = is_active !== undefined ? (is_active ? 'TRUE' : 'FALSE') : existingRow[3];

    // Check code uniqueness if code changed
    if (updatedCode !== existingRow[1]) {
      const duplicate = rows.find(r => r[0] !== warehouse_id && r[1] && r[1].trim().toUpperCase() === updatedCode);
      if (duplicate) {
        return NextResponse.json(
          { error: `Kode warehouse '${updatedCode}' sudah digunakan oleh warehouse lain.` },
          { status: 409 }
        );
      }
    }

    await updateSheetValues(
      `MASTER_WAREHOUSE!B${sheetRowNum}:G${sheetRowNum}`,
      [[updatedCode, updatedName, updatedActive, existingRow[4], nowISO, session.username]],
      'RAW'
    );

    clearSheetCache();

    await recordAuditLog({
      actor_user_id: session.user_id,
      actor_username: session.username,
      actor_role: session.role,
      action_category: 'WH_MGMT',
      warehouse_id: warehouse_id,
      target_reference: warehouse_id,
      before_value: { code: existingRow[1], name: existingRow[2], is_active: existingRow[3] },
      after_value: { code: updatedCode, name: updatedName, is_active: updatedActive },
      notes_or_reason: `Admin mengubah data warehouse ${existingRow[1]} -> ${updatedCode} (${updatedName}).`
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error PUT /api/admin/warehouses:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }

    const body = await req.json();
    const { warehouse_id } = body;

    if (!warehouse_id) {
      return NextResponse.json({ error: 'warehouse_id wajib diisi.' }, { status: 400 });
    }

    const whRows = await getSheetValues('MASTER_WAREHOUSE!A2:G');
    const targetIdx = whRows.findIndex(r => r[0] === warehouse_id);
    if (targetIdx === -1) {
      return NextResponse.json({ error: 'Warehouse tidak ditemukan.' }, { status: 404 });
    }

    const targetRow = whRows[targetIdx];
    const whCode = targetRow[1];

    // Protect historical data (BR-08 / BR-11): Check TRANSAKSI_SUHU
    const txRows = await getSheetValues('TRANSAKSI_SUHU!A2:E');
    const hasTx = txRows.some(r => r[2] === warehouse_id || r[3] === whCode);
    if (hasTx) {
      return NextResponse.json(
        { error: `Warehouse '${whCode}' memiliki riwayat transaksi suhu dan tidak dapat dihapus (BR-08 / BR-11). Anda hanya dapat menonaktifkannya.` },
        { status: 400 }
      );
    }

    // Also check if there are locations or periods
    const [lokasiRows, periodeRows] = await Promise.all([
      getSheetValues('MASTER_LOKASI!A2:H'),
      getSheetValues('MASTER_PERIODE!A2:H')
    ]);
    const hasLocations = lokasiRows.some(r => r[1] === warehouse_id || r[1] === whCode);
    const hasPeriods = periodeRows.some(r => r[1] === warehouse_id || r[1] === whCode);
    if (hasLocations || hasPeriods) {
      return NextResponse.json(
        { error: `Warehouse '${whCode}' masih memiliki titik lokasi atau jadwal shift aktif. Silakan hapus atau pindahkan titik lokasi & jadwal shift terlebih dahulu.` },
        { status: 400 }
      );
    }

    // 1. Remove from MASTER_WAREHOUSE
    const remainingWh = whRows.filter(r => r[0] !== warehouse_id);
    await clearSheetRange('MASTER_WAREHOUSE!A2:G');
    if (remainingWh.length > 0) {
      await updateSheetValues(`MASTER_WAREHOUSE!A2:G${remainingWh.length + 1}`, remainingWh, 'RAW');
    }

    // 2. Remove settings for this warehouse from SETTINGS
    const settingsRows = await getSheetValues('SETTINGS!A2:F');
    const remainingSettings = settingsRows.filter(r => r[0] !== warehouse_id && r[0] !== whCode);
    await clearSheetRange('SETTINGS!A2:F');
    if (remainingSettings.length > 0) {
      await updateSheetValues(`SETTINGS!A2:F${remainingSettings.length + 1}`, remainingSettings, 'RAW');
    }

    // 3. Remove access entries for this warehouse from USER_WAREHOUSE_ACCESS
    const uwaRows = await getSheetValues('USER_WAREHOUSE_ACCESS!A2:G');
    const remainingUwa = uwaRows.filter(r => r[2] !== warehouse_id && r[2] !== whCode);
    await clearSheetRange('USER_WAREHOUSE_ACCESS!A2:G');
    if (remainingUwa.length > 0) {
      await updateSheetValues(`USER_WAREHOUSE_ACCESS!A2:G${remainingUwa.length + 1}`, remainingUwa, 'RAW');
    }

    clearSheetCache();

    await recordAuditLog({
      actor_user_id: session.user_id,
      actor_username: session.username,
      actor_role: session.role,
      action_category: 'WH_MGMT',
      warehouse_id: warehouse_id,
      target_reference: warehouse_id,
      before_value: { warehouse_id, code: whCode, name: targetRow[2] },
      notes_or_reason: `Admin menghapus warehouse: ${whCode} (${targetRow[2]}).`
    });

    return NextResponse.json({ success: true, message: `Warehouse '${whCode}' berhasil dihapus permanen.` });
  } catch (error: any) {
    console.error('Error DELETE /api/admin/warehouses:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

