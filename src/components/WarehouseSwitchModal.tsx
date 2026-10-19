'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChangePasswordModal } from './ChangePasswordModal';

interface WarehouseOption {
  warehouse_id: string;
  warehouse_code: string;
  warehouse_name: string;
  is_active: boolean;
}

interface WarehouseSwitchModalProps {
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
  currentWarehouseId?: string;
  onSwitched?: (newWarehouseId: string) => void;
}

export function WarehouseSwitchModal({
  isOpen,
  onClose,
  user,
  currentWarehouseId,
  onSwitched
}: WarehouseSwitchModalProps) {
  const router = useRouter();
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [activeId, setActiveId] = useState<string>(currentWarehouseId || user?.active_warehouse_id || '');
  const [loading, setLoading] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    fetch('/api/warehouses', { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) throw new Error('Gagal memuat daftar warehouse');
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          setWarehouses(data.warehouses || []);
          if (data.active_warehouse_id) {
            setActiveId(data.active_warehouse_id);
          }
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Terjadi kesalahan saat memuat warehouse.');
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  async function handleSelectWarehouse(targetId: string) {
    if (targetId === activeId) {
      onClose();
      return;
    }

    setSwitching(targetId);
    setError(null);

    try {
      const res = await fetch('/api/warehouses/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ warehouse_id: targetId })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal berpindah warehouse.');
      }

      setActiveId(targetId);
      if (onSwitched) {
        onSwitched(targetId);
      }
      onClose();
      window.location.reload();
    } catch (err: any) {
      setError(err.message || 'Gagal mengubah warehouse aktif.');
      setSwitching(null);
    }
  }

  async function handleLogout() {
    if (confirm('Apakah Anda yakin ingin keluar dari aplikasi?')) {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.replace('/login');
      router.refresh();
    }
  }

  if (!isOpen) return null;

  const initials = user?.full_name
    ? user.full_name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'WH';

  const isSingleAccess = warehouses.length === 1;

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.42)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          zIndex: 500,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          alignItems: 'center',
          padding: '0'
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          style={{
            backgroundColor: '#F2F2F7',
            borderRadius: '28px 28px 0 0',
            width: '100%',
            maxWidth: '520px',
            maxHeight: '90vh',
            boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.22)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'appleSlideUp 0.35s cubic-bezier(0.2, 0.9, 0.25, 1)'
          }}
        >
          {/* Drag Handle Grabber */}
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center', paddingTop: '10px', paddingBottom: '6px' }}>
            <div style={{ width: '36px', height: '5px', borderRadius: '9999px', backgroundColor: 'rgba(60, 60, 67, 0.3)' }} />
          </div>

          {/* Top Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 20px 14px 20px',
              borderBottom: '1px solid rgba(0, 0, 0, 0.06)'
            }}
          >
            <div style={{ fontSize: '17px', fontWeight: 700, color: '#1D1D1F', letterSpacing: '-0.3px' }}>
              Profil & Akses Gudang
            </div>
            <button
              onClick={onClose}
              type="button"
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                backgroundColor: 'rgba(118, 118, 128, 0.12)',
                border: 'none',
                color: '#86868B',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              aria-label="Tutup menu"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Scrollable Content */}
          <div style={{ padding: '16px 20px 30px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* User Profile Hero Card */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '20px',
                padding: '16px',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
              }}
            >
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0284C7 0%, #0071E3 100%)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  fontWeight: 800,
                  boxShadow: '0 4px 12px rgba(0, 113, 227, 0.3)'
                }}
              >
                {initials}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1D1D1F', margin: 0 }}>
                    {user?.full_name || 'Petugas'}
                  </h3>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      backgroundColor: user?.role === 'ADMIN' ? '#1E293B' : '#E0F2FE',
                      color: user?.role === 'ADMIN' ? '#FFFFFF' : '#0369A1',
                      padding: '2px 8px',
                      borderRadius: '10px'
                    }}
                  >
                    {user?.role === 'ADMIN' ? 'ADMINISTRATOR' : 'MEMBER'}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#86868B', marginTop: '2px' }}>
                  @{user?.username || 'user'} • ID: {user?.user_id?.slice(0, 8) || 'USR-01'}
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div
                style={{
                  backgroundColor: '#FEECEB',
                  border: '1px solid #FF3B30',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  color: '#FF3B30',
                  fontSize: '12.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Section: Pindah Warehouse */}
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#86868B', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '8px', paddingLeft: '4px' }}>
                Pilih Cabang Gudang
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#86868B', fontSize: '13px' }}>
                    Memuat daftar gudang...
                  </div>
                ) : warehouses.map((wh) => {
                  const isCurrent = wh.warehouse_id === activeId;
                  const isBusy = switching === wh.warehouse_id;

                  return (
                    <div
                      key={wh.warehouse_id}
                      onClick={() => !isCurrent && handleSelectWarehouse(wh.warehouse_id)}
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '16px',
                        padding: '14px 16px',
                        border: `1.5px solid ${isCurrent ? '#0071E3' : 'rgba(0,0,0,0.06)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: isCurrent ? 'default' : 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: isCurrent ? '0 4px 14px rgba(0, 113, 227, 0.12)' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            backgroundColor: isCurrent ? '#E0F2FE' : '#F1F5F9',
                            color: isCurrent ? '#0071E3' : '#64748B',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: 800
                          }}
                        >
                          {wh.warehouse_code}
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: '#1D1D1F' }}>
                            {wh.warehouse_name}
                          </div>
                          <div style={{ fontSize: '11px', color: '#86868B' }}>
                            Kode Cabang: {wh.warehouse_code}
                          </div>
                        </div>
                      </div>

                      {isCurrent ? (
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            backgroundColor: '#E8F8EE',
                            color: '#1D8338',
                            padding: '4px 10px',
                            borderRadius: '14px',
                            border: '1px solid #86EFAC',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span>Aktif</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={Boolean(switching)}
                          style={{
                            backgroundColor: '#F1F5F9',
                            color: '#0071E3',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          {isBusy ? 'Beralih...' : 'Pilih'}
                        </button>
                      )}
                    </div>
                  );
                })}

                {/* Single Access Restriction Notice (BR-04) */}
                {isSingleAccess && (
                  <div
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '14px',
                      padding: '12px 14px',
                      border: '1px solid rgba(0,0,0,0.06)',
                      fontSize: '12px',
                      color: '#64748B',
                      lineHeight: 1.4
                    }}
                  >
                    ℹ️ Anda saat ini ditugaskan pada 1 cabang warehouse. Hubungi Administrator jika membutuhkan otorisasi akses multi-cabang.
                  </div>
                )}
              </div>
            </div>

            {/* Section: Akun & Keamanan */}
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#86868B', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '8px', paddingLeft: '4px' }}>
                Akun & Keamanan
              </div>

              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(true)}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#F1F5F9', color: '#0071E3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="7.5" cy="15.5" r="4.5" />
                        <path d="m21 3-9.5 9.5" />
                        <path d="m15.5 7.5 3 3" />
                        <path d="m18 5 2 2" />
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#1D1D1F' }}>
                        Ganti Password Mandiri
                      </div>
                      <div style={{ fontSize: '11px', color: '#86868B' }}>
                        Perbarui kata sandi akun Anda
                      </div>
                    </div>
                  </div>
                  <span style={{ color: '#86868B', fontSize: '14px' }}>›</span>
                </button>
              </div>
            </div>

            {/* Section: Info Operasional */}
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#86868B', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '8px', paddingLeft: '4px' }}>
                Informasi Operasional
              </div>

              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  padding: '12px 16px',
                  border: '1px solid rgba(0,0,0,0.06)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  fontSize: '12px',
                  color: '#64748B'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Zona Waktu Resmi:</span>
                  <strong style={{ color: '#1D1D1F' }}>Asia/Jakarta (WIB, UTC+7)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Supervisor QC Bertugas:</span>
                  <strong style={{ color: '#1D1D1F' }}>Bpk. Rahmat Hidayat</strong>
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              style={{
                width: '100%',
                height: '48px',
                backgroundColor: '#FFFFFF',
                color: '#FF3B30',
                border: '1px solid #FF3B30',
                borderRadius: '16px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Keluar dari Aplikasi
            </button>
          </div>
        </div>

        <style jsx>{`
          @keyframes appleSlideUp {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
        `}</style>
      </div>

      {/* Sub-modal: Change Password */}
      {showPasswordModal && (
        <ChangePasswordModal
          isOpen={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
        />
      )}
    </>
  );
}
