# niamOS Deployment Guide

Complete guide for deploying niamOS to production and managing the application.

## Table of Contents

1. [Development Setup](#development-setup)
2. [Building for Production](#building-for-production)
3. [Deployment Options](#deployment-options)
4. [Gateway Configuration](#gateway-configuration)
5. [SSL/TLS Setup](#ssltls-setup)
6. [Environment Variables](#environment-variables)
7. [Performance Optimization](#performance-optimization)
8. [Monitoring & Logging](#monitoring--logging)
9. [Troubleshooting](#troubleshooting)

## Development Setup

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Git

### Local Development

```bash
# Clone the repository
git clone https://github.com/Niraven/niamos.git
cd niamOS

# Install dependencies
npm install

# Start development server
npm run dev

# Server will be available at http://localhost:5173
```

### Development Server Features

- Hot Module Replacement (HMR)
- TypeScript checking
- Automatic rebuilds on file changes
- CORS proxy for gateway requests (optional)

### Testing

```bash
# Type checking
npm run type-check

# Linting (requires ESLint setup)
npm run lint

# Format code
npm run format
```

## Building for Production

### Production Build

```bash
# Build optimized bundle
npm run build

# Output goes to `dist/` directory
```

### Build Optimizations

The build includes:

1. **Code Splitting**
   - Separate chunks for: main, openclaw service, components
   - Lazy loading of heavy modules
   - Optimized vendor bundle

2. **Minification**
   - Terser for JavaScript
   - CSS minification
   - HTML minification

3. **Asset Optimization**
   - Image compression
   - Font subsetting
   - WebP formats where supported

### Build Output Structure

```
dist/
├── index.html                 # Entry point
├── assets/
│   ├── index-HASH.js         # Main bundle
│   ├── openclaw-HASH.js      # Openclaw service
│   ├── components-HASH.js    # React components
│   └── style-HASH.css        # CSS bundle
├── sw.js                      # Service Worker
├── manifest.json              # PWA manifest
└── ...                        # Other assets
```

## Deployment Options

### Option 1: Vercel (Recommended for Beginners)

**Easiest for React PWAs**

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Configure:
# - Build command: npm run build
# - Output directory: dist
# - Install command: npm install
```

**vercel.json:**

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "env": {
    "VITE_GATEWAY_URL": "@gateway_url",
    "VITE_GATEWAY_TOKEN": "@gateway_token"
  }
}
```

### Option 2: Netlify

**Simple drag-and-drop or Git integration**

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

**netlify.toml:**

```toml
[build]
command = "npm run build"
publish = "dist"

[env]
  VITE_GATEWAY_URL = "your-gateway-url"
  VITE_GATEWAY_TOKEN = "your-token"

[[headers]]
  for = "/*"
  [headers.values]
    X-Content-Type-Options = "nosniff"
    X-Frame-Options = "SAMEORIGIN"
    X-XSS-Protection = "1; mode=block"
```

### Option 3: Docker (Self-Hosted)

**Full control and customization**

**Dockerfile:**

```dockerfile
FROM node:20-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
ARG VITE_GATEWAY_URL
ARG VITE_GATEWAY_TOKEN
ENV VITE_GATEWAY_URL=$VITE_GATEWAY_URL
ENV VITE_GATEWAY_TOKEN=$VITE_GATEWAY_TOKEN

RUN npm run build

# Production image
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]
```

**nginx.conf:**

```nginx
worker_processes auto;

events {
  worker_connections 1024;
}

http {
  include /etc/nginx/mime.types;
  default_type application/octet-stream;

  # Performance
  sendfile on;
  tcp_nopush on;
  tcp_nodelay on;
  keepalive_timeout 65;
  types_hash_max_size 2048;

  # Gzip compression
  gzip on;
  gzip_vary on;
  gzip_proxied any;
  gzip_comp_level 6;
  gzip_types text/plain text/css text/xml text/javascript 
             application/json application/javascript application/xml+rss 
             application/rss+xml font/truetype font/opentype 
             application/vnd.ms-fontobject image/svg+xml;

  # Cache headers
  map $sent_http_content_type $expires {
    default                    off;
    text/html                  epoch;
    text/css                   max;
    application/javascript     max;
    ~image/                    max;
  }

  server {
    listen 80;
    server_name _;
    expires $expires;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    root /usr/share/nginx/html;
    index index.html;

    # SPA routing
    location / {
      try_files $uri $uri/ /index.html;
      add_header Cache-Control "no-cache, no-store, must-revalidate" always;
    }

    # Service Worker (no cache)
    location = /sw.js {
      add_header Cache-Control "no-cache, no-store, must-revalidate" always;
    }

    # Static assets (long cache)
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|eot|ttf|otf)$ {
      expires 1y;
      add_header Cache-Control "public, immutable" always;
    }

    # WebSocket proxy (if needed)
    location /ws {
      proxy_pass http://gateway:8000;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "upgrade";
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
    }
  }
}
```

**docker-compose.yml:**

```yaml
version: '3.8'

services:
  niamos:
    build:
      context: .
      args:
        VITE_GATEWAY_URL: ${VITE_GATEWAY_URL}
        VITE_GATEWAY_TOKEN: ${VITE_GATEWAY_TOKEN}
    ports:
      - "80:80"
      - "443:443"
    environment:
      NODE_ENV: production
    restart: unless-stopped
    volumes:
      - ./ssl:/etc/nginx/ssl:ro  # SSL certificates
```

**Build and run:**

```bash
# Build image
docker build -t niamos:latest .

# Run container
docker run -d \
  -p 80:80 \
  -p 443:443 \
  -e VITE_GATEWAY_URL=wss://gateway.example.com \
  -e VITE_GATEWAY_TOKEN=your-token \
  --restart unless-stopped \
  niamos:latest

# Or with docker-compose
docker-compose up -d
```

### Option 4: AWS S3 + CloudFront

**Highly scalable and cost-effective**

```bash
# Install AWS CLI
npm install -g aws-cli

# Build
npm run build

# Deploy to S3
aws s3 sync dist/ s3://your-bucket/ --delete

# Invalidate CloudFront
aws cloudfront create-invalidation \
  --distribution-id YOUR_DIST_ID \
  --paths "/*"
```

## Gateway Configuration

### Pointing to Gateway

**Development:**

```typescript
// .env.local
VITE_GATEWAY_URL=ws://localhost:8000
```

**Production:**

```typescript
// .env.production
VITE_GATEWAY_URL=wss://openclaw.example.com
VITE_GATEWAY_TOKEN=your-secure-token
```

### Gateway Requirements

Ensure your OpenClaw gateway:

1. **Supports WebSocket connections**
   - WSS (WebSocket Secure) in production
   - Proper CORS headers for cross-origin requests

2. **Has proper authentication**
   - Token-based or pairing code auth
   - Refresh token mechanism

3. **Implements rate limiting**
   - Prevent API abuse
   - Per-IP or per-token limits

4. **Monitors health**
   - `/health` endpoint
   - Status page

### Example Gateway Configuration

```yaml
# In your OpenClaw gateway config
websocket:
  enabled: true
  port: 8000
  security:
    tls_enabled: true
    certificate: /path/to/cert.pem
    key: /path/to/key.pem
  rate_limiting:
    per_ip: 100  # requests per minute
    per_token: 1000
  cors:
    allowed_origins:
      - https://niamos.example.com
      - https://niamos-staging.example.com
```

## SSL/TLS Setup

### Let's Encrypt (Free)

```bash
# Using Certbot with Nginx
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot certonly --webroot \
  -w /var/www/html \
  -d niamos.example.com

# Auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### Update Nginx Configuration

```nginx
server {
  listen 443 ssl http2;
  server_name niamos.example.com;

  ssl_certificate /etc/letsencrypt/live/niamos.example.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/niamos.example.com/privkey.pem;
  
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers HIGH:!aNULL:!MD5;
  ssl_prefer_server_ciphers on;

  # ... rest of config
}

# Redirect HTTP to HTTPS
server {
  listen 80;
  server_name niamos.example.com;
  return 301 https://$server_name$request_uri;
}
```

## Environment Variables

### Available Variables

```bash
# Gateway connection
VITE_GATEWAY_URL=wss://gateway.example.com
VITE_GATEWAY_TOKEN=your-auth-token

# Feature flags
VITE_ENABLE_NOTIFICATIONS=true
VITE_ENABLE_VOICE_INPUT=true
VITE_ENABLE_ANALYTICS=false

# API endpoints
VITE_API_BASE_URL=https://api.example.com
VITE_SENTRY_DSN=https://...@sentry.io/...

# App configuration
VITE_APP_NAME=niamOS
VITE_APP_VERSION=1.0.0
```

### Setting Environment Variables

**Vite (build-time):**

Create `.env.production`:

```env
VITE_GATEWAY_URL=wss://gateway.example.com
VITE_GATEWAY_TOKEN=token123
```

Then build:

```bash
npm run build  # Uses .env.production
```

**Runtime (Docker):**

```bash
docker run -e VITE_GATEWAY_URL=wss://... niamos:latest
```

## Performance Optimization

### Caching Strategy

1. **HTML:** No cache (always fetch fresh)
2. **Service Worker:** No cache (always fetch fresh)
3. **Static assets:** Long cache (1 year with hash)
4. **API responses:** Short cache (5 minutes)

### Bundle Size Analysis

```bash
# Analyze bundle size
npm install -g vite-plugin-visualizer

# Build with analysis
npm run build -- --analyze
```

### Content Delivery

1. **Use CDN** (CloudFlare, Akamai, AWS CloudFront)
2. **Enable GZIP compression**
3. **Minify all assets**
4. **Use WebP images**
5. **Lazy load components**

### Lighthouse Optimization

Target scores:
- Performance: > 90
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 90

```bash
# Install Lighthouse
npm install -g lighthouse

# Audit
lighthouse https://niamos.example.com
```

## Monitoring & Logging

### Client-Side Analytics

```typescript
// Track events
const trackEvent = (name: string, data: any) => {
  if (window.gtag) {
    gtag('event', name, data);
  }
};

// Usage
openclaw.on('agent:complete', (agentId, output) => {
  trackEvent('agent_complete', { agentId, outputLength: output.length });
});
```

### Error Reporting

```typescript
// Sentry integration
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: 'https://...@sentry.io/...',
  environment: 'production',
  tracesSampleRate: 0.1,
});

openclaw.on('error', (error) => {
  Sentry.captureException(error);
});
```

### Server-Side Logging

```bash
# Monitor Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Monitor Docker
docker logs -f niamos
```

## Troubleshooting

### Application Won't Load

1. Check browser console for errors
2. Verify Service Worker registration
3. Check network tab for failed requests
4. Clear browser cache: Ctrl+Shift+Del

### WebSocket Connection Fails

1. Verify gateway URL is correct
2. Check CORS headers
3. Verify SSL/TLS certificate
4. Check firewall rules
5. Look at browser Network tab

### Slow Performance

1. Check Lighthouse report
2. Analyze bundle size
3. Enable gzip compression
4. Check CDN configuration
5. Monitor gateway latency

### Service Worker Issues

```javascript
// In browser console:
// Clear all Service Workers
navigator.serviceWorker.getRegistrations().then(rs => {
  rs.forEach(r => r.unregister());
});

// Clear cache
caches.keys().then(names => {
  names.forEach(name => caches.delete(name));
});
```

### Push Notifications Not Working

1. Check notification permission
2. Verify Service Worker is registered
3. Check browser notifications are enabled
4. Try different notification format
5. Check console for errors

## Monitoring Checklist

- [ ] SSL/TLS certificate is valid and non-expired
- [ ] Service Worker is registered and active
- [ ] Push notifications are working
- [ ] Error reporting (Sentry) is functional
- [ ] Analytics are tracking events
- [ ] Gateway connection is stable
- [ ] Database backups are automated
- [ ] CDN cache is being invalidated correctly
- [ ] Logs are being collected and analyzed
- [ ] Uptime monitoring is configured

## Scaling

As your user base grows:

1. **Database**: Scale with read replicas
2. **Gateway**: Load balance with HAProxy or Nginx
3. **CDN**: Increase edge locations
4. **Cache**: Use Redis for session state
5. **Monitoring**: Implement distributed tracing

## Disaster Recovery

1. **Regular backups** of configuration and data
2. **Multi-region deployment** for availability
3. **Database replication** across regions
4. **Automated failover** for critical services
5. **Incident response plan** documented

---

**Questions?** Check the main [README.md](./README.md) or [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)
