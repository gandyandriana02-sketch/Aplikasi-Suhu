import React from 'react';

export interface AppIconProps {
  name?: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const APP_ICON_OPTIONS = [
  { id: 'thermometer', label: 'Thermometer', category: 'Cold Chain', desc: 'Indikator suhu presisi' },
  { id: 'snowflake', label: 'Snowflake', category: 'Chiller / Freezer', desc: 'Suhu beku & dingin' },
  { id: 'warehouse', label: 'Depot Warehouse', category: 'Fasilitas', desc: 'Gedung logistik modern' },
  { id: 'shield', label: 'QA Compliance', category: 'Standar Mutu', desc: 'Verifikasi & akreditasi' },
  { id: 'gauge', label: 'Precision Gauge', category: 'Monitoring', desc: 'Pemantauan real-time' },
  { id: 'box', label: 'Cold Storage Box', category: 'Supply Chain', desc: 'Penyimpanan & kargo' },
  { id: 'pulse', label: 'Sensor Stream', category: 'Aktivitas', desc: 'Frekuensi pengukuran' },
  { id: 'frost-shield', label: 'Cold Chain Guard', category: 'Proteksi', desc: 'Perlindungan integritas' }
];

export function AppIcon({
  name = 'thermometer',
  size = 20,
  color = 'currentColor',
  strokeWidth = 2,
  className,
  style
}: AppIconProps) {
  // Normalize legacy emojis to professional Apple SF Symbols
  let iconId = name?.toLowerCase().trim() || 'thermometer';
  if (iconId === '❄️' || iconId === '🧊') iconId = 'snowflake';
  else if (iconId === '🌡️') iconId = 'thermometer';
  else if (iconId === '🏢' || iconId === '🏭') iconId = 'warehouse';
  else if (iconId === '🛡️') iconId = 'shield';
  else if (iconId === '📊') iconId = 'gauge';
  else if (iconId === '📦') iconId = 'box';

  switch (iconId) {
    case 'snowflake':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          style={style}
          aria-hidden="true"
        >
          <line x1="12" y1="2" x2="12" y2="22" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
          <line x1="19.07" y1="4.93" x2="4.93" y2="19.07" />
          <polyline points="10 4 12 2 14 4" />
          <polyline points="10 20 12 22 14 20" />
          <polyline points="4 10 2 12 4 14" />
          <polyline points="20 10 22 12 20 14" />
        </svg>
      );

    case 'warehouse':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          style={style}
          aria-hidden="true"
        >
          <path d="M3 21V9l9-6 9 6v12H3Z" />
          <path d="M9 21v-6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v6" />
          <line x1="3" y1="13" x2="21" y2="13" />
        </svg>
      );

    case 'shield':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          style={style}
          aria-hidden="true"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );

    case 'gauge':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          style={style}
          aria-hidden="true"
        >
          <path d="m12 14 3-3" />
          <path d="M3.34 19a10 10 0 1 1 17.32 0" />
          <circle cx="12" cy="14" r="1.5" fill={color} />
        </svg>
      );

    case 'box':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          style={style}
          aria-hidden="true"
        >
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      );

    case 'pulse':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          style={style}
          aria-hidden="true"
        >
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      );

    case 'frost-shield':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          style={style}
          aria-hidden="true"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
          <line x1="9.5" y1="9.5" x2="14.5" y2="14.5" />
          <line x1="14.5" y1="9.5" x2="9.5" y2="14.5" />
        </svg>
      );

    case 'thermometer':
    default:
      // If it's not a known icon and length is small, might be custom monogram
      if (name && name.length <= 3 && !['thermometer', '❄️', '🌡️'].includes(name)) {
        return (
          <span
            style={{
              fontSize: `${Math.round(size * 0.65)}px`,
              fontWeight: 800,
              letterSpacing: '-0.5px',
              color,
              lineHeight: 1,
              userSelect: 'none',
              ...style
            }}
            className={className}
          >
            {name.toUpperCase()}
          </span>
        );
      }
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          style={style}
          aria-hidden="true"
        >
          <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" />
          <path d="M12 9v4" />
          <circle cx="12" cy="17" r="1.5" fill={color} />
        </svg>
      );
  }
}
