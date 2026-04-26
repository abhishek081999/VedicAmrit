import withPWAInit from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

const isDev = process.env.NODE_ENV === 'development'

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "form-action 'self'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https:",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // ffmpeg.wasm loads core from unpkg and needs wasm compile (Chrome)
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://unpkg.com https://checkout.razorpay.com https://www.googletagmanager.com https://www.google-analytics.com${isDev ? " 'unsafe-eval'" : ''}`,
  `connect-src 'self' https: https://api.razorpay.com https://checkout.razorpay.com https://www.google-analytics.com https://analytics.google.com https://stats.g.doubleclick.net${isDev ? ' http: ws: wss:' : ''}`,
  "frame-src 'self' https: https://api.razorpay.com https://checkout.razorpay.com",
  ...(isDev ? [] : ['upgrade-insecure-requests']),
].join('; ')

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Allow native addons like sweph
      config.externals = [...(config.externals || []), 'sweph', 'better-sqlite3']
    }
    return config
  },

  experimental: {
    serverComponentsExternalPackages: ['sweph'],
  },
  transpilePackages: ['next-auth', 'remotion', '@remotion/player'],

  // Permanent redirects
  async redirects() {
    return [
      {
        source:      '/asrology',
        destination: '/astrology',
        permanent:   true,
      },
      {
        source:      '/asrology/:path*',
        destination: '/astrology/:path*',
        permanent:   true,
      },
      {
        source:      '/home',
        destination: '/',
        permanent:   true,
      },
    ]
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'off' },
          { key: 'Content-Security-Policy', value: contentSecurityPolicy },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
        ],
      },
    ]
  },
}

export default withPWA(nextConfig);