# System Architecture Overview

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         External Users                           │
│                    (Contributors, Organizations)                 │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Web)                           │
│                    Next.js 15 + React 19                        │
│              SSR, Client Components, API Routes                  │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Backend API                              │
│                           NestJS                                 │
│              REST API, WebSockets, Validation                    │
└────────────┬───────────────────────────────┬────────────────────┘
             │                               │
             ▼                               ▼
┌────────────────────────┐      ┌───────────────────────┐
│   PostgreSQL Database   │      │    Redis Cache        │
│      (Prisma ORM)      │      │   (BullMQ Queues)     │
└────────────────────────┘      └───────┬───────────────┘
                                        │
                                        ▼
                              ┌─────────────────────┐
                              │   Worker Service    │
                              │   Background Jobs   │
                              └─────────────────────┘
```

## Components

### Frontend Application (apps/web)
- **Technology**: Next.js 15 with App Router
- **Responsibilities**:
  - Server-side rendering for SEO and performance
  - Client-side interactivity
  - Form handling and validation
  - API communication
  - State management
- **Key Features**:
  - Campaign browsing and search
  - Contribution flows
  - User profiles
  - Organization dashboards
  - Admin interface

### Backend API (apps/api)
- **Technology**: NestJS with Express
- **Responsibilities**:
  - Business logic implementation
  - Data validation and sanitization
  - Authentication and authorization
  - Database operations
  - Queue job scheduling
  - External API integrations
- **Architecture Patterns**:
  - Modular architecture (feature modules)
  - Dependency injection
  - Guards and interceptors
  - DTOs and validation pipes

### Worker Service (apps/worker)
- **Technology**: Node.js with BullMQ
- **Responsibilities**:
  - Process background jobs
  - Handle async operations
  - Send notifications
  - Generate reports
  - Process payments
  - Clean up data

### Shared Packages (packages/)
- **@bidra/database**: Prisma client and schema
- **@bidra/types**: Shared TypeScript types
- **@bidra/queue**: Queue setup and utilities
- **@bidra/config**: Configuration constants

## Data Flow

### Synchronous Operations
1. User interacts with frontend
2. Frontend calls backend API
3. Backend validates and processes
4. Database operations via Prisma
5. Response returned to frontend
6. UI updates

### Asynchronous Operations
1. API receives request
2. API validates and adds job to queue
3. API returns immediate response
4. Worker picks up job from queue
5. Worker processes job
6. Worker updates database
7. Notification sent if needed

## Infrastructure

### Development
- Local Docker Compose setup
- PostgreSQL and Redis containers
- Hot reload for all services
- Shared volumes for development

### Production
- Container orchestration (Kubernetes/Docker Swarm)
- Managed PostgreSQL database
- Managed Redis cluster
- CDN for static assets
- Load balancers
- Monitoring and logging

## Security Layers

1. **Network Security**: HTTPS, CORS, rate limiting
2. **Authentication**: JWT tokens, session management
3. **Authorization**: Role-based access control
4. **Data Security**: Encryption at rest and in transit
5. **Input Validation**: Request validation, sanitization
6. **API Security**: API keys, OAuth for integrations

## Scalability Strategy

### Horizontal Scaling
- Stateless API servers
- Multiple worker instances
- Load balancing
- Database read replicas

### Caching Strategy
- Redis for session data
- Redis for frequently accessed data
- CDN for static assets
- Browser caching

### Queue Management
- BullMQ for reliable job processing
- Job priorities and delays
- Retry strategies
- Dead letter queues