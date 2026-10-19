// NFR-01: Kompresi gambar sisi klien menggunakan HTML5 Canvas
// Format JPEG, resolusi sisi terpanjang maks 1280px, kualitas 0.80, target < 350 KB

export interface CompressedImageResult {
  base64: string;
  sizeKb: number;
  capturedAt: string; // ISO 8601 Jakarta
}

export async function compressImageFile(file: File): Promise<CompressedImageResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIMENSION = 1280;
        let width = img.width;
        let height = img.height;

        // Scale proportionally if either dimension exceeds 1280px
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width >= height) {
            height = Math.round((height * MAX_DIMENSION) / width);
            width = MAX_DIMENSION;
          } else {
            width = Math.round((width * MAX_DIMENSION) / height);
            height = MAX_DIMENSION;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Gagal memproses kanvas gambar.'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Compress to JPEG with 0.80 quality (NFR-01)
        const base64Jpeg = canvas.toDataURL('image/jpeg', 0.8);

        // Calculate size in KB
        const rawBase64 = base64Jpeg.replace(/^data:image\/jpeg;base64,/, '');
        const sizeKb = Math.round((rawBase64.length * 3) / 4 / 1024);

        // Current Jakarta timestamp
        const now = new Date();
        const tzOffset = 7 * 60;
        const localTime = new Date(now.getTime() + tzOffset * 60 * 1000);
        const capturedAtISO = localTime.toISOString().replace('Z', '+07:00');

        resolve({
          base64: base64Jpeg,
          sizeKb,
          capturedAt: capturedAtISO
        });
      };

      img.onerror = (err) => reject(new Error('Gagal membaca format gambar.'));
      img.src = event.target?.result as string;
    };

    reader.onerror = (err) => reject(new Error('Gagal membaca file dari kamera.'));
    reader.readAsDataURL(file);
  });
}
