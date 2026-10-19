'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppIcon } from '@/components/AppIcon';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [shake, setShake] = useState(false);
  const [appInfo, setAppInfo] = useState<{ app_name: string; app_icon: string }>({
    app_name: 'Warehouse Temperature',
    app_icon: 'thermometer'
  });

  useEffect(() => {
    fetch('/api/app-info')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.app_name || data?.app_icon) {
          setAppInfo({
            app_name: data.app_name || 'Warehouse Temperature',
            app_icon: data.app_icon || 'thermometer'
          });
        }
      })
      .catch(() => {});
  }, []);

  // State for mandatory password change modal (FR-002)
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  function triggerError(msg: string) {
    setErrorMessage(msg);
    setShake(true);
    setTimeout(() => setShake(false), 500);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password) return;

    setLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password
        })
      });

      const data = await res.json();

      if (!res.ok) {
        triggerError(data.error || 'Username atau password salah. Periksa lagi, lalu coba masuk kembali.');
        setLoading(false);
        return;
      }

      // Check if user must change password (FR-002)
      if (data.user?.must_change_password) {
        setOldPassword(password);
        setShowChangePasswordModal(true);
        setLoading(false);
        return;
      }

      router.push('/');
      router.refresh();
    } catch {
      triggerError('Terjadi gangguan koneksi ke server. Coba beberapa saat lagi.');
      setLoading(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!newPassword || !confirmPassword) return;

    if (newPassword.length < 8) {
      setModalError('Password baru minimal harus 8 karakter.');
      return;
    }

    if (newPassword === 'admin123') {
      setModalError('Password baru tidak boleh menggunakan password default "admin123".');
      return;
    }

    if (newPassword !== confirmPassword) {
      setModalError('Konfirmasi password tidak cocok.');
      return;
    }

    setModalLoading(true);
    setModalError('');

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
        setModalError(data.error || 'Gagal memperbarui password.');
        setModalLoading(false);
        return;
      }

      setShowChangePasswordModal(false);
      router.push('/');
      router.refresh();
    } catch {
      setModalError('Terjadi gangguan koneksi ke server. Coba beberapa saat lagi.');
      setModalLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F2F2F7',
        padding: '20px',
        boxSizing: 'border-box'
      }}
    >
      <div
        className={shake ? 'apple-shake' : ''}
        style={{
          maxWidth: '400px',
          width: '100%',
          backgroundColor: '#FFFFFF',
          borderRadius: '32px',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          padding: '40px 28px',
          boxSizing: 'border-box',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.08)',
          transition: 'transform 0.2s cubic-bezier(0.2, 0.9, 0.25, 1)'
        }}
      >
        {/* Brand Section */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #0071E3 0%, #0284C7 60%, #06B6D4 100%)',
              boxShadow: '0 10px 24px rgba(0, 113, 227, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              marginBottom: '16px',
              fontSize: '34px'
            }}
          >
            <AppIcon name={appInfo.app_icon || 'thermometer'} size={34} color="#FFFFFF" strokeWidth={2.2} />
          </div>
          <h1
            style={{
              fontSize: '22px',
              fontWeight: 700,
              color: '#1D1D1F',
              margin: '0 0 4px 0',
              textAlign: 'center',
              letterSpacing: '-0.4px'
            }}
          >
            {appInfo.app_name || 'Warehouse Temperature'}
          </h1>
          <p
            style={{
              fontSize: '13px',
              color: '#86868B',
              margin: 0,
              textAlign: 'center'
            }}
          >
            Masuk ke sistem pencatatan suhu gudang
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            role="alert"
            aria-live="polite"
            style={{
              backgroundColor: '#FEECEB',
              border: '1px solid #FF3B30',
              borderRadius: '12px',
              padding: '12px 14px',
              color: '#FF3B30',
              fontSize: '13px',
              lineHeight: 1.4,
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleLogin} noValidate>
          {/* Username Input */}
          <div style={{ marginBottom: '14px' }}>
            <label
              htmlFor="username"
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: '#64748B',
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.4px'
              }}
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              required
              disabled={loading}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username"
              style={{
                width: '100%',
                height: '48px',
                padding: '0 14px',
                borderRadius: '12px',
                border: '1.5px solid #E2E8F0',
                fontSize: '15px',
                color: '#1D1D1F',
                backgroundColor: '#F8FAFC',
                boxSizing: 'border-box',
                outline: 'none',
                transition: 'all 0.15s ease'
              }}
            />
          </div>

          {/* Password Input with Eye Toggle */}
          <div style={{ marginBottom: '24px' }}>
            <label
              htmlFor="password"
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: '#64748B',
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.4px'
              }}
            >
              Password
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                style={{
                  width: '100%',
                  height: '48px',
                  padding: '0 44px 0 14px',
                  borderRadius: '12px',
                  border: '1.5px solid #E2E8F0',
                  fontSize: '15px',
                  color: '#1D1D1F',
                  backgroundColor: '#F8FAFC',
                  boxSizing: 'border-box',
                  outline: 'none',
                  transition: 'all 0.15s ease'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                style={{
                  position: 'absolute',
                  right: '10px',
                  background: 'none',
                  border: 'none',
                  padding: '6px',
                  cursor: 'pointer',
                  color: '#94A3B8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              height: '48px',
              backgroundColor: loading ? '#94A3B8' : '#0071E3',
              color: '#FFFFFF',
              borderRadius: '14px',
              border: 'none',
              fontSize: '15px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 14px rgba(0, 113, 227, 0.25)',
              transition: 'all 0.15s ease'
            }}
          >
            {loading ? 'Memeriksa...' : 'Masuk'}
          </button>
        </form>
      </div>

      {/* Mandatory Password Change Dialog (FR-002) */}
      {showChangePasswordModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-pwd-title"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            zIndex: 1000
          }}
        >
          <div
            style={{
              maxWidth: '420px',
              width: '100%',
              backgroundColor: '#FFFFFF',
              borderRadius: '28px',
              padding: '32px 24px',
              boxSizing: 'border-box',
              boxShadow: '0 20px 48px rgba(0, 0, 0, 0.2)'
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '16px',
                  backgroundColor: '#FEF3C7',
                  color: '#D97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px auto'
                }}
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <h2
                id="modal-pwd-title"
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#1D1D1F',
                  margin: '0 0 6px 0'
                }}
              >
                Wajib Ganti Password Awal
              </h2>
              <p
                style={{
                  fontSize: '13px',
                  color: '#64748B',
                  lineHeight: 1.4,
                  margin: 0
                }}
              >
                Akun ini masih menggunakan password default (<code>admin123</code>). Demi keamanan, silakan tentukan password baru minimal 8 karakter.
              </p>
            </div>

            {modalError && (
              <div
                role="alert"
                aria-live="polite"
                style={{
                  backgroundColor: '#FEECEB',
                  border: '1px solid #FF3B30',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  color: '#FF3B30',
                  fontSize: '12.5px',
                  lineHeight: 1.4,
                  marginBottom: '16px'
                }}
              >
                {modalError}
              </div>
            )}

            <form onSubmit={handleChangePassword}>
              <div style={{ marginBottom: '14px' }}>
                <label
                  htmlFor="new-password"
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#64748B',
                    marginBottom: '4px'
                  }}
                >
                  Password Baru
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    id="new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    disabled={modalLoading}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 8 karakter"
                    style={{
                      width: '100%',
                      height: '44px',
                      padding: '0 40px 0 12px',
                      borderRadius: '10px',
                      border: '1.5px solid #CBD5E1',
                      fontSize: '14px',
                      color: '#1D1D1F',
                      backgroundColor: '#F8FAFC',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      background: 'none',
                      border: 'none',
                      color: '#94A3B8',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    aria-label={showNewPassword ? 'Sembunyikan password' : 'Lihat password'}
                  >
                    {showNewPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label
                  htmlFor="confirm-password"
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#64748B',
                    marginBottom: '4px'
                  }}
                >
                  Konfirmasi Password Baru
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    disabled={modalLoading}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi password baru"
                    style={{
                      width: '100%',
                      height: '44px',
                      padding: '0 40px 0 12px',
                      borderRadius: '10px',
                      border: '1.5px solid #CBD5E1',
                      fontSize: '14px',
                      color: '#1D1D1F',
                      backgroundColor: '#F8FAFC',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      background: 'none',
                      border: 'none',
                      color: '#94A3B8',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    aria-label={showConfirmPassword ? 'Sembunyikan password' : 'Lihat password'}
                  >
                    {showConfirmPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={modalLoading}
                style={{
                  width: '100%',
                  height: '46px',
                  backgroundColor: modalLoading ? '#94A3B8' : '#0071E3',
                  color: '#FFFFFF',
                  borderRadius: '12px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: modalLoading ? 'not-allowed' : 'pointer'
                }}
              >
                {modalLoading ? 'Menyimpan...' : 'Simpan Password Baru'}
              </button>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes appleShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        .apple-shake {
          animation: appleShake 0.4s ease-in-out;
        }
      `}</style>
    </div>
  );
}
