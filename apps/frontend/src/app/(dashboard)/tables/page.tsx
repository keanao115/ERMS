'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Users, Clock, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import { api, getAuthUser } from '@/lib/api';

type TableStatus = 'AVAILABLE' | 'RESERVED' | 'OCCUPIED' | 'BILL_REQUESTED' | 'BUSSING' | 'OUT_OF_SERVICE';

interface RestaurantTable {
  id: string;
  tableNumber: string;
  capacity: number;
  status: TableStatus;
  updatedAt: string;
}

const ALL_STATUSES: TableStatus[] = ['AVAILABLE', 'RESERVED', 'OCCUPIED', 'BILL_REQUESTED', 'BUSSING', 'OUT_OF_SERVICE'];
const POLL_INTERVAL_MS = 8000;

export default function TablesPage() {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState('');
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  const branchId = getAuthUser()?.branchId ?? null;

  const fetchTables = useCallback(
    async (isBackground: boolean) => {
      if (!branchId) {
        setLoadError('No branchId bound to current user profile.');
        setLoading(false);
        return;
      }
      if (isBackground) setRefreshing(true);
      try {
        const res = await api.get('/tables', { params: { branchId } });
        setTables(res.data);
        setLastSynced(new Date());
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
    fetchTables(false);
  }, [fetchTables]);

  useEffect(() => {
    const timer = setInterval(() => fetchTables(true), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [fetchTables]);

  const handleStatusChange = async (tableId: string, newStatus: TableStatus) => {
    setUpdatingId(tableId);
    try {
      await api.patch(`/tables/${tableId}/status`, { status: newStatus });
      setTables((prev) =>
        prev.map((t) => (t.id === tableId ? { ...t, status: newStatus, updatedAt: new Date().toISOString() } : t))
      );
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update table status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const getBadgeStyle = (status: TableStatus) => {
    switch (status) {
      case 'OCCUPIED':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'BILL_REQUESTED':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'RESERVED':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'BUSSING':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'OUT_OF_SERVICE':
        return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    }
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-6rem)] flex items-center justify-center text-zinc-400 text-sm gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Loading floor plan table layout...</span>
      </div>
    );
  }

  if (loadError && tables.length === 0) {
    return (
      <div className="h-[calc(100vh-6rem)] flex items-center justify-center">
        <div className="glass-panel p-6 rounded-2xl border border-rose-500/30 max-w-md text-center">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-3" />
          <p className="text-sm text-white font-semibold mb-1">Failed to load table floor plan</p>
          <p className="text-xs text-zinc-400">{loadError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Tables & Interactive Floor Plan Layout</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Real-Time Floor Plan Matrix — Select Table Status to Update Live Floor State
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastSynced && (
            <span className="text-[11px] text-zinc-500">
              Last synced {lastSynced.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={() => fetchTables(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white hover:border-white/20 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {tables.map((tbl) => (
          <div
            key={tbl.id}
            className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-base font-extrabold text-white">{tbl.tableNumber}</span>
                <div className="relative">
                  {updatingId === tbl.id ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Updating...
                    </span>
                  ) : (
                    <select
                      value={tbl.status}
                      onChange={(e) => handleStatusChange(tbl.id, e.target.value as TableStatus)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none ${getBadgeStyle(tbl.status)}`}
                    >
                      {ALL_STATUSES.map((st) => (
                        <option key={st} value={st} className="bg-zinc-900 text-white font-sans">
                          {st.replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
              <p className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-zinc-400" />
                <span>Capacity: {tbl.capacity} Guests</span>
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-zinc-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-zinc-500" />
                <span>Updated {new Date(tbl.updatedAt).toLocaleTimeString()}</span>
              </span>
            </div>
          </div>
        ))}
        {tables.length === 0 && (
          <p className="text-xs text-zinc-500 col-span-full text-center py-10">
            No table data found for this branch.
          </p>
        )}
      </div>
    </div>
  );
}
