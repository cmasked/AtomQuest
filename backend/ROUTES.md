# AtomQuest API — Route Reference

All routes are prefixed with `/api`. Authentication uses `Authorization: Bearer <token>`.

## Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/login` | Public | Login, returns JWT token + user profile |
| `GET` | `/api/auth/me` | Bearer | Get current user profile (excludes passwordHash) |

## Goals — CRUD

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| `POST` | `/api/goals` | Bearer | EMPLOYEE | Create a new goal (DRAFT status) |
| `GET` | `/api/goals/my` | Bearer | EMPLOYEE | Get all goals in active cycle with achievements |
| `GET` | `/api/goals/team` | Bearer | MANAGER | Get all direct reports' goals grouped by employee |
| `PATCH` | `/api/goals/:id` | Bearer | EMPLOYEE, MANAGER, ADMIN | Update a goal (rejects if APPROVED/locked) |
| `DELETE` | `/api/goals/:id` | Bearer | EMPLOYEE | Delete own goal (DRAFT status only) |
| `PATCH` | `/api/goals/:id/shared-weightage` | Bearer | EMPLOYEE | Update weightage on shared goal copy |

## Goals — Approval Workflow

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| `POST` | `/api/goals/:id/submit` | Bearer | EMPLOYEE | Submit goal for approval (DRAFT/RETURNED → SUBMITTED) |
| `POST` | `/api/goals/:id/approve` | Bearer | MANAGER | Approve goal (SUBMITTED → APPROVED, locks goal) |
| `POST` | `/api/goals/:id/return` | Bearer | MANAGER | Return goal with optional `{ managerNote }` |

## Achievement Tracking

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| `PATCH` | `/api/goals/:goalId/achievement/:quarter` | Bearer | EMPLOYEE | Upsert achievement (Q1–Q4), auto-computes score |
| `GET` | `/api/goals/:goalId/achievements` | Bearer | EMPLOYEE, MANAGER, ADMIN | Get all quarterly achievements for a goal |
| `GET` | `/api/goals/my/achievements/summary` | Bearer | EMPLOYEE | Summary of all approved goals with achievements |

## Check-ins

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| `POST` | `/api/checkins` | Bearer | MANAGER | Create/upsert check-in comment for a direct report's goal |
| `GET` | `/api/checkins/team` | Bearer | MANAGER | All check-ins by this manager, grouped by employee/quarter |
| `GET` | `/api/checkins/goal/:goalId` | Bearer | EMPLOYEE, MANAGER, ADMIN | All check-ins for a specific goal |

## Reports

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| `GET` | `/api/reports/achievement` | Bearer | MANAGER, ADMIN | Achievement report (filterable: `?cycleId=&quarter=&departmentId=`) |
| `GET` | `/api/reports/achievement/export` | Bearer | MANAGER, ADMIN | XLSX download (same filters as above) |
| `GET` | `/api/reports/completion-dashboard` | Bearer | ADMIN | Full cycle completion dashboard |
| `GET` | `/api/reports/audit/:entityId` | Bearer | ADMIN | Audit log entries for an entity |

## Admin

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| `POST` | `/api/admin/goals/:id/unlock` | Bearer | ADMIN | Unlock an approved goal (reset to DRAFT) |
| `POST` | `/api/admin/goals/shared` | Bearer | ADMIN | Create shared goal with recipients |
| `GET` | `/api/admin/cycles` | Bearer | ADMIN | List all goal cycles |
| `POST` | `/api/admin/cycles` | Bearer | ADMIN | Create a new cycle |
| `PATCH` | `/api/admin/cycles/:id/activate` | Bearer | ADMIN | Activate cycle (deactivates all others) |
| `PATCH` | `/api/admin/cycles/:id` | Bearer | ADMIN | Update cycle name/dates (phase/year immutable) |
| `GET` | `/api/admin/checkins/completion` | Bearer | ADMIN | Check-in completion report (`?quarter=Q1` required) |
| `PATCH` | `/api/admin/users/:id/role` | Bearer | ADMIN | Change user role and/or manager assignment |

## Health

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/health` | Public | Returns `{ status: "ok" }` |

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Employee | `priya.sharma@atomberg.com` | `Priya@2025` |
| Manager | `rohit.verma@atomberg.com` | `Rohit@2025` |
| Admin | `hr.admin@atomberg.com` | `HrAdmin@2025` |
