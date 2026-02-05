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
        ],
      },
    ];
  },
};

module.exports = nextConfig;
