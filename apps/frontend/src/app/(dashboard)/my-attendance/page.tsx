'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { api, getAuthUser } from '@/lib/api';
import { 
  Clock, 
  LogIn, 
  LogOut, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  Calendar, 
  UserCheck, 
  ShieldCheck, 
  TrendingUp, 
  ArrowLeft,
  DollarSign
} from 'lucide-react';

interface EmployeeMe {
  id: string;
  jobTitle: string;
  hourlyRate: number;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  shifts: Array<{
    id: string;
    startTime: string;
    endTime: string;
    roleName: string;
  }>;
  attendance: Array<{
    id: string;
    clockIn: string;
    clockOut: string | null;
    totalHours: number | null;
  }>;
}

export default function MyAttendancePage() {
  const [employee, setEmployee] = useState<EmployeeMe | null>(null);
  const [weeklyAttendance, setWeeklyAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [confirmMode, setConfirmMode] = useState<'NONE' | 'CLOCK_IN' | 'CLOCK_OUT'>('NONE');
  const [pendingTime, setPendingTime] = useState<Date | null>(null);
  const [busy, setBusy] = useState(false);

  const fetchMyAttendance = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/employees/me');
      if (res.data) {
        setEmployee(res.data);
        
        // Fetch detailed weekly history for this employee
        if (res.data.id) {
          const attRes = await api.get(`/employees/${res.data.id}/attendance`);
          setWeeklyAttendance(attRes.data?.attendance || []);
        }
      } else {
        setErrorMsg('No employee workforce record linked to current account.');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to load employee attendance details.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyAttendance();
  }, [fetchMyAttendance]);

  const latestAtt = employee?.attendance?.[0];
  const isClockedIn = !!latestAtt && !latestAtt.clockOut;

  // Initiate confirmation
  const initiateClockAction = (mode: 'CLOCK_IN' | 'CLOCK_OUT') => {
    setErrorMsg('');
    setSuccessMsg('');
    setPendingTime(new Date());
    setConfirmMode(mode);
  };

  // Confirm and execute actual timestamp clock-in/out
  const handleConfirmClock = async () => {
    if (!employee) return;
    setBusy(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (confirmMode === 'CLOCK_OUT') {
        await api.post(`/employees/${employee.id}/clock-out`);
        setSuccessMsg('Successfully clocked out of shift!');
      } else {
        await api.post(`/employees/${employee.id}/clock-in`);
        setSuccessMsg('Successfully clocked in for shift!');
      }

      await fetchMyAttendance();

      setTimeout(() => {
        setConfirmMode('NONE');
        setPendingTime(null);
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Shift attendance action failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleCancelConfirm = () => {
    setConfirmMode('NONE');
    setPendingTime(null);
    setErrorMsg('');
  };

  // Calculate total hours worked this week
  const totalWeeklyHours = weeklyAttendance.reduce((acc, curr) => acc + (curr.totalHours || 0), 0);
  const estimatedWeeklyEarnings = totalWeeklyHours * (employee?.hourlyRate || 0);

  if (loading) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center text-zinc-400 text-xs gap-3">
        <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
        <span>Loading My Shift Attendance & Weekly Log...</span>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="glass-panel p-8 rounded-3xl border border-white/10 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Workforce Profile Not Found</h2>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            Your logged-in user account ({getAuthUser()?.email}) is an administrative or non-branch account and is not registered as a branch employee.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">My Shift Attendance</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-semibold">
              Weekly Attendance & Check-In Log
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time shift check-in, check-out confirmation, and weekly timesheet history.
          </p>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-3">
          {isClockedIn ? (
            <div className="px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-2 text-xs font-bold shadow-lg shadow-emerald-500/10">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>ACTIVE SHIFT — CLOCKED IN</span>
            </div>
          ) : (
            <div className="px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center gap-2 text-xs font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span>OFF DUTY</span>
            </div>
          )}
        </div>
      </div>

      {/* Hero Control Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile & Punch Control Card */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-white/10 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                {employee.user?.firstName?.[0]}{employee.user?.lastName?.[0]}
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  {employee.user?.firstName} {employee.user?.lastName}
                </h2>
                <div className="flex items-center gap-2 mt-0.5 text-xs">
                  <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-400/30 font-semibold text-[10px]">
                    {employee.user?.role}
                  </span>
                  <span className="text-zinc-400 font-medium">{employee.jobTitle}</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-semibold">Hourly Rate</span>
              <span className="text-lg font-bold text-emerald-400">${employee.hourlyRate.toFixed(2)} / hr</span>
            </div>
          </div>

          {/* Action Trigger / Confirmation Area */}
          {confirmMode === 'NONE' ? (
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white">Perform Shift Punch Action</h3>
                  <p className="text-xs text-zinc-400">
                    Clicking will trigger a confirmation step with your exact real-time timestamp.
                  </p>
                </div>

                <button
                  onClick={() => initiateClockAction(isClockedIn ? 'CLOCK_OUT' : 'CLOCK_IN')}
                  className={`px-6 py-3 rounded-2xl font-bold text-xs shadow-xl flex items-center justify-center gap-2 transition-all ${
                    isClockedIn
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                  }`}
                >
                  {isClockedIn ? (
                    <>
                      <LogOut className="w-4 h-4" />
                      <span>Clock Out of Shift</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Clock In for Shift</span>
                    </>
                  )}
                </button>
              </div>

              {/* Explicit Check-In and Check-Out Time Display */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
                <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                  <span className="text-[10px] text-zinc-400 font-semibold uppercase block">Current Shift Check-In Time</span>
                  {latestAtt?.clockIn ? (
                    <div>
                      <p className="font-bold text-emerald-400 text-sm">
                        {new Date(latestAtt.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </p>
                      <p className="text-[10px] text-zinc-500">
                        {new Date(latestAtt.clockIn).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  ) : (
                    <p className="text-zinc-500 text-xs italic">Not Checked In Yet</p>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                  <span className="text-[10px] text-zinc-400 font-semibold uppercase block">Current Shift Check-Out Time</span>
                  {latestAtt?.clockOut ? (
                    <div>
                      <p className="font-bold text-zinc-300 text-sm">
                        {new Date(latestAtt.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </p>
                      <p className="text-[10px] text-zinc-500">
                        {new Date(latestAtt.clockOut).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  ) : isClockedIn ? (
                    <p className="text-blue-400 text-xs font-semibold">Active Shift in Progress</p>
                  ) : (
                    <p className="text-zinc-500 text-xs italic">No Active Shift</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Confirmation Step */
            <div className="p-5 rounded-2xl bg-blue-500/10 border border-blue-500/30 space-y-4 animate-fadeIn">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">
                  Confirm {confirmMode === 'CLOCK_IN' ? 'Shift Check-In' : 'Shift Check-Out'}
                </h3>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-400">Target Action:</p>
                  <p className="text-sm font-bold text-white">
                    {confirmMode === 'CLOCK_IN' ? 'Clock In for Shift' : 'Clock Out of Shift'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-zinc-400">Exact Actual Time:</p>
                  <p className="font-mono font-bold text-emerald-400 text-lg">
                    {pendingTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleConfirmClock}
                  disabled={busy}
                  className={`flex-1 py-3 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition-all shadow-lg ${
                    confirmMode === 'CLOCK_IN' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30' : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                  }`}
                >
                  {busy ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Confirm & Record Actual Time</span>
                </button>

                <button
                  onClick={handleCancelConfirm}
                  disabled={busy}
                  className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-300 text-xs font-semibold flex items-center gap-1 transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* Weekly Metrics Card */}
        <div className="glass-panel p-6 rounded-3xl border border-white/10 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <span>Weekly Shift Summary</span>
            </h3>

            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                <span className="text-xs text-zinc-400">Total Hours Worked</span>
                <span className="text-base font-bold text-blue-400">{totalWeeklyHours.toFixed(2)} hrs</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                <span className="text-xs text-zinc-400">Est. Weekly Gross Pay</span>
                <span className="text-base font-bold text-emerald-400">${estimatedWeeklyEarnings.toFixed(2)}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                <span className="text-xs text-zinc-400">Completed Sessions</span>
                <span className="text-base font-bold text-purple-300">
                  {weeklyAttendance.filter(a => a.clockOut).length} shifts
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-300 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-blue-400 shrink-0" />
            <span>Attendance records are synced to manager payroll audit logs.</span>
          </div>
        </div>
      </div>

      {/* Weekly Daily Check-In & Check-Out Table Breakdown */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-base font-bold text-white">Daily Check-In & Check-Out Times for the Week</h3>
            <p className="text-xs text-zinc-400">Detailed breakdown of check-in, check-out, and total hours worked per session.</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-300 text-xs font-semibold flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            <span>Active Pay Period</span>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-zinc-400 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Check-In Time</th>
                <th className="py-3 px-4">Check-Out Time</th>
                <th className="py-3 px-4">Hours Worked</th>
                <th className="py-3 px-4">Est. Session Pay</th>
                <th className="py-3 px-4">Shift Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {weeklyAttendance.map((att) => {
                const clockInDate = new Date(att.clockIn);
                const clockOutDate = att.clockOut ? new Date(att.clockOut) : null;
                const hours = att.totalHours || 0;
                const pay = hours * (employee.hourlyRate || 0);

                return (
                  <tr key={att.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {clockInDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-3.5 px-4 text-emerald-400 font-bold">
                      {clockInDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-300 font-bold">
                      {clockOutDate ? clockOutDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-blue-400">
                      {att.clockOut ? `${hours.toFixed(2)} hrs` : 'In Progress'}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-emerald-300">
                      {att.clockOut ? `$${pay.toFixed(2)}` : '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      {!att.clockOut ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                          ● ACTIVE SHIFT
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-zinc-500/20 text-zinc-400 border border-zinc-500/30 text-[10px] font-bold">
                          COMPLETED
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {weeklyAttendance.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-500">
                    No shift attendance records logged for the active week.
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
