import React, { useState } from 'react';
import { X, CreditCard, ShieldCheck } from 'lucide-react';
import type { Employee, Card } from '../types';

interface IssueCardModalProps {
  isOpen: boolean;
  employee: Employee | null;
  onClose: () => void;
  onSuccess: (card: Card) => void;
}

const LIMIT_PRESETS = [
  { label: '₦25,000', value: 25000 },
  { label: '₦50,000', value: 50000 },
  { label: '₦100,000', value: 100000 },
  { label: '₦250,000', value: 250000 },
  { label: '₦500,000', value: 500000 }
];

export const IssueCardModal: React.FC<IssueCardModalProps> = ({
  isOpen,
  employee,
  onClose,
  onSuccess
}) => {
  const [limitAmount, setLimitAmount] = useState(50000);
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !employee) return null;

  const effectiveLimit = customAmount ? Number(customAmount) : limitAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (effectiveLimit <= 0) {
      setError('Please enter a valid card spend limit');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/cards/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: employee.id,
          limitAmount: effectiveLimit
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to issue virtual card');
      }

      onSuccess(data.card);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to issue virtual card');
    } finally {
      setLoading(false);
    }
  };

  const formatNgn = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Issue Virtual Spend Card</h3>
              <p className="text-xs text-slate-400">For {employee.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs">
              {error}
            </div>
          )}

          {/* Employee Badge */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400 block font-mono">Linked BMONI Account</span>
              <span className="font-semibold text-slate-200">{employee.email}</span>
            </div>
            <div className="flex items-center space-x-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified</span>
            </div>
          </div>

          {/* Spend Limit Presets */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Monthly Spend Limit (NGN)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {LIMIT_PRESETS.map((preset) => {
                const isSelected = !customAmount && limitAmount === preset.value;
                return (
                  <button
                    type="button"
                    key={preset.value}
                    onClick={() => {
                      setLimitAmount(preset.value);
                      setCustomAmount('');
                    }}
                    className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition ${
                      isSelected
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            {/* Custom Limit Input */}
            <div className="pt-2">
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-500 font-mono">
                  ₦
                </span>
                <input
                  type="number"
                  placeholder="Or enter custom amount in NGN"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition font-mono"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-1.5 text-xs text-slate-400">
            <div className="flex justify-between font-semibold text-slate-300">
              <span>Card Currency</span>
              <span className="text-emerald-400 font-mono">NGN (Nigerian Naira)</span>
            </div>
            <div className="flex justify-between font-semibold text-slate-300">
              <span>Selected Limit</span>
              <span className="text-slate-100 font-mono font-bold">
                {formatNgn(effectiveLimit)}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 pt-1">
              You can adjust spend limits or freeze this card anytime in real-time.
            </p>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || effectiveLimit <= 0}
              className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-sm transition flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full" />
                  <span>Provisioning Card...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Issue Virtual Card</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
