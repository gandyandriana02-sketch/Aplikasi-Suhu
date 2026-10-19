'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

interface AppSidebarProps {
  user?: {
    full_name?: string;
    role?: string;
    user_id?: string;
    username?: string;
    active_warehouse_id?: string;
    allowed_warehouses?: Array<{ warehouse_id: string; warehouse_code: string; warehouse_name: string }>;
  };
  activeAdminTab?: string;
  onAdminTabChange?: (tab: string) => void;
}

export function AppSidebar({ user, activeAdminTab, onAdminTabChange }: AppSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [activeWarehouse, setActiveWarehouse] = useState<{
    warehouse_id: string;
    warehouse_code: string;
    warehouse_name: string;
  } | null>(null);

  const isAdmin = user?.role === 'ADMIN';
  const currentTab = activeAdminTab || searchParams.get('tab') || 'warehouses';

  // Find or fetch active warehouse
  useEffect(() => {
    if (user?.allowed_warehouses && user.allowed_warehouses.length > 0) {
      const active = user.allowed_warehouses.find(
        (w) => w.warehouse_id === user.active_warehouse_id
      ) || user.allowed_warehouses[0];
      if (active) {
        setActiveWarehouse(active);
        return;
      }
    }

    fetch('/api/warehouses')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.warehouses?.length > 0) {
          const match = data.warehouses.find(
            (w: any) => w.warehouse_id === data.active_warehouse_id
          ) || data.warehouses[0];
          setActiveWarehouse(match);
        }
      })
      .catch(() => {});
  }, [user]);

  async function handleLogout() {
    if (confirm('Apakah Anda yakin ingin keluar dari aplikasi?')) {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.replace('/login');
      router.refresh();
    }
  }

  // Active state helpers
  const isFormActive = pathname === '/';
  const isDashboardActive = pathname === '/dashboard';
  const isReportsActive = pathname === '/reports';
  const isAdminActive = pathname === '/admin';

  return (
    <>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '100%',
          padding: '16px 12px'
        }}
      >
        {/* Top Section: Navigation Links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Active Warehouse Card / Switcher Button */}
          <div
            style={{
              padding: '10px 12px',
              backgroundColor: 'var(--surface)',
              borderRadius: 'var(--radius-card)',
              border: '1px solid var(--line)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--ok)'
                  }}
                />
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink)' }}>
                  Warehouse Aktif
                </span>
              </div>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  color: 'var(--ink-muted)',
                  letterSpacing: '0.04em'
                }}
              >
                WIB (UTC+7)
              </span>
            </div>

            <div
              style={{
                width: '100%',
                padding: '6px 8px',
                backgroundColor: 'var(--surface-raised)',
                border: '1px solid var(--line)',
                borderRadius: 'var(--radius-control)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  backgroundColor: 'var(--primary)',
                  color: '#FFFFFF',
                  padding: '2px 5px',
                  borderRadius: '4px',
                  flexShrink: 0
                }}
              >
                {activeWarehouse?.warehouse_code || 'WH'}
              </span>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--ink)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {activeWarehouse?.warehouse_name || 'Memuat...'}
              </span>
            </div>
          </div>

          {/* 1. OPERATIONAL MENU */}
          <div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--ink-muted)',
                letterSpacing: '0.06em',
                padding: '0 8px 6px 8px',
                textTransform: 'uppercase'
              }}
            >
              Menu Operasional
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {/* Dashboard */}
              <Link
                href="/dashboard"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 10px',
                  borderRadius: 'var(--radius-control)',
                  textDecoration: 'none',
                  fontSize: '13px',
                  fontWeight: isDashboardActive ? 600 : 500,
                  color: isDashboardActive ? 'var(--primary)' : 'var(--ink)',
                  backgroundColor: isDashboardActive ? 'rgba(21, 101, 166, 0.08)' : 'transparent',
                  borderLeft: isDashboardActive ? '3px solid var(--primary)' : '3px solid transparent',
                  transition: 'background-color 0.15s ease'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isDashboardActive ? '2.2' : '1.8'} strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
                <span>Dashboard Suhu</span>
              </Link>

              {/* Form Catat Suhu */}
              <Link
                href="/"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 10px',
                  borderRadius: 'var(--radius-control)',
                  textDecoration: 'none',
                  fontSize: '13px',
                  fontWeight: isFormActive ? 600 : 500,
                  color: isFormActive ? 'var(--primary)' : 'var(--ink)',
                  backgroundColor: isFormActive ? 'rgba(21, 101, 166, 0.08)' : 'transparent',
                  borderLeft: isFormActive ? '3px solid var(--primary)' : '3px solid transparent',
                  transition: 'background-color 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isFormActive ? '2.2' : '1.8'} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" />
                    <path d="M12 9v4" />
                  </svg>
                  <span>Catat Suhu</span>
                </div>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    backgroundColor: 'var(--surface)',
                    color: 'var(--ink-muted)',
                    border: '1px solid var(--line)',
                    padding: '1px 5px',
                    borderRadius: '4px'
                  }}
                >
                  Hari Ini
                </span>
              </Link>

              {/* Rekap Bulanan */}
              <Link
                href="/reports"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 10px',
                  borderRadius: 'var(--radius-control)',
                  textDecoration: 'none',
                  fontSize: '13px',
                  fontWeight: isReportsActive ? 600 : 500,
                  color: isReportsActive ? 'var(--primary)' : 'var(--ink)',
                  backgroundColor: isReportsActive ? 'rgba(21, 101, 166, 0.08)' : 'transparent',
                  borderLeft: isReportsActive ? '3px solid var(--primary)' : '3px solid transparent',
                  transition: 'background-color 0.15s ease'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isReportsActive ? '2.2' : '1.8'} strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span>Rekap Bulanan</span>
              </Link>
            </nav>
          </div>

          {/* 2. ADMIN CONTROL SECTION (Visible only to Admin) */}
          {isAdmin && (
            <div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--ink-muted)',
                  letterSpacing: '0.06em',
                  padding: '0 8px 6px 8px',
                  textTransform: 'uppercase'
                }}
              >
                Pusat Kendali Admin
              </div>

              <nav style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {[
                  {
                    id: 'warehouses',
                    label: 'Master Warehouse',
                    icon: (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 21h18" />
                        <path d="M19 21V7l-7-4-7 4v14" />
                        <path d="M9 10h6" />
                        <path d="M9 14h6" />
                      </svg>
                    )
                  },
                  {
                    id: 'warehouse_access',
                    label: 'Akses Warehouse',
                    icon: (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <line x1="19" y1="8" x2="19" y2="14" />
                        <line x1="22" y1="11" x2="16" y2="11" />
                      </svg>
                    )
                  },
                  {
                    id: 'users',
                    label: 'Kelola Pengguna',
                    icon: (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                    )
                  },
                  {
                    id: 'master',
                    label: 'Titik & Jadwal Shift',
                    icon: (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    )
                  },
                  {
                    id: 'settings',
                    label: 'Pengaturan Suhu',
                    icon: (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                      </svg>
                    )
                  },
                  {
                    id: 'audit',
                    label: 'Log Audit Transaksi',
                    icon: (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                    )
                  },
                  {
                    id: 'notifications',
                    label: 'WhatsApp Gateway',
                    icon: (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
                      </svg>
                    )
                  }
                ].map((item) => {
                  const isTabActive = isAdminActive && currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        if (isAdminActive && onAdminTabChange) {
                          onAdminTabChange(item.id);
                        } else {
                          router.push(`/admin?tab=${item.id}`);
                        }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '9px 10px',
                        borderRadius: 'var(--radius-control)',
                        background: isTabActive ? 'rgba(21, 101, 166, 0.08)' : 'transparent',
                        border: 'none',
                        borderLeft: isTabActive ? '3px solid var(--primary)' : '3px solid transparent',
                        cursor: 'pointer',
                        textAlign: 'left',
                        width: '100%',
                        fontSize: '13px',
                        fontWeight: isTabActive ? 600 : 500,
                        color: isTabActive ? 'var(--primary)' : 'var(--ink)',
                        transition: 'background-color 0.15s ease'
                      }}
                    >
                      <span style={{ color: isTabActive ? 'var(--primary)' : 'var(--ink-muted)' }}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          )}
        </div>

        {/* Bottom Section: User Profile & Switcher & Logout */}
        <div
          style={{
            borderTop: '1px solid var(--line)',
            paddingTop: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          {user && (
            <div
              style={{
                padding: '8px 10px',
                backgroundColor: 'var(--surface)',
                borderRadius: 'var(--radius-control)',
                border: '1px solid var(--line)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '16px',
                  backgroundColor: user.role === 'ADMIN' ? '#1F2937' : 'var(--primary)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 700,
                  flexShrink: 0
                }}
              >
                {user.full_name ? user.full_name.slice(0, 2).toUpperCase() : 'WH'}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--ink)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {user.full_name}
                </div>
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: user.role === 'ADMIN' ? 'var(--primary)' : 'var(--ink-muted)'
                  }}
                >
                  {user.role === 'ADMIN' ? 'ADMINISTRATOR' : 'PETUGAS'}
                </div>
              </div>
            </div>
          )}

          {/* Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '9px 12px',
              borderRadius: 'var(--radius-control)',
              backgroundColor: 'transparent',
              border: '1px solid var(--line)',
              color: 'var(--over)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background-color 0.15s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--over-tint)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Keluar dari Aplikasi</span>
          </button>
        </div>
      </div>
    </>
  );
}
