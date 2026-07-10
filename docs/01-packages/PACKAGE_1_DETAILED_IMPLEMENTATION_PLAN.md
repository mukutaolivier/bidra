# Development Package 1: Platform Foundation - Detailed Implementation Plan

## Executive Summary

**Package**: Development Package 1 - Platform Foundation
**Status**: Ready for Implementation
**Estimated Effort**: 4-6 days
**Blocking Dependencies**: None
**Blocks**: All subsequent packages (2-8)

This document provides a comprehensive implementation plan for Package 1, which establishes the core data layer foundation for the Bidra platform.

---

## 1. Specification Analysis

### 1.1 Master Context Review

**Domain**: Norwegian community contribution platform (Bidra)

**Core Entities Identified:**
- Organizations (non-profits, community groups)
- Campaigns (fundraising and volunteer campaigns)
- Needs (what campaigns need from community)
- Contributions (6 types: Money, Volunteer, Goods, Equipment, Skills, Other)
- Users (contributors and organization admins)
- Time Credits (reward system for volunteers)
- Recognition Partners (businesses offering benefits)

**Business Rules:**
- Organizations must be verified before creating campaigns
- Campaigns have needs that specify contribution types
- Multiple contribution types per campaign
- Norwegian organizations (9-digit organization numbers)
- Stripe Connect for payment processing
- Multi-language support (Norwegian primary, English secondary)

### 1.2 Development Protocol Requirements

**Architecture Pattern**: Clean Architecture with DDD
- Domain models in packages/types
- Data access via Repository pattern in packages/database
- No business logic in repositories
- Service layer (not in Package 1 scope)
- DTO pattern for API contracts (not in Package 1 scope)

**Code Quality Standards:**
- TypeScript strict mode
- 100% type coverage (no `any` types)
- JSDoc comments for all public APIs
- Comprehensive error handling
- Unit tests (>80% coverage)
- Integration tests for complex queries

**Database Standards:**
- Prisma ORM
- Migration-based schema changes
- Seed data for development
- PostgreSQL-specific features allowed
- Reversible migrations

### 1.3 Package 1 Scope Definition

**In Scope:**
✅ Complete Prisma schema with all core entities
✅ TypeScript domain models and interfaces
✅ Repository pattern implementation
✅ Database migrations
✅ Seed data scripts
✅ Unit and integration tests
✅ Documentation (ERD, usage guides)

**Out of Scope (Future Packages):**
❌ Authentication & authorization (Package 2)
❌ API endpoints (Package 3+)
❌ Business logic services (Package 3+)
❌ Frontend components (Package 5+)
❌ Payment integration (Package 6)
❌ Email notifications (Package 7)

---

## 2. Current State Analysis

### 2.1 Existing Infrastructure

**Present and Functional:**
- ✅ pnpm workspace configuration
- ✅ Turborepo build orchestration
- ✅ packages/database with Prisma setup
- ✅ packages/types with basic types
- ✅ Docker Compose (PostgreSQL + Redis)
- ✅ Testing infrastructure (Jest configured)
- ✅ ESLint + TypeScript configuration

**Needs Implementation:**
- ❌ Complete Prisma schema (only SystemInfo placeholder)
- ❌ Domain model types (only basic types exist)
- ❌ Repository layer (no repositories exist)
- ❌ Seed data (no seed script)
- ❌ Tests (no test files)
- ❌ Documentation (architecture docs missing)

### 2.2 Gap Analysis

| Required | Current State | Gap |
|----------|---------------|-----|
| 12 core entities | 1 placeholder model | 11 entities needed |
| Full type definitions | 3 basic types | Domain types needed |
| Repository pattern | Direct Prisma export | Full layer needed |
| Seed data | None | Script + fixtures needed |
| Test coverage | 0% | >80% needed |
| Documentation | Minimal | Full ERD + guides needed |

---

## 3. Detailed Implementation Plan

### Phase 1: Database Schema Design

**Duration**: 1 day
**Priority**: Critical (blocks all other work)

#### 3.1.1 Entity Design

**Core Entities (12 total):**

1. **User** - Platform users (contributors and admins)
2. **Organization** - Non-profits and community groups
3. **Campaign** - Fundraising and volunteer campaigns
4. **Need** - Specific requirements for campaigns
5. **Contribution** - Base contribution record
6. **MoneyContribution** - Financial contributions
7. **VolunteerContribution** - Time contributions
8. **GoodsContribution** - Physical item donations
9. **EquipmentContribution** - Temporary equipment loans
10. **SkillsContribution** - Professional expertise
11. **TimeCredit** - Volunteer reward credits
12. **RecognitionPartner** - Benefit providers

#### 3.1.2 Schema Decisions

**Primary Keys**: UUID (cuid2)
- Security: Non-sequential, unpredictable
- Distribution: Works in distributed systems
- Privacy: No info leakage from sequential IDs

**Timestamps**: UTC DateTime
- All entities: createdAt, updatedAt
- Soft deletes: deletedAt (nullable)
- Prisma @updatedAt decorator for automatic updates

**Enums**: Database enums for type safety
- OrganizationType (non_profit, charity, community_group, sports_club, school, other)
- CampaignStatus (draft, active, paused, completed, cancelled)
- ContributionType (money, volunteer, goods, equipment, skills, other)
- NeedType (matches ContributionType)
- VerificationStatus (pending, verified, rejected)

**JSON Fields**: For flexible/complex data
- Campaign.images (array of image URLs)
- GoodsContribution.items (array of item objects)
- EquipmentContribution.equipment (array of equipment objects)
- RecognitionPartner.benefits (array of benefit objects)

**Indexes**: Strategic for performance
- Foreign keys (automatic)
- Status fields (filtered queries)
- organizationNumber (lookups)
- campaignId + needId (common joins)
- userId (contribution history)

#### 3.1.3 Relationship Design

```
User 1:N Contribution
User 1:N TimeCredit

Organization 1:N Campaign
Organization 1:N TimeCredit

Campaign 1:N Need
Campaign N:1 Organization

Need 1:N Contribution
Need N:1 Campaign

Contribution N:1 Need
Contribution N:1 User
Contribution 1:1 MoneyContribution (optional)
Contribution 1:1 VolunteerContribution (optional)
Contribution 1:1 GoodsContribution (optional)
Contribution 1:1 EquipmentContribution (optional)
Contribution 1:1 SkillsContribution (optional)
```

**Contribution Polymorphism Strategy**: Table-per-type
- Base `Contribution` table with common fields
- Type-specific tables (MoneyContribution, etc.)
- One-to-one optional relations from base to specific types
- `contributionType` enum for efficient queries

#### 3.1.4 Files to Modify

**File**: `packages/database/schema.prisma`

**Content Structure:**
```prisma
// Enums (top of file)
enum UserRole { ... }
enum OrganizationType { ... }
enum CampaignStatus { ... }
enum ContributionType { ... }
// ... all enums

// Core entities
model User { ... }
model Organization { ... }
model Campaign { ... }
model Need { ... }

// Contributions (base + specific)
model Contribution { ... }
model MoneyContribution { ... }
model VolunteerContribution { ... }
model GoodsContribution { ... }
model EquipmentContribution { ... }
model SkillsContribution { ... }

// Supporting entities
model TimeCredit { ... }
model RecognitionPartner { ... }
```

**Success Criteria:**
- [ ] All 12 entities defined
- [ ] All relationships with proper foreign keys
- [ ] Indexes on frequently queried fields
- [ ] Enums for all type/status fields
- [ ] Schema validation passes: `pnpm exec prisma validate`

---

### Phase 2: TypeScript Domain Models

**Duration**: 1 day
**Priority**: Critical
**Depends On**: Phase 1 complete

#### 3.2.1 Type Organization

**Directory Structure:**
```
packages/types/src/
├── domain/
│   ├── user.ts
│   ├── organization.ts
│   ├── campaign.ts
│   ├── need.ts
│   ├── contribution.ts
│   ├── time-credit.ts
│   ├── recognition-partner.ts
│   ├── enums.ts
│   └── index.ts
├── dtos/ (future - not Package 1)
└── index.ts
```

#### 3.2.2 Type Definitions

**Enums** (`enums.ts`):
```typescript
export enum UserRole {
  USER = 'user',
  ORG_ADMIN = 'org_admin',
  PLATFORM_ADMIN = 'platform_admin',
}

export enum OrganizationType {
  NON_PROFIT = 'non_profit',
  CHARITY = 'charity',
  COMMUNITY_GROUP = 'community_group',
  SPORTS_CLUB = 'sports_club',
  SCHOOL = 'school',
  OTHER = 'other',
}

// ... all enums matching Prisma schema
```

**Domain Models**: One interface per entity
- Match Prisma model exactly
- Use TypeScript Date (not Prisma DateTime)
- Export both type and interface for flexibility
- Include JSDoc comments with business rules

**Type Guards**: For contribution types
```typescript
export function isMoneyContribution(
  c: Contribution
): c is Contribution & { moneyContribution: MoneyContribution } {
  return c.contributionType === ContributionType.MONEY;
}

// ... guards for each contribution type
```

**Utility Types**:
```typescript
// For create operations (no id, timestamps)
export type CreateOrganizationInput = Omit<
  Organization,
  'id' | 'createdAt' | 'updatedAt' | 'deletedAt'
>;

// For update operations (partial, no id/timestamps)
export type UpdateOrganizationInput = Partial<
  Omit<Organization, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>
>;

// ... for all entities
```

#### 3.2.3 Files to Create

1. `packages/types/src/domain/user.ts`
2. `packages/types/src/domain/organization.ts`
3. `packages/types/src/domain/campaign.ts`
4. `packages/types/src/domain/need.ts`
5. `packages/types/src/domain/contribution.ts`
6. `packages/types/src/domain/time-credit.ts`
7. `packages/types/src/domain/recognition-partner.ts`
8. `packages/types/src/domain/enums.ts`
9. `packages/types/src/domain/index.ts`

**File to Modify:**
- `packages/types/src/index.ts` - Export all domain types

**Success Criteria:**
- [ ] All domain models have TypeScript interfaces
- [ ] Enums exported as const for runtime use
- [ ] Type guards for all contribution types
- [ ] Utility types (Create, Update) for all entities
- [ ] JSDoc comments on all public types
- [ ] No TypeScript errors: `pnpm exec tsc --noEmit`

---

### Phase 3: Repository Pattern Implementation

**Duration**: 2 days
**Priority**: High
**Depends On**: Phases 1-2 complete

#### 3.3.1 Repository Architecture

**Base Repository Pattern:**
```typescript
export abstract class BaseRepository<T> {
  constructor(protected prisma: PrismaClient) {}
  
  abstract findById(id: string): Promise<T | null>
  abstract findAll(options?: FindAllOptions): Promise<T[]>
  abstract create(data: CreateInput<T>): Promise<T>
  abstract update(id: string, data: UpdateInput<T>): Promise<T>
  abstract delete(id: string): Promise<void>
  abstract softDelete(id: string): Promise<void>
}
```

**Repository Features:**
- Transaction support via Prisma
- Pagination with offset/cursor
- Complex filtering with type-safe builders
- Soft delete by default
- Error handling with custom exceptions
- Query logging in development

#### 3.3.2 Repository Implementations

**OrganizationRepository** - Organization data access
- `findById(id)` - Get by ID
- `findByOrgNumber(orgNumber)` - Norwegian org lookup
- `findVerified()` - List verified organizations
- `findPendingVerification()` - Admin queue
- `create(data)` - New organization
- `update(id, data)` - Update details
- `softDelete(id)` - Archive organization

**CampaignRepository** - Campaign data access
- `findById(id)` - Get with relations (organization, needs)
- `findByOrganization(orgId)` - Organization's campaigns
- `findActive()` - Currently active campaigns
- `findByStatus(status)` - Filter by status
- `search(query)` - Full-text search
- `create(data)` - New campaign
- `update(id, data)` - Update campaign
- `softDelete(id)` - Archive campaign

**NeedRepository** - Need data access
- `findById(id)` - Get with campaign data
- `findByCampaign(campaignId)` - Campaign's needs
- `findByType(type)` - Filter by need type
- `findOpen()` - Open needs
- `create(data)` - New need
- `update(id, data)` - Update need
- `softDelete(id)` - Archive need

**ContributionRepository** - Contribution data access
- `findById(id)` - Get with type-specific data
- `findByUser(userId)` - User's contributions
- `findByCampaign(campaignId)` - Campaign contributions
- `findByNeed(needId)` - Need contributions
- `findByType(type)` - Filter by contribution type
- `create(data)` - New contribution
- `update(id, data)` - Update contribution
- `softDelete(id)` - Cancel contribution

**TimeCreditRepository** - Time credit data access
- `findById(id)` - Get by ID
- `findByUser(userId)` - User's credits
- `findActive(userId)` - User's active credits
- `calculateBalance(userId)` - Total hours
- `create(data)` - Award credits
- `markUsed(id)` - Redeem credits

**RecognitionPartnerRepository** - Partner data access
- `findById(id)` - Get by ID
- `findAll()` - List all partners
- `findActive()` - Active partners
- `create(data)` - New partner
- `update(id, data)` - Update partner
- `softDelete(id)` - Archive partner

#### 3.3.3 Error Handling

**Custom Exceptions:**
```typescript
export class DatabaseError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class EntityNotFoundError extends DatabaseError {
  constructor(entity: string, id: string) {
    super(`${entity} with id ${id} not found`);
    this.name = 'EntityNotFoundError';
  }
}

export class ValidationError extends DatabaseError {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

#### 3.3.4 Files to Create

**Repository Implementations:**
1. `packages/database/src/repositories/base.repository.ts`
2. `packages/database/src/repositories/organization.repository.ts`
3. `packages/database/src/repositories/campaign.repository.ts`
4. `packages/database/src/repositories/need.repository.ts`
5. `packages/database/src/repositories/contribution.repository.ts`
6. `packages/database/src/repositories/time-credit.repository.ts`
7. `packages/database/src/repositories/recognition-partner.repository.ts`
8. `packages/database/src/repositories/index.ts`

**Error Handling:**
9. `packages/database/src/exceptions/database.exception.ts`
10. `packages/database/src/exceptions/index.ts`

**Types:**
11. `packages/database/src/types/repository.types.ts` (FindAllOptions, etc.)

**File to Modify:**
- `packages/database/src/index.ts` - Export repositories

**Success Criteria:**
- [ ] BaseRepository with CRUD operations
- [ ] All 6 entity repositories implemented
- [ ] Custom exceptions for error handling
- [ ] Transaction support tested
- [ ] Pagination tested
- [ ] TypeScript strict mode passes
- [ ] No lint errors

---

### Phase 4: Database Migrations

**Duration**: 0.5 days
**Priority**: High
**Depends On**: Phase 1 complete

#### 3.4.1 Migration Strategy

**Initial Migration:**
```bash
pnpm --filter @bidra/database db:migrate --name init_core_schema
```

**What Gets Created:**
- All tables (12 entities)
- All foreign key constraints
- All indexes
- All enums
- Check constraints for data integrity

**Migration Validation:**
- Test migration on clean database
- Test rollback capability
- Verify all constraints work
- Check index performance

#### 3.4.2 Index Strategy

**Primary Indexes** (automatic via @id):
- All entity primary keys

**Foreign Key Indexes** (automatic via @relation):
- Campaign.organizationId
- Need.campaignId
- Contribution.needId
- Contribution.userId
- TimeCredit.userId
- TimeCredit.organizationId

**Query Optimization Indexes:**
- Organization.organizationNumber (unique)
- Organization.verificationStatus
- Campaign.status
- Campaign.organizationId + status (composite)
- Need.campaignId + status (composite)
- Contribution.userId + createdAt (desc)
- Contribution.needId + contributionType

#### 3.4.3 Files Created by Prisma

- `packages/database/prisma/migrations/TIMESTAMP_init_core_schema/migration.sql`
- Updated `packages/database/prisma/schema.prisma`

**Success Criteria:**
- [ ] Migration file generated
- [ ] Migration applies cleanly: `pnpm --filter @bidra/database db:migrate`
- [ ] All tables created in PostgreSQL
- [ ] All constraints active
- [ ] Indexes created
- [ ] Can rollback migration

---

### Phase 5: Seed Data

**Duration**: 1 day
**Priority**: Medium
**Depends On**: Phase 4 complete

#### 3.5.1 Seed Data Purpose

**Primary Uses:**
- Development environment setup
- Frontend demo data
- Integration test fixtures
- Manual testing scenarios

**Data Quality:**
- Realistic Norwegian names and locations
- Proper Norwegian organization numbers
- Valid email formats
- Realistic timestamps (recent dates)
- Complete relationship chains

#### 3.5.2 Seed Data Contents

**Users** (10 users):
- 1 platform admin
- 3 organization admins
- 6 regular users (contributors)
- Norwegian names
- Realistic emails

**Organizations** (5 organizations):
- 3 verified organizations
- 1 pending verification
- 1 rejected (for testing)
- Mix of types (non-profit, charity, sports club)
- Real Oslo/Bergen/Trondheim addresses
- Valid 9-digit organization numbers (format)

**Campaigns** (10 campaigns):
- 6 active campaigns (various types)
- 2 draft campaigns
- 1 completed campaign
- 1 paused campaign
- Mix of financial and volunteer campaigns
- Associated with verified organizations

**Needs** (20 needs):
- 2-3 needs per campaign
- All 6 contribution types represented
- Mix of open and fulfilled statuses
- Realistic quantities and deadlines

**Contributions** (30 contributions):
- All 6 types represented
- Spread across users and campaigns
- Mix of pending and completed
- Realistic data for each type

**Time Credits** (10 credits):
- Earned by volunteers
- Mix of active and used
- Realistic hour amounts

**Recognition Partners** (5 partners):
- Local Norwegian businesses
- Variety of benefit types
- All active

#### 3.5.3 Seed Script Structure

```typescript
async function seed() {
  // 1. Clean existing data (development only)
  await cleanDatabase();
  
  // 2. Seed in dependency order
  const users = await seedUsers();
  const organizations = await seedOrganizations(users);
  const campaigns = await seedCampaigns(organizations);
  const needs = await seedNeeds(campaigns);
  const contributions = await seedContributions(users, needs);
  const timeCredits = await seedTimeCredits(users, organizations);
  const partners = await seedRecognitionPartners();
  
  // 3. Log summary
  console.log('Seed completed:', {
    users: users.length,
    organizations: organizations.length,
    // ... counts
  });
}
```

#### 3.5.4 Files to Create

1. `packages/database/src/seed.ts` - Main seed script
2. `packages/database/src/seed/users.ts` - User seed data
3. `packages/database/src/seed/organizations.ts` - Organization data
4. `packages/database/src/seed/campaigns.ts` - Campaign data
5. `packages/database/src/seed/needs.ts` - Need data
6. `packages/database/src/seed/contributions.ts` - Contribution data
7. `packages/database/src/seed/time-credits.ts` - Time credit data
8. `packages/database/src/seed/recognition-partners.ts` - Partner data
9. `packages/database/src/seed/index.ts` - Export helpers

**File to Modify:**
- `packages/database/package.json` - Add seed script

**Success Criteria:**
- [ ] Seed script completes without errors
- [ ] All entities seeded with realistic data
- [ ] Relationships properly linked
- [ ] Can run multiple times (idempotent)
- [ ] Data visible in database: `psql bidra -c "SELECT COUNT(*) FROM \"Campaign\""`

---

### Phase 6: Testing

**Duration**: 1.5 days
**Priority**: High
**Depends On**: Phases 3, 5 complete

#### 3.6.1 Test Strategy

**Test Types:**
- Unit tests for repositories (isolated)
- Integration tests for complex queries
- Transaction tests
- Error scenario tests

**Test Database:**
- Separate test database (`bidra_test`)
- Clean state before each test
- Seed data as needed per test
- Automatic cleanup after tests

**Coverage Target**: >80% for repository code

#### 3.6.2 Test Structure

**Unit Tests** - Per repository:
```typescript
describe('OrganizationRepository', () => {
  let repository: OrganizationRepository;
  
  beforeEach(async () => {
    await cleanTestDatabase();
    repository = new OrganizationRepository(prisma);
  });
  
  describe('findById', () => {
    it('should return organization when found', async () => {
      const org = await createTestOrganization();
      const result = await repository.findById(org.id);
      expect(result).toMatchObject(org);
    });
    
    it('should return null when not found', async () => {
      const result = await repository.findById('nonexistent');
      expect(result).toBeNull();
    });
  });
  
  // ... more tests
});
```

**Integration Tests** - Complex scenarios:
```typescript
describe('Contribution flow', () => {
  it('should create contribution with type-specific data', async () => {
    // Setup
    const user = await createTestUser();
    const org = await createTestOrganization();
    const campaign = await createTestCampaign(org.id);
    const need = await createTestNeed(campaign.id, 'money');
    
    // Execute
    const contribution = await contributionRepo.create({
      userId: user.id,
      needId: need.id,
      contributionType: 'money',
      moneyContribution: {
        amount: 500,
        currency: 'NOK',
      },
    });
    
    // Assert
    expect(contribution.contributionType).toBe('money');
    expect(contribution.moneyContribution).toBeDefined();
    expect(contribution.moneyContribution.amount).toBe(500);
  });
});
```

#### 3.6.3 Test Files to Create

**Unit Tests:**
1. `packages/database/src/repositories/__tests__/organization.repository.test.ts`
2. `packages/database/src/repositories/__tests__/campaign.repository.test.ts`
3. `packages/database/src/repositories/__tests__/need.repository.test.ts`
4. `packages/database/src/repositories/__tests__/contribution.repository.test.ts`
5. `packages/database/src/repositories/__tests__/time-credit.repository.test.ts`
6. `packages/database/src/repositories/__tests__/recognition-partner.repository.test.ts`

**Integration Tests:**
7. `packages/database/src/__tests__/integration/contribution-flow.test.ts`
8. `packages/database/src/__tests__/integration/campaign-lifecycle.test.ts`

**Test Utilities:**
9. `packages/database/src/__tests__/helpers/test-data.ts` - Test data factories
10. `packages/database/src/__tests__/helpers/database.ts` - Setup/teardown
11. `packages/database/src/__tests__/setup.ts` - Jest setup

**Configuration:**
12. `packages/database/jest.config.js` - Jest configuration

**Success Criteria:**
- [ ] All repository methods tested
- [ ] >80% code coverage
- [ ] All tests pass: `pnpm --filter @bidra/database test`
- [ ] Integration tests cover main flows
- [ ] Error scenarios tested
- [ ] Transaction behavior verified

---

### Phase 7: Documentation

**Duration**: 1 day
**Priority**: Medium
**Depends On**: All phases complete

#### 3.7.1 Documentation Structure

**Entity Relationship Diagram:**
- Visual representation of all entities
- Relationships with cardinality
- Key fields highlighted
- Generated from Prisma schema

**Data Model Documentation:**
- Field-by-field descriptions
- Business rules
- Validation constraints
- Example values

**Repository Usage Guide:**
- How to import repositories
- Common query examples
- Transaction patterns
- Error handling examples

**Migration Guide:**
- How to create migrations
- How to apply migrations
- Rollback procedures
- Production migration checklist

#### 3.7.2 Files to Create/Update

**Architecture Documentation:**
1. `docs/architecture/data-model.md` - ERD and field descriptions
2. `docs/architecture/repository-pattern.md` - Repository pattern docs

**Package Documentation:**
3. `docs/01-packages/database.md` - Database package guide
4. `docs/01-packages/types.md` - Types package reference

**Usage Examples:**
5. `docs/examples/database-queries.md` - Common query patterns

**README Updates:**
6. Update `README.md` - Add migration instructions
7. Update `packages/database/README.md` - Package-specific docs

**API Reference:**
8. Generate TypeDoc for packages/database
9. Generate TypeDoc for packages/types

#### 3.7.3 Documentation Content

**Data Model Documentation Template:**
```markdown
## Organization

Norwegian non-profit, charity, or community organization.

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | String (UUID) | Yes | Unique identifier |
| name | String | Yes | Organization name |
| organizationNumber | String | Yes | 9-digit Norwegian org number |
| organizationType | Enum | Yes | Type of organization |
| verificationStatus | Enum | Yes | Verification state |
| ... | ... | ... | ... |

### Relationships

- **campaigns** (1:N) - Campaigns created by this organization
- **timeCredits** (1:N) - Time credits awarded by this organization

### Business Rules

- Organization number must be unique
- Must be verified before creating campaigns
- Cannot be deleted if has active campaigns
```

**Success Criteria:**
- [ ] ERD diagram created and accurate
- [ ] All entities documented
- [ ] Repository usage examples provided
- [ ] Migration guide complete
- [ ] README updated with Package 1 info
- [ ] TypeDoc API reference generated

---

## 4. Implementation Checklist

### Phase 1: Database Schema ✓
- [ ] All 12 entities defined in schema.prisma
- [ ] Enums for all type/status fields
- [ ] Relationships with foreign keys
- [ ] Indexes on key fields
- [ ] Schema validation passes

### Phase 2: TypeScript Types ✓
- [ ] Domain interfaces match Prisma models
- [ ] Enums exported for runtime use
- [ ] Type guards for contribution types
- [ ] Utility types (Create, Update)
- [ ] JSDoc comments complete
- [ ] No TypeScript errors

### Phase 3: Repositories ✓
- [ ] BaseRepository implemented
- [ ] 6 entity repositories implemented
- [ ] Custom exceptions defined
- [ ] Transaction support working
- [ ] Error handling tested
- [ ] No lint errors

### Phase 4: Migrations ✓
- [ ] Migration generated
- [ ] Migration applies successfully
- [ ] Can rollback migration
- [ ] All constraints active
- [ ] Indexes created

### Phase 5: Seed Data ✓
- [ ] Seed script completes
- [ ] Realistic Norwegian data
- [ ] All entities seeded
- [ ] Relationships linked
- [ ] Idempotent execution

### Phase 6: Testing ✓
- [ ] Unit tests for all repositories
- [ ] Integration tests for flows
- [ ] >80% code coverage
- [ ] All tests pass
- [ ] Error scenarios covered

### Phase 7: Documentation ✓
- [ ] ERD diagram created
- [ ] All entities documented
- [ ] Repository guide complete
- [ ] Migration guide complete
- [ ] README updated
- [ ] API reference generated

### Final Validation ✓
- [ ] `pnpm build` succeeds
- [ ] `pnpm lint` passes
- [ ] `pnpm test` passes
- [ ] Database migrations apply
- [ ] Seed data loads
- [ ] All documentation reviewed

---

## 5. Technical Specifications

### 5.1 Technology Versions

- Node.js: >=20.0.0
- pnpm: >=8.0.0
- TypeScript: ^5.3.3
- Prisma: ^5.8.0
- PostgreSQL: 16
- Jest: ^29.7.0

### 5.2 Package Dependencies

**packages/database:**
- @prisma/client: ^5.8.0
- prisma: ^5.8.0 (devDependency)

**packages/types:**
- No external dependencies (pure TypeScript)

### 5.3 Environment Variables

**Required for Package 1:**
```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/bidra
```

**Optional for testing:**
```bash
DATABASE_TEST_URL=postgresql://postgres:postgres@localhost:5432/bidra_test
```

### 5.4 Scripts to Add

**packages/database/package.json:**
```json
{
  "scripts": {
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:push": "prisma db push",
    "db:seed": "tsx src/seed.ts",
    "db:reset": "prisma migrate reset",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

---

## 6. Success Metrics

Package 1 is **COMPLETE** when:

✅ All 7 phases implemented
✅ All checklist items marked complete
✅ Build succeeds: `pnpm build`
✅ Tests pass: `pnpm test` (>80% coverage)
✅ Lint passes: `pnpm lint`
✅ Database can be seeded: `pnpm --filter @bidra/database db:seed`
✅ Documentation reviewed and approved
✅ Ready for Package 2 (authentication)

---

## 7. Risk Management

### High Risk Items

**Risk**: Contribution polymorphism complexity
- **Mitigation**: Use proven table-per-type pattern
- **Fallback**: Single table with JSON (less type-safe)

**Risk**: JSON field validation
- **Mitigation**: Implement Zod schemas in service layer (Package 3)
- **Package 1 Action**: Document expected JSON structure

### Medium Risk Items

**Risk**: Performance with large datasets
- **Mitigation**: Strategic indexes, pagination required
- **Monitoring**: Add query performance logging

**Risk**: Migration conflicts in team development
- **Mitigation**: Always pull before creating migrations
- **Process**: Coordinate schema changes

### Low Risk Items

**Risk**: TypeScript strict mode errors
- **Mitigation**: Already configured, catches errors early

**Risk**: Test database cleanup
- **Mitigation**: Automated teardown in test setup

---

## 8. Post-Implementation Tasks

After Package 1 is complete:

1. **Code Review**: Full review of all implemented code
2. **Documentation Review**: Verify all docs are accurate
3. **Performance Baseline**: Measure query performance
4. **Team Handoff**: Present to team, answer questions
5. **Package 2 Planning**: Begin authentication package planning

---

## 9. Appendix

### 9.1 File Structure Summary

```
packages/
├── database/
│   ├── schema.prisma (MODIFIED - add all entities)
│   ├── src/
│   │   ├── index.ts (MODIFIED - export repositories)
│   │   ├── repositories/
│   │   │   ├── base.repository.ts (NEW)
│   │   │   ├── organization.repository.ts (NEW)
│   │   │   ├── campaign.repository.ts (NEW)
│   │   │   ├── need.repository.ts (NEW)
│   │   │   ├── contribution.repository.ts (NEW)
│   │   │   ├── time-credit.repository.ts (NEW)
│   │   │   ├── recognition-partner.repository.ts (NEW)
│   │   │   ├── index.ts (NEW)
│   │   │   └── __tests__/ (NEW - 8 test files)
│   │   ├── exceptions/
│   │   │   ├── database.exception.ts (NEW)
│   │   │   └── index.ts (NEW)
│   │   ├── types/
│   │   │   └── repository.types.ts (NEW)
│   │   ├── seed/
│   │   │   ├── users.ts (NEW)
│   │   │   ├── organizations.ts (NEW)
│   │   │   ├── campaigns.ts (NEW)
│   │   │   ├── needs.ts (NEW)
│   │   │   ├── contributions.ts (NEW)
│   │   │   ├── time-credits.ts (NEW)
│   │   │   ├── recognition-partners.ts (NEW)
│   │   │   └── index.ts (NEW)
│   │   ├── seed.ts (NEW)
│   │   └── __tests__/
│   │       ├── setup.ts (NEW)
│   │       ├── helpers/
│   │       │   ├── test-data.ts (NEW)
│   │       │   └── database.ts (NEW)
│   │       └── integration/ (NEW - 2 test files)
│   ├── jest.config.js (NEW)
│   └── package.json (MODIFIED - add scripts)
│
└── types/
    ├── src/
    │   ├── domain/
    │   │   ├── user.ts (NEW)
    │   │   ├── organization.ts (NEW)
    │   │   ├── campaign.ts (NEW)
    │   │   ├── need.ts (NEW)
    │   │   ├── contribution.ts (NEW)
    │   │   ├── time-credit.ts (NEW)
    │   │   ├── recognition-partner.ts (NEW)
    │   │   ├── enums.ts (NEW)
    │   │   └── index.ts (NEW)
    │   └── index.ts (MODIFIED - export domain types)
    └── package.json (no changes)

docs/
├── 01-packages/
│   ├── database.md (NEW)
│   └── types.md (NEW)
├── architecture/
│   ├── data-model.md (NEW)
│   └── repository-pattern.md (NEW)
└── examples/
    └── database-queries.md (NEW)

README.md (MODIFIED - add Package 1 info)
```

### 9.2 Estimated Hours by Phase

| Phase | Effort | Notes |
|-------|--------|-------|
| Phase 1: Schema | 8 hours | Complex relationships |
| Phase 2: Types | 6 hours | Straightforward mapping |
| Phase 3: Repositories | 12 hours | Most complex phase |
| Phase 4: Migrations | 2 hours | Mostly automated |
| Phase 5: Seed Data | 8 hours | Realistic data takes time |
| Phase 6: Testing | 10 hours | Comprehensive coverage |
| Phase 7: Documentation | 6 hours | Writing and diagrams |
| **Total** | **52 hours** | ~1-2 weeks for 1 developer |

### 9.3 Deliverables Summary

**Code Deliverables:**
- Complete Prisma schema (1 file modified)
- Domain type definitions (9 files created)
- Repository implementations (10 files created)
- Exception classes (2 files created)
- Seed data scripts (8 files created)
- Test suites (12 files created)

**Documentation Deliverables:**
- Data model documentation (1 file)
- Repository pattern guide (1 file)
- Package guides (2 files)
- Usage examples (1 file)
- Updated README (1 file)

**Total: 48 new files, 4 modified files**

---

## 10. Approval Request

This implementation plan is now ready for review and approval.

**Ready to proceed?** Upon your approval, I will:
1. Implement each phase sequentially
2. Validate success criteria after each phase
3. Report progress regularly
4. Stop after Phase 7 completion
5. Request final review before marking Package 1 complete

**Questions before proceeding:**
1. Does this plan align with your Package 1 vision?
2. Any modifications to scope or priorities?
3. Any specific Norwegian data requirements for seed data?
4. Preferred testing framework (Jest is assumed)?
5. Any additional documentation requirements?

**Awaiting your approval to begin implementation.**