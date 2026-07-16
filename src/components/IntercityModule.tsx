import { safeStorage, safeSessionStorage } from '../utils/storage';
import React, { useState } from 'react';
import { IntercityQuery, IntercityOption } from '../types';
import { MapPin, Users, Briefcase, Calendar, Clock, AlertTriangle, CheckCircle2, ChevronRight, Award, HelpCircle, Star, Compass, Sparkles, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ChaloMapView from './ChaloMapView';

interface IntercityModuleProps {
  addOrderToActivity: (order: any) => void;
  setActiveTab?: (tab: string) => void;
  connectedAccounts?: any;
  currentSelectedLocation?: string;
  preferenceMode?: string;
  redirectToLinkedAccounts?: () => void;
  onBackRegister?: (handler: (() => boolean) | null) => void;
}

export default function IntercityModule({
  addOrderToActivity,
  setActiveTab,
  connectedAccounts,
  currentSelectedLocation,
  preferenceMode,
  redirectToLinkedAccounts,
  onBackRegister
}: IntercityModuleProps) {
  const [pickup, setPickup] = useState(() => {
    return currentSelectedLocation || safeStorage.getItem('chalo_intercity_pickup') || 'Jaipur';
  });
  const [destination, setDestination] = useState(() => {
    return safeStorage.getItem('chalo_intercity_destination') || 'Delhi';
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

  // Active Trip States for two-factor OTP outstation tracking
  const [activeTrip, setActiveTrip] = useState<any | null>(null);

  // Register internal back handler
  React.useEffect(() => {
    if (onBackRegister) {
      if (viewingDetailOption || activeTrip) {
        onBackRegister(() => {
          if (activeTrip) {
            setActiveTrip(null);
            setTripLiveStatus('driver_assigned');
            setPickupOtpInput('');
            setDropOffOtpInput('');
            setPickupOtpVerified(false);
            setDropOffOtpVerified(false);
            return true;
          }
          if (viewingDetailOption) {
            setViewingDetailOption(null);
            setSelectedOptionIndex(null);
            return true;
          }
          return false;
        });
      } else {
        onBackRegister(null);
      }
    }
    return () => {
      if (onBackRegister) onBackRegister(null);
    };
  }, [viewingDetailOption, activeTrip, onBackRegister]);
  const [tripLiveStatus, setTripLiveStatus] = useState<'driver_assigned' | 'arriving' | 'active' | 'completed'>('driver_assigned');
  const [pickupOtpInput, setPickupOtpInput] = useState('');
  const [dropOffOtpInput, setDropOffOtpInput] = useState('');
  const [pickupOtpVerified, setPickupOtpVerified] = useState(false);
  const [dropOffOtpVerified, setDropOffOtpVerified] = useState(false);

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
    const isRedirPickup = safeStorage.getItem('chalo_intercity_pickup');
    const isRedirDest = safeStorage.getItem('chalo_intercity_destination');
    if (isRedirPickup || isRedirDest) {
      // Clear localStorage so it doesn't run every time
      safeStorage.removeItem('chalo_intercity_pickup');
      safeStorage.removeItem('chalo_intercity_destination');

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
    
    const pOtp = "1234";
    const dOtp = "1234";
    const tripId = "CHALO-INTERCITY-" + crypto.randomUUID().slice(0,8);

    const tripObj = {
      id: tripId,
      category: 'intercity',
      platform: option.platform,
      merchant: `Outstation: ${option.vehicleType}`,
      title: `${pickup} to ${destination} Intercity`,
      subtitle: `Scheduled for: ${date} at ${time}. Pax: ${passengers}`,
      date: "Today",
      time: time,
      amount: option.fare,
      status: 'upcoming',
      statusLabel: 'Driver Dispatched',
      paymentMethod: 'Chalo Pay Later',
      pickupOtp: pOtp,
      dropOffOtp: dOtp,
      driverName: "Rajesh Kumar",
      driverPhone: "+91 98765 43210",
      vehicleNumber: "MH-12-GP-5021",
      vehicleModel: "White Maruti Suzuki Ertiga CNG",
      comfortScore: option.comfortScore,
      calculatedDistance: option.calculatedDistance,
      travelTime: option.travelTime,
      tollCharges: option.tollCharges,
      fare: option.fare
    };

    setActiveTrip(tripObj);
    setTripLiveStatus('driver_assigned');
    setPickupOtpVerified(false);
    setDropOffOtpVerified(false);
    setPickupOtpInput('');
    setDropOffOtpInput('');

    addOrderToActivity(tripObj);
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

  const [showReceipt, setShowReceipt] = useState(false);

  if (activeTrip) {
    return (
      <div id="active_outstation_trip_container" className="p-4 max-w-6xl mx-auto space-y-6 font-sans text-gray-800">
        {/* Header with back button to abort active trip simulator safely */}
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setActiveTrip(null)}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
              title="Return to search"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-display font-black tracking-tight text-indigo-950 uppercase">
                {activeTrip.platform} Outstation Tracker
              </h2>
              <p className="text-xs text-slate-500 font-semibold font-mono">
                Booking ID: {activeTrip.id} • Chalo Verified Highway Gateway
              </p>
            </div>
          </div>
          <span className="text-[10px] font-black bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full uppercase tracking-wider font-mono">
            Outstation Mode
          </span>
        </div>

        {/* Live Status Indicator Bar */}
        <div className="bg-slate-900 text-white p-4 rounded-3xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-md border border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping shrink-0"></span>
              <span className="text-xs font-black uppercase tracking-wider text-amber-400 font-mono">
                🔴 Active Trip Status: {
                  tripLiveStatus === 'driver_assigned' ? 'Driver Dispatched / Heading to Pickup' :
                  tripLiveStatus === 'arriving' ? 'Driver Arrived at Pickup Location' :
                  tripLiveStatus === 'active' ? 'En Route to Destination City' :
                  'Journey Completed & Secured'
                }
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-medium mt-1">
              Live outstation sync on National Highway routes with automatic Fastag tracking.
            </p>
          </div>
          <div className="flex items-center space-x-2 font-mono text-[10px] bg-slate-800 text-slate-300 px-3 py-1.5 rounded-xl border border-slate-700">
            <span>Server Channel:</span>
            <span className="text-emerald-400 font-black">CHALO-HIGHWAY-SECURE-SYNC</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Map tracking area */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-4 rounded-3xl border border-slate-150 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider font-mono">
                  🗺️ Live Outstation Route Map & GPS Tracker
                </span>
                <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-lg">
                  Route: {pickup} ➔ {destination}
                </span>
              </div>
              <div className="h-80 rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
                <ChaloMapView
                  label="Outstation Navigation"
                  placeholder="Tracking live coordinates..."
                  initialValue={destination}
                  onLocationSelect={() => {}}
                  showMap={true}
                  pickupCoords={pickupCoords}
                  destCoords={destCoords}
                  tripLiveStatus={tripLiveStatus}
                />
              </div>
            </div>

            {/* Trip details card */}
            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div className="space-y-1">
                <span className="text-slate-400 block font-semibold">EST. DISTANCE</span>
                <span className="font-extrabold text-slate-800 text-sm">{activeTrip.calculatedDistance} KM</span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 block font-semibold">DRIVE TIME</span>
                <span className="font-extrabold text-slate-800 text-sm">{activeTrip.travelTime}</span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 block font-semibold">TOTAL QUOTE</span>
                <span className="font-extrabold text-indigo-950 text-sm font-sans">₹{activeTrip.fare}</span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 block font-semibold">METHOD</span>
                <span className="font-extrabold text-emerald-700 text-[10px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">PAY LATER</span>
              </div>
            </div>
          </div>

          {/* Sidebar controls with TWO-FACTOR OTP FLOW */}
          <div className="space-y-6">
            {/* Driver details card */}
            <div className="bg-white p-5 rounded-3xl border border-slate-150 space-y-4 shadow-xs">
              <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-wider font-mono">
                🚖 Assigned Outstation Chalo Partner
              </h3>
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-700 rounded-2xl font-display font-black text-lg flex items-center justify-center shadow-inner">
                  {activeTrip.driverName.charAt(0)}
                </div>
                <div>
                  <h4 className="font-display font-black text-slate-900 text-sm leading-tight">
                    {activeTrip.driverName}
                  </h4>
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded inline-block mt-1">
                    ★ 4.9 Verified Partner
                  </span>
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Vehicle:</span>
                  <span className="font-bold text-slate-800 text-right">{activeTrip.vehicleModel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">License Plate:</span>
                  <span className="font-mono font-black text-slate-900">{activeTrip.vehicleNumber}</span>
                </div>
              </div>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => alert(`Dialing outstation driver ${activeTrip.driverName} at ${activeTrip.driverPhone}...`)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 rounded-2xl text-xs transition cursor-pointer text-center border border-slate-200"
                >
                  📞 Call
                </button>
                <button
                  type="button"
                  onClick={() => alert("Opening chat channel with outstation driver Rajesh Kumar...")}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 rounded-2xl text-xs transition cursor-pointer text-center border border-slate-200"
                >
                  💬 Message
                </button>
              </div>
            </div>

            {/* TWO-FACTOR OTP CONTAINER */}
            <div className="bg-white p-5 rounded-3xl border border-slate-150 space-y-4 shadow-sm">
              <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-wider font-mono">
                🛡️ SafeTrip Two-Factor OTP Codes
              </h3>

              {/* Step 1: PICKUP OTP */}
              <div className="p-4 rounded-2xl border border-dashed transition-all relative overflow-hidden bg-amber-50/50 border-amber-200">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[10.5px] font-bold text-amber-800">
                    STEP 1: Boarding & Pickup OTP
                  </span>
                  {pickupOtpVerified ? (
                    <span className="text-[9.5px] bg-emerald-100 text-emerald-800 font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
                      ✓ Verified & Started
                    </span>
                  ) : (
                    <span className="text-[9.5px] bg-amber-100 text-amber-800 font-black uppercase tracking-wider px-2 py-0.5 rounded-md animate-pulse">
                      Pending Boarding
                    </span>
                  )}
                </div>

                <div className="bg-white border border-amber-200/60 p-3 rounded-xl text-center shadow-xs">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                    Give this OTP to driver on boarding
                  </p>
                  <span className="text-3xl font-mono font-black text-amber-950 tracking-wider block mt-1.5">
                    {activeTrip.pickupOtp}
                  </span>
                </div>

                {/* Simulated driver prompt */}
                {!pickupOtpVerified && (
                  <div className="mt-3 space-y-2">
                    <p className="text-[10px] text-amber-900 leading-snug">
                      <strong>Simulator Mode</strong>: Enter the pickup OTP ({activeTrip.pickupOtp}) below to simulate driver verification and start the intercity trip:
                    </p>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        maxLength={4}
                        value={pickupOtpInput}
                        onChange={(e) => setPickupOtpInput(e.target.value.replace(/\D/g, ''))}
                        placeholder="Type Pickup OTP"
                        className="w-full bg-white border border-amber-300 rounded-xl px-2.5 py-1.5 text-xs text-center font-mono font-bold outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (pickupOtpInput === activeTrip.pickupOtp) {
                            setPickupOtpVerified(true);
                            setTripLiveStatus('active');
                          } else {
                            alert("Invalid Pickup OTP! Type " + activeTrip.pickupOtp + " to simulate verification.");
                          }
                        }}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-black px-3.5 py-1.5 rounded-xl text-xs transition cursor-pointer shrink-0 uppercase tracking-wide"
                      >
                        Verify
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: DROP-OFF OTP */}
              <div className={`p-4 rounded-2xl border border-dashed transition-all relative overflow-hidden ${
                pickupOtpVerified 
                  ? 'bg-indigo-50/50 border-indigo-200 opacity-100' 
                  : 'bg-slate-50 border-slate-200 opacity-50 select-none pointer-events-none'
              }`}>
                {!pickupOtpVerified && (
                  <div className="absolute inset-0 bg-slate-50/60 z-10 flex items-center justify-center p-3 text-center">
                    <span className="text-[10.5px] font-bold text-slate-500 bg-white border border-slate-150 px-3 py-1.5 rounded-xl shadow-xs">
                      🔒 Unlocks only after Pickup OTP verification
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[10.5px] font-bold text-indigo-800">
                    STEP 2: Drop-Off OTP (Destination)
                  </span>
                  {dropOffOtpVerified ? (
                    <span className="text-[9.5px] bg-emerald-100 text-emerald-800 font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
                      ✓ Journey Closed
                    </span>
                  ) : (
                    <span className="text-[9.5px] bg-indigo-100 text-indigo-800 font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
                      Active Cruise
                    </span>
                  )}
                </div>

                <div className="bg-white border border-indigo-200/60 p-3 rounded-xl text-center shadow-xs">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                    Provide this code to driver ONLY upon arrival
                  </p>
                  <span className="text-3xl font-mono font-black text-indigo-950 tracking-wider block mt-1.5">
                    {activeTrip.dropOffOtp}
                  </span>
                </div>

                {pickupOtpVerified && !dropOffOtpVerified && (
                  <div className="mt-3 space-y-2">
                    <p className="text-[10px] text-indigo-900 leading-snug">
                      <strong>Simulator Mode</strong>: Enter the drop-off OTP ({activeTrip.dropOffOtp}) below to simulate arrival and successfully complete this outstation trip:
                    </p>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        maxLength={4}
                        value={dropOffOtpInput}
                        onChange={(e) => setDropOffOtpInput(e.target.value.replace(/\D/g, ''))}
                        placeholder="Type Drop-off OTP"
                        className="w-full bg-white border border-indigo-300 rounded-xl px-2.5 py-1.5 text-xs text-center font-mono font-bold outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (dropOffOtpInput === activeTrip.dropOffOtp) {
                            setDropOffOtpVerified(true);
                            setTripLiveStatus('completed');
                            setShowReceipt(true);
                          } else {
                            alert("Invalid Drop-off OTP! Type " + activeTrip.dropOffOtp + " to simulate journey completion.");
                          }
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-3.5 py-1.5 rounded-xl text-xs transition cursor-pointer shrink-0 uppercase tracking-wide"
                      >
                        Verify
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Detailed receipt modal upon complete journey verification */}
        <AnimatePresence>
          {showReceipt && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200 flex flex-col p-6 space-y-4"
              >
                <div className="text-center space-y-1">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-2 text-xl font-bold">
                    ✓
                  </div>
                  <h3 className="font-display font-black text-slate-900 text-base uppercase">
                    CHALO OUTSTATION SECURED RECEIPT
                  </h3>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest font-mono">
                    Transaction ID: {activeTrip.id}-TXN
                  </span>
                </div>

                {/* Invoice breakdown */}
                <div className="border border-slate-150 rounded-2xl divide-y divide-slate-100 text-xs">
                  <div className="p-3 bg-slate-50 flex justify-between font-bold">
                    <span className="text-slate-600">Travel Route</span>
                    <span className="text-slate-900">{pickup} to {destination}</span>
                  </div>
                  <div className="p-3 flex justify-between">
                    <span className="text-slate-400">Travel Duration</span>
                    <span className="text-slate-800">{activeTrip.travelTime} ({activeTrip.calculatedDistance} km)</span>
                  </div>
                  <div className="p-3 flex justify-between">
                    <span className="text-slate-400">Assigned Driver</span>
                    <span className="text-slate-800">{activeTrip.driverName}</span>
                  </div>
                  <div className="p-3 flex justify-between">
                    <span className="text-slate-400">Outstation Base Price</span>
                    <span className="text-slate-800 font-mono">₹{Math.round(activeTrip.fare - activeTrip.tollCharges)}</span>
                  </div>
                  <div className="p-3 flex justify-between">
                    <span className="text-slate-400">Integrated FASTag tolls</span>
                    <span className="text-slate-800 font-mono">₹{activeTrip.tollCharges}</span>
                  </div>
                  <div className="p-4 bg-emerald-500/10 flex justify-between items-center font-bold">
                    <span className="text-slate-900 font-display">Total Amount Paid</span>
                    <div className="text-right">
                      <span className="text-lg text-emerald-950 font-mono">₹{activeTrip.fare}</span>
                      <p className="text-[8px] text-slate-450 font-mono font-medium">Charged via Chalo Pay Later</p>
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-150 p-3 rounded-2xl text-center text-emerald-950 text-[11px] leading-snug">
                  🎉 <strong>Chalo savings reward active!</strong> You earned **₹{Math.round(activeTrip.fare * 0.05)}** worth of Chalo loyalty cashback rewards! This has been loaded onto your Chalo Wallet.
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowReceipt(false);
                    setActiveTrip(null);
                  }}
                  className="w-full bg-slate-900 hover:bg-slate-950 text-white font-display font-black py-3 rounded-2xl text-xs tracking-wider uppercase transition cursor-pointer"
                >
                  Done & Close Outstation Tracker
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

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

      {showLinkBanner && (!connectedAccounts || !connectedAccounts.uber || !connectedAccounts.ola || !connectedAccounts.makemytrip) && (
        <div 
          onClick={() => { if (redirectToLinkedAccounts) { redirectToLinkedAccounts(); } else if (setActiveTab) { setActiveTab('account'); } }}
          className="bg-amber-50 hover:bg-amber-100/70 border border-amber-200 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs text-amber-900 font-medium font-sans cursor-pointer transition-all shadow-xs group"
        >
          <div className="flex items-center space-x-2">
            <span className="text-base shrink-0 group-hover:scale-110 transition">💡</span>
            <span>
              Link your <strong className="font-bold text-amber-950">Uber, Ola, and MakeMyTrip</strong> accounts to automatically unlock highway loyalty points and priority vehicle routing!
            </span>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <span className="bg-amber-600 group-hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-xl text-[10px] uppercase tracking-wider transition">
              Link Now ➔
            </span>
            <button 
              type="button" 
              onClick={(e) => {
                e.stopPropagation();
                setShowLinkBanner(false);
              }} 
              className="text-amber-500 hover:text-amber-700 text-xs font-bold px-1.5 py-1"
              title="Dismiss banner"
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
