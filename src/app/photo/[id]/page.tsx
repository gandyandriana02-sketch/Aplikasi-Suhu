import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';

export const dynamic = 'force-dynamic';

interface Props {
  params: {
    id: string;
  };
}

export default async function PhotoViewerPage({ params }: Props) {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    redirect(`/login?redirect=/photo/${params.id}`);
  }

  const session = await verifySessionToken(token);
  if (!session) {
    redirect(`/login?redirect=/photo/${params.id}`);
  }

  const fileId = params.id;
  const driveUrl = `https://drive.google.com/file/d/${fileId}/view`;
  const imgUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1280`;

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '48px', backgroundColor: 'var(--surface)' }}>
      {/* Top Navbar */}
      <header
        style={{
          backgroundColor: 'var(--surface-raised)',
          borderBottom: '1px solid var(--line)',
          position: 'sticky',
          top: 0,
          zIndex: 50
        }}
      >
        <div
          style={{
            maxWidth: '860px',
            margin: '0 auto',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px'
          }}
        >
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--ink)', margin: 0, lineHeight: 1.2 }}>
              Peninjau Foto Bukti
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--ink-muted)', margin: '2px 0 0 0' }}>
              Warehouse Temperature Report
            </p>
          </div>
          <Link
            href="/"
            style={{
              minHeight: '44px',
              padding: '8px 16px',
              borderRadius: 'var(--radius-control)',
              border: '1px solid var(--line)',
              backgroundColor: 'var(--surface-raised)',
              color: 'var(--ink)',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>Kembali ke formulir</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '860px', margin: '0 auto', padding: '16px' }}>
        <div
          style={{
            backgroundColor: 'var(--surface-raised)',
            borderRadius: 'var(--radius-card)',
            border: '1px solid var(--line)',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              padding: '16px',
              borderBottom: '1px solid var(--line)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div>
              <div
                style={{
                  display: 'inline-block',
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-badge)',
                  backgroundColor: 'var(--ok-tint)',
                  color: 'var(--ok)',
                  fontSize: '12px',
                  fontWeight: 600,
                  marginBottom: '6px'
                }}
              >
                Bukti foto fisik termometer
              </div>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--ink)', margin: '0 0 4px 0' }}>
                Dokumentasi pemeriksaan suhu
              </h2>
              <p className="num" style={{ fontSize: '12px', color: 'var(--ink-muted)', margin: 0 }}>
                Google Drive File ID: {fileId}
              </p>
            </div>
            <div>
              <a
                href={driveUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  minHeight: '44px',
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-control)',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--primary)',
                  border: '1px solid var(--line)',
                  fontSize: '13px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>Buka di Google Drive</span>
              </a>
            </div>
          </div>

          {/* Photo Display */}
          <div
            style={{
              padding: '24px 16px',
              backgroundColor: 'rgba(27, 38, 44, 0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '360px'
            }}
          >
            <div
              style={{
                borderRadius: 'var(--radius-card)',
                overflow: 'hidden',
                border: '1px solid var(--line)',
                backgroundColor: '#000000',
                maxWidth: '100%'
              }}
            >
              <img
                src={imgUrl}
                alt={`Bukti foto termometer file ID ${fileId}`}
                style={{
                  maxHeight: '70vh',
                  maxWidth: '100%',
                  objectFit: 'contain',
                  display: 'block',
                  margin: '0 auto'
                }}
                loading="lazy"
              />
            </div>
          </div>

          {/* Footer note */}
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: 'var(--surface)',
              borderTop: '1px solid var(--line)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '13px',
              color: 'var(--ink-muted)',
              flexWrap: 'wrap',
              gap: '8px'
            }}
          >
            <span>
              Diakses oleh: <strong style={{ color: 'var(--ink)' }}>{session.full_name}</strong> ({session.role})
            </span>
            <span>Tersimpan di Google Drive</span>
          </div>
        </div>
      </main>
    </div>
  );
}
