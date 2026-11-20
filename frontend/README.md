# 💻 ISCMSS Frontend Application

Next.js 16 modern client interface for the **Integrated School Community Management System (ISCMS)** built with React 19, Tailwind CSS v4, and accessible shadcn/ui components.

---

## 🛠️ Tech Stack
- **Framework**: [Next.js](https://nextjs.org/) 16 (App Router + Turbopack)
- **Library**: React 19
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) v4
- **Component UI**: Accessible components inspired by shadcn/ui (`@base-ui/react`)
- **Icons**: [Lucide React](https://lucide.dev/)
- **API Client**: Axios with auto-injected JWT authentication bearer tokens

---

## 🧭 Routes & Role Access

| Route | Role Access | Purpose |
|---|---|---|
| `/` | Public | Institutional landing page with mission, features, and quick links |
| `/login` | Public | Portal authentication with 5-attempt security lockout and password reveal |
| `/register` | Public | Self-registration for Parents & Students with live password strength meter |
| `/forgot-password` | Public | 2-step password reset with 6-digit OTP verification code & instant lockout clear |
| `/contact` | Public | School contact information and direct inquiry submission form |
| `/about` & `/services` | Public | Institutional overview, school mission, and services breakdown |
| `/admin` | `ADMIN` | Admin Dashboard: system KPIs, global search, and reminder dispatch |
| `/admin/users` | `ADMIN` | Staff account creation (Head, Registrar, Admin) and parent-student linkage |
| `/head` | `HEAD` | School Head Dashboard with direct links to 4 analytical executive reports |
| `/head/reports/*` | `HEAD` | Attendance compliance, academic rankings, fee revenues, and teacher performance |
| `/head/timetable` | `HEAD` | Class schedule management and automated timetable generator button |
| `/head/announcements` | `HEAD` | Publish institutional announcements targeting teachers, parents, or students |
| `/registrar` | `REGISTRAR` | Registrar Dashboard: student enrollment metrics and fee collection overview |
| `/registrar/students` | `REGISTRAR` | Student registration, code generation, class assignment, and parent linking |
| `/registrar/payments` | `REGISTRAR` | Tuition fee invoicing, overdue tracking with 5% penalties, and receipts |
| `/teacher` | `TEACHER`, `ROOM_TEACHER` | Teacher Dashboard with Room-Teacher attendance policy notice |
| `/teacher/attendance` | `ROOM_TEACHER` (or `ADMIN`) | Daily attendance marking (restricted strictly to assigned Room Teachers) |
| `/teacher/grades` | `TEACHER` | Student assessment and final examination grade recording |
| `/teacher/timetable` | `TEACHER` | Weekly teaching schedule view |
| `/parent` | `PARENT` | Parent Portal: linked children overview, instant alerts, and fee status |
| `/parent/payments` | `PARENT` | Digital fee payments, overdue penalty inspection, and official digital receipts |
| `/student` | `STUDENT` | Student Portal: GPA, class rank, timetable, and attendance rate summary |
| `/student/exams` | `STUDENT` | Objective MCQ examination interface with automated scoring and feedback |
| `/student/grades` | `STUDENT` | Digital terminal report card with GPA, rank, and subject breakdown |
| `/student/resources` | `STUDENT` | 24/7 Learning Hub: lesson notes, curriculum e-books, and video lessons |
| `/chat` | `PARENT`, `TEACHER` | Real-time direct communication between parents and educators |

---

## 🚀 Setup & Execution

### 1. Environment Configuration
Create `.env.local` in `frontend/`:
```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Build & Run
```bash
# Production build & start:
npm run build
npm run start

# Development mode:
npm run dev
```

Application runs on: **`http://localhost:3000`**
