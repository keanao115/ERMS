'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Calendar, Phone, Loader2, AlertCircle, RefreshCw, Plus, X, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import { api, getAuthUser } from '@/lib/api';

interface RestaurantTable {
  id: string;
  tableNumber: string;
  capacity: number;
}

interface Reservation {
  id: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  partySize: number;
  reservationTime: string;
  status: 'CONFIRMED' | 'CHECKED_IN' | 'CANCELLED' | 'NO_SHOW' | 'COMPLETED';
  table: RestaurantTable | null;
}

const POLL_INTERVAL_MS = 10000;

const STATUS_STYLE: Record<Reservation['status'], string> = {
  CONFIRMED: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  CHECKED_IN: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  CANCELLED: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
  NO_SHOW: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  COMPLETED: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
};

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');

  const [form, setForm] = useState({
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    partySize: '2',
    reservationTime: '',
    tableId: ''
  });

  const branchId = getAuthUser()?.branchId ?? null;

  const fetchData = useCallback(
    async (isBackground: boolean) => {
      if (!branchId) {
        setLoadError('No branchId bound to current user profile.');
        setLoading(false);
        return;
      }
      if (isBackground) setRefreshing(true);
      try {
        const [resRes, tableRes] = await Promise.all([
          api.get('/tables/reservations', { params: { branchId } }),
          api.get('/tables', { params: { branchId } })
        ]);
        setReservations(resRes.data);
        setTables(tableRes.data);
        setLoadError('');
      } catch (err: any) {
        setLoadError(
          err.response?.data?.message || 'Failed to connect to backend service.'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [branchId]
  );

  useEffect(() => {
    fetchData(false);
  }, [fetchData]);

  useEffect(() => {
    const timer = setInterval(() => fetchData(true), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [fetchData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!form.guestName || !form.guestPhone || !form.reservationTime || !form.partySize) {
      setFormError('Please fill in guest name, phone, party size, and reservation time.');
      return;
    }
    setCreating(true);
    try {
      await api.post('/tables/reservations', {
        branchId,
        tableId: form.tableId || undefined,
        guestName: form.guestName,
        guestEmail: form.guestEmail || 'guest@erms.local',
        guestPhone: form.guestPhone,
        partySize: parseInt(form.partySize, 10),
        reservationTime: new Date(form.reservationTime).toISOString()
      });
      setShowCreate(false);
      setForm({ guestName: '', guestEmail: '', guestPhone: '', partySize: '2', reservationTime: '', tableId: '' });
      await fetchData(true);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to create reservation.');
    } finally {
      setCreating(false);
    }
  };

  const updateStatus = async (res: Reservation, status: Reservation['status']) => {
    setBusyId(res.id);
    try {
      await api.patch(`/tables/reservations/${res.id}/status`, { status });
      await fetchData(true);
    } catch {
      // next refresh reconciles state
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (resId: string) => {
    setBusyId(resId);
    try {
      await api.delete(`/tables/reservations/${resId}`);
      await fetchData(true);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete reservation.');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-6rem)] flex items-center justify-center text-zinc-400 text-sm gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Loading reservation roster...</span>
      </div>
    );
  }

  if (loadError && reservations.length === 0) {
    return (
      <div className="h-[calc(100vh-6rem)] flex items-center justify-center">
        <div className="glass-panel p-6 rounded-2xl border border-rose-500/30 max-w-md text-center">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-3" />
          <p className="text-sm text-white font-semibold mb-1">Failed to load reservations</p>
          <p className="text-xs text-zinc-400">{loadError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Table Reservations & Booking Roster</h1>
          <p className="text-xs text-zinc-400 mt-1">Guest Profiles & Table Allocation Schedule</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchData(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white hover:border-white/20 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Reservation</span>
          </button>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-white/10">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-blue-400" />
          <h2 className="text-base font-semibold text-white">Dining Reservations</h2>
        </div>

        <div className="space-y-3">
          {reservations.map((res) => (
            <div key={res.id} className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">{res.guestName}</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_STYLE[res.status]}`}>
                    {res.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1 flex items-center gap-3 flex-wrap">
                  <span>Party of {res.partySize}</span>
                  <span>|</span>
                  <span>Table: {res.table ? res.table.tableNumber : 'Unassigned'}</span>
                  <span>|</span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-zinc-500" />
                    {res.guestPhone}
                  </span>
                </p>
              </div>

              <div className="text-right flex flex-col items-end gap-1.5">
                <p className="text-xs font-bold text-blue-400">
                  {new Date(res.reservationTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </p>

                {res.status === 'CONFIRMED' && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateStatus(res, 'CHECKED_IN')}
                      disabled={busyId === res.id}
                      className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 disabled:opacity-50 font-semibold"
                    >
                      {busyId === res.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                      Check In
                    </button>
                    <button
                      onClick={() => updateStatus(res, 'CANCELLED')}
                      disabled={busyId === res.id}
                      className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 disabled:opacity-50 font-semibold"
                    >
                      <XCircle className="w-3 h-3" />
                      Cancel
                    </button>
                  </div>
                )}

                {(res.status === 'CHECKED_IN' || res.status === 'CANCELLED' || res.status === 'COMPLETED' || res.status === 'NO_SHOW') && (
                  <button
                    onClick={() => handleDelete(res.id)}
                    disabled={busyId === res.id}
                    className="flex items-center gap-1 text-xs text-zinc-400 hover:text-rose-400 disabled:opacity-50 transition-colors"
                  >
                    {busyId === res.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    <span>Remove</span>
                  </button>
                )}
              </div>
            </div>
          ))}
          {reservations.length === 0 && (
            <p className="text-xs text-zinc-500 text-center py-10">No active dining reservations found</p>
          )}
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel rounded-2xl border border-white/10 max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white">New Reservation</h2>
              <button onClick={() => setShowCreate(false)} className="text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-[11px] text-zinc-400 font-medium">Guest Name</label>
                <input
                  value={form.guestName}
                  onChange={(e) => setForm({ ...form, guestName: e.target.value })}
                  className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50"
                  placeholder="Full name"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-zinc-400 font-medium">Phone</label>
                  <input
                    value={form.guestPhone}
                    onChange={(e) => setForm({ ...form, guestPhone: e.target.value })}
                    className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50"
                    placeholder="+1 555 0100"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-400 font-medium">Party Size</label>
                  <input
                    type="number"
                    min={1}
                    value={form.partySize}
                    onChange={(e) => setForm({ ...form, partySize: e.target.value })}
                    className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] text-zinc-400 font-medium">Email (optional)</label>
                <input
                  value={form.guestEmail}
                  onChange={(e) => setForm({ ...form, guestEmail: e.target.value })}
                  className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50"
                  placeholder="guest@email.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-zinc-400 font-medium">Date & Time</label>
                  <input
                    type="datetime-local"
                    value={form.reservationTime}
                    onChange={(e) => setForm({ ...form, reservationTime: e.target.value })}
                    className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-400 font-medium">Table (optional)</label>
                  <select
                    value={form.tableId}
                    onChange={(e) => setForm({ ...form, tableId: e.target.value })}
                    className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50"
                  >
                    <option value="" className="bg-zinc-900">
                      Unassigned
                    </option>
                    {tables.map((t) => (
                      <option key={t.id} value={t.id} className="bg-zinc-900">
                        {t.tableNumber} (seats {t.capacity})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {formError && <p className="text-xs text-rose-400">{formError}</p>}

              <button
                type="submit"
                disabled={creating}
                className="w-full mt-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all"
              >
                {creating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{creating ? 'Creating...' : 'Create Reservation'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
