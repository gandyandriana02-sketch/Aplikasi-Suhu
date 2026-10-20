'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface IdleSessionManagerProps {
  idleMinutes: number;
}

export function IdleSessionManager({ idleMinutes }: IdleSessionManagerProps) {
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(30);

  const lastActivityRef = useRef<number>(Date.now());
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const performLogout = useCallback(async () => {
    try {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
      sessionStorage.removeItem('wh_cached_user');
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.warn('Logout error:', e);
    } finally {
      window.location.href = `/login?reason=idle_timeout&mins=${idleMinutes}`;
    }
  }, [idleMinutes]);

  const stayLoggedIn = useCallback(() => {
    setShowWarning(false);
    setCountdown(30);
    lastActivityRef.current = Date.now();
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    // Ping auth/me to keep cookie fresh
    fetch('/api/auth/me', { cache: 'no-store' }).catch(() => {});
  }, []);

  // Track user activity
  useEffect(() => {
    if (!idleMinutes || idleMinutes <= 0) return;

    let throttleTimeout: NodeJS.Timeout | null = null;
    const handleActivity = () => {
      if (showWarning) return; // If warning is showing, don't silently dismiss via mousemove; require button click
      const now = Date.now();
      if (!throttleTimeout) {
        lastActivityRef.current = now;
        throttleTimeout = setTimeout(() => {
          throttleTimeout = null;
        }, 1000);
      }
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    events.forEach(evt => window.addEventListener(evt, handleActivity, { passive: true }));

    // Check timer every second
    const totalIdleMs = idleMinutes * 60 * 1000;
    const warningMs = Math.max(10000, totalIdleMs - 30000); // 30s before timeout

    checkIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;

      if (elapsed >= totalIdleMs) {
        performLogout();
      } else if (elapsed >= warningMs && !showWarning) {
        const remainingSeconds = Math.max(1, Math.ceil((totalIdleMs - elapsed) / 1000));
        setCountdown(remainingSeconds);
        setShowWarning(true);

        if (!countdownIntervalRef.current) {
          countdownIntervalRef.current = setInterval(() => {
            setCountdown(prev => {
              if (prev <= 1) {
                if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
                performLogout();
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        }
      }
    }, 1000);

    return () => {
      events.forEach(evt => window.removeEventListener(evt, handleActivity));
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [idleMinutes, showWarning, performLogout]);

  if (!showWarning || !idleMinutes || idleMinutes <= 0) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="idle-warning-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '28px',
          maxWidth: '440px',
          width: '100%',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.25)',
          padding: '28px 24px',
          textAlign: 'center',
          boxSizing: 'border-box'
        }}
      >
        {/* Warning Icon Badge */}
        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: '#FFFBEB',
            border: '2px solid #FDE68A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            color: '#D97706'
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>

        <h3
          id="idle-warning-title"
          style={{
            fontSize: '19px',
            fontWeight: 800,
            color: '#1D1D1F',
            margin: '0 0 8px 0',
            letterSpacing: '-0.3px'
          }}
        >
          Sesi Anda Akan Berakhir
        </h3>

        <p
          style={{
            fontSize: '13.5px',
            color: '#64748B',
            lineHeight: 1.5,
            margin: '0 0 20px 0'
          }}
        >
          Tidak ada aktivitas terdeteksi pada perangkat. Untuk menjaga keamanan data operasional gudang, akun Anda akan otomatis ditutup dalam:
        </p>

        {/* Countdown Pill Indicator */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 20px',
            borderRadius: '30px',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            marginBottom: '24px'
          }}
        >
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#EF4444', animation: 'pulse 1s infinite' }} />
          <span style={{ fontSize: '20px', fontWeight: 800, color: '#DC2626', fontVariantNumeric: 'tabular-nums' }}>
            {countdown} detik
          </span>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            type="button"
            onClick={stayLoggedIn}
            style={{
              height: '46px',
              backgroundColor: '#0071E3',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '14px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(0, 113, 227, 0.35)',
              transition: 'transform 0.1s ease'
            }}
          >
            Tetap Masuk & Lanjutkan Kerja
          </button>

          <button
            type="button"
            onClick={performLogout}
            style={{
              height: '42px',
              backgroundColor: '#F5F5F7',
              color: '#64748B',
              border: 'none',
              borderRadius: '14px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Logout Sekarang
          </button>
        </div>
      </div>
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.9); }
        }
      `}</style>
    </div>
  );
}
