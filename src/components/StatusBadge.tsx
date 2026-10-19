import React from 'react';

export type BadgeStatusType = 'BELUM_DIISI' | 'NORMAL' | 'MELEBIHI_BATAS' | 'GAGAL_SIMPAN';

interface StatusBadgeProps {
  status: BadgeStatusType;
  className?: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  let label = 'Belum diisi';
  let bg = 'var(--empty-tint)';
  let color = 'var(--ink-muted)';
  let border = '1px solid var(--line)';

  let icon = (
    <svg width={size === 'sm' ? 12 : 14} height={size === 'sm' ? 12 : 14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="8" cy="8" r="6" />
    </svg>
  );

  if (status === 'NORMAL') {
    label = 'Normal';
    bg = 'var(--ok-tint)';
    color = 'var(--ok)';
    border = '1px solid var(--ok)';
    icon = (
      <svg width={size === 'sm' ? 12 : 14} height={size === 'sm' ? 12 : 14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="3 8.5 6.5 12 13 4" />
      </svg>
    );
  } else if (status === 'MELEBIHI_BATAS') {
    label = 'Melebihi batas';
    bg = 'var(--over-tint)';
    color = 'var(--over)';
    border = '1px solid var(--over)';
    icon = (
      <svg width={size === 'sm' ? 12 : 14} height={size === 'sm' ? 12 : 14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M8 2L1 14h14L8 2z" />
        <line x1="8" y1="6.5" x2="8" y2="10" />
        <circle cx="8" cy="12" r="0.75" fill="currentColor" />
      </svg>
    );
  } else if (status === 'GAGAL_SIMPAN') {
    label = 'Gagal simpan';
    bg = 'var(--fail-tint)';
    color = 'var(--fail)';
    border = '1px solid var(--fail)';
    icon = (
      <svg width={size === 'sm' ? 12 : 14} height={size === 'sm' ? 12 : 14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="8" cy="8" r="6" />
        <line x1="8" y1="5" x2="8" y2="9" />
        <circle cx="8" cy="11.5" r="0.75" fill="currentColor" />
      </svg>
    );
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: size === 'sm' ? '4px' : '6px',
        backgroundColor: bg,
        color: color,
        border: border,
        borderRadius: 'var(--radius-badge)',
        padding: size === 'sm' ? '3px 8px' : '4px 10px',
        fontSize: size === 'sm' ? '12px' : '13px',
        fontWeight: 600,
        lineHeight: 1.2,
        whiteSpace: 'nowrap'
      }}
    >
      {icon}
      <span>{label}</span>
    </span>
  );
}
