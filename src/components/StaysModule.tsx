import React, { useState } from 'react';
import { HOTELS_CATALOG } from '../data';
import { HotelOption, StayQuery } from '../types';
import { Bed, Calendar, Users, MapPin, Sparkles, Star, Tag, Info, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface StaysModuleProps {
  addOrderToActivity: (order: any) => void;
}

export default function StaysModule({ addOrderToActivity }: StaysModuleProps) {
  const [destination, setDestination] = useState('Goa');
  const [recentSearches, setRecentSearches] = useState<string[]>(['Goa', 'Jaipur', 'Delhi']);
  const [searchFocused, setSearchFocused] = useState(false);
  const [checkIn, setCheckIn] = useState('2026-06-25');
  const [checkOut, setCheckOut] = useState('2026-06-28');
  const [guests, setGuests] = useState(2);
  const [rooms, setRooms] = useState(1);
  const [hasSearched, setHasSearched] = useState(true);
  const [selectedBookings, setSelectedBookings] = useState<{ [hotelId: string]: string }>({});

  const handleDestinationSubmit = (val: string) => {
    setDestination(val);
    setSearchFocused(false);
    setRecentSearches(prev => {
      const filtered = prev.filter(q => q.toLowerCase() !== val.toLowerCase());
      return [val, ...filtered].slice(0, 5);
    });
    setHasSearched(true);
  };

  const calculateDays = () => {
    const d1 = new Date(checkIn);
    const d2 = new Date(checkOut);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return isNaN(diffDays) ? 1 : diffDays;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);
  };

  const handleBookHotel = (hotel: HotelOption, platform: string, totalFare: number) => {
    setSelectedBookings(prev => ({ ...prev, [hotel.id]: platform }));

    addOrderToActivity({
      id: "CHALO-STAY-" + Math.floor(100000 + Math.random() * 900000),
      category: 'stays',
      platform,
      merchant: hotel.name,
      title: `${hotel.name} Booking`,
      subtitle: `${guests} Guests, ${rooms} Room(s) • ${calculateDays()} night(s)`,
      date: "Stay Confirmed",
      time: `${checkIn} to ${checkOut}`,
      amount: totalFare,
      status: 'upcoming',
      statusLabel: 'Upcoming Stay',
      paymentMethod: 'Credit Card Split Settlement'
    });
  };

  const calculateTotalFare = (pricePerNight: number, taxes: number) => {
    const nights = calculateDays();
    return (pricePerNight * nights * rooms) + taxes;
  };

  // Filter based on destination search
  const filteredHotels = HOTELS_CATALOG.filter(hotel =>
    hotel.name.toLowerCase().includes(destination.toLowerCase()) ||
    hotel.distance.toLowerCase().includes(destination.toLowerCase())
  );

  return (
    <div id="stays_module_container" className="p-4 max-w-xl mx-auto space-y-4 font-sans text-gray-800">
      <div className="flex items-center space-x-2 pb-2">
        <div className="p-2 bg-indigo-100 rounded-lg text-indigo-700">
          <Bed className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-display font-semibold tracking-tight text-indigo-950">Chalo Stay Planner</h2>
          <p className="text-xs text-gray-500">Live price comparison across Agoda, Booking.com, MMT & Goibibo</p>
        </div>
      </div>

      {/* Stay Booking Lookup forms */}
      <form onSubmit={(e) => {
        e.preventDefault();
        handleDestinationSubmit(destination);
      }} className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 space-y-3">
        <div className="flex items-center space-x-2 bg-gray-50 p-2.5 rounded-xl border border-gray-150">
          <MapPin className="w-4 h-4 text-indigo-600 shrink-0" />
          <input
            type="text"
            value={destination}
            onFocus={() => setSearchFocused(true)}
            onChange={(e) => setDestination(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleDestinationSubmit(destination);
              }
            }}
            placeholder="Search Destination (Goa, Jaipur, Udaipur, Delhi)"
            id="stay_destination_input"
            className="w-full text-xs font-semibold outline-none bg-transparent"
            required
          />
          {(destination || searchFocused) && (
            <button
              type="button"
              onClick={() => {
                setDestination('');
                setSearchFocused(false);
              }}
              className="text-gray-400 hover:text-gray-700 text-[10px] uppercase font-black tracking-tight"
            >
              Clear
            </button>
          )}
        </div>

        {/* Dynamic Focus suggestions strictly for Stays module */}
        {searchFocused && (
          <div className="bg-indigo-50/50 rounded-xl border border-indigo-100 p-3 space-y-2.5">
            {recentSearches.length > 0 && (
              <div>
                <span className="text-[8px] font-black text-indigo-800 uppercase tracking-widest block mb-1 font-mono">⏰ Recent Travel Searches</span>
                <div className="flex flex-wrap gap-1">
                  {recentSearches.map((term, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleDestinationSubmit(term)}
                      className="px-2.5 py-0.5 bg-white hover:bg-indigo-50 text-[10px] font-bold text-gray-750 border border-indigo-150 rounded-lg cursor-pointer transition"
                    >
                      🏨 {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <span className="text-[8px] font-black text-rose-800 uppercase tracking-widest block mb-1 font-mono">⛰️ Trending Vacations on Chalo:</span>
              <div className="flex flex-wrap gap-1">
                {['Goa Beach Resort 🏖️', 'Jaipur Palace 🏰', 'Udaipur Lake 🛶', 'Ooty Hills ⛰️', 'Delhi Luxury 🏨'].map((term, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleDestinationSubmit(term.replace(/ [^ ]+$/, ''))}
                    className="px-2.5 py-0.5 bg-white hover:bg-rose-50 text-[10px] font-extrabold text-indigo-950 border border-gray-150 rounded-lg cursor-pointer transition"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 animate-fade-in">
          <div className="bg-gray-50 p-2 rounded-xl border border-gray-150 flex flex-col">
            <span className="text-[9px] text-gray-400 font-bold uppercase pl-1">Check-in</span>
            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className="text-xs font-semibold outline-none bg-transparent p-1 cursor-pointer"
              required
            />
          </div>
          <div className="bg-gray-50 p-2 rounded-xl border border-gray-150 flex flex-col">
            <span className="text-[9px] text-gray-400 font-bold uppercase pl-1">Check-out</span>
            <input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="text-xs font-semibold outline-none bg-transparent p-1 cursor-pointer"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 p-1.5 rounded-xl border border-gray-150 flex items-center justify-between px-3">
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4 text-indigo-500" />
              <span className="text-xs font-semibold text-gray-600">Guests:</span>
            </div>
            <select
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
              id="stay_guests_sel"
              className="text-xs font-bold outline-none border-none bg-transparent py-1"
            >
              {[1, 2, 3, 4, 5, 6, 8, 10].map(n => (
                <option key={n} value={n}>{n} Guest{n !== 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>

          <div className="bg-gray-50 p-1.5 rounded-xl border border-gray-150 flex items-center justify-between px-3">
            <div className="flex items-center space-x-1">
              <Bed className="w-4 h-4 text-indigo-500" />
              <span className="text-xs font-semibold text-gray-600">Rooms:</span>
            </div>
            <select
              value={rooms}
              onChange={(e) => setRooms(Number(e.target.value))}
              id="stay_rooms_sel"
              className="text-xs font-bold outline-none border-none bg-transparent py-1"
            >
              {[1, 2, 3, 4, 5].map(n => (
                <option key={n} value={n}>{n} Room{n !== 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          id="compare_hotels_btn"
          className="w-full bg-gradient-to-r from-indigo-700 to-indigo-800 hover:brightness-110 text-white font-medium py-3 rounded-xl shadow-md transition-all text-xs cursor-pointer flex items-center justify-center space-x-1.5"
        >
          <Sparkles className="w-4.5 h-4.5 text-indigo-200" />
          <span>Scan Stay Tariffs ({calculateDays()} Night stay)</span>
        </button>
      </form>

      {/* Scanned Deals list match */}
      {hasSearched && (
        <div className="space-y-4 pt-1">
          {filteredHotels.map(hotel => {
            const bookedPlatform = selectedBookings[hotel.id];
            
            // Find absolute cheapest platform quote for user highlight
            const sortedQuotes = [...hotel.comparisons].sort((a,b) => a.pricePerNight - b.pricePerNight);
            const absoluteCheapest = sortedQuotes[0];

            return (
              <div key={hotel.id} className="bg-white rounded-2xl border border-gray-150 overflow-hidden shadow-xs">
                <div className="relative h-44 bg-gray-100">
                  <img
                    src={hotel.image}
                    alt={hotel.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2.5 left-2.5 bg-indigo-950/85 backdrop-blur-md text-white text-[10px] font-extrabold px-2.5 py-1 rounded-lg flex items-center space-x-1">
                    <span>{hotel.stars} Star Property</span>
                  </div>
                  <div className="absolute top-2.5 right-2.5 bg-emerald-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                    ★ {hotel.rating} Excellent
                  </div>
                  
                  {/* Bottom details overlay */}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8 text-white">
                    <h3 className="text-base font-extrabold font-display leading-tight">{hotel.name}</h3>
                    <p className="text-[11px] text-gray-300 font-medium mt-0.5">📍 {hotel.distance}</p>
                  </div>
                </div>

                {/* Amenities pills row */}
                <div className="flex flex-wrap gap-1 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                  {hotel.amenities.map(amenity => (
                    <span key={amenity} className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-md font-medium">
                      {amenity}
                    </span>
                  ))}
                </div>

                {/* Side by side comparison portal grids */}
                <div className="p-4 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase font-mono text-gray-400 tracking-wider">Agoda vs Booking vs MakeMyTrip tariff comparisons</span>
                    <span className="text-[10px] text-indigo-600 font-bold flex items-center space-x-0.5">
                      <Tag className="w-3 h-3 inline" />
                      <span>Best price matching code</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    {hotel.comparisons.map(deal => {
                      const isBestVal = deal.platform === absoluteCheapest.platform;
                      const hasBookedThis = bookedPlatform === deal.platform;
                      const totalFinal = calculateTotalFare(deal.pricePerNight, deal.taxes);

                      return (
                        <div
                          key={deal.platform}
                          className={`p-3 rounded-xl border transition flex items-center justify-between ${
                            hasBookedThis 
                              ? 'bg-emerald-50/50 border-emerald-500' 
                              : isBestVal 
                              ? 'bg-amber-50/35 border-amber-200' 
                              : 'bg-white border-gray-150'
                          }`}
                        >
                          <div>
                            <div className="flex items-center space-x-1.5 font-display font-bold">
                              <span className={`text-xs ${isBestVal ? 'text-amber-700' : 'text-gray-800'}`}>{deal.platform}</span>
                              {isBestVal && (
                                <span className="text-[8.5px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.2 rounded uppercase font-mono">Cheapest option</span>
                              )}
                            </div>
                            <span className="text-[10px] text-gray-400 block font-mono font-medium mt-0.5">Tax: +₹{deal.taxes} | {deal.cancellation}</span>
                          </div>

                          <div className="text-right flex items-center space-x-3 pl-2.5">
                            <div className="font-mono">
                              <span className="text-[12px] font-bold text-gray-950 block">₹{deal.pricePerNight} <small className="text-[9px] text-gray-400 font-sans">/night</small></span>
                              <span className="text-[10px] text-slate-500 font-semibold uppercase font-mono">Total: ₹{totalFinal}</span>
                            </div>

                            {bookedPlatform ? (
                              hasBookedThis ? (
                                <span className="text-emerald-600 font-extrabold text-[11px] flex items-center space-x-1 shrink-0 bg-emerald-100 px-2 py-1 rounded-lg">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Confirmed</span>
                                </span>
                              ) : (
                                <span className="text-[10.5px] text-gray-400 font-bold shrink-0">Blocked</span>
                              )
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleBookHotel(hotel, deal.platform, totalFinal)}
                                className={`text-[11px] font-extrabold py-2 px-3.5 rounded-xl cursor-pointer shadow-xs transition-all ${
                                  isBestVal 
                                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-white' 
                                    : 'bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                                }`}
                              >
                                Book Now
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredHotels.length === 0 && (
            <div className="p-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <Info className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600">No properties matched your search queries.</p>
              <p className="text-xs text-gray-400">Search for 'Goa', 'Jaipur', 'Udaipur' or 'Delhi' to view aggregated deals!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
