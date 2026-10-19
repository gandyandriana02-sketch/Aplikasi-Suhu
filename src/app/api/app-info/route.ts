import { NextResponse } from 'next/server';
import { getSheetValues } from '@/lib/google-sheets';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rows = await getSheetValues('SETTINGS!A2:C');
    const appNameRow = rows.find(r => r[0] === 'GLOBAL' && r[1] === 'app_name');
    const appIconRow = rows.find(r => r[0] === 'GLOBAL' && r[1] === 'app_icon');
    return NextResponse.json({
      app_name: appNameRow?.[2] || 'Warehouse Temperature',
      app_icon: appIconRow?.[2] || 'thermometer'
    });
  } catch {
    return NextResponse.json({
      app_name: 'Warehouse Temperature',
      app_icon: 'thermometer'
    });
  }
}
