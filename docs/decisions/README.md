# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records documenting significant architectural and technical decisions made for the Bidra platform.

## What is an ADR?

An Architecture Decision Record (ADR) captures an important architectural decision made along with its context and consequences.

## ADR Format

Each ADR should follow this structure:

```markdown
# [Number]. [Title]

Date: YYYY-MM-DD
Status: [Proposed | Accepted | Deprecated | Superseded]
Deciders: [List of people involved]

## Context

What is the issue we're seeing that is motivating this decision or change?

## Decision

What is the change that we're proposing and/or doing?

## Consequences

What becomes easier or more difficult to do because of this change?

### Positive
- Benefit 1
- Benefit 2

### Negative
- Drawback 1
- Drawback 2

### Neutral
- Trade-off 1
```

## Naming Convention

ADRs should be named: `NNNN-title-with-dashes.md`

Example: `0001-use-pnpm-monorepo.md`

## Decision Log

| # | Title | Date | Status |
|---|-------|------|--------|
| 0001 | Use pnpm Monorepo | 2026-07-10 | Accepted |
| 0002 | Next.js App Router for Frontend | 2026-07-10 | Accepted |
| 0003 | NestJS for Backend API | 2026-07-10 | Accepted |
| 0004 | PostgreSQL with Prisma | 2026-07-10 | Accepted |
| 0005 | Redis and BullMQ for Queues | 2026-07-10 | Accepted |

## Guidelines

1. Create an ADR for significant decisions that:
   - Affect system structure or architecture
   - Have long-term implications
   - Are difficult or costly to change later
   - Involve trade-offs between alternatives

2. Keep ADRs:
   - Concise but complete
   - Objective and factual
   - Focused on the decision, not implementation details

3. Update ADRs when:
   - A decision is superseded by a new one
   - Significant new information emerges
   - Implementation reveals important consequences

4. Don't create ADRs for:
   - Routine implementation choices
   - Obvious decisions with no alternatives
   - Decisions that can be easily reversed