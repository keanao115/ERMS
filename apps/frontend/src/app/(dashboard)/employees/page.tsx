'use client';

import React from 'react';
import { Users, Clock, DollarSign, ShieldCheck } from 'lucide-react';

const staffList = [
  { name: 'Sophia Chen', role: 'STORE_MANAGER', rate: '$38.00 / hr', shift: 'Morning (8:00 AM - 4:00 PM)', status: 'ACTIVE' },
  { name: 'Lucas Dupont', role: 'WAITER', rate: '$24.50 / hr', shift: 'Evening (4:00 PM - 12:00 AM)', status: 'CLOCKED_IN' },
  { name: 'Gordon Ramsay', role: 'KITCHEN_STAFF', rate: '$45.00 / hr', shift: 'Evening (4:00 PM - 12:00 AM)', status: 'CLOCKED_IN' },
  { name: 'David Miller', role: 'CASHIER', rate: '$22.00 / hr', shift: 'Morning (8:00 AM - 4:00 PM)', status: 'OFF_DUTY' }
];

export default function EmployeesPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Workforce & Shift Scheduler</h1>
        <p className="text-xs text-zinc-400 mt-1">Staff Roster, Timecard Attendance, and Wage Calculations</p>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-white/10">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-blue-400" />
          <h2 className="text-base font-semibold text-white">Active Staff Directory</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-zinc-400 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Employee Name</th>
                <th className="py-3 px-4">Role Key</th>
                <th className="py-3 px-4">Hourly Wage</th>
                <th className="py-3 px-4">Assigned Shift</th>
                <th className="py-3 px-4">Attendance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {staffList.map((emp) => (
                <tr key={emp.name} className="hover:bg-white/5 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-white">{emp.name}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-bold">
                      {emp.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-emerald-400">{emp.rate}</td>
                  <td className="py-3.5 px-4 text-zinc-300">{emp.shift}</td>
                  <td className="py-3.5 px-4">
                    {emp.status === 'CLOCKED_IN' ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                        ● CLOCKED IN
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-zinc-500/20 text-zinc-400 border border-zinc-500/30 text-[10px] font-bold">
                        OFF DUTY
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
