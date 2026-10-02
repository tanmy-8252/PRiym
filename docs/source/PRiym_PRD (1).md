---

<div align="center">

# PRiym

### Progress • Recognition • Innovation • Merit

# Product Requirements Document (PRD)

**Atria Institute of Technology — CSE Department MVP**

---

_Confidential — Engineering & Product Use Only_

Document ID: `AIT-PRiym-PRD-2026-001`
Version: **1.0** | August 2026
Status: **Approved for Development**

</div>

---

# Table of Contents

1. [Product Overview](#1-product-overview)
2. [Product Vision](#2-product-vision)
3. [Problem Statement](#3-problem-statement)
4. [Goals](#4-goals)
5. [User Roles](#5-user-roles)
6. [Functional Requirements](#6-functional-requirements)
7. [Non-Functional Requirements](#7-non-functional-requirements)
8. [User Stories](#8-user-stories)
9. [Acceptance Criteria](#9-acceptance-criteria)
10. [Business Rules](#10-business-rules)
11. [Validation Rules](#11-validation-rules)
12. [Error Handling](#12-error-handling)
13. [Permissions Matrix](#13-permissions-matrix)
14. [API Overview](#14-api-overview)
15. [Database Overview](#15-database-overview)
16. [Workflow Diagrams](#16-workflow-diagrams)
17. [Technology Stack](#17-technology-stack)
18. [Future Enhancements](#18-future-enhancements)
19. [Appendices](#19-appendices)

---

# 1. Product Overview

**PRiym** (Progress • Recognition • Innovation • Merit) is a cloud-native, web-based centralized achievement and performance management platform designed for engineering educational institutions. It provides a structured, auditable, and transparent digital pipeline for students to submit their academic, technical, co-curricular, and extracurricular achievements; for faculty to review and verify those submissions; for Heads of Department (HODs) to gain departmental intelligence; and for administrators to govern the platform and produce accreditation-ready reports.

The **MVP** targets the **Computer Science & Engineering (CSE) department** at **Atria Institute of Technology (AIT)**, Bengaluru, Karnataka, serving approximately 600–700 students, 35–40 faculty members, and 1 HOD. The platform is designed from day one with a multi-department, multi-institution architecture to enable scaling without re-engineering.

**Core Value Proposition:**

- Students get **recognized** fairly and consistently for their accomplishments
- Faculty get **efficient** verification workflows with no email chaos
- HODs get **real-time departmental intelligence** with one-click reporting
- Administrators get **accreditation-ready** data and complete audit trails at all times

| Attribute          | Value                                                                 |
| ------------------ | --------------------------------------------------------------------- |
| Platform Type      | Web application (responsive)                                          |
| Primary Tech Stack | Next.js, PostgreSQL, Prisma, Auth.js, Supabase Storage, Redis, Vercel |
| Deployment         | Cloud-hosted (Vercel + AWS)                                           |
| MVP Scope          | CSE Department, AIT                                                   |
| Target Users       | 700 Students, 40 Faculty, 1 HOD, 2 Admins                             |
| Expected Go-Live   | End of current semester                                               |

---

# 2. Product Vision

> _To be the definitive platform where every student achievement is captured, verified, celebrated, and leveraged — transforming institutional achievement management from a reactive paper trail into a proactive engine of student success._

PRiym will become the source of truth for student achievement data at AIT and, over time, across Indian educational institutions. It will eliminate the fragmentation and opacity of today's achievement tracking, replacing it with a transparent, merit-driven ecosystem where every student's effort is visible, measurable, and rewarded.

---

# 3. Problem Statement

The Computer Science & Engineering department at Atria Institute of Technology currently has no standardized digital process for managing student achievements. The consequences are significant:

| Problem                              | Current State                                             | Impact                                                          |
| ------------------------------------ | --------------------------------------------------------- | --------------------------------------------------------------- |
| No structured submission channel     | Students report achievements verbally or via email        | Up to 40% of achievements go unrecorded                         |
| No verification audit trail          | Faculty verify by visual inspection with no record        | Fraudulent or inflated claims are undetectable                  |
| No real-time departmental view       | HOD relies on periodic manual data collation              | Decision-making based on stale, incomplete data                 |
| No recognition system                | Recognition is personality-driven, not merit-driven       | High-achievers are demotivated; low-achievers are invisible     |
| No accreditation-ready data pipeline | Accreditation preparation takes 3–4 weeks per cycle       | High risk of data gaps and inaccuracies in NAAC/NBA submissions |
| No placement-ready portfolio         | Placement cell manually collects and formats student data | Resume inflation is common; placement credibility suffers       |

PRiym is built to solve all of these problems through a single, well-architected platform.

---

# 4. Goals

## 4.1 Product Goals

| ID  | Goal                                                                 | Priority | Success Metric                                                 |
| --- | -------------------------------------------------------------------- | -------- | -------------------------------------------------------------- |
| G1  | Enable structured achievement submission with document upload        | P0       | 100% of submissions via platform                               |
| G2  | Provide faculty with an efficient, queue-based verification workflow | P0       | Verification SLA <= 5 business days                            |
| G3  | Deliver a real-time HOD analytics dashboard                          | P0       | HOD reports generated in <= 5 minutes                          |
| G4  | Implement a configurable points and badge system                     | P1       | All approved achievements awarded points within 1 hour         |
| G5  | Produce NAAC/NBA-aligned exportable achievement reports              | P0       | Reports available on demand, 0 manual formatting               |
| G6  | Build a verified student portfolio for placement cell                | P1       | 100% final-year students have profiles before placement season |
| G7  | Maintain full audit trail for all platform actions                   | P0       | 100% of create/update/delete actions logged                    |
| G8  | Achieve >= 75 System Usability Scale (SUS) score                     | P1       | Post-launch UX survey                                          |
| G9  | Architect for multi-department expansion without re-engineering      | P0       | Phase 2 onboarding requires no schema changes                  |

## 4.2 Technical Goals

- Achieve 99.5% uptime SLA
- Page load time <= 2 seconds (P95)
- Support 700 concurrent users without degradation
- Zero critical security vulnerabilities at launch
- 80%+ unit test coverage on core business logic

---

# 5. User Roles

## 5.1 Student

**Description:** The primary user and content contributor. Students register achievements, track the status of submissions, view their merit profile and leaderboard position, and earn badges and reward points.

**Characteristics:**

- Volume: ~700 per department (CSE MVP)
- Access: Own profile, own submissions, department leaderboard, public badges
- Cannot access: Other students' full profiles, faculty tools, admin panel
- Session Frequency: 2–4 times per month on average, daily during active submission periods

**Key Capabilities:**

- Submit achievements with categorization and supporting documents
- Track submission status in real-time
- View personal achievement portfolio and point balance
- View leaderboard and merit rankings
- Receive notifications for status changes
- Update personal profile

---

## 5.2 Faculty

**Description:** The verification authority and student mentor. Faculty members review submitted achievements, approve or reject them with documented reasoning, request clarifications, and monitor the progress of their assigned mentee cohort.

**Characteristics:**

- Volume: ~40 per department (CSE MVP)
- Access: Verification queue, assigned mentee list, own achievement history (as a user), HOD-lite analytics for their mentees
- Cannot access: HOD-wide reports, admin panel, other faculty's queues (unless escalated)

**Key Capabilities:**

- Review and act on achievement submissions assigned to them
- Approve, reject, or request clarification on submissions
- View the achievement dashboard for their assigned mentee cohort
- Receive notifications for new assignments, escalations, and overdue verifications

---

## 5.3 Head of Department (HOD)

**Description:** The departmental performance owner. The HOD has full read access to all student and faculty data within their department. They drive strategic decisions based on analytics and generate governance and accreditation reports.

**Characteristics:**

- Volume: 1 per department
- Access: Full department view — all student profiles, all submissions, all faculty activity, full analytics
- Cannot access: Admin panel (system configuration), other departments' data

**Key Capabilities:**

- View real-time department-level achievement dashboard
- Drill down from department to batch to student
- Generate and export achievement reports
- Configure department-specific settings (categories, point weights, SLA thresholds)
- View and action escalated submissions
- Identify at-risk students (zero achievements) and trigger faculty follow-up

---

## 5.4 Administrator

**Description:** The platform operations authority. The Administrator configures the platform, manages users and roles, oversees system health, and manages institutional settings.

**Characteristics:**

- Volume: 1–2 per institution
- Access: Full platform access including system configuration, all department data, audit logs, user management

**Key Capabilities:**

- Create, update, deactivate user accounts and assign roles
- Configure achievement categories, point tables, and badge rules globally and per department
- Manage academic year and semester settings
- View and export full audit logs
- Monitor system health and activity
- Manage escalation policies and notification templates
- Bulk import/export user data (CSV)

---

# 6. Functional Requirements

## 6.1 Authentication

### FR-AUTH-001 — User Registration

- New users register using their institutional email address.
- Registration fields: Full Name, USN (for students), Email, Password, Department, Role.
- Upon registration, the account enters Pending Approval state.
- Admin or designated Faculty approves the account before first login.
- A verification email is sent upon registration (link expires in 24 hours).

### FR-AUTH-002 — Login

- Users authenticate using email + password.
- Lock account after 5 consecutive failed attempts for 30 minutes.
- On successful login, a JWT session token is issued via Auth.js.
- Session duration: 8 hours (configurable). Refresh tokens extend session to 30 days if "Remember Me" is selected.

### FR-AUTH-003 — Password Management

- Password reset via email link (expires in 1 hour).
- Password complexity requirements enforced (see Validation Rules).
- Change password form requires current password confirmation.
- Cannot reuse last 5 passwords.

### FR-AUTH-004 — Multi-Factor Authentication (MFA)

- MFA is optional for Students and Faculty.
- MFA is mandatory for HOD and Administrator accounts.
- Supported MFA methods: TOTP (Google Authenticator, Authy), Email OTP.

### FR-AUTH-005 — Session Management

- Inactive sessions expire after 30 minutes.
- Users warned 5 minutes before session expiry.
- All active sessions listed in Settings; users can remotely terminate any session.

### FR-AUTH-006 — Role-Based Access Control (RBAC)

- Every route and API endpoint enforces role-based access control.
- Role assignments stored in database and verified server-side on every request.

### FR-AUTH-007 — SSO (Phase 2)

- Institutional SSO (Google Workspace or Microsoft Azure AD) deferred to Phase 2.
- Auth.js OAuth provider interfaces stubbed and documented for future activation.

---

## 6.2 Student Portal

### FR-STU-001 — Student Dashboard

Upon login, students see:

- Total verified achievement points (current semester and cumulative)
- Submissions by status (Pending, Under Review, Approved, Rejected)
- Current leaderboard rank (semester and all-time)
- Active badges earned
- Recent activity feed (last 5 actions)
- Quick-submit CTA button

### FR-STU-002 — Achievement History

- Paginated list of all submitted achievements
- Each entry shows: Category, Title, Submission Date, Status, Points Awarded, Faculty Reviewer
- Click any entry for full submission detail and faculty feedback

### FR-STU-003 — Achievement Portfolio

- Shareable, public-facing portfolio page with verified achievements organized by category
- Unique URL: `/portfolio/[usn]`
- Toggle public/private by the student
- Exportable as PDF by student or placement cell

### FR-STU-004 — Merit Profile

- Cumulative point balance, badge wall, honor roll status
- Breakdown of points by achievement category
- History of point transactions (earned, redeemed)

### FR-STU-005 — Leaderboard View

- View department leaderboard filtered by semester, batch, and achievement category

### FR-STU-006 — Notifications

- In-app and email notifications for all submission status changes

---

## 6.3 Faculty Portal

### FR-FAC-001 — Faculty Dashboard

Faculty dashboard shows:

- Pending verification queue count (with SLA urgency indicators)
- Total submissions reviewed (this semester)
- Mentee cohort summary: active students, students with 0 achievements, average points
- Recent faculty activity log

### FR-FAC-002 — Verification Queue

- Prioritized queue sorted by submission date (oldest first); escalated items pinned to top
- Each queue item shows: Student Name, USN, Category, Title, Submitted Date, Days in Queue, Days until SLA
- Filter by status, category, and date range
- Bulk-select and batch actions (e.g., Request Clarification)

### FR-FAC-003 — Submission Review Interface

Full Submission Detail View includes:

- All submission metadata and student-provided information
- Uploaded documents viewable in-browser via Supabase Storage signed URLs
- Verification checklist (configurable per category by admin)
- Comment/annotation field (required for Reject and Request Clarification)
- Three action buttons: Approve, Reject, Request Clarification
- All actions logged with timestamp and reviewer ID

### FR-FAC-004 — Mentee Cohort View

- List of all assigned mentees with: Name, USN, current points, verified achievements count, pending submissions, last submission date
- Clicking a mentee shows their full achievement history (read-only)

### FR-FAC-005 — Escalation

- Faculty can escalate submissions to HOD with a written reason

---

## 6.4 HOD Portal

### FR-HOD-001 — HOD Dashboard

Real-time command center showing:

- Total verified achievements (current semester, all-time)
- Total points awarded across the department
- Achievement breakdown by category (donut chart)
- Batch performance comparison (bar chart)
- Top 10 students (semester and all-time)
- Students with 0 verified achievements (intervention list)
- Faculty verification activity: submissions reviewed, average review time, pending items per faculty
- Pending escalations requiring HOD action
- SLA breach alerts

### FR-HOD-002 — Departmental Achievement Browser

- Paginated, searchable, filterable table of all department submissions
- Columns: Student Name, USN, Batch, Category, Title, Submitted Date, Verified Date, Status, Points, Reviewer
- HOD can click into any submission for full detail

### FR-HOD-003 — Student Deep Dive

- HOD can view any student's full merit profile within the department

### FR-HOD-004 — Report Generation

- Report builder: select type, date range, filters, export format (PDF, Excel, CSV)
- Asynchronous generation for large datasets; user notified when ready

### FR-HOD-005 — Escalation Management

- Dedicated escalation inbox with full submission detail
- HOD actions: Approve, Reject, Re-assign to another faculty, Return to original faculty

### FR-HOD-006 — Department Settings

- Achievement category point weight multipliers
- SLA threshold settings (default: 5 business days)
- Leaderboard visibility settings

---

## 6.5 Administrator Portal

### FR-ADM-001 — Admin Dashboard

System-wide view:

- Total users by role, active vs. inactive
- Total submissions (all statuses) platform-wide
- System health metrics (response time, error rate, storage usage)
- Recent audit log entries
- Pending user approval requests

### FR-ADM-002 — User Management

- Create, read, update, deactivate users
- Assign and change user roles
- Bulk import/export via CSV
- View login history per user
- Force password reset for any user

### FR-ADM-003 — Achievement Category Management

- Create, edit, archive achievement categories
- For each category: Name, Description, Icon/Color, Default Point Value, Verification Checklist Items, Required Document Types
- Categories can be global or department-specific

### FR-ADM-004 — Badge Management

- Create, edit, deactivate badges
- Badge properties: Name, Icon, Description, Trigger Rule, Category filter, Point threshold
- Preview badge rendering before publishing

### FR-ADM-005 — Academic Year & Semester Management

- Define academic years and semesters within them
- Set active semester (controls dashboard display and leaderboard scope)
- Closing a semester archives that period's leaderboard data

### FR-ADM-006 — Notification Template Management

- Edit all system notification templates
- Templates support dynamic variables (e.g., `{{student_name}}`, `{{achievement_title}}`)
- Preview template before saving
- Configure notification channels per event: in-app, email, or both

### FR-ADM-007 — Audit Log Viewer

- Full audit log accessible to Admin (see Section 6.15)
- Export audit logs as CSV or JSON for a given date range

### FR-ADM-008 — System Settings

- Global settings: Institutional name, domain whitelist for registration, session duration, MFA enforcement by role
- Storage limits per user and per submission
- Email service configuration

### FR-ADM-009 — Department Management

- Create and manage departments
- Assign HOD to each department
- Configure department-level feature flags

---

## 6.6 Achievement Submission

### FR-SUB-001 — Submission Form

| Field                | Type                      | Required    | Notes                                                                |
| -------------------- | ------------------------- | ----------- | -------------------------------------------------------------------- |
| Achievement Title    | Text (max 150 chars)      | Yes         |                                                                      |
| Category             | Dropdown                  | Yes         | Populated from active categories                                     |
| Sub-Category         | Dropdown                  | Conditional | Depends on category selection                                        |
| Level                | Dropdown                  | Yes         | International / National / State / University / College / Department |
| Position / Result    | Text                      | Conditional | For competitions                                                     |
| Issuing Organization | Text                      | Yes         |                                                                      |
| Achievement Date     | Date picker               | Yes         | Cannot be future date; within current or previous semester           |
| Description          | Textarea (max 1000 chars) | Yes         |                                                                      |
| Supporting Documents | File upload               | Yes         | Min 1 doc; up to 5 files; max 10MB per file                          |
| External URL         | URL                       | No          | Link to achievement                                                  |
| Collaborators        | Multi-select (students)   | No          | Tag other students in group achievements                             |

### FR-SUB-002 — Document Upload

- Accepted formats: PDF, JPG, PNG, MP4
- Maximum file size per file: 10 MB; maximum 5 files per submission
- Files stored in Supabase Storage; signed URL generated for reviewer access
- Uploaded files virus-scanned before storage

### FR-SUB-003 — Submission Routing

Routing logic (priority order):

1. Student's designated Faculty Mentor (if assigned)
2. Faculty assigned to the achievement's category
3. Department's default Faculty Verifier

### FR-SUB-004 — Draft Saving

- Students can save as Draft before submitting; Drafts preserved for 30 days

### FR-SUB-005 — Resubmission

- When returned with "Request Clarification," student can update and resubmit
- Maximum 3 resubmission attempts; after 3 rejections, student must contact HOD

### FR-SUB-006 — Duplicate Detection

- Checks for same student, same category, same achievement date, similar title (>=85% fuzzy match)
- Warning displayed to student; must confirm to proceed

---

## 6.7 Verification Workflow

### FR-VER-001 — Verification States

```
DRAFT -> SUBMITTED -> UNDER_REVIEW -> [APPROVED | REJECTED | CLARIFICATION_REQUESTED]
                                              ^
                                 CLARIFICATION_REQUESTED -> RESUBMITTED -> UNDER_REVIEW
```

### FR-VER-002 — Verification Checklist

- Configurable checklist per achievement category
- Faculty must check off all items before submitting Approve or Reject decision

### FR-VER-003 — Approve Action

- Status -> APPROVED; points awarded; badge evaluation triggered; student notified

### FR-VER-004 — Reject Action

- Status -> REJECTED; mandatory rejection reason from configurable list + free-text comment; student notified

### FR-VER-005 — Request Clarification

- Status -> CLARIFICATION_REQUESTED; faculty provides specific question; student notified
- Student must resubmit within 7 days; after 14 days of no response, submission auto-expires

### FR-VER-006 — SLA Enforcement

- Default SLA: 5 business days from assignment
- Automated reminders at Day 3, Day 4, Day 5 (breach)
- On SLA breach: HOD notified; submission flagged OVERDUE

---

## 6.8 Escalation Workflow

### FR-ESC-001 — Faculty-to-HOD Escalation

- Faculty escalates with written reason (min 50 chars)
- Submission moves to HOD escalation inbox; HOD notified immediately

### FR-ESC-002 — HOD Escalation Actions

- Approve (direct), Reject (mandatory reason), Re-assign (to different faculty), Return to Faculty (with guidance)

### FR-ESC-003 — Automatic Escalation

- If submission is OVERDUE by 2+ business days, it is automatically escalated to HOD

### FR-ESC-004 — HOD SLA

- HOD must act on escalated submissions within 3 business days
- If HOD SLA is breached, Admin is notified

---

## 6.9 Leaderboard

### FR-LDR-001 — Leaderboard Scopes

| Scope          | Description                                             | Visible To             |
| -------------- | ------------------------------------------------------- | ---------------------- |
| Semester       | Rankings by total verified points in current semester   | All department users   |
| All-Time       | Rankings by cumulative verified points since enrollment | All department users   |
| Batch-Wise     | Rankings within a single batch                          | All department users   |
| Category       | Rankings by points in a specific achievement category   | All department users   |
| Faculty Cohort | Rankings within a faculty's assigned mentee group       | Faculty (mentees only) |

### FR-LDR-002 — Leaderboard Display

- Displays top 100 students with rank, partial USN, batch, points, badge count
- Rank changes from previous week displayed (up/down/neutral)
- Students can see their own rank even if outside top 100 (sticky footer row)

### FR-LDR-003 — Leaderboard Refresh

- Cached in Redis; refreshed every 15 minutes; "Last updated" timestamp displayed

### FR-LDR-004 — Leaderboard Visibility

- Students can opt out (name replaced with "Anonymous")
- HOD and Admin always see full leaderboard

### FR-LDR-005 — Honor Roll

- End of each semester: top 10 students added to the Honor Roll
- Permanent, archived per semester

---

## 6.10 Rewards

### FR-REW-001 — Points System

- Points formula: `Final Points = Base Category Points x Level Multiplier x HOD Multiplier`
- Level multipliers: International (2.0x), National (1.5x), State (1.2x), University (1.0x), College (0.8x), Department (0.5x)

### FR-REW-002 — Point Ledger

- Every point transaction recorded in an immutable ledger per student
- Fields: Transaction Type, Amount, Reference (submission ID), Timestamp, Actor

### FR-REW-003 — Point Adjustments

- HOD or Admin can make manual adjustments (positive or negative) with mandatory reason
- All adjustments logged in audit trail

### FR-REW-004 — Reward Redemption (Phase 2)

- Students redeem accumulated points for institutional rewards (library credits, event fee waivers, merchandise)
- Reward catalog managed by Admin; redemption tracked in point ledger

---

## 6.11 Badges

### FR-BAD-001 — Badge Types

| Type        | Example                                           |
| ----------- | ------------------------------------------------- |
| Achievement | "Published Researcher", "Hackathon Champion"      |
| Milestone   | "Silver Merit (500 pts)", "Gold Merit (1000 pts)" |
| Activity    | "Active Contributor" (10 submissions)             |
| Semester    | "Semester Star" (top 10 semester-end)             |
| Streak      | "Consistent Achiever" (consecutive semesters)     |

### FR-BAD-002 — Badge Award Logic

- Evaluated automatically after every achievement approval and point transaction
- Badges are permanent once earned; only Admin can revoke (audit logged)

### FR-BAD-003 — Badge Display

- Appear on student profile, portfolio, and leaderboard row
- Hover/click shows badge name, description, and date earned

### FR-BAD-004 — Badge Notifications

- In-app notification and email when new badge is awarded

---

## 6.12 Analytics

### FR-ANA-001 — HOD Analytics Modules

| Module                   | Visualizations                                                                             |
| ------------------------ | ------------------------------------------------------------------------------------------ |
| Overview                 | KPI cards: total achievements, total points, active students, students with 0 achievements |
| Category Distribution    | Donut chart: achievement count and points by category                                      |
| Batch Comparison         | Bar chart: average points per batch                                                        |
| Timeline                 | Line chart: achievement submissions over time                                              |
| Faculty Activity         | Bar chart: submissions reviewed per faculty, average review time                           |
| Leaderboard Trends       | Line chart: top 10 students' point trajectories                                            |
| At-Risk Students         | Table: students with 0 approved achievements                                               |
| Verification Performance | SLA compliance gauge; average time-to-verify per faculty                                   |

### FR-ANA-002 — Admin Analytics

- All HOD modules at the cross-department level
- System usage: DAU, WAU, MAU; user growth over time
- Platform health: API response time, error rate, storage consumption

### FR-ANA-003 — Data Refresh

- Analytics cached in Redis with 15-minute TTL
- Manual refresh option (rate-limited: 1 refresh per 5 minutes per user)

---

## 6.13 Reports

### FR-REP-001 — Report Types

| Report Name                             | Primary Consumer               | Contents                                                                |
| --------------------------------------- | ------------------------------ | ----------------------------------------------------------------------- |
| Department Achievement Summary          | HOD, Admin                     | Total submissions, verified achievements, points, by category and batch |
| Student Achievement Report              | Student (self), Placement Cell | Individual student's full verified achievement history                  |
| Faculty Verification Report             | HOD, Admin                     | Per-faculty verification counts, SLA compliance, average review time    |
| Batch Performance Report                | HOD                            | Batch-wise comparison of achievement activity                           |
| Accreditation Report (NAAC Criterion 5) | HOD, Admin                     | Structured data aligned to NAAC Criterion 5 indicators                  |
| Accreditation Report (NBA OBE)          | HOD, Admin                     | Achievements mapped to Program Outcomes (POs)                           |
| Honor Roll Report                       | HOD, Admin                     | Semester-end top 10 students with achievement details                   |
| Audit Log Report                        | Admin                          | Timestamped log of all platform events for a date range                 |

### FR-REP-002 — Report Generation

- Under 500 rows: Generated synchronously; download starts immediately
- Over 500 rows: Generated asynchronously; user notified when ready; download link valid 24 hours
- Export formats: PDF, Excel (.xlsx), CSV

### FR-REP-003 — Scheduled Reports

- HOD and Admin can schedule recurring reports (daily/weekly/monthly)
- Scheduled reports emailed to configured recipient list

---

## 6.14 Notifications

### FR-NOT-001 — Notification Events

| Event                              | Recipient                        | Channels      |
| ---------------------------------- | -------------------------------- | ------------- |
| Submission Received                | Student (self), Assigned Faculty | In-app, Email |
| Submission Approved                | Student                          | In-app, Email |
| Submission Rejected                | Student                          | In-app, Email |
| Clarification Requested            | Student                          | In-app, Email |
| Resubmission Received              | Faculty                          | In-app, Email |
| Submission Approaching SLA (Day 3) | Faculty                          | In-app        |
| Submission Approaching SLA (Day 4) | Faculty                          | In-app, Email |
| SLA Breached                       | Faculty, HOD                     | In-app, Email |
| Auto-Escalation Triggered          | HOD, Faculty                     | In-app, Email |
| Escalation Received                | HOD                              | In-app, Email |
| HOD Action on Escalation           | Faculty, Student                 | In-app, Email |
| Badge Awarded                      | Student                          | In-app, Email |
| Honor Roll Achieved                | Student                          | In-app, Email |
| Account Approved                   | New User                         | Email         |
| Password Reset Requested           | User                             | Email         |
| Scheduled Report Ready             | HOD / Admin                      | Email         |
| System Maintenance Alert           | All users                        | In-app        |

### FR-NOT-002 — Notification Preferences

- Users manage per-event notification preferences in Settings
- Email notifications can be disabled per event type (except security events)
- In-app notifications cannot be fully disabled

### FR-NOT-003 — Notification Center

- Bell icon shows unread count
- Notification center shows all notifications, newest first
- Notifications retained for 90 days

---

## 6.15 Audit Logs

### FR-AUD-001 — Logged Events

| Category        | Events                                                                           |
| --------------- | -------------------------------------------------------------------------------- |
| Authentication  | Login, Logout, Failed Login, Password Change, MFA Enable/Disable, Session Revoke |
| User Management | User Created, Role Changed, User Deactivated, User Reactivated                   |
| Submission      | Submitted, Draft Saved, Resubmitted, Expired                                     |
| Verification    | Approved, Rejected, Clarification Requested, Escalated, Re-assigned              |
| Points          | Points Awarded, Manual Adjustment, Redemption                                    |
| Badge           | Badge Awarded, Badge Revoked                                                     |
| Configuration   | Category Created/Updated/Archived, Badge Rule Created/Updated, Settings Changed  |
| Report          | Report Generated, Report Exported                                                |
| Data            | Bulk Import, Bulk Export, Data Deletion                                          |

### FR-AUD-002 — Log Entry Fields

Each entry contains: log_id, timestamp, actor_id, actor_role, action, entity_type, entity_id, metadata (JSON), department_id, IP address, user agent.

### FR-AUD-003 — Audit Log Integrity

- Append-only; no update or delete operations permitted through application layer
- Entries cryptographically signed (HMAC-SHA256) to detect tampering

---

## 6.16 Search

### FR-SRC-001 — Global Search

- Available to Faculty, HOD, and Admin via universal search bar
- Searches across: Students (name, USN), Achievements (title, category), Faculty (name), Submissions (ID)
- Results grouped by entity type; minimum query length 2 characters; debounced 300ms

### FR-SRC-002 — Submission Search

- Search by: Student name, USN, achievement title, category, status, date range
- HOD and Admin can search all submissions; Faculty limited to their queue and mentee list

---

## 6.17 Filtering

### FR-FIL-001 — Universal Filter Panel

| Entity      | Filterable Fields                                               |
| ----------- | --------------------------------------------------------------- |
| Submissions | Status, Category, Level, Batch, Semester, Faculty, Date Range   |
| Students    | Batch, Semester, Merit Level, Badge Count, Points Range, Mentor |
| Leaderboard | Semester, Batch, Category                                       |
| Audit Logs  | Actor Role, Action Type, Entity Type, Date Range                |

### FR-FIL-002 — Saved Filters

- HOD and Admin can save custom filter configurations with a label for reuse

### FR-FIL-003 — URL-Persistent Filters

- Active filter state reflected in URL query string for shareable views

---

## 6.18 Dashboard

### FR-DSH-001 — Role-Adaptive Dashboard

- Each role sees a distinct, purpose-built dashboard on login

### FR-DSH-002 — Dashboard Widgets

Each widget:

- Has a loading skeleton state while data is fetching
- Displays an error state with a retry button if data fails to load
- Shows a "Last updated" timestamp
- Includes a direct link to the full view

### FR-DSH-003 — Dashboard Data Freshness

- Dashboard data fetched fresh on page load
- Slowly changing data (leaderboard, analytics) uses Redis-cached values with 15-minute TTL
- "Refresh" button triggers new fetch (rate-limited)

---

## 6.19 Profile

### FR-PRF-001 — Student Profile

- Editable by student: Profile photo, Phone number, LinkedIn URL, GitHub URL, Bio (max 500 chars)
- Admin-managed: Name, USN, Email, Department, Batch, Mentor Faculty
- Displays: Active badges, current points, achievement summary, portfolio link

### FR-PRF-002 — Faculty Profile

- Editable by faculty: Profile photo, Office hours, Areas of expertise, LinkedIn URL
- Admin-managed: Name, Employee ID, Email, Department, Mentee assignments

### FR-PRF-003 — Profile Photo

- Upload: JPG, PNG; Max 5MB; Auto-resized to 512x512px
- Default avatar generated from initials if no photo uploaded

### FR-PRF-004 — Account Security View

- View active sessions and connected devices
- Revoke individual sessions
- Enable/disable MFA

---

## 6.20 Settings

### FR-SET-001 — User Settings

- Account: Change email, change password
- Notifications: Per-event channel preferences
- Privacy: Portfolio visibility (Public/Department-only/Private)
- Sessions: View and revoke active sessions

### FR-SET-002 — HOD Department Settings

- Achievement category point weight multipliers
- SLA thresholds (default verification deadline)
- Leaderboard visibility
- Faculty-to-category assignment mapping

### FR-SET-003 — Admin System Settings

- Institutional details (name, logo, domain whitelist)
- Password policy (length, complexity, history)
- Session duration and MFA enforcement by role
- Email service configuration
- Storage quota limits
- Maintenance mode toggle

---

# 7. Non-Functional Requirements

## 7.1 Performance

| Requirement                    | Target                             |
| ------------------------------ | ---------------------------------- |
| Page Load Time (P50)           | <= 1.0 second                      |
| Page Load Time (P95)           | <= 2.0 seconds                     |
| API Response Time (P50)        | <= 150ms                           |
| API Response Time (P95)        | <= 500ms                           |
| File Upload Processing         | <= 5 seconds for files up to 10MB  |
| Report Generation (< 500 rows) | <= 10 seconds                      |
| Leaderboard Render             | <= 500ms (cached data)             |
| Database Query Performance     | No query > 200ms under normal load |

## 7.2 Scalability

- Support 700 concurrent users in CSE pilot without performance degradation
- Architecture must support horizontal scaling to 5,000 concurrent users (all-department rollout)
- Database designed to hold 5 years of achievement data (minimum 50,000 submission records)
- Stateless API design enables addition of server instances without state coordination
- Redis caching layer must absorb >= 80% of read traffic for leaderboard and analytics endpoints

## 7.3 Availability

| Requirement                    | Target                                                   |
| ------------------------------ | -------------------------------------------------------- |
| Uptime SLA (Production)        | >= 99.5% per month                                       |
| Planned Maintenance Window     | Sundays 2:00-4:00 AM IST (announced 48 hours in advance) |
| Maximum Planned Downtime       | <= 4 hours per month                                     |
| Recovery Time Objective (RTO)  | <= 1 hour for critical failures                          |
| Recovery Point Objective (RPO) | <= 4 hours                                               |
| Database Backup Frequency      | Every 6 hours; retained for 30 days                      |

## 7.4 Security

| Requirement          | Implementation                                                     |
| -------------------- | ------------------------------------------------------------------ |
| Data in Transit      | TLS 1.3 minimum; HSTS enforced                                     |
| Data at Rest         | AES-256 encryption for database and file storage                   |
| Authentication       | Auth.js with secure JWT; HttpOnly, SameSite=Strict cookies         |
| Authorization        | Server-side RBAC on every request; no client-side trust            |
| Password Storage     | bcrypt with salt rounds >= 12                                      |
| SQL Injection        | Prisma ORM with parameterized queries                              |
| XSS Prevention       | Content Security Policy (CSP) headers; input sanitization          |
| CSRF Protection      | CSRF tokens on all state-changing requests                         |
| File Upload Security | File type validation (magic bytes); virus scanning; size limits    |
| Rate Limiting        | 100 req/min for authenticated users; 10 req/min for auth endpoints |
| Security Headers     | X-Frame-Options: DENY, X-Content-Type-Options: nosniff             |
| Dependency Scanning  | Automated npm audit in CI pipeline                                 |
| OWASP Compliance     | OWASP Top 10 mitigations implemented                               |
| Penetration Testing  | Before production launch and annually thereafter                   |

## 7.5 Maintainability

- Code follows Airbnb JavaScript/TypeScript style guide enforced by ESLint
- Minimum 80% unit test coverage on business logic
- Integration tests for all critical workflows
- CI/CD pipeline: all tests must pass before merge to main
- Database migrations managed exclusively via Prisma Migrate
- Feature flags for controlled rollout of new features

## 7.6 Accessibility

- Platform meets WCAG 2.1 Level AA compliance
- All interactive elements have accessible labels
- Keyboard navigability for all core workflows
- Color contrast ratio >= 4.5:1 for normal text; >= 3:1 for large text
- No information conveyed by color alone
- All images have descriptive alt text
- Focus indicators always visible

## 7.7 Reliability

- Automated health checks on API, database, and Redis every 60 seconds
- Circuit breaker pattern for downstream service calls
- Graceful degradation: If Redis is unavailable, fallback to database queries
- Job queue with retry logic (max 3 retries with exponential backoff)
- Idempotent submission and point award operations to prevent double-processing

## 7.8 Usability

- New users must complete first achievement submission within 5 minutes of first login
- All error messages are human-readable and actionable
- Confirmation dialogs for all irreversible actions
- Loading states shown for all async operations > 300ms
- Mobile-responsive design for all core student and faculty workflows
- Onboarding tooltip tour for first-time users

## 7.9 Compliance

- Indian IT Act 2000 and DPDP Act 2023 provisions: lawful processing, data minimization, right to access and deletion
- NAAC/NBA: Report templates aligned to Criterion 5 and OBE outcome mapping
- All student data classified as sensitive; access role-controlled and audit-logged
- Students can export full achievement history at any time (data portability)
- Data retention: active user data retained indefinitely; deactivated user data retained for 5 years then anonymized

---

# 8. User Stories

## 8.1 Student Stories

| ID         | User Story                                                                                                                                                                | Priority |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| US-STU-001 | As a student, I want to submit my achievement with category and document so that it is officially recorded and recognized by my institution.                              | P0       |
| US-STU-002 | As a student, I want to track the status of my submitted achievements in real-time so that I know whether they have been verified or if any action is needed from my end. | P0       |
| US-STU-003 | As a student, I want to receive a notification when my submission status changes so that I am immediately informed without having to log in and check.                    | P0       |
| US-STU-004 | As a student, I want to see my current leaderboard rank so that I understand how my performance compares to my peers.                                                     | P1       |
| US-STU-005 | As a student, I want to view all the badges I have earned so that I feel recognized for the variety of my accomplishments.                                                | P1       |
| US-STU-006 | As a student, I want to resubmit a clarification for a returned submission so that I can address the faculty's concerns and have my achievement approved.                 | P0       |
| US-STU-007 | As a student, I want to save my submission as a draft so that I can complete it later if I don't have all documents ready.                                                | P1       |
| US-STU-008 | As a student, I want to view my verified achievement portfolio so that I can share it with recruiters and scholarship committees.                                         | P1       |
| US-STU-009 | As a student, I want to export my achievement portfolio as a PDF so that I can attach it to job or internship applications.                                               | P1       |
| US-STU-010 | As a student, I want to control whether my portfolio is public or private so that I can manage my own privacy preferences.                                                | P2       |
| US-STU-011 | As a student, I want to see a breakdown of my points by achievement category so that I understand where my strengths are and what areas I should develop.                 | P2       |
| US-STU-012 | As a student, I want to reset my password securely so that I can regain access if I forget it.                                                                            | P0       |

---

## 8.2 Faculty Stories

| ID         | User Story                                                                                                                                                                       | Priority |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| US-FAC-001 | As a faculty member, I want to see a prioritized queue of student achievement submissions assigned to me so that I can review them efficiently without searching through emails. | P0       |
| US-FAC-002 | As a faculty member, I want to view uploaded supporting documents directly in the browser so that I can verify submissions without downloading files.                            | P0       |
| US-FAC-003 | As a faculty member, I want to approve an achievement submission with an optional comment so that the student is recognized and informed.                                        | P0       |
| US-FAC-004 | As a faculty member, I want to reject a submission with a mandatory reason so that the student understands why the submission was not accepted.                                  | P0       |
| US-FAC-005 | As a faculty member, I want to request clarification on a submission with a specific question so that the student can provide what is needed to make a verification decision.    | P0       |
| US-FAC-006 | As a faculty member, I want to receive a notification when a student provides a resubmission so that I can promptly review it.                                                   | P0       |
| US-FAC-007 | As a faculty member, I want to see a summary dashboard of my assigned mentee cohort's achievement activity so that I can proactively support underperforming students.           | P1       |
| US-FAC-008 | As a faculty member, I want to escalate a submission I cannot verify to the HOD so that it is handled by someone with the appropriate authority.                                 | P1       |
| US-FAC-009 | As a faculty member, I want to receive automated reminders when a submission in my queue is approaching the SLA deadline so that I never miss the verification window.           | P1       |

---

## 8.3 HOD Stories

| ID         | User Story                                                                                                                                                                     | Priority |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| US-HOD-001 | As an HOD, I want to see a real-time dashboard of all achievement activity in my department so that I always have a current picture of student performance.                    | P0       |
| US-HOD-002 | As an HOD, I want to generate a department achievement report in PDF or Excel within 5 minutes so that I can present it to the Principal or accreditation committee on demand. | P0       |
| US-HOD-003 | As an HOD, I want to see a list of students with zero verified achievements so that I can direct faculty mentors to engage with these students.                                | P0       |
| US-HOD-004 | As an HOD, I want to review and act on escalated submissions so that I can unblock submissions that faculty could not independently verify.                                    | P0       |
| US-HOD-005 | As an HOD, I want to compare achievement activity across different batches so that I can identify which cohorts need more encouragement or support.                            | P1       |
| US-HOD-006 | As an HOD, I want to see individual faculty verification performance so that I can identify faculty who are not meeting their SLA obligations.                                 | P1       |
| US-HOD-007 | As an HOD, I want to generate an accreditation-ready NAAC Criterion 5 report so that my team doesn't spend weeks manually assembling data before each accreditation cycle.     | P0       |
| US-HOD-008 | As an HOD, I want to configure point weight multipliers for different achievement categories so that the point system reflects my department's strategic priorities.           | P2       |
| US-HOD-009 | As an HOD, I want to view the complete achievement history of any student in my department so that I can make informed decisions for nominations, awards, and interventions.   | P1       |
| US-HOD-010 | As an HOD, I want to schedule a weekly department achievement summary report to be emailed to me automatically so that I stay informed without logging in.                     | P2       |

---

## 8.4 Administrator Stories

| ID         | User Story                                                                                                                                                                                                | Priority |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| US-ADM-001 | As an administrator, I want to create and manage user accounts with assigned roles so that only authorized users can access the platform.                                                                 | P0       |
| US-ADM-002 | As an administrator, I want to bulk import students and faculty from a CSV file so that I can onboard hundreds of users at the start of each academic year without manual data entry.                     | P0       |
| US-ADM-003 | As an administrator, I want to create and manage achievement categories with configurable point values and verification checklists so that the platform reflects the institution's recognition framework. | P0       |
| US-ADM-004 | As an administrator, I want to view the complete audit log for all platform events so that I can investigate any incident or support any compliance audit.                                                | P0       |
| US-ADM-005 | As an administrator, I want to create and configure badges with custom trigger rules so that the recognition system motivates a wide range of student behaviors.                                          | P1       |
| US-ADM-006 | As an administrator, I want to set up and manage academic years and semesters so that all data is correctly scoped to the relevant time period.                                                           | P0       |
| US-ADM-007 | As an administrator, I want to deactivate a user account without deleting their data so that the historical record is preserved if the user leaves the institution.                                       | P0       |
| US-ADM-008 | As an administrator, I want to edit system notification templates so that all communications from the platform are in the institution's voice and tone.                                                   | P1       |
| US-ADM-009 | As an administrator, I want to monitor system health (uptime, error rate, storage) from the admin dashboard so that I can proactively identify and address infrastructure issues.                         | P1       |
| US-ADM-010 | As an administrator, I want to export the full audit log for a given date range as a CSV so that I can provide it to auditors during accreditation reviews.                                               | P0       |

---

# 9. Acceptance Criteria

## AC-SUB-001 — Achievement Submission

**Given** a logged-in student on the submission form,
**When** they fill all required fields, upload at least one supporting document, and click Submit,
**Then:**

- A submission record is created with status SUBMITTED
- Success confirmation displayed with submission ID
- Email and in-app notification sent to student (acknowledgment) and assigned faculty (new assignment)
- Submission appears in student's "My Submissions" list as "Under Review"
- Submission appears in faculty's verification queue

**Given** a student submitting a potential duplicate,
**When** the system detects >= 85% title similarity with same category and date,
**Then** a warning modal appears with the matching submission; student must explicitly confirm to proceed.

---

## AC-VER-001 — Approval

**Given** a faculty member reviewing a submission with all checklist items completed,
**When** they click "Approve" and submit,
**Then:**

- Submission status changes to APPROVED
- Points calculated and credited to student's point ledger within 60 seconds
- Badge eligibility evaluated; badges awarded if criteria met
- Student receives in-app and email notification with points earned
- Submission removed from faculty queue
- HOD dashboard reflects new achievement within 15-minute cache refresh

---

## AC-VER-002 — Rejection

**Given** a faculty member reviewing a submission,
**When** they select a rejection reason and click "Reject",
**Then:**

- Submission status changes to REJECTED
- No points awarded
- Student receives notification with rejection reason and faculty comment
- Submission appears in student's history with REJECTED status
- Rejection recorded in audit log with faculty ID, reason, and timestamp

---

## AC-VER-003 — Clarification Request

**Given** a faculty member reviewing a submission,
**When** they enter a clarification question and click "Request Clarification",
**Then:**

- Submission status changes to CLARIFICATION_REQUESTED
- Student receives notification with faculty's question
- A 7-day countdown begins for the student to resubmit
- Faculty queue item marked as "Awaiting Resubmission"
- On Day 7: Student receives final reminder
- On Day 14 with no resubmission: Status changes to EXPIRED; student and faculty notified

---

## AC-ESC-001 — Faculty Escalation

**Given** a faculty member on a submission in their queue,
**When** they provide a reason (>= 50 chars) and click "Escalate to HOD",
**Then:**

- Submission flagged as ESCALATED
- Submission moves to HOD's escalation inbox
- HOD receives in-app and email notification
- Faculty queue item marked "Escalated" and removed from active queue
- Escalation event recorded in audit log

---

## AC-LDR-001 — Leaderboard

**Given** a student on the leaderboard page,
**When** the page loads,
**Then:**

- Top 100 students displayed with rank, partial USN, batch, and points
- Rank change indicators (up/down/neutral) visible compared to previous week
- Student's own rank shown in a sticky footer even if not in top 100
- Leaderboard data is no older than 15 minutes (timestamp shown)

---

## AC-REP-001 — Report Generation

**Given** an HOD on the Report Builder page,
**When** they select "Department Achievement Summary," set a date range, and click "Generate",
**Then:**

- For datasets < 500 rows: PDF download starts within 10 seconds
- For datasets >= 500 rows: Loading indicator shown; user notified via in-app and email when ready
- Report contains data only within selected date range
- Report includes: department name, date range, total submissions, total approved, breakdown by category and batch, top 10 students

---

## AC-NOT-001 — Notifications

**Given** any notification-triggering event occurs,
**When** the event is processed,
**Then:**

- In-app notification appears in notification center within 30 seconds
- Email notification sent within 5 minutes
- Notification uses correct template with all variables correctly substituted
- Unread count in navigation bell icon increments

---

## AC-AUD-001 — Audit Log

**Given** any state-changing action is performed by any user,
**When** the action completes,
**Then:**

- Audit log entry created within 1 second
- Entry contains: actor_id, actor_role, action type, entity type, entity ID, timestamp, IP address
- Entry cannot be modified or deleted through any application interface
- Entry is visible to Admin in the Audit Log Viewer

---

## AC-AUTH-001 — Account Lockout

**Given** a user attempting to log in,
**When** they enter an incorrect password 5 consecutive times,
**Then:**

- Account locked for 30 minutes
- Notification email sent to the account's email address
- User sees message: "Account locked. Too many failed attempts. Try again after 30 minutes."
- After 30 minutes, account automatically unlocked

---

# 10. Business Rules

| ID     | Rule                                                                                                                                                             |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BR-001 | A student can only submit achievements for themselves. Collaborative achievements allow tagging, but each collaborator must individually submit their own claim. |
| BR-002 | Achievement dates must be within the current or immediately preceding semester. Older achievements require HOD approval exception.                               |
| BR-003 | An achievement can only be submitted once. Duplicate detection flags potential duplicates.                                                                       |
| BR-004 | Points are only awarded upon verified (Approved) status. Draft, Pending, Under Review, and Rejected submissions carry no points.                                 |
| BR-005 | A rejected submission can be resubmitted up to 3 times. After the 3rd rejection, the student must contact the HOD.                                               |
| BR-006 | Points formula: `Points = Base x Level_Multiplier x HOD_Multiplier`                                                                                              |
| BR-007 | Badges, once awarded, are permanent. Only Admin can revoke a badge, and all revocations are audit-logged.                                                        |
| BR-008 | Leaderboard ranking is based solely on verified (Approved) achievement points for the current active semester by default.                                        |
| BR-009 | Faculty may not approve or reject submissions from students they have a direct conflict of interest with. Admin must reassign.                                   |
| BR-010 | HOD can directly approve or reject an escalated submission without routing back through faculty.                                                                 |
| BR-011 | If a faculty member's SLA is breached by 2 or more business days, the submission is automatically escalated to the HOD.                                          |
| BR-012 | Achievement category changes (point value updates) do not retroactively affect already-verified achievements.                                                    |
| BR-013 | Users in Pending Approval state cannot access any platform features until their account is activated.                                                            |
| BR-014 | Administrators cannot view the content of individual student achievement documents except in a documented, audit-logged exception review process.                |
| BR-015 | All report exports are watermarked with the generating user's name, role, and timestamp (PDF only).                                                              |

---

# 11. Validation Rules

## 11.1 Authentication

| Field                 | Validation Rule                                                                       |
| --------------------- | ------------------------------------------------------------------------------------- |
| Email                 | Valid email format; must match institution domain whitelist                           |
| Password              | Minimum 8 characters; at least 1 uppercase, 1 lowercase, 1 digit, 1 special character |
| Password Confirmation | Must exactly match password field                                                     |
| USN                   | Must match VTU format: e.g., `1AT22CS001`                                             |

## 11.2 Achievement Submission

| Field                | Validation Rule                                                                         |
| -------------------- | --------------------------------------------------------------------------------------- |
| Achievement Title    | Required; 5-150 characters; no special characters except `(),-.:`                       |
| Category             | Required; must be a valid active category ID                                            |
| Level                | Required; one of: INTERNATIONAL, NATIONAL, STATE, UNIVERSITY, COLLEGE, DEPARTMENT       |
| Achievement Date     | Required; valid date; cannot be in the future; must be within 18 months of today        |
| Issuing Organization | Required; 3-200 characters                                                              |
| Description          | Required; 20-1000 characters                                                            |
| Supporting Documents | At least 1 file; each file <= 10MB; accepted types: PDF, JPG, PNG, MP4; maximum 5 files |
| External URL         | Optional; must be valid https URL                                                       |

## 11.3 User Management

| Field         | Validation Rule                                                   |
| ------------- | ----------------------------------------------------------------- |
| Full Name     | Required; 2-100 characters; letters and spaces only               |
| Phone Number  | Optional; valid Indian mobile format: +91 followed by 10 digits   |
| Bio           | Optional; maximum 500 characters                                  |
| Profile Photo | Optional; JPG or PNG only; maximum 5MB; auto-resized to 512x512px |

## 11.4 Configuration

| Field                   | Validation Rule                                                              |
| ----------------------- | ---------------------------------------------------------------------------- |
| Category Name           | Required; unique; 3-80 characters                                            |
| Category Point Value    | Required; integer between 1 and 1000                                         |
| Level Multiplier        | Decimal number between 0.1 and 5.0                                           |
| Badge Point Threshold   | Integer >= 0                                                                 |
| SLA Threshold           | Integer between 1 and 30 (business days)                                     |
| Semester Start/End Date | Valid dates; end must be after start; cannot overlap with existing semesters |

---

# 12. Error Handling

## 12.1 Error Response Standard

All API errors follow this consistent JSON structure:

```json
{
  "error": {
    "code": "SUBMISSION_NOT_FOUND",
    "message": "The requested submission could not be found.",
    "details": "No submission with ID sub_abc123 exists in this department.",
    "timestamp": "2026-08-07T02:05:00Z",
    "requestId": "req_xyz789"
  }
}
```

## 12.2 HTTP Status Code Mapping

| Status Code | Usage                                                                   |
| ----------- | ----------------------------------------------------------------------- |
| 200         | Success with response body                                              |
| 201         | Resource created successfully                                           |
| 204         | Success with no response body                                           |
| 400         | Bad Request — validation error; includes field-level errors             |
| 401         | Unauthorized — not authenticated; redirect to login                     |
| 403         | Forbidden — authenticated but insufficient permissions                  |
| 404         | Not Found — resource does not exist or not visible to requesting role   |
| 409         | Conflict — duplicate resource; includes ID of conflicting record        |
| 422         | Unprocessable Entity — semantically invalid request                     |
| 429         | Too Many Requests — rate limit exceeded; includes Retry-After header    |
| 500         | Internal Server Error — logged to monitoring; request ID included       |
| 503         | Service Unavailable — maintenance mode or downstream dependency failure |

## 12.3 Client-Side Error Handling

- All form validation errors displayed inline beside the relevant field
- Toast notification shown for async operation failures
- Network errors show banner: "You appear to be offline. Please check your connection."
- After 3 failed API retries, persistent error banner with "Contact Support" link
- React error boundaries catch component-level rendering errors and display fallback UI

## 12.4 Error Logging

- All 500-level errors logged to monitoring service (e.g., Sentry) with full stack trace
- Error alerts sent to development team for errors with frequency > 5 occurrences in 5 minutes
- Client-side JavaScript errors captured via Sentry browser SDK

## 12.5 Background Job Failures

- Failed background jobs retried up to 3 times with exponential backoff
- After 3 failures, job marked FAILED and alert sent to Admin
- Users relying on a failed job are notified and asked to retry

---

# 13. Permissions Matrix

| Action / Resource                       | Student     | Faculty        | HOD              | Admin              |
| --------------------------------------- | ----------- | -------------- | ---------------- | ------------------ |
| **Authentication**                      |             |                |                  |                    |
| Login                                   | Yes         | Yes            | Yes              | Yes                |
| Change own password                     | Yes         | Yes            | Yes              | Yes                |
| Force-reset another user's password     | No          | No             | No               | Yes                |
| Enable/Disable MFA (own)                | Optional    | Optional       | Required         | Required           |
| Revoke another user's session           | No          | No             | No               | Yes                |
| **User Management**                     |             |                |                  |                    |
| View own profile                        | Yes         | Yes            | Yes              | Yes                |
| Edit own profile                        | Yes         | Yes            | Yes              | Yes                |
| View other users' profiles (department) | No          | Mentees only   | All (dept)       | All                |
| Create user accounts                    | No          | No             | No               | Yes                |
| Edit user accounts                      | No          | No             | No               | Yes                |
| Deactivate user accounts                | No          | No             | No               | Yes                |
| Assign/Change roles                     | No          | No             | No               | Yes                |
| Bulk import users (CSV)                 | No          | No             | No               | Yes                |
| Bulk export users (CSV)                 | No          | No             | Yes (dept)       | Yes                |
| **Submissions**                         |             |                |                  |                    |
| Submit achievement                      | Yes         | No             | No               | No                 |
| View own submissions                    | Yes         | N/A            | N/A              | N/A                |
| View mentee submissions                 | No          | Yes            | Yes              | Yes                |
| View all dept submissions               | No          | No             | Yes              | Yes                |
| Approve submission                      | No          | Yes (assigned) | Yes (escalated)  | No                 |
| Reject submission                       | No          | Yes (assigned) | Yes (escalated)  | No                 |
| Request clarification                   | No          | Yes (assigned) | Yes (escalated)  | No                 |
| Escalate submission                     | No          | Yes            | N/A              | No                 |
| Re-assign submission                    | No          | No             | Yes              | Yes                |
| Delete submission                       | No          | No             | No               | Yes (audit logged) |
| **Points and Rewards**                  |             |                |                  |                    |
| View own points                         | Yes         | N/A            | N/A              | N/A                |
| View any student's points               | No          | Mentees only   | All (dept)       | All                |
| Manual point adjustment                 | No          | No             | Yes (dept)       | Yes                |
| Configure point values                  | No          | No             | Multipliers only | Yes                |
| **Badges**                              |             |                |                  |                    |
| View own badges                         | Yes         | N/A            | N/A              | N/A                |
| View any student's badges               | Leaderboard | Mentees        | All (dept)       | All                |
| Create/Edit badge rules                 | No          | No             | No               | Yes                |
| Revoke badge                            | No          | No             | No               | Yes (audit logged) |
| **Leaderboard**                         |             |                |                  |                    |
| View semester leaderboard               | Yes         | Yes            | Yes              | Yes                |
| View all-time leaderboard               | Yes         | Yes            | Yes              | Yes                |
| View batch leaderboard                  | Yes         | Yes            | Yes              | Yes                |
| Opt out of leaderboard                  | Yes         | N/A            | N/A              | N/A                |
| **Analytics**                           |             |                |                  |                    |
| View personal analytics                 | Yes         | N/A            | N/A              | N/A                |
| View mentee cohort analytics            | No          | Yes            | Yes              | Yes                |
| View department analytics               | No          | No             | Yes              | Yes                |
| View platform-wide analytics            | No          | No             | No               | Yes                |
| **Reports**                             |             |                |                  |                    |
| Export own portfolio (PDF)              | Yes         | N/A            | N/A              | N/A                |
| Export department reports               | No          | No             | Yes              | Yes                |
| Schedule recurring reports              | No          | No             | Yes              | Yes                |
| Export audit log                        | No          | No             | No               | Yes                |
| **Configuration**                       |             |                |                  |                    |
| Manage achievement categories           | No          | No             | No               | Yes                |
| Manage academic years/semesters         | No          | No             | No               | Yes                |
| Manage notification templates           | No          | No             | No               | Yes                |
| Manage departments                      | No          | No             | No               | Yes                |
| Manage system settings                  | No          | No             | No               | Yes                |
| Manage dept point multipliers           | No          | No             | Yes              | Yes                |
| **Audit Logs**                          |             |                |                  |                    |
| View full audit log                     | No          | No             | No               | Yes                |
| Export audit log                        | No          | No             | No               | Yes                |

---

# 14. API Overview

All endpoints follow RESTful conventions.
Base URL: `/api/v1`
All endpoints (except `/auth/*`) require a valid session cookie or Bearer token.

---

## 14.1 Authentication `/api/v1/auth`

| Method | Endpoint                    | Description                            | Roles         |
| ------ | --------------------------- | -------------------------------------- | ------------- |
| POST   | `/auth/register`            | Register new user                      | Public        |
| POST   | `/auth/login`               | Authenticate user                      | Public        |
| POST   | `/auth/logout`              | Invalidate session                     | Authenticated |
| POST   | `/auth/forgot-password`     | Send password reset email              | Public        |
| POST   | `/auth/reset-password`      | Reset password via token               | Public        |
| POST   | `/auth/change-password`     | Change password                        | Authenticated |
| POST   | `/auth/verify-email`        | Verify email from link                 | Public        |
| GET    | `/auth/me`                  | Return current user's profile and role | Authenticated |
| GET    | `/auth/sessions`            | List all active sessions               | Authenticated |
| DELETE | `/auth/sessions/:sessionId` | Revoke a specific session              | Authenticated |
| POST   | `/auth/mfa/setup`           | Initialize MFA setup                   | Authenticated |
| POST   | `/auth/mfa/verify`          | Verify TOTP and enable MFA             | Authenticated |
| DELETE | `/auth/mfa`                 | Disable MFA                            | Authenticated |

---

## 14.2 Users `/api/v1/users`

| Method | Endpoint                       | Description                            | Roles                                |
| ------ | ------------------------------ | -------------------------------------- | ------------------------------------ |
| GET    | `/users`                       | List all users (paginated, filterable) | Admin                                |
| POST   | `/users`                       | Create a new user                      | Admin                                |
| GET    | `/users/:userId`               | Get user detail                        | Admin, HOD (dept), Faculty (mentees) |
| PATCH  | `/users/:userId`               | Update user details                    | Admin (any), Self (own)              |
| DELETE | `/users/:userId`               | Deactivate user                        | Admin                                |
| POST   | `/users/bulk-import`           | Bulk import via CSV                    | Admin                                |
| GET    | `/users/export`                | Export user list as CSV                | Admin                                |
| GET    | `/users/:userId/login-history` | Get login history                      | Admin                                |

---

## 14.3 Submissions `/api/v1/submissions`

| Method | Endpoint                                      | Description                               | Roles               |
| ------ | --------------------------------------------- | ----------------------------------------- | ------------------- |
| POST   | `/submissions`                                | Create new achievement submission         | Student             |
| GET    | `/submissions`                                | List submissions (scoped by role/filters) | All authenticated   |
| GET    | `/submissions/:submissionId`                  | Get full submission detail                | Scoped by role      |
| PATCH  | `/submissions/:submissionId`                  | Update draft submission                   | Student (own draft) |
| DELETE | `/submissions/:submissionId`                  | Delete submission                         | Admin only          |
| POST   | `/submissions/:submissionId/resubmit`         | Resubmit after clarification              | Student (own)       |
| POST   | `/submissions/:submissionId/documents`        | Upload documents                          | Student (own draft) |
| DELETE | `/submissions/:submissionId/documents/:docId` | Remove document from draft                | Student (own draft) |

---

## 14.4 Verification `/api/v1/verifications`

| Method | Endpoint                                | Description                     | Roles              |
| ------ | --------------------------------------- | ------------------------------- | ------------------ |
| GET    | `/verifications/queue`                  | Get assigned verification queue | Faculty            |
| POST   | `/verifications/:submissionId/approve`  | Approve a submission            | Faculty (assigned) |
| POST   | `/verifications/:submissionId/reject`   | Reject a submission             | Faculty (assigned) |
| POST   | `/verifications/:submissionId/clarify`  | Request clarification           | Faculty (assigned) |
| POST   | `/verifications/:submissionId/escalate` | Escalate to HOD                 | Faculty (assigned) |

---

## 14.5 Escalations `/api/v1/escalations`

| Method | Endpoint                              | Description                         | Roles      |
| ------ | ------------------------------------- | ----------------------------------- | ---------- |
| GET    | `/escalations`                        | List escalations                    | HOD, Admin |
| GET    | `/escalations/:escalationId`          | Get escalation detail               | HOD, Admin |
| POST   | `/escalations/:escalationId/approve`  | HOD approves escalated submission   | HOD        |
| POST   | `/escalations/:escalationId/reject`   | HOD rejects escalated submission    | HOD        |
| POST   | `/escalations/:escalationId/reassign` | HOD re-assigns to different faculty | HOD        |
| POST   | `/escalations/:escalationId/return`   | HOD returns to original faculty     | HOD        |

---

## 14.6 Points `/api/v1/points`

| Method | Endpoint                 | Description                  | Roles                                      |
| ------ | ------------------------ | ---------------------------- | ------------------------------------------ |
| GET    | `/points/:userId`        | Get point balance for a user | Self, Faculty (mentees), HOD (dept), Admin |
| GET    | `/points/:userId/ledger` | Get full point ledger        | Self, HOD (dept), Admin                    |
| POST   | `/points/:userId/adjust` | Manual point adjustment      | HOD (dept), Admin                          |

---

## 14.7 Badges `/api/v1/badges`

| Method | Endpoint                        | Description                 | Roles             |
| ------ | ------------------------------- | --------------------------- | ----------------- |
| GET    | `/badges`                       | List all active badges      | All authenticated |
| POST   | `/badges`                       | Create new badge            | Admin             |
| PATCH  | `/badges/:badgeId`              | Update badge                | Admin             |
| DELETE | `/badges/:badgeId`              | Deactivate badge            | Admin             |
| GET    | `/badges/user/:userId`          | Get badges earned by a user | All authenticated |
| DELETE | `/badges/user/:userId/:badgeId` | Revoke badge from user      | Admin             |

---

## 14.8 Leaderboard `/api/v1/leaderboard`

| Method | Endpoint                  | Description                                                                | Roles             |
| ------ | ------------------------- | -------------------------------------------------------------------------- | ----------------- |
| GET    | `/leaderboard`            | Get leaderboard (scope via query params: `?semester=X&batch=Y&category=Z`) | All authenticated |
| GET    | `/leaderboard/me`         | Get current user's own rank                                                | Student           |
| GET    | `/leaderboard/honor-roll` | Get honor roll records                                                     | All authenticated |

---

## 14.9 Analytics `/api/v1/analytics`

| Method | Endpoint                           | Description                           | Roles      |
| ------ | ---------------------------------- | ------------------------------------- | ---------- |
| GET    | `/analytics/department`            | Department-level KPI summary          | HOD, Admin |
| GET    | `/analytics/department/categories` | Achievement breakdown by category     | HOD, Admin |
| GET    | `/analytics/department/batches`    | Batch comparison data                 | HOD, Admin |
| GET    | `/analytics/department/timeline`   | Submission timeline chart data        | HOD, Admin |
| GET    | `/analytics/department/faculty`    | Faculty activity summary              | HOD, Admin |
| GET    | `/analytics/department/at-risk`    | Students with 0 verified achievements | HOD, Admin |
| GET    | `/analytics/platform`              | Platform-wide analytics               | Admin only |

---

## 14.10 Reports `/api/v1/reports`

| Method | Endpoint                        | Description                         | Roles      |
| ------ | ------------------------------- | ----------------------------------- | ---------- |
| POST   | `/reports/generate`             | Initiate report generation          | HOD, Admin |
| GET    | `/reports/:reportId/status`     | Poll report generation status       | HOD, Admin |
| GET    | `/reports/:reportId/download`   | Download generated report           | HOD, Admin |
| GET    | `/reports`                      | List previously generated reports   | HOD, Admin |
| POST   | `/reports/schedule`             | Create a scheduled recurring report | HOD, Admin |
| GET    | `/reports/schedule`             | List scheduled reports              | HOD, Admin |
| DELETE | `/reports/schedule/:scheduleId` | Delete a scheduled report           | HOD, Admin |

---

## 14.11 Notifications `/api/v1/notifications`

| Method | Endpoint                              | Description                            | Roles             |
| ------ | ------------------------------------- | -------------------------------------- | ----------------- |
| GET    | `/notifications`                      | Get notification list for current user | All authenticated |
| PATCH  | `/notifications/:notificationId/read` | Mark a notification as read            | Self only         |
| POST   | `/notifications/read-all`             | Mark all notifications as read         | Self only         |
| DELETE | `/notifications/:notificationId`      | Archive/Delete a notification          | Self only         |
| GET    | `/notifications/preferences`          | Get notification preferences           | Self only         |
| PATCH  | `/notifications/preferences`          | Update notification preferences        | Self only         |

---

## 14.12 Audit Logs `/api/v1/audit`

| Method | Endpoint             | Description                          | Roles |
| ------ | -------------------- | ------------------------------------ | ----- |
| GET    | `/audit/logs`        | Get paginated audit log (filterable) | Admin |
| GET    | `/audit/logs/export` | Export audit log as CSV/JSON         | Admin |

---

## 14.13 Configuration `/api/v1/config`

| Method | Endpoint                                     | Description                  | Roles                 |
| ------ | -------------------------------------------- | ---------------------------- | --------------------- |
| GET    | `/config/categories`                         | List achievement categories  | All authenticated     |
| POST   | `/config/categories`                         | Create achievement category  | Admin                 |
| PATCH  | `/config/categories/:categoryId`             | Update achievement category  | Admin                 |
| DELETE | `/config/categories/:categoryId`             | Archive achievement category | Admin                 |
| GET    | `/config/semesters`                          | List semesters               | All authenticated     |
| POST   | `/config/semesters`                          | Create semester              | Admin                 |
| PATCH  | `/config/semesters/:semesterId`              | Update semester              | Admin                 |
| GET    | `/config/departments`                        | List departments             | All authenticated     |
| POST   | `/config/departments`                        | Create department            | Admin                 |
| PATCH  | `/config/departments/:departmentId`          | Update department settings   | Admin, HOD (own dept) |
| GET    | `/config/notification-templates`             | List notification templates  | Admin                 |
| PATCH  | `/config/notification-templates/:templateId` | Update template              | Admin                 |
| GET    | `/config/system`                             | Get system settings          | Admin                 |
| PATCH  | `/config/system`                             | Update system settings       | Admin                 |

---

# 15. Database Overview

Implementation uses **PostgreSQL 16** via **Prisma ORM**.

---

## 15.1 `users`

| Column              | Type         | Constraints             | Notes                        |
| ------------------- | ------------ | ----------------------- | ---------------------------- |
| id                  | UUID         | PK                      |                              |
| name                | VARCHAR(100) | NOT NULL                |                              |
| email               | VARCHAR(255) | NOT NULL, UNIQUE        | Institutional email          |
| email_verified      | BOOLEAN      | NOT NULL, DEFAULT false |                              |
| usn                 | VARCHAR(15)  | UNIQUE, NULLABLE        | Students only                |
| employee_id         | VARCHAR(20)  | UNIQUE, NULLABLE        | Faculty/HOD/Admin            |
| password_hash       | VARCHAR(255) | NOT NULL                | bcrypt                       |
| role                | ENUM         | NOT NULL                | STUDENT, FACULTY, HOD, ADMIN |
| department_id       | UUID         | FK -> departments       |                              |
| batch_year          | INTEGER      | NULLABLE                | Students only                |
| profile_photo_url   | TEXT         | NULLABLE                |                              |
| bio                 | TEXT         | NULLABLE                | Max 500 chars                |
| phone               | VARCHAR(15)  | NULLABLE                |                              |
| linkedin_url        | TEXT         | NULLABLE                |                              |
| github_url          | TEXT         | NULLABLE                |                              |
| is_active           | BOOLEAN      | NOT NULL, DEFAULT true  | Soft delete                  |
| mfa_enabled         | BOOLEAN      | NOT NULL, DEFAULT false |                              |
| mfa_secret          | VARCHAR(64)  | NULLABLE                | Encrypted TOTP secret        |
| portfolio_public    | BOOLEAN      | NOT NULL, DEFAULT true  |                              |
| leaderboard_visible | BOOLEAN      | NOT NULL, DEFAULT true  |                              |
| created_at          | TIMESTAMPTZ  | NOT NULL, DEFAULT now() |                              |
| updated_at          | TIMESTAMPTZ  | NOT NULL                |                              |

---

## 15.2 `departments`

| Column                | Type         | Constraints            | Notes                                  |
| --------------------- | ------------ | ---------------------- | -------------------------------------- |
| id                    | UUID         | PK                     |                                        |
| name                  | VARCHAR(100) | NOT NULL, UNIQUE       | e.g., "Computer Science & Engineering" |
| code                  | VARCHAR(10)  | NOT NULL, UNIQUE       | e.g., "CSE"                            |
| hod_id                | UUID         | FK -> users            |                                        |
| verification_sla_days | INTEGER      | NOT NULL, DEFAULT 5    |                                        |
| leaderboard_public    | BOOLEAN      | NOT NULL, DEFAULT true |                                        |
| is_active             | BOOLEAN      | NOT NULL, DEFAULT true |                                        |
| created_at            | TIMESTAMPTZ  | NOT NULL               |                                        |
| updated_at            | TIMESTAMPTZ  | NOT NULL               |                                        |

---

## 15.3 `faculty_mentee_assignments`

| Column           | Type        | Constraints          | Notes |
| ---------------- | ----------- | -------------------- | ----- |
| id               | UUID        | PK                   |       |
| faculty_id       | UUID        | FK -> users          |       |
| student_id       | UUID        | FK -> users          |       |
| department_id    | UUID        | FK -> departments    |       |
| academic_year_id | UUID        | FK -> academic_years |       |
| assigned_at      | TIMESTAMPTZ | NOT NULL             |       |

---

## 15.4 `academic_years`

| Column     | Type        | Constraints             | Notes                     |
| ---------- | ----------- | ----------------------- | ------------------------- |
| id         | UUID        | PK                      |                           |
| label      | VARCHAR(20) | NOT NULL, UNIQUE        | e.g., "2025-2026"         |
| start_date | DATE        | NOT NULL                |                           |
| end_date   | DATE        | NOT NULL                |                           |
| is_active  | BOOLEAN     | NOT NULL, DEFAULT false | Only one active at a time |
| created_at | TIMESTAMPTZ | NOT NULL                |                           |

---

## 15.5 `semesters`

| Column           | Type        | Constraints             | Notes                     |
| ---------------- | ----------- | ----------------------- | ------------------------- |
| id               | UUID        | PK                      |                           |
| academic_year_id | UUID        | FK -> academic_years    |                           |
| label            | VARCHAR(30) | NOT NULL                | e.g., "Odd Semester 2025" |
| start_date       | DATE        | NOT NULL                |                           |
| end_date         | DATE        | NOT NULL                |                           |
| is_active        | BOOLEAN     | NOT NULL, DEFAULT false | Only one active at a time |
| is_archived      | BOOLEAN     | NOT NULL, DEFAULT false |                           |
| created_at       | TIMESTAMPTZ | NOT NULL                |                           |

---

## 15.6 `achievement_categories`

| Column                      | Type        | Constraints                 | Notes               |
| --------------------------- | ----------- | --------------------------- | ------------------- |
| id                          | UUID        | PK                          |                     |
| name                        | VARCHAR(80) | NOT NULL, UNIQUE            |                     |
| description                 | TEXT        | NULLABLE                    |                     |
| icon                        | VARCHAR(50) | NULLABLE                    |                     |
| color_hex                   | VARCHAR(7)  | NULLABLE                    | e.g., #4F46E5       |
| base_points                 | INTEGER     | NOT NULL                    | Default point value |
| department_id               | UUID        | FK -> departments, NULLABLE | NULL = global       |
| default_verifier_faculty_id | UUID        | FK -> users, NULLABLE       |                     |
| is_active                   | BOOLEAN     | NOT NULL, DEFAULT true      |                     |
| created_at                  | TIMESTAMPTZ | NOT NULL                    |                     |
| updated_at                  | TIMESTAMPTZ | NOT NULL                    |                     |

---

## 15.7 `category_checklist_items`

| Column        | Type         | Constraints                  | Notes               |
| ------------- | ------------ | ---------------------------- | ------------------- |
| id            | UUID         | PK                           |                     |
| category_id   | UUID         | FK -> achievement_categories |                     |
| label         | VARCHAR(200) | NOT NULL                     | Checklist item text |
| is_required   | BOOLEAN      | NOT NULL, DEFAULT true       |                     |
| display_order | INTEGER      | NOT NULL                     |                     |

---

## 15.8 `submissions`

| Column               | Type         | Constraints                  | Notes                                                                                             |
| -------------------- | ------------ | ---------------------------- | ------------------------------------------------------------------------------------------------- |
| id                   | UUID         | PK                           |                                                                                                   |
| student_id           | UUID         | FK -> users                  |                                                                                                   |
| category_id          | UUID         | FK -> achievement_categories |                                                                                                   |
| title                | VARCHAR(150) | NOT NULL                     |                                                                                                   |
| description          | TEXT         | NOT NULL                     |                                                                                                   |
| issuing_organization | VARCHAR(200) | NOT NULL                     |                                                                                                   |
| level                | ENUM         | NOT NULL                     | INTERNATIONAL, NATIONAL, STATE, UNIVERSITY, COLLEGE, DEPARTMENT                                   |
| position             | VARCHAR(100) | NULLABLE                     |                                                                                                   |
| achievement_date     | DATE         | NOT NULL                     |                                                                                                   |
| external_url         | TEXT         | NULLABLE                     |                                                                                                   |
| status               | ENUM         | NOT NULL                     | DRAFT, SUBMITTED, UNDER_REVIEW, CLARIFICATION_REQUESTED, RESUBMITTED, APPROVED, REJECTED, EXPIRED |
| assigned_verifier_id | UUID         | FK -> users, NULLABLE        |                                                                                                   |
| department_id        | UUID         | FK -> departments            |                                                                                                   |
| semester_id          | UUID         | FK -> semesters              |                                                                                                   |
| points_awarded       | INTEGER      | NULLABLE                     | Set on approval                                                                                   |
| resubmission_count   | INTEGER      | NOT NULL, DEFAULT 0          |                                                                                                   |
| is_escalated         | BOOLEAN      | NOT NULL, DEFAULT false      |                                                                                                   |
| submitted_at         | TIMESTAMPTZ  | NULLABLE                     |                                                                                                   |
| reviewed_at          | TIMESTAMPTZ  | NULLABLE                     |                                                                                                   |
| sla_deadline         | TIMESTAMPTZ  | NULLABLE                     |                                                                                                   |
| created_at           | TIMESTAMPTZ  | NOT NULL                     |                                                                                                   |
| updated_at           | TIMESTAMPTZ  | NOT NULL                     |                                                                                                   |

---

## 15.9 `submission_documents`

| Column          | Type         | Constraints       | Notes                 |
| --------------- | ------------ | ----------------- | --------------------- |
| id              | UUID         | PK                |                       |
| submission_id   | UUID         | FK -> submissions |                       |
| file_name       | VARCHAR(255) | NOT NULL          |                       |
| file_url        | TEXT         | NOT NULL          | Supabase Storage path |
| file_type       | VARCHAR(50)  | NOT NULL          | MIME type             |
| file_size_bytes | INTEGER      | NOT NULL          |                       |
| uploaded_at     | TIMESTAMPTZ  | NOT NULL          |                       |

---

## 15.10 `submission_collaborators`

| Column        | Type        | Constraints       | Notes |
| ------------- | ----------- | ----------------- | ----- |
| id            | UUID        | PK                |       |
| submission_id | UUID        | FK -> submissions |       |
| student_id    | UUID        | FK -> users       |       |
| added_at      | TIMESTAMPTZ | NOT NULL          |       |

---

## 15.11 `verification_events`

| Column                | Type        | Constraints       | Notes                                                                                              |
| --------------------- | ----------- | ----------------- | -------------------------------------------------------------------------------------------------- |
| id                    | UUID        | PK                |                                                                                                    |
| submission_id         | UUID        | FK -> submissions |                                                                                                    |
| actor_id              | UUID        | FK -> users       |                                                                                                    |
| action                | ENUM        | NOT NULL          | ASSIGNED, APPROVED, REJECTED, CLARIFICATION_REQUESTED, RESUBMITTED, ESCALATED, REASSIGNED, EXPIRED |
| comment               | TEXT        | NULLABLE          |                                                                                                    |
| rejection_reason_code | VARCHAR(50) | NULLABLE          |                                                                                                    |
| checklist_state       | JSONB       | NULLABLE          | Snapshot of checklist at time of action                                                            |
| created_at            | TIMESTAMPTZ | NOT NULL          |                                                                                                    |

---

## 15.12 `escalations`

| Column           | Type        | Constraints             | Notes                                    |
| ---------------- | ----------- | ----------------------- | ---------------------------------------- |
| id               | UUID        | PK                      |                                          |
| submission_id    | UUID        | FK -> submissions       |                                          |
| escalated_by_id  | UUID        | FK -> users             | Faculty who escalated                    |
| escalated_to_id  | UUID        | FK -> users             | HOD                                      |
| reason           | TEXT        | NOT NULL                |                                          |
| is_auto          | BOOLEAN     | NOT NULL, DEFAULT false | Auto-escalated by SLA breach             |
| status           | ENUM        | NOT NULL                | PENDING, RESOLVED                        |
| resolved_action  | ENUM        | NULLABLE                | APPROVED, REJECTED, REASSIGNED, RETURNED |
| resolved_by_id   | UUID        | FK -> users, NULLABLE   |                                          |
| resolved_at      | TIMESTAMPTZ | NULLABLE                |                                          |
| hod_sla_deadline | TIMESTAMPTZ | NOT NULL                |                                          |
| created_at       | TIMESTAMPTZ | NOT NULL                |                                          |

---

## 15.13 `point_ledger`

| Column           | Type        | Constraints       | Notes                                |
| ---------------- | ----------- | ----------------- | ------------------------------------ |
| id               | UUID        | PK                |                                      |
| user_id          | UUID        | FK -> users       |                                      |
| department_id    | UUID        | FK -> departments |                                      |
| semester_id      | UUID        | FK -> semesters   |                                      |
| transaction_type | ENUM        | NOT NULL          | EARNED, ADJUSTED, REDEEMED           |
| amount           | INTEGER     | NOT NULL          | Positive or negative                 |
| reference_type   | VARCHAR(50) | NOT NULL          | e.g., submission, manual, redemption |
| reference_id     | UUID        | NULLABLE          |                                      |
| note             | TEXT        | NULLABLE          | Required for manual adjustments      |
| actor_id         | UUID        | FK -> users       | System or human actor                |
| created_at       | TIMESTAMPTZ | NOT NULL          |                                      |

---

## 15.14 `badges`

| Column       | Type         | Constraints            | Notes                                              |
| ------------ | ------------ | ---------------------- | -------------------------------------------------- |
| id           | UUID         | PK                     |                                                    |
| name         | VARCHAR(100) | NOT NULL, UNIQUE       |                                                    |
| description  | TEXT         | NOT NULL               |                                                    |
| icon_url     | TEXT         | NOT NULL               | Supabase Storage URL                               |
| type         | ENUM         | NOT NULL               | ACHIEVEMENT, MILESTONE, ACTIVITY, SEMESTER, STREAK |
| trigger_rule | JSONB        | NOT NULL               | Rule definition                                    |
| is_active    | BOOLEAN      | NOT NULL, DEFAULT true |                                                    |
| created_at   | TIMESTAMPTZ  | NOT NULL               |                                                    |
| updated_at   | TIMESTAMPTZ  | NOT NULL               |                                                    |

**trigger_rule example:**

```json
{ "type": "POINT_THRESHOLD", "threshold": 500, "category_filter": null }
```

---

## 15.15 `user_badges`

| Column        | Type        | Constraints           | Notes |
| ------------- | ----------- | --------------------- | ----- |
| id            | UUID        | PK                    |       |
| user_id       | UUID        | FK -> users           |       |
| badge_id      | UUID        | FK -> badges          |       |
| earned_at     | TIMESTAMPTZ | NOT NULL              |       |
| revoked_at    | TIMESTAMPTZ | NULLABLE              |       |
| revoked_by_id | UUID        | FK -> users, NULLABLE |       |
| revoke_reason | TEXT        | NULLABLE              |       |

---

## 15.16 `notifications`

| Column     | Type         | Constraints             | Notes                      |
| ---------- | ------------ | ----------------------- | -------------------------- |
| id         | UUID         | PK                      |                            |
| user_id    | UUID         | FK -> users             |                            |
| event_type | VARCHAR(80)  | NOT NULL                | e.g., SUBMISSION_APPROVED  |
| title      | VARCHAR(200) | NOT NULL                |                            |
| body       | TEXT         | NOT NULL                |                            |
| link_url   | TEXT         | NULLABLE                | Deep link to relevant page |
| is_read    | BOOLEAN      | NOT NULL, DEFAULT false |                            |
| read_at    | TIMESTAMPTZ  | NULLABLE                |                            |
| created_at | TIMESTAMPTZ  | NOT NULL                |                            |
| expires_at | TIMESTAMPTZ  | NOT NULL                | 90 days from created_at    |

---

## 15.17 `audit_logs`

| Column         | Type         | Constraints                 | Notes                    |
| -------------- | ------------ | --------------------------- | ------------------------ |
| id             | UUID         | PK                          |                          |
| timestamp      | TIMESTAMPTZ  | NOT NULL, DEFAULT now()     |                          |
| actor_id       | UUID         | FK -> users, NULLABLE       | NULL for system actions  |
| actor_role     | VARCHAR(20)  | NOT NULL                    |                          |
| action         | VARCHAR(100) | NOT NULL                    | Controlled vocabulary    |
| entity_type    | VARCHAR(50)  | NOT NULL                    |                          |
| entity_id      | UUID         | NULLABLE                    |                          |
| department_id  | UUID         | FK -> departments, NULLABLE |                          |
| ip_address     | INET         | NULLABLE                    |                          |
| user_agent     | TEXT         | NULLABLE                    |                          |
| metadata       | JSONB        | NULLABLE                    | Before/after for updates |
| hmac_signature | VARCHAR(64)  | NOT NULL                    | Tamper detection         |

---

## 15.18 `sessions`

| Column        | Type        | Constraints      | Notes |
| ------------- | ----------- | ---------------- | ----- |
| id            | UUID        | PK               |       |
| user_id       | UUID        | FK -> users      |       |
| session_token | TEXT        | NOT NULL, UNIQUE |       |
| ip_address    | INET        | NULLABLE         |       |
| user_agent    | TEXT        | NULLABLE         |       |
| expires       | TIMESTAMPTZ | NOT NULL         |       |
| created_at    | TIMESTAMPTZ | NOT NULL         |       |

---

## 15.19 `reports`

| Column              | Type        | Constraints | Notes                                  |
| ------------------- | ----------- | ----------- | -------------------------------------- |
| id                  | UUID        | PK          |                                        |
| generated_by_id     | UUID        | FK -> users |                                        |
| report_type         | VARCHAR(80) | NOT NULL    |                                        |
| filters             | JSONB       | NOT NULL    | Applied filters snapshot               |
| format              | ENUM        | NOT NULL    | PDF, XLSX, CSV                         |
| status              | ENUM        | NOT NULL    | PENDING, PROCESSING, COMPLETED, FAILED |
| file_url            | TEXT        | NULLABLE    | Supabase Storage URL                   |
| download_expires_at | TIMESTAMPTZ | NULLABLE    | 24 hours from completion               |
| row_count           | INTEGER     | NULLABLE    |                                        |
| error_message       | TEXT        | NULLABLE    |                                        |
| created_at          | TIMESTAMPTZ | NOT NULL    |                                        |
| completed_at        | TIMESTAMPTZ | NULLABLE    |                                        |

---

# 16. Workflow Diagrams

## 16.1 Authentication Workflow

```
User visits PRiym
        |
        v
Has account?
    |           |
   YES           NO
    |             |
    v             v
Enter Email    Register Form
+ Password     (Name, USN/EmpID, Email, Dept, Role, Password)
    |             |
    |             v
    |          Email Verification Sent
    |             |
    |             v
    |          Account -> PENDING_APPROVAL
    |             |
    |             v
    |          Admin/Faculty approves -> ACTIVE
    |
    v
Credentials Verified?
    |           |
   YES           NO
    |             |
    v             v
MFA Required?    Failed Attempt Count++
    |             |
   YES          5 attempts?
    |             |        |
    |            YES       NO
    |             |         |
    |          Account    Retry
    |          Locked     Login
    |          30 min
    v
Enter TOTP / Email OTP
    |
    v
OTP Valid?
    |       |
   YES       NO -> Show error
    |
    v
Session Created (JWT issued)
    |
    v
Redirect to Role-Specific Dashboard
```

---

## 16.2 Achievement Submission Workflow

```
Student clicks "Submit Achievement"
        |
        v
Fill Submission Form
[Title | Category | Level | Org | Date | Description | Documents]
        |
        v
Duplicate Detection Check
        |                   |
 No Duplicate          Potential Duplicate Found
        |                   |
        |            Show Warning Modal
        |                   |
        |             Confirm / Cancel
        |
        v
Submit (status -> SUBMITTED)
        |
        v
System determines assigned Faculty Verifier
(Mentor -> Category Expert -> Default Verifier)
        |
        v
Notify: Student (acknowledgment) + Faculty (new assignment)
        |
        v
Submission enters Faculty Verification Queue
        |
        v
SLA Timer begins (default: 5 business days)
```

---

## 16.3 Verification Workflow

```
Faculty opens verification queue
        |
        v
Select submission -> View Detail
[Student info | Documents | Verification Checklist]
        |
        v
Review all checklist items
        |
        v
What action to take?
      |           |               |
  APPROVE       REJECT    REQUEST CLARIFICATION
      |           |               |
      v           v               v
  Status ->   Mandatory      Mandatory
  APPROVED    Reason +       Question/
              Comment        Instruction
      |           |               |
      v           v               v
  Points      Status ->      Status ->
  Calculated  REJECTED       CLARIFICATION_REQUESTED
  & Awarded
      |           |               |
      v           v               v
  Badge       Student        Student Notified
  Evaluation  Notified       (7-day timer starts)
  Triggered
      |                          |
      v                          v (on resubmit)
  Student                   RESUBMITTED ->
  Notified                  Returns to Faculty Queue
  (APPROVED)                (flagged: Clarification Provided)
      |
      v
  HOD Dashboard Auto-Updated
```

---

## 16.4 Escalation Workflow

```
Escalation Trigger
    |
    |-- Manual: Faculty clicks "Escalate to HOD"
    |          Requires written reason (>= 50 chars)
    |
    |-- Automatic: SLA breached by 2+ business days
    |             System auto-escalates

        |
        v
Escalation Record Created
Submission flagged: ESCALATED
        |
        v
HOD Notified (in-app + email)
Submission appears in HOD Escalation Inbox
HOD SLA Timer starts (3 business days)
        |
        v
HOD Reviews Escalated Submission
        |
    ----|------------------------------
    |                                 |
APPROVE / REJECT              REASSIGN / RETURN
    |                                 |
    v                                 v
Points awarded (if approved)    New Faculty notified
Student notified                OR
Escalation resolved             Original Faculty gets
                                HOD guidance & requeued
        |
        v
Escalation status -> RESOLVED
Audit log entry created
```

---

## 16.5 Reward Redemption Workflow (Phase 2)

```
Student views Reward Catalog
        |
        v
Selects a reward
        |
        v
System checks point balance
        |               |
 Balance sufficient   Insufficient balance
        |               |
        v               v
Redemption         Show error:
Confirmation       "Earn X more points to unlock"
Modal
        |
        v
Student confirms
        |
        v
Points deducted from ledger (REDEEMED transaction)
        |
        v
Redemption record created
Admin notified of redemption request
        |
        v
Admin fulfills reward
(marks as fulfilled in admin panel)
        |
        v
Student notified: "Your reward is ready"
```

---

# 17. Technology Stack

## 17.1 Frontend

| Technology                | Role                           | Rationale                                                                                                          |
| ------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| Next.js 14.x (App Router) | Full-stack React framework     | SSR/ISR for performance; App Router for layouts and server components; API routes replace separate backend for MVP |
| TypeScript 5.x            | Type safety                    | Catches bugs at compile time; improves developer experience and maintainability                                    |
| Tailwind CSS 3.x          | Utility-first styling          | Rapid UI development with design consistency; purges unused styles                                                 |
| shadcn/ui                 | Component library              | Accessible, unstyled components built on Radix UI; fully customizable                                              |
| React Query (TanStack) v5 | Client-side data fetching      | Caching, background refetching, optimistic updates                                                                 |
| Recharts 2.x              | Data visualization             | Lightweight, composable React chart library                                                                        |
| React Hook Form + Zod     | Form management and validation | Schema-based validation shared between client and server                                                           |

## 17.2 Backend

| Technology                          | Role                      | Rationale                                                                     |
| ----------------------------------- | ------------------------- | ----------------------------------------------------------------------------- |
| Next.js API Routes / Route Handlers | Backend API layer         | Co-located with frontend; eliminates separate backend service for MVP         |
| Auth.js (NextAuth.js) v5            | Authentication            | Handles sessions, JWTs, OAuth (future SSO), and adapter-based session storage |
| Prisma ORM 5.x                      | Database access layer     | Type-safe database client auto-generated from schema; migration management    |
| Zod 3.x                             | Runtime schema validation | Server-side API input validation; shared with frontend forms                  |

## 17.3 Database and Storage

| Technology       | Role                        | Rationale                                                                                            |
| ---------------- | --------------------------- | ---------------------------------------------------------------------------------------------------- |
| PostgreSQL 16.x  | Primary relational database | ACID compliance; JSONB for flexible metadata; full-text search                                       |
| Supabase Storage | File storage                | S3-compatible object storage for achievement documents; signed URL access control                    |
| Redis 7.x        | Caching and job queue       | Leaderboard caching (sorted sets); analytics TTL cache; rate limiting; background job queue (BullMQ) |

## 17.4 Infrastructure and Deployment

| Technology              | Role                     | Rationale                                                                 |
| ----------------------- | ------------------------ | ------------------------------------------------------------------------- |
| Vercel                  | Frontend and API hosting | Zero-config Next.js deployment; global CDN; automatic preview deployments |
| AWS RDS (PostgreSQL)    | Managed database hosting | Automated backups, failover, scaling; Multi-AZ for production             |
| AWS ElastiCache (Redis) | Managed Redis            | Persistent caching layer; cluster mode for scaling                        |
| AWS S3 (via Supabase)   | Object storage backend   | Durable, scalable file storage                                            |

## 17.5 DevOps and Quality

| Technology                     | Role                                                  |
| ------------------------------ | ----------------------------------------------------- |
| GitHub Actions                 | CI/CD pipeline: lint, test, build, deploy on PR merge |
| ESLint + Prettier              | Code quality and formatting enforcement               |
| Vitest + React Testing Library | Unit and integration testing                          |
| Playwright                     | End-to-end browser testing for critical flows         |
| Sentry                         | Error monitoring and alerting (frontend + backend)    |
| Docker                         | Local development environment consistency             |

## 17.6 Architecture Pattern

```
+----------------------------------------------------------+
|                    Vercel Edge CDN                        |
|              (Static Assets + Edge Functions)             |
+-------------------------+--------------------------------+
                          | HTTPS / TLS 1.3
+-------------------------v--------------------------------+
|              Next.js Application (Vercel)                |
|  +------------------+  +-----------------------------+   |
|  |  App Router      |  |  API Route Handlers         |   |
|  |  (React Server   |  |  (REST + Server Actions)    |   |
|  |   Components)    |  |                             |   |
|  +------------------+  +-----------+-----------------+   |
+-------------------------------+----+--------------------+
                                |    |
               +----------------+    +------------------+
               |                                        |
+--------------v-----------+       +--------------------v-+
|     Prisma ORM           |       |     Redis Cache       |
|  (Type-safe queries)     |       |  (BullMQ + Caching)  |
+--------------+-----------+       +---------------------+
               |
+--------------v-----------+       +---------------------+
|  AWS RDS PostgreSQL      |       |  Supabase Storage   |
|  (Primary + Read Replica)|       |  (Achievement Docs) |
+--------------------------+       +---------------------+
```

---

# 18. Future Enhancements

## 18.1 AI-Powered Achievement Recommendations

A recommendation engine that analyzes a student's current achievement profile, batch patterns, and institutional priorities to suggest achievements they are well-positioned to pursue.

- **Technology:** OpenAI API or fine-tuned local LLM; collaborative filtering on achievement patterns
- **Value:** Converts a passive tracking tool into an active student development advisor

## 18.2 Placement Prediction Model

An ML model trained on historical placement data, correlated with achievement profiles, to predict a student's placement probability with specific company tiers.

- **Technology:** Python (scikit-learn / XGBoost) served via FastAPI microservice
- **Value:** Gives students actionable insights on achievement activities that improve placement outcomes

## 18.3 AI-Assisted Resume Builder

A one-click resume generator that pulls a student's verified achievement portfolio, applies intelligent formatting and language enhancement, and produces a professional, recruiter-ready PDF.

- **Technology:** LLM for bullet point generation; React-PDF for rendering
- **Value:** Eliminates the disconnect between institutional records and self-reported resumes

## 18.4 Company / Recruiter Integrations

Direct API integrations with recruitment platforms (LinkedIn Talent, HackerEarth, Internshala) allowing verified PRiym profiles to be shared with recruiters with student consent.

- **Value:** Creates a trust layer between student achievements and employer verification

## 18.5 Multi-College SaaS Platform

Full multi-tenant infrastructure enabling any institution to onboard as a PRiym subscriber with their own branded instance, data isolation, custom configuration, and billing management.

- **Technology:** Tenant-aware database schema; Stripe for billing; custom domain support
- **Value:** Transforms PRiym from an internal tool to a commercially viable EdTech product

## 18.6 Mobile Application (iOS and Android)

Native mobile apps (or React Native) providing students and faculty access to core workflows from their smartphones.

- **Value:** Dramatically increases submission rates by lowering the friction to log achievements in the moment

## 18.7 Advanced Analytics and Institutional Intelligence

Predictive dashboards for HODs and Principals identifying trends before they become problems: declining certification rates, batch cohorts at risk of poor placement outcomes, faculty mentoring effectiveness scores.

## 18.8 Alumni Achievement Tracking

Post-graduation achievement tracking allowing alumni to continue logging accomplishments that feed into institutional alumni outcome metrics for NAAC reporting.

## 18.9 National Repository Integration

Two-way integration with India's Academic Bank of Credits (ABC) and NDEAR for official recognition of institutional achievement records at a national level.

## 18.10 Parent / Guardian Portal

An optional, view-only portal for parents to monitor their ward's achievement activity and merit ranking.

---

# 19. Appendices

## Appendix A: User Bulk Import CSV Format

**Student Import:**

```csv
name,email,usn,batch_year,phone,mentor_faculty_email
Arjun Sharma,arjun.s@aitlibrary.edu.in,1AT22CS001,2022,+919876543210,kavitha.rao@aitlibrary.edu.in
```

**Faculty Import:**

```csv
name,email,employee_id,phone
Dr. Kavitha Rao,kavitha.rao@aitlibrary.edu.in,FAC2023001,+919812345678
```

---

## Appendix B: Achievement Level Multiplier Table (Default)

| Level         | Multiplier |
| ------------- | ---------- |
| International | 2.0x       |
| National      | 1.5x       |
| State         | 1.2x       |
| University    | 1.0x       |
| College       | 0.8x       |
| Department    | 0.5x       |

---

## Appendix C: Document Control

| Field       | Value                           |
| ----------- | ------------------------------- |
| Document ID | AIT-PRiym-PRD-2026-001          |
| Version     | 1.0                             |
| Status      | Approved for Development        |
| Author      | Product and Architecture Team   |
| Next Review | November 2026 (post-MVP launch) |

---

<div align="center">

---

_This document is the property of Atria Institute of Technology and the PRiym development team._
_Unauthorized reproduction or distribution is prohibited._

_Document ID: AIT-PRiym-PRD-2026-001 | Version 1.0 | August 2026_

</div>
