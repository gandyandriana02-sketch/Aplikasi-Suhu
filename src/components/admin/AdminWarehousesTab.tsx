'use client';

import React, { useState, useEffect } from 'react';

export interface WarehouseItem {
  warehouse_id: string;
  warehouse_code: string;
  warehouse_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  updated_by: string;
}

interface AdminWarehousesTabProps {
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
  onWarehouseChange?: () => void;
}

export function AdminWarehousesTab({ onSuccess, onError, onWarehouseChange }: AdminWarehousesTabProps) {
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Add modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [whCode, setWhCode] = useState('');
  const [whName, setWhName] = useState('');
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Edit modal state (CRUD update)
  const [editingWh, setEditingWh] = useState<WarehouseItem | null>(null);
  const [editWhCode, setEditWhCode] = useState('');
  const [editWhName, setEditWhName] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  async function loadWarehouses() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/warehouses', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memuat master warehouse');
      setWarehouses(data.warehouses || []);
    } catch (err: any) {
      onError(err.message || 'Gagal memuat warehouse.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWarehouses();
  }, []);

  async function handleAddWarehouse(e: React.FormEvent) {
    e.preventDefault();
    setModalError(null);

    const cleanCode = whCode.trim().toUpperCase();
    const cleanName = whName.trim();

    if (!cleanCode || !cleanName) {
      setModalError('Kode dan nama warehouse wajib diisi.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/warehouses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          warehouse_code: cleanCode,
          warehouse_name: cleanName
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal menambah warehouse baru.');
      }

      setShowAddModal(false);
      setWhCode('');
      setWhName('');
      onSuccess(`Warehouse ${cleanCode} (${cleanName}) berhasil ditambahkan.`);
      await loadWarehouses();
      onWarehouseChange?.();
    } catch (err: any) {
      setModalError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveEditWarehouse(e: React.FormEvent) {
    e.preventDefault();
    if (!editingWh) return;
    setEditError(null);

    const cleanCode = editWhCode.trim().toUpperCase();
    const cleanName = editWhName.trim();

    if (!cleanCode || !cleanName) {
      setEditError('Kode dan nama warehouse tidak boleh kosong.');
      return;
    }

    setEditSaving(true);
    try {
      const res = await fetch('/api/admin/warehouses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          warehouse_id: editingWh.warehouse_id,
          warehouse_code: cleanCode,
          warehouse_name: cleanName
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengubah data warehouse.');

      setEditingWh(null);
      onSuccess(`Data warehouse ${cleanCode} (${cleanName}) berhasil diperbarui.`);
      await loadWarehouses();
      onWarehouseChange?.();
    } catch (err: any) {
      setEditError(err.message || 'Terjadi kesalahan saat menyimpan perubahan.');
    } finally {
      setEditSaving(false);
    }
  }

  async function handleToggleStatus(wh: WarehouseItem) {
    const nextStatus = !wh.is_active;
    const actionLabel = nextStatus ? 'mengaktifkan' : 'menonaktifkan';

    if (
      !confirm(
        `Apakah Anda yakin ingin ${actionLabel} warehouse "${wh.warehouse_code} — ${wh.warehouse_name}"?\n(Data transaksi historis tetap dipertahankan.)`
      )
    ) {
      return;
    }

    try {
      const res = await fetch('/api/admin/warehouses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          warehouse_id: wh.warehouse_id,
          is_active: nextStatus
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Gagal ${actionLabel} warehouse.`);

      onSuccess(`Status warehouse ${wh.warehouse_code} berhasil diperbarui.`);
      await loadWarehouses();
      onWarehouseChange?.();
    } catch (err: any) {
      onError(err.message || 'Gagal mengubah status warehouse.');
    }
  }

  return (
    <section aria-label="Manajemen Master Warehouse" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Tab Header Action Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--ios-ink)' }}>
            Daftar Master Warehouse Cabang
          </h2>
          <p style={{ fontSize: '12.5px', color: 'var(--ios-muted)', marginTop: '2px' }}>
            Kelola kode gudang, nama cabang, dan status operasional ({warehouses.length} warehouse)
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setModalError(null);
            setShowAddModal(true);
          }}
          className="btn-action-primary"
        >
          <span>+</span>
          <span>Tambah Warehouse</span>
        </button>
      </div>

      {/* Table */}
      <div className="apple-table-wrap">
        <table className="apple-data-table">
          <thead>
            <tr>
              <th>Kode</th>
              <th>Nama Warehouse</th>
              <th>ID Sistem</th>
              <th style={{ textAlign: 'center' }}>Status</th>
              <th style={{ textAlign: 'right', paddingRight: '20px' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ padding: '36px', textAlign: 'center', color: 'var(--ios-muted)' }}>
                  Memuat data warehouse...
                </td>
              </tr>
            ) : warehouses.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '36px', textAlign: 'center', color: 'var(--ios-muted)' }}>
                  Belum ada warehouse yang terdaftar.
                </td>
              </tr>
            ) : (
              warehouses.map((wh) => (
                <tr key={wh.warehouse_id}>
                  <td style={{ fontWeight: 800, fontFamily: 'monospace', color: 'var(--ios-blue)' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        backgroundColor: 'var(--ios-blue-tint)',
                        borderRadius: '6px',
                        border: '1px solid rgba(0, 113, 227, 0.2)'
                      }}
                    >
                      {wh.warehouse_code}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--ios-ink)' }}>
                    {wh.warehouse_name}
                  </td>
                  <td style={{ color: 'var(--ios-muted)', fontSize: '12px', fontFamily: 'monospace' }}>
                    {wh.warehouse_id}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`status-badge ${wh.is_active ? 'active' : 'inactive'}`}>
                      {wh.is_active ? 'Aktif' : 'Non-aktif'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                    <div className="tbl-action-group">
                      <button
                        type="button"
                        onClick={() => {
                          setEditError(null);
                          setEditingWh(wh);
                          setEditWhCode(wh.warehouse_code);
                          setEditWhName(wh.warehouse_name);
                        }}
                        className="btn-tbl-action"
                      >
                        Ubah
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(wh)}
                        className={`btn-tbl-action ${wh.is_active ? 'danger' : 'primary'}`}
                      >
                        {wh.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Warehouse Modal */}
      {showAddModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="apple-modal-overlay"
          onClick={() => setShowAddModal(false)}
        >
          <div className="apple-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head-bar">
              <h2 className="modal-head-title">Tambah Warehouse Baru</h2>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="modal-close-btn"
                title="Tutup dialog"
                aria-label="Tutup dialog"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddWarehouse}>
              <div className="modal-body-scroll">
                {modalError && (
                  <div
                    style={{
                      padding: '10px 14px',
                      backgroundColor: 'var(--ios-red-tint)',
                      color: 'var(--ios-red)',
                      borderRadius: '10px',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      border: '1px solid rgba(255, 59, 48, 0.3)'
                    }}
                  >
                    {modalError}
                  </div>
                )}

                <div className="form-group-item">
                  <label className="form-label">Kode Warehouse (Unik)</label>
                  <input
                    type="text"
                    required
                    value={whCode}
                    onChange={(e) => setWhCode(e.target.value.toUpperCase())}
                    placeholder="Contoh: CK02"
                    maxLength={10}
                    className="apple-input-text"
                    style={{ textTransform: 'uppercase', fontWeight: 700 }}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--ios-muted)' }}>
                    Gunakan kode singkat seperti CK01, CK02, SBY01
                  </span>
                </div>

                <div className="form-group-item">
                  <label className="form-label">Nama Warehouse</label>
                  <input
                    type="text"
                    required
                    value={whName}
                    onChange={(e) => setWhName(e.target.value)}
                    placeholder="Contoh: Cikupa Annex"
                    className="apple-input-text"
                  />
                </div>
              </div>

              <div className="modal-foot-bar">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={saving}
                  className="btn-action-secondary"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-action-primary"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Warehouse'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Warehouse Modal (CRUD Update) */}
      {editingWh && (
        <div
          role="dialog"
          aria-modal="true"
          className="apple-modal-overlay"
          onClick={() => setEditingWh(null)}
        >
          <div className="apple-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head-bar">
              <h2 className="modal-head-title">Ubah Warehouse ({editingWh.warehouse_id})</h2>
              <button
                type="button"
                onClick={() => setEditingWh(null)}
                className="modal-close-btn"
                title="Tutup dialog"
                aria-label="Tutup dialog"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSaveEditWarehouse}>
              <div className="modal-body-scroll">
                {editError && (
                  <div
                    style={{
                      padding: '10px 14px',
                      backgroundColor: 'var(--ios-red-tint)',
                      color: 'var(--ios-red)',
                      borderRadius: '10px',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      border: '1px solid rgba(255, 59, 48, 0.3)'
                    }}
                  >
                    {editError}
                  </div>
                )}

                <div className="form-group-item">
                  <label className="form-label">Kode Warehouse</label>
                  <input
                    type="text"
                    required
                    value={editWhCode}
                    onChange={(e) => setEditWhCode(e.target.value.toUpperCase())}
                    placeholder="Contoh: CK01"
                    maxLength={10}
                    className="apple-input-text"
                    style={{ textTransform: 'uppercase', fontWeight: 700 }}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--ios-muted)' }}>
                    Kode unik identifikasi warehouse di seluruh sistem
                  </span>
                </div>

                <div className="form-group-item">
                  <label className="form-label">Nama Warehouse</label>
                  <input
                    type="text"
                    required
                    value={editWhName}
                    onChange={(e) => setEditWhName(e.target.value)}
                    placeholder="Contoh: Cikupa Annex"
                    className="apple-input-text"
                  />
                </div>
              </div>

              <div className="modal-foot-bar">
                <button
                  type="button"
                  onClick={() => setEditingWh(null)}
                  disabled={editSaving}
                  className="btn-action-secondary"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="btn-action-primary"
                >
                  {editSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
