/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Enable Turbopack for significantly faster local dev HMR
  turbopack: {},
  experimental: {
    // Optimize package imports to avoid loading full barrel exports
    optimizePackageImports: ['lucide-react', 'recharts', '@radix-ui/react-dropdown-menu'],
  },
}

export default nextConfig
