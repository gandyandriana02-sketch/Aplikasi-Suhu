'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';

interface UserInfo {
  user_id: string;
  username: string;
  full_name: string;
  role: 'ADMIN' | 'MEMBER';
}

interface LocationItem {
  location_id: string;
  location_name: string;
  sort_order: number;
}

interface PeriodItem {
  period_id: string;
  period_label: string;
  sort_order: number;
}

interface DashboardTransaction {
  transaction_id: string;
  idempotency_key?: string;
  warehouse_id?: string;
  warehouse_code?: string;
  warehouse_name?: string;
  tanggal: string;
  location_id: string;
  location_name: string;
  period_id: string;
  period_label: string;
  suhu: number;
  max_limit_snapshot: number;
  status_suhu: 'NORMAL' | 'MELEBIHI_BATAS';
  user_id: string;
  petugas_name: string;
  client_captured_at?: string;
  server_received_at: string;
  drive_file_id: string;
  drive_file_name: string;
  drive_view_url: string;
  wa_notif_status: string;
  wa_error_message: string;
}

interface WarehouseSummaryItem {
  warehouse_id: string;
  warehouse_code: string;
  warehouse_name: string;
  totalSlots: number;
  filledSlots: number;
  unfilledSlots: number;
  overlimitCount: number;
  waFailedCount: number;
  avgTemp: number | null;
  maxTemp: { suhu: number; location_name: string; period_label: string } | null;
  minTemp: { suhu: number; location_name: string; period_label: string } | null;
}

interface DashboardData {
  tanggal: string;
  today: string;
  user: UserInfo;
  warehouse_id: string;
  is_consolidated: boolean;
  active_warehouse?: {
    warehouse_id: string;
    warehouse_code: string;
    warehouse_name: string;
  };
  allowed_warehouses: Array<{
    warehouse_id: string;
    warehouse_code: string;
    warehouse_name: string;
  }>;
  warehouses_summary?: WarehouseSummaryItem[];
  settings: {
    max_temp_limit: number;
    wa_notification_enabled?: boolean;
    app_name?: string;
  };
  locations: LocationItem[];
  periods: PeriodItem[];
  gridMap: Record<string, Record<string, DashboardTransaction | null>>;
  summary: {
    totalSlots: number;
    filledSlots: number;
    unfilledSlots: number;
    overlimitCount: number;
    waFailedCount: number;
    maxTemp: { suhu: number; location_name: string; period_label: string } | null;
    minTemp: { suhu: number; location_name: string; period_label: string } | null;
    avgTemp: number | null;
  };
  recentTransactions: DashboardTransaction[];
  is_recent_fallback?: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('all');
  const [selectedTx, setSelectedTx] = useState<DashboardTransaction | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedTx) {
        setSelectedTx(null);
      }
    },
    [selectedTx]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  async function loadDashboard(dateToFetch?: string, whId?: string) {
    setLoading(true);
    setLoadError(null);
    try {
      const qDate = dateToFetch || selectedDate;
      const qWh = whId !== undefined ? whId : selectedWarehouseId;

      const params = new URLSearchParams();
      if (qDate) params.set('tanggal', qDate);
      if (qWh && qWh !== 'all') params.set('warehouse_id', qWh);

      const res = await fetch(`/api/dashboard?${params.toString()}`, { cache: 'no-store' });
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || 'Gagal memuat data dashboard');
      }

      const json: DashboardData = await res.json();
      setData(json);
      setSelectedDate(json.tanggal);
      if (whId === undefined && json.warehouse_id) {
        setSelectedWarehouseId(json.warehouse_id);
      }
    } catch (err: any) {
      console.error('Dashboard load error:', err);
      setLoadError(err.message || 'Gagal memuat data dashboard.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  function handleDateChange(newDate: string) {
    if (!newDate) return;
    setSelectedDate(newDate);
    loadDashboard(newDate, selectedWarehouseId);
  }

  function handleWarehouseFilter(whId: string) {
    setSelectedWarehouseId(whId);
    loadDashboard(selectedDate, whId);
  }

  function formatDateIndonesian(dateStr: string): string {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      return new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(d);
    } catch {
      return dateStr;
    }
  }

  const slotPercent = data && data.summary.totalSlots > 0
    ? Math.round((data.summary.filledSlots / data.summary.totalSlots) * 100)
    : 0;

  return (
    <AppShell user={data?.user}>
      <div className="page-container" style={{ maxWidth: '960px', margin: '0 auto', padding: '16px 14px' }}>
        {/* Top Control Bar: Date & Warehouse Selector */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            padding: '16px 20px',
            border: '1px solid rgba(0, 0, 0, 0.06)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
            marginBottom: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}
        >
          {/* Row 1: Title & Date Selector */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#86868B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Dashboard Pemantauan Suhu {data?.is_consolidated ? '• All Warehouses' : ''}
              </span>
              <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#1D1D1F', margin: '2px 0 0 0', letterSpacing: '-0.3px' }}>
                {data ? formatDateIndonesian(selectedDate) : loading ? 'Memuat data...' : 'Dashboard Operasional'}
              </h1>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {selectedDate !== data?.today && (
                <button
                  type="button"
                  onClick={() => handleDateChange(data?.today || '')}
                  style={{
                    backgroundColor: '#E0F2FE',
                    color: '#0071E3',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Hari Ini
                </button>
              )}

              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                style={{
                  height: '36px',
                  padding: '0 10px',
                  borderRadius: '10px',
                  border: '1px solid #D2D2D7',
                  fontSize: '12px',
                  color: '#1D1D1F',
                  backgroundColor: '#F5F5F7',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              />
            </div>
          </div>

          {/* Row 2: Warehouse Segmented Filter (Admin & Multi-Warehouse) */}
          {data && data.allowed_warehouses && data.allowed_warehouses.length > 1 && data.user.role === 'ADMIN' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
              <button
                type="button"
                onClick={() => handleWarehouseFilter('all')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '16px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: selectedWarehouseId === 'all' ? '#0071E3' : '#F5F5F7',
                  color: selectedWarehouseId === 'all' ? '#FFFFFF' : '#64748B',
                  transition: 'all 0.15s ease'
                }}
              >
                Semua Gudang (Konsolidasi) • All Warehouses
              </button>

              {data.allowed_warehouses.map((wh) => (
                <button
                  key={wh.warehouse_id}
                  type="button"
                  onClick={() => handleWarehouseFilter(wh.warehouse_id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '16px',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    backgroundColor: selectedWarehouseId === wh.warehouse_id ? '#0071E3' : '#F5F5F7',
                    color: selectedWarehouseId === wh.warehouse_id ? '#FFFFFF' : '#64748B',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {wh.warehouse_code} — {wh.warehouse_name}
                </button>
              ))}
            </div>
          )}
        </div>

        {loading && !data ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#86868B', fontSize: '14px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid #0071E3', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px auto' }} />
            <div>Memuat data pemantauan operasional...</div>
            <style jsx>{`
              @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
          </div>
        ) : loadError && !data ? (
          <div
            role="alert"
            style={{
              textAlign: 'center',
              padding: '40px 24px',
              backgroundColor: '#FFFFFF',
              borderRadius: '24px',
              border: '1px solid #FEE2E2',
              boxShadow: '0 4px 20px rgba(239, 68, 68, 0.08)',
              margin: '20px auto',
              maxWidth: '480px'
            }}
          >
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#FEE2E2', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', fontSize: '20px', fontWeight: 800 }}>
              !
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1D1D1F', marginBottom: '8px' }}>
              Gagal Memuat Data Operasional
            </h3>
            <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '20px' }}>
              {loadError}
            </p>
            <button
              type="button"
              onClick={() => loadDashboard()}
              style={{
                backgroundColor: '#0071E3',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                padding: '10px 24px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0, 113, 227, 0.25)'
              }}
            >
              Coba Lagi
            </button>
          </div>
        ) : data ? (
          (() => {
            const maxTempLimit = data.settings?.max_temp_limit ?? 25.0;
            return (
          <>
            {/* 1. Apple HIG Bento KPI Grid */}
            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '24px' }}>
              {/* Card 1: Slot Kelengkapan */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '20px',
                  padding: '16px',
                  border: '1px solid rgba(0,0,0,0.06)',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#86868B', textTransform: 'uppercase' }}>
                    Kelengkapan Slot (Completion)
                  </span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#86868B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 20v-6M6 20V10M18 20V4"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: '#1D1D1F' }}>
                    {data.summary.filledSlots} / {data.summary.totalSlots}
                  </div>
                  <div style={{ fontSize: '11px', color: '#86868B', marginTop: '2px' }}>
                    {slotPercent}% slot telah selesai dicatat
                  </div>
                </div>
                {/* Visual Track */}
                <div style={{ height: '6px', borderRadius: '3px', backgroundColor: '#F1F5F9', overflow: 'hidden' }}>
                  <div style={{ width: `${slotPercent}%`, height: '100%', backgroundColor: slotPercent === 100 ? '#34C759' : '#0071E3', borderRadius: '3px', transition: 'width 0.4s ease' }} />
                </div>
              </div>

              {/* Card 2: Suhu Tertinggi Hero */}
              <div
                style={{
                  backgroundColor: data.summary.maxTemp && data.summary.maxTemp.suhu > maxTempLimit ? '#FEECEB' : '#FFFFFF',
                  borderRadius: '20px',
                  padding: '16px',
                  border: `1px solid ${data.summary.maxTemp && data.summary.maxTemp.suhu > maxTempLimit ? '#FCA5A5' : 'rgba(0,0,0,0.06)'}`,
                  boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: data.summary.maxTemp && data.summary.maxTemp.suhu > maxTempLimit ? '#FF3B30' : '#86868B', textTransform: 'uppercase' }}>
                    Suhu Tertinggi
                  </span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={data.summary.maxTemp && data.summary.maxTemp.suhu > maxTempLimit ? '#FF3B30' : '#86868B'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="18 15 12 9 6 15"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: data.summary.maxTemp && data.summary.maxTemp.suhu > maxTempLimit ? '#FF3B30' : '#1D1D1F' }}>
                    {data.summary.maxTemp ? `${data.summary.maxTemp.suhu.toFixed(1).replace('.', ',')}°C` : '–'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#86868B', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {data.summary.maxTemp ? `${data.summary.maxTemp.location_name} • ${data.summary.maxTemp.period_label}` : 'Belum ada data'}
                  </div>
                </div>
              </div>

              {/* Card 3: Suhu Terendah Hero */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '20px',
                  padding: '16px',
                  border: '1px solid rgba(0,0,0,0.06)',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#86868B', textTransform: 'uppercase' }}>
                    Suhu Terendah
                  </span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0071E3" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: '#0071E3' }}>
                    {data.summary.minTemp ? `${data.summary.minTemp.suhu.toFixed(1).replace('.', ',')}°C` : '–'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#86868B', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {data.summary.minTemp ? `${data.summary.minTemp.location_name} • ${data.summary.minTemp.period_label}` : 'Belum ada data'}
                  </div>
                </div>
              </div>

              {/* Card 4: Overlimit Warning */}
              <div
                style={{
                  backgroundColor: data.summary.overlimitCount > 0 ? '#FEECEB' : '#FFFFFF',
                  borderRadius: '20px',
                  padding: '16px',
                  border: `1px solid ${data.summary.overlimitCount > 0 ? '#FF3B30' : 'rgba(0,0,0,0.06)'}`,
                  boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: data.summary.overlimitCount > 0 ? '#FF3B30' : '#86868B', textTransform: 'uppercase' }}>
                    Penyimpangan Suhu
                  </span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={data.summary.overlimitCount > 0 ? '#FF3B30' : '#34C759'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: data.summary.overlimitCount > 0 ? '#FF3B30' : '#34C759' }}>
                    {data.summary.overlimitCount}
                  </div>
                  <div style={{ fontSize: '11px', color: '#86868B', marginTop: '2px' }}>
                    {data.summary.overlimitCount > 0 ? 'Melewati batas maksimal' : 'Semua titik suhu aman'}
                  </div>
                </div>
              </div>

              {/* Card 5: WhatsApp Gateway Status */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '20px',
                  padding: '16px',
                  border: '1px solid rgba(0,0,0,0.06)',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#86868B', textTransform: 'uppercase' }}>
                    Fonnte WA Gateway
                  </span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#86868B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                </div>
                <div>
                  {data.settings?.wa_notification_enabled === false ? (
                    <>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: '#86868B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#86868B' }} />
                        Nonaktif
                      </div>
                      <div style={{ fontSize: '11px', color: '#86868B', marginTop: '4px' }}>
                        Peringatan WA dinonaktifkan di Pengaturan
                      </div>
                    </>
                  ) : data.summary.waFailedCount > 0 ? (
                    <>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: '#FF9500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#FF9500' }} />
                        Perlu Ditinjau
                      </div>
                      <div style={{ fontSize: '11px', color: '#FF3B30', marginTop: '4px' }}>
                        {data.summary.waFailedCount} pesan gagal kirim
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: '#34C759', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#34C759' }} />
                        Aktif
                      </div>
                      <div style={{ fontSize: '11px', color: '#86868B', marginTop: '4px' }}>
                        Notifikasi instan otomatis siap
                      </div>
                    </>
                  )}
                </div>
              </div>
            </section>

            {/* 2. Consolidated Warehouses Breakdown vs Interactive 2D Slot Matrix */}
            {data.is_consolidated ? (
              <section
                data-testid="consolidated-warehouses-section"
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '24px',
                  border: '1px solid rgba(0,0,0,0.06)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                  overflow: 'hidden',
                  marginBottom: '24px'
                }}
              >
                <div
                  style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid rgba(0,0,0,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '10px'
                  }}
                >
                  <div>
                    <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1D1D1F', margin: 0 }}>
                      Ringkasan Konsolidasi Antargudang (All Warehouses Consolidated Summary)
                    </h2>
                    <span style={{ fontSize: '11px', color: '#86868B' }}>
                      Status operasional dan kelengkapan (completion metrics) seluruh gudang aktif
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#0071E3', backgroundColor: '#E0F2FE', padding: '3px 10px', borderRadius: '12px' }}>
                    {data.warehouses_summary?.length || 0} Gudang Aktif
                  </span>
                </div>

                <div className="no-scrollbar" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontWeight: 700, fontSize: '12px' }}>
                        <th style={{ padding: '12px 16px' }}>Gudang / Warehouse</th>
                        <th style={{ padding: '12px 14px', textAlign: 'center' }}>Kelengkapan (Completion)</th>
                        <th style={{ padding: '12px 14px', textAlign: 'center' }}>Rata-rata Suhu</th>
                        <th style={{ padding: '12px 14px', textAlign: 'center' }}>Tertinggi / Terendah</th>
                        <th style={{ padding: '12px 14px', textAlign: 'center' }}>Penyimpangan</th>
                        <th style={{ padding: '12px 16px', textAlign: 'right' }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.warehouses_summary && data.warehouses_summary.length > 0 ? (
                        data.warehouses_summary.map((wh) => {
                          const whPercent = wh.totalSlots > 0 ? Math.round((wh.filledSlots / wh.totalSlots) * 100) : 0;
                          return (
                            <tr key={wh.warehouse_id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                              <td style={{ padding: '14px 16px' }}>
                                <div style={{ fontWeight: 700, color: '#1D1D1F' }}>
                                  {wh.warehouse_code} — {wh.warehouse_name}
                                </div>
                                <div style={{ fontSize: '11px', color: '#86868B' }}>
                                  ID: {wh.warehouse_id}
                                </div>
                              </td>
                              <td style={{ padding: '14px', textAlign: 'center' }}>
                                <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                  <span style={{ fontWeight: 700, color: whPercent === 100 ? '#1D8338' : '#1D1D1F' }}>
                                    {wh.filledSlots} / {wh.totalSlots} ({whPercent}%)
                                  </span>
                                  <div style={{ width: '80px', height: '5px', backgroundColor: '#F1F5F9', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{ width: `${whPercent}%`, height: '100%', backgroundColor: whPercent === 100 ? '#34C759' : '#0071E3', borderRadius: '3px' }} />
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: '14px', textAlign: 'center', fontWeight: 600, color: '#1D1D1F' }}>
                                {wh.avgTemp !== null ? `${wh.avgTemp.toFixed(1).replace('.', ',')}°C` : '–'}
                              </td>
                              <td style={{ padding: '14px', textAlign: 'center', fontSize: '12px' }}>
                                <div>
                                  <span style={{ color: '#FF3B30', fontWeight: 600 }}>
                                    ▲ {wh.maxTemp ? `${wh.maxTemp.suhu.toFixed(1).replace('.', ',')}°C` : '–'}
                                  </span>
                                  {' / '}
                                  <span style={{ color: '#0071E3', fontWeight: 600 }}>
                                    ▼ {wh.minTemp ? `${wh.minTemp.suhu.toFixed(1).replace('.', ',')}°C` : '–'}
                                  </span>
                                </div>
                              </td>
                              <td style={{ padding: '14px', textAlign: 'center' }}>
                                {wh.overlimitCount > 0 ? (
                                  <span style={{ backgroundColor: '#FEECEB', color: '#FF3B30', padding: '3px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 700 }}>
                                    {wh.overlimitCount} Overlimit
                                  </span>
                                ) : (
                                  <span style={{ backgroundColor: '#E8F8EE', color: '#1D8338', padding: '3px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 700 }}>
                                    Aman (0)
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                                <button
                                  type="button"
                                  onClick={() => handleWarehouseFilter(wh.warehouse_id)}
                                  style={{
                                    backgroundColor: '#F5F5F7',
                                    color: '#0071E3',
                                    border: 'none',
                                    borderRadius: '10px',
                                    padding: '6px 12px',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                  }}
                                >
                                  Buka Matriks →
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#86868B' }}>
                            Belum ada ringkasan gudang yang tersedia.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : (
              <section
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '24px',
                  border: '1px solid rgba(0,0,0,0.06)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                  overflow: 'hidden',
                  marginBottom: '24px'
                }}
              >
                <div
                  style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid rgba(0,0,0,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '10px'
                  }}
                >
                  <div>
                    <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1D1D1F', margin: 0 }}>
                      Matriks Pemeriksaan Slot Harian
                    </h2>
                    <span style={{ fontSize: '11px', color: '#86868B' }}>
                      Ketuk sel matriks untuk menginspeksi rincian audit & foto bukti GPS
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#0071E3', backgroundColor: '#E0F2FE', padding: '3px 10px', borderRadius: '12px' }}>
                    Batas: {maxTempLimit}°C
                  </span>
                </div>

                <div className="no-scrollbar" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontWeight: 700 }}>
                        <th style={{ padding: '12px 16px', textAlign: 'left', minWidth: '160px' }}>
                          Titik Lokasi
                        </th>
                        {data.periods.map((prd) => (
                          <th key={prd.period_id} style={{ padding: '12px 14px', minWidth: '100px' }}>
                            {prd.period_label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.locations.map((loc) => (
                        <tr key={loc.location_id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#1D1D1F' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0071E3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                <circle cx="12" cy="10" r="3"/>
                              </svg>
                              {loc.location_name}
                            </span>
                          </td>
                          {data.periods.map((prd) => {
                            const tx = data.gridMap[loc.location_id]?.[prd.period_id];
                            if (!tx) {
                              return (
                                <td key={prd.period_id} style={{ padding: '8px' }}>
                                  <div
                                    style={{
                                      height: '40px',
                                      borderRadius: '10px',
                                      backgroundColor: '#F5F5F7',
                                      color: '#86868B',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '14px',
                                      fontWeight: 600
                                    }}
                                  >
                                    –
                                  </div>
                                </td>
                              );
                            }

                            const isOver = tx.status_suhu === 'MELEBIHI_BATAS';
                            return (
                              <td key={prd.period_id} style={{ padding: '8px' }}>
                                <button
                                  type="button"
                                  onClick={() => setSelectedTx(tx)}
                                  title={`Inspeksi ${loc.location_name} - ${prd.period_label}`}
                                  style={{
                                    width: '100%',
                                    height: '40px',
                                    borderRadius: '10px',
                                    backgroundColor: isOver ? '#FEECEB' : '#E8F8EE',
                                    border: `1.5px solid ${isOver ? '#FCA5A5' : '#86EFAC'}`,
                                    color: isOver ? '#FF3B30' : '#1D8338',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '3px',
                                    fontSize: '13px',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    transition: 'transform 0.1s ease',
                                    outline: 'none'
                                  }}
                                >
                                  <span>{tx.suhu.toFixed(1).replace('.', ',')}°</span>
                                  {isOver && <span>▲</span>}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* 3. Feed Transaksi Terkini */}
            <section
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '24px',
                border: '1px solid rgba(0,0,0,0.06)',
                padding: '20px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                marginBottom: '40px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1D1D1F', margin: 0 }}>
                  Feed Transaksi Terkini
                </h2>
                <span style={{ fontSize: '11px', color: '#86868B' }}>
                  {data.recentTransactions.length > 0 && data.is_recent_fallback
                    ? `${data.recentTransactions.length} aktivitas terbaru (${data.is_consolidated ? 'Semua Gudang' : data.active_warehouse?.warehouse_name || 'Warehouse'})`
                    : `${data.recentTransactions.length} transaksi hari ini`}
                </span>
              </div>

              {data.recentTransactions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: '#86868B', fontSize: '13px' }}>
                  Belum ada transaksi suhu yang tersimpan untuk {data.is_consolidated ? 'seluruh gudang' : data.active_warehouse?.warehouse_name || 'warehouse ini'}.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {data.recentTransactions.map((tx) => {
                    const isOver = tx.status_suhu === 'MELEBIHI_BATAS';
                    return (
                      <div
                        key={tx.transaction_id}
                        onClick={() => setSelectedTx(tx)}
                        style={{
                          backgroundColor: '#F8FAFC',
                          borderRadius: '16px',
                          padding: '12px 16px',
                          border: '1px solid #E2E8F0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                          cursor: 'pointer',
                          transition: 'background-color 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '12px',
                              backgroundColor: isOver ? '#FEECEB' : '#E8F8EE',
                              color: isOver ? '#FF3B30' : '#1D8338',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '13px',
                              fontWeight: 800
                            }}
                          >
                            {tx.suhu.toFixed(1).replace('.', ',')}°
                          </div>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#1D1D1F' }}>
                              {tx.warehouse_code ? `${tx.warehouse_code} • ` : ''}{tx.location_name} • {tx.period_label}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748B' }}>
                              Oleh {tx.petugas_name} • {tx.tanggal} {tx.server_received_at?.split(' ')[1] || ''} WIB
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              backgroundColor: isOver ? '#FEECEB' : '#E8F8EE',
                              color: isOver ? '#FF3B30' : '#1D8338',
                              padding: '2px 8px',
                              borderRadius: '10px'
                            }}
                          >
                            {isOver ? 'Overlimit' : 'Normal'}
                          </span>
                          <span style={{ fontSize: '12px', color: '#0071E3', fontWeight: 600 }}>
                            Lihat Bukti ↗
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
            );
          })()
        ) : null}

        {/* 4. Lightbox Detail Audit Modal (Apple Lightbox) */}
        {selectedTx && (
          <div
            role="dialog"
            aria-modal="true"
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px'
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedTx(null);
            }}
          >
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '28px',
                maxWidth: '460px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                padding: '24px',
                boxSizing: 'border-box'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#86868B', textTransform: 'uppercase' }}>
                    Audit Bukti Transaksi
                  </span>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1D1D1F', margin: '2px 0 0 0' }}>
                    {selectedTx.location_name} • {selectedTx.period_label}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTx(null)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: '#F5F5F7',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#86868B',
                    cursor: 'pointer'
                  }}
                  aria-label="Tutup"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Photo View */}
              {selectedTx.drive_view_url && (
                <div style={{ borderRadius: '16px', overflow: 'hidden', marginBottom: '16px', backgroundColor: '#000000', textAlign: 'center' }}>
                  <img
                    src={selectedTx.drive_view_url}
                    alt="Foto bukti suhu"
                    style={{ maxWidth: '100%', maxHeight: '240px', objectFit: 'contain' }}
                  />
                </div>
              )}

              {/* Audit Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F1F5F9' }}>
                  <span style={{ color: '#64748B' }}>Suhu Tercatat:</span>
                  <strong style={{ fontSize: '15px', color: selectedTx.status_suhu === 'MELEBIHI_BATAS' ? '#FF3B30' : '#1D1D1F' }}>
                    {selectedTx.suhu.toFixed(1).replace('.', ',')}°C ({selectedTx.status_suhu})
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F1F5F9' }}>
                  <span style={{ color: '#64748B' }}>Petugas Penginput:</span>
                  <strong style={{ color: '#1D1D1F' }}>{selectedTx.petugas_name}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F1F5F9' }}>
                  <span style={{ color: '#64748B' }}>Waktu Server Resmi:</span>
                  <strong style={{ color: '#1D1D1F' }}>{selectedTx.server_received_at} WIB</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F1F5F9' }}>
                  <span style={{ color: '#64748B' }}>Status Notifikasi WhatsApp:</span>
                  <strong style={{ color: selectedTx.wa_notif_status === 'SENT' ? '#34C759' : selectedTx.wa_notif_status === 'FAILED' ? '#FF3B30' : '#86868B' }}>
                    {selectedTx.wa_notif_status}
                  </strong>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '10px' }}>
                {selectedTx.drive_view_url && (
                  <a
                    href={selectedTx.drive_view_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      flex: 1,
                      height: '44px',
                      backgroundColor: '#0071E3',
                      color: '#FFFFFF',
                      borderRadius: '12px',
                      fontSize: '13px',
                      fontWeight: 600,
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(0, 113, 227, 0.3)'
                    }}
                  >
                    Buka File Asli Drive ↗
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedTx(null)}
                  style={{
                    flex: 1,
                    height: '44px',
                    backgroundColor: '#F5F5F7',
                    color: '#1D1D1F',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
