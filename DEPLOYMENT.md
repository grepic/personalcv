# Production Deployment Guide

Complete guide for deploying NetworkHub to production.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Database Setup](#database-setup)
- [Backend Deployment](#backend-deployment)
- [Frontend Deployment](#frontend-deployment)
- [SSL/HTTPS Setup](#sslhttps-setup)
- [Monitoring & Logging](#monitoring--logging)
- [Backup Strategy](#backup-strategy)
- [Troubleshooting](#troubleshooting)

## 🔧 Prerequisites

### Required Services

1. **Server/Hosting**
   - VPS or Cloud Provider (DigitalOcean, AWS, Google Cloud, etc.)
   - Minimum: 2 CPU cores, 4GB RAM, 50GB SSD
   - Ubuntu 22.04 LTS (recommended)

2. **Domain & DNS**
   - Domain name (e.g., networkhub.com)
   - DNS configured to point to your server

3. **External Services**
   - PostgreSQL 14+ (managed or self-hosted)
   - SMTP Email Provider (SendGrid, Mailgun, AWS SES)
   - Stripe Account (production keys)
   - (Optional) Redis for caching
   - (Optional) S3-compatible storage for files

### Software Requirements

```bash
# Install on server
- Node.js 18+
- npm or yarn
- PostgreSQL client tools
- Nginx (reverse proxy)
- PM2 or systemd (process manager)
- Certbot (SSL certificates)
```

## ⚙️ Environment Setup

### 1. Clone Repository

```bash
# SSH into your server
ssh user@your-server.com

# Clone repository
git clone <your-repo-url> /var/www/networkhub
cd /var/www/networkhub
```

### 2. Backend Environment Variables

Create `/var/www/networkhub/backend/.env`:

```bash
# Application
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://networkhub.com

# Database
DATABASE_URL=postgresql://user:password@host:5432/networkhub_prod

# JWT Secrets (CRITICAL: Use strong random values!)
# Generate with: openssl rand -base64 64
JWT_SECRET=your-super-secure-jwt-secret-at-least-64-characters-long
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-at-least-64-characters-long

# Email Service (SendGrid Example)
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
EMAIL_FROM=noreply@networkhub.com
EMAIL_FROM_NAME=NetworkHub

# Stripe Payment (Production Keys)
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# File Upload (if using S3)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=networkhub-uploads
AWS_REGION=eu-central-1

# Redis (if using)
REDIS_URL=redis://localhost:6379

# Security
ALLOWED_ORIGINS=https://networkhub.com,https://www.networkhub.com
```

### 3. Frontend Environment Variables

Create `/var/www/networkhub/frontend/.env.production`:

```bash
VITE_API_URL=https://api.networkhub.com
VITE_STRIPE_PUBLIC_KEY=pk_live_your_stripe_public_key
```

## 🗄️ Database Setup

### 1. Create Production Database

```bash
# On your PostgreSQL server
psql -U postgres

CREATE DATABASE networkhub_prod;
CREATE USER networkhub WITH ENCRYPTED PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE networkhub_prod TO networkhub;

# If PostgreSQL 15+, also grant schema privileges
\c networkhub_prod
GRANT ALL ON SCHEMA public TO networkhub;

\q
```

### 2. Run Migrations

```bash
cd /var/www/networkhub/backend

# Install dependencies
npm ci --production=false

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# (Optional) Seed initial data
# npm run prisma:seed
```

## 🚀 Backend Deployment

### Option A: Using PM2 (Recommended)

```bash
cd /var/www/networkhub/backend

# Install dependencies
npm ci --production

# Build TypeScript
npm run build

# Install PM2 globally
npm install -g pm2

# Start application with PM2
pm2 start dist/server.js --name networkhub-api

# Configure PM2 to start on boot
pm2 startup
pm2 save

# View logs
pm2 logs networkhub-api

# Monitor
pm2 monit
```

### Option B: Using systemd

Create `/etc/systemd/system/networkhub-api.service`:

```ini
[Unit]
Description=NetworkHub API
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/networkhub/backend
Environment=NODE_ENV=production
ExecStart=/usr/bin/node dist/server.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=networkhub-api

[Install]
WantedBy=multi-user.target
```

Start service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable networkhub-api
sudo systemctl start networkhub-api
sudo systemctl status networkhub-api

# View logs
sudo journalctl -u networkhub-api -f
```

## 🌐 Frontend Deployment

### Build Frontend

```bash
cd /var/www/networkhub/frontend

# Install dependencies
npm ci

# Build for production
npm run build

# Output will be in dist/
```

### Serve with Nginx

Install Nginx:

```bash
sudo apt update
sudo apt install nginx
```

Create Nginx configuration `/etc/nginx/sites-available/networkhub`:

```nginx
# API Server
server {
    listen 80;
    server_name api.networkhub.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Increase body size for file uploads
    client_max_body_size 10M;
}

# Frontend
server {
    listen 80;
    server_name networkhub.com www.networkhub.com;

    root /var/www/networkhub/frontend/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/networkhub /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔒 SSL/HTTPS Setup

### Using Let's Encrypt (Free SSL)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificates for both domains
sudo certbot --nginx -d networkhub.com -d www.networkhub.com -d api.networkhub.com

# Auto-renewal is configured automatically
# Test renewal:
sudo certbot renew --dry-run
```

### Verify HTTPS

Visit your site:
- https://networkhub.com
- https://api.networkhub.com/health

## 📊 Monitoring & Logging

### 1. Application Logs

**PM2:**
```bash
pm2 logs networkhub-api --lines 100
pm2 logs networkhub-api --err
```

**Systemd:**
```bash
sudo journalctl -u networkhub-api -f
sudo journalctl -u networkhub-api --since "1 hour ago"
```

### 2. Nginx Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

### 3. Database Monitoring

```bash
# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log

# Active connections
psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"
```

### 4. Setup Monitoring Tools (Optional)

**PM2 Plus (Paid):**
```bash
pm2 link <secret_key> <public_key>
```

**New Relic / Datadog:**
- Install agent following provider docs
- Configure API keys in environment

### 5. Health Checks

Create monitoring script `/var/www/scripts/health-check.sh`:

```bash
#!/bin/bash

# Check API health
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://api.networkhub.com/health)

if [ "$API_STATUS" != "200" ]; then
    echo "API health check failed: $API_STATUS"
    # Send alert (email, Slack, etc.)
    pm2 restart networkhub-api
fi

# Check database
DB_STATUS=$(psql -U networkhub -d networkhub_prod -c "SELECT 1" -t)
if [ "$DB_STATUS" != " 1" ]; then
    echo "Database health check failed"
    # Send alert
fi
```

Add to crontab:
```bash
*/5 * * * * /var/www/scripts/health-check.sh
```

## 💾 Backup Strategy

### 1. Database Backups

Create backup script `/var/www/scripts/backup-db.sh`:

```bash
#!/bin/bash

BACKUP_DIR="/var/backups/postgresql"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="networkhub_prod_$DATE.sql.gz"

# Create backup
pg_dump -U networkhub networkhub_prod | gzip > "$BACKUP_DIR/$FILENAME"

# Keep only last 30 days of backups
find $BACKUP_DIR -name "networkhub_prod_*.sql.gz" -mtime +30 -delete

# Upload to S3 (optional)
# aws s3 cp "$BACKUP_DIR/$FILENAME" s3://your-backup-bucket/database/

echo "Backup completed: $FILENAME"
```

Schedule daily backups:
```bash
0 2 * * * /var/www/scripts/backup-db.sh
```

### 2. File Backups

```bash
# Backup uploaded files
rsync -avz /var/www/networkhub/backend/uploads/ user@backup-server:/backups/uploads/

# Or to S3
aws s3 sync /var/www/networkhub/backend/uploads/ s3://your-backup-bucket/uploads/
```

### 3. Restore from Backup

```bash
# Restore database
gunzip < /var/backups/postgresql/networkhub_prod_YYYYMMDD_HHMMSS.sql.gz | psql -U networkhub networkhub_prod

# Restore files
rsync -avz user@backup-server:/backups/uploads/ /var/www/networkhub/backend/uploads/
```

## 🔄 Deployment Updates

### Zero-Downtime Deployment Script

Create `/var/www/scripts/deploy.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 Starting deployment..."

cd /var/www/networkhub

# Pull latest code
git pull origin main

# Backend
cd backend
echo "📦 Installing backend dependencies..."
npm ci --production

echo "🔧 Running migrations..."
npx prisma migrate deploy
npx prisma generate

echo "🏗️ Building backend..."
npm run build

echo "🔄 Restarting API..."
pm2 reload networkhub-api --update-env

# Frontend
cd ../frontend
echo "📦 Installing frontend dependencies..."
npm ci

echo "🏗️ Building frontend..."
npm run build

echo "✅ Deployment completed!"
echo "🔍 Checking health..."
sleep 3
curl -f https://api.networkhub.com/health || echo "⚠️  Health check failed!"
```

Make executable and run:
```bash
chmod +x /var/www/scripts/deploy.sh
/var/www/scripts/deploy.sh
```

## 🐛 Troubleshooting

### API Not Starting

```bash
# Check PM2 logs
pm2 logs networkhub-api --err

# Check if port is in use
sudo netstat -tulpn | grep :5000

# Check environment variables
pm2 env 0
```

### Database Connection Issues

```bash
# Test connection
psql -U networkhub -d networkhub_prod -h localhost

# Check PostgreSQL is running
sudo systemctl status postgresql

# Check connection limits
psql -U postgres -c "SHOW max_connections;"
```

### High Memory Usage

```bash
# Check memory
free -h
pm2 monit

# Restart with memory limit
pm2 delete networkhub-api
pm2 start dist/server.js --name networkhub-api --max-memory-restart 1G
```

### Nginx 502 Bad Gateway

```bash
# Check if backend is running
curl http://localhost:5000/health

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Test Nginx config
sudo nginx -t
```

### SSL Certificate Issues

```bash
# Check certificate expiry
sudo certbot certificates

# Renew manually
sudo certbot renew --force-renewal

# Check Nginx SSL config
sudo nginx -T | grep ssl
```

## 📈 Performance Optimization

### 1. Enable Redis Caching

```bash
# Install Redis
sudo apt install redis-server

# Configure Redis to start on boot
sudo systemctl enable redis-server
```

Update backend code to use Redis for session storage and caching.

### 2. Database Optimization

```sql
-- Add indexes for common queries
CREATE INDEX idx_jobs_status ON "Job"(status);
CREATE INDEX idx_posts_created_at ON "Post"("createdAt" DESC);
CREATE INDEX idx_applications_status ON "Application"(status);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM "Job" WHERE status = 'OPEN';
```

### 3. CDN for Static Assets

Upload built frontend to CDN (Cloudflare, AWS CloudFront, etc.) for better performance.

### 4. Enable HTTP/2

Nginx automatically enables HTTP/2 with SSL.

## ✅ Post-Deployment Checklist

- [ ] All environment variables configured
- [ ] Database migrations applied successfully
- [ ] SSL certificates installed and auto-renewal working
- [ ] Backend API responding at /health endpoint
- [ ] Frontend loading correctly
- [ ] Email sending working (test forgot password)
- [ ] Stripe webhooks configured and tested
- [ ] Cron jobs running (check with `crontab -l`)
- [ ] Backups configured and tested
- [ ] Monitoring/alerts set up
- [ ] PM2 or systemd configured to start on boot
- [ ] Nginx configured with proper security headers
- [ ] Rate limiting working
- [ ] File uploads working
- [ ] Test user registration, login, job posting
- [ ] Check logs for errors

## 🆘 Support

If you encounter issues:

1. Check logs first (PM2, Nginx, PostgreSQL)
2. Verify environment variables
3. Test database connection
4. Check firewall rules
5. Review recent changes in git log

---

**Your application is now live! 🎉**

Monitor regularly and keep all dependencies updated.
