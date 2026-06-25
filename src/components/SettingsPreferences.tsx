import React, { useState } from 'react';
import { AppPreferences, ConnectedAccounts } from '../types';
import { Settings, Link2, Link2Off, Sliders, ToggleLeft, ToggleRight, Check, AlertCircle, Sparkles, ArrowRight, UserCheck } from 'lucide-react';

interface SettingsPreferencesProps {
  preferences: AppPreferences;
  savePreferences: (pref: AppPreferences) => void;
  connections: ConnectedAccounts;
  setConnectionsAndSave: (conn: ConnectedAccounts) => void;
}

export default function SettingsPreferences({
  preferences,
  savePreferences,
  connections,
  setConnectionsAndSave
}: SettingsPreferencesProps) {
  const [prefMode, setPrefMode] = useState<'cheapest' | 'fastest' | 'rated' | 'favorites' | 'ai'>(preferences.preferenceMode);
  const [foodPrio, setFoodPrio] = useState<string[]>(preferences.food);
  const [martPrio, setMartPrio] = useState<string[]>(preferences.mart);
  const [ridesPrio, setRidesPrio] = useState<string[]>(preferences.rides);
  const [successSaved, setSuccessSaved] = useState(false);

  // Link third party accounts simulator
  const toggleConnection = (brand: keyof ConnectedAccounts) => {
    const nextState = { ...connections, [brand]: !connections[brand] };
    setConnectionsAndSave(nextState);
    
    // Toast alert simulating auth linking safely
    const action = nextState[brand] ? "Connected" : "Disconnected";
    alert(`🔐 Chalo One Account Linker: ${brand.toUpperCase()} account has been successfully ${action}! Credentials synced and secured under standard OAuth rules.`);
  };

  const handleSave = (mode: typeof prefMode) => {
    setPrefMode(mode);
    savePreferences({
      preferenceMode: mode,
      food: foodPrio,
      mart: martPrio,
      rides: ridesPrio,
      stays: preferences.stays // leave stay ranking as is
    });

    setSuccessSaved(true);
    setTimeout(() => setSuccessSaved(false), 2000);
  };

  // Move items in category ranking prioritizer up
  const rankUp = (category: 'food' | 'mart' | 'rides', index: number) => {
    if (index === 0) return;
    
    if (category === 'food') {
      const nextArr = [...foodPrio];
      const temp = nextArr[index - 1];
      nextArr[index - 1] = nextArr[index];
      nextArr[index] = temp;
      setFoodPrio(nextArr);
      savePreferences({ ...preferences, food: nextArr });
    } else if (category === 'mart') {
      const nextArr = [...martPrio];
      const temp = nextArr[index - 1];
      nextArr[index - 1] = nextArr[index];
      nextArr[index] = temp;
      setMartPrio(nextArr);
      savePreferences({ ...preferences, mart: nextArr });
    } else {
      const nextArr = [...ridesPrio];
      const temp = nextArr[index - 1];
      nextArr[index - 1] = nextArr[index];
      nextArr[index] = temp;
      setRidesPrio(nextArr);
      savePreferences({ ...preferences, rides: nextArr });
    }
  };

  return (
    <div id="preferences_module_container" className="p-4 max-w-xl mx-auto space-y-4 font-sans text-gray-800">
      <div className="flex items-center space-x-2 pb-2">
        <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
          <Settings className="w-6 h-6 animate-spin" style={{ animationDuration: '6s' }} />
        </div>
        <div>
          <h2 className="text-xl font-display font-semibold tracking-tight text-gray-900">App Preference Engine</h2>
          <p className="text-xs text-gray-500">Configure connected account cards + customize platform prioritization algorithms</p>
        </div>
      </div>

      {/* 1. Account Connections Manager */}
      <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-xs space-y-3.5">
        <div className="flex items-center space-x-1">
          <UserCheck className="w-4.5 h-4.5 text-gray-600" />
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Connect Partner Accounts</h3>
        </div>
        <p className="text-[11px] text-gray-500 font-medium">
          Once your account is linked via secure authorization APIs, Chalo One can retrieve member loyalty profiles, passcodes, and apply corporate vouchers automatically!
        </p>

        <div className="grid grid-cols-2 gap-2.5 pt-1">
          {Object.entries(connections).map(([brand, linked]) => (
            <div
              key={brand}
              className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                linked ? 'bg-indigo-50/50 border-indigo-200' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div>
                <span className="text-xs font-bold uppercase tracking-tight text-gray-800">{brand}</span>
                <span className="block text-[9px] text-gray-400 font-medium mt-0.2">
                  {linked ? '✓ linked & auto login' : 'disconected'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => toggleConnection(brand as keyof ConnectedAccounts)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  linked ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                {linked ? <Link2 className="w-4 h-4" /> : <Link2Off className="w-4 h-4" />}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Global preference modes selection */}
      <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-xs space-y-3.5">
        <div className="flex items-center space-x-1">
          <Sliders className="w-4.5 h-4.5 text-amber-500" />
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Smart prioritization mode</h3>
        </div>

        <div className="space-y-2">
          {(['cheapest', 'fastest', 'rated', 'favorites', 'ai'] as const).map((mode) => {
            const isSelected = prefMode === mode;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => handleSave(mode)}
                className={`w-full text-left p-3 rounded-xl border transition-all flex items-start justify-between cursor-pointer ${
                  isSelected 
                    ? 'bg-amber-100/30 border-amber-400 ring-1 ring-amber-400/50' 
                    : 'bg-white border-gray-150 hover:bg-slate-50'
                }`}
              >
                <div className="space-y-0.5">
                  <span className="text-xs font-bold uppercase tracking-tight text-gray-900 font-mono">
                    {mode === 'cheapest' && '💰 Cheapest First'}
                    {mode === 'fastest' && '⚡ Fastest Delivery / Travel Time'}
                    {mode === 'rated' && '⭐ Safest / Highest Customer Ratings'}
                    {mode === 'favorites' && '❤️ Rank prioritizing Favorite Apps'}
                    {mode === 'ai' && '🤖 AI Behavior-Prediction Recommended'}
                  </span>
                  <p className="text-[10.5px] text-gray-500">
                    {mode === 'cheapest' && 'Examines final cart prices including delivery fees and auto coupon discounts.'}
                    {mode === 'fastest' && 'Sorts restaurants, grocery lists, and cabs by lowest arrival ETA minutes.'}
                    {mode === 'rated' && 'Guards safety by prioritizing highly-rated riders (4.7+ ★) and stellar hotels.'}
                    {mode === 'favorites' && 'Positions platforms strictly matching your manual custom category sorting list below.'}
                    {mode === 'ai' && 'Learns buying parameters. Usually prefers Blinkit at 8PM, Uber for morning airport cabs.'}
                  </p>
                </div>

                <div className="pt-0.5 shrink-0 pl-3">
                  {isSelected ? (
                    <div className="w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  ) : (
                    <div className="w-4 h-4 border border-gray-300 rounded-full"></div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Saved Success Note popup */}
        {successSaved && (
          <div className="p-2.5 bg-emerald-50 text-emerald-700 border border-emerald-150 rounded-xl text-center text-xs font-bold font-mono">
            🎉 Preference Saved Successfully & Synced to Chalo One Firestore!
          </div>
        )}
      </div>

      {/* 3. Manual preference rankings (Drag/reorder list UI representation) */}
      <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-xs space-y-4">
        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Manual Priority Ranking</h3>
          <p className="text-[10.5px] text-gray-500 mt-1">
            Toggle ranking positions. The uppermost layout in each category holds top priority in "Favorite Apps" comparisons.
          </p>
        </div>

        {/* Food order */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block font-mono pl-0.5">🍔 Food Priorities</span>
          <div className="space-y-1">
            {foodPrio.map((p, idx) => (
              <div key={p} className="flex items-center justify-between p-2 px-3 rounded-lg bg-gray-50 border border-gray-150 text-xs font-bold">
                <span>{idx + 1}. {p}</span>
                {idx > 0 && (
                  <button
                    type="button"
                    onClick={() => rankUp('food', idx)}
                    className="text-[10px] text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded cursor-pointer font-mono"
                  >
                    MOVE UP ▲
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Mart order */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block font-mono pl-0.5">🛒 Mart Priorities</span>
          <div className="space-y-1">
            {martPrio.map((p, idx) => (
              <div key={p} className="flex items-center justify-between p-2 px-3 rounded-lg bg-gray-50 border border-gray-150 text-xs font-bold">
                <span>{idx + 1}. {p}</span>
                {idx > 0 && (
                  <button
                    type="button"
                    onClick={() => rankUp('mart', idx)}
                    className="text-[10px] text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded cursor-pointer font-mono"
                  >
                    MOVE UP ▲
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Rides order */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block font-mono pl-0.5">🚕 Rides Priorities</span>
          <div className="space-y-1">
            {ridesPrio.map((p, idx) => (
              <div key={p} className="flex items-center justify-between p-2 px-3 rounded-lg bg-gray-50 border border-gray-150 text-xs font-bold">
                <span>{idx + 1}. {p}</span>
                {idx > 0 && (
                  <button
                    type="button"
                    onClick={() => rankUp('rides', idx)}
                    className="text-[10px] text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded cursor-pointer font-mono"
                  >
                    MOVE UP ▲
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
