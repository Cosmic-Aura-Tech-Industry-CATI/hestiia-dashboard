'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Lock,
  User,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  CheckCircle,
  Mail,
  RefreshCw,
  Sparkles,
  ChefHat,
  UtensilsCrossed,
} from 'lucide-react';
import { adminApi } from '../services/adminApi';

type LoginStep = 'CREDENTIALS' | 'OTP_VERIFY';

export const StaffLogin: React.FC = () => {
  const router = useRouter();

  // Core Login State
  const [step, setStep] = useState<LoginStep>('CREDENTIALS');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 2FA OTP State (if enabled by server)
  const [userEmail, setUserEmail] = useState<string>('');
  const [otpSessionId, setOtpSessionId] = useState<string>('');
  const [maskedEmail, setMaskedEmail] = useState<string>('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [isResending, setIsResending] = useState<boolean>(false);
  const [devOtpNotification, setDevOtpNotification] = useState<string | null>(null);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer countdown effect for resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Focus first OTP box whenever entering OTP step
  useEffect(() => {
    if (step === 'OTP_VERIFY') {
      setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
    }
  }, [step]);

  // ==========================================
  // Handlers: Step 1 - Staff Credential Check
  // ==========================================
  const handleCredentialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setDevOtpNotification(null);

    try {
      const res = await adminApi.staffLogin({ username, password });

      if (res.requireOtp) {
        const emailToUse = res.email || username;
        setUserEmail(emailToUse);
        setOtpSessionId(res.otpSessionId || '');
        setMaskedEmail(res.maskedEmail || emailToUse);
        setResendCooldown(res.resendCooldownSeconds || res.expiresInSeconds || 60);
        setOtpDigits(['', '', '', '', '', '']);
        if (res.devOtp) {
          setDevOtpNotification(res.devOtp);
        }
        setStep('OTP_VERIFY');
      } else if ((res.token || res.accessToken) && res.user) {
        const token = res.token || res.accessToken!;
        localStorage.setItem('hestiia_admin_token', token);
        if (res.refreshToken) {
          localStorage.setItem('hestiia_admin_refresh_token', res.refreshToken);
        }
        localStorage.setItem('hestiia_admin_user', JSON.stringify(res.user));
        router.replace('/admin/dashboard');
      } else {
        setErrorMessage(res.message || 'Staff authentication failed. Please check your credentials.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid username or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // Handlers: Step 2 - 2FA OTP Verification
  // ==========================================
  const handleOtpDigitChange = (index: number, value: string) => {
    const cleanVal = value.replace(/\D/g, '').slice(-1);
    const targetDigits = [...otpDigits];
    targetDigits[index] = cleanVal;
    setOtpDigits(targetDigits);

    // Auto-advance
    if (cleanVal && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // Auto-submit if all 6 filled
    const fullOtp = targetDigits.join('');
    if (fullOtp.length === 6 && !targetDigits.includes('')) {
      submitOtpVerification(fullOtp);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const digits = pasted.split('');
    const newDigits = ['', '', '', '', '', ''];
    digits.forEach((d, i) => {
      newDigits[i] = d;
    });
    setOtpDigits(newDigits);
    const nextIdx = Math.min(digits.length, 5);
    otpInputRefs.current[nextIdx]?.focus();

    if (pasted.length === 6) {
      submitOtpVerification(pasted);
    }
  };

  const submitOtpVerification = async (otpCode: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await adminApi.verifyOtp({
        email: userEmail,
        otpSessionId: otpSessionId || undefined,
        otp: otpCode,
      });

      if (res.success && (res.token || res.accessToken)) {
        const token = res.token || res.accessToken!;
        localStorage.setItem('hestiia_admin_token', token);
        if (res.refreshToken) {
          localStorage.setItem('hestiia_admin_refresh_token', res.refreshToken);
        }
        localStorage.setItem('hestiia_admin_user', JSON.stringify(res.user));
        setSuccessMessage('Verification successful! Accessing staff portal...');
        setTimeout(() => router.replace('/admin/dashboard'), 600);
      } else {
        setErrorMessage(res.message || 'Invalid or expired verification code.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'OTP verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    setErrorMessage(null);

    try {
      const res = await adminApi.resendOtp({
        email: userEmail,
        otpSessionId: otpSessionId || undefined,
      });

      if (res.success) {
        setResendCooldown(res.resendCooldownSeconds || res.expiresInSeconds || 60);
        setSuccessMessage('New verification code sent to your email.');
        if (res.devOtp) {
          setDevOtpNotification(res.devOtp);
        }
      } else {
        setErrorMessage(res.message || 'Failed to resend code. Please try again later.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not dispatch a new code.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-[#0a0908] selection:bg-gold/30 selection:text-gold-light">
      {/* Dynamic Animated Glassmorphism Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-5%] w-[45vw] h-[45vw] max-w-[500px] max-h-[500px] rounded-full bg-gradient-to-br from-amber-600/15 via-gold/10 to-transparent blur-3xl animate-pulse" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full bg-gradient-to-tl from-gold/15 via-amber-700/10 to-transparent blur-3xl" />
        <div className="absolute top-[35%] left-[25%] w-[25vw] h-[25vw] rounded-full bg-gold/5 blur-[120px]" />
        
        {/* Subtle Luxury Grid Overlay */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `radial-gradient(rgba(212, 175, 55, 0.6) 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      <div className="relative w-full max-w-md z-10 my-auto">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-block relative group mb-4">
            <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl border border-gold/40 bg-gradient-to-b from-charcoal-800 to-charcoal-950 p-2 shadow-[0_10px_30px_rgba(0,0,0,0.6),0_0_20px_rgba(212,175,55,0.2)] transition-transform duration-300 group-hover:scale-105">
              <img
                src="/brand-icon.jpg"
                alt="Hestiia Logo"
                className="w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(212,175,55,0.4)]"
              />
              <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-gold/20 border border-gold/60 flex items-center justify-center text-gold backdrop-blur-sm">
                <ChefHat className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-widest text-warmwhite drop-shadow-md">
            HESTIIA RESTAURANT
          </h1>
          <div className="flex items-center justify-center space-x-2 mt-1.5">
            <span className="w-8 h-[1px] bg-gradient-to-r from-transparent to-gold/60" />
            <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.22em] text-gold font-medium">
              Staff Operations & Dining Portal
            </p>
            <span className="w-8 h-[1px] bg-gradient-to-l from-transparent to-gold/60" />
          </div>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="mb-4 p-4 rounded-2xl bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs flex flex-col space-y-2 backdrop-blur-xl animate-shake shadow-xl">
            <div className="flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
            {errorMessage.toLowerCase().includes('admin') && (
              <div className="pt-2 border-t border-rose-500/20 flex justify-end">
                <button
                  type="button"
                  onClick={() => router.push('/admin/login')}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gold text-charcoal-950 font-bold text-[11px] hover:bg-gold-light transition-all shadow-md cursor-pointer"
                >
                  <span>Go to Admin Portal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Global Success Banner */}
        {successMessage && (
          <div className="mb-4 p-3.5 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-200 text-xs flex items-start space-x-2.5 backdrop-blur-xl animate-fade-in shadow-xl">
            <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" />
            <span className="leading-relaxed">{successMessage}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 1: STAFF CREDENTIALS                                                 */}
        {/* ========================================================================= */}
        {step === 'CREDENTIALS' && (
          <div className="relative rounded-3xl bg-charcoal-900/65 backdrop-blur-2xl border border-white/10 border-t-gold/40 p-7 sm:p-9 shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.12)] transition-all duration-300">
            <div className="mb-6">
              <h2 className="font-serif text-xl font-semibold text-warmwhite flex items-center space-x-2">
                <span>Staff Operations Sign In</span>
                <span className="px-2 py-0.5 text-[10px] font-sans font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded-full uppercase tracking-wider">
                  Staff
                </span>
              </h2>
              <p className="text-xs text-beige mt-1">
                Enter your staff credentials to access orders, dining operations, and menu systems.
              </p>
            </div>

            <form onSubmit={handleCredentialSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-beige mb-1.5">
                  Staff Username or Registered Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-beige-muted">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your staff email or username"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-charcoal/70 border border-charcoal-border text-warmwhite text-xs placeholder-beige-muted focus:border-gold focus:ring-1 focus:ring-gold/40 focus:outline-none transition-all backdrop-blur-md"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-beige">
                    Security Password
                  </label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-beige-muted">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your security password"
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-charcoal/70 border border-charcoal-border text-warmwhite text-xs placeholder-beige-muted focus:border-gold focus:ring-1 focus:ring-gold/40 focus:outline-none transition-all backdrop-blur-md"
                  />
                  {/* View Password Toggle Icon */}
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-beige-muted hover:text-gold transition-colors focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'View password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !username.trim() || !password}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-gold via-gold-light to-gold hover:from-gold-dark hover:to-gold text-charcoal-950 font-bold text-xs uppercase tracking-wider shadow-[0_4px_20px_rgba(212,175,55,0.3)] hover:shadow-[0_6px_25px_rgba(212,175,55,0.45)] transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-charcoal-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Access Staff Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Switch to Admin Portal */}
            <div className="mt-5 pt-4 border-t border-charcoal-border/50 text-center">
              <p className="text-[11px] text-beige-muted">
                Restaurant Owner or Administrator?{' '}
                <button
                  type="button"
                  onClick={() => router.push('/admin/login')}
                  className="text-gold hover:text-gold-light hover:underline font-semibold transition-colors"
                >
                  Sign in to Admin Portal &rarr;
                </button>
              </p>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: 2FA OTP VERIFICATION                                              */}
        {/* ========================================================================= */}
        {step === 'OTP_VERIFY' && (
          <div className="relative rounded-3xl bg-charcoal-900/65 backdrop-blur-2xl border border-white/10 border-t-gold/40 p-7 sm:p-9 shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.12)] transition-all duration-300">
            <button
              type="button"
              onClick={() => {
                setErrorMessage(null);
                setSuccessMessage(null);
                setStep('CREDENTIALS');
              }}
              className="inline-flex items-center space-x-1.5 text-xs text-beige-muted hover:text-gold mb-4 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to credentials</span>
            </button>

            <div className="mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gold/15 border border-gold/40 flex items-center justify-center text-gold mb-3 shadow-[0_0_20px_rgba(212,175,55,0.2)]">
                <Mail className="w-6 h-6" />
              </div>
              <h2 className="font-serif text-xl font-semibold text-warmwhite">
                Enter Verification Code
              </h2>
              <p className="text-xs text-beige mt-1.5 leading-relaxed">
                We have dispatched a 6-digit verification code to{' '}
                <span className="font-medium text-gold font-mono">{maskedEmail || userEmail}</span>.
              </p>
            </div>

            {/* Dev OTP Helper Banner */}
            {devOtpNotification && (
              <div className="mb-4 p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>
                  Dev Mode Active: Your verification code is{' '}
                  <strong className="font-mono text-white text-sm tracking-widest">{devOtpNotification}</strong>
                </span>
              </div>
            )}

            {/* 6 Digit Inputs */}
            <div className="flex justify-between items-center gap-2 sm:gap-2.5 mb-6" onPaste={handleOtpPaste}>
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    otpInputRefs.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  className="w-11 h-13 sm:w-12 sm:h-14 text-center font-mono text-lg font-bold rounded-xl bg-charcoal/80 border border-charcoal-border text-warmwhite focus:border-gold focus:ring-2 focus:ring-gold/30 focus:outline-none transition-all"
                />
              ))}
            </div>

            <button
              type="button"
              disabled={isLoading || otpDigits.some((d) => !d)}
              onClick={() => submitOtpVerification(otpDigits.join(''))}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-gold via-gold-light to-gold hover:from-gold-dark hover:to-gold text-charcoal-950 font-bold text-xs uppercase tracking-wider shadow-[0_4px_20px_rgba(212,175,55,0.3)] transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-charcoal-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Verify & Access Staff Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Resend Action */}
            <div className="mt-5 text-center">
              {resendCooldown > 0 ? (
                <p className="text-xs text-beige-muted">
                  Resend verification code in{' '}
                  <span className="text-gold font-mono font-medium">{resendCooldown}s</span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isResending}
                  className="inline-flex items-center space-x-1.5 text-xs text-gold hover:text-gold-light hover:underline font-medium transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                  <span>Resend Verification Code</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Footer Security Badge */}
        <div className="mt-8 text-center text-[11px] text-beige-muted flex items-center justify-center space-x-2 drop-shadow-sm">
          <ShieldCheck className="w-3.5 h-3.5 text-gold" />
          <span>Encrypted Session &bull; Hestiia Restaurant Staff Operations</span>
        </div>
      </div>
    </div>
  );
};

export default StaffLogin;
