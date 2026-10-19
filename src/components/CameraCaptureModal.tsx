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
  const [gpsAddress, setGpsAddress] = useState<string>('');
  const gpsCoordsRef = useRef<string>('');
  const gpsAddressRef = useRef<string>('');
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
        async (position) => {
          const lat = position.coords.latitude.toFixed(6);
          const lng = position.coords.longitude.toFixed(6);
          const coordsStr = `${lat}, ${lng}`;
          setGpsCoords(coordsStr);
          gpsCoordsRef.current = coordsStr;
          setGpsStatus(`GPS: ${coordsStr}`);

          // Fetch reverse geocoded address via internal API route (supports Google Maps Geocoding & OpenStreetMap)
          try {
            const res = await fetch(`/api/reverse-geocode?lat=${lat}&lng=${lng}`);
            if (res.ok) {
              const data = await res.json();
              if (data.success && data.address) {
                setGpsAddress(data.address);
                gpsAddressRef.current = data.address;
              }
            }
          } catch {
            // Ignore if offline
          }
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

  function drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
    stroke = false
  ) {
    if (typeof ctx.roundRect === 'function') {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
      ctx.fill();
      if (stroke) ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
      ctx.fill();
      if (stroke) ctx.stroke();
    }
  }

  function wrapCanvasText(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number
  ): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = ctx.measureText(testLine).width;
      if (testWidth > maxWidth && i > 0) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
    return lines;
  }

  // Process Image: Draw to Canvas, Stamp Authentic Timemark / GPS Camera Watermark, & Compress (NFR-01, FR-008, BR-05, BR-06)
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

    // 1. Draw base photo
    ctx.drawImage(imageSource, 0, 0, targetWidth, targetHeight);

    // 2. Fetch authoritative time (Asia/Jakarta, WIB) per NFR-03 & PRD BR-05
    const now = new Date();

    const timeFormatted = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
      .format(now)
      .replace('.', ':');

    const dateFormatted = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(now);

    const dayFormatted = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      weekday: 'long'
    }).format(now);

    // 3. Resolve active GPS coordinates and geocoded address
    const activeCoords = gpsCoordsRef.current || gpsCoords;
    const activeAddress = gpsAddressRef.current || gpsAddress;

    let formattedCoords = 'GPS Tidak Tersedia';
    if (activeCoords) {
      const parts = activeCoords.split(',').map((s) => s.trim());
      if (parts.length === 2) {
        const latNum = parseFloat(parts[0]);
        const lngNum = parseFloat(parts[1]);
        if (!isNaN(latNum) && !isNaN(lngNum)) {
          const latDir = latNum < 0 ? '°S' : '°N';
          const lngDir = lngNum < 0 ? '°W' : '°E';
          formattedCoords = `${Math.abs(latNum).toFixed(6)}${latDir}, ${Math.abs(lngNum).toFixed(6)}${lngDir}`;
        } else {
          formattedCoords = activeCoords;
        }
      } else {
        formattedCoords = activeCoords;
      }
    }
    const pillText = `Koordinat: ${formattedCoords}`;

    // 4. Calculate layout metrics matching Timemark Card Badge aesthetic (FR-008, BR-05, BR-06, NFR-01, NFR-03)
    // Scale factor based on shorter image dimension so watermark is always crisp and proportionally large on mobile screens
    const refDim = Math.min(targetWidth, targetHeight);
    const scale = Math.max(1.0, Math.min(2.1, refDim / 520));

    const cardMargin = Math.round(18 * scale);
    const cardPadX = Math.round(20 * scale);
    const cardPadY = Math.round(18 * scale);
    const cardRadius = Math.round(16 * scale);
    const sectionGap = Math.round(10 * scale);

    const clockFontSize = Math.round(52 * scale);
    const tzFontSize = Math.round(17 * scale);
    const dateFontSize = Math.round(19 * scale);
    const dayFontSize = Math.round(15 * scale);
    const badgeFontSize = Math.round(13 * scale);
    const mainTextFontSize = Math.round(17 * scale);
    const addressFontSize = Math.round(16 * scale);
    const addressLineHeight = Math.round(22 * scale);
    const gpsFontSize = Math.round(15 * scale);

    const clockFont = `800 ${clockFontSize}px "Roboto Condensed", "Arial Narrow", -apple-system, BlinkMacSystemFont, sans-serif`;
    const tzFont = `700 ${tzFontSize}px -apple-system, BlinkMacSystemFont, sans-serif`;
    const dateFont = `700 ${dateFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    const dayFont = `500 ${dayFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    const badgeFont = `700 ${badgeFontSize}px -apple-system, BlinkMacSystemFont, sans-serif`;
    const mainTextFont = `700 ${mainTextFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    const addressFont = `500 ${addressFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    const gpsFont = `600 ${gpsFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace`;

    // Maximum card width (fills nicely on portrait, capped cleanly on wide landscape)
    const cardW = Math.min(targetWidth - cardMargin * 2, Math.round(840 * scale));
    const cardX = cardMargin;
    const contentW = cardW - cardPadX * 2;

    // Wrap address lines
    const fullAddress = activeAddress || 'Warehouse Temperature Report • Titik Pantau Gudang Terverifikasi';
    const alamatBadgeText = '🏠 ALAMAT';
    ctx.font = badgeFont;
    const alamatBadgeW = ctx.measureText(alamatBadgeText).width + Math.round(16 * scale);
    const alamatBadgeH = Math.round(22 * scale);

    ctx.font = addressFont;
    const addressLines = wrapCanvasText(ctx, fullAddress, contentW - alamatBadgeW - Math.round(12 * scale));

    // Calculate Titik & Petugas badge sizes
    const titikFullText = `📍 TITIK: ${locationName}`;
    const petugasFullText = `👤 PETUGAS: ${petugasName}`;
    ctx.font = mainTextFont;
    const titikW = ctx.measureText(titikFullText).width + Math.round(22 * scale);
    const petugasW = ctx.measureText(petugasFullText).width + Math.round(22 * scale);
    const canFitRow2SideBySide = (titikW + petugasW + Math.round(12 * scale)) <= contentW;
    const row2H = canFitRow2SideBySide ? Math.round(28 * scale) : Math.round(28 * scale) * 2 + Math.round(6 * scale);

    // Dynamic row heights
    const row1H = clockFontSize;
    const dividerGap = Math.round(8 * scale);
    const row3H = Math.max(alamatBadgeH, addressLines.length * addressLineHeight);
    const row4H = Math.round(32 * scale);

    // Total Card Height
    const totalCardH =
      cardPadY * 2 +
      row1H +
      dividerGap +
      Math.round(8 * scale) +
      row2H +
      sectionGap +
      row3H +
      sectionGap +
      row4H;

    const cardY = targetHeight - cardMargin - totalCardH;

    // 5. Draw smooth cinematic dark vignette at the bottom of the photo
    const vignetteHeight = Math.min(
      targetHeight,
      Math.round(totalCardH + cardMargin * 2 + 50 * scale)
    );
    const vignette = ctx.createLinearGradient(0, targetHeight - vignetteHeight, 0, targetHeight);
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(0.35, 'rgba(0, 0, 0, 0.45)');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.85)');

    ctx.save();
    ctx.fillStyle = vignette;
    ctx.fillRect(0, targetHeight - vignetteHeight, targetWidth, vignetteHeight);
    ctx.restore();

    // 6. Draw Timemark Dark Frosted Card Container (High Contrast & Clear Border)
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
    ctx.shadowBlur = Math.round(14 * scale);
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = Math.round(4 * scale);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)'; // Deep solid dark slate (92% opacity)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = Math.max(1.5, Math.round(1.8 * scale));
    drawRoundedRect(ctx, cardX, cardY, cardW, totalCardH, cardRadius, true);
    ctx.restore();

    // 7. Render Card Content (Urutan: Jam/Tanggal → Titik & Petugas → Alamat → Koordinat GPS)
    let currentY = cardY + cardPadY;

    // --- ROW 1: Jam & Tanggal ---
    ctx.save();
    ctx.textBaseline = 'top';

    // Clock
    ctx.font = clockFont;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(timeFormatted, cardX + cardPadX, currentY);
    const clockW = ctx.measureText(timeFormatted).width;

    // WIB Badge
    ctx.font = tzFont;
    ctx.fillStyle = '#38BDF8';
    ctx.fillText('WIB', cardX + cardPadX + clockW + Math.round(8 * scale), currentY + Math.round(4 * scale));

    // Date & Day to the right of clock
    const dateX = cardX + cardPadX + clockW + Math.round(56 * scale);
    ctx.font = dateFont;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(dateFormatted, dateX, currentY + Math.round(2 * scale));

    ctx.font = dayFont;
    ctx.fillStyle = '#94A3B8';
    ctx.fillText(
      dayFormatted,
      dateX,
      currentY + Math.round(2 * scale) + dateFontSize + Math.round(4 * scale)
    );
    ctx.restore();

    currentY += row1H + dividerGap;

    // Divider Line
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cardX + cardPadX, currentY);
    ctx.lineTo(cardX + cardW - cardPadX, currentY);
    ctx.stroke();
    ctx.restore();

    currentY += Math.round(10 * scale);

    // --- ROW 2: Titik Pantau & Petugas ---
    ctx.save();
    ctx.textBaseline = 'middle';
    const badgeH = Math.round(28 * scale);
    const badgeRadius = Math.round(6 * scale);

    if (canFitRow2SideBySide) {
      // Titik pill
      ctx.fillStyle = 'rgba(14, 165, 233, 0.22)';
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, cardX + cardPadX, currentY, titikW, badgeH, badgeRadius, true);

      ctx.font = mainTextFont;
      ctx.fillStyle = '#38BDF8';
      ctx.fillText(titikFullText, cardX + cardPadX + Math.round(10 * scale), currentY + badgeH / 2);

      // Petugas pill
      const petugasX = cardX + cardPadX + titikW + Math.round(12 * scale);
      ctx.fillStyle = 'rgba(168, 85, 247, 0.22)';
      ctx.strokeStyle = 'rgba(192, 132, 252, 0.55)';
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, petugasX, currentY, petugasW, badgeH, badgeRadius, true);

      ctx.font = mainTextFont;
      ctx.fillStyle = '#C084FC';
      ctx.fillText(petugasFullText, petugasX + Math.round(10 * scale), currentY + badgeH / 2);
    } else {
      // Stacked if narrow
      ctx.fillStyle = 'rgba(14, 165, 233, 0.22)';
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, cardX + cardPadX, currentY, Math.min(contentW, titikW), badgeH, badgeRadius, true);

      ctx.font = mainTextFont;
      ctx.fillStyle = '#38BDF8';
      ctx.fillText(titikFullText, cardX + cardPadX + Math.round(10 * scale), currentY + badgeH / 2);

      const line2Y = currentY + badgeH + Math.round(6 * scale);
      ctx.fillStyle = 'rgba(168, 85, 247, 0.22)';
      ctx.strokeStyle = 'rgba(192, 132, 252, 0.55)';
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, cardX + cardPadX, line2Y, Math.min(contentW, petugasW), badgeH, badgeRadius, true);

      ctx.font = mainTextFont;
      ctx.fillStyle = '#C084FC';
      ctx.fillText(petugasFullText, cardX + cardPadX + Math.round(10 * scale), line2Y + badgeH / 2);
    }
    ctx.restore();

    currentY += row2H + sectionGap;

    // --- ROW 3: Alamat Geocoding Lengkap ---
    ctx.save();
    ctx.fillStyle = 'rgba(245, 158, 11, 0.20)';
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.55)';
    ctx.lineWidth = 1;
    drawRoundedRect(ctx, cardX + cardPadX, currentY, alamatBadgeW, alamatBadgeH, Math.round(6 * scale), true);

    ctx.font = badgeFont;
    ctx.fillStyle = '#FBBF24';
    ctx.textBaseline = 'middle';
    ctx.fillText(alamatBadgeText, cardX + cardPadX + Math.round(8 * scale), currentY + alamatBadgeH / 2);

    ctx.font = addressFont;
    ctx.fillStyle = '#F1F5F9';
    ctx.textBaseline = 'top';
    const textStartX = cardX + cardPadX + alamatBadgeW + Math.round(10 * scale);
    addressLines.forEach((line, idx) => {
      ctx.fillText(line, textStartX, currentY + idx * addressLineHeight);
    });
    ctx.restore();

    currentY += row3H + sectionGap;

    // --- ROW 4: Koordinat GPS ---
    ctx.save();
    ctx.fillStyle = 'rgba(34, 197, 94, 0.16)';
    ctx.strokeStyle = 'rgba(74, 222, 128, 0.45)';
    ctx.lineWidth = 1;
    drawRoundedRect(ctx, cardX + cardPadX, currentY, contentW, row4H, Math.round(8 * scale), true);

    ctx.font = gpsFont;
    ctx.fillStyle = '#4ADE80';
    ctx.textBaseline = 'middle';
    ctx.fillText(`🌐 GPS: ${formattedCoords}`, cardX + cardPadX + Math.round(12 * scale), currentY + row4H / 2);

    // Right-hand watermark brand
    const tagText = 'Warehouse Temperature Report';
    ctx.font = dayFont;
    ctx.fillStyle = '#94A3B8';
    const tagW = ctx.measureText(tagText).width;
    if (contentW > Math.round(520 * scale)) {
      ctx.fillText(tagText, cardX + cardPadX + contentW - tagW - Math.round(12 * scale), currentY + row4H / 2);
    }
    ctx.restore();

    // 9. Compress to JPEG with quality 0.80 (target < 350 KB, NFR-01)
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
      gpsCoordinates: activeCoords
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
              {/* Opsi 1: Kamera Belakang Bawaan HP */}
              <button
                type="button"
                onClick={() => fileInputDirectRearRef.current?.click()}
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
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
                <span>Buka Kamera Belakang HP ↗</span>
              </button>

              {/* Opsi 2: File Picker (Timemark / GPS Camera / Gallery) */}
              <button
                type="button"
                onClick={() => fileInputChooserRef.current?.click()}
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                <span>Pilih Foto (Timemark / GPS / Galeri)</span>
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
                title="Pilih foto dari Galeri atau hasil jepretan aplikasi Timemark / GPS Camera"
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
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                <span>Pilih Foto (Timemark / GPS / Galeri)</span>
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
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
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
