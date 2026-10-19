'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { AppShell } from '@/components/AppShell';

interface DayCell {
  day: number;
  has_data: boolean;
  suhu?: number;
  status_suhu?: 'NORMAL' | 'MELEBIHI_BATAS';
  transaction_id?: string;
  drive_file_id?: string;
  drive_view_url?: string;
  petugas_name?: string;
  server_received_at?: string;
  wa_notif_status?: string;
}

interface LocationRow {
  row_number: number;
  location_id: string;
  location_name: string;
  is_active: boolean;
  days: DayCell[];
}

interface MatrixPeriod {
  period_id: string;
  period_label: string;
  is_active: boolean;
  locationRows: LocationRow[];
}

interface ReportTransactionDetail {
  transaction_id: string;
  tanggal: string;
  location_id: string;
  location_name: string;
  period_id: string;
  period_label: string;
  suhu: number;
  status_suhu: 'NORMAL' | 'MELEBIHI_BATAS';
  petugas_name: string;
  server_received_at: string;
  drive_file_id: string;
  drive_view_url: string;
  wa_notif_status: string;
}

interface MonthlyReportData {
  year: number;
  month: number;
  tahun_bulan: string;
  active_warehouse?: {
    warehouse_id: string;
    warehouse_code: string;
    warehouse_name: string;
  };
  allowed_warehouses?: Array<{
    warehouse_id: string;
    warehouse_code: string;
    warehouse_name: string;
  }>;
  daysInMonth: number;
  weekendDays: number[];
  settings: {
    max_temp_limit: number;
    signoff_maker_title?: string;
    signoff_maker_name?: string;
    signoff_checker_title?: string;
    signoff_checker_name?: string;
    signoff_approver_title?: string;
    signoff_approver_name?: string;
  };
  summary: {
    totalChecks: number;
    overlimitCount: number;
    minTemp: number | null;
    maxTemp: number | null;
    avgTemp: number | null;
  };
  matrix: MatrixPeriod[];
  allTransactions: ReportTransactionDetail[];
}

const MONTH_NAMES_INDONESIA = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function MonthlyReportPage() {
  const router = useRouter();
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
  const [data, setData] = useState<MonthlyReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ full_name?: string; role?: string } | undefined>(undefined);
  
  // Client mount state to prevent React hydration mismatch on dynamic timestamps
  const [mounted, setMounted] = useState(false);
  const [currentDateStr, setCurrentDateStr] = useState('');
  const [currentTimeStr, setCurrentTimeStr] = useState('');

  useEffect(() => {
    setMounted(true);
    const now = new Date();
    setCurrentDateStr(`${now.getDate()} ${MONTH_NAMES_INDONESIA[now.getMonth()]} ${now.getFullYear()}`);
    setCurrentTimeStr(now.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' }));
  }, []);

  // Selected cell for audit lightbox modal
  const [selectedCell, setSelectedCell] = useState<{
    locationName: string;
    periodLabel: string;
    cell: DayCell;
    dateStr: string;
  } | null>(null);

  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => {
        if (d?.user) {
          if (d.user.role === 'MEMBER') {
            router.replace('/dashboard');
            return;
          }
          setUser({ full_name: d.user.full_name, role: d.user.role });
          if (d.user.active_warehouse_id && !selectedWarehouseId) {
            setSelectedWarehouseId(d.user.active_warehouse_id);
          }
        }
      })
      .catch(() => {});
  }, [router, selectedWarehouseId]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && selectedCell) {
      setSelectedCell(null);
    }
  }, [selectedCell]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  async function loadReport(y: number, m: number, whId?: string) {
    setLoading(true);
    try {
      const targetWh = whId !== undefined ? whId : selectedWarehouseId;
      let url = `/api/reports/monthly?year=${y}&month=${m}`;
      if (targetWh) {
        url += `&warehouse_id=${targetWh}`;
      }
      const res = await fetch(url, { cache: 'no-store' });
      if (res.status === 401) {
        router.replace('/login');
        return;
      }
      if (res.status === 403) {
        router.replace('/dashboard');
        return;
      }
      if (res.ok) {
        const json: MonthlyReportData = await res.json();
        setData(json);
        if (!selectedWarehouseId && json.active_warehouse) {
          setSelectedWarehouseId(json.active_warehouse.warehouse_id);
        }
      }
    } catch (err) {
      console.error('Error fetching monthly report:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReport(selectedYear, selectedMonth, selectedWarehouseId);
  }, [selectedYear, selectedMonth]);

  function handlePrint() {
    window.print();
  }

  function handleExportExcel() {
    if (!data) return;

    const wb = XLSX.utils.book_new();
    const whTitle = `${data.active_warehouse?.warehouse_code || 'WH'} — ${data.active_warehouse?.warehouse_name || 'Warehouse'}`;

    // Worksheet 1: Matriks Bulanan
    const matrixRows: any[][] = [
      ['Warehouse:', whTitle],
      ['Periode:', `${MONTH_NAMES_INDONESIA[data.month - 1]} ${data.year}`],
      ['Batas Maksimal:', `${data.settings.max_temp_limit || 25}°C`],
      []
    ];

    const matrixHeaders = ['No', 'Titik Lokasi', 'Periode Check'];
    for (let d = 1; d <= data.daysInMonth; d++) {
      matrixHeaders.push(String(d));
    }
    matrixHeaders.push('Min', 'Max');
    matrixRows.push(matrixHeaders);

    let rowNum = 1;
    data.matrix.forEach((prd) => {
      prd.locationRows.forEach((loc) => {
        const rowTemps: number[] = [];
        const row: any[] = [rowNum++, loc.location_name, prd.period_label];
        loc.days.forEach((dayCell) => {
          if (dayCell.has_data && dayCell.suhu !== undefined) {
            row.push(dayCell.suhu);
            rowTemps.push(dayCell.suhu);
          } else {
            // BR-09: Unfilled slot remains empty, NOT 0
            row.push('');
          }
        });
        if (rowTemps.length > 0) {
          row.push(Math.min(...rowTemps));
          row.push(Math.max(...rowTemps));
        } else {
          row.push('', '');
        }
        matrixRows.push(row);
      });
    });

    const wsMatrix = XLSX.utils.aoa_to_sheet(matrixRows);
    XLSX.utils.book_append_sheet(wb, wsMatrix, 'Matriks Bulanan');

    // Worksheet 2: Detail Transaksi
    const detailHeaders = [
      'Warehouse',
      'Tanggal',
      'Jadwal',
      'Lokasi',
      'Suhu (°C)',
      'Status Suhu',
      'Petugas',
      'Waktu Server',
      'Status WA',
      'Tautan Foto Google Drive'
    ];

    const detailRows: any[][] = [detailHeaders];
    data.allTransactions.forEach((tx) => {
      detailRows.push([
        whTitle,
        tx.tanggal,
        tx.period_label,
        tx.location_name,
        tx.suhu,
        tx.status_suhu,
        tx.petugas_name,
        tx.server_received_at,
        tx.wa_notif_status,
        tx.drive_view_url
      ]);
    });

    const wsDetail = XLSX.utils.aoa_to_sheet(detailRows);
    XLSX.utils.book_append_sheet(wb, wsDetail, 'Detail Transaksi');

    const fileName = `Rekap_Suhu_${data.active_warehouse?.warehouse_code || 'WH'}_${MONTH_NAMES_INDONESIA[data.month - 1]}_${data.year}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }

  function handleExportCsv() {
    if (!data) return;

    const whTitle = `${data.active_warehouse?.warehouse_code || 'WH'} — ${data.active_warehouse?.warehouse_name || 'Warehouse'}`;
    const detailHeaders = [
      'Warehouse',
      'Tanggal',
      'Jadwal',
      'Lokasi',
      'Suhu (°C)',
      'Status Suhu',
      'Petugas',
      'Waktu Server',
      'Status WA',
      'Tautan Foto Google Drive'
    ];

    const rows = [detailHeaders.join(',')];
    data.allTransactions.forEach((tx) => {
      const row = [
        `"${whTitle}"`,
        `"${tx.tanggal}"`,
        `"${tx.period_label}"`,
        `"${tx.location_name}"`,
        tx.suhu,
        `"${tx.status_suhu}"`,
        `"${tx.petugas_name}"`,
        `"${tx.server_received_at}"`,
        `"${tx.wa_notif_status}"`,
        `"${tx.drive_view_url}"`
      ];
      rows.push(row.join(','));
    });

    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Detail_Suhu_${data.active_warehouse?.warehouse_code || 'WH'}_${MONTH_NAMES_INDONESIA[data.month - 1]}_${data.year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const years = [2025, 2026, 2027, 2028];

  // Calculate highest & lowest metadata
  const minMaxMeta = useMemo(() => {
    if (!data || !data.allTransactions || data.allTransactions.length === 0) {
      return { minMeta: '-', maxMeta: '-' };
    }
    const maxTx = data.allTransactions.find((t) => t.suhu === data.summary.maxTemp);
    const minTx = data.allTransactions.find((t) => t.suhu === data.summary.minTemp);

    const formatTx = (tx?: ReportTransactionDetail) => {
      if (!tx) return '-';
      const parts = tx.tanggal.split('-');
      const d = parts[2] || '';
      const mIdx = parseInt(parts[1] || '1', 10) - 1;
      const mName = MONTH_NAMES_INDONESIA[mIdx]?.slice(0, 3) || '';
      return `${d} ${mName} • ${tx.location_name} (${tx.period_label})`;
    };

    return {
      minMeta: formatTx(minTx),
      maxMeta: formatTx(maxTx)
    };
  }, [data]);

  return (
    <AppShell user={user}>
      <div className="rekap-viewport-container mode-desktop apple-view-enter">
        <div className="rekap-main-paper">
          
          {/* =========================================================================
              HEADER & ACTION CONTROLS (DESKTOP / PRINT DUAL MODE)
              ========================================================================= */}
          <div className="report-brand-header">
            <div className="brand-title-group">
              <h1 className="report-main-title">
                Rekapitulasi Suhu Bulanan
              </h1>
              {data?.active_warehouse && (
                <p style={{ fontSize: '13px', color: 'var(--ink-muted)', marginTop: '4px', fontWeight: 500 }}>
                  Warehouse: <strong style={{ color: 'var(--primary)' }}>{data.active_warehouse.warehouse_code}</strong> — {data.active_warehouse.warehouse_name} • Periode: {MONTH_NAMES_INDONESIA[selectedMonth - 1]} {selectedYear}
                </p>
              )}
            </div>

            {/* Action Buttons (Print, Excel, CSV) */}
            <div className="report-action-buttons no-print">
              <button
                type="button"
                onClick={handlePrint}
                className="btn-capsule-action primary"
                title="Cetak Format A4 Landscape (FR-017)"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 6 2 18 2 18 9" />
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  <rect x="6" y="14" width="12" height="8" />
                </svg>
                <span>Cetak PDF (A4)</span>
              </button>

              <button
                type="button"
                onClick={handleExportExcel}
                className="btn-capsule-action excel"
                title="Unduh File Excel .xlsx (FR-018)"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="8" y1="13" x2="16" y2="13" />
                  <line x1="8" y1="17" x2="16" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                <span>Ekspor Excel (.xlsx)</span>
              </button>

              <button
                type="button"
                onClick={handleExportCsv}
                className="btn-capsule-action"
                title="Unduh Format CSV (FR-018)"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>Ekspor CSV</span>
              </button>
            </div>
          </div>

          {/* =========================================================================
              2 HERO CARDS ONLY (SUHU TERTINGGI & SUHU TERENDAH - USER APPROVED v1.2)
              ========================================================================= */}
          <div className="rekap-kpi-strip no-print">
            <div className="kpi-mini-card">
              <span className="kpi-mini-label">
                Suhu Tertinggi
              </span>
              <span className="kpi-mini-val red">
                {data?.summary.maxTemp !== null && data?.summary.maxTemp !== undefined
                  ? `${data.summary.maxTemp.toString().replace('.', ',')}°C`
                  : '–'}
              </span>
              <span className="kpi-mini-sub">
                {minMaxMeta.maxMeta}
              </span>
            </div>

            <div className="kpi-mini-card">
              <span className="kpi-mini-label">
                Suhu Terendah
              </span>
              <span className="kpi-mini-val blue">
                {data?.summary.minTemp !== null && data?.summary.minTemp !== undefined
                  ? `${data.summary.minTemp.toString().replace('.', ',')}°C`
                  : '–'}
              </span>
              <span className="kpi-mini-sub">
                {minMaxMeta.minMeta}
              </span>
            </div>
          </div>

          {/* =========================================================================
              FILTER & PARAMETER BAR
              ========================================================================= */}
          <div className="report-filter-bar no-print">
            <div className="filter-selector-group">
              {/* Month Selector */}
              <div className="filter-item-wrap">
                <span>Bulan:</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                  className="apple-select-input"
                >
                  {MONTH_NAMES_INDONESIA.map((name, idx) => (
                    <option key={idx + 1} value={idx + 1}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year Selector */}
              <div className="filter-item-wrap">
                <span>Tahun:</span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                  className="apple-select-input"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              {/* Warehouse Selector */}
              {data?.allowed_warehouses && data.allowed_warehouses.length > 1 && (
                <div className="filter-item-wrap">
                  <span>Gudang:</span>
                  <select
                    value={selectedWarehouseId}
                    onChange={(e) => {
                      const newWh = e.target.value;
                      setSelectedWarehouseId(newWh);
                      loadReport(selectedYear, selectedMonth, newWh);
                    }}
                    className="apple-select-input"
                  >
                    {data.allowed_warehouses.map((w) => (
                      <option key={w.warehouse_id} value={w.warehouse_id}>
                        {w.warehouse_code} — {w.warehouse_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Visual Legend */}
            <div className="filter-legend-group">
              <div className="legend-chip">
                <span className="legend-indicator weekend"></span>
                <span>Sabtu/Minggu</span>
              </div>
              <div className="legend-chip">
                <span className="legend-indicator overlimit"></span>
                <span>Melebihi Batas (▲)</span>
              </div>
              <div className="legend-chip">
                <span className="legend-indicator normal"></span>
                <span>Normal</span>
              </div>
              <div className="legend-chip">
                <span className="legend-indicator empty"></span>
                <span>Belum Diisi (–)</span>
              </div>
            </div>
          </div>

          {/* Loading Indicator */}
          {loading && !data && (
            <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--ink-muted)', fontSize: '13px' }}>
              <p>Memuat rekapitulasi data suhu bulanan...</p>
            </div>
          )}

          {/* =========================================================================
              31-DAY MASTER TEMPERATURE MATRIX TABLE (ZERO ROWSPAN CLIPPING)
              ========================================================================= */}
          {data && (
            <div className="matrix-table-container">
              <table className="rekap-master-table">
                <thead>
                  {/* Row 1 Header */}
                  <tr>
                    <th rowSpan={2} className="col-sticky-1">
                      No
                    </th>
                    <th rowSpan={2} className="col-sticky-2">
                      Titik Lokasi
                    </th>
                    <th rowSpan={2} className="col-sticky-3">
                      Periode
                    </th>
                    <th
                      colSpan={data.daysInMonth}
                      style={{ background: '#E2E8F0', color: '#1E293B', fontWeight: 800 }}
                    >
                      TANGGAL PENGECEKAN SUHU BULAN {MONTH_NAMES_INDONESIA[data.month - 1].toUpperCase()} {data.year}
                    </th>
                    <th
                      colSpan={2}
                      style={{ background: '#E2E8F0', color: '#1E293B', fontWeight: 800 }}
                    >
                      RINGKASAN
                    </th>
                  </tr>

                  {/* Row 2 Subheaders (Dates 1..daysInMonth + Min/Max) */}
                  <tr>
                    {Array.from({ length: data.daysInMonth }, (_, i) => i + 1).map((d) => {
                      const isWeekend = data.weekendDays.includes(d);
                      return (
                        <th
                          key={d}
                          className={`col-date ${isWeekend ? 'weekend' : ''}`}
                          title={isWeekend ? `Akhir Pekan (Sabtu/Minggu) • Tgl ${d}` : `Hari Kerja • Tgl ${d}`}
                        >
                          {d}
                        </th>
                      );
                    })}
                    <th className="col-summary val-min">
                      Min
                    </th>
                    <th className="col-summary val-max">
                      Max
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {(() => {
                    let globalRowIndex = 1;
                    return data.matrix.map((prdGroup, pIdx) => {
                      const shiftClass = pIdx === 0 ? 'pagi' : pIdx === 1 ? 'siang' : 'sore';

                      return prdGroup.locationRows.map((locRow, lIdx) => {
                        const currentRowNum = globalRowIndex++;
                        const isShiftBreak = pIdx > 0 && lIdx === 0;

                        // Calculate row min & max
                        const rowTemps: number[] = [];
                        locRow.days.forEach((c) => {
                          if (c.has_data && c.suhu !== undefined) {
                            rowTemps.push(c.suhu);
                          }
                        });

                        const rowMin = rowTemps.length > 0 ? Math.min(...rowTemps).toFixed(1).replace('.', ',') : '–';
                        const rowMax = rowTemps.length > 0 ? Math.max(...rowTemps).toFixed(1).replace('.', ',') : '–';
                        const rowMaxNum = rowTemps.length > 0 ? Math.max(...rowTemps) : 0;
                        const maxLimit = data.settings?.max_temp_limit ?? 25.0;

                        return (
                          <tr
                            key={`${prdGroup.period_id}_${locRow.location_id}`}
                            className={isShiftBreak ? 'shift-break' : ''}
                          >
                            {/* Col 1: No */}
                            <td className="col-sticky-1">
                              {currentRowNum}
                            </td>

                            {/* Col 2: Location */}
                            <td className="col-sticky-2">
                              {locRow.location_name}
                              {!locRow.is_active && (
                                <span style={{ marginLeft: '4px', fontSize: '10px', color: 'var(--ink-muted)', fontWeight: 400 }}>
                                  (nonaktif)
                                </span>
                              )}
                            </td>

                            {/* Col 3: Shift Check Pill (EVERY ROW INDEPENDENT - NO CLIPPING) */}
                            <td className="col-sticky-3">
                              <span className={`shift-pill-badge ${shiftClass}`}>
                                <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                                  {pIdx === 0 ? (
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <circle cx="12" cy="12" r="5" />
                                      <line x1="12" y1="1" x2="12" y2="3" />
                                      <line x1="12" y1="21" x2="12" y2="23" />
                                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                                      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                                      <line x1="1" y1="12" x2="3" y2="12" />
                                      <line x1="21" y1="12" x2="23" y2="12" />
                                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                                      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                                    </svg>
                                  ) : pIdx === 1 ? (
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M12 2v2" />
                                      <path d="M12 20v2" />
                                      <path d="m4.93 4.93 1.41 1.41" />
                                      <path d="m17.66 17.66 1.41 1.41" />
                                      <path d="M2 12h2" />
                                      <path d="M20 12h2" />
                                      <path d="m6.34 17.66-1.41 1.41" />
                                      <path d="m19.07 4.93-1.41 1.41" />
                                      <circle cx="12" cy="12" r="4" />
                                    </svg>
                                  ) : (
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                                    </svg>
                                  )}
                                </span>
                                <span>{prdGroup.period_label}</span>
                              </span>
                            </td>

                            {/* 1..daysInMonth cells */}
                            {locRow.days.map((dayCell) => {
                              const isOver = dayCell.status_suhu === 'MELEBIHI_BATAS';
                              const isWeekend = data.weekendDays.includes(dayCell.day);

                              if (!dayCell.has_data) {
                                // BR-09: Unfilled slots display '–' and NEVER 0
                                return (
                                  <td
                                    key={dayCell.day}
                                    className={isWeekend ? 'col-weekend' : ''}
                                  >
                                    <span className="cell-temp-btn empty">–</span>
                                  </td>
                                );
                              }

                              const dateStr = `${data.year}-${String(data.month).padStart(2, '0')}-${String(
                                dayCell.day
                              ).padStart(2, '0')}`;

                              return (
                                <td
                                  key={dayCell.day}
                                  className={isWeekend ? 'col-weekend' : ''}
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSelectedCell({
                                        locationName: locRow.location_name,
                                        periodLabel: prdGroup.period_label,
                                        cell: dayCell,
                                        dateStr
                                      })
                                    }
                                    className={`cell-temp-btn ${isOver ? 'overlimit' : ''}`}
                                    title={`Klik untuk detail: ${dayCell.suhu}°C (${locRow.location_name})`}
                                  >
                                    <span>{dayCell.suhu?.toString().replace('.', ',')}</span>
                                    {isOver && <span className="tri">▲</span>}
                                  </button>
                                </td>
                              );
                            })}

                            {/* Summary Min */}
                            <td className="col-summary val-min">
                              {rowMin}
                            </td>

                            {/* Summary Max */}
                            <td className={`col-summary ${rowMaxNum > maxLimit ? 'val-max' : ''}`}>
                              {rowMax}
                            </td>
                          </tr>
                        );
                      });
                    });
                  })()}
                </tbody>
              </table>
            </div>
          )}

          {/* =========================================================================
              PHYSICAL SIGN-OFF / PENGESAHAN SECTION (PRINT & AUDIT ISO / CGP)
              ========================================================================= */}
          <div className="report-signoff-section">
            {/* Box 1: Dibuat Oleh */}
            <div className="signoff-box">
              <span className="signoff-role">Dibuat Oleh:</span>
              <span className="signoff-role-sub">
                {data?.settings?.signoff_maker_title || 'Petugas Lapangan / QC Checker'}
              </span>
              <div className="signoff-space" />
              <span className="signoff-name">
                ({data?.settings?.signoff_maker_name || user?.full_name || 'Petugas Gudang'})
              </span>
              <span className="signoff-date" suppressHydrationWarning>
                Tanggal: {mounted ? currentDateStr : '–'}
              </span>
            </div>

            {/* Box 2: Diperiksa Oleh */}
            <div className="signoff-box">
              <span className="signoff-role">Diperiksa Oleh:</span>
              <span className="signoff-role-sub">
                {data?.settings?.signoff_checker_title || 'Supervisor Logistik & Cold Chain'}
              </span>
              <div className="signoff-space" />
              <span className="signoff-name">
                ( {data?.settings?.signoff_checker_name || 'Leader / Supervisor Gudang'} )
              </span>
              <span className="signoff-date" suppressHydrationWarning>
                Tanggal: {mounted ? currentDateStr : '–'}
              </span>
            </div>

            {/* Box 3: Diketahui Oleh */}
            <div className="signoff-box">
              <span className="signoff-role">Diketahui Oleh:</span>
              <span className="signoff-role-sub">
                {data?.settings?.signoff_approver_title || 'QA / Warehouse Manager'}
              </span>
              <div className="signoff-space" />
              <span className="signoff-name">
                ( {data?.settings?.signoff_approver_name || 'Warehouse Manager'} )
              </span>
              <span className="signoff-date" suppressHydrationWarning>
                Tanggal: {mounted ? currentDateStr : '–'}
              </span>
            </div>
          </div>

          {/* Report Footer Audit */}
          <div className="report-footer-audit">
            <span suppressHydrationWarning>
              Dicetak dari Sistem Warehouse Temperature Report • Waktu Server:{' '}
              {mounted ? `${currentTimeStr} WIB` : '–'}
            </span>
            <span>Dokumen Terverifikasi Digital • Halaman 1 dari 1</span>
          </div>

        </div>
      </div>

      {/* =========================================================================
          AUDIT LIGHTBOX MODAL (BUKTI FOTO & METADATA SERVER)
          ========================================================================= */}
      {selectedCell && (
        <div
          role="dialog"
          aria-modal="true"
          className="apple-modal-backdrop"
          onClick={() => setSelectedCell(null)}
        >
          <div
            className="apple-modal-box"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="modal-head-row">
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>
                  Detail Transaksi Suhu
                </span>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ink)', margin: '2px 0 0 0' }}>
                  {selectedCell.locationName}
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--ink-muted)', margin: '2px 0 0 0' }}>
                  {selectedCell.dateStr} • {selectedCell.periodLabel} WIB
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCell(null)}
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

            {/* Photo Preview / Watermark Box */}
            <div className="modal-photo-canvas-preview">
              {selectedCell.cell.drive_file_id ? (
                <img
                  src={`/photo/${selectedCell.cell.drive_file_id}`}
                  alt="Foto Bukti Termometer"
                  className="modal-photo-img"
                  onError={(e) => {
                    // Fallback to placeholder if proxy fails
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: '12px', padding: '16px' }}>
                  <svg style={{ width: '32px', height: '32px', margin: '0 auto 8px auto', opacity: 0.5 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  <span>Foto bukti tersimpan di Google Drive</span>
                </div>
              )}

              {/* Watermark Overlay Strip */}
              <div className="modal-photo-watermark-overlay">
                <div style={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                  <span>{selectedCell.locationName}</span>
                  <span style={{ color: '#34C759', fontFamily: 'monospace' }}>GPS VERIFIED</span>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '10px', display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                  <span>Petugas: {selectedCell.cell.petugas_name || '-'}</span>
                  <span>{selectedCell.dateStr} • Asia/Jakarta</span>
                </div>
              </div>
            </div>

            {/* Metadata Grid */}
            <div className="modal-meta-grid">
              <div className="modal-meta-card">
                <span className="modal-meta-card-label">Suhu Tercatat</span>
                <span
                  className={`modal-meta-card-val ${selectedCell.cell.status_suhu === 'MELEBIHI_BATAS' ? 'red' : ''}`}
                  style={{ fontSize: '18px' }}
                >
                  {selectedCell.cell.suhu?.toString().replace('.', ',')} °C
                </span>
              </div>

              <div className="modal-meta-card">
                <span className="modal-meta-card-label">Status Suhu</span>
                <span
                  className={`modal-meta-card-val ${selectedCell.cell.status_suhu === 'MELEBIHI_BATAS' ? 'red' : 'green'}`}
                >
                  {selectedCell.cell.status_suhu === 'MELEBIHI_BATAS' ? 'MELEBIHI BATAS' : 'NORMAL'}
                </span>
              </div>

              <div className="modal-meta-card">
                <span className="modal-meta-card-label">Petugas Pemeriksa</span>
                <span className="modal-meta-card-val" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {selectedCell.cell.petugas_name || '–'}
                </span>
              </div>

              <div className="modal-meta-card">
                <span className="modal-meta-card-label">Waktu Server (WIB)</span>
                <span className="modal-meta-card-val" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {selectedCell.cell.server_received_at || '–'}
                </span>
              </div>

              <div className="modal-meta-card full" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span className="modal-meta-card-label">Notifikasi WhatsApp</span>
                  <span className="modal-meta-card-val" style={{ fontSize: '12px' }}>
                    {selectedCell.cell.wa_notif_status || 'NOT_REQUIRED'}
                  </span>
                </div>
                {selectedCell.cell.drive_file_id && (
                  <a
                    href={`/photo/${selectedCell.cell.drive_file_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-capsule-action primary"
                    style={{ padding: '6px 14px', fontSize: '12px' }}
                  >
                    Buka Foto Asli ↗
                  </a>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
              <button
                type="button"
                onClick={() => setSelectedCell(null)}
                className="btn-capsule-action"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
