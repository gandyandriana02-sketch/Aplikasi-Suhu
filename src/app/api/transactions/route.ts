import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, canAccessWarehouse } from '@/lib/auth';
import { batchGetSheetValues, appendSheetValues, getSheetValues, updateSheetValues } from '@/lib/google-sheets';
import { formatJakartaISO, getTodayDateStringJakarta } from '@/lib/time';
import { uploadPhotoToDrive } from '@/lib/google-drive';
import { recordAuditLog } from '@/lib/audit';
import { sendWhatsAppAlert } from '@/lib/whatsapp';
import { parseWarehouseSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'Sesi tidak ditemukan atau telah berakhir.' }, { status: 401 });
    }

    const body = await req.json();
    const {
      idempotency_key,
      warehouse_id: bodyWarehouseId,
      tanggal,
      location_id,
      period_id,
      suhu,
      photo_base64,
      client_captured_at,
      gps_coordinates,
      is_batch
    } = body;

    const warehouseId = bodyWarehouseId || session.active_warehouse_id || 'WH-001';

    // 1. Backend access validation (BR-10 & TS-10)
    if (!canAccessWarehouse(session, warehouseId)) {
      return NextResponse.json({ error: 'Akses ke warehouse ini ditolak.' }, { status: 403 });
    }

    // 2. Mandatory Fields Validation
    if (!idempotency_key || !tanggal || !location_id || !period_id || suhu === undefined || !photo_base64) {
      return NextResponse.json(
        { error: 'Seluruh data (idempotency_key, tanggal, location_id, period_id, suhu, foto) wajib diisi.' },
        { status: 400 }
      );
    }

    const numericSuhu = typeof suhu === 'number' ? suhu : parseFloat(String(suhu).replace(',', '.'));
    if (isNaN(numericSuhu) || numericSuhu < -50 || numericSuhu > 100) {
      return NextResponse.json(
        { error: 'Masukkan angka suhu yang valid, misalnya 28,5.' },
        { status: 400 }
      );
    }

    // 3. Batch Read: Masters, Settings, and Transactions in 1 API call (PRD 21.2)
    const ranges = [
      'MASTER_WAREHOUSE!A2:G',
      'MASTER_LOKASI!A2:H',
      'MASTER_PERIODE!A2:H',
      'SETTINGS!A2:F',
      'TRANSAKSI_SUHU!A2:AB'
    ];

    const batchResults = await batchGetSheetValues(ranges);
    const whRows = batchResults[0]?.values || [];
    const lokasiRows = batchResults[1]?.values || [];
    const periodeRows = batchResults[2]?.values || [];
    const settingsRows = batchResults[3]?.values || [];
    const existingTransactions = batchResults[4]?.values || [];

    // Resolve warehouse snapshot
    const whRow = whRows.find(r => r[0] === warehouseId);
    const warehouseCode = whRow ? whRow[1] : 'CK01';
    const warehouseName = whRow ? whRow[2] : 'Cikupa 1';
    const warehouseFolderName = `${warehouseCode} — ${warehouseName}`;

    // Find location snapshot (r[0] = location_id, r[1] = warehouse_id, r[2] = location_name)
    const locRow = lokasiRows.find(r => r[0] === location_id);
    if (!locRow) {
      return NextResponse.json({ error: 'Titik lokasi tidak valid.' }, { status: 400 });
    }
    const locationNameSnapshot = locRow[2];

    // Find period snapshot (r[0] = period_id, r[1] = warehouse_id, r[2] = period_label)
    const periodRow = periodeRows.find(r => r[0] === period_id);
    if (!periodRow) {
      return NextResponse.json({ error: 'Jadwal pengecekan tidak valid.' }, { status: 400 });
    }
    const periodLabelSnapshot = periodRow[2];

    // Parse Settings for this warehouse with strict hierarchical resolution
    const whSettings = parseWarehouseSettings(settingsRows, warehouseId);
    const maxTempLimit = whSettings.max_temp_limit;
    const lockSunday = whSettings.lock_sunday;
    const holidayDates = whSettings.holiday_dates;
    const unlockedDates = whSettings.unlocked_dates;
    const waEnabled = whSettings.wa_notification_enabled;

    // 4. Date Lock Validation for Member (FR-007, BR-04)
    const todayJakarta = getTodayDateStringJakarta();
    if (session.role === 'MEMBER') {
      if (!unlockedDates.includes(tanggal)) {
        if (tanggal !== todayJakarta) {
          return NextResponse.json(
            { error: 'Member hanya dapat menginput data pada tanggal hari ini.' },
            { status: 403 }
          );
        }

        const dateObj = new Date(`${tanggal}T00:00:00+07:00`);
        if (lockSunday && dateObj.getDay() === 0) {
          return NextResponse.json(
            { error: 'Input hari ini ditutup. Hubungi Admin untuk membukanya.' },
            { status: 403 }
          );
        }

        if (holidayDates.includes(tanggal)) {
          return NextResponse.json(
            { error: 'Input pada tanggal libur dikunci. Hubungi Admin untuk membukanya.' },
            { status: 403 }
          );
        }
      }
    }

    // 5. Concurrency & Idempotency Check with warehouse isolation (BR-02, BR-03, FR-011)
    // In TRANSAKSI_SUHU: r[1] = idem_key, r[2] = wh_id, r[5] = tanggal, r[7] = loc_id, r[9] = prd_id
    const existingSlot = existingTransactions.find(
      r => r[2] === warehouseId && r[5] === tanggal && r[7] === location_id && r[9] === period_id
    );

    if (existingSlot) {
      if (existingSlot[1] === idempotency_key) {
        return NextResponse.json(
          {
            success: true,
            message: 'Transaksi sudah pernah disimpan sebelumnya (Idempotent).',
            transaction: {
              transaction_id: existingSlot[0],
              warehouse_id: existingSlot[2],
              tanggal: existingSlot[5],
              location_name: existingSlot[8],
              period_label: existingSlot[10],
              suhu: parseFloat(existingSlot[11]),
              status_suhu: existingSlot[13],
              drive_view_url: existingSlot[21]
            }
          },
          { status: 200 }
        );
      }

      return NextResponse.json(
        {
          error: `Data suhu untuk lokasi ${locationNameSnapshot} pada jam ${periodLabelSnapshot} sudah terisi. Silakan hubungi Admin jika diperlukan perubahan data.`
        },
        { status: 409 }
      );
    }

    // 6. Upload Photo to Google Drive inside warehouse folder (PRD 11.1 & 11.2)
    const year = tanggal.slice(0, 4);
    const month = tanggal.slice(5, 7);
    const cleanDate = tanggal; // YYYY-MM-DD
    const cleanLoc = locationNameSnapshot.replace(/[^0-9a-zA-Z]/g, '');
    const cleanJam = periodLabelSnapshot.replace(/[^0-9.]/g, ''); // e.g. "09.00"
    const driveFileName = `${cleanDate}_${cleanLoc}_${cleanJam}.jpg`;

    const uploadResult = await uploadPhotoToDrive({
      fileName: driveFileName,
      base64Data: photo_base64,
      year,
      month,
      warehouseFolderName
    });

    // 7. Evaluate Temperature Status (BR-07)
    const isOverLimit = numericSuhu > maxTempLimit;
    const statusSuhu = isOverLimit ? 'MELEBIHI_BATAS' : 'NORMAL';

    const nowISO = formatJakartaISO();
    const dateCompact = tanggal.replace(/-/g, '');
    const transactionId = `TX-${dateCompact}-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const tahunBulan = tanggal.slice(0, 7);
    const clientCapturedTime = client_captured_at || nowISO;
    const gps = gps_coordinates || '';

    // 8. WhatsApp Alert (PRD 13.2, 13.3, 13.4 & FR-014)
    let waNotifId = '';
    let waNotifStatus: 'NOT_REQUIRED' | 'PENDING' | 'SENT' | 'FAILED' = 'NOT_REQUIRED';
    let waErrorMessage = '';
    let waSentAt = '';

    if (isOverLimit && waEnabled) {
      waNotifId = `WA-${transactionId}`;

      if (is_batch) {
        waNotifStatus = 'PENDING';
      } else {
        const appBaseUrl = req.nextUrl?.origin || 'http://localhost:3000';

        const waResult = await sendWhatsAppAlert({
          notifId: waNotifId,
          tanggal,
          locationName: locationNameSnapshot,
          periodLabel: periodLabelSnapshot,
          suhu: numericSuhu,
          maxLimit: maxTempLimit,
          driveFileId: uploadResult.fileId,
          appBaseUrl,
          warehouseCode,
          warehouseName
        });

        waNotifStatus = waResult.status;
        waErrorMessage = waResult.errorMessage || '';
        waSentAt = waResult.sentAt || '';
      }
    }

    // 9. Prepare Database Row (PRD 10.7: 28 Columns)
    const newTransactionRow = [
      transactionId,
      idempotency_key,
      warehouseId,
      warehouseCode,
      warehouseName,
      tanggal,
      tahunBulan,
      location_id,
      locationNameSnapshot,
      period_id,
      periodLabelSnapshot,
      numericSuhu, // RAW number
      maxTempLimit,
      statusSuhu,
      session.user_id,
      session.full_name,
      clientCapturedTime,
      nowISO,
      gps,
      uploadResult.fileId,
      uploadResult.fileName,
      uploadResult.viewUrl,
      waNotifId,
      waNotifStatus,
      waErrorMessage,
      waSentAt,
      session.username,
      nowISO
    ];

    // PRD 15.1 item 1: Pre-write double check before appending to Sheets
    const currentTxRows = await getSheetValues('TRANSAKSI_SUHU!A2:AB');
    const duplicatePreWrite = currentTxRows.find(
      r => r[2] === warehouseId && r[5] === tanggal && r[7] === location_id && r[9] === period_id
    );

    if (duplicatePreWrite) {
      if (duplicatePreWrite[1] === idempotency_key) {
        return NextResponse.json({
          success: true,
          message: 'Transaksi sudah pernah disimpan sebelumnya (Idempotent).',
          transaction: {
            transaction_id: duplicatePreWrite[0],
            warehouse_id: duplicatePreWrite[2],
            tanggal: duplicatePreWrite[5],
            location_name: duplicatePreWrite[8],
            period_label: duplicatePreWrite[10],
            suhu: parseFloat(duplicatePreWrite[11]),
            status_suhu: duplicatePreWrite[13],
            drive_view_url: duplicatePreWrite[21]
          }
        }, { status: 200 });
      }

      return NextResponse.json(
        {
          error: `Data suhu untuk lokasi ${locationNameSnapshot} pada jam ${periodLabelSnapshot} sudah terisi. Silakan hubungi Admin jika diperlukan perubahan data.`
        },
        { status: 409 }
      );
    }

    // 10. Append Row to TRANSAKSI_SUHU
    await appendSheetValues('TRANSAKSI_SUHU!A:AB', [newTransactionRow], 'RAW');

    // PRD 15.1 item 2: Post-write verification & deterministic deduplication
    const postWriteRows = await getSheetValues('TRANSAKSI_SUHU!A2:AB');
    const matchingRows = postWriteRows
      .map((r, idx) => ({ row: r, sheetIndex: idx + 2 }))
      .filter(({ row }) => row[2] === warehouseId && row[5] === tanggal && row[7] === location_id && row[9] === period_id && row[0] !== '');

    if (matchingRows.length > 1) {
      const earliest = matchingRows[0];
      if (earliest.row[0] !== transactionId) {
        const ourRow = matchingRows.find(m => m.row[0] === transactionId);
        if (ourRow) {
          const emptyRow = new Array(28).fill('');
          await updateSheetValues(`TRANSAKSI_SUHU!A${ourRow.sheetIndex}:AB${ourRow.sheetIndex}`, [emptyRow], 'RAW');
        }

        return NextResponse.json(
          {
            error: `Data suhu untuk lokasi ${locationNameSnapshot} pada jam ${periodLabelSnapshot} sudah terisi. Silakan hubungi Admin jika diperlukan perubahan data.`
          },
          { status: 409 }
        );
      }
    }

    // 11. Record Audit Log (FR-015)
    await recordAuditLog({
      actor_user_id: session.user_id,
      actor_username: session.username,
      actor_role: session.role,
      action_category: 'TX_CREATE',
      warehouse_id: warehouseId,
      target_reference: transactionId,
      after_value: {
        transaction_id: transactionId,
        warehouse_id: warehouseId,
        warehouse_code: warehouseCode,
        tanggal,
        location_id,
        location_name: locationNameSnapshot,
        period_id,
        period_label: periodLabelSnapshot,
        suhu: numericSuhu,
        status_suhu: statusSuhu,
        drive_file_id: uploadResult.fileId,
        wa_notif_status: waNotifStatus
      },
      notes_or_reason: `Input suhu baru: ${warehouseCode} - ${locationNameSnapshot} (${numericSuhu}°C, ${statusSuhu}, WA: ${waNotifStatus})`
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Data suhu dan foto bukti berhasil disimpan.',
        transaction: {
          transaction_id: transactionId,
          warehouse_id: warehouseId,
          warehouse_code: warehouseCode,
          warehouse_name: warehouseName,
          tanggal,
          location_id,
          location_name: locationNameSnapshot,
          period_id,
          period_label: periodLabelSnapshot,
          suhu: numericSuhu,
          status_suhu: statusSuhu,
          petugas_name: session.full_name,
          drive_view_url: uploadResult.viewUrl,
          wa_notif_status: waNotifStatus,
          wa_error_message: waErrorMessage
        }
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error in POST /api/transactions:', error);
    return NextResponse.json(
      { error: 'Gagal menyimpan transaksi: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
