'use client';

import React from 'react';
import { Calendar, Users, Clock, CheckCircle2, Phone, Mail } from 'lucide-react';

const reservations = [
  { id: 'res-1', guestName: 'Dr. Harrison Ford', time: '7:30 PM Today', party: 6, table: 'T-04', phone: '+1 (212) 555-8899', status: 'CONFIRMED' },
  { id: 'res-2', guestName: 'Victoria Secret Party', time: '8:00 PM Today', party: 4, table: 'T-02', phone: '+1 (212) 555-4422', status: 'CHECKED_IN' },
  { id: 'res-3', guestName: 'Ambassador Robert Sterling', time: '9:00 PM Tomorrow', party: 8, table: 'T-08', phone: '+1 (212) 555-9001', status: 'CONFIRMED' }
];

export default function ReservationsPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Table Reservations & Booking Roster</h1>
        <p className="text-xs text-zinc-400 mt-1">Guest Profiles & Table Allocation Schedule</p>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-white/10">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-blue-400" />
          <h2 className="text-base font-semibold text-white">Upcoming Dining Reservations</h2>
        </div>

        <div className="space-y-3">
          {reservations.map((res) => (
            <div key={res.id} className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">{res.guestName}</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {res.status}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1 flex items-center gap-3">
                  <span>Party of {res.party}</span>
                  <span>|</span>
                  <span>Assigned Table: {res.table}</span>
                  <span>|</span>
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-zinc-500" />{res.phone}</span>
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs font-bold text-blue-400">{res.time}</p>
                <button className="mt-1 text-xs text-zinc-400 hover:text-white underline">Check In Guest</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
