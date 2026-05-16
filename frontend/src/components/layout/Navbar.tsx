import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useCycleStore } from '@/store/cycleStore';
import { Bell, Briefcase, LogOut, Moon, Shield, Sun, User, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { login as apiLogin } from '@/api/auth';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const DEMO_USERS = {
  EMPLOYEE: { email: 'priya.sharma@atomberg.com', password: 'Priya@2025' },
  MANAGER: { email: 'rohit.verma@atomberg.com', password: 'Rohit@2025' },
  ADMIN: { email: 'hr.admin@atomberg.com', password: 'HrAdmin@2025' },
};

const THEME_KEY = 'atomquest-theme';

export default function Navbar() {
  const { user, logout, login } = useAuthStore();
  const { activeCycle } = useCycleStore();
  const navigate = useNavigate();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleRoleSwitch = async (role: keyof typeof DEMO_USERS) => {
    try {
      const creds = DEMO_USERS[role];
      const res = await apiLogin(creds.email, creds.password);
      login(res.user, res.token);
      toast.success(`Switched to ${role} role`);
      
      if (res.user.role === 'EMPLOYEE') navigate('/goals');
      else if (res.user.role === 'MANAGER') navigate('/team');
      else if (res.user.role === 'ADMIN') navigate('/admin/dashboard');
    } catch (err) {
      toast.error('Failed to switch role');
    }
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-surface border-b border-border z-10 shrink-0">
      <div className="flex items-center gap-4">
        {/* Mobile Logo */}
        <div className="md:hidden font-bold text-lg text-brand-navy flex items-center gap-2">
          <Zap className="w-5 h-5 text-brand-orange" />
          AtomQuest
        </div>
      </div>

      <div className="flex items-center justify-center flex-1">
        {activeCycle && (
          <Badge variant="secondary" className="bg-slate-100 text-slate-700 font-medium px-3 py-1">
            {activeCycle.name} &middot; <span className="text-brand-orange ml-1">{activeCycle.phase.replaceAll('_', ' ')}</span>
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="text-text-secondary relative" aria-label="Notifications">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-brand-orange rounded-full"></span>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="text-text-secondary"
          aria-label="Toggle dark mode"
          onClick={toggleTheme}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full" aria-label="User menu">
              <Avatar className="h-8 w-8 bg-brand-navy text-white">
                <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
                <div className="mt-2">
                  <Badge variant="outline" className="text-xs">
                    {user?.role}
                  </Badge>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Switch Role (Demo)</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => handleRoleSwitch('EMPLOYEE')}>
              <User className="mr-2 h-4 w-4" />
              Employee View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleRoleSwitch('MANAGER')}>
              <Briefcase className="mr-2 h-4 w-4" />
              Manager View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleRoleSwitch('ADMIN')}>
              <Shield className="mr-2 h-4 w-4" />
              Admin View
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
