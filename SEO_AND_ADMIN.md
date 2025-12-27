# 🔍 SEO & Admin Panel Documentation

Kompletní průvodce SEO optimalizací a Admin panelem pro NetworkHub platformu.

---

## 📈 SEO Optimization

### **1. Meta Tags & Open Graph**

#### SEO Component
Použití v React komponentách:

```jsx
import SEO, { StructuredData, generateStructuredData } from '../components/SEO';

// V komponentě
<SEO
  title="Frontend Developer - Prague | NetworkHub"
  description="Join our team as a Frontend Developer in Prague. React, TypeScript, remote work available."
  keywords="frontend developer, react, prague, jobs"
  image="/job-social-preview.png"
  type="article"
/>
```

#### Varianty pro různé typy stránek:

**Homepage:**
```jsx
<SEO
  title="NetworkHub - Professional Networking & Jobs"
  description="Connect with professionals and find your dream job"
  type="website"
/>
```

**Job Posting:**
```jsx
<SEO
  title={`${job.title} - ${company.name}`}
  description={job.description}
  type="article"
  publishedTime={job.createdAt}
/>
```

**User Profile:**
```jsx
<SEO
  title={`${user.displayName} - ${user.headline}`}
  description={user.about}
  type="profile"
/>
```

### **2. Structured Data (Schema.org)**

#### Job Posting Schema
```jsx
import { StructuredData, generateStructuredData } from '../components/SEO';

const jobSchema = generateStructuredData({
  type: 'JobPosting',
  name: 'Frontend Developer',
  description: 'We are looking for...',
  datePosted: '2024-01-15',
  validThrough: '2024-02-15',
  hiringOrganization: 'Company Name',
  location: 'Prague, Czech Republic',
  salary: {
    min: 50000,
    max: 80000,
    currency: 'CZK',
  },
});

// V komponentě
<StructuredData data={jobSchema} />
```

#### Organization Schema
```jsx
const orgSchema = generateStructuredData({
  type: 'Organization',
  name: 'NetworkHub',
  description: 'Professional networking platform',
  url: 'https://networkhub.cz',
  logo: 'https://networkhub.cz/logo.png',
});

<StructuredData data={orgSchema} />
```

### **3. Sitemap.xml**

**Automaticky generovaný sitemap:**
- Přístupný na: `https://networkhub.cz/sitemap.xml`
- Obsahuje:
  - Homepage
  - Jobs page
  - Feed page
  - Všechny aktivní job postings (max 1000)
  - Všechny public user profiles (max 1000)

**Aktualizace:**
Sitemap se generuje dynamicky při každém requestu, takže je vždy aktuální.

**Frekvence crawlování:**
- Homepage: daily, priority 1.0
- Jobs page: daily, priority 0.9
- Feed: hourly, priority 0.8
- Individual jobs: weekly, priority 0.7
- User profiles: weekly, priority 0.6

### **4. Robots.txt**

Umístění: `/frontend/public/robots.txt`

**Povolené:**
- Všechny public stránky
- Jobs, profiles, feed

**Blokované:**
- `/api/` - Backend API
- `/admin/` - Admin panel
- `/settings` - Uživatelská nastavení
- `/messages` - Soukromé zprávy
- `/profile/edit` - Editace profilu

**Blokované boty:**
- AhrefsBot
- SemrushBot
- MJ12bot
- DotBot

### **5. Best Practices**

#### Unique Titles
Každá stránka má unikátní title:
```
Homepage: "NetworkHub - Professional Networking & Jobs"
Job: "Frontend Developer - Company Name | NetworkHub"
Profile: "Jan Novák - Senior Developer | NetworkHub"
```

#### Meta Descriptions
- Délka: 150-160 znaků
- Obsahuje klíčová slova
- Popisuje obsah stránky

#### Canonical URLs
Automaticky nastaveno pro každou stránku:
```html
<link rel="canonical" href="https://networkhub.cz/jobs/123" />
```

#### Language Tags
```html
<link rel="alternate" hrefLang="cs" href="https://networkhub.cz" />
<link rel="alternate" hrefLang="en" href="https://networkhub.com" />
```

### **6. Social Media Optimization**

#### Open Graph (Facebook)
- og:title
- og:description
- og:image (1200x630px)
- og:url
- og:type

#### Twitter Cards
- twitter:card (summary_large_image)
- twitter:title
- twitter:description
- twitter:image

### **7. Performance SEO**

#### Image Optimization
```jsx
<img
  src={job.image}
  alt={job.title}
  loading="lazy"
  width="600"
  height="400"
/>
```

#### Code Splitting
React lazy loading pro lepší performance:
```jsx
const AdminDashboard = React.lazy(() => import('./pages/Admin/AdminDashboard'));
```

---

## 👨‍💼 Admin Panel

### **Přístup k Admin Panelu**

**URL:** `https://networkhub.cz/admin`

**Autentizace:**
1. Nastavit admin emailyadd v `.env`:
```bash
ADMIN_EMAILS=admin@networkhub.cz,owner@company.com
```

2. Přihlásit se s admin účtem
3. Navigovat na `/admin`

**Bezpečnost:**
- Všechny admin endpointy vyžadují autentizaci
- Middleware kontroluje admin email
- Rate limiting na admin operacích

### **Admin Dashboard**

#### **Hlavní Statistiky**

Zobrazuje:
- **Total Users** - Celkový počet uživatelů
- **Total Jobs** - Celkový počet job postingů
- **Total Posts** - Celkový počet příspěvků
- **Revenue** - Celkový příjem z plateb

Plus denní změny:
- Noví uživatelé dnes
- Nové joby dnes
- Aktivní uživatelé (poslední 7 dní)

#### **Quick Actions**

Tři hlavní sekce:
1. **User Management** - Správa uživatelů
2. **Job Management** - Moderace jobů
3. **Analytics** - Analytika platformy

### **API Endpointy**

#### **Dashboard Stats**
```
GET /api/admin/stats
```

Response:
```json
{
  "totalUsers": 1250,
  "totalJobs": 345,
  "totalPosts": 2890,
  "totalApplications": 678,
  "activeUsers": 234,
  "newUsersToday": 12,
  "newJobsToday": 5,
  "revenue": 149500
}
```

#### **User Management**

**Get All Users:**
```
GET /api/admin/users?page=1&limit=20&search=query
```

**Get User Details:**
```
GET /api/admin/users/:userId
```

**Ban User:**
```
PUT /api/admin/users/:userId/ban
Body: { "reason": "Spam" }
```

**Unban User:**
```
PUT /api/admin/users/:userId/unban
```

**Delete User:**
```
DELETE /api/admin/users/:userId
```

#### **Job Management**

**Get All Jobs:**
```
GET /api/admin/jobs?page=1&limit=20
```

**Approve Job:**
```
PUT /api/admin/jobs/:jobId/approve
```

**Reject Job:**
```
PUT /api/admin/jobs/:jobId/reject
Body: { "reason": "Inappropriate content" }
```

**Delete Job:**
```
DELETE /api/admin/jobs/:jobId
```

#### **Post Management**

**Get All Posts:**
```
GET /api/admin/posts?page=1&limit=20
```

**Delete Post:**
```
DELETE /api/admin/posts/:postId
```

#### **Analytics**

**User Analytics:**
```
GET /api/admin/analytics/users?days=30
```

**Job Analytics:**
```
GET /api/admin/analytics/jobs?days=30
```

Response:
```json
{
  "jobsByType": [
    { "employmentType": "FULL_TIME", "_count": 150 },
    { "employmentType": "PART_TIME", "_count": 45 }
  ],
  "jobsByStatus": [
    { "status": "OPEN", "_count": 123 },
    { "status": "CLOSED", "_count": 72 }
  ],
  "topLocations": [
    { "location": "Prague", "_count": 89 },
    { "location": "Brno", "_count": 34 }
  ]
}
```

**Revenue Analytics:**
```
GET /api/admin/analytics/revenue?days=30
```

Response:
```json
{
  "totalRevenue": 149500,
  "totalPaidJobs": 15,
  "revenueByTier": [
    { "pricingTier": "STANDARD", "_sum": { "paymentAmount": 49900 } },
    { "pricingTier": "FEATURED", "_sum": { "paymentAmount": 59940 } }
  ],
  "recentPayments": [...]
}
```

### **Frontend Components**

#### **AdminDashboard Component**

```jsx
import AdminDashboard from './pages/Admin/AdminDashboard';

// V App.tsx
<Route path="/admin" element={<AdminDashboard />} />
```

Zobrazuje:
- Statistiky v kartách
- Quick action linky
- Moderní dashboard design

### **Oprávnění**

**Admin Operations:**
- ✅ View all users
- ✅ Ban/unban users
- ✅ Delete users
- ✅ View all jobs
- ✅ Approve/reject jobs
- ✅ Delete jobs
- ✅ Delete posts
- ✅ View analytics
- ✅ View revenue data

**Security:**
```typescript
// Middleware check
export const requireAdmin = async (req, res, next) => {
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
  const isAdmin = adminEmails.includes(user?.email);

  if (!isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
};
```

### **Budoucí Rozšíření**

Připraveno k implementaci:

1. **Reporting System**
   - User reports
   - Content moderation
   - Abuse detection

2. **Advanced Analytics**
   - Conversion tracking
   - User behavior analytics
   - Revenue forecasting

3. **Bulk Operations**
   - Bulk user actions
   - Bulk content moderation
   - Export data

4. **Email Notifications**
   - Admin alerts
   - Moderation notifications
   - System warnings

---

## 🔧 Setup Instructions

### **Backend Configuration**

1. **Add to `.env`:**
```bash
# Admin emails (comma-separated)
ADMIN_EMAILS=admin@networkhub.cz,owner@company.com

# SEO
FRONTEND_URL=https://networkhub.cz
```

2. **Ensure routes are registered** (already done):
```typescript
app.use('/api/admin', adminRoutes);
app.use(seoRoutes);
```

### **Frontend Setup**

1. **Install react-helmet-async:**
```bash
cd frontend
npm install react-helmet-async
```

2. **Wrap App with HelmetProvider:**
```jsx
import { HelmetProvider } from 'react-helmet-async';

<HelmetProvider>
  <App />
</HelmetProvider>
```

3. **Use SEO component:**
```jsx
import SEO from './components/SEO';

<SEO
  title="Page Title"
  description="Page description"
/>
```

### **Google Search Console**

1. Verify ownership with meta tag or DNS
2. Submit sitemap: `https://networkhub.cz/sitemap.xml`
3. Monitor crawl stats
4. Check for errors

### **Analytics Integration**

Připraveno pro:
- Google Analytics 4
- Google Tag Manager
- Facebook Pixel
- LinkedIn Insight Tag

---

## ✅ Checklist

### **SEO**
- [x] Meta tags component
- [x] Open Graph tags
- [x] Twitter Cards
- [x] Structured data (Schema.org)
- [x] Sitemap.xml generation
- [x] Robots.txt
- [x] Canonical URLs
- [x] Language tags
- [ ] Google Search Console (setup required)
- [ ] Analytics tracking (optional)

### **Admin Panel**
- [x] Dashboard with stats
- [x] User management API
- [x] Job management API
- [x] Post management API
- [x] Analytics API
- [x] Revenue tracking
- [x] Admin authentication
- [x] Frontend dashboard
- [ ] Reporting system (future)
- [ ] Email notifications (future)

---

## 🚀 Production Recommendations

### **SEO**
1. Generate static OG images for social sharing
2. Set up Google Search Console
3. Create blog for content marketing
4. Build quality backlinks
5. Monitor Core Web Vitals

### **Admin**
1. Set up monitoring/alerts
2. Create backup/restore system
3. Add audit logging
4. Implement role-based access control (RBAC)
5. Add IP whitelist for admin access

### **Security**
1. Rate limit admin endpoints
2. Add CAPTCHA for sensitive operations
3. Log all admin actions
4. 2FA for admin accounts
5. Regular security audits

---

## 📊 Success Metrics

**SEO Goals:**
- Organic traffic: 1000+ visitors/month
- Google index: 500+ pages
- Average CTR: 3%+
- Top 10 rankings for target keywords

**Admin Efficiency:**
- User moderation time: <5 min/report
- Job approval time: <2 min/job
- Dashboard load time: <1s
- Admin actions logged: 100%

---

**Platform je nyní připravena pro SEO a efektivní správu! 🎉**
