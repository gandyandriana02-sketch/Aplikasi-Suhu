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
  const [showHelpSheet, setShowHelpSheet] = useState(false);
  const [idleNotice, setIdleNotice] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('reason') === 'idle_timeout') {
        const mins = params.get('mins');
        setIdleNotice(
          mins && parseInt(mins, 10) > 0
            ? `Sesi Anda telah berakhir otomatis karena tidak ada aktivitas selama ${mins} menit demi menjaga keamanan data operasional gudang.`
            : 'Sesi Anda telah berakhir otomatis karena tidak ada aktivitas demi menjaga keamanan data operasional gudang.'
        );
      }
    }
  }, []);

  const [appInfo, setAppInfo] = useState<{ app_name: string; app_icon: string }>({
    app_name: 'Warehouse Temperature Report',
    app_icon: 'thermometer'
  });

  useEffect(() => {
    fetch('/api/app-info', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.app_name || data?.app_icon) {
          setAppInfo({
            app_name: data.app_name || 'Warehouse Temperature Report',
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
    <div className="login-viewport-wrapper">
      <div className={`login-device-container ${shake ? 'login-shake' : ''}`}>
        
        {/* BRAND SECTION (TOP THIRD) */}
        <div className="brand-section">
          <div className="app-icon-badge">
            <AppIcon name={appInfo.app_icon || 'thermometer'} size={38} color="#FFFFFF" strokeWidth={2.2} />
          </div>
          <h1 className="app-title">{appInfo.app_name || 'Warehouse Temperature Report'}</h1>
          <p className="app-subtitle">Sistem Pencatatan Suhu Gudang</p>
        </div>

        {/* IDLE TIMEOUT NOTICE BANNER */}
        {idleNotice && !errorMessage && (
          <div
            role="status"
            aria-live="polite"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '12px 16px',
              borderRadius: '16px',
              backgroundColor: '#FFFBEB',
              border: '1px solid #FDE68A',
              color: '#92400E',
              fontSize: '12.5px',
              lineHeight: 1.45,
              marginBottom: '16px',
              width: '100%',
              boxSizing: 'border-box'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}>
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <div>
              <strong style={{ display: 'block', marginBottom: '2px', color: '#B45309' }}>Sesi Berakhir Otomatis</strong>
              <span>{idleNotice}</span>
            </div>
          </div>
        )}

        {/* ERROR ALERT BANNER */}
        {errorMessage && (
          <div className="error-banner" role="alert" aria-live="polite">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: '1px' }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* FORM INPUTS (TEMPLATE STYLE) */}
        <form onSubmit={handleLogin} noValidate style={{ width: '100%' }}>
          <div className="form-inputs-group">
            {/* Input 1: Username / ID */}
            <div className="input-field-wrapper">
              <input
                id="inputUsername"
                type="text"
                className="clean-input"
                placeholder="Username atau ID Petugas"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                required
                disabled={loading}
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
              />
            </div>

            {/* Input 2: Password with Eye Toggle */}
            <div className="input-field-wrapper">
              <input
                id="inputPassword"
                type={showPassword ? 'text' : 'password'}
                className="clean-input"
                placeholder="Password"
                autoComplete="current-password"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                required
                disabled={loading}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                style={{ paddingRight: '46px' }}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Primary Pill Button ("Masuk / Log in") */}
          <button type="submit" className="btn-login-pill" disabled={loading}>
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="spinner-dot" />
                Memeriksa...
              </span>
            ) : (
              'Masuk'
            )}
          </button>
        </form>

        {/* Forgot Password Link */}
        <button
          type="button"
          className="forgot-pass-btn"
          onClick={() => setShowHelpSheet(true)}
        >
          Lupa password?
        </button>

        {/* BOTTOM PINNED SECTION (Outline Support Button) */}
        <div className="bottom-section">
          <button
            type="button"
            className="btn-support-outline"
            onClick={() => setShowHelpSheet(true)}
          >
            Bantuan & Kontak Supervisor
          </button>
        </div>

      </div>

      {/* BOTTOM SHEET: BANTUAN SUPERVISOR */}
      {showHelpSheet && (
        <div
          className="help-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowHelpSheet(false);
          }}
        >
          <div className="help-sheet-card">
            <div className="sheet-handle" />
            <h3 className="help-sheet-title">Bantuan Akses & Kredensial</h3>
            <p className="help-sheet-desc">
              Aplikasi ini adalah sistem internal pencatatan suhu gudang khusus staf resmi. Jika Anda lupa password atau belum memiliki akun:
            </p>
            <div className="help-contact-box">
              <strong>Kontak Administrator / Supervisor Gudang:</strong>
              <div style={{ marginTop: '4px' }}>
                • Hubungi Leader atau Supervisor Gudang cabang Anda untuk reset password.<br />
                • Pengguna baru didaftarkan langsung oleh Administrator melalui menu Pengaturan Pengguna.
              </div>
            </div>
            <button
              type="button"
              className="btn-login-pill"
              onClick={() => setShowHelpSheet(false)}
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* MODAL: WAJIB GANTI PASSWORD AWAL (FR-002) */}
      {showChangePasswordModal && (
        <div className="help-modal-backdrop" role="dialog" aria-modal="true">
          <div className="change-pass-dialog-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div className="pass-dialog-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <div>
                <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#1D1D1F', margin: 0 }}>Ganti Password Awal</h2>
                <div style={{ fontSize: '12px', color: '#64748B' }}>Ketentuan Keamanan (FR-002)</div>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '16px', lineHeight: 1.45 }}>
              Akun Anda masih menggunakan password default (<code>admin123</code>). Silakan buat password baru minimal 8 karakter sebelum melanjutkan.
            </p>

            {modalError && (
              <div className="error-banner" style={{ marginBottom: '14px' }} role="alert">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '6px' }}>
                  Password Baru
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    className="clean-input"
                    style={{ height: '46px', fontSize: '14px', paddingRight: '44px' }}
                    placeholder="Minimal 8 karakter"
                    required
                    disabled={modalLoading}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    aria-label={showNewPassword ? 'Sembunyikan password' : 'Lihat password'}
                  >
                    {showNewPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '6px' }}>
                  Konfirmasi Password Baru
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="clean-input"
                    style={{ height: '46px', fontSize: '14px', paddingRight: '44px' }}
                    placeholder="Konfirmasi password baru"
                    required
                    disabled={modalLoading}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Sembunyikan password' : 'Lihat password'}
                  >
                    {showConfirmPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn-login-pill"
                disabled={modalLoading}
              >
                {modalLoading ? 'Menyimpan...' : 'Simpan Password Baru'}
              </button>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .login-viewport-wrapper {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #0F172A;
          padding: 16px;
          box-sizing: border-box;
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Inter", system-ui, sans-serif;
        }

        .login-device-container {
          width: 100%;
          max-width: 390px;
          min-height: 640px;
          background: linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%);
          border-radius: 40px;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.45), 0 0 0 8px rgba(255, 255, 255, 0.05);
          padding: 44px 24px 32px 24px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
        }

        .brand-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 28px;
        }

        .app-icon-badge {
          width: 76px;
          height: 76px;
          border-radius: 22px;
          background: linear-gradient(135deg, #0071E3 0%, #0284C7 60%, #06B6D4 100%);
          box-shadow: 0 12px 28px rgba(0, 113, 227, 0.32);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
          position: relative;
        }

        .app-icon-badge::after {
          content: '';
          position: absolute;
          inset: 1.5px;
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.35);
          pointer-events: none;
        }

        .app-title {
          font-size: 20px;
          font-weight: 700;
          color: #1D1D1F;
          letter-spacing: -0.3px;
          text-align: center;
          margin: 0 0 4px 0;
        }

        .app-subtitle {
          font-size: 13px;
          color: #64748B;
          margin: 0;
          text-align: center;
        }

        .error-banner {
          width: 100%;
          background-color: #FEE2E2;
          border: 1px solid #FCA5A5;
          color: #DC2626;
          border-radius: 14px;
          padding: 12px 14px;
          font-size: 12.5px;
          line-height: 1.4;
          display: flex;
          align-items: flex-start;
          gap: 8px;
          margin-bottom: 16px;
          box-sizing: border-box;
        }

        .form-inputs-group {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 16px;
          width: 100%;
        }

        .input-field-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }

        .clean-input {
          width: 100%;
          height: 52px;
          border-radius: 14px;
          border: 1.5px solid #E2E8F0;
          background-color: #FFFFFF;
          padding: 0 16px;
          font-size: 15px;
          color: #1D1D1F;
          box-sizing: border-box;
          outline: none;
          transition: all 0.15s ease;
          font-family: inherit;
        }

        .clean-input:focus {
          border-color: #0071E3;
          background-color: #FFFFFF;
          box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.12);
        }

        .clean-input::placeholder {
          color: #94A3B8;
          font-size: 14px;
        }

        .password-toggle-btn {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          color: #94A3B8;
          cursor: pointer;
          padding: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
        }

        .password-toggle-btn:hover {
          color: #1D1D1F;
        }

        .btn-login-pill {
          width: 100%;
          height: 48px;
          border-radius: 24px;
          background: #0071E3;
          color: #FFFFFF;
          border: none;
          font-size: 15px;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 14px rgba(0, 113, 227, 0.28);
          transition: all 0.15s ease;
        }

        .btn-login-pill:hover:not(:disabled) {
          background: #0066CC;
          box-shadow: 0 6px 16px rgba(0, 113, 227, 0.35);
        }

        .btn-login-pill:active:not(:disabled) {
          transform: scale(0.98);
        }

        .btn-login-pill:disabled {
          background: #CBD5E1;
          color: #94A3B8;
          box-shadow: none;
          cursor: not-allowed;
        }

        .forgot-pass-btn {
          margin-top: 16px;
          background: none;
          border: none;
          text-align: center;
          font-size: 13px;
          font-weight: 600;
          color: #1D1D1F;
          cursor: pointer;
          transition: color 0.15s ease;
          font-family: inherit;
        }

        .forgot-pass-btn:hover {
          color: #0071E3;
        }

        .bottom-section {
          margin-top: auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          padding-top: 28px;
        }

        .btn-support-outline {
          width: 100%;
          height: 46px;
          border-radius: 24px;
          border: 1.5px solid #0071E3;
          background-color: transparent;
          color: #0071E3;
          font-size: 14px;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.15s ease;
        }

        .btn-support-outline:hover {
          background-color: rgba(0, 113, 227, 0.05);
        }

        .help-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.65);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          z-index: 100;
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }

        .help-sheet-card {
          width: 100%;
          max-width: 440px;
          background: #FFFFFF;
          border-radius: 24px 24px 0 0;
          padding: 20px 24px 32px 24px;
          box-sizing: border-box;
          animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .sheet-handle {
          width: 36px;
          height: 4px;
          background: #CBD5E1;
          border-radius: 2px;
          margin: 0 auto 16px auto;
        }

        .help-sheet-title {
          font-size: 17px;
          font-weight: 700;
          color: #1D1D1F;
          margin: 0 0 8px 0;
        }

        .help-sheet-desc {
          font-size: 13px;
          color: #64748B;
          line-height: 1.45;
          margin: 0 0 16px 0;
        }

        .help-contact-box {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 12px 14px;
          font-size: 12.5px;
          color: #1D1D1F;
          line-height: 1.5;
          margin-bottom: 20px;
        }

        .change-pass-dialog-card {
          width: 100%;
          max-width: 420px;
          background: #FFFFFF;
          border-radius: 24px;
          padding: 28px 24px;
          box-sizing: border-box;
          box-shadow: 0 20px 48px rgba(0, 0, 0, 0.3);
          margin-bottom: auto;
          margin-top: auto;
        }

        .pass-dialog-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: #FEE2E2;
          color: #DC2626;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .spinner-dot {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #FFFFFF;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }

        @keyframes loginShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }

        .login-shake {
          animation: loginShake 0.4s ease-in-out;
        }

        @media (max-width: 480px) {
          .login-viewport-wrapper {
            padding: 0;
            background-color: #FFFFFF;
          }
          .login-device-container {
            max-width: 100%;
            min-height: 100vh;
            border-radius: 0;
            box-shadow: none;
            padding: 36px 20px 24px 20px;
          }
        }
      `}</style>
    </div>
  );
}
