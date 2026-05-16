import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { login as apiLogin } from '@/api/auth';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Briefcase, Eye, EyeOff, Loader2, Shield, User, Zap } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const DEMO_USERS = {
  EMPLOYEE: { email: 'priya.sharma@atomberg.com', password: 'Priya@2025' },
  MANAGER: { email: 'rohit.verma@atomberg.com', password: 'Rohit@2025' },
  ADMIN: { email: 'hr.admin@atomberg.com', password: 'HrAdmin@2025' },
};

export default function LoginPage() {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Login | AtomQuest';
  }, []);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onBlur',
    reValidateMode: 'onBlur',
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await apiLogin(data.email, data.password);
      login(res.user, res.token);
      toast.success('Login successful');
      
      // Redirect based on role
      if (res.user.role === 'EMPLOYEE') navigate('/goals');
      else if (res.user.role === 'MANAGER') navigate('/team');
      else if (res.user.role === 'ADMIN') navigate('/admin/dashboard');
      else navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid email or password');
      toast.error('Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = async (role: keyof typeof DEMO_USERS) => {
    const creds = DEMO_USERS[role];
    form.setValue('email', creds.email);
    form.setValue('password', creds.password);
    await onSubmit(creds);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-muted p-4">
      <Card className="w-full max-w-md shadow-lg border-none">
        <CardHeader className="space-y-3 text-center pb-8 pt-8">
          <div className="mx-auto bg-brand-orange/10 w-16 h-16 rounded-full flex items-center justify-center mb-2">
            <Zap className="w-8 h-8 text-brand-orange" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight text-brand-navy">
            AtomQuest
          </CardTitle>
          <CardDescription className="text-base text-text-secondary">
            Atomberg Technologies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@atomberg.com"
                {...form.register('email')}
                className={form.formState.errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...form.register('password')}
                  className={form.formState.errors.password ? "border-red-500 focus-visible:ring-red-500 pr-10" : "pr-10"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm text-center">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full bg-brand-orange hover:bg-brand-orange/90 text-white font-medium h-11 mt-6"
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col border-t border-slate-100 pt-6 pb-8 bg-slate-50 rounded-b-xl gap-3">
          <p className="text-sm text-slate-500 font-medium w-full text-center mb-2">Quick login for evaluators</p>
          <div className="grid grid-cols-3 gap-2 w-full">
            <Button variant="outline" size="sm" onClick={() => handleQuickLogin('EMPLOYEE')} className="bg-white" disabled={isSubmitting}>
              <User className="w-4 h-4 mr-2" />
              Employee
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleQuickLogin('MANAGER')} className="bg-white" disabled={isSubmitting}>
              <Briefcase className="w-4 h-4 mr-2" />
              Manager
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleQuickLogin('ADMIN')} className="bg-white" disabled={isSubmitting}>
              <Shield className="w-4 h-4 mr-2" />
              Admin
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
