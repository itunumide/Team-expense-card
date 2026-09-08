import React, { useState, useEffect } from 'react';
import {
  PieChart,
  Download,
  Filter,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpDown,
  CreditCard,
  Building,
  Sparkles
} from 'lucide-react';
import type { Transaction, Employee } from '../types';

interface ReportsViewProps {
  employees: Employee[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({ employees }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedDateRange, setSelectedDateRange] = useState('ALL');

  const fetchReports = async () => {
    try {
      let url = '/api/reports?';
      if (selectedEmployee !== 'ALL') url += `employeeId=${selectedEmployee}&`;
      if (selectedStatus !== 'ALL') url += `status=${selectedStatus}&`;
      if (search) url += `search=${encodeURIComponent(search)}&`;

      const res = await fetch(url, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [selectedEmployee, selectedStatus, search]);

  const formatNgn = (amount: number | undefined) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Filter date range client-side
  const filteredTxs = transactions.filter((tx) => {
    if (selectedDateRange === 'TODAY') {
      const today = new Date().toDateString();
      return new Date(tx.occurredAt).toDateString() === today;
    }
    if (selectedDateRange === '7DAYS') {
      const sevenDaysAgo = Date.now() - 7 * 86400000;
      return new Date(tx.occurredAt).getTime() >= sevenDaysAgo;
    }
    if (selectedDateRange === '30DAYS') {
      const thirtyDaysAgo = Date.now() - 30 * 86400000;
      return new Date(tx.occurredAt).getTime() >= thirtyDaysAgo;
    }
    return true;
  });

  const totalSuccessfulSpend = filteredTxs
    .filter((t) => t.status === 'SUCCESS')
    .reduce((sum, t) => sum + t.amount, 0);

  const successfulCount = filteredTxs.filter((t) => t.status === 'SUCCESS').length;
  const declinedCount = filteredTxs.filter((t) => t.status === 'DECLINED').length;

  // Category breakdown
  const categoryTotals: Record<string, number> = {};
  filteredTxs
    .filter((t) => t.status === 'SUCCESS')
    .forEach((t) => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });

  const handleExportCSV = () => {
    if (filteredTxs.length === 0) return;
    const headers = ['Transaction ID', 'Employee', 'Merchant', 'Category', 'Amount (NGN)', 'Status', 'Date', 'Declined Reason'];
    const rows = filteredTxs.map((t) => [
      t.bmoniTransactionId,
      `"${t.employeeName}"`,
      `"${t.merchant}"`,
      `"${t.category}"`,
      t.amount,
      t.status,
      `"${new Date(t.occurredAt).toLocaleString('en-NG')}"`,
      `"${t.declinedReason || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `bmoni_team_expense_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Company Expense Report</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit trail of all employee spend cards, approvals, and blocked transactions.
          </p>
        </div>

        <button
          type="button"
          id="export-csv-btn"
          onClick={handleExportCSV}
          disabled={filteredTxs.length === 0}
          className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700 px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-2"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV Report</span>
        </button>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <span className="text-xs uppercase font-mono text-slate-400 block">Total Approved Spend</span>
          <span className="text-2xl sm:text-3xl font-bold text-white font-mono mt-1 block">
            {formatNgn(totalSuccessfulSpend)}
          </span>
          <span className="text-[11px] text-emerald-400 mt-1 block flex items-center space-x-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>{successfulCount} approved authorizations</span>
          </span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <span className="text-xs uppercase font-mono text-slate-400 block">Declined / Blocked</span>
          <span className="text-2xl sm:text-3xl font-bold text-rose-400 font-mono mt-1 block">
            {declinedCount}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Card frozen or spend limit exceeded
          </span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <span className="text-xs uppercase font-mono text-slate-400 block">Top Spend Category</span>
          <div className="mt-1">
            {Object.keys(categoryTotals).length > 0 ? (
              <>
                <span className="text-lg font-bold text-slate-200 truncate block">
                  {Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0][0]}
                </span>
                <span className="text-[11px] text-emerald-400 font-mono">
                  {formatNgn(Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0][1])}
                </span>
              </>
            ) : (
              <span className="text-sm text-slate-500">No category data</span>
            )}
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search merchant, employee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>

        {/* Employee Filter */}
        <div>
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition"
          >
            <option value="ALL">All Team Members</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} ({emp.department})
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUCCESS">Approved (SUCCESS)</option>
            <option value="DECLINED">Declined / Frozen (DECLINED)</option>
          </select>
        </div>

        {/* Date Range Filter */}
        <div>
          <select
            value={selectedDateRange}
            onChange={(e) => setSelectedDateRange(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition"
          >
            <option value="ALL">All Time</option>
            <option value="TODAY">Today Only</option>
            <option value="7DAYS">Last 7 Days</option>
            <option value="30DAYS">This Month (30 Days)</option>
          </select>
        </div>
      </div>

      {/* Transactions Full Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                <th className="py-3.5 px-6">Date & Time</th>
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-4">Merchant & Category</th>
                <th className="py-3.5 px-4">BMONI Tx Ref</th>
                <th className="py-3.5 px-4 text-right">Amount (NGN)</th>
                <th className="py-3.5 px-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTxs.length > 0 ? (
                filteredTxs.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-6 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(tx.occurredAt).toLocaleString('en-NG', {
                        dateStyle: 'short',
                        timeStyle: 'short'
                      })}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-200">
                      {tx.employeeName}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-200 block">{tx.merchant}</span>
                      <span className="text-[10px] text-slate-500">{tx.category}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                      {tx.bmoniTransactionId}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-100 whitespace-nowrap">
                      {formatNgn(tx.amount)}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <div className="flex flex-col items-end">
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
                          <span className="text-[10px] text-rose-400 mt-0.5 max-w-[200px] truncate text-right">
                            {tx.declinedReason}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No matching expense transactions found for selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
