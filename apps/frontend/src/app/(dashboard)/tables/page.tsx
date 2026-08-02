'use client';

import React from 'react';
import { Grid3X3, Users, Clock, CheckCircle, AlertCircle } from 'lucide-react';

const tablesList = [
  { id: '1', number: 'T-01', capacity: 2, status: 'OCCUPIED', guest: 'Jonathan Vance', elapsed: '45 mins' },
  { id: '2', number: 'T-02', capacity: 4, status: 'BILL_REQUESTED', guest: 'Victoria Secret Party', elapsed: '1 hr 10 mins' },
  { id: '3', number: 'T-03', capacity: 4, status: 'AVAILABLE', guest: '-', elapsed: '-' },
  { id: '4', number: 'T-04', capacity: 6, status: 'RESERVED', guest: 'Dr. Harrison Ford (7:30 PM)', elapsed: '-' },
  { id: '5', number: 'T-05', capacity: 2, status: 'OCCUPIED', guest: 'Emma Watson', elapsed: '20 mins' },
  { id: '6', number: 'T-06', capacity: 4, status: 'AVAILABLE', guest: '-', elapsed: '-' },
  { id: '7', number: 'T-07', capacity: 4, status: 'BUSSING', guest: 'Cleaning in progress', elapsed: '5 mins' },
  { id: '8', number: 'T-08', capacity: 8, status: 'AVAILABLE', guest: '-', elapsed: '-' }
];

export default function TablesPage() {
  const getBadgeStyle = (status: string) => {
    switch (status) {
      case 'OCCUPIED':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'BILL_REQUESTED':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'RESERVED':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'BUSSING':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Tables & Interactive Floor Plan Layout</h1>
        <p className="text-xs text-zinc-400 mt-1">Real-time table seating matrix for Downtown Fine Dining Branch</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {tablesList.map((tbl) => (
          <div
            key={tbl.id}
            className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-base font-extrabold text-white">{tbl.number}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getBadgeStyle(tbl.status)}`}>
                  {tbl.status}
                </span>
              </div>
              <p className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-zinc-400" />
                <span>Capacity: {tbl.capacity} Guests</span>
              </p>
              <p className="text-[11px] text-zinc-400 mt-1">{tbl.guest}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-zinc-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-zinc-500" />
                <span>{tbl.elapsed}</span>
              </span>
              <button className="text-blue-400 font-semibold hover:underline">Manage Seating</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
