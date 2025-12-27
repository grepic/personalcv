# NetworkHub - Professional Networking Platform MVP

Complete LinkedIn/Indeed-style professional networking and job platform built with React, TypeScript, Node.js, Express, Prisma, and PostgreSQL.

## 🎯 Features Overview

### Core Networking Features
- ✅ **User Profiles** - Candidates, Freelancers, Companies with customizable CVs
- ✅ **Connections System** - Send/accept/reject connection requests
- ✅ **Social Feed** - Status updates, portfolio posts, job postings
- ✅ **Messaging** - Direct conversations between users
- ✅ **Company Following** - Follow companies and get notified of new jobs

### Job Platform
- ✅ **Job Listings** - Full job posting system with search and filters
- ✅ **Applications** - Track application status (NEW → VIEWED → INTERVIEW → REJECTED/HIRED)
- ✅ **CV Parser** - Upload PDF/DOC/DOCX CVs with automatic parsing
- ✅ **Job Monetization** - 4 pricing tiers (FREE, STANDARD, FEATURED, PREMIUM)
- ✅ **Saved Jobs** - Bookmark interesting positions

### Company Features
- ✅ **Candidate Management** - Internal reviews and comments
- ✅ **Subscription Plans** - FREE, PROFESSIONAL, ENTERPRISE
- ✅ **Usage Tracking** - Job posts used/limit, CV views used/limit
- ✅ **Company Reviews** - Public reviews from employees

### Admin & Moderation
- ✅ **Admin Panel** - Dashboard with statistics
- ✅ **User Management** - Ban/unban users with audit trail
- ✅ **Reporting System** - Report spam, harassment, fraud, etc.
- ✅ **Content Moderation** - Delete posts/jobs
- ✅ **Analytics** - User growth, job stats, revenue tracking

### CMS & SEO
- ✅ **SEO Management** - Per-page meta tags, OG images, keywords
- ✅ **Page Editor** - Create dynamic pages (About, Privacy, Terms)
- ✅ **Sitemap Generation** - Dynamic sitemap.xml
- ✅ **Robots.txt** - SEO configuration

### Security & Infrastructure
- ✅ **Helmet.js** - Security headers (CSP, XSS protection)
- ✅ **Rate Limiting** - 100 req/15min general, 5 req/15min auth
- ✅ **Input Sanitization** - NoSQL injection protection
- ✅ **Ban System** - User banning with reasons and audit trail
- ✅ **Email Service** - Welcome, password reset, notifications
- ✅ **Cron Jobs** - Auto-close expired jobs, cleanup tokens, process subscriptions
- ✅ **Error Boundaries** - React error handling

## 🚀 Quick Start

### Prerequisites
```bash
- Node.js 18+ and npm
- PostgreSQL 14+
- Git
```

### 1. Clone and Install

```bash
# Clone repository
git clone <repository-url>
cd personalcv

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Database Setup

```bash
# Create PostgreSQL database
createdb networking_platform

# Or via psql
psql -U postgres
CREATE DATABASE networking_platform;
\q
```

### 3. Environment Configuration

```bash
# Backend
cd backend
cp .env.example .env

# Edit .env and set:
# - DATABASE_URL (PostgreSQL connection string)
# - JWT_SECRET (min 32 characters, use: openssl rand -base64 32)
# - JWT_REFRESH_SECRET (min 32 characters)
# - EMAIL_PROVIDER=dev (for development)
# - FRONTEND_URL=http://localhost:3000
```

### 4. Run Database Migrations

```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
```

### 5. Create Admin User

```bash
# Start backend first
npm run dev

# In another terminal, connect to database
psql networking_platform

# Assign ADMIN role to your user
UPDATE "User"
SET roles = array_append(roles, 'ADMIN')
WHERE email = 'your@email.com';
```

### 6. Start Development Servers

```bash
# Backend (Terminal 1)
cd backend
npm run dev
# Runs on http://localhost:5000

# Frontend (Terminal 2)
cd frontend
npm run dev
# Runs on http://localhost:3000
```

## 📁 Project Structure

```
personalcv/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # Database schema
│   ├── src/
│   │   ├── controllers/           # Request handlers
│   │   ├── routes/                # API routes
│   │   ├── middlewares/           # Auth, admin, security
│   │   ├── services/              # Email, cron, stripe
│   │   ├── app.ts                 # Express app configuration
│   │   └── server.ts              # Server entry point
│   └── uploads/                   # File uploads directory
│
└── frontend/
    ├── src/
    │   ├── components/            # Reusable components
    │   ├── pages/                 # Page components
    │   │   ├── Admin/             # Admin panel pages
    │   │   └── ...                # Other pages
    │   ├── services/              # API client, utilities
    │   ├── store/                 # Zustand state management
    │   └── App.tsx                # Main app component
    └── public/
```

## 🔐 Security Features

### Implemented
- **Helmet.js** - Sets secure HTTP headers
- **Rate Limiting** - Prevents brute force and DDoS
- **CORS** - Configured for frontend origin only
- **Input Sanitization** - NoSQL injection protection
- **HPP** - HTTP Parameter Pollution protection
- **JWT Authentication** - With refresh tokens
- **Admin Role System** - Database-based, not email list
- **Ban System** - With audit trail and reasons

### Configuration
```javascript
// Rate Limits
General API: 100 requests / 15 minutes
Auth endpoints: 5 attempts / 15 minutes

// Body Size Limits
JSON/Form data: 10kb max

// JWT
Access Token: 15 minutes
Refresh Token: 7 days
```

## 📧 Email Service

### Development Mode
```bash
EMAIL_PROVIDER=dev
# Uses ethereal.email - preview URLs logged to console
```

### Production (SendGrid example)
```bash
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
EMAIL_FROM="NetworkHub <noreply@networkhub.cz>"
```

### Available Email Templates
- Welcome email
- Password reset
- Email verification
- Connection requests
- Job application received
- Application status updates

## 💳 Payment Integration

### Stripe Setup
```bash
# Install Stripe CLI for webhook testing
stripe login
stripe listen --forward-to localhost:5000/api/payment/webhook

# Set environment variables
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Job Pricing
- **FREE**: 0 Kč (7 days)
- **STANDARD**: 4,990 Kč (30 days)
- **FEATURED**: 9,990 Kč (30 days, highlighted)
- **PREMIUM**: 14,990 Kč (60 days, top placement)

### Subscription Pricing
- **FREE**: 0 Kč (1 job/month, 5 CV views)
- **PROFESSIONAL**: 7,990 Kč/month (5 jobs, 20 CV views)
- **ENTERPRISE**: 24,990 Kč/month (unlimited)

## ⏰ Cron Jobs

Automatically running scheduled tasks:

```typescript
// Close expired jobs - Every hour
closeExpiredJobs()

// Cleanup expired tokens - Daily at 2 AM
cleanupExpiredTokens()

// Process expired subscriptions - Daily at 3 AM
processExpiredSubscriptions()
```

## 🗄️ Database Schema

### Main Models
- **User** - Profiles with roles (CANDIDATE, FREELANCER, COMPANY, ADMIN)
- **Connection** - User-to-user networking
- **Post** - Social feed content
- **Job** - Job listings with monetization
- **Application** - Job applications tracking
- **CompanySubscription** - Subscription management
- **Report** - Content reporting system
- **Page** - CMS pages
- **SeoSetting** - Per-page SEO configuration

### Key Relationships
```
User 1:N Posts
User 1:N Jobs
User M:N Connections
Job 1:N Applications
User 1:N CompanySubscriptions
User 1:N Reports
```

## 🎨 Frontend Tech Stack

- **React 18** with TypeScript
- **React Router** for navigation
- **Zustand** for state management
- **Tailwind CSS** for styling
- **Axios** for API calls
- **React Hook Form** for forms
- **Zod** for validation

### Key Features
- Dark mode support
- Responsive design (mobile-first)
- Error boundaries
- Loading states
- Toast notifications
- SEO optimization

## 🔧 Available Scripts

### Backend
```bash
npm run dev          # Start development server with nodemon
npm run build        # Compile TypeScript
npm start            # Run production server
npx prisma studio    # Open Prisma Studio (DB GUI)
npx prisma migrate dev  # Create new migration
```

### Frontend
```bash
npm run dev          # Start Vite dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## 📊 Admin Panel

Access at: `/admin` (requires ADMIN role)

### Features
- **Dashboard** - Total users, jobs, posts, revenue
- **User Management** - View, ban/unban, delete users
- **Job Management** - Approve, reject, delete jobs
- **Post Management** - Delete inappropriate posts
- **Reports** - Review and resolve user reports
- **Analytics** - User growth, job stats, revenue trends
- **SEO Settings** - Manage meta tags per page
- **Page Management** - Create/edit static pages

## 🐛 Common Issues & Solutions

### Prisma Generate Fails
```bash
# Clear Prisma cache
npx prisma generate --force

# Reinstall Prisma
npm uninstall @prisma/client prisma
npm install -D prisma
npm install @prisma/client
```

### Port Already in Use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or change port in .env
PORT=5001
```

### Email Not Sending
```bash
# Check EMAIL_PROVIDER is set to 'dev' for testing
# Preview URLs will be logged to console
# Example: https://ethereal.email/message/...
```

### JWT Token Errors
```bash
# Ensure secrets are at least 32 characters
# Generate secure secrets:
openssl rand -base64 32
```

## 📈 Production Deployment

### Pre-deployment Checklist
- [ ] Set strong JWT secrets (32+ characters)
- [ ] Configure production database
- [ ] Set up email service (SendGrid/AWS SES)
- [ ] Configure Stripe production keys
- [ ] Set up file storage (Cloudinary/S3)
- [ ] Configure error monitoring (Sentry)
- [ ] Set up SSL certificates
- [ ] Configure CORS for production domain
- [ ] Run database migrations
- [ ] Create admin users
- [ ] Test all critical flows

### Environment Variables (Production)
```bash
NODE_ENV=production
DATABASE_URL=<production-db>
JWT_SECRET=<strong-secret>
JWT_REFRESH_SECRET=<strong-secret>
FRONTEND_URL=https://yourdomain.com
EMAIL_PROVIDER=smtp
STRIPE_SECRET_KEY=sk_live_...
# ... see .env.example for full list
```

## 📝 API Documentation

### Authentication
```
POST /api/auth/register    - Register new user
POST /api/auth/login       - Login
POST /api/auth/refresh     - Refresh access token
POST /api/auth/logout      - Logout
```

### Users
```
GET  /api/users/me         - Get current user
PUT  /api/users/me         - Update profile
GET  /api/users/:id        - Get user by ID
GET  /api/users/preferences - Get notification preferences
PUT  /api/users/preferences - Update preferences
```

### Jobs
```
GET  /api/jobs             - List jobs (with filters)
GET  /api/jobs/:id         - Get job details
POST /api/jobs             - Create job (company only)
PUT  /api/jobs/:id         - Update job
DELETE /api/jobs/:id       - Delete job
```

### Applications
```
GET  /api/applications     - List user's applications
POST /api/applications     - Apply to job
GET  /api/jobs/:jobId/applications - List job applications (company)
PUT  /api/applications/:id/status - Update application status
```

### Connections
```
POST /api/connections/request - Send connection request
PUT  /api/connections/:id/accept - Accept request
PUT  /api/connections/:id/reject - Reject request
GET  /api/connections/my    - Get my connections
DELETE /api/connections/:id - Remove connection
```

### Reports
```
POST /api/reports          - Create report
GET  /api/reports/my       - Get my reports
GET  /api/admin/reports    - List all reports (admin)
PUT  /api/admin/reports/:id - Update report status (admin)
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built with TypeScript, React, Express, Prisma
- Inspired by LinkedIn and Indeed
- Icons from Heroicons
- UI components styled with Tailwind CSS

---

**Need help?** Open an issue or check existing documentation in `/backend/SETUP.md` and `/SEO_AND_ADMIN.md`
