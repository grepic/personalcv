# Installation Notes - Additional Dependencies

## Backend Additional Dependencies Required

The following packages need to be installed in the `backend` directory:

```bash
cd backend

# Required for file uploads
npm install multer
npm install @types/multer --save-dev
```

## Why These Are Needed

### multer
- **Purpose**: Handle multipart/form-data file uploads
- **Used for**: Avatar uploads, portfolio images, CV/resume documents
- **Files**: `src/config/multer.ts`, `src/routes/upload.routes.ts`, `src/controllers/upload.controller.ts`

## Updated Package.json

After installation, your `backend/package.json` dependencies should include:

```json
{
  "dependencies": {
    "@prisma/client": "^5.9.1",
    "bcrypt": "^5.1.1",
    "cookie-parser": "^1.4.6",
    "cors": "^2.8.5",
    "dotenv": "^16.4.1",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.2",
    "multer": "^1.4.5-lts.1",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.2",
    "@types/cookie-parser": "^1.4.6",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/multer": "^1.4.11",
    "@types/node": "^20.11.5",
    "prisma": "^5.9.1",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3"
  }
}
```

## Quick Installation Script

Run this from the project root:

```bash
# Install backend dependencies
cd backend && npm install && npm install multer @types/multer --save-dev

# Install frontend dependencies
cd ../frontend && npm install

# Go back to root
cd ..
```

## Database Migration Required

After installing dependencies, you MUST run Prisma migrations to update the database schema with the new Connection model:

```bash
cd backend

# Generate Prisma Client with new schema
npx prisma generate

# Create and run migration
npx prisma migrate dev --name add_connections_and_uploads

# This will create the Connection table and update the database
```

## New Features Summary

### 1. User Connections (LinkedIn-style networking)
- Send/accept/reject connection requests
- View your network
- Optional message with request
- Backend: `connection.routes.ts`, `connection.controller.ts`
- Frontend: `Network.tsx`, `ConnectionButton.tsx`

### 2. File Uploads
- Upload avatars (images)
- Upload portfolio images
- Upload CV/resume documents
- Local file storage in `backend/uploads/`
- Backend: `upload.routes.ts`, `upload.controller.ts`, `config/multer.ts`

### 3. Payment Integration
- Job posting payments (FREE, STANDARD, FEATURED, PREMIUM)
- Company subscriptions (FREE, PROFESSIONAL, ENTERPRISE)
- Payment history tracking
- Backend: `payment.routes.ts`, `payment.controller.ts`

Note: Payment integration is currently a mock implementation. For production, integrate with:
- Stripe (international)
- GoPay (Czech Republic)
- PayPal
- Or your preferred payment provider

## Environment Variables

Add to `backend/.env`:

```env
# Existing variables...

# File upload (optional - defaults are fine for development)
MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads

# Payment (for production integration)
# STRIPE_SECRET_KEY=sk_test_...
# GOPAY_CLIENT_ID=...
# GOPAY_CLIENT_SECRET=...
```

## API Endpoints Added

### Connections
- `POST /api/connections/request` - Send connection request
- `POST /api/connections/:connectionId/respond` - Accept/reject
- `GET /api/connections/my-connections` - List connections
- `GET /api/connections/pending` - Pending requests
- `DELETE /api/connections/:connectionId` - Remove connection
- `GET /api/connections/status/:userId` - Check connection status

### File Uploads
- `POST /api/upload/avatar` - Upload avatar (multipart/form-data)
- `POST /api/upload/portfolio` - Upload portfolio image
- `POST /api/upload/cv` - Upload CV document
- `DELETE /api/upload/file/:filename` - Delete file
- `GET /uploads/:filename` - Serve uploaded files (static)

### Payments
- `POST /api/payment/job-posting` - Create job payment
- `POST /api/payment/verify/:paymentId` - Verify payment
- `POST /api/payment/subscription` - Create subscription
- `POST /api/payment/subscription/cancel` - Cancel subscription
- `GET /api/payment/history` - Payment history

## Frontend Routes Added

- `/network` - View connections and pending requests
- Connection button on all user profiles

## Testing the New Features

### Test Connections
1. Register two test users
2. Visit user profile
3. Click "Connect" button
4. Switch to other user
5. Go to `/network` → Requests tab
6. Accept the request
7. Both users now see each other in Connections tab

### Test File Upload
1. Go to profile edit
2. Click avatar upload (component needs to be added to UI)
3. Select image file
4. File uploaded to `/uploads` and URL saved to database

### Test Payments
1. Create a job as a company
2. Select pricing tier (STANDARD, FEATURED, or PREMIUM)
3. Submit payment (currently mock - returns success)
4. Job marked as paid with expiration date

## Next Steps for Production

1. **Payment Integration**: Replace mock payment with real provider
2. **Email Service**: Add email notifications (SendGrid, Mailgun)
3. **WebSocket**: Add real-time chat (Socket.io)
4. **Cloud Storage**: Move file uploads to S3/Cloudinary
5. **PDF Parsing**: Add pdf-parse or similar library
6. **Rate Limiting**: Add express-rate-limit
7. **Security**: Add helmet.js, xss-clean, etc.
8. **Monitoring**: Add Sentry or similar
9. **Tests**: Add Jest/Vitest tests
10. **CI/CD**: Set up GitHub Actions

## Troubleshooting

### "Cannot find module 'multer'"
```bash
cd backend
npm install multer @types/multer --save-dev
```

### "Table 'Connection' does not exist"
```bash
cd backend
npx prisma migrate dev
```

### Uploaded files not accessible
Check that `backend/uploads/` directory exists and has proper permissions:
```bash
cd backend
mkdir -p uploads
chmod 755 uploads
```

### TypeScript errors after adding multer
```bash
cd backend
npx tsc --noEmit
# Fix any type errors, then restart dev server
npm run dev
```
