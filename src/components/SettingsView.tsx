import React, { useState, useEffect } from 'react';
import {
  Settings,
  ShieldCheck,
  Key,
  Webhook,
  RefreshCw,
  Zap,
  RotateCcw,
  CheckCircle2,
  Copy,
  Check,
  Terminal,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import type { Owner, WebhookLog } from '../types';

interface SettingsViewProps {
  owner: Owner | null;
  onRefreshData: () => void;
  onLogout: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ owner, onRefreshData, onLogout }) => {
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const webhookEndpoint = `${window.location.origin}/api/webhooks/bmoni`;
  const webhookSecret = 'whsec_bmoni_test_secret_demo';

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch('/api/webhooks/logs', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setWebhookLogs(data.logs || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleCopy = (text: string, type: 'url' | 'secret') => {
    navigator.clipboard.writeText(text);
    if (type === 'url') {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } else {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  };

  const handleResetDemo = async () => {
    if (!window.confirm('Reset all employees, cards, and transactions to fresh hackathon demo seed state?')) {
      return;
    }
    setResetting(true);
    try {
      const res = await fetch('/api/system/reset-demo', { method: 'POST', credentials: 'include' });
      if (res.ok) {
        setFeedback('Reset database to clean hackathon demo state successfully.');
        onRefreshData();
        fetchLogs();
        setTimeout(() => setFeedback(null), 4000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Organization & API Settings</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          BMONI Embedded API environment parameters, webhook listener, and live stage tools.
        </p>
      </div>

      {feedback && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs font-mono flex items-center space-x-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Grid: Environment & Webhook Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Environment Status Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-100">BMONI API Environment</h3>
            </div>
            <span className="px-2.5 py-0.5 text-xs font-semibold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full">
              Sandbox Live
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-mono text-slate-500 block">
                Base API Gateway URL
              </span>
              <span className="text-slate-200 font-mono text-xs block truncate">
                https://api.sandbox.bmoni.com/v1
              </span>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-mono text-slate-500 block">
                BMONI Organization User ID
              </span>
              <span className="text-slate-200 font-mono text-xs block">
                {owner?.bmoniUserId || 'bmoni_usr_998124'}
              </span>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-mono text-slate-500 block">
                BMONI Company Wallet ID
              </span>
              <span className="text-slate-200 font-mono text-xs block">
                {owner?.bmoniWalletId || 'bmoni_wlt_ngn_984120'}
              </span>
            </div>
          </div>
        </div>

        {/* Webhooks Config Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Webhook className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Webhook Receiver Endpoint</h3>
              <p className="text-xs text-slate-400">Verifies HMAC SHA-256 signatures</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-mono text-slate-500 block">
                Webhook Callback URL
              </span>
              <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-xl p-2">
                <input
                  type="text"
                  readOnly
                  value={webhookEndpoint}
                  className="w-full bg-transparent text-slate-300 font-mono text-xs px-2 truncate focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleCopy(webhookEndpoint, 'url')}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-1.5 rounded-lg shrink-0 transition"
                >
                  {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase font-mono text-slate-500 block">
                Webhook Signature Secret
              </span>
              <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-xl p-2">
                <input
                  type="text"
                  readOnly
                  value={webhookSecret}
                  className="w-full bg-transparent text-slate-300 font-mono text-xs px-2 truncate focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleCopy(webhookSecret, 'secret')}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-1.5 rounded-lg shrink-0 transition"
                >
                  {copiedSecret ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
              Registered events: <code className="text-emerald-400">kyc.activated</code>,{' '}
              <code className="text-emerald-400">invite.linked</code>,{' '}
              <code className="text-emerald-400">deposit.confirmed</code>,{' '}
              <code className="text-emerald-400">card.transaction</code>
            </div>
          </div>
        </div>
      </div>

      {/* Live Webhook Stream Inspector */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-100">Live BMONI Webhook Event Stream</h3>
          </div>

          <button
            type="button"
            onClick={fetchLogs}
            className="text-xs text-slate-400 hover:text-white flex items-center space-x-1.5 bg-slate-800 px-3 py-1.5 rounded-lg transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin text-emerald-400' : ''}`} />
            <span>Refresh Logs</span>
          </button>
        </div>

        <div className="space-y-3">
          {webhookLogs.length > 0 ? (
            webhookLogs.slice(0, 5).map((log) => (
              <div
                key={log.id}
                className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs font-mono"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-emerald-400 font-bold">{log.eventType}</span>
                  </div>
                  <span className="text-slate-500 text-[10px]">
                    {new Date(log.receivedAt).toLocaleTimeString()}
                  </span>
                </div>

                <div className="text-[11px] text-slate-400 bg-slate-900/80 p-2.5 rounded-lg overflow-x-auto border border-slate-800/80">
                  <pre>{JSON.stringify(log.payload, null, 2)}</pre>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-slate-500 text-xs">
              No webhook events captured yet.
            </div>
          )}
        </div>
      </div>

      {/* Hackathon Stage Rehearsal Toolkit & Reset State */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-100">Hackathon Stage Reset & Backup</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Reset to pre-configured demo dataset (seeded director KYC, linked team cards, sample transactions).
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            disabled={resetting}
            onClick={handleResetDemo}
            className="bg-slate-800 hover:bg-rose-900/40 text-slate-200 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-2"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
            <span>Reset Demo Seed</span>
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 px-4 py-2 rounded-xl text-xs font-semibold transition"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};
