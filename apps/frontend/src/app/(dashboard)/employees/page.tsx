'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, Loader2, AlertCircle, RefreshCw, LogIn, LogOut, DollarSign, CheckCircle2, Calculator, Clock, Calendar, Edit2, Save, X, Lock } from 'lucide-react';
import { api, getAuthUser } from '@/lib/api';

interface Attendance {
  id: string;
  clockIn: string;
  clockOut: string | null;
  totalHours: number | null;
}

interface Shift {
  id: string;
  shiftType: string;
  startTime: string;
  endTime: string;
}

interface Employee {
  id: string;
  jobTitle: string;
  hourlyRate: number;
  user: { name: string; role?: string };
  shifts: Shift[];
  attendance: Attendance[];
}

interface PayrollRecord {
  id: string;
  employeeId: string;
  totalHours: number;
  grossPay: number;
  taxDeductions: number;
  netPay: number;
  isPaid: boolean;
  paidAt: string | null;
  createdAt: string;
  employee?: { user?: { name?: string }; jobTitle?: string };
}

interface WeeklySummary {
  weekStart: string;
  weekEnd: string;
  totalHours: number;
  sessionCount: number;
}

interface AttendanceDetails {
  employee: { id: string; name: string; jobTitle: string; hourlyRate: number };
  attendance: Attendance[];
  weeklySummary: WeeklySummary[];
}

function formatDatetimeLocal(isoStr: string | null) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  const pad = (n: number) => (n < 10 ? '0' + n : n);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const POLL_INTERVAL_MS = 10000;

import { useLocale } from '@/contexts/LocaleContext';

export default function EmployeesPage() {
  const { t } = useLocale();
  const [activeTab, setActiveTab] = useState<'roster' | 'payroll' | 'timesheet'>('roster');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  const [attendanceData, setAttendanceData] = useState<AttendanceDetails | null>(null);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  // Attendance Edit State (STORE_MANAGER only)
  const [editingAttId, setEditingAttId] = useState<string | null>(null);
  const [editClockIn, setEditClockIn] = useState<string>('');
  const [editClockOut, setEditClockOut] = useState<string>('');
  const [savingAttId, setSavingAttId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  const currentUser = getAuthUser();
  const branchId = currentUser?.branchId ?? null;
  const userRole = currentUser?.role;

  // Manager/Admin privileges check (STORE_MANAGER, SUPER_ADMIN, RESTAURANT_OWNER)
  const isStoreManager = userRole === 'STORE_MANAGER' || userRole === 'SUPER_ADMIN' || userRole === 'RESTAURANT_OWNER' || userRole === 'REGIONAL_MANAGER';


  const fetchEmployees = useCallback(
    async (isBackground: boolean) => {
      if (!branchId) {
        setLoadError('No branchId bound to current logged in account.');
        setLoading(false);
        return;
      }
      if (isBackground) setRefreshing(true);
      try {
        const res = await api.get('/employees', { params: { branchId } });
        setEmployees(res.data);
        if (res.data.length > 0 && !selectedEmpId) {
          setSelectedEmpId(res.data[0].id);
        }
        setLoadError('');
      } catch (err: any) {
        setLoadError(
          err.response?.data?.message || 'Failed to connect to backend service (http://localhost:4000).'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [branchId, selectedEmpId]
  );

  const fetchPayrollHistory = async (empId: string) => {
    try {
      const res = await api.get(`/payroll/employees/${empId}`);
      setPayrolls(res.data);
    } catch (err) {
      console.error('Error loading payroll history:', err);
    }
  };

  const fetchEmployeeAttendance = async (empId: string) => {
    setLoadingAttendance(true);
    try {
      const res = await api.get(`/employees/${empId}/attendance`);
      setAttendanceData(res.data);
    } catch (err) {
      console.error('Error loading employee attendance:', err);
    } finally {
      setLoadingAttendance(false);
    }
  };

  useEffect(() => {
    fetchEmployees(false);
  }, [fetchEmployees]);

  useEffect(() => {
    const timer = setInterval(() => fetchEmployees(true), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [fetchEmployees]);

  useEffect(() => {
    if (activeTab === 'payroll' && employees.length > 0) {
      fetchPayrollHistory(selectedEmpId || employees[0].id);
    } else if (activeTab === 'timesheet' && selectedEmpId) {
      fetchEmployeeAttendance(selectedEmpId);
    }
  }, [activeTab, selectedEmpId, employees]);

  const isClockedIn = (emp: Employee) => {
    const latest = emp.attendance[0];
    return !!latest && !latest.clockOut;
  };

  const handleClockToggle = async (emp: Employee) => {
    setBusyId(emp.id);
    setActionError('');
    try {
      if (isClockedIn(emp)) {
        await api.post(`/employees/${emp.id}/clock-out`);
      } else {
        await api.post(`/employees/${emp.id}/clock-in`);
      }
      await fetchEmployees(true);
      if (selectedEmpId === emp.id && activeTab === 'timesheet') {
        await fetchEmployeeAttendance(emp.id);
      }
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Action failed.');
    } finally {
      setBusyId(null);
    }
  };

  const startEditAttendance = (att: Attendance) => {
    setEditingAttId(att.id);
    setEditClockIn(formatDatetimeLocal(att.clockIn));
    setEditClockOut(att.clockOut ? formatDatetimeLocal(att.clockOut) : '');
  };

  const cancelEditAttendance = () => {
    setEditingAttId(null);
    setEditClockIn('');
    setEditClockOut('');
  };

  const saveEditAttendance = async (attId: string) => {
    setSavingAttId(attId);
    setActionError('');
    try {
      await api.patch(`/employees/attendance/${attId}`, {
        clockIn: editClockIn ? new Date(editClockIn).toISOString() : undefined,
        clockOut: editClockOut ? new Date(editClockOut).toISOString() : null
      });
      setEditingAttId(null);
      if (selectedEmpId) {
        await fetchEmployeeAttendance(selectedEmpId);
      }
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to update attendance record.');
    } finally {
      setSavingAttId(null);
    }
  };

  const handleCalculatePayroll = async (empId: string) => {
    setBusyId(empId);
    setActionError('');
    try {
      await api.post(`/payroll/employees/${empId}`, { taxRatePercentage: 15.0 });
      await fetchPayrollHistory(empId);
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to calculate payroll.');
    } finally {
      setBusyId(null);
    }
  };

  const handleMarkPaid = async (payrollId: string, empId: string) => {
    setBusyId(payrollId);
    try {
      await api.patch(`/payroll/${payrollId}/mark-paid`);
      await fetchPayrollHistory(empId);
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to mark as paid.');
    } finally {
      setBusyId(null);
    }
  };

  const formatShift = (shift?: Shift) => {
    if (!shift) return 'No shift scheduled';
    const start = new Date(shift.startTime);
    const end = new Date(shift.endTime);
    return `${shift.shiftType} (${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })})`;
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-6rem)] flex items-center justify-center text-zinc-400 text-sm gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>{t.common.loading}</span>
      </div>
    );
  }

  if (loadError && employees.length === 0) {
    return (
      <div className="h-[calc(100vh-6rem)] flex items-center justify-center">
        <div className="glass-panel p-6 rounded-2xl border border-rose-500/30 max-w-md text-center">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-3" />
          <p className="text-sm text-white font-semibold mb-1">{t.common.error}</p>
          <p className="text-xs text-zinc-400">{loadError}</p>
        </div>
      </div>
    );
  }

  if (!isStoreManager) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pt-6">
        <div className="glass-panel p-8 rounded-3xl border border-amber-500/30 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white">{t.accessPanel.title}</h2>
          <p className="text-sm text-zinc-300 font-medium">
            {t.accessPanel.employees.message}
          </p>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            {t.accessPanel.employees.sub}
          </p>
          <div className="pt-2">
            <Link href="/my-attendance">
              <button className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-lg shadow-blue-600/30 inline-flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{t.common.goToMyShiftAttendance}</span>
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const selectedEmployeeObj = employees.find((e) => e.id === selectedEmpId);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{t.employees.title}</h1>
          <p className="text-xs text-zinc-400 mt-1">{t.employees.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
            <button
              onClick={() => setActiveTab('roster')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'roster' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {t.employees.tabs.roster}
            </button>
            <button
              onClick={() => setActiveTab('timesheet')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'timesheet' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {t.employees.tabs.timesheet}
            </button>
            <button
              onClick={() => setActiveTab('payroll')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'payroll' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {t.employees.tabs.payroll}
            </button>
          </div>

          <button
            onClick={() => fetchEmployees(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white hover:border-white/20 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{t.common.refresh}</span>
          </button>
        </div>
      </div>

      {actionError && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">{actionError}</div>
      )}

      {/* Active Staff Directory Tab */}
      {activeTab === 'roster' && (
        <div className="glass-panel p-6 rounded-2xl border border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-semibold text-white">{t.employees.tabs.roster}</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-zinc-400 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">{t.employees.employeeName}</th>
                  <th className="py-3 px-4">{t.employees.jobTitle}</th>
                  <th className="py-3 px-4">{t.employees.hourlyWage}</th>
                  <th className="py-3 px-4">{t.employees.shiftsCompleted}</th>
                  <th className="py-3 px-4">{t.employees.attendanceHistory}</th>
                  <th className="py-3 px-4">{t.employees.latestCheckInOut || 'Latest Check-In / Out'}</th>
                  <th className="py-3 px-4">{t.common.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {employees.map((emp) => {
                  const clockedIn = isClockedIn(emp);
                  const latestAtt = emp.attendance[0];
                  return (
                    <tr key={emp.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-white">{emp.user?.name}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {emp.user?.role && (
                            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 text-[10px] font-bold tracking-wide">
                              {(t.employees.roles as any)[emp.user.role] || emp.user.role}
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-semibold">
                            {emp.jobTitle}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-400">${emp.hourlyRate.toFixed(2)} / hr</td>
                      <td className="py-3.5 px-4 text-zinc-300">{formatShift(emp.shifts[0])}</td>
                      <td className="py-3.5 px-4">
                        {clockedIn ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                            {t.employees.clockedIn}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-zinc-500/20 text-zinc-400 border border-zinc-500/30 text-[10px] font-bold">
                            {t.employees.offDuty}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        {latestAtt ? (
                          <div className="space-y-0.5">
                            <div className="text-emerald-400 font-medium text-[11px]">
                              In: {new Date(latestAtt.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="text-zinc-400 font-medium text-[11px]">
                              Out: {latestAtt.clockOut ? new Date(latestAtt.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '— (Active)'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-zinc-500 italic text-[11px]">{t.common.none}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleClockToggle(emp)}
                          disabled={busyId === emp.id}
                          className={`flex items-center gap-1 text-[11px] font-semibold transition-colors disabled:opacity-50 ${
                            clockedIn ? 'text-rose-400 hover:text-rose-300' : 'text-emerald-400 hover:text-emerald-300'
                          }`}
                        >
                          {busyId === emp.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : clockedIn ? (
                            <LogOut className="w-3.5 h-3.5" />
                          ) : (
                            <LogIn className="w-3.5 h-3.5" />
                          )}
                          <span>{clockedIn ? t.employees.clockOut : t.employees.clockIn}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Timesheet & Weekly Totals Tab */}
      {activeTab === 'timesheet' && (
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-white/10 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-blue-400" />
              <div>
                <h2 className="text-base font-semibold text-white">{t.employeesDetail.timesheetSectionTitle}</h2>
                <p className="text-xs text-zinc-400">
                  {t.employees.subtitle}
                  {!isStoreManager && ` ${t.employeesDetail.timesheetReadOnly}`}
                </p>
              </div>
            </div>

            {/* Employee Picker */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-zinc-400 font-medium">{t.employeesDetail.timesheetSelectLabel}</label>
              <select
                value={selectedEmpId}
                onChange={(e) => setSelectedEmpId(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500/50"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id} className="bg-zinc-900">
                    {emp.user?.name} — {emp.jobTitle}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loadingAttendance ? (
            <div className="p-12 glass-panel rounded-2xl border border-white/10 text-center text-zinc-400 text-xs flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
              <span>{t.employeesDetail.timesheetLoading}</span>
            </div>
          ) : attendanceData ? (
            <div className="space-y-6">
              {/* Weekly Summary Cards */}
              <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-sm font-bold text-white">
                      {t.employeesDetail.weeklySummaryFor.replace('{name}', attendanceData.employee.name)}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-bold">
                      {attendanceData.employee.jobTitle}
                    </span>
                  </div>
                  <span className="text-xs text-zinc-400 font-semibold">
                    {t.employeesDetail.baseWage.replace('{x}', attendanceData.employee.hourlyRate.toFixed(2))}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-zinc-400 uppercase tracking-wider text-[10px]">
                        <th className="py-2.5 px-4">{t.employeesDetail.colEmployee}</th>
                        <th className="py-2.5 px-4">{t.employeesDetail.colWeekRange}</th>
                        <th className="py-2.5 px-4 text-center">{t.employeesDetail.colSessions}</th>
                        <th className="py-2.5 px-4 text-right">{t.employeesDetail.colTotalHours}</th>
                        <th className="py-2.5 px-4 text-right">{t.employeesDetail.colEstPay}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {attendanceData.weeklySummary.map((w, idx) => (
                        <tr key={idx} className="hover:bg-white/5 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-white">{attendanceData.employee.name}</div>
                            <div className="text-[10px] text-zinc-400">{attendanceData.employee.jobTitle}</div>
                          </td>
                          <td className="py-3 px-4 font-bold text-white">
                            {w.weekStart} &nbsp;~&nbsp; {w.weekEnd}
                          </td>
                          <td className="py-3 px-4 text-center text-zinc-300">
                            {t.employeesDetail.shiftsUnit.replace('{x}', String(w.sessionCount))}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-blue-400">{w.totalHours.toFixed(2)} hrs</td>
                          <td className="py-3 px-4 text-right font-extrabold text-emerald-400">
                            ${(w.totalHours * attendanceData.employee.hourlyRate).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                      {attendanceData.weeklySummary.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-zinc-500">
                            {t.employeesDetail.noAttendance}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Daily Attendance History */}
              <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">
                      {t.employeesDetail.dailyLogFor.replace('{name}', attendanceData.employee.name)}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-bold">
                      {attendanceData.employee.jobTitle}
                    </span>
                  </div>
                  {isStoreManager && (
                    <span className="text-[11px] text-blue-400 font-semibold">
                      {t.employeesDetail.managerPrivilegeBadge}
                    </span>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-zinc-400 uppercase tracking-wider text-[10px]">
                        <th className="py-2.5 px-4">{t.employeesDetail.colEmployee}</th>
                        <th className="py-2.5 px-4">{t.employeesDetail.colDate}</th>
                        <th className="py-2.5 px-4">{t.employeesDetail.colClockIn}</th>
                        <th className="py-2.5 px-4">{t.employeesDetail.colClockOut}</th>
                        <th className="py-2.5 px-4">{t.employeesDetail.colHoursWorked}</th>
                        <th className="py-2.5 px-4">{t.employeesDetail.colShiftStatus}</th>
                        {isStoreManager && <th className="py-2.5 px-4 text-right">{t.employeesDetail.colActions}</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {attendanceData.attendance.map((att) => {
                        const clockInDate = new Date(att.clockIn);
                        const clockOutDate = att.clockOut ? new Date(att.clockOut) : null;
                        const isOpen = !att.clockOut;
                        const isEditing = editingAttId === att.id;

                        if (isEditing) {
                          return (
                            <tr key={att.id} className="bg-blue-500/10 border-l-2 border-blue-500">
                              <td className="py-3 px-4">
                                <div className="font-bold text-white">{attendanceData.employee.name}</div>
                                <div className="text-[10px] text-zinc-400">{attendanceData.employee.jobTitle}</div>
                              </td>
                              <td className="py-3 px-4 font-semibold text-white">
                                {clockInDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                              </td>
                              <td className="py-3 px-4">
                                <input
                                  type="datetime-local"
                                  value={editClockIn}
                                  onChange={(e) => setEditClockIn(e.target.value)}
                                  className="bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-400"
                                />
                              </td>
                              <td className="py-3 px-4">
                                <input
                                  type="datetime-local"
                                  value={editClockOut}
                                  onChange={(e) => setEditClockOut(e.target.value)}
                                  className="bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-400"
                                />
                              </td>
                              <td className="py-3 px-4 text-zinc-400">{t.employeesDetail.recalculating}</td>
                              <td className="py-3 px-4">
                                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold">
                                  {t.employeesDetail.badgeEditing}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => saveEditAttendance(att.id)}
                                    disabled={savingAttId === att.id}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold flex items-center gap-1 transition-all disabled:opacity-50"
                                  >
                                    {savingAttId === att.id ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Save className="w-3 h-3" />
                                    )}
                                    {t.employeesDetail.btnSave}
                                  </button>
                                  <button
                                    onClick={cancelEditAttendance}
                                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-300 text-[11px] font-semibold flex items-center gap-1 transition-all"
                                  >
                                    <X className="w-3 h-3" />
                                    {t.employeesDetail.btnCancel}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        }

                        return (
                          <tr key={att.id} className="hover:bg-white/5 transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-bold text-white">{attendanceData.employee.name}</div>
                              <div className="text-[10px] text-zinc-400">{attendanceData.employee.jobTitle}</div>
                            </td>
                            <td className="py-3 px-4 font-semibold text-white">
                              {clockInDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>
                            <td className="py-3 px-4 text-emerald-400 font-medium">
                              {clockInDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </td>
                            <td className="py-3 px-4 text-zinc-300 font-medium">
                              {clockOutDate ? clockOutDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
                            </td>
                            <td className="py-3 px-4 font-bold text-blue-400">
                              {att.totalHours != null ? `${att.totalHours.toFixed(2)} hrs` : 'In Progress'}
                            </td>
                            <td className="py-3 px-4">
                              {isOpen ? (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                                  {t.employeesDetail.badgeActive}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-zinc-500/20 text-zinc-400 border border-zinc-500/30 text-[10px] font-bold">
                                  {t.employeesDetail.badgeCompleted}
                                </span>
                              )}
                            </td>
                            {isStoreManager && (
                              <td className="py-3 px-4 text-right">
                                <button
                                  onClick={() => startEditAttendance(att)}
                                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 ml-auto"
                                >
                                  <Edit2 className="w-3 h-3" />
                                  {t.employeesDetail.btnEditTime}
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                      {attendanceData.attendance.length === 0 && (
                        <tr>
                          <td colSpan={isStoreManager ? 7 : 6} className="py-6 text-center text-zinc-500">
                            {t.employeesDetail.noClockInHistory}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Payroll Tab */}
      {activeTab === 'payroll' && (
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <h2 className="text-base font-semibold text-white">{t.employeesDetail.payrollTitle}</h2>
              </div>
              <span className="text-xs text-zinc-400">{t.employeesDetail.payrollFormula}</span>
            </div>

            {/* Display Cards for employees */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {employees.map((emp) => (
                <div key={emp.id} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white text-xs">{emp.user?.name}</p>
                      <p className="text-[11px] text-zinc-400">{emp.jobTitle}</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-400">${emp.hourlyRate}/hr</span>
                  </div>

                  {isStoreManager ? (
                    <button
                      onClick={() => handleCalculatePayroll(emp.id)}
                      disabled={busyId === emp.id}
                      className="w-full py-2 bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/30 rounded-lg text-blue-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Calculator className="w-3.5 h-3.5" />
                      <span>{busyId === emp.id ? t.employeesDetail.btnRunPayrollLoading : t.employeesDetail.btnRunPayroll}</span>
                    </button>
                  ) : (
                    <p className="text-[11px] text-zinc-500 italic text-center py-1 bg-white/5 rounded-lg border border-white/5">
                      {t.employeesDetail.payrollPrivilegeNote}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">{t.employeesDetail.payrollHistoryTitle}</h3>
              {!isStoreManager && (
                <span className="text-[11px] text-zinc-400">
                  {t.employeesDetail.payrollReadOnlyNote}
                </span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-zinc-400 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">{t.employeesDetail.colEmployee2}</th>
                    <th className="py-3 px-4">{t.employeesDetail.colTotalHours2}</th>
                    <th className="py-3 px-4">{t.employeesDetail.colGrossPay}</th>
                    <th className="py-3 px-4">{t.employeesDetail.colTaxDed}</th>
                    <th className="py-3 px-4">{t.employeesDetail.colNetPay}</th>
                    <th className="py-3 px-4">{t.employeesDetail.colStatus}</th>
                    {isStoreManager && <th className="py-3 px-4"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {payrolls.map((p) => (
                    <tr key={p.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-white">{p.employee?.user?.name || 'Employee'}</td>
                      <td className="py-3.5 px-4 text-zinc-300">{p.totalHours} hrs</td>
                      <td className="py-3.5 px-4 font-bold text-white">${p.grossPay.toFixed(2)}</td>
                      <td className="py-3.5 px-4 text-rose-400">-${p.taxDeductions.toFixed(2)}</td>
                      <td className="py-3.5 px-4 font-bold text-emerald-400">${p.netPay.toFixed(2)}</td>
                      <td className="py-3.5 px-4">
                        {p.isPaid ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{t.employeesDetail.badgePaid}</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                            {t.employeesDetail.badgePending}
                          </span>
                        )}
                      </td>
                      {isStoreManager && (
                        <td className="py-3.5 px-4">
                          {!p.isPaid && (
                            <button
                              onClick={() => handleMarkPaid(p.id, p.employeeId)}
                              disabled={busyId === p.id}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold transition-all"
                            >
                              {t.employeesDetail.btnMarkPaid}
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                  {payrolls.length === 0 && (
                    <tr>
                      <td colSpan={isStoreManager ? 7 : 6} className="py-6 text-center text-zinc-500">
                        {t.employeesDetail.noPayroll}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

