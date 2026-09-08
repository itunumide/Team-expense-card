import React, { useState } from 'react';
import { X, Send, Copy, Check, QrCode, Sparkles, UserPlus } from 'lucide-react';
import type { Employee } from '../types';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (employee: Employee) => void;
}

export const InviteModal: React.FC<InviteModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('Engineering & DevOps');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdEmployee, setCreatedEmployee] = useState<Employee | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      setError('Please provide both name and email');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/employees/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, department }),
        credentials: 'include'
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to issue invite');
      }

      setCreatedEmployee(data.employee);
      onSuccess(data.employee);
    } catch (err: any) {
      setError(err.message || 'Failed to send invite');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!createdEmployee?.inviteUrl) return;
    navigator.clipboard.writeText(createdEmployee.inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleResetAndClose = () => {
    setName('');
    setEmail('');
    setCreatedEmployee(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Invite Team Member</h3>
              <p className="text-xs text-slate-400">BMONI No-App Onboarding Flow</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetAndClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs">
              {error}
            </div>
          )}

          {!createdEmployee ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Babatunde Alabi"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Work Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="babatunde@company.ng"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Department / Role
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                >
                  <option value="Engineering & DevOps">Engineering & DevOps</option>
                  <option value="Sales & Growth">Sales & Growth</option>
                  <option value="Field Operations">Field Operations</option>
                  <option value="Marketing & Brand">Marketing & Brand</option>
                  <option value="Finance & Admin">Finance & Admin</option>
                  <option value="Executive">Executive</option>
                </select>
              </div>

              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 space-y-2 text-xs text-slate-400">
                <div className="flex items-center space-x-2 text-emerald-400 font-semibold">
                  <Sparkles className="w-4 h-4" />
                  <span>How BMONI Invite Works</span>
                </div>
                <p>
                  1. An invite link & QR code is generated via BMONI Embedded API.
                </p>
                <p>
                  2. Employee opens BMONI mobile app to link their verified account.
                </p>
                <p>
                  3. Once linked, you can instantly issue a virtual NGN card with custom spend limits.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-sm transition flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full" />
                      <span>Generating Invite...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Generate Invite Link</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-5 text-center">
              <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                <Check className="w-6 h-6" />
              </div>

              <div>
                <h4 className="text-base font-bold text-slate-100">
                  Invite Created for {createdEmployee.name}
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Share this invite link or show the QR code for mobile onboarding.
                </p>
              </div>

              {/* QR Code */}
              {createdEmployee.qrCodeDataUrl ? (
                <div className="bg-white p-4 rounded-xl inline-block shadow-md mx-auto">
                  <img
                    src={createdEmployee.qrCodeDataUrl}
                    alt="BMONI Invite QR Code"
                    className="w-44 h-44 mx-auto"
                  />
                  <span className="text-[11px] font-mono text-slate-600 block mt-1">
                    Scan via BMONI App
                  </span>
                </div>
              ) : (
                <div className="p-8 bg-slate-950 rounded-xl border border-slate-800 text-slate-500 text-xs">
                  <QrCode className="w-12 h-12 mx-auto mb-2 text-slate-600" />
                  Invite ID: {createdEmployee.bmoniInviteId}
                </div>
              )}

              {/* Copyable Link */}
              <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-xl p-2 text-left">
                <input
                  type="text"
                  readOnly
                  value={createdEmployee.inviteUrl}
                  className="w-full bg-transparent text-xs text-slate-300 font-mono focus:outline-none px-2 truncate"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-3 py-1.5 rounded-lg text-xs flex items-center space-x-1.5 shrink-0 transition"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-5 py-2 rounded-xl text-xs transition"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
