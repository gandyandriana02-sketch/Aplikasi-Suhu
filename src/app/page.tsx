'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import CameraCaptureModal, { CapturedPhotoData } from '@/components/CameraCaptureModal';

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

interface ExistingTransaction {
  transaction_id: string;
  location_id: string;
  location_name: string;
  period_id: string;
  period_label: string;
  suhu: number;
  status_suhu: 'NORMAL' | 'MELEBIHI_BATAS';
  petugas_name: string;
  drive_file_id?: string;
  drive_view_url: string;
  wa_notif_status?: 'NOT_REQUIRED' | 'PENDING' | 'SENT' | 'FAILED';
  wa_error_message?: string;
  server_received_at: string;
}

interface FormContextData {
  tanggal: string;
  today: string;
  user: {
    user_id: string;
    username: string;
    full_name: string;
    role: 'ADMIN' | 'MEMBER';
  };
  active_warehouse?: {
    warehouse_id: string;
    warehouse_code: string;
    warehouse_name: string;
  };
  locations: LocationItem[];
  periods: PeriodItem[];
  max_temp_limit: number;
  is_date_locked: boolean;
  lock_reason: string;
  transactions: ExistingTransaction[];
}

interface LocationFormState {
  suhu: string;
  photo: CapturedPhotoData | null;
  error: string;
  saving: boolean;
  savingStep?: string;
}

export default function HomePage() {
  const router = useRouter();

  // Loading & context state
  const [loading, setLoading] = useState(true);
  const [context, setContext] = useState<FormContextData | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');

  // Per-location form state keyed by location_id
  const [formStates, setFormStates] = useState<Record<string, LocationFormState>>({});

  // Camera modal state
  const [activeCameraLocation, setActiveCameraLocation] = useState<{ id: string; name: string } | null>(null);

  // Global notice / alert
  const [globalMessage, setGlobalMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Simpan Semua batch saving progress
  const [batchSaving, setBatchSaving] = useState(false);
  const [batchProgressText, setBatchProgressText] = useState('');

  // Admin Edit Transaction Modal State (FR-012, BR-03, OQ-01)
  const [editingTx, setEditingTx] = useState<ExistingTransaction | null>(null);
  const [editSuhu, setEditSuhu] = useState('');
  const [editPhoto, setEditPhoto] = useState<CapturedPhotoData | null>(null);
  const [editReason, setEditReason] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  // WA Retry State (FR-014, TS-06)
  const [retryingWaTxId, setRetryingWaTxId] = useState<string | null>(null);

  // Apple Segmented Control Filter Tab (ALL | UNRECORDED | NORMAL | OVER)
  const [filterTab, setFilterTab] = useState<'ALL' | 'UNRECORDED' | 'NORMAL' | 'OVER'>('ALL');

  // Fallback hidden file input ref
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Helper: Shift themes based on period label
  function getShiftTheme(label: string) {
    const l = (label || '').toLowerCase();
    if (l.includes('pagi') || l.includes('morning') || l.includes('07') || l.includes('08') || l.includes('09') || l.includes('shift 1') || l.includes('shift-1')) {
      return {
        name: 'PAGI',
        label: 'Shift Pagi',
        iconType: 'morning' as const,
        color: '#F59E0B',
        hoverColor: '#D97706',
        tint: '#FEF3C7',
        borderGlow: 'rgba(245, 158, 11, 0.25)',
        buttonBg: '#D97706'
      };
    } else if (l.includes('siang') || l.includes('noon') || l.includes('11') || l.includes('12') || l.includes('13') || l.includes('14') || l.includes('shift 2') || l.includes('shift-2')) {
      return {
        name: 'SIANG',
        label: 'Shift Siang',
        iconType: 'noon' as const,
        color: '#0071E3',
        hoverColor: '#005BB5',
        tint: '#E0F2FE',
        borderGlow: 'rgba(0, 113, 227, 0.25)',
        buttonBg: '#0071E3'
      };
    } else {
      return {
        name: 'SORE',
        label: 'Shift Sore',
        iconType: 'afternoon' as const,
        color: '#6366F1',
        hoverColor: '#4F46E5',
        tint: '#EEF2FF',
        borderGlow: 'rgba(99, 102, 241, 0.25)',
        buttonBg: '#4F46E5'
      };
    }
  }

  // Active shift theme
  const activePeriod = context?.periods.find((p) => p.period_id === selectedPeriodId);
  const shiftTheme = getShiftTheme(activePeriod?.period_label || '');

  // Close modal on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (editingTx && !editSaving) {
          setEditingTx(null);
        }
        if (activeCameraLocation) {
          setActiveCameraLocation(null);
        }
      }
    },
    [editingTx, editSaving, activeCameraLocation]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Load form context from backend
  async function loadFormContext(dateToFetch?: string) {
    setLoading(true);
    setGlobalMessage(null);

    try {
      const url = dateToFetch ? `/api/form-context?tanggal=${dateToFetch}` : '/api/form-context';
      const res = await fetch(url, { cache: 'no-store' });

      if (res.status === 401) {
        window.location.href = '/login';
        return;
      }

      if (!res.ok) {
        const errData = await res.json();
        setGlobalMessage({ type: 'error', text: errData.error || 'Gagal memuat data formulir.' });
        setLoading(false);
        return;
      }

      const data: FormContextData = await res.json();
      setContext(data);
      setSelectedDate(data.tanggal);

      if (!selectedPeriodId && data.periods.length > 0) {
        setSelectedPeriodId(data.periods[0].period_id);
      }
    } catch {
      setGlobalMessage({ type: 'error', text: 'Gangguan koneksi ke server. Coba muat ulang.' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFormContext();
  }, []);

  // Update formStates when period or transactions change
  useEffect(() => {
    if (!context) return;

    const initialStates: Record<string, LocationFormState> = {};
    context.locations.forEach((loc) => {
      const existingTx = context.transactions.find(
        (tx) => tx.location_id === loc.location_id && tx.period_id === selectedPeriodId
      );

      if (existingTx) {
        initialStates[loc.location_id] = {
          suhu: existingTx.suhu.toString().replace('.', ','),
          photo: null,
          error: '',
          saving: false
        };
      } else {
        const current = formStates[loc.location_id];
        initialStates[loc.location_id] = current || {
          suhu: '',
          photo: null,
          error: '',
          saving: false
        };
      }
    });

    setFormStates(initialStates);
  }, [selectedPeriodId, context?.transactions]);

  function handleDateChange(newDate: string) {
    if (!newDate) return;
    setSelectedDate(newDate);
    loadFormContext(newDate);
  }

  function handleSuhuChange(locId: string, val: string) {
    setFormStates((prev) => ({
      ...prev,
      [locId]: {
        ...prev[locId],
        suhu: val,
        error: ''
      }
    }));
  }

  // Stepper adjustments (+ / - 0.1°C)
  function handleStepSuhu(locId: string, delta: number) {
    const cur = parseFloat((formStates[locId]?.suhu || '20.0').replace(',', '.'));
    const next = isNaN(cur) ? 20.0 : Math.round((cur + delta) * 10) / 10;
    handleSuhuChange(locId, next.toFixed(1).replace('.', ','));
  }

  // Single location save
  async function handleSaveLocation(locId: string) {
    const loc = context?.locations.find((l) => l.location_id === locId);
    const state = formStates[locId];
    if (!loc || !state) return;

    const numericSuhu = parseFloat(state.suhu.replace(',', '.'));
    if (isNaN(numericSuhu) || state.suhu.trim() === '') {
      setFormStates((prev) => ({
        ...prev,
        [locId]: { ...prev[locId], error: 'Masukkan angka suhu, misalnya 22,5.' }
      }));
      return;
    }

    if (!state.photo) {
      setFormStates((prev) => ({
        ...prev,
        [locId]: { ...prev[locId], error: 'Ambil foto termometer sebelum menyimpan.' }
      }));
      return;
    }

    setFormStates((prev) => ({
      ...prev,
      [locId]: { ...prev[locId], saving: true, savingStep: 'Menyimpan transaksi...', error: '' }
    }));
    setGlobalMessage(null);

    const idempotencyKey = `IDEM-${Date.now()}-${locId}-${Math.random().toString(36).substring(2, 7)}`;

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idempotency_key: idempotencyKey,
          warehouse_id: context?.active_warehouse?.warehouse_id,
          tanggal: selectedDate,
          location_id: locId,
          period_id: selectedPeriodId,
          suhu: numericSuhu,
          photo_base64: state.photo.base64,
          client_captured_at: state.photo.capturedAt,
          gps_coordinates: state.photo.gpsCoordinates
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setFormStates((prev) => ({
          ...prev,
          [locId]: {
            ...prev[locId],
            saving: false,
            error: data.error || 'Gagal menyimpan transaksi suhu.'
          }
        }));
        return;
      }

      setGlobalMessage({
        type: 'success',
        text: `Data suhu & foto untuk lokasi ${loc.location_name} berhasil disimpan.`
      });

      await loadFormContext(selectedDate);
    } catch {
      setFormStates((prev) => ({
        ...prev,
        [locId]: {
          ...prev[locId],
          saving: false,
          error: 'Koneksi terputus saat menyimpan data.'
        }
      }));
    }
  }

  // Batch save (Simpan Semua)
  async function handleSaveAll() {
    if (!context) return;

    const locationsToSave: LocationItem[] = [];

    context.locations.forEach((loc) => {
      const existing = context.transactions.find(
        (tx) => tx.location_id === loc.location_id && tx.period_id === selectedPeriodId
      );
      if (existing) return;

      const state = formStates[loc.location_id];
      if (state && state.suhu.trim() !== '' && state.photo) {
        locationsToSave.push(loc);
      }
    });

    if (locationsToSave.length === 0) return;

    setBatchSaving(true);
    let successCount = 0;
    let failCount = 0;
    const isBatch = locationsToSave.length > 1;
    const savedTxIds: string[] = [];

    for (let i = 0; i < locationsToSave.length; i++) {
      const loc = locationsToSave[i];
      setBatchProgressText(`Menyimpan ${i + 1} dari ${locationsToSave.length}: ${loc.location_name}...`);

      const state = formStates[loc.location_id];
      const numericSuhu = parseFloat(state.suhu.replace(',', '.'));
      const idempotencyKey = `IDEM-${Date.now()}-${loc.location_id}-${Math.random().toString(36).substring(2, 7)}`;

      try {
        const res = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idempotency_key: idempotencyKey,
            warehouse_id: context?.active_warehouse?.warehouse_id,
            tanggal: selectedDate,
            location_id: loc.location_id,
            period_id: selectedPeriodId,
            suhu: numericSuhu,
            photo_base64: state.photo!.base64,
            client_captured_at: state.photo!.capturedAt,
            gps_coordinates: state.photo!.gpsCoordinates,
            is_batch: isBatch
          })
        });

        if (res.ok) {
          const data = await res.json().catch(() => null);
          if (data?.transaction?.transaction_id) {
            savedTxIds.push(data.transaction.transaction_id);
          }
          successCount++;
        } else {
          failCount++;
        }
      } catch {
        failCount++;
      }
    }

    // Trigger Consolidated Batch WhatsApp Alert if isBatch and transactions saved (FR-010, Section 13.3)
    if (isBatch && savedTxIds.length > 0) {
      try {
        setBatchProgressText('Mengirim notifikasi rekap WhatsApp...');
        await fetch('/api/notifications/batch-alert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            warehouse_id: context?.active_warehouse?.warehouse_id,
            tanggal: selectedDate,
            period_id: selectedPeriodId,
            transaction_ids: savedTxIds
          })
        });
      } catch (err) {
        console.error('Batch alert error:', err);
      }
    }

    setBatchSaving(false);
    setBatchProgressText('');

    if (successCount > 0) {
      setGlobalMessage({
        type: 'success',
        text: `Berhasil menyimpan ${successCount} lokasi.${failCount > 0 ? ` ${failCount} lokasi gagal disimpan.` : ''}`
      });
    } else {
      setGlobalMessage({
        type: 'error',
        text: 'Semua lokasi gagal disimpan. Periksa koneksi dan coba lagi.'
      });
    }

    await loadFormContext(selectedDate);
  }

  // Kirim ulang notifikasi WhatsApp jika gagal (FR-014, TS-06)
  async function handleRetryWa(txId: string) {
    setRetryingWaTxId(txId);
    try {
      const res = await fetch(`/api/notifications/retry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transaction_id: txId })
      });
      if (res.ok) {
        setGlobalMessage({ type: 'success', text: 'Notifikasi WhatsApp berhasil dikirim ulang.' });
        await loadFormContext(selectedDate);
      } else {
        const d = await res.json();
        setGlobalMessage({ type: 'error', text: d.error || 'Gagal mengirim ulang WhatsApp.' });
      }
    } catch {
      setGlobalMessage({ type: 'error', text: 'Koneksi gagal saat mencoba kirim ulang WhatsApp.' });
    } finally {
      setRetryingWaTxId(null);
    }
  }

  // Admin edit submission
  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingTx) return;

    const numericSuhu = parseFloat(editSuhu.replace(',', '.'));
    if (isNaN(numericSuhu) || editSuhu.trim() === '') {
      setEditError('Masukkan angka suhu yang valid.');
      return;
    }

    if (!editReason.trim()) {
      setEditError('Alasan perubahan wajib diisi untuk rekam audit.');
      return;
    }

    setEditSaving(true);
    setEditError('');

    try {
      const payload: any = {
        suhu: numericSuhu,
        reason: editReason.trim()
      };

      if (editPhoto) {
        payload.photo_base64 = editPhoto.base64;
        payload.client_captured_at = editPhoto.capturedAt;
        payload.gps_coordinates = editPhoto.gpsCoordinates;
      }

      const res = await fetch(`/api/transactions/${editingTx.transaction_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        setEditError(data.error || 'Gagal memperbarui transaksi.');
        setEditSaving(false);
        return;
      }

      setGlobalMessage({
        type: 'success',
        text: `Transaksi untuk ${editingTx.location_name} berhasil diperbarui.`
      });

      setEditingTx(null);
      setEditPhoto(null);
      setEditReason('');
      setEditSaving(false);
      await loadFormContext(selectedDate);
    } catch {
      setEditError('Koneksi terputus saat menyimpan perubahan.');
      setEditSaving(false);
    }
  }

  // Format date indonesian
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

  if (loading && !context) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F5F5F7',
          color: '#86868B',
          fontSize: '14px',
          gap: '12px',
          padding: '20px',
          textAlign: 'center'
        }}
      >
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid #0071E3', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
        <div>Memuat formulir pencatatan suhu...</div>
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!context) return null;

  // Unsaved ready count
  const unsavedReadyCount = context.locations.filter((loc) => {
    const isSaved = context.transactions.some(
      (tx) => tx.location_id === loc.location_id && tx.period_id === selectedPeriodId
    );
    if (isSaved) return false;
    const st = formStates[loc.location_id];
    return st && st.suhu.trim() !== '' && st.photo !== null;
  }).length;

  // Filter track counts
  const allCount = context.locations.length;
  const unrecordedCount = context.locations.filter((loc) => {
    return !context.transactions.some(
      (tx) => tx.location_id === loc.location_id && tx.period_id === selectedPeriodId
    );
  }).length;
  const normalCount = context.locations.filter((loc) => {
    const tx = context.transactions.find(
      (t) => t.location_id === loc.location_id && t.period_id === selectedPeriodId
    );
    return tx && tx.status_suhu === 'NORMAL';
  }).length;
  const overCount = context.locations.filter((loc) => {
    const tx = context.transactions.find(
      (t) => t.location_id === loc.location_id && t.period_id === selectedPeriodId
    );
    return tx && tx.status_suhu === 'MELEBIHI_BATAS';
  }).length;

  // Filtered locations based on selected segmented tab
  const filteredLocations = context.locations.filter((loc) => {
    const tx = context.transactions.find(
      (t) => t.location_id === loc.location_id && t.period_id === selectedPeriodId
    );
    if (filterTab === 'ALL') return true;
    if (filterTab === 'UNRECORDED') return !tx;
    if (filterTab === 'NORMAL') return tx && tx.status_suhu === 'NORMAL';
    if (filterTab === 'OVER') return tx && tx.status_suhu === 'MELEBIHI_BATAS';
    return true;
  });

  return (
    <AppShell user={context.user}>
      {/* Authentic Apple Device Shell with Time-of-Day Ambient Aura */}
      <div className="device-shell" data-shift={shiftTheme.name}>
        {/* Global Notice Alert */}
        {globalMessage && (
          <div
            role="alert"
            style={{
              margin: '16px 20px 0 20px',
              backgroundColor: globalMessage.type === 'error' ? 'var(--over-tint)' : 'var(--ok-tint)',
              border: `1px solid ${globalMessage.type === 'error' ? 'var(--over)' : 'var(--ok)'}`,
              borderRadius: '16px',
              padding: '12px 16px',
              color: globalMessage.type === 'error' ? 'var(--over)' : '#1D8338',
              fontSize: '13px',
              fontWeight: 500,
              lineHeight: 1.4,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
            }}
          >
            <span style={{ display: 'inline-flex', flexShrink: 0 }}>
              {globalMessage.type === 'error' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </span>
            <span>{globalMessage.text}</span>
          </div>
        )}

        {/* Date Locked Warning */}
        {context.is_date_locked && (
          <div
            role="alert"
            style={{
              margin: '16px 20px 0 20px',
              backgroundColor: 'var(--over-tint)',
              border: '1px solid var(--over)',
              borderRadius: '16px',
              padding: '14px 16px',
              color: 'var(--over)',
              fontSize: '13px',
              lineHeight: 1.4,
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <span style={{ display: 'inline-flex', flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            <div>
              <strong>Input hari ini ditutup.</strong> {context.lock_reason || 'Hubungi Administrator untuk membuka kunci.'}
            </div>
          </div>
        )}

        {/* 1. APPLE STORE CLEAN HEADER (APPLE HIG LARGE TITLE) */}
        <header className="apple-header">
          <div className="header-main-row">
            <div className="header-title-block">
              <h1 className="apple-large-title">Catat Suhu</h1>
              <div className="header-sub-meta">
                <span>{formatDateIndonesian(selectedDate)}</span>
                <span>•</span>
                <span>
                  {context.active_warehouse?.warehouse_code || 'WH'} ({context.locations.length} Titik Pantau)
                </span>
              </div>
            </div>

            {/* Admin Date Switcher */}
            {context.user.role === 'ADMIN' && (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                title="Pilih tanggal pemeriksaan (Khusus Admin)"
                style={{
                  height: '34px',
                  padding: '0 8px',
                  borderRadius: '10px',
                  border: '1px solid #D2D2D7',
                  fontSize: '12px',
                  color: 'var(--ink)',
                  backgroundColor: '#FFFFFF',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              />
            )}
          </div>
        </header>

        {/* 2. SHIFT SELECTION RAIL (APPLE CATEGORY CARDS) */}
        <section className="shift-section">
          <div className="shift-header-row">
            <h2 className="shift-heading">Jadwal Shift</h2>
            <span className="target-limit-badge">
              {shiftTheme.label} • Batas ≤ {context.max_temp_limit.toFixed(1).replace('.', ',')}°C
            </span>
          </div>

          {/* 3 Shift Cards Carousel */}
          <div className="shift-grid">
            {context.periods.map((p) => {
              const isActive = p.period_id === selectedPeriodId;
              const pTheme = getShiftTheme(p.period_label);
              const txCount = context.transactions.filter((tx) => tx.period_id === p.period_id).length;
              const totalLoc = context.locations.length;
              const pct = totalLoc > 0 ? Math.min(100, Math.round((txCount / totalLoc) * 100)) : 0;
              const shiftClass =
                pTheme.name.toLowerCase() === 'pagi'
                  ? 'shift-pagi'
                  : pTheme.name.toLowerCase() === 'siang'
                  ? 'shift-siang'
                  : 'shift-sore';

              return (
                <div
                  key={p.period_id}
                  className={`shift-card ${shiftClass} ${isActive ? 'active' : ''}`}
                  onClick={() => setSelectedPeriodId(p.period_id)}
                >
                  <div className="shift-icon-circle">
                    {pTheme.iconType === 'morning' ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
                    ) : pTheme.iconType === 'noon' ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <div className="shift-title-text">{p.period_label}</div>
                    <div className="shift-time-text">
                      {p.period_label.toLowerCase().includes('09') || p.period_label.toLowerCase().includes('pagi')
                        ? '08:00 WIB'
                        : p.period_label.toLowerCase().includes('13') || p.period_label.toLowerCase().includes('siang')
                        ? '13:00 WIB'
                        : '18:00 WIB'}
                    </div>
                  </div>
                  <div className="shift-progress-wrap">
                    <span className="shift-progress-text num">
                      {txCount}/{totalLoc} Selesai
                    </span>
                    <div className="shift-progress-bar-bg">
                      <div className="shift-progress-bar-fill" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 3. APPLE iOS SEGMENTED CONTROL FILTER (BALANCED FULL-WIDTH, ZERO CLIPPING) */}
        <div className="segmented-filter-wrap">
          <div className="apple-segmented-control" role="tablist">
            <button
              type="button"
              className={`apple-segment-btn ${filterTab === 'ALL' ? 'active' : ''}`}
              onClick={() => setFilterTab('ALL')}
            >
              <span>Semua</span>
              <span className="seg-count num">{allCount}</span>
            </button>

            <button
              type="button"
              className={`apple-segment-btn ${filterTab === 'UNRECORDED' ? 'active' : ''}`}
              onClick={() => setFilterTab('UNRECORDED')}
            >
              <span>Belum</span>
              <span className="seg-count num">{unrecordedCount}</span>
            </button>

            <button
              type="button"
              className={`apple-segment-btn ${filterTab === 'NORMAL' ? 'active' : ''}`}
              onClick={() => setFilterTab('NORMAL')}
            >
              <span>Normal</span>
              <span className="seg-count num">{normalCount}</span>
            </button>

            <button
              type="button"
              className={`apple-segment-btn ${filterTab === 'OVER' ? 'active' : ''}`}
              onClick={() => setFilterTab('OVER')}
            >
              <span>Over</span>
              <span className="seg-count num" style={filterTab === 'OVER' ? { background: 'var(--over)', color: '#FFF' } : {}}>
                {overCount}
              </span>
            </button>
          </div>
        </div>

        {/* 4. LOCATION SHOWCASE CARDS (STREAM) */}
        <main className="locations-stream" key={selectedPeriodId}>
          {filteredLocations.length === 0 ? (
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '20px',
                padding: '36px 20px',
                textAlign: 'center',
                color: 'var(--ink-muted)',
                fontSize: '13px',
                border: '1px solid rgba(0,0,0,0.04)'
              }}
            >
              Tidak ada titik pantau untuk filter ini.
            </div>
          ) : (
            filteredLocations.map((loc, idx) => {
              const locState = formStates[loc.location_id] || {
                suhu: '',
                photo: null,
                error: '',
                saving: false
              };

              const existingTx = context.transactions.find(
                (tx) => tx.location_id === loc.location_id && tx.period_id === selectedPeriodId
              );

              const numericSuhu = parseFloat(locState.suhu.replace(',', '.'));
              const hasSuhu = !isNaN(numericSuhu) && locState.suhu.trim() !== '';
              const isOverLimit = hasSuhu && numericSuhu > context.max_temp_limit;

              const isCompleted = !!existingTx;
              const isOver = existingTx?.status_suhu === 'MELEBIHI_BATAS';
              const completedClass = isCompleted ? (isOver ? 'is-completed-over' : 'is-completed-normal') : '';

              return (
                <article
                  key={loc.location_id}
                  className={`location-apple-card stagger-in ${completedClass}`}
                  style={{ animationDelay: `${idx * 45}ms` }}
                >
                  {/* Card Top Header */}
                  <div className="card-top-header">
                    <div className="location-meta-col">
                      <span className="location-eyebrow">Titik Pantau {loc.sort_order || idx + 1}</span>
                      <h3 className="location-title">{loc.location_name}</h3>
                      <span className="location-target-label">
                        Target Suhu: ≤ {context.max_temp_limit.toFixed(1).replace('.', ',')}°C
                      </span>
                    </div>

                    {existingTx ? (
                      isOver ? (
                        <span
                          className="status-capsule overlimit"
                          style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            padding: '4px 10px',
                            height: '26px',
                            background: '#FEE2E2',
                            color: '#DC2626',
                            border: '1.5px solid #FCA5A5',
                            boxShadow: '0 2px 6px rgba(220, 38, 38, 0.12)'
                          }}
                        >
                          <svg className="sf-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                            <line x1="12" y1="9" x2="12" y2="13"/>
                            <line x1="12" y1="17" x2="12.01" y2="17"/>
                          </svg>
                          MELEBIHI BATAS (TERSIMPAN)
                        </span>
                      ) : (
                        <span
                          className="status-capsule normal"
                          style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            padding: '4px 10px',
                            height: '26px',
                            background: '#DCFCE7',
                            color: '#15803D',
                            border: '1.5px solid #86EFAC',
                            boxShadow: '0 2px 6px rgba(22, 163, 74, 0.12)'
                          }}
                        >
                          <svg className="sf-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                          TERSIMPAN LENGKAP
                        </span>
                      )
                    ) : (
                      <span className="status-capsule unrecorded">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                          <circle cx="12" cy="12" r="10"/>
                          <polyline points="12 6 12 12 16 14"/>
                        </svg>
                        BELUM DIISI
                      </span>
                    )}
                  </div>

                  {/* 1. Recorded State */}
                  {existingTx ? (
                    <div className="recorded-box">
                      {/* Confirmation Banner */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          borderRadius: '10px',
                          background: isOver ? '#FEF2F2' : '#F0FDF4',
                          border: `1px solid ${isOver ? '#FECACA' : '#BBF7D0'}`,
                          color: isOver ? '#991B1B' : '#166534',
                          fontSize: '12px',
                          fontWeight: 700,
                          marginBottom: '10px'
                        }}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                          <polyline points="22 4 12 14.01 9 11.01"/>
                        </svg>
                        <span>
                          {isOver
                            ? 'Data suhu telah tercatat & alert telah dikirim ke tim'
                            : 'Data titik pantau ini telah tersimpan lengkap di Google Sheets'}
                        </span>
                      </div>

                      <div className="temp-readout-row">
                        <div className="temp-hero-col">
                          <span
                            className="temp-hero-label"
                            style={isOver ? { color: 'var(--over)' } : {}}
                          >
                            {isOver ? 'Suhu Melebihi Batas Aman' : 'Suhu Tercatat'}
                          </span>
                          <div
                            className={`temp-hero-number num ${isOver ? 'overlimit' : 'normal'}`}
                          >
                            {existingTx.suhu.toFixed(1).replace('.', ',')}
                            <span style={{ fontSize: '20px', marginLeft: '2px' }}>°C</span>
                          </div>
                        </div>
                        <div className="recorded-time-badge">
                          <span className="time-lbl">Dicatat Pukul</span>
                          <span className="time-val num">
                            {existingTx.server_received_at?.split(' ')[1] || '08:00'} WIB
                          </span>
                        </div>
                      </div>

                      {/* WhatsApp Notice Pill for Overlimit */}
                      {isOver && (
                        <div
                          style={{
                            background: 'var(--over-tint)',
                            borderRadius: '12px',
                            padding: '8px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: '12px',
                            color: 'var(--over)',
                            fontWeight: 600,
                            gap: '6px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                            </svg>
                            <span>
                              {existingTx.wa_notif_status === 'SENT'
                                ? 'Notifikasi Darurat WhatsApp Terkirim'
                                : existingTx.wa_notif_status === 'FAILED'
                                ? 'Notifikasi WhatsApp Gagal Terkirim'
                                : 'Notifikasi WhatsApp Diproses'}
                            </span>
                          </div>
                          {existingTx.wa_notif_status === 'FAILED' ? (
                            <button
                              type="button"
                              onClick={() => handleRetryWa(existingTx.transaction_id)}
                              disabled={retryingWaTxId === existingTx.transaction_id}
                              style={{
                                background: 'var(--over)',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '3px 8px',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              {retryingWaTxId === existingTx.transaction_id ? 'Mengirim...' : 'Ulangi'}
                            </button>
                          ) : (
                            <span className="num" style={{ fontWeight: 700 }}>
                              {existingTx.wa_notif_status || 'SENT'}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Photo Thumbnail & Officer Information Strip */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          marginTop: '6px',
                          padding: '10px 12px',
                          background: '#FFFFFF',
                          borderRadius: '14px',
                          border: '1px solid #E2E8F0',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                        }}
                      >
                        {existingTx.drive_file_id ? (
                          <a
                            href={`/photo/${existingTx.drive_file_id}`}
                            target="_blank"
                            rel="noreferrer"
                            title="Klik untuk melihat foto resolusi penuh"
                            style={{
                              position: 'relative',
                              display: 'block',
                              width: '56px',
                              height: '56px',
                              borderRadius: '10px',
                              overflow: 'hidden',
                              flexShrink: 0,
                              border: '1.5px solid #CBD5E1',
                              backgroundColor: '#F1F5F9'
                            }}
                          >
                            <img
                              src={`https://drive.google.com/thumbnail?id=${existingTx.drive_file_id}&sz=w200`}
                              alt="Foto Bukti"
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                              }}
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                              }}
                            />
                            <div
                              style={{
                                position: 'absolute',
                                bottom: '2px',
                                right: '2px',
                                background: 'rgba(0,0,0,0.6)',
                                borderRadius: '4px',
                                padding: '2px 4px',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                            >
                              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5">
                                <path d="M15 3h6v6"/>
                                <path d="M10 14 21 3"/>
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                              </svg>
                            </div>
                          </a>
                        ) : null}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Petugas:</span>
                            <span style={{ fontSize: '12.5px', color: '#0F172A', fontWeight: 700 }}>
                              {existingTx.petugas_name}
                            </span>
                          </div>
                          {existingTx.drive_view_url && (
                            <a
                              href={existingTx.drive_view_url}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                fontSize: '11.5px',
                                fontWeight: 700,
                                color: 'var(--ios-blue)',
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <span>Buka File di Google Drive</span>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                                <polyline points="15 3 21 3 21 9"/>
                                <line x1="10" y1="14" x2="21" y2="3"/>
                              </svg>
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="card-footer-action-row">
                        <div className="member-locked-label">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                          </svg>
                          <span>Terkunci untuk Member (BR-03)</span>
                        </div>

                        {context.user.role === 'ADMIN' && (
                          <button
                            type="button"
                            className="apple-btn-light"
                            onClick={() => {
                              setEditingTx(existingTx);
                              setEditSuhu(existingTx.suhu.toString().replace('.', ','));
                              setEditReason('');
                              setEditError('');
                            }}
                          >
                            Ubah Data (Audit)
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* 2. Interactive Input State */
                    <div className="interactive-form-stack">
                      {/* Unified Temperature Input Group */}
                      <div className="temp-input-group-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-muted)' }}>
                            Input Pembacaan Suhu
                          </span>
                          <span style={{ fontSize: '11px', color: '#0369A1', fontWeight: 600 }}>
                            Gunakan [-] / [+] atau ketik
                          </span>
                        </div>

                        <div className="temp-input-control-row">
                          <button
                            type="button"
                            className="stepper-btn"
                            onClick={() => handleStepSuhu(loc.location_id, -0.5)}
                            disabled={context.is_date_locked}
                            title="Kurangi 0,5°C"
                          >
                            −
                          </button>

                          <div className="input-center-wrap">
                            <input
                              type="text"
                              inputMode="decimal"
                              value={locState.suhu}
                              onChange={(e) => handleSuhuChange(loc.location_id, e.target.value)}
                              disabled={context.is_date_locked}
                              placeholder="24,5"
                              className={`apple-hero-input num ${isOverLimit ? 'overlimit' : ''}`}
                            />
                            <span className="temp-unit-sign">°C</span>
                          </div>

                          <button
                            type="button"
                            className="stepper-btn"
                            onClick={() => handleStepSuhu(loc.location_id, 0.5)}
                            disabled={context.is_date_locked}
                            title="Tambah 0,5°C"
                          >
                            +
                          </button>
                        </div>

                        {/* Quick Presets */}
                        <div className="quick-preset-row">
                          <span style={{ fontSize: '11px', color: 'var(--ink-muted)', marginRight: '2px' }}>
                            Preset:
                          </span>
                          {['18,0', '20,0', '22,0', '24,0', '26,5'].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              className="quick-preset-chip"
                              onClick={() => handleSuhuChange(loc.location_id, preset)}
                              disabled={context.is_date_locked}
                              style={parseFloat(preset) > context.max_temp_limit ? { color: 'var(--over)' } : {}}
                            >
                              {preset}°C
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Smooth Overlimit Warning Banner */}
                      {isOverLimit && (
                        <div className="overlimit-banner">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginRight: '4px' }}>
                            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                          </svg>
                          <span><strong>Perhatian:</strong> Nilai suhu ({locState.suhu}°C) melebihi batas {context.max_temp_limit.toFixed(1).replace('.', ',')}°C. Sistem akan mengirim notifikasi WhatsApp darurat otomatis saat disimpan!</span>
                        </div>
                      )}

                      {/* Camera Capture Section */}
                      <div>
                        {locState.photo ? (
                          <div className="photo-preview-card">
                            <img
                              src={locState.photo.base64}
                              alt="Bukti Termometer"
                              className="photo-canvas-thumb"
                            />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '13px', fontWeight: 700, color: '#15803D', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                                <span>Foto Bukti Termometer Siap</span>
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>
                                {locState.photo.sizeKb} KB
                                {locState.photo.gpsCoordinates
                                  ? ` • GPS: ${locState.photo.gpsCoordinates}`
                                  : ''}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setActiveCameraLocation({ id: loc.location_id, name: loc.location_name })}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--primary)',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              Ulangi
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="camera-trigger-pill"
                            onClick={() => setActiveCameraLocation({ id: loc.location_id, name: loc.location_name })}
                            disabled={context.is_date_locked}
                          >
                            <svg className="sf-icon" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                              <circle cx="12" cy="13" r="4"/>
                            </svg>
                            <span>Ambil Foto Bukti Termometer</span>
                          </button>
                        )}

                        {locState.error && (
                          <div style={{ color: 'var(--over)', fontSize: '12px', fontWeight: 500, marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                              <circle cx="12" cy="12" r="10" />
                              <line x1="12" y1="8" x2="12" y2="12" />
                              <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            <span>{locState.error}</span>
                          </div>
                        )}
                      </div>

                      {/* Single Save Action Button */}
                      <button
                        type="button"
                        className="apple-btn-capsule"
                        style={{ width: '100%' }}
                        onClick={() => handleSaveLocation(loc.location_id)}
                        disabled={locState.saving || context.is_date_locked}
                      >
                        {locState.saving ? 'Menyimpan...' : 'Simpan Lokasi Ini'}
                      </button>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </main>

        {/* 5. FLOATING BATCH SAVE BANNER (FR-010) */}
        {!context.is_date_locked && unsavedReadyCount > 0 && (
          <div className="floating-batch-banner">
            <div>
              <span style={{ fontSize: '11px', color: 'var(--ink-muted)', display: 'block', fontWeight: 600 }}>
                Penyimpanan Massal (FR-010)
              </span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)' }}>
                {batchSaving ? batchProgressText : `${unsavedReadyCount} lokasi siap disimpan`}
              </span>
            </div>
            <button
              type="button"
              className="apple-btn-capsule"
              style={{ height: '40px', padding: '0 16px', fontSize: '13px' }}
              onClick={handleSaveAll}
              disabled={batchSaving}
            >
              {batchSaving ? 'Menyimpan...' : 'Simpan Semua ↗'}
            </button>
          </div>
        )}
      </div>

        {/* 5. Camera Modal Popup */}
        {activeCameraLocation && (
          <CameraCaptureModal
            locationName={activeCameraLocation.name}
            petugasName={context.user.full_name}
            onClose={() => setActiveCameraLocation(null)}
            onPhotoAccepted={(photo) => {
              setFormStates((prev) => ({
                ...prev,
                [activeCameraLocation.id]: {
                  ...prev[activeCameraLocation.id],
                  photo,
                  error: ''
                }
              }));
              setActiveCameraLocation(null);
            }}
          />
        )}

        {/* 6. Admin Edit Transaction Modal (FR-012, BR-03, OQ-01) */}
        {editingTx && (
          <div
            role="dialog"
            aria-modal="true"
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
                maxWidth: '440px',
                width: '100%',
                backgroundColor: '#FFFFFF',
                borderRadius: '28px',
                padding: '28px 24px',
                boxSizing: 'border-box',
                boxShadow: '0 20px 48px rgba(0, 0, 0, 0.2)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1D1D1F', margin: 0 }}>
                  Koreksi Suhu (Admin)
                </h2>
                <button
                  type="button"
                  onClick={() => setEditingTx(null)}
                  style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: '#86868B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  aria-label="Tutup dialog"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 16px 0' }}>
                Mengubah catatan untuk <strong>{editingTx.location_name}</strong> pada jadwal <strong>{editingTx.period_label}</strong>.
              </p>

              {editError && (
                <div style={{ backgroundColor: '#FEECEB', color: '#FF3B30', padding: '10px 12px', borderRadius: '10px', fontSize: '12px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{editError}</span>
                </div>
              )}

              <form onSubmit={handleEditSubmit}>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748B', marginBottom: '6px' }}>
                    Suhu Koreksi (°C)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={editSuhu}
                    onChange={(e) => setEditSuhu(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      height: '44px',
                      borderRadius: '10px',
                      border: '1.5px solid #CBD5E1',
                      padding: '0 12px',
                      fontSize: '18px',
                      fontWeight: 700,
                      color: '#1D1D1F',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748B', marginBottom: '6px' }}>
                    Alasan Perubahan (Wajib Audit Log) *
                  </label>
                  <textarea
                    rows={3}
                    value={editReason}
                    onChange={(e) => setEditReason(e.target.value)}
                    placeholder="Contoh: Kesalahan input petugas sebelumnya (tertukar dengan Chiller B)"
                    required
                    style={{
                      width: '100%',
                      borderRadius: '10px',
                      border: '1.5px solid #CBD5E1',
                      padding: '10px 12px',
                      fontSize: '13px',
                      color: '#1D1D1F',
                      outline: 'none',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setEditingTx(null)}
                    style={{
                      flex: 1,
                      height: '44px',
                      backgroundColor: '#F1F5F9',
                      color: '#475569',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={editSaving}
                    style={{
                      flex: 1,
                      height: '44px',
                      backgroundColor: editSaving ? '#94A3B8' : '#0071E3',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: editSaving ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {editSaving ? 'Menyimpan...' : 'Simpan Koreksi'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </AppShell>
  );
}
