import React, { useState, useEffect } from 'react';
import { RIDE_CATALOG } from '../data';
import { RideOption, SelectedRide } from '../types';
import { MapPin, Navigation, Compass, ShieldAlert, PhoneCall, Star, Clock, AlertCircle, Sparkles, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RidesModuleProps {
  preferenceMode: string;
  defaultRidesOrder: string[];
  addOrderToActivity: (order: any) => void;
  walletBalance: number;
  deductWalletCoins: (rs: number) => void;
}

export default function RidesModule({
  preferenceMode,
  defaultRidesOrder,
  addOrderToActivity,
  walletBalance,
  deductWalletCoins
}: RidesModuleProps) {
  const [pickup, setPickup] = useState('My Current Location (Blinkit HQ, Bangalore)');
  const [destination, setDestination] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [comparedRides, setComparedRides] = useState<RideOption[]>([]);
  const [selectedRide, setSelectedRide] = useState<SelectedRide | null>(null);
  const [sosTriggered, setSosTriggered] = useState(false);
  const [selectedVehicleType, setSelectedVehicleType] = useState<'All' | 'Bike' | 'Auto' | 'Economy' | 'Premium'>('All');

  // Trigger comparisons when search clicked
  const handleCompare = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim()) return;

    setIsSearching(true);
    setComparedRides([]);
    setSelectedRide(null);

    setTimeout(() => {
      // Simulate API response fetching live ride options
      let rideOptions = [...RIDE_CATALOG];

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

  // Select Ride & Start Simulation
  const handleBookRide = (ride: RideOption) => {
    const driverNames = ["Rajesh Kumar", "Amit Singh", "Manpreet S.", "Suresh Gowda", "Arjun Prasad"];
    const vehicles = ["KA-03-MJ-5120", "KA-51-AB-8109", "KA-01-EE-4412", "KA-04-NX-7845", "KA-02-PP-9011"];
    const randomDriver = driverNames[Math.floor(Math.random() * driverNames.length)];
    const randomVehicle = vehicles[Math.floor(Math.random() * vehicles.length)];
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    const newRide: SelectedRide = {
      option: ride,
      pickup,
      destination,
      driverName: randomDriver,
      driverPhone: "+91 98765 4" + Math.floor(10000 + Math.random() * 90000),
      vehicleNumber: randomVehicle,
      status: 'driver_assigned',
      driverLat: 12.9716,
      driverLng: 77.5946,
      otp
    };

    setSelectedRide(newRide);

    // Dynamic Tracking Lifecycle simulation
    setTimeout(() => {
      setSelectedRide(prev => prev ? { ...prev, status: 'arriving' } : null);
    }, 4000);

    setTimeout(() => {
      setSelectedRide(prev => prev ? { ...prev, status: 'active' } : null);
    }, 10000);

    // Save transaction activity logs
    addOrderToActivity({
      id: "CHALO-RIDE-" + Math.floor(100000 + Math.random() * 900000),
      category: 'rides',
      platform: ride.platform,
      merchant: `Cab: ${ride.vehicleType}`,
      title: `${pickup} ➔ ${destination}`,
      subtitle: `Driver Assigned: ${randomDriver}`,
      date: "Today",
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      amount: ride.price,
      status: 'active',
      statusLabel: 'Ongoing',
      paymentMethod: 'Chalo Wallet Auto-Debit'
    });
  };

  const handleSOS = () => {
    setSosTriggered(true);
    setTimeout(() => {
      setSosTriggered(false);
    }, 5000);
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
    <div id="rides_module_container" className="p-4 max-w-xl mx-auto space-y-4 font-sans text-gray-800">
      <div className="flex items-center space-x-2 pb-2">
        <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
          <Navigation className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h2 className="text-xl font-display font-semibold tracking-tight">Compare Rides Instantly</h2>
          <p className="text-xs text-gray-500">Live aggregated cabs from Ola, Uber, Rapido, BluSmart & Namma Yatri</p>
        </div>
      </div>

      {/* Main Form Fields */}
      {!selectedRide && (
        <form onSubmit={handleCompare} className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 space-y-3">
          <div className="flex items-center space-x-2 border-b border-gray-100 pb-2">
            <MapPin className="w-5 h-5 text-emerald-500 shrink-0" />
            <input
              type="text"
              value={pickup}
              onChange={(e) => setPickup(e.target.value)}
              placeholder="Pickup Location"
              id="pickup_input"
              className="w-full text-sm outline-none font-medium placeholder-gray-400"
              required
            />
          </div>
          <div className="flex items-center space-x-2 pt-1">
            <Compass className="w-5 h-5 text-amber-500 shrink-0" />
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Enter Drop Location (e.g. Airport, Whitefield)"
              id="drop_input"
              className="w-full text-sm outline-none font-medium focus:text-amber-600 placeholder-gray-400"
              required
            />
          </div>

          <button
            type="submit"
            id="compare_rides_btn"
            className="w-full mt-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-white font-medium py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 text-sm cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-100" />
            <span>Search & Compare Cab Fares</span>
          </button>
        </form>
      )}

      {/* Searching Loader Animation */}
      {isSearching && (
        <div className="p-12 text-center bg-amber-50/50 rounded-2xl border border-dashed border-amber-200">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm font-medium text-amber-800">Sourcing live GPS routes and driver bids...</p>
          <p className="text-xs text-gray-400 mt-1">Comparing prices, active ETAs & surcharges across 5 networks</p>
        </div>
      )}

      {/* Ride Results comparison view */}
      {!selectedRide && comparedRides.length > 0 && !isSearching && (
        <div className="space-y-3">
          {/* Vehicle Filter category rows */}
          <div className="flex space-x-1.5 overflow-x-auto py-1 scrollbar-none">
            {(['All', 'Bike', 'Auto', 'Economy', 'Premium'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedVehicleType(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors whitespace-nowrap ${
                  selectedVehicleType === cat
                    ? 'bg-amber-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Preference and Sorting Note */}
          <div className="flex items-center justify-between text-[11px] bg-amber-50 text-amber-800 px-3 py-2 rounded-lg">
            <span className="font-mono uppercase tracking-wider font-semibold">Preference: {preferenceMode === 'cheapest' ? '💰 Cheapest First' : preferenceMode === 'fastest' ? '⚡ Fastest' : preferenceMode === 'rated' ? '⭐ Safest/Highly-Rated' : '🎯 Favorite Apps Rank'}</span>
            <span>{filteredRides.length} Cabs Syncing</span>
          </div>

          {/* Aggregated Ride Cards */}
          <div className="space-y-2.5">
            {filteredRides.map((ride, idx) => {
              // Custom logos simulated
              const isEcoBest = idx === 0 && ride.price < 100;
              const isFastest = ride.eta <= 3;
              return (
                <div
                  key={`${ride.platform}-${ride.vehicleType}-${idx}`}
                  className="bg-white p-3.5 rounded-2xl border border-gray-150 hover:border-amber-400 transition-all flex items-center justify-between relative shadow-xs"
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
                    <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-gray-50 border border-gray-100 w-14 shrink-0">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{ride.platform}</span>
                      <span className="text-xs font-semibold text-gray-700 mt-1">{ride.vehicleType}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1">
                        <span className="text-sm font-bold text-gray-950 font-display">{ride.platform} {ride.vehicleType}</span>
                        <span className="flex items-center text-[11px] bg-amber-100 text-amber-700 px-1.5 py-0.2 rounded font-mono font-bold">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500 mr-0.5" />
                          {ride.driverRating}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3 text-xs text-gray-500">
                        <span className="flex items-center">
                          <Clock className="w-3.5 h-3.5 text-gray-400 mr-1" />
                          Driver in {ride.eta} mins
                        </span>
                        <span>•</span>
                        <span className="text-gray-400 text-[11px] truncate max-w-[130px]">{ride.cancellationPolicy}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end pl-2">
                    <span className="text-lg font-mono font-bold text-gray-900">₹{ride.price}</span>
                    <button
                      type="button"
                      onClick={() => handleBookRide(ride)}
                      className="mt-1 bg-amber-500 hover:bg-amber-600 text-white text-xs py-1.5 px-3 rounded-lg font-bold transition-all shadow-xs cursor-pointer"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredRides.length === 0 && (
              <div className="p-8 text-center bg-gray-50 rounded-2xl border border-gray-200">
                <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-600">No cabs available in this vehicle category.</p>
                <p className="text-xs text-gray-400">Select another filter such as 'All' or 'Economy' to compare</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detailed Live Tracking Simulation screen */}
      {selectedRide && (
        <div className="p-4 bg-white rounded-2xl border border-amber-100 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <span className="text-xs font-bold font-mono tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase">
                {selectedRide.status === 'driver_assigned' && 'Driver Assigned'}
                {selectedRide.status === 'arriving' && 'Arriving Nearby'}
                {selectedRide.status === 'active' && 'Trip In-Progress'}
              </span>
              <p className="text-xs text-gray-400 mt-1">OTP: <strong className="text-gray-800 font-mono text-sm">{selectedRide.otp}</strong></p>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-400 block font-semibold">{selectedRide.option.platform} fare</span>
              <span className="text-base font-mono font-extrabold text-gray-900">₹{selectedRide.option.price}</span>
            </div>
          </div>

          {/* Simple Vector Map Simulation */}
          <div className="relative h-44 bg-slate-900 rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
            {/* Map lines rendering */}
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]"></div>
            <div className="absolute h-0.5 w-[80%] bg-emerald-500/40 rotate-[22deg] pointer-events-none"></div>
            <div className="absolute h-0.5 w-[60%] bg-amber-500/40 -rotate-[35deg] pointer-events-none"></div>

            {/* Pickup Node */}
            <div className="absolute left-[20%] top-[40%] flex flex-col items-center">
              <div className="w-3.5 h-3.5 bg-indigo-500 rounded-full border-2 border-white animate-pulse"></div>
              <span className="text-[9px] text-indigo-200 mt-1 font-mono font-bold bg-indigo-950/80 px-1 py-0.2 rounded">PICKUP</span>
            </div>

            {/* Destination Node */}
            <div className="absolute right-[20%] top-[25%] flex flex-col items-center animate-pulse">
              <div className="w-4 h-4 bg-emerald-500 rounded-full border-2 border-white"></div>
              <span className="text-[9px] text-emerald-200 mt-1 font-mono font-bold bg-emerald-950/80 px-1 py-0.2 rounded">DROP</span>
            </div>

            {/* Driver Cab Pin simulating movement */}
            <motion.div 
              className="absolute flex flex-col items-center"
              initial={{ left: '10%', top: '75%' }}
              animate={{
                left: selectedRide.status === 'driver_assigned' ? '15%' : selectedRide.status === 'arriving' ? '19%' : '50%',
                top: selectedRide.status === 'driver_assigned' ? '65%' : selectedRide.status === 'arriving' ? '45%' : '35%'
              }}
              transition={{ duration: 15, ease: 'easeInOut' }}
            >
              <div className="w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center shadow-lg border border-white">
                🚕
              </div>
              <span className="text-[9px] text-gray-900 font-bold bg-amber-400 px-1 rounded shadow-xs mt-1 font-mono">{selectedRide.vehicleNumber}</span>
            </motion.div>

            <div className="absolute bottom-2 left-2 bg-black/75 px-2 py-1 rounded text-[10px] text-gray-300 font-mono tracking-tight">
              {selectedRide.status === 'driver_assigned' && 'GPS: Searching driver route...'}
              {selectedRide.status === 'arriving' && 'GPS: Cab is 100 meters away.'}
              {selectedRide.status === 'active' && 'GPS: Cruising on highway.'}
            </div>
          </div>

          {/* Driver Metadata Panel */}
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-150 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-amber-200 text-amber-900 font-bold flex items-center justify-center rounded-full text-base">
                {selectedRide.driverName.charAt(0)}
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">{selectedRide.driverName}</h4>
                <div className="flex items-center text-xs text-gray-500 space-x-2">
                  <span>Rating: {selectedRide.option.driverRating} ★</span>
                  <span>•</span>
                  <span className="font-mono text-gray-600">{selectedRide.vehicleNumber}</span>
                </div>
              </div>
            </div>
            
            <a
              href={`tel:${selectedRide.driverPhone}`}
              className="p-2.5 bg-gray-200 hover:bg-gray-300 rounded-full text-gray-700 transition"
              title="Call Driver"
            >
              <PhoneCall className="w-4 h-4" />
            </a>
          </div>

          {/* Actions & SOS triggers */}
          <div className="flex space-x-3 pt-1">
            <button
              type="button"
              id="sos_dispatcher_btn"
              onClick={handleSOS}
              className="flex-1 bg-red-600 hover:bg-red-700 hover:shadow-lg text-white font-bold py-2.5 px-4 rounded-xl transition flex items-center justify-center space-x-2 text-xs cursor-pointer"
            >
              <ShieldAlert className="w-4.5 h-4.5 animate-bounce" />
              <span>TRIGGER CHALO EMERGENCY SOS</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRide(null)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-4 rounded-xl transition font-medium cursor-pointer"
            >
              Cancel Reservation
            </button>
          </div>

          <AnimatePresence>
            {sosTriggered && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-2 text-red-800"
              >
                <ShieldAlert className="w-5 h-5 shrink-0 text-red-600 mt-0.5 animate-ping" />
                <div>
                  <h5 className="text-xs font-bold uppercase tracking-wider text-red-700">🚨 Emergency SOS Dispatched!</h5>
                  <p className="text-[11px] text-red-600 mt-1">
                    Your real-time coordinates, ride route link, driver ID ({selectedRide.driverName}), and vehicle register ({selectedRide.vehicleNumber}) have been safely broadcasted. Live security feed engaged!
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
