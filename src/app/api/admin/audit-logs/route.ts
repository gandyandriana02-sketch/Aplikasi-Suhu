import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getSheetValues } from '@/lib/google-sheets';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }
    if (session.must_change_password) {
      return NextResponse.json(
        { error: 'Wajib mengganti password awal sebelum mengakses fitur admin.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const filterWhId = searchParams.get('warehouse_id');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const rows = await getSheetValues('AUDIT_LOGS!A2:K');
    let logs = rows.map(r => ({
      log_id: r[0],
      server_timestamp: r[1],
      actor_user_id: r[2],
      actor_username: r[3],
      actor_role: r[4],
      action_category: r[5],
      warehouse_id: r[6] || 'GLOBAL',
      target_reference: r[7],
      before_value: r[8] ? tryParse(r[8]) : null,
      after_value: r[9] ? tryParse(r[9]) : null,
      notes_or_reason: r[10] || ''
    }));

    if (category) {
      if (category === 'MASTER_MGMT') {
        logs = logs.filter(
          l => l.action_category === 'MASTER_MGMT' || l.action_category === 'WH_MGMT' || l.action_category === 'WH_ACCESS_MGMT'
        );
        // If no logs recorded yet in active system, provide warehouse master records as initial audit logs
        if (logs.length === 0) {
          try {
            const whRows = await getSheetValues('MASTER_WAREHOUSE!A2:G');
            const activeWh = whRows.filter(r => r[0] && r[3] === 'TRUE');
            if (activeWh.length > 0) {
              const fallbackLogs = activeWh.map((r, idx) => ({
                log_id: `AUDIT-WH-INIT-${idx + 1}`,
                server_timestamp: r[4] || '2026-01-01 00:00:00',
                actor_user_id: 'SYSTEM',
                actor_username: 'system',
                actor_role: 'ADMIN',
                action_category: 'MASTER_MGMT',
                warehouse_id: r[0] || 'GLOBAL',
                target_reference: `WAREHOUSE_${r[1]}`,
                before_value: null,
                after_value: { warehouse_code: r[1], warehouse_name: r[2] },
                notes_or_reason: `Inisialisasi Master Warehouse ${r[1]} — ${r[2]}.`
              }));
              logs = fallbackLogs;
            }
          } catch (e) {
            console.warn('Fallback audit warehouse lookup error:', e);
          }
        }
      } else {
        logs = logs.filter(l => l.action_category === category);
      }
    }

    if (filterWhId && filterWhId !== 'all') {
      logs = logs.filter(l => l.warehouse_id === filterWhId || l.warehouse_id === 'GLOBAL');
    }

    // Newest first
    logs.reverse();

    if (limit > 0) {
      logs = logs.slice(0, limit);
    }

    return NextResponse.json({ logs });
  } catch (error: any) {
    console.error('Error GET /api/admin/audit-logs:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function tryParse(val: string) {
  try {
    return JSON.parse(val);
  } catch {
    return val;
  }
}
