import type { NextConfig } from 'next';

const backendUrl = (process.env.BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '');

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${backendUrl}/uploads/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      { source: '/', destination: '/admin/dashboard', permanent: false },
      { source: '/admin', destination: '/admin/dashboard', permanent: false },
      { source: '/staff', destination: '/login', permanent: false },
      { source: '/staff/login', destination: '/login', permanent: false },
      { source: '/admin/login', destination: '/login', permanent: false },
      { source: '/dashboard', destination: '/admin/dashboard', permanent: false },
      { source: '/orders', destination: '/admin/orders', permanent: false },
      { source: '/orders/:id', destination: '/admin/orders/:id', permanent: false },
      { source: '/menu', destination: '/admin/menu', permanent: false },
      { source: '/categories', destination: '/admin/categories', permanent: false },
      { source: '/customers', destination: '/admin/customers', permanent: false },
      { source: '/payments', destination: '/admin/payments', permanent: false },
      { source: '/bookings', destination: '/admin/bookings', permanent: false },
      { source: '/party-inquiries', destination: '/admin/party-inquiries', permanent: false },
      { source: '/website-content', destination: '/admin/website-content', permanent: false },
      { source: '/promotions', destination: '/admin/promotions', permanent: false },
      { source: '/offers', destination: '/admin/offers', permanent: false },
      { source: '/gallery', destination: '/admin/gallery', permanent: false },
      { source: '/reviews', destination: '/admin/reviews', permanent: false },
      { source: '/reports', destination: '/admin/reports', permanent: false },
      { source: '/audit', destination: '/admin/audit', permanent: false },
      { source: '/settings', destination: '/admin/settings', permanent: false },
      { source: '/profile', destination: '/admin/profile', permanent: false },
    ];
  },
};

export default nextConfig;
