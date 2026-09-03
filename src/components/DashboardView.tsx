import React, { useState } from 'react';
import {
  Wallet,
  Building2,
  Copy,
  Check,
  Plus,
  Users,
  CreditCard,
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
  ArrowUpRight,
  Zap,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { DashboardStats, Employee, Owner, Transaction } from '../types';

interface DashboardViewProps {
  stats: DashboardStats | null;
  owner: Owner | null;
  employees: Employee[];
  onOpenInvite: () => void;
  onOpenIssueCard: (employee: Employee) => void;
  onOpenSwipeModal: () => void;
  onNavigateTab: (tab: 'employees' | 'reports' | 'settings') => void;
  onSelectEmployeeDetail: (employeeId: string) => void;
  onRefreshData: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  owner,
  employees,
  onOpenInvite,
  onOpenIssueCard,
  onOpenSwipeModal,
  onNavigateTab,
  onSelectEmployeeDetail,
  onRefreshData
}) => {
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [fundingLoading, setFundingLoading] = useState(false);
  const [faucetSuccess, setFaucetSuccess] = useState<string | null>(null);

  const virtualAccount = stats?.virtualAccount || owner?.virtualAccount;

  const formatNgn = (amount: number | undefined) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const handleCopyAccount = () => {
    if (!virtualAccount?.accountNumber) return;
    navigator.clipboard.writeText(virtualAccount.accountNumber);
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  const handleFaucetDeposit = async (amount: number) => {
    setFundingLoading(true);
    setFaucetSuccess(null);
    try {
      const res = await fetch('/api/wallet/faucet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      });
      const data = await res.json();
      if (res.ok) {
        setFaucetSuccess(`Successfully credited ${formatNgn(amount)}!`);
        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.6 }
        });
        onRefreshData();
        setTimeout(() => setFaucetSuccess(null), 4000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setFundingLoading(false);
    }
  };

  const pendingEmployees = employees.filter((e) => e.inviteStatus === 'PENDING');
  const linkedWithoutCard = employees.filter((e) => e.inviteStatus === 'LINKED' && !e.card);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner / Welcome & Quick CTAs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {owner?.companyName || 'Corporate Expense Center'}
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full">
              Live NGN Rails
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Issue spend cards, set dynamic employee limits, and track NGN settlement in real time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            id="dashboard-invite-cta"
            onClick={onOpenInvite}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs transition flex items-center space-x-2 shadow-lg shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Invite Employee</span>
          </button>

          <button
            type="button"
            id="dashboard-swipe-cta"
            onClick={onOpenSwipeModal}
            className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-semibold px-4 py-2.5 rounded-xl text-xs transition flex items-center space-x-2"
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Simulate Card Swipe</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('reports')}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium px-4 py-2.5 rounded-xl text-xs transition flex items-center space-x-1.5"
          >
            <span>View Reports</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Primary Wallet & Virtual Account Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Wallet Balance Hero Card (7 cols) */}
        <div className="lg:col-span-7 bg-gradient-to-br from-slate-900 via-slate-900/90 to-emerald-950/40 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Wallet className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  BMONI Company Wallet
                </span>
              </div>
              <span className="text-[11px] font-mono text-emerald-400/90 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                NGN / CNGN Core
              </span>
            </div>

            <div className="mt-4">
              <span className="text-xs text-slate-400 block font-medium">Available Org Balance</span>
              <div className="flex items-baseline space-x-3 mt-1">
                <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight">
                  {formatNgn(stats?.walletBalance)}
                </span>
                <span className="text-xs text-emerald-400 font-semibold flex items-center">
                  <ShieldCheck className="w-3.5 h-3.5 mr-0.5" />
                  Live Liquid
                </span>
              </div>
            </div>
          </div>

          {/* Faucet / Topup Quick Action */}
          <div className="mt-6 pt-6 border-t border-slate-800/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-slate-400">
                <span className="font-semibold text-slate-200 block">Sandbox Token Faucet</span>
                <span>Fund wallet instantly with sandbox NGN tokens</span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  id="faucet-100k-btn"
                  disabled={fundingLoading}
                  onClick={() => handleFaucetDeposit(100000)}
                  className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-mono text-xs font-semibold px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                >
                  +₦100,000
                </button>
                <button
                  type="button"
                  id="faucet-500k-btn"
                  disabled={fundingLoading}
                  onClick={() => handleFaucetDeposit(500000)}
                  className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-mono text-xs font-semibold px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                >
                  +₦500,000
                </button>
              </div>
            </div>

            {faucetSuccess && (
              <p className="text-xs text-emerald-400 mt-2 font-mono animate-in fade-in duration-200">
                {faucetSuccess}
              </p>
            )}
          </div>
        </div>

        {/* Dedicated NGN Virtual Account Card (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Dedicated NGN Inbound Account
                </span>
              </div>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                Nigeria NIP Rail
              </span>
            </div>

            {virtualAccount ? (
              <div className="space-y-3 bg-slate-950/80 rounded-xl p-4 border border-slate-800/80">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block">
                      Account Number
                    </span>
                    <span className="text-xl font-bold font-mono text-emerald-300 tracking-wider">
                      {virtualAccount.accountNumber}
                    </span>
                  </div>
                  <button
                    type="button"
                    id="copy-account-btn"
                    onClick={handleCopyAccount}
                    className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-lg transition"
                  >
                    {copiedAccount ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-medium">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/60 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Bank Name</span>
                    <span className="font-semibold text-slate-200">{virtualAccount.bankName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Account Name</span>
                    <span className="font-semibold text-slate-200 truncate block">
                      {virtualAccount.accountName}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800 text-slate-400 text-xs">
                Account provisioning in progress...
              </div>
            )}
          </div>

          <div className="mt-4 text-[11px] text-slate-400 bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3 flex items-start space-x-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              Direct bank transfers to this account automatically reflect via instant BMONI webhooks.
            </span>
          </div>
        </div>
      </div>

      {/* 4 Stat Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Metric 1: Employees */}
        <div
          onClick={() => onNavigateTab('employees')}
          className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 cursor-pointer transition group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider">Team Members</span>
            <Users className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold text-white font-mono">
              {stats?.employeesCount || 0}
            </span>
            <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-1">
              <span className="text-emerald-400 font-semibold font-mono">
                {stats?.linkedEmployeesCount || 0} Linked
              </span>
              <span>•</span>
              <span className="text-amber-400 font-mono">
                {(stats?.employeesCount || 0) - (stats?.linkedEmployeesCount || 0)} Pending
              </span>
            </div>
          </div>
        </div>

        {/* Metric 2: Active Cards */}
        <div
          onClick={() => onNavigateTab('employees')}
          className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 cursor-pointer transition group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider">Active Cards</span>
            <CreditCard className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold text-white font-mono">
              {stats?.activeCardsCount || 0}
            </span>
            <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-1">
              <span className="text-emerald-400 font-semibold font-mono">Active</span>
              <span>•</span>
              <span className="text-rose-400 font-mono">
                {stats?.frozenCardsCount || 0} Frozen
              </span>
            </div>
          </div>
        </div>

        {/* Metric 3: Weekly Spend */}
        <div
          onClick={() => onNavigateTab('reports')}
          className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 cursor-pointer transition group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider">7-Day Spend</span>
            <TrendingUp className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold text-white font-mono truncate block">
              {formatNgn(stats?.weeklySpend)}
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">Settled this week</span>
          </div>
        </div>

        {/* Metric 4: Total Spend */}
        <div
          onClick={() => onNavigateTab('reports')}
          className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 cursor-pointer transition group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider">Total Card Spend</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold text-white font-mono truncate block">
              {formatNgn(stats?.totalSpend)}
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">All time volume</span>
          </div>
        </div>
      </div>

      {/* Actionable Alerts for Quick Demo (e.g. Onboarded employees ready for cards) */}
      {linkedWithoutCard.length > 0 && (
        <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-100">
                {linkedWithoutCard.length} Linked Employee{linkedWithoutCard.length > 1 ? 's' : ''} Ready for Spend Cards
              </h4>
              <p className="text-xs text-slate-400">
                {linkedWithoutCard.map((e) => e.name).join(', ')} onboarded via BMONI mobile app.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenIssueCard(linkedWithoutCard[0])}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs whitespace-nowrap transition"
          >
            Issue Virtual Card
          </button>
        </div>
      )}

      {/* Recent Activity Table & Quick Employee Card Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Transactions (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-100">Live Card Authorizations</h3>
              <p className="text-xs text-slate-400">Real-time BMONI transaction ledger</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('reports')}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
            >
              <span>All Reports</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 uppercase font-mono text-[10px]">
                  <th className="pb-3">Merchant / Category</th>
                  <th className="pb-3">Employee</th>
                  <th className="pb-3 text-right">Amount</th>
                  <th className="pb-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {stats?.recentTransactions && stats.recentTransactions.length > 0 ? (
                  stats.recentTransactions.slice(0, 6).map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3">
                        <span className="font-semibold text-slate-200 block truncate max-w-[180px]">
                          {tx.merchant}
                        </span>
                        <span className="text-[10px] text-slate-500 block">{tx.category}</span>
                      </td>
                      <td className="py-3 text-slate-300">{tx.employeeName}</td>
                      <td className="py-3 text-right font-mono font-bold text-slate-100">
                        {formatNgn(tx.amount)}
                      </td>
                      <td className="py-3 text-right">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono ${
                            tx.status === 'SUCCESS'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500">
                      No card transactions yet. Click "Simulate Card Swipe" to trigger live payment!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Employee Card Overview (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-100">Team Spend Cards</h3>
              <p className="text-xs text-slate-400">Live limits and card states</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('employees')}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {employees.slice(0, 4).map((emp) => (
              <div
                key={emp.id}
                onClick={() => onSelectEmployeeDetail(emp.id)}
                className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-xl p-3 flex items-center justify-between cursor-pointer transition group"
              >
                <div className="flex items-center space-x-3 truncate">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs">
                    {emp.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="truncate">
                    <span className="text-xs font-bold text-slate-200 block truncate group-hover:text-emerald-400 transition">
                      {emp.name}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate block">
                      {emp.department}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  {emp.card ? (
                    <div>
                      <span className="text-xs font-mono font-bold text-slate-200 block">
                        {formatNgn(emp.card.limitAmount)}
                      </span>
                      <span
                        className={`text-[10px] font-semibold ${
                          emp.card.status === 'ACTIVE' ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {emp.card.status}
                      </span>
                    </div>
                  ) : emp.inviteStatus === 'LINKED' ? (
                    <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Ready for Card
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      Invite Pending
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
