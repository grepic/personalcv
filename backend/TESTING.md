# Testing Guide

Comprehensive testing setup for the NetworkHub backend API.

## 🧪 Test Stack

- **Jest** - Testing framework
- **ts-jest** - TypeScript support for Jest
- **Supertest** - HTTP assertions
- **Prisma** - Database testing

## 📊 Test Coverage

### Current Test Suites

1. **Authentication Tests** (`__tests__/auth.test.ts`)
   - User registration
   - Login/logout
   - Token refresh
   - Rate limiting
   - Banned user handling

2. **Reporting System Tests** (`__tests__/reports.test.ts`)
   - Create reports
   - Admin report management
   - Report filtering and statistics
   - Permission checks

3. **Security Tests** (`__tests__/security.test.ts`)
   - Helmet security headers
   - Rate limiting enforcement
   - Admin middleware
   - Ban middleware
   - Input sanitization
   - CORS headers
   - Body size limits

## ⚙️ Prerequisites

Before running tests, ensure the Prisma Client is generated:

```bash
npx prisma generate
```

**Note:** The Prisma Client must be regenerated after any schema changes. If you see errors like "@prisma/client did not initialize yet", run the command above.

## 🚀 Running Tests

### All Tests
```bash
npm test
```

### Watch Mode (Re-run on changes)
```bash
npm run test:watch
```

### With Coverage Report
```bash
npm run test:coverage
```

### CI/CD Mode
```bash
npm run test:ci
```

## 📋 Test Commands

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Generate coverage report |
| `npm run test:ci` | Run tests for CI/CD pipeline |

## 🎯 Test Structure

```
backend/src/__tests__/
├── setup.ts              # Global test setup and mocks
├── auth.test.ts          # Authentication tests
├── reports.test.ts       # Reporting system tests
└── security.test.ts      # Security middleware tests
```

## ⚙️ Configuration

### jest.config.js
```javascript
{
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts', '**/*.spec.ts'],
  collectCoverageFrom: ['src/**/*.ts'],
  coverageDirectory: 'coverage',
  testTimeout: 10000
}
```

### Test Setup (setup.ts)
- Mocks email service (prevents actual emails)
- Mocks Stripe service (prevents real charges)
- Mocks Prisma Client for consistent DB state
- Increases timeout for long-running tests
- Cleanup after all tests

## 📝 Writing Tests

### Example Test Structure

```typescript
import request from 'supertest';
import app from '../app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Feature Name', () => {
  let userToken: string;

  beforeAll(async () => {
    // Setup: Create test data
    const response = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'Test123!' });
    userToken = response.body.accessToken;
  });

  afterAll(async () => {
    // Cleanup: Delete test data
    await prisma.user.deleteMany({ where: { email: 'test@example.com' } });
    await prisma.$disconnect();
  });

  describe('POST /api/endpoint', () => {
    it('should succeed with valid data', async () => {
      const response = await request(app)
        .post('/api/endpoint')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ data: 'value' })
        .expect(200);

      expect(response.body).toHaveProperty('id');
    });

    it('should fail without authentication', async () => {
      await request(app)
        .post('/api/endpoint')
        .send({ data: 'value' })
        .expect(401);
    });
  });
});
```

## 🔍 Test Best Practices

### 1. Use Descriptive Test Names
```typescript
// ✅ Good
it('should reject login with incorrect password', async () => {});

// ❌ Bad
it('test login', async () => {});
```

### 2. Clean Up After Tests
```typescript
afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: testUser.email } });
  await prisma.$disconnect();
});
```

### 3. Use Proper HTTP Status Assertions
```typescript
// ✅ Good
await request(app).post('/api/login').send(data).expect(200);

// ❌ Less informative
const response = await request(app).post('/api/login').send(data);
expect(response.status).toBe(200);
```

### 4. Test Both Success and Failure Cases
```typescript
describe('POST /api/reports', () => {
  it('should create report successfully', async () => {});
  it('should reject without authentication', async () => {});
  it('should reject self-reporting', async () => {});
  it('should reject duplicate report', async () => {});
});
```

### 5. Use Realistic Test Data
```typescript
const testUser = {
  email: 'realistic-email@example.com',
  password: 'SecurePassword123!',
  displayName: 'John Doe',
};
```

## 📊 Coverage Goals

| Category | Target | Current |
|----------|--------|---------|
| Overall | 80% | TBD |
| Controllers | 90% | TBD |
| Middleware | 95% | TBD |
| Services | 85% | TBD |

Run `npm run test:coverage` to check current coverage.

## 🐛 Debugging Tests

### Run Single Test File
```bash
npx jest auth.test.ts
```

### Run Tests Matching Pattern
```bash
npx jest --testNamePattern="login"
```

### Verbose Output
```bash
npx jest --verbose
```

### Debug Mode
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

## ⚠️ Common Issues

### Issue: Tests Timeout
**Solution:** Increase timeout in jest.config.js or specific test:
```typescript
it('slow test', async () => {
  // test code
}, 15000); // 15 second timeout
```

### Issue: Database Connection Errors
**Solution:** Ensure test database is running and accessible:
```bash
psql -U postgres -c "CREATE DATABASE networking_platform_test;"
```

### Issue: Port Already in Use
**Solution:** Tests don't actually start the server, they use supertest which handles this.

### Issue: Prisma Client Not Generated
**Symptoms:** Error message "@prisma/client did not initialize yet"

**Solution:**
```bash
# Generate Prisma Client
npx prisma generate

# Run tests
npm test
```

**Important:** After schema changes (adding/modifying models, enums, or fields in `prisma/schema.prisma`), you MUST regenerate the Prisma Client before running tests. The tests import types (like `Role`, `ReportType`, `ReportStatus`) from `@prisma/client` which are only available after generation.

## 🔄 CI/CD Integration

### GitHub Actions Example
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npx prisma generate
      - run: npm run test:ci
```

### GitLab CI Example
```yaml
test:
  image: node:18
  script:
    - npm install
    - npx prisma generate
    - npm run test:ci
  coverage: '/All files[^|]*\|[^|]*\s+([\d\.]+)/'
```

## 📈 Expanding Test Coverage

### Next Tests to Write

1. **Job System**
   - Job creation
   - Job applications
   - Application status updates
   - Job expiration

2. **User Profile**
   - Profile updates
   - CV upload and parsing
   - Skills management
   - Experience/education CRUD

3. **Social Features**
   - Connections
   - Posts and comments
   - Reactions
   - Following companies

4. **Payment System**
   - Job payment creation
   - Subscription management
   - Webhook handling

5. **Admin Features**
   - User ban/unban
   - Content moderation
   - Analytics endpoints

## 🎓 Testing Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

## ✅ Test Checklist

Before committing code:
- [ ] All tests pass (`npm test`)
- [ ] New features have tests
- [ ] Test coverage is maintained or improved
- [ ] Tests are descriptive and clear
- [ ] Cleanup is performed in `afterAll`/`afterEach`
- [ ] No console.log statements left in tests
- [ ] Async operations use await properly

---

**Current Status:** ✅ Testing infrastructure complete with 3 test suites covering authentication, reporting, and security.
