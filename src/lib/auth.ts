import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { AuthSessionPayload } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET_KEY || 'default-insecure-secret-key-32chars!!';
const secretKey = new TextEncoder().encode(JWT_SECRET);
export const SESSION_COOKIE_NAME = 'wh_session';
export const SESSION_TTL_SECONDS = 12 * 60 * 60; // 12 hours (PRD 8.1 & 14)

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(payload: AuthSessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secretKey);
}

export async function verifySessionToken(token: string): Promise<AuthSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload as unknown as AuthSessionPayload;
  } catch {
    return null;
  }
}

export function setSessionCookie(token: string) {
  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS
  });
}

export function deleteSessionCookie() {
  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0
  });
}

export async function getSessionUser(req?: NextRequest): Promise<AuthSessionPayload | null> {
  let token: string | undefined;

  if (req) {
    token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  } else {
    try {
      const cookieStore = cookies();
      token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    } catch {
      return null;
    }
  }

  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * BR-10: Backend access validation to warehouse
 */
export function canAccessWarehouse(session: AuthSessionPayload, warehouseId: string): boolean {
  if (!warehouseId) return false;
  if (session.role === 'ADMIN') return true;
  return session.allowed_warehouses?.some(w => w.warehouse_id === warehouseId) ?? false;
}
