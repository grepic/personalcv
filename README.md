# Networking Platform MVP

A comprehensive web application combining features of LinkedIn, Facebook, and Indeed. This platform enables professional networking, job searching, freelance services marketplace, and recruitment.

## Features

### Core Features
- **Multiple User Roles**: Users can be job seekers, freelancers, or company recruiters (or multiple roles simultaneously)
- **Professional Profiles**: Customizable CV-style profiles with multiple templates
- **Social Feed**: Posts including status updates, portfolio showcases, and job listings
- **Job Marketplace**: Post jobs, search, filter, and apply to opportunities
- **Freelance Services**: Showcase and price freelance services
- **Company Recruitment Tools**: Internal candidate reviews, comments, and application tracking
- **Messaging**: Direct messaging between users
- **Notifications**: Real-time notifications for jobs, applications, and messages
- **Follow System**: Follow companies and roles to get personalized job recommendations

### User Roles
- **Candidate**: Looking for full-time, part-time, or internship positions
- **Freelancer**: Offering services with pricing and delivery timelines
- **Company/Recruiter**: Posting jobs, searching candidates, managing applications

## Tech Stack

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (access + refresh tokens)
- **Password Hashing**: bcrypt

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Date Formatting**: date-fns

## Project Structure

```
networking-platform/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema
│   │   └── seed.ts             # Seed data
│   ├── src/
│   │   ├── controllers/        # Request handlers
│   │   ├── middlewares/        # Auth, error handling
│   │   ├── routes/             # API routes
│   │   ├── services/           # Business logic
│   │   ├── types/              # TypeScript types
│   │   ├── utils/              # Utilities (JWT, Prisma)
│   │   ├── app.ts              # Express app setup
│   │   └── server.ts           # Server entry point
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── pages/              # Page components
│   │   ├── services/           # API client
│   │   ├── store/              # State management
│   │   ├── types/              # TypeScript types
│   │   ├── App.tsx             # Main app component
│   │   └── main.tsx            # Entry point
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

## Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd networking-platform
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Database Setup

#### Create PostgreSQL Database

```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE networking_platform;

# Exit psql
\q
```

#### Configure Environment Variables

Create `.env` file in the `backend` directory:

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` with your configuration:

```env
# Database
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/networking_platform?schema=public"

# JWT Secrets (change these in production!)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-this-in-production"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Server
PORT=5000
NODE_ENV=development

# CORS
FRONTEND_URL="http://localhost:3000"
```

#### Run Database Migrations

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

#### Seed the Database

```bash
npm run prisma:seed
```

This will create test accounts:
- **Candidate**: john.doe@example.com / password123
- **Freelancer**: anna.smith@example.com / password123
- **Company**: hr@techcompany.com / password123
- **Recruiter**: recruiter@techcompany.com / password123

### 4. Run the Application

#### Development Mode

From the root directory:

```bash
# Run both backend and frontend concurrently
npm run dev
```

Or run them separately:

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/health

### 5. Build for Production

```bash
# Build both backend and frontend
npm run build

# Or build separately
cd backend && npm run build
cd frontend && npm run build
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Users
- `POST /api/users/onboarding` - Complete user onboarding
- `GET /api/users/profile/:userId` - Get user profile
- `PUT /api/users/profile` - Update profile
- `POST /api/users/skills` - Add skill
- `DELETE /api/users/skills/:skillId` - Remove skill
- `POST /api/users/experience` - Add experience
- `PUT /api/users/experience/:experienceId` - Update experience
- `DELETE /api/users/experience/:experienceId` - Delete experience
- `GET /api/users/search` - Search users

### Posts & Feed
- `GET /api/posts/feed` - Get feed
- `POST /api/posts` - Create post
- `GET /api/posts/:postId` - Get post details

### Jobs
- `POST /api/jobs` - Create job (company only)
- `GET /api/jobs` - List jobs with filters
- `GET /api/jobs/:jobId` - Get job details
- `PUT /api/jobs/:jobId` - Update job
- `PATCH /api/jobs/:jobId/status` - Update job status

### Applications
- `POST /api/applications/jobs/:jobId/apply` - Apply to job
- `GET /api/applications/jobs/:jobId/applications` - Get job applications (company)
- `PATCH /api/applications/:applicationId/status` - Update application status
- `GET /api/applications/my-applications` - Get user's applications

### Notifications
- `GET /api/notifications` - Get notifications
- `PATCH /api/notifications/:notificationId/read` - Mark as read
- `PATCH /api/notifications/read-all` - Mark all as read

### Follow
- `POST /api/follow/companies/:companyId` - Follow company
- `DELETE /api/follow/companies/:companyId` - Unfollow company
- `GET /api/follow/companies` - Get followed companies
- `POST /api/follow/roles` - Add followed role
- `DELETE /api/follow/roles/:roleId` - Remove followed role
- `GET /api/follow/roles` - Get followed roles

### Messages
- `GET /api/messages/conversations` - Get conversations
- `GET /api/messages/conversations/:conversationId/messages` - Get messages
- `POST /api/messages/conversations/:conversationId/messages` - Send message
- `POST /api/messages/conversations/start` - Start conversation

### Candidate Reviews (Company Internal)
- `POST /api/candidates/:candidateId/reviews` - Create review
- `GET /api/candidates/:candidateId/reviews` - Get reviews
- `PUT /api/reviews/:reviewId` - Update review

### Candidate Comments (Company Internal)
- `POST /api/candidates/:candidateId/comments` - Create comment
- `GET /api/candidates/:candidateId/comments` - Get comments
- `PUT /api/comments/:commentId` - Update comment

## Key Features Explained

### 1. Multi-Role System
Users can have multiple roles simultaneously. For example, a user can be both looking for a job and offering freelance services. The system tracks:
- `roles`: Array of user roles (CANDIDATE, FREELANCER, COMPANY)
- `isLookingForJob`: Boolean flag
- `isOfferingFreelance`: Boolean flag

### 2. Profile Templates
Users can select different visual templates for their profile:
- `minimal_light`: Clean, white background
- `modern_dark`: Dark mode, modern cards
- (Extensible to more templates)

### 3. Internal Company Tools
Companies have access to:
- **Candidate Reviews**: Structured interview scorecards with ratings and recommendations
- **Candidate Comments**: Google Docs-style inline comments on CV sections, threaded discussions, resolvable comments

### 4. Job Notifications
Users receive notifications when:
- Companies they follow post new jobs
- Jobs matching their skills are posted
- Their application status changes

### 5. Freelancer Services
Freelancers can create service listings with:
- Name and description
- Price and currency
- Delivery time
- (Can be extended with tiers, packages, etc.)

## Database Schema

The database uses PostgreSQL with the following main tables:

- `User` - Core user data
- `UserSkill`, `UserLanguage` - User skills and languages
- `Education`, `Experience`, `Certification` - CV sections
- `PortfolioProject` - Portfolio items
- `FreelancerService` - Freelance service listings
- `Post` - Social feed posts
- `Job`, `JobSkill` - Job listings
- `Application` - Job applications
- `Notification` - User notifications
- `UserPreferences` - User settings
- `UserFollowCompany`, `UserFollowRole` - Follow system
- `CandidateReview` - Internal reviews (company-only)
- `CandidateComment` - Internal comments (company-only)
- `Conversation`, `Message` - Messaging system

## Development Notes

### Authentication Flow
1. User registers → receives access token + refresh token
2. Access token expires in 15 minutes
3. Frontend automatically refreshes using refresh token
4. Refresh tokens stored in database, access tokens in memory

### Authorization
- Route-level protection using JWT middleware
- Role-based access control for company-only features
- Ownership checks for editing resources

### Future Enhancements
- Real-time messaging with WebSockets
- File upload for avatars and portfolio media
- Advanced search with Elasticsearch
- Email notifications
- Analytics dashboard for companies
- Premium features / subscriptions
- Video interviews
- Calendar integration
- API rate limiting
- Multi-language support

## Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Port Already in Use
```bash
# Change PORT in backend/.env
PORT=5001

# Update frontend proxy in frontend/vite.config.ts
```

### Prisma Issues
```bash
# Reset database
cd backend
npx prisma migrate reset

# Regenerate Prisma client
npm run prisma:generate
```

## License

MIT

## Authors

Built as an MVP demonstrating modern full-stack development with TypeScript, React, and PostgreSQL.
