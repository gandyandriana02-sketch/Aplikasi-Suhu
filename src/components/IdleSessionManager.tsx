'use client';

import { useEffect, useRef, useCallback } from 'react';

interface IdleSessionManagerProps {
  idleMinutes: number;
}

/**
 * Invisible Idle Session Manager (FR-006 & Section 8.1)
 * Monitors user inactivity in the background. When inactivity reaches idleMinutes,
 * it immediately and silently performs logout, terminating the session and redirecting
 * straight to /login without any countdown modal or prompts.
 */
export function IdleSessionManager({ idleMinutes }: IdleSessionManagerProps) {
  const lastActivityRef = useRef<number>(Date.now());
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isLoggingOutRef = useRef<boolean>(false);

  const performLogout = useCallback(async () => {
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;

    try {
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
      sessionStorage.removeItem('wh_cached_user');
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.warn('Auto-logout error:', e);
    } finally {
      // Immediately redirect to clean login screen without query parameters or banners
      window.location.href = '/login';
    }
  }, []);

  // Track user activity and check elapsed time
  useEffect(() => {
    if (!idleMinutes || idleMinutes <= 0) return;

    const totalIdleMs = idleMinutes * 60 * 1000;
    lastActivityRef.current = Date.now();
    isLoggingOutRef.current = false;

    let throttleTimeout: NodeJS.Timeout | null = null;
    const handleActivity = () => {
      if (isLoggingOutRef.current) return;
      const now = Date.now();
      if (!throttleTimeout) {
        lastActivityRef.current = now;
        throttleTimeout = setTimeout(() => {
          throttleTimeout = null;
        }, 1000);
      }
    };

    // When returning to tab or unlocking device, check if already expired
    const handleVisibilityOrFocus = () => {
      if (isLoggingOutRef.current) return;
      if (document.visibilityState === 'visible' || document.hasFocus()) {
        const elapsed = Date.now() - lastActivityRef.current;
        if (elapsed >= totalIdleMs) {
          performLogout();
        }
      }
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    events.forEach((evt) => window.addEventListener(evt, handleActivity, { passive: true }));
    window.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    // Periodic check every 1 second
    checkIntervalRef.current = setInterval(() => {
      if (isLoggingOutRef.current) return;
      const elapsed = Date.now() - lastActivityRef.current;
      if (elapsed >= totalIdleMs) {
        performLogout();
      }
    }, 1000);

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handleActivity));
      window.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
    };
  }, [idleMinutes, performLogout]);

  // Silent component without UI modal per direct security requirements
  return null;
}
