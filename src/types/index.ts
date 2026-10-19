// PRD 10.1 - 10.8 Database Schema Types (v2.0 Multi-Warehouse)

export type UserRole = 'ADMIN' | 'MEMBER';

export interface User {
  user_id: string;
  username: string;
  password_hash: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  updated_by: string;
  default_warehouse_id?: string;
}

export interface Warehouse {
  warehouse_id: string;
  warehouse_code: string;
  warehouse_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  updated_by: string;
}

export interface UserWarehouseAccess {
  access_id: string;
  user_id: string;
  warehouse_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  updated_by: string;
}

export interface MasterLocation {
  location_id: string;
  warehouse_id?: string;
  location_name: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  updated_by: string;
}

export interface MasterPeriod {
  period_id: string;
  warehouse_id?: string;
  period_label: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  updated_by: string;
}

export interface SettingItem {
  warehouse_id?: string;
  setting_key: string;
  setting_value: string;
  description: string;
  updated_by: string;
  updated_at: string;
}

export interface AppSettings {
  warehouse_id?: string;
  app_name: string;
  max_temp_limit: number;
  lock_sunday: boolean;
  holiday_dates: string[];
  unlocked_dates: string[];
  wa_notification_enabled: boolean;
}

export type TemperatureStatus = 'NORMAL' | 'MELEBIHI_BATAS';
export type WaNotifStatus = 'NOT_REQUIRED' | 'PENDING' | 'SENT' | 'FAILED';

export interface TemperatureTransaction {
  transaction_id: string;
  idempotency_key: string;
  warehouse_id: string;
  warehouse_code_snapshot?: string;
  warehouse_name_snapshot?: string;
  tanggal: string; // YYYY-MM-DD
  tahun_bulan: string; // YYYY-MM
  location_id: string;
  location_name_snapshot: string;
  period_id: string;
  period_label_snapshot: string;
  suhu: number;
  max_limit_snapshot: number;
  status_suhu: TemperatureStatus;
  user_id: string;
  petugas_name: string;
  client_captured_at: string;
  server_received_at: string;
  gps_coordinates: string;
  drive_file_id: string;
  drive_file_name: string;
  drive_view_url: string;
  wa_notif_id: string;
  wa_notif_status: WaNotifStatus;
  wa_error_message: string;
  wa_sent_at: string;
  updated_by: string;
  updated_at: string;
}

export type AuditActionCategory =
  | 'AUTH_LOGIN'
  | 'TX_CREATE'
  | 'TX_UPDATE'
  | 'DATE_UNLOCK'
  | 'USER_MGMT'
  | 'MASTER_MGMT'
  | 'SETTING_CHANGE'
  | 'WA_RETRY'
  | 'WH_SWITCH'
  | 'WH_MGMT'
  | 'WH_ACCESS_MGMT';

export interface AuditLog {
  log_id: string;
  server_timestamp: string;
  actor_user_id: string;
  actor_username: string;
  actor_role: UserRole;
  action_category: AuditActionCategory;
  warehouse_id?: string;
  target_reference: string;
  before_value: string; // JSON String
  after_value: string; // JSON String
  notes_or_reason: string;
}

export interface AllowedWarehouseSummary {
  warehouse_id: string;
  warehouse_code: string;
  warehouse_name: string;
}

export interface AuthSessionPayload {
  user_id: string;
  username: string;
  full_name: string;
  role: UserRole;
  must_change_password?: boolean;
  active_warehouse_id?: string;
  default_warehouse_id?: string;
  allowed_warehouses?: AllowedWarehouseSummary[];
}
