'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AppIcon } from './AppIcon';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user?: {
    full_name?: string;
    role?: string;
    user_id?: string;
    username?: string;
    active_warehouse_id?: string;
    allowed_warehouses?: Array<{ warehouse_id: string; warehouse_code: string; warehouse_name: string }>;
  };
  activeWarehouse?: {
    warehouse_id: string;
    warehouse_code: string;
    warehouse_name: string;
  } | null;
  appBranding?: {
    app_name: string;
    app_icon: string;
  };
  onOpenSwitchModal: () => void;
}

export function MobileDrawer({
  isOpen,
  onClose,
  user,
  activeWarehouse,
  appBranding = { app_name: 'Warehouse Temperature Report', app_icon: 'thermometer' },
  onOpenSwitchModal
}: MobileDrawerProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isAdmin = user?.role === 'ADMIN';
  const isDashboardActive = pathname === '/dashboard';
  const isFormActive = pathname === '/';
  const isReportsActive = pathname === '/reports';
  const isAdminActive = pathname === '/admin';

  async function handleLogout() {
    if (confirm('Apakah Anda yakin ingin keluar dari aplikasi?')) {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.replace('/login');
      router.refresh();
    }
  }

  const initials = user?.full_name
    ? user.full_name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'WH';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Menu Navigasi Samping"
      className="mobile-drawer-overlay no-print"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 1100,
        display: 'flex',
        animation: 'drawerFadeIn 0.22s ease-out'
      }}
    >
      <div
        className="mobile-drawer-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '320px',
          maxWidth: '85vw',
          height: '100%',
          backgroundColor: '#FFFFFF',
          boxShadow: '4px 0 30px rgba(0, 0, 0, 0.18)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          animation: 'drawerSlideFromLeft 0.26s cubic-bezier(0.16, 1, 0.3, 1)',
          overflowY: 'auto'
        }}
      >
        {/* Top Header & Navigation Links */}
        <div>
          {/* Drawer Brand Header */}
          <div
            style={{
              padding: '18px 20px',
              borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '11px',
                  background: 'linear-gradient(135deg, #0071E3 0%, #0284C7 100%)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0, 113, 227, 0.3)'
                }}
              >
                <AppIcon name={appBranding.app_icon || 'thermometer'} size={20} color="#FFFFFF" strokeWidth={2.2} />
              </div>
              <div>
                <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#1D1D1F', margin: 0, lineHeight: 1.15 }}>
                  {appBranding.app_name}
                </h2>
                <span style={{ fontSize: '10.5px', color: '#86868B', fontWeight: 600 }}>
                  Cold Chain Monitoring v3.0
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup menu"
              title="Tutup menu"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#F1F5F9',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748B',
                fontSize: '18px',
                lineHeight: 1
              }}
            >
              ×
            </button>
          </div>

          {/* Active Warehouse & Profile Widget */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(0, 0, 0, 0.05)', backgroundColor: '#F8FAFC' }}>
            {/* Active Warehouse Banner */}
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '12px',
                padding: '10px 12px',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <span
                  style={{
                    backgroundColor: '#0071E3',
                    color: '#FFFFFF',
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: '6px',
                    flexShrink: 0
                  }}
                >
                  {activeWarehouse?.warehouse_code || 'WH'}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {activeWarehouse?.warehouse_name || 'Warehouse Aktif'}
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#16A34A', display: 'inline-block' }} />
                    <span>WIB (Asia/Jakarta)</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSwitchModal();
                }}
                style={{
                  background: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  color: '#1D4ED8',
                  padding: '4px 8px',
                  borderRadius: '16px',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  flexShrink: 0
                }}
                title="Pindah ke warehouse lain"
              >
                Ganti ↗
              </button>
            </div>

            {/* User Profile Mini Snippet */}
            {user && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #0284C7 0%, #0071E3 100%)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 800,
                    flexShrink: 0
                  }}
                >
                  {initials}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user.full_name}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 500 }}>
                    @{user.username || 'user'} • <strong style={{ color: user.role === 'ADMIN' ? '#0071E3' : '#16A34A' }}>{user.role}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Operational Menu Navigation Links */}
          <div style={{ padding: '16px 12px' }}>
            <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.6px', padding: '0 8px 6px 8px', display: 'block' }}>
              Menu Operasional
            </span>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {/* 1. Dashboard */}
              <Link
                href="/dashboard"
                onClick={onClose}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  fontSize: '13.5px',
                  fontWeight: isDashboardActive ? 700 : 500,
                  color: isDashboardActive ? '#0071E3' : '#1E293B',
                  backgroundColor: isDashboardActive ? '#EFF6FF' : 'transparent',
                  borderLeft: isDashboardActive ? '3px solid #0071E3' : '3px solid transparent',
                  textDecoration: 'none',
                  transition: 'background-color 0.15s ease'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isDashboardActive ? '2.4' : '1.8'} strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
                <span>Dashboard Suhu</span>
              </Link>

              {/* 2. Catat Suhu */}
              <Link
                href="/"
                onClick={onClose}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  fontSize: '13.5px',
                  fontWeight: isFormActive ? 700 : 500,
                  color: isFormActive ? '#0071E3' : '#1E293B',
                  backgroundColor: isFormActive ? '#EFF6FF' : 'transparent',
                  borderLeft: isFormActive ? '3px solid #0071E3' : '3px solid transparent',
                  textDecoration: 'none',
                  transition: 'background-color 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isFormActive ? '2.4' : '1.8'} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" />
                    <path d="M12 9v4" />
                  </svg>
                  <span>Catat Suhu</span>
                </div>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    backgroundColor: '#F1F5F9',
                    color: '#64748B',
                    padding: '2px 6px',
                    borderRadius: '6px'
                  }}
                >
                  Hari Ini
                </span>
              </Link>

              {/* 3. Rekap Bulanan */}
              <Link
                href="/reports"
                onClick={onClose}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  fontSize: '13.5px',
                  fontWeight: isReportsActive ? 700 : 500,
                  color: isReportsActive ? '#0071E3' : '#1E293B',
                  backgroundColor: isReportsActive ? '#EFF6FF' : 'transparent',
                  borderLeft: isReportsActive ? '3px solid #0071E3' : '3px solid transparent',
                  textDecoration: 'none',
                  transition: 'background-color 0.15s ease'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isReportsActive ? '2.4' : '1.8'} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                <span>Rekap Bulanan</span>
              </Link>
            </nav>

            {/* Administrator Section */}
            {isAdmin && (
              <div style={{ marginTop: '20px' }}>
                <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.6px', padding: '0 8px 6px 8px', display: 'block' }}>
                  Pusat Kendali Admin
                </span>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <Link
                    href="/admin?tab=warehouses"
                    onClick={onClose}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 14px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: isAdminActive && pathname.includes('tab=warehouses') ? 700 : 500,
                      color: '#334155',
                      textDecoration: 'none'
                    }}
                  >
                    <span style={{ fontSize: '15px' }}>🏢</span>
                    <span>Master Warehouse</span>
                  </Link>

                  <Link
                    href="/admin?tab=warehouse_access"
                    onClick={onClose}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 14px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: '#334155',
                      textDecoration: 'none'
                    }}
                  >
                    <span style={{ fontSize: '15px' }}>🔑</span>
                    <span>Hak Akses Gudang</span>
                  </Link>

                  <Link
                    href="/admin?tab=master"
                    onClick={onClose}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 14px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: '#334155',
                      textDecoration: 'none'
                    }}
                  >
                    <span style={{ fontSize: '15px' }}>📍</span>
                    <span>Master Titik & Shift</span>
                  </Link>

                  <Link
                    href="/admin?tab=users"
                    onClick={onClose}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 14px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: '#334155',
                      textDecoration: 'none'
                    }}
                  >
                    <span style={{ fontSize: '15px' }}>👥</span>
                    <span>Manajemen Pengguna</span>
                  </Link>

                  <Link
                    href="/admin?tab=settings"
                    onClick={onClose}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 14px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: '#334155',
                      textDecoration: 'none'
                    }}
                  >
                    <span style={{ fontSize: '15px' }}>⚙️</span>
                    <span>Batas Suhu, Kunci & Backup</span>
                  </Link>

                  <Link
                    href="/admin?tab=notifications"
                    onClick={onClose}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 14px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: '#334155',
                      textDecoration: 'none'
                    }}
                  >
                    <span style={{ fontSize: '15px' }}>💬</span>
                    <span>WhatsApp Gateway</span>
                  </Link>

                  <Link
                    href="/admin?tab=audit"
                    onClick={onClose}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 14px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: '#334155',
                      textDecoration: 'none'
                    }}
                  >
                    <span style={{ fontSize: '15px' }}>📜</span>
                    <span>Jejak Audit Kekal</span>
                  </Link>
                </nav>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions: Profile Switch & Logout */}
        <div style={{ padding: '16px 18px', borderTop: '1px solid rgba(0, 0, 0, 0.06)', backgroundColor: '#F8FAFC' }}>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSwitchModal();
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: '24px',
              border: '1px solid #CBD5E1',
              backgroundColor: '#FFFFFF',
              color: '#334155',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: '8px'
            }}
          >
            <span>👤</span>
            <span>Profil Akun & Kata Sandi</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: '24px',
              border: '1px solid #FECACA',
              backgroundColor: '#FEF2F2',
              color: '#DC2626',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Keluar dari Aplikasi</span>
          </button>
        </div>
      </div>
    </div>
  );
}
