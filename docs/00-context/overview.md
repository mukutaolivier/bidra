# Bidra Platform Overview

## Introduction

Bidra is a Norwegian community contribution platform designed to connect people, companies, and organizations with campaigns that need support through various forms of contribution.

## Mission

Enable communities to support meaningful campaigns through flexible contribution methods including monetary donations, volunteering, goods donation, equipment lending, skill sharing, and other resources.

## Core Concepts

### Contribution Types

The platform supports multiple forms of contribution:

1. **Money** - Direct financial contributions via Stripe Connect
2. **Volunteer Time** - Time commitment for campaign activities
3. **Goods** - Physical items donated to campaigns
4. **Equipment** - Items lent temporarily to campaigns
5. **Skills** - Professional or personal expertise shared
6. **Other Resources** - Flexible additional contribution types

### Key Entities

- **Organizations** - Legal entities that create and manage campaigns
- **Campaigns** - Specific initiatives seeking contributions
- **Needs** - Specific requirements within campaigns
- **Contributions** - Individual acts of giving or supporting
- **Contributors** - Users who make contributions
- **Time Credits** - Recognition system for volunteer contributions
- **Recognition Partners** - Organizations offering benefits for contributors

## Technology Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend**: NestJS, Node.js, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Queue**: Redis with BullMQ
- **Payments**: Stripe Connect
- **Infrastructure**: Docker, pnpm monorepo

## Platform Features

1. Organization management and verification
2. Campaign creation and lifecycle management
3. Flexible contribution system
4. Payment processing with Stripe Connect
5. Volunteer management and time tracking
6. Time Credits system
7. Recognition partner program
8. Administrative platform
9. Reporting and analytics

## Target Users

- **Contributors**: Individuals wanting to support campaigns
- **Organizations**: Non-profits, community groups, initiatives
- **Campaign Managers**: People running specific campaigns
- **Administrators**: Platform operators
- **Recognition Partners**: Businesses offering contributor benefits

## Norwegian Context

The platform is designed specifically for the Norwegian market with:

- Norwegian language interface (no/nb-NO)
- Integration with Norwegian payment systems
- Compliance with Norwegian regulations
- Cultural considerations for community engagement