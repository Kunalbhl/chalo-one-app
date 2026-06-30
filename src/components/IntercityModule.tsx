import React, { useState } from 'react';
import { IntercityQuery, IntercityOption } from '../types';
import { MapPin, Users, Briefcase, Calendar, Clock, AlertTriangle, CheckCircle2, ChevronRight, Award, HelpCircle, Star, Compass, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ChaloMapView from './ChaloMapView';

interface IntercityModuleProps {
  addOrderToActivity: (order: any) => void;
  setActiveTab?: (tab: string) => void;
  connectedAccounts?: any;
  currentSelectedLocation?: string;
  preferenceMode?: string;
}

export default function IntercityModule({
  addOrderToActivity,
  setActiveTab,
  connectedAccounts,
  currentSelectedLocation,
  preferenceMode
}: IntercityModuleProps) {
  const [pickup, setPickup] = useState(() => {
    return currentSelectedLocation || localStorage.getItem('chalo_intercity_pickup') || 'Jaipur';
  });
  const [destination, setDestination] = useState(() => {
    return localStorage.getItem('chalo_intercity_destination') || 'Delhi';
  });
  const [pickupCoords, setPickupCoords] = useState<{lat: number, lng: number}>({ lat: 26.9124, lng: 75.7873 }); // default Jaipur
  const [destCoords, setDestCoords] = useState<{lat: number, lng: number}>({ lat: 28.6139, lng: 77.2090 }); // default Delhi
  const [date, setDate] = useState('2026-06-25');
  const [time, setTime] = useState('06:00');
  const [passengers, setPassengers] = useState<number>(5);
  const [luggage, setLuggage] = useState<number>(3);
  const [calculated, setCalculated] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [viewingDetailOption, setViewingDetailOption] = useState<any | null>(null);

  // Filter and Sort states for Intercity comparison
  const [icFilterVehicle, setIcFilterVehicle] = useState<string>('All');
  const [icFilterPlatform, setIcFilterPlatform] = useState<string>('All');

  // Interactive local sorting preference state
  const [localPreferenceMode, setLocalPreferenceMode] = useState<string>(preferenceMode || 'cheapest');
  const [showLinkBanner, setShowLinkBanner] = useState(true);

  // Sync preferenceMode prop with local state
  React.useEffect(() => {
    if (preferenceMode) {
      setLocalPreferenceMode(preferenceMode);
    }
  }, [preferenceMode]);

  // Sync pickup when currentSelectedLocation changes
  React.useEffect(() => {
    if (currentSelectedLocation) {
      setPickup(currentSelectedLocation);
    }
  }, [currentSelectedLocation]);

  // Automatically calculate if loaded from redirection
  React.useEffect(() => {
    const isRedirPickup = localStorage.getItem('chalo_intercity_pickup');
    const isRedirDest = localStorage.getItem('chalo_intercity_destination');
    if (isRedirPickup || isRedirDest) {
      // Clear localStorage so it doesn't run every time
      localStorage.removeItem('chalo_intercity_pickup');
      localStorage.removeItem('chalo_intercity_destination');

      // Trigger automatic calculation after states are bound
      setTimeout(() => {
        const recommendedItem = getVehicleByCapacity(passengers);
        const options = getCalculatedIntercityOptions(280, recommendedItem);
        options.sort((a, b) => a.fare - b.fare);
        const recommendedObj = options.find(o => o.platform === "Ola Intercity") || options[0];
        options.forEach(o => o.recommended = (o.platform === recommendedObj.platform));
        setRecommendations(options);
        setCalculated(true);
      }, 500);
    }
  }, []);

  // Auto recommend vehicle type based on passenger rules
  const getVehicleByCapacity = (pax: number): { type: string; reason: string } => {
    if (pax <= 2) return { type: "Sedan", reason: "Perfect for couples or business travelers. Maximum trunk space." };
    if (pax <= 5) return { type: "SUV", reason: "Spacious Ertiga/Marazzo with sufficient overhead carrier and cabin width." };
    if (pax <= 8) return { type: "Innova Crysta", reason: "Ultra-comfortable corporate standard with captain seating and high luggage space." };
    if (pax <= 15) return { type: "Tempo Traveller", reason: "Includes split central AC. Perfect for extended family groups and spiritual yatras." };
    return { type: "Mini Bus (30 PAX)", reason: "Private tourist-permit AC coach. Excellent for destination weddings or corporate outbound groups." };
  };

  function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return Number((R * c).toFixed(1));
  }

  const getCalculatedIntercityOptions = (distance: number, recommendedItem: { type: string; reason: string }): any[] => {
    const tollCharges = Math.max(150, Math.round(distance * 1.6));
    const baseFuelPricePerKm = 8.5;

    return [
      {
        vehicleType: recommendedItem.type,
        recommended: true,
        reason: recommendedItem.reason,
        platform: "Ola",
        fare: Math.floor(distance * 13 + tollCharges),
        travelTime: `${Math.floor(distance / 50)}h ${Math.round((distance % 50) * 1.2)}m`,
        tollCharges,
        fuelCost: Math.floor(distance * baseFuelPricePerKm),
        comfortScore: passengers <= 5 ? 8.5 : 9.2,
        calculatedDistance: distance
      },
      {
        vehicleType: recommendedItem.type,
        recommended: false,
        reason: "Alternative budget provider with standard feedback ratings.",
        platform: "Uber",
        fare: Math.floor(distance * 13.8 + tollCharges),
        travelTime: `${Math.floor(distance / 52)}h ${Math.round((distance % 52) * 1.15)}m`,
        tollCharges,
        fuelCost: Math.floor(distance * baseFuelPricePerKm),
        comfortScore: passengers <= 5 ? 8.2 : 9.0,
        calculatedDistance: distance
      },
      {
        vehicleType: recommendedItem.type,
        recommended: false,
        reason: "Includes complimentary packaged water and corporate-vetted premium drivers.",
        platform: "MakeMyTrip",
        fare: Math.floor(distance * 14.5 + tollCharges),
        travelTime: `${Math.floor(distance / 50)}h ${Math.round((distance % 50) * 1.2)}m`,
        tollCharges,
        fuelCost: Math.floor(distance * baseFuelPricePerKm),
        comfortScore: 9.5,
        calculatedDistance: distance
      }
    ];
  };

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickup || !destination) return;

    const recommendedItem = getVehicleByCapacity(passengers);

    // Calculate real distance using coordinates if available, otherwise deterministic fallback
    let distanceFactor = 270;
    if (pickupCoords && destCoords) {
      distanceFactor = getHaversineDistance(pickupCoords.lat, pickupCoords.lng, destCoords.lat, destCoords.lng);
    } else {
      distanceFactor = pickup.toLowerCase() === 'jaipur' && destination.toLowerCase() === 'delhi' ? 270 : 350;
    }

    const options = getCalculatedIntercityOptions(distanceFactor, recommendedItem);

    // Sort cheapest first
    options.sort((a, b) => a.fare - b.fare);
    // Mark recommended
    const recommendedObj = options.find(o => o.platform === "Ola Intercity") || options[0];
    options.forEach(o => o.recommended = (o.platform === recommendedObj.platform));

    setRecommendations(options);
    setSelectedOptionIndex(null);
    setCalculated(true);
  };

  const handleBook = (option: IntercityOption, idx: number) => {
    setSelectedOptionIndex(idx);

    addOrderToActivity({
      id: "CHALO-INTERCITY-" + Math.floor(100000 + Math.random() * 900000),
      category: 'intercity',
      platform: option.platform,
      merchant: `Outstation: ${option.vehicleType}`,
      title: `${pickup} to ${destination} Intercity`,
      subtitle: `Scheduled for: ${date} at ${time}. Pax: ${passengers}`,
      date: "Scheduled",
      time: date,
      amount: option.fare,
      status: 'upcoming',
      statusLabel: 'Upcoming',
      paymentMethod: 'Chalo Pay Later'
    });
  };

  const filteredRecommendations = recommendations
    .filter((option) => {
      if (icFilterVehicle !== 'All' && option.vehicleType !== icFilterVehicle) return false;
      if (icFilterPlatform !== 'All' && option.platform !== icFilterPlatform) return false;
      return true;
    })
    .sort((a, b) => {
      if (localPreferenceMode === 'cheapest') {
        return a.fare - b.fare;
      } else if (localPreferenceMode === 'fastest') {
        return a.durationMinutes - b.durationMinutes;
      } else if (localPreferenceMode === 'rated') {
        return b.comfortScore - a.comfortScore;
      } else {
        // Default AI balance
        return a.fare - b.fare;
      }
    });

  return (
    <div id="intercity_module_container" className="p-4 max-w-6xl mx-auto space-y-6 font-sans text-gray-800">
      <div className="flex items-center space-x-2 pb-2">
        <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
          <Calendar className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-display font-semibold tracking-tight text-indigo-950">Chalo Intercity Planner</h2>
          <p className="text-xs text-gray-500">Auto-recommend optimal vehicle size + multi-platform outstation fares</p>
        </div>
      </div>

      {showLinkBanner && (!connectedAccounts || (!connectedAccounts.uber && !connectedAccounts.ola && !connectedAccounts.makemytrip)) && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs text-amber-900 font-medium font-sans">
          <div className="flex items-center space-x-2">
            <span className="text-base shrink-0">💡</span>
            <span>Link your Ola, Uber, and MakeMyTrip accounts to automatically unlock highway loyalty points and priority vehicle routing!</span>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <button 
              type="button" 
              onClick={() => { if (setActiveTab) setActiveTab('account'); }} 
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-xl text-[10px] uppercase tracking-wider transition cursor-pointer"
            >
              Link Account
            </button>
            <button 
              type="button" 
              onClick={() => setShowLinkBanner(false)} 
              className="text-amber-500 hover:text-amber-700 text-xs font-bold px-1.5 py-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleCalculate} className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <div className="space-y-4">
          <ChaloMapView 
            label="Departure Point (From)"
            placeholder="Search city of departure (e.g. Jaipur, Delhi)..."
            initialValue={pickup}
            onLocationSelect={(name, lat, lng) => {
              setPickup(name);
              if (lat && lng) setPickupCoords({ lat, lng });
            }}
            icon={<MapPin className="w-4 h-4 text-gray-500" />}
            showMap={false}
          />

          <ChaloMapView 
            label="Destination Point (To)"
            placeholder="Search arrival destination (e.g. Delhi, Gurgaon, Jaipur)..."
            initialValue={destination}
            onLocationSelect={(name, lat, lng) => {
              setDestination(name);
              if (lat && lng) setDestCoords({ lat, lng });
            }}
            icon={<MapPin className="w-4 h-4 text-indigo-600" />}
            showMap={false}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 p-2 rounded-xl border border-gray-150 flex flex-col">
            <span className="text-[9px] text-gray-400 font-bold uppercase pl-1">Departure Date</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="text-xs font-semibold outline-none bg-transparent p-1 cursor-pointer"
              required
            />
          </div>
          <div className="bg-gray-50 p-2 rounded-xl border border-gray-150 flex flex-col">
            <span className="text-[9px] text-gray-400 font-bold uppercase pl-1">Time</span>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="text-xs font-semibold outline-none bg-transparent p-1 cursor-pointer"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 p-1.5 rounded-xl border border-gray-150 flex items-center justify-between px-3">
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4 text-indigo-500" />
              <span className="text-xs font-semibold text-gray-600">Passengers:</span>
            </div>
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => setPassengers(Math.max(1, passengers - 1))}
                className="w-5 h-5 bg-white text-indigo-600 select-none hover:bg-indigo-50 border border-gray-205 rounded flex items-center justify-center font-bold text-xs"
              >
                -
              </button>
              <input
                type="number"
                min={1}
                max={100}
                value={passengers}
                onChange={(e) => setPassengers(Math.max(1, Number(e.target.value) || 1))}
                id="passengers_selector"
                className="text-xs font-black outline-none border-none bg-transparent w-9 text-indigo-900 text-center"
              />
              <button
                type="button"
                onClick={() => setPassengers(passengers + 1)}
                className="w-5 h-5 bg-white text-indigo-600 select-none hover:bg-indigo-50 border border-gray-205 rounded flex items-center justify-center font-bold text-xs"
              >
                +
              </button>
            </div>
          </div>

          <div className="bg-gray-50 p-1.5 rounded-xl border border-gray-150 flex items-center justify-between px-3">
            <div className="flex items-center space-x-1">
              <Briefcase className="w-4 h-4 text-indigo-500" />
              <span className="text-xs font-semibold text-gray-600">Luggages:</span>
            </div>
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => setLuggage(Math.max(0, luggage - 1))}
                className="w-5 h-5 bg-white text-indigo-600 select-none hover:bg-indigo-50 border border-gray-205 rounded flex items-center justify-center font-bold text-xs"
              >
                -
              </button>
              <input
                type="number"
                min={0}
                max={50}
                value={luggage}
                onChange={(e) => setLuggage(Math.max(0, Number(e.target.value) || 0))}
                id="luggage_selector"
                className="text-xs font-black outline-none border-none bg-transparent w-9 text-indigo-900 text-center"
              />
              <button
                type="button"
                onClick={() => setLuggage(luggage + 1)}
                className="w-5 h-5 bg-white text-indigo-600 select-none hover:bg-indigo-50 border border-gray-205 rounded flex items-center justify-center font-bold text-xs"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <button
          type="submit"
          id="finds_intercity_btn"
          className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:brightness-110 text-white font-medium py-3 rounded-xl shadow-md transition-all text-xs cursor-pointer flex items-center justify-center space-x-1.5"
        >
          <span>Calculate Smart Recommendation & Compare</span>
        </button>
      </form>

      {/* Recommendations & Comparators output */}
      {calculated && recommendations.length > 0 && (
        <div className="space-y-3.5">
          {/* Recommendation Smart Pitch Box */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-3.5 rounded-2xl border border-indigo-150 flex items-start space-x-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl mt-1 shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] bg-indigo-600 text-white font-extrabold uppercase px-2 py-0.2 rounded font-mono">Chalo Recommends</span>
                <span className="text-sm font-bold text-indigo-950">{getVehicleByCapacity(passengers).type}</span>
              </div>
              <p className="text-xs text-indigo-800 mt-1.5 font-medium leading-relaxed">
                {getVehicleByCapacity(passengers).reason}
              </p>
              <div className="flex space-x-4 mt-2 border-t border-indigo-100/60 pt-2 text-[10px] text-indigo-700/85 font-mono">
                <span>🎒 Suggested Luggage: Max {Math.ceil(passengers * 0.8) + 1} Trolley bags</span>
                <span>•</span>
                <span>🛣️ Distance Factor: Approx {recommendations[0].calculatedDistance} km</span>
              </div>
            </div>
          </div>

          {/* Filter and Sort controls */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <Compass className="w-3.5 h-3.5 text-indigo-600" />
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Filters & Sort Options</span>
              </div>
              <span className="text-[10px] text-slate-400 font-bold font-mono">App Preference Synced</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Vehicle Type Filter */}
              <div>
                <span className="block text-[8px] text-slate-450 font-black uppercase mb-1 font-mono">Vehicle Segment</span>
                <select
                  value={icFilterVehicle}
                  onChange={(e) => setIcFilterVehicle(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-xs px-2.5 py-1.5 rounded-xl text-slate-700 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="All">All Vehicle Types</option>
                  <option value="Sedan">Sedan Only</option>
                  <option value="SUV">SUV Only</option>
                  <option value="Innova">Innova Only</option>
                  <option value="Tempo">Tempo Traveller Only</option>
                </select>
              </div>

              {/* Operator Filter */}
              <div>
                <span className="block text-[8px] text-slate-450 font-black uppercase mb-1 font-mono">Highway Operator</span>
                <select
                  value={icFilterPlatform}
                  onChange={(e) => setIcFilterPlatform(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-xs px-2.5 py-1.5 rounded-xl text-slate-700 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="All">All Operators</option>
                  <option value="Ola">Ola</option>
                  <option value="Uber">Uber</option>
                  <option value="MakeMyTrip">MakeMyTrip</option>
                </select>
              </div>
            </div>

            {/* Interactive Sort Row */}
            <div>
              <span className="block text-[8px] text-slate-455 font-black uppercase mb-1 font-mono">Sort Options</span>
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
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Pricing cards */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1">Aggregated Real-time Outstation Quotes ({filteredRecommendations.length})</h3>
            {filteredRecommendations.map((option) => {
              const originalIndex = recommendations.indexOf(option);
              const isSelected = selectedOptionIndex === originalIndex;
              return (
                <div
                  key={option.platform}
                  onClick={() => setViewingDetailOption(option)}
                  className={`bg-white p-4 rounded-2xl border transition-all cursor-pointer relative group ${
                    isSelected ? 'border-emerald-500 shadow-md ring-1 ring-emerald-500' : 'border-gray-150 hover:border-indigo-400'
                  }`}
                  title="Click to view route maps and itemized pricing details"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-extrabold text-gray-900 font-display group-hover:text-indigo-900 transition">{option.platform}</span>
                        {option.recommended && (
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                            🏆 Eco Pick
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {option.vehicleType} • {option.travelTime} drive • {option.calculatedDistance} km
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-mono font-bold text-gray-950">₹{option.fare}</span>
                      <p className="text-[10px] text-gray-400">All Tolls Included</p>
                    </div>
                  </div>

                  {/* Breakdown cost items */}
                  <div className="grid grid-cols-4 gap-2 mt-3 pt-2.5 border-t border-dashed border-gray-100 text-[10px] text-gray-500 font-mono">
                    <div>
                      <span className="block text-gray-400 font-sans">Fuel Share</span>
                      <span className="font-semibold text-gray-700">₹{option.fuelCost}</span>
                    </div>
                    <div>
                      <span className="block text-gray-400 font-sans">Toll Tax</span>
                      <span className="font-semibold text-gray-700">₹{option.tollCharges}</span>
                    </div>
                    <div>
                      <span className="block text-gray-400 font-sans">Comfort Score</span>
                      <span className="font-semibold text-indigo-600">{option.comfortScore}/10</span>
                    </div>
                    <div className="text-right flex items-end justify-end">
                      {isSelected ? (
                        <span className="text-emerald-600 font-bold text-[11px] flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                          <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />
                          <span>Reserved!</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBook(option, originalIndex);
                          }}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1 px-3 rounded-lg text-xs transition cursor-pointer"
                        >
                          Book Cab
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Detailed Intercity Card with Draggable Map and itemized breakdown */}
      <AnimatePresence>
        {viewingDetailOption && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
            onClick={() => setViewingDetailOption(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-4 bg-indigo-600 text-white flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 animate-pulse" />
                  <div>
                    <h3 className="font-display font-black text-sm uppercase tracking-wide">
                      {viewingDetailOption.platform} outstation cab details
                    </h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider block opacity-85 font-mono">
                      Verified Intercity Surcharge & Route Quotes
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingDetailOption(null)}
                  className="bg-white/20 hover:bg-white/40 text-white p-2 rounded-full transition font-black text-xs font-mono"
                >
                  ✕ CLOSE
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="p-5 overflow-y-auto space-y-4">
                {/* Embedded Interactive Map */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono block">
                    🗺️ Intercity Route Map (Normal & Satellite Draggable View)
                  </span>
                  <ChaloMapView
                    label="Adjust Outstation Arrival Point"
                    placeholder="Drag pin on map to adjust address..."
                    initialValue={destination}
                    onLocationSelect={(name, lat, lng) => {
                      setDestination(name);
                      if (lat && lng) {
                        setDestCoords({ lat, lng });
                        // Recalculate outstation distance
                        const d = getHaversineDistance(pickupCoords.lat, pickupCoords.lng, lat, lng);
                        const rec = getVehicleByCapacity(passengers);
                        const updatedList = getCalculatedIntercityOptions(d, rec);
                        const updated = updatedList.find(o => o.platform === viewingDetailOption.platform);
                        if (updated) {
                          setViewingDetailOption(updated);
                        }
                      }
                    }}
                    showMap={true}
                  />
                </div>

                {/* Locations Summary */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-2 text-xs">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1 shrink-0"></div>
                    <p className="text-slate-700">
                      <strong className="font-bold">Departure City:</strong> {pickup}
                    </p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 rounded-full bg-pink-500 mt-1 shrink-0"></div>
                    <p className="text-slate-700">
                      <strong className="font-bold">Arrival City:</strong> {destination}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-200/60 grid grid-cols-2 gap-2 font-mono font-extrabold text-[10px] text-slate-600">
                    <span>🛣️ Est. Distance: {viewingDetailOption.calculatedDistance} km</span>
                    <span>⏱️ Drive Duration: {viewingDetailOption.travelTime}</span>
                    <span>👥 Passengers: {passengers} PAX</span>
                    <span>🎒 Luggages allowed: Max {luggage} Bags</span>
                  </div>
                </div>

                {/* Cost Breakdown */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">
                    💰 Multi-State Outstation Cost Calculations
                  </h4>
                  <div className="border border-slate-150 rounded-2xl divide-y divide-slate-100 overflow-hidden text-xs">
                    <div className="p-3 bg-slate-50/50 flex justify-between">
                      <span className="text-slate-500">Base Fare ({viewingDetailOption.calculatedDistance} km @ standard rate)</span>
                      <span className="font-mono font-semibold text-slate-800">₹{Math.round(viewingDetailOption.fare - viewingDetailOption.tollCharges)}</span>
                    </div>
                    <div className="p-3 bg-slate-50/50 flex justify-between">
                      <span className="text-slate-500">NHAI National Highway Toll charges (Fastag integrated)</span>
                      <span className="font-mono font-semibold text-slate-800">₹{viewingDetailOption.tollCharges}</span>
                    </div>
                    <div className="p-3 bg-slate-50/50 flex justify-between">
                      <span className="text-slate-500">State transport permit entry taxes & Driver overnight charges</span>
                      <span className="font-mono font-semibold text-emerald-600">INCLUDED IN QUOTE</span>
                    </div>

                    {/* Total Amount */}
                    <div className="p-4 bg-indigo-500/10 flex justify-between items-center">
                      <span className="font-black text-slate-900 font-display">Total Outstation Quote</span>
                      <div className="text-right">
                        <span className="text-xl font-mono font-black text-indigo-950">₹{viewingDetailOption.fare}</span>
                        <p className="text-[9px] text-slate-450 font-mono">Tolls & border permits fully inclusive</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex space-x-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewingDetailOption(null)}
                  className="flex-1 bg-white hover:bg-slate-100 text-slate-700 font-bold py-3 px-4 rounded-2xl border border-slate-200 text-xs transition cursor-pointer"
                >
                  Back to Recommendations
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleBook(viewingDetailOption, recommendations.indexOf(viewingDetailOption));
                    setViewingDetailOption(null);
                  }}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-display font-black py-3 px-4 rounded-2xl text-xs shadow-md transition-all cursor-pointer flex items-center justify-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4.5 h-4.5" />
                  <span>CONFIRM & BOOK OUTSTATION CAB</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
