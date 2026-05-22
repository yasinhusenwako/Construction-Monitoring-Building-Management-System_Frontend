/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
  },
  async rewrites() {
    return [
      // Proxy API calls to backend to avoid CORS during development
      {
        source: '/api/:path*',
        destination: process.env.NEXT_PUBLIC_API_BASE_URL + '/api/:path*',
      },
      // Proxy Keycloak calls (account endpoints) to avoid CORS issues
      {
        source: '/_keycloak/:path*',
        destination: process.env.NEXT_PUBLIC_KEYCLOAK_URL + '/:path*',
      },
    ];
  },
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-icons",
      "recharts",
      "date-fns",
    ],
  },
};

export default nextConfig;
