'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  ChefHat, 
  BookOpen, 
  Grid3X3, 
  Calendar, 
  Package, 
  BarChart3, 
  Users, 
  ShieldAlert, 
  Settings,
  LogOut,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Point of Sale', href: '/pos', icon: UtensilsCrossed, badge: 'LIVE' },
  { label: 'Kitchen KDS', href: '/kds', icon: ChefHat, badge: 'REALTIME' },
  { label: 'Menu & Recipes', href: '/menu', icon: BookOpen },
  { label: 'Tables & Floor', href: '/tables', icon: Grid3X3 },
  { label: 'Reservations', href: '/reservations', icon: Calendar },
  { label: 'Inventory & POs', href: '/inventory', icon: Package },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'Workforce & HR', href: '/employees', icon: Users },
  { label: 'Audit Trail', href: '/audit-logs', icon: ShieldAlert },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.removeItem('erms_access_token');
    localStorage.removeItem('erms_user');
    window.location.href = '/login';
  };

  return (
    <aside className="w-64 h-screen glass-panel border-r border-white/10 flex flex-col justify-between p-4 fixed left-0 top-0 z-40 select-none">
      <div>
        {/* Brand Logo */}
        <div className="flex items-center gap-3 px-3 py-4 mb-4 border-b border-white/10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold tracking-wide text-white text-base">AURA SaaS</h1>
            <p className="text-[11px] text-zinc-400 font-medium">Enterprise ERMS v1.0</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-600/90 text-white shadow-md shadow-blue-600/30'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-zinc-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                      {item.badge}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
      >
        <LogOut className="w-4 h-4" />
        <span>Sign Out</span>
      </button>
    </aside>
  );
}
