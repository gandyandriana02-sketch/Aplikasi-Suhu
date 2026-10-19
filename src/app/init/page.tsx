'use client';

import { useState } from 'react';

export default function InitPage() {
  const [setupKey, setSetupKey] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleInit(e: React.FormEvent) {
    e.preventDefault();
    if (!setupKey) return;

    setStatus('loading');
    setMessage('Menghubungkan ke Google Sheets API & membuat 6 sheet...');

    try {
      const res = await fetch('/api/init', {
        method: 'POST',
        headers: {
          'x-setup-key': setupKey
        }
      });

      const data = await res.json();
      if (!res.ok) {
        setStatus('error');
        setMessage(data.error || 'Inisialisasi gagal.');
      } else {
        setStatus('success');
        setMessage(data.message || 'Inisialisasi sistem berhasil.');
      }
    } catch (err: any) {
      setStatus('error');
      setMessage('Koneksi terputus: ' + (err.message || 'Unknown error'));
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#F3F6F8',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '16px'
    }}>
      <div style={{
        maxWidth: '460px',
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid #CBD3D8',
        padding: '24px',
        boxSizing: 'border-box'
      }}>
        <h1 style={{
          fontSize: '20px',
          fontWeight: 600,
          color: '#1B262C',
          marginBottom: '8px'
        }}>
          Inisialisasi Sistem
        </h1>
        <p style={{
          fontSize: '14px',
          color: '#5F6B73',
          marginBottom: '20px',
          lineHeight: 1.5
        }}>
          Halaman pembantu untuk menyiapkan 8 lembar kerja (*sheet*) dan data master awal di Google Spreadsheet Anda.
        </p>

        {status === 'success' ? (
          <div style={{
            backgroundColor: '#E3F4EA',
            border: '1px solid #1B7F4B',
            borderRadius: '12px',
            padding: '16px',
            color: '#1B7F4B',
            fontSize: '14px',
            lineHeight: 1.5
          }}>
            <p style={{ fontWeight: 600, margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>Inisialisasi Berhasil</span>
            </p>
            <p style={{ margin: 0 }}>{message}</p>
            <div style={{ marginTop: '16px' }}>
              <a
                href="/login"
                style={{
                  display: 'inline-block',
                  backgroundColor: '#0071E3',
                  color: '#FFFFFF',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 600
                }}
              >
                Menuju Halaman Login
              </a>
            </div>
          </div>
        ) : (
          <form onSubmit={handleInit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 500,
                color: '#1B262C',
                marginBottom: '6px'
              }}>
                Kunci Inisialisasi (SETUP_KEY)
              </label>
              <input
                type="password"
                value={setupKey}
                onChange={e => setSetupKey(e.target.value)}
                placeholder="Masukkan SETUP_KEY Anda"
                required
                disabled={status === 'loading'}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #CBD3D8',
                  fontSize: '15px',
                  color: '#1B262C',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {status === 'error' && (
              <div style={{
                backgroundColor: '#FDECEA',
                border: '1px solid #C62828',
                borderRadius: '8px',
                padding: '12px',
                color: '#C62828',
                fontSize: '14px',
                marginBottom: '16px'
              }}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: status === 'loading' ? '#CBD3D8' : '#1565A6',
                color: '#FFFFFF',
                borderRadius: '8px',
                border: 'none',
                fontSize: '15px',
                fontWeight: 600,
                cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                minHeight: '44px'
              }}
            >
              {status === 'loading' ? 'Memproses Inisialisasi...' : 'Inisialisasi Sistem Sekarang'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
