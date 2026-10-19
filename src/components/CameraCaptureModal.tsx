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

  // Reference for Android System Camera Chooser (tanpa capture kaku agar Android menampilkan dialog pilihan aplikasi kamera)
  const fileInputChooserRef = useRef<HTMLInputElement | null>(null);

  // Reference for Direct Rear Camera (pemicu langsung kamera belakang perangkat)
  const fileInputDirectRearRef = useRef<HTMLInputElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string>('');
  const [capturedPreview, setCapturedPreview] = useState<CapturedPhotoData | null>(null);
  const [gpsStatus, setGpsStatus] = useState<string>('Mencari GPS...');
  const [gpsCoords, setGpsCoords] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  // Start in-browser camera stream (WebRTC)
  async function startCamera(mode: 'environment' | 'user') {
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      setCameraError('');

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('In-browser camera access info:', err?.message || err);
      setCameraError(
        'Kamera langsung di browser memerlukan izin atau perangkat ini mendukung pemilihan aplikasi kamera Android di bawah ini.'
      );
    }
  }

  // Request camera and GPS on mount (FR-008, BR-05, BR-06)
  useEffect(() => {
    startCamera(facingMode);

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
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  function handleToggleCamera() {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  }

  // Process Image: Draw to Canvas, Stamp Honest Watermark, & Compress (NFR-01, FR-008, BR-05, BR-06)
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

  // Snap from in-browser live viewfinder
  function handleSnap() {
    if (!videoRef.current) return;
    setIsProcessing(true);
    setTimeout(() => {
      if (videoRef.current) {
        processImageToCanvas(
          videoRef.current,
          videoRef.current.videoWidth || 1280,
          videoRef.current.videoHeight || 720
        );
      }
      setIsProcessing(false);
    }, 50);
  }

  // Handle photo returned from native camera input (Android chooser or direct camera)
  function handleNativeFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('File yang dipilih bukan gambar yang valid. Silakan gunakan kamera untuk mengambil foto.');
      e.target.value = '';
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        processImageToCanvas(img, img.naturalWidth, img.naturalHeight);
        setIsProcessing(false);
      };
      img.onerror = () => {
        setIsProcessing(false);
        alert('Gagal memuat hasil foto. Silakan coba kembali.');
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      setIsProcessing(false);
      alert('Gagal membaca data foto dari perangkat.');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  function handleRetake() {
    setCapturedPreview(null);
    if (!stream && !cameraError) {
      startCamera(facingMode);
    }
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
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", sans-serif'
      }}
    >
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Input 1: Android System Intent Chooser (tanpa capture kaku agar Android menampilkan dialog pilihan aplikasi kamera) */}
      <input
        ref={fileInputChooserRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleNativeFileInput}
      />

      {/* Input 2: Direct Rear Camera pemicu cepat */}
      <input
        ref={fileInputDirectRearRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleNativeFileInput}
      />

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
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)'
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
        {isProcessing ? (
          <div
            style={{
              position: 'absolute',
              zIndex: 50,
              backgroundColor: 'rgba(0, 0, 0, 0.82)',
              backdropFilter: 'blur(16px)',
              padding: '24px 32px',
              borderRadius: '20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              color: '#FFFFFF'
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                border: '3px solid rgba(255,255,255,0.2)',
                borderTopColor: '#0071E3',
                borderRadius: '50%',
                animation: 'spin 0.7s linear infinite'
              }}
            />
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Membubuhkan Watermark & Mengompresi...</span>
          </div>
        ) : null}

        {cameraError ? (
          <div
            style={{
              padding: '28px 24px',
              backgroundColor: '#FFFFFF',
              borderRadius: '24px',
              margin: '20px',
              maxWidth: '380px',
              textAlign: 'center',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              zIndex: 10
            }}
          >
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                backgroundColor: '#EFF6FF',
                color: '#0071E3',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px auto'
              }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#1D1D1F', margin: '0 0 6px 0' }}>
              Pilih Kamera Perangkat
            </h3>
            <p style={{ color: '#64748B', fontSize: '13px', lineHeight: 1.5, margin: '0 0 20px 0' }}>
              Pilih aplikasi kamera yang terpasang di HP Anda untuk mengambil foto bukti termometer:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Opsi 1: Android System Chooser */}
              <button
                type="button"
                onClick={() => fileInputChooserRef.current?.click()}
                style={{
                  backgroundColor: '#0071E3',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '14px',
                  height: '46px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(0, 113, 227, 0.3)'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                  <line x1="8" y1="21" x2="16" y2="21"/>
                  <line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
                <span>Pilih Aplikasi Kamera HP ↗</span>
              </button>

              {/* Opsi 2: Kamera Belakang Langsung */}
              <button
                type="button"
                onClick={() => fileInputDirectRearRef.current?.click()}
                style={{
                  backgroundColor: '#F8FAFC',
                  color: '#1D1D1F',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: '14px',
                  height: '44px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <span>Kamera Belakang Cepat</span>
              </button>

              <button
                type="button"
                onClick={() => startCamera(facingMode)}
                style={{
                  backgroundColor: 'transparent',
                  color: '#0071E3',
                  border: 'none',
                  height: '36px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginTop: '4px'
                }}
              >
                Coba Nyalakan Kamera Web Kembali
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
            {/* File size & watermark badge */}
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
                borderRadius: '16px',
                border: '1px solid rgba(52, 211, 153, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>✓ Watermark Siap</span>
              <span>•</span>
              <span>{capturedPreview.sizeKb} KB</span>
            </div>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        )}
      </div>

      {/* Bottom Action HUD Bar */}
      <div
        style={{
          padding: '24px 20px 32px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%)',
          zIndex: 20
        }}
      >
        {capturedPreview ? (
          <div style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '340px' }}>
            <button
              onClick={handleRetake}
              type="button"
              style={{
                flex: 1,
                minHeight: '50px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: '#FFFFFF',
                borderRadius: '25px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              ↺ Ulangi Foto
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
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', width: '100%', maxWidth: '340px' }}>
            {/* Quick Mode Pill: Chooser Trigger */}
            <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
              <button
                type="button"
                onClick={() => fileInputChooserRef.current?.click()}
                style={{
                  flex: 1,
                  height: '38px',
                  backgroundColor: 'rgba(255, 255, 255, 0.18)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  borderRadius: '19px',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                  <line x1="8" y1="21" x2="16" y2="21"/>
                  <line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
                <span>Pilih Aplikasi Kamera HP</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputDirectRearRef.current?.click()}
                title="Buka Kamera Belakang Langsung"
                style={{
                  height: '38px',
                  padding: '0 12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.18)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  borderRadius: '19px',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>Kamera Belakang</span>
              </button>
            </div>

            {/* Shutter Bar with Center Shutter and Flip Camera */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', position: 'relative' }}>
              {/* Native App Chooser Trigger Icon */}
              <button
                onClick={() => fileInputChooserRef.current?.click()}
                type="button"
                title="Pilih Aplikasi Kamera Sistem"
                aria-label="Pilih Aplikasi Kamera Sistem"
                style={{
                  position: 'absolute',
                  left: 0,
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform 0.1s ease'
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                  <circle cx="12" cy="13" r="3"/>
                </svg>
              </button>

              {/* Apple Dual-Circle Shutter Button (76px) */}
              <button
                onClick={handleSnap}
                type="button"
                aria-label="Jepret foto langsung"
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

              {/* Flip / Switch Camera Button (Kamera Depan / Belakang Web) */}
              <button
                onClick={handleToggleCamera}
                type="button"
                title={facingMode === 'environment' ? 'Ganti ke Kamera Depan' : 'Ganti ke Kamera Belakang'}
                aria-label="Ganti Kamera"
                style={{
                  position: 'absolute',
                  right: 0,
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform 0.1s ease'
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                </svg>
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
