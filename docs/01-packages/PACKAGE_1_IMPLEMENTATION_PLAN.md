<![CDATA[# Package 1: Core Domain Models & Database Schema - Implementation Plan

## Document Analysis Summary

### From MASTER_CONTEXT.md
- **Domain**: Norwegian community contribution platform (Bidra)
- **Core Entities**: Organizations, Campaigns, Needs, Contributions, Users
- **Contribution Types**: Money, Volunteer Time, Goods, Equipment, Skills, Other
- **Key Systems**: Stripe Connect payments, Time Credits, Recognition Partners
- **Language**: Norwegian (primary), with internationalization support

### From DEVELOPMENT_PACKAGE_0_AI_PROTOCOL.md
**Development Standards:**
- Clean Architecture with DDD principles
- Repository pattern for data access
- Service layer for business logic
- DTO pattern for API contracts
- Comprehensive test coverage (unit + integration)
- Database migrations via Prisma
- TypeScript strict mode
- Documentation for all public APIs

### From PACKAGE_1.pdf
**Scope**: Core domain models and database schema implementation

**Acceptance Criteria:**
1. ✅ Prisma schema with all core entities
2. ✅ TypeScript interfaces for domain models
3. ✅ Database migrations
4. ✅ Seed data for development
5. ✅ Repository pattern implementation
6. ✅ Unit tests for repositories
7. ✅ Documentation

## Current Repository State

**Existing Structure:**
```
✅ pnpm monorepo configured
✅ packages/database/ with basic Prisma setup
✅ packages/types/ with basic types
✅ apps/api/ NestJS backend scaffolded
✅ apps/web/ Next.js frontend scaffolded
✅ Docker infrastructure ready
```

**What Needs Implementation:**
- Complete Prisma schema with all entities
- Domain model TypeScript interfaces
- Repository layer in @bidra/database
- Seed data scripts
- Integration tests
- Updated documentation

## Implementation Plan

### Phase 1: Prisma Schema Design (Priority: Critical)

**File**: `packages/database/schema.prisma`

**Entities to Implement:**

1. **User** (auth will come later, but user reference needed)
   - id, email, name, phone, language
   - role (user, org_admin, platform_admin)
   - status (active, inactive, suspended)
   - timestamps

2. **Organization**
   - id, name, description, organizationType
   - contactEmail, contactPhone, website
   - address, postalCode, city
   - orgNumber (Norwegian org number)
   - verificationStatus (pending, verified, rejected)
   - stripeAccountId (for Connect)
   - status, timestamps

3. **Campaign**
   - id, organizationId (FK)
   - title, description, story
   - goal (financial goal if monetary)
   - startDate, endDate
   - location, address, postalCode, city
   - images (JSON array of URLs)
   - status (draft, active, paused, completed, cancelled)
   - visibility (public, unlisted, private)
   - timestamps

4. **Need** (what campaigns need)
   - id, campaignId (FK)
   - title, description
   - needType (money, volunteer, goods, equipment, skills, other)
   - quantity, quantityUnit
   - estimatedValue (for non-money needs)
   - deadline
   - status (open, in_progress, fulfilled, cancelled)
   - timestamps

5. **Contribution**
   - id, needId (FK), userId (FK)
   - contributionType (matching needType)
   - status (pending, confirmed, completed, cancelled)
   - timestamps

6. **MoneyContribution** (extends Contribution)
   - amount, currency (default NOK)
   - stripePaymentIntentId
   - paymentStatus (pending, succeeded, failed)
   - receiptUrl
   - timestamps

7. **VolunteerContribution** (extends Contribution)
   - hours, date, startTime, endTime
   - skills (text)
   - status (registered, confirmed, completed, cancelled)

8. **GoodsContribution** (extends Contribution)
   - items (JSON: [{ name, quantity, description }])
   - condition (new, good, fair)
   - deliveryMethod (drop_off, pickup, shipping)
   - deliveryStatus

9. **EquipmentContribution** (extends Contribution)
   - equipment (JSON: [{ name, description, value }])
   - loanPeriodStart, loanPeriodEnd
   - condition, returnStatus

10. **SkillsContribution** (extends Contribution)
    - skillDescription
    - estimatedHours
    - deliveryDate

11. **RecognitionPartner**
    - id, name, description
    - logo, website
    - benefits (JSON)
    - status, timestamps

12. **TimeCredit**
    - id, userId (FK), organizationId (FK)
    - hours, description
    - earnedDate, expiryDate
    - status (active, used, expired)

**Relations:**
- Organization 1:N Campaign
- Campaign 1:N Need
- Need 1:N Contribution
- User 1:N Contribution
- Organization 1:N TimeCredit
- User 1:N TimeCredit

**Design Decisions:**
- Use UUID for all primary keys
- Soft deletes via deletedAt field
- Audit fields (createdAt, updatedAt) on all entities
- Enums for status and type fields
- JSON fields for flexible data (images, items, benefits)
- PostgreSQL-specific features (JSON, arrays)

### Phase 2: TypeScript Domain Models (Priority: Critical)

**File**: `packages/types/src/domain/index.ts`

**Create interfaces matching Prisma schema:**
- Base domain interfaces
- DTOs for API requests/responses
- Enums exported as const objects
- Type guards for contribution types
- Utility types (Partial, Create, Update)

**Example Structure:**
```typescript
// Enums
export enum OrganizationType { ... }
export enum CampaignStatus { ... }
export enum ContributionType { ... }

// Domain models
export interface Organization { ... }
export interface Campaign { ... }
export interface Need { ... }
export interface Contribution { ... }

// DTOs
export interface CreateOrganizationDto { ... }
export interface UpdateCampaignDto { ... }

// Type guards
export function isMoneyContribution(c: Contribution): c is MoneyContribution { ... }
```

### Phase 3: Repository Layer (Priority: High)

**Location**: `packages/database/src/repositories/`

**Files to create:**
- `base.repository.ts` - Abstract base repository with CRUD
- `organization.repository.ts`
- `campaign.repository.ts`
- `need.repository.ts`
- `contribution.repository.ts`
- `index.ts` - Export all repositories

**Pattern:**
```typescript
export class OrganizationRepository extends BaseRepository<Organization> {
  async findByOrgNumber(orgNumber: string): Promise<Organization | null>
  async findVerified(): Promise<Organization[]>
  // ... domain-specific queries
}
```

**Features:**
- Transaction support
- Pagination helpers
- Query builders for complex filters
- Error handling
- Type-safe queries

### Phase 4: Database Migrations (Priority: High)

**Commands:**
```bash
pnpm --filter @bidra/database db:migrate --name init_core_schema
```

**Includes:**
- Create all tables
- Add indexes for performance
- Foreign key constraints
- Check constraints for data integrity

### Phase 5: Seed Data (Priority: Medium)

**File**: `packages/database/src/seed.ts`

**Seed Data Requirements:**
- 3-5 verified organizations
- 10-15 campaigns (various statuses)
- 20-30 needs (different types)
- 30-50 contributions (all types)
- 5 recognition partners
- Sample users

**Purpose:**
- Development environment setup
- Demo data for frontend
- Integration test fixtures

### Phase 6: Testing (Priority: High)

**Test Files:**
- `packages/database/src/repositories/__tests__/organization.repository.test.ts`
- `packages/database/src/repositories/__tests__/campaign.repository.test.ts`
- `packages/database/src/repositories/__tests__/contribution.repository.test.ts`

**Test Coverage:**
- Repository CRUD operations
- Complex queries
- Transactions
- Error scenarios
- Edge cases

**Setup:**
- Test database (separate from dev)
- Jest configuration
- Setup/teardown scripts
- Test fixtures

### Phase 7: Documentation (Priority: Medium)

**Files to create/update:**
- `docs/01-packages/database.md` - Database package docs
- `docs/01-packages/types.md` - Types package docs
- `docs/architecture/data-model.md` - ERD and model docs
- Update README.md with migration instructions

**Content:**
- Entity relationship diagram
- Field descriptions
- Business rules
- Migration guide
- Repository usage examples

## Implementation Order

**Week 1:**
1. ✅ Design Prisma schema (all entities)
2. ✅ Create TypeScript interfaces
3. ✅ Run first migration
4. ✅ Implement BaseRepository

**Week 2:**
1. ✅ Implement all repositories
2. ✅ Create seed data script
3. ✅ Write repository tests
4. ✅ Documentation

## Acceptance Criteria Checklist

- [ ] Prisma schema with all entities (User, Organization, Campaign, Need, Contribution types, TimeCredit, RecognitionPartner)
- [ ] All relationships defined with proper foreign keys
- [ ] TypeScript interfaces in @bidra/types matching schema
- [ ] Repository pattern implemented in @bidra/database
- [ ] Database migration files generated
- [ ] Seed script with realistic data
- [ ] Unit tests for all repositories (>80% coverage)
- [ ] Integration tests for complex queries
- [ ] Documentation: ERD, field descriptions, usage examples
- [ ] All TypeScript strict mode errors resolved
- [ ] Lint passes without warnings
- [ ] Build succeeds for all packages

## Technical Constraints

**From Protocol:**
- No business logic in repositories (pure data access)
- All database queries through repositories (no direct Prisma calls in services)
- Migrations must be reversible
- All public methods documented with JSDoc
- Error handling with custom exceptions
- Logging for all database operations

## Files to Create

```
packages/database/
├── schema.prisma (UPDATE)
├── src/
│   ├── index.ts (UPDATE)
│   ├── repositories/
│   │   ├── base.repository.ts (NEW)
│   │   ├── organization.repository.ts (NEW)
│   │   ├── campaign.repository.ts (NEW)
│   │   ├── need.repository.ts (NEW)
│   │   ├── contribution.repository.ts (NEW)
│   │   ├── time-credit.repository.ts (NEW)
│   │   ├── recognition-partner.repository.ts (NEW)
│   │   ├── index.ts (NEW)
│   │   └── __tests__/ (NEW)
│   ├── seed.ts (NEW)
│   └── exceptions/ (NEW)
│       └── database.exception.ts (NEW)

packages/types/
├── src/
│   ├── domain/
│   │   ├── organization.ts (NEW)
│   │   ├── campaign.ts (NEW)
│   │   ├── need.ts (NEW)
│   │   ├── contribution.ts (NEW)
│   │   ├── time-credit.ts (NEW)
│   │   ├── recognition-partner.ts (NEW)
│   │   ├── enums.ts (NEW)
│   │   └── index.ts (NEW)
│   └── index.ts (UPDATE)

docs/
├── 01-packages/
│   ├── database.md (NEW)
│   └── types.md (NEW)
└── architecture/
    └── data-model.md (NEW)
```

## Risk Assessment

**High Risk:**
- Contribution polymorphism (5 types) - Use Prisma's table-per-type strategy
- JSON fields validation - Implement Zod schemas

**Medium Risk:**
- Performance with large datasets - Add indexes strategically
- Migration complexity - Test thoroughly in staging

**Low Risk:**
- TypeScript type safety - Strict mode catches issues
- Repository pattern - Well-established pattern

## Next Steps After Package 1

**Package 2 will likely include:**
- Authentication & Authorization (Supabase or custom)
- User management endpoints
- Session handling

**Package 3:**
- Organization management APIs
- Admin approval workflows

**DO NOT implement these in Package 1.**

## Questions for Clarification

Before implementation, confirm:
1. ✅ Is Stripe Connect the payment provider? (Assumed yes from context)
2. ✅ Should we use UUID or integer IDs? (Recommended: UUID for security)
3. ✅ Soft delete or hard delete? (Recommended: soft delete with deletedAt)
4. ✅ Should timestamps be in UTC? (Recommended: yes, always UTC)
5. ✅ Primary language Norwegian - should field names be English or Norwegian? (Recommended: English for code, Norwegian for content)

## Success Metrics

Package 1 is complete when:
- ✅ `pnpm --filter @bidra/database db:push` succeeds
- ✅ `pnpm --filter @bidra/database db:seed` populates dev database
- ✅ All tests pass: `pnpm --filter @bidra/database test`
- ✅ Build succeeds: `pnpm build`
- ✅ Documentation reviewed and approved
- ✅ Ready for Package 2 (auth layer)

---

**Estimated Effort**: 3-5 days for experienced developer
**Status**: Ready to implement
**Blocker**: None - all prerequisites met
