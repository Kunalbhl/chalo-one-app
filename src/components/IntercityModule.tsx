import React, { useState } from 'react';
import { IntercityQuery, IntercityOption } from '../types';
import { MapPin, Users, Briefcase, Calendar, Clock, AlertTriangle, CheckCircle2, ChevronRight, Award, HelpCircle } from 'lucide-react';
import ChaloMapView from './ChaloMapView';

interface IntercityModuleProps {
  addOrderToActivity: (order: any) => void;
}

export default function IntercityModule({ addOrderToActivity }: IntercityModuleProps) {
  const [pickup, setPickup] = useState('Jaipur');
  const [destination, setDestination] = useState('Delhi');
  const [date, setDate] = useState('2026-06-25');
  const [time, setTime] = useState('06:00');
  const [passengers, setPassengers] = useState<number>(5);
  const [luggage, setLuggage] = useState<number>(3);
  const [calculated, setCalculated] = useState(false);
  const [recommendations, setRecommendations] = useState<IntercityOption[]>([]);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);

  // Auto recommend vehicle type based on passenger rules
  const getVehicleByCapacity = (pax: number): { type: string; reason: string } => {
    if (pax <= 2) return { type: "Sedan", reason: "Perfect for couples or business travelers. Maximum trunk space." };
    if (pax <= 5) return { type: "SUV", reason: "Spacious Ertiga/Marazzo with sufficient overhead carrier and cabin width." };
    if (pax <= 8) return { type: "Innova Crysta", reason: "Ultra-comfortable corporate standard with captain seating and high luggage space." };
    if (pax <= 15) return { type: "Tempo Traveller", reason: "Includes split central AC. Perfect for extended family groups and spiritual yatras." };
    return { type: "Mini Bus (30 PAX)", reason: "Private tourist-permit AC coach. Excellent for destination weddings or corporate outbound groups." };
  };

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickup || !destination) return;

    const recommendedItem = getVehicleByCapacity(passengers);

    // Dynamic fares logic based on distance estimation
    const distanceFactor = pickup.toLowerCase() === 'jaipur' && destination.toLowerCase() === 'delhi' ? 270 : 350;
    const tollCharges = 450;
    const baseFuelPricePerKm = 8.5;

    // Simulate 3 aggregated options (Ola, Uber, MMT Outstation)
    const options: IntercityOption[] = [
      {
        vehicleType: recommendedItem.type,
        recommended: true,
        reason: recommendedItem.reason,
        platform: "Ola Intercity",
        fare: Math.floor(distanceFactor * 13 + tollCharges),
        travelTime: "5h 15m",
        tollCharges,
        fuelCost: Math.floor(distanceFactor * baseFuelPricePerKm),
        comfortScore: passengers <= 5 ? 8.5 : 9.2
      },
      {
        vehicleType: recommendedItem.type,
        recommended: false,
        reason: "Alternative budget provider with standard feedback ratings.",
        platform: "Uber Intercity",
        fare: Math.floor(distanceFactor * 13.8 + tollCharges),
        travelTime: "5h 10m",
        tollCharges,
        fuelCost: Math.floor(distanceFactor * baseFuelPricePerKm),
        comfortScore: passengers <= 5 ? 8.2 : 9.0
      },
      {
        vehicleType: recommendedItem.type,
        recommended: false,
        reason: "Includes complimentary packaged water and corporate-vetted premium drivers.",
        platform: "MakeMyTrip Outstation",
        fare: Math.floor(distanceFactor * 14.5 + tollCharges),
        travelTime: "5h 15m",
        tollCharges,
        fuelCost: Math.floor(distanceFactor * baseFuelPricePerKm),
        comfortScore: 9.5
      }
    ];

    // Sort cheapest first
    options.sort((a,b) => a.fare - b.fare);
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

      <form onSubmit={handleCalculate} className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <div className="space-y-4">
          <ChaloMapView 
            label="Departure Point (From)"
            placeholder="Search city of departure (e.g. Jaipur, Delhi)..."
            initialValue={pickup}
            onLocationSelect={(name) => setPickup(name)}
            icon={<MapPin className="w-4 h-4 text-gray-500" />}
            showMap={false}
          />

          <ChaloMapView 
            label="Destination Point (To)"
            placeholder="Search arrival destination (e.g. Delhi, Gurgaon, Jaipur)..."
            initialValue={destination}
            onLocationSelect={(name) => setDestination(name)}
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
                <span>🛣️ Distance Factor: Approx 270 km</span>
              </div>
            </div>
          </div>

          {/* Pricing cards */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1">Aggregated Real-time Outstation Quotes</h3>
            {recommendations.map((option, idx) => {
              const isSelected = selectedOptionIndex === idx;
              return (
                <div
                  key={option.platform}
                  className={`bg-white p-4 rounded-2xl border transition-all ${
                    isSelected ? 'border-emerald-500 shadow-md ring-1 ring-emerald-500' : 'border-gray-150 hover:border-indigo-400'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-extrabold text-gray-900 font-display">{option.platform}</span>
                        {option.recommended && (
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                            🏆 Eco Pick
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{option.vehicleType} • {option.travelTime} drive</p>
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
                        <span className="text-emerald-600 font-bold text-[11px] flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />
                          <span>Reserved!</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleBook(option, idx)}
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
    </div>
  );
}
