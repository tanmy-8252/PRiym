---

<div align="center">

# PRiym

### Progress • Recognition • Innovation • Merit

# Repository Architecture & Folder Structure

**Enterprise Monorepo — Turborepo**

---

Document ID: `AIT-PRiym-ARCH-2026-001`
Version: **1.0** | August 2026

</div>

---

# Table of Contents

1. [Architecture Philosophy](#1-architecture-philosophy)
2. [Repository Root](#2-repository-root)
3. [Complete Folder Tree](#3-complete-folder-tree)
4. [Detailed Folder Responsibilities](#4-detailed-folder-responsibilities)
5. [Package Dependency Graph](#5-package-dependency-graph)
6. [Key Configuration Files](#6-key-configuration-files)

---

# 1. Architecture Philosophy

PRiym follows the **Turborepo monorepo** pattern used by enterprise SaaS companies (Vercel, Linear, Cal.com). The architecture enforces four principles:

| Principle                  | Implementation                                                                                                          |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Separation of Concerns** | Each package has a single, well-defined responsibility. Business logic never lives in UI components.                    |
| **Shared Contracts**       | Types, validation schemas, and configuration are shared packages — never duplicated.                                    |
| **Layered Architecture**   | Controllers → Services → Repositories → Database. Each layer has strict boundaries.                                     |
| **Package Isolation**      | Every package is independently buildable, testable, and publishable. Changes in one package only affect its dependents. |

```
┌──────────────────────────────────────────────────────┐
│                     APPS LAYER                       │
│  ┌────────────┐   ┌────────────┐   ┌──────────────┐ │
│  │  apps/web  │   │  apps/api  │   │  apps/docs   │ │
│  │ (Next.js)  │   │  (Future)  │   │  (Mintlify)  │ │
│  └──────┬─────┘   └─────┬──────┘   └──────────────┘ │
│         │               │                            │
│─────────┼───────────────┼────────────────────────────│
│         │    PACKAGES LAYER                          │
│  ┌──────▼──────────────-▼────────────────────────┐   │
│  │  @priym/database  @priym/auth  @priym/ui      │   │
│  │  @priym/validation  @priym/types  @priym/config│   │
│  │  @priym/email  @priym/storage  @priym/logger  │   │
│  └───────────────────────────────────────────────┘   │
│                                                      │
│─────────────────────────────────────────────────────-│
│                   INFRASTRUCTURE                     │
│  Docker · GitHub Actions · Vercel · AWS · Supabase   │
└──────────────────────────────────────────────────────┘
```

---

# 2. Repository Root

```
priym/                                  ← Turborepo monorepo root
├── apps/                               ← Deployable applications
├── packages/                           ← Shared internal packages
├── docs/                               ← Project documentation (BRD, PRD, etc.)
├── scripts/                            ← Automation & DevOps scripts
├── tests/                              ← Cross-package & E2E tests
├── .github/                            ← GitHub workflows, templates, actions
├── docker/                             ← Docker configurations
├── turbo.json                          ← Turborepo pipeline configuration
├── package.json                        ← Root workspace configuration
├── pnpm-workspace.yaml                 ← pnpm workspace definition
├── tsconfig.base.json                  ← Shared TypeScript configuration
├── .env.example                        ← Environment variable template
├── .gitignore                          ← Git ignore rules
├── .prettierrc                         ← Prettier formatting configuration
├── .eslintrc.js                        ← Root ESLint configuration
├── LICENSE                             ← Project license
└── README.md                           ← Project overview & getting started
```

---

# 3. Complete Folder Tree

> Legend: 📁 = Directory | 📄 = File | 📦 = Package | 🏗️ = App

```
priym/
│
├── 🏗️ apps/
│   │
│   ├── web/                                        ← PRIMARY: Next.js web application
│   │   ├── public/
│   │   │   ├── favicon.ico
│   │   │   ├── logo.svg
│   │   │   ├── logo-dark.svg
│   │   │   ├── og-image.png                        ← Open Graph social preview image
│   │   │   ├── robots.txt
│   │   │   ├── sitemap.xml
│   │   │   └── images/
│   │   │       ├── badges/                         ← Default badge icons
│   │   │       ├── avatars/                        ← Default avatar placeholders
│   │   │       ├── illustrations/                  ← Empty states, onboarding
│   │   │       └── branding/                       ← Institutional logos
│   │   │
│   │   ├── src/
│   │   │   │
│   │   │   ├── app/                                ← Next.js App Router
│   │   │   │   │
│   │   │   │   ├── (auth)/                         ← Authentication route group
│   │   │   │   │   ├── login/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── register/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── forgot-password/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── reset-password/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── verify-email/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── mfa-verify/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── layout.tsx                  ← Centered card layout for auth pages
│   │   │   │   │
│   │   │   │   ├── (dashboard)/                    ← Authenticated dashboard group
│   │   │   │   │   │
│   │   │   │   │   ├── student/                    ← STUDENT PORTAL
│   │   │   │   │   │   ├── page.tsx                ← Dashboard home
│   │   │   │   │   │   ├── submissions/
│   │   │   │   │   │   │   ├── page.tsx            ← My submissions list
│   │   │   │   │   │   │   ├── new/
│   │   │   │   │   │   │   │   └── page.tsx        ← New submission form
│   │   │   │   │   │   │   └── [id]/
│   │   │   │   │   │   │       └── page.tsx        ← Submission detail
│   │   │   │   │   │   ├── portfolio/
│   │   │   │   │   │   │   └── page.tsx            ← My portfolio
│   │   │   │   │   │   ├── leaderboard/
│   │   │   │   │   │   │   └── page.tsx            ← Leaderboard view
│   │   │   │   │   │   ├── badges/
│   │   │   │   │   │   │   └── page.tsx            ← My badges
│   │   │   │   │   │   ├── rewards/
│   │   │   │   │   │   │   └── page.tsx            ← Reward catalog (Phase 2)
│   │   │   │   │   │   └── profile/
│   │   │   │   │   │       └── page.tsx            ← My profile
│   │   │   │   │   │
│   │   │   │   │   ├── faculty/                    ← FACULTY PORTAL
│   │   │   │   │   │   ├── page.tsx                ← Dashboard home
│   │   │   │   │   │   ├── queue/
│   │   │   │   │   │   │   ├── page.tsx            ← Verification queue
│   │   │   │   │   │   │   └── [id]/
│   │   │   │   │   │   │       └── page.tsx        ← Submission review interface
│   │   │   │   │   │   ├── mentees/
│   │   │   │   │   │   │   ├── page.tsx            ← Mentee cohort list
│   │   │   │   │   │   │   └── [id]/
│   │   │   │   │   │   │       └── page.tsx        ← Individual mentee detail
│   │   │   │   │   │   └── profile/
│   │   │   │   │   │       └── page.tsx            ← Faculty profile
│   │   │   │   │   │
│   │   │   │   │   ├── hod/                        ← HOD PORTAL
│   │   │   │   │   │   ├── page.tsx                ← Dashboard home
│   │   │   │   │   │   ├── analytics/
│   │   │   │   │   │   │   └── page.tsx            ← Analytics center
│   │   │   │   │   │   ├── submissions/
│   │   │   │   │   │   │   ├── page.tsx            ← All department submissions
│   │   │   │   │   │   │   └── [id]/
│   │   │   │   │   │   │       └── page.tsx        ← Submission detail
│   │   │   │   │   │   ├── escalations/
│   │   │   │   │   │   │   ├── page.tsx            ← Escalation inbox
│   │   │   │   │   │   │   └── [id]/
│   │   │   │   │   │   │       └── page.tsx        ← Escalation detail + actions
│   │   │   │   │   │   ├── students/
│   │   │   │   │   │   │   ├── page.tsx            ← All students
│   │   │   │   │   │   │   └── [id]/
│   │   │   │   │   │   │       └── page.tsx        ← Student deep dive
│   │   │   │   │   │   ├── faculty/
│   │   │   │   │   │   │   └── page.tsx            ← Faculty performance view
│   │   │   │   │   │   ├── reports/
│   │   │   │   │   │   │   └── page.tsx            ← Report builder
│   │   │   │   │   │   └── settings/
│   │   │   │   │   │       └── page.tsx            ← Department settings
│   │   │   │   │   │
│   │   │   │   │   ├── admin/                      ← ADMINISTRATOR PORTAL
│   │   │   │   │   │   ├── page.tsx                ← Dashboard home
│   │   │   │   │   │   ├── users/
│   │   │   │   │   │   │   ├── page.tsx            ← User management list
│   │   │   │   │   │   │   ├── new/
│   │   │   │   │   │   │   │   └── page.tsx        ← Create user
│   │   │   │   │   │   │   ├── import/
│   │   │   │   │   │   │   │   └── page.tsx        ← Bulk CSV import
│   │   │   │   │   │   │   └── [id]/
│   │   │   │   │   │   │       └── page.tsx        ← Edit user
│   │   │   │   │   │   ├── categories/
│   │   │   │   │   │   │   ├── page.tsx            ← Achievement category management
│   │   │   │   │   │   │   └── [id]/
│   │   │   │   │   │   │       └── page.tsx        ← Edit category + checklist
│   │   │   │   │   │   ├── badges/
│   │   │   │   │   │   │   ├── page.tsx            ← Badge management
│   │   │   │   │   │   │   └── [id]/
│   │   │   │   │   │   │       └── page.tsx        ← Edit badge
│   │   │   │   │   │   ├── departments/
│   │   │   │   │   │   │   └── page.tsx            ← Department management
│   │   │   │   │   │   ├── semesters/
│   │   │   │   │   │   │   └── page.tsx            ← Academic year + semester
│   │   │   │   │   │   ├── notifications/
│   │   │   │   │   │   │   └── page.tsx            ← Notification template editor
│   │   │   │   │   │   ├── audit/
│   │   │   │   │   │   │   └── page.tsx            ← Audit log viewer
│   │   │   │   │   │   └── settings/
│   │   │   │   │   │       └── page.tsx            ← System settings
│   │   │   │   │   │
│   │   │   │   │   ├── settings/
│   │   │   │   │   │   └── page.tsx                ← User settings (all roles)
│   │   │   │   │   │
│   │   │   │   │   └── layout.tsx                  ← Dashboard layout (sidebar + header)
│   │   │   │   │
│   │   │   │   ├── portfolio/                      ← PUBLIC PAGES
│   │   │   │   │   └── [usn]/
│   │   │   │   │       └── page.tsx                ← Public student portfolio
│   │   │   │   │
│   │   │   │   ├── api/                            ← API ROUTE HANDLERS
│   │   │   │   │   ├── auth/
│   │   │   │   │   │   └── [...nextauth]/
│   │   │   │   │   │       └── route.ts            ← Auth.js catch-all handler
│   │   │   │   │   ├── v1/
│   │   │   │   │   │   ├── auth/
│   │   │   │   │   │   │   ├── register/
│   │   │   │   │   │   │   │   └── route.ts
│   │   │   │   │   │   │   ├── verify-email/
│   │   │   │   │   │   │   │   └── route.ts
│   │   │   │   │   │   │   ├── forgot-password/
│   │   │   │   │   │   │   │   └── route.ts
│   │   │   │   │   │   │   ├── reset-password/
│   │   │   │   │   │   │   │   └── route.ts
│   │   │   │   │   │   │   ├── change-password/
│   │   │   │   │   │   │   │   └── route.ts
│   │   │   │   │   │   │   ├── sessions/
│   │   │   │   │   │   │   │   ├── route.ts        ← GET (list), DELETE (revoke)
│   │   │   │   │   │   │   │   └── [sessionId]/
│   │   │   │   │   │   │   │       └── route.ts
│   │   │   │   │   │   │   └── mfa/
│   │   │   │   │   │   │       ├── setup/
│   │   │   │   │   │   │       │   └── route.ts
│   │   │   │   │   │   │       ├── verify/
│   │   │   │   │   │   │       │   └── route.ts
│   │   │   │   │   │   │       └── route.ts        ← DELETE (disable MFA)
│   │   │   │   │   │   │
│   │   │   │   │   │   ├── users/
│   │   │   │   │   │   │   ├── route.ts            ← GET (list), POST (create)
│   │   │   │   │   │   │   ├── bulk-import/
│   │   │   │   │   │   │   │   └── route.ts        ← POST (CSV import)
│   │   │   │   │   │   │   ├── export/
│   │   │   │   │   │   │   │   └── route.ts        ← GET (CSV export)
│   │   │   │   │   │   │   └── [userId]/
│   │   │   │   │   │   │       ├── route.ts        ← GET, PATCH, DELETE
│   │   │   │   │   │   │       └── login-history/
│   │   │   │   │   │   │           └── route.ts
│   │   │   │   │   │   │
│   │   │   │   │   │   ├── submissions/
│   │   │   │   │   │   │   ├── route.ts            ← GET (list), POST (create)
│   │   │   │   │   │   │   └── [submissionId]/
│   │   │   │   │   │   │       ├── route.ts        ← GET, PATCH, DELETE
│   │   │   │   │   │   │       ├── resubmit/
│   │   │   │   │   │   │       │   └── route.ts
│   │   │   │   │   │   │       └── documents/
│   │   │   │   │   │   │           ├── route.ts    ← POST (upload)
│   │   │   │   │   │   │           └── [docId]/
│   │   │   │   │   │   │               └── route.ts ← DELETE
│   │   │   │   │   │   │
│   │   │   │   │   │   ├── verifications/
│   │   │   │   │   │   │   ├── queue/
│   │   │   │   │   │   │   │   └── route.ts        ← GET (faculty queue)
│   │   │   │   │   │   │   └── [submissionId]/
│   │   │   │   │   │   │       ├── approve/
│   │   │   │   │   │   │       │   └── route.ts
│   │   │   │   │   │   │       ├── reject/
│   │   │   │   │   │   │       │   └── route.ts
│   │   │   │   │   │   │       ├── clarify/
│   │   │   │   │   │   │       │   └── route.ts
│   │   │   │   │   │   │       └── escalate/
│   │   │   │   │   │   │           └── route.ts
│   │   │   │   │   │   │
│   │   │   │   │   │   ├── escalations/
│   │   │   │   │   │   │   ├── route.ts            ← GET (list)
│   │   │   │   │   │   │   └── [escalationId]/
│   │   │   │   │   │   │       ├── route.ts        ← GET (detail)
│   │   │   │   │   │   │       ├── approve/
│   │   │   │   │   │   │       │   └── route.ts
│   │   │   │   │   │   │       ├── reject/
│   │   │   │   │   │   │       │   └── route.ts
│   │   │   │   │   │   │       ├── reassign/
│   │   │   │   │   │   │       │   └── route.ts
│   │   │   │   │   │   │       └── return/
│   │   │   │   │   │   │           └── route.ts
│   │   │   │   │   │   │
│   │   │   │   │   │   ├── points/
│   │   │   │   │   │   │   └── [userId]/
│   │   │   │   │   │   │       ├── route.ts        ← GET (balance)
│   │   │   │   │   │   │       ├── ledger/
│   │   │   │   │   │   │       │   └── route.ts    ← GET (transactions)
│   │   │   │   │   │   │       └── adjust/
│   │   │   │   │   │   │           └── route.ts    ← POST (manual adjustment)
│   │   │   │   │   │   │
│   │   │   │   │   │   ├── badges/
│   │   │   │   │   │   │   ├── route.ts            ← GET (list), POST (create)
│   │   │   │   │   │   │   ├── [badgeId]/
│   │   │   │   │   │   │   │   └── route.ts        ← PATCH, DELETE
│   │   │   │   │   │   │   └── user/
│   │   │   │   │   │   │       └── [userId]/
│   │   │   │   │   │   │           ├── route.ts    ← GET (user badges)
│   │   │   │   │   │   │           └── [badgeId]/
│   │   │   │   │   │   │               └── route.ts ← DELETE (revoke)
│   │   │   │   │   │   │
│   │   │   │   │   │   ├── leaderboard/
│   │   │   │   │   │   │   ├── route.ts            ← GET (filtered leaderboard)
│   │   │   │   │   │   │   ├── me/
│   │   │   │   │   │   │   │   └── route.ts        ← GET (own rank)
│   │   │   │   │   │   │   └── honor-roll/
│   │   │   │   │   │   │       └── route.ts        ← GET (historical)
│   │   │   │   │   │   │
│   │   │   │   │   │   ├── analytics/
│   │   │   │   │   │   │   ├── department/
│   │   │   │   │   │   │   │   ├── route.ts        ← GET (KPI summary)
│   │   │   │   │   │   │   │   ├── categories/
│   │   │   │   │   │   │   │   │   └── route.ts
│   │   │   │   │   │   │   │   ├── batches/
│   │   │   │   │   │   │   │   │   └── route.ts
│   │   │   │   │   │   │   │   ├── timeline/
│   │   │   │   │   │   │   │   │   └── route.ts
│   │   │   │   │   │   │   │   ├── faculty/
│   │   │   │   │   │   │   │   │   └── route.ts
│   │   │   │   │   │   │   │   └── at-risk/
│   │   │   │   │   │   │   │       └── route.ts
│   │   │   │   │   │   │   └── platform/
│   │   │   │   │   │   │       └── route.ts        ← GET (admin-only)
│   │   │   │   │   │   │
│   │   │   │   │   │   ├── reports/
│   │   │   │   │   │   │   ├── route.ts            ← GET (list), POST (generate)
│   │   │   │   │   │   │   ├── [reportId]/
│   │   │   │   │   │   │   │   ├── status/
│   │   │   │   │   │   │   │   │   └── route.ts
│   │   │   │   │   │   │   │   └── download/
│   │   │   │   │   │   │   │       └── route.ts
│   │   │   │   │   │   │   └── schedule/
│   │   │   │   │   │   │       ├── route.ts        ← GET, POST
│   │   │   │   │   │   │       └── [scheduleId]/
│   │   │   │   │   │   │           └── route.ts    ← DELETE
│   │   │   │   │   │   │
│   │   │   │   │   │   ├── notifications/
│   │   │   │   │   │   │   ├── route.ts            ← GET (list)
│   │   │   │   │   │   │   ├── read-all/
│   │   │   │   │   │   │   │   └── route.ts        ← POST
│   │   │   │   │   │   │   ├── preferences/
│   │   │   │   │   │   │   │   └── route.ts        ← GET, PATCH
│   │   │   │   │   │   │   └── [notificationId]/
│   │   │   │   │   │   │       ├── read/
│   │   │   │   │   │   │       │   └── route.ts    ← PATCH
│   │   │   │   │   │   │       └── route.ts        ← DELETE
│   │   │   │   │   │   │
│   │   │   │   │   │   ├── audit/
│   │   │   │   │   │   │   └── logs/
│   │   │   │   │   │   │       ├── route.ts        ← GET (paginated)
│   │   │   │   │   │   │       └── export/
│   │   │   │   │   │   │           └── route.ts    ← GET (CSV/JSON)
│   │   │   │   │   │   │
│   │   │   │   │   │   ├── config/
│   │   │   │   │   │   │   ├── categories/
│   │   │   │   │   │   │   │   ├── route.ts        ← GET, POST
│   │   │   │   │   │   │   │   └── [categoryId]/
│   │   │   │   │   │   │   │       └── route.ts    ← PATCH, DELETE
│   │   │   │   │   │   │   ├── semesters/
│   │   │   │   │   │   │   │   ├── route.ts
│   │   │   │   │   │   │   │   └── [semesterId]/
│   │   │   │   │   │   │   │       └── route.ts
│   │   │   │   │   │   │   ├── departments/
│   │   │   │   │   │   │   │   ├── route.ts
│   │   │   │   │   │   │   │   └── [departmentId]/
│   │   │   │   │   │   │   │       └── route.ts
│   │   │   │   │   │   │   ├── notification-templates/
│   │   │   │   │   │   │   │   ├── route.ts
│   │   │   │   │   │   │   │   └── [templateId]/
│   │   │   │   │   │   │   │       └── route.ts
│   │   │   │   │   │   │   └── system/
│   │   │   │   │   │   │       └── route.ts        ← GET, PATCH
│   │   │   │   │   │   │
│   │   │   │   │   │   └── health/
│   │   │   │   │   │       └── route.ts            ← GET (health check)
│   │   │   │   │   │
│   │   │   │   │   └── webhooks/
│   │   │   │   │       └── supabase/
│   │   │   │   │           └── route.ts            ← Storage event webhooks
│   │   │   │   │
│   │   │   │   ├── layout.tsx                      ← Root layout (fonts, metadata)
│   │   │   │   ├── page.tsx                        ← Landing / redirect
│   │   │   │   ├── not-found.tsx                   ← Custom 404 page
│   │   │   │   ├── error.tsx                       ← Global error boundary
│   │   │   │   ├── loading.tsx                     ← Root loading state
│   │   │   │   └── global-error.tsx                ← Unrecoverable error handler
│   │   │   │
│   │   │   ├── components/                         ← APPLICATION-SPECIFIC COMPONENTS
│   │   │   │   │
│   │   │   │   ├── layout/                         ← Layout & navigation
│   │   │   │   │   ├── Sidebar.tsx                 ← Dashboard sidebar navigation
│   │   │   │   │   ├── SidebarItem.tsx             ← Individual nav item
│   │   │   │   │   ├── SidebarSection.tsx          ← Nav section group
│   │   │   │   │   ├── Header.tsx                  ← Top bar (search, notifications, user)
│   │   │   │   │   ├── MobileNav.tsx               ← Responsive mobile navigation
│   │   │   │   │   ├── BreadcrumbNav.tsx           ← Breadcrumb trail
│   │   │   │   │   ├── Footer.tsx                  ← Footer bar
│   │   │   │   │   └── ThemeToggle.tsx             ← Light/dark mode switcher
│   │   │   │   │
│   │   │   │   ├── forms/                          ← Form components
│   │   │   │   │   ├── SubmissionForm.tsx           ← Achievement submission form
│   │   │   │   │   ├── SubmissionFormFields.tsx     ← Extracted form fields
│   │   │   │   │   ├── LoginForm.tsx                ← Login form
│   │   │   │   │   ├── RegisterForm.tsx             ← Registration form
│   │   │   │   │   ├── ForgotPasswordForm.tsx       ← Password recovery form
│   │   │   │   │   ├── ResetPasswordForm.tsx        ← Password reset form
│   │   │   │   │   ├── ChangePasswordForm.tsx       ← Change password form
│   │   │   │   │   ├── ProfileForm.tsx              ← Profile edit form
│   │   │   │   │   ├── CategoryForm.tsx             ← Category CRUD form
│   │   │   │   │   ├── BadgeForm.tsx                ← Badge CRUD form
│   │   │   │   │   ├── UserForm.tsx                 ← User create/edit form
│   │   │   │   │   ├── SemesterForm.tsx             ← Semester create/edit form
│   │   │   │   │   ├── DepartmentSettingsForm.tsx   ← HOD department settings
│   │   │   │   │   ├── SystemSettingsForm.tsx       ← Admin system settings
│   │   │   │   │   ├── CsvImportForm.tsx            ← Bulk CSV import wizard
│   │   │   │   │   └── ReportBuilderForm.tsx        ← Report generation form
│   │   │   │   │
│   │   │   │   ├── data-display/                   ← Data presentation components
│   │   │   │   │   ├── StatsCard.tsx                ← Metric card (value, label, trend)
│   │   │   │   │   ├── SubmissionCard.tsx            ← Submission summary card
│   │   │   │   │   ├── BadgeCard.tsx                 ← Badge display card
│   │   │   │   │   ├── LeaderboardTable.tsx          ← Leaderboard table
│   │   │   │   │   ├── AchievementTimeline.tsx       ← Vertical timeline of events
│   │   │   │   │   ├── StatusBadge.tsx               ← Colored status indicator
│   │   │   │   │   ├── VerificationTimeline.tsx      ← Submission lifecycle timeline
│   │   │   │   │   ├── PointLedgerTable.tsx          ← Point transaction history
│   │   │   │   │   ├── AuditLogTable.tsx             ← Audit log viewer table
│   │   │   │   │   ├── StudentProfileCard.tsx        ← Student summary card (HOD view)
│   │   │   │   │   ├── FacultyActivityCard.tsx       ← Faculty verification summary
│   │   │   │   │   ├── EscalationCard.tsx            ← Escalation summary card
│   │   │   │   │   ├── SubmissionReviewPanel.tsx     ← Faculty review split panel
│   │   │   │   │   └── ChecklistPanel.tsx            ← Verification checklist UI
│   │   │   │   │
│   │   │   │   ├── charts/                          ← Recharts-based visualizations
│   │   │   │   │   ├── CategoryPieChart.tsx          ← Category distribution donut
│   │   │   │   │   ├── BatchBarChart.tsx             ← Batch comparison bar chart
│   │   │   │   │   ├── TimelineChart.tsx             ← Submissions over time line chart
│   │   │   │   │   ├── FacultyActivityChart.tsx      ← Faculty review performance bars
│   │   │   │   │   ├── VerificationGauge.tsx         ← SLA compliance gauge
│   │   │   │   │   ├── PointsBreakdownChart.tsx      ← Student points by category
│   │   │   │   │   └── UserGrowthChart.tsx           ← Admin: user growth line chart
│   │   │   │   │
│   │   │   │   ├── notifications/                   ← Notification UI
│   │   │   │   │   ├── NotificationBell.tsx          ← Bell icon with unread count
│   │   │   │   │   ├── NotificationDropdown.tsx      ← Dropdown panel
│   │   │   │   │   └── NotificationItem.tsx          ← Individual notification row
│   │   │   │   │
│   │   │   │   ├── portfolio/                       ← Portfolio components
│   │   │   │   │   ├── PortfolioView.tsx             ← Full portfolio layout
│   │   │   │   │   ├── PortfolioSection.tsx          ← Category section
│   │   │   │   │   ├── PortfolioShareBar.tsx         ← Share URL + privacy toggle
│   │   │   │   │   └── PortfolioPdfExport.tsx        ← PDF generation trigger
│   │   │   │   │
│   │   │   │   └── shared/                          ← Shared app-level components
│   │   │   │       ├── FileUpload.tsx                ← Drag-and-drop multi-file uploader
│   │   │   │       ├── DocumentViewer.tsx            ← In-browser PDF/image viewer
│   │   │   │       ├── SearchBar.tsx                 ← Debounced global search
│   │   │   │       ├── FilterPanel.tsx               ← Multi-dimension filter sidebar
│   │   │   │       ├── SavedFilters.tsx              ← Saved filter management
│   │   │   │       ├── DataTable.tsx                 ← Sortable, filterable table wrapper
│   │   │   │       ├── EmptyState.tsx                ← Illustrated empty state
│   │   │   │       ├── ErrorState.tsx                ← Error display with retry
│   │   │   │       ├── LoadingSkeleton.tsx           ← Skeleton loader variants
│   │   │   │       ├── ConfirmDialog.tsx             ← Confirmation modal
│   │   │   │       ├── Pagination.tsx                ← Numbered pagination bar
│   │   │   │       ├── Avatar.tsx                    ← User avatar with initials fallback
│   │   │   │       ├── RoleGuard.tsx                 ← Conditional render by role
│   │   │   │       └── OnboardingTour.tsx            ← First-time user tooltip tour
│   │   │   │
│   │   │   ├── controllers/                        ← API ROUTE CONTROLLERS
│   │   │   │   ├── auth.controller.ts               ← Authentication business orchestration
│   │   │   │   ├── user.controller.ts               ← User management orchestration
│   │   │   │   ├── submission.controller.ts          ← Submission CRUD orchestration
│   │   │   │   ├── verification.controller.ts        ← Verification actions orchestration
│   │   │   │   ├── escalation.controller.ts          ← Escalation actions orchestration
│   │   │   │   ├── points.controller.ts              ← Points queries and adjustments
│   │   │   │   ├── badge.controller.ts               ← Badge management orchestration
│   │   │   │   ├── leaderboard.controller.ts         ← Leaderboard queries
│   │   │   │   ├── analytics.controller.ts           ← Analytics data aggregation
│   │   │   │   ├── report.controller.ts              ← Report generation orchestration
│   │   │   │   ├── notification.controller.ts        ← Notification management
│   │   │   │   ├── audit.controller.ts               ← Audit log queries and export
│   │   │   │   └── config.controller.ts              ← Configuration management
│   │   │   │
│   │   │   ├── services/                           ← BUSINESS LOGIC LAYER
│   │   │   │   ├── submission.service.ts             ← Submission lifecycle management
│   │   │   │   ├── verification.service.ts           ← Verification state machine + rules
│   │   │   │   ├── escalation.service.ts             ← Escalation lifecycle management
│   │   │   │   ├── points.service.ts                 ← Points calculation + ledger
│   │   │   │   ├── badge.service.ts                  ← Badge evaluation + award logic
│   │   │   │   ├── leaderboard.service.ts            ← Leaderboard ranking + caching
│   │   │   │   ├── notification.service.ts           ← Notification dispatch + templates
│   │   │   │   ├── report.service.ts                 ← Report generation + scheduling
│   │   │   │   ├── user.service.ts                   ← User management + bulk import
│   │   │   │   ├── audit.service.ts                  ← Audit log creation + HMAC signing
│   │   │   │   ├── storage.service.ts                ← File upload/download orchestration
│   │   │   │   ├── email.service.ts                  ← Email sending + template rendering
│   │   │   │   └── duplicate-detection.service.ts    ← Fuzzy title matching
│   │   │   │
│   │   │   ├── repositories/                       ← DATA ACCESS LAYER
│   │   │   │   ├── user.repository.ts                ← User CRUD + queries
│   │   │   │   ├── submission.repository.ts          ← Submission CRUD + complex queries
│   │   │   │   ├── verification.repository.ts        ← Verification events + queue queries
│   │   │   │   ├── escalation.repository.ts          ← Escalation CRUD
│   │   │   │   ├── points.repository.ts              ← Point ledger + aggregations
│   │   │   │   ├── badge.repository.ts               ← Badge definitions + user badges
│   │   │   │   ├── notification.repository.ts        ← Notification CRUD + read tracking
│   │   │   │   ├── audit.repository.ts               ← Audit log append + query
│   │   │   │   ├── category.repository.ts            ← Achievement categories + checklists
│   │   │   │   ├── semester.repository.ts            ← Academic year + semester CRUD
│   │   │   │   ├── department.repository.ts          ← Department CRUD
│   │   │   │   └── report.repository.ts              ← Report job tracking
│   │   │   │
│   │   │   ├── middleware/                         ← API MIDDLEWARE
│   │   │   │   ├── auth.middleware.ts                ← Session validation, getCurrentUser()
│   │   │   │   ├── rbac.middleware.ts                ← Role-based access control guard
│   │   │   │   ├── rate-limit.middleware.ts           ← Rate limiting (Redis-backed)
│   │   │   │   ├── validate.middleware.ts             ← Zod schema validation wrapper
│   │   │   │   ├── audit.middleware.ts                ← Automatic audit log creation
│   │   │   │   ├── error-handler.middleware.ts        ← Global API error handler
│   │   │   │   └── cors.middleware.ts                 ← CORS configuration
│   │   │   │
│   │   │   ├── jobs/                               ← BACKGROUND JOBS (BullMQ)
│   │   │   │   ├── queue.ts                          ← Queue definitions + connection
│   │   │   │   ├── workers.ts                        ← Worker initialization
│   │   │   │   ├── sla-check.job.ts                  ← Periodic SLA enforcement
│   │   │   │   ├── auto-escalation.job.ts            ← Auto-escalate overdue items
│   │   │   │   ├── clarification-expiry.job.ts       ← Expire unanswered clarifications
│   │   │   │   ├── notification-dispatch.job.ts      ← Async email + in-app dispatch
│   │   │   │   ├── report-generation.job.ts          ← Async report creation
│   │   │   │   ├── leaderboard-refresh.job.ts        ← Periodic cache rebuild
│   │   │   │   ├── honor-roll-archive.job.ts         ← Semester close: archive top 10
│   │   │   │   └── cleanup.job.ts                    ← Delete expired notifications/reports
│   │   │   │
│   │   │   ├── hooks/                              ← CUSTOM REACT HOOKS
│   │   │   │   ├── useAuth.ts                        ← Current user context + role
│   │   │   │   ├── useSubmissions.ts                 ← Submission list + filters (React Query)
│   │   │   │   ├── useSubmission.ts                  ← Single submission detail
│   │   │   │   ├── useVerificationQueue.ts           ← Faculty queue data
│   │   │   │   ├── useLeaderboard.ts                 ← Leaderboard data + scope
│   │   │   │   ├── useNotifications.ts               ← Notification list + unread count
│   │   │   │   ├── useAnalytics.ts                   ← Analytics data fetching
│   │   │   │   ├── useDebounce.ts                    ← Debounced value hook
│   │   │   │   ├── useMediaQuery.ts                  ← Responsive breakpoint hook
│   │   │   │   ├── usePagination.ts                  ← Pagination state management
│   │   │   │   └── useLocalStorage.ts                ← Persistent client-side state
│   │   │   │
│   │   │   ├── providers/                          ← REACT CONTEXT PROVIDERS
│   │   │   │   ├── QueryProvider.tsx                 ← React Query provider + config
│   │   │   │   ├── AuthProvider.tsx                  ← Auth.js session provider
│   │   │   │   ├── ThemeProvider.tsx                  ← Light/dark theme context
│   │   │   │   ├── ToastProvider.tsx                  ← Toast notification provider
│   │   │   │   └── SidebarProvider.tsx                ← Sidebar collapse state
│   │   │   │
│   │   │   ├── lib/                                ← APP-LOCAL UTILITIES
│   │   │   │   ├── api-client.ts                     ← Typed API fetch wrapper
│   │   │   │   ├── query-keys.ts                     ← React Query key factory
│   │   │   │   ├── route-config.ts                   ← Role-based route definitions
│   │   │   │   ├── navigation.ts                     ← Sidebar nav items per role
│   │   │   │   ├── pdf-generator.ts                  ← Portfolio/report PDF rendering
│   │   │   │   └── chart-colors.ts                   ← Consistent chart color palette
│   │   │   │
│   │   │   ├── styles/
│   │   │   │   └── globals.css                       ← Tailwind directives + custom CSS
│   │   │   │
│   │   │   └── middleware.ts                         ← Next.js edge middleware (auth + RBAC)
│   │   │
│   │   ├── next.config.js                          ← Next.js configuration
│   │   ├── tailwind.config.ts                      ← Tailwind CSS configuration
│   │   ├── postcss.config.js                       ← PostCSS configuration
│   │   ├── tsconfig.json                           ← TypeScript config (extends base)
│   │   ├── vitest.config.ts                        ← Unit test configuration
│   │   ├── playwright.config.ts                    ← E2E test configuration
│   │   ├── sentry.client.config.ts                 ← Sentry browser SDK config
│   │   ├── sentry.server.config.ts                 ← Sentry Node SDK config
│   │   ├── package.json
│   │   └── README.md
│   │
│   ├── api/                                        ← FUTURE: Standalone API service
│   │   └── README.md                               ← "Reserved for Phase 3 — standalone API"
│   │
│   └── docs/                                       ← API DOCUMENTATION SITE (optional)
│       ├── mint.json                               ← Mintlify or Nextra configuration
│       ├── introduction.mdx
│       ├── authentication.mdx
│       ├── api-reference/
│       │   ├── submissions.mdx
│       │   ├── verifications.mdx
│       │   ├── points.mdx
│       │   └── ...
│       ├── package.json
│       └── README.md
│
│
├── 📦 packages/
│   │
│   ├── database/                                   ← @priym/database
│   │   ├── prisma/
│   │   │   ├── schema.prisma                       ← Complete database schema (19 entities)
│   │   │   ├── migrations/                         ← Migration history
│   │   │   │   ├── 20260801000000_init/
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20260815000000_add_indexes/
│   │   │   │   │   └── migration.sql
│   │   │   │   └── migration_lock.toml
│   │   │   └── seed.ts                             ← Seed script for development data
│   │   ├── src/
│   │   │   ├── client.ts                           ← Prisma client singleton (prevents HMR leaks)
│   │   │   ├── index.ts                            ← Package entry: re-exports client + types
│   │   │   └── types.ts                            ← Generated Prisma types re-exported
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   │
│   ├── auth/                                       ← @priym/auth
│   │   ├── src/
│   │   │   ├── index.ts                            ← Package entry
│   │   │   ├── config.ts                           ← Auth.js configuration (providers, adapter)
│   │   │   ├── providers/
│   │   │   │   └── credentials.ts                  ← Email + password credential provider
│   │   │   ├── callbacks/
│   │   │   │   ├── session.callback.ts             ← Inject role + ID into session
│   │   │   │   ├── jwt.callback.ts                 ← Inject role into JWT
│   │   │   │   └── signIn.callback.ts              ← Account lockout + MFA check
│   │   │   ├── adapters/
│   │   │   │   └── prisma.adapter.ts               ← Prisma adapter customization
│   │   │   ├── guards/
│   │   │   │   ├── requireAuth.ts                  ← Authenticated route guard
│   │   │   │   ├── requireRole.ts                  ← RBAC role guard
│   │   │   │   └── requireMfa.ts                   ← MFA verification guard
│   │   │   ├── mfa/
│   │   │   │   ├── totp.ts                         ← TOTP generation + verification (otplib)
│   │   │   │   └── email-otp.ts                    ← Email-based OTP alternative
│   │   │   ├── password/
│   │   │   │   ├── hash.ts                         ← bcrypt hash + verify
│   │   │   │   ├── policy.ts                       ← Complexity rules + history check
│   │   │   │   └── lockout.ts                      ← Redis-backed attempt counter + lockout
│   │   │   └── types.ts                            ← Auth-specific type definitions
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   │
│   ├── ui/                                         ← @priym/ui
│   │   ├── src/
│   │   │   ├── index.ts                            ← Package entry: re-exports all components
│   │   │   ├── components/
│   │   │   │   ├── button.tsx                       ← shadcn/ui Button + variants
│   │   │   │   ├── card.tsx
│   │   │   │   ├── dialog.tsx
│   │   │   │   ├── dropdown-menu.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── label.tsx
│   │   │   │   ├── select.tsx
│   │   │   │   ├── textarea.tsx
│   │   │   │   ├── checkbox.tsx
│   │   │   │   ├── radio-group.tsx
│   │   │   │   ├── switch.tsx
│   │   │   │   ├── tabs.tsx
│   │   │   │   ├── table.tsx
│   │   │   │   ├── badge.tsx
│   │   │   │   ├── avatar.tsx
│   │   │   │   ├── tooltip.tsx
│   │   │   │   ├── popover.tsx
│   │   │   │   ├── command.tsx                      ← Command palette / search
│   │   │   │   ├── calendar.tsx                     ← Date picker calendar
│   │   │   │   ├── toast.tsx                        ← Toast notification (Sonner)
│   │   │   │   ├── skeleton.tsx                     ← Loading skeleton
│   │   │   │   ├── separator.tsx
│   │   │   │   ├── scroll-area.tsx
│   │   │   │   ├── progress.tsx                     ← Progress bar
│   │   │   │   ├── sheet.tsx                        ← Slide-out panel
│   │   │   │   ├── alert.tsx
│   │   │   │   ├── alert-dialog.tsx                 ← Confirmation dialogs
│   │   │   │   ├── form.tsx                         ← React Hook Form integration
│   │   │   │   ├── data-table.tsx                   ← TanStack Table wrapper
│   │   │   │   └── file-upload.tsx                  ← Drag-and-drop file uploader
│   │   │   ├── primitives/                          ← Low-level design tokens
│   │   │   │   ├── colors.ts                        ← Color palette constants
│   │   │   │   ├── typography.ts                    ← Font size, weight, line-height
│   │   │   │   └── spacing.ts                       ← Spacing scale
│   │   │   └── utils/
│   │   │       └── cn.ts                            ← clsx + twMerge utility
│   │   ├── tailwind.config.ts                      ← Shared Tailwind preset
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   │
│   ├── validation/                                 ← @priym/validation
│   │   ├── src/
│   │   │   ├── index.ts                            ← Package entry: re-exports all schemas
│   │   │   ├── schemas/
│   │   │   │   ├── auth.schema.ts                   ← login, register, reset-password, MFA
│   │   │   │   ├── submission.schema.ts             ← create, update, resubmit
│   │   │   │   ├── verification.schema.ts           ← approve, reject, clarify, escalate
│   │   │   │   ├── user.schema.ts                   ← create, update, bulk-import
│   │   │   │   ├── category.schema.ts               ← create, update category
│   │   │   │   ├── badge.schema.ts                  ← create, update badge
│   │   │   │   ├── semester.schema.ts               ← create, update semester
│   │   │   │   ├── department.schema.ts             ← create, update department
│   │   │   │   ├── report.schema.ts                 ← generate, schedule report
│   │   │   │   ├── notification.schema.ts           ← preferences update
│   │   │   │   ├── points.schema.ts                 ← manual adjustment
│   │   │   │   ├── settings.schema.ts               ← system + department settings
│   │   │   │   └── common.schema.ts                 ← Pagination, search, UUID, date range
│   │   │   └── rules/
│   │   │       ├── password.rules.ts                ← Password complexity validators
│   │   │       ├── file.rules.ts                    ← File type, size, count validators
│   │   │       └── usn.rules.ts                     ← VTU USN format validator
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   │
│   ├── types/                                      ← @priym/types
│   │   ├── src/
│   │   │   ├── index.ts                            ← Package entry
│   │   │   ├── auth.types.ts                        ← Session, JWT claims, auth state
│   │   │   ├── user.types.ts                        ← User, Role, Profile
│   │   │   ├── submission.types.ts                  ← Submission, Document, Status, Level
│   │   │   ├── verification.types.ts                ← VerificationEvent, Checklist
│   │   │   ├── escalation.types.ts                  ← Escalation, EscalationAction
│   │   │   ├── points.types.ts                      ← PointLedger, PointBalance, Transaction
│   │   │   ├── badge.types.ts                       ← Badge, BadgeType, TriggerRule
│   │   │   ├── leaderboard.types.ts                 ← LeaderboardEntry, Rank, Scope
│   │   │   ├── notification.types.ts                ← Notification, EventType, Preferences
│   │   │   ├── analytics.types.ts                   ← DepartmentKPI, ChartData
│   │   │   ├── report.types.ts                      ← ReportType, ReportStatus, Schedule
│   │   │   ├── audit.types.ts                       ← AuditLog, AuditAction
│   │   │   ├── config.types.ts                      ← Category, Semester, Department, Settings
│   │   │   ├── api.types.ts                         ← ApiResponse, ApiError, PaginatedResponse
│   │   │   └── enums.ts                             ← All shared enums (mirrors Prisma enums)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   │
│   ├── config/                                     ← @priym/config
│   │   ├── src/
│   │   │   ├── index.ts                            ← Package entry
│   │   │   ├── env.ts                               ← Environment variable validation (Zod)
│   │   │   ├── constants.ts                         ← Application-wide constants
│   │   │   │                                          SLA defaults, file limits, point rules
│   │   │   ├── permissions.ts                       ← RBAC permission matrix definition
│   │   │   ├── routes.ts                            ← Route constants and role mappings
│   │   │   ├── feature-flags.ts                     ← Feature flag definitions + defaults
│   │   │   ├── level-multipliers.ts                 ← Achievement level point multipliers
│   │   │   └── notification-events.ts               ← Notification event type definitions
│   │   ├── eslint/
│   │   │   ├── base.js                              ← Shared ESLint base config
│   │   │   ├── next.js                              ← Next.js-specific ESLint rules
│   │   │   └── react.js                             ← React-specific ESLint rules
│   │   ├── typescript/
│   │   │   └── base.json                            ← Shared tsconfig base
│   │   ├── tailwind/
│   │   │   └── preset.ts                            ← Shared Tailwind preset (colors, fonts)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   │
│   ├── email/                                      ← @priym/email
│   │   ├── src/
│   │   │   ├── index.ts                            ← Package entry
│   │   │   ├── client.ts                            ← Email client (Resend / Nodemailer)
│   │   │   ├── send.ts                              ← sendEmail() utility function
│   │   │   └── templates/
│   │   │       ├── welcome.tsx                      ← React Email: welcome/verification
│   │   │       ├── password-reset.tsx               ← React Email: password reset
│   │   │       ├── account-approved.tsx             ← React Email: account approved
│   │   │       ├── account-locked.tsx               ← React Email: account locked
│   │   │       ├── submission-received.tsx          ← React Email: submission acknowledged
│   │   │       ├── submission-approved.tsx          ← React Email: approved notification
│   │   │       ├── submission-rejected.tsx          ← React Email: rejection with reason
│   │   │       ├── clarification-requested.tsx      ← React Email: clarification needed
│   │   │       ├── sla-reminder.tsx                 ← React Email: SLA warning to faculty
│   │   │       ├── escalation-notice.tsx            ← React Email: HOD escalation
│   │   │       ├── badge-awarded.tsx                ← React Email: new badge
│   │   │       ├── report-ready.tsx                 ← React Email: report download
│   │   │       └── _layout.tsx                      ← Shared email layout/header/footer
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   │
│   ├── storage/                                    ← @priym/storage
│   │   ├── src/
│   │   │   ├── index.ts                            ← Package entry
│   │   │   ├── client.ts                            ← Supabase Storage client singleton
│   │   │   ├── upload.ts                            ← uploadFile() with path generation
│   │   │   ├── download.ts                          ← getSignedUrl() with expiry
│   │   │   ├── delete.ts                            ← deleteFile()
│   │   │   ├── validate.ts                          ← Magic byte validation, size checks
│   │   │   ├── buckets.ts                           ← Bucket name constants + config
│   │   │   └── image-transform.ts                   ← Profile photo resize (sharp)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   │
│   └── logger/                                     ← @priym/logger
│       ├── src/
│       │   ├── index.ts                            ← Package entry
│       │   ├── logger.ts                            ← Pino logger instance
│       │   ├── config.ts                            ← Log level by environment
│       │   ├── formatters.ts                        ← PII scrubbing, request context
│       │   └── transports.ts                        ← Console + file + external sink
│       ├── package.json
│       ├── tsconfig.json
│       └── README.md
│
│
├── 📄 docs/                                        ← PROJECT DOCUMENTATION
│   │
│   ├── business/
│   │   ├── BRD.md                                  ← Business Requirements Document
│   │   ├── PRD.md                                  ← Product Requirements Document
│   │   └── STAKEHOLDERS.md                         ← Stakeholder map and contacts
│   │
│   ├── technical/
│   │   ├── IMPLEMENTATION_PLAN.md                  ← Implementation plan and roadmap
│   │   ├── ARCHITECTURE.md                         ← Architecture overview and decisions
│   │   ├── FOLDER_STRUCTURE.md                     ← This document
│   │   ├── DATABASE_DESIGN.md                      ← Entity descriptions and constraints
│   │   ├── API_REFERENCE.md                        ← Complete REST API documentation
│   │   └── SECURITY.md                             ← Security model and compliance
│   │
│   ├── diagrams/
│   │   ├── er-diagram.png                          ← Entity-Relationship Diagram
│   │   ├── er-diagram.dbml                         ← DBML source for ER diagram
│   │   ├── architecture.png                        ← System architecture diagram
│   │   ├── auth-flow.png                           ← Authentication flow diagram
│   │   ├── submission-flow.png                     ← Submission workflow diagram
│   │   ├── verification-flow.png                   ← Verification state machine
│   │   ├── escalation-flow.png                     ← Escalation workflow diagram
│   │   └── deployment.png                          ← Infrastructure diagram
│   │
│   ├── guides/
│   │   ├── GETTING_STARTED.md                      ← Developer onboarding guide
│   │   ├── CONTRIBUTING.md                         ← Contribution guidelines
│   │   ├── CODE_REVIEW.md                          ← Code review standards
│   │   ├── DEPLOYMENT.md                           ← Deployment runbook
│   │   ├── INCIDENT_RESPONSE.md                    ← Incident handling playbook
│   │   └── TROUBLESHOOTING.md                      ← Common issues and resolutions
│   │
│   └── decisions/
│       ├── ADR-001-monorepo-strategy.md             ← Architecture Decision Record
│       ├── ADR-002-auth-strategy.md
│       ├── ADR-003-storage-provider.md
│       ├── ADR-004-caching-strategy.md
│       └── ADR-005-testing-strategy.md
│
│
├── 🧪 tests/                                      ← CROSS-PACKAGE & E2E TESTS
│   │
│   ├── unit/                                       ← Unit tests (co-located in packages too)
│   │   ├── services/
│   │   │   ├── points.service.test.ts
│   │   │   ├── verification.service.test.ts
│   │   │   ├── escalation.service.test.ts
│   │   │   ├── badge.service.test.ts
│   │   │   ├── leaderboard.service.test.ts
│   │   │   └── notification.service.test.ts
│   │   ├── validators/
│   │   │   ├── submission.schema.test.ts
│   │   │   ├── auth.schema.test.ts
│   │   │   └── user.schema.test.ts
│   │   └── utils/
│   │       ├── points-calculator.test.ts
│   │       ├── duplicate-detection.test.ts
│   │       └── permissions.test.ts
│   │
│   ├── integration/                                ← Integration tests
│   │   ├── workflows/
│   │   │   ├── submission-lifecycle.test.ts          ← Submit → verify → approve → points
│   │   │   ├── escalation-lifecycle.test.ts          ← Escalate → HOD resolve
│   │   │   ├── clarification-flow.test.ts            ← Clarify → resubmit → approve
│   │   │   ├── auto-escalation.test.ts               ← SLA breach → auto-escalate
│   │   │   ├── badge-award.test.ts                   ← Approve → points → badge
│   │   │   └── user-management.test.ts               ← Create → approve → login
│   │   ├── api/
│   │   │   ├── auth.api.test.ts
│   │   │   ├── submissions.api.test.ts
│   │   │   ├── verifications.api.test.ts
│   │   │   └── leaderboard.api.test.ts
│   │   └── helpers/
│   │       ├── test-db.ts                            ← Test database setup/teardown
│   │       ├── test-factory.ts                       ← Factory functions for test data
│   │       └── test-auth.ts                          ← Mock auth sessions for testing
│   │
│   ├── e2e/                                        ← End-to-end tests (Playwright)
│   │   ├── student/
│   │   │   ├── submission.spec.ts                    ← Submit → track → view
│   │   │   ├── portfolio.spec.ts                     ← View + export portfolio
│   │   │   └── leaderboard.spec.ts                   ← View + filter leaderboard
│   │   ├── faculty/
│   │   │   ├── verification.spec.ts                  ← Review → approve/reject
│   │   │   ├── clarification.spec.ts                 ← Request clarification → resubmit
│   │   │   └── escalation.spec.ts                    ← Escalate to HOD
│   │   ├── hod/
│   │   │   ├── dashboard.spec.ts                     ← View analytics
│   │   │   ├── escalation-management.spec.ts         ← Resolve escalations
│   │   │   └── report-generation.spec.ts             ← Generate + download report
│   │   ├── admin/
│   │   │   ├── user-management.spec.ts               ← CRUD users + bulk import
│   │   │   ├── category-management.spec.ts           ← CRUD categories
│   │   │   └── audit-log.spec.ts                     ← View + export audit log
│   │   ├── auth/
│   │   │   ├── login.spec.ts                         ← Login + session + lockout
│   │   │   ├── register.spec.ts                      ← Register + verify email
│   │   │   └── password-reset.spec.ts                ← Forgot + reset password
│   │   └── fixtures/
│   │       ├── auth.fixture.ts                       ← Pre-authenticated page fixtures
│   │       └── data.fixture.ts                       ← Seed data for E2E
│   │
│   ├── performance/                                ← Performance / load tests
│   │   ├── k6/
│   │   │   ├── dashboard-load.js                     ← 700 concurrent users on dashboard
│   │   │   ├── submission-upload.js                  ← 100 concurrent file uploads
│   │   │   ├── leaderboard-load.js                   ← 500 concurrent leaderboard requests
│   │   │   └── api-endpoints.js                      ← P95 response time validation
│   │   └── results/
│   │       └── .gitkeep
│   │
│   └── security/                                   ← Security test artifacts
│       ├── owasp-checklist.md                        ← OWASP Top 10 verification log
│       ├── rbac-audit.test.ts                        ← Verify every endpoint enforces roles
│       └── dependency-audit.sh                       ← Automated pnpm audit script
│
│
├── 📜 scripts/                                     ← AUTOMATION & DEVOPS SCRIPTS
│   ├── setup-dev.sh                                ← One-command development setup
│   ├── seed-db.sh                                  ← Database seeding wrapper
│   ├── reset-db.sh                                 ← Drop + recreate + migrate + seed
│   ├── generate-types.sh                           ← Regenerate Prisma client + types
│   ├── create-migration.sh                         ← Guided migration creation
│   ├── check-env.sh                                ← Validate .env against .env.example
│   ├── lint-staged.sh                              ← Pre-commit lint check
│   ├── health-check.sh                             ← Verify all services are running
│   ├── backup-db.sh                                ← Manual database backup
│   ├── generate-api-docs.sh                        ← Auto-generate API documentation
│   └── create-admin.ts                             ← CLI: create admin user securely
│
│
├── 🐳 docker/                                     ← DOCKER CONFIGURATIONS
│   ├── docker-compose.yml                          ← Development: PostgreSQL + Redis
│   ├── docker-compose.test.yml                     ← Testing: isolated test database
│   ├── Dockerfile                                  ← Production build (multi-stage)
│   ├── Dockerfile.dev                              ← Development container
│   ├── .dockerignore
│   └── scripts/
│       ├── init-db.sql                              ← Database initialization SQL
│       └── wait-for-it.sh                           ← Service readiness checker
│
│
├── ⚙️ .github/                                     ← GITHUB CONFIGURATION
│   ├── workflows/
│   │   ├── ci.yml                                  ← PR: lint + typecheck + test + build
│   │   ├── deploy-staging.yml                      ← develop → staging auto-deploy
│   │   ├── deploy-production.yml                   ← main → production deploy (gated)
│   │   ├── security-audit.yml                      ← Weekly dependency audit
│   │   ├── db-migration-check.yml                  ← Verify migrations are safe
│   │   └── stale.yml                               ← Auto-close stale issues/PRs
│   ├── PULL_REQUEST_TEMPLATE.md
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   ├── feature_request.md
│   │   └── task.md
│   ├── CODEOWNERS                                  ← File-level code ownership
│   └── dependabot.yml                              ← Automated dependency updates
│
│
├── 🔧 Root Configuration Files
│   ├── turbo.json                                  ← Turborepo pipeline configuration
│   ├── pnpm-workspace.yaml                         ← Workspace package definitions
│   ├── package.json                                ← Root scripts, devDependencies
│   ├── tsconfig.base.json                          ← Shared TypeScript base config
│   ├── .env.example                                ← Environment variable template
│   ├── .env.local                                  ← Local development (gitignored)
│   ├── .env.test                                   ← Test environment (gitignored)
│   ├── .eslintrc.js                                ← Root ESLint config
│   ├── .eslintignore
│   ├── .prettierrc                                 ← Prettier formatting rules
│   ├── .prettierignore
│   ├── .gitignore                                  ← Comprehensive git ignore
│   ├── .nvmrc                                      ← Node.js version pinning
│   ├── .npmrc                                      ← pnpm configuration
│   ├── commitlint.config.js                        ← Conventional commit enforcement
│   ├── lint-staged.config.js                       ← Pre-commit lint configuration
│   ├── LICENSE
│   ├── CHANGELOG.md                                ← Version changelog (auto-generated)
│   └── README.md                                   ← Project overview + quick start
```

---

# 4. Detailed Folder Responsibilities

## 4.1 `apps/` — Deployable Applications

> **Principle:** Each app in `apps/` is a deployable unit. Apps consume packages but never import from other apps.

### `apps/web/` — Primary Next.js Application

The main PRiym web application. Contains all UI pages, API route handlers, server-side business logic, and client-side state management. This is the single deployable artifact for the MVP.

| Subdirectory           | Responsibility                                                                                                                                                                                                                                                                                                    |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `public/`              | Static assets served at the root URL. Favicons, logos, social preview images, default badge icons, institutional branding. Never contains user-uploaded content.                                                                                                                                                  |
| `src/app/`             | **Next.js App Router.** Defines all pages and API routes using file-system routing. Route groups `(auth)` and `(dashboard)` share layouts without affecting the URL. Every `page.tsx` is a route; every `route.ts` is an API endpoint.                                                                            |
| `src/app/(auth)/`      | **Authentication pages.** Login, register, forgot/reset password, email verification, MFA. Uses a centered card layout. Accessible without authentication.                                                                                                                                                        |
| `src/app/(dashboard)/` | **Authenticated portal pages.** Contains the four sub-portals: `student/`, `faculty/`, `hod/`, `admin/`. Protected by the dashboard layout which includes the sidebar and header. Role-based routing ensures students can only access `student/` routes, etc.                                                     |
| `src/app/api/v1/`      | **API route handlers.** Each `route.ts` file handles one or more HTTP methods for a RESTful endpoint. Route handlers are thin — they call controllers which call services. Versioned under `/v1/` for future API evolution.                                                                                       |
| `src/components/`      | **Application-specific UI components.** Unlike `@priym/ui` (which contains generic primitives), these are composed, domain-specific components like `SubmissionForm`, `VerificationQueue`, `AnalyticsChart`. Organized by function: `layout/`, `forms/`, `data-display/`, `charts/`, `notifications/`, `shared/`. |
| `src/controllers/`     | **API orchestration layer.** Controllers receive validated requests from route handlers, coordinate service calls, and return formatted responses. They enforce no business rules themselves — that's the service layer's job. One controller per domain (auth, submission, verification, etc.).                  |
| `src/services/`        | **Core business logic.** The heart of PRiym. Contains the Points Engine, Verification Engine, Escalation Engine, Leaderboard Engine, Badge Engine, and Notification Engine. Services are the only layer that enforces business rules. They are framework-agnostic and fully unit-testable.                        |
| `src/repositories/`    | **Data access layer.** Each repository encapsulates all Prisma queries for a single entity. Controllers and services never call Prisma directly — they always go through repositories. This makes database queries centralized, optimizable, and mockable in tests.                                               |
| `src/middleware/`      | **API middleware stack.** Cross-cutting concerns: authentication verification, RBAC enforcement, rate limiting, request validation, audit logging, error handling, CORS. Middleware is composable — route handlers chain the middleware they need.                                                                |
| `src/jobs/`            | **Background job definitions.** BullMQ job processors for async work: SLA enforcement checks, auto-escalation, notification dispatch, report generation, leaderboard cache refresh, data cleanup. Each job is idempotent and retriable.                                                                           |
| `src/hooks/`           | **Custom React hooks.** Encapsulate client-side data fetching and state management. Built on React Query for server state (`useSubmissions`, `useLeaderboard`) and standard hooks for UI state (`useDebounce`, `useMediaQuery`).                                                                                  |
| `src/providers/`       | **React context providers.** Top-level providers that wrap the application: React Query, Auth.js session, theme, toast notifications, sidebar state. Defined once in the root layout.                                                                                                                             |
| `src/lib/`             | **App-local utilities.** Helpers specific to the web app: typed API client for frontend fetching, React Query key factory, role-based route configuration, sidebar navigation definitions, PDF generation, chart color palette.                                                                                   |

### `apps/api/` — Future Standalone API (Reserved)

Placeholder for a potential standalone API service in Phase 3 (multi-college SaaS). Currently contains only a README explaining its future purpose. When needed, business logic and repositories from `apps/web/src/services/` and `apps/web/src/repositories/` would be extracted into shared packages.

### `apps/docs/` — API Documentation Site (Optional)

A documentation site (Mintlify or Nextra) that auto-generates beautiful API documentation. Consumers (future mobile apps, third-party integrations) can read endpoint specifications, try requests, and understand authentication.

---

## 4.2 `packages/` — Shared Internal Packages

> **Principle:** Packages are imported by apps (and by each other where appropriate). Each package has a clear, single responsibility and is independently versioned and testable.

### `packages/database/` — `@priym/database`

**Responsibility:** Owns the database schema, migrations, seed data, and Prisma client singleton. Every other package that needs database access imports `@priym/database`.

| Contains               | Purpose                                                                                                                            |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `prisma/schema.prisma` | The single source of truth for all 19 database entities, their relations, indexes, and enums.                                      |
| `prisma/migrations/`   | Ordered, immutable migration history. Generated by `prisma migrate dev`. Never hand-edited after creation.                         |
| `prisma/seed.ts`       | Development seed script that populates the database with realistic test data: departments, users, categories, submissions, badges. |
| `src/client.ts`        | Prisma client singleton that prevents connection pool exhaustion during Next.js hot module reload.                                 |
| `src/types.ts`         | Re-exports Prisma-generated TypeScript types so consumers don't need a direct Prisma dependency.                                   |

---

### `packages/auth/` — `@priym/auth`

**Responsibility:** Encapsulates all authentication and authorization logic. Configures Auth.js, defines providers, manages MFA, password hashing, account lockout, and RBAC guards.

| Contains     | Purpose                                                                                                                         |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `config.ts`  | Central Auth.js configuration: providers, adapter, session strategy, pages.                                                     |
| `providers/` | Auth.js provider definitions. Currently: credentials (email+password). Future: Google, Microsoft SSO.                           |
| `callbacks/` | Auth.js lifecycle callbacks: enrich JWT with role, enrich session with user data, check lockout on sign-in.                     |
| `guards/`    | Reusable guard functions: `requireAuth()` (is logged in?), `requireRole()` (has correct role?), `requireMfa()` (MFA verified?). |
| `mfa/`       | TOTP generation and verification using `otplib`. Email OTP as a fallback method.                                                |
| `password/`  | Password hashing (bcrypt), complexity validation, history tracking, Redis-backed lockout counter.                               |

---

### `packages/ui/` — `@priym/ui`

**Responsibility:** The design system and component library. Contains all primitive UI components built with shadcn/ui and Radix UI. App-specific composed components (like `SubmissionForm`) live in the app, not here.

| Contains      | Purpose                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `components/` | All shadcn/ui components: Button, Card, Dialog, Input, Table, Badge, Toast, DataTable, FileUpload, etc. Each is accessible, composable, and themeable. |
| `primitives/` | Design tokens: color palette, typography scale, spacing scale. Consumed by Tailwind config and components.                                             |
| `utils/cn.ts` | The `cn()` utility combining `clsx` and `tailwind-merge` for conditional class composition.                                                            |

---

### `packages/validation/` — `@priym/validation`

**Responsibility:** All Zod validation schemas, shared between the frontend (form validation) and backend (API input validation). Single source of truth for data shape and constraints.

| Contains   | Purpose                                                                                                                               |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `schemas/` | One file per domain: `auth.schema.ts`, `submission.schema.ts`, `user.schema.ts`, etc. Each exports create, update, and query schemas. |
| `rules/`   | Reusable validation rule functions: password complexity, file type/size validation, VTU USN format.                                   |

---

### `packages/types/` — `@priym/types`

**Responsibility:** All shared TypeScript type definitions. These are the contracts between frontend and backend, between services and controllers, between packages.

| Contains          | Purpose                                                                                   |
| ----------------- | ----------------------------------------------------------------------------------------- |
| Domain type files | One file per domain: `user.types.ts`, `submission.types.ts`, `points.types.ts`, etc.      |
| `enums.ts`        | All shared enums (Role, SubmissionStatus, Level, BadgeType, etc.) mirroring Prisma enums. |
| `api.types.ts`    | API response envelope types: `ApiResponse<T>`, `ApiError`, `PaginatedResponse<T>`.        |

---

### `packages/config/` — `@priym/config`

**Responsibility:** Centralized configuration, constants, and shared tooling configuration. Everything that is "configurable but not code."

| Contains                              | Purpose                                                                                        |
| ------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `env.ts`                              | Zod-validated environment variable parser. Fails fast at startup if required vars are missing. |
| `constants.ts`                        | Application constants: SLA defaults, file limits, point rules, session durations, rate limits. |
| `permissions.ts`                      | The complete RBAC permission matrix as a typed data structure.                                 |
| `feature-flags.ts`                    | Feature flag definitions (e.g., `REWARD_REDEMPTION`, `SSO_ENABLED`).                           |
| `eslint/`, `typescript/`, `tailwind/` | Shared tooling configs extended by every package and app.                                      |

---

### `packages/email/` — `@priym/email`

**Responsibility:** Email client configuration and all email templates. Uses React Email for type-safe, component-based email templates.

| Contains     | Purpose                                                                                                                                                  |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `client.ts`  | Email service client (Resend or Nodemailer), configured from environment variables.                                                                      |
| `send.ts`    | `sendEmail()` function that renders a React Email component and sends it.                                                                                |
| `templates/` | One React component per email type. Each template receives typed props and renders a responsive email. Shared `_layout.tsx` ensures consistent branding. |

---

### `packages/storage/` — `@priym/storage`

**Responsibility:** File storage abstraction over Supabase Storage. Handles upload, download, deletion, validation, and image transformation.

| Contains             | Purpose                                                                 |
| -------------------- | ----------------------------------------------------------------------- |
| `client.ts`          | Supabase Storage client singleton.                                      |
| `upload.ts`          | `uploadFile()` with automatic path generation and signed URL return.    |
| `validate.ts`        | File validation: magic byte checking, size limits, MIME type whitelist. |
| `image-transform.ts` | Profile photo auto-resize using sharp.                                  |
| `buckets.ts`         | Bucket name constants and access configuration.                         |

---

### `packages/logger/` — `@priym/logger`

**Responsibility:** Structured logging abstraction. Every package and app uses this for consistent, structured, PII-scrubbed logging.

| Contains        | Purpose                                                                                                  |
| --------------- | -------------------------------------------------------------------------------------------------------- |
| `logger.ts`     | Pino logger instance with environment-aware configuration.                                               |
| `formatters.ts` | Custom formatters: PII scrubbing (strip passwords, tokens), request context injection.                   |
| `transports.ts` | Log transport configuration: console (dev), structured JSON (prod), external sink (Datadog/Betterstack). |

---

## 4.3 `docs/` — Project Documentation

> **Principle:** Documentation lives alongside code. All project documents are version-controlled.

| Subdirectory | Contents                                                                                                                                    |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `business/`  | Business-facing documents: BRD, PRD, Stakeholder Map. Written for HOD, Principal, Management.                                               |
| `technical/` | Engineering documents: Implementation Plan, Architecture, Database Design, API Reference, Security Model. Written for the development team. |
| `diagrams/`  | Visual assets: ER Diagram, Architecture Diagram, Workflow Diagrams. Stored as PNGs and editable source files (DBML, Mermaid, Excalidraw).   |
| `guides/`    | Operational guides: Getting Started, Contributing, Code Review, Deployment Runbook, Incident Response, Troubleshooting.                     |
| `decisions/` | Architecture Decision Records (ADRs). Documents the _why_ behind every significant technical decision. Numbered sequentially.               |

---

## 4.4 `tests/` — Testing Infrastructure

| Subdirectory   | Tool                | Purpose                                                                                                   |
| -------------- | ------------------- | --------------------------------------------------------------------------------------------------------- |
| `unit/`        | Vitest              | Tests for individual functions and services in isolation. Mocks external dependencies.                    |
| `integration/` | Vitest + test DB    | Tests complete workflows against a real (test) database. Verifies service ↔ repository ↔ DB interactions. |
| `e2e/`         | Playwright          | Tests user-facing flows in a real browser against a running application.                                  |
| `performance/` | k6                  | Load tests that simulate concurrent users and validate response time SLAs.                                |
| `security/`    | Custom + pnpm audit | OWASP checklist, RBAC audit tests, dependency vulnerability scanning.                                     |

---

## 4.5 `scripts/` — Automation

Each script is a self-contained utility that automates a common development or operations task.

| Script            | Purpose                                                              |
| ----------------- | -------------------------------------------------------------------- |
| `setup-dev.sh`    | Full development environment setup (install, Docker, migrate, seed)  |
| `reset-db.sh`     | Drop and recreate database, run migrations, reseed                   |
| `check-env.sh`    | Validate `.env.local` against `.env.example`, flag missing variables |
| `health-check.sh` | Verify PostgreSQL, Redis, and the app are running and reachable      |
| `create-admin.ts` | CLI script to securely create an admin user with a hashed password   |

---

## 4.6 `docker/` — Containerization

| File                      | Purpose                                                                          |
| ------------------------- | -------------------------------------------------------------------------------- |
| `docker-compose.yml`      | Development: PostgreSQL 16 + Redis 7, persisted volumes, health checks           |
| `docker-compose.test.yml` | Testing: Isolated PostgreSQL instance for integration tests, no data persistence |
| `Dockerfile`              | Production multi-stage build: dependencies → build → slim runtime image          |
| `Dockerfile.dev`          | Development: Hot reload, debug ports exposed                                     |

---

## 4.7 `.github/` — CI/CD & GitHub Configuration

| File / Directory                  | Purpose                                                                                    |
| --------------------------------- | ------------------------------------------------------------------------------------------ |
| `workflows/ci.yml`                | Runs on every PR: lint, type-check, unit tests, integration tests, build, coverage report  |
| `workflows/deploy-staging.yml`    | Triggers on merge to `develop`: all CI checks + deploy to Vercel staging + E2E smoke tests |
| `workflows/deploy-production.yml` | Triggers on merge to `main`: all CI checks + manual approval gate + production deploy      |
| `workflows/security-audit.yml`    | Weekly cron: `pnpm audit`, Dependabot alerts, Snyk scan                                    |
| `CODEOWNERS`                      | Maps file paths to team members who must review changes in those areas                     |
| `dependabot.yml`                  | Auto-creates PRs for dependency updates (npm, Docker, GitHub Actions)                      |

---

# 5. Package Dependency Graph

```
@priym/config ──────────────────────────────────── (no dependencies)
     │
     ├──► @priym/types ─────────────────────────── depends on: config
     │         │
     │         ├──► @priym/validation ──────────── depends on: types, config
     │         │
     │         ├──► @priym/logger ──────────────── depends on: config
     │         │
     │         ├──► @priym/database ────────────── depends on: types, config, logger
     │         │
     │         ├──► @priym/auth ────────────────── depends on: types, config, database, logger
     │         │
     │         ├──► @priym/email ───────────────── depends on: types, config, logger
     │         │
     │         ├──► @priym/storage ─────────────── depends on: types, config, logger
     │         │
     │         └──► @priym/ui ──────────────────── depends on: config (tailwind preset)
     │
     └──► apps/web ────────────────────────────── depends on: ALL packages
```

> **Rule:** Dependency flow is always downward. Packages never depend on apps. Lower-level packages never depend on higher-level ones.

---

# 6. Key Configuration Files

## 6.1 `turbo.json` — Turborepo Pipeline

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [".env.local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "test:e2e": {
      "dependsOn": ["build"]
    },
    "db:migrate": {
      "cache": false
    },
    "db:seed": {
      "cache": false
    },
    "db:generate": {
      "cache": false
    }
  }
}
```

## 6.2 `pnpm-workspace.yaml`

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

## 6.3 Root `package.json` (Scripts)

```json
{
  "name": "priym",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "test": "turbo run test",
    "test:e2e": "turbo run test:e2e",
    "test:coverage": "turbo run test -- --coverage",
    "db:migrate": "turbo run db:migrate --filter=@priym/database",
    "db:seed": "turbo run db:seed --filter=@priym/database",
    "db:generate": "turbo run db:generate --filter=@priym/database",
    "db:studio": "pnpm --filter @priym/database exec prisma studio",
    "db:reset": "./scripts/reset-db.sh",
    "format": "prettier --write \"**/*.{ts,tsx,md,json}\"",
    "setup": "./scripts/setup-dev.sh",
    "clean": "turbo run clean && rm -rf node_modules"
  }
}
```

---

<div align="center">

---

_This document defines the structural foundation of PRiym._
_Every file and folder has a purpose. No exceptions._

_Document ID: AIT-PRiym-ARCH-2026-001 | Version 1.0 | August 2026_

_PRiym — Progress • Recognition • Innovation • Merit_

</div>
