'use client';

import React from 'react';
import { Package, AlertTriangle, ArrowDownRight, Truck, FileText, CheckCircle2 } from 'lucide-react';

const ingredients = [
  { id: 'ing-1', name: 'A5 Miyazaki Wagyu Beef', sku: 'ING-WAGYU', unit: 'KG', currentStock: 15.5, minThreshold: 5.0, cost: '$180.00', status: 'OK' },
  { id: 'ing-2', name: 'Black Winter Truffle Butter', sku: 'ING-TRUFFLE-BTR', unit: 'KG', currentStock: 3.2, minThreshold: 1.0, cost: '$65.00', status: 'OK' },
  { id: 'ing-3', name: 'Ora King Salmon Fillet', sku: 'ING-SALMON', unit: 'KG', currentStock: 8.0, minThreshold: 3.0, cost: '$34.00', status: 'OK' },
  { id: 'ing-4', name: 'Yellowfin Tuna Loin', sku: 'ING-TUNA', unit: 'KG', currentStock: 2.1, minThreshold: 2.5, cost: '$42.00', status: 'LOW_STOCK' }
];

const purchaseOrders = [
  { id: 'po-1', poNumber: 'PO-2026-00891', supplier: 'Grand Pacific Prime Meats Co.', status: 'SUBMITTED', total: '$2,700.00', expected: 'In 2 Days' }
];

export default function InventoryPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Inventory & Procurement Ledger</h1>
          <p className="text-xs text-zinc-400 mt-1">Real-time Stock Ledger with Automated Recipe Deduction & Purchase Orders</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all">
          <FileText className="w-3.5 h-3.5" />
          <span>Draft Purchase Order</span>
        </button>
      </div>

      {/* Low Stock Warning Alert Banner */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-amber-300">1 Ingredient Requires Reordering</h3>
            <p className="text-[11px] text-zinc-400">Yellowfin Tuna Loin stock (2.1 KG) is below the minimum threshold of 2.5 KG.</p>
          </div>
        </div>
        <button className="px-3 py-1.5 bg-amber-500 text-zinc-950 rounded-xl text-xs font-bold hover:bg-amber-400 transition-colors">
          Generate Supplier PO
        </button>
      </div>

      {/* Stock Ledger Table */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10">
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-5 h-5 text-blue-400" />
          <h2 className="text-base font-semibold text-white">Ingredient Stock Levels</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-zinc-400 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Ingredient Name</th>
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4">Current Stock</th>
                <th className="py-3 px-4">Min Threshold</th>
                <th className="py-3 px-4">Cost / Unit</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {ingredients.map((ing) => (
                <tr key={ing.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-white">{ing.name}</td>
                  <td className="py-3.5 px-4 font-mono text-zinc-400 text-[11px]">{ing.sku}</td>
                  <td className="py-3.5 px-4 font-bold text-white">
                    {ing.currentStock} {ing.unit}
                  </td>
                  <td className="py-3.5 px-4 text-zinc-400">
                    {ing.minThreshold} {ing.unit}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-emerald-400">{ing.cost}</td>
                  <td className="py-3.5 px-4">
                    {ing.status === 'LOW_STOCK' ? (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                        LOW STOCK
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                        IN STOCK
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active Purchase Orders */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10">
        <div className="flex items-center gap-2 mb-4">
          <Truck className="w-5 h-5 text-purple-400" />
          <h2 className="text-base font-semibold text-white">Active Purchase Orders (POs)</h2>
        </div>

        <div className="space-y-3">
          {purchaseOrders.map((po) => (
            <div
              key={po.id}
              className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-blue-400">{po.poNumber}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {po.status}
                  </span>
                </div>
                <p className="text-xs font-medium text-white mt-1">{po.supplier}</p>
              </div>

              <div className="text-right">
                <p className="text-xs font-bold text-emerald-400">{po.total}</p>
                <p className="text-[10px] text-zinc-400">Expected: {po.expected}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
