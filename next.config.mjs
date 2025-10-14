/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  experimental: { serverComponentsExternalPackages: ['@supabase/supabase-js'] },
};

export default nextConfig;
