// PM2 process definition for WebOS.
//
// This project builds with `output: 'standalone'` (see next.config.js), so the
// optimized production entrypoint is the generated server bundle at
// `.next/standalone/server.js` — NOT `next start`. Before first boot, copy the
// static assets next to that bundle (the standalone output omits them):
//
//   cp -r .next/static .next/standalone/.next/static
//   cp -r public        .next/standalone/public      # if a public/ dir exists
//
// The `npm run build:standalone` script does this copy for you.
//
// Then:  pm2 start ecosystem.config.js && pm2 save

module.exports = {
  apps: [
    {
      name: 'webos',
      script: '.next/standalone/server.js',
      cwd: '/var/www/webos', // update to the actual deploy path
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0',
      },
    },
  ],
}
