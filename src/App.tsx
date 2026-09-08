import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { EmployeesView } from './components/EmployeesView';
import { EmployeeDetailView } from './components/EmployeeDetailView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { SignupWizard } from './components/SignupWizard';
import { LoginView } from './components/LoginView';
import { InviteModal } from './components/InviteModal';
import { IssueCardModal } from './components/IssueCardModal';
import { SwipeSimulatorModal } from './components/SwipeSimulatorModal';
import { useTheme } from './hooks/useTheme';
import type { Owner, DashboardStats, Employee, Card, Transaction } from './types';

export default function App() {
  const [authView, setAuthView] = useState<'app' | 'login' | 'signup'>('app');
  const [owner, setOwner] = useState<Owner | null>(null);
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'employees' | 'reports' | 'settings'>('dashboard');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  // Core Data
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(875000);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [issueCardEmployee, setIssueCardEmployee] = useState<Employee | null>(null);
  const [swipeModalOpen, setSwipeModalOpen] = useState(false);
  const [swipeCardId, setSwipeCardId] = useState<string | undefined>(undefined);

  const { theme, toggleTheme } = useTheme();

  // Fetch initial user & state
  const fetchOwnerAndData = useCallback(async () => {
    try {
      const authRes = await fetch('/api/auth/me', { credentials: 'include' });
      if (authRes.ok) {
        const authData = await authRes.json();
        setOwner(authData.owner);
      }

      // Fetch Dashboard Stats & Balance
      const [statsRes, empRes, balRes] = await Promise.all([
        fetch('/api/dashboard/stats', { credentials: 'include' }),
        fetch('/api/employees', { credentials: 'include' }),
        fetch('/api/wallet/balance', { credentials: 'include' })
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
      if (empRes.ok) {
        const empData = await empRes.json();
        setEmployees(empData.employees || []);
      }
      if (balRes.ok) {
        const balData = await balRes.json();
        setWalletBalance(balData.availableBalance || 0);
      }
    } catch (err) {
      console.error('Data refresh error:', err);
    }
  }, []);

  useEffect(() => {
    fetchOwnerAndData();
  }, [fetchOwnerAndData]);

  // Polling every 8 seconds for live BMONI balance and webhook events
  useEffect(() => {
    if (authView !== 'app') return;

    const interval = setInterval(async () => {
      try {
        const [balRes, statsRes, empRes] = await Promise.all([
          fetch('/api/wallet/balance', { credentials: 'include' }),
          fetch('/api/dashboard/stats', { credentials: 'include' }),
          fetch('/api/employees', { credentials: 'include' })
        ]);

        if (balRes.ok) {
          const balData = await balRes.json();
          setWalletBalance(balData.availableBalance || 0);
        }
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }
        if (empRes.ok) {
          const empData = await empRes.json();
          setEmployees(empData.employees || []);
        }
      } catch (e) {
        // silent polling catch
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [authView]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchOwnerAndData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleAuthSuccess = (loggedOwner: Owner) => {
    setOwner(loggedOwner);
    setAuthView('app');
    fetchOwnerAndData();
  };

  const handleLogout = () => {
    setAuthView('login');
  };

  const allActiveCards: Card[] = employees
    .filter((e) => !!e.card)
    .map((e) => e.card as Card);

  if (authView === 'login') {
    return (
      <LoginView
        onSuccess={handleAuthSuccess}
        onGoToSignup={() => setAuthView('signup')}
      />
    );
  }

  if (authView === 'signup') {
    return (
      <SignupWizard
        onSuccess={handleAuthSuccess}
        onGoToLogin={() => setAuthView('login')}
      />
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950"
      style={{
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
      }}
    >
      {/* Navigation Header */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setSelectedEmployeeId(null);
          setCurrentTab(tab);
        }}
        owner={owner}
        walletBalance={walletBalance}
        onRefreshBalance={handleManualRefresh}
        isRefreshing={isRefreshing}
        onOpenInvite={() => setInviteModalOpen(true)}
        onOpenSwipeModal={() => {
          setSwipeCardId(allActiveCards[0]?.id);
          setSwipeModalOpen(true);
        }}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Container */}
      <main className="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-28 py-8">
        {selectedEmployeeId ? (
          <EmployeeDetailView
            employeeId={selectedEmployeeId}
            onBack={() => setSelectedEmployeeId(null)}
            onOpenIssueCard={(emp) => setIssueCardEmployee(emp)}
            onOpenSwipeModal={(cardId) => {
              setSwipeCardId(cardId);
              setSwipeModalOpen(true);
            }}
            onRefreshData={handleManualRefresh}
          />
        ) : (
          <>
            {currentTab === 'dashboard' && (
              <DashboardView
                stats={stats}
                owner={owner}
                employees={employees}
                onOpenInvite={() => setInviteModalOpen(true)}
                onOpenIssueCard={(emp) => setIssueCardEmployee(emp)}
                onOpenSwipeModal={() => {
                  setSwipeCardId(allActiveCards[0]?.id);
                  setSwipeModalOpen(true);
                }}
                onNavigateTab={(tab) => setCurrentTab(tab)}
                onSelectEmployeeDetail={(empId) => setSelectedEmployeeId(empId)}
                onRefreshData={handleManualRefresh}
              />
            )}

            {currentTab === 'employees' && (
              <EmployeesView
                employees={employees}
                onOpenInvite={() => setInviteModalOpen(true)}
                onOpenIssueCard={(emp) => setIssueCardEmployee(emp)}
                onSelectEmployeeDetail={(empId) => setSelectedEmployeeId(empId)}
                onRefreshData={handleManualRefresh}
              />
            )}

            {currentTab === 'reports' && <ReportsView employees={employees} />}

            {currentTab === 'settings' && (
              <SettingsView
                owner={owner}
                onRefreshData={handleManualRefresh}
                onLogout={handleLogout}
              />
            )}
          </>
        )}
      </main>

      {/* Invite Modal */}
      <InviteModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        onSuccess={(newEmp) => {
          setEmployees((prev) => [newEmp, ...prev]);
          handleManualRefresh();
        }}
      />

      {/* Issue Card Modal */}
      <IssueCardModal
        isOpen={!!issueCardEmployee}
        employee={issueCardEmployee}
        onClose={() => setIssueCardEmployee(null)}
        onSuccess={(newCard) => {
          handleManualRefresh();
        }}
      />

      {/* Payment Swipe Simulator Modal */}
      <SwipeSimulatorModal
        isOpen={swipeModalOpen}
        cards={allActiveCards}
        selectedCardId={swipeCardId}
        onClose={() => setSwipeModalOpen(false)}
        onTransactionComplete={(tx) => {
          handleManualRefresh();
        }}
      />
    </div>
  );
}
