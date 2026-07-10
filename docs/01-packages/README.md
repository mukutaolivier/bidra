# Package Documentation

This directory contains detailed documentation for each shared package in the monorepo.

## Shared Packages

### @bidra/database
- Prisma client and database connection
- Schema definitions
- Migration management
- Database utilities

### @bidra/types
- Shared TypeScript interfaces and types
- Common data structures
- API contracts
- Domain models

### @bidra/queue
- BullMQ queue setup and management
- Job definitions
- Queue utilities
- Worker abstractions

### @bidra/config
- Shared configuration constants
- Environment variable management
- Feature flags
- Application settings

## Usage Guidelines

1. Import from packages using workspace protocol: `"@bidra/types": "workspace:*"`
2. Keep packages focused and single-purpose
3. Maintain clear public API surfaces
4. Document breaking changes
5. Version packages independently when needed

## Adding New Packages

1. Create directory under `packages/`
2. Add package.json with proper naming: `@bidra/<name>`
3. Include in pnpm-workspace.yaml
4. Add tsconfig.json extending base config
5. Document package purpose and API
6. Update this README

## Package Dependencies

Packages should follow this dependency hierarchy:
- config (no dependencies)
- types (no dependencies)
- database (depends on types)
- queue (depends on types, config)

Applications (web, api, worker) can depend on any package.