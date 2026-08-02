'use client';

import React, { useState, useEffect } from 'react';
import { ChefHat, Clock, CheckCircle2, AlertCircle, Wifi, Flame } from 'lucide-react';
import { motion } from 'framer-motion';

interface KdsItem {
  id: string;
  orderNumber: string;
  tableNumber: string;
  itemName: string;
  quantity: number;
  station: string;
  notes?: string;
  status: 'QUEUED' | 'COOKING' | 'BUMPED';
  minutesElapsed: number;
}

const initialTickets: KdsItem[] = [
  { id: 'k-1', orderNumber: 'ORD-1001', tableNumber: 'T-01', itemName: 'A5 Miyazaki Wagyu Ribeye (8oz)', quantity: 1, station: 'GRILL', notes: 'Medium Rare, No Butter', status: 'COOKING', minutesElapsed: 12 },
  { id: 'k-2', orderNumber: 'ORD-1001', tableNumber: 'T-01', itemName: 'Black Truffle Risotto', quantity: 1, station: 'GRILL', status: 'COOKING', minutesElapsed: 12 },
  { id: 'k-3', orderNumber: 'ORD-1003', tableNumber: 'T-05', itemName: 'Yellowfin Tuna Tartare', quantity: 2, station: 'COLD_PREP', status: 'QUEUED', minutesElapsed: 4 },
  { id: 'k-4', orderNumber: 'ORD-1004', tableNumber: 'T-02', itemName: 'Smoked Bourbon Old Fashioned', quantity: 3, station: 'BAR', status: 'QUEUED', minutesElapsed: 2 }
];

export default function KdsPage() {
  const [stationFilter, setStationFilter] = useState('ALL');
  const [tickets, setTickets] = useState<KdsItem[]>(initialTickets);
  const [isConnected, setIsConnected] = useState(true);

  // Increment timer every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setTickets((prev) =>
        prev.map((t) => ({ ...t, minutesElapsed: t.minutesElapsed + 1 }))
      );
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const handleBump = (ticketId: string) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          if (t.status === 'QUEUED') return { ...t, status: 'COOKING' };
          if (t.status === 'COOKING') return { ...t, status: 'BUMPED' };
        }
        return t;
      })
    );
  };

  const filteredTickets = tickets.filter(
    (t) => stationFilter === 'ALL' || t.station === stationFilter
  );

  const getTimerBadge = (minutes: number) => {
    if (minutes > 15) {
      return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
    }
    if (minutes > 10) {
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    }
    return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto select-none">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Kitchen Display System (KDS)</h1>
            <p className="text-xs text-zinc-400">Live Station Dispatch & Cooking Queue Matrix</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Station Filters */}
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl p-1 text-xs">
            {['ALL', 'GRILL', 'COLD_PREP', 'BAR'].map((st) => (
              <button
                key={st}
                onClick={() => setStationFilter(st)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                  stationFilter === st
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* WS Connection Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <Wifi className="w-3.5 h-3.5" />
            <span>WS Active (50ms)</span>
          </div>
        </div>
      </div>

      {/* Columns Grid: QUEUED vs COOKING vs BUMPED */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* QUEUED Column */}
        <div className="glass-panel p-4 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
            <h2 className="text-xs font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Queued Orders ({filteredTickets.filter((t) => t.status === 'QUEUED').length})</span>
            </h2>
          </div>

          <div className="space-y-4">
            {filteredTickets
              .filter((t) => t.status === 'QUEUED')
              .map((ticket) => (
                <motion.div
                  key={ticket.id}
                  layout
                  className="glass-panel p-4 rounded-xl border border-white/10 flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-extrabold text-blue-400">{ticket.orderNumber}</span>
                      <h3 className="text-sm font-bold text-white">Table {ticket.tableNumber}</h3>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getTimerBadge(ticket.minutesElapsed)}`}>
                      {ticket.minutesElapsed} mins
                    </span>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-white">
                      {ticket.quantity}x {ticket.itemName}
                    </p>
                    {ticket.notes && <p className="text-[10px] text-amber-300 mt-1 italic">Note: {ticket.notes}</p>}
                  </div>

                  <button
                    onClick={() => handleBump(ticket.id)}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-lg transition-all"
                  >
                    Start Prep →
                  </button>
                </motion.div>
              ))}
          </div>
        </div>

        {/* COOKING Column */}
        <div className="glass-panel p-4 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
            <h2 className="text-xs font-extrabold text-blue-400 uppercase tracking-wider flex items-center gap-2">
              <Flame className="w-4 h-4" />
              <span>In Preparation ({filteredTickets.filter((t) => t.status === 'COOKING').length})</span>
            </h2>
          </div>

          <div className="space-y-4">
            {filteredTickets
              .filter((t) => t.status === 'COOKING')
              .map((ticket) => (
                <motion.div
                  key={ticket.id}
                  layout
                  className="glass-panel p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-extrabold text-blue-400">{ticket.orderNumber}</span>
                      <h3 className="text-sm font-bold text-white">Table {ticket.tableNumber}</h3>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getTimerBadge(ticket.minutesElapsed)}`}>
                      {ticket.minutesElapsed} mins
                    </span>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-white">
                      {ticket.quantity}x {ticket.itemName}
                    </p>
                    {ticket.notes && <p className="text-[10px] text-amber-300 mt-1 italic">Note: {ticket.notes}</p>}
                  </div>

                  <button
                    onClick={() => handleBump(ticket.id)}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition-all"
                  >
                    Bump Ticket to Pass ✓
                  </button>
                </motion.div>
              ))}
          </div>
        </div>

        {/* BUMPED / PASSED Column */}
        <div className="glass-panel p-4 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
            <h2 className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Completed / Expediter Pass ({filteredTickets.filter((t) => t.status === 'BUMPED').length})</span>
            </h2>
          </div>

          <div className="space-y-4">
            {filteredTickets
              .filter((t) => t.status === 'BUMPED')
              .map((ticket) => (
                <motion.div
                  key={ticket.id}
                  layout
                  className="glass-panel p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 opacity-80"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-[10px] font-extrabold text-emerald-400">{ticket.orderNumber}</span>
                    <span className="text-[10px] font-bold text-emerald-300">Ready for Server</span>
                  </div>
                  <p className="text-xs font-semibold text-white">
                    {ticket.quantity}x {ticket.itemName} (Table {ticket.tableNumber})
                  </p>
                </motion.div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
