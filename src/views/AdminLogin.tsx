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
  KeyRound,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { adminApi } from '../services/adminApi';

type LoginStep = 'CREDENTIALS' | 'OTP_VERIFY' | 'FORGOT_REQUEST' | 'FORGOT_RESET' | 'FORGOT_SUCCESS';

export const AdminLogin: React.FC = () => {
  const router = useRouter();

  // Core Login State
  const [step, setStep] = useState<LoginStep>('CREDENTIALS');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 2FA OTP State
  const [userEmail, setUserEmail] = useState<string>('');
  const [otpSessionId, setOtpSessionId] = useState<string>('');
  const [maskedEmail, setMaskedEmail] = useState<string>('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [isResending, setIsResending] = useState<boolean>(false);
  const [devOtpNotification, setDevOtpNotification] = useState<string | null>(null);

  // Forgot Password State
  const [forgotInput, setForgotInput] = useState('');
  const [resetSessionId, setResetSessionId] = useState('');
  const [resetOtpDigits, setResetOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Refs for individual OTP input boxes
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const resetOtpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

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
    } else if (step === 'FORGOT_RESET') {
      setTimeout(() => resetOtpInputRefs.current[0]?.focus(), 150);
    }
  }, [step]);

  // ==========================================
  // Handlers: Step 1 - Credential Check
  // ==========================================
  const handleCredentialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setDevOtpNotification(null);

    try {
      const res = await adminApi.login({ username, password });

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
        setErrorMessage(res.message || 'Login failed. Please verify your credentials.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid username or password.');
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // Handlers: Step 2 - 2FA OTP Verification
  // ==========================================
  const handleOtpDigitChange = (index: number, value: string, isReset = false) => {
    const cleanVal = value.replace(/\D/g, '').slice(-1);
    const targetDigits = isReset ? [...resetOtpDigits] : [...otpDigits];
    const setTargetDigits = isReset ? setResetOtpDigits : setOtpDigits;
    const refs = isReset ? resetOtpInputRefs : otpInputRefs;

    targetDigits[index] = cleanVal;
    setTargetDigits(targetDigits);

    // Auto-advance
    if (cleanVal && index < 5) {
      refs.current[index + 1]?.focus();
    }

    // Auto-submit if all 6 filled
    const fullOtp = targetDigits.join('');
    if (fullOtp.length === 6 && !targetDigits.includes('')) {
      if (!isReset) {
        submitOtpVerification(fullOtp);
      }
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>, isReset = false) => {
    const targetDigits = isReset ? resetOtpDigits : otpDigits;
    const refs = isReset ? resetOtpInputRefs : otpInputRefs;

    if (e.key === 'Backspace') {
      if (!targetDigits[index] && index > 0) {
        refs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      refs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      refs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>, isReset = false) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newDigits = pasted.split('');
    while (newDigits.length < 6) newDigits.push('');

    const setTargetDigits = isReset ? setResetOtpDigits : setOtpDigits;
    const refs = isReset ? resetOtpInputRefs : otpInputRefs;

    setTargetDigits(newDigits);
    const nextEmptyIndex = newDigits.findIndex((d) => !d);
    if (nextEmptyIndex !== -1) {
      refs.current[nextEmptyIndex]?.focus();
    } else {
      refs.current[5]?.focus();
      if (!isReset) {
        submitOtpVerification(newDigits.join(''));
      }
    }
  };

  const submitOtpVerification = async (otpValue?: string) => {
    const code = otpValue || otpDigits.join('');
    if (code.length < 6) {
      setErrorMessage('Please enter the full 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await adminApi.verifyOtp({
        email: userEmail,
        otpSessionId,
        otp: code,
      });

      if (res.success && (res.token || res.accessToken)) {
        const token = res.token || res.accessToken!;
        localStorage.setItem('hestiia_admin_token', token);
        if (res.refreshToken) {
          localStorage.setItem('hestiia_admin_refresh_token', res.refreshToken);
        }
        localStorage.setItem('hestiia_admin_user', JSON.stringify(res.user));
        router.replace('/admin/dashboard');
      } else {
        setErrorMessage(res.message || 'Invalid or expired verification code.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification failed. Please check the code.');
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
        username,
        otpSessionId,
      });
      setResendCooldown(res.resendCooldownSeconds || res.expiresInSeconds || 60);
      setSuccessMessage(res.message || 'A fresh verification code has been dispatched.');
      if (res.devOtp) {
        setDevOtpNotification(res.devOtp);
      }
      setOtpDigits(['', '', '', '', '', '']);
      otpInputRefs.current[0]?.focus();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  // ==========================================
  // Handlers: Forgot Password Flow
  // ==========================================
  const handleForgotRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotInput.trim()) {
      setErrorMessage('Please enter your staff username or registered email address.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setDevOtpNotification(null);

    try {
      const res = await adminApi.forgotPassword({ emailOrUsername: forgotInput.trim() });
      if (res.success) {
        const emailToUse = res.email || forgotInput.trim();
        setUserEmail(emailToUse);
        setResetSessionId(res.resetSessionId || '');
        setMaskedEmail(res.maskedEmail || emailToUse);
        setResendCooldown(60);
        setResetOtpDigits(['', '', '', '', '', '']);
        setNewPassword('');
        setConfirmPassword('');
        if (res.devOtp) {
          setDevOtpNotification(res.devOtp);
        }
        setStep('FORGOT_RESET');
      } else {
        setErrorMessage(res.message || 'Failed to request password reset.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to request password reset.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otp = resetOtpDigits.join('');

    if (otp.length < 6) {
      setErrorMessage('Please enter the 6-digit reset code sent to your email.');
      return;
    }
    if (newPassword.length < 8) {
      setErrorMessage('New password must contain at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify your entries.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await adminApi.resetPassword({
        email: userEmail || forgotInput.trim(),
        otp,
        newPassword,
        resetSessionId,
      });

      if (res.success) {
        setStep('FORGOT_SUCCESS');
      } else {
        setErrorMessage(res.message || 'Password reset failed.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Password reset failed. Invalid or expired code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0908] text-warmwhite flex flex-col justify-center items-center px-4 py-10 relative overflow-hidden font-sans selection:bg-gold/30 selection:text-gold-light">
      {/* Dynamic Atmospheric Background Layers */}
      {/* 1. Deep luxury radial gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(212,175,55,0.15),rgba(10,9,8,0.95))]" />

      {/* 2. Floating golden & espresso light blooms */}
      <div className="absolute top-1/4 left-1/6 w-96 h-96 bg-gold/10 rounded-full blur-[128px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/6 w-[420px] h-[420px] bg-amber-700/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -top-32 right-1/4 w-80 h-80 bg-gold/5 rounded-full blur-[100px] pointer-events-none" />

      {/* 3. Subtle fine-dining luxury watermark grid */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:24px_24px]"
      />

      {/* Main Container */}
      <div className="relative w-full max-w-[440px] z-10 transition-all duration-300">
        {/* Brand Header */}
        <div className="text-center mb-7">
          <div className="inline-block relative mb-3 group">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-gold/30 to-amber-500/20 blur-md opacity-75 group-hover:opacity-100 transition duration-500" />
            <img
              src="/brand-icon.jpg"
              alt="Hestiia Restaurant Logo"
              className="relative w-20 h-20 mx-auto object-contain rounded-2xl shadow-2xl border border-gold/40 bg-black/90 p-1 ring-1 ring-gold/30 backdrop-blur-md"
            />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-wider text-warmwhite drop-shadow-md">
            HESTIIYA RESTAURANT
          </h1>
          <p className="text-[11px] text-gold font-semibold uppercase tracking-[0.2em] mt-1 drop-shadow-sm">
            DIMISI Technologies Administration Portal
          </p>
        </div>

        {/* Dev OTP Notification Pill (Local dev testing helper) */}
        {devOtpNotification && (
          <div className="mb-4 p-3 rounded-2xl bg-gold/10 border border-gold/30 text-gold-light text-xs flex items-center justify-between backdrop-blur-md animate-fade-in shadow-lg">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-gold flex-shrink-0 animate-spin" />
              <span>
                Dev Demo OTP: <strong className="font-mono text-sm tracking-widest text-gold">{devOtpNotification}</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                const digits = devOtpNotification.split('');
                if (step === 'OTP_VERIFY') setOtpDigits(digits);
                if (step === 'FORGOT_RESET') setResetOtpDigits(digits);
              }}
              className="px-2 py-0.5 rounded-lg bg-gold/20 hover:bg-gold/30 text-[10px] font-bold uppercase tracking-wider text-gold transition-colors"
            >
              Fill Code
            </button>
          </div>
        )}

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="mb-4 p-4 rounded-2xl bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs flex flex-col space-y-2.5 backdrop-blur-xl animate-shake shadow-xl">
            <div className="flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
            {errorMessage.toLowerCase().includes('staff') && (
              <div className="pt-2 border-t border-rose-500/20 flex justify-end">
                <button
                  type="button"
                  onClick={() => router.push('/staff/login')}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gold text-charcoal-950 font-bold text-[11px] hover:bg-gold-light transition-all shadow-md cursor-pointer"
                >
                  <span>Go to Staff Operations Login</span>
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
        {/* VIEW 1: CREDENTIALS (Show/Hide Password + Forgot Password Link)           */}
        {/* ========================================================================= */}
        {step === 'CREDENTIALS' && (
          <div className="relative rounded-3xl bg-charcoal-900/65 backdrop-blur-2xl border border-white/10 border-t-gold/40 p-7 sm:p-9 shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.12)] transition-all duration-300">
            <div className="mb-6">
              <h2 className="font-serif text-xl font-semibold text-warmwhite flex items-center space-x-2">
                <span>Authorized Sign In</span>
                <span className="px-2 py-0.5 text-[10px] font-sans font-bold bg-gold/15 text-gold border border-gold/30 rounded-full uppercase tracking-wider">
                  2-Step
                </span>
              </h2>
              <p className="text-xs text-beige mt-1">
                Enter your credentials. A secure verification code will be dispatched to your registered email.
              </p>
            </div>

            <form onSubmit={handleCredentialSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-beige mb-1.5">
                  Username or Staff Email
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
                    placeholder="Enter your username or email address"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-charcoal/70 border border-charcoal-border text-warmwhite text-xs placeholder-beige-muted focus:border-gold focus:ring-1 focus:ring-gold/40 focus:outline-none transition-all backdrop-blur-md"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-beige">
                    Security Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotInput(username);
                      setErrorMessage(null);
                      setSuccessMessage(null);
                      setStep('FORGOT_REQUEST');
                    }}
                    className="text-[11px] text-gold hover:text-gold-light hover:underline font-medium transition-colors"
                  >
                    Forgot Password?
                  </button>
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
                    <span>Proceed To Verification</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Switch to Staff Portal Link */}
            <div className="mt-5 pt-4 border-t border-charcoal-border/50 text-center">
              <p className="text-[11px] text-beige-muted">
                Staff member or floor operations?{' '}
                <button
                  type="button"
                  onClick={() => router.push('/staff/login')}
                  className="text-gold hover:text-gold-light hover:underline font-semibold transition-colors"
                >
                  Sign in via Staff Operations Portal &rarr;
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
              <p className="text-xs text-beige mt-1">
                We sent a 6-digit one-time code to{' '}
                <span className="font-mono text-gold font-semibold">{maskedEmail}</span>.
              </p>
            </div>

            {/* 6-Digit Individual OTP Input Boxes */}
            <div className="flex justify-between items-center gap-2 mb-6">
              {otpDigits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    otpInputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpDigitChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  onPaste={handleOtpPaste}
                  className="w-12 h-13 sm:w-13 sm:h-14 text-center font-mono text-xl sm:text-2xl font-bold rounded-xl bg-charcoal/80 border border-charcoal-border text-gold focus:border-gold focus:ring-2 focus:ring-gold/30 focus:outline-none transition-all backdrop-blur-md shadow-inner"
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => submitOtpVerification()}
              disabled={isLoading || otpDigits.join('').length < 6}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-gold via-gold-light to-gold hover:from-gold-dark hover:to-gold text-charcoal-950 font-bold text-xs uppercase tracking-wider shadow-[0_4px_20px_rgba(212,175,55,0.3)] hover:shadow-[0_6px_25px_rgba(212,175,55,0.45)] transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-charcoal-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Verify & Access Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Resend OTP & Cooldown Counter */}
            <div className="mt-5 text-center">
              {resendCooldown > 0 ? (
                <div className="text-xs text-beige-muted">
                  Resend code in <span className="font-mono text-gold font-semibold">{resendCooldown}s</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isResending}
                  className="inline-flex items-center space-x-1.5 text-xs font-semibold text-gold hover:text-gold-light transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                  <span>Resend Verification Code</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: FORGOT PASSWORD - REQUEST RESET CODE                              */}
        {/* ========================================================================= */}
        {step === 'FORGOT_REQUEST' && (
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
              <span>Back to Sign In</span>
            </button>

            <div className="mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gold/15 border border-gold/40 flex items-center justify-center text-gold mb-3 shadow-[0_0_20px_rgba(212,175,55,0.2)]">
                <KeyRound className="w-6 h-6" />
              </div>
              <h2 className="font-serif text-xl font-semibold text-warmwhite">
                Reset Security Password
              </h2>
              <p className="text-xs text-beige mt-1">
                Enter your staff username or registered email. We will send a 6-digit password reset code.
              </p>
            </div>

            <form onSubmit={handleForgotRequestSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-beige mb-1.5">
                  Staff Username or Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-beige-muted">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={forgotInput}
                    onChange={(e) => setForgotInput(e.target.value)}
                    placeholder="admin@hestiia.com or admin"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-charcoal/70 border border-charcoal-border text-warmwhite text-xs placeholder-beige-muted focus:border-gold focus:ring-1 focus:ring-gold/40 focus:outline-none transition-all backdrop-blur-md"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-gold via-gold-light to-gold hover:from-gold-dark hover:to-gold text-charcoal-950 font-bold text-xs uppercase tracking-wider shadow-[0_4px_20px_rgba(212,175,55,0.3)] transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-charcoal-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Send Password Reset Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 4: FORGOT PASSWORD - ENTER CODE & NEW PASSWORD                       */}
        {/* ========================================================================= */}
        {step === 'FORGOT_RESET' && (
          <div className="relative rounded-3xl bg-charcoal-900/65 backdrop-blur-2xl border border-white/10 border-t-gold/40 p-7 sm:p-9 shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.12)] transition-all duration-300">
            <button
              type="button"
              onClick={() => {
                setErrorMessage(null);
                setSuccessMessage(null);
                setStep('FORGOT_REQUEST');
              }}
              className="inline-flex items-center space-x-1.5 text-xs text-beige-muted hover:text-gold mb-4 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Change email / username</span>
            </button>

            <div className="mb-5">
              <h2 className="font-serif text-xl font-semibold text-warmwhite">
                Set New Password
              </h2>
              <p className="text-xs text-beige mt-1">
                Enter the 6-digit code dispatched to{' '}
                <span className="font-mono text-gold font-semibold">{maskedEmail}</span> and choose a new password.
              </p>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              {/* 6-Digit Reset OTP */}
              <div>
                <label className="block text-xs font-medium text-beige mb-2">
                  6-Digit Reset Code
                </label>
                <div className="flex justify-between items-center gap-2">
                  {resetOtpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        resetOtpInputRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpDigitChange(index, e.target.value, true)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e, true)}
                      onPaste={(e) => handleOtpPaste(e, true)}
                      className="w-12 h-12 sm:w-13 sm:h-13 text-center font-mono text-xl font-bold rounded-xl bg-charcoal/80 border border-charcoal-border text-gold focus:border-gold focus:ring-1 focus:ring-gold/30 focus:outline-none transition-all backdrop-blur-md"
                    />
                  ))}
                </div>
              </div>

              {/* New Password with View Icon */}
              <div>
                <label className="block text-xs font-medium text-beige mb-1.5">
                  New Security Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-beige-muted">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-charcoal/70 border border-charcoal-border text-warmwhite text-xs placeholder-beige-muted focus:border-gold focus:ring-1 focus:ring-gold/40 focus:outline-none transition-all backdrop-blur-md"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-beige-muted hover:text-gold transition-colors focus:outline-none"
                    aria-label={showNewPassword ? 'Hide password' : 'View password'}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password with View Icon */}
              <div>
                <label className="block text-xs font-medium text-beige mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-beige-muted">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-charcoal/70 border border-charcoal-border text-warmwhite text-xs placeholder-beige-muted focus:border-gold focus:ring-1 focus:ring-gold/40 focus:outline-none transition-all backdrop-blur-md"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-beige-muted hover:text-gold transition-colors focus:outline-none"
                    aria-label={showConfirmPassword ? 'Hide password' : 'View password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-gold via-gold-light to-gold hover:from-gold-dark hover:to-gold text-charcoal-950 font-bold text-xs uppercase tracking-wider shadow-[0_4px_20px_rgba(212,175,55,0.3)] transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-charcoal-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Update Password & Save</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 5: FORGOT PASSWORD - SUCCESS CONFIRMATION                            */}
        {/* ========================================================================= */}
        {step === 'FORGOT_SUCCESS' && (
          <div className="relative rounded-3xl bg-charcoal-900/65 backdrop-blur-2xl border border-white/10 border-t-gold/40 p-7 sm:p-9 shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.12)] text-center transition-all duration-300">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 mb-4 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              <CheckCircle className="w-8 h-8" />
            </div>

            <h2 className="font-serif text-2xl font-semibold text-warmwhite mb-2">
              Password Reset Complete!
            </h2>
            <p className="text-xs text-beige leading-relaxed mb-6 max-w-xs mx-auto">
              Your security password has been updated successfully. Please sign in with your new password to access the portal.
            </p>

            <button
              type="button"
              onClick={() => {
                setPassword(newPassword);
                setErrorMessage(null);
                setSuccessMessage(null);
                setStep('CREDENTIALS');
              }}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-gold via-gold-light to-gold hover:from-gold-dark hover:to-gold text-charcoal-950 font-bold text-xs uppercase tracking-wider shadow-[0_4px_20px_rgba(212,175,55,0.3)] transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>Sign In With New Password</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Footer Security Badge */}
        <div className="mt-8 text-center text-[11px] text-beige-muted flex items-center justify-center space-x-2 drop-shadow-sm">
          <ShieldCheck className="w-3.5 h-3.5 text-gold" />
          <span>Encrypted Session &bull; 2-Step Email Verification Active</span>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
