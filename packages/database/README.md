# @bidra/database

Database package for the Bidra platform using Prisma ORM.

## Setup

### Install Dependencies

```bash
pnpm install
```

### Environment Variables

Create `.env` file in the project root:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/bidra"
```

### Initialize Database

```bash
# Generate Prisma Client
pnpm --filter @bidra/database db:generate

# Push schema to database (development)
pnpm --filter @bidra/database db:push

# Or run migrations (production)
pnpm --filter @bidra/database db:migrate
```

## Schema Overview

The database schema includes:

### Core Entities
- **User** - Platform users (contributors, org admins, platform admins)
- **Organization** - Norwegian non-profit organizations
- **Campaign** - Fundraising or resource gathering campaigns
- **Need** - Specific requirements for campaigns

### Contribution Types
- **Contribution** - Base contribution record
- **MoneyContribution** - Financial donations
- **VolunteerContribution** - Time commitments
- **GoodsContribution** - Physical item donations
- **EquipmentContribution** - Temporary equipment loans
- **SkillsContribution** - Professional expertise

### Supporting Entities
- **TimeCredit** - Rewards for volunteer contributions
- **RecognitionPartner** - Businesses offering volunteer benefits

## Repository Pattern

All entities have corresponding repository classes with full CRUD operations:

```typescript
import { prisma } from "@bidra/database";
import { UserRepository } from "@bidra/database";

const userRepo = new UserRepository(prisma);

// Find user by email
const user = await userRepo.findByEmail("user@example.com");

// Create new user
const newUser = await userRepo.create({
  email: "new@example.com",
  name: "New User",
  language: "no",
  role: "USER",
  status: "ACTIVE",
});

// Soft delete
await userRepo.softDelete(user.id);
```

## Available Repositories

- `UserRepository` - User management
- `OrganizationRepository` - Organization management with verification
- `CampaignRepository` - Campaign management with search
- `NeedRepository` - Campaign needs
- `ContributionRepository` - All contribution types with type-specific methods

## Type Safety

All Prisma types are exported from this package:

```typescript
import type { User, Organization, Campaign } from "@bidra/database";
```

## Database Commands

```bash
# Generate Prisma Client
pnpm db:generate

# Push schema changes (dev)
pnpm db:push

# Create migration
pnpm db:migrate

# Open Prisma Studio
pnpm db:studio

# Reset database (WARNING: deletes all data)
pnpm db:reset
```

## Architecture

- **Soft Deletes**: All entities support soft deletion via `deletedAt` timestamp
- **UUID Keys**: All primary keys use CUID for security and distribution
- **Polymorphic Contributions**: Table-per-type strategy for contribution types
- **Indexing**: Strategic indexes for common queries and foreign keys
- **JSON Fields**: Flexible storage for arrays and nested data (images, items, benefits)

## Error Handling

Custom exceptions are available for repository operations:

```typescript
import { EntityNotFoundError, ValidationError } from "@bidra/database";

try {
  await userRepo.findById("invalid-id");
} catch (error) {
  if (error instanceof EntityNotFoundError) {
    // Handle not found
  }
}
```