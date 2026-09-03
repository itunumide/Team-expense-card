import React from 'react';
import {
  CreditCard,
  Users,
  PieChart,
  Settings,
  ShieldCheck,
  RefreshCw,
  LogOut,
  Zap,
  Building,
  Plus
} from 'lucide-react';
import type { Owner } from '../types';

interface NavbarProps {
  currentTab: 'dashboard' | 'employees' | 'reports' | 'settings';
  setCurrentTab: (tab: 'dashboard' | 'employees' | 'reports' | 'settings') => void;
  owner: Owner | null;
  walletBalance: number;
  onRefreshBalance: () => void;
  isRefreshing: boolean;
  onOpenInvite: () => void;
  onOpenSwipeModal: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  owner,
  walletBalance,
  onRefreshBalance,
  isRefreshing,
  onOpenInvite,
  onOpenSwipeModal,
  onLogout
}) => {
  const formatNgn = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Organization */}
          <div className="flex items-center space-x-6">
            <div
              onClick={() => setCurrentTab('dashboard')}
              className="flex items-center space-x-3 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 p-0.5 shadow-lg shadow-emerald-950/40">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                </div>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-base tracking-tight text-white">Team Cards</span>
                  <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded">
                    BMONI
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                  <Building className="w-3 h-3 text-slate-500" />
                  <span className="truncate max-w-[140px]">{owner?.companyName || 'Acme Logistics Ltd'}</span>
                </div>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1 pl-4 border-l border-slate-800">
              <button
                type="button"
                id="nav-tab-dashboard"
                onClick={() => setCurrentTab('dashboard')}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wide transition flex items-center space-x-2 ${
                  currentTab === 'dashboard'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Dashboard</span>
              </button>

              <button
                type="button"
                id="nav-tab-employees"
                onClick={() => setCurrentTab('employees')}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wide transition flex items-center space-x-2 ${
                  currentTab === 'employees'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Employees & Cards</span>
              </button>

              <button
                type="button"
                id="nav-tab-reports"
                onClick={() => setCurrentTab('reports')}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wide transition flex items-center space-x-2 ${
                  currentTab === 'reports'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <PieChart className="w-4 h-4" />
                <span>Expense Reports</span>
              </button>

              <button
                type="button"
                id="nav-tab-settings"
                onClick={() => setCurrentTab('settings')}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wide transition flex items-center space-x-2 ${
                  currentTab === 'settings'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Settings & Webhooks</span>
              </button>
            </nav>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center space-x-3">
            {/* Quick Wallet Ticker */}
            <div className="hidden sm:flex items-center space-x-2.5 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block -mb-0.5">
                  Company Balance
                </span>
                <span className="text-xs font-bold font-mono text-emerald-400">
                  {formatNgn(walletBalance)}
                </span>
              </div>
              <button
                type="button"
                id="quick-refresh-balance-btn"
                onClick={onRefreshBalance}
                title="Refresh Live Balance"
                className="text-slate-400 hover:text-emerald-400 p-1 rounded hover:bg-slate-800 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
              </button>
            </div>

            {/* Stage Live Demo Swipe Button */}
            <button
              type="button"
              id="top-quick-swipe-btn"
              onClick={onOpenSwipeModal}
              className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-semibold px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Simulate Swipe</span>
            </button>

            {/* Quick Invite Button */}
            <button
              type="button"
              id="top-quick-invite-btn"
              onClick={onOpenInvite}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold px-3.5 py-1.5 rounded-lg transition flex items-center space-x-1.5 shadow-sm shadow-emerald-500/20"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Invite</span>
            </button>

            {/* User Profile & Logout */}
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
              <div className="hidden lg:block text-right">
                <span className="text-xs font-semibold text-slate-200 block truncate max-w-[110px]">
                  {owner?.name || 'Director'}
                </span>
                <span className="text-[10px] text-emerald-400 font-mono flex items-center justify-end space-x-1">
                  <ShieldCheck className="w-2.5 h-2.5" />
                  <span>KYC Active</span>
                </span>
              </div>
              <button
                type="button"
                id="nav-logout-btn"
                onClick={onLogout}
                title="Sign Out"
                className="text-slate-400 hover:text-rose-400 p-2 rounded-lg hover:bg-slate-900 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Subnavigation Bar */}
        <div className="md:hidden flex items-center space-x-1 py-2 overflow-x-auto border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => setCurrentTab('dashboard')}
            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${
              currentTab === 'dashboard' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400'
            }`}
          >
            Dashboard
          </button>
          <button
            type="button"
            onClick={() => setCurrentTab('employees')}
            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${
              currentTab === 'employees' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400'
            }`}
          >
            Employees
          </button>
          <button
            type="button"
            onClick={() => setCurrentTab('reports')}
            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${
              currentTab === 'reports' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400'
            }`}
          >
            Reports
          </button>
          <button
            type="button"
            onClick={() => setCurrentTab('settings')}
            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${
              currentTab === 'settings' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400'
            }`}
          >
            Settings
          </button>
        </div>
      </div>
    </header>
  );
};
