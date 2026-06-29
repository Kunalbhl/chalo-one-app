import React, { useState } from 'react';
import { HOTELS_CATALOG } from '../data';
import { HotelOption, StayQuery } from '../types';
import { Bed, Calendar, Users, MapPin, Sparkles, Star, Tag, Info, ShieldCheck, CheckCircle2, ArrowLeft, Check, Compass, CreditCard, Gift, Heart, HelpCircle, Map, Plus, Tv, Wifi, X, ShieldAlert, SlidersHorizontal } from 'lucide-react';
import ChaloMapView from './ChaloMapView';

interface StaysModuleProps {
  addOrderToActivity: (order: any) => void;
  userProfile?: any;
}

export default function StaysModule({ addOrderToActivity, userProfile }: StaysModuleProps) {
  const [destination, setDestination] = useState('Goa');
  const [recentSearches, setRecentSearches] = useState<string[]>(['Goa', 'Jaipur', 'Delhi']);
  const [searchFocused, setSearchFocused] = useState(false);
  const [checkIn, setCheckIn] = useState('2026-06-25');
  const [checkOut, setCheckOut] = useState('2026-06-28');
  const [guests, setGuests] = useState(2);
  const [rooms, setRooms] = useState(1);
  const [hasSearched, setHasSearched] = useState(true);
  const [selectedBookings, setSelectedBookings] = useState<{ [hotelId: string]: string }>({});

  // Extended Hotel Details & Booking Flow states
  const [activeStep, setActiveStep] = useState<'list' | 'detail' | 'guest' | 'payment'>('list');
  const [selectedHotel, setSelectedHotel] = useState<HotelOption | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<any | null>(null);
  const [activeGalleryImageIndex, setActiveGalleryImageIndex] = useState<number>(0);
  
  // Custom Selection parameters
  const [selectedRoomType, setSelectedRoomType] = useState<string>('Deluxe Room with Balcony');
  const [roomPriceSurcharge, setRoomPriceSurcharge] = useState<number>(0);
  const [activeItineraryId, setActiveItineraryId] = useState<string>('itinerary_a');
  
  // Guest inputs (Indian Mobile Contact has default +91 country code)
  const [guestName, setGuestName] = useState('Kunal Pareek');
  const [guestEmail, setGuestEmail] = useState('kunal@chalo.app');
  const [guestPhone, setGuestPhone] = useState('+91 99882 10492');

  // Automatically fetch from profile details
  React.useEffect(() => {
    if (userProfile) {
      if (userProfile.name) setGuestName(userProfile.name);
      if (userProfile.email) setGuestEmail(userProfile.email);
      if (userProfile.phone) setGuestPhone(userProfile.phone);
    }
  }, [userProfile]);

  const [specialRequests, setSpecialRequests] = useState('');

  // Stays Filters and Sort options
  const [staySortBy, setStaySortBy] = useState<'price_asc' | 'price_desc' | 'rating' | 'stars'>('rating');
  const [stayFilterStars, setStayFilterStars] = useState<string>('All');
  const [stayFilterPlatform, setStayFilterPlatform] = useState<string>('All');
  
  // Coupon state
  const [couponInputText, setCouponInputText] = useState<string>('');
  const [appliedCoupon, setAppliedCoupon] = useState<string>('');
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Selected payment method choice
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('UPI_GPAY');

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

  const applyCouponCode = (code: string) => {
    setCouponError(null);
    const cleaned = code.trim().toUpperCase();
    if (cleaned === 'CHALOFIRST') {
      setAppliedCoupon('CHALOFIRST');
      setCouponDiscount(1200);
      setCouponError(null);
    } else if (cleaned === 'SUPERSTAY') {
      setAppliedCoupon('SUPERSTAY');
      setCouponDiscount(1000);
      setCouponError(null);
    } else if (cleaned === 'MONSOON7') {
      setAppliedCoupon('MONSOON7');
      setCouponDiscount(700);
      setCouponError(null);
    } else {
      setCouponError('Invalid code. Try: CHALOFIRST, SUPERSTAY, MONSOON7');
      setAppliedCoupon('');
      setCouponDiscount(0);
    }
  };

  const handleFinalStayPayment = () => {
    if (!selectedHotel || !selectedDeal) return;

    const nights = calculateDays();
    const baseFare = selectedDeal.pricePerNight * nights * rooms;
    const surchargeTotal = roomPriceSurcharge * nights * rooms;
    const taxesTotal = selectedDeal.taxes * rooms;
    const finalFare = baseFare + surchargeTotal + taxesTotal - couponDiscount;

    setSelectedBookings(prev => ({ ...prev, [selectedHotel.id]: selectedDeal.platform }));

    addOrderToActivity({
      id: "CHALO-STAY-" + Math.floor(100000 + Math.random() * 900000),
      category: 'stays',
      platform: selectedDeal.platform,
      merchant: selectedHotel.name,
      title: `${selectedHotel.name} (${selectedRoomType})`,
      subtitle: `${guests} Guests, ${rooms} Room(s) • ${nights} night(s) • Sourced via ${selectedDeal.platform}`,
      date: "Stay Confirmed",
      time: `${checkIn} to ${checkOut}`,
      amount: finalFare > 0 ? finalFare : 0,
      status: 'upcoming',
      statusLabel: 'Upcoming Stay',
      paymentMethod: selectedPaymentMethod === 'UPI_GPAY' ? 'UPI AutoPay Verified' : selectedPaymentMethod === 'CHALO_WALLET' ? 'Chalo Wallet Split Settlement' : 'Credit Card Visa Sync'
    });

    // Securely Sync to Commission Junction (CJ) Affiliate Program if booked via Booking.com
    if (selectedDeal.platform.toLowerCase().includes("booking") || selectedDeal.platform.toLowerCase().includes("bcom")) {
      fetch('/api/affiliate/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotelName: selectedHotel.name,
          amount: finalFare > 0 ? finalFare : 0,
          platform: selectedDeal.platform,
          guestName: guestName,
          guests: guests,
          nights: nights,
          rooms: rooms,
          checkIn: checkIn,
          checkOut: checkOut
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data.synced) {
          console.log(`[CJ Affiliate Link] Successfully registered booking ${data.trackingId} under Kunal's CJ profile.`);
        }
      })
      .catch(err => console.error("CJ Sync Error:", err));
    }

    alert(`Hooray! Stay at ${selectedHotel.name} booked successfully. Added to your ongoing activities list.`);
    
    // Reset
    setActiveStep('list');
    setSelectedHotel(null);
    setSelectedDeal(null);
    setAppliedCoupon('');
    setCouponDiscount(0);
    setCouponInputText('');
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

  // Filter and Sort based on destination search, star rating and price ranges
  const filteredHotels = [...HOTELS_CATALOG].filter(hotel => {
    const matchesSearch = hotel.name.toLowerCase().includes(destination.toLowerCase()) ||
      hotel.distance.toLowerCase().includes(destination.toLowerCase());
    
    const matchesStars = stayFilterStars === 'All' || hotel.stars === Number(stayFilterStars);

    const matchesPlatform = stayFilterPlatform === 'All' || hotel.comparisons.some(c => 
      c.platform.toLowerCase().includes(stayFilterPlatform.toLowerCase())
    );

    return matchesSearch && matchesStars && matchesPlatform;
  }).sort((a, b) => {
    const getCheapestPrice = (h: typeof a) => {
      return Math.min(...h.comparisons.map(c => c.pricePerNight));
    };

    if (staySortBy === 'price_asc') return getCheapestPrice(a) - getCheapestPrice(b);
    if (staySortBy === 'price_desc') return getCheapestPrice(b) - getCheapestPrice(a);
    if (staySortBy === 'rating') return b.rating - a.rating;
    if (staySortBy === 'stars') return b.stars - a.stars;
    return 0;
  });

  return (
    <div id="stays_module_container" className="p-4 max-w-6xl mx-auto space-y-6 font-sans text-gray-800">
      
      {/* ----------------- STEP 1: HOTEL LISTINGS SCREEN ----------------- */}
      {activeStep === 'list' && (
        <div className="space-y-6">
          <div className="flex items-center space-x-2 pb-2">
            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-700">
              <Bed className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-display font-semibold tracking-tight text-indigo-950">Chalo Stay Planner</h2>
              <p className="text-xs text-gray-500 font-medium">Live price comparison across Agoda, Booking.com, MMT & Goibibo</p>
            </div>
          </div>

          {/* Stay Booking Lookup form */}
          <form onSubmit={(e) => {
            e.preventDefault();
            handleDestinationSubmit(destination);
          }} className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <ChaloMapView 
              label="Stay Destination / Hotel Landmark"
              placeholder="Search hotel destination (e.g. Goa, Jaipur, Taj Mahal)..."
              initialValue={destination}
              onLocationSelect={(name) => {
                setDestination(name);
                handleDestinationSubmit(name);
              }}
              icon={<MapPin className="w-4 h-4 text-indigo-600" />}
              showMap={false}
            />

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
                  className="text-xs font-bold outline-none border-none bg-transparent py-1 cursor-pointer text-slate-800"
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
                  className="text-xs font-bold outline-none border-none bg-transparent py-1 cursor-pointer text-slate-800"
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
              {/* Hotel Filter and Sort Selector Panel */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-750">
                  <span className="flex items-center space-x-1">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Hotel Sorting & Filters</span>
                  </span>
                  <span className="text-[10px] font-mono text-gray-400 font-bold">
                    Aggregated ({filteredHotels.length} stays found)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* Star rating filter */}
                  <div>
                    <label className="block text-[8px] text-gray-400 uppercase font-mono font-bold mb-1">Star Class</label>
                    <select
                      value={stayFilterStars}
                      onChange={(e) => setStayFilterStars(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-xs px-2 py-1.5 rounded-xl text-slate-700 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="All">All Properties</option>
                      <option value="3">3 Star Only</option>
                      <option value="4">4 Star Only</option>
                      <option value="5">5 Star Luxury Only</option>
                    </select>
                  </div>

                  {/* Booking Platform filter */}
                  <div>
                    <label className="block text-[8px] text-gray-400 uppercase font-mono font-bold mb-1">Provider Source</label>
                    <select
                      value={stayFilterPlatform}
                      onChange={(e) => setStayFilterPlatform(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-xs px-2 py-1.5 rounded-xl text-slate-700 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="All">All Portals</option>
                      <option value="Agoda">Agoda</option>
                      <option value="Booking.com">Booking.com</option>
                      <option value="MakeMyTrip">MakeMyTrip</option>
                      <option value="Goibibo">Goibibo</option>
                    </select>
                  </div>

                  {/* Sort selector */}
                  <div>
                    <label className="block text-[8px] text-gray-400 uppercase font-mono font-bold mb-1">Sort hotels by</label>
                    <select
                      value={staySortBy}
                      onChange={(e) => setStaySortBy(e.target.value as any)}
                      className="w-full bg-indigo-50 border border-indigo-200 text-xs px-2 py-1.5 rounded-xl text-indigo-900 font-black focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="rating">★ Guest Reviews & Ratings</option>
                      <option value="price_asc">₹ Price: Low to High</option>
                      <option value="price_desc">₹ Price: High to Low</option>
                      <option value="stars">🎖 Star Classification</option>
                    </select>
                  </div>
                </div>
              </div>

              {filteredHotels.map(hotel => {
                const bookedPlatform = selectedBookings[hotel.id];
                const sortedQuotes = [...hotel.comparisons].sort((a,b) => a.pricePerNight - b.pricePerNight);
                const absoluteCheapest = sortedQuotes[0];

                return (
                  <div key={hotel.id} className="bg-white rounded-3xl border border-gray-150 overflow-hidden shadow-xs hover:shadow-md transition-all">
                    <div className="relative h-48 bg-gray-100">
                      <img
                        src={hotel.image}
                        alt={hotel.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 left-3 bg-indigo-950/90 backdrop-blur-md text-white text-[10px] font-extrabold px-2.5 py-1 rounded-lg flex items-center space-x-1 shadow-sm">
                        <span>{hotel.stars} Star Property</span>
                      </div>
                      <div className="absolute top-3 right-3 bg-emerald-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase shadow-sm">
                        ★ {hotel.rating} Excellent
                      </div>
                      
                      {/* Bottom details overlay */}
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 to-transparent p-4 pt-10 text-white">
                        <h3 className="text-lg font-extrabold font-display leading-tight">{hotel.name}</h3>
                        <p className="text-[11px] text-gray-300 font-semibold mt-0.5 flex items-center space-x-1">
                          <span>📍 {hotel.distance}</span>
                        </p>
                      </div>
                    </div>

                    {/* Amenities pills row */}
                    <div className="flex flex-wrap gap-1 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                      {hotel.amenities.map(amenity => (
                        <span key={amenity} className="text-[10px] bg-slate-200/80 text-slate-700 px-2.5 py-0.5 rounded-md font-extrabold">
                          {amenity}
                        </span>
                      ))}
                    </div>

                    {/* Side by side comparison portal grids */}
                    <div className="p-4 space-y-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase font-mono text-gray-400 tracking-wider">Agoda vs Booking vs MakeMyTrip comparisons</span>
                        <span className="text-[10px] text-indigo-600 font-bold flex items-center space-x-0.5">
                          <Tag className="w-3 h-3 inline" />
                          <span>Tap any comparison card to view details</span>
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
                              onClick={() => {
                                setSelectedHotel(hotel);
                                setSelectedDeal(deal);
                                setActiveStep('detail');
                                setActiveGalleryImageIndex(0);
                                setSelectedRoomType('Deluxe Room with Balcony');
                                setRoomPriceSurcharge(0);
                                setAppliedCoupon('');
                                setCouponDiscount(0);
                              }}
                              className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer hover:border-indigo-400 hover:shadow-xs ${
                                hasBookedThis 
                                  ? 'bg-emerald-50/50 border-emerald-500' 
                                  : isBestVal 
                                  ? 'bg-amber-50/40 border-amber-200' 
                                  : 'bg-white border-gray-150'
                              }`}
                            >
                              <div>
                                <div className="flex flex-wrap items-center gap-1.5 font-display font-bold">
                                  <span className={`text-xs ${isBestVal ? 'text-amber-700' : 'text-gray-800'}`}>{deal.platform}</span>
                                  {isBestVal && (
                                    <span className="text-[8.5px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.2 rounded uppercase font-mono">Cheapest option</span>
                                  )}
                                  {deal.platform.toLowerCase().includes("booking") && (
                                    <span className="text-[8.5px] bg-blue-100 text-blue-700 font-extrabold px-1.5 py-0.2 rounded uppercase font-mono animate-pulse">
                                      ★ Promoted Partner
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-gray-400 block font-mono font-medium mt-0.5">Tax: +₹{deal.taxes} | {deal.cancellation}</span>
                              </div>

                              <div className="text-right flex items-center space-x-3.5 pl-2">
                                <div className="font-mono">
                                  <span className="text-xs font-bold text-gray-950 block">₹{deal.pricePerNight} <small className="text-[9px] text-gray-400 font-sans">/night</small></span>
                                  <span className="text-[10px] text-indigo-600 font-extrabold uppercase font-mono">Total: ₹{totalFinal}</span>
                                </div>

                                <button
                                  type="button"
                                  className={`text-[10.5px] font-black uppercase py-2 px-3 rounded-xl transition-all ${
                                    isBestVal 
                                      ? 'bg-amber-400 hover:bg-amber-500 text-slate-950' 
                                      : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
                                  }`}
                                >
                                  View Details
                                </button>
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
      )}


      {/* ----------------- STEP 2: STAY DETAILS & ROOM SELECTION SCREEN ----------------- */}
      {activeStep === 'detail' && selectedHotel && selectedDeal && (
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
          {/* Top navigation header */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <button
              type="button"
              onClick={() => setActiveStep('list')}
              className="flex items-center space-x-1.5 text-xs text-gray-500 hover:text-indigo-600 font-bold transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Tariffs Comparison</span>
            </button>
            <span className="text-[10px] font-extrabold uppercase font-mono bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded">
              Stay Detailed View
            </span>
          </div>

          {/* Hotel Hero Description */}
          <div className="space-y-2">
            <div className="flex items-center space-x-1 text-xs text-amber-500 font-bold">
              {Array.from({ length: selectedHotel.stars }).map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-current" />
              ))}
              <span className="ml-1 text-gray-500 font-semibold">{selectedHotel.stars} Star Certified Property</span>
            </div>
            <h1 className="text-2xl font-black font-display text-gray-950 leading-tight">{selectedHotel.name}</h1>
            <p className="text-xs font-bold text-indigo-600 flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5" />
              <span>{selectedHotel.distance} • Sourced via {selectedDeal.platform}</span>
            </p>
          </div>

          {/* 🌟 ORIGINAL HIGH-RES PICTURES GALLERY */}
          <div className="space-y-2.5">
            <div className="relative h-64 sm:h-80 bg-slate-100 rounded-3xl overflow-hidden shadow-xs border border-gray-150">
              <img
                src={[
                  selectedHotel.image,
                  'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&auto=format&fit=crop',
                  'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&auto=format&fit=crop',
                  'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&auto=format&fit=crop'
                ][activeGalleryImageIndex]}
                alt="Hotel room interior"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-all duration-300"
              />
              <div className="absolute bottom-3 right-3 bg-black/70 text-white text-[10px] font-mono px-3 py-1 rounded-full">
                Image {activeGalleryImageIndex + 1} of 4
              </div>
            </div>

            {/* Gallery Thumbnails List */}
            <div className="grid grid-cols-4 gap-2">
              {[
                selectedHotel.image,
                'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=300&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=300&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=300&auto=format&fit=crop'
              ].map((imgUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveGalleryImageIndex(idx)}
                  className={`relative h-14 sm:h-18 rounded-xl overflow-hidden border-2 cursor-pointer transition ${
                    activeGalleryImageIndex === idx ? 'border-indigo-600 scale-95 shadow-sm' : 'border-transparent opacity-80 hover:opacity-100'
                  }`}
                >
                  <img src={imgUrl} alt="Thumbnail preview" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* 🏨 EXCLUSIVE BOOKING.COM AFFILIATE PROMOTIONAL CORNER */}
          <div className={`p-5 rounded-3xl border transition-all ${
            selectedDeal.platform.toLowerCase().includes("booking")
              ? 'bg-blue-50 border-blue-250 text-blue-950 shadow-xs'
              : 'bg-indigo-50/40 border-indigo-150 text-indigo-950'
          }`}>
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-100/50 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] bg-blue-600 text-white font-extrabold px-3 py-1 rounded-full uppercase tracking-wider font-mono">
                    Official Booking.com Partner
                  </span>
                  <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-2.5 py-1 rounded-full uppercase tracking-wider font-mono animate-pulse">
                    Kunal Affiliate Program
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 text-[11px] font-bold text-blue-800">
                  <span>Referral Fee Tracking Enabled</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <h4 className="text-sm font-black uppercase tracking-tight text-slate-900">
                    {selectedDeal.platform.toLowerCase().includes("booking")
                      ? "🎉 Booking via Kunal's Affiliate Link active!"
                      : "💡 Highly Recommended: Switch to Booking.com to support Chalo!"
                    }
                  </h4>
                  <p className="text-[11px] leading-relaxed text-slate-600 font-medium">
                    {selectedDeal.platform.toLowerCase().includes("booking")
                      ? "This reservation is securely routed via CJ Affiliate (members.cj.com) under publisher account kunalpareekusa@gmail.com. We have matched live room keys, cancellation terms, and verified that your 12% partner cashback will be processed automatically."
                      : "You are currently viewing rates from another platform. Switch to Booking.com to route this stay via Kunal's partner portal. Switching keeps the rate low and guarantees priority hotel support!"
                    }
                  </p>

                  <div className="pt-2">
                    <span className="text-[9.5px] uppercase font-mono text-blue-700 tracking-wider font-black block">Exclusive Booking.com Services & Inclusions:</span>
                    <div className="grid grid-cols-2 gap-2 mt-1.5 text-xs text-slate-700 font-semibold">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-emerald-600">✔</span>
                        <span>Free High-Speed Wi-Fi (Up to 150 Mbps)</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-emerald-600">✔</span>
                        <span>Complimentary Welcome Drink</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-emerald-600">✔</span>
                        <span>Late Check-out (Up to 2:00 PM)</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-emerald-600">✔</span>
                        <span>Free Room Upgrade (Subject to availability)</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/80 backdrop-blur-xs p-4 rounded-2xl border border-blue-150 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest block">Live Platform Link</span>
                    <span className="font-display font-black text-slate-900 text-xs block leading-tight mt-1">Book directly on original website</span>
                    <p className="text-[9.5px] text-gray-500 font-medium leading-normal mt-0.5">Redirects securely to the verified official Booking.com checkout portal.</p>
                  </div>

                  <div className="space-y-2">
                    {!selectedDeal.platform.toLowerCase().includes("booking") && (
                      <button
                        type="button"
                        onClick={() => {
                          const bookingDeal = selectedHotel.comparisons.find(c => c.platform.toLowerCase().includes("booking"));
                          if (bookingDeal) {
                            setSelectedDeal(bookingDeal);
                            alert("🔄 Switched comparison quote to Booking.com Affiliate partner deal!");
                          } else {
                            alert("Booking.com is currently sold out for this property room class.");
                          }
                        }}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase rounded-xl tracking-wider transition shadow-sm cursor-pointer text-center"
                      >
                        Switch to Booking.com ➜
                      </button>
                    )}
                    <a
                      href={`https://www.booking.com/searchresults.html?ss=${encodeURIComponent(selectedHotel.name)}&aid=2039203`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 bg-slate-900 hover:bg-black text-white text-[10px] font-black uppercase rounded-xl tracking-wider transition block text-center cursor-pointer"
                    >
                      Visit Booking.com ↗
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 🌟 INCLUSIONS AND EXCLUSIONS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Inclusions */}
            <div className="bg-emerald-50/45 border border-emerald-150 p-4 rounded-2xl space-y-2.5">
              <h3 className="text-xs font-black uppercase text-emerald-800 font-mono tracking-wider flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>What is INCLUDED in this booking</span>
              </h3>
              <ul className="space-y-1.5 text-xs text-emerald-950 font-medium">
                <li className="flex items-center space-x-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Double Bed with Orthopaedic mattress & pillow menu</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Complimentary morning high-tea & buffet breakfast</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>High-speed unlimited WiFi & flat smart TV access</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Access to swimming pool, state gym & indoor library</span>
                </li>
              </ul>
            </div>

            {/* Exclusions */}
            <div className="bg-rose-50/45 border border-rose-150 p-4 rounded-2xl space-y-2.5">
              <h3 className="text-xs font-black uppercase text-rose-800 font-mono tracking-wider flex items-center space-x-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>What is EXCLUDED from tariff</span>
              </h3>
              <ul className="space-y-1.5 text-xs text-rose-950 font-medium">
                <li className="flex items-center space-x-2">
                  <X className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>Airport luxury cab pickup (available at ₹1,200 extra)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <X className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>Mini-bar alcoholic refreshments inside room</span>
                </li>
                <li className="flex items-center space-x-2">
                  <X className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>Express personal laundry & dry-cleaning service</span>
                </li>
                <li className="flex items-center space-x-2">
                  <X className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>Extra rollaway bed option (chargeable at ₹800/night)</span>
                </li>
              </ul>
            </div>
          </div>

          {/* 🌟 STAY MAP LOCATION & NEARBY PLACES */}
          <div className="bg-white border border-gray-150 rounded-2xl p-4.5 space-y-4">
            <h3 className="text-xs font-black uppercase text-indigo-950 font-mono tracking-wider flex items-center space-x-1.5">
              <Map className="w-4 h-4 text-indigo-600" />
              <span>Stay Map Location & Nearby Places</span>
            </h3>

            {/* Stay Map Simulation picker style */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex flex-col justify-end h-32 relative overflow-hidden shadow-xs">
              {/* Fake grid lines matching map */}
              <div className="absolute inset-0 bg-[radial-gradient(#818cf8_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none"></div>
              
              {/* Hotel Pin */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none">
                <div className="bg-indigo-600 text-white font-extrabold text-[9px] px-2 py-0.5 rounded-full shadow-md whitespace-nowrap mb-1 flex items-center space-x-1">
                  <span>{selectedHotel.name}</span>
                </div>
                <div className="relative">
                  <div className="absolute -inset-1.5 bg-indigo-400 rounded-full animate-ping opacity-60"></div>
                  <div className="w-4 h-4 bg-indigo-600 border-2 border-white rounded-full flex items-center justify-center">
                    <MapPin className="w-2.5 h-2.5 text-white" />
                  </div>
                </div>
              </div>

              <span className="text-[10px] bg-white border border-indigo-200 p-2.5 rounded-lg text-slate-800 font-bold relative z-10 shadow-sm leading-tight max-w-sm">
                📌 Center coordinate: {selectedHotel.distance.includes('Beach') ? 'Vagator Coastal Rd, Goa' : 'Jaipur Fort Ring Rd, Rajasthan'}
              </span>
            </div>

            {/* Nearby place distances list */}
            <div className="grid grid-cols-2 gap-3.5 text-xs text-gray-700 font-medium pt-1">
              <div className="flex items-center space-x-2">
                <span className="p-1 bg-gray-100 rounded-lg text-indigo-600">✈️</span>
                <div>
                  <p className="font-extrabold text-slate-900 text-[11px] leading-tight">Airport Terminus</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">12.4 km (25 min drive)</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="p-1 bg-gray-100 rounded-lg text-amber-600">🏖️</span>
                <div>
                  <p className="font-extrabold text-slate-900 text-[11px] leading-tight">Beach Promenade / Lake</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">0.4 km (5 min walk)</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="p-1 bg-gray-100 rounded-lg text-emerald-600">🍽️</span>
                <div>
                  <p className="font-extrabold text-slate-900 text-[11px] leading-tight">Authentic Dine-Outs</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">0.2 km (2 min walk)</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="p-1 bg-gray-100 rounded-lg text-rose-600">🏥</span>
                <div>
                  <p className="font-extrabold text-slate-900 text-[11px] leading-tight">Chalo Healthcare Hub</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">1.1 km (4 min drive)</p>
                </div>
              </div>
            </div>
          </div>

          {/* 🌟 LOCAL TOURIST ITINERARIES SELECTION */}
          <div className="bg-indigo-50/40 border border-indigo-100 rounded-2xl p-4.5 space-y-3.5">
            <div>
              <h3 className="text-xs font-black uppercase text-indigo-950 font-mono tracking-wider flex items-center space-x-1.5">
                <Compass className="w-4 h-4 text-indigo-600" />
                <span>Quick Tour Itineraries around Stay</span>
              </h3>
              <p className="text-[10.5px] text-gray-500 mt-0.5">Handpicked paths to easily select and roam around during your visit</p>
            </div>

            {/* Tabs */}
            <div className="flex space-x-2 border-b border-gray-200">
              {[
                { id: 'itinerary_a', label: '1-Day Heritage Walk 🏰' },
                { id: 'itinerary_b', label: '2-Day Chill Beach Escape 🏖️' },
                { id: 'itinerary_c', label: '3-Day Thrill Adventure ⛰️' }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveItineraryId(tab.id)}
                  className={`pb-2 text-[10.5px] font-extrabold uppercase tracking-wider border-b-2 px-1 transition ${
                    activeItineraryId === tab.id ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Active itinerary details */}
            <div className="bg-white border border-indigo-100 rounded-xl p-3 text-xs text-slate-750 font-medium space-y-2.5">
              {activeItineraryId === 'itinerary_a' && (
                <div className="space-y-1.5">
                  <p className="font-extrabold text-slate-900">Recommended Route: The Heritage & Local Charm Trail</p>
                  <p className="text-[11px] text-slate-600 leading-normal">
                    🌅 <strong className="text-slate-800">09:00 AM:</strong> Morning local palace/museum visit. Beat the crowds and capture beautiful pictures in clear sunlight.<br />
                    🌇 <strong className="text-slate-800">02:30 PM:</strong> Handicraft shopping. Visit local markets for authentic spices, clothes, and souvenirs.<br />
                    🌌 <strong className="text-slate-800">06:00 PM:</strong> Sunset viewpoint hike or lakeside chai. End with live cultural folk music at a local garden.
                  </p>
                </div>
              )}
              {activeItineraryId === 'itinerary_b' && (
                <div className="space-y-1.5">
                  <p className="font-extrabold text-slate-900">Recommended Route: The Chill & Culinary Escape</p>
                  <p className="text-[11px] text-slate-600 leading-normal">
                    🥥 <strong className="text-slate-800">Day 1:</strong> Late lazy brunch at local cafe, afternoon pool session with mocktails, and a scenic private sunset walk.<br />
                    🍤 <strong className="text-slate-800">Day 2:</strong> Seafood culinary exploration. Visit legendary eateries, sample traditional dishes, and finish with stargazing.
                  </p>
                </div>
              )}
              {activeItineraryId === 'itinerary_c' && (
                <div className="space-y-1.5">
                  <p className="font-extrabold text-slate-900">Recommended Route: The Thrill Seeker's Active Escape</p>
                  <p className="text-[11px] text-slate-600 leading-normal">
                    ⛰️ <strong className="text-slate-800">Day 1:</strong> High-altitude trek or historic fort hike. Great cardio with breath-taking peak views.<br />
                    🪂 <strong className="text-slate-800">Day 2:</strong> Parasailing & scuba dive deep-sea explorations guided by certified divers.<br />
                    🚜 <strong className="text-slate-800">Day 3:</strong> Off-road ATV jungle safari ride. Mud-splashing adrenaline-fueled action.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 🌟 ROOM OPTIONS FROM THE HOTEL OWNER */}
          <div className="bg-white border border-gray-150 rounded-2xl p-4.5 space-y-3.5">
            <div>
              <h3 className="text-xs font-black uppercase text-indigo-950 font-mono tracking-wider flex items-center space-x-1.5">
                <Bed className="w-4 h-4 text-indigo-600" />
                <span>Room Options from the Hotel Owner</span>
              </h3>
              <p className="text-[10.5px] text-gray-500 mt-0.5">Select a room setup suited for your family's convenience</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {[
                { name: 'Deluxe Room with Balcony', surcharge: 0, desc: 'King bed, private balcony pool-view, coffee maker setup.', extra: 'Free buffet breakfast' },
                { name: 'Executive Suite with Jacuzzi', surcharge: 2400, desc: 'Master Jacuzzi tub, separate living lounge, luxury mini-bar.', extra: 'Club lounge entry included' },
                { name: 'Club Family Room', surcharge: 4500, desc: '2 double beds, child kitchenette setup, board games collection.', extra: 'Free early check-in (10 AM)' }
              ].map(opt => {
                const totalWithSurcharge = selectedDeal.pricePerNight + opt.surcharge;
                return (
                  <div
                    key={opt.name}
                    onClick={() => {
                      setSelectedRoomType(opt.name);
                      setRoomPriceSurcharge(opt.surcharge);
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      selectedRoomType === opt.name ? 'border-indigo-600 bg-indigo-50/20 shadow-xs' : 'border-gray-150 hover:bg-slate-50'
                    }`}
                  >
                    <div className="space-y-1 pr-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-extrabold text-gray-900">{opt.name}</span>
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded uppercase font-mono font-bold">
                          {opt.extra}
                        </span>
                      </div>
                      <p className="text-[10.5px] text-gray-500">{opt.desc}</p>
                    </div>

                    <div className="text-right shrink-0 pl-1 font-mono text-xs">
                      {opt.surcharge === 0 ? (
                        <span className="text-emerald-600 font-extrabold uppercase font-mono text-[10px] block">Standard tariff</span>
                      ) : (
                        <span className="text-indigo-600 font-extrabold block">+₹{opt.surcharge} <small className="text-[9px] text-gray-400 font-sans">/night</small></span>
                      )}
                      <span className="text-slate-450 font-bold block text-[10px] mt-0.5">Rate: ₹{totalWithSurcharge}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action button */}
          <button
            type="button"
            onClick={() => setActiveStep('guest')}
            className="w-full bg-gradient-to-r from-indigo-700 to-indigo-800 hover:brightness-110 text-white font-display font-black uppercase text-xs tracking-wider py-4 rounded-2xl shadow-md transition"
          >
            Proceed to Guest Details ➜
          </button>
        </div>
      )}


      {/* ----------------- STEP 3: FEED GUEST DETAILS SCREEN ----------------- */}
      {activeStep === 'guest' && selectedHotel && selectedDeal && (
        <div className="space-y-6 animate-fade-in max-w-xl mx-auto">
          {/* Top navigation header */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <button
              type="button"
              onClick={() => setActiveStep('detail')}
              className="flex items-center space-x-1.5 text-xs text-gray-500 hover:text-indigo-600 font-bold transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Room & Details</span>
            </button>
            <span className="text-[10px] font-extrabold uppercase font-mono bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded">
              Guest Form
            </span>
          </div>

          {/* Progress sequence */}
          <div className="grid grid-cols-3 gap-2 text-center text-[9px] font-mono font-black uppercase tracking-wider">
            <span className="bg-indigo-100 text-indigo-800 py-1 rounded-md">1. Property OK</span>
            <span className="bg-indigo-600 text-white py-1 rounded-md">2. Guest Details</span>
            <span className="bg-slate-100 text-slate-400 py-1 rounded-md">3. Checkout Pay</span>
          </div>

          <div className="bg-white border border-gray-150 rounded-3xl p-5 space-y-4 shadow-sm text-left">
            <div>
              <h3 className="text-xs font-black uppercase text-slate-950 font-mono tracking-wider flex items-center space-x-1.5">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>Primary Guest Information</span>
              </h3>
              <p className="text-[10px] text-gray-400 mt-0.5">Kindly feed authentic Indian credentials for hotel registry</p>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              setActiveStep('payment');
            }} className="space-y-3">
              
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase font-mono block pl-1">Lead Guest Full Name</label>
                <input
                  type="text"
                  required
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="e.g. Kunal Pareek"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-1 focus:ring-indigo-600 text-xs font-bold focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase font-mono block pl-1">Contact Email Address</label>
                <input
                  type="email"
                  required
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="e.g. kunal@chalo.app"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-1 focus:ring-indigo-600 text-xs font-bold focus:outline-none"
                />
              </div>

              {/* Indian Mobile contact with static +91 Country Code by default */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase font-mono block pl-1">Mobile Number</label>
                <div className="relative flex">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-extrabold text-slate-500 font-mono">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    pattern="[0-9]{10}"
                    value={guestPhone.replace('+91 ', '')}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                      setGuestPhone(`+91 ${digits}`);
                    }}
                    placeholder="99882 10492"
                    className="w-full pl-11 p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-1 focus:ring-indigo-600 text-xs font-bold focus:outline-none font-mono"
                  />
                </div>
                <span className="text-[9px] text-gray-400 pl-1 block font-mono">10 digit mobile number to receive WhatsApp itinerary tickets</span>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase font-mono block pl-1">Special Requests (Optional)</label>
                <textarea
                  rows={2}
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="e.g. Quiet upper floor, twin beds, late check-in at 4 PM"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-1 focus:ring-indigo-600 text-xs font-bold focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-700 to-indigo-800 hover:brightness-110 text-white font-display font-black uppercase text-xs tracking-wider py-3.5 rounded-2xl shadow-md transition cursor-pointer mt-4"
              >
                Confirm Guest Details & Proceed ➜
              </button>
            </form>
          </div>
        </div>
      )}


      {/* ----------------- STEP 4: Checkout, Coupons & Payments SCREEN ----------------- */}
      {activeStep === 'payment' && selectedHotel && selectedDeal && (
        <div className="space-y-6 animate-fade-in max-w-xl mx-auto">
          {/* Top navigation header */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <button
              type="button"
              onClick={() => setActiveStep('guest')}
              className="flex items-center space-x-1.5 text-xs text-gray-500 hover:text-indigo-600 font-bold transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Guest Form</span>
            </button>
            <span className="text-[10px] font-extrabold uppercase font-mono bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded">
              Secure Pay
            </span>
          </div>

          {/* Progress sequence */}
          <div className="grid grid-cols-3 gap-2 text-center text-[9px] font-mono font-black uppercase tracking-wider">
            <span className="bg-indigo-100 text-indigo-800 py-1 rounded-md">1. Property OK</span>
            <span className="bg-indigo-100 text-indigo-800 py-1 rounded-md">2. Guest Details</span>
            <span className="bg-slate-900 text-white py-1 rounded-md">3. Checkout Pay</span>
          </div>

          {/* 🌟 AVAILABLE OFFERS & COUPONS */}
          <div className="bg-white border border-gray-150 rounded-3xl p-4.5 space-y-3.5 text-left shadow-xs">
            <div>
              <h3 className="text-xs font-black uppercase text-slate-950 font-mono tracking-wider flex items-center space-x-1.5">
                <Gift className="w-4 h-4 text-amber-500" />
                <span>Apply Available Public Coupon Codes</span>
              </h3>
              <p className="text-[10px] text-gray-400 mt-0.5">Select a public promo code to trigger live budget deductions</p>
            </div>

            {/* Public Coupons List */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { code: 'CHALOFIRST', discount: '₹1200 OFF', desc: 'First stay discount' },
                { code: 'SUPERSTAY', discount: '₹1000 OFF', desc: 'Flat launch offer' },
                { code: 'MONSOON7', discount: '₹700 OFF', desc: 'Seasonal budget code' }
              ].map(promo => (
                <button
                  key={promo.code}
                  type="button"
                  onClick={() => {
                    setCouponInputText(promo.code);
                    applyCouponCode(promo.code);
                  }}
                  className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                    appliedCoupon === promo.code ? 'border-amber-400 bg-amber-50/20 text-slate-950' : 'border-gray-150 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-xs font-black block font-mono text-amber-600">{promo.code}</span>
                  <span className="text-[9.5px] font-black uppercase mt-0.5 block">{promo.discount}</span>
                  <span className="text-[8.5px] text-gray-400 block font-normal mt-0.5">{promo.desc}</span>
                </button>
              ))}
            </div>

            {/* Manual Entry Form */}
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={couponInputText}
                onChange={(e) => setCouponInputText(e.target.value)}
                placeholder="ENTER OTHER COUPON"
                className="flex-1 p-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-1 focus:ring-amber-400 text-xs font-bold font-mono focus:outline-none uppercase placeholder-slate-400"
              />
              <button
                type="button"
                onClick={() => applyCouponCode(couponInputText)}
                className="bg-slate-900 hover:bg-slate-950 text-white px-4 rounded-xl text-xs font-display font-black uppercase tracking-wider cursor-pointer transition"
              >
                Apply
              </button>
            </div>

            {couponError && (
              <p className="text-[10px] text-rose-600 font-extrabold pl-1">{couponError}</p>
            )}
            {appliedCoupon && (
              <p className="text-[10px] text-emerald-600 font-extrabold pl-1 flex items-center space-x-1 font-mono">
                <span>✓ Coupon applied successfully:</span>
                <span className="bg-emerald-100 text-emerald-900 px-1.5 py-0.1 rounded font-extrabold uppercase">{appliedCoupon}</span>
                <span>(Saved ₹{couponDiscount})</span>
              </p>
            )}
          </div>

          {/* 🌟 FINAL ITEMIZED PRICING RECEIPT */}
          <div className="bg-slate-900 text-white rounded-3xl p-5 space-y-4 shadow-md text-left relative overflow-hidden">
            <div className="absolute right-0 top-0 opacity-[0.03] font-bold font-mono text-8xl pointer-events-none select-none">
              CHALO
            </div>

            <div>
              <h3 className="text-xs font-black uppercase text-amber-400 font-mono tracking-wider">
                Itemized Booking Receipt
              </h3>
              <p className="text-[10.5px] text-slate-400 mt-0.5">Secure aggregate comparison quote receipt</p>
            </div>

            <div className="space-y-2.5 border-t border-slate-800 pt-3.5 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-slate-350">Hotel Room Base Tariff:</span>
                <span>₹{selectedDeal.pricePerNight} <small className="text-[10px] text-slate-450 font-sans">/night</small></span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-350">Nights Multiplier:</span>
                <span>{calculateDays()} Night(s)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-350">Rooms Count Surcharge:</span>
                <span>{rooms} Room(s)</span>
              </div>
              {roomPriceSurcharge > 0 && (
                <div className="flex justify-between text-indigo-300">
                  <span>Room Option Surcharge ({selectedRoomType}):</span>
                  <span>+₹{roomPriceSurcharge * calculateDays() * rooms}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-350">Platform Secure Tax:</span>
                <span>₹{selectedDeal.taxes * rooms}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-amber-400 font-extrabold">
                  <span>Promotional Coupon Discount:</span>
                  <span>-₹{couponDiscount}</span>
                </div>
              )}

              {/* Final Payable */}
              <div className="flex justify-between border-t border-slate-800 pt-3 text-sm font-bold">
                <span className="text-amber-50">FINAL NET PAYABLE:</span>
                <span className="text-amber-400 font-extrabold font-mono">
                  ₹{Math.max(0, (selectedDeal.pricePerNight * calculateDays() * rooms) + (roomPriceSurcharge * calculateDays() * rooms) + (selectedDeal.taxes * rooms) - couponDiscount)}
                </span>
              </div>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850/50 text-[10.5px] leading-relaxed text-slate-400 font-sans">
              👤 <strong className="text-slate-200">Guest Name:</strong> {guestName} | 📞 <strong className="text-slate-200">Phone:</strong> {guestPhone}<br />
              🛌 <strong className="text-slate-200">Setup Selected:</strong> {selectedRoomType} ({guests} Guests)
            </div>
          </div>

          {/* 🌟 PROCEED FOR FINAL BOOKING WITH PAYMENT METHODS */}
          <div className="bg-white border border-gray-150 rounded-3xl p-5 space-y-4 text-left shadow-xs">
            <div>
              <h3 className="text-xs font-black uppercase text-slate-950 font-mono tracking-wider flex items-center space-x-1.5">
                <CreditCard className="w-4 h-4 text-indigo-600" />
                <span>Select Checkout Payment Method</span>
              </h3>
              <p className="text-[10px] text-gray-400 mt-0.5">Secure PCI-compliant instant multi-payout gateway</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {[
                { id: 'UPI_GPAY', name: 'Google Pay / PhonePe UPI AutoPay', desc: 'Secure direct payment via bank app link' },
                { id: 'CHALO_WALLET', name: 'Chalo Wallet Balance Split Pay', desc: 'Use coins/balance for instant cashless transaction' },
                { id: 'CREDIT_CARD', name: 'Credit / Debit Visa Mastercard', desc: 'Includes international multi-currency conversions' }
              ].map(pay => (
                <div
                  key={pay.id}
                  onClick={() => setSelectedPaymentMethod(pay.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedPaymentMethod === pay.id ? 'border-emerald-500 bg-emerald-50/20 shadow-xs' : 'border-gray-150 hover:bg-slate-50'
                  }`}
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-extrabold text-slate-900 block">{pay.name}</span>
                    <span className="text-[10px] text-gray-400 block">{pay.desc}</span>
                  </div>
                  <div className="shrink-0 pl-1">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      selectedPaymentMethod === pay.id ? 'border-emerald-600 bg-emerald-600' : 'border-gray-300'
                    }`}>
                      {selectedPaymentMethod === pay.id && (
                        <Check className="w-2.5 h-2.5 text-white" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pay confirmation button */}
            <button
              type="button"
              onClick={handleFinalStayPayment}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-display font-black uppercase text-xs tracking-wider py-4 rounded-2xl shadow-md transition cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <Check className="w-4.5 h-4.5 text-slate-950" />
              <span>Pay & Securely Book Stay Now</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
