# Development Package 2: Authentication & Authorization - Detailed Implementation Plan

**Package**: Development Package 2 - Authentication & Authorization  
**Status**: 📋 PLANNING  
**Dependencies**: Package 1 (Platform Foundation) - ✅ COMPLETE  
**Blocks**: Package 3 (Business Logic Layer)  
**Estimated Effort**: 5-7 days  
**Created**: 2026-07-10  

---

## Executive Summary

Package 2 implements secure authentication and authorization for the Bidra platform. This includes user registration/login, JWT token management, role-based access control (RBAC), password management, and email verification. The implementation follows Norwegian data protection requirements (GDPR compliance) and uses industry-standard security practices.

**Key Deliverables:**
1. User registration and login endpoints
2. JWT-based authentication system
3. Password hashing with bcrypt
4. Email verification workflow
5. Password reset functionality
6. Role-based authorization guards
7. Session management
8. OAuth 2.0 integration (Vipps, Facebook, Google)
9. Security middleware and rate limiting
10. Comprehensive testing suite

---

## 1. Requirements Analysis

### 1.1 PDF Document Analysis

**Source Documents:**
1. `PACKAGE_2.pdf` - Core authentication requirements
2. `Engineering_Standards_1.pdf` - Security standards and patterns
3. `AI_Development_Instructions.pdf` - Development protocols
4. `VOLUME_12_Part_1_-_AI_Master_Build_Specification.pdf` - Overall architecture
5. `Volume_12_Part_5-Authentication_Identity_Module_Build_Prompt.pdf` - Detailed auth specs
6. `Volume_13-_Development_Roadmap_Sprint_Plan.pdf` - Sprint planning

**Key Requirements Extracted:**
- Multi-factor authentication support
- Norwegian BankID integration consideration
- GDPR compliance (data minimization, consent tracking)
- Audit logging for security events
- Rate limiting on auth endpoints
- Account lockout after failed attempts
- Password complexity requirements
- Token refresh mechanism
- Logout (token invalidation)
- "Remember me" functionality

### 1.2 Functional Requirements

**FR-1: User Registration**
- Email/password registration
- Name and phone (optional) collection
- Language preference (default: Norwegian)
- Email verification before account activation
- GDPR consent tracking
- Duplicate email prevention

**FR-2: User Login**
- Email and password authentication
- JWT token generation (access + refresh tokens)
- "Remember me" option (extended refresh token)
- Account status verification (not suspended)
- Failed login attempt tracking
- Account lockout after 5 failed attempts

**FR-3: Password Management**
- Bcrypt hashing (cost factor: 12)
- Password complexity requirements:
  - Minimum 8 characters
  - At least 1 uppercase letter
  - At least 1 lowercase letter
  - At least 1 number
  - At least 1 special character
- Password reset via email
- Password reset token expiry (1 hour)
- Password history (prevent reuse of last 3 passwords)

**FR-4: Email Verification**
- Verification token generation on registration
- Email with verification link
- Token expiry (24 hours)
- Resend verification email
- Account activation on verification

**FR-5: Token Management**
- JWT access tokens (short-lived: 15 minutes)
- JWT refresh tokens (long-lived: 7 days, or 30 days with "remember me")
- Token payload: userId, email, role, status
- Token refresh endpoint
- Token revocation (logout)
- Refresh token rotation (on refresh)

**FR-6: Authorization (RBAC)**
- Three roles: USER, ORG_ADMIN, PLATFORM_ADMIN
- Role-based guards for API endpoints
- Permission checking middleware
- Organization ownership verification (for ORG_ADMIN)
- Resource-level authorization

**FR-7: OAuth 2.0 Social Login**
- Vipps integration (Norwegian mobile payment/ID)
- Facebook login
- Google login
- Account linking (merge social with email accounts)
- Social profile data import

**FR-8: Security Features**
- Rate limiting (5 requests/minute for login, 3/minute for registration)
- CORS configuration
- Helmet.js security headers
- CSRF protection
- XSS prevention
- SQL injection prevention (via Prisma)
- Account lockout after failed attempts
- Audit logging for security events

**FR-9: Session Management**
- Stateless JWT authentication (no server-side sessions)
- Refresh token storage in database for revocation
- Device tracking (optional: track login devices)
- "Logout everywhere" functionality (revoke all refresh tokens)

### 1.3 Non-Functional Requirements

**NFR-1: Security**
- OWASP Top 10 compliance
- HTTPS-only in production
- Secure password storage (bcrypt)
- Protection against brute force attacks
- Token signing with HS256 or RS256
- Environment-based secrets (never hardcoded)

**NFR-2: Performance**
- Login response time: <200ms
- Token verification: <50ms
- Password hashing: <500ms
- Concurrent logins: 1000/second

**NFR-3: Compliance**
- GDPR compliance (Norway/EU)
- Data minimization
- Right to be forgotten (account deletion)
- Consent tracking
- Data breach notification readiness

**NFR-4: Observability**
- Structured logging (JSON format)
- Audit trail for authentication events
- Failed login monitoring
- Token refresh rate monitoring
- Error tracking and alerting

---

## 2. Architecture Design

### 2.1 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Login Page  │  │ Register    │  │ Profile     │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│         │                 │                 │               │
│         └─────────────────┴─────────────────┘               │
│                           │                                 │
│                    API Requests                             │
│                    (JWT in Header)                          │
└───────────────────────────┼─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway (NestJS)                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Authentication Module                   │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │   │
│  │  │ Auth         │  │ JWT          │  │ Passport │ │   │
│  │  │ Controller   │  │ Strategy     │  │ (OAuth)  │ │   │
│  │  └──────────────┘  └──────────────┘  └──────────┘ │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │   │
│  │  │ Auth         │  │ Token        │  │ Guards   │ │   │
│  │  │ Service      │  │ Service      │  │ (RBAC)   │ │   │
│  │  └──────────────┘  └──────────────┘  └──────────┘ │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Authorization Middleware                │   │
│  │  - JwtAuthGuard                                     │   │
│  │  - RolesGuard                                       │   │
│  │  - OwnershipGuard                                   │   │
│  └─────────────────────────────────────────────────────┘   │
└───────────────────────────┼─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Database Layer (Package 1)                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ User        │  │ RefreshToken│  │ AuditLog    │        │
│  │ Repository  │  │ Repository  │  │ Repository  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│         │                 │                 │               │
└─────────┼─────────────────┼─────────────────┼───────────────┘
          │                 │                 │
          ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────┐
│                   PostgreSQL Database                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ users       │  │ refresh_     │  │ audit_logs  │        │
│  │             │  │ tokens       │  │             │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Database Schema Extensions

**New Tables:**

```prisma
model RefreshToken {
  id           String    @id @default(cuid())
  userId       String
  token        String    @unique // Hashed refresh token
  expiresAt    DateTime
  createdAt    DateTime  @default(now())
  revokedAt    DateTime?
  replacedBy   String?   // Token ID that replaced this one
  
  // Device tracking (optional)
  userAgent    String?
  ipAddress    String?
  
  user         User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([token])
  @@index([expiresAt])
}

model AuditLog {
  id          String    @id @default(cuid())
  userId      String?   // Null for failed logins
  action      String    // LOGIN, LOGOUT, REGISTER, PASSWORD_RESET, etc.
  details     Json?     // Additional context
  ipAddress   String?
  userAgent   String?
  success     Boolean   @default(true)
  createdAt   DateTime  @default(now())
  
  @@index([userId])
  @@index([action])
  @@index([createdAt(sort: Desc)])
}
```

**User Table Extensions:**

```prisma
model User {
  // ... existing fields ...
  
  // Authentication fields
  passwordHash        String?   // Null for social-only accounts
  emailVerified       Boolean   @default(false)
  emailVerificationToken String? @unique
  emailVerificationExpiry DateTime?
  
  passwordResetToken  String?   @unique
  passwordResetExpiry DateTime?
  
  // Security
  failedLoginAttempts Int       @default(0)
  accountLockedUntil  DateTime?
  lastLoginAt         DateTime?
  
  // OAuth
  vippsId             String?   @unique
  facebookId          String?   @unique
  googleId            String?   @unique
  
  // Password history (JSON array of hashed passwords)
  passwordHistory     Json?
  
  // Relations
  refreshTokens       RefreshToken[]
  auditLogs           AuditLog[]
}
```

### 2.3 Technology Stack

**Backend (NestJS):**
- `@nestjs/passport` - Authentication framework
- `@nestjs/jwt` - JWT token generation/verification
- `passport-jwt` - JWT strategy for Passport
- `passport-local` - Local strategy for email/password
- `passport-google-oauth20` - Google OAuth
- `passport-facebook` - Facebook OAuth
- `bcrypt` - Password hashing
- `class-validator` - Request validation
- `class-transformer` - DTO transformation
- `@nestjs/throttler` - Rate limiting

**Frontend (Next.js):**
- `next-auth` (optional) or custom JWT client
- `jose` - JWT verification in middleware
- `zod` - Form validation

**Security:**
- `helmet` - Security headers
- `express-rate-limit` - Additional rate limiting
- `csurf` (or CSRF tokens) - CSRF protection

---

## 3. Implementation Phases

### Phase 1: Database Schema Extensions (Day 1)
**Duration**: 4 hours  
**Files**: 3 new, 2 modified

**Tasks:**
1. Add RefreshToken model to Prisma schema
2. Add AuditLog model to Prisma schema
3. Extend User model with auth fields
4. Create RefreshTokenRepository
5. Create AuditLogRepository
6. Generate and apply migration
7. Update seed script with test users (with hashed passwords)

**Deliverables:**
- `packages/database/schema.prisma` (updated)
- `packages/database/src/repositories/refresh-token.repository.ts` (new)
- `packages/database/src/repositories/audit-log.repository.ts` (new)
- `packages/database/migrations/002_add_auth_tables.sql` (new)
- `packages/database/seed.ts` (updated)

**Validation:**
- Migration applies successfully
- Seed creates users with hashed passwords
- Repositories pass unit tests

---

### Phase 2: TypeScript Types & DTOs (Day 1)
**Duration**: 3 hours  
**Files**: 8 new

**Tasks:**
1. Create authentication DTOs (RegisterDto, LoginDto, etc.)
2. Create JWT payload interfaces
3. Create auth response types
4. Create password validation utilities
5. Add auth-related enums

**Deliverables:**
- `packages/types/src/auth/dtos.ts` (new)
- `packages/types/src/auth/jwt.types.ts` (new)
- `packages/types/src/auth/responses.ts` (new)
- `packages/types/src/domain/refresh-token.ts` (new)
- `packages/types/src/domain/audit-log.ts` (new)

**Validation:**
- All types compile without errors
- DTOs have proper validation decorators

---

### Phase 3: Core Authentication Service (Day 2)
**Duration**: 8 hours  
**Files**: 6 new

**Tasks:**
1. Create AuthService with core methods:
   - `register()`
   - `login()`
   - `validateUser()`
   - `hashPassword()`
   - `comparePassword()`
   - `generateTokens()`
   - `verifyEmail()`
   - `requestPasswordReset()`
   - `resetPassword()`
2. Create TokenService for JWT operations
3. Implement password hashing with bcrypt
4. Implement email verification logic
5. Implement password reset logic
6. Add rate limiting

**Deliverables:**
- `apps/api/src/modules/auth/auth.service.ts` (new)
- `apps/api/src/modules/auth/token.service.ts` (new)
- `apps/api/src/modules/auth/password.service.ts` (new)
- `apps/api/src/modules/auth/email-verification.service.ts` (new)
- `apps/api/src/modules/auth/audit.service.ts` (new)
- `apps/api/src/modules/auth/auth.module.ts` (new)

**Validation:**
- Unit tests for password hashing/comparison
- Unit tests for token generation/verification
- Unit tests for email verification flow
- Unit tests for password reset flow

---

### Phase 4: Passport Strategies & Guards (Day 2-3)
**Duration**: 6 hours  
**Files**: 8 new

**Tasks:**
1. Implement JWT strategy for Passport
2. Implement Local strategy for email/password
3. Create JwtAuthGuard
4. Create RolesGuard (RBAC)
5. Create OwnershipGuard (resource ownership)
6. Create decorator for getting current user
7. Create decorator for requiring roles

**Deliverables:**
- `apps/api/src/modules/auth/strategies/jwt.strategy.ts` (new)
- `apps/api/src/modules/auth/strategies/local.strategy.ts` (new)
- `apps/api/src/modules/auth/guards/jwt-auth.guard.ts` (new)
- `apps/api/src/modules/auth/guards/roles.guard.ts` (new)
- `apps/api/src/modules/auth/guards/ownership.guard.ts` (new)
- `apps/api/src/modules/auth/decorators/current-user.decorator.ts` (new)
- `apps/api/src/modules/auth/decorators/roles.decorator.ts` (new)
- `apps/api/src/modules/auth/decorators/public.decorator.ts` (new)

**Validation:**
- JWT strategy validates tokens correctly
- Local strategy authenticates users correctly
- Guards protect routes as expected
- Decorators extract user info correctly

---

### Phase 5: Authentication Controller & Endpoints (Day 3)
**Duration**: 6 hours  
**Files**: 3 new

**Tasks:**
1. Create AuthController with endpoints:
   - POST /auth/register
   - POST /auth/login
   - POST /auth/refresh
   - POST /auth/logout
   - POST /auth/verify-email
   - POST /auth/resend-verification
   - POST /auth/forgot-password
   - POST /auth/reset-password
   - GET /auth/me (current user)
2. Add validation pipes
3. Add Swagger/OpenAPI documentation
4. Add rate limiting decorators

**Deliverables:**
- `apps/api/src/modules/auth/auth.controller.ts` (new)
- `apps/api/src/modules/auth/dto/index.ts` (new)
- `apps/api/src/main.ts` (updated - add global guards)

**Validation:**
- All endpoints respond correctly
- Validation rejects invalid input
- Rate limiting works
- Swagger docs generated

---

### Phase 6: OAuth 2.0 Integration (Day 4)
**Duration**: 8 hours  
**Files**: 6 new

**Tasks:**
1. Implement Google OAuth strategy
2. Implement Facebook OAuth strategy
3. Implement Vipps OAuth strategy (Norwegian)
4. Create OAuth controller endpoints
5. Implement account linking logic
6. Handle social profile data import

**Deliverables:**
- `apps/api/src/modules/auth/strategies/google.strategy.ts` (new)
- `apps/api/src/modules/auth/strategies/facebook.strategy.ts` (new)
- `apps/api/src/modules/auth/strategies/vipps.strategy.ts` (new)
- `apps/api/src/modules/auth/oauth.controller.ts` (new)
- `apps/api/src/modules/auth/oauth.service.ts` (new)

**Validation:**
- OAuth redirects work correctly
- Tokens are generated after OAuth login
- Profile data is imported
- Account linking works

---

### Phase 7: Frontend Authentication UI (Day 4-5)
**Duration**: 8 hours  
**Files**: 12 new

**Tasks:**
1. Create login page
2. Create registration page
3. Create password reset flow pages
4. Create email verification page
5. Create auth context/provider
6. Create auth hooks (useAuth, useUser)
7. Create protected route wrapper
8. Create OAuth login buttons
9. Add form validation with zod
10. Add loading states and error handling

**Deliverables:**
- `apps/web/src/app/(auth)/login/page.tsx` (new)
- `apps/web/src/app/(auth)/register/page.tsx` (new)
- `apps/web/src/app/(auth)/forgot-password/page.tsx` (new)
- `apps/web/src/app/(auth)/reset-password/page.tsx` (new)
- `apps/web/src/app/(auth)/verify-email/page.tsx` (new)
- `apps/web/src/lib/auth/auth-context.tsx` (new)
- `apps/web/src/lib/auth/use-auth.ts` (new)
- `apps/web/src/lib/auth/auth-api.ts` (new)
- `apps/web/src/components/auth/login-form.tsx` (new)
- `apps/web/src/components/auth/register-form.tsx` (new)
- `apps/web/src/components/auth/oauth-buttons.tsx` (new)
- `apps/web/src/middleware.ts` (new - JWT verification)

**Validation:**
- Users can register and login
- Email verification works
- Password reset works
- OAuth buttons redirect correctly
- Protected routes work

---

### Phase 8: Security Enhancements (Day 5)
**Duration**: 4 hours  
**Files**: 5 new

**Tasks:**
1. Add Helmet.js security headers
2. Configure CORS properly
3. Add CSRF protection
4. Add rate limiting to sensitive endpoints
5. Add account lockout after failed attempts
6. Add IP-based throttling
7. Add audit logging for security events

**Deliverables:**
- `apps/api/src/common/security/helmet.config.ts` (new)
- `apps/api/src/common/security/cors.config.ts` (new)
- `apps/api/src/common/security/rate-limit.config.ts` (new)
- `apps/api/src/common/filters/security-exception.filter.ts` (new)
- `apps/api/src/main.ts` (updated)

**Validation:**
- Security headers present in responses
- CORS works correctly
- Rate limiting triggers on excessive requests
- Account locks after failed attempts
- Audit logs capture security events

---

### Phase 9: Testing (Day 6)
**Duration**: 8 hours  
**Files**: 12 new

**Tasks:**
1. Write unit tests for AuthService
2. Write unit tests for TokenService
3. Write unit tests for PasswordService
4. Write integration tests for auth endpoints
5. Write E2E tests for auth flows
6. Test all guards and strategies
7. Test rate limiting
8. Test account lockout
9. Test OAuth flows (mocked)
10. Achieve >80% code coverage

**Deliverables:**
- `apps/api/src/modules/auth/__tests__/auth.service.spec.ts` (new)
- `apps/api/src/modules/auth/__tests__/token.service.spec.ts` (new)
- `apps/api/src/modules/auth/__tests__/password.service.spec.ts` (new)
- `apps/api/src/modules/auth/__tests__/auth.controller.spec.ts` (new)
- `apps/api/src/modules/auth/__tests__/guards.spec.ts` (new)
- `apps/api/src/modules/auth/__tests__/strategies.spec.ts` (new)
- `apps/api/test/e2e/auth.e2e-spec.ts` (new)

**Validation:**
- All tests pass
- Code coverage >80%
- No regressions in Package 1

---

### Phase 10: Documentation (Day 6-7)
**Duration**: 4 hours  
**Files**: 5 new, 3 updated

**Tasks:**
1. Document authentication flow
2. Document authorization patterns
3. Update API documentation
4. Create auth setup guide
5. Document environment variables
6. Document OAuth setup
7. Update architecture docs

**Deliverables:**
- `docs/02-specifications/authentication.md` (new)
- `docs/02-specifications/authorization.md` (new)
- `docs/guides/auth-setup.md` (new)
- `docs/guides/oauth-setup.md` (new)
- `apps/api/README.md` (updated)
- `apps/web/README.md` (updated)
- `docs/architecture/security.md` (new)

**Validation:**
- All flows documented with diagrams
- Setup instructions complete and tested
- Environment variables documented

---

## 4. API Endpoints Design

### 4.1 Authentication Endpoints

**POST /api/auth/register**
```typescript
Request:
{
  email: string;
  password: string;
  name: string;
  phone?: string;
  language?: string;
  gdprConsent: boolean;
}

Response: 201 Created
{
  message: "Registration successful. Please check your email to verify your account.";
  userId: string;
}
```

**POST /api/auth/login**
```typescript
Request:
{
  email: string;
  password: string;
  rememberMe?: boolean;
}

Response: 200 OK
{
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    emailVerified: boolean;
  };
}

Errors:
401 - Invalid credentials
423 - Account locked
403 - Email not verified
```

**POST /api/auth/refresh**
```typescript
Request:
{
  refreshToken: string;
}

Response: 200 OK
{
  accessToken: string;
  refreshToken: string;
}

Errors:
401 - Invalid or expired refresh token
```

**POST /api/auth/logout**
```typescript
Request:
{
  refreshToken: string;
}

Response: 200 OK
{
  message: "Logged out successfully";
}
```

**POST /api/auth/verify-email**
```typescript
Request:
{
  token: string;
}

Response: 200 OK
{
  message: "Email verified successfully";
}

Errors:
400 - Invalid or expired token
```

**POST /api/auth/resend-verification**
```typescript
Request:
{
  email: string;
}

Response: 200 OK
{
  message: "Verification email sent";
}
```

**POST /api/auth/forgot-password**
```typescript
Request:
{
  email: string;
}

Response: 200 OK
{
  message: "Password reset email sent if account exists";
}
```

**POST /api/auth/reset-password**
```typescript
Request:
{
  token: string;
  newPassword: string;
}

Response: 200 OK
{
  message: "Password reset successful";
}

Errors:
400 - Invalid or expired token
400 - Password does not meet requirements
```

**GET /api/auth/me**
```typescript
Headers:
Authorization: Bearer <accessToken>

Response: 200 OK
{
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  lastLoginAt: Date | null;
}

Errors:
401 - Invalid or missing token
```

### 4.2 OAuth Endpoints

**GET /api/auth/google**
- Redirects to Google OAuth consent screen

**GET /api/auth/google/callback**
- Handles Google OAuth callback
- Creates or links account
- Returns JWT tokens

**GET /api/auth/facebook**
- Redirects to Facebook OAuth consent screen

**GET /api/auth/facebook/callback**
- Handles Facebook OAuth callback

**GET /api/auth/vipps**
- Redirects to Vipps OAuth consent screen

**GET /api/auth/vipps/callback**
- Handles Vipps OAuth callback

---

## 5. Security Specifications

### 5.1 Password Requirements

```typescript
const PASSWORD_RULES = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true,
  specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};
```

### 5.2 JWT Token Specifications

**Access Token:**
```typescript
{
  sub: userId,        // Subject (user ID)
  email: string,      // User email
  role: UserRole,     // User role
  status: UserStatus, // User status
  iat: number,        // Issued at
  exp: number,        // Expires (15 minutes from iat)
}
```

**Refresh Token:**
```typescript
{
  sub: userId,
  tokenId: string,    // Unique token ID (for revocation)
  iat: number,
  exp: number,        // Expires (7 or 30 days from iat)
}
```

**Token Signing:**
- Algorithm: HS256 (or RS256 for production)
- Secret: Environment variable `JWT_SECRET`
- Refresh Secret: Environment variable `JWT_REFRESH_SECRET`

### 5.3 Rate Limiting

```typescript
const RATE_LIMITS = {
  login: { ttl: 60, limit: 5 },          // 5 attempts per minute
  register: { ttl: 60, limit: 3 },        // 3 attempts per minute
  forgotPassword: { ttl: 3600, limit: 3 }, // 3 attempts per hour
  verifyEmail: { ttl: 60, limit: 10 },    // 10 attempts per minute
  refreshToken: { ttl: 60, limit: 10 },   // 10 attempts per minute
};
```

### 5.4 Account Lockout

```typescript
const LOCKOUT_CONFIG = {
  maxFailedAttempts: 5,
  lockoutDurationMinutes: 30,
  resetFailedAttemptsAfterMinutes: 60,
};
```

---

## 6. Environment Variables

**Required Environment Variables:**

```env
# JWT Configuration
JWT_SECRET=<random-256-bit-secret>
JWT_REFRESH_SECRET=<random-256-bit-secret>
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=7d

# Password Hashing
BCRYPT_ROUNDS=12

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:3000

# Email Service (defer to Package 5)
# SMTP_HOST=
# SMTP_PORT=
# SMTP_USER=
# SMTP_PASS=
# EMAIL_FROM=

# OAuth Providers
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:4000/api/auth/google/callback

FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
FACEBOOK_CALLBACK_URL=http://localhost:4000/api/auth/facebook/callback

VIPPS_CLIENT_ID=
VIPPS_CLIENT_SECRET=
VIPPS_CALLBACK_URL=http://localhost:4000/api/auth/vipps/callback

# Security
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100
```

---

## 7. Testing Strategy

### 7.1 Unit Tests

**AuthService:**
- ✅ Register with valid data creates user
- ✅ Register with duplicate email fails
- ✅ Login with valid credentials returns tokens
- ✅ Login with invalid credentials fails
- ✅ Login increments failed attempts
- ✅ Account locks after max failed attempts
- ✅ Email verification activates account
- ✅ Password reset generates valid token
- ✅ Password reset with expired token fails

**TokenService:**
- ✅ generateAccessToken creates valid JWT
- ✅ generateRefreshToken creates valid JWT
- ✅ verifyAccessToken validates correctly
- ✅ verifyRefreshToken validates correctly
- ✅ Expired tokens are rejected
- ✅ Invalid signatures are rejected

**PasswordService:**
- ✅ hashPassword creates bcrypt hash
- ✅ comparePassword validates correct password
- ✅ comparePassword rejects incorrect password
- ✅ Password meets complexity requirements
- ✅ Weak passwords are rejected

### 7.2 Integration Tests

**Auth Endpoints:**
- ✅ POST /auth/register creates user and sends verification email
- ✅ POST /auth/login returns tokens for verified user
- ✅ POST /auth/login fails for unverified user
- ✅ POST /auth/refresh returns new tokens
- ✅ POST /auth/logout revokes refresh token
- ✅ POST /auth/verify-email activates account
- ✅ POST /auth/forgot-password sends reset email
- ✅ POST /auth/reset-password changes password
- ✅ GET /auth/me returns current user

**Guards:**
- ✅ JwtAuthGuard blocks requests without token
- ✅ JwtAuthGuard allows requests with valid token
- ✅ RolesGuard blocks users without required role
- ✅ RolesGuard allows users with required role

### 7.3 E2E Tests

**Registration Flow:**
1. User registers with email/password
2. Verification email is sent
3. User clicks verification link
4. Account is activated
5. User can log in

**Login Flow:**
1. User logs in with email/password
2. Access and refresh tokens are returned
3. User can access protected endpoints
4. User refreshes token before expiry
5. User logs out

**Password Reset Flow:**
1. User requests password reset
2. Reset email is sent
3. User clicks reset link
4. User sets new password
5. User can log in with new password

**OAuth Flow:**
1. User clicks "Login with Google"
2. User is redirected to Google
3. User authorizes app
4. User is redirected back with tokens
5. Account is created or linked

---

## 8. Success Criteria

### 8.1 Functional Acceptance Criteria

**AC-1: User Registration**
- [ ] Users can register with email and password
- [ ] Duplicate emails are rejected
- [ ] Verification email is sent (or logged for dev)
- [ ] Unverified users cannot log in
- [ ] GDPR consent is tracked

**AC-2: User Login**
- [ ] Users can log in with email and password
- [ ] Invalid credentials are rejected
- [ ] JWT tokens are returned on successful login
- [ ] Failed attempts are tracked
- [ ] Account locks after 5 failed attempts
- [ ] "Remember me" extends refresh token expiry

**AC-3: Token Management**
- [ ] Access tokens expire after 15 minutes
- [ ] Refresh tokens expire after 7 days (or 30 with "remember me")
- [ ] Users can refresh access tokens
- [ ] Refresh tokens are rotated on refresh
- [ ] Logout revokes refresh token

**AC-4: Email Verification**
- [ ] Verification link is sent on registration
- [ ] Clicking link verifies account
- [ ] Expired tokens are rejected
- [ ] Users can resend verification email

**AC-5: Password Reset**
- [ ] Users can request password reset
- [ ] Reset link is sent via email
- [ ] Reset token expires after 1 hour
- [ ] New password meets complexity requirements
- [ ] Users can log in with new password

**AC-6: Authorization**
- [ ] Protected endpoints require valid JWT
- [ ] Role-based guards work correctly
- [ ] Users can only access their own resources
- [ ] ORG_ADMINs can manage their organization
- [ ] PLATFORM_ADMINs can access all resources

**AC-7: OAuth Integration**
- [ ] Google OAuth login works
- [ ] Facebook OAuth login works
- [ ] Vipps OAuth login works (if credentials available)
- [ ] OAuth accounts can be linked to existing accounts
- [ ] Profile data is imported from social providers

**AC-8: Security**
- [ ] Passwords are hashed with bcrypt
- [ ] Rate limiting prevents brute force
- [ ] Security headers are present
- [ ] CORS is configured correctly
- [ ] Audit logs capture auth events

### 8.2 Non-Functional Acceptance Criteria

**Performance:**
- [ ] Login response time < 200ms (p95)
- [ ] Token verification < 50ms
- [ ] Password hashing < 500ms

**Security:**
- [ ] No passwords in logs or error messages
- [ ] JWT secrets in environment variables
- [ ] HTTPS enforced in production
- [ ] OWASP Top 10 compliance verified

**Code Quality:**
- [ ] TypeScript strict mode enabled
- [ ] No `any` types (100% type coverage)
- [ ] ESLint passes with no errors
- [ ] Test coverage >80%
- [ ] All functions documented with JSDoc

---

## 9. Risk Assessment

### 9.1 Technical Risks

**Risk 1: Email Service Not Implemented**
- **Impact**: High (verification/password reset won't work)
- **Probability**: High (Package 5)
- **Mitigation**: 
  - Log verification links to console in development
  - Create manual verification endpoint for testing
  - Document that email service is required for production

**Risk 2: OAuth Provider Credentials**
- **Impact**: Medium (OAuth won't work without credentials)
- **Probability**: Medium (requires external accounts)
- **Mitigation**:
  - Provide detailed setup instructions
  - Make OAuth optional
  - Test with Google (easiest to set up)

**Risk 3: Token Rotation Complexity**
- **Impact**: Medium (UX issue if not handled properly)
- **Probability**: Low (well-documented pattern)
- **Mitigation**:
  - Use battle-tested libraries (@nestjs/jwt)
  - Implement comprehensive tests
  - Document refresh flow clearly

**Risk 4: Rate Limiting Edge Cases**
- **Impact**: Low (legitimate users might be blocked)
- **Probability**: Low (tunable limits)
- **Mitigation**:
  - Conservative limits (not too aggressive)
  - Clear error messages
  - Admin override capability

### 9.2 Security Risks

**Risk 1: JWT Secret Exposure**
- **Impact**: Critical (all tokens compromised)
- **Probability**: Low (if env vars used correctly)
- **Mitigation**:
  - Never hardcode secrets
  - Use strong random secrets (256-bit)
  - Rotate secrets periodically (revokes all tokens)

**Risk 2: XSS Attacks**
- **Impact**: High (token theft)
- **Probability**: Low (React escapes by default)
- **Mitigation**:
  - Store tokens in httpOnly cookies (alternative)
  - Never use dangerouslySetInnerHTML
  - CSP headers

**Risk 3: CSRF Attacks**
- **Impact**: Medium (unauthorized actions)
- **Probability**: Low (with proper headers)
- **Mitigation**:
  - CSRF tokens for state-changing operations
  - SameSite cookie attribute
  - Verify Origin header

---

## 10. Dependencies

### 10.1 Package Dependencies

**Package 1 (Complete):**
- ✅ User table with email, role, status
- ✅ UserRepository with findByEmail()
- ✅ Prisma client configured

**External Services (Not Yet Implemented):**
- ❌ Email service (Package 5) - **Workaround**: Log to console
- ❌ OAuth app registrations - **Workaround**: Optional feature

### 10.2 NPM Dependencies to Install

**Backend:**
```json
{
  "@nestjs/passport": "^10.0.3",
  "@nestjs/jwt": "^10.2.0",
  "@nestjs/throttler": "^6.2.1",
  "passport": "^0.7.0",
  "passport-jwt": "^4.0.1",
  "passport-local": "^1.0.0",
  "passport-google-oauth20": "^2.0.0",
  "passport-facebook": "^3.0.0",
  "bcrypt": "^5.1.1",
  "@types/bcrypt": "^5.0.2",
  "@types/passport-jwt": "^4.0.1",
  "@types/passport-local": "^1.0.38",
  "helmet": "^8.0.0",
  "class-validator": "^0.14.1",
  "class-transformer": "^0.5.1"
}
```

**Frontend:**
```json
{
  "jose": "^5.9.6"
}
```

---

## 11. File Structure

### 11.1 Backend Files (NestJS API)

```
apps/api/src/
└── modules/
    └── auth/
        ├── auth.module.ts                  (NEW)
        ├── auth.controller.ts              (NEW)
        ├── auth.service.ts                 (NEW)
        ├── token.service.ts                (NEW)
        ├── password.service.ts             (NEW)
        ├── email-verification.service.ts   (NEW)
        ├── audit.service.ts                (NEW)
        ├── oauth.controller.ts             (NEW)
        ├── oauth.service.ts                (NEW)
        ├── strategies/
        │   ├── jwt.strategy.ts             (NEW)
        │   ├── local.strategy.ts           (NEW)
        │   ├── google.strategy.ts          (NEW)
        │   ├── facebook.strategy.ts        (NEW)
        │   └── vipps.strategy.ts           (NEW)
        ├── guards/
        │   ├── jwt-auth.guard.ts           (NEW)
        │   ├── roles.guard.ts              (NEW)
        │   ├── ownership.guard.ts          (NEW)
        │   └── local-auth.guard.ts         (NEW)
        ├── decorators/
        │   ├── current-user.decorator.ts   (NEW)
        │   ├── roles.decorator.ts          (NEW)
        │   └── public.decorator.ts         (NEW)
        ├── dto/
        │   ├── register.dto.ts             (NEW)
        │   ├── login.dto.ts                (NEW)
        │   ├── refresh-token.dto.ts        (NEW)
        │   ├── verify-email.dto.ts         (NEW)
        │   ├── forgot-password.dto.ts      (NEW)
        │   ├── reset-password.dto.ts       (NEW)
        │   └── index.ts                    (NEW)
        └── __tests__/
            ├── auth.service.spec.ts        (NEW)
            ├── token.service.spec.ts       (NEW)
            ├── password.service.spec.ts    (NEW)
            ├── auth.controller.spec.ts     (NEW)
            ├── guards.spec.ts              (NEW)
            └── strategies.spec.ts          (NEW)
```

### 11.2 Frontend Files (Next.js App)

```
apps/web/src/
├── app/
│   └── (auth)/
│       ├── login/
│       │   └── page.tsx                  (NEW)
│       ├── register/
│       │   └── page.tsx                  (NEW)
│       ├── verify-email/
│       │   └── page.tsx                  (NEW)
│       ├── forgot-password/
│       │   └── page.tsx                  (NEW)
│       └── reset-password/
│           └── page.tsx                  (NEW)
├── components/
│   └── auth/
│       ├── login-form.tsx                (NEW)
│       ├── register-form.tsx             (NEW)
│       ├── oauth-buttons.tsx             (NEW)
│       └── auth-guard.tsx                (NEW)
├── lib/
│   └── auth/
│       ├── auth-context.tsx              (NEW)
│       ├── use-auth.ts                   (NEW)
│       ├── auth-api.ts                   (NEW)
│       └── token-storage.ts              (NEW)
└── middleware.ts                         (NEW)
```

### 11.3 Database Files

```
packages/database/
├── schema.prisma                         (UPDATED)
├── seed.ts                               (UPDATED)
└── src/
    └── repositories/
        ├── refresh-token.repository.ts   (NEW)
        ├── audit-log.repository.ts       (NEW)
        └── index.ts                      (UPDATED)
```

### 11.4 Types Files

```
packages/types/src/
├── auth/
│   ├── dtos.ts                          (NEW)
│   ├── jwt.types.ts                     (NEW)
│   ├── responses.ts                     (NEW)
│   └── index.ts                         (NEW)
└── domain/
    ├── refresh-token.ts                 (NEW)
    ├── audit-log.ts                     (NEW)
    └── index.ts                         (UPDATED)
```

### 11.5 Documentation Files

```
docs/
├── 01-packages/
│   └── PACKAGE_2_COMPLETION_REPORT.md   (NEW)
├── 02-specifications/
│   ├── authentication.md                (NEW)
│   └── authorization.md                 (NEW)
├── architecture/
│   └── security.md                      (NEW)
└── guides/
    ├── auth-setup.md                    (NEW)
    └── oauth-setup.md                   (NEW)
```

---

## 12. Implementation Timeline

### Week 1: Core Authentication

**Day 1: Database & Types**
- [ ] Extend Prisma schema (Phase 1)
- [ ] Create TypeScript types (Phase 2)
- [ ] Run migration
- [ ] Update seed script

**Day 2: Core Services**
- [ ] AuthService implementation (Phase 3)
- [ ] TokenService implementation (Phase 3)
- [ ] PasswordService implementation (Phase 3)
- [ ] Unit tests

**Day 3: Guards & Endpoints**
- [ ] Passport strategies (Phase 4)
- [ ] Guards and decorators (Phase 4)
- [ ] AuthController (Phase 5)
- [ ] Integration tests

### Week 2: OAuth, Frontend & Polish

**Day 4: OAuth Integration**
- [ ] Google/Facebook/Vipps strategies (Phase 6)
- [ ] OAuth controller (Phase 6)
- [ ] Test OAuth flows

**Day 5: Frontend Implementation**
- [ ] Auth pages (Phase 7)
- [ ] Auth context/hooks (Phase 7)
- [ ] Protected routes (Phase 7)

**Day 6: Security & Testing**
- [ ] Security enhancements (Phase 8)
- [ ] Comprehensive testing (Phase 9)
- [ ] Fix issues

**Day 7: Documentation & Review**
- [ ] Complete documentation (Phase 10)
- [ ] Code review
- [ ] Prepare completion report

---

## 13. Out of Scope (Future Packages)

**Not Included in Package 2:**
- Email service implementation (Package 5)
- SMS verification (Package 5 or later)
- Two-factor authentication (Package 6)
- BankID integration (Package 6 or later)
- Admin dashboard for user management (Package 4)
- Analytics on auth events (Package 7)
- Advanced fraud detection (Package 8)

---

## 14. Approval Checklist

Before proceeding with implementation, confirm:

**Requirements:**
- [ ] All functional requirements reviewed and understood
- [ ] Non-functional requirements are feasible
- [ ] Security requirements meet industry standards

**Architecture:**
- [ ] Database schema extensions approved
- [ ] API endpoint design approved
- [ ] Technology stack choices approved
- [ ] Frontend architecture approved

**Scope:**
- [ ] In-scope features clearly defined
- [ ] Out-of-scope items documented
- [ ] Dependencies on other packages understood

**Timeline:**
- [ ] 5-7 day estimate is acceptable
- [ ] Phase breakdown is realistic
- [ ] Testing allocation is sufficient

**Risks:**
- [ ] All risks identified and mitigated
- [ ] Email service workaround is acceptable
- [ ] OAuth optional feature is acceptable

---

## 15. Questions for Stakeholders

1. **Email Service**: Package 2 requires sending emails (verification, password reset). Package 5 implements this. For Package 2 testing, should we:
   - A) Log links to console (development only)
   - B) Use a simple SMTP setup temporarily
   - C) Skip email features until Package 5

2. **OAuth Providers**: Which OAuth providers are priority?
   - Google (easiest to set up)
   - Facebook
   - Vipps (Norwegian, requires business account)

3. **Token Storage**: Should JWT tokens be stored in:
   - A) localStorage (simpler, vulnerable to XSS)
   - B) httpOnly cookies (more secure, needs CSRF protection)
   - C) Memory + refresh token in httpOnly cookie (most secure, complex)

4. **Password Policy**: Are the password requirements acceptable?
   - Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
   - Or do you want more/less strict?

5. **Account Lockout**: 5 failed attempts = 30-minute lockout. Is this acceptable?

---

**Status**: 📋 AWAITING APPROVAL

**Next Steps After Approval:**
1. Install NPM dependencies
2. Begin Phase 1 (Database schema extensions)
3. Provide progress updates after each phase

**Prepared By**: Softgen AI  
**Date**: 2026-07-10