/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    // Public API URL used in the client (Search, AI Assistant, etc.)
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.API_URL ||
      'http://localhost:5000',
    // Keep a non-public alias as well for server-side usage if needed
    API_URL: process.env.API_URL || 'http://localhost:5000',
  },
}

module.exports = {
  // Other Next.js config
  async rewrites() {
    const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:5000'
    const apiUrl = rawApiUrl.replace(/\/+$/, '').replace(/\/api$/, '')
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`
      },
      {
        source: '/uploads/:path*',
        destination: `${apiUrl}/uploads/:path*`
      }
    ];
  }
};

