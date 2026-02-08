'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        fontFamily: 'sans-serif',
        background: '#f5f5f5',
      }}
    >
      <div
        style={{
          maxWidth: 400,
          padding: 32,
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          textAlign: 'center',
        }}
      >
        <h1 style={{ fontSize: 20, marginBottom: 16, color: '#333' }}>
          エラーが発生しました
        </h1>
        <p style={{ fontSize: 14, color: '#666', marginBottom: 24 }}>
          申し訳ありません。問題が発生しました。ブラウザのコンソールに詳細が表示されている場合があります。
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            type="button"
            onClick={reset}
            style={{
              padding: '12px 24px',
              background: '#06c755',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            再試行
          </button>
          <Link
            href="/"
            style={{
              display: 'block',
              padding: '12px 24px',
              color: '#06c755',
              textDecoration: 'none',
              fontSize: 14,
            }}
          >
            ← トップへ戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
