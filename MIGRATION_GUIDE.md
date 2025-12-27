# Database Migration Guide

This guide helps you migrate your database to include all the latest features: security fields, subscription tracking, reporting system, and CMS.

## ⚠️ Important: Backup First!

```bash
# Backup your database before migration
pg_dump networking_platform > backup_$(date +%Y%m%d_%H%M%S).sql
```

## 📋 What's New in This Migration

### Schema Changes

1. **User Model Updates**
   - Added `ADMIN` role
   - Security fields: `isEmailVerified`, `isBanned`, `bannedAt`, `bannedBy`, `banReason`
   - Tracking fields: `lastLoginAt`, `failedLoginAttempts`, `lastFailedLoginAt`

2. **New Models**
   - `CompanySubscription` - Full subscription tracking
   - `Report` - Content/user reporting system
   - `SeoSetting` - Per-page SEO configuration
   - `Page` - CMS for static pages

3. **New Enums**
   - `ReportStatus`: PENDING, REVIEWING, RESOLVED, DISMISSED
   - `ReportType`: SPAM, HARASSMENT, INAPPROPRIATE_CONTENT, FAKE_PROFILE, FRAUD, OTHER
   - `SubscriptionStatus`: ACTIVE, CANCELLED, EXPIRED, SUSPENDED

4. **Index Improvements**
   - Added compound indexes for better query performance
   - New indexes on frequently queried fields

## 🚀 Migration Steps

### Step 1: Update Code

```bash
# Pull latest changes
git pull origin main

# Install new dependencies
cd backend
npm install

# Verify package installation
npm list helmet express-rate-limit nodemailer pdf-parse mammoth stripe
```

### Step 2: Review Schema Changes

```bash
# View the new schema
cat backend/prisma/schema.prisma
```

### Step 3: Create Migration

```bash
cd backend

# Generate migration
npx prisma migrate dev --name add_security_subscriptions_reports_cms

# This will:
# 1. Create a new migration file
# 2. Apply it to your database
# 3. Regenerate Prisma Client
```

### Step 4: Verify Migration

```bash
# Check migration status
npx prisma migrate status

# Open Prisma Studio to inspect
npx prisma studio
# Opens at http://localhost:5555
```

### Step 5: Seed Admin User

```bash
# Connect to database
psql networking_platform

# Add ADMIN role to your user
UPDATE "User"
SET roles = array_append(roles, 'ADMIN')
WHERE email = 'your@email.com';

# Verify
SELECT id, email, roles FROM "User" WHERE 'ADMIN' = ANY(roles);
\q
```

### Step 6: Update Environment Variables

```bash
# Edit backend/.env
nano backend/.env

# Add new variables (see .env.example for complete list):

# Email Service
EMAIL_PROVIDER=dev
EMAIL_FROM='"NetworkHub" <noreply@networkhub.cz>'

# Admin emails (optional, prefer DB roles)
ADMIN_EMAILS=admin@networkhub.cz

# Stripe (for production)
# STRIPE_SECRET_KEY=sk_test_...
# STRIPE_PUBLISHABLE_KEY=pk_test_...

# Security
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=5
```

### Step 7: Test the Migration

```bash
# Start backend
cd backend
npm run dev

# Check logs for:
✅ Cron jobs initialized
✅ Email service initialized
✅ Server running on port 5000

# Test endpoints
curl http://localhost:5000/health
# Should return: {"status":"ok","timestamp":"..."}

# Start frontend
cd frontend
npm run dev
```

## 🧪 Verification Checklist

- [ ] Database migrated successfully (no errors in `prisma migrate`)
- [ ] All new tables exist (CompanySubscription, Report, SeoSetting, Page)
- [ ] User model has new security fields
- [ ] Admin user has ADMIN role
- [ ] Backend starts without errors
- [ ] Cron jobs initialize
- [ ] Frontend connects to backend
- [ ] Can log in
- [ ] Admin panel accessible at /admin
- [ ] Email service logs preview URLs (dev mode)

## 🔄 Rollback (If Needed)

```bash
# If migration fails, rollback to previous state

# 1. Restore database from backup
psql networking_platform < backup_YYYYMMDD_HHMMSS.sql

# 2. Reset Prisma migrations
cd backend
npx prisma migrate reset

# 3. Checkout previous code version
git checkout <previous-commit-hash>

# 4. Reinstall old dependencies
npm install
```

## 📊 Data Migration (Optional)

If you have existing data that needs to be transformed:

### Migrate Existing Users

```sql
-- Set default values for new fields
UPDATE "User"
SET
  "isEmailVerified" = true,  -- Assume existing users are verified
  "isBanned" = false,
  "failedLoginAttempts" = 0
WHERE "isEmailVerified" IS NULL;
```

### Create Default SEO Settings

```sql
-- Insert default SEO for main pages
INSERT INTO "SeoSetting" (id, page, title, description, "noindex", "updatedAt")
VALUES
  ('seo_homepage', 'homepage', 'NetworkHub - Professional Networking & Jobs', 'Connect with professionals and find your dream job', false, NOW()),
  ('seo_jobs', 'jobs', 'Browse Jobs - NetworkHub', 'Discover job opportunities from top companies', false, NOW()),
  ('seo_feed', 'feed', 'Feed - NetworkHub', 'See what''s happening in your professional network', false, NOW());
```

## 🆕 New Features to Test

### 1. Reporting System
```bash
# Test creating a report
POST /api/reports
{
  "reportedUserId": "user_id",
  "type": "SPAM",
  "reason": "Test report"
}

# Admin: View reports
GET /api/admin/reports
```

### 2. Subscription Tracking
```bash
# Create a subscription
POST /api/payment/subscription
{
  "plan": "PROFESSIONAL"
}

# View active subscriptions
GET /api/admin/subscriptions
```

### 3. CMS Pages
```bash
# Admin: Create page
POST /api/cms/admin/pages
{
  "slug": "about-us",
  "title": "About Us",
  "content": "<h1>About NetworkHub</h1><p>We connect professionals...</p>"
}

# Public: View page
GET /cms/pages/about-us
```

### 4. SEO Management
```bash
# Admin: Update SEO
PUT /api/cms/admin/seo/homepage
{
  "title": "NetworkHub - Professional Networking",
  "description": "Connect with professionals and find jobs"
}
```

### 5. CV Parsing (PDF/DOC)
```bash
# Upload CV
POST /api/cv-parser/upload
Content-Type: multipart/form-data
file: resume.pdf

# Should extract:
- Email
- Phone
- Skills
- Experience
- Education
```

## 🐛 Common Migration Issues

### Issue: Migration Fails with Foreign Key Error
**Solution:**
```bash
# Clear existing data that conflicts
npx prisma migrate reset
# Or manually fix conflicting data
```

### Issue: Prisma Client Out of Sync
**Solution:**
```bash
npx prisma generate --force
```

### Issue: Cannot Connect to Database
**Solution:**
```bash
# Check DATABASE_URL in .env
# Ensure PostgreSQL is running
sudo service postgresql status
# Or on Mac:
brew services list
```

### Issue: Admin Role Not Working
**Solution:**
```sql
-- Verify ADMIN enum exists
SELECT unnest(enum_range(NULL::public."Role"));

-- Assign ADMIN role again
UPDATE "User" SET roles = ARRAY['ADMIN'] WHERE email = 'admin@example.com';
```

## 📈 Performance Optimization

After migration, run these for better performance:

```sql
-- Analyze tables for query optimization
ANALYZE "User";
ANALYZE "Job";
ANALYZE "Post";
ANALYZE "Application";
ANALYZE "Report";
ANALYZE "CompanySubscription";

-- Create missing indexes if needed
CREATE INDEX IF NOT EXISTS idx_user_last_login ON "User"("lastLoginAt");
CREATE INDEX IF NOT EXISTS idx_report_status_type ON "Report"("status", "type");
```

## ✅ Post-Migration Tasks

1. **Configure Email Service**
   - Set up SendGrid/AWS SES for production
   - Test email sending

2. **Set up Stripe**
   - Add API keys to .env
   - Test payment flow
   - Configure webhooks

3. **Configure Cron Jobs**
   - Verify cron jobs are running
   - Check logs for job execution

4. **Security Review**
   - Update JWT secrets to strong values (32+ characters)
   - Review rate limiting settings
   - Test admin authentication

5. **Content Setup**
   - Create initial SEO settings
   - Add static pages (About, Privacy, Terms)
   - Configure sitemap

## 🔐 Security Checklist

- [ ] JWT_SECRET is strong (32+ characters)
- [ ] JWT_REFRESH_SECRET is different from JWT_SECRET
- [ ] Admin users have ADMIN role (not just email list)
- [ ] Rate limiting is configured
- [ ] CORS is set to production domain
- [ ] File upload limits are set
- [ ] Email service is configured
- [ ] Database backups are scheduled

## 📞 Need Help?

If you encounter issues:

1. Check the logs: `npm run dev` (watch for errors)
2. Verify database connection: `psql networking_platform`
3. Check Prisma status: `npx prisma migrate status`
4. Review schema: `npx prisma studio`
5. Check environment variables: `cat .env`

---

**Migration completed?** ✅
You're now running the latest version with all security features, reporting, subscriptions, and CMS!
