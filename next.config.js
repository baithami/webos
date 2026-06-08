/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Required for PM2 deployment (see DEPLOYMENT.md)
  reactStrictMode: true,
  images: {
    domains: [],
  },
  webpack: (config, { isServer }) => {
    // sql.js references Node's fs/path/crypto in its UMD build, but the SQL
    // Detective apps only ever run it in the browser. Stub these out client-side
    // so webpack doesn't try to bundle Node built-ins.
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      }
    }
    return config
  },
}

module.exports = nextConfig
