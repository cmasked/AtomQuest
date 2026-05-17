# 🎯 AtomQuest — Goal Setting & Tracking Portal

> **Hackathon 1.0 Submission**  
> An intuitive, robust, and audit-ready portal that digitizes the complete employee goal-setting and performance check-in lifecycle.

## 🚀 Live Demo & Links

### Deployment
- **🌐 Frontend (Vercel):** https://atomquest-git-main-cmaskeds-projects.vercel.app
- **⚙️ Backend API (Render):** https://atomquest-j4bj.onrender.com
- **📊 Database:** Supabase PostgreSQL (Session Pooler)

### 🔑 Quick Login
To experience the distinct user journeys, use these seeded test accounts:

| Role | Email | Password |
|------|-------|----------|
| **Employee** | `priya.sharma@atomberg.com` | `Priya@2025` |
| **Manager** | `rohit.verma@atomberg.com` | `Rohit@2025` |
| **Admin/HR** | `hr.admin@atomberg.com` | `HrAdmin@2025` |

**💡 Tip:** Use the quick login buttons on the Login page for instant access.

---

## ⚡ Quick Start (30 seconds)
1. Visit: https://atomquest-git-main-cmaskeds-projects.vercel.app
2. Click any role button (Employee / Manager / Admin)
3. Explore the full BRD-compliant goal setting and tracking workflow

---

## 🛠️ Technology Stack & Architecture
**Cost Optimisation & Efficiency:** This solution was architected with a strict zero-cost infrastructure footprint for the hackathon, prioritizing high performance and minimal API overhead.
- **Frontend:** React 18 + Vite, TailwindCSS for responsive UI, Recharts for analytics, Zustand for state management.
- **Backend:** Node.js, Express, TypeScript, Prisma ORM.
- **Database:** PostgreSQL hosted on Supabase (using Session Pooler for optimized IPv4 cloud connectivity).
- **Hosting:** Vercel (Frontend) & Render (Backend).

---

## 📋 BRD Fulfillment & Features

### Phase 1: Goal Creation & Approval (✅ 100% Complete)
- **Employee Interface:** Intuitive UI for defining Thrust Areas, UoM, Targets, and Weightages.
- **Strict Validation Engine:** Mathematically enforces the `Total Weightage = 100%` (on submit), `Max Goals = 8`, and `Min Weightage = 10%` rules.
- **Manager Workflow:** L1 Managers can approve, return for rework, or execute inline edits. Approved goals are securely locked.
- **Shared Goals:** Admins can push Departmental KPIs downwards. Goal titles and targets become read-only for recipients, while achievement syncs universally.

### Phase 2: Achievement Tracking & Check-ins (✅ 100% Complete)
- **Quarterly Interface:** Strict phase-gating (Q1, Q2, etc.) ensuring data is only captured in active windows.
- **Dynamic Formulas:** The system automatically computes progress based on UoM constraints (e.g., Target ÷ Achievement for `NUMERIC_MAX`, or binary Zero-Based constraints).
- **Manager Check-ins:** Structured feedback logs for performance discussions.

### Reporting & Governance (✅ 100% Complete)
- **Audit Trail:** Comprehensive Prisma-level tracking of all state mutations after a goal is locked (Who, What, When).
- **Completion Dashboard:** Real-time visibility for HR into org-wide check-in compliance.
- **Exporting:** Integrated CSV/Excel generation for Planned vs. Actual reporting.

---

## ⭐ Bonus Features Implemented (Section 5)

I went above and beyond to implement the requested bonus features. Here is how I tackled them, along with the strategic alternatives I engineered when faced with enterprise constraints:

### 1. Webhook Notifications (Teams-Compatible Architecture)
- **Status:** ✅ Implemented
- The notification system is built on a **webhook-agnostic dispatcher** 
  that formats payloads per the destination platform's spec.
- For this demo, notifications are delivered via Discord webhooks 
  (same Incoming Webhook standard as Teams) since Teams app integration 
  requires Enterprise O365 admin provisioning unavailable in this environment.
- Switching to a live Teams endpoint requires only swapping the webhook 
  URL — zero code changes needed.
- **What you can test:** Submit a goal as Employee → Manager receives 
  an instant webhook notification with goal details and a deep link.

### 2. Rule-Based Escalation Module
- **Status:** ✅ Fully Implemented.
- **Implementation:** A custom cron-style engine (`escalationService.ts`) runs headless server checks.
- It calculates mathematical time thresholds against goal states (e.g., `status === DRAFT && createdAt < cutoffDate`).
- Supports multi-level escalation tracking (Employee -> Manager -> Skip-level) with an HR resolution UI.

### 3. Advanced Analytics Module
- **Status:** ✅ Fully Implemented.
- **Implementation:** Built a dedicated high-performance dashboard utilizing `Recharts`.
- Features include QoQ Achievement Trends, Manager Check-in Effectiveness comparisons, and a visual Scatter-Plot Heatmap mapping completion rates across the entire organization.

---

## 💻 Local Setup Instructions

If you wish to run the project locally:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/cmasked/AtomQuest.git
   cd AtomQuest
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   npm install
   # Create a .env file and add your Supabase DATABASE_URL
   npx prisma db push
   npm run prisma:seed
   npm run dev
   ```

3. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
4. Access the portal at `http://localhost:5173`.

---

## 📁 Project Structure

```
AtomQuest/
├── backend/                    # Express.js + TypeScript server
│   ├── src/
│   │   ├── controllers/        # Route handlers (auth, goals, reports, etc.)
│   │   ├── services/           # Business logic (validation, scoring, workflows)
│   │   ├── routes/             # Express route definitions
│   │   ├── middleware/         # Auth, error handling
│   │   ├── utils/              # Helpers (Prisma, score engine, validators)
│   │   └── index.ts            # Server entry point
│   ├── prisma/
│   │   ├── schema.prisma       # Data model & ORM definitions
│   │   ├── migrations/         # Incremental DB schema versions
│   │   └── seed.ts             # Demo data (users, cycles, test goals)
│   └── package.json
│
├── frontend/                   # React 18 + Vite + TypeScript
│   ├── src/
│   │   ├── pages/              # Page components (Login, Goals, Reports, Admin Dashboard, etc.)
│   │   ├── components/         # Reusable UI components & layouts
│   │   ├── api/                # Axios API clients (auth, goals, reports, admin)
│   │   ├── store/              # Zustand state management
│   │   ├── lib/                # Utilities & config
│   │   └── App.tsx             # Main router & app layout
│   ├── public/                 # Static assets
│   └── package.json
│
└── README.md                   # This file
```

---

## 🔌 API Endpoints Overview

### Authentication
- `POST /api/auth/login` — Login with email & password
- `GET /api/auth/me` — Fetch current user profile (requires token)

### Goals (CRUD + Approval)
- `POST /api/goals` — Create a new goal
- `GET /api/goals` — List goals for authenticated user
- `PATCH /api/goals/:id` — Update goal (inline edit during approval)
- `POST /api/goals/:id/submit` — Submit goal for approval
- `PATCH /api/goals/:id/approve` — Manager approves goal
- `PATCH /api/goals/:id/return` — Manager returns goal for rework
- `POST /api/goals/:id/achievement/:quarter` — Log achievement for a quarter

### Admin Routes
- `GET /api/admin/cycles` — List all goal cycles
- `POST /api/admin/cycles` — Create a new cycle
- `GET /api/admin/users` — List all users
- `POST /api/admin/goals/:id/unlock` — Unlock a locked goal (for corrections)

### Reports
- `GET /api/reports/achievement` — Achievement report with export (CSV/XLSX)
- `GET /api/reports/completion-dashboard` — Real-time org-wide completion stats
- `GET /api/reports/audit-log/:goalId` — Audit trail for a goal

---

## 🐛 Troubleshooting

### "Session Expired" on Login
**Solution:** The backend likely doesn't have the seeded demo users yet.
- On Render: Update the **Build Command** to include `npm run prisma:seed`
- Locally: Run `npm run prisma:seed` from the `backend/` directory

### Backend Connection Timeout (Render)
**Solution:** The free tier Render instance may be sleeping.
- Visit your backend URL to wake it: https://atomquest-j4bj.onrender.com
- Wait 30–60 seconds for it to boot, then try logging in again

### Database Connection Error
**Solution:** Verify your `DATABASE_URL` environment variable on Render/local .env:
- Format: `postgresql://user:password@host:port/database`
- Use the **Session Pooler** URL from Supabase (port 5432 or 6543 depending on mode)

### CORS Errors
**Solution:** The backend's CORS policy allows:
- Localhost on ports 5173–5179
- Vercel deployments (*.vercel.app)
- Custom domains via `FRONTEND_URL` environment variable

---

## 🚀 Deployment Guide

### Frontend (Vercel)
1. Push code to GitHub
2. Connect repo to Vercel
3. Set `VITE_API_URL` environment variable → `https://atomquest-j4bj.onrender.com/api`
4. Vercel auto-deploys on every push

### Backend (Render)
1. Create a new Web Service on Render
2. Connect your GitHub repo
3. Set environment variables:
   ```
   DATABASE_URL = postgresql://...@pooler.supabase.com:5432/postgres
   JWT_SECRET = your-secret-key
   NODE_ENV = production
   ```
4. Build Command: `npm install && npm run prisma:generate && npm run prisma:seed && npm run build`
5. Start Command: `node dist/src/index.js`

---

## 📚 Features Summary

| Feature | Status | Notes |
|---------|--------|-------|
| **Goal Creation** | ✅ Complete | With validation (weightage, limits) |
| **Manager Approval Workflow** | ✅ Complete | Approve, return, inline edit |
| **Achievement Tracking** | ✅ Complete | 4 scoring formulas (NUMERIC_MIN/MAX, TIMELINE, ZERO) |
| **Check-in Comments** | ✅ Complete | Structured manager feedback |
| **Shared Goals** | ✅ Complete | Dept KPIs pushed to employees |
| **Audit Logs** | ✅ Complete | WHO/WHAT/WHEN tracking |
| **Completion Dashboard** | ✅ Complete | Real-time org-wide stats |
| **Report Export** | ✅ Complete | Excel & CSV formats |
| **Role-Based Access** | ✅ Complete | EMPLOYEE, MANAGER, ADMIN |
| **Escalation Module** | ✅ Complete | Auto-escalate overdue goals |
| **Webhook Notifications** | ✅ Complete | Discord (Teams-compatible API) |
| **Analytics Dashboard** | ✅ Complete | QoQ trends & heatmaps |

---

## 👨‍💻 Team & Attribution
- **Built for:** Hackathon 1.0
- **Repository:** https://github.com/cmasked/AtomQuest
- **Deployment:** Vercel (Frontend) & Render (Backend)
- **Database:** Supabase PostgreSQL

---

## 📝 License
This project is open source for evaluation and learning purposes.
