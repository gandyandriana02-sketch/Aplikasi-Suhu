'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { AppIcon, APP_ICON_OPTIONS } from '@/components/AppIcon';
import { AdminWarehousesTab } from '@/components/admin/AdminWarehousesTab';
import { AdminWarehouseAccessTab } from '@/components/admin/AdminWarehouseAccessTab';

type AdminTab = 'warehouses' | 'warehouse_access' | 'master' | 'users' | 'settings' | 'notifications' | 'audit';

interface UserData {
  user_id: string;
  username: string;
  full_name: string;
  role: 'ADMIN' | 'MEMBER';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  updated_by: string;
  default_warehouse_id?: string;
}

interface LocationData {
  location_id: string;
  location_name: string;
  sort_order: number;
  is_active: boolean;
}

interface PeriodData {
  period_id: string;
  period_label: string;
  sort_order: number;
  is_active: boolean;
}

interface SettingsData {
  app_name?: string;
  app_icon?: string;
  max_temp_limit: number;
  lock_sunday: boolean;
  holiday_dates: string[];
  unlocked_dates: string[];
  wa_notification_enabled: boolean;
  idle_timeout_minutes?: number;
  signoff_maker_title?: string;
  signoff_maker_name?: string;
  signoff_checker_title?: string;
  signoff_checker_name?: string;
  signoff_approver_title?: string;
  signoff_approver_name?: string;
}

interface AuditLogItem {
  log_id: string;
  server_timestamp: string;
  actor_user_id: string;
  actor_username: string;
  actor_role: string;
  action_category: string;
  target_reference: string;
  before_value: any;
  after_value: any;
  notes_or_reason: string;
}

function getAdminTabIcon(tabId: string, size = 16) {
  switch (tabId) {
    case 'warehouses':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 21V9l9-6 9 6v12H3Z" />
          <path d="M9 21v-6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v6" />
          <line x1="3" y1="13" x2="21" y2="13" />
        </svg>
      );
    case 'warehouse_access':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="7.5" cy="15.5" r="4.5" />
          <path d="m21 3-9.5 9.5" />
          <path d="m15.5 7.5 3 3" />
          <path d="m18 5 2 2" />
        </svg>
      );
    case 'master':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      );
    case 'users':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case 'settings':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      );
    case 'notifications':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      );
    case 'audit':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
          <line x1="9" y1="12" x2="15" y2="12" />
          <line x1="9" y1="16" x2="13" y2="16" />
        </svg>
      );
    default:
      return null;
  }
}

function AdminPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as AdminTab | null;

  const [currentUser, setCurrentUser] = useState<{ full_name?: string; role?: string } | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<AdminTab>('warehouses');
  const [loading, setLoading] = useState(true);

  // Multi-warehouse selection in master & settings
  const [warehousesList, setWarehousesList] = useState<Array<{ warehouse_id: string; warehouse_code: string; warehouse_name: string }>>([]);
  const [selectedMasterWhId, setSelectedMasterWhId] = useState<string>('WH-001');
  const [selectedSettingsWhId, setSelectedSettingsWhId] = useState<string>('WH-001');

  // Sync tab with URL query parameter
  useEffect(() => {
    if (tabParam && ['warehouses', 'warehouse_access', 'master', 'users', 'settings', 'notifications', 'audit'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // USERS STATE & MODALS
  const [users, setUsers] = useState<UserData[]>([]);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER');
  const [newDefaultWhId, setNewDefaultWhId] = useState('WH-001');
  const [userSaving, setUserSaving] = useState(false);

  // User Edit Modal
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editRole, setEditRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER');
  const [editDefaultWhId, setEditDefaultWhId] = useState('WH-001');

  // User Reset Password Modal
  const [resettingUser, setResettingUser] = useState<UserData | null>(null);
  const [resetNewPassword, setResetNewPassword] = useState('');

  // MASTER STATE & MODALS
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [periods, setPeriods] = useState<PeriodData[]>([]);
  const [newLocName, setNewLocName] = useState('');
  const [newPeriodLabel, setNewPeriodLabel] = useState('');
  const [masterSaving, setMasterSaving] = useState(false);

  // Master Edit Location Modal
  const [editingLoc, setEditingLoc] = useState<LocationData | null>(null);
  const [editLocName, setEditLocName] = useState('');
  const [editLocOrder, setEditLocOrder] = useState<number>(0);

  // Master Edit Period Modal
  const [editingPeriod, setEditingPeriod] = useState<PeriodData | null>(null);
  const [editPeriodLabel, setEditPeriodLabel] = useState('');
  const [editPeriodOrder, setEditPeriodOrder] = useState<number>(0);

  // SETTINGS STATE
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [newUnlockDate, setNewUnlockDate] = useState('');
  const [newHolidayDate, setNewHolidayDate] = useState('');

  // AUDIT STATE
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [auditCategory, setAuditCategory] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  // NOTIFICATIONS RETRY
  const [retryTxId, setRetryTxId] = useState('');
  const [retryProcessing, setRetryProcessing] = useState(false);

  // BACKUP & RESTORE & CLEANUP STATE (FR-025, FR-026)
  const [backupLoading, setBackupLoading] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [cleanupConfirmText, setCleanupConfirmText] = useState('');
  const [cleanupClearPhotos, setCleanupClearPhotos] = useState(true);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [cleanupError, setCleanupError] = useState<string | null>(null);

  // Load Current User and verify Admin
  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) {
          window.location.href = '/login';
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data || !data.user) return;
        if (data.user.role !== 'ADMIN') {
          alert('Akses Ditolak: Halaman ini khusus Administrator.');
          window.location.href = '/dashboard';
          return;
        }
        setCurrentUser({ full_name: data.user.full_name, role: data.user.role });
      })
      .catch(() => {
        window.location.href = '/login';
      });

    loadWarehousesList();
  }, []);

  async function loadWarehousesList() {
    try {
      const res = await fetch('/api/warehouses', { cache: 'no-store' });
      if (!res.ok) return;
      const d = await res.json();
      if (d?.warehouses?.length > 0) {
        setWarehousesList(d.warehouses);
        const firstWhId = d.warehouses[0].warehouse_id;
        setSelectedMasterWhId((prev) => (d.warehouses.some((w: any) => w.warehouse_id === prev) ? prev : firstWhId));
        setSelectedSettingsWhId((prev) => (d.warehouses.some((w: any) => w.warehouse_id === prev) ? prev : firstWhId));
        setNewDefaultWhId((prev) => (d.warehouses.some((w: any) => w.warehouse_id === prev) ? prev : firstWhId));
      }
    } catch {}
  }

  // Flash success helper
  function flashSuccess(msg: string) {
    setSuccessMsg(msg);
    setError(null);
    setTimeout(() => setSuccessMsg(null), 4000);
  }

  // Load data for active tab
  const loadTabData = useCallback(
    async (tab: AdminTab) => {
      setLoading(true);
      setError(null);
      try {
        if (tab === 'users') {
          const res = await fetch('/api/admin/users', { cache: 'no-store' });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Gagal memuat pengguna');
          setUsers(data.users || []);
        } else if (tab === 'master') {
          await loadMasterForWh(selectedMasterWhId);
        } else if (tab === 'settings') {
          await loadSettingsForWh(selectedSettingsWhId);
        } else if (tab === 'audit') {
          let url = '/api/admin/audit-logs';
          if (auditCategory) url += `?action_category=${auditCategory}`;
          const res = await fetch(url, { cache: 'no-store' });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Gagal memuat jejak audit');
          setAuditLogs(data.audit_logs || []);
        }
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan');
      } finally {
        setLoading(false);
      }
    },
    [auditCategory, selectedMasterWhId, selectedSettingsWhId]
  );

  async function loadMasterForWh(whId: string) {
    try {
      const res = await fetch(`/api/admin/master?warehouse_id=${whId}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memuat master');
      setLocations(data.locations || []);
      setPeriods(data.periods || []);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat master titik & shift');
    }
  }

  async function loadSettingsForWh(whId: string) {
    try {
      const res = await fetch(`/api/admin/settings?warehouse_id=${whId}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memuat pengaturan');
      setSettings(data.settings || null);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat pengaturan');
    }
  }

  useEffect(() => {
    loadTabData(activeTab);
  }, [activeTab, loadTabData]);

  // =========================================================================
  // USER HANDLERS
  // =========================================================================

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword || !newFullName.trim()) return;
    setUserSaving(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newUsername.trim(),
          password: newPassword,
          full_name: newFullName.trim(),
          role: newRole,
          default_warehouse_id: newDefaultWhId
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menambah pengguna');
      setShowAddUserModal(false);
      setNewUsername('');
      setNewPassword('');
      setNewFullName('');
      setNewRole('MEMBER');
      flashSuccess(`Pengguna ${newUsername} berhasil ditambahkan.`);
      loadTabData('users');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUserSaving(false);
    }
  }

  async function handleSaveEditUser(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser || !editFullName.trim()) return;
    setUserSaving(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_PROFILE',
          user_id: editingUser.user_id,
          full_name: editFullName.trim(),
          role: editRole,
          default_warehouse_id: editDefaultWhId
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengubah pengguna');
      setEditingUser(null);
      flashSuccess(`Profil pengguna ${editingUser.username} berhasil diperbarui.`);
      loadTabData('users');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUserSaving(false);
    }
  }

  async function handleSaveResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!resettingUser || !resetNewPassword) return;
    if (resetNewPassword.length < 8) {
      alert('Password minimal 8 karakter.');
      return;
    }
    setUserSaving(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RESET_PASSWORD',
          user_id: resettingUser.user_id,
          new_password: resetNewPassword
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mereset sandi');
      setResettingUser(null);
      setResetNewPassword('');
      flashSuccess(`Kata sandi untuk ${resettingUser.username} berhasil direset.`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUserSaving(false);
    }
  }

  async function handleToggleUserStatus(u: UserData) {
    const actionName = u.is_active ? 'nonaktifkan' : 'aktifkan';
    if (!confirm(`Apakah Anda yakin ingin me-${actionName} pengguna ${u.username}?`)) return;
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TOGGLE_STATUS',
          user_id: u.user_id,
          is_active: !u.is_active
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengubah status pengguna');
      flashSuccess(`Pengguna ${u.username} berhasil di-${actionName}.`);
      loadTabData('users');
    } catch (err: any) {
      alert(err.message);
    }
  }

  // =========================================================================
  // MASTER LOCATIONS & PERIODS HANDLERS
  // =========================================================================

  async function handleAddLocation(e: React.FormEvent) {
    e.preventDefault();
    if (!newLocName.trim()) {
      alert('Silakan ketik nama titik lokasi terlebih dahulu pada kolom isian.');
      return;
    }
    setMasterSaving(true);
    try {
      const res = await fetch('/api/admin/master', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'LOCATION',
          name_or_label: newLocName.trim(),
          warehouse_id: selectedMasterWhId
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menambah titik lokasi');
      setNewLocName('');
      flashSuccess('Titik pantau baru berhasil ditambahkan.');
      await loadMasterForWh(selectedMasterWhId);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setMasterSaving(false);
    }
  }

  async function handleToggleLocationStatus(loc: LocationData) {
    const actionName = loc.is_active ? 'nonaktifkan' : 'aktifkan';
    if (!confirm(`Apakah Anda yakin ingin me-${actionName} titik pantau ${loc.location_name}?`)) return;
    try {
      const res = await fetch('/api/admin/master', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'LOCATION',
          id: loc.location_id,
          is_active: !loc.is_active
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengubah status');
      flashSuccess(`Titik pantau berhasil di-${actionName}.`);
      await loadMasterForWh(selectedMasterWhId);
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleSaveEditLocation(e: React.FormEvent) {
    e.preventDefault();
    if (!editingLoc || !editLocName.trim()) return;
    setMasterSaving(true);
    try {
      const res = await fetch('/api/admin/master', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'LOCATION',
          id: editingLoc.location_id,
          name_or_label: editLocName.trim(),
          sort_order: editLocOrder
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengubah lokasi');
      setEditingLoc(null);
      flashSuccess('Data titik pantau berhasil diubah.');
      await loadMasterForWh(selectedMasterWhId);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setMasterSaving(false);
    }
  }

  async function handleAddPeriod(e: React.FormEvent) {
    e.preventDefault();
    if (!newPeriodLabel.trim()) {
      alert('Silakan ketik label jadwal shift terlebih dahulu pada kolom isian.');
      return;
    }
    setMasterSaving(true);
    try {
      const res = await fetch('/api/admin/master', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'PERIOD',
          name_or_label: newPeriodLabel.trim(),
          warehouse_id: selectedMasterWhId
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menambah jadwal shift');
      setNewPeriodLabel('');
      flashSuccess('Jadwal shift baru berhasil ditambahkan.');
      await loadMasterForWh(selectedMasterWhId);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setMasterSaving(false);
    }
  }

  async function handleTogglePeriodStatus(p: PeriodData) {
    const actionName = p.is_active ? 'nonaktifkan' : 'aktifkan';
    if (!confirm(`Apakah Anda yakin ingin me-${actionName} jadwal shift ${p.period_label}?`)) return;
    try {
      const res = await fetch('/api/admin/master', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'PERIOD',
          id: p.period_id,
          is_active: !p.is_active
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengubah status');
      flashSuccess(`Jadwal shift berhasil di-${actionName}.`);
      await loadMasterForWh(selectedMasterWhId);
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleSaveEditPeriod(e: React.FormEvent) {
    e.preventDefault();
    if (!editingPeriod || !editPeriodLabel.trim()) return;
    setMasterSaving(true);
    try {
      const res = await fetch('/api/admin/master', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'PERIOD',
          id: editingPeriod.period_id,
          name_or_label: editPeriodLabel.trim(),
          sort_order: editPeriodOrder
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengubah jadwal');
      setEditingPeriod(null);
      flashSuccess('Data jadwal shift berhasil diubah.');
      await loadMasterForWh(selectedMasterWhId);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setMasterSaving(false);
    }
  }

  async function handleDeleteLocation(loc: LocationData) {
    if (!confirm(`Hapus titik lokasi "${loc.location_name}"?\n\nPerhatian: Titik lokasi yang sudah memiliki riwayat transaksi suhu tidak dapat dihapus (BR-08) dan harus dinonaktifkan.`)) return;
    setMasterSaving(true);
    try {
      const res = await fetch('/api/admin/master', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'LOCATION',
          id: loc.location_id
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus titik lokasi');
      flashSuccess(`Titik lokasi "${loc.location_name}" berhasil dihapus.`);
      await loadMasterForWh(selectedMasterWhId);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setMasterSaving(false);
    }
  }

  async function handleDeletePeriod(p: PeriodData) {
    if (!confirm(`Hapus jadwal shift "${p.period_label}"?\n\nPerhatian: Jadwal shift yang sudah memiliki riwayat transaksi suhu tidak dapat dihapus (BR-08) dan harus dinonaktifkan.`)) return;
    setMasterSaving(true);
    try {
      const res = await fetch('/api/admin/master', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'PERIOD',
          id: p.period_id
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus jadwal shift');
      flashSuccess(`Jadwal shift "${p.period_label}" berhasil dihapus.`);
      await loadMasterForWh(selectedMasterWhId);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setMasterSaving(false);
    }
  }

  // =========================================================================
  // SETTINGS HANDLERS
  // =========================================================================

  async function handleSaveSettings() {
    if (!settings) return;
    setSettingsSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...settings,
          warehouse_id: selectedSettingsWhId
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan pengaturan');
      flashSuccess('Pengaturan sistem berhasil diperbarui.');
      await loadSettingsForWh(selectedSettingsWhId);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSettingsSaving(false);
    }
  }

  // =========================================================================
  // BACKUP, RESTORE & TESTING CLEANUP HANDLERS (FR-025, FR-026)
  // =========================================================================

  // Unduh Berkas Cadangan (.JSON atau .XLSX)
  async function handleDownloadBackup(format: 'json' | 'xlsx' = 'json') {
    setBackupLoading(true);
    try {
      const res = await fetch(`/api/admin/backup?format=${format}`);
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || 'Gagal mengunduh cadangan data.');
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = new Date().toISOString().slice(0, 10);
      a.download = format === 'xlsx' ? `Backup_Database_Suhu_${dateStr}.xlsx` : `Backup_Database_Suhu_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      flashSuccess(`Berkas cadangan sistem (${format.toUpperCase()}) berhasil diunduh.`);
    } catch {
      setError('Terjadi kesalahan jaringan saat mengunduh cadangan.');
    } finally {
      setBackupLoading(false);
    }
  }

  // Pemulihan Database dari Berkas JSON (Restore)
  async function handleRestoreSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!restoreFile) {
      setRestoreError('Pilih berkas .json cadangan terlebih dahulu.');
      return;
    }
    setRestoreLoading(true);
    setRestoreError(null);
    try {
      const text = await restoreFile.text();
      let jsonPayload;
      try {
        jsonPayload = JSON.parse(text);
      } catch {
        setRestoreError('Berkas yang dipilih bukan format JSON yang valid.');
        setRestoreLoading(false);
        return;
      }

      const res = await fetch('/api/admin/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sheets: jsonPayload.sheets || jsonPayload,
          reason: 'Pemulihan data manual oleh Administrator dari menu Pengaturan'
        })
      });
      const d = await res.json();
      if (!res.ok) {
        setRestoreError(d.error || 'Gagal memulihkan database.');
        return;
      }
      setShowRestoreModal(false);
      setRestoreFile(null);
      flashSuccess(d.message || 'Database berhasil dipulihkan dari cadangan.');
      await loadSettingsForWh(selectedSettingsWhId);
    } catch {
      setRestoreError('Terjadi kesalahan jaringan saat memulihkan database.');
    } finally {
      setRestoreLoading(false);
    }
  }

  // Pembersihan Data Sampah Testing (Reset Transaksi)
  async function handleCleanupSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (cleanupConfirmText.trim() !== 'RESET') {
      setCleanupError('Harap ketik "RESET" dengan huruf kapital untuk mengonfirmasi.');
      return;
    }
    setCleanupLoading(true);
    setCleanupError(null);
    try {
      const res = await fetch('/api/admin/cleanup-testing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmation: 'RESET',
          clear_photos: cleanupClearPhotos,
          reason: 'Pembersihan data sampah testing pasca validasi oleh Administrator'
        })
      });
      const d = await res.json();
      if (!res.ok) {
        setCleanupError(d.error || 'Gagal membersihkan data testing.');
        return;
      }
      setShowCleanupModal(false);
      setCleanupConfirmText('');
      flashSuccess(d.message || 'Data transaksi testing berhasil dibersihkan.');
    } catch {
      setCleanupError('Terjadi kesalahan jaringan saat membersihkan data testing.');
    } finally {
      setCleanupLoading(false);
    }
  }

  function handleAddUnlockDate() {
    if (!newUnlockDate) return;
    if (!settings) return;
    if (settings.unlocked_dates?.includes(newUnlockDate)) {
      alert('Tanggal ini sudah dibuka.');
      return;
    }
    const updated = [...(settings.unlocked_dates || []), newUnlockDate];
    setSettings({ ...settings, unlocked_dates: updated });
    setNewUnlockDate('');
  }

  function handleRemoveUnlockDate(dateStr: string) {
    if (!settings) return;
    const updated = settings.unlocked_dates.filter((d) => d !== dateStr);
    setSettings({ ...settings, unlocked_dates: updated });
  }

  function handleAddHolidayDate() {
    if (!newHolidayDate) return;
    if (!settings) return;
    if (settings.holiday_dates?.includes(newHolidayDate)) {
      alert('Tanggal libur ini sudah terdaftar.');
      return;
    }
    const updated = [...(settings.holiday_dates || []), newHolidayDate];
    setSettings({ ...settings, holiday_dates: updated });
    setNewHolidayDate('');
  }

  function handleRemoveHolidayDate(dateStr: string) {
    if (!settings) return;
    const updated = (settings.holiday_dates || []).filter((d) => d !== dateStr);
    setSettings({ ...settings, holiday_dates: updated });
  }

  // =========================================================================
  // NOTIFICATIONS RETRY HANDLER
  // =========================================================================

  async function handleRetryNotification(e: React.FormEvent) {
    e.preventDefault();
    if (!retryTxId.trim()) return;
    setRetryProcessing(true);
    try {
      const res = await fetch('/api/notifications/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transaction_id: retryTxId.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memicu ulang notifikasi');
      flashSuccess('Notifikasi WhatsApp berhasil dikirim ulang via Fonnte.');
      setRetryTxId('');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setRetryProcessing(false);
    }
  }

  const TABS_CONFIG = [
    { id: 'warehouses', label: 'Master Gudang' },
    { id: 'warehouse_access', label: 'Hak Akses' },
    { id: 'master', label: 'Titik & Shift' },
    { id: 'users', label: 'Pengguna' },
    { id: 'settings', label: 'Batas Suhu & Kunci' },
    { id: 'notifications', label: 'WhatsApp Gateway' },
    { id: 'audit', label: 'Audit Logs Kekal' }
  ];

  return (
    <AppShell
      user={currentUser}
      activeAdminTab={activeTab}
      onAdminTabChange={(tab) => {
        setActiveTab(tab as AdminTab);
        router.push(`/admin?tab=${tab}`);
      }}
    >
      <div className="admin-viewport-container apple-view-enter">
        <div className="admin-main-paper">
          
          {/* =========================================================================
              1. LEFT SIDEBAR NAVIGATION (APPLE HIG DESKTOP SIDEBAR)
              ========================================================================= */}
          <aside className="admin-sidebar">
            <div className="sidebar-brand-group">
              <div className="sidebar-brand-badge">
                <div className="brand-icon-box">
                  <AppIcon name={settings?.app_icon || 'thermometer'} size={20} color="#FFFFFF" strokeWidth={2.2} />
                </div>
                <div>
                  <div className="brand-text-title">{settings?.app_name || 'Warehouse Suhu'}</div>
                  <div className="brand-text-sub">Admin Console</div>
                </div>
              </div>

              <nav className="sidebar-nav-menu">
                <div className="sidebar-section-heading">DATA MASTER</div>

                <button
                  type="button"
                  onClick={() => { setActiveTab('warehouses'); router.push('/admin?tab=warehouses'); }}
                  className={`sidebar-nav-item ${activeTab === 'warehouses' ? 'active' : ''}`}
                >
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{getAdminTabIcon('warehouses')}</span>
                  <span>Master Gudang</span>
                  <span className="nav-count-badge">{warehousesList.length}</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setActiveTab('warehouse_access'); router.push('/admin?tab=warehouse_access'); }}
                  className={`sidebar-nav-item ${activeTab === 'warehouse_access' ? 'active' : ''}`}
                >
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{getAdminTabIcon('warehouse_access')}</span>
                  <span>Hak Akses Gudang</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setActiveTab('master'); router.push('/admin?tab=master'); }}
                  className={`sidebar-nav-item ${activeTab === 'master' ? 'active' : ''}`}
                >
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{getAdminTabIcon('master')}</span>
                  <span>Titik & Shift</span>
                  <span className="nav-count-badge">{locations.length}/{periods.length}</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setActiveTab('users'); router.push('/admin?tab=users'); }}
                  className={`sidebar-nav-item ${activeTab === 'users' ? 'active' : ''}`}
                >
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{getAdminTabIcon('users')}</span>
                  <span>Manajemen Pengguna</span>
                  <span className="nav-count-badge">{users.length}</span>
                </button>

                <div className="sidebar-section-heading" style={{ marginTop: '10px' }}>KONFIGURASI & SISTEM</div>

                <button
                  type="button"
                  onClick={() => { setActiveTab('settings'); router.push('/admin?tab=settings'); }}
                  className={`sidebar-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
                >
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{getAdminTabIcon('settings')}</span>
                  <span>Batas Suhu & Kunci</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setActiveTab('notifications'); router.push('/admin?tab=notifications'); }}
                  className={`sidebar-nav-item ${activeTab === 'notifications' ? 'active' : ''}`}
                >
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{getAdminTabIcon('notifications')}</span>
                  <span>WhatsApp Gateway</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setActiveTab('audit'); router.push('/admin?tab=audit'); }}
                  className={`sidebar-nav-item ${activeTab === 'audit' ? 'active' : ''}`}
                >
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{getAdminTabIcon('audit')}</span>
                  <span>Audit Logs Kekal</span>
                </button>
              </nav>
            </div>

            {/* Sidebar Footer Profile */}
            <div className="sidebar-footer-profile">
              <div className="profile-avatar">
                {(currentUser?.full_name || 'AD').substring(0, 2).toUpperCase()}
              </div>
              <div className="profile-meta">
                <span className="profile-name">{currentUser?.full_name || 'Administrator'}</span>
                <span className="profile-role">Admin Sesi Aktif</span>
              </div>
            </div>
          </aside>

          {/* =========================================================================
              2. RIGHT CONTENT PANE
              ========================================================================= */}
          <div className="admin-content-pane">
            
            {/* Mobile Navigation Dropdown & Quick Badges */}
            <div className="admin-mobile-nav">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ios-muted)', textTransform: 'uppercase' }}>
                  Menu Administrasi
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '12px', fontSize: '10.5px', fontWeight: 700, background: '#EEF2FF', color: '#4338CA' }}>
                  ADMIN
                </span>
              </div>
              <select
                value={activeTab}
                onChange={(e) => {
                  const tab = e.target.value as AdminTab;
                  setActiveTab(tab);
                  router.push(`/admin?tab=${tab}`);
                }}
                className="apple-select-input"
                style={{ fontWeight: 700, fontSize: '13px', padding: '10px 14px' }}
              >
                {TABS_CONFIG.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Content Pane Header */}
            <div className="admin-pane-header">
              <div className="admin-title-row">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ios-ink)', margin: 0, letterSpacing: '-0.4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {getAdminTabIcon(activeTab, 20)}
                      <span>{TABS_CONFIG.find(t => t.id === activeTab)?.label}</span>
                    </h1>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: '#EEF2FF', color: '#4338CA', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4338CA' }} />
                      ADMINISTRATOR
                    </span>
                  </div>
                  <p style={{ fontSize: '12.5px', color: 'var(--ios-muted)', marginTop: '4px', margin: 0 }}>
                    {activeTab === 'warehouses' && 'Kelola cabang warehouse aktif, batas suhu standar, dan status operasional (FR-003).'}
                    {activeTab === 'warehouse_access' && 'Tentukan gudang mana saja yang boleh diakses oleh tiap akun petugas (BR-04, FR-004).'}
                    {activeTab === 'master' && 'Konfigurasi titik pemantauan suhu dan jam shift pemeriksaan per gudang (FR-002, BR-08).'}
                    {activeTab === 'users' && 'Daftar akun petugas lapangan dan administrator serta pengaturan kredensial (FR-001).'}
                    {activeTab === 'settings' && 'Pengaturan batas suhu, kunci hari Minggu, pembukaan tanggal lampau, dan identitas aplikasi (FR-011).'}
                    {activeTab === 'notifications' && 'Status integrasi WhatsApp Fonnte API dan pengiriman ulang darurat (FR-014, TS-06).'}
                    {activeTab === 'audit' && 'Jejak audit permanen seluruh aktivitas perubahan data dan konfigurasi sistem (BR-11, NFR-04).'}
                  </p>
                </div>
              </div>

              {/* Success Alert Banner */}
              {successMsg && (
                <div
                  role="status"
                  style={{ background: '#E8F8ED', border: '1px solid rgba(52, 199, 89, 0.4)', color: '#15803D', padding: '10px 16px', borderRadius: '14px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Error Alert Banner */}
              {error && (
                <div
                  role="alert"
                  style={{ background: '#FEEBEA', border: '1px solid rgba(255, 59, 48, 0.3)', color: '#DC2626', padding: '10px 16px', borderRadius: '14px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Tab Content Body */}
            <div className="admin-pane-body">
            {loading ? (
              <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--ios-muted)', fontSize: '14px' }}>
                <p>Memuat konfigurasi panel administrasi...</p>
              </div>
            ) : (
            <>
              {/* ============================================================= */}
              {/* TAB 1: MASTER WAREHOUSE (Fitur 1)                             */}
              {/* ============================================================= */}
              {activeTab === 'warehouses' && (
                <AdminWarehousesTab
                  onSuccess={flashSuccess}
                  onError={(err) => setError(err)}
                  onWarehouseChange={loadWarehousesList}
                />
              )}

              {/* ============================================================= */}
              {/* TAB 2: HAK AKSES WAREHOUSE (Fitur 2)                          */}
              {/* ============================================================= */}
              {activeTab === 'warehouse_access' && (
                <AdminWarehouseAccessTab
                  onSuccess={flashSuccess}
                  onError={(err) => setError(err)}
                />
              )}

              {/* ============================================================= */}
              {/* TAB 3: TITIK LOKASI & JADWAL SHIFT                            */}
              {/* ============================================================= */}
              {activeTab === 'master' && (
                <section aria-label="Master Data Lokasi dan Shift" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Warehouse Filter */}
                  {warehousesList.length > 0 && (
                    <div style={{ background: '#F8FAFC', padding: '16px 20px', borderRadius: '16px', border: '1px solid var(--ios-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <label htmlFor="master-wh-select" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ios-ink)' }}>
                          Konteks Warehouse:
                        </label>
                        <select
                          id="master-wh-select"
                          value={selectedMasterWhId}
                          onChange={(e) => {
                            const whId = e.target.value;
                            setSelectedMasterWhId(whId);
                            loadMasterForWh(whId);
                          }}
                          className="apple-select-input"
                          style={{ padding: '6px 12px', fontSize: '12.5px', fontWeight: 600 }}
                        >
                          {warehousesList.map((wh) => (
                            <option key={wh.warehouse_id} value={wh.warehouse_id}>
                              {wh.warehouse_code} — {wh.warehouse_name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--ios-muted)', fontWeight: 500 }}>
                        Perubahan otomatis menghasilkan catatan audit kekal (BR-11).
                      </span>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
                    {/* Master Lokasi */}
                    <div className="bento-admin-card">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <h2 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--ios-ink)' }}>
                            Titik Lokasi Pantau (MASTER_LOKASI)
                          </h2>
                          <p style={{ fontSize: '12px', color: 'var(--ios-muted)', marginTop: '2px' }}>
                            Daftar titik pengecekan suhu di area gudang
                          </p>
                        </div>
                        <span className="status-badge" style={{ background: 'var(--ios-blue-tint)', color: 'var(--ios-blue)' }}>
                          {locations.length} Titik
                        </span>
                      </div>

                      <form
                        onSubmit={handleAddLocation}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          background: '#F8FAFC',
                          padding: '12px 14px',
                          borderRadius: '12px',
                          border: '1px solid var(--ios-border)'
                        }}
                      >
                        <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ios-ink)' }}>
                          Tambah Titik Pantau Baru
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input
                            type="text"
                            required
                            placeholder="Ketik nama titik di sini (misal: Chiller B / Storage 2)"
                            value={newLocName}
                            onChange={(e) => setNewLocName(e.target.value)}
                            className="apple-input-text"
                            style={{ flex: 1, padding: '9px 12px', fontSize: '13px' }}
                          />
                          <button
                            type="submit"
                            disabled={masterSaving}
                            className="btn-action-primary"
                            style={{ whiteSpace: 'nowrap', padding: '9px 18px', fontSize: '13px' }}
                          >
                            {masterSaving ? 'Menyimpan...' : '+ Tambah'}
                          </button>
                        </div>
                      </form>

                      <div className="apple-table-wrap">
                        <table className="apple-data-table">
                          <thead>
                            <tr>
                              <th>Titik Lokasi</th>
                              <th style={{ textAlign: 'center', width: '70px' }}>Urutan</th>
                              <th style={{ textAlign: 'center', width: '90px' }}>Status</th>
                              <th style={{ textAlign: 'right', width: '180px' }}>Aksi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {locations.length === 0 ? (
                              <tr>
                                <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: 'var(--ios-muted)' }}>
                                  Belum ada titik lokasi untuk warehouse ini.
                                </td>
                              </tr>
                            ) : (
                              locations.map((loc) => (
                                <tr key={loc.location_id}>
                                  <td style={{ fontWeight: 700, color: 'var(--ios-ink)' }}>
                                    {loc.location_name}
                                  </td>
                                  <td style={{ textAlign: 'center', fontFamily: 'monospace', fontWeight: 600, color: 'var(--ios-muted)' }}>
                                    {loc.sort_order}
                                  </td>
                                  <td style={{ textAlign: 'center' }}>
                                    <span className={`status-badge ${loc.is_active ? 'active' : 'inactive'}`}>
                                      {loc.is_active ? 'Aktif' : 'Non-aktif'}
                                    </span>
                                  </td>
                                  <td style={{ textAlign: 'right' }}>
                                    <div className="tbl-action-group">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingLoc(loc);
                                          setEditLocName(loc.location_name);
                                          setEditLocOrder(loc.sort_order);
                                        }}
                                        className="btn-tbl-action"
                                      >
                                        Ubah
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleToggleLocationStatus(loc)}
                                        className={`btn-tbl-action ${loc.is_active ? 'danger' : 'primary'}`}
                                      >
                                        {loc.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteLocation(loc)}
                                        className="btn-tbl-action danger"
                                        title="Hapus permanen (hanya jika belum memiliki transaksi suhu)"
                                      >
                                        Hapus
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Master Jadwal Shift */}
                    <div className="bento-admin-card">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <h2 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--ios-ink)' }}>
                            Jadwal Shift Pengecekan (MASTER_PERIODE)
                          </h2>
                          <p style={{ fontSize: '12px', color: 'var(--ios-muted)', marginTop: '2px' }}>
                            Slot waktu pemantauan rutin suhu harian
                          </p>
                        </div>
                        <span className="status-badge" style={{ background: 'var(--ios-blue-tint)', color: 'var(--ios-blue)' }}>
                          {periods.length} Shift
                        </span>
                      </div>

                      <form
                        onSubmit={handleAddPeriod}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          background: '#F8FAFC',
                          padding: '12px 14px',
                          borderRadius: '12px',
                          border: '1px solid var(--ios-border)'
                        }}
                      >
                        <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ios-ink)' }}>
                          Tambah Jadwal Shift Baru
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input
                            type="text"
                            required
                            placeholder="Ketik label shift di sini (misal: 20.00 / Malam 20:00 - 21:00)"
                            value={newPeriodLabel}
                            onChange={(e) => setNewPeriodLabel(e.target.value)}
                            className="apple-input-text"
                            style={{ flex: 1, padding: '9px 12px', fontSize: '13px' }}
                          />
                          <button
                            type="submit"
                            disabled={masterSaving}
                            className="btn-action-primary"
                            style={{ whiteSpace: 'nowrap', padding: '9px 18px', fontSize: '13px' }}
                          >
                            {masterSaving ? 'Menyimpan...' : '+ Tambah'}
                          </button>
                        </div>
                      </form>

                      <div className="apple-table-wrap">
                        <table className="apple-data-table">
                          <thead>
                            <tr>
                              <th>Label Shift</th>
                              <th style={{ textAlign: 'center', width: '70px' }}>Urutan</th>
                              <th style={{ textAlign: 'center', width: '90px' }}>Status</th>
                              <th style={{ textAlign: 'right', width: '180px' }}>Aksi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {periods.length === 0 ? (
                              <tr>
                                <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: 'var(--ios-muted)' }}>
                                  Belum ada jadwal shift untuk warehouse ini.
                                </td>
                              </tr>
                            ) : (
                              periods.map((p) => (
                                <tr key={p.period_id}>
                                  <td style={{ fontWeight: 700, color: 'var(--ios-ink)' }}>
                                    {p.period_label}
                                  </td>
                                  <td style={{ textAlign: 'center', fontFamily: 'monospace', fontWeight: 600, color: 'var(--ios-muted)' }}>
                                    {p.sort_order}
                                  </td>
                                  <td style={{ textAlign: 'center' }}>
                                    <span className={`status-badge ${p.is_active ? 'active' : 'inactive'}`}>
                                      {p.is_active ? 'Aktif' : 'Non-aktif'}
                                    </span>
                                  </td>
                                  <td style={{ textAlign: 'right' }}>
                                    <div className="tbl-action-group">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingPeriod(p);
                                          setEditPeriodLabel(p.period_label);
                                          setEditPeriodOrder(p.sort_order);
                                        }}
                                        className="btn-tbl-action"
                                      >
                                        Ubah
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleTogglePeriodStatus(p)}
                                        className={`btn-tbl-action ${p.is_active ? 'danger' : 'primary'}`}
                                      >
                                        {p.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeletePeriod(p)}
                                        className="btn-tbl-action danger"
                                        title="Hapus permanen (hanya jika belum memiliki transaksi suhu)"
                                      >
                                        Hapus
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* ============================================================= */}
              {/* TAB 4: MANAJEMEN PENGGUNA (USERS)                             */}
              {/* ============================================================= */}
              {activeTab === 'users' && (
                <section aria-label="Manajemen Pengguna" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <h2 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--ios-ink)' }}>
                        Daftar Pengguna & Kredensial
                      </h2>
                      <p style={{ fontSize: '12.5px', color: 'var(--ios-muted)', marginTop: '2px' }}>
                        Kelola akun petugas lapangan dan administrator terdaftar ({users.length} akun)
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddUserModal(true)}
                      className="btn-action-primary"
                    >
                      <span>+</span>
                      <span>Tambah Pengguna</span>
                    </button>
                  </div>

                  <div className="apple-table-wrap">
                    <table className="apple-data-table">
                      <thead>
                        <tr>
                          <th>Username</th>
                          <th>Nama Lengkap</th>
                          <th>Peran (Role)</th>
                          <th>Warehouse Default</th>
                          <th style={{ textAlign: 'center' }}>Status</th>
                          <th style={{ textAlign: 'right', paddingRight: '20px' }}>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => (
                          <tr key={u.user_id}>
                            <td style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--ios-ink)' }}>
                              {u.username}
                            </td>
                            <td style={{ fontWeight: 600, color: 'var(--ios-ink)' }}>
                              {u.full_name}
                            </td>
                            <td>
                              <span
                                className={`status-badge ${u.role === 'ADMIN' ? 'admin-role' : 'member-role'}`}
                              >
                                {u.role}
                              </span>
                            </td>
                            <td>
                              {u.default_warehouse_id ? (
                                <span
                                  className="status-badge"
                                  style={{ background: '#F1F5F9', color: '#334155', border: '1px solid #CBD5E1' }}
                                >
                                  {warehousesList.find((w) => w.warehouse_id === u.default_warehouse_id)?.warehouse_code || u.default_warehouse_id}
                                </span>
                              ) : (
                                <span style={{ color: 'var(--ios-muted)' }}>–</span>
                              )}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span className={`status-badge ${u.is_active ? 'active' : 'inactive'}`}>
                                {u.is_active ? 'Aktif' : 'Non-aktif'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                              <div className="tbl-action-group">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingUser(u);
                                    setEditFullName(u.full_name);
                                    setEditRole(u.role);
                                    setEditDefaultWhId(u.default_warehouse_id || (warehousesList[0]?.warehouse_id || 'WH-001'));
                                  }}
                                  className="btn-tbl-action"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setResettingUser(u);
                                    setResetNewPassword('');
                                  }}
                                  className="btn-tbl-action primary"
                                >
                                  Reset Sandi
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleUserStatus(u)}
                                  className={`btn-tbl-action ${u.is_active ? 'danger' : 'primary'}`}
                                >
                                  {u.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {/* ============================================================= */}
              {/* TAB 5: PENGATURAN BATAS SUHU & KUNCI TANGGAL                  */}
              {/* ============================================================= */}
              {activeTab === 'settings' && settings && (
                <section aria-label="Pengaturan dan Kebijakan Suhu" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* Warehouse Selector for Settings */}
                  {warehousesList.length > 0 && (
                    <div style={{ background: '#F8FAFC', padding: '16px 20px', borderRadius: '16px', border: '1px solid var(--ios-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <label htmlFor="settings-wh-select" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ios-ink)' }}>
                          Konfigurasi untuk Warehouse:
                        </label>
                        <select
                          id="settings-wh-select"
                          value={selectedSettingsWhId}
                          onChange={(e) => {
                            const whId = e.target.value;
                            setSelectedSettingsWhId(whId);
                            loadSettingsForWh(whId);
                          }}
                          className="apple-select-input"
                          style={{ padding: '6px 12px', fontSize: '12.5px', fontWeight: 600 }}
                        >
                          {warehousesList.map((wh) => (
                            <option key={wh.warehouse_id} value={wh.warehouse_id}>
                              {wh.warehouse_code} — {wh.warehouse_name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--ios-muted)', fontWeight: 500 }}>
                        Pengaturan berlaku per warehouse sesuai regulasi suhu masing-masing.
                      </span>
                    </div>
                  )}

                  <div className="settings-grid">
                    {/* Identitas & Ikon Aplikasi (Global) */}
                    <div className="settings-card" style={{ gridColumn: '1 / -1' }}>
                      <div className="settings-card-head">
                        <div>
                          <h3 className="settings-card-title">
                            Identitas & Ikon Aplikasi (Kustomisasi Global)
                          </h3>
                          <p className="settings-card-desc">
                            Sesuaikan nama aplikasi dan ikon utama yang ditampilkan pada header navigasi dan sidebar console administrator.
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '10px' }}>
                        <div>
                          <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ios-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>
                            Nama Aplikasi
                          </label>
                          <input
                            type="text"
                            value={settings.app_name || ''}
                            placeholder="Warehouse Temperature"
                            onChange={(e) => setSettings({ ...settings, app_name: e.target.value })}
                            className="apple-input-text"
                            style={{ width: '100%', padding: '10px 14px', fontSize: '14px', fontWeight: 600 }}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ios-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>
                            Inisial / Monogram Kustom (Alternatif 2 Huruf)
                          </label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input
                              type="text"
                              value={['thermometer', 'snowflake', 'warehouse', 'shield', 'gauge', 'box', 'pulse', 'frost-shield', '❄️', '🌡️', '🏢', '🏭', '📦', '🧊', '📊', '🛡️'].includes(settings.app_icon || '') ? '' : (settings.app_icon || '')}
                              placeholder="Contoh: WT"
                              maxLength={3}
                              onChange={(e) => setSettings({ ...settings, app_icon: e.target.value.toUpperCase() })}
                              className="apple-input-text"
                              style={{ width: '120px', padding: '10px 14px', fontSize: '14px', fontWeight: 700, textAlign: 'center', letterSpacing: '0.05em' }}
                              title="Masukkan inisial brand (contoh: WT, KF, HQ) jika ingin menampilkan monogram"
                            />
                            <span style={{ fontSize: '12px', color: 'var(--ios-muted)', lineHeight: 1.3 }}>
                              Gunakan jika ingin logo berbasis inisial perusahaan, atau pilih simbol vektor di bawah.
                            </span>
                          </div>
                        </div>

                        <div style={{ gridColumn: '1 / -1' }}>
                          <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ios-muted)', display: 'block', marginBottom: '10px', textTransform: 'uppercase' }}>
                            Pilihan Simbol Brand Vektor (Apple SF Symbol Standard — Bukan Emoji)
                          </label>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))', gap: '10px' }}>
                            {APP_ICON_OPTIONS.map((opt) => {
                              const currentVal = (settings.app_icon || 'thermometer').toLowerCase().trim();
                              const isSelected = currentVal === opt.id ||
                                (opt.id === 'snowflake' && (currentVal === '❄️' || currentVal === '🧊')) ||
                                (opt.id === 'thermometer' && currentVal === '🌡️') ||
                                (opt.id === 'warehouse' && (currentVal === '🏢' || currentVal === '🏭')) ||
                                (opt.id === 'shield' && currentVal === '🛡️') ||
                                (opt.id === 'gauge' && currentVal === '📊') ||
                                (opt.id === 'box' && currentVal === '📦');

                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => setSettings({ ...settings, app_icon: opt.id })}
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    padding: '12px 10px',
                                    borderRadius: '12px',
                                    border: isSelected ? '2px solid var(--ios-blue)' : '1px solid var(--ios-border)',
                                    background: isSelected ? '#EFF6FF' : '#FFFFFF',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                    boxShadow: isSelected ? '0 2px 8px rgba(0, 113, 227, 0.12)' : 'none',
                                    textAlign: 'center'
                                  }}
                                >
                                  <div
                                    style={{
                                      width: '38px',
                                      height: '38px',
                                      borderRadius: '10px',
                                      background: isSelected ? '#0071E3' : '#F1F5F9',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      transition: 'all 0.15s ease'
                                    }}
                                  >
                                    <AppIcon name={opt.id} size={20} color={isSelected ? '#FFFFFF' : '#475569'} strokeWidth={2.2} />
                                  </div>
                                  <span style={{ fontSize: '12px', fontWeight: isSelected ? 700 : 600, color: isSelected ? '#0071E3' : 'var(--ios-ink)' }}>
                                    {opt.label}
                                  </span>
                                  <span style={{ fontSize: '10.5px', color: 'var(--ios-muted)', lineHeight: 1.2 }}>
                                    {opt.category}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Batas Suhu Card */}
                    <div className="settings-card">
                      <div className="settings-card-head">
                        <div>
                          <h3 className="settings-card-title">
                            Batas Suhu Maksimal Standar (°C)
                          </h3>
                          <p className="settings-card-desc">
                            Pencatatan suhu &gt; batas ini akan memicu status MELEBIHI_BATAS dan peringatan darurat Fonnte (FR-007, BR-07).
                          </p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                        <input
                          type="number"
                          step="0.1"
                          value={settings.max_temp_limit}
                          onChange={(e) =>
                            setSettings({ ...settings, max_temp_limit: parseFloat(e.target.value) || 0 })
                          }
                          className="apple-input-text"
                          style={{ width: '130px', fontSize: '18px', fontWeight: 800, textAlign: 'center' }}
                        />
                        <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--ios-muted)' }}>°C</span>
                      </div>
                    </div>

                    {/* Gembok Hari Libur & Hari Minggu */}
                    <div className="settings-card">
                      <div className="settings-card-head">
                        <div>
                          <h3 className="settings-card-title">
                            Penguncian Operasional
                          </h3>
                          <p className="settings-card-desc">
                            Batasi hak input dan integrasi notifikasi otomatis
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--ios-border)' }}>
                          <div>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ios-ink)', display: 'block' }}>
                              Kunci Pengisian Hari Minggu (Lock Sunday)
                            </span>
                            <span style={{ fontSize: '11.5px', color: 'var(--ios-muted)' }}>
                              Member dilarang mencatat suhu pada hari Minggu tanpa kunci dibuka
                            </span>
                          </div>
                          <label className="apple-switch">
                            <input
                              type="checkbox"
                              checked={settings.lock_sunday}
                              onChange={(e) => setSettings({ ...settings, lock_sunday: e.target.checked })}
                            />
                            <span className="switch-slider"></span>
                          </label>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ios-ink)', display: 'block' }}>
                              Integrasi Peringatan WhatsApp (Fonnte API)
                            </span>
                            <span style={{ fontSize: '11.5px', color: 'var(--ios-muted)' }}>
                              Kirim pesan instan otomatis saat ada insiden suhu melebihi batas
                            </span>
                          </div>
                          <label className="apple-switch">
                            <input
                              type="checkbox"
                              checked={settings.wa_notification_enabled}
                              onChange={(e) =>
                                setSettings({ ...settings, wa_notification_enabled: e.target.checked })
                              }
                            />
                            <span className="switch-slider"></span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Keamanan Sesi & Auto-Logout saat Idle (FR-006 & Section 8.1) */}
                    <div className="settings-card">
                      <div className="settings-card-head">
                        <div>
                          <h3 className="settings-card-title">
                            Keamanan Sesi & Auto-Logout saat Idle
                          </h3>
                          <p className="settings-card-desc">
                            Otomatis menutup sesi login jika perangkat tidak disentuh atau tidak aktif selama durasi tertentu demi mencegah akses tidak sah.
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '8px' }}>
                        <div>
                          <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ios-ink)', display: 'block', marginBottom: '6px' }}>
                            Batas Waktu Tidak Aktif (Idle Timeout):
                          </label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            <select
                              value={
                                [0, 15, 30, 60, 120].includes(settings.idle_timeout_minutes ?? 0)
                                  ? String(settings.idle_timeout_minutes ?? 0)
                                  : 'custom'
                              }
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === 'custom') {
                                  const current = settings.idle_timeout_minutes ?? 0;
                                  const nextVal = [0, 15, 30, 60, 120].includes(current) ? 45 : current;
                                  setSettings({ ...settings, idle_timeout_minutes: nextVal });
                                } else {
                                  setSettings({ ...settings, idle_timeout_minutes: parseInt(val, 10) });
                                }
                              }}
                              className="apple-select-input"
                              style={{ padding: '8px 14px', fontSize: '13px', fontWeight: 600, minWidth: '220px' }}
                            >
                              <option value="0">Nonaktif (Sesi Normal 12 Jam)</option>
                              <option value="15">15 Menit</option>
                              <option value="30">30 Menit (Rekomendasi Standar)</option>
                              <option value="60">1 Jam (60 Menit)</option>
                              <option value="120">2 Jam (120 Menit)</option>
                              <option value="custom">Lainnya / Kustom (Edit Sendiri)...</option>
                            </select>

                            {/* Opsi Edit Sendiri (Kustom Jam/Menit) */}
                            {![0, 15, 30, 60, 120].includes(settings.idle_timeout_minutes ?? 0) && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <input
                                  type="number"
                                  min="1"
                                  max="720"
                                  value={settings.idle_timeout_minutes || ''}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value, 10);
                                    setSettings({
                                      ...settings,
                                      idle_timeout_minutes: isNaN(val) ? 0 : Math.max(1, Math.min(720, val))
                                    });
                                  }}
                                  placeholder="Menit"
                                  className="apple-input-text"
                                  style={{ width: '85px', padding: '8px 10px', fontSize: '14px', fontWeight: 700, textAlign: 'center' }}
                                />
                                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ios-muted)' }}>
                                  menit
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Helper info badge */}
                        <div
                          style={{
                            padding: '10px 14px',
                            borderRadius: '12px',
                            backgroundColor: (settings.idle_timeout_minutes ?? 0) > 0 ? '#EFF6FF' : '#F8FAFC',
                            border: `1px solid ${(settings.idle_timeout_minutes ?? 0) > 0 ? '#BFDBFE' : '#E2E8F0'}`,
                            fontSize: '12px',
                            color: (settings.idle_timeout_minutes ?? 0) > 0 ? '#1E40AF' : '#64748B',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          <span style={{ fontSize: '15px' }}>ℹ️</span>
                          <span>
                            {(settings.idle_timeout_minutes ?? 0) > 0 ? (
                              <>
                                Pengguna otomatis logout setelah <strong>{settings.idle_timeout_minutes} menit</strong> tanpa aktivitas (
                                {settings.idle_timeout_minutes! >= 60
                                  ? `${Math.floor(settings.idle_timeout_minutes! / 60)} jam ${settings.idle_timeout_minutes! % 60 > 0 ? `${settings.idle_timeout_minutes! % 60} menit` : ''}`
                                  : `${settings.idle_timeout_minutes} menit`}
                                ). Pengguna akan langsung otomatis logout seketika saat batas waktu tercapai dan diarahkan kembali ke layar login awal.
                              </>
                            ) : (
                              'Auto-logout saat idle dinonaktifkan. Sesi hanya akan berakhir setelah 12 jam (1 shift kerja gudang) sejak login.'
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Fitur Buka Kunci Tanggal (DATE_UNLOCK) */}
                    <div className="settings-card" style={{ gridColumn: '1 / -1' }}>
                      <div className="settings-card-head">
                        <div>
                          <h3 className="settings-card-title">
                            Pembukaan Kunci Tanggal Khusus (Input Susulan Member - FR-011)
                          </h3>
                          <p className="settings-card-desc">
                            Izinkan petugas lapangan menginput data pada tanggal lampau yang terlewat. Wajib mencantumkan alasan operasional (OQ-01).
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
                        <input
                          type="date"
                          value={newUnlockDate}
                          onChange={(e) => setNewUnlockDate(e.target.value)}
                          className="apple-input-text"
                          style={{ width: 'auto', minWidth: '180px', padding: '8px 12px', fontSize: '13px', fontWeight: 600 }}
                        />
                        <button
                          type="button"
                          onClick={handleAddUnlockDate}
                          className="btn-action-primary"
                          style={{ padding: '8px 18px' }}
                        >
                          + Buka Tanggal Ini
                        </button>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                        {(settings.unlocked_dates || []).length === 0 ? (
                          <span style={{ fontSize: '12px', color: 'var(--ios-muted)' }}>
                            Tidak ada tanggal lampau yang sedang dibuka untuk warehouse ini.
                          </span>
                        ) : (
                          (settings.unlocked_dates || []).map((date) => (
                            <span
                              key={date}
                              className="status-badge active"
                              style={{ padding: '6px 12px', fontSize: '12px', gap: '8px' }}
                            >
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                  <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                                </svg>
                                {date}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveUnlockDate(date)}
                                style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center' }}
                                title="Kunci kembali tanggal ini"
                                aria-label="Kunci kembali tanggal ini"
                              >
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                  <line x1="18" y1="6" x2="6" y2="18" />
                                  <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                              </button>
                            </span>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Fitur Daftar Hari Libur Nasional (HOLIDAY_DATES) */}
                    <div className="settings-card" style={{ gridColumn: '1 / -1' }}>
                      <div className="settings-card-head">
                        <div>
                          <h3 className="settings-card-title">
                            Daftar Hari Libur Nasional Resmi (Holiday Lock)
                          </h3>
                          <p className="settings-card-desc">
                            Tanggal libur nasional yang dikunci bagi Member untuk pencatatan suhu rutin, kecuali dibuka secara khusus.
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
                        <input
                          type="date"
                          value={newHolidayDate}
                          onChange={(e) => setNewHolidayDate(e.target.value)}
                          className="apple-input-text"
                          style={{ width: 'auto', minWidth: '180px', padding: '8px 12px', fontSize: '13px', fontWeight: 600 }}
                        />
                        <button
                          type="button"
                          onClick={handleAddHolidayDate}
                          className="btn-action-primary"
                          style={{ padding: '8px 18px' }}
                        >
                          + Tambah Hari Libur
                        </button>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                        {(settings.holiday_dates || []).length === 0 ? (
                          <span style={{ fontSize: '12px', color: 'var(--ios-muted)' }}>
                            Belum ada tanggal libur nasional yang didaftarkan.
                          </span>
                        ) : (
                          (settings.holiday_dates || []).map((date) => (
                            <span
                              key={date}
                              className="status-badge"
                              style={{ padding: '6px 12px', fontSize: '12px', gap: '8px', background: '#FEF3C7', color: '#92400E', border: '1px solid #FCD34D' }}
                            >
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                  <line x1="16" y1="2" x2="16" y2="6" />
                                  <line x1="8" y1="2" x2="8" y2="6" />
                                  <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                                {date}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveHolidayDate(date)}
                                style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center' }}
                                title="Hapus tanggal libur ini"
                                aria-label="Hapus tanggal libur ini"
                              >
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                  <line x1="18" y1="6" x2="6" y2="18" />
                                  <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                              </button>
                            </span>
                          ))
                        )}
                      </div>
                    </div>

                      {/* Pejabat Pengesahan Laporan Bulanan (Sign-off Bulanan) */}
                      <div className="settings-card" style={{ gridColumn: '1 / -1' }}>
                        <div className="settings-card-head">
                          <div>
                            <h3 className="settings-card-title">
                              Pejabat Pengesahan Laporan Bulanan (Sign-off Laporan)
                            </h3>
                            <p className="settings-card-desc">
                              Atur nama dan jabatan pejabat penandatangan pada kolom pengesahan (Dibuat Oleh, Diperiksa Oleh, Diketahui Oleh) di bagian bawah cetak rekap bulanan warehouse ini.
                            </p>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '14px' }}>
                          {/* Signoff 1: Dibuat Oleh */}
                          <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '14px', border: '1px solid var(--ios-border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--ios-ink)' }}>1. Dibuat Oleh</span>
                              <span style={{ fontSize: '10.5px', padding: '2px 8px', borderRadius: '10px', background: '#EEF2FF', color: '#4338CA', fontWeight: 700 }}>KOLOM 1</span>
                            </div>
                            <div>
                              <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--ios-muted)', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>
                                Jabatan / Sub-Role
                              </label>
                              <input
                                type="text"
                                value={settings.signoff_maker_title || ''}
                                placeholder="Petugas Lapangan / QC Checker"
                                onChange={(e) => setSettings({ ...settings, signoff_maker_title: e.target.value })}
                                className="apple-input-text"
                                style={{ width: '100%', padding: '9px 12px', fontSize: '13px' }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--ios-muted)', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>
                                Nama Pejabat
                              </label>
                              <input
                                type="text"
                                value={settings.signoff_maker_name || ''}
                                placeholder="Kosongkan untuk otomatis nama akun penginput"
                                onChange={(e) => setSettings({ ...settings, signoff_maker_name: e.target.value })}
                                className="apple-input-text"
                                style={{ width: '100%', padding: '9px 12px', fontSize: '13px', fontWeight: 600 }}
                              />
                            </div>
                          </div>

                          {/* Signoff 2: Diperiksa Oleh */}
                          <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '14px', border: '1px solid var(--ios-border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--ios-ink)' }}>2. Diperiksa Oleh</span>
                              <span style={{ fontSize: '10.5px', padding: '2px 8px', borderRadius: '10px', background: '#ECFDF5', color: '#047857', fontWeight: 700 }}>KOLOM 2</span>
                            </div>
                            <div>
                              <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--ios-muted)', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>
                                Jabatan / Sub-Role
                              </label>
                              <input
                                type="text"
                                value={settings.signoff_checker_title || ''}
                                placeholder="Supervisor Logistik & Cold Chain"
                                onChange={(e) => setSettings({ ...settings, signoff_checker_title: e.target.value })}
                                className="apple-input-text"
                                style={{ width: '100%', padding: '9px 12px', fontSize: '13px' }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--ios-muted)', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>
                                Nama Pejabat
                              </label>
                              <input
                                type="text"
                                value={settings.signoff_checker_name || ''}
                                placeholder="Contoh: Hendra Gunawan"
                                onChange={(e) => setSettings({ ...settings, signoff_checker_name: e.target.value })}
                                className="apple-input-text"
                                style={{ width: '100%', padding: '9px 12px', fontSize: '13px', fontWeight: 600 }}
                              />
                            </div>
                          </div>

                          {/* Signoff 3: Diketahui Oleh */}
                          <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '14px', border: '1px solid var(--ios-border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--ios-ink)' }}>3. Diketahui Oleh</span>
                              <span style={{ fontSize: '10.5px', padding: '2px 8px', borderRadius: '10px', background: '#EFF6FF', color: '#1D4ED8', fontWeight: 700 }}>KOLOM 3</span>
                            </div>
                            <div>
                              <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--ios-muted)', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>
                                Jabatan / Sub-Role
                              </label>
                              <input
                                type="text"
                                value={settings.signoff_approver_title || ''}
                                placeholder="QA / Warehouse Manager"
                                onChange={(e) => setSettings({ ...settings, signoff_approver_title: e.target.value })}
                                className="apple-input-text"
                                style={{ width: '100%', padding: '9px 12px', fontSize: '13px' }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--ios-muted)', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>
                                Nama Pejabat
                              </label>
                              <input
                                type="text"
                                value={settings.signoff_approver_name || ''}
                                placeholder="Contoh: Dr. Rian Wicaksono"
                                onChange={(e) => setSettings({ ...settings, signoff_approver_name: e.target.value })}
                                className="apple-input-text"
                                style={{ width: '100%', padding: '9px 12px', fontSize: '13px', fontWeight: 600 }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ============================================================= */}
                    {/* CADANGAN & EKSPOR SELURUH DATABASE SISTEM (FR-025)            */}
                    {/* ============================================================= */}
                    <div className="settings-card" style={{ gridColumn: '1 / -1' }}>
                      <div className="settings-card-head">
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '18px' }}>💾</span>
                            <h3 className="settings-card-title">
                              Cadangan & Ekspor Seluruh Database (Backup & Export)
                            </h3>
                          </div>
                          <p className="settings-card-desc">
                            Unduh seluruh salinan data Google Sheets untuk arsip offline atau cadangan keamanan sebelum pengujian. Berkas cadangan .JSON dapat digunakan untuk memulihkan (restore) data kapan saja.
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '16px' }}>
                        <button
                          type="button"
                          disabled={backupLoading}
                          onClick={() => handleDownloadBackup('json')}
                          className="btn-action-primary"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontSize: '13px' }}
                          title="Unduh cadangan data sistem terstruktur dalam format JSON"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                          <span>{backupLoading ? 'Menyiapkan...' : 'Unduh Cadangan Lengkap (.JSON)'}</span>
                        </button>

                        <button
                          type="button"
                          disabled={backupLoading}
                          onClick={() => handleDownloadBackup('xlsx')}
                          className="btn-action-secondary"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontSize: '13px', borderColor: '#86EFAC', color: '#15803D', background: '#F0FDF4' }}
                          title="Ekspor seluruh 8 sheet data ke dalam satu workbook Excel"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="8" y1="13" x2="16" y2="13" />
                            <line x1="8" y1="17" x2="16" y2="17" />
                          </svg>
                          <span>{backupLoading ? 'Menyiapkan...' : 'Ekspor Semua Sheet (.XLSX)'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setRestoreFile(null);
                            setRestoreError(null);
                            setShowRestoreModal(true);
                          }}
                          className="btn-action-secondary"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontSize: '13px' }}
                          title="Pulihkan database dari berkas backup JSON"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                          </svg>
                          <span>Pulihkan Database (Restore)...</span>
                        </button>
                      </div>
                    </div>

                    {/* ============================================================= */}
                    {/* ZONA PEMELIHARAAN: BERSIHKAN DATA TESTING (FR-026)            */}
                    {/* ============================================================= */}
                    <div className="settings-card" style={{ gridColumn: '1 / -1', border: '1.5px solid #FECACA', background: '#FFFBFB' }}>
                      <div className="settings-card-head">
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '18px' }}>🧹</span>
                            <h3 className="settings-card-title" style={{ color: '#DC2626' }}>
                              Pembersihan Data Testing (Reset Transaksi)
                            </h3>
                            <span style={{ fontSize: '10.5px', fontWeight: 800, padding: '2px 8px', borderRadius: '12px', background: '#FEE2E2', color: '#B91C1C' }}>
                              ZONA PEMELIHARAAN
                            </span>
                          </div>
                          <p className="settings-card-desc" style={{ color: '#7F1D1D' }}>
                            Fitur ini digunakan saat masa uji coba/testing selesai dan aplikasi siap digunakan secara resmi (Go-Live). Seluruh baris transaksi di <code>TRANSAKSI_SUHU</code> dan foto bukti terkait akan dibersihkan, sedangkan akun pengguna, daftar gudang, master lokasi, jadwal, dan pengaturan lainnya <strong>tetap utuh dan aman</strong>.
                          </p>
                        </div>
                      </div>

                      <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                        <span style={{ fontSize: '12px', color: '#991B1B', fontWeight: 500 }}>
                          Pastikan Anda sudah mengunduh cadangan (.JSON / .XLSX) sebelum membersihkan data.
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setCleanupConfirmText('');
                            setCleanupClearPhotos(true);
                            setCleanupError(null);
                            setShowCleanupModal(true);
                          }}
                          style={{
                            backgroundColor: '#DC2626',
                            color: '#FFFFFF',
                            border: 'none',
                            padding: '10px 20px',
                            borderRadius: '30px',
                            fontSize: '13px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)'
                          }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                          <span>Bersihkan Data Testing...</span>
                        </button>
                      </div>
                    </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                    <button
                      type="button"
                      disabled={settingsSaving}
                      onClick={handleSaveSettings}
                      className="btn-action-primary"
                      style={{ padding: '12px 28px', fontSize: '14px', borderRadius: '30px' }}
                    >
                      {settingsSaving ? 'Menyimpan...' : 'Simpan Semua Pengaturan'}
                    </button>
                  </div>
                </section>
              )}

              {/* ============================================================= */}
              {/* TAB 6: NOTIFIKASI WHATSAPP & RETRY                            */}
              {/* ============================================================= */}
              {activeTab === 'notifications' && (
                <section aria-label="Notifikasi WhatsApp" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* Gateway Status Header */}
                  <div className="settings-card" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#25D366', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(37,211,102,0.3)' }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                      </div>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--ios-ink)' }}>
                          Gateway WhatsApp Fonnte: <span style={{ color: '#15803D' }}>● AKTIF & TERHUBUNG</span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--ios-muted)', marginTop: '2px' }}>
                          Token API tersimpan aman di Vercel Secret • Pesan darurat otomatis terkirim jika suhu overlimit
                        </div>
                      </div>
                    </div>
                    <span className="status-badge sent" style={{ padding: '6px 14px', fontSize: '12px' }}>
                      Ready for Broadcast
                    </span>
                  </div>

                  {/* Manual Retry Form */}
                  <div className="settings-card" style={{ maxWidth: '560px' }}>
                    <div className="settings-card-head">
                      <div>
                        <h3 className="settings-card-title">
                          Picu Ulang Pengiriman WhatsApp (Manual Retry - TS-06)
                        </h3>
                        <p className="settings-card-desc">
                          Gunakan fitur ini jika terjadi kendala jaringan saat pengiriman notifikasi overlimit sebelumnya.
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handleRetryNotification} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '4px' }}>
                      <div className="form-group-item">
                        <label className="form-label">
                          ID Transaksi (transaction_id)
                        </label>
                        <input
                          type="text"
                          placeholder="Contoh: TX-20261017-081530-abc"
                          value={retryTxId}
                          onChange={(e) => setRetryTxId(e.target.value)}
                          className="apple-input-text"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={retryProcessing || !retryTxId.trim()}
                        className="btn-action-primary"
                        style={{ alignSelf: 'flex-start', padding: '10px 20px' }}
                      >
                        {retryProcessing ? 'Mengirim...' : 'Kirim Ulang Notifikasi'}
                      </button>
                    </form>
                  </div>
                </section>
              )}

              {/* ============================================================= */}
              {/* TAB 7: JEJAK AUDIT LOGS KEKAL                                */}
              {/* ============================================================= */}
              {activeTab === 'audit' && (
                <section aria-label="Riwayat Jejak Audit" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ios-ink)' }}>Filter Kategori:</span>
                      <select
                        value={auditCategory}
                        onChange={(e) => setAuditCategory(e.target.value)}
                        className="apple-select-input"
                        style={{ padding: '6px 12px', fontSize: '12.5px', fontWeight: 600 }}
                      >
                        <option value="">Semua Kategori Aksi</option>
                        <option value="TX_CREATE">Pencatatan Baru (TX_CREATE)</option>
                        <option value="TX_UPDATE">Revisi Transaksi (TX_UPDATE)</option>
                        <option value="USER_MGMT">Manajemen User (USER_MGMT)</option>
                        <option value="MASTER_MGMT">Master Data (MASTER_MGMT)</option>
                        <option value="WH_MGMT">Warehouse (WH_MGMT)</option>
                        <option value="WH_ACCESS_MGMT">Akses Warehouse (WH_ACCESS_MGMT)</option>
                        <option value="SETTING_CHANGE">Pengaturan (SETTING_CHANGE)</option>
                        <option value="WA_RETRY">Retry WhatsApp (WA_RETRY)</option>
                        <option value="TX_DELETE">Hapus Transaksi (TX_DELETE)</option>
                        <option value="DATA_BACKUP">Cadangan Data (DATA_BACKUP)</option>
                        <option value="DATA_RESTORE">Pemulihan Data (DATA_RESTORE)</option>
                        <option value="DATA_CLEANUP">Pembersihan Testing (DATA_CLEANUP)</option>
                      </select>
                    </div>

                    <span style={{ fontSize: '12px', color: 'var(--ios-muted)', fontWeight: 500 }}>
                      Semua log bersifat kekal dan tidak dapat dihapus (BR-11).
                    </span>
                  </div>

                  <div className="apple-table-wrap">
                    <table className="apple-data-table">
                      <thead>
                        <tr>
                          <th>Waktu Server (WIB)</th>
                          <th>Pelaku / Aktor</th>
                          <th>Kategori</th>
                          <th>Target Objek</th>
                          <th>Alasan / Catatan</th>
                          <th style={{ textAlign: 'right', paddingRight: '20px' }}>Inspeksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditLogs.length === 0 ? (
                          <tr>
                            <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--ios-muted)' }}>
                              Belum ada catatan audit log yang cocok.
                            </td>
                          </tr>
                        ) : (
                          auditLogs.map((log) => (
                            <tr key={log.log_id}>
                              <td style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--ios-muted)', whiteSpace: 'nowrap' }}>
                                {log.server_timestamp.replace('T', ' ').substring(0, 19)}
                              </td>
                              <td style={{ fontWeight: 600, color: 'var(--ios-ink)' }}>
                                {log.actor_username} <span style={{ fontSize: '11px', color: 'var(--ios-muted)' }}>({log.actor_role})</span>
                              </td>
                              <td>
                                <span
                                  className="status-badge"
                                  style={{ background: '#F1F5F9', color: '#334155', border: '1px solid #CBD5E1' }}
                                >
                                  {log.action_category}
                                </span>
                              </td>
                              <td style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--ios-ink)' }}>
                                {log.target_reference}
                              </td>
                              <td style={{ color: '#475569', fontSize: '12.5px' }}>
                                {log.notes_or_reason || '–'}
                              </td>
                              <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                                <button
                                  type="button"
                                  onClick={() => setSelectedLog(log)}
                                  className="btn-tbl-action primary"
                                >
                                  Detail JSON
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </>
          )}
          </div>
        </div>
      </div>
    </div>

      {/* =================================================================== */}
      {/* MODAL 1: TAMBAH PENGGUNA BARU                                       */}
      {/* =================================================================== */}
      {showAddUserModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="apple-modal-overlay"
          onClick={() => setShowAddUserModal(false)}
        >
          <div className="apple-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head-bar">
              <h2 className="modal-head-title">Tambah Pengguna Baru</h2>
              <button
                type="button"
                onClick={() => setShowAddUserModal(false)}
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
            <form onSubmit={handleAddUser}>
              <div className="modal-body-scroll">
                <div className="form-group-item">
                  <label className="form-label">Username</label>
                  <input
                    type="text"
                    required
                    placeholder="nama_pengguna"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="apple-input-text"
                  />
                </div>

                <div className="form-group-item">
                  <label className="form-label">Password Awal (Default: admin123)</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="apple-input-text"
                  />
                  <span style={{ fontSize: '11px', color: 'var(--ios-muted)' }}>
                    Pengguna wajib mengganti password saat login pertama kali (FR-001).
                  </span>
                </div>

                <div className="form-group-item">
                  <label className="form-label">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    placeholder="Nama Lengkap Pengguna"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    className="apple-input-text"
                  />
                </div>

                <div className="form-group-item">
                  <label className="form-label">Peran (Role)</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as 'ADMIN' | 'MEMBER')}
                    className="apple-select-input"
                  >
                    <option value="MEMBER">MEMBER (Petugas Lapangan)</option>
                    <option value="ADMIN">ADMIN (Supervisor / Pengelola)</option>
                  </select>
                </div>

                <div className="form-group-item">
                  <label className="form-label">Warehouse Default</label>
                  <select
                    value={newDefaultWhId}
                    onChange={(e) => setNewDefaultWhId(e.target.value)}
                    className="apple-select-input"
                  >
                    {warehousesList.map((w) => (
                      <option key={w.warehouse_id} value={w.warehouse_id}>
                        {w.warehouse_code} — {w.warehouse_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-foot-bar">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="btn-action-secondary"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={userSaving}
                  className="btn-action-primary"
                >
                  {userSaving ? 'Menyimpan...' : 'Simpan Pengguna'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 2: EDIT PENGGUNA                                              */}
      {/* =================================================================== */}
      {editingUser && (
        <div
          role="dialog"
          aria-modal="true"
          className="apple-modal-overlay"
          onClick={() => setEditingUser(null)}
        >
          <div className="apple-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head-bar">
              <h2 className="modal-head-title">Ubah Profil Pengguna ({editingUser.username})</h2>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
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
            <form onSubmit={handleSaveEditUser}>
              <div className="modal-body-scroll">
                <div className="form-group-item">
                  <label className="form-label">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="apple-input-text"
                  />
                </div>

                <div className="form-group-item">
                  <label className="form-label">Peran (Role)</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as 'ADMIN' | 'MEMBER')}
                    className="apple-select-input"
                  >
                    <option value="MEMBER">MEMBER (Petugas Lapangan)</option>
                    <option value="ADMIN">ADMIN (Supervisor / Pengelola)</option>
                  </select>
                </div>

                <div className="form-group-item">
                  <label className="form-label">Warehouse Default</label>
                  <select
                    value={editDefaultWhId}
                    onChange={(e) => setEditDefaultWhId(e.target.value)}
                    className="apple-select-input"
                  >
                    {warehousesList.map((w) => (
                      <option key={w.warehouse_id} value={w.warehouse_id}>
                        {w.warehouse_code} — {w.warehouse_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-foot-bar">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="btn-action-secondary"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={userSaving}
                  className="btn-action-primary"
                >
                  {userSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 3: RESET PASSWORD PENGGUNA                                   */}
      {/* =================================================================== */}
      {resettingUser && (
        <div
          role="dialog"
          aria-modal="true"
          className="apple-modal-overlay"
          onClick={() => setResettingUser(null)}
        >
          <div className="apple-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head-bar">
              <h2 className="modal-head-title">Reset Sandi ({resettingUser.username})</h2>
              <button
                type="button"
                onClick={() => setResettingUser(null)}
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
            <form onSubmit={handleSaveResetPassword}>
              <div className="modal-body-scroll">
                <div className="form-group-item">
                  <label className="form-label">
                    Password Baru (minimal 8 karakter)
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Ketik password baru..."
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    className="apple-input-text"
                  />
                </div>
              </div>

              <div className="modal-foot-bar">
                <button
                  type="button"
                  onClick={() => setResettingUser(null)}
                  className="btn-action-secondary"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={userSaving}
                  className="btn-action-primary"
                >
                  {userSaving ? 'Mereset...' : 'Reset Kata Sandi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 4: EDIT MASTER LOKASI                                         */}
      {/* =================================================================== */}
      {editingLoc && (
        <div
          role="dialog"
          aria-modal="true"
          className="apple-modal-overlay"
          onClick={() => setEditingLoc(null)}
        >
          <div className="apple-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head-bar">
              <h2 className="modal-head-title">Ubah Titik Pantau ({editingLoc.location_id})</h2>
              <button
                type="button"
                onClick={() => setEditingLoc(null)}
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
            <form onSubmit={handleSaveEditLocation}>
              <div className="modal-body-scroll">
                <div className="form-group-item">
                  <label className="form-label">Nama Titik Lokasi</label>
                  <input
                    type="text"
                    required
                    value={editLocName}
                    onChange={(e) => setEditLocName(e.target.value)}
                    className="apple-input-text"
                  />
                </div>

                <div className="form-group-item">
                  <label className="form-label">Urutan Tampilan</label>
                  <input
                    type="number"
                    required
                    value={editLocOrder}
                    onChange={(e) => setEditLocOrder(parseInt(e.target.value, 10) || 0)}
                    className="apple-input-text"
                    style={{ width: '120px' }}
                  />
                </div>
              </div>

              <div className="modal-foot-bar">
                <button
                  type="button"
                  onClick={() => setEditingLoc(null)}
                  className="btn-action-secondary"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={masterSaving}
                  className="btn-action-primary"
                >
                  {masterSaving ? 'Menyimpan...' : 'Simpan Lokasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 5: EDIT MASTER PERIODE                                        */}
      {/* =================================================================== */}
      {editingPeriod && (
        <div
          role="dialog"
          aria-modal="true"
          className="apple-modal-overlay"
          onClick={() => setEditingPeriod(null)}
        >
          <div className="apple-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head-bar">
              <h2 className="modal-head-title">Ubah Jadwal Shift ({editingPeriod.period_id})</h2>
              <button
                type="button"
                onClick={() => setEditingPeriod(null)}
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
            <form onSubmit={handleSaveEditPeriod}>
              <div className="modal-body-scroll">
                <div className="form-group-item">
                  <label className="form-label">Label Shift</label>
                  <input
                    type="text"
                    required
                    value={editPeriodLabel}
                    onChange={(e) => setEditPeriodLabel(e.target.value)}
                    className="apple-input-text"
                  />
                </div>

                <div className="form-group-item">
                  <label className="form-label">Urutan Tampilan</label>
                  <input
                    type="number"
                    required
                    value={editPeriodOrder}
                    onChange={(e) => setEditPeriodOrder(parseInt(e.target.value, 10) || 0)}
                    className="apple-input-text"
                    style={{ width: '120px' }}
                  />
                </div>
              </div>

              <div className="modal-foot-bar">
                <button
                  type="button"
                  onClick={() => setEditingPeriod(null)}
                  className="btn-action-secondary"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={masterSaving}
                  className="btn-action-primary"
                >
                  {masterSaving ? 'Menyimpan...' : 'Simpan Shift'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 6: DETAIL AUDIT LOG (JSON INSPECTOR)                          */}
      {/* =================================================================== */}
      {selectedLog && (
        <div
          role="dialog"
          aria-modal="true"
          className="apple-modal-overlay"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="apple-modal-box"
            style={{ maxWidth: '640px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-head-bar">
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ios-blue)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Inspeksi Jejak Audit
                </span>
                <h2 className="modal-head-title" style={{ marginTop: '2px' }}>
                  {selectedLog.action_category} • {selectedLog.target_reference}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
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

            <div className="modal-body-scroll">
              <div style={{ background: '#F8FAFC', borderRadius: '14px', padding: '14px 18px', border: '1px solid var(--ios-border)', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--ios-muted)', fontWeight: 600 }}>Waktu Server (WIB):</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--ios-ink)' }}>{selectedLog.server_timestamp}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--ios-muted)', fontWeight: 600 }}>Pelaku / Aktor:</span>
                  <span style={{ fontWeight: 700, color: 'var(--ios-ink)' }}>{selectedLog.actor_username} ({selectedLog.actor_role})</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--ios-muted)', fontWeight: 600 }}>Alasan / Catatan:</span>
                  <span style={{ color: 'var(--ios-ink)', fontWeight: 600 }}>{selectedLog.notes_or_reason || '–'}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ios-muted)', display: 'block', marginBottom: '6px' }}>
                    Nilai Sebelum (Before Value):
                  </span>
                  <div className="json-diff-container">
                    <pre style={{ margin: 0, maxHeight: '160px', overflowY: 'auto' }}>
                      <span className="json-tag-before">{JSON.stringify(selectedLog.before_value, null, 2)}</span>
                    </pre>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ios-blue)', display: 'block', marginBottom: '6px' }}>
                    Nilai Sesudah (After Value):
                  </span>
                  <div className="json-diff-container">
                    <pre style={{ margin: 0, maxHeight: '160px', overflowY: 'auto' }}>
                      <span className="json-tag-after">{JSON.stringify(selectedLog.after_value, null, 2)}</span>
                    </pre>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-foot-bar">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="btn-action-secondary"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 7: RESTORE DATABASE (DARI FILE BACKUP JSON) (FR-025)          */}
      {/* =================================================================== */}
      {showRestoreModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="apple-modal-overlay"
          onClick={() => {
            if (!restoreLoading) setShowRestoreModal(false);
          }}
        >
          <div
            className="apple-modal-box"
            style={{ maxWidth: '520px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-head-bar">
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ios-blue)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Pemulihan Database
                </span>
                <h2 className="modal-head-title" style={{ marginTop: '2px' }}>
                  Restore dari File Cadangan
                </h2>
              </div>
              <button
                type="button"
                disabled={restoreLoading}
                onClick={() => setShowRestoreModal(false)}
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

            <form onSubmit={handleRestoreSubmit}>
              <div className="modal-body-scroll" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '12px', padding: '12px 14px', fontSize: '12.5px', color: '#1E40AF', lineHeight: 1.5 }}>
                  Unggah berkas <code>.json</code> cadangan sistem yang sebelumnya Anda unduh. Seluruh data sheet dalam file cadangan akan disinkronisasikan kembali ke Google Sheets.
                </div>

                <div className="form-group-item">
                  <label className="form-label">Pilih Berkas Cadangan (.JSON)</label>
                  <input
                    type="file"
                    accept=".json,application/json"
                    required
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      setRestoreFile(f);
                      setRestoreError(null);
                    }}
                    className="apple-input-text"
                    style={{ padding: '8px 12px', fontSize: '13px' }}
                  />
                  {restoreFile && (
                    <span style={{ fontSize: '11.5px', color: 'var(--ios-muted)', marginTop: '4px', display: 'block' }}>
                      Ukuran: {(restoreFile.size / 1024).toFixed(1)} KB • Tipe: {restoreFile.name}
                    </span>
                  )}
                </div>

                {restoreError && (
                  <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: '10px', padding: '10px 12px', fontSize: '12px', color: '#991B1B', fontWeight: 600 }}>
                    {restoreError}
                  </div>
                )}
              </div>

              <div className="modal-foot-bar">
                <button
                  type="button"
                  disabled={restoreLoading}
                  onClick={() => setShowRestoreModal(false)}
                  className="btn-action-secondary"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={restoreLoading || !restoreFile}
                  className="btn-action-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  {restoreLoading ? 'Memulihkan...' : 'Mulai Pulihkan Database'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 8: PEMBERSIHAN DATA TESTING (RESET TRANSAKSI) (FR-026)        */}
      {/* =================================================================== */}
      {showCleanupModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="apple-modal-overlay"
          onClick={() => {
            if (!cleanupLoading) setShowCleanupModal(false);
          }}
        >
          <div
            className="apple-modal-box"
            style={{ maxWidth: '520px', border: '1.5px solid #FCA5A5' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-head-bar">
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Konfirmasi Pembersihan Data
                </span>
                <h2 className="modal-head-title" style={{ marginTop: '2px', color: '#B91C1C' }}>
                  Bersihkan Seluruh Transaksi Testing?
                </h2>
              </div>
              <button
                type="button"
                disabled={cleanupLoading}
                onClick={() => setShowCleanupModal(false)}
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

            <form onSubmit={handleCleanupSubmit}>
              <div className="modal-body-scroll" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px', padding: '14px', fontSize: '12.5px', color: '#991B1B', lineHeight: 1.5 }}>
                  <strong>Perhatian:</strong> Tindakan ini akan mengosongkan seluruh baris transaksi di <code>TRANSAKSI_SUHU</code>. Seluruh akun pengguna, master lokasi, jadwal, dan batas suhu <strong>tetap utuh dan aman</strong>.
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--ios-ink)', cursor: 'pointer', userSelect: 'none' }}>
                  <input
                    type="checkbox"
                    checked={cleanupClearPhotos}
                    onChange={(e) => setCleanupClearPhotos(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: '#DC2626' }}
                  />
                  <span>Bersihkan juga seluruh berkas foto bukti testing di Google Drive</span>
                </label>

                <div className="form-group-item">
                  <label className="form-label" style={{ color: '#7F1D1D' }}>
                    Ketik kata <strong>RESET</strong> untuk konfirmasi:
                  </label>
                  <input
                    type="text"
                    required
                    value={cleanupConfirmText}
                    onChange={(e) => {
                      setCleanupConfirmText(e.target.value);
                      setCleanupError(null);
                    }}
                    placeholder="Ketik RESET"
                    className="apple-input-text"
                    style={{ borderColor: '#FCA5A5', fontWeight: 700, letterSpacing: '1px' }}
                    autoFocus
                  />
                </div>

                {cleanupError && (
                  <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: '10px', padding: '10px 12px', fontSize: '12px', color: '#991B1B', fontWeight: 600 }}>
                    {cleanupError}
                  </div>
                )}
              </div>

              <div className="modal-foot-bar">
                <button
                  type="button"
                  disabled={cleanupLoading}
                  onClick={() => setShowCleanupModal(false)}
                  className="btn-action-secondary"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={cleanupLoading || cleanupConfirmText.trim() !== 'RESET'}
                  style={{
                    backgroundColor: '#DC2626',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '9px 20px',
                    borderRadius: '24px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: cleanupConfirmText.trim() === 'RESET' ? 'pointer' : 'not-allowed',
                    opacity: cleanupConfirmText.trim() === 'RESET' ? 1 : 0.6,
                    boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)'
                  }}
                >
                  {cleanupLoading ? 'Membersihkan...' : 'Ya, Bersihkan Data Testing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </AppShell>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center text-sm text-[#86868B]">
          Memuat pusat kendali administrator...
        </div>
      }
    >
      <AdminPageContent />
    </Suspense>
  );
}
