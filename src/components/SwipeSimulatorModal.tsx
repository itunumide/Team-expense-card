import React, { useState } from 'react';
import { X, ShoppingBag, AlertCircle, CheckCircle2, Zap, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Card, Transaction } from '../types';

interface SwipeSimulatorModalProps {
  isOpen: boolean;
  cards: Card[];
  selectedCardId?: string;
  onClose: () => void;
  onTransactionComplete: (tx: Transaction) => void;
}

const MERCHANT_PRESETS = [
  { merchant: 'Uber Ride Victoria Island', category: 'Travel & Mobility', amount: 8500 },
  { merchant: 'AWS EMEA Cloud Servers', category: 'Cloud & Infrastructure', amount: 35000 },
  { merchant: 'TotalEnergies Fuel Station Lekki', category: 'Fuel & Transportation', amount: 20000 },
  { merchant: 'Chicken Republic Admiralty', category: 'Meals & Entertainment', amount: 6200 },
  { merchant: 'Jumia Tech Enterprise', category: 'Equipment & Hardware', amount: 120000 }
];

export const SwipeSimulatorModal: React.FC<SwipeSimulatorModalProps> = ({
  isOpen,
  cards,
  selectedCardId,
  onClose,
  onTransactionComplete
}) => {
  const [activeCardId, setActiveCardId] = useState(selectedCardId || cards[0]?.id || '');
  const [merchant, setMerchant] = useState('Uber Ride Victoria Island');
  const [category, setCategory] = useState('Travel & Mobility');
  const [amount, setAmount] = useState('8500');
  const [loading, setLoading] = useState(false);
  const [resultTx, setResultTx] = useState<Transaction | null>(null);

  if (!isOpen) return null;

  const currentCard = cards.find((c) => c.id === (activeCardId || selectedCardId));

  const formatNgn = (val: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0
    }).format(val);
  };

  const handlePresetSelect = (preset: typeof MERCHANT_PRESETS[0]) => {
    setMerchant(preset.merchant);
    setCategory(preset.category);
    setAmount(preset.amount.toString());
    setResultTx(null);
  };

  const handleSimulateSwipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCard) return;

    setLoading(true);
    setResultTx(null);

    try {
      const res = await fetch('/api/transactions/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId: currentCard.id,
          amount: Number(amount),
          merchant,
          category
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Simulation failed');
      }

      setResultTx(data.transaction);
      onTransactionComplete(data.transaction);

      if (data.transaction.status === 'SUCCESS') {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 }
        });
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Simulate Live Payment Swipe</h3>
              <p className="text-xs text-slate-400">BMONI POS & Online Gateway Sandbox Simulator</p>
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
        <div className="p-6 space-y-5">
          {/* Card Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Select Spend Card
            </label>
            <select
              value={currentCard?.id || ''}
              onChange={(e) => {
                setActiveCardId(e.target.value);
                setResultTx(null);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
            >
              {cards.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.employeeName} ({c.maskedPan}) — {c.status} [Limit: {formatNgn(c.limitAmount)}]
                </option>
              ))}
            </select>
          </div>

          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Quick Merchant Presets
            </label>
            <div className="grid grid-cols-2 gap-2">
              {MERCHANT_PRESETS.map((preset, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => handlePresetSelect(preset)}
                  className="p-2.5 text-left bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-xl transition text-xs space-y-1"
                >
                  <div className="font-semibold text-slate-200 truncate">{preset.merchant}</div>
                  <div className="flex justify-between text-slate-400 font-mono text-[11px]">
                    <span>{preset.category}</span>
                    <span className="text-emerald-400 font-bold">{formatNgn(preset.amount)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Merchant & Amount */}
          <form onSubmit={handleSimulateSwipe} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Merchant Name
                </label>
                <input
                  type="text"
                  required
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Amount (NGN)
                </label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            {/* Result Box */}
            {resultTx && (
              <div
                className={`p-4 rounded-xl border animate-in fade-in slide-in-from-top-2 duration-200 ${
                  resultTx.status === 'SUCCESS'
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                }`}
              >
                <div className="flex items-center space-x-2 font-bold text-sm">
                  {resultTx.status === 'SUCCESS' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Authorization Approved ({formatNgn(resultTx.amount)})</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                      <span>Authorization Declined</span>
                    </>
                  )}
                </div>
                {resultTx.declinedReason && (
                  <p className="text-xs text-rose-300 mt-1 font-mono">
                    Reason: {resultTx.declinedReason}
                  </p>
                )}
                <div className="mt-2 text-[11px] text-slate-400 font-mono flex justify-between border-t border-slate-800/80 pt-1.5">
                  <span>Tx Ref: {resultTx.bmoniTransactionId}</span>
                  <span>Webhook Dispatched (card.transaction)</span>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="pt-2 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Card Status:{' '}
                <span
                  className={`font-semibold ${
                    currentCard?.status === 'ACTIVE' ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {currentCard?.status}
                </span>
              </span>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={loading || !currentCard}
                  className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-sm transition flex items-center space-x-2 shadow-lg shadow-amber-500/20"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full" />
                      <span>Authorizing...</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>Swipe Card ({formatNgn(Number(amount) || 0)})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
