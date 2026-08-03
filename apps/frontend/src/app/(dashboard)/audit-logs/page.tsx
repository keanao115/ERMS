'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldAlert, Loader2, AlertCircle, RefreshCw, Lock, Clock } from 'lucide-react';
import { api, getAuthUser } from '@/lib/api';

interface AuditLogEntry {
  id: string;
  action: string;
  entityName: string;
  entityId: string | null;
  payload: string | null;
  ipAddress: string | null;
  traceId: string | null;
  userRole: string | null;
  createdAt: string;
  user: { firstName?: string; lastName?: string; email?: string } | null;
}

const ACTIONS = ['ALL', 'CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'REFUND_OVERRIDE', 'VOID_OVERRIDE', 'INVENTORY_ADJUSTMENT'];

const POLL_INTERVAL_MS = 15000;

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const currentUser = getAuthUser();
  const userRole = currentUser?.role;
  const isManagerOrAdmin = userRole === 'STORE_MANAGER' || userRole === 'SUPER_ADMIN' || userRole === 'RESTAURANT_OWNER' || userRole === 'REGIONAL_MANAGER';

  const fetchLogs = useCallback(
    async (isBackground: boolean) => {
      if (!isManagerOrAdmin) {
        setLoading(false);
        return;
      }
      if (isBackground) setRefreshing(true);
      try {
        const res = await api.get('/audit-logs', {
          params: actionFilter !== 'ALL' ? { action: actionFilter } : {}
        });
        setLogs(res.data);
        setLoadError('');
      } catch (err: any) {
        setLoadError(
          err.response?.data?.message ||
            (err.response?.status === 403
              ? 'Role access denied. Requires SUPER_ADMIN / RESTAURANT_OWNER / STORE_MANAGER.'
              : 'Failed to connect to backend service.')
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [actionFilter, isManagerOrAdmin]
  );

  useEffect(() => {
    fetchLogs(false);
  }, [fetchLogs]);

  useEffect(() => {
    if (!isManagerOrAdmin) return;
    const timer = setInterval(() => fetchLogs(true), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [fetchLogs, isManagerOrAdmin]);

  if (!isManagerOrAdmin) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pt-6">
        <div className="glass-panel p-8 rounded-3xl border border-amber-500/30 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white">Access Restricted</h2>
          <p className="text-sm text-zinc-300 font-medium">
            Security Audit Trail & Compliance Log is restricted exclusively to Store Managers and Super Administrators.
          </p>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            Non-manager staff accounts do not have permission to view system security logs, override reasons, or audit trails.
          </p>
          <div className="pt-2">
            <Link href="/my-attendance">
              <button className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-lg shadow-blue-600/30 inline-flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Go to My Shift Attendance</span>
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const parsePayloadDetails = (payloadStr: string | null) => {
    if (!payloadStr) return null;
    try {
      return JSON.parse(payloadStr);
    } catch (e) {
      return null;
    }
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-6rem)] flex items-center justify-center text-zinc-400 text-sm gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Loading security audit logs...</span>
      </div>
    );
  }

  if (loadError && logs.length === 0) {
    return (
      <div className="h-[calc(100vh-6rem)] flex items-center justify-center">
        <div className="glass-panel p-6 rounded-2xl border border-rose-500/30 max-w-md text-center">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-3" />
          <p className="text-sm text-white font-semibold mb-1">Failed to load audit logs</p>
          <p className="text-xs text-zinc-400">{loadError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Security Audit Trail & Compliance Log</h1>
          <p className="text-xs text-zinc-400 mt-1">Immutable Log Records — Latest 100 Entries with Cancellation Source & Reason Attribution</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500/50"
          >
            {ACTIONS.map((a) => (
              <option key={a} value={a} className="bg-zinc-900">
                {a}
              </option>
            ))}
          </select>
          <button
            onClick={() => fetchLogs(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white hover:border-white/20 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-white/10">
        <div className="flex items-center gap-2 mb-4">
          <ShieldAlert className="w-5 h-5 text-rose-400" />
          <h2 className="text-base font-semibold text-white">System Security Activity Log</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-white/10 text-zinc-400 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor Name & Role</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Action Type</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">Reason / Details</th>
                <th className="py-3 px-4">Trace ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-[11px]">
              {logs.map((log) => {
                const parsed = parsePayloadDetails(log.payload);
                const actorName = parsed?.actorName || (log.user ? `${log.user.firstName || ''} ${log.user.lastName || ''}`.trim() : 'System');
                const source = parsed?.source || 'SYSTEM';
                const reason = parsed?.reason || '—';

                return (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4 text-zinc-400">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-white font-semibold">
                      {actorName} {log.userRole ? <span className="text-[10px] text-zinc-400">({log.userRole})</span> : ''}
                    </td>
                    <td className="py-3.5 px-4">
                      {source === 'KDS_KITCHEN' ? (
                        <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold text-[10px]">
                          KDS_KITCHEN
                        </span>
                      ) : source === 'POS_MANAGER' ? (
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold text-[10px]">
                          POS_MANAGER
                        </span>
                      ) : (
                        <span className="text-zinc-500">{source}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-md border font-bold text-[10px] ${
                        log.action.includes('VOID') || log.action.includes('REFUND')
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-300">
                      {log.entityName}
                      {log.entityId ? ` #${log.entityId.slice(0, 8)}` : ''}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-300 max-w-xs truncate" title={reason}>
                      {reason}
                    </td>
                    <td className="py-3.5 px-4 text-emerald-400 font-bold">{log.traceId || '—'}</td>
                  </tr>
                );
              })}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-500 font-sans">
                    No matching security audit logs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
