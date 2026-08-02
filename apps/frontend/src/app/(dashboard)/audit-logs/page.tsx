'use client';

import React from 'react';
import { ShieldAlert, Terminal, Clock, Lock } from 'lucide-react';

const auditEntries = [
  { time: '15:08:12', actor: 'Alexander Vance (SUPER_ADMIN)', action: 'LOGIN', target: 'User', ip: '127.0.0.1', traceId: 'TRC-998811' },
  { time: '14:45:00', actor: 'David Miller (CASHIER)', action: 'CREATE', target: 'Order #ORD-1002', ip: '192.168.1.45', traceId: 'TRC-998812' },
  { time: '14:20:30', actor: 'Sophia Chen (STORE_MANAGER)', action: 'REFUND_OVERRIDE', target: 'Payment TXN-9988', ip: '192.168.1.10', traceId: 'TRC-998813' },
  { time: '13:00:00', actor: 'System Auto-Deductions', action: 'INVENTORY_ADJUSTMENT', target: 'Ingredient #ING-WAGYU', ip: '127.0.0.1', traceId: 'TRC-998814' }
];

export default function AuditLogsPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Security Audit Trail & Compliance Log</h1>
        <p className="text-xs text-zinc-400 mt-1">Immutable Log Records with OpenTelemetry Trace ID Correlation</p>
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
                <th className="py-3 px-4">Actor Context</th>
                <th className="py-3 px-4">Action Type</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4">Trace ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-[11px]">
              {auditEntries.map((log, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors">
                  <td className="py-3.5 px-4 text-zinc-400">{log.time}</td>
                  <td className="py-3.5 px-4 text-white font-semibold">{log.actor}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-zinc-300">{log.target}</td>
                  <td className="py-3.5 px-4 text-zinc-500">{log.ip}</td>
                  <td className="py-3.5 px-4 text-emerald-400 font-bold">{log.traceId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
