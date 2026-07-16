import React, { useState, useEffect } from 'react';
import { Map, Marker, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { MapPin, Search, Navigation, Compass, Sparkles, Star, CheckCircle, Info, Leaf, Award } from 'lucide-react';
import { mapService } from '../services/mapService';

// Indian City Landmarks Database for Simulated Autocomplete/Keyword lookup when no key is entered
const LANDMARKS_DB = [
  { name: "Koramangala, Bengaluru", city: "Bengaluru", lat: 12.9352, lng: 77.6245, desc: "Chalo Tech Hub & Startup Junction" },
  { name: "Blinkit HQ (Golf Course Road), Gurgaon", city: "Gurgaon", lat: 28.4595, lng: 77.0266, desc: "Quick Commerce Central Command" },
  { name: "Indiranagar 100ft Road, Bengaluru", city: "Bengaluru", lat: 12.9719, lng: 77.6412, desc: "Premium Food & Cafes Corridor" },
  { name: "Kempegowda International Airport (BLR)", city: "Bengaluru", lat: 13.1986, lng: 77.7066, desc: "Bengaluru Airport Terminal T2" },
  { name: "Whitefield ITPL, Bengaluru", city: "Bengaluru", lat: 12.9866, lng: 77.7374, desc: "Corporate Tech Park Corridor" },
  { name: "Baga Beach, North Goa", city: "Goa", lat: 15.5536, lng: 73.7551, desc: "Premier Tourism Coastal Beach" },
  { name: "Panaji Latin Quarter, Goa", city: "Goa", lat: 15.4909, lng: 73.8278, desc: "Heritage Portuguese Colony Stay Hub" },
  { name: "Hawa Mahal, Jaipur City", city: "Jaipur", lat: 26.9239, lng: 75.8267, desc: "Royal Pink City Landmark" },
  { name: "Jaipur International Airport (JAI)", city: "Jaipur", lat: 26.8242, lng: 75.8122, desc: "Sanganer Airport Gateways" },
  { name: "Connaught Place, New Delhi", city: "Delhi", lat: 28.6304, lng: 77.2177, desc: "Central Delhi Business Ring" },
  { name: "Indira Gandhi International Airport (DEL) T3", city: "Delhi", lat: 28.5562, lng: 77.1000, desc: "Delhi International Hub T3" },
  { name: "Taj Mahal, Agra", city: "Agra", lat: 27.1751, lng: 78.0421, desc: "World Wonder Monument Heritage" },
  { name: "Bandra West, Mumbai", city: "Mumbai", lat: 19.0600, lng: 72.8350, desc: "Mumbai Coastal Celebrities Hub" },
  { name: "Chhatrapati Shivaji Terminal (CSMT), Mumbai", city: "Mumbai", lat: 18.9400, lng: 72.8355, desc: "Heritage Central Mumbai Junction" },
  { name: "White Orchid Convention Centre, Bengaluru", city: "Bengaluru", lat: 13.0402, lng: 77.6200, desc: "Manyata Tech Park Event Hotspot" }
];

interface ChaloMapViewProps {
  label: string;
  placeholder: string;
  initialValue: string;
  onLocationSelect: (locationName: string, lat?: number, lng?: number) => void;
  icon?: React.ReactNode;
  showMap?: boolean;
  pickupCoords?: { lat: number, lng: number };
  destCoords?: { lat: number, lng: number };
  isTrackingMode?: boolean;
  tripLiveStatus?: string;
}

export default function ChaloMapView({
  label,
  placeholder,
  initialValue,
  onLocationSelect,
  icon,
  showMap = true,
  pickupCoords,
  destCoords,
  isTrackingMode = false,
  tripLiveStatus = 'driver_assigned'
}: ChaloMapViewProps) {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [focused, setFocused] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<{lat: number, lng: number} | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite'>('roadmap');

  const [cabProgress, setCabProgress] = useState(0.1);
  const [showStatsOverlay, setShowStatsOverlay] = useState(true);

  // Helper function to calculate distance between coordinates
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

  // Monitor live tracking status and progress
  useEffect(() => {
    if (!isTrackingMode) return;

    let interval: any;
    if (tripLiveStatus === 'driver_assigned') {
      setCabProgress(0.05);
      interval = setInterval(() => {
        setCabProgress(p => p < 0.25 ? p + 0.015 : 0.05);
      }, 400);
    } else if (tripLiveStatus === 'arriving') {
      setCabProgress(0.85);
      interval = setInterval(() => {
        setCabProgress(p => p < 0.95 ? p + 0.005 : 0.85);
      }, 400);
    } else if (tripLiveStatus === 'active') {
      setCabProgress(0.2);
      interval = setInterval(() => {
        setCabProgress(p => p < 1.0 ? p + 0.02 : 0.2);
      }, 300);
    } else if (tripLiveStatus === 'completed') {
      setCabProgress(1.0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTrackingMode, tripLiveStatus]);

  const map = useMap();

  // Realtime Geolocation radar states
  const [isRealtimeRadar, setIsRealtimeRadar] = useState(false);
  const [liveUserLocation, setLiveUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [radarCabs, setRadarCabs] = useState<any[]>([]);

  // Geolocation watch effect
  useEffect(() => {
    if (!isRealtimeRadar) {
      setLiveUserLocation(null);
      setRadarCabs([]);
      return;
    }

    let watchId: number | null = null;
    
    const handleSuccess = (position: GeolocationPosition) => {
      const uCoords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      setLiveUserLocation(uCoords);
      
      // Update map center
      if (map) {
        map.panTo(uCoords);
      }

      // Generate simulated nearby cab locations
      setRadarCabs([
        { id: 'radar-cab-1', name: '🚗 Uber Sedan', lat: uCoords.lat + 0.002, lng: uCoords.lng + 0.0025, status: 'Active (2m away)' },
        { id: 'radar-cab-2', name: '🛺 Ola Auto', lat: uCoords.lat - 0.0018, lng: uCoords.lng + 0.003, status: 'Cruising (1m away)' },
        { id: 'radar-cab-3', name: '🏍️ Rapido Bike', lat: uCoords.lat + 0.0015, lng: uCoords.lng - 0.002, status: 'Assigned (3m away)' }
      ]);
    };

    const handleError = (error: GeolocationPositionError) => {
      console.warn("Realtime watch geolocation failed", error);
      // Fallback coordinates (Koramangala, Bengaluru) if geolocation is blocked/unavailable
      const fallbackCoords = selectedCoords || pickupCoords || { lat: 12.9352, lng: 77.6245 };
      setLiveUserLocation(fallbackCoords);
      
      if (map) {
        map.panTo(fallbackCoords);
      }

      setRadarCabs([
        { id: 'radar-cab-1', name: '🚗 Uber Sedan', lat: fallbackCoords.lat + 0.002, lng: fallbackCoords.lng + 0.0025, status: 'Active (2m away)' },
        { id: 'radar-cab-2', name: '🛺 Ola Auto', lat: fallbackCoords.lat - 0.0018, lng: fallbackCoords.lng + 0.003, status: 'Cruising (1m away)' },
        { id: 'radar-cab-3', name: '🏍️ Rapido Bike', lat: fallbackCoords.lat + 0.0015, lng: fallbackCoords.lng - 0.002, status: 'Assigned (3m away)' }
      ]);
    };

    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
    } else {
      handleError({} as any);
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [isRealtimeRadar, map, selectedCoords, pickupCoords]);

  // Re-center map to focus on route or pickup point when tracking goes live
  useEffect(() => {
    if (isTrackingMode && pickupCoords && map) {
      map.setCenter(pickupCoords);
      map.setZoom(14);
    }
  }, [isTrackingMode, pickupCoords, map]);

  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  const handleMarkerDragEnd = async (lat: number, lng: number) => {
    setSelectedCoords({ lat, lng });
    const response = await mapService.reverseGeocode(lat, lng);
    if (response.success && response.data) {
      const address = response.data.formattedAddress;
      setQuery(address);
      onLocationSelect(address, lat, lng);
    } else {
      const resolvedName = `GPS Pin Dropped: (${lat.toFixed(5)}, ${lng.toFixed(5)})`;
      setQuery(resolvedName);
      onLocationSelect(resolvedName, lat, lng);
    }
  };

  // Google Maps Live Autocomplete Helper Component inside Provider
  function LiveMapSearch() {
    return selectedCoords ? (
      <Marker 
        position={selectedCoords} 
        draggable={true}
        onDragEnd={(e) => {
          if (e.latLng) {
            const latVal = typeof e.latLng.lat === 'function' ? (e.latLng.lat as any)() : (e.latLng.lat as any);
            const lngVal = typeof e.latLng.lng === 'function' ? (e.latLng.lng as any)() : (e.latLng.lng as any);
            handleMarkerDragEnd(latVal, lngVal);
          }
        }}
      />
    ) : null;
  }

  // Fetch suggestions from mapService with automatic caching, throttling, retry, and offline fallback
  useEffect(() => {
    const handler = setTimeout(() => {
      if (!query.trim() || query === initialValue) {
        setSuggestions([]);
        return;
      }

      let isSubscribed = true;

      const fetchPredictions = async () => {
        const response = await mapService.getPlacePredictions(query);
        if (!isSubscribed) return;

        if (response.success && response.data) {
          const formatted = response.data.map((pred: any) => ({
            name: pred.description,
            city: pred.structured_formatting?.secondary_text || 'India',
            lat: 0,
            lng: 0,
            desc: pred.structured_formatting?.main_text || pred.description,
            placeId: pred.place_id
          }));
          setSuggestions(formatted);
        } else {
          // Fallback to local filtering
          const filtered = LANDMARKS_DB.filter(item => 
            item.name.toLowerCase().includes(query.toLowerCase()) ||
            item.city.toLowerCase().includes(query.toLowerCase())
          );
          setSuggestions(filtered.slice(0, 5));
        }
      };

      fetchPredictions();

      return () => {
        isSubscribed = false;
      };
    }, 400);

    return () => clearTimeout(handler);
  }, [query, initialValue]);

  const selectSuggestion = async (landmark: any) => {
    if (landmark.placeId) {
      const response = await mapService.getPlaceDetails(landmark.placeId);
      if (response.success && response.data) {
        const place = response.data;
        if (place.geometry && place.geometry.location) {
          const lat = typeof place.geometry.location.lat === 'function' ? place.geometry.location.lat() : place.geometry.location.lat;
          const lng = typeof place.geometry.location.lng === 'function' ? place.geometry.location.lng() : place.geometry.location.lng;
          const fullName = place.formatted_address || landmark.name;
          setQuery(fullName);
          setSelectedCoords({ lat, lng });
          onLocationSelect(fullName, lat, lng);
          if (map) {
            map.panTo({ lat, lng });
          }
        } else {
          setQuery(landmark.name);
          onLocationSelect(landmark.name);
        }
      } else {
        setQuery(landmark.name);
        onLocationSelect(landmark.name);
      }
    } else {
      setQuery(landmark.name);
      setSelectedCoords({ lat: landmark.lat, lng: landmark.lng });
      onLocationSelect(landmark.name, landmark.lat, landmark.lng);
      if (map && landmark.lat && landmark.lng) {
        map.panTo({ lat: landmark.lat, lng: landmark.lng });
      }
    }
    setSuggestions([]);
    setFocused(false);
  };

  const handleUseGPS = () => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser");
      return;
    }
    setGpsLoading(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        const response = await mapService.reverseGeocode(lat, lng);
        if (response.success && response.data) {
          const address = response.data.formattedAddress;
          setQuery(address);
          setSelectedCoords({ lat, lng });
          onLocationSelect(address, lat, lng);
        } else {
          const resolvedName = `GPS Location: (${lat.toFixed(5)}, ${lng.toFixed(5)})`;
          setQuery(resolvedName);
          setSelectedCoords({ lat, lng });
          onLocationSelect(resolvedName, lat, lng);
        }
        setGpsLoading(false);

        if (map) {
          map.panTo({ lat, lng });
        }
      },
      (error) => {
        console.warn("GPS failed", error);
        const lat = 12.9352;
        const lng = 77.6245;
        const resolvedName = "Koramangala 4th Block, Bengaluru";
        setQuery(resolvedName);
        setSelectedCoords({ lat, lng });
        onLocationSelect(resolvedName, lat, lng);
        setGpsLoading(false);
        if (map) {
          map.panTo({ lat, lng });
        }
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Distance and fuel savings calculations
  const hasRoute = pickupCoords && destCoords;
  const totalDistance = hasRoute 
    ? getHaversineDistance(pickupCoords.lat, pickupCoords.lng, destCoords.lat, destCoords.lng)
    : 12.8; // Fallback distance in km
  
  const distanceCovered = Number((totalDistance * cabProgress).toFixed(1));
  const fuelSavings = Number((distanceCovered * 0.08).toFixed(2)); // 0.08L of fuel saved per km
  const co2Reduction = Number((fuelSavings * 2.31).toFixed(2)); // 2.31kg of CO2 reduced per liter of fuel saved

  return (
    <div className="w-full space-y-2 text-slate-850">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono block">
          {label}
        </label>
        <span className="text-[8px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 px-1.5 py-0.2 rounded font-mono uppercase">
          🗺️ Google Maps Live Autocomplete
        </span>
      </div>

      <div className="relative">
        <div className="flex items-center space-x-2.5 bg-slate-50 border border-slate-200 p-3 rounded-2xl focus-within:ring-2 focus-within:ring-amber-400 focus-within:bg-white transition-all shadow-xs">
          <div className="text-slate-450 shrink-0">
            {icon || <MapPin className="w-4 h-4 text-amber-500" />}
          </div>
          <input
            type="text"
            value={query}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 200)}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="w-full text-xs font-semibold bg-transparent focus:outline-none placeholder-slate-400 text-slate-900"
          />
          <button
            type="button"
            onClick={handleUseGPS}
            className="text-[9px] bg-amber-100 hover:bg-amber-200 text-amber-950 px-2 py-1 rounded-lg font-mono font-black flex items-center space-x-1 shrink-0 cursor-pointer transition"
            title="Fetch precise GPS location"
          >
            <Compass className={`w-3.5 h-3.5 text-amber-600 ${gpsLoading ? 'animate-spin' : ''}`} />
            <span>{gpsLoading ? 'GPS...' : 'USE GPS'}</span>
          </button>
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSelectedCoords(null);
                onLocationSelect('');
              }}
              className="text-[10px] text-slate-400 hover:text-slate-600 font-mono font-bold"
            >
              Clear
            </button>
          )}
        </div>

        {/* Dynamic Autocomplete Suggestions List */}
        {focused && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-slate-50">
            {suggestions.map((landmark, idx) => (
              <button
                key={idx}
                type="button"
                onMouseDown={() => selectSuggestion(landmark)}
                className="w-full text-left px-4 py-3 hover:bg-amber-50/40 transition flex items-start space-x-3 text-xs"
              >
                <div className="p-1.5 bg-slate-100 rounded-lg text-amber-600 mt-0.5 shrink-0">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-extrabold text-slate-900 truncate">{landmark.name}</div>
                  <div className="text-[10px] text-slate-450 truncate mt-0.5">{landmark.desc}</div>
                </div>
                <span className="text-[9px] font-mono font-extrabold bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 shrink-0 self-center">
                  {landmark.city}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Empty match alert chip */}
        {focused && query.trim() !== '' && suggestions.length === 0 && query !== initialValue && (
          <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-150 p-3 rounded-2xl shadow-md z-40 text-[10.5px] text-slate-500">
            <p className="font-semibold italic">Searching for "{query}" in Google Places...</p>
          </div>
        )}
      </div>

      {/* Realtime Tracking Radar Toggle */}
      {showMap && (
        <div className="flex items-center justify-between p-3 bg-slate-100 rounded-2xl border border-slate-200/60 mb-2 text-xs shadow-xs">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isRealtimeRadar ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isRealtimeRadar ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
            </span>
            <div>
              <span className="font-black text-slate-800 uppercase tracking-wider text-[10px] font-mono block leading-none">Chalo Live GPS Radar</span>
              <span className="text-[9px] text-slate-500 mt-0.5 block font-semibold">Overlay active nearby cabs & your live position</span>
            </div>
          </div>
          <button
            type="button"
            id="realtime-tracking-radar-toggle"
            onClick={() => setIsRealtimeRadar(!isRealtimeRadar)}
            className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isRealtimeRadar ? 'bg-emerald-600' : 'bg-slate-350'}`}
          >
            <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${isRealtimeRadar ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>
      )}

      {/* Embedded Map Widget */}
      {showMap && (
        <div className={`w-full ${isTrackingMode ? 'h-full' : 'h-44'} rounded-2xl overflow-hidden border border-slate-200 relative bg-slate-100 shadow-inner group`}>
          <Map
            center={isRealtimeRadar && liveUserLocation ? liveUserLocation : (isTrackingMode && pickupCoords ? pickupCoords : (selectedCoords || { lat: 12.9716, lng: 77.5946 }))}
            zoom={isRealtimeRadar ? 15 : (isTrackingMode ? 14 : 14)}
            mapTypeId={mapType}
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            style={{ width: '100%', height: '100%' }}
            disableDefaultUI={false}
          >
            <LiveMapSearch />

            {/* Live user position marker on Map */}
            {isRealtimeRadar && liveUserLocation && (
              <Marker
                position={liveUserLocation}
                title="Your Current Location (Live GPS)"
                label="🌟"
              />
            )}

            {/* Simulated live cabs nearby */}
            {isRealtimeRadar && radarCabs.map((cab) => (
              <Marker
                key={cab.id}
                position={{ lat: cab.lat, lng: cab.lng }}
                title={`${cab.name} - ${cab.status}`}
                label={cab.id === 'radar-cab-1' ? '🚗' : cab.id === 'radar-cab-2' ? '🛺' : '🏍️'}
              />
            ))}

            {/* Tracking Elements on Google Map */}
            {isTrackingMode && pickupCoords && (
              <Marker 
                position={pickupCoords}
                title="Your Pickup Point"
                label="📍"
              />
            )}

            {isTrackingMode && destCoords && (
              <Marker 
                position={destCoords}
                title="Your Destination"
                label="🏁"
              />
            )}

            {isTrackingMode && pickupCoords && destCoords && (
              <Marker 
                position={{
                  lat: pickupCoords.lat + (destCoords.lat - pickupCoords.lat) * cabProgress,
                  lng: pickupCoords.lng + (destCoords.lng - pickupCoords.lng) * cabProgress
                }}
                title="Chalo Active Cab Tracker"
                label="🚖"
              />
            )}
          </Map>

          {/* Tracking HUD Overlay */}
          {isTrackingMode && (
            <div className="absolute top-2.5 left-2.5 z-20 bg-slate-950/90 text-white p-3 rounded-2xl border border-slate-700/80 max-w-[240px] shadow-lg backdrop-blur-xs space-y-1.5 font-sans">
              <div className="flex items-center space-x-1.5 text-[9px] uppercase font-mono tracking-wider font-extrabold text-amber-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0"></span>
                <span>Chalo Active Tracking Engine</span>
              </div>
              <p className="text-[10px] font-bold text-slate-100 truncate">
                {tripLiveStatus === 'driver_assigned' ? 'Driver assigned & dispatched' : 
                 tripLiveStatus === 'arriving' ? 'Driver approaching pickup location' : 
                 tripLiveStatus === 'active' ? 'Cab glides smoothly to destination' : 'Trip completed safely!'}
              </p>
              <div className="flex items-center justify-between text-[9px] text-slate-400 pt-1 font-mono">
                <span>Distance Progress: {Math.round(cabProgress * 100)}%</span>
                <span>Speed: {tripLiveStatus === 'active' ? '48 km/h' : '0 km/h'}</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-400 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${cabProgress * 100}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Map UI overlays with view selection */}
          <div className="absolute top-2.5 right-2.5 z-20 flex space-x-1.5 items-center">
            <button
              type="button"
              id="toggle-satellite-view-btn"
              onClick={() => setMapType(mapType === 'roadmap' ? 'satellite' : 'roadmap')}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-[9.5px] font-bold rounded-xl uppercase shadow-md border cursor-pointer transition bg-slate-900/95 text-white border-slate-700/80 hover:bg-slate-850"
              title="Toggle standard and satellite map view"
            >
              <Compass className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Toggle Satellite View</span>
              <span className="text-[8px] bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded-md font-mono font-bold">
                {mapType === 'roadmap' ? 'Standard' : 'Satellite'}
              </span>
            </button>
          </div>

          <div className="absolute bottom-2.5 left-2.5 z-20 flex space-x-1.5">
            <div className="bg-slate-900/90 backdrop-blur-xs text-white px-2 py-1 rounded-lg text-[8px] font-mono font-bold uppercase tracking-wider flex items-center space-x-1 select-none">
              <Navigation className="w-2.5 h-2.5 text-amber-400 animate-pulse" />
              <span>Map scale: Drag Pin to Move</span>
            </div>
          </div>

          {/* Summary Stats Overlay */}
          {showStatsOverlay && (
            <div className="absolute bottom-2.5 right-2.5 z-20 bg-slate-900/95 text-white p-3 rounded-2xl border border-slate-700/80 w-[240px] shadow-lg backdrop-blur-xs space-y-2 font-sans transition-all duration-300">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <div className="flex items-center space-x-1.5">
                  <Leaf className="w-3.5 h-3.5 text-emerald-400 animate-pulse shrink-0" />
                  <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-emerald-400">
                    Eco-Impact Stats
                  </span>
                </div>
                <button 
                  type="button"
                  onClick={() => setShowStatsOverlay(false)}
                  className="text-slate-400 hover:text-white text-[9px] font-mono leading-none font-bold cursor-pointer"
                >
                  Hide
                </button>
              </div>

              {isTrackingMode ? (
                <div className="space-y-1.5">
                  <div className="text-[9px] font-bold text-slate-300">
                    Active Ride Tracking:
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-center">
                    <div className="bg-slate-800/80 p-1.5 rounded-lg border border-slate-700/40">
                      <div className="text-[8px] text-slate-400 font-medium">Distance Covered</div>
                      <div className="text-[11px] font-mono font-bold text-amber-400">{distanceCovered} / {totalDistance} km</div>
                    </div>
                    <div className="bg-slate-800/80 p-1.5 rounded-lg border border-slate-700/40">
                      <div className="text-[8px] text-slate-400 font-medium">Fuel Saved</div>
                      <div className="text-[11px] font-mono font-bold text-emerald-400">{fuelSavings} L</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[8px] text-slate-400 bg-slate-800/40 p-1 rounded-md font-mono">
                    <span>Est. CO₂ Reduced:</span>
                    <span className="text-emerald-400 font-bold">{co2Reduction} kg</span>
                  </div>
                </div>
              ) : isRealtimeRadar ? (
                <div className="space-y-1.5">
                  <div className="text-[9px] font-bold text-slate-300">
                    Nearby Radar Activity:
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-center">
                    <div className="bg-slate-800/80 p-1.5 rounded-lg border border-slate-700/40">
                      <div className="text-[8px] text-slate-400 font-medium">Radar Cabs</div>
                      <div className="text-[11px] font-mono font-bold text-amber-400">{radarCabs.length} Active</div>
                    </div>
                    <div className="bg-slate-800/80 p-1.5 rounded-lg border border-slate-700/40">
                      <div className="text-[8px] text-slate-400 font-medium">Estimated Savings</div>
                      <div className="text-[11px] font-mono font-bold text-emerald-400">1.84 L</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[8px] text-slate-400 bg-slate-800/40 p-1 rounded-md font-mono">
                    <span>CO₂ Reduced:</span>
                    <span className="text-emerald-400 font-bold">4.25 kg</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-1 text-center py-0.5">
                  <p className="text-[9px] text-slate-300">
                    Start a ride or enable radar to track active distance & estimated fuel savings!
                  </p>
                  <div className="text-[9px] font-mono text-emerald-400 font-black flex items-center justify-center space-x-1 mt-1">
                    <Award className="w-3 h-3 text-amber-400" />
                    <span>Avg Chalo Saver: 4.2L/week</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {!showStatsOverlay && (
            <button
              type="button"
              onClick={() => setShowStatsOverlay(true)}
              className="absolute bottom-2.5 right-2.5 z-20 bg-slate-900/90 text-white px-2 py-1.5 rounded-xl border border-slate-700/80 text-[9px] font-mono font-bold uppercase tracking-wider flex items-center space-x-1 shadow-md hover:bg-slate-800 cursor-pointer"
            >
              <Leaf className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Show Eco Stats</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
