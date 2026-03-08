/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // 隐藏开发模式下左下角的黑色 Next.js 指示器（用户不应看到此开发工具）
  devIndicators: false,
}

export default nextConfig
