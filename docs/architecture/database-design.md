# Database Design

## Overview

The Bidra platform uses PostgreSQL as the primary database, accessed through Prisma ORM. The schema is designed for scalability, data integrity, and type safety.

## Design Principles

### 1. UUID Primary Keys
All entities use CUID (Collision-resistant Universal Identifiers) instead of auto-incrementing integers:
- **Security**: Prevents enumeration attacks
- **Distribution**: Safe for distributed systems
- **Migration**: Easy to merge datasets

### 2. Soft Deletes
All core entities support soft deletion via `deletedAt` timestamp:
- Preserves data integrity and audit trails
- Allows data recovery
- Maintains referential integrity

### 3. Polymorphic Contributions
Contributions use a table-per-type strategy:
- Base `Contribution` table with common fields
- Type-specific tables (MoneyContribution, VolunteerContribution, etc.)
- One-to-one optional relationships

### 4. JSON for Flexible Data
JSON columns used for:
- Arrays of images/photos
- Nested item lists (goods, equipment)
- Partner benefits
- Allows schema evolution without migrations

### 5. Strategic Indexing
Indexes on:
- Foreign keys for join performance
- Status fields for filtering
- Date fields for range queries
- Common query patterns (userId + createdAt)

## Entity Relationships

```
User
  ├─ Contribution (many)
  └─ TimeCredit (many)

Organization
  ├─ Campaign (many)
  └─ TimeCredit (many)

Campaign
  ├─ Organization (one)
  └─ Need (many)

Need
  ├─ Campaign (one)
  └─ Contribution (many)

Contribution
  ├─ Need (one)
  ├─ User (one)
  └─ [Type-specific] (one, optional)
```

## Contribution Type Strategy

The platform supports 6 contribution types using a polymorphic model:

### Base Contribution
Common fields for all types:
- needId, userId
- contributionType (enum)
- status, message
- audit fields

### Type-Specific Tables

**MoneyContribution**
- Payment details (amount, currency)
- Stripe integration (paymentIntentId)
- Receipt generation

**VolunteerContribution**
- Time commitment (hours, date, time range)
- Skills offered
- Check-in/check-out tracking

**GoodsContribution**
- Items array (JSON)
- Condition tracking
- Delivery logistics

**EquipmentContribution**
- Equipment array (JSON)
- Loan period tracking
- Return status and condition notes

**SkillsContribution**
- Skill description and estimated hours
- Delivery tracking
- Feedback system

## Data Integrity

### Cascade Deletes
- Organization deleted → Campaigns deleted
- Campaign deleted → Needs deleted
- Need deleted → Contributions deleted
- Contribution deleted → Type-specific data deleted

### Constraints
- Unique organization numbers (Norwegian 9-digit)
- Unique emails for users
- Unique Stripe account/payment IDs

### Validation
- Enum constraints for status fields
- Required fields enforced at DB level
- Decimal precision for monetary values

## Performance Considerations

### Indexing Strategy
- Primary queries: indexed on foreign keys + common filters
- Search: GIN indexes for full-text (future enhancement)
- Time-series: indexed on date fields with DESC sort

### Query Optimization
- Repository pattern with includes for N+1 prevention
- Pagination support in all list queries
- Strategic use of `select` to limit returned fields

### Scaling Patterns
- Read replicas for heavy read operations
- Connection pooling via Prisma
- Prepared statements for query caching

## Migration Strategy

### Development
Use `prisma db push` for rapid iteration:
```bash
pnpm --filter @bidra/database db:push
```

### Production
Use migrations for versioned schema changes:
```bash
pnpm --filter @bidra/database db:migrate
```

### Rollback
Migrations are reversible via Prisma's migration history.

## Future Enhancements

### Potential Additions
1. Full-text search indexes for campaigns/needs
2. Materialized views for analytics
3. Partitioning for large contribution tables
4. Event sourcing for audit log
5. Read replicas for scaling