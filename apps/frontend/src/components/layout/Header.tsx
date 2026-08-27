'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Bell, Building2, ChevronDown, Clock } from 'lucide-react';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';
import { useLocale } from '@/contexts/LocaleContext';

export default function Header() {
  const { t } = useLocale();
  const [user, setUser] = useState<any>(null);
  const [shiftStatus, setShiftStatus] = useState<{ isClockedIn: boolean } | null>(null);
  const pathname = usePathname();

  const checkShiftStatus = useCallback(() => {
    import('@/lib/api').then(({ getAuthUser, api }) => {
      const u = getAuthUser();
      if (u) setUser(u);

      api.get('/employees/me').then((res) => {
        if (res.data?.attendance) {
          const latestAtt = res.data.attendance[0];
          const clockedIn = !!latestAtt && !latestAtt.clockOut;
          setShiftStatus({ isClockedIn: clockedIn });
        }
      }).catch(() => {
        // Non-branch admin accounts
      });
    });
  }, []);

  useEffect(() => {
    checkShiftStatus();
  }, [checkShiftStatus, pathname]);

  return (
    <header className="h-16 glass-panel border-b border-white/10 ml-64 px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Search Input Bar */}
      <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 w-72 text-xs text-zinc-400 focus-within:border-blue-500 transition-colors">
        <Search className="w-4 h-4 text-zinc-400" />
        <input
          type="text"
          placeholder={t.header.searchPlaceholder}
          className="bg-transparent text-white focus:outline-none w-full placeholder-zinc-500"
        />
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Quick Access: Shift Attendance Button with On/Off Toggle */}
        <Link href="/my-attendance">
          <button className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600/30 to-indigo-600/30 hover:from-blue-600/50 hover:to-indigo-600/50 border border-blue-500/40 text-xs font-semibold text-white shadow-md shadow-blue-500/10 transition-all">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>{t.header.shiftAttendance}</span>
            {shiftStatus !== null && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase transition-all ${
                shiftStatus.isClockedIn
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}>
                {shiftStatus.isClockedIn ? t.header.shiftOn : t.header.shiftOff}
              </span>
            )}
          </button>
        </Link>

        {/* Active Branch Badge */}
        <div className="hidden sm:flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-zinc-300">
          <Building2 className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-medium">{t.brand.branchName}</span>
          <ChevronDown className="w-3 h-3 text-zinc-500" />
        </div>

        {/* Language Switcher */}
        <LanguageSwitcher />

        {/* Notifications */}
        <button
          title={t.header.notifications}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 relative transition-colors"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-zinc-900" />
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-2 border-l border-white/10">
          <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300 font-semibold text-xs">
            {user?.firstName?.[0] || 'A'}
          </div>
          <div className="text-left hidden md:block">
            <p className="text-xs font-semibold text-white leading-none">{user?.firstName} {user?.lastName}</p>
            <p className="text-[10px] text-blue-400 font-medium leading-tight mt-0.5">{user?.role || 'SUPER_ADMIN'}</p>
          </div>
        </div>
      </div>
    </header>
  );
}

