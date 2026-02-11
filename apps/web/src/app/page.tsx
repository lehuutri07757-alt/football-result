'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/auth.store';
import { ThemeToggle } from '@/components/ThemeToggle';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, isAuthenticated, checkAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    const check = async () => {
      await checkAuth();
    };
    check();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-colors duration-300">
      <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:20px_20px] opacity-5"></div>
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none"></div>

      <nav className="absolute top-0 w-full border-b border-slate-200 bg-white/80 dark:border-white/5 dark:bg-slate-950/80 backdrop-blur-md z-10">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
              <Trophy className="h-5 w-5 text-white dark:text-slate-950" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Sports<span className="text-emerald-500">Bet</span>
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <Card className="w-full max-w-md relative z-10 border-slate-200 bg-white/50 dark:border-slate-800 dark:bg-slate-900/50 backdrop-blur-xl shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
            <Trophy className="h-6 w-6 text-emerald-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">Welcome Back</CardTitle>
          <CardDescription className="text-slate-500 dark:text-slate-400">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-slate-700 dark:text-slate-200">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                className="bg-white/50 border-slate-200 text-slate-900 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:bg-slate-950/50 dark:border-slate-800 dark:text-white transition-all"
                {...register('username')}
              />
              {errors.username && (
                <p className="text-sm text-red-500 font-medium">{errors.username.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700 dark:text-slate-200">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className="bg-white/50 border-slate-200 text-slate-900 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:bg-slate-950/50 dark:border-slate-800 dark:text-white transition-all pr-10"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500 font-medium">{errors.password.message}</p>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white dark:hover:bg-emerald-400 dark:text-slate-950 font-bold shadow-lg shadow-emerald-500/20 dark:shadow-emerald-900/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
            

          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
