import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getSheetValues, updateSheetValues } from '@/lib/google-sheets';
import { formatJakartaISO } from '@/lib/time';
import { uploadPhotoToDrive, updatePhotoVersionInDrive } from '@/lib/google-drive';
import { recordAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak. Hanya untuk Admin.' }, { status: 403 });
    }

    if (session.must_change_password) {
      return NextResponse.json(
        { error: 'Wajib mengganti password awal sebelum mengakses fitur admin.' },
        { status: 403 }
      );
    }

    const transactionId = params.id;
    if (!transactionId) {
      return NextResponse.json({ error: 'ID transaksi wajib disertakan.' }, { status: 400 });
    }

    const body = await req.json();
    const { suhu, photo_base64, reason } = body;

    // Reason is strictly mandatory per PRD approved decision OQ-01 & FR-012
    if (!reason || !reason.trim()) {
      return NextResponse.json(
        { error: 'Alasan perubahan data wajib diisi.' },
        { status: 400 }
      );
    }

    if (suhu === undefined && !photo_base64) {
      return NextResponse.json(
        { error: 'Suhu baru atau foto baru harus disertakan untuk perubahan data.' },
        { status: 400 }
      );
    }

    // Read TRANSAKSI_SUHU rows (Columns A:AB)
    const rows = await getSheetValues('TRANSAKSI_SUHU!A2:AB');
    const rowIndex = rows.findIndex(r => r[0] === transactionId);

    if (rowIndex === -1) {
      return NextResponse.json(
        { error: 'Transaksi tidak ditemukan.' },
        { status: 404 }
      );
    }

    const existingRow = rows[rowIndex];
    const sheetRowNum = rowIndex + 2;

    const warehouseId = existingRow[2] || 'WH-001';
    const warehouseCode = existingRow[3] || 'WH';
    const warehouseName = existingRow[4] || 'Warehouse';
    const tanggal = existingRow[5];
    const locationName = existingRow[8];
    const periodLabel = existingRow[10];
    const oldSuhu = parseFloat(existingRow[11]);
    const maxLimitSnapshot = parseFloat(existingRow[12]) || 30;
    const oldStatus = existingRow[13];
    const oldFileId = existingRow[19];
    const oldFileName = existingRow[20];
    const oldViewUrl = existingRow[21];

    let newNumericSuhu = oldSuhu;
    if (suhu !== undefined) {
      newNumericSuhu = typeof suhu === 'number' ? suhu : parseFloat(String(suhu).replace(',', '.'));
      if (isNaN(newNumericSuhu)) {
        return NextResponse.json({ error: 'Format angka suhu tidak valid.' }, { status: 400 });
      }
    }

    const newStatus = newNumericSuhu > maxLimitSnapshot ? 'MELEBIHI_BATAS' : 'NORMAL';

    let updatedFileId = oldFileId;
    let updatedFileName = oldFileName;
    let updatedViewUrl = oldViewUrl;

    // If new photo provided, update existing photo version in Google Drive (Manage Versions, PRD v1.6)
    if (photo_base64) {
      if (oldFileId) {
        const updateResult = await updatePhotoVersionInDrive({
          fileId: oldFileId,
          base64Data: photo_base64
        });
        updatedFileId = updateResult.fileId;
        updatedViewUrl = updateResult.viewUrl;
      } else {
        const year = tanggal.slice(0, 4);
        const month = tanggal.slice(5, 7);
        const cleanDate = tanggal;
        const cleanLoc = locationName.replace(/[^0-9a-zA-Z]/g, '');
        const cleanJam = periodLabel.replace(/[^0-9.]/g, '');
        const newFileName = `${cleanDate}_${cleanLoc}_${cleanJam}.jpg`;

        const uploadResult = await uploadPhotoToDrive({
          fileName: newFileName,
          base64Data: photo_base64,
          year,
          month,
          warehouseFolderName: `${warehouseCode} — ${warehouseName}`
        });

        updatedFileId = uploadResult.fileId;
        updatedFileName = uploadResult.fileName;
        updatedViewUrl = uploadResult.viewUrl;
      }
    }

    const nowISO = formatJakartaISO();

    // Update Suhu (Col L) & Status Suhu (Col N)
    await updateSheetValues(`TRANSAKSI_SUHU!L${sheetRowNum}`, [[newNumericSuhu]], 'RAW');
    await updateSheetValues(`TRANSAKSI_SUHU!N${sheetRowNum}`, [[newStatus]], 'RAW');

    // If photo updated, update Drive info (Cols T, U, V)
    if (photo_base64) {
      await updateSheetValues(
        `TRANSAKSI_SUHU!T${sheetRowNum}:V${sheetRowNum}`,
        [[updatedFileId, updatedFileName, updatedViewUrl]],
        'RAW'
      );
    }

    // Update updated_by (Col AA) & updated_at (Col AB)
    await updateSheetValues(
      `TRANSAKSI_SUHU!AA${sheetRowNum}:AB${sheetRowNum}`,
      [[session.username, nowISO]],
      'RAW'
    );

    // Record in AUDIT_LOGS (FR-015, FR-012)
    await recordAuditLog({
      actor_user_id: session.user_id,
      actor_username: session.username,
      actor_role: session.role,
      action_category: 'TX_UPDATE',
      warehouse_id: warehouseId,
      target_reference: transactionId,
      before_value: {
        suhu: oldSuhu,
        status_suhu: oldStatus,
        drive_file_id: oldFileId,
        drive_view_url: oldViewUrl
      },
      after_value: {
        suhu: newNumericSuhu,
        status_suhu: newStatus,
        drive_file_id: updatedFileId,
        drive_view_url: updatedViewUrl
      },
      notes_or_reason: reason.trim()
    });

    return NextResponse.json({
      success: true,
      message: 'Transaksi berhasil diperbarui.',
      transaction: {
        transaction_id: transactionId,
        warehouse_id: warehouseId,
        warehouse_code: warehouseCode,
        warehouse_name: warehouseName,
        suhu: newNumericSuhu,
        status_suhu: newStatus,
        drive_view_url: updatedViewUrl,
        updated_by: session.username,
        updated_at: nowISO
      }
    });
  } catch (error: any) {
    console.error('Error PUT /api/transactions/[id]:', error);
    return NextResponse.json(
      { error: 'Gagal memperbarui transaksi: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
