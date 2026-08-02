'use client';

import React, { useState } from 'react';
import { 
  Utensils, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  DollarSign, 
  CheckCircle2, 
  Printer, 
  Grid3X3, 
  Receipt,
  X,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const sampleDishes = [
  { id: 'dish-1', name: 'A5 Miyazaki Wagyu Ribeye', price: 125.00, category: 'Prime Steaks', station: 'GRILL', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80' },
  { id: 'dish-2', name: 'Black Truffle Risotto', price: 38.00, category: 'Chef Signatures', station: 'GRILL', image: 'https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?auto=format&fit=crop&w=400&q=80' },
  { id: 'dish-3', name: 'Ora King Salmon', price: 42.00, category: 'Chef Signatures', station: 'GRILL', image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=400&q=80' },
  { id: 'dish-4', name: 'Yellowfin Tuna Tartare', price: 26.00, category: 'Appetizers', station: 'COLD_PREP', image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=400&q=80' },
  { id: 'dish-5', name: 'Smoked Bourbon Old Fashioned', price: 22.00, category: 'Cocktails', station: 'BAR', image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=400&q=80' }
];

const tables = [
  { number: 'T-01', status: 'OCCUPIED', seats: 2 },
  { number: 'T-02', status: 'BILL_REQUESTED', seats: 4 },
  { number: 'T-03', status: 'AVAILABLE', seats: 4 },
  { number: 'T-04', status: 'RESERVED', seats: 6 },
  { number: 'T-05', status: 'OCCUPIED', seats: 2 },
  { number: 'T-06', status: 'AVAILABLE', seats: 4 }
];

export default function PosPage() {
  const [selectedTable, setSelectedTable] = useState('T-01');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<Array<{ dish: typeof sampleDishes[0]; quantity: number }>>([
    { dish: sampleDishes[0], quantity: 1 },
    { dish: sampleDishes[4], quantity: 2 }
  ]);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [tipPercent, setTipPercent] = useState(18);

  const filteredDishes = sampleDishes.filter((d) => {
    const matchesCategory = selectedCategory === 'ALL' || d.category === selectedCategory;
    const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (dish: typeof sampleDishes[0]) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.dish.id === dish.id);
      if (existing) {
        return prev.map((item) =>
          item.dish.id === dish.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { dish, quantity: 1 }];
    });
  };

  const updateQuantity = (dishId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.dish.id === dishId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as any
    );
  };

  const subtotal = cart.reduce((sum, item) => sum + item.dish.price * item.quantity, 0);
  const tax = Math.round(subtotal * 0.08875 * 100) / 100;
  const tip = Math.round(subtotal * (tipPercent / 100) * 100) / 100;
  const total = Math.round((subtotal + tax + tip) * 100) / 100;

  return (
    <div className="h-[calc(100vh-6rem)] flex gap-6 select-none">
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
              key={tbl.number}
              onClick={() => setSelectedTable(tbl.number)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all shrink-0 ${
                selectedTable === tbl.number
                  ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-600/30'
                  : 'bg-white/5 border-white/10 text-zinc-300 hover:border-white/20'
              }`}
            >
              {tbl.number} ({tbl.seats} Seats)
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
            {['ALL', 'Prime Steaks', 'Chef Signatures', 'Appetizers', 'Cocktails'].map((cat) => (
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
                <img
                  src={dish.image}
                  alt={dish.name}
                  className="w-full h-32 object-cover rounded-xl mb-3 border border-white/5"
                />
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="text-xs font-bold text-white leading-snug">{dish.name}</h3>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    {dish.station}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400">{dish.category}</p>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
                <span className="text-sm font-extrabold text-emerald-400">${dish.price.toFixed(2)}</span>
                <button
                  onClick={() => addToCart(dish)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/30 flex items-center gap-1 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Item</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Right Column: Order Bill Cart */}
      <div className="w-96 glass-panel p-5 rounded-2xl border border-white/10 flex flex-col justify-between">
        <div>
          {/* Cart Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-blue-400" />
                <span>Active Order Cart</span>
              </h2>
              <p className="text-[10px] text-zinc-400">Assigned to Table {selectedTable}</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              DINE_IN
            </span>
          </div>

          {/* Cart Items List */}
          <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
            {cart.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-8">Cart is empty. Tap menu items to add.</p>
            ) : (
              cart.map((item) => (
                <div
                  key={item.dish.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5"
                >
                  <div className="flex-1 pr-2">
                    <p className="text-xs font-semibold text-white leading-tight">{item.dish.name}</p>
                    <p className="text-[10px] text-emerald-400 mt-0.5">
                      ${(item.dish.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.dish.id, -1)}
                      className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-300"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold text-white w-4 text-center">{item.quantity}</span>
                    <button
                      onClick={() => addToCart(item.dish)}
                      className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-300"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
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

          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              onClick={() => setShowCheckoutModal(true)}
              className="py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center gap-1.5 transition-all"
            >
              <CreditCard className="w-4 h-4" />
              <span>Settle Payment</span>
            </button>

            <button
              onClick={() => setShowReceiptModal(true)}
              className="py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/10 flex items-center justify-center gap-1.5 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print Receipt</span>
            </button>
          </div>
        </div>
      </div>

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
                <p className="text-xs text-zinc-400">Select payment method for Table {selectedTable}</p>
              </div>

              <div className="space-y-3 mb-6">
                {['APPLE_PAY', 'CREDIT_CARD', 'CASH', 'GIFT_CARD'].map((pm) => (
                  <button
                    key={pm}
                    onClick={() => {
                      setShowCheckoutModal(false);
                      setShowReceiptModal(true);
                    }}
                    className="w-full p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white flex items-center justify-between transition-colors"
                  >
                    <span>{pm.replace('_', ' ')}</span>
                    <span className="text-emerald-400 font-bold">${total.toFixed(2)}</span>
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
                onClick={() => setShowReceiptModal(false)}
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
                <p>Order: #ORD-{Date.now().toString().slice(-6)}</p>
                <p>Table: {selectedTable} | Staff: Waiter Lucas</p>
                <p>Date: {new Date().toLocaleString()}</p>
              </div>

              <div className="space-y-2 py-3 border-y border-dashed border-zinc-400 mb-4 text-[11px]">
                {cart.map((item) => (
                  <div key={item.dish.id} className="flex justify-between">
                    <span>{item.quantity}x {item.dish.name}</span>
                    <span>${(item.dish.price * item.quantity).toFixed(2)}</span>
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
                <p>Thank you for dining at Aura!</p>
                <p>*** Merchant Copy ***</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
