'use client';

import React from 'react';
import { BookOpen, Plus, Sparkles, ChefHat } from 'lucide-react';

const menuList = [
  { name: 'Black Truffle Wild Mushroom Risotto', price: '$38.00', station: 'GRILL', category: 'Chef Signatures', ingredients: ['Truffle Butter', 'Carnaroli Rice', 'Parmigiano'] },
  { name: 'A5 Miyazaki Wagyu Ribeye', price: '$125.00', station: 'GRILL', category: 'Prime Steaks', ingredients: ['A5 Wagyu Beef', 'Bone Marrow Glaze', 'Maldon Salt'] },
  { name: 'Pan-Seared Ora King Salmon', price: '$42.00', station: 'GRILL', category: 'Chef Signatures', ingredients: ['Ora King Salmon', 'Citrus Velouté', 'Sunchoke'] },
  { name: 'Yellowfin Tuna Tartare', price: '$26.00', station: 'COLD_PREP', category: 'Appetizers', ingredients: ['Yellowfin Tuna', 'Avocado', 'Yuzu Ponzu'] },
  { name: 'Smoked Bourbon Old Fashioned', price: '$22.00', station: 'BAR', category: 'Cocktails', ingredients: ['Single Barrel Bourbon', 'Angostura', 'Cherrywood'] }
];

export default function MenuPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Menu & Recipe Specifications</h1>
          <p className="text-xs text-zinc-400 mt-1">Dish Configuration with Kitchen Station Routing & Ingredient Mappings</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all">
          <Plus className="w-3.5 h-3.5" />
          <span>Create New Dish</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuList.map((dish) => (
          <div key={dish.name} className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-sm font-bold text-white leading-tight">{dish.name}</h3>
                <span className="text-sm font-extrabold text-emerald-400">{dish.price}</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                {dish.station}
              </span>

              <div className="mt-4 pt-3 border-t border-white/10">
                <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider mb-1.5">Mapped Recipe Ingredients:</p>
                <div className="flex flex-wrap gap-1">
                  {dish.ingredients.map((ing) => (
                    <span key={ing} className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-zinc-300">
                      {ing}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
