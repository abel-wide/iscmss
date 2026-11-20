# ⚙️ ISCMSS Backend Service

NestJS v12 enterprise backend powering the **Integrated School Community Management System (ISCMS)** with Prisma ORM, Neon PostgreSQL, JWT RBAC, and WebSockets.

---

## 🛠️ Tech Stack & Libraries
- **Framework**: [NestJS](https://nestjs.com/) v12 + TypeScript
- **ORM**: [Prisma](https://www.prisma.io/) v7 with `@prisma/adapter-pg`
- **Database**: PostgreSQL hosted on [Neon](https://neon.tech/)
- **Authentication**: Passport-JWT, Bcrypt password hashing
- **Real-Time Communication**: Socket.IO Gateway for parent-teacher chat
- **Validation**: `class-validator`, `class-transformer`
- **API Documentation**: Swagger / OpenAPI (`/api/docs`)

---

## 📁 Modules Breakdown

| Module | Route Prefix | Responsibility |
|---|---|---|
| `AuthModule` | `/auth` | JWT login, registration, 5-attempt security lockout, 6-digit OTP password reset |
| `UsersModule` | `/users` | Staff creation (Head, Registrar, Admin), teacher registration, parent linking |
| `StudentsModule` | `/students` | Student enrollment, student code generation, class assignments |
| `ClassesModule` | `/classes` | Classroom CRUD, designated Room Teacher assignment, subject allocation |
| `AttendanceModule` | `/attendance` | Room Teacher strictly enforced daily attendance tracking and absence alerts |
| `GradesModule` | `/grades` | Assessment/final scores, GPA calculation, digital report card generation |
| `ExamsModule` | `/exams` | Objective question MCQ bank, student sanitized view, auto-marking engine |
| `TimetableModule` | `/timetable` | Auto-generation algorithm (Mon–Fri, 6 periods/day) with conflict detection |
| `ReportsModule` | `/reports` | 4 analytical reports: Attendance, Academics, Fee Collection, Teachers |
| `PaymentsModule` | `/payments` | Tuition invoicing, 5% late penalty calculation, digital receipts, reminders |
| `NotificationsModule` | `/notifications` | Parent alerts (absence, grades, reminders) and school announcements |
| `ResourcesModule` | `/resources` | 24/7 digital learning hub (lesson notes, e-books, recorded video lessons) |
| `ChatModule` | `/chat` | Real-time direct chat gateway between parents and teachers |
| `SearchModule` | `/search` | Global multi-criteria search (name, code, class, subject, payment status) |

---

## 🚀 Setup & Execution

### 1. Environment Configuration
Create `.env` in the `backend/` directory:
```env
DATABASE_URL="postgresql://<user>:<password>@<neon-host>/neondb?sslmode=require"
JWT_SECRET="your-jwt-secret-key-at-least-32-characters"
PORT=3001
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Sync & Generation
```bash
npx prisma generate
```

### 4. Run Server
```bash
# Production mode (Recommended):
npm run build
npm run start:prod

# Development mode (Hot-reload):
npm run start:dev
```

Server runs on: **`http://localhost:3001`**  
Interactive Swagger API documentation: **`http://localhost:3001/api/docs`**
