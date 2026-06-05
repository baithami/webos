# DEPLOYMENT.md — WebOS Server Setup

> Reference guide for deploying WebOS on Ubuntu 22.04 with PM2, Nginx, and Cloudflare Tunnel.
> Claude Code reads this when generating deployment-related code or config files.

---

## Stack

| Component | Role |
|---|---|
| Ubuntu 22.04 | Host OS |
| Node.js 20 LTS | Runtime |
| PM2 | Process manager / auto-restart |
| Nginx | Reverse proxy |
| Cloudflare Tunnel | Custom domain exposure, SSL termination |

---

## next.config.js Requirements

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',  // Required for PM2 deployment
  reactStrictMode: true,
  images: {
    domains: [],
  },
}

module.exports = nextConfig
```

---

## Build & Start Commands

> **Standalone note (added Layer 6):** because `next.config.js` sets
> `output: 'standalone'`, the optimized production entrypoint is the generated
> bundle at `.next/standalone/server.js`, **not** `next start` (`next start`
> works but prints a warning and doesn't use the standalone bundle). The
> standalone output omits static assets, so they must be copied next to the
> server bundle after each build. `npm run build:standalone` does the build +
> copy in one step, and `ecosystem.config.js` points PM2 at the bundle.

```bash
# Install dependencies
npm install

# Build for production (standalone) — builds and copies .next/static + public
npm run build:standalone

# Start with PM2 via the ecosystem file (runs .next/standalone/server.js)
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Manual start (no PM2), for a quick check:
npm run start:standalone   # = node .next/standalone/server.js
```

---

## PM2 Ecosystem File

Save as `ecosystem.config.js` in project root:

```js
module.exports = {
  apps: [
    {
      name: 'webos',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: '/var/www/webos',   // Update to actual path
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
}
```

---

## Nginx Config

Save as `/etc/nginx/sites-available/webos`:

```nginx
server {
    listen 80;
    server_name your-domain.com;   # Update to actual domain

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable and restart
sudo ln -s /etc/nginx/sites-available/webos /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Cloudflare Tunnel

Cloudflare handles SSL — no Certbot needed.

```bash
# Install cloudflared
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o cloudflared.deb
sudo dpkg -i cloudflared.deb

# Authenticate
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create webos

# Configure: ~/.cloudflared/config.yml
tunnel: <TUNNEL_ID>
credentials-file: /root/.cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: your-domain.com
    service: http://localhost:80
  - service: http_status:404

# Run as service
cloudflared service install
sudo systemctl start cloudflared
```

---

## Environment Variables

Create `.env.local` in project root (never commit this):

```env
NEXT_PUBLIC_APP_NAME=WebOS
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_DEFAULT_PIN=0000
```

---

## Health Check

```bash
# Confirm app is running
pm2 status
pm2 logs webos

# Confirm Nginx is proxying
curl -I http://localhost:3000

# Confirm tunnel is live
cloudflared tunnel info webos
```
