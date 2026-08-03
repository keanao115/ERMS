'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Package, AlertTriangle, Truck, PlusCircle, Loader2, AlertCircle, RefreshCw, X, CheckCircle2 } from 'lucide-react';
import { api, getAuthUser } from '@/lib/api';

interface Ingredient {
  id: string;
  name: string;
  sku: string;
  unit: string;
  currentStock: number;
  minThreshold: number;
  costPerUnit: number;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  status: string;
  totalCost: number;
  expectedDate: string | null;
  supplier: { name: string };
}

const POLL_INTERVAL_MS = 10000;

export default function InventoryPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [restockTarget, setRestockTarget] = useState<Ingredient | null>(null);
  const [restockQty, setRestockQty] = useState('');
  const [restocking, setRestocking] = useState(false);
  const [receivingPoId, setReceivingPoId] = useState<string | null>(null);
  const [restockError, setRestockError] = useState('');

  const branchId = getAuthUser()?.branchId ?? null;

  const fetchData = useCallback(
    async (isBackground: boolean) => {
      if (!branchId) {
        setLoadError('No branchId bound to current logged in profile.');
        setLoading(false);
        return;
      }
      if (isBackground) setRefreshing(true);
      try {
        const [ingRes, poRes] = await Promise.all([
          api.get('/inventory/ingredients', { params: { branchId } }),
          api.get('/inventory/purchase-orders', { params: { branchId } })
        ]);
        setIngredients(ingRes.data);
        setPurchaseOrders(poRes.data);
        setLoadError('');
      } catch (err: any) {
        setLoadError(
          err.response?.data?.message || 'Failed to connect to backend service.'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [branchId]
  );

  useEffect(() => {
    fetchData(false);
  }, [fetchData]);

  useEffect(() => {
    const timer = setInterval(() => fetchData(true), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [fetchData]);

  const lowStock = ingredients.filter((i) => i.currentStock <= i.minThreshold);

  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockTarget) return;
    const qty = parseFloat(restockQty);
    if (!qty || qty <= 0) {
      setRestockError('Please enter a valid restock quantity');
      return;
    }
    setRestocking(true);
    setRestockError('');
    try {
      await api.post('/inventory/restock', { ingredientId: restockTarget.id, quantity: qty });
      setRestockTarget(null);
      setRestockQty('');
      await fetchData(true);
    } catch (err: any) {
      setRestockError(err.response?.data?.message || 'Restock failed.');
    } finally {
      setRestocking(false);
    }
  };

  const handleReceivePO = async (poId: string) => {
    setReceivingPoId(poId);
    try {
      await api.patch(`/inventory/purchase-orders/${poId}/receive`);
      await fetchData(true);
    } catch (err: any) {
      console.error('Failed to receive Purchase Order:', err);
    } finally {
      setReceivingPoId(null);
    }
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-6rem)] flex items-center justify-center text-zinc-400 text-sm gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Loading inventory & procurement ledger...</span>
      </div>
    );
  }

  if (loadError && ingredients.length === 0) {
    return (
      <div className="h-[calc(100vh-6rem)] flex items-center justify-center">
        <div className="glass-panel p-6 rounded-2xl border border-rose-500/30 max-w-md text-center">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-3" />
          <p className="text-sm text-white font-semibold mb-1">Failed to load inventory data</p>
          <p className="text-xs text-zinc-400">{loadError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Inventory & Procurement Ledger</h1>
          <p className="text-xs text-zinc-400 mt-1">Real-time Stock Ledger with Automated Recipe Deduction & Purchase Orders</p>
        </div>
        <button
          onClick={() => fetchData(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white hover:border-white/20 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {lowStock.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-amber-300">
                {lowStock.length} Ingredient{lowStock.length > 1 ? 's' : ''} Require{lowStock.length === 1 ? 's' : ''} Reordering
              </h3>
              <p className="text-[11px] text-zinc-400">
                {lowStock.map((i) => i.name).join(', ')} {lowStock.length === 1 ? 'is' : 'are'} at or below minimum threshold.
              </p>
            </div>
          </div>
        </div>
      )}

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
                <th className="py-3 px-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {ingredients.map((ing) => {
                const isLow = ing.currentStock <= ing.minThreshold;
                return (
                  <tr key={ing.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white">{ing.name}</td>
                    <td className="py-3.5 px-4 font-mono text-zinc-400 text-[11px]">{ing.sku}</td>
                    <td className="py-3.5 px-4 font-bold text-white">
                      {ing.currentStock} {ing.unit}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-400">
                      {ing.minThreshold} {ing.unit}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-emerald-400">${ing.costPerUnit.toFixed(2)}</td>
                    <td className="py-3.5 px-4">
                      {isLow ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                          LOW STOCK
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                          IN STOCK
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => {
                          setRestockTarget(ing);
                          setRestockQty('');
                          setRestockError('');
                        }}
                        className="flex items-center gap-1 text-[11px] font-semibold text-blue-400 hover:text-blue-300"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Restock</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active Purchase Orders */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10">
        <div className="flex items-center gap-2 mb-4">
          <Truck className="w-5 h-5 text-purple-400" />
          <h2 className="text-base font-semibold text-white">Purchase Orders & Stock Ingestion</h2>
        </div>

        <div className="space-y-3">
          {purchaseOrders.map((po) => (
            <div key={po.id} className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between flex-wrap gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-blue-400">{po.poNumber}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    po.status === 'RECEIVED'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                  }`}>
                    {po.status}
                  </span>
                </div>
                <p className="text-xs font-medium text-white mt-1">{po.supplier?.name}</p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs font-bold text-emerald-400">${po.totalCost.toFixed(2)}</p>
                  <p className="text-[10px] text-zinc-400">
                    {po.expectedDate ? `Expected: ${new Date(po.expectedDate).toLocaleDateString()}` : 'No ETA set'}
                  </p>
                </div>

                {po.status !== 'RECEIVED' ? (
                  <button
                    onClick={() => handleReceivePO(po.id)}
                    disabled={receivingPoId === po.id}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/30 flex items-center gap-1 transition-all"
                  >
                    {receivingPoId === po.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    <span>Receive PO Stock</span>
                  </button>
                ) : (
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Stock Ingested</span>
                  </span>
                )}
              </div>
            </div>
          ))}
          {purchaseOrders.length === 0 && (
            <p className="text-xs text-zinc-500 text-center py-6">No active purchase orders.</p>
          )}
        </div>
      </div>

      {restockTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel rounded-2xl border border-white/10 max-w-sm w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white">Restock {restockTarget.name}</h2>
              <button onClick={() => setRestockTarget(null)} className="text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] text-zinc-400 mb-3">
              Current stock: {restockTarget.currentStock} {restockTarget.unit}
            </p>
            <form onSubmit={handleRestock} className="space-y-3">
              <div>
                <label className="text-[11px] text-zinc-400 font-medium">Quantity to Add ({restockTarget.unit})</label>
                <input
                  type="number"
                  step="0.01"
                  autoFocus
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50"
                  placeholder="0.00"
                />
              </div>
              {restockError && <p className="text-xs text-rose-400">{restockError}</p>}
              <button
                type="submit"
                disabled={restocking}
                className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all"
              >
                {restocking && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{restocking ? 'Restocking...' : 'Confirm Restock'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
