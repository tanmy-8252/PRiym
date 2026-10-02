---

<div align="center">

# PRiym

### Progress • Recognition • Innovation • Merit

# Implementation Plan & Engineering Roadmap

**Atria Institute of Technology — CSE Department MVP**

---

_Engineering Internal — Development Team Use Only_

Document ID: `AIT-PRiym-IMPL-2026-001`
Version: **1.0** | August 2026
Status: **Active — Phase 1 In Progress**

</div>

---

# Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture Overview](#2-architecture-overview)
3. [Repository Structure](#3-repository-structure)
4. [Development Environment Setup](#4-development-environment-setup)
5. [Coding Standards](#5-coding-standards)
6. [Git Workflow](#6-git-workflow)
7. [Branching Strategy](#7-branching-strategy)
8. [Folder Structure](#8-folder-structure)
9. [Phase 1 — Planning & Foundation](#9-phase-1--planning--foundation)
10. [Phase 2 — Database](#10-phase-2--database)
11. [Phase 3 — Prisma ORM](#11-phase-3--prisma-orm)
12. [Phase 4 — Authentication](#12-phase-4--authentication)
13. [Phase 5 — Backend APIs](#13-phase-5--backend-apis)
14. [Phase 6 — Business Logic Engines](#14-phase-6--business-logic-engines)
15. [Phase 7 — Storage](#15-phase-7--storage)
16. [Phase 8 — Frontend](#16-phase-8--frontend)
17. [Phase 9 — Testing](#17-phase-9--testing)
18. [Phase 10 — Deployment](#18-phase-10--deployment)
19. [Risks](#19-risks)
20. [Timeline](#20-timeline)
21. [Milestones](#21-milestones)
22. [Definition of Done](#22-definition-of-done)
23. [Post-MVP Roadmap](#23-post-mvp-roadmap)
24. [Technical Debt](#24-technical-debt)
25. [Future Versions](#25-future-versions)

---

# 1. Project Overview

## 1.1 Project Summary

| Attribute              | Value                                               |
| ---------------------- | --------------------------------------------------- |
| **Project Name**       | PRiym (Progress • Recognition • Innovation • Merit) |
| **Type**               | Full-stack web application                          |
| **Institution**        | Atria Institute of Technology, Bengaluru            |
| **MVP Scope**          | Computer Science & Engineering (CSE) department     |
| **Target Users**       | ~700 Students, ~40 Faculty, 1 HOD, 2 Administrators |
| **Estimated Duration** | 16–20 weeks (4–5 months)                            |
| **Team Size**          | 3–5 engineers (recommended)                         |
| **Methodology**        | Agile/Scrum with 2-week sprints                     |

## 1.2 Current Progress

| Item                                 | Status           |
| ------------------------------------ | ---------------- |
| Product idea                         | ✅ Finalized     |
| Business Requirements Document (BRD) | ✅ Complete      |
| Product Requirements Document (PRD)  | ✅ Complete      |
| Wireframes                           | ✅ Complete      |
| User flows                           | ✅ Complete      |
| Database design (PostgreSQL)         | ✅ Complete      |
| ER Diagram                           | ✅ Complete      |
| Implementation Plan                  | 🔄 This document |
| Development                          | ⬜ Not started   |

## 1.3 Phase Dependency Map

The following diagram shows the dependency chain between phases. Phases with no dependency arrow can be parallelized.

```
Phase 1 (Planning)
    |
    v
Phase 2 (Database)
    |
    v
Phase 3 (Prisma ORM)
    |
    +------------------+------------------+
    |                  |                  |
    v                  v                  v
Phase 4 (Auth)    Phase 7 (Storage)   Phase 5 (APIs) [partial]
    |                  |                  |
    +--------+---------+                  |
             |                            |
             v                            v
        Phase 5 (APIs) [full]      Phase 6 (Business Logic)
             |                            |
             +----------------------------+
             |
             v
        Phase 8 (Frontend)
             |
             v
        Phase 9 (Testing)
             |
             v
        Phase 10 (Deployment)
```

> **Key Insight:** Phases 4 (Auth), 5 (APIs - scaffolding), and 7 (Storage) can begin in parallel once Phase 3 is complete. Phase 6 (Business Logic) depends on Phase 5 API scaffolds being in place. Phase 8 (Frontend) should begin incrementally as API modules become stable. Testing (Phase 9) is continuous but has a dedicated hardening sprint.

---

# 2. Architecture Overview

## 2.1 High-Level Architecture

```
+============================================================+
|                      CLIENT TIER                            |
|  +------------------------------------------------------+  |
|  |  Next.js 14 (App Router)                             |  |
|  |  React Server Components + Client Components         |  |
|  |  Tailwind CSS + shadcn/ui                            |  |
|  |  React Query (TanStack) for client-side data         |  |
|  |  React Hook Form + Zod for forms                     |  |
|  +------------------------------------------------------+  |
+============================|================================+
                             | HTTPS / TLS 1.3
+============================v================================+
|                    APPLICATION TIER                          |
|  +------------------------------------------------------+  |
|  |  Next.js API Route Handlers (REST)                   |  |
|  |  Auth.js v5 (NextAuth) — JWT + Session Management    |  |
|  |  Zod — Server-side validation                        |  |
|  |  Middleware — RBAC, rate limiting, logging            |  |
|  +------------------------------------------------------+  |
+=========|===================|===============|===============+
          |                   |               |
+---------v--------+  +------v------+  +-----v-----------+
|   DATA TIER      |  | CACHE TIER  |  |  STORAGE TIER   |
| +--------------+ |  | +---------+ |  | +-------------+ |
| | PostgreSQL   | |  | | Redis   | |  | | Supabase    | |
| | 16 (AWS RDS) | |  | | 7.x    | |  | | Storage     | |
| | via Prisma   | |  | | (AWS    | |  | | (S3-compat) | |
| | ORM 5.x     | |  | | Elasti- | |  | +-------------+ |
| +--------------+ |  | | Cache)  | |  +-----------------+
+------------------+  | +---------+ |
                      +--------------+
```

## 2.2 Component Breakdown

### Frontend

| Component      | Technology                | Purpose                                                     |
| -------------- | ------------------------- | ----------------------------------------------------------- |
| Framework      | Next.js 14 (App Router)   | SSR, RSC, ISR, file-based routing, server actions           |
| Language       | TypeScript 5.x            | Type safety across the stack                                |
| Styling        | Tailwind CSS 3.x          | Utility-first, design-consistent styling                    |
| Components     | shadcn/ui + Radix UI      | Accessible, composable, unstyled base components            |
| Data Fetching  | React Query (TanStack) v5 | Client-side caching, background refetch, optimistic updates |
| Forms          | React Hook Form + Zod     | Schema-validated forms shared with server                   |
| Charts         | Recharts 2.x              | Analytics dashboards and visualizations                     |
| Date Handling  | date-fns 3.x              | Lightweight, tree-shakeable date utilities                  |
| PDF Generation | @react-pdf/renderer       | Portfolio and report PDF exports                            |
| Icons          | Lucide React              | Consistent, lightweight icon set                            |

### Backend

| Component      | Technology                | Purpose                                             |
| -------------- | ------------------------- | --------------------------------------------------- |
| API Layer      | Next.js Route Handlers    | RESTful API endpoints, server actions               |
| Authentication | Auth.js (NextAuth) v5     | Session management, JWT, OAuth providers (future)   |
| ORM            | Prisma 5.x                | Type-safe database access, migrations, seeding      |
| Validation     | Zod 3.x                   | Runtime input validation (shared with frontend)     |
| Job Queue      | BullMQ                    | Background jobs: reports, notifications, SLA checks |
| Email          | Nodemailer / Resend       | Transactional email delivery                        |
| Rate Limiting  | Custom middleware + Redis | API rate limiting per endpoint per role             |

### Database

| Component  | Technology         | Purpose                                               |
| ---------- | ------------------ | ----------------------------------------------------- |
| Primary DB | PostgreSQL 16.x    | Relational data store — ACID, JSONB, full-text search |
| Hosting    | AWS RDS (Multi-AZ) | Managed DB with automated backups and failover        |
| Migrations | Prisma Migrate     | Schema versioning and migration management            |
| Seeding    | Prisma Seed Script | Development and staging data population               |

### Authentication

| Component | Technology            | Purpose                                         |
| --------- | --------------------- | ----------------------------------------------- |
| Provider  | Auth.js v5            | Credential + OAuth (Phase 2) provider           |
| Session   | JWT (HttpOnly cookie) | Stateless session with server-side verification |
| MFA       | otplib (TOTP)         | Time-based one-time passwords                   |
| Password  | bcrypt (12 rounds)    | Secure password hashing                         |

### Storage

| Component    | Technology                                 | Purpose                                             |
| ------------ | ------------------------------------------ | --------------------------------------------------- |
| File Storage | Supabase Storage                           | Achievement documents, certificates, profile photos |
| Backend      | AWS S3                                     | S3-compatible durable object storage                |
| CDN          | Vercel Edge Network                        | Static asset delivery, global edge caching          |
| Virus Scan   | ClamAV (self-hosted) or Cloudflare R2 scan | File upload security                                |

### Deployment

| Component   | Technology               | Purpose                                                   |
| ----------- | ------------------------ | --------------------------------------------------------- |
| App Hosting | Vercel                   | Next.js deployment, serverless functions, preview deploys |
| Database    | AWS RDS                  | Managed PostgreSQL                                        |
| Cache       | AWS ElastiCache          | Managed Redis                                             |
| CI/CD       | GitHub Actions           | Automated lint, test, build, deploy pipeline              |
| Domains     | Custom domain via Vercel | priym.ait.edu.in (or similar)                             |

### Monitoring

| Component      | Technology                        | Purpose                                        |
| -------------- | --------------------------------- | ---------------------------------------------- |
| Error Tracking | Sentry                            | Frontend + backend error capture and alerting  |
| APM            | Vercel Analytics + Speed Insights | Performance monitoring, Core Web Vitals        |
| Logging        | Pino + Vercel Logs                | Structured JSON logging                        |
| Uptime         | Better Uptime / UptimeRobot       | External uptime monitoring and incident alerts |
| Database       | AWS RDS Performance Insights      | Query performance and connection monitoring    |

---

# 3. Repository Structure

## 3.1 Monorepo Architecture

PRiym uses a **monorepo** approach within a single Next.js project. All frontend, backend, and shared code lives in one repository.

```
priym/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                    # Lint + test + build on PR
│   │   ├── deploy-staging.yml        # Auto-deploy to staging on merge to develop
│   │   └── deploy-production.yml     # Deploy to production on merge to main
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── ISSUE_TEMPLATE/
│       ├── bug_report.md
│       ├── feature_request.md
│       └── task.md
├── prisma/
│   ├── schema.prisma                 # Database schema
│   ├── migrations/                   # Migration files
│   └── seed.ts                       # Seed script
├── public/
│   ├── favicon.ico
│   ├── logo.svg
│   └── images/
├── src/
│   ├── app/                          # Next.js App Router pages
│   ├── components/                   # Reusable UI components
│   ├── lib/                          # Shared utilities and configuration
│   ├── server/                       # Server-only code (API logic)
│   ├── types/                        # TypeScript type definitions
│   ├── hooks/                        # Custom React hooks
│   ├── styles/                       # Global styles
│   └── middleware.ts                 # Next.js middleware (auth, RBAC)
├── tests/
│   ├── unit/                         # Unit tests
│   ├── integration/                  # Integration tests
│   └── e2e/                          # End-to-end tests (Playwright)
├── scripts/
│   ├── setup-dev.sh                  # One-command dev environment setup
│   ├── seed-db.sh                    # Database seeding script
│   └── generate-report.ts           # CLI utilities
├── docs/
│   ├── BRD.md
│   ├── PRD.md
│   ├── IMPLEMENTATION_PLAN.md        # This document
│   ├── API.md                        # API documentation
│   └── ARCHITECTURE.md
├── .env.example                      # Environment variable template
├── .env.local                        # Local dev env (gitignored)
├── .eslintrc.json
├── .prettierrc
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── vitest.config.ts
├── playwright.config.ts
├── docker-compose.yml                # Local PostgreSQL + Redis
├── Dockerfile                        # Optional: containerized development
├── package.json
├── pnpm-lock.yaml
└── README.md
```

---

# 4. Development Environment Setup

## 4.1 Prerequisites

| Tool               | Version                      | Purpose                                |
| ------------------ | ---------------------------- | -------------------------------------- |
| Node.js            | 20.x LTS                     | Runtime                                |
| pnpm               | 9.x                          | Package manager (fast, disk-efficient) |
| Docker Desktop     | Latest                       | Local PostgreSQL + Redis containers    |
| Git                | 2.40+                        | Version control                        |
| VS Code            | Latest                       | Recommended IDE                        |
| PostgreSQL Client  | Any (pgAdmin, DBeaver, psql) | Database inspection                    |
| Postman / Insomnia | Latest                       | API testing                            |

## 4.2 One-Command Setup

```bash
# Clone the repository
git clone https://github.com/atria-priym/priym.git
cd priym

# Run the setup script
chmod +x scripts/setup-dev.sh
./scripts/setup-dev.sh
```

## 4.3 Setup Script (`scripts/setup-dev.sh`)

The setup script performs the following:

```bash
#!/bin/bash
set -e

echo "🚀 PRiym Development Environment Setup"
echo "======================================="

# 1. Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# 2. Copy environment template
if [ ! -f .env.local ]; then
  echo "📝 Creating .env.local from template..."
  cp .env.example .env.local
  echo "⚠️  Please update .env.local with your credentials"
fi

# 3. Start Docker containers (PostgreSQL + Redis)
echo "🐳 Starting Docker containers..."
docker-compose up -d

# 4. Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL..."
sleep 5

# 5. Run Prisma migrations
echo "🗄️  Running database migrations..."
pnpm prisma migrate dev

# 6. Seed the database
echo "🌱 Seeding database..."
pnpm prisma db seed

# 7. Generate Prisma client
echo "⚙️  Generating Prisma client..."
pnpm prisma generate

echo ""
echo "✅ Setup complete! Run 'pnpm dev' to start the development server."
```

## 4.4 Docker Compose (`docker-compose.yml`)

```yaml
version: "3.8"
services:
  postgres:
    image: postgres:16-alpine
    container_name: priym-postgres
    environment:
      POSTGRES_USER: priym_dev
      POSTGRES_PASSWORD: priym_dev_pass
      POSTGRES_DB: priym_development
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U priym_dev"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: priym-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
```

## 4.5 Environment Variables (`.env.example`)

```env
# ============================================================
# PRiym Environment Configuration
# Copy this file to .env.local and update values
# ============================================================

# --- Application ---
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# --- Database ---
DATABASE_URL="postgresql://priym_dev:priym_dev_pass@localhost:5432/priym_development"

# --- Auth.js ---
AUTH_SECRET="generate-with-openssl-rand-base64-32"
AUTH_URL=http://localhost:3000

# --- Redis ---
REDIS_URL="redis://localhost:6379"

# --- Supabase Storage ---
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
SUPABASE_STORAGE_BUCKET="achievements"

# --- Email (Resend) ---
RESEND_API_KEY="re_your_api_key"
EMAIL_FROM="noreply@priym.ait.edu.in"

# --- Sentry ---
SENTRY_DSN="https://your-sentry-dsn"
NEXT_PUBLIC_SENTRY_DSN="https://your-sentry-dsn"

# --- Feature Flags ---
FEATURE_MFA_ENABLED=true
FEATURE_REWARD_REDEMPTION=false
```

## 4.6 VS Code Recommended Extensions

Create `.vscode/extensions.json`:

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "prisma.prisma",
    "bradlc.vscode-tailwindcss",
    "ms-azuretools.vscode-docker",
    "ZixuanChen.vitest-explorer",
    "ms-playwright.playwright",
    "streetsidesoftware.code-spell-checker",
    "usernamehw.errorlens",
    "eamodio.gitlens"
  ]
}
```

---

# 5. Coding Standards

## 5.1 Language & Style

| Standard               | Tool                 | Configuration                                      |
| ---------------------- | -------------------- | -------------------------------------------------- |
| TypeScript Strict Mode | `tsconfig.json`      | `"strict": true`                                   |
| ESLint                 | `.eslintrc.json`     | Airbnb + Next.js + Prisma rules                    |
| Prettier               | `.prettierrc`        | 2-space indent, single quotes, trailing commas     |
| Import Sorting         | eslint-plugin-import | Auto-sort by group: external → internal → relative |

## 5.2 Naming Conventions

| Element               | Convention                          | Example                                          |
| --------------------- | ----------------------------------- | ------------------------------------------------ |
| Files (components)    | PascalCase                          | `SubmissionCard.tsx`                             |
| Files (utilities)     | camelCase                           | `formatDate.ts`                                  |
| Files (pages/routes)  | kebab-case (Next.js convention)     | `submission-detail/page.tsx`                     |
| React Components      | PascalCase                          | `StudentDashboard`                               |
| Functions             | camelCase                           | `calculatePoints()`                              |
| Constants             | UPPER_SNAKE_CASE                    | `MAX_FILE_SIZE`                                  |
| Types/Interfaces      | PascalCase with prefix              | `type SubmissionStatus`, `interface UserProfile` |
| Enums                 | PascalCase members                  | `SubmissionStatus.UnderReview`                   |
| Database columns      | snake_case                          | `created_at`, `student_id`                       |
| API routes            | kebab-case                          | `/api/v1/submissions/:id/resubmit`               |
| CSS classes           | Tailwind utilities / BEM for custom | `bg-primary-600`, `card__header`                 |
| Environment variables | UPPER_SNAKE_CASE                    | `DATABASE_URL`                                   |

## 5.3 Code Organization Rules

1. **No business logic in route handlers.** Route handlers call service functions. Services call repository functions.
2. **All database queries go through Prisma.** No raw SQL without explicit approval and documentation.
3. **All API inputs validated with Zod.** No `any` types in request handling.
4. **All API responses follow a consistent envelope format:**
   ```typescript
   // Success
   { data: T, meta?: { page, total, ... } }

   // Error
   { error: { code: string, message: string, details?: string } }
   ```
5. **No console.log in production code.** Use the structured logger (`lib/logger.ts`).
6. **All async functions must have error handling.** Use try/catch or error boundaries.
7. **Components are pure and side-effect-free** unless explicitly marked as client components.
8. **Shared types live in `src/types/`.** Never duplicate type definitions.
9. **Environment variables accessed only through `src/lib/env.ts`** (validated with Zod at startup).
10. **Maximum file length: 300 lines.** If a file exceeds this, refactor into smaller modules.

## 5.4 Commit Message Format

Follow the **Conventional Commits** specification:

```
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

**Types:**

| Type       | Usage                                 |
| ---------- | ------------------------------------- |
| `feat`     | New feature                           |
| `fix`      | Bug fix                               |
| `refactor` | Code refactoring (no behavior change) |
| `docs`     | Documentation updates                 |
| `test`     | Adding or updating tests              |
| `chore`    | Maintenance (deps, config, scripts)   |
| `style`    | Formatting, linting (no code change)  |
| `perf`     | Performance improvement               |
| `ci`       | CI/CD pipeline changes                |

**Examples:**

```
feat(submissions): add achievement submission form with file upload
fix(auth): resolve session expiry not redirecting to login
refactor(points): extract point calculation into dedicated service
test(verification): add unit tests for approval workflow
docs(api): document submission endpoints in API.md
```

## 5.5 Code Review Standards

Every PR must satisfy before merge:

- [ ] All CI checks pass (lint, test, build)
- [ ] At least 1 approving review from a team member
- [ ] No unresolved conversations
- [ ] New code has appropriate test coverage
- [ ] No `any` types introduced without explicit justification
- [ ] No TODO comments without a linked issue
- [ ] No hardcoded secrets or credentials
- [ ] API changes documented in API.md
- [ ] Database changes have a Prisma migration

---

# 6. Git Workflow

## 6.1 Workflow Model

PRiym follows a **Git Flow** variant optimized for small teams with continuous deployment:

```
main (production)
  |
  +-- develop (staging)
       |
       +-- feature/PRIYM-001-student-dashboard
       +-- feature/PRIYM-002-verification-queue
       +-- fix/PRIYM-003-login-redirect-bug
       +-- hotfix/PRIYM-004-critical-security-patch
```

## 6.2 Workflow Steps

1. **Start Work:** Create a feature branch from `develop`.
2. **Develop:** Commit frequently with conventional commit messages.
3. **Pull Request:** Open PR targeting `develop`. Fill out the PR template.
4. **Review:** At least 1 team member reviews. Address all feedback.
5. **Merge:** Squash-merge into `develop`. Delete the feature branch.
6. **Staging:** `develop` auto-deploys to staging via CI/CD.
7. **Release:** When ready, merge `develop` into `main`. `main` auto-deploys to production.
8. **Hotfix:** Critical production issues branch from `main`, are fixed, merged to `main` AND `develop`.

## 6.3 Pull Request Template

```markdown
## Summary

<!-- Brief description of what this PR does -->

## Type

- [ ] Feature
- [ ] Bug Fix
- [ ] Refactor
- [ ] Documentation
- [ ] Test
- [ ] Chore

## Related Issue

<!-- Link to the issue or task: PRIYM-XXX -->

## Changes Made

<!-- Bullet list of specific changes -->

## Screenshots / Recordings

<!-- If UI changes, attach before/after screenshots -->

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing performed
- [ ] Tested on mobile viewport

## Checklist

- [ ] Code follows project coding standards
- [ ] Self-reviewed my own code
- [ ] No console.log or debug statements
- [ ] No new TypeScript `any` types without justification
- [ ] Documentation updated (if applicable)
- [ ] No breaking API changes (or documented in API.md)
```

---

# 7. Branching Strategy

## 7.1 Branch Types

| Branch Type | Pattern                               | Source           | Target                    | Lifespan          |
| ----------- | ------------------------------------- | ---------------- | ------------------------- | ----------------- |
| Production  | `main`                                | —                | —                         | Permanent         |
| Staging     | `develop`                             | `main` (initial) | `main` (release)          | Permanent         |
| Feature     | `feature/PRIYM-XXX-short-description` | `develop`        | `develop`                 | Days–weeks        |
| Bug Fix     | `fix/PRIYM-XXX-short-description`     | `develop`        | `develop`                 | Hours–days        |
| Hotfix      | `hotfix/PRIYM-XXX-short-description`  | `main`           | `main` + `develop`        | Hours             |
| Release     | `release/vX.Y.Z`                      | `develop`        | `main`                    | Hours (temporary) |
| Experiment  | `experiment/description`              | `develop`        | `develop` (if successful) | Days              |

## 7.2 Branch Protection Rules

### `main` (Production)

- Require pull request before merging
- Require at least 2 approving reviews
- Require all status checks to pass
- Require branches to be up to date before merging
- No direct pushes
- No force pushes

### `develop` (Staging)

- Require pull request before merging
- Require at least 1 approving review
- Require all status checks to pass
- No direct pushes
- No force pushes

---

# 8. Folder Structure

## 8.1 `src/` Directory — Detailed Breakdown

```
src/
├── app/                                   # Next.js App Router
│   ├── (auth)/                            # Auth route group (no layout nesting)
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   ├── forgot-password/
│   │   │   └── page.tsx
│   │   ├── reset-password/
│   │   │   └── page.tsx
│   │   ├── verify-email/
│   │   │   └── page.tsx
│   │   └── layout.tsx                     # Auth pages layout (centered card)
│   │
│   ├── (dashboard)/                       # Authenticated dashboard group
│   │   ├── student/
│   │   │   ├── page.tsx                   # Student dashboard
│   │   │   ├── submissions/
│   │   │   │   ├── page.tsx               # My submissions list
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx           # New submission form
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx           # Submission detail
│   │   │   ├── portfolio/
│   │   │   │   └── page.tsx               # My portfolio
│   │   │   ├── leaderboard/
│   │   │   │   └── page.tsx               # Leaderboard view
│   │   │   ├── badges/
│   │   │   │   └── page.tsx               # My badges
│   │   │   └── profile/
│   │   │       └── page.tsx               # My profile
│   │   │
│   │   ├── faculty/
│   │   │   ├── page.tsx                   # Faculty dashboard
│   │   │   ├── queue/
│   │   │   │   ├── page.tsx               # Verification queue
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx           # Submission review interface
│   │   │   ├── mentees/
│   │   │   │   ├── page.tsx               # Mentee cohort
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx           # Individual mentee view
│   │   │   └── profile/
│   │   │       └── page.tsx
│   │   │
│   │   ├── hod/
│   │   │   ├── page.tsx                   # HOD dashboard
│   │   │   ├── analytics/
│   │   │   │   └── page.tsx               # Analytics center
│   │   │   ├── submissions/
│   │   │   │   ├── page.tsx               # All department submissions
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx           # Submission detail
│   │   │   ├── escalations/
│   │   │   │   ├── page.tsx               # Escalation inbox
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx           # Escalation detail
│   │   │   ├── students/
│   │   │   │   ├── page.tsx               # All students
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx           # Student deep dive
│   │   │   ├── reports/
│   │   │   │   └── page.tsx               # Report builder
│   │   │   └── settings/
│   │   │       └── page.tsx               # Department settings
│   │   │
│   │   ├── admin/
│   │   │   ├── page.tsx                   # Admin dashboard
│   │   │   ├── users/
│   │   │   │   ├── page.tsx               # User management
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx           # Create user
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx           # Edit user
│   │   │   ├── categories/
│   │   │   │   └── page.tsx               # Achievement categories
│   │   │   ├── badges/
│   │   │   │   └── page.tsx               # Badge management
│   │   │   ├── semesters/
│   │   │   │   └── page.tsx               # Academic year/semester
│   │   │   ├── departments/
│   │   │   │   └── page.tsx               # Department management
│   │   │   ├── audit/
│   │   │   │   └── page.tsx               # Audit log viewer
│   │   │   └── settings/
│   │   │       └── page.tsx               # System settings
│   │   │
│   │   ├── settings/
│   │   │   └── page.tsx                   # User settings (all roles)
│   │   │
│   │   └── layout.tsx                     # Dashboard layout (sidebar + header)
│   │
│   ├── portfolio/
│   │   └── [usn]/
│   │       └── page.tsx                   # Public portfolio page
│   │
│   ├── api/
│   │   └── v1/
│   │       ├── auth/                      # Auth endpoints
│   │       ├── users/                     # User management endpoints
│   │       ├── submissions/               # Submission endpoints
│   │       ├── verifications/             # Verification endpoints
│   │       ├── escalations/               # Escalation endpoints
│   │       ├── points/                    # Points endpoints
│   │       ├── badges/                    # Badge endpoints
│   │       ├── leaderboard/               # Leaderboard endpoints
│   │       ├── analytics/                 # Analytics endpoints
│   │       ├── reports/                   # Report endpoints
│   │       ├── notifications/             # Notification endpoints
│   │       ├── audit/                     # Audit log endpoints
│   │       └── config/                    # Configuration endpoints
│   │
│   ├── layout.tsx                         # Root layout
│   ├── page.tsx                           # Landing page (redirect to login or dashboard)
│   ├── not-found.tsx                      # Custom 404
│   └── error.tsx                          # Global error boundary
│
├── components/
│   ├── ui/                                # shadcn/ui base components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── table.tsx
│   │   ├── toast.tsx
│   │   └── ...
│   ├── layout/                            # Layout components
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── MobileNav.tsx
│   │   └── BreadcrumbNav.tsx
│   ├── forms/                             # Form components
│   │   ├── SubmissionForm.tsx
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   ├── ProfileForm.tsx
│   │   └── CategoryForm.tsx
│   ├── data-display/                      # Data visualization
│   │   ├── StatsCard.tsx
│   │   ├── SubmissionCard.tsx
│   │   ├── BadgeCard.tsx
│   │   ├── LeaderboardTable.tsx
│   │   ├── AchievementTimeline.tsx
│   │   └── StatusBadge.tsx
│   ├── charts/                            # Chart components
│   │   ├── CategoryPieChart.tsx
│   │   ├── BatchBarChart.tsx
│   │   ├── TimelineChart.tsx
│   │   └── VerificationGauge.tsx
│   ├── notifications/
│   │   ├── NotificationBell.tsx
│   │   ├── NotificationList.tsx
│   │   └── NotificationItem.tsx
│   └── shared/                            # Cross-cutting components
│       ├── LoadingSkeleton.tsx
│       ├── EmptyState.tsx
│       ├── ErrorState.tsx
│       ├── ConfirmDialog.tsx
│       ├── FileUpload.tsx
│       ├── SearchBar.tsx
│       ├── FilterPanel.tsx
│       ├── Pagination.tsx
│       └── Avatar.tsx
│
├── server/                                # Server-only code
│   ├── services/                          # Business logic services
│   │   ├── submission.service.ts
│   │   ├── verification.service.ts
│   │   ├── escalation.service.ts
│   │   ├── points.service.ts
│   │   ├── badge.service.ts
│   │   ├── leaderboard.service.ts
│   │   ├── notification.service.ts
│   │   ├── report.service.ts
│   │   ├── user.service.ts
│   │   └── audit.service.ts
│   ├── repositories/                      # Data access layer
│   │   ├── submission.repository.ts
│   │   ├── user.repository.ts
│   │   ├── points.repository.ts
│   │   ├── badge.repository.ts
│   │   ├── notification.repository.ts
│   │   └── audit.repository.ts
│   ├── middleware/                         # API middleware
│   │   ├── auth.middleware.ts
│   │   ├── rbac.middleware.ts
│   │   ├── rate-limit.middleware.ts
│   │   ├── validate.middleware.ts
│   │   └── audit.middleware.ts
│   ├── jobs/                              # Background job definitions
│   │   ├── sla-check.job.ts
│   │   ├── notification.job.ts
│   │   ├── report-generation.job.ts
│   │   ├── leaderboard-refresh.job.ts
│   │   └── cleanup.job.ts
│   └── validators/                        # Zod schemas for API inputs
│       ├── submission.schema.ts
│       ├── user.schema.ts
│       ├── auth.schema.ts
│       └── config.schema.ts
│
├── lib/                                   # Shared utilities
│   ├── db.ts                              # Prisma client singleton
│   ├── redis.ts                           # Redis client singleton
│   ├── auth.ts                            # Auth.js configuration
│   ├── storage.ts                         # Supabase Storage client
│   ├── email.ts                           # Email sending utility
│   ├── logger.ts                          # Structured logger (Pino)
│   ├── env.ts                             # Environment variable validation
│   ├── errors.ts                          # Custom error classes
│   ├── constants.ts                       # Application constants
│   ├── utils.ts                           # General utilities
│   └── api-response.ts                    # Response envelope helpers
│
├── types/                                 # TypeScript types
│   ├── auth.types.ts
│   ├── submission.types.ts
│   ├── user.types.ts
│   ├── points.types.ts
│   ├── badge.types.ts
│   ├── notification.types.ts
│   ├── api.types.ts
│   └── index.ts
│
├── hooks/                                 # Custom React hooks
│   ├── useAuth.ts
│   ├── useSubmissions.ts
│   ├── useNotifications.ts
│   ├── useLeaderboard.ts
│   └── useDebounce.ts
│
├── styles/
│   └── globals.css                        # Tailwind directives + custom styles
│
└── middleware.ts                          # Next.js middleware (auth guard, RBAC)
```

---

# 9. Phase 1 — Planning & Foundation

## Duration: Week 1–2 (Sprint 1)

## 9.1 Objectives

Establish the project foundation: repository, tooling, CI/CD skeleton, development environment, and team alignment.

## 9.2 Deliverables Checklist

### Repository Setup

- [ ] Create GitHub repository with branch protection rules
- [ ] Initialize Next.js 14 project with TypeScript
- [ ] Configure pnpm as package manager
- [ ] Set up `.gitignore` with comprehensive exclusions
- [ ] Add `README.md` with project overview and setup instructions
- [ ] Create `CONTRIBUTING.md` with coding standards summary

### Tooling & Configuration

- [ ] Configure TypeScript (`tsconfig.json`) with strict mode
- [ ] Install and configure ESLint (Airbnb + Next.js)
- [ ] Install and configure Prettier (`.prettierrc`)
- [ ] Set up Tailwind CSS with custom design tokens
- [ ] Install shadcn/ui and configure component library
- [ ] Set up VS Code workspace settings and recommended extensions

### Docker & Local Development

- [ ] Create `docker-compose.yml` (PostgreSQL 16 + Redis 7)
- [ ] Create `.env.example` with all required environment variables
- [ ] Create `scripts/setup-dev.sh` for one-command setup
- [ ] Verify Docker containers start and connect correctly
- [ ] Document local development setup in `README.md`

### CI/CD Skeleton

- [ ] Create GitHub Actions workflow: `ci.yml` (lint + type-check + build on PR)
- [ ] Create GitHub Actions workflow: `deploy-staging.yml` (skeleton)
- [ ] Create GitHub Actions workflow: `deploy-production.yml` (skeleton)
- [ ] Create PR template (`.github/PULL_REQUEST_TEMPLATE.md`)
- [ ] Create issue templates (bug, feature, task)

### Project Management

- [ ] Set up GitHub Projects board (Kanban: Backlog, To Do, In Progress, Review, Done)
- [ ] Create all Phase 1–10 milestones in GitHub
- [ ] Create initial backlog of user stories as GitHub Issues
- [ ] Assign Sprint 1 tasks to team members
- [ ] Schedule recurring sprint ceremonies (daily standup, planning, retro)

### Documentation

- [ ] Place BRD, PRD, and Implementation Plan in `docs/` directory
- [ ] Create `docs/API.md` (skeleton with section headers)
- [ ] Create `docs/ARCHITECTURE.md` with architecture overview

### Foundation Code

- [ ] Create folder structure as defined in Section 8
- [ ] Create `src/lib/env.ts` — environment variable validation with Zod
- [ ] Create `src/lib/logger.ts` — structured logging with Pino
- [ ] Create `src/lib/errors.ts` — custom error classes (AppError, ValidationError, AuthError, NotFoundError)
- [ ] Create `src/lib/api-response.ts` — response envelope helpers (success, error, paginated)
- [ ] Create `src/lib/constants.ts` — application-wide constants
- [ ] Create `src/types/` — initial shared TypeScript types
- [ ] Create root layout with metadata, fonts, and global styles
- [ ] Create placeholder pages for all routes (returning "Coming Soon" UI)
- [ ] Verify the app runs with `pnpm dev`

## 9.3 Milestones

| Milestone | Target                                        | Verification                                |
| --------- | --------------------------------------------- | ------------------------------------------- |
| M1.1      | Repository live with branch protection        | Team can clone and PR                       |
| M1.2      | Local dev environment works with one command  | New team member can onboard in < 15 minutes |
| M1.3      | CI pipeline runs on every PR                  | PR triggers lint + type-check + build       |
| M1.4      | Folder structure and foundation code in place | App runs with `pnpm dev`                    |

## 9.4 Dependencies

- None (Phase 1 is the starting point)

## 9.5 Risks

- Docker Desktop licensing issues on personal machines → Mitigation: Use Podman as alternative
- Team unfamiliar with pnpm → Mitigation: Include pnpm commands in README

---

# 10. Phase 2 — Database

## Duration: Week 2–3 (Sprint 1–2 overlap)

## 10.1 Objectives

Translate the finalized PostgreSQL database design and ER diagram into a running, seeded database accessible by the application.

## 10.2 Deliverables Checklist

### Database Schema

- [ ] Write `prisma/schema.prisma` with all 19 entities from the PRD
  - [ ] `users` — with role enum, profile fields, MFA fields
  - [ ] `departments` — with HOD relation, SLA config
  - [ ] `faculty_mentee_assignments` — many-to-many through table
  - [ ] `academic_years` — with active flag
  - [ ] `semesters` — with academic year relation, active/archived flags
  - [ ] `achievement_categories` — with base points, department scope
  - [ ] `category_checklist_items` — ordered checklist per category
  - [ ] `submissions` — full status enum, verifier assignment
  - [ ] `submission_documents` — file references
  - [ ] `submission_collaborators` — collaborator tagging
  - [ ] `verification_events` — immutable action log
  - [ ] `escalations` — lifecycle tracking
  - [ ] `point_ledger` — immutable transaction log
  - [ ] `badges` — with JSONB trigger rules
  - [ ] `user_badges` — earned badges with optional revocation
  - [ ] `notifications` — in-app notification storage
  - [ ] `audit_logs` — immutable with HMAC signature
  - [ ] `sessions` — Auth.js session storage
  - [ ] `reports` — async report job tracking
- [ ] Define all enums in Prisma schema (Role, SubmissionStatus, Level, etc.)
- [ ] Define all relations (one-to-many, many-to-many, self-referencing)
- [ ] Add indexes for frequently queried columns
  - [ ] `submissions`: (student_id, status), (department_id, status), (assigned_verifier_id)
  - [ ] `point_ledger`: (user_id, semester_id), (department_id, semester_id)
  - [ ] `notifications`: (user_id, is_read)
  - [ ] `audit_logs`: (timestamp, action), (actor_id)
  - [ ] `users`: (email), (usn), (department_id, role)
- [ ] Add database-level constraints (CHECK, UNIQUE composites)

### Migrations

- [ ] Generate initial migration: `pnpm prisma migrate dev --name init`
- [ ] Verify migration runs cleanly against Docker PostgreSQL
- [ ] Verify migration is idempotent (can be re-run safely)

### Seed Data

- [ ] Create `prisma/seed.ts` with:
  - [ ] 1 Department (CSE)
  - [ ] 1 Academic Year (2025–2026) with 2 semesters
  - [ ] 10 Achievement Categories with checklist items
  - [ ] 1 Admin user (seeded with known credentials for dev)
  - [ ] 1 HOD user
  - [ ] 5 Faculty users
  - [ ] 20 Student users (spread across batches 2022–2025)
  - [ ] Faculty-mentee assignments
  - [ ] 30 sample submissions (various statuses)
  - [ ] Sample verification events
  - [ ] Sample point ledger entries
  - [ ] 5 Badge definitions
  - [ ] Sample notifications
- [ ] Run seed successfully: `pnpm prisma db seed`
- [ ] Verify seed data in database client

### Prisma Client

- [ ] Generate Prisma client: `pnpm prisma generate`
- [ ] Create `src/lib/db.ts` — Prisma client singleton (prevents connection pool exhaustion in development)
- [ ] Verify Prisma client can connect and query from a test script

### Documentation

- [ ] Export ER diagram from Prisma schema (using `prisma-erd-generator` or manually)
- [ ] Document all entity relationships and constraints in `docs/DATABASE.md`
- [ ] Document seed data users and credentials for development

## 10.3 Milestones

| Milestone | Target                                     | Verification                 |
| --------- | ------------------------------------------ | ---------------------------- |
| M2.1      | Prisma schema with all 19 entities defined | `prisma validate` passes     |
| M2.2      | Initial migration applied successfully     | Database has all tables      |
| M2.3      | Seed data populated                        | All sample records queryable |
| M2.4      | Prisma client accessible from application  | Test query returns seed data |

## 10.4 Dependencies

- Phase 1 complete (repo, Docker containers running)

---

# 11. Phase 3 — Prisma ORM

## Duration: Week 3 (Sprint 2)

## 11.1 Objectives

Build the data access layer on top of Prisma, establishing the repository pattern that all server-side code will use.

## 11.2 Deliverables Checklist

### Repository Layer

- [ ] Create `src/server/repositories/user.repository.ts`
  - [ ] `findById`, `findByEmail`, `findByUSN`, `findByDepartment`
  - [ ] `create`, `update`, `deactivate`
  - [ ] `findMentees(facultyId)`
  - [ ] `bulkCreate(users[])` (for CSV import)
  - [ ] Pagination helper for list queries
- [ ] Create `src/server/repositories/submission.repository.ts`
  - [ ] `findById` (with includes: student, category, documents, verifier)
  - [ ] `findByStudent(studentId, filters)`
  - [ ] `findByVerifier(facultyId, filters)`
  - [ ] `findByDepartment(departmentId, filters)`
  - [ ] `create`, `update`, `updateStatus`
  - [ ] `findPotentialDuplicates(studentId, categoryId, date, title)`
- [ ] Create `src/server/repositories/points.repository.ts`
  - [ ] `getBalance(userId, semesterId?)`
  - [ ] `getLedger(userId, filters)`
  - [ ] `createTransaction(entry)`
  - [ ] `getLeaderboard(departmentId, semesterId, limit)`
- [ ] Create `src/server/repositories/badge.repository.ts`
  - [ ] `findAll`, `findById`, `create`, `update`, `deactivate`
  - [ ] `findUserBadges(userId)`
  - [ ] `awardBadge(userId, badgeId)`
  - [ ] `revokeBadge(userId, badgeId, reason, adminId)`
- [ ] Create `src/server/repositories/notification.repository.ts`
  - [ ] `findByUser(userId, filters)`
  - [ ] `create`, `markAsRead`, `markAllAsRead`
  - [ ] `getUnreadCount(userId)`
  - [ ] `deleteExpired()`
- [ ] Create `src/server/repositories/audit.repository.ts`
  - [ ] `create(entry)` — append-only
  - [ ] `find(filters)` — paginated with date range, actor, action filters
  - [ ] `export(filters, format)` — returns data for CSV/JSON

### Validation Schemas (Zod)

- [ ] Create `src/server/validators/submission.schema.ts`
  - [ ] `createSubmissionSchema`, `updateSubmissionSchema`
- [ ] Create `src/server/validators/user.schema.ts`
  - [ ] `createUserSchema`, `updateUserSchema`, `bulkImportSchema`
- [ ] Create `src/server/validators/auth.schema.ts`
  - [ ] `loginSchema`, `registerSchema`, `resetPasswordSchema`, `changePasswordSchema`
- [ ] Create `src/server/validators/config.schema.ts`
  - [ ] `createCategorySchema`, `updateCategorySchema`, `createBadgeSchema`
  - [ ] `createSemesterSchema`, `systemSettingsSchema`

### Utility Functions

- [ ] Create `src/lib/utils.ts`
  - [ ] `generateId()` — UUID v7 generator
  - [ ] `slugify()` — text to URL-safe slug
  - [ ] `truncate()` — text truncation with ellipsis
  - [ ] `formatDate()` — consistent date formatting
  - [ ] `calculateSimilarity()` — Levenshtein/Jaccard for duplicate detection
  - [ ] `paginationHelper()` — parse page/limit from query params
- [ ] Create `src/lib/api-response.ts`
  - [ ] `successResponse(data, meta?)` — 200 envelope
  - [ ] `createdResponse(data)` — 201 envelope
  - [ ] `errorResponse(code, message, details?, status?)` — error envelope
  - [ ] `paginatedResponse(data, page, limit, total)` — paginated envelope

## 11.3 Milestones

| Milestone | Target                                              | Verification                       |
| --------- | --------------------------------------------------- | ---------------------------------- |
| M3.1      | All repositories created with typed methods         | TypeScript compiles without errors |
| M3.2      | All Zod validation schemas defined                  | Import and test with sample data   |
| M3.3      | Utility functions and API response helpers in place | Unit tests pass                    |

## 11.4 Dependencies

- Phase 2 complete (schema and migrations applied, Prisma client generated)

---

# 12. Phase 4 — Authentication

## Duration: Week 3–4 (Sprint 2)

## 12.1 Objectives

Implement the complete authentication system: registration, login, session management, password management, MFA, RBAC middleware.

## 12.2 Deliverables Checklist

### Auth.js Configuration

- [ ] Install Auth.js v5 (`next-auth@beta` or stable)
- [ ] Create `src/lib/auth.ts` — Auth.js configuration
  - [ ] Credentials provider (email + password)
  - [ ] Prisma adapter for session/account storage
  - [ ] JWT strategy with role claim
  - [ ] Session callback to inject role and user ID
  - [ ] Sign-in callback for account lockout check
- [ ] Create `src/app/api/auth/[...nextauth]/route.ts` — Auth.js catch-all route

### Registration Flow

- [ ] Create `POST /api/v1/auth/register` endpoint
  - [ ] Validate input with Zod
  - [ ] Check email domain against whitelist
  - [ ] Check for duplicate email/USN
  - [ ] Hash password with bcrypt (12 rounds)
  - [ ] Create user with status PENDING_APPROVAL
  - [ ] Send verification email
  - [ ] Create audit log entry
- [ ] Create `POST /api/v1/auth/verify-email` endpoint
  - [ ] Validate token, set `email_verified = true`

### Login Flow

- [ ] Implement credential validation in Auth.js authorize callback
  - [ ] Check user exists and is active
  - [ ] Verify password with bcrypt
  - [ ] Check account lockout status
  - [ ] Increment failed attempt counter on failure (Redis-backed)
  - [ ] Lock account after 5 failures for 30 minutes
  - [ ] Reset counter on successful login
  - [ ] Create audit log entry
- [ ] Implement MFA verification for HOD and Admin roles
  - [ ] `POST /api/v1/auth/mfa/setup` — generate TOTP secret
  - [ ] `POST /api/v1/auth/mfa/verify` — verify OTP and enable MFA
  - [ ] `DELETE /api/v1/auth/mfa` — disable MFA

### Password Management

- [ ] `POST /api/v1/auth/forgot-password` — send reset email with token
- [ ] `POST /api/v1/auth/reset-password` — validate token, set new password
- [ ] `POST /api/v1/auth/change-password` — require current password, enforce history

### Session Management

- [ ] `GET /api/v1/auth/sessions` — list active sessions
- [ ] `DELETE /api/v1/auth/sessions/:sessionId` — revoke session
- [ ] Implement session expiry (30 min inactivity, 8 hour max)
- [ ] Implement "Remember Me" (30-day refresh token)
- [ ] Session warning before expiry (client-side)

### Middleware

- [ ] Create `src/middleware.ts` — Next.js middleware
  - [ ] Route protection: redirect unauthenticated users to login
  - [ ] Role-based route access (student routes, faculty routes, etc.)
  - [ ] Rate limiting on auth endpoints (10 req/min)
- [ ] Create `src/server/middleware/rbac.middleware.ts`
  - [ ] `requireRole(...roles)` — guard for API routes
  - [ ] Permission matrix check function
- [ ] Create `src/server/middleware/auth.middleware.ts`
  - [ ] `getServerSession()` wrapper
  - [ ] `getCurrentUser()` — session to full user profile

### Email Templates

- [ ] Create email template: Welcome / Account Verification
- [ ] Create email template: Password Reset
- [ ] Create email template: Account Approved
- [ ] Create email template: Account Locked
- [ ] Set up email sending utility (`src/lib/email.ts`) with Resend/Nodemailer

### Frontend Auth Pages

- [ ] Create `(auth)/login/page.tsx` — login form with validation
- [ ] Create `(auth)/register/page.tsx` — registration form
- [ ] Create `(auth)/forgot-password/page.tsx` — forgot password form
- [ ] Create `(auth)/reset-password/page.tsx` — reset password form
- [ ] Create `(auth)/verify-email/page.tsx` — email verification page
- [ ] Create `(auth)/layout.tsx` — centered card layout for auth pages

## 12.3 Milestones

| Milestone | Target                                             | Verification                                             |
| --------- | -------------------------------------------------- | -------------------------------------------------------- |
| M4.1      | Registration + email verification works end-to-end | New user can register and verify email                   |
| M4.2      | Login with role-based redirect works               | Student → student dashboard, Faculty → faculty dashboard |
| M4.3      | Password reset flow works end-to-end               | User receives email, resets password, logs in            |
| M4.4      | RBAC middleware protects all routes                | Unauthorized access returns 403                          |
| M4.5      | Account lockout works                              | 5 bad logins → locked for 30 min                         |

## 12.4 Dependencies

- Phase 2 complete (users table exists with seed data)
- Phase 3 complete (user repository, auth validation schemas)

---

# 13. Phase 5 — Backend APIs

## Duration: Week 4–7 (Sprint 2–4)

## 13.1 Objectives

Build all REST API endpoints defined in the PRD, organized by module. Every endpoint enforces authentication, authorization, validation, and audit logging.

## 13.2 Deliverables Checklist

### API Infrastructure

- [ ] Create API versioning structure (`/api/v1/...`)
- [ ] Create shared API route handler wrapper with error handling, validation, and audit
- [ ] Create `withAuth()` — authenticated route wrapper
- [ ] Create `withRole(roles[])` — RBAC route wrapper
- [ ] Create `withValidation(schema)` — Zod validation wrapper
- [ ] Create `withAudit(action)` — automatic audit log wrapper
- [ ] Create `withRateLimit(config)` — rate limiting wrapper
- [ ] Create pagination parsing utility for GET list endpoints
- [ ] Create search/filter parsing utility for query params

### Module: Users (`/api/v1/users`)

- [ ] `GET /users` — list users (paginated, filterable) — Admin
- [ ] `POST /users` — create user — Admin
- [ ] `GET /users/:userId` — get user detail — Admin, HOD, Faculty (scoped)
- [ ] `PATCH /users/:userId` — update user — Admin, Self
- [ ] `DELETE /users/:userId` — deactivate user — Admin
- [ ] `POST /users/bulk-import` — CSV import — Admin
- [ ] `GET /users/export` — CSV export — Admin
- [ ] `GET /users/:userId/login-history` — Admin

### Module: Submissions (`/api/v1/submissions`)

- [ ] `POST /submissions` — create submission — Student
- [ ] `GET /submissions` — list submissions (scoped by role) — All
- [ ] `GET /submissions/:id` — get detail — Scoped
- [ ] `PATCH /submissions/:id` — update draft — Student (own)
- [ ] `DELETE /submissions/:id` — delete — Admin only
- [ ] `POST /submissions/:id/resubmit` — resubmit after clarification — Student
- [ ] `POST /submissions/:id/documents` — upload docs — Student
- [ ] `DELETE /submissions/:id/documents/:docId` — remove doc — Student

### Module: Verifications (`/api/v1/verifications`)

- [ ] `GET /verifications/queue` — faculty queue — Faculty
- [ ] `POST /verifications/:id/approve` — Faculty (assigned)
- [ ] `POST /verifications/:id/reject` — Faculty (assigned)
- [ ] `POST /verifications/:id/clarify` — Faculty (assigned)
- [ ] `POST /verifications/:id/escalate` — Faculty (assigned)

### Module: Escalations (`/api/v1/escalations`)

- [ ] `GET /escalations` — HOD/Admin
- [ ] `GET /escalations/:id` — HOD/Admin
- [ ] `POST /escalations/:id/approve` — HOD
- [ ] `POST /escalations/:id/reject` — HOD
- [ ] `POST /escalations/:id/reassign` — HOD
- [ ] `POST /escalations/:id/return` — HOD

### Module: Points (`/api/v1/points`)

- [ ] `GET /points/:userId` — balance — Scoped
- [ ] `GET /points/:userId/ledger` — transaction history — Scoped
- [ ] `POST /points/:userId/adjust` — manual adjustment — HOD/Admin

### Module: Badges (`/api/v1/badges`)

- [ ] `GET /badges` — list active badges — All
- [ ] `POST /badges` — create badge — Admin
- [ ] `PATCH /badges/:id` — update badge — Admin
- [ ] `DELETE /badges/:id` — deactivate — Admin
- [ ] `GET /badges/user/:userId` — user's badges — All
- [ ] `DELETE /badges/user/:userId/:badgeId` — revoke — Admin

### Module: Leaderboard (`/api/v1/leaderboard`)

- [ ] `GET /leaderboard` — filtered leaderboard — All
- [ ] `GET /leaderboard/me` — own rank — Student
- [ ] `GET /leaderboard/honor-roll` — historical honor rolls — All

### Module: Analytics (`/api/v1/analytics`)

- [ ] `GET /analytics/department` — KPI summary — HOD/Admin
- [ ] `GET /analytics/department/categories` — category breakdown — HOD/Admin
- [ ] `GET /analytics/department/batches` — batch comparison — HOD/Admin
- [ ] `GET /analytics/department/timeline` — submission timeline — HOD/Admin
- [ ] `GET /analytics/department/faculty` — faculty activity — HOD/Admin
- [ ] `GET /analytics/department/at-risk` — at-risk students — HOD/Admin
- [ ] `GET /analytics/platform` — platform-wide — Admin only

### Module: Reports (`/api/v1/reports`)

- [ ] `POST /reports/generate` — initiate generation — HOD/Admin
- [ ] `GET /reports/:id/status` — poll status — HOD/Admin
- [ ] `GET /reports/:id/download` — download link — HOD/Admin
- [ ] `GET /reports` — list past reports — HOD/Admin
- [ ] `POST /reports/schedule` — schedule recurring — HOD/Admin
- [ ] `GET /reports/schedule` — list schedules — HOD/Admin
- [ ] `DELETE /reports/schedule/:id` — delete schedule — HOD/Admin

### Module: Notifications (`/api/v1/notifications`)

- [ ] `GET /notifications` — user's notifications — All
- [ ] `PATCH /notifications/:id/read` — mark read — Self
- [ ] `POST /notifications/read-all` — mark all read — Self
- [ ] `DELETE /notifications/:id` — archive — Self
- [ ] `GET /notifications/preferences` — get prefs — Self
- [ ] `PATCH /notifications/preferences` — update prefs — Self

### Module: Audit Logs (`/api/v1/audit`)

- [ ] `GET /audit/logs` — paginated, filterable — Admin
- [ ] `GET /audit/logs/export` — CSV/JSON export — Admin

### Module: Configuration (`/api/v1/config`)

- [ ] `GET /config/categories` — list categories — All
- [ ] `POST /config/categories` — create — Admin
- [ ] `PATCH /config/categories/:id` — update — Admin
- [ ] `DELETE /config/categories/:id` — archive — Admin
- [ ] `GET /config/semesters` — list — All
- [ ] `POST /config/semesters` — create — Admin
- [ ] `PATCH /config/semesters/:id` — update — Admin
- [ ] `GET /config/departments` — list — All
- [ ] `POST /config/departments` — create — Admin
- [ ] `PATCH /config/departments/:id` — update — Admin/HOD (own)
- [ ] `GET /config/notification-templates` — Admin
- [ ] `PATCH /config/notification-templates/:id` — Admin
- [ ] `GET /config/system` — Admin
- [ ] `PATCH /config/system` — Admin

## 13.3 Milestones

| Milestone | Target                                             | Verification                   |
| --------- | -------------------------------------------------- | ------------------------------ |
| M5.1      | All submission CRUD endpoints functional           | Postman collection passes      |
| M5.2      | All verification + escalation endpoints functional | Full workflow testable via API |
| M5.3      | All analytics + reports endpoints returning data   | Dashboard data available       |
| M5.4      | All admin/config endpoints functional              | Admin can configure platform   |
| M5.5      | API documentation complete in `docs/API.md`        | All endpoints documented       |

## 13.4 Dependencies

- Phase 3 complete (repositories, validators)
- Phase 4 complete (auth middleware available)

---

# 14. Phase 6 — Business Logic Engines

## Duration: Week 5–8 (Sprint 3–4)

## 14.1 Objectives

Build the core business logic engines that power PRiym's value proposition. These are the most critical and complex modules in the system.

---

## 14.2 Points Engine

### Service: `src/server/services/points.service.ts`

**Responsibilities:**

- Calculate points on achievement approval
- Manage point ledger transactions
- Support manual adjustments by HOD/Admin
- Provide aggregation functions for leaderboard

**Checklist:**

- [ ] Implement `calculatePoints(submission)` function
  ```
  Formula: Base Category Points × Level Multiplier × HOD Multiplier
  ```
- [ ] Implement level multiplier lookup table
  - International: 2.0, National: 1.5, State: 1.2, University: 1.0, College: 0.8, Department: 0.5
- [ ] Implement `awardPoints(userId, submissionId, amount)` — creates EARNED ledger entry
- [ ] Implement `adjustPoints(userId, amount, reason, adminId)` — creates ADJUSTED ledger entry
- [ ] Implement `getBalance(userId, semesterId?)` — aggregate from ledger
- [ ] Implement `getCategoryBreakdown(userId)` — points by category
- [ ] Implement idempotency guard: prevent double-awarding for same submission
- [ ] Create unit tests for all point calculation scenarios
- [ ] Create unit tests for edge cases (zero points, negative adjustments, max limits)

---

## 14.3 Verification Engine

### Service: `src/server/services/verification.service.ts`

**Responsibilities:**

- Manage the submission state machine
- Enforce verification rules and SLA
- Route submissions to appropriate faculty
- Handle resubmissions

**Checklist:**

- [ ] Implement submission state machine with valid transitions:
  ```
  DRAFT → SUBMITTED
  SUBMITTED → UNDER_REVIEW
  UNDER_REVIEW → APPROVED | REJECTED | CLARIFICATION_REQUESTED
  CLARIFICATION_REQUESTED → RESUBMITTED | EXPIRED
  RESUBMITTED → UNDER_REVIEW
  ```
- [ ] Implement `assignVerifier(submission)` — routing logic
  1. Student's mentor faculty
  2. Category's default verifier
  3. Department's default verifier
- [ ] Implement `approve(submissionId, facultyId, comment?)`
  - Validate state transition
  - Create verification event
  - Trigger points engine
  - Trigger badge evaluation
  - Send notification to student
- [ ] Implement `reject(submissionId, facultyId, reasonCode, comment)`
  - Validate state transition
  - Create verification event
  - Send notification with reason
- [ ] Implement `requestClarification(submissionId, facultyId, question)`
  - Validate state transition
  - Start 7-day timer (background job)
  - Send notification to student
- [ ] Implement `resubmit(submissionId, studentId, updates)`
  - Validate resubmission count < 3
  - Reset to UNDER_REVIEW
  - Notify faculty
- [ ] Implement SLA enforcement (background job)
  - Day 3 reminder → faculty notification
  - Day 4 reminder → faculty notification (email)
  - Day 5 breach → HOD notification, flag as OVERDUE
  - Day 7 → auto-escalate to HOD
- [ ] Implement clarification expiry (background job)
  - Day 7 → student reminder
  - Day 14 → auto-expire
- [ ] Create unit tests for all state transitions
- [ ] Create unit tests for invalid state transitions (must throw)
- [ ] Create integration tests for full approval flow
- [ ] Create integration tests for clarification → resubmission flow

---

## 14.4 Escalation Engine

### Service: `src/server/services/escalation.service.ts`

**Responsibilities:**

- Manage faculty-to-HOD escalation workflow
- Handle auto-escalation from SLA breaches
- Track HOD SLA on escalated items

**Checklist:**

- [ ] Implement `escalateToHOD(submissionId, facultyId, reason)`
  - Create escalation record
  - Flag submission as ESCALATED
  - Remove from faculty queue
  - Notify HOD
  - Start HOD SLA timer (3 business days)
- [ ] Implement `autoEscalate(submissionId)` — called by SLA job
  - Same as manual but `is_auto = true`
  - Notify both faculty and HOD
- [ ] Implement `approveEscalation(escalationId, hodId, comment?)`
  - Resolve escalation as APPROVED
  - Trigger points engine
  - Notify student and faculty
- [ ] Implement `rejectEscalation(escalationId, hodId, reason)`
  - Resolve as REJECTED
  - Notify student and faculty
- [ ] Implement `reassignEscalation(escalationId, hodId, newFacultyId)`
  - Resolve as REASSIGNED
  - Move submission to new faculty's queue
  - Notify new faculty
- [ ] Implement `returnToFaculty(escalationId, hodId, guidance)`
  - Resolve as RETURNED
  - Move back to original faculty's queue with HOD comments
- [ ] Implement HOD SLA enforcement (background job)
  - Day 3 breach → Admin notification
- [ ] Create unit tests for all escalation actions
- [ ] Create integration tests for full escalation lifecycle

---

## 14.5 Leaderboard Engine

### Service: `src/server/services/leaderboard.service.ts`

**Responsibilities:**

- Generate and cache leaderboard rankings
- Support multiple scopes (semester, all-time, batch, category)
- Track rank changes week-over-week
- Manage honor roll

**Checklist:**

- [ ] Implement `getLeaderboard(departmentId, scope, filters, limit)`
  - Query point ledger aggregated by user
  - Apply scope filters (semester, batch, category)
  - Return ranked list with points and rank
- [ ] Implement Redis caching
  - Cache key: `leaderboard:{departmentId}:{scope}:{filters_hash}`
  - TTL: 15 minutes
  - Invalidation on point award or adjustment
- [ ] Implement rank change tracking
  - Store previous week's ranks in Redis
  - Compare current vs. previous for delta indicators
- [ ] Implement `getMyRank(userId, scope)` — student's own position
- [ ] Implement leaderboard anonymization for opted-out students
- [ ] Implement honor roll archival at semester close
  - Background job: when semester is archived, save top 10 to honor_roll snapshot
- [ ] Implement Redis sorted set for real-time leaderboard updates
- [ ] Create `src/server/jobs/leaderboard-refresh.job.ts` — periodic cache rebuild
- [ ] Create unit tests for ranking logic
- [ ] Create integration tests for cache hit/miss scenarios

---

## 14.6 Reward Engine (Phase 2 Preparation)

### Service: `src/server/services/reward.service.ts`

**Checklist (Phase 2 — Scaffold Only in MVP):**

- [ ] Define `Reward` entity interface (not yet in DB)
- [ ] Define `RewardRedemption` entity interface
- [ ] Create placeholder service with TODO comments
- [ ] Document reward redemption workflow in `docs/REWARDS.md`
- [ ] Add `FEATURE_REWARD_REDEMPTION=false` feature flag

---

## 14.7 Badge Engine

### Service: `src/server/services/badge.service.ts`

**Responsibilities:**

- Evaluate badge eligibility after every point or achievement event
- Award badges automatically
- Support admin badge revocation

**Checklist:**

- [ ] Implement `evaluateBadges(userId)` — check all active badge rules against user's profile
- [ ] Implement rule evaluation for each badge type:
  - [ ] `POINT_THRESHOLD` — user's total points exceed threshold
  - [ ] `ACHIEVEMENT_COUNT` — user has N verified achievements (optionally in specific category/level)
  - [ ] `ACTIVITY` — user has N total submissions
  - [ ] `STREAK` — user has verified achievements in N consecutive semesters
  - [ ] `SEMESTER` — user is in top N of semester leaderboard (evaluated at semester close)
- [ ] Implement `awardBadge(userId, badgeId)` — create user_badge record, send notification
- [ ] Implement `revokeBadge(userId, badgeId, reason, adminId)` — soft revoke with audit
- [ ] Implement badge evaluation trigger points:
  - After submission approval
  - After manual point adjustment
  - After semester close (semester badges)
- [ ] Create unit tests for each badge type rule evaluation
- [ ] Create integration test: submit → approve → points awarded → badge earned

---

## 14.8 Notification Engine

### Service: `src/server/services/notification.service.ts`

**Checklist:**

- [ ] Implement `sendNotification(userId, eventType, data)` — creates DB record + optional email
- [ ] Implement notification template rendering
  - [ ] Load template from DB or config
  - [ ] Replace dynamic variables (`{{student_name}}`, `{{achievement_title}}`, etc.)
- [ ] Implement email dispatch (via BullMQ background job)
  - [ ] Respect user's notification preferences
  - [ ] Retry logic: 3 attempts with exponential backoff
- [ ] Implement `getUnreadCount(userId)` — for bell icon badge
- [ ] Create templates for all notification events from PRD
- [ ] Create `src/server/jobs/notification.job.ts` — background email dispatch

---

## 14.9 Phase 6 Milestones

| Milestone | Target                                                                   | Verification               |
| --------- | ------------------------------------------------------------------------ | -------------------------- |
| M6.1      | Points engine calculates correctly for all category × level combinations | Unit tests pass            |
| M6.2      | Full submission → verification → points → badge flow works end-to-end    | Integration test passes    |
| M6.3      | Escalation lifecycle works for all action types                          | Integration test passes    |
| M6.4      | Leaderboard returns correct rankings with Redis caching                  | Cached response matches DB |
| M6.5      | Notification engine dispatches in-app and email for all events           | Manual smoke test passes   |

## 14.10 Dependencies

- Phase 5 (API endpoints serve as entry points for business logic)
- Phase 7 (storage needed for document upload in submission flow)

---

# 15. Phase 7 — Storage

## Duration: Week 5–6 (Sprint 3, parallel with Phase 5)

## 15.1 Objectives

Implement secure file storage for all document types: achievement certificates, supporting documents, profile photos, and badge icons.

## 15.2 Deliverables Checklist

### Supabase Storage Configuration

- [ ] Create Supabase project and configure storage bucket: `achievements`
- [ ] Create storage bucket: `profiles` (profile photos)
- [ ] Create storage bucket: `badges` (badge icons — admin uploaded)
- [ ] Create storage bucket: `reports` (generated report files — restricted access)
- [ ] Configure bucket-level access policies (authenticated users only)
- [ ] Configure CORS settings for upload from Next.js frontend

### Storage Service

- [ ] Create `src/lib/storage.ts` — Supabase Storage client
- [ ] Implement `uploadFile(bucket, path, file, options)` — returns public/signed URL
- [ ] Implement `deleteFile(bucket, path)` — remove file
- [ ] Implement `getSignedUrl(bucket, path, expiresIn)` — time-limited access URL
- [ ] Implement `listFiles(bucket, prefix)` — list files in a directory

### File Processing Middleware

- [ ] Create `src/server/middleware/upload.middleware.ts`
  - [ ] File type validation (magic bytes, not just extension)
    - Allowed: `application/pdf`, `image/jpeg`, `image/png`, `video/mp4`
  - [ ] File size validation (max 10MB per file, 5MB for profile photos)
  - [ ] File count validation (max 5 per submission)
  - [ ] File name sanitization (remove special characters)
  - [ ] Generate unique file paths: `{bucket}/{department}/{userId}/{timestamp}_{filename}`

### Certificates & Documents

- [ ] Implement submission document upload flow
  - [ ] Student uploads documents during submission creation
  - [ ] Documents stored with signed URLs accessible only to: student (own), assigned faculty, HOD, Admin
  - [ ] Documents linked to submission via `submission_documents` table
- [ ] Implement document deletion (only from DRAFT submissions)
- [ ] Implement in-browser document preview (PDF viewer, image viewer)
  - [ ] PDF: Use `react-pdf` for in-browser rendering
  - [ ] Images: Use Next.js `<Image>` component with signed URL

### Profile Photos

- [ ] Implement profile photo upload
  - [ ] Auto-resize to 512×512 using sharp or Supabase image transforms
  - [ ] Generate default avatar from initials (server-side) if no photo uploaded
  - [ ] Store URL in user profile

### Videos

- [ ] Implement video upload support (for cultural/sports achievements)
  - [ ] Max 10MB, MP4 only
  - [ ] Stored in `achievements` bucket
  - [ ] Streaming playback via signed URL

### Reports (Generated Files)

- [ ] Reports stored in `reports` bucket with time-limited signed URLs (24 hours)
- [ ] Old report files cleaned up by background job after 7 days

### Virus Scanning

- [ ] Integrate virus scanning for uploaded files
  - Option A: ClamAV via Docker sidecar (self-hosted)
  - Option B: Cloudflare R2 malware scanning (cloud-managed)
  - [ ] Quarantine detected files; alert admin
  - [ ] Mark submission as "Document Quarantined — Under Review"

## 15.3 Milestones

| Milestone | Target                                       | Verification                              |
| --------- | -------------------------------------------- | ----------------------------------------- |
| M7.1      | File upload works end-to-end for submissions | Upload → store → retrieve via signed URL  |
| M7.2      | File type and size validation enforced       | Invalid uploads rejected with clear error |
| M7.3      | Profile photo upload and resize works        | Photo appears on profile                  |
| M7.4      | In-browser document preview works            | PDF and images render without download    |

## 15.4 Dependencies

- Phase 3 complete (submission repository for document linking)
- Supabase project created and configured

---

# 16. Phase 8 — Frontend

## Duration: Week 7–14 (Sprint 4–7)

## 16.1 Objectives

Build the complete frontend UI for all four portals: Student, Faculty, HOD, and Administrator. The frontend begins once API endpoints are stable enough to consume.

## 16.2 Recommended Build Order

Build frontend modules in this order to maximize parallelism and testability:

```
Sprint 4:  Shared layout + components → Auth pages → Student Dashboard (read-only)
Sprint 5:  Student submission form → Faculty queue → Faculty review interface
Sprint 6:  HOD dashboard + analytics → HOD escalation management → Reports
Sprint 7:  Admin portal → Settings → Notifications → Polish + responsive
```

---

### 16.3 Shared Layout & Components

- [ ] Build dashboard layout (`(dashboard)/layout.tsx`)
  - [ ] Responsive sidebar navigation (collapsible on mobile)
  - [ ] Header with user info, notification bell, and logout
  - [ ] Breadcrumb navigation
  - [ ] Role-based navigation items (sidebar shows only relevant links)
- [ ] Build shared components
  - [ ] `LoadingSkeleton` — skeleton loaders for all widget types
  - [ ] `EmptyState` — illustrated empty state with call-to-action
  - [ ] `ErrorState` — error display with retry button
  - [ ] `ConfirmDialog` — confirmation modal for destructive actions
  - [ ] `FileUpload` — drag-and-drop file uploader with preview
  - [ ] `SearchBar` — debounced search input
  - [ ] `FilterPanel` — multi-dimensional filter sidebar
  - [ ] `Pagination` — numbered pagination with page size selector
  - [ ] `Avatar` — user avatar with fallback initials
  - [ ] `StatusBadge` — colored badge for submission statuses
  - [ ] `StatsCard` — metric card with icon, value, trend indicator
  - [ ] `DataTable` — sortable, filterable table (built on Tanstack Table)
- [ ] Set up React Query provider and default query configuration
- [ ] Set up toast notification system (using Sonner)
- [ ] Create `useAuth()` hook for current user context
- [ ] Create `useDebounce()` hook for search inputs

---

### 16.4 Student Portal

- [ ] **Student Dashboard** (`student/page.tsx`)
  - [ ] KPI cards: Total Points, Verified Achievements, Leaderboard Rank, Badge Count
  - [ ] Submission status breakdown (donut chart or status pills)
  - [ ] Recent activity feed (last 5 submissions with status)
  - [ ] Quick-submit CTA button
  - [ ] Loading skeleton and empty state

- [ ] **New Submission** (`student/submissions/new/page.tsx`)
  - [ ] Multi-step or single-page form with:
    - Category selector (dropdown with icons)
    - Sub-category (conditional)
    - Level selector (visual cards: International → Department)
    - Title, Description, Issuing Organization, Achievement Date
    - Position/Result (conditional for competitions)
    - File upload area (drag-and-drop, multi-file)
    - External URL (optional)
    - Collaborator tagging (student search + select)
  - [ ] Client-side Zod validation with inline errors
  - [ ] Duplicate detection warning modal
  - [ ] Draft save functionality
  - [ ] Success confirmation with submission ID

- [ ] **My Submissions** (`student/submissions/page.tsx`)
  - [ ] Filterable, sortable table with status badges
  - [ ] Status filter tabs (All, Pending, Approved, Rejected)
  - [ ] Click to view submission detail

- [ ] **Submission Detail** (`student/submissions/[id]/page.tsx`)
  - [ ] Full submission information
  - [ ] Uploaded documents with in-browser preview
  - [ ] Verification timeline (status history)
  - [ ] Faculty feedback/comments
  - [ ] Resubmit button (if CLARIFICATION_REQUESTED, count < 3)

- [ ] **My Portfolio** (`student/portfolio/page.tsx`)
  - [ ] Verified achievements organized by category
  - [ ] Public/private toggle
  - [ ] Shareable URL display
  - [ ] Export as PDF button

- [ ] **Leaderboard** (`student/leaderboard/page.tsx`)
  - [ ] Top 100 table with rank, name, batch, points
  - [ ] Rank change indicators
  - [ ] Scope tabs: Semester, All-Time, Batch-wise
  - [ ] Category filter
  - [ ] Own rank sticky footer

- [ ] **My Badges** (`student/badges/page.tsx`)
  - [ ] Badge grid with earned badges highlighted
  - [ ] Unearned badges shown dimmed with criteria
  - [ ] Click badge for detail popup

- [ ] **Profile** (`student/profile/page.tsx`)
  - [ ] Editable fields: photo, phone, LinkedIn, GitHub, bio
  - [ ] Read-only fields: name, USN, email, department, batch
  - [ ] Point summary and badge wall

---

### 16.5 Faculty Portal

- [ ] **Faculty Dashboard** (`faculty/page.tsx`)
  - [ ] KPI cards: Pending Reviews, This Semester Reviewed, Overdue, Average Review Time
  - [ ] Mentee cohort summary: total, 0-achievement count, average points
  - [ ] Recent activity log

- [ ] **Verification Queue** (`faculty/queue/page.tsx`)
  - [ ] Sortable table: Student, Category, Title, Submitted Date, Days in Queue, SLA indicator
  - [ ] Escalated items pinned to top with visual indicator
  - [ ] Filter by category, date range, status
  - [ ] Batch select for bulk actions (Request Clarification)

- [ ] **Submission Review** (`faculty/queue/[id]/page.tsx`)
  - [ ] Split view: submission detail (left) + verification panel (right)
  - [ ] Document viewer (PDF/image) embedded
  - [ ] Verification checklist (interactive checkboxes)
  - [ ] Action buttons: Approve (green), Reject (red), Request Clarification (orange), Escalate (purple)
  - [ ] Comment/feedback textarea
  - [ ] Rejection reason dropdown (required for Reject)
  - [ ] Escalation reason textarea (required for Escalate, min 50 chars)
  - [ ] Confirmation dialog before all actions

- [ ] **Mentee Cohort** (`faculty/mentees/page.tsx`)
  - [ ] Table: Student Name, USN, Points, Verified Count, Pending, Last Submission
  - [ ] Click to view individual mentee detail
  - [ ] Sort by points, by pending count

- [ ] **Mentee Detail** (`faculty/mentees/[id]/page.tsx`)
  - [ ] Student's full achievement history (read-only)
  - [ ] Point breakdown by category

---

### 16.6 HOD Portal

- [ ] **HOD Dashboard** (`hod/page.tsx`)
  - [ ] KPI row: Total Achievements, Total Points, Active Students, At-Risk Students
  - [ ] Category distribution donut chart
  - [ ] Batch comparison bar chart
  - [ ] Top 10 students mini-leaderboard
  - [ ] Pending escalations count (with link)
  - [ ] SLA breach alerts
  - [ ] Faculty verification activity summary

- [ ] **Analytics Center** (`hod/analytics/page.tsx`)
  - [ ] Category breakdown (interactive pie chart)
  - [ ] Batch comparison (grouped bar chart)
  - [ ] Timeline (line chart: submissions over time)
  - [ ] Faculty activity (bar chart: reviewed per faculty)
  - [ ] At-risk students (table with mentor info)
  - [ ] Verification performance (SLA gauge)
  - [ ] Date range selector and semester filter
  - [ ] Manual refresh button

- [ ] **All Submissions** (`hod/submissions/page.tsx`)
  - [ ] Full department submission browser
  - [ ] All filters: status, category, level, batch, faculty, date range
  - [ ] Search by student name or USN
  - [ ] Export filtered results

- [ ] **Escalation Management** (`hod/escalations/page.tsx`)
  - [ ] Escalation inbox with urgency indicators
  - [ ] Detail view with full submission, escalating faculty, reason
  - [ ] Action buttons: Approve, Reject, Reassign, Return

- [ ] **Student Deep Dive** (`hod/students/[id]/page.tsx`)
  - [ ] Full student merit profile
  - [ ] Achievement history, point ledger, badges
  - [ ] Manual point adjustment interface

- [ ] **Report Builder** (`hod/reports/page.tsx`)
  - [ ] Report type selector
  - [ ] Date range picker, batch filter, category filter
  - [ ] Export format selector (PDF, Excel, CSV)
  - [ ] Generate button with loading state
  - [ ] Past reports list with download links
  - [ ] Schedule recurring reports

- [ ] **Department Settings** (`hod/settings/page.tsx`)
  - [ ] Point weight multiplier per category
  - [ ] SLA threshold configuration
  - [ ] Leaderboard visibility toggle

---

### 16.7 Administrator Portal

- [ ] **Admin Dashboard** (`admin/page.tsx`)
  - [ ] KPI cards: Total Users, Active Users, Total Submissions, Pending Approvals
  - [ ] System health: uptime, error rate, storage usage
  - [ ] Recent audit log entries
  - [ ] Pending user approval queue

- [ ] **User Management** (`admin/users/page.tsx`)
  - [ ] Full user table with role, status, department, last login
  - [ ] Bulk import (CSV upload with preview and validation)
  - [ ] Export (CSV download)
  - [ ] Create / Edit / Deactivate user
  - [ ] Force password reset
  - [ ] Role assignment

- [ ] **Achievement Categories** (`admin/categories/page.tsx`)
  - [ ] Category list with base points, icon, status
  - [ ] Create / Edit / Archive category
  - [ ] Verification checklist editor per category

- [ ] **Badge Management** (`admin/badges/page.tsx`)
  - [ ] Badge list with trigger rule summary
  - [ ] Create / Edit / Deactivate badge
  - [ ] Preview badge rendering

- [ ] **Academic Calendar** (`admin/semesters/page.tsx`)
  - [ ] Academic year and semester management
  - [ ] Set active semester
  - [ ] Archive semester

- [ ] **Audit Log Viewer** (`admin/audit/page.tsx`)
  - [ ] Full log table with filters: actor, action, entity, date range
  - [ ] Export as CSV
  - [ ] Click to view entry detail with metadata

- [ ] **System Settings** (`admin/settings/page.tsx`)
  - [ ] Institution details, domain whitelist
  - [ ] Password policy, session duration
  - [ ] MFA enforcement by role
  - [ ] Email configuration
  - [ ] Storage quotas
  - [ ] Maintenance mode toggle

---

### 16.8 Settings & Notifications (All Roles)

- [ ] **User Settings** (`settings/page.tsx`)
  - [ ] Account tab: Change email, change password
  - [ ] Notification tab: Per-event channel preferences
  - [ ] Privacy tab: Portfolio visibility
  - [ ] Sessions tab: Active session list with revoke

- [ ] **Notification Center** (component in header)
  - [ ] Bell icon with unread count badge
  - [ ] Dropdown with recent notifications
  - [ ] "Mark all as read" action
  - [ ] Click notification to navigate to relevant page

---

### 16.9 Public Pages

- [ ] **Public Portfolio** (`portfolio/[usn]/page.tsx`)
  - [ ] Display verified achievements for public-visible portfolios
  - [ ] 404 if portfolio is private or USN not found
  - [ ] Institutional branding
  - [ ] SEO metadata

---

## 16.10 Phase 8 Milestones

| Milestone | Target                                                        | Verification          |
| --------- | ------------------------------------------------------------- | --------------------- |
| M8.1      | Student can submit an achievement end-to-end via the UI       | Manual test           |
| M8.2      | Faculty can review and approve/reject a submission via the UI | Manual test           |
| M8.3      | HOD dashboard displays real-time analytics                    | Visual verification   |
| M8.4      | Admin can manage users, categories, and badges via the UI     | Manual test           |
| M8.5      | All pages are responsive on mobile viewport                   | Chrome DevTools audit |
| M8.6      | Notification bell shows unread count and dropdown             | Manual test           |

## 16.11 Dependencies

- Phase 5 API endpoints stable for the module being built
- Phase 6 business logic engines functional for submission/verification flows
- Phase 7 storage operational for file upload components

---

# 17. Phase 9 — Testing

## Duration: Week 13–15 (Sprint 7–8, overlapping with final Phase 8 work)

## 17.1 Objectives

Establish comprehensive test coverage to ensure production readiness. Testing is continuous throughout development, but this phase represents a dedicated testing and hardening sprint.

## 17.2 Deliverables Checklist

### Unit Testing (Vitest)

- [ ] **Target coverage: 80% on business logic modules**
- [ ] Points engine — all calculation scenarios
- [ ] Verification engine — all state transitions, valid and invalid
- [ ] Escalation engine — all action types
- [ ] Leaderboard engine — ranking, caching, anonymization
- [ ] Badge engine — all rule type evaluations
- [ ] Notification engine — template rendering, preference filtering
- [ ] Validation schemas — valid and invalid inputs for all Zod schemas
- [ ] Utility functions — all helpers in `lib/utils.ts`
- [ ] API response helpers — all envelope formats

### Integration Testing (Vitest + Prisma Test Helpers)

- [ ] Full submission lifecycle: Submit → Assign → Review → Approve → Points → Badge
- [ ] Full submission lifecycle: Submit → Reject → Resubmit → Approve
- [ ] Full escalation lifecycle: Submit → Faculty Escalate → HOD Approve
- [ ] Auto-escalation: Submit → SLA Breach → Auto-Escalate → HOD Resolve
- [ ] Clarification expiry: Submit → Clarify → No Resubmit → Auto-Expire
- [ ] User management: Create → Approve → Login → Update → Deactivate
- [ ] Report generation: Request → Process → Download
- [ ] Bulk import: Upload CSV → Validate → Create Users
- [ ] Point adjustment: HOD adjusts → ledger updated → leaderboard updated

### End-to-End Testing (Playwright)

- [ ] **Student flows:**
  - [ ] Register → Verify Email → Login → Submit Achievement → View Status
  - [ ] View Leaderboard → View Portfolio → Export PDF
  - [ ] Change Password → Update Profile
- [ ] **Faculty flows:**
  - [ ] Login → View Queue → Review Submission → Approve
  - [ ] Review → Reject with Reason → Student notified
  - [ ] Review → Request Clarification → Student Resubmits → Approve
  - [ ] Escalate to HOD
- [ ] **HOD flows:**
  - [ ] Login → View Dashboard → Drill into Analytics
  - [ ] View Escalation → Approve → Student notified
  - [ ] Generate Report → Download PDF
  - [ ] View At-Risk Students
- [ ] **Admin flows:**
  - [ ] Login → Create User → Assign Role
  - [ ] Bulk Import Users (CSV)
  - [ ] Create Achievement Category → Add Checklist Items
  - [ ] View Audit Log → Export

### Performance Testing

- [ ] Load test: 700 concurrent users hitting dashboard endpoints (k6 or Artillery)
- [ ] Load test: 100 simultaneous submission uploads
- [ ] Load test: Leaderboard endpoint under 500 concurrent requests
- [ ] Response time validation: P95 < 2 seconds for all page loads
- [ ] API response time validation: P95 < 500ms for all endpoints
- [ ] Database query validation: No query > 200ms (check via EXPLAIN ANALYZE)
- [ ] Redis cache hit rate: > 80% for leaderboard and analytics
- [ ] Memory leak detection: Monitor RSS over 1-hour load test

### Security Testing

- [ ] OWASP Top 10 checklist review
  - [ ] SQL Injection — verify Prisma parameterization
  - [ ] XSS — verify React DOM escaping and CSP headers
  - [ ] CSRF — verify token enforcement
  - [ ] Broken Authentication — verify lockout, session expiry
  - [ ] IDOR — verify role-scoped data access (student can't view other student's data)
  - [ ] File Upload — verify magic byte validation, size limits, virus scan
- [ ] Penetration test (if resources available)
- [ ] Dependency audit: `pnpm audit` with no critical/high vulnerabilities
- [ ] Security headers: Verify all headers with securityheaders.com
- [ ] RBAC audit: Verify every API endpoint enforces correct role
- [ ] Session security: Verify HttpOnly, Secure, SameSite cookie flags
- [ ] Password storage: Verify bcrypt with 12+ rounds

### Accessibility Testing

- [ ] Automated scan with axe-core (Playwright + @axe-core/playwright)
- [ ] Manual keyboard navigation test for all core flows
- [ ] Screen reader test (VoiceOver/NVDA) for submission form
- [ ] Color contrast validation

## 17.3 Milestones

| Milestone | Target                                   | Verification           |
| --------- | ---------------------------------------- | ---------------------- |
| M9.1      | 80% unit test coverage on business logic | Vitest coverage report |
| M9.2      | All integration tests pass               | CI pipeline green      |
| M9.3      | All E2E critical flows pass              | Playwright report      |
| M9.4      | Performance benchmarks met               | k6 report              |
| M9.5      | Zero critical security findings          | Security audit report  |
| M9.6      | WCAG 2.1 AA compliance for core flows    | Axe report             |

## 17.4 Dependencies

- Phase 8 complete (frontend functional for E2E tests)
- Phase 6 complete (business logic functional for integration tests)

---

# 18. Phase 10 — Deployment

## Duration: Week 15–16 (Sprint 8)

## 18.1 Objectives

Deploy PRiym to production with full CI/CD automation, monitoring, logging, and analytics.

## 18.2 Deliverables Checklist

### Production Infrastructure

- [ ] **Vercel:** Production project configured
  - [ ] Custom domain: `priym.ait.edu.in` (or chosen domain)
  - [ ] Environment variables set for production
  - [ ] Edge function regions configured (Mumbai / Singapore)
  - [ ] Build output caching enabled
- [ ] **AWS RDS:** Production PostgreSQL instance
  - [ ] Instance type: `db.t3.medium` (upgradeable)
  - [ ] Multi-AZ deployment enabled
  - [ ] Automated backups: every 6 hours, retained 30 days
  - [ ] Connection string stored securely (Vercel env vars, not committed)
  - [ ] Read replica configured (for analytics queries)
- [ ] **AWS ElastiCache:** Production Redis instance
  - [ ] Instance type: `cache.t3.small`
  - [ ] Cluster mode disabled (single-node for MVP)
  - [ ] Persistence enabled (AOF)
- [ ] **Supabase Storage:** Production bucket configured
  - [ ] Access policies configured for production
  - [ ] CDN enabled for public assets
- [ ] **Domain & DNS:**
  - [ ] SSL/TLS certificate provisioned (automatic via Vercel)
  - [ ] DNS records configured
  - [ ] HSTS header enabled

### CI/CD Pipelines (GitHub Actions)

**`ci.yml` — Run on every PR:**

- [ ] Checkout code
- [ ] Install dependencies (pnpm)
- [ ] Run ESLint
- [ ] Run TypeScript type check
- [ ] Run unit tests (Vitest)
- [ ] Run integration tests
- [ ] Build Next.js app
- [ ] Run `pnpm audit` for dependency vulnerabilities
- [ ] Post coverage report as PR comment

**`deploy-staging.yml` — Run on merge to `develop`:**

- [ ] All CI checks
- [ ] Deploy to Vercel preview environment
- [ ] Run Prisma migrations against staging database
- [ ] Run E2E smoke tests against staging URL
- [ ] Post deployment URL to Slack/Discord

**`deploy-production.yml` — Run on merge to `main`:**

- [ ] All CI checks
- [ ] Manual approval gate (GitHub Environments protection rule)
- [ ] Deploy to Vercel production
- [ ] Run Prisma migrations against production database (with confirmation)
- [ ] Run E2E smoke tests against production URL
- [ ] Create GitHub Release with changelog
- [ ] Post deployment notification

### Monitoring

- [ ] **Sentry** — Error Tracking
  - [ ] Install Sentry SDK for Next.js (client + server)
  - [ ] Configure source maps upload in build pipeline
  - [ ] Set up alert rules: notify on new error, error spike (>5 in 5min)
  - [ ] Configure release tracking (link deployments to Sentry releases)

- [ ] **Vercel Analytics** — Real User Monitoring
  - [ ] Enable Speed Insights for Core Web Vitals
  - [ ] Enable Web Analytics for page view tracking
  - [ ] Set up custom performance marks for critical flows

- [ ] **UptimeRobot / Better Uptime** — Uptime Monitoring
  - [ ] Configure HTTP checks on production URL (every 1 minute)
  - [ ] Configure HTTP checks on API health endpoint (`/api/v1/health`)
  - [ ] Set up status page (public or team-only)
  - [ ] Configure incident escalation: email → Slack → SMS

### Logging

- [ ] Implement structured logging with Pino
  - [ ] Log levels: ERROR, WARN, INFO, DEBUG (configurable per environment)
  - [ ] Include: timestamp, request ID, user ID (anonymized), method, path, status, duration
  - [ ] PII scrubbing: strip passwords, tokens, and personal data from logs
- [ ] Configure Vercel Log Drains (to Datadog or Betterstack Logs)
- [ ] Create log retention policy: 30 days hot, 90 days cold

### Analytics

- [ ] Implement platform usage analytics (internal)
  - [ ] Track DAU, WAU, MAU (via database queries or PostHog)
  - [ ] Track submissions per day/week (dashboard widget)
  - [ ] Track verification SLA compliance (dashboard widget)
  - [ ] Track feature adoption (which portal sections are most used)
- [ ] Implement admin analytics dashboard
  - [ ] System health widget: uptime, error rate, P95 response time
  - [ ] Storage consumption tracking
  - [ ] User growth chart

### Pre-Launch Checklist

- [ ] Production database migrated and seeded (admin account only)
- [ ] All environment variables verified
- [ ] SSL/TLS working correctly
- [ ] Security headers verified
- [ ] CORS configured correctly
- [ ] Rate limiting active
- [ ] Error monitoring active (Sentry)
- [ ] Uptime monitoring active
- [ ] Backup restoration tested
- [ ] Admin can login and configure platform
- [ ] Faculty champion can login and access queue
- [ ] Test student can register, submit, and receive notifications
- [ ] Performance benchmarks validated on production
- [ ] Rollback plan documented and tested

## 18.3 Milestones

| Milestone | Target                                | Verification                                       |
| --------- | ------------------------------------- | -------------------------------------------------- |
| M10.1     | Production infrastructure provisioned | All services running                               |
| M10.2     | CI/CD pipeline fully automated        | Push to main → auto-deploy                         |
| M10.3     | Monitoring and alerting operational   | Sentry captures test error; UptimeRobot pings pass |
| M10.4     | Pre-launch checklist 100% complete    | Signed off by lead                                 |
| M10.5     | **PRiym is LIVE**                     | First real user logs in                            |

## 18.4 Dependencies

- Phase 9 complete (testing confirms production readiness)

---

# 19. Risks

## 19.1 Risk Register

| Risk                                            | Probability | Impact    | Severity | Mitigation                                                                                   | Owner               |
| ----------------------------------------------- | ----------- | --------- | -------- | -------------------------------------------------------------------------------------------- | ------------------- |
| Scope creep during frontend development         | High        | High      | Critical | Strict adherence to PRD scope; use GitHub Projects to track; defer to backlog                | Product Lead        |
| Authentication edge cases cause security gaps   | Medium      | Very High | Critical | Dedicated security review of auth module; OWASP checklist; 3rd-party pen test                | Tech Lead           |
| File upload vulnerabilities (malware, oversize) | Medium      | High      | High     | Magic byte validation; virus scan; file size limits; sandbox environment                     | Backend Lead        |
| Database performance degrades under load        | Medium      | High      | High     | Index optimization; query profiling; connection pooling; read replica                        | Backend Lead        |
| Redis cache inconsistency with database         | Medium      | Medium    | Medium   | TTL-based invalidation; cache-aside pattern; eventual consistency acceptable for leaderboard | Backend Lead        |
| Team velocity slower than estimated             | Medium      | High      | High     | Buffer sprints built into timeline; scope can be reduced to core flows only                  | Engineering Manager |
| Supabase Storage downtime                       | Low         | High      | Medium   | Implement retry with backoff; document upload not blocking submission creation               | Backend Lead        |
| Third-party dependency vulnerabilities          | Medium      | Medium    | Medium   | Weekly `pnpm audit`; Dependabot enabled; no unmaintained packages                            | DevOps              |
| Faculty and student adoption resistance         | Medium      | High      | High     | Pre-launch training; faculty champion program; first-week support                            | Product Lead        |
| Production data breach                          | Low         | Very High | Critical | Encryption at rest/transit; RBAC; audit logs; incident response plan                         | Tech Lead           |

---

# 20. Timeline

## 20.1 Sprint Schedule

| Sprint     | Weeks      | Phases                       | Focus                                 |
| ---------- | ---------- | ---------------------------- | ------------------------------------- |
| Sprint 1   | Week 1–2   | Phase 1 + Phase 2            | Foundation + Database                 |
| Sprint 2   | Week 3–4   | Phase 3 + Phase 4            | Prisma + Authentication               |
| Sprint 3   | Week 5–6   | Phase 5 (partial) + Phase 7  | API scaffolds + Storage               |
| Sprint 4   | Week 7–8   | Phase 5 (complete) + Phase 6 | APIs + Business Logic                 |
| Sprint 5   | Week 9–10  | Phase 8 (Student + Faculty)  | Frontend portals                      |
| Sprint 6   | Week 11–12 | Phase 8 (HOD + Admin)        | Frontend portals                      |
| Sprint 7   | Week 13–14 | Phase 8 (Polish) + Phase 9   | Testing + Hardening                   |
| Sprint 8   | Week 15–16 | Phase 10                     | Deployment + Launch                   |
| Sprint 9*  | Week 17–18 | Buffer                       | Bug fixes, feedback, stabilization    |
| Sprint 10* | Week 19–20 | Post-MVP                     | v1.1 planning and initial development |

*Sprints 9–10 are buffer/post-MVP sprints.

## 20.2 Gantt Chart (Text)

```
Week:  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18
       ├──┤──┤──┤──┤──┤──┤──┤──┤──┤──┤──┤──┤──┤──┤──┤──┤──┤──┤
Phase1 ████
Phase2    ████
Phase3       ██
Phase4       ████
Phase5          ████████
Phase6             ████████
Phase7          ████
Phase8                   ████████████████
Phase9                               ████████
Phase10                                     ████
Buffer                                          ████
Post-MVP                                             ████
```

---

# 21. Milestones

## 21.1 Master Milestone Table

| ID    | Milestone                            | Phase | Target Week | Status |
| ----- | ------------------------------------ | ----- | ----------- | ------ |
| M1.1  | Repository and tooling ready         | 1     | Week 1      | ⬜     |
| M1.2  | Local dev environment works          | 1     | Week 1      | ⬜     |
| M1.3  | CI pipeline operational              | 1     | Week 2      | ⬜     |
| M2.1  | Database schema defined in Prisma    | 2     | Week 2      | ⬜     |
| M2.2  | Migrations applied, seed data loaded | 2     | Week 3      | ⬜     |
| M3.1  | Repositories and validators complete | 3     | Week 3      | ⬜     |
| M4.1  | Registration + login functional      | 4     | Week 4      | ⬜     |
| M4.2  | RBAC middleware active               | 4     | Week 4      | ⬜     |
| M5.1  | Core API endpoints functional        | 5     | Week 6      | ⬜     |
| M5.2  | All API endpoints functional         | 5     | Week 8      | ⬜     |
| M6.1  | Points engine operational            | 6     | Week 6      | ⬜     |
| M6.2  | Verification engine operational      | 6     | Week 7      | ⬜     |
| M6.3  | Escalation engine operational        | 6     | Week 7      | ⬜     |
| M6.4  | Leaderboard engine operational       | 6     | Week 8      | ⬜     |
| M6.5  | Badge engine operational             | 6     | Week 8      | ⬜     |
| M7.1  | File upload/download works           | 7     | Week 5      | ⬜     |
| M8.1  | Student portal complete              | 8     | Week 10     | ⬜     |
| M8.2  | Faculty portal complete              | 8     | Week 10     | ⬜     |
| M8.3  | HOD portal complete                  | 8     | Week 12     | ⬜     |
| M8.4  | Admin portal complete                | 8     | Week 12     | ⬜     |
| M8.5  | All portals responsive               | 8     | Week 13     | ⬜     |
| M9.1  | 80% unit test coverage               | 9     | Week 14     | ⬜     |
| M9.2  | All E2E tests pass                   | 9     | Week 14     | ⬜     |
| M9.3  | Performance benchmarks met           | 9     | Week 14     | ⬜     |
| M9.4  | Security audit passed                | 9     | Week 14     | ⬜     |
| M10.1 | Production infrastructure ready      | 10    | Week 15     | ⬜     |
| M10.2 | CI/CD pipeline complete              | 10    | Week 15     | ⬜     |
| M10.3 | Pre-launch checklist signed off      | 10    | Week 16     | ⬜     |
| M10.4 | **🚀 PRiym v1.0 is LIVE**            | 10    | Week 16     | ⬜     |

---

# 22. Definition of Done

A feature is considered **DONE** when ALL of the following criteria are satisfied:

### Code

- [ ] Code compiles with zero TypeScript errors
- [ ] ESLint passes with zero warnings
- [ ] All new functions have JSDoc/TSDoc comments
- [ ] No `any` types without documented justification
- [ ] No `console.log` or debug statements
- [ ] No TODO without a linked GitHub Issue

### Testing

- [ ] Unit tests written for new business logic (80% coverage minimum)
- [ ] Integration test added for new workflows
- [ ] E2E test added for new user-facing flows
- [ ] All existing tests still pass
- [ ] Manual smoke test performed by developer

### Security

- [ ] API endpoint enforces correct RBAC
- [ ] Input validated with Zod
- [ ] No new dependencies with known critical vulnerabilities
- [ ] Sensitive data not logged

### Documentation

- [ ] API changes reflected in `docs/API.md`
- [ ] Database changes have a Prisma migration
- [ ] Complex logic has inline comments explaining _why_

### Review

- [ ] PR has been reviewed by at least 1 team member
- [ ] All review comments addressed
- [ ] CI pipeline passes
- [ ] Feature verified in staging environment

### UX

- [ ] UI matches wireframe/design specification
- [ ] Responsive on mobile (375px), tablet (768px), and desktop (1440px)
- [ ] Loading states shown for async operations
- [ ] Error states shown with actionable messages
- [ ] Keyboard navigable

---

# 23. Post-MVP Roadmap

## 23.1 Immediate Post-Launch (Weeks 17–20)

| Priority | Task                                                       |
| -------- | ---------------------------------------------------------- |
| P0       | Production bug fixes and stability monitoring              |
| P0       | User feedback collection (in-app feedback form)            |
| P0       | Faculty and student onboarding support                     |
| P1       | Performance optimization based on real-world usage data    |
| P1       | UX refinements based on user feedback                      |
| P2       | Data quality audit: review first batch of real submissions |
| P2       | Documentation refinement based on support questions        |

## 23.2 v1.1 Planning (Month 5–6)

Based on pilot feedback, prioritize from:

- Mobile-responsive improvements (priority UX fixes)
- Bulk operations (batch approve/reject)
- Advanced filter saves
- CSV export enhancements
- Dashboard customization
- Faculty-specific analytics

---

# 24. Technical Debt

## 24.1 Known Debt Items (To Be Tracked)

| ID     | Debt Item                                                                 | Severity | Target Phase |
| ------ | ------------------------------------------------------------------------- | -------- | ------------ |
| TD-001 | Hardcoded level multipliers (should be DB-configurable)                   | Low      | v1.1         |
| TD-002 | No real-time updates (polling-based; should use WebSockets/SSE)           | Medium   | v2.0         |
| TD-003 | Report generation is synchronous for small datasets (should all be async) | Low      | v1.1         |
| TD-004 | No database connection pooling optimizer (PgBouncer)                      | Medium   | v2.0         |
| TD-005 | Leaderboard rank change calculated weekly (should be daily in v2)         | Low      | v1.1         |
| TD-006 | Email templates are static strings (should be in DB and admin-editable)   | Medium   | v1.1         |
| TD-007 | No API versioning deprecation mechanism                                   | Low      | v2.0         |
| TD-008 | Audit log HMAC signing not implemented in MVP                             | High     | v1.1         |
| TD-009 | No database row-level security (RLS); relying on application-level RBAC   | Medium   | v2.0         |
| TD-010 | No cron job for cleaning expired notifications and old report files       | Medium   | v1.1         |
| TD-011 | No offline support / PWA capabilities                                     | Low      | v2.0         |
| TD-012 | No API rate limiting per-user (only per-IP currently)                     | Medium   | v1.1         |

## 24.2 Debt Management Policy

- Every sprint allocates **15–20% of capacity** to technical debt reduction.
- High-severity debt items must be resolved before the next minor version release.
- No new debt item is created without a linked GitHub Issue and target phase.
- Tech Lead reviews debt backlog at every sprint planning.

---

# 25. Future Versions

## 25.1 Version 1.1 — Refinement (Month 6–8)

**Theme:** Stability, performance, and user-requested improvements.

| Feature                       | Description                                                     |
| ----------------------------- | --------------------------------------------------------------- |
| Mobile-responsive polish      | Fix all mobile UX issues identified in pilot                    |
| Bulk operations               | Batch approve/reject for faculty, batch user actions for admin  |
| Advanced search               | Full-text search across achievements with Postgres `tsvector`   |
| Email template editor         | Admin can edit notification templates in-platform               |
| Scheduled report improvements | More flexible scheduling (bi-weekly, custom dates)              |
| Dashboard customization       | Drag-and-drop widget reordering for HOD dashboard               |
| Performance optimizations     | Query optimization, CDN tuning, bundle size reduction           |
| Technical debt resolution     | Address TD-001, TD-005, TD-006, TD-008, TD-010, TD-012          |
| Faculty performance tracking  | Basic metrics: reviews/week, average review time                |
| Notification digest           | Daily digest email instead of individual notifications (opt-in) |

---

## 25.2 Version 2.0 — Expansion (Month 9–15)

**Theme:** Multi-department rollout, advanced features, integrations.

| Feature                        | Description                                                        |
| ------------------------------ | ------------------------------------------------------------------ |
| Multi-department support       | Onboard all 8 AIT departments with isolated dashboards and HODs    |
| Mobile application             | React Native app for Students and Faculty (submit, track, verify)  |
| ERP/LMS integration            | Two-way sync with AIT's Student Information System                 |
| Real-time updates              | WebSocket/SSE for live dashboard updates, queue notifications      |
| AI achievement recommendations | Suggest achievements based on student profile and peer patterns    |
| Faculty mentoring analytics    | Faculty effectiveness dashboard                                    |
| SSO integration                | Google Workspace or Microsoft Azure AD single sign-on              |
| Gamification engine            | Full gamification beyond leaderboards: streaks, challenges, quests |
| PgBouncer connection pooling   | Database connection optimization for multi-department scale        |
| API v2                         | Evolved API with GraphQL option for complex frontend queries       |
| Technical debt resolution      | Address TD-002, TD-004, TD-007, TD-009, TD-011                     |

---

## 25.3 Version 3.0 — Platform (Month 15–24)

**Theme:** Multi-institution SaaS, AI-powered intelligence, commercialization.

| Feature                        | Description                                                       |
| ------------------------------ | ----------------------------------------------------------------- |
| Multi-tenant SaaS architecture | White-labeled platform for other institutions                     |
| Placement prediction model     | ML model correlating achievement profiles with placement outcomes |
| AI resume builder              | One-click resume from verified achievement portfolio              |
| Company/recruiter integrations | LinkedIn Talent, HackerEarth API integrations                     |
| Alumni achievement tracking    | Post-graduation accomplishment logging                            |
| Academic Bank of Credits       | Integration with India's ABC and NDEAR                            |
| Parent/Guardian portal         | View-only portal for parents                                      |
| National benchmarking          | Cross-institution anonymized achievement comparison               |
| Subscription billing           | Stripe-based SaaS billing for commercial customers                |
| Admin marketplace              | PRiym Marketplace for certifications and competitions             |

---

# Appendices

## Appendix A: Sprint Ceremony Schedule

| Ceremony             | When                                | Duration   | Participants                           |
| -------------------- | ----------------------------------- | ---------- | -------------------------------------- |
| Daily Standup        | Monday–Friday, 10:00 AM IST         | 15 minutes | All engineers                          |
| Sprint Planning      | Monday of Sprint Week 1, 2:00 PM    | 2 hours    | All engineers + Product                |
| Sprint Review        | Friday of Sprint Week 2, 3:00 PM    | 1 hour     | All engineers + Product + HOD champion |
| Sprint Retrospective | Friday of Sprint Week 2, 4:00 PM    | 1 hour     | All engineers                          |
| Backlog Grooming     | Wednesday of Sprint Week 1, 3:00 PM | 1 hour     | Tech Lead + Product                    |

---

## Appendix B: Environment Matrix

| Environment | URL                        | Database             | Redis                    | Purpose           |
| ----------- | -------------------------- | -------------------- | ------------------------ | ----------------- |
| Local       | `http://localhost:3000`    | Docker (local)       | Docker (local)           | Development       |
| Staging     | `staging.priym.ait.edu.in` | AWS RDS (staging)    | ElastiCache (staging)    | Testing and demos |
| Production  | `priym.ait.edu.in`         | AWS RDS (production) | ElastiCache (production) | Live platform     |

---

## Appendix C: Estimated Cost (Monthly — MVP)

| Service                 | Tier           | Estimated Monthly Cost |
| ----------------------- | -------------- | ---------------------- |
| Vercel                  | Pro            | $20                    |
| AWS RDS (PostgreSQL)    | db.t3.medium   | $50–70                 |
| AWS ElastiCache (Redis) | cache.t3.small | $20–30                 |
| Supabase (Storage)      | Pro            | $25                    |
| Resend (Email)          | Free / Pro     | $0–20                  |
| Sentry                  | Team           | $0 (free tier)         |
| Domain + SSL            | Annual         | ~$10/year              |
| **Total**               |                | **~$125–175/month**    |

---

## Appendix D: Document Control

| Field        | Value                                    |
| ------------ | ---------------------------------------- |
| Document ID  | AIT-PRiym-IMPL-2026-001                  |
| Version      | 1.0                                      |
| Status       | Active — Phase 1 In Progress             |
| Author       | Engineering Leadership Team              |
| Approved By  | [Tech Lead]                              |
| Next Review  | End of Sprint 4 (mid-project checkpoint) |
| Review Cycle | Every 4 sprints                          |

---

<div align="center">

---

_This document is the engineering blueprint for PRiym._
_All development work should reference this plan._
_Update this document as the project evolves._

_Document ID: AIT-PRiym-IMPL-2026-001 | Version 1.0 | August 2026_

_PRiym — Progress • Recognition • Innovation • Merit_

</div>
