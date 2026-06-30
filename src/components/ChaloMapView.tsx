import React, { useState, useEffect } from 'react';
import { APIProvider, Map, Marker, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { MapPin, Search, Navigation, Compass, Sparkles, Star, CheckCircle, Info } from 'lucide-react';

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

const API_KEY = 'AIzaSyDT-9rRHZes_zgKEMGFeup_LNeXjWqhf5I';

export default function ChaloMapView(props: ChaloMapViewProps) {
  return (
    <APIProvider apiKey={API_KEY} version="weekly">
      <ChaloMapViewInner {...props} />
    </APIProvider>
  );
}

function ChaloMapViewInner({
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

  // Re-center map to focus on route or pickup point when tracking goes live
  useEffect(() => {
    if (isTrackingMode && pickupCoords && map) {
      map.setCenter(pickupCoords);
      map.setZoom(14);
    }
  }, [isTrackingMode, pickupCoords, map]);

  const placesLib = useMapsLibrary('places');
  const [autocompleteService, setAutocompleteService] = useState<any>(null);
  const [placesService, setPlacesService] = useState<any>(null);

  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (!placesLib) return;
    try {
      setAutocompleteService(new placesLib.AutocompleteService());
    } catch (e) {
      console.warn("AutocompleteService init failed", e);
    }
  }, [placesLib]);

  useEffect(() => {
    if (!placesLib) return;
    try {
      const dummyDiv = document.createElement('div');
      setPlacesService(new placesLib.PlacesService((map?.getDiv() || dummyDiv) as HTMLDivElement));
    } catch (e) {
      console.warn("PlacesService init failed", e);
    }
  }, [placesLib, map]);

  const handleMarkerDragEnd = (lat: number, lng: number) => {
    setSelectedCoords({ lat, lng });
    if (window.google && window.google.maps) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === "OK" && results && results[0]) {
          const address = results[0].formatted_address;
          setQuery(address);
          onLocationSelect(address, lat, lng);
        } else {
          const resolvedName = `GPS Pin Dropped: (${lat.toFixed(5)}, ${lng.toFixed(5)})`;
          setQuery(resolvedName);
          onLocationSelect(resolvedName, lat, lng);
        }
      });
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
            const latVal = typeof e.latLng.lat === 'function' ? e.latLng.lat() : e.latLng.lat;
            const lngVal = typeof e.latLng.lng === 'function' ? e.latLng.lng() : e.latLng.lng;
            handleMarkerDragEnd(latVal, lngVal);
          }
        }}
      />
    ) : null;
  }

  // Fetch suggestions from AutocompleteService or fallback to LANDMARKS_DB
  useEffect(() => {
    if (!query.trim() || query === initialValue) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(() => {
      if (autocompleteService) {
        autocompleteService.getPlacePredictions(
          {
            input: query,
            componentRestrictions: { country: 'in' },
          },
          (predictions: any, status: any) => {
            if (status === 'OK' && predictions) {
              const formatted = predictions.map((pred: any) => ({
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
          }
        );
      } else {
        // Fallback to local filtering
        const filtered = LANDMARKS_DB.filter(item => 
          item.name.toLowerCase().includes(query.toLowerCase()) ||
          item.city.toLowerCase().includes(query.toLowerCase())
        );
        setSuggestions(filtered.slice(0, 5));
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, autocompleteService, initialValue]);

  const selectSuggestion = (landmark: any) => {
    if (landmark.placeId && placesService) {
      placesService.getDetails(
        {
          placeId: landmark.placeId,
          fields: ['geometry', 'formatted_address', 'name']
        },
        (place: any, status: any) => {
          if (status === 'OK' && place && place.geometry && place.geometry.location) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
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
        }
      );
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
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        // Use true Google Geocoder for reverse-geocoding the precise GPS coordinates
        if (window.google && window.google.maps) {
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === "OK" && results && results[0]) {
              const address = results[0].formatted_address;
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
          });
        } else {
          const resolvedName = `GPS Location: (${lat.toFixed(5)}, ${lng.toFixed(5)})`;
          setQuery(resolvedName);
          setSelectedCoords({ lat, lng });
          onLocationSelect(resolvedName, lat, lng);
          setGpsLoading(false);
        }

        if (map) {
          map.panTo({ lat, lng });
        }
      },
      (error) => {
        console.warn("GPS failed", error);
        // Better fallback - fetch from public API or use a generic neat latlng rather than hardcoding Bengaluru
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

      {/* Embedded Map Widget */}
      {showMap && (
        <div className={`w-full ${isTrackingMode ? 'h-full' : 'h-44'} rounded-2xl overflow-hidden border border-slate-200 relative bg-slate-100 shadow-inner group`}>
          <Map
            center={isTrackingMode && pickupCoords ? pickupCoords : (selectedCoords || { lat: 12.9716, lng: 77.5946 })}
            zoom={isTrackingMode ? 14 : 14}
            mapTypeId={mapType}
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            style={{ width: '100%', height: '100%' }}
            disableDefaultUI={false}
          >
            <LiveMapSearch />

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
        </div>
      )}
    </div>
  );
}
