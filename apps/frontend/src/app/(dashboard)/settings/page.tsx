'use client';

import React from 'react';
import { Settings, Building, CreditCard, ShieldCheck, Cpu } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Enterprise Organization Settings</h1>
        <p className="text-xs text-zinc-400 mt-1">Multi-branch Config, Tax Rules, Payment Gateways, and Telemetry</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-blue-400" />
            <h2 className="text-sm font-semibold text-white">Restaurant Enterprise Details</h2>
          </div>
          <div className="space-y-3 text-xs">
            <div>
              <label className="text-zinc-400 block mb-1">Enterprise Name</label>
              <input type="text" readOnly value="Aura Enterprise Hospitality Group" className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white" />
            </div>
            <div>
              <label className="text-zinc-400 block mb-1">Tax Registration Number</label>
              <input type="text" readOnly value="US-TAX-998877665" className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white" />
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">Payment Gateway Adapters</h2>
          </div>
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div>
                <p className="font-bold text-white">Stripe Integration Adapter</p>
                <p className="text-[10px] text-emerald-400">STATUS: CONNECTED (Live Key Tokenized)</p>
              </div>
              <button className="px-3 py-1 rounded-lg bg-white/10 text-white font-bold">Configure</button>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div>
                <p className="font-bold text-white">QuickBooks Online ERP Sync</p>
                <p className="text-[10px] text-purple-400">STATUS: ACTIVE (Daily Auto-Sync at 11:59 PM)</p>
              </div>
              <button className="px-3 py-1 rounded-lg bg-white/10 text-white font-bold">Configure</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
