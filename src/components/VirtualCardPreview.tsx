import React, { useState } from 'react';
import { CreditCard, Eye, EyeOff, ShieldCheck, ShieldAlert, Wifi } from 'lucide-react';
import type { Card } from '../types';

interface VirtualCardPreviewProps {
  card: Card;
  onToggleFreeze?: () => void;
  isUpdatingFreeze?: boolean;
}

export const VirtualCardPreview: React.FC<VirtualCardPreviewProps> = ({
  card,
  onToggleFreeze,
  isUpdatingFreeze = false
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const isFrozen = card.status === 'FROZEN';

  const formatNgn = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const spendPercent = Math.min(100, Math.round((card.spentAmount / (card.limitAmount || 1)) * 100));

  return (
    <div className="space-y-4">
      {/* Physical-style Virtual Card representation */}
      <div
        id={`virtual-card-${card.id}`}
        className={`relative w-full aspect-[1.586/1] max-w-[420px] rounded-2xl p-6 text-white shadow-2xl transition-all duration-300 overflow-hidden select-none border ${
          isFrozen
            ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-rose-950/70 border-rose-500/40 shadow-rose-950/20'
            : 'bg-gradient-to-br from-slate-900 via-emerald-950/80 to-slate-950 border-emerald-500/40 shadow-emerald-950/30'
        }`}
      >
        {/* Subtle geometric lines background */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* Top Header */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">BMONI</span>
              <span className="text-[10px] text-slate-400 block -mt-0.5">Corporate Spend</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Wifi className="w-4 h-4 text-slate-400 rotate-90" />
            <span
              className={`px-2.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase rounded-full border ${
                isFrozen
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                  : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
              }`}
            >
              {card.status}
            </span>
          </div>
        </div>

        {/* Chip & Masked PAN */}
        <div className="relative z-10 mt-6 flex items-center justify-between">
          <div className="w-10 h-7 rounded bg-gradient-to-tr from-amber-400 to-amber-200 border border-amber-300 shadow-inner flex items-center justify-center">
            <div className="w-6 h-4 border-t border-b border-amber-600/40" />
          </div>

          <button
            type="button"
            id={`toggle-card-details-${card.id}`}
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center space-x-1.5 text-xs text-slate-300 hover:text-white bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700 transition"
          >
            {showDetails ? (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                <span>Hide</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>Show</span>
              </>
            )}
          </button>
        </div>

        {/* Card Number */}
        <div className="relative z-10 mt-4">
          <p className="font-mono text-lg sm:text-xl tracking-[0.2em] font-semibold text-slate-100">
            {showDetails ? card.maskedPan.replace('•••• ••••', '4491 8820') : card.maskedPan}
          </p>
        </div>

        {/* Bottom Details: Cardholder & Expiry / CVV */}
        <div className="relative z-10 mt-4 flex items-end justify-between">
          <div>
            <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-mono">Cardholder</span>
            <span className="text-sm font-semibold tracking-wide text-slate-100 uppercase truncate max-w-[200px] block">
              {card.employeeName}
            </span>
          </div>

          <div className="flex space-x-4 font-mono text-right">
            <div>
              <span className="text-[9px] uppercase tracking-wider text-slate-400 block">Expires</span>
              <span className="text-xs font-semibold text-slate-200">
                {card.expiryMonth}/{card.expiryYear}
              </span>
            </div>
            {showDetails && (
              <div>
                <span className="text-[9px] uppercase tracking-wider text-slate-400 block">CVV</span>
                <span className="text-xs font-semibold text-emerald-300">{card.cvv}</span>
              </div>
            )}
          </div>
        </div>

        {/* Frozen Watermark if frozen */}
        {isFrozen && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[1px] flex flex-col items-center justify-center text-center p-4 z-20">
            <ShieldAlert className="w-10 h-10 text-rose-400 mb-1 animate-pulse" />
            <span className="text-sm font-bold text-rose-200 uppercase tracking-widest">Card Frozen</span>
            <span className="text-[11px] text-rose-300/80 max-w-[240px]">
              All POS, Web, and ATM authorizations are blocked.
            </span>
          </div>
        )}
      </div>

      {/* Spend Limit & Usage Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400 font-medium">Monthly Spend Limit</span>
          <span className="font-semibold text-slate-100">{formatNgn(card.limitAmount)}</span>
        </div>

        <div className="space-y-1.5">
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                spendPercent > 90 ? 'bg-rose-500' : spendPercent > 70 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${spendPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-400 font-mono">
            <span>Spent: {formatNgn(card.spentAmount)}</span>
            <span>Available: {formatNgn(Math.max(0, card.limitAmount - card.spentAmount))}</span>
          </div>
        </div>

        {/* Live Freeze / Unfreeze Action Button */}
        {onToggleFreeze && (
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {isFrozen ? (
                <ShieldAlert className="w-4 h-4 text-rose-400" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              )}
              <span className="text-xs text-slate-300">
                {isFrozen ? 'Card is currently suspended' : 'Card is active for payments'}
              </span>
            </div>

            <button
              type="button"
              id={`freeze-toggle-btn-${card.id}`}
              onClick={onToggleFreeze}
              disabled={isUpdatingFreeze}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition flex items-center space-x-1.5 disabled:opacity-50 ${
                isFrozen
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-rose-600/90 hover:bg-rose-600 text-white'
              }`}
            >
              {isUpdatingFreeze ? (
                <span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
              ) : isFrozen ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Unfreeze Card</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Freeze Card</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
