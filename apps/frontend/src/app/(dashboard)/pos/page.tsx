'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Search,
  Plus,
  Minus,
  CreditCard,
  Printer,
  Grid3X3,
  Receipt,
  X,
  Loader2,
  AlertTriangle,
  RotateCcw,
  Ban,
  ChefHat
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { io, Socket } from 'socket.io-client';
import { api, getAuthUser } from '@/lib/api';

interface MenuItemVariant {
  id: string;
  name: string;
  priceDelta: number;
}

interface MenuItem {
  id: string;
  name: string;
  basePrice: number;
  station: string;
  imageUrl?: string | null;
  isAvailable: boolean;
  variants: MenuItemVariant[];
}

interface Category {
  id: string;
  name: string;
  menuItems: MenuItem[];
}

interface RestaurantTable {
  id: string;
  tableNumber: string;
  capacity: number;
  status: string;
}

interface CartLine {
  menuItem: MenuItem;
  quantity: number;
  isSentToKitchen?: boolean;
}

interface CurrentUser {
  id: string;
  branchId: string | null;
  restaurantId: string | null;
  role: string;
}

function getSocketUrl(): string {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
  return apiBase.replace(/\/api\/v1\/?$/, '');
}

export default function PosPage() {
  const [user, setUser] = useState<CurrentUser | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [selectedTableId, setSelectedTableId] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);

  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [settling, setSettling] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Manager Void / Refund Modal State
  const [modalMode, setModalMode] = useState<'VOID' | 'REFUND' | null>(null);
  const [managerReason, setManagerReason] = useState('');
  const [managerSubmitting, setManagerSubmitting] = useState(false);
  const [managerError, setManagerError] = useState('');

  // Real-time cancellation race alert popup
  const [cancellationAlert, setCancellationAlert] = useState<{ actorName: string; source: string; reason: string; orderNumber: string } | null>(null);

  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [tipPercent, setTipPercent] = useState(18);

  const isManager = user?.role === 'SUPER_ADMIN' || user?.role === 'RESTAURANT_OWNER' || user?.role === 'STORE_MANAGER';

  // Load Active Order when Table selected
  const handleTableSelect = useCallback(async (tableId: string, currentBranchId?: string) => {
    setSelectedTableId(tableId);
    setActionError('');
    setActionSuccess('');

    const bId = currentBranchId || user?.branchId;
    if (!bId || !tableId) return;

    try {
      const res = await api.get(`/pos/tables/${tableId}/active-order`, {
        params: { branchId: bId }
      });

      if (res.data) {
        setOrderId(res.data.id);
        setOrderNumber(res.data.orderNumber);
        const existingLines: CartLine[] = (res.data.items || []).map((it: any) => ({
          menuItem: it.menuItem,
          quantity: it.quantity,
          isSentToKitchen: true
        }));
        setCart(existingLines);
      } else {
        setOrderId(null);
        setOrderNumber(null);
        setCart([]);
      }
    } catch (err: any) {
      setOrderId(null);
      setOrderNumber(null);
      setCart([]);
    }
  }, [user?.branchId]);

  useEffect(() => {
    const u = getAuthUser();
    setUser(u);

    if (!u?.restaurantId || !u?.branchId) {
      setLoadError('No restaurantId / branchId bound to user profile.');
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const [menuRes, tablesRes] = await Promise.all([
          api.get('/menu/categories', { params: { restaurantId: u.restaurantId } }),
          api.get('/tables', { params: { branchId: u.branchId } })
        ]);

        setCategories(menuRes.data);
        setTables(tablesRes.data);
        if (tablesRes.data.length > 0) {
          handleTableSelect(tablesRes.data[0].id, u.branchId || undefined);
        }
      } catch (err: any) {
        setLoadError(err.response?.data?.message || 'Failed to connect to backend API.');
      } finally {
        setLoading(false);
      }
    })();
  }, [handleTableSelect]);

  // Subscribe to KDS WebSocket events for real-time race-condition cancellation alert
  useEffect(() => {
    if (!user?.branchId) return;

    const socket = io(`${getSocketUrl()}/kds`, {
      transports: ['websocket', 'polling']
    });

    socket.on('kds:order_voided', (payload: { orderId: string; orderNumber: string; reason: string; actorName: string; source: string }) => {
      if (orderId && payload.orderId === orderId) {
        setCancellationAlert({
          orderNumber: payload.orderNumber,
          actorName: payload.actorName,
          source: payload.source === 'KDS_KITCHEN' ? 'Kitchen Staff' : 'Store Manager',
          reason: payload.reason
        });
        resetOrder();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.branchId, orderId]);

  const allDishes: MenuItem[] = categories.flatMap((c) => c.menuItems);

  const filteredDishes = allDishes.filter((d) => {
    const matchesCategory =
      selectedCategory === 'ALL' ||
      categories.find((c) => c.name === selectedCategory)?.menuItems.some((mi) => mi.id === d.id);
    const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (dish: MenuItem) => {
    setCart((prev) => {
      const existingUnsentIndex = prev.findIndex((item) => item.menuItem.id === dish.id && !item.isSentToKitchen);
      if (existingUnsentIndex > -1) {
        return prev.map((item, idx) =>
          idx === existingUnsentIndex ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { menuItem: dish, quantity: 1, isSentToKitchen: false }];
    });
  };

  const updateQuantity = (menuItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.menuItem.id === menuItemId && !item.isSentToKitchen) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartLine[]
    );
  };

  const subtotal = cart.reduce((sum, item) => sum + item.menuItem.basePrice * item.quantity, 0);
  const tax = Math.round(subtotal * 0.08875 * 100) / 100;
  const tip = Math.round(subtotal * (tipPercent / 100) * 100) / 100;
  const total = Math.round((subtotal + tax + tip) * 100) / 100;

  const selectedTable = tables.find((t) => t.id === selectedTableId);
  const hasUnsentItems = cart.some((i) => !i.isSentToKitchen);

  const submitOrder = async () => {
    if (!user?.branchId || cart.length === 0) return null;
    setPlacingOrder(true);
    setActionError('');
    setActionSuccess('');
    try {
      if (orderId) {
        // Active order exists -> append unsent items
        const unsentItems = cart.filter((i) => !i.isSentToKitchen);
        const res = await api.post(`/pos/orders/${orderId}/append-items`, {
          items: unsentItems.map((item) => ({
            menuItemId: item.menuItem.id,
            quantity: item.quantity
          }))
        });
        setCart(cart.map((i) => ({ ...i, isSentToKitchen: true })));
        setActionSuccess('New items sent to Kitchen!');
        return res.data;
      } else {
        // Create brand new order
        const res = await api.post('/pos/orders', {
          branchId: user.branchId,
          tableId: selectedTableId || undefined,
          orderType: 'DINE_IN',
          items: cart.map((item) => ({
            menuItemId: item.menuItem.id,
            quantity: item.quantity
          }))
        });
        setOrderId(res.data.id);
        setOrderNumber(res.data.orderNumber);
        setCart(cart.map((i) => ({ ...i, isSentToKitchen: true })));
        setActionSuccess(`Order #${res.data.orderNumber} sent to Kitchen!`);
        return res.data;
      }
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to send order.');
      return null;
    } finally {
      setPlacingOrder(false);
    }
  };

  const settlePayment = async (paymentMethod: string) => {
    setSettling(true);
    setActionError('');
    try {
      let currentOrderId = orderId;
      if (!currentOrderId) {
        const order = await submitOrder();
        if (!order) {
          setSettling(false);
          return;
        }
        currentOrderId = order.id;
      }

      await api.post('/pos/settle', {
        orderId: currentOrderId,
        payments: [{ paymentMethod, amount: total, tipAmount: tip }]
      });

      setShowCheckoutModal(false);
      setShowReceiptModal(true);
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Payment settlement failed.');
    } finally {
      setSettling(false);
    }
  };

  const handleManagerActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId || !modalMode || !managerReason.trim()) {
      setManagerError('Please enter a cancellation reason.');
      return;
    }

    setManagerSubmitting(true);
    setManagerError('');

    try {
      const endpoint = modalMode === 'VOID' ? `/pos/orders/${orderId}/void` : `/pos/orders/${orderId}/refund`;
      await api.post(endpoint, { reason: managerReason.trim() });
      setActionSuccess(`Order ${orderNumber} successfully ${modalMode}ED.`);
      setModalMode(null);
      setManagerReason('');
      resetOrder();
    } catch (err: any) {
      setManagerError(err.response?.data?.message || `${modalMode} order failed.`);
    } finally {
      setManagerSubmitting(false);
    }
  };

  const resetOrder = () => {
    setCart([]);
    setOrderId(null);
    setOrderNumber(null);
    setShowReceiptModal(false);
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-6rem)] flex items-center justify-center text-zinc-400 text-sm gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Loading POS menu and floor tables...</span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="h-[calc(100vh-6rem)] flex items-center justify-center">
        <div className="glass-panel p-6 rounded-2xl border border-rose-500/30 max-w-md text-center">
          <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto mb-3" />
          <p className="text-sm text-white font-semibold mb-1">Failed to load POS data</p>
          <p className="text-xs text-zinc-400">{loadError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-6rem)] flex gap-6 select-none">
      {/* Real-time Cancellation Race Condition Alert Modal */}
      <AnimatePresence>
        {cancellationAlert && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel p-6 rounded-3xl border border-rose-500/40 max-w-md w-full text-center shadow-2xl relative"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-3 border border-rose-500/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">
                Order #{cancellationAlert.orderNumber} Was Cancelled
              </h3>
              <p className="text-xs text-zinc-300 mb-4">
                This order was cancelled by <span className="font-bold text-rose-300">{cancellationAlert.actorName}</span> ({cancellationAlert.source}).
                <br />
                <span className="italic text-zinc-400">Reason: &quot;{cancellationAlert.reason}&quot;</span>
              </p>
              <button
                onClick={() => setCancellationAlert(null)}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30"
              >
                Return to Table Floor Plan
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Left Column: Tables + Category Filter + Dishes Grid */}
      <div className="flex-1 flex flex-col min-w-0 space-y-4">
        {/* Table Selector Row */}
        <div className="glass-panel p-3 rounded-2xl border border-white/10 flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-semibold text-zinc-400 px-2 flex items-center gap-1.5 shrink-0">
            <Grid3X3 className="w-3.5 h-3.5 text-blue-400" />
            <span>Table:</span>
          </span>
          {tables.map((tbl) => (
            <button
              key={tbl.id}
              onClick={() => handleTableSelect(tbl.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all shrink-0 ${
                selectedTableId === tbl.id
                  ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-600/30'
                  : 'bg-white/5 border-white/10 text-zinc-300 hover:border-white/20'
              }`}
            >
              {tbl.tableNumber} ({tbl.capacity} Seats)
            </button>
          ))}
        </div>

        {/* Search & Category Pills */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs w-64 text-zinc-300">
            <Search className="w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Filter menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent focus:outline-none w-full placeholder-zinc-500 text-white"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            {['ALL', ...categories.map((c) => c.name)].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-white/20 border-white/30 text-white'
                    : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Dishes Grid */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pr-1">
          {filteredDishes.map((dish) => (
            <motion.div
              key={dish.id}
              whileHover={{ y: -3 }}
              className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-col justify-between"
            >
              <div>
                {dish.imageUrl && (
                  <img
                    src={dish.imageUrl}
                    alt={dish.name}
                    className="w-full h-32 object-cover rounded-xl mb-3 border border-white/5"
                  />
                )}
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="text-xs font-bold text-white leading-snug">{dish.name}</h3>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    {dish.station}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
                <span className="text-sm font-extrabold text-emerald-400">
                  ${dish.basePrice.toFixed(2)}
                </span>
                <button
                  onClick={() => addToCart(dish)}
                  disabled={!dish.isAvailable}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/30 flex items-center gap-1 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Item</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Right Column: Order Cart */}
      <div className="w-96 glass-panel p-5 rounded-2xl border border-white/10 flex flex-col justify-between">
        <div>
          {/* Cart Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-blue-400" />
                <span>Active Order Cart</span>
              </h2>
              <p className="text-[10px] text-zinc-400">
                Table {selectedTable?.tableNumber ?? '-'}
                {orderNumber && <span className="text-blue-400"> · {orderNumber}</span>}
              </p>
            </div>
            <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              DINE_IN
            </span>
          </div>

          {/* Cart Items List */}
          <div className="space-y-3 max-h-[35vh] overflow-y-auto pr-1">
            {cart.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-8">Cart is empty. Tap menu items to add.</p>
            ) : (
              cart.map((item, idx) => (
                <div
                  key={`${item.menuItem.id}-${idx}`}
                  className={`flex items-center justify-between p-3 rounded-xl border ${
                    item.isSentToKitchen
                      ? 'bg-blue-500/10 border-blue-500/20'
                      : 'bg-white/5 border-white/5'
                  }`}
                >
                  <div className="flex-1 pr-2">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold text-white leading-tight">{item.menuItem.name}</p>
                      {item.isSentToKitchen && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center gap-0.5">
                          <ChefHat className="w-2.5 h-2.5" /> Fired
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-emerald-400 mt-0.5">
                      ${(item.menuItem.basePrice * item.quantity).toFixed(2)}
                    </p>
                  </div>
                  {!item.isSentToKitchen ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.menuItem.id, -1)}
                        className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-300"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold text-white w-4 text-center">{item.quantity}</span>
                      <button
                        onClick={() => addToCart(item.menuItem)}
                        className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-300"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs font-bold text-zinc-400">{item.quantity}x</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Bill Calculations & Action Buttons */}
        <div className="pt-4 border-t border-white/10 space-y-3">
          {/* Tip Presets */}
          <div>
            <span className="text-[10px] font-medium text-zinc-400 block mb-1.5">Tip Presets:</span>
            <div className="grid grid-cols-4 gap-1.5">
              {[15, 18, 20, 25].map((t) => (
                <button
                  key={t}
                  onClick={() => setTipPercent(t)}
                  className={`py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                    tipPercent === t
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                  }`}
                >
                  {t}%
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5 text-xs text-zinc-400">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="text-white">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax (8.875%)</span>
              <span className="text-white">${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tip ({tipPercent}%)</span>
              <span className="text-white">${tip.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-extrabold text-white pt-2 border-t border-white/10">
              <span>Total Bill</span>
              <span className="text-emerald-400">${total.toFixed(2)}</span>
            </div>
          </div>

          {actionError && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px]">
              {actionError}
            </div>
          )}

          {actionSuccess && (
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px]">
              {actionSuccess}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => setShowCheckoutModal(true)}
              disabled={cart.length === 0 || placingOrder}
              className="py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center gap-1.5 transition-all"
            >
              <CreditCard className="w-4 h-4" />
              <span>Settle Payment</span>
            </button>

            <button
              onClick={submitOrder}
              disabled={cart.length === 0 || placingOrder || (!hasUnsentItems && !!orderId)}
              className="py-2.5 rounded-xl bg-white/10 hover:bg-white/15 disabled:opacity-40 text-white font-bold text-xs border border-white/10 flex items-center justify-center gap-1.5 transition-all"
            >
              {placingOrder ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
              <span>{orderId ? (hasUnsentItems ? 'Send New Items' : 'Sent to Kitchen') : 'Send to Kitchen'}</span>
            </button>
          </div>

          {/* Manager Void & Refund Override Section */}
          {isManager && orderId && (
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
              <button
                onClick={() => setModalMode('VOID')}
                className="py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 font-semibold text-[11px] flex items-center justify-center gap-1 transition-all"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Void Order</span>
              </button>

              <button
                onClick={() => setModalMode('REFUND')}
                className="py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 font-semibold text-[11px] flex items-center justify-center gap-1 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Issue Refund</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Manager Action Modal (Void / Refund) */}
      <AnimatePresence>
        {modalMode && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel p-6 rounded-3xl border border-white/15 max-w-md w-full shadow-2xl relative"
            >
              <button
                onClick={() => {
                  setModalMode(null);
                  setManagerReason('');
                  setManagerError('');
                }}
                className="absolute top-4 right-4 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-2 border ${
                  modalMode === 'VOID'
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                    : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                }`}>
                  {modalMode === 'VOID' ? <Ban className="w-6 h-6" /> : <RotateCcw className="w-6 h-6" />}
                </div>
                <h3 className="text-lg font-bold text-white">{modalMode === 'VOID' ? 'Void' : 'Refund'} Order #{orderNumber}</h3>
                <p className="text-xs text-zinc-400">
                  Restores ingredient stock, updates status to {modalMode === 'VOID' ? 'CANCELLED' : 'REFUNDED'}, and writes an audit log.
                </p>
              </div>

              <form onSubmit={handleManagerActionSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-zinc-300 block mb-1">
                    Reason (Required) <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    rows={3}
                    autoFocus
                    required
                    value={managerReason}
                    onChange={(e) => setManagerReason(e.target.value)}
                    placeholder="e.g. Customer changed mind / Billing error"
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50"
                  />
                </div>

                {managerError && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px]">
                    {managerError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setModalMode(null);
                      setManagerReason('');
                      setManagerError('');
                    }}
                    className="py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 font-bold text-xs border border-white/10"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={managerSubmitting || !managerReason.trim()}
                    className={`py-2.5 rounded-xl text-white font-bold text-xs shadow-lg flex items-center justify-center gap-1.5 transition-all ${
                      modalMode === 'VOID'
                        ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                        : 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
                    }`}
                  >
                    {managerSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>Confirm {modalMode === 'VOID' ? 'Void' : 'Refund'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Payment Settlement Modal */}
      <AnimatePresence>
        {showCheckoutModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel p-6 rounded-3xl border border-white/15 max-w-md w-full shadow-2xl relative"
            >
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2 border border-emerald-500/30">
                  <CreditCard className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Settle Payment</h3>
                <p className="text-xs text-zinc-400">
                  Select payment method for Table {selectedTable?.tableNumber ?? '-'}
                </p>
              </div>

              <div className="space-y-3 mb-6">
                {['APPLE_PAY', 'CREDIT_CARD', 'CASH', 'GIFT_CARD'].map((pm) => (
                  <button
                    key={pm}
                    onClick={() => settlePayment(pm)}
                    disabled={settling}
                    className="w-full p-3.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-40 border border-white/10 text-xs font-semibold text-white flex items-center justify-between transition-colors"
                  >
                    <span>{pm.replace('_', ' ')}</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                      {settling && <Loader2 className="w-3 h-3 animate-spin" />}${total.toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Print Receipt Modal */}
      <AnimatePresence>
        {showReceiptModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white text-zinc-900 p-6 rounded-2xl max-w-sm w-full font-mono text-xs shadow-2xl relative"
            >
              <button
                onClick={resetOrder}
                className="absolute top-3 right-3 text-zinc-500 hover:text-black font-sans font-bold"
              >
                ✕
              </button>

              <div className="text-center pb-4 border-b border-dashed border-zinc-400 mb-4">
                <h2 className="font-bold text-sm">AURA DOWNTOWN FINE DINING</h2>
                <p className="text-[10px] text-zinc-600">777 Grand Ave, New York, NY</p>
                <p className="text-[10px] text-zinc-600">Tel: +1 (212) 555-0199</p>
              </div>

              <div className="space-y-1 mb-4 text-[11px]">
                <p>Order: #{orderNumber ?? 'N/A'}</p>
                <p>Table: {selectedTable?.tableNumber ?? '-'}</p>
                <p>Date: {new Date().toLocaleString()}</p>
              </div>

              <div className="space-y-2 py-3 border-y border-dashed border-zinc-400 mb-4 text-[11px]">
                {cart.map((item, idx) => (
                  <div key={`${item.menuItem.id}-${idx}`} className="flex justify-between">
                    <span>
                      {item.quantity}x {item.menuItem.name}
                    </span>
                    <span>${(item.menuItem.basePrice * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 text-right text-[11px] font-bold">
                <p>Subtotal: ${subtotal.toFixed(2)}</p>
                <p>Tax (8.875%): ${tax.toFixed(2)}</p>
                <p>Tip ({tipPercent}%): ${tip.toFixed(2)}</p>
                <p className="text-sm font-extrabold pt-1">TOTAL: ${total.toFixed(2)}</p>
              </div>

              <div className="text-center pt-4 border-t border-dashed border-zinc-400 mt-4 text-[10px] text-zinc-600">
                <p>Payment confirmed — inventory auto-deducted.</p>
                <p>*** Merchant Copy ***</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
