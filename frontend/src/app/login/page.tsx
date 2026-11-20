'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Lock, AlertTriangle, ShieldAlert, Eye, EyeOff, BookOpen, LogIn } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLocked(false);
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      const authToken = res.data.token || res.data.access_token;
      localStorage.setItem('token', authToken);
      localStorage.setItem('user', JSON.stringify(res.data.user));

      const role = res.data.user.role;
      if (role === 'ADMIN') router.push('/admin');
      else if (role === 'HEAD') router.push('/head');
      else if (role === 'REGISTRAR') router.push('/registrar');
      else if (role === 'TEACHER' || role === 'ROOM_TEACHER') router.push('/teacher');
      else if (role === 'PARENT') router.push('/parent');
      else if (role === 'STUDENT') router.push('/student');
      else router.push('/');
    } catch (err: unknown) {
      const errorObj = err as {
        response?: {
          status?: number;
          data?: { message?: string };
        };
      };
      const message = errorObj.response?.data?.message || 'Login failed. Please check your credentials.';
      const status = errorObj.response?.status;

      if (status === 403 || message.toLowerCase().includes('locked')) {
        setIsLocked(true);
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-lg border-slate-200">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-2">
            <div className="bg-blue-600 p-2.5 rounded-xl text-white">
              <BookOpen className="h-6 w-6" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">ISCMS Portal Login</CardTitle>
          <CardDescription>
            Enter your credentials to access your institutional dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="login-email">Email Address</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="name@iscmss.edu.et"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1"
              />
            </div>

            <div>
              <div className="flex justify-between items-center">
                <Label htmlFor="login-password">Password</Label>
                <Link href="/forgot-password" className="text-xs text-blue-600 hover:underline font-medium">
                  Forgot password?
                </Link>
              </div>
              <div className="relative mt-1">
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition p-1"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Error / Lockout Banner */}
            {error && (
              <div
                className={`p-3.5 rounded-xl border flex items-start gap-3 text-sm ${
                  isLocked
                    ? 'bg-red-50 border-red-300 text-red-800'
                    : 'bg-amber-50 border-amber-300 text-amber-800'
                }`}
              >
                {isLocked ? (
                  <Lock className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <ShieldAlert className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <p className="font-semibold text-xs uppercase tracking-wider">
                    {isLocked ? 'Security Lockout Activated' : 'Authentication Warning'}
                  </p>
                  <p className="text-xs leading-relaxed">{error}</p>
                  {isLocked && (
                    <div className="text-xs text-red-700 font-medium pt-1 flex items-center gap-3">
                      <Link href="/forgot-password" className="underline font-bold text-red-900 hover:text-black">
                        Reset Password Now
                      </Link>
                      <span>•</span>
                      <Link href="/contact" className="underline">
                        Contact Support
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            <Button type="submit" className="w-full gap-2 mt-2" disabled={loading}>
              <LogIn className="h-4 w-4" />
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            </Button>
          </form>

          {/* Registration Link */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center text-sm text-slate-600">
            Don't have an account yet?{' '}
            <Link href="/register" className="text-blue-600 font-semibold hover:underline">
              Sign Up
            </Link>
          </div>

          <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 text-center">
            Demo Credentials: <br />
            <strong>admin@iscms.local</strong> / <strong>Admin@1234</strong>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
