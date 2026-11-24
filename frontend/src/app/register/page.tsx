'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Check, X, Shield, ShieldAlert, ShieldCheck, Eye, EyeOff, BookOpen } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<'PARENT' | 'STUDENT'>('PARENT');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Password rules validation
  const rules = useMemo(() => {
    return {
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password),
      match: password.length > 0 && password === confirmPassword,
    };
  }, [password, confirmPassword]);

  const strengthScore = useMemo(() => {
    let score = 0;
    if (rules.length) score += 1;
    if (rules.upper) score += 1;
    if (rules.lower) score += 1;
    if (rules.number) score += 1;
    if (rules.special) score += 1;
    return score;
  }, [rules]);

  const isPasswordValid = rules.length && rules.upper && rules.lower && rules.number && rules.special;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isPasswordValid) {
      setError('Please fulfill all password security requirements before proceeding.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/register', {
        fullName,
        email,
        phone: phone || undefined,
        password,
        role,
      });

      const authToken = res.data.token;
      if (authToken) {
        localStorage.setItem('token', authToken);
        localStorage.setItem('user', JSON.stringify(res.data.user));

        if (res.data.user.role === 'PARENT') {
          router.push('/parent');
        } else if (res.data.user.role === 'STUDENT') {
          router.push('/student');
        } else {
          router.push('/login');
        }
      } else {
        router.push('/login');
      }
    } catch (err: unknown) {
      const errObj = err as { response?: { data?: { message?: string | string[] } } };
      const msg = errObj.response?.data?.message;
      if (Array.isArray(msg)) {
        setError(msg.join('. '));
      } else {
        setError(msg || 'Registration failed. Please check your inputs.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-12">
      <Card className="w-full max-w-lg shadow-lg border-slate-200">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-2">
            <div className="bg-blue-600 p-2.5 rounded-xl text-white">
              <BookOpen className="h-6 w-6" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">Create an Account</CardTitle>
          <CardDescription>
            Join ISCMS to access student grades, attendance, payments, and learning resources.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sign up with Google */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-11 border-slate-300 hover:bg-slate-50 gap-3 font-semibold text-slate-700 shadow-sm"
            onClick={() => router.push('/login')}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
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
            <span>Continue with Google</span>
          </Button>

          {/* Divider */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-xs uppercase font-medium text-slate-400">
              Or register with email
            </span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Role Switcher */}
            <div>
              <Label className="text-xs font-semibold uppercase text-slate-500 mb-1.5 block">I am registering as</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('PARENT')}
                  className={`py-2 px-3 rounded-lg border text-sm font-medium transition ${
                    role === 'PARENT'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Parent / Guardian
                </button>
                <button
                  type="button"
                  onClick={() => setRole('STUDENT')}
                  className={`py-2 px-3 rounded-lg border text-sm font-medium transition ${
                    role === 'STUDENT'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Student
                </button>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <Label htmlFor="reg-name">Full Name *</Label>
              <Input
                id="reg-name"
                type="text"
                placeholder="e.g. Almaz Tadesse"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="mt-1"
              />
            </div>

            {/* Email Address */}
            <div>
              <Label htmlFor="reg-email">Email Address *</Label>
              <Input
                id="reg-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1"
              />
            </div>

            {/* Phone */}
            <div>
              <Label htmlFor="reg-phone">Phone Number (Optional)</Label>
              <Input
                id="reg-phone"
                type="tel"
                placeholder="+251 91 234 5678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Password */}
            <div>
              <Label htmlFor="reg-password">Password *</Label>
              <div className="relative mt-1">
                <Input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter strong password"
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

              {/* Strength Meter Bar */}
              {password.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-500">Security Strength:</span>
                    <span
                      className={
                        strengthScore <= 2
                          ? 'text-red-500'
                          : strengthScore <= 4
                          ? 'text-amber-500'
                          : 'text-green-600'
                      }
                    >
                      {strengthScore <= 2 ? 'Weak' : strengthScore <= 4 ? 'Medium' : 'Very Strong'}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                    <div
                      className={`h-full transition-all duration-300 ${
                        strengthScore <= 2
                          ? 'bg-red-500 w-1/3'
                          : strengthScore <= 4
                          ? 'bg-amber-500 w-2/3'
                          : 'bg-green-600 w-full'
                      }`}
                    />
                  </div>
                </div>
              )}

              {/* Password Requirements Checklist */}
              <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5">
                <p className="font-semibold text-slate-700 flex items-center gap-1">
                  <Shield className="h-3.5 w-3.5 text-blue-600" />
                  <span>Password Requirements:</span>
                </p>
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <span className={`flex items-center gap-1 ${rules.length ? 'text-green-600 font-medium' : 'text-slate-500'}`}>
                    {rules.length ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5 text-slate-400" />}
                    At least 8 characters
                  </span>
                  <span className={`flex items-center gap-1 ${rules.upper ? 'text-green-600 font-medium' : 'text-slate-500'}`}>
                    {rules.upper ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5 text-slate-400" />}
                    Uppercase letter (A-Z)
                  </span>
                  <span className={`flex items-center gap-1 ${rules.lower ? 'text-green-600 font-medium' : 'text-slate-500'}`}>
                    {rules.lower ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5 text-slate-400" />}
                    Lowercase letter (a-z)
                  </span>
                  <span className={`flex items-center gap-1 ${rules.number ? 'text-green-600 font-medium' : 'text-slate-500'}`}>
                    {rules.number ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5 text-slate-400" />}
                    One number (0-9)
                  </span>
                  <span className={`flex items-center gap-1 col-span-2 ${rules.special ? 'text-green-600 font-medium' : 'text-slate-500'}`}>
                    {rules.special ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5 text-slate-400" />}
                    Special character (!@#$%^&*)
                  </span>
                </div>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <Label htmlFor="reg-confirm">Confirm Password *</Label>
              <div className="relative mt-1">
                <Input
                  id="reg-confirm"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition p-1"
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmPassword.length > 0 && (
                <p className={`text-xs mt-1 flex items-center gap-1 ${rules.match ? 'text-green-600' : 'text-red-500'}`}>
                  {rules.match ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  {rules.match ? 'Passwords match' : 'Passwords do not match'}
                </p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
                <ShieldAlert className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" className="w-full gap-2 mt-2" disabled={loading}>
              <ShieldCheck className="h-4 w-4" />
              <span>{loading ? 'Creating Account...' : 'Sign Up'}</span>
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 font-medium hover:underline">
              Sign In
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
