# 🎓 ISCMSS — Integrated School Community Management Systems

[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2016%20(React%2019)-black?logo=next.js)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/Backend-NestJS%2012-E0234E?logo=nestjs)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20(Neon)-336791?logo=postgresql)](https://neon.tech/)
[![Prisma](https://img.shields.io/badge/ORM-Prisma%207-2D3748?logo=prisma)](https://prisma.io/)
[![TailwindCSS](https://img.shields.io/badge/Styling-Tailwind%20v4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

An enterprise-grade, full-stack educational management platform developed for **Wachemo University Community Excellency School** (Hossana, Ethiopia). The system replaces manual, error-prone paper workflows with an automated, unified web ecosystem serving administrators, teachers, parents, and students.

---

## 🌟 Key Scope & Features Matrix

| Category | Module / Capability | Details |
|---|---|---|
| 🔐 **Authentication & RBAC** | Multi-Role Access Control | Strict role isolation for **Admin**, **Head**, **Registrar**, **Teacher**, **Room Teacher**, **Parent**, and **Student**. |
| 🛡️ **Cybersecurity** | Brute-Force & Password Policy | Strong password requirement (uppercase, lowercase, number, special char). Account automatically locked for 15 minutes after 5 consecutive failed login attempts. |
| 🔑 **Account Recovery** | Password Reset (OTP) | 6-digit verification code system (`/forgot-password`) with 15-minute expiration; immediately lifts account lockouts upon reset. |
| 👥 **Student Enrollment** | Registration & Parent Linking | Automated student code generation, class assignment, and parent-student relationship mapping by the Registrar. |
| 🏫 **Classroom Management** | Teacher Assignment & Subject Mapping | Full classroom CRUD, subject allocation, and designated Room Teacher assignment. |
| 📋 **Attendance Management** | Room-Teacher Strictly Enforced | **Self-attendance is removed**. Daily attendance can exclusively be submitted by the designated **Room Teacher** (or Admin override), with automatic absence notifications sent to parents. |
| 📝 **Grade Management** | Automated Report Cards & GPA | Continuous assessment and final exam scoring, letter grades (A–F), GPA calculation, ranking, and digital printable report cards. |
| 🤖 **Automated Exam Engine** | Objective MCQ Auto-Marking | Objective question examination bank with randomized client rendering, automated server-side grading, instant score breakdown, and database synchronization into student academic marks. |
| 🗓️ **Timetable Generation** | Automated Scheduling Algorithm | Collision-free automated weekly timetable generation (Monday–Friday, 6 periods/day) with teacher and subject conflict detection. Dedicated schedules for Head, Teachers, and Students. |
| 📊 **Analytical Reports** | Executive Decision Dashboards | 4 real-time analytical reports for School Head & Administrators: **Attendance Compliance**, **Academic Performance & Top Achievers**, **Fee Collection & Overdues**, and **Teacher Performance**. |
| 💳 **Financial System** | Online Fee Payment & Receipts | Tuition invoicing, **5% automated late penalty** calculation, overdue tracking, digital receipt generation, and automated reminder broadcasts. |
| 💬 **Communication Hub** | Real-time Chat | Direct WebSocket-powered instant messaging channel between parents and teachers. |
| 📚 **24/7 Learning Hub** | Digital Resource Library | Academic repository for students to stream recorded video lessons, download lesson notes, and access curriculum e-books. |
| 🔍 **Global Search** | Multi-Criteria Engine | Instant querying by student name, student code, class, subject, date, and fee payment status. |

---

## 🏗️ System Architecture

```
iscmss/
├── backend/                  # NestJS v12 + TypeScript Backend
│   ├── prisma/               # Prisma 7 Schema (Neon PostgreSQL)
│   └── src/
│       ├── auth/             # JWT Auth, Lockout Engine, Password Reset
│       ├── users/            # User Management (Staff, Teachers, Parents)
│       ├── students/         # Student Enrollment & Linking
│       ├── classes/          # Classroom Management
│       ├── attendance/       # Room-Teacher Enforced Attendance
│       ├── grades/           # Report Card & GPA Engine
│       ├── exams/            # Objective MCQ Auto-Marking Engine
│       ├── timetable/        # Auto-Timetable Generation Algorithm
│       ├── reports/          # 4 Executive Analytical Reports
│       ├── payments/         # Fee Management, Receipts & 5% Penalties
│       ├── notifications/    # Parent Alerts & School Announcements
│       ├── resources/        # 24/7 Digital Learning Hub
│       ├── chat/             # Socket.IO Parent-Teacher Messaging
│       └── search/           # Multi-Criteria Search System
│
└── frontend/                 # Next.js 16 (App Router + Turbopack)
    └── src/
        ├── app/
        │   ├── admin/        # Admin Dashboard & User Management
        │   ├── head/         # Head Dashboard, Reports & Announcements
        │   ├── registrar/    # Registrar Enrollment & Invoicing
        │   ├── teacher/      # Teacher Portal, Grades & Attendance
        │   ├── parent/       # Parent Portal, Payments & Reports
        │   ├── student/      # Student Hub, Exams, Timetable & Notes
        │   ├── login/        # Secure Portal Login (with Lockout Notice)
        │   ├── register/     # Public Self-Registration (Parents/Students)
        │   ├── forgot-password/ # 2-Step OTP Password Reset & Unlock
        │   └── contact/      # School Directory & Inquiry Form
        ├── components/ui/    # Accessible shadcn/ui Component Library
        └── lib/api.ts        # Axios Client with Auto-Injected JWT Auth
```

---

## ⚡ Quick Start & Installation

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm** or **pnpm**
- **PostgreSQL Database** (Cloud Neon connection string provided in `.env`)

---

### 1. Clone the Repository
```bash
git clone https://github.com/abel-wide/iscmss.git
cd iscmss
```

---

### 2. Backend Setup
```bash
cd backend
npm install
```

Configure `backend/.env`:
```env
DATABASE_URL="postgresql://<user>:<password>@<neon-host>/neondb?sslmode=require"
JWT_SECRET="your-super-secure-jwt-secret-key-32-chars-minimum"
PORT=3001
```

Run database migration & build:
```bash
npx prisma generate
npm run build
npm run start:prod
# Server runs at http://localhost:3001
# Interactive Swagger Documentation: http://localhost:3001/api/docs
```

---

### 3. Frontend Setup
In a new terminal window:
```bash
cd frontend
npm install
npm run build
npm run start
# Client application runs at http://localhost:3000
```

---

## 🔑 Demo Credentials

| Role | Email | Password | Access Portal |
|---|---|---|---|
| **System Admin** | `admin@iscms.local` | `Admin@1234` | `/admin` |
| **School Head** | `head@iscms.local` | `Head@1234` | `/head` |
| **Registrar** | `registrar@iscms.local` | `Registrar@1234` | `/registrar` |
| **Teacher** | `teacher@iscms.local` | `Teacher@1234` | `/teacher` |
| **Parent** | `parent@iscms.local` | `Parent@1234` | `/parent` |
| **Student** | `student@iscms.local` | `Student@1234` | `/student` |

---

## 🛡️ Security Mechanisms

- **Password Requirements**: Enforced through regex assertions (`^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$`).
- **Account Lockout**: After 5 consecutive failed login attempts, the target account is automatically restricted for 15 minutes (`HTTP 403 Forbidden`).
- **Self-Service Unlocking**: Users can clear the lockout at any time by completing the 6-digit verification code reset flow at `/forgot-password`.
- **Attendance Integrity**: Non-room teachers receive `403 Forbidden` if attempting to mark attendance for a class they are not assigned to lead.

---

## 📄 API Documentation
Interactive OpenAPI / Swagger documentation is automatically hosted and available at:
👉 **[http://localhost:3001/api/docs](http://localhost:3001/api/docs)**

---

## 👥 Contributors & Institution
- **Developed for**: Wachemo University Community Excellency School, Hossana, Central Ethiopia
- **Repository**: [https://github.com/abel-wide/iscmss](https://github.com/abel-wide/iscmss)
- **License**: MIT
