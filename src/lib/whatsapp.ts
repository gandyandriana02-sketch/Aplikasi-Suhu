import { formatJakartaISO } from '@/lib/time';

const MONTH_NAMES_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember'
];

/**
 * Format YYYY-MM-DD into Indonesian date string: DD NamaBulan YYYY (PRD 13.3)
 */
export function formatIndonesianDate(dateStr: string): string {
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const day = parseInt(parts[2], 10);
      const monthIdx = parseInt(parts[1], 10) - 1;
      const year = parts[0];
      if (monthIdx >= 0 && monthIdx < 12) {
        return `${day} ${MONTH_NAMES_ID[monthIdx]} ${year}`;
      }
    }
  } catch {
    // fallback if parse fails
  }
  return dateStr;
}

/**
 * Format decimal numbers to Indonesian standard comma: 31.5 -> 31,5; 33 -> 33,0 (PRD 13.3)
 */
export function formatDecimalComma(num: number): string {
  if (typeof num !== 'number' || isNaN(num)) return '0,0';
  const str = Number.isInteger(num) ? num.toFixed(1) : String(num);
  return str.replace('.', ',');
}

/**
 * Returns dynamic Indonesian greeting based on period label or Jakarta time:
 * - 09.00 / < 11.00 -> 'Selamat pagi'
 * - 13.00 / 11.00 - 14.59 -> 'Selamat siang'
 * - 17.00 / >= 15.00 -> 'Selamat sore'
 */
export function getIndonesianGreeting(periodLabel?: string): string {
  if (periodLabel) {
    const clean = periodLabel.replace(/[^0-9]/g, '');
    const hour = parseInt(clean.substring(0, 2), 10);
    if (!isNaN(hour)) {
      if (hour < 11) return 'Selamat pagi';
      if (hour < 15) return 'Selamat siang';
      return 'Selamat sore';
    }
  }

  try {
    const nowJakartaHour = parseInt(
      new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Jakarta',
        hour: 'numeric',
        hour12: false
      }).format(new Date()),
      10
    );
    if (nowJakartaHour < 11) return 'Selamat pagi';
    if (nowJakartaHour < 15) return 'Selamat siang';
    return 'Selamat sore';
  } catch {
    return 'Selamat siang';
  }
}

export interface WhatsAppAlertParams {
  notifId: string;
  tanggal: string; // YYYY-MM-DD
  locationName: string;
  periodLabel: string;
  suhu: number;
  maxLimit: number;
  driveFileId: string;
  appBaseUrl?: string;
  warehouseCode?: string;
  warehouseName?: string;
}

export interface BatchAlertItem {
  locationName: string;
  suhu: number;
  driveFileId: string;
}

export interface WhatsAppBatchAlertParams {
  notifId?: string;
  tanggal: string;
  periodLabel: string;
  maxLimit: number;
  items: BatchAlertItem[];
  appBaseUrl?: string;
  warehouseCode?: string;
  warehouseName?: string;
}

export interface WhatsAppSendResult {
  success: boolean;
  notifId: string;
  status: 'SENT' | 'FAILED';
  errorMessage?: string;
  sentAt?: string;
}

/**
 * Builds the streamlined single-location message template (PRD v2.0 Bagian 13.3)
 */
export function buildWhatsAppAlertMessage(params: WhatsAppAlertParams): string {
  const greeting = getIndonesianGreeting(params.periodLabel);
  const tanggalId = formatIndonesianDate(params.tanggal);
  const suhuStr = formatDecimalComma(params.suhu);
  const limitStr = Number.isInteger(params.maxLimit) ? String(params.maxLimit) : formatDecimalComma(params.maxLimit);

  const baseUrl = (
    params.appBaseUrl ||
    process.env.APP_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'http://localhost:3000'
  ).replace(/\/+$/, '');

  const drivePhotoUrl = `https://drive.google.com/file/d/${params.driveFileId}/view`;
  const whLabel = params.warehouseCode && params.warehouseName
    ? `${params.warehouseCode} — ${params.warehouseName}`
    : (params.warehouseName || params.warehouseCode || 'Warehouse');

  return [
    '*PERINGATAN SUHU WAREHOUSE*',
    `Warehouse: ${whLabel}`,
    '',
    `${greeting}, update suhu per ${tanggalId} pukul ${params.periodLabel}. Ada 1 lokasi yang suhunya di atas batas ${limitStr}°C:`,
    '',
    `1. ${params.locationName}: ${suhuStr}°C`,
    '',
    'Foto bukti:',
    `- Peninjau Aplikasi: ${baseUrl}/dashboard`,
    `- Google Drive: ${drivePhotoUrl}`,
    '',
    `Aplikasi: ${baseUrl}/dashboard`
  ].join('\n');
}

/**
 * Builds the batch summary message template (PRD v2.0 Bagian 13.3)
 */
export function buildWhatsAppBatchAlertMessage(params: WhatsAppBatchAlertParams): string {
  const greeting = getIndonesianGreeting(params.periodLabel);
  const tanggalId = formatIndonesianDate(params.tanggal);
  const limitStr = Number.isInteger(params.maxLimit) ? String(params.maxLimit) : formatDecimalComma(params.maxLimit);
  const count = params.items.length;

  const baseUrl = (
    params.appBaseUrl ||
    process.env.APP_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'http://localhost:3000'
  ).replace(/\/+$/, '');

  const whLabel = params.warehouseCode && params.warehouseName
    ? `${params.warehouseCode} — ${params.warehouseName}`
    : (params.warehouseName || params.warehouseCode || 'Warehouse');

  const lines: string[] = [
    '*PERINGATAN SUHU WAREHOUSE*',
    `Warehouse: ${whLabel}`,
    '',
    `${greeting}, update suhu per ${tanggalId} pukul ${params.periodLabel}. Ada ${count} lokasi yang suhunya di atas batas ${limitStr}°C:`,
    ''
  ];

  // Numbered list
  params.items.forEach((item, idx) => {
    lines.push(`${idx + 1}. ${item.locationName}: ${formatDecimalComma(item.suhu)}°C`);
  });

  lines.push('');
  lines.push('Foto bukti:');
  params.items.forEach((item) => {
    lines.push(`- ${item.locationName}: https://drive.google.com/file/d/${item.driveFileId}/view`);
  });

  lines.push('');
  lines.push(`Aplikasi: ${baseUrl}/dashboard`);

  return lines.join('\n');
}

/**
 * Sends a WhatsApp alert message to the warehouse group via Fonnte API (PRD 13.4).
 * Enforces a strict 3000ms timeout so slow responses never delay transaction persistence.
 */
export async function sendWhatsAppAlert(params: WhatsAppAlertParams): Promise<WhatsAppSendResult> {
  const notifId = params.notifId;
  const message = buildWhatsAppAlertMessage(params);
  return dispatchFonnteMessage(notifId, message);
}

/**
 * Sends a batch summary alert message to the warehouse group via Fonnte API (PRD v1.5).
 */
export async function sendWhatsAppBatchAlert(params: WhatsAppBatchAlertParams): Promise<WhatsAppSendResult> {
  const notifId = params.notifId || `WA-BATCH-${Date.now()}`;
  const message = buildWhatsAppBatchAlertMessage(params);
  return dispatchFonnteMessage(notifId, message);
}

/**
 * Internal helper to send message string to Fonnte API
 */
async function dispatchFonnteMessage(notifId: string, message: string): Promise<WhatsAppSendResult> {
  const token = (process.env.FONNTE_API_TOKEN || '').trim().replace(/^["']|["']$/g, '');
  const target = (process.env.FONNTE_WA_GROUP_ID || '').trim().replace(/^["']|["']$/g, '');

  if (!token || !target) {
    return {
      success: false,
      notifId,
      status: 'FAILED',
      errorMessage: 'Kredensial Fonnte (FONNTE_API_TOKEN / FONNTE_WA_GROUP_ID) belum dikonfigurasi.'
    };
  }

  try {
    const formData = new FormData();
    formData.append('target', target);
    formData.append('message', message);
    formData.append('countryCode', '62');

    // Strict 3-second timeout per PRD 13.4 & 14.5
    const res = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        Authorization: token
      },
      body: formData,
      signal: AbortSignal.timeout(3000)
    });

    const data = await res.json().catch(() => null);

    if (res.ok && data && (data.status === true || data.status === 'true')) {
      return {
        success: true,
        notifId,
        status: 'SENT',
        sentAt: formatJakartaISO()
      };
    }

    const failureReason =
      data?.reason ||
      data?.message ||
      (data ? JSON.stringify(data) : `HTTP ${res.status}: Gagal mengirim pesan`);

    return {
      success: false,
      notifId,
      status: 'FAILED',
      errorMessage: failureReason
    };
  } catch (err: unknown) {
    const error = err as { name?: string; message?: string };
    const isTimeout =
      error?.name === 'TimeoutError' ||
      error?.message?.toLowerCase().includes('timeout') ||
      error?.name === 'AbortError';

    const errorMessage = isTimeout
      ? 'Fonnte Gateway Timeout (3s)'
      : error?.message || 'Gagal koneksi ke Fonnte';

    return {
      success: false,
      notifId,
      status: 'FAILED',
      errorMessage
    };
  }
}
