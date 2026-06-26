import React, { useState } from 'react';
import { OngoingActivity } from '../types';
import { PlayCircle, Clock, MapPin, Search, Calendar, Heart, ArrowUpRight, CheckCircle2, ChevronRight, Fuel } from 'lucide-react';

interface ActivityCenterProps {
  activityList: OngoingActivity[];
  cancelActivity: (id: string) => void;
  onActivityClick?: (category: 'rides' | 'food' | 'mart' | 'stays' | 'intercity') => void;
}

export default function ActivityCenter({ activityList, cancelActivity, onActivityClick }: ActivityCenterProps) {
  const [activeTab, setActiveTab] = useState<'ongoing' | 'history'>('ongoing');
  const [searchVal, setSearchVal] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>(['Uber', 'Swiggy', 'Biryani']);
  const [searchFocused, setSearchFocused] = useState(false);

  const handleTimelineSearch = (val: string) => {
    setSearchVal(val);
    setSearchFocused(false);
    setRecentSearches(prev => {
      const filtered = prev.filter(q => q.toLowerCase() !== val.toLowerCase());
      return [val, ...filtered].slice(0, 5);
    });
  };

  const ongoingItems = activityList.filter(item => item.status === 'ongoing');
  const historyItems = activityList.filter(item => item.status === 'completed' || item.status === 'cancelled');

  const filteredOngoing = ongoingItems.filter(item => 
    item.title.toLowerCase().includes(searchVal.toLowerCase()) || 
    (item.subtitle && item.subtitle.toLowerCase().includes(searchVal.toLowerCase()))
  );

  const filteredHistory = historyItems.filter(item => 
    item.title.toLowerCase().includes(searchVal.toLowerCase()) || 
    (item.subtitle && item.subtitle.toLowerCase().includes(searchVal.toLowerCase()))
  );

  return (
    <div id="activity_center_container" className="p-4 max-w-xl mx-auto space-y-4 font-sans text-gray-800">
      <div className="flex border-b border-gray-150 shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab('ongoing')}
          className={`flex-1 py-2.5 font-display font-semibold text-xs tracking-wider uppercase border-b-2 transition ${
            activeTab === 'ongoing' ? 'border-amber-500 text-amber-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          📍 Active Journeys & Orders
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2.5 font-display font-semibold text-xs tracking-wider uppercase border-b-2 transition ${
            activeTab === 'history' ? 'border-amber-500 text-amber-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          📜 Transaction History
        </button>
      </div>

      {/* Smart search timeline filter */}
      <div className="space-y-1.5">
        <div className="relative flex items-center bg-gray-50 border border-gray-150 p-2.5 rounded-xl">
          <Search className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
          <input
            type="text"
            value={searchVal}
            onFocus={() => setSearchFocused(true)}
            onChange={(e) => setSearchVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleTimelineSearch(searchVal);
              }
            }}
            placeholder="Search items, platforms, restaurants ..."
            id="activity_timeline_search"
            className="w-full bg-transparent text-xs outline-none font-medium text-gray-700"
          />
          {(searchVal || searchFocused) && (
            <button
              type="button"
              onClick={() => {
                setSearchVal('');
                setSearchFocused(false);
              }}
              className="text-gray-400 hover:text-gray-700 text-[10px] uppercase font-black tracking-tight"
            >
              Clear
            </button>
          )}
        </div>

        {/* Focus recommendations with no-mixing parameters for Timeline records */}
        {searchFocused && (
          <div className="bg-amber-50/45 rounded-xl border border-amber-150 p-3 space-y-2.5">
            {recentSearches.length > 0 && (
              <div>
                <span className="text-[8px] font-black text-amber-850 uppercase tracking-widest block mb-1 font-mono">⏰ Recent Timeline Searches</span>
                <div className="flex flex-wrap gap-1">
                  {recentSearches.map((term, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleTimelineSearch(term)}
                      className="px-2 py-0.5 bg-white hover:bg-amber-50 text-[10px] font-bold text-gray-750 border border-amber-150 rounded-lg cursor-pointer transition"
                    >
                      📋 {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <span className="text-[8px] font-black text-indigo-800 uppercase tracking-widest block mb-1 font-mono">🔍 Filter by Category:</span>
              <div className="flex flex-wrap gap-1">
                {['Uber rides 🚗', 'Blinkit store 🛒', 'Zomato food 🍔', 'Hotel stay 🏨'].map((term, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleTimelineSearch(term.replace(/ [^ ]+$/, ''))}
                    className="px-2.5 py-0.5 bg-white hover:bg-indigo-50 text-[10px] font-extrabold text-blue-900 border border-gray-150 rounded-lg cursor-pointer transition"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {activeTab === 'ongoing' ? (
        <div className="space-y-4 animate-fade-in">
          {filteredOngoing.length > 0 ? (
            filteredOngoing.map((item) => (
              <div 
                key={item.id} 
                onClick={() => onActivityClick?.(item.category)}
                className="bg-white rounded-2xl border border-gray-150 p-4 space-y-3.5 shadow-sm relative overflow-hidden cursor-pointer hover:border-amber-400 hover:shadow-md transition-all group"
                title="Click to view comparative details"
              >
                {/* Yellow light pulse animation on ongoing card */}
                <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>

                <div className="flex justify-between items-start pl-1">
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[9.5px] bg-amber-100 text-amber-700 font-extrabold px-1.5 py-0.2 rounded uppercase tracking-wider font-mono">
                        {item.platform}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">ID: {item.id}</span>
                    </div>
                    <h4 className="text-sm font-semibold text-gray-900 mt-1 font-display tracking-tight leading-snug group-hover:text-amber-600 transition-colors">{item.title}</h4>
                    {item.subtitle && <p className="text-xs text-gray-500 mt-0.5 leading-snug">{item.subtitle}</p>}
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-mono font-extrabold text-gray-950 block">₹{item.amount}</span>
                    {item.eta && (
                      <span className="text-[10px] bg-gray-100 text-gray-600 font-bold font-mono px-2 py-0.5 rounded-sm inline-block mt-1">
                        ETA: {item.eta}
                      </span>
                    )}
                  </div>
                </div>

                {/* Ride specific metadata simulation: OTP validation and map tracker graphics */}
                {item.category === 'rides' && (
                  <div className="bg-gray-50 p-3 rounded-xl space-y-2 border border-gray-150 text-[11px] font-medium text-gray-700">
                    <div className="flex justify-between items-center text-xs pb-1.5 border-b border-gray-100">
                      <span className="text-gray-400">Driver verification code:</span>
                      <span className="font-mono bg-indigo-100 text-indigo-800 font-black px-2.5 py-0.5 rounded text-sm animate-pulse">
                        OTP {item.otpConfirm || '9912'}
                      </span>
                    </div>

                    <div className="flex items-start space-x-2">
                      <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5 animate-bounce" />
                      <div>
                        <span className="text-[9.5px] text-gray-400 block font-bold">ROUTE MONITOR</span>
                        <span className="leading-normal">{item.routeString || 'Your driver is heading towards pickup hotspot point...'}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center pt-1.5 pl-1">
                  <span className="text-[10.5px] text-emerald-600 font-bold flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1" />
                    {item.time} ({item.date})
                  </span>

                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] text-amber-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                      View Details ➔
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        cancelActivity(item.id);
                      }}
                      className="text-red-500 hover:text-red-700 border border-transparent hover:border-red-150 px-3 py-1 rounded text-[11px] font-bold transition-all cursor-pointer relative z-10"
                    >
                      Cancel Booking
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center bg-gray-50 border border-gray-150 rounded-2xl">
              <Fuel className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-gray-600">No active rides or orders</h3>
              <p className="text-xs text-gray-400 mt-1">Book a comparative ride or checkout food items in the super-app catalog</p>
            </div>
          )}
        </div>
      ) : (
        /* Completed historic transactions */
        <div className="space-y-3 animate-fade-in">
          {filteredHistory.length > 0 ? (
            filteredHistory.map((item) => (
              <div 
                key={item.id} 
                onClick={() => onActivityClick?.(item.category)}
                className="bg-white rounded-xl border border-gray-150 p-3.5 hover:bg-gray-50 hover:border-amber-400 transition flex justify-between items-center text-xs cursor-pointer group"
                title="Click to view comparative details"
              >
                <div className="space-y-1 pr-2">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[9.5px] bg-gray-100 text-gray-600 font-bold px-1.5 py-0.2 rounded uppercase font-mono">
                      {item.platform}
                    </span>
                    <span className="text-[9.5px] text-gray-400 font-mono">ID: {item.id}</span>
                  </div>
                  <h4 className="font-bold text-gray-900 leading-tight group-hover:text-amber-600 transition-colors">{item.title}</h4>
                  {item.subtitle && <p className="text-[10.5px] text-gray-400 font-medium leading-none">{item.subtitle}</p>}
                  <p className="text-[9.5px] text-gray-400 font-semibold">{item.time} • {item.date}</p>
                </div>

                <div className="text-right font-mono text-xs shrink-0 pl-1 flex flex-col items-end">
                  <span className="font-black text-gray-950 block">₹{item.amount}</span>
                  <div className="flex items-center space-x-1.5 mt-1">
                    <span className="text-[9px] text-amber-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                      View Details ➔
                    </span>
                    <span className={`text-[9.5px] font-bold block uppercase ${
                      item.status === 'completed' ? 'text-emerald-600' : 'text-red-500'
                    }`}>
                      {item.status === 'completed' ? 'Success' : 'Cancelled'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center bg-gray-50 border border-gray-150 rounded-2xl">
              <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-400 mt-1">No comparative order transaction histories found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
