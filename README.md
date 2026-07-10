# Bidra

Norwegian community contribution platform connecting people, companies, and organizations with campaigns through flexible contribution methods.

## Overview

Bidra enables communities to support meaningful campaigns through:
- **Money** - Financial contributions via Stripe Connect
- **Volunteer Time** - Time commitment for activities
- **Goods** - Physical item donations
- **Equipment** - Temporary item lending
- **Skills** - Professional expertise sharing
- **Other Resources** - Flexible contribution types

## Technology Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend**: NestJS, Node.js, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Queue**: Redis with BullMQ
- **Infrastructure**: Docker, pnpm monorepo

## Project Structure

```
bidra/
├── apps/
│   ├── web/          # Next.js frontend application
│   ├── api/          # NestJS backend API
│   └── worker/       # Background job worker
├── packages/
│   ├── database/     # Prisma client and schema
│   ├── types/        # Shared TypeScript types
│   ├── queue/        # BullMQ queue setup
│   └── config/       # Shared configuration
├── infrastructure/
│   ├── docker-compose.yml
│   ├── Dockerfile.web
│   ├── Dockerfile.api
│   └── Dockerfile.worker
└── docs/
    ├── 00-context/        # Business context
    ├── 01-packages/       # Package documentation
    ├── 02-specifications/ # Technical specs
    ├── architecture/      # Architecture docs
    └── decisions/         # ADRs
```

## Prerequisites

- Node.js >= 20.0.0
- pnpm >= 8.0.0
- Docker and Docker Compose (for local development)

## Getting Started

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Start Infrastructure

Start PostgreSQL and Redis using Docker Compose:

```bash
cd infrastructure
docker-compose up -d
```

### 3. Setup Environment Variables

Copy example environment files:

```bash
# For API
cp apps/api/.env.example apps/api/.env

# For Worker
cp apps/worker/.env.example apps/worker/.env
```

### 4. Setup Database

Generate Prisma client and run migrations:

```bash
pnpm --filter @bidra/database db:generate
pnpm --filter @bidra/database db:push
```

### 5. Start Development Servers

Start all services in development mode:

```bash
pnpm dev
```

This will start:
- **Frontend** on http://localhost:3000
- **API** on http://localhost:4000
- **Worker** (background service)

## Available Scripts

### Root Level

```bash
pnpm dev          # Start all services in development
pnpm build        # Build all applications
pnpm lint         # Lint all packages
pnpm clean        # Clean all node_modules
```

### Application-Specific

```bash
# Frontend
pnpm --filter @bidra/web dev
pnpm --filter @bidra/web build

# Backend
pnpm --filter @bidra/api dev
pnpm --filter @bidra/api build

# Worker
pnpm --filter @bidra/worker dev
pnpm --filter @bidra/worker build

# Database
pnpm --filter @bidra/database db:generate
pnpm --filter @bidra/database db:push
pnpm --filter @bidra/database db:migrate
```

## Monorepo Architecture

This project uses pnpm workspaces with Turborepo for build orchestration.

### Shared Packages

- **@bidra/database** - Prisma client and database utilities
- **@bidra/types** - Shared TypeScript interfaces and types
- **@bidra/queue** - BullMQ queue configuration and utilities
- **@bidra/config** - Shared configuration constants

### Applications

- **@bidra/web** - Next.js frontend with App Router
- **@bidra/api** - NestJS REST API
- **@bidra/worker** - Background job processing with BullMQ

## Documentation

Comprehensive documentation is available in the `docs/` directory:

- **[Context](docs/00-context/README.md)** - Business context and domain understanding
- **[Packages](docs/01-packages/README.md)** - Detailed package documentation
- **[Specifications](docs/02-specifications/README.md)** - Technical specifications
- **[Architecture](docs/architecture/README.md)** - System architecture
- **[Decisions](docs/decisions/README.md)** - Architecture Decision Records (ADRs)

## Development Workflow

1. Create feature branches from `main`
2. Make changes and test locally
3. Run linting: `pnpm lint`
4. Build all packages: `pnpm build`
5. Commit changes with clear messages
6. Create pull request for review

## Database Migrations

```bash
# Create a new migration
pnpm --filter @bidra/database db:migrate --name migration_name

# Apply migrations
pnpm --filter @bidra/database db:migrate

# Reset database (development only)
pnpm --filter @bidra/database db:reset
```

## Docker Deployment

Build and run services using Docker:

```bash
# Build images
docker build -f infrastructure/Dockerfile.web -t bidra-web .
docker build -f infrastructure/Dockerfile.api -t bidra-api .
docker build -f infrastructure/Dockerfile.worker -t bidra-worker .

# Run with docker-compose
cd infrastructure
docker-compose up
```

## Contributing

This is a production-ready platform architecture. When implementing features:

1. Follow the established patterns in existing code
2. Add tests for new functionality
3. Update documentation as needed
4. Create ADRs for significant architectural decisions
5. Ensure TypeScript strict mode compliance

## License

[License information to be added]

## Support

For questions or issues, please refer to the documentation in `docs/` or contact the development team.