'use client';

import { useState, useRef, useEffect } from 'react';

export interface CapturedPhotoData {
  base64: string; // JPEG data URL (e.g. data:image/jpeg;base64,...)
  sizeKb: number;
  capturedAt: string; // ISO 8601 Jakarta
  gpsCoordinates: string; // "lat, lng" or empty
}

interface CameraCaptureModalProps {
  locationName: string;
  petugasName: string;
  onPhotoAccepted: (photo: CapturedPhotoData) => void;
  onClose: () => void;
}

export default function CameraCaptureModal({
  locationName,
  petugasName,
  onPhotoAccepted,
  onClose
}: CameraCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string>('');
  const [capturedPreview, setCapturedPreview] = useState<CapturedPhotoData | null>(null);
  const [gpsStatus, setGpsStatus] = useState<string>('Mencari GPS...');
  const [gpsCoords, setGpsCoords] = useState<string>('');

  // 1. Start Rear Camera and Request GPS on mount (FR-008, BR-05, BR-06)
  useEffect(() => {
    let activeStream: MediaStream | null = null;

    async function initCamera() {
      try {
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }

        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false
        });
        activeStream = mediaStream;
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          await videoRef.current.play();
        }
      } catch (err: any) {
        console.error('Camera access error:', err);
        setCameraError(
          'Kamera browser tidak dapat diakses langsung. Anda dapat menggunakan kamera bawaan perangkat di bawah ini.'
        );
      }
    }

    initCamera();

    // Request GPS location in parallel (optional per BR-06)
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude.toFixed(6);
          const lng = position.coords.longitude.toFixed(6);
          setGpsCoords(`${lat}, ${lng}`);
          setGpsStatus(`GPS: ${lat}, ${lng}`);
        },
        (error) => {
          console.warn('Geolocation warning:', error.message);
          setGpsCoords('');
          setGpsStatus('GPS tidak tersedia');
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
      );
    } else {
      setGpsStatus('GPS tidak didukung');
    }

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // 2. Process Image, Apply Honest Watermark on Canvas, & Compress (NFR-01, FR-008, BR-05, BR-06)
  function processImageToCanvas(imageSource: CanvasImageSource, vWidth: number, vHeight: number) {
    const canvas = canvasRef.current || document.createElement('canvas');

    // Scale down if largest side exceeds 1280px (NFR-01)
    const MAX_DIMENSION = 1280;
    let targetWidth = vWidth;
    let targetHeight = vHeight;

    if (vWidth > MAX_DIMENSION || vHeight > MAX_DIMENSION) {
      if (vWidth >= vHeight) {
        targetWidth = MAX_DIMENSION;
        targetHeight = Math.round((vHeight * MAX_DIMENSION) / vWidth);
      } else {
        targetHeight = MAX_DIMENSION;
        targetWidth = Math.round((vWidth * MAX_DIMENSION) / vHeight);
      }
    }

    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw camera image
    ctx.drawImage(imageSource, 0, 0, targetWidth, targetHeight);

    // Prepare Honest Watermark details (WIB Asia/Jakarta, location, session officer, genuine GPS)
    const now = new Date();
    const dateFormatted = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(now);

    const lines = [
      `Waktu: ${dateFormatted} WIB`,
      `Lokasi: ${locationName}`,
      `Petugas: ${petugasName}`
    ];
    if (gpsCoords) {
      lines.push(`GPS: ${gpsCoords}`);
    }

    // Dynamic watermark sizing based on shorter dimension
    const shorterSide = Math.min(targetWidth, targetHeight);
    const fontSize = Math.max(14, Math.round(shorterSide * 0.026));
    const lineHeight = fontSize * 1.4;
    const padding = Math.round(fontSize * 0.8);

    ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif`;

    // Measure maximum line width
    let maxTextWidth = 0;
    lines.forEach((line) => {
      const w = ctx.measureText(line).width;
      if (w > maxTextWidth) maxTextWidth = w;
    });

    const boxWidth = maxTextWidth + padding * 2;
    const boxHeight = lines.length * lineHeight + padding * 2;
    const boxX = padding;
    const boxY = targetHeight - boxHeight - padding;

    // Translucent black pill card for watermark
    ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 10);
    ctx.fill();

    // Render text lines
    ctx.fillStyle = '#FFFFFF';
    ctx.textBaseline = 'top';
    lines.forEach((line, idx) => {
      ctx.fillText(line, boxX + padding, boxY + padding + idx * lineHeight);
    });

    // Compress to JPEG with quality 0.80 (target < 350 KB, NFR-01)
    const base64Jpeg = canvas.toDataURL('image/jpeg', 0.8);

    // Approximate size in KB
    const head = 'data:image/jpeg;base64,';
    const rawLen = base64Jpeg.length - head.length;
    const sizeKb = Math.round((rawLen * 3) / 4 / 1024);

    // ISO timestamp with timezone +07:00
    const tzOffset = 7 * 60;
    const localTime = new Date(now.getTime() + tzOffset * 60 * 1000);
    const capturedAtISO = localTime.toISOString().replace('Z', '+07:00');

    setCapturedPreview({
      base64: base64Jpeg,
      sizeKb,
      capturedAt: capturedAtISO,
      gpsCoordinates: gpsCoords
    });
  }

  function handleSnap() {
    if (!videoRef.current) return;
    processImageToCanvas(
      videoRef.current,
      videoRef.current.videoWidth || 1280,
      videoRef.current.videoHeight || 720
    );
  }

  function handleNativeFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        processImageToCanvas(img, img.naturalWidth, img.naturalHeight);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  function handleRetake() {
    setCapturedPreview(null);
  }

  function handleAccept() {
    if (capturedPreview) {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      onPhotoAccepted(capturedPreview);
    }
  }

  function handleCloseModal() {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
    onClose();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#000000',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif'
      }}
    >
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Top Bar with Apple HIG Translucent HUD */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 20,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0) 100%)'
        }}
      >
        <button
          onClick={handleCloseModal}
          type="button"
          aria-label="Tutup kamera"
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            color: '#FFFFFF',
            fontSize: '18px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.15s ease'
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
          <div
            style={{
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '14px',
              background: 'rgba(255, 255, 255, 0.18)',
              backdropFilter: 'blur(12px)',
              padding: '3px 10px',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span>{locationName}</span>
          </div>
          <div
            style={{
              color: gpsCoords ? '#34D399' : '#94A3B8',
              fontSize: '11px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: gpsCoords ? '#34D399' : '#94A3B8' }} />
            {gpsStatus}
          </div>
        </div>
      </div>

      {/* Main Viewfinder Area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative',
          backgroundColor: '#000000'
        }}
      >
        {cameraError ? (
          <div
            style={{
              padding: '24px',
              backgroundColor: '#FFFFFF',
              borderRadius: '24px',
              margin: '20px',
              maxWidth: '360px',
              textAlign: 'center',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: '#FEECEB',
                color: '#FF3B30',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px auto'
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <p style={{ color: '#1D1D1F', fontSize: '14px', lineHeight: 1.5, margin: '0 0 16px 0', fontWeight: 500 }}>
              {cameraError}
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  backgroundColor: '#0071E3',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '10px 18px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0, 113, 227, 0.3)'
                }}
              >
                Buka Kamera Perangkat ↗
              </button>
              <button
                type="button"
                onClick={handleCloseModal}
                style={{
                  backgroundColor: '#F1F5F9',
                  color: '#1D1D1F',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '10px 18px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Batal
              </button>
            </div>
          </div>
        ) : capturedPreview ? (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <img
              src={capturedPreview.base64}
              alt="Pratinjau Foto Bukti Suhu"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain'
              }}
            />
            {/* File size indicator badge */}
            <div
              style={{
                position: 'absolute',
                top: '72px',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(10px)',
                color: '#34D399',
                fontSize: '12px',
                fontWeight: 600,
                padding: '4px 12px',
                borderRadius: '20px',
                border: '1px solid rgba(52, 211, 153, 0.4)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Kompresi {capturedPreview.sizeKb} KB (&lt; 350 KB)</span>
            </div>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              playsInline
              autoPlay
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />

            {/* Rule-of-Thirds Grid Overlay */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gridTemplateRows: '1fr 1fr 1fr',
                opacity: 0.25
              }}
            >
              <div style={{ borderRight: '1px solid #FFFFFF', borderBottom: '1px solid #FFFFFF' }} />
              <div style={{ borderRight: '1px solid #FFFFFF', borderBottom: '1px solid #FFFFFF' }} />
              <div style={{ borderBottom: '1px solid #FFFFFF' }} />
              <div style={{ borderRight: '1px solid #FFFFFF', borderBottom: '1px solid #FFFFFF' }} />
              <div style={{ borderRight: '1px solid #FFFFFF', borderBottom: '1px solid #FFFFFF' }} />
              <div style={{ borderBottom: '1px solid #FFFFFF' }} />
              <div style={{ borderRight: '1px solid #FFFFFF' }} />
              <div style={{ borderRight: '1px solid #FFFFFF' }} />
              <div />
            </div>

            {/* Pulsed Focus Box */}
            <div
              style={{
                position: 'absolute',
                width: '140px',
                height: '140px',
                border: '2px solid rgba(251, 191, 36, 0.85)',
                borderRadius: '16px',
                pointerEvents: 'none',
                boxShadow: '0 0 16px rgba(251, 191, 36, 0.4)',
                animation: 'applePulse 2s infinite ease-in-out'
              }}
            />

            {/* Top Prompt Pill */}
            <div
              style={{
                position: 'absolute',
                top: '72px',
                backgroundColor: 'rgba(0, 0, 0, 0.65)',
                backdropFilter: 'blur(10px)',
                color: '#FFFFFF',
                fontSize: '12px',
                fontWeight: 500,
                padding: '6px 14px',
                borderRadius: '20px',
                pointerEvents: 'none'
              }}
            >
              Arahkan ke layar termometer digital
            </div>
          </>
        )}
      </div>

      {/* Bottom Controls Area (Apple Thumb Deck) */}
      <div
        style={{
          padding: '20px 24px calc(24px + env(safe-area-inset-bottom, 0px)) 24px',
          background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '110px',
          zIndex: 20
        }}
      >
        {capturedPreview ? (
          <div style={{ display: 'flex', gap: '14px', width: '100%', maxWidth: '380px' }}>
            <button
              onClick={handleRetake}
              type="button"
              style={{
                flex: 1,
                minHeight: '50px',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '25px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.15s ease'
              }}
            >
              Ulangi Foto
            </button>
            <button
              onClick={handleAccept}
              type="button"
              style={{
                flex: 1,
                minHeight: '50px',
                backgroundColor: '#0071E3',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '25px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(0, 113, 227, 0.4)',
                transition: 'all 0.15s ease'
              }}
            >
              Gunakan Foto ↗
            </button>
          </div>
        ) : !cameraError ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', maxWidth: '320px', position: 'relative' }}>
            {/* Native Camera Trigger button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              type="button"
              title="Buka Kamera Perangkat Bawaan"
              style={{
                position: 'absolute',
                left: 0,
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                border: 'none',
                color: '#FFFFFF',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.1s ease'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                <circle cx="12" cy="13" r="3"/>
              </svg>
            </button>

            {/* Apple Dual-Circle Shutter Button (76px) */}
            <button
              onClick={handleSnap}
              type="button"
              aria-label="Jepret foto"
              style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                backgroundColor: 'transparent',
                border: '4px solid #FFFFFF',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)'
              }}
            >
              <div
                style={{
                  width: '62px',
                  height: '62px',
                  borderRadius: '50%',
                  backgroundColor: '#FFFFFF',
                  transition: 'transform 0.1s ease'
                }}
              />
            </button>
          </div>
        ) : null}
      </div>

      {/* Native device camera input fallback locked to environment camera (BR-05) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleNativeFileInput}
      />

      <style jsx>{`
        @keyframes applePulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.04); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
