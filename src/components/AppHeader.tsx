'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { WarehouseSwitchModal } from './WarehouseSwitchModal';
import { AppIcon } from './AppIcon';

interface AppHeaderProps {
  user?: {
    full_name?: string;
    role?: string;
    user_id?: string;
    username?: string;
    active_warehouse_id?: string;
    allowed_warehouses?: Array<{ warehouse_id: string; warehouse_code: string; warehouse_name: string }>;
  };
}

export function AppHeader({ user }: AppHeaderProps) {
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [activeWarehouse, setActiveWarehouse] = useState<{
    warehouse_id: string;
    warehouse_code: string;
    warehouse_name: string;
  } | null>(null);
  const [appBranding, setAppBranding] = useState<{ app_name: string; app_icon: string }>({
    app_name: 'Warehouse Temperature Report',
    app_icon: 'thermometer'
  });

  // Match or fetch active warehouse & app branding
  useEffect(() => {
    if (user?.allowed_warehouses && user.allowed_warehouses.length > 0) {
      const active = user.allowed_warehouses.find(
        (w) => w.warehouse_id === user.active_warehouse_id
      ) || user.allowed_warehouses[0];
      if (active) {
        setActiveWarehouse(active);
      }
    }

    fetch('/api/warehouses', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.warehouses?.length > 0) {
          const match = data.warehouses.find(
            (w: any) => w.warehouse_id === (user?.active_warehouse_id || data.active_warehouse_id)
          ) || data.warehouses[0];
          setActiveWarehouse(match);
        }
        if (data?.app_name || data?.app_icon) {
          setAppBranding({
            app_name: data.app_name || 'Warehouse Temperature Report',
            app_icon: data.app_icon || 'thermometer'
          });
        }
      })
      .catch(() => {});
  }, [user]);

  // Initials for avatar circle
  const initials = user?.full_name
    ? user.full_name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'WH';

  return (
    <>
      <header
        className="no-print"
        style={{
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)'
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          {/* Brand Logo & Title */}
          <Link
            href="/dashboard"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textDecoration: 'none'
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '11px',
                background: 'linear-gradient(135deg, #0071E3 0%, #0284C7 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0, 113, 227, 0.3)'
              }}
            >
              <AppIcon name={appBranding.app_icon || 'thermometer'} size={20} color="#FFFFFF" strokeWidth={2.2} />
            </div>

            <div>
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  color: '#1D1D1F',
                  letterSpacing: '-0.3px',
                  lineHeight: 1.1
                }}
              >
                {appBranding.app_name || 'Warehouse Temperature'}
              </div>
              <div style={{ fontSize: '11px', color: '#86868B', marginTop: '1px' }}>
                {activeWarehouse ? `${activeWarehouse.warehouse_code} — ${activeWarehouse.warehouse_name}` : 'Monitoring Cold Chain'}
              </div>
            </div>
          </Link>

          {/* User Profile Pill Button (Apple HIG Style) */}
          {user && (
            <button
              type="button"
              onClick={() => setShowSwitchModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#FFFFFF',
                padding: '4px 12px 4px 6px',
                borderRadius: '30px',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                cursor: 'pointer',
                outline: 'none',
                transition: 'transform 0.15s ease'
              }}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0284C7 0%, #0071E3 100%)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 800
                }}
              >
                {initials}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.1 }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#1D1D1F' }}>
                  {user.full_name}
                </span>
                <span style={{ fontSize: '10px', fontWeight: 600, color: '#86868B' }}>
                  {user.role === 'ADMIN' ? 'Administrator' : 'Member'}
                </span>
              </div>
            </button>
          )}
        </div>
      </header>

      {/* Apple HIG Action Sheet for Warehouse Switching & Profile Menu (Modul 04) */}
      <WarehouseSwitchModal
        isOpen={showSwitchModal}
        onClose={() => setShowSwitchModal(false)}
        user={user}
        currentWarehouseId={activeWarehouse?.warehouse_id}
      />
    </>
  );
}
