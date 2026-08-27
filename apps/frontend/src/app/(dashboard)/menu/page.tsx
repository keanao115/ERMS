'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { BookOpen, Plus, Loader2, AlertCircle, X, EyeOff, Eye } from 'lucide-react';
import { api, getAuthUser } from '@/lib/api';
import { useLocale } from '@/contexts/LocaleContext';

interface MenuItem {
  id: string;
  name: string;
  description?: string | null;
  basePrice: number;
  station: string;
  isAvailable: boolean;
  ingredients: { ingredient: { name: string } }[];
}

interface Category {
  id: string;
  name: string;
  menuItems: MenuItem[];
}

const STATIONS = ['GRILL', 'COLD_PREP', 'BAR'];

export default function MenuPage() {
  const { t } = useLocale();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');
  const [busyItemId, setBusyItemId] = useState<string | null>(null);

  const [form, setForm] = useState({ categoryId: '', name: '', description: '', basePrice: '', station: 'GRILL' });

  const restaurantId = getAuthUser()?.restaurantId ?? null;

  const fetchMenu = useCallback(async () => {
    if (!restaurantId) {
      setLoadError(t.menu.noCategory);
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/menu/categories', { params: { restaurantId } });
      setCategories(res.data);
      setLoadError('');
      if (res.data.length > 0) {
        setForm((f) => (f.categoryId ? f : { ...f, categoryId: res.data[0].id }));
      }
    } catch (err: any) {
      setLoadError(
        err.response?.data?.message || t.common.error
      );
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId, t]);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!form.categoryId || !form.name || !form.basePrice) {
      setFormError(t.menu.modal.namePlaceholder);
      return;
    }
    setCreating(true);
    try {
      await api.post('/menu/items', {
        categoryId: form.categoryId,
        name: form.name,
        description: form.description,
        basePrice: parseFloat(form.basePrice),
        station: form.station
      });
      setShowCreate(false);
      setForm((f) => ({ ...f, name: '', description: '', basePrice: '' }));
      await fetchMenu();
    } catch (err: any) {
      setFormError(err.response?.data?.message || t.common.error);
    } finally {
      setCreating(false);
    }
  };

  const toggleAvailability = async (item: MenuItem) => {
    setBusyItemId(item.id);
    try {
      await api.patch(`/menu/items/${item.id}/availability`, { isAvailable: !item.isAvailable });
      await fetchMenu();
    } catch {
      // silently ignore; next refresh will reconcile state
    } finally {
      setBusyItemId(null);
    }
  };

  const allItems = categories.flatMap((c) => c.menuItems.map((item) => ({ ...item, categoryName: c.name })));

  if (loading) {
    return (
      <div className="h-[calc(100vh-6rem)] flex items-center justify-center text-zinc-400 text-sm gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>{t.menu.loadingMenu}</span>
      </div>
    );
  }

  if (loadError && categories.length === 0) {
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
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{t.menu.title}</h1>
          <p className="text-xs text-zinc-400 mt-1">{t.menu.subtitle}</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          disabled={categories.length === 0}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t.menu.createDish}</span>
        </button>
      </div>

      {categories.length === 0 && (
        <p className="text-xs text-zinc-500 text-center py-10">{t.menu.noCategory}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allItems.map((dish) => (
          <div
            key={dish.id}
            className={`glass-panel p-5 rounded-2xl border flex flex-col justify-between transition-all ${
              dish.isAvailable ? 'border-white/10' : 'border-rose-500/30 opacity-60'
            }`}
          >
            <div>
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-sm font-bold text-white leading-tight">{dish.name}</h3>
                <span className="text-sm font-extrabold text-emerald-400">${dish.basePrice.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  {(t.kds.stations as any)[dish.station] || dish.station}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-zinc-400 border border-white/10">
                  {dish.categoryName}
                </span>
                {!dish.isAvailable && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    {t.menu.itemUnavailable}
                  </span>
                )}
              </div>

              {dish.ingredients.length > 0 && (
                <div className="mt-4 pt-3 border-t border-white/10">
                  <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider mb-1.5">{t.menu.mappedIngredients}</p>
                  <div className="flex flex-wrap gap-1">
                    {dish.ingredients.map((ing, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-zinc-300">
                        {ing.ingredient.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => toggleAvailability(dish)}
              disabled={busyItemId === dish.id}
              className="mt-4 pt-3 border-t border-white/10 flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
            >
              {busyItemId === dish.id ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : dish.isAvailable ? (
                <EyeOff className="w-3 h-3" />
              ) : (
                <Eye className="w-3 h-3" />
              )}
              <span>{dish.isAvailable ? t.menu.markUnavailable : t.menu.markAvailable}</span>
            </button>
          </div>
        ))}
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel rounded-2xl border border-white/10 max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-400" />
                <h2 className="text-base font-semibold text-white">{t.menu.createDish}</h2>
              </div>
              <button onClick={() => setShowCreate(false)} className="text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-[11px] text-zinc-400 font-medium">{t.menu.modal.categoryLabel}</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id} className="bg-zinc-900">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-zinc-400 font-medium">{t.menu.modal.nameLabel}</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50"
                  placeholder={t.menu.modal.namePlaceholder}
                />
              </div>
              <div>
                <label className="text-[11px] text-zinc-400 font-medium">{t.menu.modal.descLabel}</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50"
                  placeholder={t.menu.modal.descPlaceholder}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-zinc-400 font-medium">{t.menu.modal.priceLabel}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.basePrice}
                    onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
                    className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-400 font-medium">{t.menu.modal.stationLabel}</label>
                  <select
                    value={form.station}
                    onChange={(e) => setForm({ ...form, station: e.target.value })}
                    className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50"
                  >
                    {STATIONS.map((s) => (
                      <option key={s} value={s} className="bg-zinc-900">
                        {(t.kds.stations as any)[s] || s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {formError && <p className="text-xs text-rose-400">{formError}</p>}

              <button
                type="submit"
                disabled={creating}
                className="w-full mt-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all"
              >
                {creating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{creating ? t.menu.modal.saving : t.menu.modal.submit}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

