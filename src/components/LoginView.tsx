import React, { useState } from 'react';
import { CreditCard, Mail, Lock, ArrowRight, ShieldCheck, Sparkles, Building, Sun, Moon } from 'lucide-react';
import type { Owner } from '../types';
import { useTheme } from '../hooks/useTheme';

interface LoginViewProps {
  onSuccess: (owner: Owner) => void;
  onGoToSignup: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSuccess, onGoToSignup }) => {
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState('adewale@acme.ng');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid credentials');
      }

      onSuccess(data.owner);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = () => {
    setEmail('adewale@acme.ng');
    setPassword('password123');
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 selection:bg-emerald-500 selection:text-slate-950"
      style={{
        backgroundColor: "var(--bg-primary)",
        color: "var(--text-primary)",
      }}
    >
      <div className="w-full max-w-md space-y-6">
        {/* Brand & Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-400 text-slate-950 shadow-xl shadow-emerald-950/40 mb-1">
            <CreditCard className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div className="flex items-center justify-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-400 tracking-tight">
              Team Cards
            </h1>
            <button
              type="button"
              onClick={toggleTheme}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              className="text-slate-400 hover:text-amber-400 p-1.5 rounded-lg hover:bg-slate-800 transition"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xs mx-auto">
            BMONI Embedded API Corporate Spend Cards
          </p>
        </div>

        {/* Demo Fast Fill Helper */}
        <div
          className="border rounded-2xl p-3 flex items-center justify-between text-xs"
          style={{
            backgroundColor: "var(--bg-card)",
            borderColor: "var(--border-color)",
            color: "var(--text-primary)",
          }}
        >
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Hackathon Demo Account:</span>
          </div>
          <button
            type="button"
            onClick={handleDemoFill}
            className="text-emerald-400 hover:text-emerald-300 font-semibold font-mono bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 transition"
          >
            Adewale (Acme Logistics)
          </button>
        </div>

        {/* Login Card */}
        <div
          className="border rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6"
          style={{
            backgroundColor: "var(--bg-card)",
            borderColor: "var(--border-color)",
          }}
        >
          <div className="space-y-1">
            <h2
              className="text-lg font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              Sign in to your dashboard
            </h2>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Enter your credentials to manage company spend
            </p>
          </div>

          {error && (
            <div
              className="p-3 border rounded-xl text-xs flex items-start space-x-2.5"
              style={{
                backgroundColor: "var(--danger-bg)",
                borderColor: "var(--danger-border)",
                color: "var(--danger-text)",
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: "var(--text-secondary)" }}
              >
                Work Email
              </label>
              <div className="relative">
                <Mail
                  className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--text-secondary)" }}
                />
                <input
                  type="email"
                  required
                  placeholder="name@company.ng"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 transition"
                  style={{
                    backgroundColor: "var(--bg-primary)",
                    color: "var(--text-primary)",
                    borderColor: "var(--border-color)",
                  }}
                />
              </div>
            </div>

            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: "var(--text-secondary)" }}
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--text-secondary)" }}
                />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 transition"
                  style={{
                    backgroundColor: "var(--bg-primary)",
                    color: "var(--text-primary)",
                    borderColor: "var(--border-color)",
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              id="login-submit-btn"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold py-2.5 rounded-xl text-sm transition flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20"
            >
              {loading ? (
                <>
                  <span className="animate-spin w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div
            className="pt-4 border-t text-center"
            style={{ borderColor: "var(--border-color)" }}
          >
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              New business owner?{" "}
              <button
                type="button"
                onClick={onGoToSignup}
                className="text-emerald-400 hover:text-emerald-300 font-semibold transition"
              >
                Set up BMONI Wallet & Cards
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
