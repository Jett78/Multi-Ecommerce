/** @type {import('next').NextConfig} */
const nextConfig = {
  serverActions: {
    bodySizeLimit: '2mb',
  },
  turbopack: {
    root: '../..',
  },
  async rewrites() {
    const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    
    return [
      {
        source: '/api/auth/:path*',
        destination: `${API_URL}/api/auth/:path*`,
      },
      {
        source: '/api/account/:path*',
        destination: `${API_URL}/auth/:path*`,
      },
      {
        source: '/api/:path*',
        destination: `${API_URL}/:path*`,
      },
    ];
  },
   images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lawsagar.s3.ap-south-1.amazonaws.com",
        port: "",
      },
      {
        protocol: "https",
        hostname: "**",
        port: "",
      },
    ],
  }
};

export default nextConfig;
