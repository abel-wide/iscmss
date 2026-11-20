'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  KeyRound,
  Shield,
  ShieldAlert,
  CheckCircle2,
  Check,
  X,
  Eye,
  EyeOff,
  ArrowLeft,
  Mail,
  Copy,
} from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();

  // Step 1: Request Code | Step 2: Reset Password
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [copied, setCopied] = useState(false);

  // Password rules validation
  const rules = useMemo(() => {
    return {
      length: newPassword.length >= 8,
      upper: /[A-Z]/.test(newPassword),
      lower: /[a-z]/.test(newPassword),
      number: /[0-9]/.test(newPassword),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(newPassword),
      match: newPassword.length > 0 && newPassword === confirmPassword,
    };
  }, [newPassword, confirmPassword]);

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

  // Step 1: Request Code
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/forgot-password', { email });
      setGeneratedCode(res.data.code);
      setCode(res.data.code); // pre-populate for ease of use
      setSuccessMessage('Reset code generated successfully! Valid for 15 minutes.');
      setStep(2);
    } catch (err: unknown) {
      const errObj = err as { response?: { data?: { message?: string } } };
      setError(errObj.response?.data?.message || 'Failed to send reset code. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!code.trim()) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    if (!isPasswordValid) {
      setError('Please fulfill all password security requirements before proceeding.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/reset-password', {
        email,
        code,
        newPassword,
      });

      setSuccessMessage(res.data.message || 'Password has been reset successfully! Redirecting to login...');
      setTimeout(() => {
        router.push('/login');
      }, 2500);
    } catch (err: unknown) {
      const errObj = err as { response?: { data?: { message?: string } } };
      setError(errObj.response?.data?.message || 'Failed to reset password. Please check your code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-12">
      <Card className="w-full max-w-md shadow-lg border-slate-200">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-2">
            <div className="bg-blue-600 p-2.5 rounded-xl text-white">
              <KeyRound className="h-6 w-6" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">
            {step === 1 ? 'Forgot Password?' : 'Reset Your Password'}
          </CardTitle>
          <CardDescription>
            {step === 1
              ? 'Enter your registered email address to receive a secure password reset code.'
              : 'Enter the 6-digit verification code and choose a new strong password.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* STEP 1: REQUEST CODE */}
          {step === 1 && (
            <form onSubmit={handleRequestCode} className="space-y-4">
              <div>
                <Label htmlFor="forgot-email">Email Address *</Label>
                <div className="relative mt-1">
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="name@iscmss.edu.et"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-9"
                  />
                  <Mail className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-start gap-2">
                  <ShieldAlert className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" className="w-full gap-2 mt-2" disabled={loading}>
                <span>{loading ? 'Sending Code...' : 'Get Reset Code'}</span>
              </Button>
            </form>
          )}

          {/* STEP 2: ENTER CODE & SET NEW PASSWORD */}
          {step === 2 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {/* Generated Code Notice Box */}
              {generatedCode && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs space-y-1.5">
                  <div className="flex items-center justify-between font-semibold text-blue-900">
                    <span>Verification Code:</span>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                    >
                      <Copy className="h-3 w-3" />
                      <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                    </button>
                  </div>
                  <div className="text-xl font-mono tracking-widest text-blue-800 font-bold bg-white p-2 rounded text-center border border-blue-200">
                    {generatedCode}
                  </div>
                  <p className="text-[11px] text-blue-700 text-center">
                    Valid for 15 minutes. Use this code to unlock and reset your account.
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="reset-code">6-Digit Verification Code *</Label>
                <Input
                  id="reset-code"
                  type="text"
                  maxLength={6}
                  placeholder="e.g. 123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  className="mt-1 font-mono tracking-wider text-center text-lg"
                />
              </div>

              {/* New Password */}
              <div>
                <Label htmlFor="reset-password">New Password *</Label>
                <div className="relative mt-1">
                  <Input
                    id="reset-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new strong password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
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
                {newPassword.length > 0 && (
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

                {/* Requirements Checklist */}
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
                <Label htmlFor="reset-confirm">Confirm New Password *</Label>
                <div className="relative mt-1">
                  <Input
                    id="reset-confirm"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter new password"
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

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-start gap-2">
                  <ShieldAlert className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-xs flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              <Button type="submit" className="w-full gap-2 mt-2" disabled={loading}>
                <CheckCircle2 className="h-4 w-4" />
                <span>{loading ? 'Resetting Password...' : 'Reset Password & Unlock'}</span>
              </Button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-xs text-slate-500 hover:text-slate-800 text-center block pt-1"
              >
                &larr; Request a different code
              </button>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-slate-100 text-center text-sm text-slate-600">
            Remember your credentials?{' '}
            <Link href="/login" className="text-blue-600 font-semibold hover:underline inline-flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Login</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
