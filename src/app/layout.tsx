import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Warehouse Temperature Report',
  description: 'Aplikasi Pencatatan dan Pelaporan Suhu Warehouse'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>
        {children}
      </body>
    </html>
  );
}
