import React, { useState, useEffect } from 'react';
import { Address } from '../types';
import { 
  Clock, 
  MapPin, 
  AlertTriangle, 
  Car, 
  TrendingUp, 
  Sparkles, 
  CheckCircle, 
  Briefcase, 
  RefreshCw, 
  ArrowRight,
  Settings,
  AlertCircle,
  Activity,
  CloudRain,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const MOCK_ADDRESS_SUGGESTIONS = [
  "Prestige Tech Park, Outer Ring Road, Kadubeesanahalli, Bengaluru, Karnataka 560103",
  "Indiranagar Double Road, Stage 2, Hoysala Nagar, Bengaluru, Karnataka 560038",
  "Manyata Tech Park, Hebbal Outer Ring Road, Nagawara, Bengaluru, Karnataka 560045",
  "Chhatrapati Shivaji Maharaj International Airport, Sahar, Andheri East, Mumbai, Maharashtra 400099",
  "Bandrakurla Complex (BKC), G Block, Bandra East, Mumbai, Maharashtra 400051",
  "Connaught Place, Radial Road 1, Block E, New Delhi, Delhi 110001",
  "Hitec City, Madhapur, Hyderabad, Telangana 500081",
  "DLF Cyber City, Phase 3, Sector 24, Gurugram, Haryana 122002",
  "Whitefield Main Road, Pattandur Agrahara, Bengaluru, Karnataka 560066",
  "Koramangala 4th Block, 80 Feet Road, Bengaluru, Karnataka 560034",
  "Salt Lake Sector V, Bidhannagar, Kolkata, West Bengal 700091",
  "Taj Mahal Palace, Apollo Bandar, Colaba, Mumbai, Maharashtra 400001",
  "UB City, Vittal Mallya Road, D'Souza Layout, Ashok Nagar, Bengaluru, Karnataka 560001",
  "Noida Electronic City, Sector 62, Noida, Uttar Pradesh 201301",
  "Cyber Gateway, Hitec City, Hyderabad, Telangana 500081"
];

interface CommuteAlertSystemProps {
  savedAddresses: Address[];
  onSaveWorkAddress: (addressLine: string) => void;
  setActiveTab: (tab: string) => void;
  setInitialDestination: (dest: string) => void;
}

type ScenarioId = 'morning_rush' | 'evening_rush' | 'afternoon_offpeak' | 'late_night';

interface CommuteScenario {
  id: ScenarioId;
  name: string;
  timeLabel: string;
  trafficLevel: 'Low' | 'Moderate' | 'Heavy' | 'Severe';
  trafficColor: 'emerald' | 'amber' | 'orange' | 'rose';
  delayMinutes: number;
  routeCondition: string;
  suggestedDeparture: string;
  departureAlert: string;
  recommendedMode: string;
  savingsHint: string;
  isWeatherAffected: boolean;
}

const SCENARIOS: Record<ScenarioId, CommuteScenario> = {
  morning_rush: {
    id: 'morning_rush',
    name: 'Morning Rush Hour',
    timeLabel: '08:32 AM',
    trafficLevel: 'Severe',
    trafficColor: 'rose',
    delayMinutes: 28,
    routeCondition: 'Severe bottle-neck near Metro Construction & Outer Ring Road flyover.',
    suggestedDeparture: 'Depart by 8:35 AM (28 mins early)',
    departureAlert: 'Leave now! High traffic is building up rapidly. Booking a cab now saves you 20 mins of queue time.',
    recommendedMode: 'Rapido Bike or BluSmart (Highest speed to bypass traffic gridlock)',
    savingsHint: 'Apply coupon CHALOSAVE on BluSmart for flat ₹75 discount!',
    isWeatherAffected: false,
  },
  evening_rush: {
    id: 'evening_rush',
    name: 'Evening Rush Hour',
    timeLabel: '06:15 PM',
    trafficLevel: 'Heavy',
    trafficColor: 'orange',
    delayMinutes: 18,
    routeCondition: 'Heavy water-logging at central junction due to sudden evening drizzle.',
    suggestedDeparture: 'Depart by 6:25 PM (15 mins early)',
    departureAlert: 'Pre-booking rates are climbing across Uber and Ola due to high demand.',
    recommendedMode: 'Ola Auto or Uber Auto (Best for water-logged bypass lanes)',
    savingsHint: 'Compare Ola vs Swiggy Genie for fast alternatives under ₹150.',
    isWeatherAffected: true,
  },
  afternoon_offpeak: {
    id: 'afternoon_offpeak',
    name: 'Afternoon Off-Peak',
    timeLabel: '02:30 PM',
    trafficLevel: 'Low',
    trafficColor: 'emerald',
    delayMinutes: 3,
    routeCondition: 'Route is fully clear. Standard expressway speeds.',
    suggestedDeparture: 'Standard departure (no early delay)',
    departureAlert: 'Perfect time to travel! Low booking times and lowest base tariffs across all fleets.',
    recommendedMode: 'Uber Auto or Rapido Auto (Cheapest rates currently)',
    savingsHint: 'Ride rates are down by 25% across all cab partners.',
    isWeatherAffected: false,
  },
  late_night: {
    id: 'late_night',
    name: 'Late Night Commute',
    timeLabel: '10:45 PM',
    trafficLevel: 'Low',
    trafficColor: 'emerald',
    delayMinutes: 0,
    routeCondition: 'Completely clear roads. Free-flowing traffic.',
    suggestedDeparture: 'On-schedule departure',
    departureAlert: 'All routes green. Excellent night visibility.',
    recommendedMode: 'Uber Premier or BluSmart (Ensures high safety rating & premium driving standards)',
    savingsHint: 'Zero night surge on BluSmart tonight.',
    isWeatherAffected: false,
  },
};

export default function CommuteAlertSystem({
  savedAddresses,
  onSaveWorkAddress,
  setActiveTab,
  setInitialDestination,
}: CommuteAlertSystemProps) {
  const [activeScenarioId, setActiveScenarioId] = useState<ScenarioId>('morning_rush');
  const [isEditingWork, setIsEditingWork] = useState(false);
  const [customWorkInput, setCustomWorkInput] = useState('');
  const [customSavedMessage, setCustomSavedMessage] = useState(false);

  // Address search suggestions states
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);

  useEffect(() => {
    if (!customWorkInput.trim()) {
      setAddressSuggestions([]);
      setShowAddressSuggestions(false);
      return;
    }

    const exactMatch = MOCK_ADDRESS_SUGGESTIONS.some(addr => addr === customWorkInput);
    if (exactMatch) {
      setShowAddressSuggestions(false);
      return;
    }

    setIsSearchingAddress(true);
    setShowAddressSuggestions(true);

    const delayDebounceFn = setTimeout(() => {
      const query = customWorkInput.toLowerCase();
      const filtered = MOCK_ADDRESS_SUGGESTIONS.filter(addr =>
        addr.toLowerCase().includes(query)
      );
      setAddressSuggestions(filtered);
      setIsSearchingAddress(false);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [customWorkInput]);

  // Find saved work address
  const workAddress = savedAddresses.find(addr => addr.label === 'Work');
  
  const currentScenario = SCENARIOS[activeScenarioId];

  // Quick pre-fill work hotspots
  const popularWorkHotspots = [
    'Manyata Tech Park, Block D4, Bangalore',
    'Cyber Gateway, HITEC City, Hyderabad',
    'DLF Cyber City, Building 10, Gurgaon',
    'Noida Electronic City, Sector 62'
  ];

  const handleQuickSave = (address: string) => {
    onSaveWorkAddress(address);
    setCustomSavedMessage(true);
    setIsEditingWork(false);
    setTimeout(() => setCustomSavedMessage(false), 3000);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customWorkInput.trim()) {
      onSaveWorkAddress(customWorkInput.trim());
      setCustomSavedMessage(true);
      setIsEditingWork(false);
      setCustomWorkInput('');
      setTimeout(() => setCustomSavedMessage(false), 3000);
    }
  };

  const triggerCabComparison = () => {
    if (workAddress) {
      setInitialDestination(workAddress.addressLine);
      setActiveTab('rides');
    }
  };

  return (
    <div 
      id="commute_alert_card"
      className="bg-white p-5 rounded-3xl border border-slate-150 shadow-xs space-y-4 relative overflow-hidden transition-all duration-300"
    >
      {/* Background Accent Gradients depending on scenario traffic */}
      <div className={`absolute right-0 top-0 w-48 h-48 bg-radial from-${currentScenario.trafficColor}-100/30 to-transparent pointer-events-none rounded-full blur-2xl z-0`} />

      {/* Header section with pulsating live marker */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-slate-900 text-white rounded-xl shadow-xs">
            <Activity className="w-4 h-4 animate-pulse text-amber-400" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest font-mono">Real-Time</span>
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
            </div>
            <h3 className="font-extrabold text-gray-950 uppercase text-[12px] tracking-tight leading-tight font-display">
              Commute Alert Assistant
            </h3>
          </div>
        </div>

        {/* Time Badge and interactive simulated clock */}
        <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 py-1 px-2.5 rounded-xl text-[10.5px] font-mono font-bold text-slate-800">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>{currentScenario.timeLabel}</span>
        </div>
      </div>

      {/* Subtitle / Descriptive Context */}
      <p className="text-[10.5px] text-slate-500 leading-relaxed font-sans font-medium relative z-10">
        Monitor your daily transit routines. Select different simulated commute windows below to test the traffic routing engine reactions in real-time.
      </p>

      {/* Scenario Swapper / Simulation Controllers */}
      <div className="space-y-1.5 relative z-10">
        <span className="text-[8px] font-mono font-black text-slate-400 uppercase tracking-wider block">
          Select Commute Window Simulation:
        </span>
        <div className="grid grid-cols-4 gap-1 bg-slate-50 p-1 rounded-2xl border border-slate-200">
          {(Object.keys(SCENARIOS) as ScenarioId[]).map((scId) => {
            const sc = SCENARIOS[scId];
            const isActive = activeScenarioId === scId;
            return (
              <button
                key={scId}
                type="button"
                onClick={() => setActiveScenarioId(scId)}
                className={`py-1.5 px-1 rounded-xl text-[9px] font-extrabold tracking-tight transition-all uppercase cursor-pointer ${
                  isActive 
                    ? 'bg-slate-900 text-white shadow-xs' 
                    : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-900'
                }`}
              >
                {scId === 'morning_rush' && '🌅 Morning'}
                {scId === 'evening_rush' && '🌇 Evening'}
                {scId === 'afternoon_offpeak' && '☀️ Midday'}
                {scId === 'late_night' && '🌙 Night'}
              </button>
            );
          })}
        </div>
      </div>

      {/* WORK LOCATION CARD */}
      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2.5 relative z-10">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Briefcase className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-widest">
              Configured Work Location
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsEditingWork(!isEditingWork);
              setCustomWorkInput(workAddress ? workAddress.addressLine : '');
            }}
            className="text-[9.5px] font-black text-slate-800 uppercase hover:underline flex items-center space-x-1 cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 mr-0.5 text-slate-400" />
            <span>{workAddress ? 'Change' : 'Configure'}</span>
          </button>
        </div>

        {/* Saved work state displaying */}
        {!isEditingWork && (
          <div>
            {workAddress ? (
              <div className="flex items-start space-x-2 bg-white p-2.5 rounded-xl border border-slate-150">
                <MapPin className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-[11px] font-extrabold text-slate-900 leading-snug">
                    {workAddress.addressLine}
                  </p>
                  <p className="text-[8.5px] text-slate-400 font-bold font-mono uppercase tracking-wider">
                    SAVED COMFORT HOTSPOT
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border border-dashed border-amber-300 p-3 rounded-xl text-center space-y-2">
                <div className="flex items-center justify-center space-x-1 text-amber-800">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="text-[10px] font-extrabold uppercase font-mono">Work Destination Missing</span>
                </div>
                <p className="text-[10px] text-amber-700 font-medium">
                  Add a Work spot below to enable customized departure triggers and instant ride booking to your office!
                </p>
                
                {/* Popular office spots helper */}
                <div className="pt-1.5 space-y-1">
                  <span className="text-[7.5px] font-bold text-amber-600 block uppercase font-mono">Or select a popular Tech Park:</span>
                  <div className="flex flex-wrap justify-center gap-1">
                    {popularWorkHotspots.map((spot, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleQuickSave(spot)}
                        className="px-2 py-0.5 bg-white hover:bg-slate-100 border border-amber-200 text-[8px] font-bold text-amber-900 rounded-md transition"
                      >
                        {spot.split(',')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Edit work location form */}
        {isEditingWork && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-3 rounded-xl border border-slate-200 space-y-2.5 relative"
          >
            <form onSubmit={handleCustomSubmit} className="flex gap-1.5 relative">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={customWorkInput}
                  onChange={(e) => setCustomWorkInput(e.target.value)}
                  placeholder="Enter office / workspace address..."
                  className="w-full pl-3 pr-8 py-1.5 bg-slate-50 border border-slate-250 rounded-lg text-[10.5px] text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                {customWorkInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomWorkInput('');
                      setAddressSuggestions([]);
                      setShowAddressSuggestions(false);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition p-1 rounded-full hover:bg-slate-200/50 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 text-[9.5px] font-black uppercase rounded-lg transition shrink-0"
              >
                Save
              </button>
            </form>

            {/* Address Suggestions Autocomplete dropdown */}
            {showAddressSuggestions && (customWorkInput.trim().length > 0) && (
              <div className="absolute left-3 right-3 border border-slate-200 rounded-xl max-h-[160px] overflow-y-auto bg-white shadow-lg text-[10.5px] divide-y divide-slate-100 z-50 mt-1">
                {isSearchingAddress ? (
                  <div className="p-3 text-slate-400 font-medium flex items-center gap-1.5 font-mono">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500" />
                    <span>Searching address database...</span>
                  </div>
                ) : addressSuggestions.length === 0 ? (
                  <div className="p-3 text-slate-400 font-medium">No matches found. Feel free to type custom address & save!</div>
                ) : (
                  addressSuggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setCustomWorkInput(suggestion);
                        setShowAddressSuggestions(false);
                      }}
                      className="w-full text-left p-2.5 hover:bg-amber-50/55 transition-colors font-semibold text-slate-800 block cursor-pointer"
                    >
                      📍 {suggestion}
                    </button>
                  ))
                )}
              </div>
            )}

            <div className="space-y-1">
              <span className="text-[7.5px] font-bold text-slate-400 block uppercase font-mono">Quick Pick Hotspot:</span>
              <div className="flex flex-wrap gap-1">
                {popularWorkHotspots.map((spot, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleQuickSave(spot)}
                    className="px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[8px] font-extrabold text-slate-700 rounded-md transition"
                  >
                    {spot.split(',')[0]}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Custom Saved Feedback Success Message */}
        {customSavedMessage && (
          <div className="flex items-center space-x-1.5 bg-emerald-50 border border-emerald-200 p-2 rounded-xl text-[9.5px] text-emerald-800 font-bold">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Success! Saved Work location in your Chalo Profile.</span>
          </div>
        )}
      </div>

      {/* ALERT DETAILS (Only active if Work location is configured) */}
      {workAddress ? (
        <AnimatePresence mode="wait">
          <motion.div 
            key={activeScenarioId}
            initial={{ opacity: 0, x: 5 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -5 }}
            transition={{ duration: 0.15 }}
            className="space-y-3 relative z-10"
          >
            {/* Traffic severity flag */}
            <div className={`p-3 rounded-2xl border flex items-start gap-2.5 ${
              currentScenario.trafficColor === 'rose' 
                ? 'bg-rose-50/70 border-rose-100 text-rose-950' 
                : currentScenario.trafficColor === 'orange' 
                ? 'bg-orange-50/70 border-orange-100 text-orange-950' 
                : currentScenario.trafficColor === 'amber'
                ? 'bg-amber-50/70 border-amber-100 text-amber-950'
                : 'bg-emerald-50/70 border-emerald-100 text-emerald-950'
            }`}>
              <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${
                currentScenario.trafficColor === 'rose' 
                  ? 'text-rose-600 animate-bounce' 
                  : currentScenario.trafficColor === 'orange' 
                  ? 'text-orange-600' 
                  : currentScenario.trafficColor === 'amber'
                  ? 'text-amber-600'
                  : 'text-emerald-600'
              }`} />

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`text-[8.5px] font-mono font-black uppercase px-1.5 py-0.5 rounded ${
                    currentScenario.trafficColor === 'rose'
                      ? 'bg-rose-100 text-rose-800'
                      : currentScenario.trafficColor === 'orange'
                      ? 'bg-orange-100 text-orange-800'
                      : currentScenario.trafficColor === 'amber'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {currentScenario.trafficLevel} Congestion
                  </span>
                  
                  {currentScenario.delayMinutes > 0 ? (
                    <span className="text-[10px] font-black text-rose-600 font-mono">
                      +{currentScenario.delayMinutes} mins delay
                    </span>
                  ) : (
                    <span className="text-[10px] font-black text-emerald-700 font-mono">
                      No Delays
                    </span>
                  )}

                  {currentScenario.isWeatherAffected && (
                    <span className="flex items-center space-x-0.5 text-[8.5px] bg-blue-100 text-blue-800 font-mono px-1 py-0.5 rounded font-bold">
                      <CloudRain className="w-3 h-3 text-blue-600" />
                      <span>Rain Alerts</span>
                    </span>
                  )}
                </div>

                <p className="text-[10px] font-semibold leading-normal text-slate-700 mt-1">
                  {currentScenario.routeCondition}
                </p>
              </div>
            </div>

            {/* Departure departure suggestion */}
            <div className="p-3 bg-indigo-50/45 border border-indigo-100 rounded-2xl space-y-1.5">
              <div className="flex items-center space-x-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                <span className="text-[9.5px] font-mono font-black text-indigo-700 uppercase tracking-wider">
                  OPTIMAL DEPARTURE TRIGGER
                </span>
              </div>
              <p className="text-[11px] font-black text-slate-900 leading-snug">
                {currentScenario.suggestedDeparture}
              </p>
              <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                {currentScenario.departureAlert}
              </p>
            </div>

            {/* Recommended mode & savings advice */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-0.5">
                <span className="text-[8px] font-mono font-bold text-slate-400 uppercase">Recommended Mode</span>
                <p className="text-[10px] font-bold text-slate-800">{currentScenario.recommendedMode}</p>
              </div>
              <div className="p-2.5 bg-amber-50/40 border border-amber-100 rounded-xl space-y-0.5">
                <div className="flex items-center space-x-1">
                  <span className="text-[10px] text-amber-500">✨</span>
                  <span className="text-[8px] font-mono font-bold text-amber-700 uppercase">Chalo Saving Hint</span>
                </div>
                <p className="text-[10px] font-bold text-slate-800 leading-tight">{currentScenario.savingsHint}</p>
              </div>
            </div>

            {/* CTA action buttons */}
            <div className="pt-1 flex gap-2">
              <button
                type="button"
                onClick={triggerCabComparison}
                className="flex-1 py-2.5 bg-amber-400 hover:bg-amber-500 active:scale-99 transition-all text-slate-950 font-black text-[10px] uppercase rounded-xl tracking-tight flex items-center justify-center space-x-1 cursor-pointer shadow-xs border border-amber-300"
              >
                <Car className="w-3.5 h-3.5" />
                <span>Compare Cab Rates to Work ➔</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsEditingWork(true);
                  setCustomWorkInput(workAddress ? workAddress.addressLine : '');
                }}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 transition text-slate-700 font-extrabold text-[10px] uppercase rounded-xl cursor-pointer"
                title="Modify Saved Work Destination"
              >
                Change Destination
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      ) : (
        /* Setup Invitation Panel if missing work Address */
        <div className="bg-slate-50 p-4 rounded-2xl text-center space-y-2 border border-slate-200">
          <p className="text-[10px] text-slate-500 font-medium">
            Once you configure your saved office address, this real-time panel will continuously query traffic APIs, warn you about congestion, calculate the optimal commute window, and offer single-click cheap cab bookings!
          </p>
          <button
            type="button"
            onClick={() => setIsEditingWork(true)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-950 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition"
          >
            Configure Address Now
          </button>
        </div>
      )}
    </div>
  );
}
