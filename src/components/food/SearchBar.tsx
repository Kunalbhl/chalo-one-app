import React, { useCallback } from 'react';
import { Search } from 'lucide-react';
import { useFood } from './FoodContext';

export const SearchBar: React.FC = React.memo(() => {
  const {
    searchQuery,
    setSearchQuery,
    searchFocused,
    setSearchFocused,
    recentSearches,
    setRecentSearches
  } = useFood();

  const handleSearchSubmit = useCallback((val: string) => {
    setSearchQuery(val);
    setSearchFocused(false);
    setRecentSearches(prev => {
      const filtered = prev.filter(q => q.toLowerCase() !== val.toLowerCase());
      return [val, ...filtered].slice(0, 5);
    });
  }, [setSearchQuery, setSearchFocused, setRecentSearches]);

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2 bg-white p-2.5 rounded-2xl border border-gray-150 shadow-xs focus-within:border-rose-400 transition-all">
        <Search className="w-4.5 h-4.5 text-gray-400 shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onFocus={() => setSearchFocused(true)}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearchSubmit(searchQuery);
            }
          }}
          placeholder="Search Biryani, Butter Chicken, Pizzas, Cafe Coffee..."
          id="food_search_input"
          className="w-full text-xs outline-none font-medium placeholder-gray-400 font-sans"
        />
        {(searchQuery || searchFocused) && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSearchFocused(false);
            }}
            className="text-gray-500 hover:text-gray-800 text-[10px] font-extrabold px-1.5 font-mono uppercase cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      {searchFocused && (
        <div className="bg-rose-50/55 rounded-2xl border border-rose-100 p-3 space-y-2.5 animate-in fade-in duration-250">
          {recentSearches.length > 0 && (
            <div>
              <span className="text-[8px] font-black text-rose-800 uppercase tracking-widest block mb-1 font-mono">⏰ Recent Searches</span>
              <div className="flex flex-wrap gap-1">
                {recentSearches.map((term, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSearchSubmit(term)}
                    className="px-2.5 py-1 bg-white hover:bg-rose-50 text-[10px] font-bold text-gray-750 border border-rose-100 rounded-lg cursor-pointer transition"
                  >
                    🍔 {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <span className="text-[8px] font-black text-amber-800 uppercase tracking-widest block mb-1 font-mono">🔥 Trending Suggestions</span>
            <div className="flex flex-wrap gap-1">
              {['Biryani Deal 🍱', 'Paneer Butter 🧀', 'Loaded Pizza 🍕', 'Fries 🍟', 'Zepto Cafe ☕'].map((term, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSearchSubmit(term.replace(/ [^ ]+$/, ''))}
                  className="px-2.5 py-1 bg-white hover:bg-rose-50 text-[10px] font-extrabold text-amber-900 border border-gray-150 rounded-lg cursor-pointer transition"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

SearchBar.displayName = 'SearchBar';
