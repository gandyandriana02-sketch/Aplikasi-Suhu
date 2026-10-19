'use client';

import React, { useState } from 'react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!oldPassword || !newPassword || !confirmPassword) {
      setError('Semua bidang wajib diisi.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Kata sandi baru minimal harus 8 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }

    if (newPassword === oldPassword) {
      setError('Kata sandi baru harus berbeda dari kata sandi lama.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          old_password: oldPassword,
          new_password: newPassword
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengubah kata sandi.');
      }

      setSuccess('Kata sandi berhasil diperbarui.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        onClose();
        setSuccess(null);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mengubah kata sandi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
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
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-pw-title"
        style={{
          backgroundColor: 'var(--surface-raised)',
          borderRadius: 'var(--radius-sheet)',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.16)',
          width: '100%',
          maxWidth: '420px',
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
            <h2
              id="change-pw-title"
              style={{
                fontSize: '18px',
                fontWeight: 600,
                color: 'var(--ink)',
                margin: 0
              }}
            >
              Ganti Kata Sandi
            </h2>
            <p
              style={{
                fontSize: '13px',
                color: 'var(--ink-muted)',
                margin: '4px 0 0 0'
              }}
            >
              Perbarui kata sandi akun Anda (minimal 8 karakter)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Tutup"
            style={{
              background: 'transparent',
              border: 'none',
              padding: '6px',
              borderRadius: 'var(--radius-control)',
              cursor: loading ? 'not-allowed' : 'pointer',
              color: 'var(--ink-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          {error && (
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
              {error}
            </div>
          )}

          {success && (
            <div
              style={{
                padding: '10px 14px',
                backgroundColor: 'var(--ok-tint)',
                color: 'var(--ok)',
                borderRadius: 'var(--radius-control)',
                fontSize: '13px',
                fontWeight: 500,
                marginBottom: '16px',
                border: '1px solid #C3E6CB'
              }}
            >
              {success}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--ink)',
                  marginBottom: '6px'
                }}
              >
                Kata Sandi Lama
              </label>
              <input
                type="password"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Masukkan kata sandi lama"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-control)',
                  border: '1px solid var(--line)',
                  fontSize: '14px',
                  backgroundColor: 'var(--surface-raised)',
                  color: 'var(--ink)',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--ink)',
                  marginBottom: '6px'
                }}
              >
                Kata Sandi Baru
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-control)',
                  border: '1px solid var(--line)',
                  fontSize: '14px',
                  backgroundColor: 'var(--surface-raised)',
                  color: 'var(--ink)',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--ink)',
                  marginBottom: '6px'
                }}
              >
                Konfirmasi Kata Sandi Baru
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi kata sandi baru"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-control)',
                  border: '1px solid var(--line)',
                  fontSize: '14px',
                  backgroundColor: 'var(--surface-raised)',
                  color: 'var(--ink)',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div
            style={{
              marginTop: '20px',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px'
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '9px 16px',
                borderRadius: 'var(--radius-control)',
                border: '1px solid var(--line)',
                backgroundColor: 'transparent',
                color: 'var(--ink)',
                fontSize: '13px',
                fontWeight: 500,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '9px 18px',
                borderRadius: 'var(--radius-control)',
                border: 'none',
                backgroundColor: 'var(--primary)',
                color: 'var(--primary-ink)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Menyimpan...' : 'Simpan Kata Sandi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
