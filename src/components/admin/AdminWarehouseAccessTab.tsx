'use client';

import React, { useState, useEffect } from 'react';

interface WarehouseOption {
  warehouse_id: string;
  warehouse_code: string;
  warehouse_name: string;
  is_active: boolean;
}

interface UserAccessItem {
  user_id: string;
  username: string;
  full_name: string;
  role: 'ADMIN' | 'MEMBER';
  default_warehouse_id?: string;
  allowed_warehouse_ids: string[];
  warehouses: Array<WarehouseOption & { is_allowed: boolean }>;
}

interface AdminWarehouseAccessTabProps {
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export function AdminWarehouseAccessTab({ onSuccess, onError }: AdminWarehouseAccessTabProps) {
  const [userAccessList, setUserAccessList] = useState<UserAccessItem[]>([]);
  const [allWarehouses, setAllWarehouses] = useState<WarehouseOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal edit access state
  const [editingUser, setEditingUser] = useState<UserAccessItem | null>(null);
  const [selectedWhIds, setSelectedWhIds] = useState<string[]>([]);
  const [selectedDefaultWhId, setSelectedDefaultWhId] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  async function loadAccessData() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/warehouse-access', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memuat hak akses warehouse');
      setUserAccessList(data.user_access || []);
      setAllWarehouses(data.warehouses || []);
    } catch (err: any) {
      onError(err.message || 'Gagal memuat hak akses.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAccessData();
  }, []);

  function handleOpenEdit(user: UserAccessItem) {
    setEditingUser(user);
    setSelectedWhIds(user.allowed_warehouse_ids || []);
    setSelectedDefaultWhId(user.default_warehouse_id || (user.allowed_warehouse_ids[0] || ''));
    setModalError(null);
  }

  function handleToggleCheckbox(whId: string) {
    setSelectedWhIds((prev) => {
      const next = prev.includes(whId) ? prev.filter((id) => id !== whId) : [...prev, whId];
      // Keep default_warehouse_id aligned with allowed warehouses
      if (selectedDefaultWhId === whId && !next.includes(whId)) {
        setSelectedDefaultWhId(next[0] || '');
      } else if (!selectedDefaultWhId && next.length > 0) {
        setSelectedDefaultWhId(next[0]);
      }
      return next;
    });
  }

  async function handleSaveAccess(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;

    setSaving(true);
    setModalError(null);

    try {
      const res = await fetch('/api/admin/warehouse-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: editingUser.user_id,
          warehouse_ids: selectedWhIds,
          default_warehouse_id: selectedDefaultWhId
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memperbarui hak akses.');

      onSuccess(`Hak akses & warehouse default untuk "${editingUser.full_name}" berhasil diperbarui.`);
      setEditingUser(null);
      await loadAccessData();
    } catch (err: any) {
      setModalError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section aria-label="Hak Akses Warehouse">
      {/* Header */}
      <div style={{ marginBottom: '12px' }}>
        <p style={{ fontSize: '13px', color: 'var(--ink-muted)', margin: 0 }}>
          Pengaturan izin akses warehouse untuk masing-masing pengguna ({userAccessList.length} pengguna)
        </p>
      </div>

      {/* Table */}
      <div
        style={{
          backgroundColor: 'var(--surface-raised)',
          borderRadius: 'var(--radius-card)',
          border: '1px solid var(--line)',
          overflowX: 'auto'
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--line)' }}>
              <th style={{ padding: '10px 14px', fontWeight: 600 }}>Pengguna</th>
              <th style={{ padding: '10px 14px', fontWeight: 600 }}>Peran</th>
              <th style={{ padding: '10px 14px', fontWeight: 600 }}>Akses Warehouse</th>
              <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600 }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: 'var(--ink-muted)' }}>
                  Memuat hak akses pengguna...
                </td>
              </tr>
            ) : userAccessList.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: 'var(--ink-muted)' }}>
                  Belum ada pengguna terdaftar.
                </td>
              </tr>
            ) : (
              userAccessList.map((u) => {
                const isAdmin = u.role === 'ADMIN';

                return (
                  <tr key={u.user_id} style={{ borderBottom: '1px solid var(--surface)' }}>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{u.full_name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>@{u.username}</div>
                    </td>

                    <td style={{ padding: '10px 14px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: isAdmin ? 'var(--ink)' : 'var(--empty-tint)',
                          color: isAdmin ? '#FFFFFF' : 'var(--ink)'
                        }}
                      >
                        {u.role}
                      </span>
                    </td>

                    <td style={{ padding: '10px 14px' }}>
                      {isAdmin ? (
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '3px 8px',
                            backgroundColor: 'rgba(21, 101, 166, 0.08)',
                            color: 'var(--primary)',
                            borderRadius: '4px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          Semua Warehouse (Akses Penuh)
                        </span>
                      ) : u.allowed_warehouse_ids.length === 0 ? (
                        <span style={{ fontSize: '12px', color: 'var(--over)', fontWeight: 500 }}>
                          Belum ada akses (Terkunci)
                        </span>
                      ) : (
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {allWarehouses
                            .filter((w) => u.allowed_warehouse_ids.includes(w.warehouse_id))
                            .map((w) => {
                              const isDefault = w.warehouse_id === u.default_warehouse_id;
                              return (
                                <span
                                  key={w.warehouse_id}
                                  style={{
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    padding: '2px 6px',
                                    backgroundColor: isDefault ? 'rgba(21, 101, 166, 0.08)' : 'var(--surface)',
                                    border: isDefault ? '1px solid var(--primary)' : '1px solid var(--line)',
                                    borderRadius: '4px',
                                    color: 'var(--ink)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px'
                                  }}
                                >
                                  <strong style={{ color: 'var(--primary)' }}>{w.warehouse_code}</strong>{' '}
                                  <span>({w.warehouse_name})</span>
                                  {isDefault && (
                                    <span
                                      style={{
                                        fontSize: '9px',
                                        fontWeight: 700,
                                        backgroundColor: 'var(--primary)',
                                        color: '#FFFFFF',
                                        padding: '1px 4px',
                                        borderRadius: '3px',
                                        letterSpacing: '0.02em'
                                      }}
                                    >
                                      Default
                                    </span>
                                  )}
                                </span>
                              );
                            })}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(u)}
                        style={{
                          minHeight: '32px',
                          padding: '4px 12px',
                          borderRadius: 'var(--radius-control)',
                          border: '1px solid var(--line)',
                          backgroundColor: 'var(--surface-raised)',
                          color: 'var(--primary)',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Kelola Akses
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Access Modal */}
      {editingUser && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-access-title"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(27, 38, 44, 0.48)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            backdropFilter: 'blur(2px)'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !saving) setEditingUser(null);
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--surface-raised)',
              borderRadius: 'var(--radius-sheet)',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.16)',
              width: '100%',
              maxWidth: '440px',
              overflow: 'hidden',
              border: '1px solid var(--line)'
            }}
          >
            <div
              style={{
                padding: '18px 20px',
                borderBottom: '1px solid var(--line)',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '12px'
              }}
            >
              <div>
                <h2 id="edit-access-title" style={{ fontSize: '18px', fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
                  Kelola Hak Akses Warehouse
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--ink-muted)', margin: '4px 0 0 0' }}>
                  {editingUser.full_name} (@{editingUser.username})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                disabled={saving}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '6px',
                  borderRadius: 'var(--radius-control)',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  color: 'var(--ink-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                aria-label="Tutup"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSaveAccess} style={{ padding: '20px' }}>
              {modalError && (
                <div
                  style={{
                    padding: '10px 14px',
                    backgroundColor: 'var(--over-tint)',
                    color: 'var(--over)',
                    borderRadius: 'var(--radius-control)',
                    fontSize: '13px',
                    fontWeight: 500,
                    marginBottom: '16px',
                    border: '1px solid #F5C6CB'
                  }}
                >
                  {modalError}
                </div>
              )}

              {editingUser.role === 'ADMIN' && (
                <div
                  style={{
                    padding: '10px 12px',
                    backgroundColor: 'rgba(21, 101, 166, 0.08)',
                    border: '1px solid rgba(21, 101, 166, 0.2)',
                    borderRadius: 'var(--radius-control)',
                    fontSize: '12px',
                    color: 'var(--primary)',
                    lineHeight: 1.4,
                    marginBottom: '16px'
                  }}
                >
                  ℹ️ Akun Administrator secara otomatis memiliki izin ke seluruh warehouse aktif.
                </div>
              )}

              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)', marginBottom: '10px' }}>
                Centang warehouse yang diizinkan untuk diakses:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                {allWarehouses.map((wh) => {
                  const isChecked = selectedWhIds.includes(wh.warehouse_id);

                  return (
                    <label
                      key={wh.warehouse_id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-control)',
                        border: isChecked ? '1px solid var(--primary)' : '1px solid var(--line)',
                        backgroundColor: isChecked ? 'rgba(21, 101, 166, 0.04)' : 'var(--surface)',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleCheckbox(wh.warehouse_id)}
                          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                        <div>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)' }}>
                            {wh.warehouse_code}
                          </span>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)', marginLeft: '6px' }}>
                            {wh.warehouse_name}
                          </span>
                        </div>
                      </div>

                      <span style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>
                        {wh.warehouse_id}
                      </span>
                    </label>
                  );
                })}
              </div>

              {/* Warehouse Default Setting */}
              <div
                style={{
                  marginTop: '16px',
                  marginBottom: '20px',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--line)'
                }}
              >
                <label
                  htmlFor="default-wh-select"
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--ink)',
                    marginBottom: '4px'
                  }}
                >
                  Warehouse Default Saat Login:
                </label>
                <p style={{ fontSize: '12px', color: 'var(--ink-muted)', margin: '0 0 8px 0' }}>
                  Warehouse yang otomatis aktif ketika pengguna berhasil masuk ke aplikasi.
                </p>

                <select
                  id="default-wh-select"
                  value={selectedDefaultWhId}
                  onChange={(e) => setSelectedDefaultWhId(e.target.value)}
                  disabled={selectedWhIds.length === 0}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-control)',
                    border: '1px solid var(--line)',
                    backgroundColor: 'var(--surface)',
                    fontSize: '13px',
                    color: 'var(--ink)',
                    outline: 'none'
                  }}
                >
                  {selectedWhIds.length === 0 ? (
                    <option value="">(Centang minimal 1 warehouse di atas terlebih dahulu)</option>
                  ) : (
                    allWarehouses
                      .filter((w) => selectedWhIds.includes(w.warehouse_id))
                      .map((w) => (
                        <option key={w.warehouse_id} value={w.warehouse_id}>
                          {w.warehouse_code} — {w.warehouse_name} ({w.warehouse_id})
                        </option>
                      ))
                  )}
                </select>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px'
                }}
              >
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  disabled={saving}
                  style={{
                    padding: '9px 16px',
                    borderRadius: 'var(--radius-control)',
                    border: '1px solid var(--line)',
                    backgroundColor: 'transparent',
                    color: 'var(--ink)',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: saving ? 'not-allowed' : 'pointer'
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '9px 18px',
                    borderRadius: 'var(--radius-control)',
                    border: 'none',
                    backgroundColor: 'var(--primary)',
                    color: 'var(--primary-ink)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving ? 0.7 : 1
                  }}
                >
                  {saving ? 'Menyimpan...' : 'Simpan Hak Akses'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
