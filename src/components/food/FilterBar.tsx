import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { useFood } from './FoodContext';

export const FilterBar: React.FC = React.memo(() => {
  const {
    dietFilter,
    setDietFilter,
    selectedCuisine,
    setSelectedCuisine,
    localPreferenceMode,
    setLocalPreferenceMode
  } = useFood();

  return (
    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 font-sans">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1">
          <SlidersHorizontal className="w-3.5 h-3.5 text-rose-500" />
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Filters & Sort Options</span>
        </div>
        <span className="text-[10px] text-slate-400 font-bold font-mono">App Preference Synced</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Diet selection */}
        <div>
          <span className="block text-[8px] text-slate-400 font-black uppercase mb-1 font-mono">Diet Preference</span>
          <div className="flex bg-white rounded-xl border border-slate-200 p-0.5">
            {(['All', 'Veg', 'Non-Veg'] as const).map((pref) => (
              <button
                key={pref}
                type="button"
                onClick={() => setDietFilter(pref)}
                className={`flex-1 text-center py-1 text-[10px] font-bold rounded-lg transition cursor-pointer ${
                  dietFilter === pref
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {pref === 'Veg' ? '🟢 Veg' : pref === 'Non-Veg' ? '🔴 Non-Veg' : '🍽️ All'}
              </button>
            ))}
          </div>
        </div>

        {/* Cuisine selection */}
        <div>
          <span className="block text-[8px] text-slate-400 font-black uppercase mb-1 font-mono">Cuisine Type</span>
          <select
            value={selectedCuisine}
            onChange={(e) => setSelectedCuisine(e.target.value)}
            className="w-full bg-white border border-slate-200 text-xs px-2.5 py-1.5 rounded-xl text-slate-700 font-bold focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
          >
            <option value="All">All Cuisines</option>
            <option value="South Indian">South Indian Only</option>
            <option value="North Indian">North Indian Only</option>
            <option value="Pizza">Pizzas & Fast Food</option>
            <option value="Desserts">Sweet Treats & Coffee</option>
          </select>
        </div>
      </div>

      {/* Interactive Sort Row */}
      <div>
        <span className="block text-[8px] text-slate-400 font-black uppercase mb-1 font-mono">Sort Options</span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {[
            { val: 'cheapest', label: '💰 Cheapest First' },
            { val: 'fastest', label: '⚡ Fastest Duration' },
            { val: 'rated', label: '⭐ Highest Rating' },
            { val: 'ai', label: '🧠 Smart Recommended' }
          ].map(opt => (
            <button
              key={opt.val}
              type="button"
              onClick={() => setLocalPreferenceMode(opt.val)}
              className={`px-2 py-1.5 rounded-xl text-[10.5px] font-bold border transition text-center cursor-pointer ${
                localPreferenceMode === opt.val
                  ? 'bg-rose-500 border-rose-500 text-white shadow-xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});

FilterBar.displayName = 'FilterBar';
