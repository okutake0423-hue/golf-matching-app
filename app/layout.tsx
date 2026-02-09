import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ゴルフマッチングアプリ',
  description: '社内ゴルフマッチングアプリ',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
