'use client';

import React from 'react';
import { 
  DollarSign, 
  ShoppingBag, 
  Users, 
  TrendingUp, 
  ArrowUpRight, 
  Clock, 
  Flame, 
  Utensils, 
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function DashboardPage() {
  const metrics = [
    { title: 'Gross Daily Revenue', value: '$510.00', change: '+14.2%', icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { title: 'Total Orders Placed', value: '18 Orders', change: '+8.4%', icon: ShoppingBag, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { title: 'Floor Occupancy Rate', value: '37.5%', change: '3 of 8 Tables', icon: Users, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { title: 'Average Ticket Value', value: '$85.00', change: '+5.1%', icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/10' }
  ];

  const topDishes = [
    { name: 'A5 Miyazaki Wagyu Ribeye', category: 'Prime Steaks', orders: 14, revenue: '$1,750.00' },
    { name: 'Ora King Salmon', category: 'Chef Signature Mains', orders: 11, revenue: '$462.00' },
    { name: 'Black Truffle Risotto', category: 'Chef Signature Mains', orders: 9, revenue: '$342.00' },
    { name: 'Smoked Bourbon Old Fashioned', category: 'Artisan Cocktails', orders: 22, revenue: '$484.00' }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Executive Dashboard</h1>
          <p className="text-xs text-zinc-400 mt-1">Real-time enterprise metrics for Aura Downtown Fine Dining</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/pos">
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all">
              <Utensils className="w-3.5 h-3.5" />
              <span>Launch POS Terminal</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <motion.div
              key={m.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="glass-panel p-5 rounded-2xl border border-white/10"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-zinc-400">{m.title}</span>
                <div className={`p-2 rounded-xl ${m.bg}`}>
                  <Icon className={`w-4 h-4 ${m.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{m.value}</p>
              <p className="text-[11px] text-emerald-400 font-medium mt-1 flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" />
                <span>{m.change} vs yesterday</span>
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Two Column Layout: Top Dishes & Live Alert Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Selling Dishes Velocity */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-semibold text-white">Top Dish Popularity Velocity</h2>
            </div>
            <span className="text-xs text-zinc-400">Shift Performance</span>
          </div>

          <div className="space-y-3">
            {topDishes.map((dish, idx) => (
              <div
                key={dish.name}
                className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-300 font-bold text-xs flex items-center justify-center">
                    #{idx + 1}
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-white">{dish.name}</p>
                    <p className="text-[10px] text-zinc-400">{dish.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-emerald-400">{dish.revenue}</p>
                  <p className="text-[10px] text-zinc-400">{dish.orders} ordered</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Operational Alerts & System Status */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-semibold text-white">Stock & System Alerts</h2>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
                <p className="font-semibold text-amber-300">⚠️ Low Stock Warning: Yellowfin Tuna</p>
                <p className="text-zinc-400 text-[11px] mt-0.5">Current stock: 2.1 KG (Min Threshold: 2.5 KG)</p>
              </div>

              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs">
                <p className="font-semibold text-blue-300">📦 Purchase Order Submitted</p>
                <p className="text-zinc-400 text-[11px] mt-0.5">PO-2026-00891 expected in 2 days from Grand Pacific Meats.</p>
              </div>
            </div>
          </div>

          <Link href="/inventory" className="mt-6">
            <button className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-zinc-300 flex items-center justify-center gap-2 transition-all">
              <span>View Full Inventory Ledger</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
