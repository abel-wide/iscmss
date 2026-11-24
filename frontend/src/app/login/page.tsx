'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Lock, ShieldAlert, Eye, EyeOff, BookOpen, LogIn, CheckCircle } from 'lucide-react';

function GoogleIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(false);

  // Google sign-in states
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [googleRole, setGoogleRole] = useState<'PARENT' | 'STUDENT'>('PARENT');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState('');

  const navigateByRole = (role: string) => {
    if (role === 'ADMIN') router.push('/admin');
    else if (role === 'HEAD') router.push('/head');
    else if (role === 'REGISTRAR') router.push('/registrar');
    else if (role === 'TEACHER' || role === 'ROOM_TEACHER') router.push('/teacher');
    else if (role === 'PARENT') router.push('/parent');
    else if (role === 'STUDENT') router.push('/student');
    else router.push('/');
  };

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

      navigateByRole(res.data.user.role);
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

  const executeGoogleLogin = async (targetEmail: string, targetName: string) => {
    setGoogleError('');
    setGoogleLoading(true);

    try {
      const res = await api.post('/auth/google', {
        email: targetEmail,
        fullName: targetName,
        role: googleRole,
      });

      const authToken = res.data.token || res.data.access_token;
      localStorage.setItem('token', authToken);
      localStorage.setItem('user', JSON.stringify(res.data.user));

      setShowGoogleModal(false);
      navigateByRole(res.data.user.role);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setGoogleError(errorObj.response?.data?.message || 'Google authentication failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleCustomGoogleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail.trim()) {
      setGoogleError('Please enter a valid Google account email.');
      return;
    }
    executeGoogleLogin(googleEmail.trim(), googleName.trim());
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
            Enter your credentials or continue with Google to access your dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Continue with Google button */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-11 border-slate-300 hover:bg-slate-50 gap-3 font-semibold text-slate-700 shadow-sm"
            onClick={() => setShowGoogleModal(true)}
          >
            <GoogleIcon className="h-5 w-5" />
            <span>Continue with Google</span>
          </Button>

          {/* Divider */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-xs uppercase font-medium text-slate-400">
              Or sign in with email
            </span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

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

      {/* Google Sign-In Dialog */}
      <Dialog open={showGoogleModal} onOpenChange={setShowGoogleModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center pb-2">
            <div className="flex justify-center mb-2">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-full shadow-sm">
                <GoogleIcon className="h-8 w-8" />
              </div>
            </div>
            <DialogTitle className="text-xl font-bold text-slate-900">
              Sign in with Google
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Choose an account to continue to ISCMS School Management
            </DialogDescription>
          </DialogHeader>

          {googleError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              {googleError}
            </div>
          )}

          <div className="space-y-4 pt-2">
            {/* Quick Demo Google Accounts */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Quick Sign-in with Demo Google Account:
              </Label>
              <div className="space-y-2">
                <button
                  type="button"
                  disabled={googleLoading}
                  onClick={() => executeGoogleLogin('almaz.parent.google@gmail.com', 'Almaz Tefera')}
                  className="w-full p-3 border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 rounded-xl flex items-center justify-between text-left transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm">
                      A
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-700">
                        Almaz Tefera
                      </p>
                      <p className="text-xs text-slate-500">almaz.parent.google@gmail.com</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    Parent
                  </span>
                </button>

                <button
                  type="button"
                  disabled={googleLoading}
                  onClick={() => executeGoogleLogin('samuel.student.google@gmail.com', 'Samuel Dawit')}
                  className="w-full p-3 border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 rounded-xl flex items-center justify-between text-left transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-sm">
                      S
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 group-hover:text-purple-700">
                        Samuel Dawit
                      </p>
                      <p className="text-xs text-slate-500">samuel.student.google@gmail.com</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                    Student
                  </span>
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-3 text-xs uppercase font-medium text-slate-400">
                Or use another Google account
              </span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* Custom Google Account Form */}
            <form onSubmit={handleCustomGoogleSubmit} className="space-y-3">
              <div>
                <Label htmlFor="google-email-input" className="text-xs font-medium text-slate-700">
                  Google Email Address
                </Label>
                <Input
                  id="google-email-input"
                  type="email"
                  placeholder="yourname@gmail.com"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  required
                  className="mt-1 text-sm"
                />
              </div>

              <div>
                <Label htmlFor="google-name-input" className="text-xs font-medium text-slate-700">
                  Full Name
                </Label>
                <Input
                  id="google-name-input"
                  type="text"
                  placeholder="e.g. Abebe Kebede"
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  className="mt-1 text-sm"
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-slate-700 block mb-1">
                  Default Role for New Account:
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setGoogleRole('PARENT')}
                    className={`py-2 text-xs font-semibold rounded-lg border transition ${
                      googleRole === 'PARENT'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Parent
                  </button>
                  <button
                    type="button"
                    onClick={() => setGoogleRole('STUDENT')}
                    className={`py-2 text-xs font-semibold rounded-lg border transition ${
                      googleRole === 'STUDENT'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Student
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white mt-2"
                disabled={googleLoading}
              >
                {googleLoading ? 'Signing in with Google...' : 'Continue to Account'}
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
