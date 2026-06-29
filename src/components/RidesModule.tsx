import React, { useState, useEffect } from 'react';
import { RIDE_CATALOG } from '../data';
import { RideOption, SelectedRide } from '../types';
import { MapPin, Navigation, Compass, ShieldAlert, PhoneCall, Star, Clock, AlertCircle, Sparkles, CheckCircle, ArrowLeft, RefreshCw, Plus, Trash2, Calendar, FileText, Check, Shield, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ChaloMapView from './ChaloMapView';

interface RidesModuleProps {
  preferenceMode: string;
  defaultRidesOrder: string[];
  addOrderToActivity: (order: any) => void;
  walletBalance: number;
  deductWalletCoins: (rs: number) => void;
  setActiveTab?: (tab: string) => void;
}

export default function RidesModule({
  preferenceMode,
  defaultRidesOrder,
  addOrderToActivity,
  walletBalance,
  deductWalletCoins,
  setActiveTab
}: RidesModuleProps) {
  const [pickup, setPickup] = useState('My Current Location (Blinkit HQ, Bangalore)');
  const [destination, setDestination] = useState('');
  const [pickupCoords, setPickupCoords] = useState<{lat: number, lng: number}>({ lat: 12.9352, lng: 77.6245 }); // default Koramangala
  const [destCoords, setDestCoords] = useState<{lat: number, lng: number} | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [comparedRides, setComparedRides] = useState<any[]>([]);
  const [selectedRide, setSelectedRide] = useState<SelectedRide | null>(null);
  const [viewingDetailRide, setViewingDetailRide] = useState<any | null>(null);
  const [sosTriggered, setSosTriggered] = useState(false);
  const [selectedVehicleType, setSelectedVehicleType] = useState<'All' | 'Bike' | 'Auto' | 'Economy' | 'Premium'>('All');

  // Advanced Ride Booking Flow States
  const [redirectingToIntercity, setRedirectingToIntercity] = useState(false);
  const [addedStops, setAddedStops] = useState<{ id: string; name: string }[]>([]);
  const [stopInput, setStopInput] = useState('');
  const [hourlyPackage, setHourlyPackage] = useState<'standard' | '3hr' | '6hr' | '12hr'>('standard');
  const [chosenPaymentMode, setChosenPaymentMode] = useState<'wallet' | 'upi' | 'netbanking'>('wallet');
  const [tripLiveStatus, setTripLiveStatus] = useState<'driver_assigned' | 'arriving' | 'active' | 'completed'>('driver_assigned');
  const [reconfirmPickupAddress, setReconfirmPickupAddress] = useState('');
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isPickupAdjusted, setIsPickupAdjusted] = useState(false);
  const [newPickupValue, setNewPickupValue] = useState('');

  // Frequent destination addresses for Quick Repeat
  const FREQUENT_DESTINATIONS = [
    { name: "Kempegowda International Airport (BLR)", lat: 13.1986, lng: 77.7066 },
    { name: "Indiranagar 100ft Road, Bengaluru", lat: 12.9719, lng: 77.6412 },
    { name: "Whitefield ITPL, Bengaluru", lat: 12.9866, lng: 77.7374 }
  ];

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

  const getCalculatedRides = (distance: number): any[] => {
    const specs = {
      'Bike': { base: 20, perKm: 8.5, timeFee: 1.5 },
      'Auto': { base: 35, perKm: 12.5, timeFee: 2 },
      'Mini': { base: 45, perKm: 14.5, timeFee: 2.5 },
      'Sedan': { base: 55, perKm: 16.5, timeFee: 3 },
      'SUV': { base: 85, perKm: 22.0, timeFee: 4 },
      'Premium': { base: 110, perKm: 28.5, timeFee: 5 }
    };

    const baseOptions = [
      { platform: 'Uber', vehicleType: 'Bike', driverRating: 4.8, cancellationPolicy: 'Free cancellation within 5 mins' },
      { platform: 'Rapido', vehicleType: 'Bike', driverRating: 4.75, cancellationPolicy: 'Free cancellation within 2 mins' },
      { platform: 'Ola', vehicleType: 'Bike', driverRating: 4.6, cancellationPolicy: 'Cancellation charges apply' },
      
      { platform: 'Uber', vehicleType: 'Auto', driverRating: 4.5, cancellationPolicy: 'Free cancellation within 3 mins' },
      { platform: 'Ola', vehicleType: 'Auto', driverRating: 4.3, cancellationPolicy: 'No refund after OTP generated' },
      { platform: 'Namma Yatri', vehicleType: 'Auto', driverRating: 4.9, cancellationPolicy: 'Zero cancellation charge' },

      { platform: 'Uber', vehicleType: 'Mini', driverRating: 4.45, cancellationPolicy: 'Free within 5 mins' },
      { platform: 'Ola', vehicleType: 'Mini', driverRating: 4.35, cancellationPolicy: 'Cancellation fees apply' },

      { platform: 'Uber', vehicleType: 'Sedan', driverRating: 4.7, cancellationPolicy: 'Free cancellation within 5 mins' },
      { platform: 'Ola', vehicleType: 'Sedan', driverRating: 4.55, cancellationPolicy: 'Free cancellation within 5 mins' },
      { platform: 'BluSmart', vehicleType: 'Sedan', driverRating: 4.9, cancellationPolicy: 'No cancellation charges, EV zero surge' },

      { platform: 'Uber', vehicleType: 'SUV', driverRating: 4.8, cancellationPolicy: 'Free within 5 mins' },
      { platform: 'Ola', vehicleType: 'SUV', driverRating: 4.65, cancellationPolicy: 'Free within 5 mins' },

      { platform: 'Uber', vehicleType: 'Premium', driverRating: 4.9, cancellationPolicy: 'Free within 10 mins' },
      { platform: 'BluSmart', vehicleType: 'Premium', driverRating: 4.95, cancellationPolicy: 'EV zero surge' }
    ];

    return baseOptions.map(opt => {
      const vType = opt.vehicleType as 'Bike' | 'Auto' | 'Mini' | 'Sedan' | 'SUV' | 'Premium';
      const spec = specs[vType] || specs['Sedan'];
      const travelTimeMins = Math.max(5, Math.ceil(distance * 2.2));
      let rawPrice = spec.base + (distance * spec.perKm) + (travelTimeMins * spec.timeFee);

      // Platform variations
      if (opt.platform === 'Uber') {
        rawPrice = rawPrice * 1.05; // 5% fee
      } else if (opt.platform === 'Ola') {
        rawPrice = rawPrice + 15; // surge
      } else if (opt.platform === 'Rapido' && vType === 'Bike') {
        rawPrice = rawPrice * 0.92; // Rapido bike discount
      } else if (opt.platform === 'Namma Yatri') {
        rawPrice = rawPrice * 0.88; // Direct payout discount
      } else if (opt.platform === 'BluSmart') {
        rawPrice = rawPrice * 1.15; // premium EV
      }

      return {
        platform: opt.platform,
        vehicleType: opt.vehicleType,
        eta: Math.max(1, Math.floor(((opt.driverRating * 10) % 6) + 1)),
        price: Math.round(rawPrice),
        driverRating: opt.driverRating,
        cancellationPolicy: opt.cancellationPolicy,
        calculatedDistance: distance,
        tripDuration: travelTimeMins
      };
    });
  };

  // Trigger comparisons when search clicked
  const handleCompare = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim()) return;

    setIsSearching(true);
    setComparedRides([]);
    setSelectedRide(null);

    setTimeout(() => {
      // Calculate real distance using coordinates if available, otherwise deterministic fallback
      let calculatedDistance = 12.5;
      if (pickupCoords && destCoords) {
        calculatedDistance = getHaversineDistance(pickupCoords.lat, pickupCoords.lng, destCoords.lat, destCoords.lng);
      } else {
        // Deterministic fallback based on destination characters length
        calculatedDistance = Math.max(3, (pickup.length + destination.length) % 25 + 5);
      }

      // Check if non-local (distance > 35 km)
      if (calculatedDistance > 35) {
        localStorage.setItem('chalo_intercity_pickup', pickup);
        localStorage.setItem('chalo_intercity_destination', destination);
        setRedirectingToIntercity(true);
        setTimeout(() => {
          setRedirectingToIntercity(false);
          if (setActiveTab) {
            setActiveTab('intercity');
          }
        }, 2500);
        setIsSearching(false);
        return;
      }

      const rideOptions = getCalculatedRides(calculatedDistance);

      // Sort according to priority settings
      if (preferenceMode === 'cheapest') {
        rideOptions.sort((a, b) => a.price - b.price);
      } else if (preferenceMode === 'fastest') {
        rideOptions.sort((a, b) => a.eta - b.eta);
      } else if (preferenceMode === 'rated') {
        rideOptions.sort((a, b) => b.driverRating - a.driverRating);
      } else {
        // App Preferences ranking: Prioritize by favorite apps order
        rideOptions.sort((a, b) => {
          const idxA = defaultRidesOrder.indexOf(a.platform);
          const idxB = defaultRidesOrder.indexOf(b.platform);
          const valA = idxA === -1 ? 99 : idxA;
          const valB = idxB === -1 ? 99 : idxB;
          return valA - valB;
        });
      }

      setComparedRides(rideOptions);
      setIsSearching(false);
    }, 1200);
  };

  const handleQuickRepeat = (destName: string, lat: number, lng: number) => {
    setDestination(destName);
    setDestCoords({ lat, lng });

    setIsSearching(true);
    setComparedRides([]);
    setSelectedRide(null);

    setTimeout(() => {
      const calculatedDistance = getHaversineDistance(pickupCoords.lat, pickupCoords.lng, lat, lng);

      // Check if non-local (distance > 35 km)
      if (calculatedDistance > 35) {
        localStorage.setItem('chalo_intercity_pickup', pickup);
        localStorage.setItem('chalo_intercity_destination', destName);
        setRedirectingToIntercity(true);
        setTimeout(() => {
          setRedirectingToIntercity(false);
          if (setActiveTab) {
            setActiveTab('intercity');
          }
        }, 2500);
        setIsSearching(false);
        return;
      }

      const rideOptions = getCalculatedRides(calculatedDistance);

      if (preferenceMode === 'cheapest') {
        rideOptions.sort((a, b) => a.price - b.price);
      } else if (preferenceMode === 'fastest') {
        rideOptions.sort((a, b) => a.eta - b.eta);
      } else {
        rideOptions.sort((a, b) => a.price - b.price);
      }

      setComparedRides(rideOptions);
      setIsSearching(false);
    }, 1200);
  };

  // Ride booking selections are handled natively via detailed confirmation page flow

  // Monitor selectedRide to simulate live status updates
  useEffect(() => {
    if (!selectedRide) return;
    
    // Reset live status to driver assigned at startup
    setTripLiveStatus('driver_assigned');

    const t1 = setTimeout(() => {
      setTripLiveStatus('arriving');
    }, 5000);

    const t2 = setTimeout(() => {
      setTripLiveStatus('active');
    }, 12000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [selectedRide]);

  // Total Fare calculations for viewingDetailRide
  const getConfirmationPricing = () => {
    if (!viewingDetailRide) return { originalPrice: 0, stopsFare: 0, hourlyFare: 0, adjustedPickupFare: 0, totalFare: 0, platformFees: 0 };
    const originalPrice = viewingDetailRide.price;
    const stopsFare = addedStops.length * 75;
    const hourlyFare = hourlyPackage === '3hr' ? 450 : hourlyPackage === '6hr' ? 850 : hourlyPackage === '12hr' ? 1800 : 0;
    const adjustedPickupFare = isPickupAdjusted ? 50 : 0;
    const totalFare = originalPrice + stopsFare + hourlyFare + adjustedPickupFare;
    const platformFees = Math.round(totalFare * 0.05);
    return { originalPrice, stopsFare, hourlyFare, adjustedPickupFare, totalFare, platformFees };
  };

  const { originalPrice, stopsFare, hourlyFare, adjustedPickupFare, totalFare, platformFees } = getConfirmationPricing();

  const handleConfirmAndBook = () => {
    if (!viewingDetailRide) return;
    
    // Deduct coins/balance
    deductWalletCoins(totalFare);

    const driverNames = ["Rajesh Kumar", "Amit Singh", "Manpreet S.", "Suresh Gowda", "Arjun Prasad"];
    const vehicles = ["KA-03-MJ-5120", "KA-51-AB-8109", "KA-01-EE-4412", "KA-04-NX-7845", "KA-02-PP-9011"];
    const randomDriver = driverNames[Math.floor(Math.random() * driverNames.length)];
    const randomVehicle = vehicles[Math.floor(Math.random() * vehicles.length)];
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    const finalPickup = reconfirmPickupAddress || pickup;

    const newRide: SelectedRide = {
      option: { ...viewingDetailRide, price: totalFare },
      pickup: finalPickup,
      destination,
      driverName: randomDriver,
      driverPhone: "+91 98765 4" + Math.floor(10000 + Math.random() * 90000),
      vehicleNumber: randomVehicle,
      status: 'driver_assigned',
      driverLat: 12.9352,
      driverLng: 77.6245,
      otp
    };

    setSelectedRide(newRide);
    setTripLiveStatus('driver_assigned');

    // Save transaction activity logs with platform fees instead of commission
    addOrderToActivity({
      id: "CHALO-RIDE-" + Math.floor(100000 + Math.random() * 900000),
      category: 'rides',
      platform: viewingDetailRide.platform,
      merchant: `Cab: ${viewingDetailRide.vehicleType}`,
      title: `${finalPickup} ➔ ${destination}`,
      subtitle: `Driver Assigned: ${randomDriver} (${randomVehicle})`,
      date: "Today",
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      amount: totalFare,
      status: 'active',
      statusLabel: 'Ongoing',
      paymentMethod: chosenPaymentMode === 'wallet' ? 'Chalo One Wallet Balance' : chosenPaymentMode === 'upi' ? 'GPay UPI Verified' : 'NetBanking Secure Direct'
    });
  };

  const handleSOS = () => {
    setSosTriggered(true);
    setTimeout(() => {
      setSosTriggered(false);
    }, 5000);
  };

  const triggerFetchCurrentLocation = () => {
    // Simulate high precision GPS triangulation
    setReconfirmPickupAddress('Koramangala 4th Block (Blinkit HQ, Bangalore)');
    const toast = document.getElementById('gps_success_toast');
    if (toast) {
      toast.classList.remove('hidden');
      setTimeout(() => toast.classList.add('hidden'), 3500);
    }
  };

  const triggerLivePickupAdjustment = (newVal: string) => {
    if (!newVal.trim()) return;
    setNewPickupValue(newVal);
    setIsPickupAdjusted(true);
    
    if (selectedRide) {
      setSelectedRide(prev => prev ? {
        ...prev,
        pickup: newVal,
        option: {
          ...prev.option,
          price: prev.option.price + 50 // add dynamic surcharge for location adjustment
        }
      } : null);
    }
    const toast = document.getElementById('gps_adjust_toast');
    if (toast) {
      toast.classList.remove('hidden');
      setTimeout(() => toast.classList.add('hidden'), 4000);
    }
  };

  const handleAddStop = () => {
    if (!stopInput.trim()) return;
    setAddedStops(prev => [...prev, { id: Date.now().toString(), name: stopInput.trim() }]);
    setStopInput('');
  };

  const handleRemoveStop = (id: string) => {
    setAddedStops(prev => prev.filter(s => s.id !== id));
  };

  const handleCompleteTrip = () => {
    setTripLiveStatus('completed');
    setIsReceiptModalOpen(true);
  };

  // Filter based on selected UI Category tab
  const filteredRides = comparedRides.filter(ride => {
    if (selectedVehicleType === 'All') return true;
    if (selectedVehicleType === 'Bike') return ride.vehicleType === 'Bike';
    if (selectedVehicleType === 'Auto') return ride.vehicleType === 'Auto';
    if (selectedVehicleType === 'Economy') return ['Mini', 'Sedan'].includes(ride.vehicleType);
    if (selectedVehicleType === 'Premium') return ['SUV', 'Premium', 'XL'].includes(ride.vehicleType);
    return true;
  });

  return (
    <div id="rides_module_container" className="p-4 max-w-6xl mx-auto space-y-6 font-sans text-gray-800">
      
      {/* Dynamic Non-Local Intercity Redirection Banner Overlay */}
      <AnimatePresence>
        {redirectingToIntercity && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="p-4 bg-amber-400 text-slate-950 rounded-full animate-bounce mb-4">
              <Navigation className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-display font-black text-white">Non-Local Trip Detected (&gt;35 km)</h3>
            <p className="text-gray-300 text-xs max-w-md mt-2 leading-relaxed">
              This route spans outside municipal limits. To guarantee lowest outstation tariff, professional certified highway drivers, and verified safety tools, we are <strong className="text-amber-400 font-bold">redirecting you to the Chalo Intercity Lounge</strong> automatically...
            </p>
            <div className="flex items-center space-x-2 mt-6">
              <div className="w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping"></div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest font-mono">Connecting Intercity API...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GPS toast notification systems */}
      <div id="gps_success_toast" className="hidden fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white font-medium text-xs px-4 py-2.5 rounded-xl shadow-lg flex items-center space-x-2 animate-fade-in border border-emerald-500">
        <CheckCircle className="w-4.5 h-4.5" />
        <span>GPS coordinates fetched successfully! Address reconfirmed.</span>
      </div>

      <div id="gps_adjust_toast" className="hidden fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-indigo-600 text-white font-medium text-xs px-4 py-2.5 rounded-xl shadow-lg flex items-center space-x-2 animate-fade-in border border-indigo-500">
        <SlidersHorizontal className="w-4.5 h-4.5" />
        <span>Pickup Spot adjusted! Route updated. Surcharge +₹50 applied to final invoice.</span>
      </div>

      {/* ----------------- STEP 1: COMPARE & SEARCH LIST SCREEN ----------------- */}
      {!viewingDetailRide && !selectedRide && (
        <div className="space-y-6">
          <div className="flex items-center space-x-2 pb-2">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
              <Navigation className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-display font-semibold tracking-tight">Compare Rides Instantly</h2>
              <p className="text-xs text-gray-500 font-medium">Live aggregated cabs from Ola, Uber, Rapido, BluSmart & Namma Yatri</p>
            </div>
          </div>

          <form onSubmit={handleCompare} className="p-4 bg-white rounded-2xl shadow-xs border border-gray-150 space-y-4">
            <ChaloMapView 
              label="Pickup Location"
              placeholder="Search pickup location (e.g. Koramangala, Airport)..."
              initialValue={pickup}
              onLocationSelect={(name, lat, lng) => {
                setPickup(name);
                if (lat && lng) setPickupCoords({ lat, lng });
              }}
              icon={<MapPin className="w-4 h-4 text-emerald-500" />}
              showMap={false}
            />

            <ChaloMapView 
              label="Drop Destination"
              placeholder="Search drop destination (e.g. Whitefield, Indiranagar)..."
              initialValue={destination}
              onLocationSelect={(name, lat, lng) => {
                setDestination(name);
                if (lat && lng) setDestCoords({ lat, lng });
              }}
              icon={<Compass className="w-4 h-4 text-amber-500" />}
              showMap={false}
            />

            {/* Quick Repeat Section */}
            <div className="pt-1.5 pb-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono block mb-2">
                ⏱️ Quick Repeat Frequents (One-Click Booking)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {FREQUENT_DESTINATIONS.map((dest, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleQuickRepeat(dest.name, dest.lat, dest.lng)}
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:border-amber-400 hover:bg-amber-50/25 text-left transition cursor-pointer flex items-start space-x-2 text-xs"
                  >
                    <div className="p-1 bg-amber-100 text-amber-700 rounded-lg mt-0.5 shrink-0">
                      <Clock className="w-3 h-3" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-extrabold text-slate-800 text-[11px] block truncate">
                        {dest.name.split(',')[0]}
                      </span>
                      <span className="text-[9px] text-slate-400 block truncate">
                        {dest.name.includes(',') ? dest.name.split(',')[1].trim() : 'Bengaluru'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              id="compare_rides_btn"
              className="w-full mt-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-white font-medium py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 text-xs cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-150" />
              <span>Search & Compare Cab Fares</span>
            </button>
          </form>

          {/* Searching Loader Animation */}
          {isSearching && (
            <div className="p-12 text-center bg-amber-50/50 rounded-2xl border border-dashed border-amber-200 animate-pulse">
              <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm font-medium text-amber-800">Sourcing live GPS routes and driver bids...</p>
              <p className="text-xs text-gray-400 mt-1">Comparing prices, active ETAs & platform fees across 5 networks</p>
            </div>
          )}

          {/* Ride Results comparison view */}
          {comparedRides.length > 0 && !isSearching && (
            <div className="space-y-3">
              {/* Vehicle Filter category rows */}
              <div className="flex space-x-1.5 overflow-x-auto py-1 scrollbar-none">
                {(['All', 'Bike', 'Auto', 'Economy', 'Premium'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedVehicleType(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all whitespace-nowrap ${
                      selectedVehicleType === cat
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Preference and Sorting Note */}
              <div className="flex items-center justify-between text-[11px] bg-amber-50 text-amber-800 px-3 py-2 rounded-xl border border-amber-100">
                <span className="font-mono uppercase tracking-wider font-extrabold flex items-center">
                  <Shield className="w-3 h-3 text-amber-600 mr-1" />
                  Preference: {preferenceMode === 'cheapest' ? '💰 Cheapest First' : preferenceMode === 'fastest' ? '⚡ Fastest' : preferenceMode === 'rated' ? '⭐ Safest/Highly-Rated' : '🎯 Favorite Apps Rank'}
                </span>
                <span className="font-bold">{filteredRides.length} Cabs Syncing</span>
              </div>

              {/* Aggregated Ride Cards */}
              <div className="space-y-2.5">
                {filteredRides.map((ride, idx) => {
                  const isEcoBest = idx === 0 && ride.price < 100;
                  const isFastest = ride.eta <= 3;
                  return (
                    <div
                      key={`${ride.platform}-${ride.vehicleType}-${idx}`}
                      onClick={() => setViewingDetailRide(ride)}
                      className="bg-white p-3.5 rounded-2xl border border-gray-150 hover:border-amber-400 hover:bg-amber-50/5 transition-all flex items-center justify-between relative shadow-xs cursor-pointer group"
                      title="Click to view full details, live map routes and fare breakdown"
                    >
                      {isEcoBest && (
                        <div className="absolute -top-2.5 left-4 bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center space-x-1">
                          <span>Cheapest Option</span>
                        </div>
                      )}
                      {isFastest && (
                        <div className="absolute -top-2.5 right-4 bg-indigo-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                          ⚡ Quick Pickup
                        </div>
                      )}

                      <div className="flex items-start space-x-3">
                        <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-gray-50 border border-gray-100 w-14 shrink-0 group-hover:bg-amber-100/50 transition">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-tight">{ride.platform}</span>
                          <span className="text-xs font-semibold text-gray-700 mt-1">{ride.vehicleType}</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-sm font-bold text-gray-950 font-display group-hover:text-amber-950 transition">
                              {ride.platform} {ride.vehicleType}
                            </span>
                            <span className="flex items-center text-[11px] bg-amber-100 text-amber-700 px-1.5 py-0.2 rounded font-mono font-bold">
                              <Star className="w-3 h-3 fill-amber-500 text-amber-500 mr-0.5" />
                              {ride.driverRating}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500">
                            <span className="flex items-center font-medium">
                              <Clock className="w-3.5 h-3.5 text-gray-400 mr-1" />
                              Driver: {ride.eta} mins away
                            </span>
                            <span>•</span>
                            <span className="text-amber-600 font-extrabold font-mono text-[11px]">
                              {ride.calculatedDistance || 12.5} km ({ride.tripDuration || 27} mins)
                            </span>
                            <span>•</span>
                            <span className="text-gray-450 text-[10.5px] truncate max-w-[130px]">{ride.cancellationPolicy}</span>
                          </div>
                          <p className="text-[10px] text-amber-600/90 font-mono font-bold animate-pulse group-hover:underline">
                            ✨ Click to view Route Map, Add Stops, or select Hourly Packages
                          </p>
                        </div>
                      </div>

                      <div className="text-right flex flex-col items-end pl-2">
                        <span className="text-lg font-mono font-black text-gray-900">₹{ride.price}</span>
                        <span className="text-[8px] font-mono text-gray-450 uppercase block mb-1">Platform Fees Included</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingDetailRide(ride);
                          }}
                          className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs py-1.5 px-3.5 rounded-xl font-bold transition-all shadow-xs cursor-pointer"
                        >
                          Verify Details
                        </button>
                      </div>
                    </div>
                  );
                })}

                {filteredRides.length === 0 && (
                  <div className="p-8 text-center bg-gray-50 rounded-2xl border border-gray-200">
                    <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-600">No cabs available in this vehicle category.</p>
                    <p className="text-xs text-gray-400 mt-1">Select another filter such as 'All' or 'Economy' to compare</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}


      {/* ----------------- STEP 2: DEDICATED BOOKING CONFIRMATION SCREEN ----------------- */}
      {viewingDetailRide && !selectedRide && (
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-gray-200">
            <button
              type="button"
              onClick={() => {
                setViewingDetailRide(null);
                setAddedStops([]);
                setHourlyPackage('standard');
                setIsPickupAdjusted(false);
              }}
              className="flex items-center space-x-1 text-xs font-bold text-gray-600 hover:text-slate-900 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Cab Results</span>
            </button>
            <div className="text-right">
              <span className="text-[10px] font-mono font-black bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                CONFIRMATION GATEWAY
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Interactive Map and Reconfirm options */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Dynamic Map view */}
              <div className="bg-white p-4 rounded-2xl border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase text-slate-400 font-mono tracking-wider">
                    🗺️ Active Draggable Route Map (Toggle Satellite View)
                  </h3>
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping mr-1"></span>
                    4 nearby cabs located
                  </span>
                </div>

                <div className="h-72 rounded-xl overflow-hidden border border-gray-200 shadow-inner">
                  <ChaloMapView
                    label="Adjust dropoff point / Pin drop"
                    placeholder="Drag map coordinates..."
                    initialValue={destination || "Koramangala, Bengaluru"}
                    onLocationSelect={(name, lat, lng) => {
                      setDestination(name);
                      if (lat && lng) {
                        setDestCoords({ lat, lng });
                        const d = getHaversineDistance(pickupCoords.lat, pickupCoords.lng, lat, lng);
                        const updated = getCalculatedRides(d).find(r => r.platform === viewingDetailRide.platform && r.vehicleType === viewingDetailRide.vehicleType);
                        if (updated) {
                          setViewingDetailRide(updated);
                        }
                      }
                    }}
                    showMap={true}
                  />
                </div>
              </div>

              {/* Reconfirm Pickup Area */}
              <div className="bg-white p-4 rounded-2xl border border-gray-200 space-y-3">
                <h3 className="text-xs font-black uppercase text-slate-400 font-mono tracking-wider">
                  📍 Reconfirm Pickup Coordinates
                </h3>
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                  <div className="flex-1 bg-slate-50 border border-slate-200 p-2.5 rounded-xl flex items-center space-x-2 text-xs">
                    <MapPin className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                    <input
                      type="text"
                      className="w-full bg-transparent outline-none font-semibold text-slate-800"
                      value={reconfirmPickupAddress || pickup}
                      onChange={(e) => setReconfirmPickupAddress(e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={triggerFetchCurrentLocation}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition whitespace-nowrap cursor-pointer flex items-center justify-center space-x-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Fetch Current Location (GPS)</span>
                  </button>
                </div>
              </div>

              {/* Add Stopover feature */}
              <div className="bg-white p-4 rounded-2xl border border-gray-200 space-y-3">
                <h3 className="text-xs font-black uppercase text-slate-400 font-mono tracking-wider flex items-center justify-between">
                  <span>➕ Stopovers / Extra Locations</span>
                  <span className="text-[9px] text-amber-600 lowercase bg-amber-50 px-2 py-0.5 rounded-full font-sans font-bold">
                    +₹75 per stopover added
                  </span>
                </h3>
                
                {addedStops.length > 0 && (
                  <div className="space-y-2 pb-2">
                    {addedStops.map((st, sIdx) => (
                      <div key={st.id} className="bg-slate-50 border border-slate-150 p-2 rounded-xl flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700">
                          Stop #{sIdx + 1}: {st.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveStop(st.id)}
                          className="text-red-500 hover:text-red-700 font-extrabold text-[10px]"
                        >
                          ✕ Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    className="flex-1 bg-slate-50 border border-slate-200 text-xs px-3 py-2 rounded-xl outline-none text-slate-800 focus:ring-1 focus:ring-amber-500"
                    placeholder="Type stop address (e.g. Indiranagar Metro, Café)..."
                    value={stopInput}
                    onChange={(e) => setStopInput(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={handleAddStop}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl transition"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Hourly Rental or Day-Wise packages */}
              <div className="bg-white p-4 rounded-2xl border border-gray-200 space-y-3">
                <h3 className="text-xs font-black uppercase text-slate-400 font-mono tracking-wider">
                  🕒 Hourly / Day-Wise private rentals
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setHourlyPackage('standard')}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      hourlyPackage === 'standard'
                        ? 'border-amber-500 bg-amber-50/20 text-slate-900 font-black'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50 text-xs'
                    }`}
                  >
                    <span className="text-[10px] block font-mono text-gray-400">IMMEDIATE</span>
                    <span className="text-xs block">Point-to-Point</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHourlyPackage('3hr')}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      hourlyPackage === '3hr'
                        ? 'border-amber-500 bg-amber-50/20 text-slate-900 font-black'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50 text-xs'
                    }`}
                  >
                    <span className="text-[10px] block font-mono text-gray-400">3 HOUR SLUMP</span>
                    <span className="text-xs block">3 Hrs / 30km (+₹450)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHourlyPackage('6hr')}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      hourlyPackage === '6hr'
                        ? 'border-amber-500 bg-amber-50/20 text-slate-900 font-black'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50 text-xs'
                    }`}
                  >
                    <span className="text-[10px] block font-mono text-gray-400">6 HOUR TOUR</span>
                    <span className="text-xs block">6 Hrs / 60km (+₹850)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHourlyPackage('12hr')}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      hourlyPackage === '12hr'
                        ? 'border-amber-500 bg-amber-50/20 text-slate-900 font-black'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50 text-xs'
                    }`}
                  >
                    <span className="text-[10px] block font-mono text-gray-400">FULL DAY PRIVATE</span>
                    <span className="text-xs block">12 Hrs / 120km (+₹1800)</span>
                  </button>
                </div>

                {hourlyPackage !== 'standard' && (
                  <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 text-indigo-950 text-xs space-y-1">
                    <h5 className="font-bold flex items-center">
                      <span>🕒 Minimum 3-Hour Buffer Rule engaged</span>
                    </h5>
                    <p className="text-[11px] text-indigo-700">
                      Private packages must be scheduled at least 3 hours prior to departure. Your chauffeur is reserved and scheduled to arrive on <strong className="font-extrabold">{new Date(Date.now() + 3 * 3600000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</strong> today.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Checkout details, partner sync & CTA */}
            <div className="space-y-6">
              
              {/* Linked Accounts Portal */}
              <div className="bg-slate-900 text-slate-200 p-4 rounded-3xl space-y-3.5 shadow-md">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-widest">
                    Linked Account API Gateway
                  </span>
                  <span className="text-[9px] bg-emerald-500 text-slate-950 font-black font-mono px-2 py-0.5 rounded-md">
                    SYNCHRONIZED
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Partner Platform</span>
                    <span className="font-bold text-white text-[12px]">{viewingDetailRide.platform.toUpperCase()} Developer Portal</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Authenticated user</span>
                    <span className="font-mono text-amber-400 font-bold text-[11px]">kunalpareek@gmail.com</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Token handshake</span>
                    <span className="font-mono text-[10px] text-slate-500">{viewingDetailRide.platform === 'Ola' ? 'OLA-GATEWAY-SYNC-912' : 'UBER-CLIENT-AUTH-PASS'}</span>
                  </div>
                </div>

                <p className="text-[9.5px] text-slate-400 leading-relaxed pt-1.5 border-t border-slate-800 font-mono">
                  🔒 Integrated through secure developer API tokens, bypassing browser headers. Secure payment settlement authorized.
                </p>
              </div>

              {/* Payment Mode Selector */}
              <div className="bg-white p-4 rounded-2xl border border-gray-200 space-y-3">
                <h3 className="text-xs font-black uppercase text-slate-400 font-mono tracking-wider">
                  Payment Mode Selection
                </h3>

                <div className="space-y-2">
                  <label className="flex items-center justify-between p-2.5 border border-slate-150 rounded-xl cursor-pointer hover:bg-slate-50">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="pay_mode"
                        className="accent-amber-500"
                        checked={chosenPaymentMode === 'wallet'}
                        onChange={() => setChosenPaymentMode('wallet')}
                      />
                      <span className="text-xs font-bold text-slate-800">Chalo One Wallet Coins</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-500">
                      Bal: ₹{walletBalance}
                    </span>
                  </label>

                  <label className="flex items-center justify-between p-2.5 border border-slate-150 rounded-xl cursor-pointer hover:bg-slate-50">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="pay_mode"
                        className="accent-amber-500"
                        checked={chosenPaymentMode === 'upi'}
                        onChange={() => setChosenPaymentMode('upi')}
                      />
                      <span className="text-xs font-bold text-slate-800">Google Pay UPI Auto-Debit</span>
                    </div>
                    <span className="text-[10px] text-emerald-600 font-bold">LINKED</span>
                  </label>

                  <label className="flex items-center justify-between p-2.5 border border-slate-150 rounded-xl cursor-pointer hover:bg-slate-50">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="pay_mode"
                        className="accent-amber-500"
                        checked={chosenPaymentMode === 'netbanking'}
                        onChange={() => setChosenPaymentMode('netbanking')}
                      />
                      <span className="text-xs font-bold text-slate-800">Direct NetBanking Settlement</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">HDFC/ICICI</span>
                  </label>
                </div>
              </div>

              {/* Cost Summary Breakdown (FEES INSTEAD OF COMMISSION) */}
              <div className="bg-amber-50/30 p-4 rounded-3xl border border-amber-100 space-y-3">
                <h3 className="text-xs font-black uppercase text-slate-400 font-mono tracking-wider">
                  Verified Fare Receipt Breakdown
                </h3>

                <div className="space-y-2 text-xs text-slate-700 font-medium">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Base ride price</span>
                    <span className="font-mono">₹{originalPrice}</span>
                  </div>

                  {addedStops.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Stops surcharge ({addedStops.length} stops)</span>
                      <span className="font-mono text-indigo-700 font-bold">+₹{stopsFare}</span>
                    </div>
                  )}

                  {hourlyPackage !== 'standard' && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Private rental package</span>
                      <span className="font-mono text-indigo-700 font-bold">+₹{hourlyFare}</span>
                    </div>
                  )}

                  {isPickupAdjusted && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Adjusted pickup surcharge</span>
                      <span className="font-mono text-indigo-700 font-bold">+₹{adjustedPickupFare}</span>
                    </div>
                  )}

                  <div className="flex justify-between pt-2 border-t border-slate-200/80">
                    <span className="text-slate-500">Platform Handling Fees (5% convenience)</span>
                    <span className="font-mono text-slate-500 font-semibold">₹{platformFees} (included)</span>
                  </div>

                  <div className="flex justify-between pt-2.5 border-t border-slate-200 text-sm font-black text-slate-900 font-display">
                    <span>Final Verified Fare</span>
                    <span className="font-mono text-base text-slate-950 font-black">₹{totalFare}</span>
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    type="button"
                    onClick={handleConfirmAndBook}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-slate-950 font-display font-black py-3 px-4 rounded-2xl text-xs shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2"
                  >
                    <CheckCircle className="w-4.5 h-4.5" />
                    <span>CONFIRM & BOOK {viewingDetailRide.platform.toUpperCase()} CAB</span>
                  </button>
                  <p className="text-center text-[9px] text-gray-400 font-mono mt-2 uppercase tracking-wide">
                    Tolls included • No hidden surcharges • 100% Locked Rate
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ----------------- STEP 3: ACTIVE LIVE TRACKING SCREEN ----------------- */}
      {selectedRide && (
        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
                <span className="text-xs font-black uppercase font-mono tracking-widest text-amber-400">
                  🔴 LIVE TRIP STATUS: {tripLiveStatus === 'driver_assigned' ? 'DRIVER DISPATCHED' : tripLiveStatus === 'arriving' ? 'CAB ARRIVING NEARBY' : tripLiveStatus === 'active' ? 'EN ROUTE / ONGOING' : 'COMPLETED'}
                </span>
              </div>
              <p className="text-xs text-gray-300 font-medium mt-1">
                OTP PIN Code: <strong className="text-amber-400 font-mono text-base ml-1">{selectedRide.otp}</strong>
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-xs text-gray-400 font-mono">Platform API Sync:</span>
              <span className="text-xs font-bold bg-amber-400 text-slate-950 px-2.5 py-1 rounded-lg">
                OLANet / Uber Engine Gateway (OLA-811)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Live GPS Map and Trip Progress */}
            <div className="lg:col-span-2 space-y-6">
              
              <div className="bg-white p-4 rounded-2xl border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase text-slate-400 font-mono tracking-wider">
                    🛰️ Live GPS Driver Tracking & Navigation (Satellite view toggle active)
                  </h3>
                  <span className="text-xs font-bold text-amber-600 font-mono bg-amber-50 px-2 py-0.5 rounded-md">
                    {tripLiveStatus === 'driver_assigned' && 'GPS: Driver preparing...'}
                    {tripLiveStatus === 'arriving' && 'GPS: Driver 150 meters away!'}
                    {tripLiveStatus === 'active' && 'GPS: Driver cruising at 48 km/h'}
                    {tripLiveStatus === 'completed' && 'GPS: Arrived safely at destination'}
                  </span>
                </div>

                {/* Tracking Interactive Map Component */}
                <div className="h-80 rounded-xl overflow-hidden border border-gray-200">
                  <ChaloMapView
                    label="Active Route details"
                    placeholder="Viewing driver coordinates on Google Maps..."
                    initialValue={destination || "Koramangala, Bengaluru"}
                    onLocationSelect={() => {}}
                    showMap={true}
                  />
                </div>

                {/* Progress bar timeline indicators */}
                <div className="grid grid-cols-4 gap-2 pt-2 text-center text-[10px] font-bold text-gray-400">
                  <div className={`p-2 rounded-xl border ${tripLiveStatus === 'driver_assigned' ? 'border-amber-500 bg-amber-50/20 text-slate-900 font-black' : 'border-slate-100 bg-slate-50'}`}>
                    <span>1. Assigned</span>
                  </div>
                  <div className={`p-2 rounded-xl border ${tripLiveStatus === 'arriving' ? 'border-amber-500 bg-amber-50/20 text-slate-900 font-black' : 'border-slate-100 bg-slate-50'}`}>
                    <span>2. Arriving</span>
                  </div>
                  <div className={`p-2 rounded-xl border ${tripLiveStatus === 'active' ? 'border-amber-500 bg-amber-50/20 text-slate-900 font-black' : 'border-slate-100 bg-slate-50'}`}>
                    <span>3. En-Route</span>
                  </div>
                  <div className={`p-2 rounded-xl border ${tripLiveStatus === 'completed' ? 'border-amber-500 bg-amber-50/20 text-slate-900 font-black' : 'border-slate-100 bg-slate-50'}`}>
                    <span>4. Completed</span>
                  </div>
                </div>
              </div>

              {/* Adjust pickup before arrival feature */}
              {(tripLiveStatus === 'driver_assigned' || tripLiveStatus === 'arriving') && (
                <div className="bg-white p-4 rounded-2xl border border-gray-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase text-slate-400 font-mono tracking-wider">
                      📍 Adjust Pickup Spot (Change before driver reaches)
                    </h3>
                    <span className="text-[10px] text-amber-600 bg-amber-50 font-bold px-2 py-0.5 rounded-full font-mono uppercase">
                      ⚠️ Alters final invoice fare by +₹50 due to distance adjustment
                    </span>
                  </div>

                  <div className="flex space-x-2">
                    <input
                      type="text"
                      className="flex-1 bg-slate-50 border border-slate-200 text-xs px-3 py-2.5 rounded-xl outline-none text-slate-800"
                      placeholder="Enter new pickup spot (e.g. Koramangala 5th Block)..."
                      id="live_adjust_pickup_input"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById('live_adjust_pickup_input') as HTMLInputElement;
                        if (input && input.value) {
                          triggerLivePickupAdjustment(input.value);
                          input.value = '';
                        }
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 rounded-xl transition"
                    >
                      Update Spot
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Driver, vehicle details and SOS actions */}
            <div className="space-y-6">
              
              {/* Full Driver & Vehicle Details Profile */}
              <div className="bg-white p-5 rounded-3xl border border-gray-200 space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 font-black flex items-center justify-center rounded-full text-lg shadow-md border-2 border-white">
                    {selectedRide.driverName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-display font-black text-base text-slate-900">{selectedRide.driverName}</h4>
                    <div className="flex items-center space-x-1.5 mt-0.5">
                      <span className="text-xs font-black bg-slate-950 text-amber-400 px-2 py-0.5 rounded font-mono">
                        {selectedRide.option.driverRating} ★
                      </span>
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                        Top 1% Bangalore Riders
                      </span>
                    </div>
                  </div>
                </div>

                {/* Vehicle specifications and rankings */}
                <div className="border-t border-slate-100 pt-3.5 space-y-2.5 text-xs text-slate-700">
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-400">Assigned Car</span>
                    <span className="font-bold text-slate-900">Pearl White Hyundai Accent Prime</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-400">License Plate</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">{selectedRide.vehicleNumber}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-400">Class Rank Category</span>
                    <span className="text-indigo-600 font-bold">⭐ Elite Certified Partner</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-400">ETA to Locations</span>
                    <span className="text-slate-900 font-extrabold font-mono text-[12px]">
                      {tripLiveStatus === 'driver_assigned' ? 'Arriving in 3 mins' : tripLiveStatus === 'arriving' ? 'Arriving in 1 min' : 'Cruising (21 mins to drop)'}
                    </span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-400">Mode of Payment</span>
                    <span className="font-bold text-indigo-700">Chalo One Wallet Balance</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-medium">Call Private Driver:</span>
                  <a
                    href={`tel:${selectedRide.driverPhone}`}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-700 transition"
                    title="Call Driver"
                  >
                    <PhoneCall className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Immediate SOS and Simulation Controller Panel */}
              <div className="bg-white p-5 rounded-3xl border border-gray-200 space-y-3.5">
                <h3 className="text-xs font-black uppercase text-slate-400 font-mono tracking-wider">
                  Active Ride Security Control
                </h3>

                <button
                  type="button"
                  id="sos_dispatcher_btn"
                  onClick={handleSOS}
                  className="w-full bg-red-600 hover:bg-red-700 hover:shadow-lg text-white font-bold py-3 px-4 rounded-xl transition flex items-center justify-center space-x-2 text-xs cursor-pointer"
                >
                  <ShieldAlert className="w-4.5 h-4.5 animate-bounce text-white" />
                  <span>TRIGGER CHALO EMERGENCY SOS</span>
                </button>

                <AnimatePresence>
                  {sosTriggered && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-2 text-red-800"
                    >
                      <ShieldAlert className="w-5 h-5 shrink-0 text-red-600 mt-0.5 animate-ping" />
                      <div className="text-left">
                        <h5 className="text-xs font-bold uppercase tracking-wider text-red-700">🚨 SOS Broadcast Dispatched!</h5>
                        <p className="text-[10.5px] text-red-600 mt-1 leading-relaxed">
                          Your coordinates, real-time vehicle register ({selectedRide.vehicleNumber}), and driver identity ({selectedRide.driverName}) have been shared with local emergency control authorities and your Linked Emergency Accounts list.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Simulation Completer Button */}
                {tripLiveStatus !== 'completed' && (
                  <button
                    type="button"
                    onClick={handleCompleteTrip}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-display font-black py-3 px-4 rounded-xl text-xs transition cursor-pointer flex items-center justify-center space-x-1.5"
                  >
                    <CheckCircle className="w-4.5 h-4.5 text-emerald-400" />
                    <span>DEBUG: Simulate Arriving Destination</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setSelectedRide(null);
                    setViewingDetailRide(null);
                    setAddedStops([]);
                    setHourlyPackage('standard');
                    setIsPickupAdjusted(false);
                  }}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs py-2.5 rounded-xl transition font-medium cursor-pointer"
                >
                  Cancel Reservation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ----------------- STEP 4: TAX INVOICE & RECEIPT MODAL ON COMPLETION ----------------- */}
      <AnimatePresence>
        {isReceiptModalOpen && selectedRide && (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]"
            >
              {/* Receipt Header */}
              <div className="p-5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-emerald-100" />
                  <div>
                    <h3 className="font-display font-black text-sm uppercase tracking-wide">
                      Chalo One Tax Invoice
                    </h3>
                    <span className="text-[9px] font-bold uppercase tracking-wider block opacity-90 font-mono">
                      Ride Completed Successfully
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsReceiptModalOpen(false);
                    setSelectedRide(null);
                    setViewingDetailRide(null);
                    setAddedStops([]);
                    setHourlyPackage('standard');
                    setIsPickupAdjusted(false);
                  }}
                  className="bg-slate-950/20 hover:bg-slate-950/40 text-white p-2 rounded-full transition font-bold text-xs font-mono"
                >
                  ✕ CLOSE
                </button>
              </div>

              {/* Receipt Body */}
              <div className="p-6 overflow-y-auto space-y-4">
                
                {/* Success Banner */}
                <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl flex items-start space-x-2.5 text-xs text-emerald-800">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <h5 className="font-bold">Trip Completed Successfully!</h5>
                    <p className="text-[11px] text-emerald-700 mt-0.5 leading-relaxed">
                      Your booking receipt and full trip metrics invoice have been safely dispatched to <strong className="font-bold text-emerald-950">kunal@chalo.app</strong>.
                    </p>
                  </div>
                </div>

                {/* Trip Route Details */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-150 space-y-2.5 text-xs">
                  <div>
                    <span className="text-[8px] font-black font-mono text-gray-400 block uppercase">
                      Pickup Address (Reconfirmed)
                    </span>
                    <p className="font-bold text-slate-800">{selectedRide.pickup}</p>
                  </div>
                  <div>
                    <span className="text-[8px] font-black font-mono text-gray-400 block uppercase">
                      Drop Destination
                    </span>
                    <p className="font-bold text-slate-800">{selectedRide.destination}</p>
                  </div>
                  {addedStops.length > 0 && (
                    <div>
                      <span className="text-[8px] font-black font-mono text-gray-400 block uppercase">
                        Stopover Points ({addedStops.length})
                      </span>
                      <p className="text-slate-600 font-medium">
                        {addedStops.map(st => st.name).join(' ➔ ')}
                      </p>
                    </div>
                  )}
                  {hourlyPackage !== 'standard' && (
                    <div>
                      <span className="text-[8px] font-black font-mono text-gray-400 block uppercase">
                        Hourly Private Rental Surcharge
                      </span>
                      <p className="text-slate-600 font-bold">
                        {hourlyPackage === '3hr' ? '3 Hours Package' : hourlyPackage === '6hr' ? '6 Hours Package' : '12 Hours Day-Wise'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Driver & Vehicle Receipt details */}
                <div className="border border-slate-150 rounded-2xl divide-y divide-slate-100 overflow-hidden text-xs text-slate-700">
                  <div className="p-3 bg-slate-50/50 flex justify-between font-semibold">
                    <span>Professional Chauffeur</span>
                    <span>{selectedRide.driverName}</span>
                  </div>
                  <div className="p-3 bg-slate-50/50 flex justify-between font-mono">
                    <span>Vehicle License Plate</span>
                    <span>{selectedRide.vehicleNumber}</span>
                  </div>
                  <div className="p-3 bg-slate-50/50 flex justify-between">
                    <span>Platform Service</span>
                    <span className="font-bold uppercase text-indigo-700">{selectedRide.option.platform} Gateway</span>
                  </div>
                  <div className="p-3 bg-slate-50/50 flex justify-between">
                    <span>Payment Mode Settle</span>
                    <span className="font-bold text-emerald-700">Chalo One Wallet Debit</span>
                  </div>
                </div>

                {/* Total pricing itemized breakdown (FEES INSTEAD OF COMMISSION) */}
                <div className="space-y-1.5">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-mono block">
                    INVOICE BILL DETAILS
                  </span>
                  <div className="border border-slate-150 rounded-2xl divide-y divide-slate-100 overflow-hidden text-xs">
                    <div className="p-3 bg-slate-50/50 flex justify-between text-slate-500">
                      <span>Ride Base Cost Sourced</span>
                      <span className="font-mono text-slate-800">₹{selectedRide.option.price - stopsFare - hourlyFare - adjustedPickupFare}</span>
                    </div>

                    {addedStops.length > 0 && (
                      <div className="p-3 bg-slate-50/50 flex justify-between text-slate-500">
                        <span>Extra stopovers fees (+₹75/stop)</span>
                        <span className="font-mono text-slate-800">₹{stopsFare}</span>
                      </div>
                    )}

                    {hourlyPackage !== 'standard' && (
                      <div className="p-3 bg-slate-50/50 flex justify-between text-slate-500">
                        <span>Hourly private package levy</span>
                        <span className="font-mono text-slate-800">₹{hourlyFare}</span>
                      </div>
                    )}

                    {isPickupAdjusted && (
                      <div className="p-3 bg-slate-50/50 flex justify-between text-slate-500">
                        <span>Adjusted Pickup surcharge</span>
                        <span className="font-mono text-slate-800">₹{adjustedPickupFare}</span>
                      </div>
                    )}

                    <div className="p-3 bg-slate-50/50 flex justify-between text-slate-500">
                      <span>Convenience Platform Fees (5% convenience)</span>
                      <span className="font-mono text-emerald-700 font-bold">₹{Math.round(selectedRide.option.price * 0.05)} (Included)</span>
                    </div>

                    <div className="p-4 bg-emerald-500/10 flex justify-between items-center text-sm font-black text-slate-900 font-display">
                      <span>Total Amount Settled</span>
                      <span className="font-mono text-base text-emerald-950 font-black">₹{selectedRide.option.price}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal action buttons */}
              <div className="p-4 bg-slate-50 border-t border-slate-150 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsReceiptModalOpen(false);
                    setSelectedRide(null);
                    setViewingDetailRide(null);
                    setAddedStops([]);
                    setHourlyPackage('standard');
                    setIsPickupAdjusted(false);
                  }}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-display font-black py-3 px-4 rounded-xl text-xs transition cursor-pointer"
                >
                  Dismiss & Return to Compare
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
