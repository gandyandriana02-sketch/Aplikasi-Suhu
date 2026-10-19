import { NextResponse } from 'next/server';
import { deleteSessionCookie } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST() {
  deleteSessionCookie();
  return NextResponse.json({
    success: true,
    message: 'Sesi login telah dihapus.'
  });
}
