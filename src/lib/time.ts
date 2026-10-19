// NFR-03: Semua penentuan waktu resmi server menggunakan Asia/Jakarta (WIB, UTC+7)

export function getNowJakarta(): Date {
  const now = new Date();
  return now;
}

export function formatJakartaISO(date = new Date()): string {
  // Format to ISO 8601 string in Asia/Jakarta timezone (+07:00)
  const tzOffset = 7 * 60; // in minutes
  const localTime = new Date(date.getTime() + tzOffset * 60 * 1000);
  const iso = localTime.toISOString().replace('Z', '+07:00');
  return iso;
}

export function getTodayDateStringJakarta(date = new Date()): string {
  // Returns YYYY-MM-DD in Asia/Jakarta
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  };
  const formatter = new Intl.DateTimeFormat('en-CA', options); // en-CA outputs YYYY-MM-DD
  return formatter.format(date);
}

export function getYearMonthStringJakarta(date = new Date()): string {
  // Returns YYYY-MM
  const full = getTodayDateStringJakarta(date);
  return full.slice(0, 7);
}
