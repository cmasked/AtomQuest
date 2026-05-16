import { useAuthStore } from '@/store/authStore';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Target, 
  TrendingUp, 
  History, 
  Users, 
  CheckSquare, 
  MessageSquare, 
  BarChart, 
  LayoutDashboard, 
  Settings, 
  UserCircle,
  FileText,
  ShieldAlert,
  Zap
} from 'lucide-react';

export default function Sidebar({ isOpen }: { isOpen: boolean; setIsOpen: (v: boolean) => void }) {
  const { user } = useAuthStore();
  const role = user?.role || 'EMPLOYEE';

  const navItems = {
    EMPLOYEE: [
      { name: 'My Goals', path: '/goals', icon: Target },
      { name: 'My Progress', path: '/progress', icon: TrendingUp },
      { name: 'Check-in History', path: '/checkins', icon: History },
    ],
    MANAGER: [
      { name: 'Team Overview', path: '/team', icon: Users },
      { name: 'Pending Approvals', path: '/approvals', icon: CheckSquare },
      { name: 'Team Check-ins', path: '/checkins/team', icon: MessageSquare },
      { name: 'Team Reports', path: '/reports', icon: BarChart },
    ],
    ADMIN: [
      { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
      { name: 'Cycle Management', path: '/admin/cycles', icon: Settings },
      { name: 'All Employees', path: '/admin/employees', icon: UserCircle },
      { name: 'Completion Report', path: '/admin/completion', icon: FileText },
      { name: 'Audit Logs', path: '/admin/audit', icon: ShieldAlert },
    ]
  };

  const items = navItems[role as keyof typeof navItems] || navItems.EMPLOYEE;

  return (
    <aside className={cn(
      "bg-brand-navy text-slate-300 transition-all duration-300 flex flex-col h-full shrink-0",
      isOpen ? "w-64" : "w-20 hidden md:flex"
    )}>
      {/* Logo Area */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <div className="flex items-center gap-3 w-full">
          <div className="w-8 h-8 rounded bg-brand-orange flex items-center justify-center shrink-0 text-white">
            <Zap className="w-4 h-4" />
          </div>
          {isOpen && <span className="font-bold text-lg text-white tracking-wide truncate">AtomQuest</span>}
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group",
              isActive 
                ? "bg-brand-orange/10 text-brand-orange font-medium" 
                : "hover:bg-slate-800 hover:text-white"
            )}
            title={!isOpen ? item.name : undefined}
          >
            <item.icon className={cn(
              "w-5 h-5 shrink-0",
              // We'll let the active state cascade color or set it here if needed
            )} />
            {isOpen && <span className="truncate">{item.name}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User Area Bottom */}
      <div className="p-4 border-t border-slate-800">
        <div className={cn("flex items-center gap-3", !isOpen && "justify-center")}>
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700">
            {user?.name?.charAt(0) || 'U'}
          </div>
          {isOpen && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-white truncate">{user?.name}</span>
              <span className="text-xs text-slate-400 truncate">{user?.role}</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
