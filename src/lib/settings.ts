/**
 * Settings Helper Library (PRD Section 10.6 & AGENTS.md)
 * Provides deterministic, hierarchical settings resolution:
 * 1. Base system defaults
 * 2. GLOBAL fallback settings (row.warehouse_id === 'GLOBAL')
 * 3. Warehouse-specific overrides (row.warehouse_id === targetWarehouseId)
 */

export interface WarehouseSettings {
  max_temp_limit: number;
  lock_sunday: boolean;
  holiday_dates: string[];
  unlocked_dates: string[];
  wa_notification_enabled: boolean;
  app_name: string;
  app_icon: string;
  signoff_maker_title: string;
  signoff_maker_name: string;
  signoff_checker_title: string;
  signoff_checker_name: string;
  signoff_approver_title: string;
  signoff_approver_name: string;
}

const DEFAULT_SETTINGS: WarehouseSettings = {
  max_temp_limit: 30,
  lock_sunday: true,
  holiday_dates: [],
  unlocked_dates: [],
  wa_notification_enabled: true,
  app_name: 'Warehouse Temperature Report',
  app_icon: 'thermometer',
  signoff_maker_title: 'Dibuat Oleh',
  signoff_maker_name: '',
  signoff_checker_title: 'Diperiksa Oleh',
  signoff_checker_name: 'Warehouse Leader',
  signoff_approver_title: 'Disetujui Oleh',
  signoff_approver_name: 'Warehouse Supervisor'
};

function applyRow(settings: WarehouseSettings, key: string, val: any) {
  if (!key) return;
  const k = key.trim();

  if (k === 'max_temp_limit') {
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) settings.max_temp_limit = num;
  } else if (k === 'lock_sunday') {
    settings.lock_sunday = String(val).toUpperCase() === 'TRUE';
  } else if (k === 'wa_notification_enabled') {
    settings.wa_notification_enabled = String(val).toUpperCase() === 'TRUE';
  } else if (k === 'holiday_dates' || k === 'unlocked_dates') {
    try {
      const parsed = typeof val === 'string' ? JSON.parse(val || '[]') : val;
      settings[k] = Array.isArray(parsed) ? parsed : [];
    } catch {
      settings[k] = [];
    }
  } else if (k === 'app_name') {
    if (val && String(val).trim()) settings.app_name = String(val).trim();
  } else if (k === 'app_icon') {
    if (val && String(val).trim()) settings.app_icon = String(val).trim();
  } else if (k in settings) {
    (settings as any)[k] = val != null ? String(val).trim() : '';
  }
}

/**
 * Deterministically parses rows from the SETTINGS sheet for a specific warehouse.
 * Resolves GLOBAL rows first, then applies warehouse-specific rows as overrides.
 */
export function parseWarehouseSettings(
  rows: any[][],
  warehouseId?: string,
  warehouseListRows?: any[][]
): WarehouseSettings {
  const result: WarehouseSettings = { ...DEFAULT_SETTINGS };

  if (!rows || rows.length === 0) {
    return result;
  }

  // 1. Process GLOBAL rows first (base overrides)
  const globalRows = rows.filter(r => r[0] === 'GLOBAL');
  for (const r of globalRows) {
    applyRow(result, r[1], r[2]);
  }

  // 2. Process warehouse-specific rows (strict overrides)
  if (warehouseId && warehouseId !== 'GLOBAL') {
    const cleanWh = warehouseId.trim().toUpperCase();

    // If master warehouse list is passed, resolve canonical ID
    let canonicalWh = cleanWh;
    if (warehouseListRows && warehouseListRows.length > 0) {
      const matchWh = warehouseListRows.find(w => 
        (w[0] && String(w[0]).trim().toUpperCase() === cleanWh) || 
        (w[1] && String(w[1]).trim().toUpperCase() === cleanWh)
      );
      if (matchWh && matchWh[0]) {
        canonicalWh = String(matchWh[0]).trim().toUpperCase();
      }
    }

    const whRows = rows.filter(r => {
      if (!r[0]) return false;
      const rowWh = String(r[0]).trim().toUpperCase();
      if (rowWh === cleanWh || rowWh === canonicalWh) return true;

      // Dynamic prefix matching (e.g. CK01 <-> WH-001, CK03 <-> WH-003, CK2 <-> WH-002)
      const numClean = cleanWh.match(/^(?:WH|CK)-?0*(\d+)$/)?.[1];
      const numRow = rowWh.match(/^(?:WH|CK)-?0*(\d+)$/)?.[1];
      if (numClean && numRow && numClean === numRow) return true;

      return false;
    });

    for (const r of whRows) {
      applyRow(result, r[1], r[2]);
    }
  }

  return result;
}
