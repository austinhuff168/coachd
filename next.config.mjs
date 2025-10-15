/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  serverExternalPackages: ['@supabase/supabase-js'], // ✅ new key name
};

export default nextConfig;
