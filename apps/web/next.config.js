/** @type {import('next').NextConfig} */
const nextConfig = {
  serverActions: {
    bodySizeLimit: '2mb',
  },
  turbopack: {
    root: '../..',
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:4000/:path*',
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
