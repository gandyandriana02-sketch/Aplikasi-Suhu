'use client';

import React from 'react';
import { AppHeader } from './AppHeader';
import { IdleSessionManager } from './IdleSessionManager';

interface AppShellProps {
  user?: {
    full_name?: string;
    role?: string;
    user_id?: string;
    username?: string;
    active_warehouse_id?: string;
    allowed_warehouses?: Array<{ warehouse_id: string; warehouse_code: string; warehouse_name: string }>;
  };
  children: React.ReactNode;
  activeAdminTab?: string;
  onAdminTabChange?: (tab: string) => void;
}

export function AppShell({
  user,
  children
}: AppShellProps) {
  const [cachedUser, setCachedUser] = React.useState<AppShellProps['user']>(user);
  const [idleTimeoutMinutes, setIdleTimeoutMinutes] = React.useState<number>(0);

  React.useEffect(() => {
    // Initial fetch to ensure real-time profile synchronization from sheet USERS & idle settings
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setCachedUser(data.user);
          try {
            sessionStorage.setItem('wh_cached_user', JSON.stringify(data.user));
          } catch {}
        }
        if (typeof data?.idle_timeout_minutes === 'number') {
          setIdleTimeoutMinutes(data.idle_timeout_minutes);
        }
      })
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    if (user) {
      setCachedUser((prev) => (prev ? { ...prev, ...user } : user));
      try {
        sessionStorage.setItem('wh_cached_user', JSON.stringify(user));
      } catch {}
    } else {
      try {
        const stored = sessionStorage.getItem('wh_cached_user');
        if (stored) {
          setCachedUser(JSON.parse(stored));
        }
      } catch {}
    }
  }, [user]);

  const activeUser = cachedUser || user;

  return (
    <div className="app-unified-shell">
      {/* 1. Frosted Glass Top Header */}
      <AppHeader user={activeUser} />

      {/* 2. Main Workspace (Full width / Centered responsive containers) */}
      <main className="app-unified-main apple-view-enter">
        {children}
      </main>

      {/* 3. Idle Auto-Logout Manager (FR-006 & Section 8.1) */}
      <IdleSessionManager idleMinutes={idleTimeoutMinutes} />
    </div>
  );
}

