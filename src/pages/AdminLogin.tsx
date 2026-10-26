import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, ArrowRight, ShieldCheck, AlertCircle, Utensils, CheckCircle } from 'lucide-react';
import { adminApi } from '../services/adminApi';

export const AdminLogin: React.FC = () => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Admin@Hestiia2026');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await adminApi.login({ username, password });
      if (res.success && res.token) {
        localStorage.setItem('hestiia_admin_token', res.token);
        localStorage.setItem('hestiia_admin_user', JSON.stringify(res.user));
        navigate('/admin/dashboard', { replace: true });
      } else {
        setErrorMessage(res.message || 'Login failed. Please check your credentials.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid username or password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-charcoal-950 text-warmwhite flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans">
      {/* Decorative ambient background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-espresso/40 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-block relative mb-3">
            <img
              src="/brand-icon.jpg"
              alt="Hestiia Restaurant Logo"
              className="w-24 h-24 mx-auto object-contain rounded-2xl shadow-xl border border-gold/40 bg-black p-1 ring-2 ring-gold/20"
            />
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-wider text-warmwhite">
            HESTIIA RESTAURANT
          </h1>
          <p className="text-xs text-gold font-semibold uppercase tracking-widest mt-1">
            DIMISI Technologies Administration Portal
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-charcoal-card border border-charcoal-border rounded-3xl p-7 sm:p-9 shadow-2xl backdrop-blur-xl">
          <div className="mb-6">
            <h2 className="font-serif text-xl font-semibold text-warmwhite">Authorized Sign In</h2>
            <p className="text-xs text-beige mt-1">
              Enter your credentials to manage menu, orders, bookings and dining operations.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-950/40 border border-rose-600/40 text-rose-300 text-xs flex items-start space-x-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
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
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin or manager"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite text-xs placeholder-beige-muted focus:border-gold focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-beige mb-1.5">
                Security Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-beige-muted">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite text-xs placeholder-beige-muted focus:border-gold focus:outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gold hover:bg-gold-dark text-charcoal-950 font-bold text-xs uppercase tracking-wider shadow-gold-sm transition-all duration-200 flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-charcoal-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Access Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Assistant */}
          <div className="mt-6 pt-5 border-t border-charcoal-border">
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-gold mb-2.5 text-center">
              Quick Sign In Roles
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => handleQuickFill('admin', 'Admin@Hestiia2026')}
                className="p-2 rounded-xl bg-charcoal border border-charcoal-border hover:border-gold/40 text-left transition-colors"
              >
                <div className="font-semibold text-warmwhite">Superadmin</div>
                <div className="text-[10px] text-beige-muted">admin / Admin@Hestiia2026</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('manager', 'Manager@Hestiia2026')}
                className="p-2 rounded-xl bg-charcoal border border-charcoal-border hover:border-gold/40 text-left transition-colors"
              >
                <div className="font-semibold text-warmwhite">Floor Manager</div>
                <div className="text-[10px] text-beige-muted">manager / Manager@Hestiia2026</div>
              </button>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="text-center mt-6 flex items-center justify-center space-x-1.5 text-xs text-beige-muted">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Encrypted Session & Rate-Limited Authentication</span>
        </div>
      </div>
    </div>
  );
};
