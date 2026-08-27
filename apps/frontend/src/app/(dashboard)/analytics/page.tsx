'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart3, Loader2, AlertCircle, RefreshCw, Utensils, Flame, Lock, Clock } from 'lucide-react';
import { api, getAuthUser } from '@/lib/api';

interface DashboardData {
  metrics: {
    totalRevenue: number;
    totalCOGS: number;
    grossProfit: number;
    netMarginPercentage: number;
    totalOrders: number;
    totalTax: number;
    totalTips: number;
    occupancyRate: number;
    activeTables: number;
    totalTables: number;
  };
  heatmapMatrix: Array<Array<{ hour: number; day: number; orderCount: number; revenue: number }>>;
  topDishes: { menuItemId: string; name: string; quantitySold: number; revenue: string }[];
}

const POLL_INTERVAL_MS = 15000;
const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

import { useLocale } from '@/contexts/LocaleContext';

export default function AnalyticsPage() {
  const { t } = useLocale();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');

  const currentUser = getAuthUser();
  const branchId = currentUser?.branchId ?? null;
  const userRole = currentUser?.role;

  const isManagerOrAdmin = userRole === 'STORE_MANAGER' || userRole === 'SUPER_ADMIN' || userRole === 'RESTAURANT_OWNER' || userRole === 'REGIONAL_MANAGER';

  const fetchDashboard = useCallback(
    async (isBackground: boolean) => {
      if (!branchId || !isManagerOrAdmin) {
        if (!branchId) setLoadError('No branchId bound to current user.');
        setLoading(false);
        return;
      }
      if (isBackground) setRefreshing(true);
      try {
        const res = await api.get('/analytics/dashboard', { params: { branchId } });
        setData(res.data);
        setLoadError('');
      } catch (err: any) {
        setLoadError(
          err.response?.data?.message || t.analytics.errorLoad
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [branchId, isManagerOrAdmin, t]
  );

  useEffect(() => {
    fetchDashboard(false);
  }, [fetchDashboard]);

  useEffect(() => {
    if (!isManagerOrAdmin) return;
    const timer = setInterval(() => fetchDashboard(true), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [fetchDashboard, isManagerOrAdmin]);

  if (!isManagerOrAdmin) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pt-6">
        <div className="glass-panel p-8 rounded-3xl border border-amber-500/30 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white">{t.accessPanel.title}</h2>
          <p className="text-sm text-zinc-300 font-medium">
            {t.accessPanel.analytics.message}
          </p>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            {t.accessPanel.analytics.sub}
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

  if (loading) {
    return (
      <div className="h-[calc(100vh-6rem)] flex items-center justify-center text-zinc-400 text-sm gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>{t.analytics.loadingAnalytics}</span>
      </div>
    );
  }

  if (loadError && !data) {
    return (
      <div className="h-[calc(100vh-6rem)] flex items-center justify-center">
        <div className="glass-panel p-6 rounded-2xl border border-rose-500/30 max-w-md text-center">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-3" />
          <p className="text-sm text-white font-semibold mb-1">{t.analytics.errorLoad}</p>
          <p className="text-xs text-zinc-400">{loadError}</p>
        </div>
      </div>
    );
  }

  const metrics = data?.metrics;
  const topDishes = data?.topDishes ?? [];
  const heatmap = data?.heatmapMatrix ?? [];
  const maxQty = Math.max(1, ...topDishes.map((d) => d.quantitySold));

  const dayKeys: (keyof typeof t.analytics.days)[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{t.analytics.title}</h1>
          <p className="text-xs text-zinc-400 mt-1">{t.analytics.subtitle}</p>
        </div>
        <button
          onClick={() => fetchDashboard(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white hover:border-white/20 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{t.common.refresh}</span>
        </button>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-white/10">
          <span className="text-xs text-zinc-400 font-medium">{t.analytics.metricGrossRevenue}</span>
          <p className="text-2xl font-extrabold text-white mt-1">${metrics?.totalRevenue.toFixed(2)}</p>
          <p className="text-[11px] text-zinc-400 mt-1">{metrics?.totalOrders} {t.analytics.metricOrdersCompleted}</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/10">
          <span className="text-xs text-zinc-400 font-medium">{t.analytics.metricCOGS}</span>
          <p className="text-2xl font-extrabold text-rose-400 mt-1">${metrics?.totalCOGS.toFixed(2)}</p>
          <p className="text-[11px] text-zinc-400 mt-1">{t.analytics.cogsSubtitle}</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/10">
          <span className="text-xs text-zinc-400 font-medium">{t.analytics.metricGrossProfit}</span>
          <p className="text-2xl font-extrabold text-emerald-400 mt-1">${metrics?.grossProfit.toFixed(2)}</p>
          <p className="text-[11px] text-zinc-400 mt-1">{t.analytics.grossProfitSubtitle}</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/10">
          <span className="text-xs text-zinc-400 font-medium">{t.analytics.metricNetMargin}</span>
          <p className="text-2xl font-extrabold text-purple-400 mt-1">{metrics?.netMarginPercentage}%</p>
          <p className="text-[11px] text-zinc-400 mt-1">{t.analytics.grossProfitSubtitle}</p>
        </div>
      </div>

      {/* Peak-Hour Traffic Heatmap Matrix */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-semibold text-white">{t.analytics.heatmapTitle}</h2>
          </div>

          {/* Color Intensity Scale Legend Key */}
          <div className="flex items-center gap-3 text-[11px] text-zinc-400 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
            <span className="font-semibold text-zinc-300">{t.analytics.heatmapVolume}</span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-white/10 border border-white/20"></span> {t.analytics.heatmapZero}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-blue-500/30 border border-blue-500/50"></span> {t.analytics.heatmapLow}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-amber-500/40 border border-amber-500/60"></span> {t.analytics.heatmapMed}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-rose-500/70 border border-rose-400"></span> {t.analytics.heatmapHigh}
            </span>
          </div>
        </div>

        {/* Properly Sized 25-Column Grid */}
        <div className="overflow-x-auto">
          <div className="min-w-[800px] space-y-1.5 text-xs">
            <div
              className="gap-1 text-[10px] text-zinc-400 font-bold text-center border-b border-white/10 pb-2"
              style={{ display: 'grid', gridTemplateColumns: '70px repeat(24, minmax(0, 1fr))' }}
            >
              <span className="text-left font-bold text-zinc-300">{t.analytics.heatmapDayLabel}</span>
              {Array.from({ length: 24 }).map((_, h) => (
                <span key={h} className="text-center">{h}h</span>
              ))}
            </div>

            {heatmap.map((dayRow, dayIdx) => {
              const dayLabel = t.analytics.days[dayKeys[dayIdx]] || DAYS_OF_WEEK[dayIdx];
              return (
                <div
                  key={dayIdx}
                  className="gap-1 items-center"
                  style={{ display: 'grid', gridTemplateColumns: '70px repeat(24, minmax(0, 1fr))' }}
                >
                  <span className="text-[11px] font-bold text-zinc-300 text-left">{dayLabel}</span>
                  {dayRow.map((cell, hIdx) => {
                    const intensity = Math.min(cell.orderCount, 5);
                    let bg = 'bg-white/5 text-zinc-600';
                    if (intensity === 1) bg = 'bg-blue-500/30 text-blue-200 border border-blue-500/50';
                    if (intensity === 2) bg = 'bg-amber-500/40 text-amber-200 border border-amber-500/60';
                    if (intensity >= 3) bg = 'bg-rose-500/70 text-white font-bold border border-rose-400 shadow-sm shadow-rose-500/30';

                    return (
                      <div
                        key={hIdx}
                        title={`${dayLabel} ${hIdx}:00 - ${cell.orderCount} orders ($${cell.revenue.toFixed(2)})`}
                        className={`h-7 rounded-md flex items-center justify-center text-[10px] transition-all cursor-pointer hover:scale-105 ${bg}`}
                      >
                        {cell.orderCount > 0 ? cell.orderCount : '-'}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Dishes Velocity */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-semibold text-white">{t.analytics.topDishesTitle}</h2>
          </div>
          <span className="text-xs text-zinc-400 flex items-center gap-1">
            <Utensils className="w-3.5 h-3.5" />
            {t.analytics.topDishesBy}
          </span>
        </div>

        {topDishes.length === 0 ? (
          <p className="text-xs text-zinc-500 text-center py-10">{t.analytics.topDishesEmpty}</p>
        ) : (
          <div className="space-y-4">
            {topDishes.map((dish, i) => (
              <div key={dish.menuItemId} className="flex items-center gap-4">
                <span className="text-xs font-bold text-zinc-500 w-4">{i + 1}</span>
                <span className="text-xs font-semibold text-white w-48 truncate">{dish.name}</span>
                <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-400 rounded-full"
                    style={{ width: `${(dish.quantitySold / maxQty) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-emerald-400 w-24 text-right">
                  {t.analytics.topDishesSold.replace('{count}', String(dish.quantitySold))}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

