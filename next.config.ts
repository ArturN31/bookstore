import type { NextConfig } from 'next';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_DB_URL || 'https://*.supabase.co';

const securityHeaders = [
    {
        key: 'X-DNS-Prefetch-Control',
        value: 'on',
    },
    {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
    },
    {
        key: 'X-Frame-Options',
        value: 'SAMEORIGIN',
    },
    {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
    },
    {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
    },
    {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=()',
    },
    {
        key: 'Content-Security-Policy',
        value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com https://js.hcaptcha.com",
            "style-src 'self' 'unsafe-inline' https://*.hcaptcha.com",
            "img-src 'self' blob: data: https://*.hcaptcha.com",
            "font-src 'self' https://*.hcaptcha.com",
            `connect-src 'self' ${supabaseUrl} wss://*.supabase.co https://va.vercel-scripts.com https://*.hcaptcha.com`,
            "frame-src 'self' https://*.hcaptcha.com",
            "frame-ancestors 'self'",
        ].join('; '),
    },
];

const nextConfig: NextConfig = {
    images: {
        formats: ['image/avif', 'image/webp'],
        minimumCacheTTL: 60,
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'placehold.co',
            },
        ],
    },
    poweredByHeader: false,
    compress: true,
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: securityHeaders,
            },
        ];
    },
};

export default nextConfig;
