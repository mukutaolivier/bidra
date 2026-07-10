# Package Documentation

This directory contains detailed documentation for each shared package in the Bidra monorepo.

## Package Overview

### Core Packages

#### @bidra/database
Database layer with Prisma ORM, entity schemas, and repository pattern.

**Key Features:**
- Complete Prisma schema for all 12 core entities
- Repository pattern with base class
- Type-specific contribution handlers
- Soft delete support
- Strategic indexing for performance

**Status:** ✅ Implemented (Package 1)

**See:** [Database Package README](../../packages/database/README.md)

#### @bidra/types
Shared TypeScript types and interfaces used across the platform.

**Key Features:**
- Domain models matching Prisma schema
- All domain enums exported
- Type guards for contribution types
- Input/output type definitions

**Status:** ✅ Implemented (Package 1)

#### @bidra/queue
Job queue management using BullMQ and Redis.

**Key Features:**
- Queue factory for different job types
- Type-safe job definitions
- Shared Redis connection

**Status:** ⏳ Scaffolded (implementation pending)

#### @bidra/config
Shared configuration and constants.

**Key Features:**
- Application constants
- Environment variable helpers
- Pagination defaults

**Status:** ⏳ Scaffolded (implementation pending)

## Package Dependencies

```
types (no dependencies)
  ↓
database (depends on types)
  ↓
config (depends on types)
  ↓
queue (depends on types, config)
```

Applications (web, api, worker) can depend on any package.

## Package Structure

Each package follows this structure:

```
packages/[package-name]/
├── package.json          # Package manifest
├── tsconfig.json         # TypeScript config
├── README.md            # Package documentation
└── src/
    ├── index.ts         # Main export file
    └── [modules]/       # Package modules
```

## Development

### Installing Dependencies

```bash
# Install all packages
pnpm install

# Install for specific package
pnpm --filter @bidra/database install
```

### Building Packages

```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter @bidra/database build
```

### Using Packages in Applications

```typescript
// In apps/api or apps/web
import { prisma, UserRepository } from "@bidra/database";
import type { User, Campaign } from "@bidra/types";
```

## Implementation Status

| Package | Status | Package |
|---------|--------|---------|
| @bidra/database | ✅ Complete | 1 |
| @bidra/types | ✅ Complete | 1 |
| @bidra/queue | ⏳ Pending | 2 |
| @bidra/config | ⏳ Pending | 2 |

## Next Steps

Future package development will include:
1. Authentication package (Package 2)
2. Email/notification package
3. File upload/storage package
4. Analytics package
5. Reporting package