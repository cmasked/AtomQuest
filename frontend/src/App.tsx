import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useCycleStore } from '@/store/cycleStore';
import { Toaster } from 'react-hot-toast';
import api from '@/lib/axios';

import AppShell from '@/components/layout/AppShell';
import LoginPage from '@/pages/LoginPage';
import MyGoalsPage from '@/pages/MyGoalsPage';
import MyProgressPage from '@/pages/MyProgressPage';
import CheckinHistoryPage from '@/pages/CheckinHistoryPage';
import TeamOverviewPage from '@/pages/TeamOverviewPage';
import PendingApprovalsPage from '@/pages/PendingApprovalsPage';

import TeamCheckinsPage from '@/pages/TeamCheckinsPage';
import TeamReportsPage from '@/pages/TeamReportsPage';
import AdminDashboardPage from '@/pages/AdminDashboardPage';
import CompletionReportPage from '@/pages/CompletionReportPage';
import CycleManagementPage from '@/pages/CycleManagementPage';
import EmployeesPage from '@/pages/EmployeesPage';
import AuditLogsPage from '@/pages/AuditLogsPage';
import AnalyticsDashboardPage from '@/pages/AnalyticsDashboardPage';

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to default role page if they try to access unauthorized route
    if (user.role === 'EMPLOYEE') return <Navigate to="/goals" replace />;
    if (user.role === 'MANAGER') return <Navigate to="/team" replace />;
    if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const RoleRedirect = () => {
  const { user } = useAuthStore();

  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'EMPLOYEE') return <Navigate to="/goals" replace />;
  if (user.role === 'MANAGER') return <Navigate to="/team" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/login" replace />;
};

export default function App() {
  const { setActiveCycle } = useCycleStore();
  const { isAuthenticated } = useAuthStore();

  // Fetch active cycle on load
  useEffect(() => {
    const fetchCycle = async () => {
      try {
        const { data } = await api.get('/cycles/active');
        if (data.cycle) setActiveCycle(data.cycle);
      } catch (e) {
        console.error('Failed to fetch active cycle', e);
      }
    };
    if (isAuthenticated) fetchCycle();
  }, [isAuthenticated, setActiveCycle]);

  return (
    <BrowserRouter>
      <Toaster position="bottom-right" />
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Routes inside AppShell */}
        <Route path="/" element={<AppShell />}>
          {/* Index Redirect */}
          <Route
            index
            element={
              <ProtectedRoute>
                <RoleRedirect />
              </ProtectedRoute>
            }
          />

          {/* Employee Routes */}
          <Route path="goals" element={<ProtectedRoute allowedRoles={['EMPLOYEE']}><MyGoalsPage /></ProtectedRoute>} />
          <Route path="progress" element={<ProtectedRoute allowedRoles={['EMPLOYEE']}><MyProgressPage /></ProtectedRoute>} />
          <Route path="checkins" element={<ProtectedRoute allowedRoles={['EMPLOYEE']}><CheckinHistoryPage /></ProtectedRoute>} />

          {/* Manager Routes */}
          <Route path="team" element={<ProtectedRoute allowedRoles={['MANAGER']}><TeamOverviewPage /></ProtectedRoute>} />
          <Route path="approvals" element={<ProtectedRoute allowedRoles={['MANAGER']}><PendingApprovalsPage /></ProtectedRoute>} />
          <Route path="checkins/team" element={<ProtectedRoute allowedRoles={['MANAGER']}><TeamCheckinsPage /></ProtectedRoute>} />
          <Route path="reports" element={<ProtectedRoute allowedRoles={['MANAGER']}><TeamReportsPage /></ProtectedRoute>} />

          {/* Admin Routes */}
          <Route path="admin/dashboard" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboardPage /></ProtectedRoute>} />
          <Route path="admin/analytics" element={<ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}><AnalyticsDashboardPage /></ProtectedRoute>} />
          <Route path="admin/completion" element={<ProtectedRoute allowedRoles={['ADMIN']}><CompletionReportPage /></ProtectedRoute>} />
          <Route path="admin/cycles" element={<ProtectedRoute allowedRoles={['ADMIN']}><CycleManagementPage /></ProtectedRoute>} />
          <Route path="admin/employees" element={<ProtectedRoute allowedRoles={['ADMIN']}><EmployeesPage /></ProtectedRoute>} />
          <Route path="admin/audit" element={<ProtectedRoute allowedRoles={['ADMIN']}><AuditLogsPage /></ProtectedRoute>} />
        </Route>

        <Route path="*" element={
          <div className="flex h-screen items-center justify-center bg-surface-muted">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-brand-navy mb-2">404</h1>
              <p className="text-text-secondary mb-6">Page not found</p>
              <a href="/" className="text-brand-orange hover:underline font-medium">Back to Home</a>
            </div>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}
