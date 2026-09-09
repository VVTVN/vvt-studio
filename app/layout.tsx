import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'VVT Digital — Giữ điều đáng giá. Làm lại điều đã cũ.',
  description:
    'Thiết kế lại website, hình ảnh và quy trình số cho doanh nghiệp Việt.',
  icons: { icon: '/favicon.svg' },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
