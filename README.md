# 🎯 AtomQuest — Goal Setting & Tracking Portal

> **Hackathon 1.0 Submission**  
> An intuitive, robust, and audit-ready portal that digitizes the complete employee goal-setting and performance check-in lifecycle.

## 🚀 Live Demo & Links
- **Frontend URL:** *(Insert your Vercel URL here)*
- **Backend URL:** *(Insert your Render URL here)*
- **Architecture Diagram:** *(Include your diagram link/image here)*

### 🔑 Test Credentials
To experience the distinct user journeys, you can log in using the seeded test accounts:
- **Employee:** `priya.sharma@atomberg.com` | Password: `Priya@2025`
- **Manager:** `rohit.verma@atomberg.com` | Password: `Rohit@2025`
- **Admin/HR:** `hr.admin@atomberg.com` | Password: `HrAdmin@2025`

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
