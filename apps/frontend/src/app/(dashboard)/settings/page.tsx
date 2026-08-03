'use client';

import React, { useEffect, useState } from 'react';
import { Building, CreditCard, Save, CheckCircle2, Lock, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { api, getAuthUser } from '@/lib/api';

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [restaurant, setRestaurant] = useState<any>({ name: '', taxRegistrationNumber: '' });
  const [branch, setBranch] = useState<any>({ name: '', address: '', city: '', phone: '', capacity: 120 });
  const [adaptersStatus, setAdaptersStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const loadSettings = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const userObj = getAuthUser();
      setUser(userObj);

      const role = userObj?.role;
      const managerOrAdmin =
        role === 'SUPER_ADMIN' ||
        role === 'RESTAURANT_OWNER' ||
        role === 'STORE_MANAGER' ||
        role === 'REGIONAL_MANAGER';

      const resId = userObj?.restaurantId || 'default-restaurant-id';
      const branchId = userObj?.branchId || 'default-branch-id';

      // Fetch all three endpoints; for non-managers, backend may return 403 — settle individually
      const [restResult, branchResult, adaptersResult] = await Promise.allSettled([
        api.get(`/restaurants/${resId}`),
        api.get(`/restaurants/branches/${branchId}`),
        api.get('/adapters/status')
      ]);

      if (restResult.status === 'fulfilled') setRestaurant(restResult.value.data);
      if (branchResult.status === 'fulfilled') setBranch(branchResult.value.data);
      if (adaptersResult.status === 'fulfilled') setAdaptersStatus(adaptersResult.value.data);

      // Only surface an error banner for managers (non-managers see read-only empty fields)
      if (managerOrAdmin) {
        const anyFailed = [restResult, branchResult, adaptersResult].some((r) => r.status === 'rejected');
        if (anyFailed) {
          setApiError('Failed to load some organization settings from server. Please verify backend service connectivity.');
        }
      }
    } catch (err: any) {
      console.error('Failed to load settings:', err);
      setApiError('Failed to load organization settings from server. Please verify backend service connectivity.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);


  const isManager = user?.role === 'SUPER_ADMIN' || user?.role === 'RESTAURANT_OWNER' || user?.role === 'STORE_MANAGER' || user?.role === 'REGIONAL_MANAGER';

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isManager) return;

    setSaving(true);
    setApiError(null);
    setSaveSuccess(false);

    try {
      if (restaurant?.id) {
        await api.put(`/restaurants/${restaurant.id}`, {
          name: restaurant.name,
          taxRegistrationNumber: restaurant.taxRegistrationNumber
        });
      }

      if (branch?.id) {
        await api.put(`/restaurants/branches/${branch.id}`, {
          name: branch.name,
          address: branch.address,
          city: branch.city,
          phone: branch.phone,
          capacity: Number(branch.capacity)
        });
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setApiError(err.response?.data?.message || 'Failed to save settings. Requires Manager permissions.');
    } finally {
      setSaving(false);
    }
  };

  const renderBadge = (statusObj: any) => {
    const status = statusObj?.status || 'NOT_CONFIGURED';
    if (status === 'NOT_CONFIGURED') {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-500/20 text-zinc-400 border border-zinc-500/30">
          NOT_CONFIGURED
        </span>
      );
    }
    return (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Enterprise Organization Settings</h1>
          <p className="text-xs text-zinc-400 mt-1">Multi-Branch Setup, Tax Rules, Payment Gateways & Telemetry Adapters</p>
        </div>

        {isManager ? (
          <button
            onClick={handleSaveSettings}
            disabled={saving || loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Changes...' : 'Save Enterprise Settings'}</span>
          </button>
        ) : (
          <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            <span>Read-Only Mode (Manager Access Required)</span>
          </span>
        )}
      </div>

      {apiError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{apiError}</span>
          </div>
          <button
            onClick={loadSettings}
            className="px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-white font-medium flex items-center gap-1 text-[11px] transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Enterprise organization and branch configuration saved successfully!</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Enterprise Organization Card */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-400" />
              <h2 className="text-sm font-semibold text-white">Enterprise Organization Details</h2>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
              REST API
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-zinc-400 block mb-1">Enterprise Name</label>
              <input
                type="text"
                disabled={!isManager || loading}
                value={restaurant.name || ''}
                onChange={(e) => setRestaurant({ ...restaurant, name: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="text-zinc-400 block mb-1">Tax Registration Number</label>
              <input
                type="text"
                disabled={!isManager || loading}
                value={restaurant.taxRegistrationNumber || ''}
                onChange={(e) => setRestaurant({ ...restaurant, taxRegistrationNumber: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500 disabled:opacity-60"
              />
            </div>
          </div>
        </div>

        {/* Branch Details Card */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <h2 className="text-sm font-semibold text-white">Active Branch Settings</h2>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30">
              REST API
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-zinc-400 block mb-1">Branch Name</label>
              <input
                type="text"
                disabled={!isManager || loading}
                value={branch.name || ''}
                onChange={(e) => setBranch({ ...branch, name: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500 disabled:opacity-60"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-zinc-400 block mb-1">City / Location</label>
                <input
                  type="text"
                  disabled={!isManager || loading}
                  value={branch.city || ''}
                  onChange={(e) => setBranch({ ...branch, city: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Seating Capacity</label>
                <input
                  type="number"
                  disabled={!isManager || loading}
                  value={branch.capacity || 120}
                  onChange={(e) => setBranch({ ...branch, capacity: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500 disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label className="text-zinc-400 block mb-1">Address</label>
              <input
                type="text"
                disabled={!isManager || loading}
                value={branch.address || ''}
                onChange={(e) => setBranch({ ...branch, address: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500 disabled:opacity-60"
              />
            </div>
          </div>
        </div>
      </form>

      {/* External Integration Adapters Live Status */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-emerald-400" />
          <h2 className="text-sm font-semibold text-white">Integration Adapters & Gateway Services</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white">Stripe Payment Gateway</span>
              {renderBadge(adaptersStatus?.stripe)}
            </div>
            <p className="text-[11px] text-zinc-400">Processes credit card & Apple Pay checkout intents directly in POS checkout.</p>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white">QuickBooks ERP Sync</span>
              {renderBadge(adaptersStatus?.quickbooks)}
            </div>
            <p className="text-[11px] text-zinc-400">Automatically dispatches General Ledger entries upon order payment settlement.</p>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white">Uber Eats Delivery Sync</span>
              {renderBadge(adaptersStatus?.ubereats)}
            </div>
            <p className="text-[11px] text-zinc-400">Webhook ingest endpoint for incoming third-party food delivery orders.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
