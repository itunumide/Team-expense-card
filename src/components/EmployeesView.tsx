import React, { useState } from 'react';
import {
  Users,
  Plus,
  CreditCard,
  QrCode,
  ShieldCheck,
  ShieldAlert,
  Clock,
  ArrowRight,
  Sparkles,
  Search,
  ExternalLink,
  CheckCircle2,
  Lock
} from 'lucide-react';
import type { Employee } from '../types';

interface EmployeesViewProps {
  employees: Employee[];
  onOpenInvite: () => void;
  onOpenIssueCard: (employee: Employee) => void;
  onSelectEmployeeDetail: (employeeId: string) => void;
  onRefreshData: () => void;
}

export const EmployeesView: React.FC<EmployeesViewProps> = ({
  employees,
  onOpenInvite,
  onOpenIssueCard,
  onSelectEmployeeDetail,
  onRefreshData
}) => {
  const [search, setSearch] = useState('');
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const [qrModalEmp, setQrModalEmp] = useState<Employee | null>(null);

  const formatNgn = (amount: number | undefined) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const handleSimulateLink = async (e: React.MouseEvent, employee: Employee) => {
    e.stopPropagation();
    setLinkingId(employee.id);
    try {
      const res = await fetch(`/api/employees/${employee.id}/simulate-link`, {
        method: 'POST',
        credentials: 'include'
      });
      if (res.ok) {
        onRefreshData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLinkingId(null);
    }
  };

  const filtered = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase()) ||
      e.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Team Expense Cards</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage employee on-boarding, virtual spend limits, and card states.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            id="employees-invite-btn"
            onClick={onOpenInvite}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition flex items-center space-x-2 shadow-lg shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Invite Team Member</span>
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search employee by name, email, department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>

        <div className="text-xs text-slate-400 font-mono hidden sm:block">
          Total Members: <span className="text-slate-200 font-bold">{employees.length}</span>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px] tracking-wider">
                <th className="py-3.5 px-6">Employee</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">BMONI Invite Status</th>
                <th className="py-3.5 px-4">Virtual Card</th>
                <th className="py-3.5 px-4">Spend Limit</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length > 0 ? (
                filtered.map((emp) => {
                  const hasCard = !!emp.card;
                  const isLinked = emp.inviteStatus === 'LINKED';
                  const isPending = emp.inviteStatus === 'PENDING';

                  return (
                    <tr
                      key={emp.id}
                      onClick={() => onSelectEmployeeDetail(emp.id)}
                      className="hover:bg-slate-800/40 transition cursor-pointer group"
                    >
                      {/* Name & Email */}
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 font-bold flex items-center justify-center shrink-0">
                            {emp.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-100 block group-hover:text-emerald-400 transition text-sm">
                              {emp.name}
                            </span>
                            <span className="text-[11px] text-slate-400">{emp.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="py-4 px-4 text-slate-300">
                        <span className="bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800 text-[11px]">
                          {emp.department}
                        </span>
                      </td>

                      {/* Invite Status */}
                      <td className="py-4 px-4">
                        {isLinked ? (
                          <div className="flex items-center space-x-1.5 text-emerald-400">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span className="font-semibold text-xs">Linked via App</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <span className="inline-flex items-center space-x-1 text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 text-[11px] font-mono">
                              <Clock className="w-3 h-3" />
                              <span>Pending Link</span>
                            </span>

                            {/* Show QR button */}
                            {emp.qrCodeDataUrl && (
                              <button
                                type="button"
                                title="View Onboarding QR Code"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setQrModalEmp(emp);
                                }}
                                className="p-1 text-slate-400 hover:text-emerald-400 bg-slate-800 rounded transition"
                              >
                                <QrCode className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Card Status */}
                      <td className="py-4 px-4">
                        {hasCard ? (
                          <div className="flex items-center space-x-2">
                            <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-mono text-slate-200 text-xs">
                              {emp.card?.maskedPan}
                            </span>
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${
                                emp.card?.status === 'ACTIVE'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {emp.card?.status}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-xs italic">No card issued</span>
                        )}
                      </td>

                      {/* Spend Limit */}
                      <td className="py-4 px-4 font-mono font-bold text-slate-200">
                        {hasCard ? formatNgn(emp.card?.limitAmount) : '—'}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {isPending && (
                            <button
                              type="button"
                              onClick={(e) => handleSimulateLink(e, emp)}
                              disabled={linkingId === emp.id}
                              title="Simulate employee completing BMONI mobile KYC"
                              className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-semibold px-2.5 py-1 rounded-lg transition flex items-center space-x-1"
                            >
                              <Sparkles className="w-3 h-3 text-amber-400" />
                              <span>{linkingId === emp.id ? 'Linking...' : 'Simulate Link'}</span>
                            </button>
                          )}

                          {isLinked && !hasCard && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenIssueCard(emp);
                              }}
                              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[11px] font-bold px-3 py-1 rounded-lg transition"
                            >
                              Issue Card
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectEmployeeDetail(emp.id);
                            }}
                            className="text-slate-400 hover:text-slate-100 p-1 rounded hover:bg-slate-800 transition"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No team members found. Click "Invite Team Member" above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Code Quick Modal */}
      {qrModalEmp && qrModalEmp.qrCodeDataUrl && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full text-center space-y-4">
            <h3 className="text-base font-bold text-slate-100">
              Onboarding QR for {qrModalEmp.name}
            </h3>
            <p className="text-xs text-slate-400">
              Scan with the BMONI mobile app to link account to {qrModalEmp.email}
            </p>
            <div className="bg-white p-4 rounded-xl inline-block shadow-md">
              <img src={qrModalEmp.qrCodeDataUrl} alt="QR Code" className="w-48 h-48 mx-auto" />
            </div>
            <button
              type="button"
              onClick={() => setQrModalEmp(null)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-2.5 rounded-xl transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
