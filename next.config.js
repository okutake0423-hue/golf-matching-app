/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // LIFFアプリは外部ドメインからアクセスされるため、CORS設定が必要な場合があります
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          // react-calendar / Next.js / Firebase 等が eval を使うため、LIFF 等の厳格な CSP でブロックされないよう許可
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.google.com https://liff.line.me https://api.line.me https://*.line.me https://*.line-apps.com wss://*.firebaseio.com",
              "frame-src 'self' https://*.line.me",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
