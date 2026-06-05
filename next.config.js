/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Required for PM2 deployment (see DEPLOYMENT.md)
  reactStrictMode: true,
  images: {
    domains: [],
  },
}

module.exports = nextConfig
