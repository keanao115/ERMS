'use client';

import React, { useEffect, useState } from 'react';
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
  Sparkles,
  Clock
} from 'lucide-react';

import { useLocale } from '@/contexts/LocaleContext';

interface NavItemConfig {
  key: keyof typeof import('@/locales/zh-TW').default.nav;
  href: string;
  icon: any;
  badgeKey?: keyof typeof import('@/locales/zh-TW').default.nav;
  managerOnly?: boolean;
}

const navConfig: NavItemConfig[] = [
  { key: 'overview', href: '/dashboard', icon: LayoutDashboard },
  { key: 'myShiftAttendance', href: '/my-attendance', icon: Clock },
  { key: 'pointOfSale', href: '/pos', icon: UtensilsCrossed, badgeKey: 'badgeLive' },
  { key: 'kitchenKDS', href: '/kds', icon: ChefHat, badgeKey: 'badgeRealtime' },
  { key: 'menuRecipes', href: '/menu', icon: BookOpen },
  { key: 'tablesFloor', href: '/tables', icon: Grid3X3 },
  { key: 'reservations', href: '/reservations', icon: Calendar },
  { key: 'inventoryPOs', href: '/inventory', icon: Package },
  { key: 'workforceTimesheet', href: '/employees', icon: Users, managerOnly: true, badgeKey: 'badgeMgr' },
  { key: 'analyticsEngine', href: '/analytics', icon: BarChart3, managerOnly: true, badgeKey: 'badgeMgr' },
  { key: 'securityAuditTrail', href: '/audit-logs', icon: ShieldAlert, managerOnly: true, badgeKey: 'badgeMgr' },
  { key: 'settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { t } = useLocale();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    import('@/lib/api').then(({ getAuthUser }) => {
      const u = getAuthUser();
      if (u?.role) setUserRole(u.role);
    });
  }, []);

  const isManagerOrAdmin = userRole === 'STORE_MANAGER' || userRole === 'SUPER_ADMIN' || userRole === 'RESTAURANT_OWNER' || userRole === 'REGIONAL_MANAGER';

  const visibleNavItems = navConfig.filter((item) => {
    if (item.managerOnly && !isManagerOrAdmin) {
      return false;
    }
    return true;
  });

  const handleLogout = () => {
    import('@/lib/api').then(({ clearAuthSession }) => {
      clearAuthSession();
      window.location.href = '/login';
    });
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
            <h1 className="font-semibold tracking-wide text-white text-base">{t.brand.name}</h1>
            <p className="text-[11px] text-zinc-400 font-medium">{t.brand.version}</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const label = (t.nav as any)[item.key] || item.key;
            const badge = item.badgeKey ? (t.nav as any)[item.badgeKey] : undefined;

            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-600/90 text-white shadow-md shadow-blue-600/30 font-semibold'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-1">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-zinc-400'}`} />
                    <span className="truncate">{label}</span>
                  </div>
                  {badge && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 shrink-0">
                      {badge}
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
        className="flex items-center gap-3 px-3 py-2.5 text-xs font-medium text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
      >
        <LogOut className="w-4 h-4" />
        <span>{t.common.signOut}</span>
      </button>
    </aside>
  );
}

