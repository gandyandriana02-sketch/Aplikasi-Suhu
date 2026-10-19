import crypto from 'crypto';

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getGoogleAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expiresAt > now + 300) {
    return cachedToken.token;
  }

  if (!SERVICE_ACCOUNT_EMAIL || !PRIVATE_KEY) {
    throw new Error('Google Service Account credentials are not configured');
  }

  const iat = now;
  const exp = now + 3600;
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: SERVICE_ACCOUNT_EMAIL,
    scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive',
    aud: 'https://oauth2.googleapis.com/token',
    exp,
    iat
  };

  const b64 = (obj: any) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const unsignedToken = `${b64(header)}.${b64(claim)}`;

  const sign = crypto.createSign('RSA-SHA256');
  sign.update(unsignedToken);
  sign.end();
  const signature = sign.sign(PRIVATE_KEY, 'base64url');
  const jwt = `${unsignedToken}.${signature}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to obtain Google access token: ${errorText}`);
  }

  const data = await res.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: now + data.expires_in
  };

  return data.access_token;
}

export async function getSpreadsheetMetadata() {
  if (!SPREADSHEET_ID) throw new Error('GOOGLE_SHEET_ID is not configured');
  const token = await getGoogleAccessToken();
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}?fields=sheets.properties`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch spreadsheet metadata: ${errorText}`);
  }

  return await res.json();
}

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cacheStore = new Map<string, CacheEntry<any>>();

export function clearSheetCache() {
  cacheStore.clear();
}

export async function batchUpdateSpreadsheet(requests: any[]) {
  if (!SPREADSHEET_ID) throw new Error('GOOGLE_SHEET_ID is not configured');
  clearSheetCache();
  const token = await getGoogleAccessToken();
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ requests })
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed batchUpdate: ${errorText}`);
  }

  return await res.json();
}

export async function getSheetValues(range: string): Promise<any[][]> {
  if (!SPREADSHEET_ID) throw new Error('GOOGLE_SHEET_ID is not configured');
  const now = Date.now();
  const cacheKey = `single:${range}`;
  const cached = cacheStore.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  const token = await getGoogleAccessToken();
  const encodedRange = encodeURIComponent(range);
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodedRange}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to read sheet values for ${range}: ${errorText}`);
  }

  const data = await res.json();
  const values = data.values || [];
  cacheStore.set(cacheKey, { data: values, expiresAt: now + 10000 }); // 10s TTL
  return values;
}

export async function batchGetSheetValues(ranges: string[]): Promise<{ range: string; values: any[][] }[]> {
  if (!SPREADSHEET_ID) throw new Error('GOOGLE_SHEET_ID is not configured');
  const now = Date.now();
  const cacheKey = `batch:${ranges.join('|')}`;
  const cached = cacheStore.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  const token = await getGoogleAccessToken();
  const query = ranges.map(r => `ranges=${encodeURIComponent(r)}`).join('&');
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values:batchGet?${query}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed batchGet: ${errorText}`);
  }

  const data = await res.json();
  const result = (data.valueRanges || []).map((vr: any) => ({
    range: vr.range,
    values: vr.values || []
  }));
  cacheStore.set(cacheKey, { data: result, expiresAt: now + 10000 }); // 10s TTL
  return result;
}

export async function appendSheetValues(range: string, values: any[][], valueInputOption: 'RAW' | 'USER_ENTERED' = 'RAW') {
  if (!SPREADSHEET_ID) throw new Error('GOOGLE_SHEET_ID is not configured');
  clearSheetCache();
  const token = await getGoogleAccessToken();
  const encodedRange = encodeURIComponent(range);
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodedRange}:append?valueInputOption=${valueInputOption}&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values })
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to append sheet values for ${range}: ${errorText}`);
  }

  return await res.json();
}

export async function updateSheetValues(range: string, values: any[][], valueInputOption: 'RAW' | 'USER_ENTERED' = 'RAW') {
  if (!SPREADSHEET_ID) throw new Error('GOOGLE_SHEET_ID is not configured');
  clearSheetCache();
  const token = await getGoogleAccessToken();
  const encodedRange = encodeURIComponent(range);
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodedRange}?valueInputOption=${valueInputOption}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values })
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to update sheet values for ${range}: ${errorText}`);
  }

  return await res.json();
}

export async function clearSheetRange(range: string) {
  if (!SPREADSHEET_ID) throw new Error('GOOGLE_SHEET_ID is not configured');
  clearSheetCache();
  const token = await getGoogleAccessToken();
  const encodedRange = encodeURIComponent(range);
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodedRange}:clear`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to clear range ${range}: ${errorText}`);
  }

  return await res.json();
}

