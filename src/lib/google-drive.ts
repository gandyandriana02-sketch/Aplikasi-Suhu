import { getGoogleAccessToken } from './google-sheets';

const ROOT_FOLDER_ID = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;

const INDONESIAN_MONTH_NAMES: Record<string, string> = {
  '01': '01 - Januari',
  '02': '02 - Februari',
  '03': '03 - Maret',
  '04': '04 - April',
  '05': '05 - Mei',
  '06': '06 - Juni',
  '07': '07 - Juli',
  '08': '08 - Agustus',
  '09': '09 - September',
  '10': '10 - Oktober',
  '11': '11 - November',
  '12': '12 - Desember'
};

export function getIndonesianMonthFolderName(monthTwoDigits: string): string {
  return INDONESIAN_MONTH_NAMES[monthTwoDigits] || `${monthTwoDigits} - Bulan`;
}

// Search for a folder with given name inside parent folder
export async function findDriveFolder(name: string, parentId: string): Promise<string | null> {
  const token = await getGoogleAccessToken();
  const q = encodeURIComponent(
    `'${parentId}' in parents and name = '${name}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
  );
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&supportsAllDrives=true&includeItemsFromAllDrives=true&fields=files(id,name)`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gagal mencari folder di Google Drive: ${errText}`);
  }

  const data = await res.json();
  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }
  return null;
}

// Create a folder in Google Drive
export async function createDriveFolder(name: string, parentId: string): Promise<string> {
  const token = await getGoogleAccessToken();
  const res = await fetch('https://www.googleapis.com/drive/v3/files?supportsAllDrives=true', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId]
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gagal membuat folder di Google Drive (${name}): ${errText}`);
  }

  const data = await res.json();
  return data.id;
}

// Ensure hierarchy: ROOT_FOLDER / [warehouseFolderName] / YYYY / MM - NamaBulan (PRD 11.1)
export async function getOrCreateTargetMonthFolder(
  year: string,
  month: string,
  warehouseFolderName?: string
): Promise<string> {
  if (!ROOT_FOLDER_ID) {
    throw new Error('GOOGLE_DRIVE_ROOT_FOLDER_ID belum dikonfigurasi di Environment Variables.');
  }

  let baseFolderId = ROOT_FOLDER_ID;

  // 1. If warehouse folder name is specified, find or create under root
  if (warehouseFolderName) {
    let whFolderId = await findDriveFolder(warehouseFolderName, ROOT_FOLDER_ID);
    if (!whFolderId) {
      whFolderId = await createDriveFolder(warehouseFolderName, ROOT_FOLDER_ID);
    }
    baseFolderId = whFolderId;
  }

  // 2. Find or create Year folder (e.g. "2026") inside warehouse folder (or root)
  let yearFolderId = await findDriveFolder(year, baseFolderId);
  if (!yearFolderId) {
    yearFolderId = await createDriveFolder(year, baseFolderId);
  }

  // 3. Find or create Month folder (e.g. "10 - Oktober") inside Year folder
  const monthFolderName = getIndonesianMonthFolderName(month);
  let monthFolderId = await findDriveFolder(monthFolderName, yearFolderId);
  if (!monthFolderId) {
    monthFolderId = await createDriveFolder(monthFolderName, yearFolderId);
  }

  return monthFolderId;
}

export interface UploadPhotoParams {
  fileName: string;
  base64Data: string; // "data:image/jpeg;base64,..." or pure base64
  year: string; // "2026"
  month: string; // "10"
  warehouseFolderName?: string; // e.g. "CK01 — Cikupa 1"
}

export interface UploadPhotoResult {
  fileId: string;
  fileName: string;
  viewUrl: string;
}

// Uploads photo to target month folder and sets view permission
export async function uploadPhotoToDrive(params: UploadPhotoParams): Promise<UploadPhotoResult> {
  const token = await getGoogleAccessToken();
  const targetFolderId = await getOrCreateTargetMonthFolder(
    params.year,
    params.month,
    params.warehouseFolderName
  );

  // Clean base64 string
  const cleanBase64 = params.base64Data.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
  const imageBuffer = Buffer.from(cleanBase64, 'base64');

  // Multipart upload payload
  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadata = {
    name: params.fileName,
    parents: [targetFolderId]
  };

  const multipartBody = Buffer.concat([
    Buffer.from(
      delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: image/jpeg\r\n' +
        'Content-Transfer-Encoding: base64\r\n\r\n'
    ),
    Buffer.from(imageBuffer.toString('base64')),
    Buffer.from(closeDelimiter)
  ]);

  const uploadRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`
      },
      body: multipartBody
    }
  );

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error(`Gagal mengunggah foto ke Google Drive: ${errText}`);
  }

  const fileData = await uploadRes.json();
  const fileId = fileData.id;

  // Make file viewable by link
  try {
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions?supportsAllDrives=true`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone'
      })
    });
  } catch (permErr) {
    console.warn('Warning setting file public view permission:', permErr);
  }

  const viewUrl = `https://drive.google.com/file/d/${fileId}/view`;

  return {
    fileId,
    fileName: params.fileName,
    viewUrl
  };
}

/**
 * Updates an existing photo in Google Drive as a new version (Manage Versions).
 * Keeps the old version forever in Google Drive version history (keepRevisionForever=true)
 * without creating duplicate files in the folder (PRD v1.6).
 */
export async function updatePhotoVersionInDrive(params: {
  fileId: string;
  base64Data: string;
}): Promise<{ fileId: string; viewUrl: string }> {
  const token = await getGoogleAccessToken();

  let cleanBase64 = params.base64Data;
  if (cleanBase64.includes(',')) {
    cleanBase64 = cleanBase64.split(',')[1];
  }
  const imageBuffer = Buffer.from(cleanBase64, 'base64');

  const uploadRes = await fetch(
    `https://www.googleapis.com/upload/drive/v3/files/${params.fileId}?uploadType=media&supportsAllDrives=true&keepRevisionForever=true`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'image/jpeg'
      },
      body: imageBuffer
    }
  );

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error(`Gagal memperbarui versi foto di Google Drive: ${errText}`);
  }

  const fileData = await uploadRes.json();
  const fileId = fileData.id;
  const viewUrl = `https://drive.google.com/file/d/${fileId}/view`;

  return {
    fileId,
    viewUrl
  };
}

/**
 * Deletes a file permanently from Google Drive (FR-012)
 */
export async function deleteFileFromDrive(fileId: string): Promise<boolean> {
  if (!fileId) return false;
  try {
    const token = await getGoogleAccessToken();
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?supportsAllDrives=true`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return res.ok || res.status === 404; // 404 means already deleted
  } catch (err) {
    console.warn(`[Google Drive] Error deleting file ${fileId}:`, err);
    return false;
  }
}
