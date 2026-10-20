import { NextResponse } from 'next/server';
import { getSheetValues } from '@/lib/google-sheets';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rows = await getSheetValues('SETTINGS!A2:C');
    const appNameRow = rows.find(r => r[0] === 'GLOBAL' && r[1] === 'app_name');
    const appIconRow = rows.find(r => r[0] === 'GLOBAL' && r[1] === 'app_icon');
    const idleRow = rows.find(r => r[0] === 'GLOBAL' && r[1] === 'idle_timeout_minutes');
    const idle_timeout_minutes = idleRow?.[2] ? parseInt(idleRow[2], 10) || 0 : 0;
    return NextResponse.json({
      app_name: appNameRow?.[2] || 'Warehouse Temperature',
      app_icon: appIconRow?.[2] || 'thermometer',
      idle_timeout_minutes
    });
  } catch {
    return NextResponse.json({
      app_name: 'Warehouse Temperature',
      app_icon: 'thermometer',
      idle_timeout_minutes: 0
    });
  }
}
