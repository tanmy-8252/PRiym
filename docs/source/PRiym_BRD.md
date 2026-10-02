---

<div align="center">

# PRiym

### Progress • Recognition • Innovation • Merit

# Business Requirements Document

**Atria Institute of Technology**
Department of Computer Science & Engineering
Bengaluru, Karnataka, India

---

_Confidential — For Internal Use Only_

Version 1.0 | August 2026

</div>

---

# Table of Contents

1. [Document Information](#document-information)
2. [Executive Summary](#executive-summary)
3. [Business Problem](#business-problem)
4. [Existing Problems in Current System](#existing-problems-in-current-system)
5. [Business Opportunity](#business-opportunity)
6. [Vision Statement](#vision-statement)
7. [Mission Statement](#mission-statement)
8. [Objectives](#objectives)
9. [Business Goals](#business-goals)
10. [Scope](#scope)
11. [Stakeholders](#stakeholders)
12. [Business Processes](#business-processes)
13. [User Personas](#user-personas)
14. [Assumptions](#assumptions)
15. [Constraints](#constraints)
16. [Risks](#risks)
17. [Success Metrics](#success-metrics)
18. [Key Performance Indicators (KPIs)](#key-performance-indicators-kpis)
19. [Expected Benefits](#expected-benefits)
20. [Future Vision](#future-vision)
21. [Appendices](#appendices)

---

# 1. Document Information

| Field              | Details                                         |
| ------------------ | ----------------------------------------------- |
| **Document Title** | Business Requirements Document — PRiym Platform |
| **Document ID**    | AIT-PRiym-BRD-2026-001                          |
| **Version**        | 1.0 (Initial Release)                           |
| **Status**         | Draft — Pending Stakeholder Approval            |
| **Prepared By**    | Product & Business Analysis Team                |
| **Institution**    | Atria Institute of Technology, Bengaluru        |
| **Department**     | Computer Science & Engineering (Pilot)          |
| **Date Created**   | August 7, 2026                                  |
| **Last Updated**   | August 7, 2026                                  |
| **Classification** | Confidential                                    |
| **Review Cycle**   | Quarterly                                       |

### Document Revision History

| Version | Date        | Author        | Change Description                |
| ------- | ----------- | ------------- | --------------------------------- |
| 0.1     | July 2026   | Internal Team | Initial Draft                     |
| 0.2     | July 2026   | Internal Team | Stakeholder Feedback Incorporated |
| 1.0     | August 2026 | Product Team  | Final BRD for Approval            |

### Document Approvals

| Name | Role                     | Signature | Date |
| ---- | ------------------------ | --------- | ---- |
|      | Head of Department — CSE |           |      |
|      | Principal, AIT           |           |      |
|      | Dean of Academics        |           |      |
|      | IT Infrastructure Lead   |           |      |

---

# 2. Executive Summary

Atria Institute of Technology (AIT), one of Karnataka's leading engineering institutions, is committed to nurturing academic excellence, holistic development, and industry-ready graduates. Despite a strong institutional foundation, the absence of a unified digital platform to capture, verify, and analyze student achievements has resulted in fragmented data, inconsistent recognition practices, and missed opportunities to leverage student accomplishments for accreditation and institutional benchmarking.

**PRiym** (**P**rogress • **R**ecognition • **I**nnovation • **M**erit) is a centralized Student Achievement and Performance Management Platform purpose-built to address this systemic gap. PRiym enables students to log and submit their academic, technical, co-curricular, and extracurricular achievements; allows faculty to review and verify submissions with contextual annotations; empowers Heads of Department (HODs) to analyze departmental performance through intelligent dashboards; and provides administrators and institutional leadership with a single source of truth for governance, accreditation, and strategic planning.

The initial deployment of PRiym is scoped to the **Computer Science & Engineering (CSE) department** as a controlled pilot, encompassing approximately **600–700 students and 35–40 faculty members**. Following successful validation of the platform's value proposition and performance benchmarks, PRiym will be systematically scaled to all departments across AIT, and subsequently offered as a Software-as-a-Service (SaaS) solution to peer institutions across India.

PRiym is designed to deliver measurable returns across four strategic dimensions: **academic excellence**, **administrative efficiency**, **accreditation readiness**, and **student career outcomes**. The platform's modular, cloud-native architecture ensures that it is scalable, secure, and interoperable with existing institutional systems.

This document serves as the authoritative reference for all stakeholders — institutional leadership, the development team, faculty champions, and potential partners or investors — regarding the business rationale, functional requirements, and strategic value of PRiym.

---

# 3. Business Problem

## 3.1 Problem Statement

Atria Institute of Technology currently has no centralized, structured mechanism to capture and validate the full spectrum of student achievements. Student accomplishments — ranging from competitive examination scores and research publications to hackathon wins and sports honors — are recorded inconsistently across disconnected spreadsheets, email threads, and paper-based registers. The absence of a unified platform means that:

- **Institutional leadership lacks real-time visibility** into student performance trends across academic years, semesters, and cohorts.
- **Faculty and HODs spend disproportionate administrative time** manually collecting, collating, and verifying student data — time that could be redirected to mentoring and instruction.
- **Students receive recognition inconsistently and inequitably**, which undermines morale and discourages participation in enrichment activities.
- **Achievement data critical to accreditation bodies** (NBA, NAAC, UGC) cannot be retrieved swiftly or with confidence in its accuracy.
- **Placement teams lack structured, verifiable data** on student skill profiles, certifications, and accomplishments, weakening campus recruitment outcomes.

## 3.2 Problem Scope

The problem is systemic, not isolated to a single process or team. It spans the entire student lifecycle — from enrollment to graduation — and affects every stakeholder in the institutional hierarchy.

## 3.3 Impact of Inaction

Failure to address these challenges will result in:

- Continued loss of institutional ranking due to incomplete achievement reporting
- Diminished student engagement in co-curricular and extracurricular activities
- Increased risk of data fabrication or submission errors in accreditation reports
- Competitive disadvantage relative to institutions that have adopted digital performance management systems
- Reduced attractiveness to top-tier recruiters who expect well-organized, verifiable candidate portfolios

---

# 4. Existing Problems in Current System

The following pain points have been identified through structured interviews with faculty, HOD, students, and administrative staff, as well as observation of current workflows.

## 4.1 Student-Facing Problems

| #   | Problem                                                                                          | Impact                                                              |
| --- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| 1   | No single platform to log achievements across academic, technical, and extracurricular domains   | Students maintain personal records informally, leading to data loss |
| 2   | Lack of a structured submission process means many achievements go unrecognized                  | Demotivates high-achieving students                                 |
| 3   | Students are unaware of which achievements qualify for institutional recognition                 | Inequitable recognition and missed opportunities                    |
| 4   | No visibility into their own achievement profile relative to peers or institutional expectations | Lack of self-directed improvement                                   |
| 5   | Duplicate and inconsistent submissions across different faculty and processes                    | Administrative confusion and delays                                 |

## 4.2 Faculty-Facing Problems

| #   | Problem                                                                             | Impact                                         |
| --- | ----------------------------------------------------------------------------------- | ---------------------------------------------- |
| 1   | Achievement verification is conducted via email or in-person, with no audit trail   | Risk of fraudulent claims going undetected     |
| 2   | Faculty mentors have no consolidated view of their mentee cohort's performance      | Mentoring is reactive rather than proactive    |
| 3   | Manual collation of departmental achievement data is time-consuming and error-prone | Faculty time wasted on administrative tasks    |
| 4   | No standardized criteria for approving or rejecting achievement claims              | Inconsistent outcomes across faculty members   |
| 5   | Faculty contributions to student success go unmeasured and unrecognized             | No professional incentive for active mentoring |

## 4.3 HOD-Facing Problems

| #   | Problem                                                                              | Impact                                                         |
| --- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| 1   | Real-time departmental performance data is unavailable                               | Decision-making is based on outdated or incomplete information |
| 2   | Comparative analysis across batches, semesters, and student segments is not feasible | Inability to identify systemic issues or bright spots          |
| 3   | Preparing accreditation and review reports requires weeks of manual effort           | High cost, high risk of error                                  |
| 4   | No mechanism to identify underperforming students early and intervene                | Students fall through the cracks                               |
| 5   | HOD cannot easily identify top achievers for awards, scholarships, or nominations    | Recognition is personality-driven rather than data-driven      |

## 4.4 Administrative and Institutional Problems

| #   | Problem                                                                           | Impact                                                   |
| --- | --------------------------------------------------------------------------------- | -------------------------------------------------------- |
| 1   | No single source of truth for student achievement data at the institutional level | Conflicting reports across departments                   |
| 2   | Accreditation preparation relies on fragmented, manually assembled documents      | High vulnerability to data gaps and inaccuracies         |
| 3   | Placement cell lacks structured access to verified student accomplishments        | Reduced quality of placement collateral                  |
| 4   | Institutional benchmarking against peer colleges is not possible                  | Leadership lacks strategic data for improvement planning |
| 5   | No digital audit trail for achievement-related decisions                          | Compliance and governance risk                           |

---

# 5. Business Opportunity

The convergence of several macro and micro trends creates a compelling, time-sensitive opportunity for PRiym:

## 5.1 Regulatory & Accreditation Tailwinds

India's national accreditation bodies — **NAAC**, **NBA**, and the **National Education Policy (NEP) 2020** framework — place increasing emphasis on outcome-based education (OBE) and the holistic assessment of student competencies beyond traditional academic scores. Institutions that can demonstrate structured achievement tracking and evidence-based student development will gain significant competitive advantage in accreditation cycles.

## 5.2 Growing Student Ecosystem

AIT's CSE department alone represents **600–700 active students** generating achievements across **30+ recognizable categories** — from VTU academic toppers and IEEE paper publications to competitive coding rankings, sports golds, and startup ventures. This volume of achievement activity is currently invisible to institutional systems, representing a vast untapped data asset.

## 5.3 Placement & Industry Alignment

Recruiters visiting AIT campuses increasingly expect structured, verifiable student profiles rather than self-reported resumes. A platform that generates **verified achievement portfolios** directly improves the quality and credibility of placement collateral, potentially attracting higher-tier employers.

## 5.4 Digital Transformation Imperative

Post-pandemic, educational institutions across India are aggressively digitizing administrative workflows. PRiym positions AIT as a digital-first institution, ahead of regional peers, and creates the foundation for future integrations with Learning Management Systems (LMS), ERP platforms, and national repositories like **Academic Bank of Credits (ABC)**.

## 5.5 SaaS Market Potential

With over **1,000 engineering colleges** in Karnataka alone and **4,000+ across India**, the PRiym platform — once validated at AIT — has significant potential for commercialization as a SaaS product, creating both a revenue opportunity and a brand differentiation story for AIT as an institution that builds enterprise-grade educational technology.

---

# 6. Vision Statement

> _To become India's most trusted platform for recognizing, validating, and amplifying student achievement — empowering institutions to build a culture of excellence, merit, and continuous growth._

PRiym envisions a future where every student's academic journey is digitally documented, every achievement is equitably recognized, and every institution has the real-time intelligence it needs to nurture its best minds and close the gap for those who need support.

---

# 7. Mission Statement

> _PRiym's mission is to provide Atria Institute of Technology — and, over time, educational institutions across India — with an intelligent, transparent, and user-centric platform that seamlessly captures, verifies, and celebrates student achievements while providing institutional leadership with actionable insights to drive academic excellence and administrative efficiency._

---

# 8. Objectives

The following objectives define the specific, measurable outcomes PRiym is designed to achieve within the first year of deployment (CSE pilot phase):

| #   | Objective                                                                                             | Category               | Target                                         |
| --- | ----------------------------------------------------------------------------------------------------- | ---------------------- | ---------------------------------------------- |
| O1  | Deploy a fully functional achievement submission and verification system for CSE students and faculty | Operational            | 100% completion by Semester End                |
| O2  | Onboard 80% or more of active CSE students as registered platform users                               | Adoption               | ≥ 80% within 3 months                          |
| O3  | Reduce faculty time spent on achievement data collection and collation by at least 60%                | Efficiency             | ≥ 60% reduction                                |
| O4  | Enable HOD to generate department-level achievement reports within 5 minutes                          | Governance             | ≤ 5-minute report generation                   |
| O5  | Build a verified achievement database usable for accreditation reporting (NAAC/NBA)                   | Compliance             | 100% of submitted data verified and exportable |
| O6  | Provide placement cell with verified student achievement profiles for campus recruitment              | Placement              | Active integration by placement season         |
| O7  | Achieve a System Usability Scale (SUS) score of 75 or above from all user groups                      | UX Quality             | SUS ≥ 75                                       |
| O8  | Establish role-based access controls ensuring data privacy and security compliance                    | Security               | Zero unauthorized access incidents             |
| O9  | Create foundation architecture for multi-department expansion in Year 2                               | Scalability            | Architecture designed and documented           |
| O10 | Collect structured feedback to inform PRiym v2.0 development roadmap                                  | Continuous Improvement | Quarterly feedback cycles                      |

---

# 9. Business Goals

## 9.1 Short-Term Goals (0–12 Months: CSE Pilot)

- **G1 — Platform Launch:** Deliver and deploy the PRiym MVP for the CSE department before the commencement of the academic year's second semester.
- **G2 — Stakeholder Adoption:** Achieve active, sustained usage among students, faculty, and HOD within the first 90 days post-launch.
- **G3 — Data Integrity Baseline:** Establish the first comprehensive, verified database of CSE student achievements from the current academic year.
- **G4 — Accreditation Readiness:** Produce at least one full accreditation-ready achievement report for internal review.
- **G5 — Placement Integration:** Deliver verified achievement profiles to the placement cell ahead of the first campus recruitment drive of the academic year.

## 9.2 Medium-Term Goals (12–36 Months: AIT-Wide Rollout)

- **G6 — Multi-Department Expansion:** Extend PRiym to all 8 departments at AIT, covering the entire student population.
- **G7 — ERP/LMS Integration:** Integrate PRiym with AIT's existing student information system and Learning Management System to eliminate data silos.
- **G8 — Advanced Analytics:** Introduce predictive analytics and AI-driven insights to identify at-risk students and recommend personalized development pathways.
- **G9 — National Repository Linkage:** Establish data exchange with the Academic Bank of Credits (ABC) and UGC-mandated national student data frameworks.
- **G10 — Brand Recognition:** Position AIT as a thought leader in educational technology by publishing case studies and presenting at national conferences.

## 9.3 Long-Term Goals (36+ Months: Market Expansion)

- **G11 — SaaS Commercialization:** Offer PRiym as a white-labeled SaaS solution to peer institutions across Karnataka and beyond.
- **G12 — Revenue Generation:** Achieve commercial sustainability through a subscription-based model targeting institutions across India.
- **G13 — Ecosystem Play:** Develop a PRiym Marketplace of certifications, competitions, and industry partnerships directly accessible within the platform.
- **G14 — Research Contribution:** Use anonymized aggregate data to publish research on student achievement patterns and educational outcomes in India.

---

# 10. Scope

## 10.1 In Scope (MVP — CSE Department)

The following features and functions are within scope for the initial PRiym deployment:

### 10.1.1 User Management & Access Control

- Role-based user account creation (Student, Faculty, HOD, Administrator, Principal)
- Secure authentication (username/password with optional institutional SSO integration)
- Role-specific dashboards and access privileges
- User profile management

### 10.1.2 Achievement Submission (Student)

- Structured submission form with categorized achievement types (Academic, Technical, Co-Curricular, Extracurricular, Research, Entrepreneurship, Sports, Cultural)
- Document upload support (certificates, transcripts, links, media)
- Achievement status tracking (Submitted → Under Review → Approved / Rejected)
- Notification system (in-app and email) for submission updates

### 10.1.3 Achievement Verification (Faculty)

- Verification queue with assignment to relevant faculty mentor or subject expert
- Ability to approve, reject, or request clarification on submissions
- Annotated feedback for rejected or returned submissions
- Audit log of all verification actions

### 10.1.4 Departmental Analytics Dashboard (HOD)

- Real-time summary of achievement counts by category, semester, and batch
- Leaderboards of top-performing students
- Identification of students with zero verified achievements (intervention triggers)
- One-click export of achievement reports (PDF, Excel)
- Trend analysis across academic years

### 10.1.5 Administrative Management (Admin/Principal)

- Platform configuration (achievement categories, scoring rubrics, academic year setup)
- User provisioning and role management
- Cross-departmental reports (initially CSE only, architected for expansion)
- System health and activity monitoring
- Data export for accreditation bodies

### 10.1.6 Achievement Points & Recognition

- Configurable point system mapped to achievement categories and levels
- Student merit leaderboard (visible to all within department)
- Digital badge/certificate of recognition generated on milestone achievements
- Honor roll designation for top performers per semester

### 10.1.7 Placement Cell Module

- Verified achievement portfolio view per student
- Bulk export of student profiles for placement documentation
- Tag-based filtering (e.g., "Python certification," "Hackathon winner," "Research paper")

### 10.1.8 Notifications & Communication

- In-platform notification center
- Email notifications for key events (submission received, status updated, recognition awarded)
- HOD alerts for pending verifications exceeding defined SLA

### 10.1.9 Reporting & Compliance

- NAAC/NBA-aligned achievement report templates
- Department summary reports for academic council meetings
- Activity logs for audit and compliance purposes

---

## 10.2 Out of Scope (MVP Phase)

The following are explicitly excluded from the initial deployment and will be considered for future phases:

| Excluded Item                                               | Reason / Future Phase |
| ----------------------------------------------------------- | --------------------- |
| Mobile native application (iOS/Android)                     | Phase 2 (post-pilot)  |
| Integration with VTU or national academic databases         | Phase 2               |
| AI-powered achievement recommendations or smart alerts      | Phase 2 / Phase 3     |
| Alumni achievement tracking                                 | Phase 3               |
| Multi-institution (multi-tenant) SaaS infrastructure        | Phase 3               |
| Online payments (for event registrations, certifications)   | Phase 2               |
| Integration with AIT's existing ERP/LMS                     | Phase 2               |
| Gamification beyond leaderboards (full gamification engine) | Phase 2               |
| Faculty performance analytics                               | Phase 2               |
| Chatbot or AI assistant                                     | Phase 3               |
| Parent/Guardian portal                                      | Phase 3               |
| Real-time collaboration features (like peer reviews)        | Phase 2               |

---

# 11. Stakeholders

## 11.1 Primary Stakeholders

These stakeholders directly interact with the PRiym platform on a regular basis.

### 11.1.1 Students

**Role:** Primary content contributors and primary beneficiaries.
Students are the largest user group and the source of all achievement data on the platform. They submit their accomplishments, track their recognition status, and view their cumulative merit profile. Their engagement is the core driver of platform value.

**Key Needs:**

- Simple, mobile-friendly submission process
- Transparent status tracking
- Fair and timely recognition
- A professional portfolio view for placements and scholarships

**Influence:** High (adoption drives platform value)
**Interest:** High (direct personal benefit)

---

### 11.1.2 Faculty Members

**Role:** Verification agents and student mentors.
Faculty are responsible for reviewing and authenticating student achievement submissions. They also serve as guides, advising students on which activities qualify and encouraging participation.

**Key Needs:**

- Efficient, queue-based review interface
- Clear verification criteria and guidelines
- View of mentee cohort performance
- Recognition of their own mentoring contributions

**Influence:** High (gatekeepers of data quality)
**Interest:** Medium-High (process efficiency benefit)

---

### 11.1.3 Head of Department (HOD)

**Role:** Departmental performance owner and primary analytics user.
The HOD uses PRiym as a strategic management tool to monitor student and departmental performance, drive interventions, and prepare governance reports for the Principal and accreditation bodies.

**Key Needs:**

- Real-time, visual dashboards
- Drill-down capability from department to individual student
- Exportable reports for committees and auditors
- Alerts for anomalies (e.g., batch with unusually low achievement activity)

**Influence:** Very High (executive sponsor of the pilot)
**Interest:** Very High (direct accountability for departmental outcomes)

---

### 11.1.4 Administrator

**Role:** Platform operations manager.
The Administrator configures and maintains the PRiym platform — managing users, achievement categories, scoring rubrics, academic year settings, and compliance exports. They act as the bridge between institutional requirements and the platform's technical configuration.

**Key Needs:**

- Comprehensive configuration panel
- User provisioning and role management tools
- Audit logs and data integrity checks
- Seamless data export for accreditation

**Influence:** High (controls platform configuration)
**Interest:** High (responsible for platform reliability)

---

### 11.1.5 Principal

**Role:** Institutional oversight and strategic direction.
The Principal receives high-level reports and dashboards reflecting the overall performance of departments using PRiym. Their primary interest is in strategic outcomes: institutional ranking, accreditation outcomes, and student success rates.

**Key Needs:**

- Executive-level summary dashboards
- Trend lines across academic years
- Benchmarking data against institutional goals
- Confidence that the system is compliant and auditable

**Influence:** High (institutional champion)
**Interest:** Medium-High (strategic, not operational)

---

### 11.1.6 Placement Cell

**Role:** Data consumers and student career enablers.
The Placement Cell uses PRiym-generated verified achievement portfolios to support campus recruitment activities. They filter students by skill area, achievement level, and certifications to identify candidates for specific employers.

**Key Needs:**

- Exportable, recruiter-ready student profiles
- Filter by skills, certifications, and achievement type
- Confidence in data verification and authenticity
- Integration with placement management workflows

**Influence:** Medium (data consumer)
**Interest:** High (direct impact on placement KPIs)

---

## 11.2 Secondary Stakeholders

| Stakeholder                                     | Role in PRiym Context                        |
| ----------------------------------------------- | -------------------------------------------- |
| **AIT Management / Board**                      | Strategic oversight and investment approval  |
| **NBA / NAAC Auditors**                         | Recipients of exported accreditation reports |
| **VTU (Visvesvaraya Technological University)** | Regulatory framework alignment               |
| **Industry Partners / Recruiters**              | Indirect consumers of placement portfolios   |
| **Development Team**                            | Builders and maintainers of the platform     |
| **IT Infrastructure Team**                      | Hosting, security, and system integration    |
| **Student Council**                             | Advocacy and adoption ambassadors            |

---

# 12. Business Processes

## 12.1 Current (As-Is) Process

### Achievement Submission Workflow (Current State)

```
Student achieves something
        ↓
Student verbally informs Faculty Mentor / Class Teacher
        ↓
Faculty asks for physical copy of certificate / document
        ↓
Faculty manually enters data into a personal spreadsheet or forwards to HOD via email
        ↓
HOD collects data from all faculty via email / WhatsApp
        ↓
HOD manually consolidates data in Excel / Word document
        ↓
Document shared with Admin for accreditation / reports (often months later)
        ↓
Admin manually formats report for NAAC/NBA
```

**Pain Points in Current Process:**

- No standard submission format — data is heterogeneous across faculty
- No audit trail — impossible to verify authenticity at scale
- Time lag of weeks to months between achievement and recording
- High duplication risk — same achievement reported across multiple channels
- No student visibility — student doesn't know if their achievement was recorded
- Entirely dependent on human memory and initiative — significant attrition of data

---

### Achievement Verification Workflow (Current State)

```
Faculty receives physical certificate
        ↓
Faculty visually inspects document (no standard checklist)
        ↓
Faculty either trusts the student or asks for additional proof
        ↓
No formal approval or rejection record is maintained
        ↓
Data entered into spreadsheet — assumed verified
```

**Risks:**

- No standardized verification criteria
- No rejection workflow — unverifiable claims may be accepted
- No documented accountability for verification decisions

---

## 12.2 Proposed (To-Be) Process

### Achievement Submission Workflow (PRiym State)

```
Student logs in to PRiym
        ↓
Student selects achievement category and fills structured submission form
        ↓
Student uploads supporting documents (certificate, link, transcripts)
        ↓
System assigns submission to relevant Faculty Verifier (auto or manual assignment)
        ↓
Student receives instant acknowledgment notification
        ↓
Submission enters Faculty Review Queue
        ↓
Faculty reviews documentation against standardized checklist
        ↓
Faculty Approves / Rejects / Requests Clarification (with written annotation)
        ↓
Student notified of outcome in real-time
        ↓
Approved achievement logged to student's verified portfolio and points credited
        ↓
HOD dashboard auto-updates with new verified achievement
        ↓
Achievement data available instantly for reports, accreditation, placement
```

**Improvements:**

- Standardized, structured data from day one
- Complete audit trail with timestamps and actor IDs
- Real-time student visibility into status
- HOD and Admin have live access to verified data — no lag
- Exportable, accreditation-ready reports available on demand

---

### HOD Reporting Workflow (PRiym State)

```
HOD logs in to PRiym
        ↓
Views real-time department dashboard (achievement counts, categories, trends)
        ↓
Drills into specific batches, semesters, or student segments
        ↓
Identifies underperformers (students with 0 verified achievements)
        ↓
Triggers intervention notification to faculty mentor
        ↓
Generates report (selects template, sets date range, clicks Export)
        ↓
PDF / Excel report generated in < 5 minutes, ready for sharing
```

---

# 13. User Personas

## Persona 1: Student — Arjun Sharma

| Field            | Detail                                               |
| ---------------- | ---------------------------------------------------- |
| **Name**         | Arjun Sharma                                         |
| **Age**          | 20                                                   |
| **Department**   | Computer Science & Engineering, 3rd Year             |
| **Tech Comfort** | High — daily smartphone user, familiar with web apps |
| **Personality**  | Ambitious, competitive, detail-oriented              |

**Background:**
Arjun is a third-year CSE student who actively participates in hackathons, has cleared two AWS certifications, and recently co-authored a paper submitted to a national conference. He is frustrated because despite his active involvement, he has no formal record that the institution maintains. When he applied for a scholarship that required a faculty-endorsed achievement statement, he had to scramble and manually collect emails from different faculty members.

**Goals:**

- Log all his achievements in one place, officially
- Get recognition that appears in his institutional profile
- Build a verified portfolio for internship and placement interviews

**Pain Points:**

- No structured way to submit achievements
- Unsure which achievements "count" for institutional records
- No feedback when he verbally informs faculty — feels unheard

**Behavior on PRiym:**

- Logs in 2–3 times per month to submit new achievements
- Frequently checks status of pending submissions
- Shares his merit profile with recruiters and interviewers

**Quote:** _"I've won two hackathons this year, but my marksheet doesn't know that. My resume says it, but no one has officially verified it."_

---

## Persona 2: Faculty Mentor — Dr. Kavitha Rao

| Field            | Detail                                            |
| ---------------- | ------------------------------------------------- |
| **Name**         | Dr. Kavitha Rao                                   |
| **Age**          | 38                                                |
| **Role**         | Assistant Professor & Faculty Mentor (20 mentees) |
| **Tech Comfort** | Medium — comfortable with basic digital tools     |
| **Personality**  | Caring, meticulous, time-strapped                 |

**Background:**
Dr. Rao has 12 years of teaching experience and genuinely cares about her students' development. She is also a researcher with her own publications and supervises two final-year projects. She is the go-to person for students' mentoring needs, but she is overwhelmed by the volume of non-teaching administrative work. Currently, she maintains a personal spreadsheet to track her mentees' achievements, but it's always out of date.

**Goals:**

- Efficiently review and verify student submissions without disrupting her teaching schedule
- Have a consolidated view of how all 20 of her mentees are performing
- Contribute meaningfully to the institution's accreditation reports without spending weekends on data collation

**Pain Points:**

- Email-based achievement tracking is chaotic and unsearchable
- No standard checklist for verifying achievements — she makes judgment calls
- No recognition for the time she invests in mentoring

**Behavior on PRiym:**

- Logs in once or twice a week to review the verification queue
- Leaves detailed feedback on rejections to guide students
- Uses the mentee performance dashboard before each review meeting

**Quote:** _"I want to help my students get recognized, but right now I'm drowning in WhatsApp messages and emails asking me to 'sign off' on things I can barely track."_

---

## Persona 3: HOD — Prof. Ramesh Nair

| Field            | Detail                                    |
| ---------------- | ----------------------------------------- |
| **Name**         | Prof. Ramesh Nair                         |
| **Age**          | 52                                        |
| **Role**         | Head of Department, CSE                   |
| **Tech Comfort** | Medium — prefers dashboards over raw data |
| **Personality**  | Strategic, data-conscious, results-driven |

**Background:**
Prof. Nair has led the CSE department for 8 years and has seen it grow from 3 to 8 batches. He is deeply invested in the department's accreditation rankings and is under increasing pressure from the Principal to improve the department's NAAC score. Every accreditation cycle, his team spends 3–4 weeks collecting and formatting achievement data — an exercise he describes as "firefighting."

**Goals:**

- Have a real-time view of his department's performance at all times
- Generate accreditation-ready reports without manual effort
- Identify and support underperforming students proactively
- Showcase top achievers to attract industry partnerships and scholarships

**Pain Points:**

- Data is scattered — he has to chase 15+ faculty members for inputs every semester
- Reports are always stale — by the time he gets the data, it's months old
- He has no way to identify trends (e.g., "certification activity is declining in 4th year")

**Behavior on PRiym:**

- Logs in daily during accreditation season; weekly otherwise
- Reviews the department dashboard every Monday as part of his weekly review
- Generates monthly reports for internal governance meetings

**Quote:** _"I need to tell the Principal how our students are doing, and right now all I have is a feeling. I need data."_

---

## Persona 4: System Administrator — Suresh Patel

| Field            | Detail                                           |
| ---------------- | ------------------------------------------------ |
| **Name**         | Suresh Patel                                     |
| **Age**          | 35                                               |
| **Role**         | IT Systems Administrator, AIT                    |
| **Tech Comfort** | High — manages institutional IT systems          |
| **Personality**  | Methodical, security-conscious, process-oriented |

**Background:**
Suresh manages AIT's core IT infrastructure and is responsible for system security, user provisioning, and data integrity. He has seen several "quick-fix" digital tools adopted and then abandoned due to poor planning and lack of support. He is skeptical of new platforms but open if they are well-designed and maintainable.

**Goals:**

- Deploy and maintain a system with minimal downtime and security vulnerabilities
- Have full control over user roles and data access
- Ensure compliance with institutional data governance policies

**Pain Points:**

- New platforms are often deployed without proper documentation or admin tools
- Security and access control configurations are usually an afterthought
- No audit trails make it impossible to investigate incidents

**Behavior on PRiym:**

- Manages bulk user onboarding at the start of each semester
- Monitors system health and activity logs weekly
- Exports data for institutional records during accreditation cycles

**Quote:** _"Give me a system with proper access controls, a clear admin panel, and good documentation, and I'll make sure it runs."_

---

## Persona 5: Principal — Dr. Anita Verma

| Field            | Detail                                                  |
| ---------------- | ------------------------------------------------------- |
| **Name**         | Dr. Anita Verma                                         |
| **Age**          | 58                                                      |
| **Role**         | Principal, Atria Institute of Technology                |
| **Tech Comfort** | Low-Medium — prefers summaries and visual reports       |
| **Personality**  | Visionary, institutional-pride-driven, time-constrained |

**Background:**
Dr. Verma has led AIT for 6 years and has ambitions to see the institution break into the top 100 engineering colleges in India by 2030. She knows that student outcomes and extracurricular achievement are critical differentiators. However, she is entirely reliant on department heads to provide her data, and the quality and timeliness of that data varies enormously.

**Goals:**

- See the big picture of institutional achievement performance at a glance
- Use data to make strategic decisions about resource allocation and faculty performance
- Present compelling evidence of student excellence to accreditors, donors, and industry partners

**Pain Points:**

- Reports from HODs arrive late and in inconsistent formats
- She has no direct view into student data — fully dependent on intermediaries
- Cannot benchmark AIT against peer institutions

**Behavior on PRiym:**

- Reviews the Principal's dashboard at the start of each month
- Views institutional achievement summaries before governance board meetings
- Accesses trend reports before NAAC/NBA cycle preparations

**Quote:** _"I want to be able to walk into any review meeting and say: here is exactly how our students are performing, and here's the data to prove it."_

---

## Persona 6: Placement Officer — Meera Joshi

| Field            | Detail                                                        |
| ---------------- | ------------------------------------------------------------- |
| **Name**         | Meera Joshi                                                   |
| **Age**          | 29                                                            |
| **Role**         | Placement Coordinator, AIT                                    |
| **Tech Comfort** | High — uses LinkedIn, placement platforms, spreadsheets daily |
| **Personality**  | Target-oriented, relationship-driven, detail-focused          |

**Background:**
Meera is responsible for coordinating campus placements for 400+ final-year students across all departments. She has to create student profiles for recruiters in a short window before placement season, and currently spends weeks chasing students and faculty for verified information. She knows that a well-documented student profile can be the difference between a campus visit and a rejection from a top-tier company.

**Goals:**

- Access verified, up-to-date student achievement profiles instantly
- Filter students by skills and accomplishments to match recruiter requirements
- Export placement-ready documents without any manual data entry

**Pain Points:**

- Students inflate their achievements on resumes — no way to verify quickly
- Faculty take too long to respond to achievement verification requests during placement season
- No standardized format for student profiles means every recruiter gets a different-looking document

**Behavior on PRiym:**

- Primarily active during placement season (October–February)
- Uses filters extensively to shortlist students for specific companies
- Exports bulk student profiles before campus recruitment days

**Quote:** _"I need to tell a recruiter in 30 seconds why they should hire our student. A verified, structured profile does that. A self-written resume doesn't."_

---

# 14. Assumptions

The following assumptions have been made in defining the scope and approach of PRiym. Changes to these assumptions may require a review of the business requirements.

| #   | Assumption                                                                                                                                |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | Atria Institute of Technology will provide necessary IT infrastructure (servers, domain, institutional email) for platform deployment     |
| A2  | The CSE department will have a designated Faculty Champion to drive adoption among faculty and students during the pilot                  |
| A3  | Students and faculty have access to internet-enabled devices (laptops or smartphones) for platform access                                 |
| A4  | The HOD's office will provide administrative authority to configure and manage the platform during the pilot                              |
| A5  | Institutional leadership has approved the use of student achievement data for accreditation reporting, subject to privacy policies        |
| A6  | A clearly defined list of achievement categories and their point values will be provided by the HOD before platform configuration         |
| A7  | The platform will be accessed primarily via web browser in the MVP; a mobile app is not required for Phase 1                              |
| A8  | AIT currently does not have an existing digital achievement management system that PRiym would need to replace or migrate from            |
| A9  | The development team will follow Agile methodology with bi-weekly sprint cycles                                                           |
| A10 | Email service (institutional SMTP or third-party) will be available for platform notifications                                            |
| A11 | Student USN (University Seat Number) will serve as the primary unique identifier for student records                                      |
| A12 | The platform will store data in compliance with applicable Indian data privacy regulations (IT Act 2000 and proposed DPDP Act provisions) |
| A13 | Faculty members will be assigned student cohorts for mentoring before platform launch                                                     |
| A14 | AIT's academic calendar (semester structure, batch years) follows VTU norms                                                               |

---

# 15. Constraints

| #   | Constraint                                                                                           | Type           | Mitigation                                                       |
| --- | ---------------------------------------------------------------------------------------------------- | -------------- | ---------------------------------------------------------------- |
| C1  | Budget is limited to institutional allocation for the pilot phase — no external commercial licensing | Financial      | Use open-source components; minimize third-party dependencies    |
| C2  | Platform must be deployed within the current academic year                                           | Timeline       | Prioritize MVP features; defer non-critical modules to Phase 2   |
| C3  | Development team is limited (assumed 3–5 engineers for MVP)                                          | Resource       | Focus scope tightly; use modern frameworks for velocity          |
| C4  | Platform must comply with institutional data governance policies                                     | Regulatory     | Build role-based access and audit logs from day one              |
| C5  | No integration with external systems (ERP, VTU) in MVP scope                                         | Technical      | Design API-first architecture to enable future integrations      |
| C6  | Faculty adoption is voluntary in early stages — mandating usage may face resistance                  | Organizational | Gamification of faculty verification; HOD endorsement            |
| C7  | Achievement category definitions must be approved by academic committee before platform launch       | Process        | Initiate achievement taxonomy design workshop early              |
| C8  | Data entered during the pilot must be preservable and migratable for Phase 2                         | Data           | Design platform with data export/import standards from the start |
| C9  | Platform must support at least 700 concurrent users at peak (exam/submission season)                 | Performance    | Load testing must be part of the pre-launch checklist            |
| C10 | Institutional branding guidelines must be followed in UI/UX design                                   | Design         | Co-design UI mockups with AIT branding team before development   |

---

# 16. Risks

## 16.1 Risk Register

| Risk ID | Risk Description                                                                                                 | Probability | Impact    | Severity | Mitigation Strategy                                                                | Owner            |
| ------- | ---------------------------------------------------------------------------------------------------------------- | ----------- | --------- | -------- | ---------------------------------------------------------------------------------- | ---------------- |
| R1      | **Low Student Adoption:** Students do not engage with the platform due to lack of awareness or perceived benefit | Medium      | High      | High     | Pre-launch orientation; gamification; peer champion program; faculty encouragement | Faculty Champion |
| R2      | **Faculty Resistance:** Faculty members find verification workflows burdensome and resist adoption               | Medium      | High      | High     | Streamlined UX; reduce to minimum required steps; HOD-level mandate                | HOD              |
| R3      | **Data Quality Issues:** Students submit fraudulent or inflated achievement claims                               | Low-Medium  | High      | High     | Mandatory document upload; two-tier verification; audit trail; spot checks         | Faculty + Admin  |
| R4      | **Scope Creep:** Stakeholders request new features mid-development, delaying MVP launch                          | High        | Medium    | High     | Strict change control process; documented backlog; phased roadmap shared upfront   | Product Team     |
| R5      | **Technical Delays:** Development timeline overruns due to technical complexity or resource gaps                 | Medium      | High      | High     | Agile sprints with buffer; weekly standups; escalation protocol                    | Development Lead |
| R6      | **Data Privacy Breach:** Unauthorized access to student personal or academic data                                | Low         | Very High | High     | Encrypted storage; RBAC; regular security audits; incident response plan           | IT Admin         |
| R7      | **Infrastructure Failure:** Server downtime during peak usage periods                                            | Low         | High      | Medium   | SLA with hosting provider; automated backups; failover architecture                | IT Admin         |
| R8      | **HOD Disengagement:** HOD does not actively champion the platform, reducing institutional buy-in                | Low         | Very High | High     | Align HOD KPIs with platform adoption; regular check-ins; demonstrate early value  | Principal        |
| R9      | **Incomplete Achievement Taxonomy:** Poorly defined achievement categories lead to misuse or confusion           | Medium      | Medium    | Medium   | Stakeholder workshop before development; iterative refinement in early sprints     | HOD + Product    |
| R10     | **Change in Accreditation Requirements:** NAAC/NBA changes reporting formats mid-cycle                           | Low         | Medium    | Low      | Design reports to be configurable/template-driven                                  | Admin            |

---

# 17. Success Metrics

Success for PRiym will be measured across the following dimensions at the end of the 12-month pilot period:

## 17.1 Adoption Metrics

- ≥ 80% of active CSE students have a registered PRiym account
- ≥ 70% of registered students have submitted at least one achievement
- ≥ 90% of faculty are actively using the verification queue (no unreviewed submissions older than 7 days)
- HOD logs in to the dashboard at least 3 times per week

## 17.2 Data Quality Metrics

- ≥ 95% of approved achievements have supporting documentation uploaded
- Verification turnaround time: ≤ 5 business days from submission to decision
- Zero instances of verified achievements later found to be fraudulent

## 17.3 Operational Efficiency Metrics

- 60% reduction in time spent by faculty on manual achievement data collection
- HOD generates full departmental report in ≤ 5 minutes
- Accreditation data preparation time reduced from weeks to ≤ 1 working day

## 17.4 User Experience Metrics

- System Usability Scale (SUS) score ≥ 75 from students, faculty, and HOD
- Net Promoter Score (NPS) ≥ 40 from all user groups at 6-month mark
- ≤ 2% critical bug reports post-launch

## 17.5 Outcome Metrics

- Measurable improvement in CSE department's NAAC criterion score for student achievements
- Placement cell uses PRiym data for at least one campus recruitment drive
- At least 3 students receive scholarships or recognition directly attributed to PRiym-documented achievements

---

# 18. Key Performance Indicators (KPIs)

## 18.1 Platform Performance KPIs

| KPI                                | Target              | Measurement Method        | Frequency |
| ---------------------------------- | ------------------- | ------------------------- | --------- |
| Monthly Active Users (MAU)         | ≥ 500 students      | Platform analytics        | Monthly   |
| Achievement Submissions / Month    | ≥ 200 in Months 3–6 | System logs               | Monthly   |
| Verification SLA Compliance        | ≥ 90% within 5 days | Timestamped workflow data | Weekly    |
| Platform Uptime                    | ≥ 99.5%             | Infrastructure monitoring | Daily     |
| Average Login Frequency (Students) | ≥ 2 per month       | Session analytics         | Monthly   |
| Average Login Frequency (Faculty)  | ≥ 4 per month       | Session analytics         | Monthly   |

## 18.2 Academic KPIs

| KPI                                      | Target                                    | Measurement Method  | Frequency    |
| ---------------------------------------- | ----------------------------------------- | ------------------- | ------------ |
| Total Verified Achievements per Semester | ≥ 500 (CSE)                               | Platform report     | Semester-end |
| Students with Zero Verified Achievements | ≤ 20% of active students                  | Dashboard alert     | Monthly      |
| Achievement Category Diversity Score     | ≥ 5 categories with ≥ 50 submissions each | Category analytics  | Quarterly    |
| Year-on-Year Achievement Growth          | ≥ 15% increase                            | Year-end comparison | Annually     |

## 18.3 Administrative KPIs

| KPI                            | Target                        | Measurement Method         | Frequency    |
| ------------------------------ | ----------------------------- | -------------------------- | ------------ |
| Report Generation Time (HOD)   | ≤ 5 minutes                   | User testing + system logs | Per report   |
| Accreditation Report Readiness | 100% data available on demand | Admin audit                | Pre-NAAC/NBA |
| Data Accuracy Rate             | ≥ 98% (verified achievements) | Spot audit sample          | Quarterly    |
| User Support Ticket Volume     | Declining trend over 3 months | Support log                | Monthly      |

## 18.4 Placement KPIs

| KPI                                       | Target                                                    | Measurement Method | Frequency        |
| ----------------------------------------- | --------------------------------------------------------- | ------------------ | ---------------- |
| Student Profiles Exported for Placement   | 100% final-year CSE students                              | Export logs        | Placement season |
| Recruiter Feedback on Profile Quality     | ≥ 4/5 stars                                               | Recruiter survey   | Post-placement   |
| Placement Conversion (achievement-linked) | Track % of placed students with ≥ 3 verified achievements | Placement records  | Post-placement   |

---

# 19. Expected Benefits

## 19.1 Academic Benefits

- **Holistic Student Development:** By recognizing achievements across 8+ categories beyond academic scores, PRiym incentivizes well-rounded development in alignment with NEP 2020's vision.
- **Early Identification of Excellence:** The platform surfaces top-performing students early, enabling timely nomination for scholarships, competitions, and leadership roles.
- **Evidence-Based Pedagogy:** Faculty and HOD can identify which activities correlate with stronger academic outcomes, informing curriculum and mentoring strategies.
- **Reduced Administrative Burden:** Faculty reclaim 60%+ of time previously spent on achievement tracking, redirecting it to teaching and mentoring.
- **Benchmark Creation:** The first structured, longitudinal dataset of student achievements enables meaningful year-on-year departmental benchmarking.

## 19.2 Administrative Benefits

- **Accreditation Readiness on Demand:** NAAC/NBA-ready reports are available at any time, transforming a weeks-long manual process into a minutes-long export.
- **Audit Compliance:** Complete digital audit trails for every submission, verification, and decision ensure institutional compliance with governance requirements.
- **Informed Resource Allocation:** Data on which activities students pursue most enables targeted investment in labs, clubs, and events.
- **Reduced Duplication:** A single platform eliminates redundant data entry across multiple spreadsheets and communication channels.
- **Institutional Memory:** Unlike spreadsheets and email threads that disappear with staff turnover, PRiym creates a persistent institutional record.

## 19.3 Placement Benefits

- **Verified Candidate Profiles:** Employers receive data they can trust, increasing AIT's credibility with premium recruiters.
- **Faster Placement Preparation:** Placement officers save weeks of effort collecting and formatting student information.
- **Better Candidate Matching:** Tag-based filtering allows precise matching of student profiles to recruiter requirements.
- **Higher Placement Rates:** More credible, comprehensive profiles are expected to improve offer rates, particularly from companies that value extracurricular accomplishment.
- **Improved Employer Satisfaction:** Structured, consistent profiles improve the recruiter experience and likelihood of repeat campus visits.

## 19.4 Accreditation Benefits

- **NAAC Criterion Alignment:** PRiym directly supports NAAC Criterion 5 (Student Support and Progression) and Criterion 3 (Research, Innovations, and Extension) by providing structured, verifiable evidence.
- **NBA Outcome-Based Education (OBE) Mapping:** Achievement categories can be mapped to NBA Program Outcomes (POs) and Course Outcomes (COs), strengthening OBE documentation.
- **Reduced Accreditation Risk:** Accurate, real-time data eliminates the risk of data gaps or errors in accreditation submissions.
- **Continuous Compliance:** The institution is always "accreditation-ready" rather than scrambling before each cycle.

## 19.5 Student Growth Benefits

- **Intrinsic Motivation:** Recognition and points systems encourage students to pursue achievements beyond the minimum academic requirements.
- **Professional Portfolio Development:** Students graduate with a verifiable achievement portfolio that supplements their academic transcript.
- **Career Readiness:** Structured achievement tracking and portfolio generation align student development with industry expectations.
- **Equitable Recognition:** All students, regardless of personal relationships with faculty, receive consistent, merit-based recognition.
- **Self-Awareness and Goal Setting:** Visibility into one's own achievement profile relative to peers enables self-directed goal setting.

---

# 20. Future Vision

## 20.1 Phase 1: CSE Pilot (0–12 Months)

_As described in this document._

The foundation. PRiym is launched in the CSE department, proving the core value proposition: structured achievement management, verified data, and institutional intelligence. The pilot creates a rich learning environment to refine the platform before broader deployment.

**Milestone:** CSE department achieves measurable improvement in accreditation score and placement outcomes attributable to PRiym data.

---

## 20.2 Phase 2: AIT-Wide Rollout (12–36 Months)

Following pilot success, PRiym is extended to all departments at Atria Institute of Technology — Engineering, Management, Sciences, Architecture, and more.

**Key Additions in Phase 2:**

- **Multi-department architecture:** Each department gets its own dashboard, HOD access, and configured achievement taxonomy
- **Mobile application (iOS + Android):** Native apps for students and faculty
- **ERP/LMS Integration:** Two-way sync with AIT's existing Student Information System (SIS) and Learning Management System
- **Faculty Performance Analytics:** Faculty mentoring contributions tracked and recognized
- **Advanced Analytics:** Cohort analysis, trend prediction, and at-risk student identification using historical data
- **Student Leaderboards across departments:** College-wide recognition and competitive engagement

**Milestone:** All AIT departments active on PRiym; platform hosting 5,000+ student profiles.

---

## 20.3 Phase 3: Multi-Institution SaaS (36–60 Months)

PRiym is commercialized as a **white-labeled SaaS platform**, made available to peer engineering institutions across Karnataka and India.

**Key Additions in Phase 3:**

- **Multi-tenant architecture:** Each institution operates in an isolated, configurable environment
- **Custom branding:** Institutions can apply their logo, colors, and domain
- **Subscription-based pricing:** Tiered plans based on student count and feature requirements
- **National achievement leaderboards:** Anonymized inter-institutional benchmarking
- **AI-Powered Insights:**
  - Smart achievement recommendations based on student profile
  - Predictive placement outcome modeling
  - Automated achievement categorization using NLP (for document analysis)
- **Academic Bank of Credits (ABC) Integration:** Mapping achievements to ABC-recognized competency units
- **Alumni Module:** Track alumni achievements and map them to institutional legacy outcomes
- **Parent/Guardian Portal:** Optional view-only portal for parents to track their ward's progress
- **PRiym Marketplace:** Curated competitions, certification programs, and internship opportunities embedded in-platform

**Commercial Model:**

| Tier         | Target                                        | Price Point        |
| ------------ | --------------------------------------------- | ------------------ |
| Starter      | Institutions ≤ 500 students                   | ₹ 2–4 Lakhs/year   |
| Professional | Institutions 500–3,000 students               | ₹ 5–12 Lakhs/year  |
| Enterprise   | Institutions > 3,000 students or multi-campus | ₹ 15–30 Lakhs/year |

**Milestone:** PRiym deployed in 10+ institutions; platform recognized at national EdTech forums; seed funding or institutional investor engaged.

---

## 20.4 Phase 4: National Intelligence Platform (60+ Months)

PRiym evolves from a student achievement management tool into a **national educational intelligence platform** — a policy-grade resource for institutions, regulators, and employers.

**Vision for Phase 4:**

- Aggregate (anonymized) achievement data informs national benchmarking reports
- Government and accreditation body partnerships for official recognition
- AI advisors that guide students on career pathways based on achievement profiles
- Integration with National Skill Development Corporation (NSDC) and Industry 4.0 skill frameworks
- PRiym as an official data partner for national education rankings (NIRF)

---

# 21. Appendices

## Appendix A: Achievement Category Framework (Preliminary)

| Category                 | Sub-Category Examples                                          | Suggested Point Range |
| ------------------------ | -------------------------------------------------------------- | --------------------- |
| Academic                 | VTU Rank, Gold Medal, Scholarship Award                        | 50–200 pts            |
| Technical Certification  | AWS, Google, Microsoft, Cisco, Oracle                          | 30–100 pts            |
| Research                 | Conference Paper, Journal Article, Patent Filed                | 100–300 pts           |
| Hackathon & Competitions | Winner, Runner-Up, Participant at National/International Level | 50–150 pts            |
| Open Source Contribution | Merged PRs, GitHub Stars on Projects                           | 20–80 pts             |
| Entrepreneurship         | Startup Founded, Startup Funded, MVP Built                     | 100–250 pts           |
| Sports                   | National, State, University, Inter-College Levels              | 50–200 pts            |
| Cultural & Arts          | National, State, University, Inter-College Levels              | 30–150 pts            |
| Social Impact            | NSS, NCC, Community Projects                                   | 20–80 pts             |
| Leadership               | Student Council, Club Officer, Event Organizer                 | 20–60 pts             |
| Internship               | Core Tech, Non-Tech, Research Internship                       | 30–100 pts            |
| Workshop / FDP           | Attended, Organized                                            | 10–30 pts             |

_Final taxonomy to be defined through stakeholder workshop prior to platform configuration._

---

## Appendix B: Glossary of Terms

| Term         | Definition                                                                                                   |
| ------------ | ------------------------------------------------------------------------------------------------------------ |
| **BRD**      | Business Requirements Document — a formal document describing the business needs that a project must address |
| **MVP**      | Minimum Viable Product — the earliest working version of the platform with core features                     |
| **NAAC**     | National Assessment and Accreditation Council — India's institutional accreditation body                     |
| **NBA**      | National Board of Accreditation — accreditation for engineering and technical programs                       |
| **NEP 2020** | National Education Policy 2020 — India's transformative education framework                                  |
| **OBE**      | Outcome-Based Education — a pedagogy focused on measurable student outcomes                                  |
| **HOD**      | Head of Department                                                                                           |
| **SUS**      | System Usability Scale — an industry-standard tool for measuring UI usability                                |
| **NPS**      | Net Promoter Score — a metric for gauging user loyalty and satisfaction                                      |
| **VTU**      | Visvesvaraya Technological University — the affiliating university for AIT                                   |
| **USN**      | University Seat Number — the unique student identifier assigned by VTU                                       |
| **RBAC**     | Role-Based Access Control — a security model restricting system access by user role                          |
| **SaaS**     | Software as a Service — a cloud-based software delivery model                                                |
| **ABC**      | Academic Bank of Credits — India's national academic credit framework                                        |
| **SLA**      | Service Level Agreement — defined expectations for service quality and response time                         |
| **PRiym**    | Progress • Recognition • Innovation • Merit — the platform defined in this document                          |

---

## Appendix C: Related Documents

| Document                                      | Description                                             | Status        |
| --------------------------------------------- | ------------------------------------------------------- | ------------- |
| PRiym System Requirements Specification (SRS) | Detailed functional and non-functional requirements     | To Be Created |
| PRiym UI/UX Design Specification              | Wireframes, design system, and user flow documentation  | To Be Created |
| PRiym Technical Architecture Document         | System design, database schema, and infrastructure plan | To Be Created |
| PRiym Project Plan                            | Agile sprint plan, milestones, and delivery timeline    | To Be Created |
| PRiym Data Privacy and Security Policy        | Compliance policies for student data management         | To Be Created |

---

## Appendix D: Contact & Ownership

| Role                  | Name             | Contact        |
| --------------------- | ---------------- | -------------- |
| Executive Sponsor     | Principal, AIT   | [To Be Filled] |
| Departmental Champion | HOD, CSE         | [To Be Filled] |
| Product Owner         | [Product Lead]   | [To Be Filled] |
| Technical Lead        | [Tech Lead]      | [To Be Filled] |
| QA & Compliance Lead  | [To Be Assigned] | [To Be Filled] |

---

<div align="center">

---

_This document is confidential and intended solely for the authorized stakeholders of Atria Institute of Technology and the PRiym development initiative._

_© 2026 PRiym | Atria Institute of Technology | All Rights Reserved_

_Document ID: AIT-PRiym-BRD-2026-001 | Version 1.0 | August 2026_

</div>
