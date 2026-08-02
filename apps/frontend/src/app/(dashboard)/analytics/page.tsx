'use client';

import React from 'react';
import { BarChart3, TrendingUp, DollarSign, PieChart, Calendar, Layers } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Financial & Sales Analytics Engine</h1>
        <p className="text-xs text-zinc-400 mt-1">Enterprise Revenue Trends, COGS Recipe Costing, and Margin Analysis</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-white/10">
          <span className="text-xs text-zinc-400 font-medium">Monthly Gross Sales</span>
          <p className="text-3xl font-extrabold text-white mt-2">$142,850.00</p>
          <p className="text-xs text-emerald-400 font-semibold mt-1">+18.5% vs last month</p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-white/10">
          <span className="text-xs text-zinc-400 font-medium">Average Cost of Goods Sold (COGS)</span>
          <p className="text-3xl font-extrabold text-amber-400 mt-2">28.4%</p>
          <p className="text-xs text-zinc-400 mt-1">Target range: 25% - 30%</p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-white/10">
          <span className="text-xs text-zinc-400 font-medium">Net Profit Margin</span>
          <p className="text-3xl font-extrabold text-emerald-400 mt-2">34.2%</p>
          <p className="text-xs text-emerald-400 font-semibold mt-1">+$48,854.70 net margin</p>
        </div>
      </div>

      {/* Visual Chart Placeholder Card */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-semibold text-white">Hourly Peak Sales Heatmap</h2>
          </div>
          <span className="text-xs text-zinc-400">Shift Window: 5:00 PM - 11:00 PM</span>
        </div>

        <div className="h-48 flex items-end justify-between gap-4 pt-8 px-4 border-b border-white/10">
          {[
            { hour: '5 PM', height: 'h-16', rev: '$850' },
            { hour: '6 PM', height: 'h-24', rev: '$1,420' },
            { hour: '7 PM', height: 'h-40', rev: '$3,890' },
            { hour: '8 PM', height: 'h-44', rev: '$4,250' },
            { hour: '9 PM', height: 'h-36', rev: '$2,910' },
            { hour: '10 PM', height: 'h-20', rev: '$1,180' }
          ].map((bar) => (
            <div key={bar.hour} className="flex-1 flex flex-col items-center gap-2 group">
              <span className="text-[10px] text-emerald-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                {bar.rev}
              </span>
              <div className={`w-full ${bar.height} bg-gradient-to-t from-blue-600 to-indigo-400 rounded-t-lg shadow-lg shadow-blue-500/20`} />
              <span className="text-xs text-zinc-400 font-medium">{bar.hour}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
