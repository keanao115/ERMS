'use client';

import React, { useEffect, useState } from 'react';
import { Search, Bell, Building2, UserCircle, ChevronDown } from 'lucide-react';

export default function Header() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem('erms_user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, []);

  return (
    <header className="h-16 glass-panel border-b border-white/10 ml-64 px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Search Input Bar */}
      <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 w-72 text-xs text-zinc-400 focus-within:border-blue-500 transition-colors">
        <Search className="w-4 h-4 text-zinc-400" />
        <input
          type="text"
          placeholder="Search orders, dishes, staff (⌘K)..."
          className="bg-transparent text-white focus:outline-none w-full placeholder-zinc-500"
        />
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Active Branch Badge */}
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-zinc-300">
          <Building2 className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-medium">Aura Downtown Fine Dining</span>
          <ChevronDown className="w-3 h-3 text-zinc-500" />
        </div>

        {/* Notifications */}
        <button className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 relative transition-colors">
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
