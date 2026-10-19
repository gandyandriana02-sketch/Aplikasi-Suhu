'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface BottomNavProps {
  user?: {
    full_name?: string;
    role?: string;
  };
}

export function BottomNav({ user }: BottomNavProps) {
  const pathname = usePathname();

  const isAdmin = user?.role === 'ADMIN';
  const isDashboardActive = pathname === '/dashboard';
  const isFormActive = pathname === '/';
  const isReportsActive = pathname === '/reports';
  const isAdminActive = pathname === '/admin';

  return (
    <div
      className="apple-floating-bottom-island-wrap no-print"
      aria-label="Navigasi bawah melayang"
      style={{
        position: 'fixed',
        bottom: '24px',
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        zIndex: 100,
        pointerEvents: 'none',
        padding: '0 16px'
      }}
    >
      <nav
        style={{
          pointerEvents: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(255, 255, 255, 0.88)',
          backdropFilter: 'blur(25px)',
          WebkitBackdropFilter: 'blur(25px)',
          padding: '6px 10px',
          borderRadius: '34px',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.04)'
        }}
      >
        {/* 1. Dashboard */}
        <Link
          href="/dashboard"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '24px',
            fontSize: '12px',
            fontWeight: 600,
            color: isDashboardActive ? '#0071E3' : '#64748B',
            background: isDashboardActive ? '#E0F2FE' : 'transparent',
            textDecoration: 'none',
            transition: 'all 0.2s cubic-bezier(0.2, 0.9, 0.25, 1)'
          }}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
          <span>Dashboard</span>
        </Link>

        {/* 2. Catat Suhu */}
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '24px',
            fontSize: '12px',
            fontWeight: 600,
            color: isFormActive ? '#0071E3' : '#64748B',
            background: isFormActive ? '#E0F2FE' : 'transparent',
            textDecoration: 'none',
            transition: 'all 0.2s cubic-bezier(0.2, 0.9, 0.25, 1)'
          }}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" />
            <path d="M12 9v4" />
          </svg>
          <span>Catat Suhu</span>
        </Link>

        {/* 3. Rekap Bulanan (Hanya tampil jika role ADMIN) */}
        {isAdmin && (
          <Link
            href="/reports"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '24px',
              fontSize: '12px',
              fontWeight: 600,
              color: isReportsActive ? '#0071E3' : '#64748B',
              background: isReportsActive ? '#E0F2FE' : 'transparent',
              textDecoration: 'none',
              transition: 'all 0.2s cubic-bezier(0.2, 0.9, 0.25, 1)'
            }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>Rekap</span>
          </Link>
        )}

        {/* 4. Admin (hanya tampil jika role ADMIN) */}
        {isAdmin && (
          <Link
            href="/admin"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '24px',
              fontSize: '12px',
              fontWeight: 600,
              color: isAdminActive ? '#0071E3' : '#64748B',
              background: isAdminActive ? '#E0F2FE' : 'transparent',
              textDecoration: 'none',
              transition: 'all 0.2s cubic-bezier(0.2, 0.9, 0.25, 1)'
            }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <span>Admin</span>
          </Link>
        )}
      </nav>
    </div>
  );
}
