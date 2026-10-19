import { appendSheetValues } from './google-sheets';
import { formatJakartaISO } from './time';
import { AuditActionCategory, UserRole } from '@/types';

export interface RecordAuditParams {
  actor_user_id: string;
  actor_username: string;
  actor_role: UserRole;
  action_category: AuditActionCategory;
  warehouse_id?: string;
  target_reference: string;
  before_value?: any;
  after_value?: any;
  notes_or_reason?: string;
}

export async function recordAuditLog(params: RecordAuditParams) {
  try {
    const log_id = `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const server_timestamp = formatJakartaISO();
    const before_str = params.before_value !== undefined ? JSON.stringify(params.before_value) : '';
    const after_str = params.after_value !== undefined ? JSON.stringify(params.after_value) : '';
    const notes = params.notes_or_reason || '';
    const whId = params.warehouse_id || 'GLOBAL';

    const row = [
      log_id,
      server_timestamp,
      params.actor_user_id,
      params.actor_username,
      params.actor_role,
      params.action_category,
      whId,
      params.target_reference,
      before_str,
      after_str,
      notes
    ];

    await appendSheetValues('AUDIT_LOGS!A:K', [row], 'RAW');
  } catch (error) {
    // Audit failure shouldn't crash caller, but log to server console
    console.error('Failed to record audit log:', error);
  }
}
