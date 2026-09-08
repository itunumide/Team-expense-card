import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  CreditCard,
  ShieldCheck,
  ShieldAlert,
  Edit2,
  Check,
  X,
  Zap,
  ShoppingBag,
  Sparkles,
  User,
  Mail,
  Building,
  Plus
} from 'lucide-react';
import { VirtualCardPreview } from './VirtualCardPreview';
import type { Employee, Card, Transaction } from '../types';

interface EmployeeDetailViewProps {
  employeeId: string;
  onBack: () => void;
  onOpenIssueCard: (employee: Employee) => void;
  onOpenSwipeModal: (cardId: string) => void;
  onRefreshData: () => void;
}

export const EmployeeDetailView: React.FC<EmployeeDetailViewProps> = ({
  employeeId,
  onBack,
  onOpenIssueCard,
  onOpenSwipeModal,
  onRefreshData
}) => {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [card, setCard] = useState<Card | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdatingFreeze, setIsUpdatingFreeze] = useState(false);

  // Edit Limit state
  const [isEditingLimit, setIsEditingLimit] = useState(false);
  const [newLimitInput, setNewLimitInput] = useState('');
  const [isUpdatingLimit, setIsUpdatingLimit] = useState(false);
  const [limitFeedback, setLimitFeedback] = useState<string | null>(null);

  const fetchEmployeeData = async () => {
    try {
      const res = await fetch(`/api/employees/${employeeId}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setEmployee(data.employee);
        setCard(data.card);
        setTransactions(data.transactions || []);
        if (data.card) {
          setNewLimitInput(data.card.limitAmount.toString());
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeData();
  }, [employeeId]);

  const formatNgn = (amount: number | undefined) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const handleToggleFreeze = async () => {
    if (!card) return;
    const currentStatus = card.status;
    const action = currentStatus === 'FROZEN' ? 'unfreeze' : 'freeze';
    const nextStatus = currentStatus === 'FROZEN' ? 'ACTIVE' : 'FROZEN';

    // Optimistic update
    setCard({ ...card, status: nextStatus });
    setIsUpdatingFreeze(true);

    try {
      const res = await fetch(`/api/cards/${card.id}/${action}`, {
        method: 'POST',
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok) {
        setCard(data.card);
        onRefreshData();
      } else {
        // Rollback
        setCard({ ...card, status: currentStatus });
      }
    } catch (e) {
      // Rollback
      setCard({ ...card, status: currentStatus });
    } finally {
      setIsUpdatingFreeze(false);
    }
  };

  const handleSaveLimit = async () => {
    if (!card) return;
    const num = Number(newLimitInput);
    if (isNaN(num) || num <= 0) return;

    setIsUpdatingLimit(true);
    setLimitFeedback(null);

    try {
      const res = await fetch(`/api/cards/${card.id}/limit`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limitAmount: num }),
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok) {
        setCard(data.card);
        setIsEditingLimit(false);
        setLimitFeedback(`Spend limit updated to ${formatNgn(num)} in BMONI engine`);
        onRefreshData();
        setTimeout(() => setLimitFeedback(null), 3500);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdatingLimit(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-3" />
        <span>Loading employee spend profile...</span>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="py-12 text-center text-slate-400">
        <p>Employee record not found.</p>
        <button
          type="button"
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-slate-800 text-slate-200 rounded-xl text-xs"
        >
          Back to List
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Back Button & Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Employees</span>
        </button>

        {card && (
          <button
            type="button"
            onClick={() => onOpenSwipeModal(card.id)}
            className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-semibold px-3.5 py-1.5 rounded-xl text-xs transition flex items-center space-x-1.5"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Test Card Swipe</span>
          </button>
        )}
      </div>

      {/* Profile & Card Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Profile & Limit Controls (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Profile Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-400 text-slate-950 font-extrabold text-base flex items-center justify-center shadow-lg shadow-emerald-950/40">
                  {employee.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-100">{employee.name}</h2>
                  <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
                    <Mail className="w-3 h-3 text-slate-500" />
                    <span>{employee.email}</span>
                  </div>
                </div>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1.5 ${
                  employee.inviteStatus === 'LINKED'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                }`}
              >
                {employee.inviteStatus === 'LINKED' ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>App Linked</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Invite Pending</span>
                  </>
                )}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-800 text-xs">
              <div className="bg-slate-950/70 rounded-xl p-3 border border-slate-800/80">
                <span className="text-[10px] uppercase font-mono text-slate-500 block">Department</span>
                <span className="font-semibold text-slate-200">{employee.department}</span>
              </div>
              <div className="bg-slate-950/70 rounded-xl p-3 border border-slate-800/80">
                <span className="text-[10px] uppercase font-mono text-slate-500 block">
                  BMONI Linked User
                </span>
                <span className="font-mono text-slate-200 truncate block">
                  {employee.bmoniLinkedUserId || 'Pending registration'}
                </span>
              </div>
            </div>
          </div>

          {/* Spend Limit & Policy Controls (if card exists) */}
          {card ? (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Spend Limit & Controls</h3>
                  <p className="text-xs text-slate-400">Admin policy configuration</p>
                </div>

                {!isEditingLimit && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingLimit(true);
                      setNewLimitInput(card.limitAmount.toString());
                    }}
                    className="flex items-center space-x-1.5 text-xs text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg border border-emerald-500/20 transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Limit</span>
                  </button>
                )}
              </div>

              {isEditingLimit ? (
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                  <label className="block text-xs font-mono uppercase text-slate-400">
                    Set New Monthly Limit (NGN)
                  </label>
                  <div className="flex items-center space-x-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-sm">
                        ₦
                      </span>
                      <input
                        type="number"
                        value={newLimitInput}
                        onChange={(e) => setNewLimitInput(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-7 pr-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={isUpdatingLimit}
                      onClick={handleSaveLimit}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-2 rounded-lg text-xs transition flex items-center space-x-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Save</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingLimit(false)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-lg text-xs transition"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block">
                      Approved Monthly Cap
                    </span>
                    <span className="text-xl font-bold font-mono text-slate-100">
                      {formatNgn(card.limitAmount)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block">
                      Current Utilization
                    </span>
                    <span className="text-xs font-mono text-emerald-400 font-semibold">
                      {Math.round((card.spentAmount / (card.limitAmount || 1)) * 100)}%
                    </span>
                  </div>
                </div>
              )}

              {limitFeedback && (
                <p className="text-xs text-emerald-400 font-mono animate-in fade-in duration-200">
                  {limitFeedback}
                </p>
              )}
            </div>
          ) : (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 text-center space-y-4 shadow-xl">
              <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-200">No Spend Card Issued Yet</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {employee.inviteStatus === 'LINKED'
                    ? 'This team member is linked and ready to receive a virtual NGN card.'
                    : 'Once the employee scans their invite link in the BMONI app, you can issue them a virtual spend card.'}
                </p>
              </div>

              {employee.inviteStatus === 'LINKED' && (
                <button
                  type="button"
                  onClick={() => onOpenIssueCard(employee)}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs transition inline-flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Issue Virtual Card Now</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Virtual Card Preview (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {card ? (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <span>Virtual Card Visualizer</span>
              </h3>
              <VirtualCardPreview
                card={card}
                onToggleFreeze={handleToggleFreeze}
                isUpdatingFreeze={isUpdatingFreeze}
              />
            </div>
          ) : (
            <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-12 text-center text-slate-500 space-y-2 h-full flex flex-col items-center justify-center">
              <CreditCard className="w-12 h-12 text-slate-700 mx-auto" />
              <p className="text-xs font-mono">Virtual card preview will appear once issued</p>
            </div>
          )}
        </div>
      </div>

      {/* Card Transactions Table */}
      {card && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-100">Transaction History</h3>
              <p className="text-xs text-slate-400">Activity on card {card.maskedPan}</p>
            </div>

            <button
              type="button"
              onClick={() => onOpenSwipeModal(card.id)}
              className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Simulate Payment</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                  <th className="pb-3">Merchant / Category</th>
                  <th className="pb-3">Date & Time</th>
                  <th className="pb-3 text-right">Amount</th>
                  <th className="pb-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {transactions.length > 0 ? (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3.5">
                        <span className="font-semibold text-slate-200 block">{tx.merchant}</span>
                        <span className="text-[10px] text-slate-500">{tx.category}</span>
                      </td>
                      <td className="py-3.5 text-slate-400 font-mono text-[11px]">
                        {new Date(tx.occurredAt).toLocaleString('en-NG', {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })}
                      </td>
                      <td className="py-3.5 text-right font-mono font-bold text-slate-100">
                        {formatNgn(tx.amount)}
                      </td>
                      <td className="py-3.5 text-right">
                        <div>
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold font-mono ${
                              tx.status === 'SUCCESS'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {tx.status}
                          </span>
                          {tx.declinedReason && (
                            <span className="text-[10px] text-rose-400 block mt-0.5 truncate max-w-[200px] ml-auto">
                              {tx.declinedReason}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500">
                      No card authorizations recorded yet. Click "Simulate Payment" to test.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
