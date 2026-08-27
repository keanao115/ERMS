'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ChefHat, Clock, CheckCircle2, AlertCircle, Wifi, WifiOff, Flame, Loader2, Ban, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { io, Socket } from 'socket.io-client';
import { api, getAuthUser } from '@/lib/api';
import { useLocale } from '@/contexts/LocaleContext';

type OrderItemStatus = 'QUEUED' | 'COOKING' | 'BUMPED' | 'SERVED' | 'VOIDED';

interface KdsTicket {
  id: string;
  orderId: string;
  orderNumber: string;
  tableNumber: string;
  itemName: string;
  quantity: number;
  station: string;
  notes?: string | null;
  status: OrderItemStatus;
  timerStartedAt: string | null;
}

interface RawOrderItem {
  id: string;
  orderId: string;
  quantity: number;
  notes?: string | null;
  status: OrderItemStatus;
  station: string;
  timerStartedAt: string | null;
  menuItem: { name: string };
  order: { orderNumber: string; table?: { tableNumber: string } | null };
}

function getSocketUrl(): string {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
  return apiBase.replace(/\/api\/v1\/?$/, '');
}

function toTicket(item: RawOrderItem): KdsTicket {
  return {
    id: item.id,
    orderId: item.orderId,
    orderNumber: item.order.orderNumber,
    tableNumber: item.order.table?.tableNumber ?? '—',
    itemName: item.menuItem.name,
    quantity: item.quantity,
    station: item.station,
    notes: item.notes,
    status: item.status,
    timerStartedAt: item.timerStartedAt
  };
}

export default function KdsPage() {
  const { t } = useLocale();
  const [stationFilter, setStationFilter] = useState('ALL');
  const [tickets, setTickets] = useState<KdsTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [cancellationAlert, setCancellationAlert] = useState<{
    orderNumber: string;
    actorName: string;
    source: string;
    reason: string;
  } | null>(null);

  // Cancellation Modal state
  const [cancelTargetOrder, setCancelTargetOrder] = useState<{ orderId: string; orderNumber: string } | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');

  const branchId = useMemo(() => getAuthUser()?.branchId ?? null, []);

  const fetchQueue = useCallback(async () => {
    if (!branchId) return;
    try {
      const res = await api.get('/kds/queue', { params: { branchId } });
      setTickets((res.data as RawOrderItem[]).map(toTicket));
      setLoadError('');
    } catch (err: any) {
      setLoadError(err.response?.data?.message || 'Failed to connect to backend API.');
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // Live WebSocket subscriptions
  const socketRef = React.useRef<Socket | null>(null);

  useEffect(() => {
    if (!branchId) return;

    const socket: Socket = io(`${getSocketUrl()}/kds`, {
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    socket.on('connect_error', () => setIsConnected(false));

    socket.on('kds:order_placed', (order: any) => {
      if (order.branchId && order.branchId !== branchId) return;
      const newTickets: KdsTicket[] = (order.items || []).map((item: any) =>
        toTicket({
          ...item,
          orderId: order.id,
          order: { orderNumber: order.orderNumber, table: order.table }
        })
      );
      setTickets((prev) => [...prev, ...newTickets]);
    });

    // Real-time cancellation event listener
    socket.on('kds:order_voided', (payload: { orderId: string; orderNumber: string; orderItemIds: string[]; reason: string; actorName: string; source: string }) => {
      setTickets((prev) => prev.filter((t) => t.orderId !== payload.orderId && !payload.orderItemIds.includes(t.id)));
      const sourceLabel = payload.source === 'KDS_KITCHEN' ? 'Kitchen' : 'Manager';
      setCancellationAlert({
        orderNumber: payload.orderNumber,
        actorName: payload.actorName,
        source: sourceLabel,
        reason: payload.reason
      });
    });

    // Dedicated appended items listener (card merging logic)
    socket.on('kds:items_appended', (payload: { orderId: string; orderNumber: string; tableNumber: string; items: any[] }) => {
      setTickets((prev) => {
        const orderExists = prev.some((t) => t.orderId === payload.orderId);
        if (orderExists) {
          const appendedTickets: KdsTicket[] = (payload.items || []).map((item: any) =>
            toTicket({
              ...item,
              orderId: payload.orderId,
              order: { orderNumber: payload.orderNumber, table: { tableNumber: payload.tableNumber } }
            })
          );
          return [...prev, ...appendedTickets];
        } else {
          // Missing card fallback: trigger clean queue refetch from PostgreSQL
          fetchQueue();
          return prev;
        }
      });

      setToastMessage(`✨ New items added to Order #${payload.orderNumber} (Table ${payload.tableNumber})!`);
      setTimeout(() => setToastMessage(null), 5000);
    });

    socket.on('kds:item_updated', (payload: { orderItemId: string; status: OrderItemStatus }) => {
      setTickets((prev) =>
        prev.map((t) => (t.id === payload.orderItemId ? { ...t, status: payload.status } : t))
      );
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [branchId, fetchQueue]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const handleBump = useCallback((ticket: KdsTicket) => {
    const nextStatus: OrderItemStatus | null =
      ticket.status === 'QUEUED' ? 'COOKING' : ticket.status === 'COOKING' ? 'BUMPED' : null;
    if (!nextStatus || !socketRef.current) return;

    setTickets((prev) => prev.map((t) => (t.id === ticket.id ? { ...t, status: nextStatus } : t)));
    socketRef.current.emit('kds:bump_item', { orderItemId: ticket.id, status: nextStatus });
  }, []);

  const handleCancelOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelTargetOrder || !cancelReason.trim()) {
      setCancelError('Please enter a cancellation reason.');
      return;
    }

    setCancelling(true);
    setCancelError('');

    try {
      await api.post(`/kds/orders/${cancelTargetOrder.orderId}/cancel`, {
        reason: cancelReason.trim()
      });
      setCancelTargetOrder(null);
      setCancelReason('');
    } catch (err: any) {
      setCancelError(err.response?.data?.message || 'Failed to cancel order.');
    } finally {
      setCancelling(false);
    }
  };

  const getMinutesElapsed = (ticket: KdsTicket) => {
    if (!ticket.timerStartedAt) return 0;
    return Math.max(0, Math.floor((now - new Date(ticket.timerStartedAt).getTime()) / 60000));
  };

  const filteredTickets = tickets.filter(
    (t) => stationFilter === 'ALL' || t.station === stationFilter
  );

  const getTimerBadge = (minutes: number) => {
    if (minutes > 15) return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
    if (minutes > 10) return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-6rem)] flex items-center justify-center text-zinc-400 text-sm gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
        <span>{t.kds.loadingTickets}</span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="h-[calc(100vh-6rem)] flex items-center justify-center">
        <div className="glass-panel p-6 rounded-2xl border border-rose-500/30 max-w-md text-center">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-3" />
          <p className="text-sm text-white font-semibold mb-1">{t.common.error}</p>
          <p className="text-xs text-zinc-400">{loadError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none font-sans max-w-7xl mx-auto">
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
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">
                {t.kdsDetail.cancelledAlert.replace('{number}', cancellationAlert.orderNumber)}
              </h3>
              <p className="text-xs text-zinc-300 mb-4">
                {t.kdsDetail.cancelledAlertSub.replace('{name}', cancellationAlert.actorName).replace('{source}', cancellationAlert.source)}
                <br />
                <span className="italic text-zinc-400">
                  {t.posVoid.cancelledReason.replace('{reason}', cancellationAlert.reason)}
                </span>
              </p>
              <button
                onClick={() => setCancellationAlert(null)}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30"
              >
                {t.kdsDetail.dismissAlert}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">{t.kds.title}</h1>
            <p className="text-xs text-zinc-400">{t.kds.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl p-1 text-xs">
            {['ALL', 'GRILL', 'COLD_PREP', 'BAR'].map((st) => (
              <button
                key={st}
                onClick={() => setStationFilter(st)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                  stationFilter === st
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {st === 'ALL' ? t.kds.allStations : (t.kds.stations as any)[st] || st}
              </button>
            ))}
          </div>

          {isConnected ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <Wifi className="w-3.5 h-3.5" />
              <span>{t.kds.connected}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
              <WifiOff className="w-3.5 h-3.5" />
              <span>{t.kds.disconnected}</span>
            </div>
          )}
        </div>
      </div>

      {/* Columns Grid: QUEUED vs COOKING vs BUMPED */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* QUEUED Column */}
        <div className="glass-panel p-4 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
            <h2 className="text-xs font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{t.kds.queued} ({filteredTickets.filter((t) => t.status === 'QUEUED').length})</span>
            </h2>
          </div>

          <div className="space-y-4">
            {filteredTickets
              .filter((t) => t.status === 'QUEUED')
              .map((ticket) => {
                const minutes = getMinutesElapsed(ticket);
                return (
                  <motion.div
                    key={ticket.id}
                    layout
                    className="glass-panel p-4 rounded-xl border border-white/10 flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-extrabold text-blue-400">{ticket.orderNumber}</span>
                        <h3 className="text-sm font-bold text-white">{t.tables.tableNumber} {ticket.tableNumber}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getTimerBadge(minutes)}`}>
                          {t.kds.minutesElapsed.replace('{m}', String(minutes))}
                        </span>
                        <button
                          onClick={() => setCancelTargetOrder({ orderId: ticket.orderId, orderNumber: ticket.orderNumber })}
                          className="p-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-all"
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-white">
                        {ticket.quantity}x {ticket.itemName}
                      </p>
                      {ticket.notes && <p className="text-[10px] text-amber-300 mt-1 italic">{t.kdsDetail.notePrefix}{ticket.notes}</p>}
                    </div>

                    <button
                      onClick={() => handleBump(ticket)}
                      className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-lg transition-all"
                    >
                      {t.kds.startCooking}
                    </button>
                  </motion.div>
                );
              })}
            {filteredTickets.filter((t) => t.status === 'QUEUED').length === 0 && (
              <p className="text-xs text-zinc-500 text-center py-6">{t.kdsDetail.noQueued}</p>
            )}
          </div>
        </div>

        {/* COOKING Column */}
        <div className="glass-panel p-4 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
            <h2 className="text-xs font-extrabold text-blue-400 uppercase tracking-wider flex items-center gap-2">
              <Flame className="w-4 h-4" />
              <span>{t.kds.cooking} ({filteredTickets.filter((t) => t.status === 'COOKING').length})</span>
            </h2>
          </div>

          <div className="space-y-4">
            {filteredTickets
              .filter((t) => t.status === 'COOKING')
              .map((ticket) => {
                const minutes = getMinutesElapsed(ticket);
                return (
                  <motion.div
                    key={ticket.id}
                    layout
                    className="glass-panel p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-extrabold text-blue-400">{ticket.orderNumber}</span>
                        <h3 className="text-sm font-bold text-white">{t.tables.tableNumber} {ticket.tableNumber}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getTimerBadge(minutes)}`}>
                          {t.kds.minutesElapsed.replace('{m}', String(minutes))}
                        </span>
                        <button
                          onClick={() => setCancelTargetOrder({ orderId: ticket.orderId, orderNumber: ticket.orderNumber })}
                          className="p-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-all"
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-white">
                        {ticket.quantity}x {ticket.itemName}
                      </p>
                      {ticket.notes && <p className="text-[10px] text-amber-300 mt-1 italic">{t.kdsDetail.notePrefix}{ticket.notes}</p>}
                    </div>

                    <button
                      onClick={() => handleBump(ticket)}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition-all"
                    >
                      {t.kds.bump}
                    </button>
                  </motion.div>
                );
              })}
            {filteredTickets.filter((t) => t.status === 'COOKING').length === 0 && (
              <p className="text-xs text-zinc-500 text-center py-6">{t.kdsDetail.noCooking}</p>
            )}
          </div>
        </div>

        {/* BUMPED / PASSED Column */}
        <div className="glass-panel p-4 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
            <h2 className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{t.kds.bumped} ({filteredTickets.filter((t) => t.status === 'BUMPED').length})</span>
            </h2>
          </div>

          <div className="space-y-4">
            {filteredTickets
              .filter((t) => t.status === 'BUMPED')
              .map((ticket) => (
                <motion.div
                  key={ticket.id}
                  layout
                  className="glass-panel p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 opacity-80"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-[10px] font-extrabold text-emerald-400">{ticket.orderNumber}</span>
                    <span className="text-[10px] font-bold text-emerald-300">{t.kdsDetail.readyForServer}</span>
                  </div>
                  <p className="text-xs font-semibold text-white">
                    {ticket.quantity}x {ticket.itemName} ({t.tables.tableNumber} {ticket.tableNumber})
                  </p>
                </motion.div>
              ))}
            {filteredTickets.filter((t) => t.status === 'BUMPED').length === 0 && (
              <p className="text-xs text-zinc-500 text-center py-6">{t.kdsDetail.noPassed}</p>
            )}
          </div>
        </div>
      </div>

      {/* KDS Kitchen Cancellation Confirmation Modal */}
      <AnimatePresence>
        {cancelTargetOrder && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel p-6 rounded-3xl border border-rose-500/30 max-w-md w-full shadow-2xl relative"
            >
              <button
                onClick={() => {
                  setCancelTargetOrder(null);
                  setCancelReason('');
                  setCancelError('');
                }}
                className="absolute top-4 right-4 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-2 border border-rose-500/30">
                  <Ban className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  {t.kdsDetail.cancelModalTitle.replace('{number}', cancelTargetOrder.orderNumber)}
                </h3>
                <p className="text-xs text-zinc-400">
                  {t.kdsDetail.cancelModalDesc}
                </p>
              </div>

              <form onSubmit={handleCancelOrderSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-zinc-300 block mb-1">
                    {t.kdsDetail.cancelReasonLabel}
                  </label>
                  <textarea
                    rows={3}
                    autoFocus
                    required
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder={t.kdsDetail.cancelReasonPlaceholder}
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500/50"
                  />
                </div>

                {cancelError && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px]">
                    {cancelError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCancelTargetOrder(null);
                      setCancelReason('');
                      setCancelError('');
                    }}
                    className="py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 font-bold text-xs border border-white/10"
                  >
                    {t.kdsDetail.btnKeepOrder}
                  </button>

                  <button
                    type="submit"
                    disabled={cancelling || !cancelReason.trim()}
                    className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bold text-xs shadow-lg shadow-rose-600/30 flex items-center justify-center gap-1.5 transition-all"
                  >
                    {cancelling && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{t.kdsDetail.btnConfirmCancel}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
