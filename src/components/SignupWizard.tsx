import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  ShieldCheck,
  Building,
  User,
  Mail,
  Lock,
  Phone,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Wallet,
  Sun,
  Moon
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { BmoniTestIdentity, Owner } from '../types';
import { useTheme } from '../hooks/useTheme';

interface SignupWizardProps {
  onSuccess: (owner: Owner) => void;
  onGoToLogin: () => void;
}

export const SignupWizard: React.FC<SignupWizardProps> = ({ onSuccess, onGoToLogin }) => {
  const { theme, toggleTheme } = useTheme();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Account
  const [companyName, setCompanyName] = useState('Acme Logistics Ltd');
  const [name, setName] = useState('Adewale Adeleke');
  const [email, setEmail] = useState('adewale@acme.ng');
  const [password, setPassword] = useState('password123');

  // Step 2: Nigeria KYC
  const [bvn, setBvn] = useState('22233344455');
  const [phone, setPhone] = useState('+2348031234567');
  const [dob, setDob] = useState('1988-06-14');
  const [address, setAddress] = useState('14 Admiralty Way, Lekki Phase 1, Lagos');

  // Test identities
  const [testIdentities, setTestIdentities] = useState<BmoniTestIdentity[]>([]);

  // Created Owner & KYC status
  const [createdOwner, setCreatedOwner] = useState<Owner | null>(null);
  const [kycActive, setKycActive] = useState(false);

  useEffect(() => {
    fetch('/api/kyc/test-identities')
      .then((res) => res.json())
      .then((data) => {
        if (data.identities) {
          setTestIdentities(data.identities);
        }
      })
      .catch((e) => console.error(e));
  }, []);

  const handleSelectPresetIdentity = (identity: BmoniTestIdentity) => {
    setBvn(identity.bvn);
    setName(identity.name);
    setEmail(identity.email);
    setPhone(identity.phone);
    setDob(identity.dob);
    setError(null);
  };

  // Step 1: Create Account & Provision Initial User
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName, name, email, password }),
        credentials: 'include'
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to initialize account');
      }

      setCreatedOwner(data.owner);
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Submit Nigeria Director KYC
  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createdOwner) return;

    setLoading(true);
    setError(null);

    try {
      const [firstName, ...rest] = name.split(' ');
      const lastName = rest.join(' ') || firstName;

      const res = await fetch('/api/kyc/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerId: createdOwner.id,
          bvn,
          firstName,
          lastName,
          dob,
          phone,
          address
        }),
        credentials: 'include'
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.errorCode === 'ERR_KYC_BVN_MISMATCH') {
          throw new Error('BMONI KYC Error: BVN verification failed with NIBSS directory. Try selecting a verified test identity.');
        }
        throw new Error(data.error || 'KYC verification failed');
      }

      setCreatedOwner(data.owner);
      setStep(3);
      setKycActive(true);

      confetti({
        particleCount: 70,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (err: any) {
      setError(err.message || 'KYC activation failed');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Complete & Go to Dashboard
  const handleFinish = () => {
    if (createdOwner) {
      onSuccess(createdOwner);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 selection:bg-emerald-500 selection:text-slate-950" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <div className="w-full max-w-xl space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-400 text-slate-950 shadow-xl shadow-emerald-950/40 mb-1">
            <CreditCard className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div className="flex items-center justify-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Team Cards by BMONI
            </h1>
            <button
              type="button"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              className="text-slate-400 hover:text-amber-400 p-1.5 rounded-lg hover:bg-slate-800 transition"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            Corporate Expense & Virtual Spend Card Management with Instant NGN Settlement
          </p>
        </div>

        {/* Stepper Pill Indicator */}
        <div className="border rounded-2xl p-4 shadow-xl" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div className="flex items-center justify-between text-xs font-semibold">
            <div
              className={`flex items-center space-x-2 ${
                step >= 1 ? 'text-emerald-400' : 'text-slate-500'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step > 1
                    ? 'bg-emerald-500 text-slate-950'
                    : step === 1
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                1
              </div>
              <span className="hidden sm:inline">Account Setup</span>
            </div>

            <div className="h-0.5 w-8 bg-slate-800" />

            <div
              className={`flex items-center space-x-2 ${
                step >= 2 ? 'text-emerald-400' : 'text-slate-500'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step > 2
                    ? 'bg-emerald-500 text-slate-950'
                    : step === 2
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                2
              </div>
              <span className="hidden sm:inline">Nigeria KYC</span>
            </div>

            <div className="h-0.5 w-8 bg-slate-800" />

            <div
              className={`flex items-center space-x-2 ${
                step === 3 ? 'text-emerald-400' : 'text-slate-500'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === 3
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                3
              </div>
              <span className="hidden sm:inline">Wallet Active</span>
            </div>
          </div>
        </div>

        {/* Wizard Card Body */}
        <div className="border rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
           {error && (
             <div className="p-4 border rounded-xl text-xs flex items-start space-x-2.5" style={{ backgroundColor: 'var(--danger-bg)', borderColor: 'var(--danger-border)', color: 'var(--danger-text)' }}>
               <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
               <span>{error}</span>
             </div>
           )}

          {/* STEP 1: Account Setup */}
          {step === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-100">Step 1: Company Profile</h3>
                <p className="text-xs text-slate-400">
                  Create your local administrator account to manage corporate spend cards.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Company Legal Name
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Acme Logistics Ltd"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Director / Admin Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Adewale Adeleke"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Corporate Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="adewale@acme.ng"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-slate-800">
                <button
                  type="button"
                  onClick={onGoToLogin}
                  className="text-xs text-slate-400 hover:text-emerald-400 transition"
                >
                  Already have an account? Sign In
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-sm transition flex items-center space-x-2 shadow-lg shadow-emerald-500/20"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full" />
                      <span>Provisioning BMONI User...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue to KYC</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Nigeria KYC */}
          {step === 2 && (
            <form onSubmit={handleStep2Submit} className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-100">Step 2: Nigeria KYC Activation</h3>
                <p className="text-xs text-slate-400">
                  Verify director identity via Bank Verification Number (BVN) to activate NGN settlement rails.
                </p>
              </div>

              {/* Sandbox Quick-Fill Test Identities */}
              <div className="space-y-1.5 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                <div className="flex items-center space-x-1.5 text-xs text-emerald-400 font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Sandbox Verified Test Identities (1-Click Fill)</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {testIdentities.slice(0, 4).map((identity) => (
                    <button
                      type="button"
                      key={identity.bvn}
                      onClick={() => handleSelectPresetIdentity(identity)}
                      className="p-2 text-left bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 rounded-lg text-xs space-y-0.5 transition"
                    >
                      <div className="font-semibold text-slate-200 truncate">{identity.name}</div>
                      <div className="text-[10px] text-emerald-400 font-mono">
                        BVN: {identity.bvn}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Bank Verification Number (BVN)
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={11}
                    value={bvn}
                    onChange={(e) => setBvn(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 font-mono tracking-widest focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      required
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Registered Business Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-slate-400 hover:text-slate-200 transition"
                >
                  Back
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-sm transition flex items-center space-x-2 shadow-lg shadow-emerald-500/20"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full" />
                      <span>Verifying with NIBSS...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Activate Wallet KYC</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Confirmation & Active Wallet */}
          {step === 3 && (
            <div className="space-y-6 text-center animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-950/50">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-100">
                  BMONI Wallet & Virtual Account Ready!
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Director KYC passed and Providus Bank NGN corporate virtual account has been provisioned.
                </p>
              </div>

              {/* Summary Details */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 text-left space-y-3 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <span className="text-slate-400 font-mono">Company</span>
                  <span className="font-bold text-slate-100">{createdOwner?.companyName}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <span className="text-slate-400 font-mono">Dedicated NGN Account</span>
                  <span className="font-bold font-mono text-emerald-400">
                    {createdOwner?.virtualAccount?.accountNumber} ({createdOwner?.virtualAccount?.bankName})
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-mono">Starter Sandbox Balance</span>
                  <span className="font-bold font-mono text-slate-100">₦500,000 NGN</span>
                </div>
              </div>

              <button
                type="button"
                id="finish-signup-btn"
                onClick={handleFinish}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 rounded-xl text-sm transition flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20"
              >
                <span>Launch Team Cards Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
