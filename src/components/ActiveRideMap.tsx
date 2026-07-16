import React, { useState, useEffect } from 'react';
import { Map, Marker } from '@vis.gl/react-google-maps';
import { Play, Pause, RefreshCw, Compass, MapPin, Navigation, Info, Car, ChevronRight } from 'lucide-react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

interface ActiveRideMapProps {
  orderId?: string;
  driverId?: string;
  pickupCoords: { lat: number; lng: number };
  destCoords: { lat: number; lng: number };
  driverName?: string;
  vehicleInfo?: string;
  statusLabel?: string;
}

export default function ActiveRideMap({
  orderId,
  driverId,
  pickupCoords,
  destCoords,
  driverName = "Amit Kumar",
  vehicleInfo = "DL 1CA 4492",
  statusLabel = "Ongoing"
}: ActiveRideMapProps) {
  const [progress, setProgress] = useState(0.15);
  const [isPlaying, setIsPlaying] = useState(true);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite'>('roadmap');
  const [speed, setSpeed] = useState(45); // km/h
  const [driverPos, setDriverPos] = useState<{ lat: number; lng: number } | null>(null);

  // Real-time Firestore Telemetry Subscription
  useEffect(() => {
    if (!db || !orderId) return;

    const orderRef = doc(db, 'orders', orderId);
    const unsub = onSnapshot(orderRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.driverLocation) {
          const loc = data.driverLocation;
          if (loc.latitude && loc.longitude) {
            setDriverPos({ lat: Number(loc.latitude), lng: Number(loc.longitude) });
          }
          if (loc.speed !== undefined) {
            setSpeed(Number(loc.speed));
          }
        }
      }
    }, (err) => {
      console.warn("Telemetry subscription warning:", err);
    });

    return () => unsub();
  }, [orderId]);

  // Simulate smooth driver movement (graceful fallback when live telemetry is offline)
  useEffect(() => {
    if (!isPlaying || driverPos) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 1.0) {
          return 0.0;
        }
        return prev + 0.01;
      });

      setSpeed((prev) => {
        const delta = (0.5 - 0.5) * 6;
        const newSpeed = Math.round(prev + delta);
        return Math.max(25, Math.min(65, newSpeed));
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, driverPos]);

  // Interpolated driver position fallback or real-time Firestore position
  const simLat = pickupCoords.lat + (destCoords.lat - pickupCoords.lat) * progress;
  const simLng = pickupCoords.lng + (destCoords.lng - pickupCoords.lng) * progress;

  const driverLat = driverPos ? driverPos.lat : simLat;
  const driverLng = driverPos ? driverPos.lng : simLng;

  // Calculate distance remaining (approximate straight-line)
  const getDistanceInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c; // Distance in km
    return d;
  };

  const totalDistance = getDistanceInKm(pickupCoords.lat, pickupCoords.lng, destCoords.lat, destCoords.lng);
  const distTravelled = getDistanceInKm(pickupCoords.lat, pickupCoords.lng, driverLat, driverLng);
  
  // Calculate active progress ratio
  const activeProgress = driverPos 
    ? (totalDistance > 0 ? Math.min(1.0, distTravelled / totalDistance) : progress) 
    : progress;

  const distanceRemaining = totalDistance * (1 - activeProgress);
  const etaMins = speed > 0 ? Math.round((distanceRemaining / speed) * 60) : 0;

  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 flex flex-col shadow-xs" id="active_ride_tracking_widget">
      {/* Top Telemetry Header Banner */}
      <div className="bg-slate-900 text-white px-4 py-3 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center space-x-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isPlaying ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isPlaying ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
          </span>
          <div>
            <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400 font-mono block leading-none">Chalo One Ride Monitor</span>
            <span className="text-[11px] font-extrabold text-white mt-0.5 block">
              {progress >= 0.95 ? 'Trip nearly completed! 🎉' : isPlaying ? `En Route: ${Math.round(progress * 100)}% completed` : 'Ride tracking paused'}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setMapType(mapType === 'roadmap' ? 'satellite' : 'roadmap')}
            className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-amber-400 hover:text-amber-300 rounded-lg font-mono font-bold flex items-center space-x-1"
            title="Toggle Standard/Satellite view"
          >
            <Compass className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[9px] uppercase tracking-wider">{mapType === 'roadmap' ? 'Satellite' : 'Roadmap'}</span>
          </button>
        </div>
      </div>

      {/* Map Element */}
      <div className="w-full h-56 relative bg-slate-150">
        <Map
          center={{ lat: driverLat, lng: driverLng }}
          zoom={14}
          mapTypeId={mapType}
          disableDefaultUI={true}
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          style={{ width: '100%', height: '100%' }}
        >
          {/* Pickup Marker */}
          <Marker
            position={pickupCoords}
            title="Your Pickup Point"
            label="📍"
          />

          {/* Destination Marker */}
          <Marker
            position={destCoords}
            title="Your Destination"
            label="🏁"
          />

          {/* Real-time Driver Movement Marker */}
          <Marker
            position={{ lat: driverLat, lng: driverLng }}
            title={`Driver: ${driverName} (${vehicleInfo})`}
            label="🚖"
          />
        </Map>

        {/* Floating Controls Overlay */}
        <div className="absolute top-2.5 left-2.5 bg-slate-950/85 text-white p-2.5 rounded-xl border border-slate-700 max-w-[200px] shadow-lg backdrop-blur-xs space-y-1 font-sans">
          <div className="flex items-center space-x-1">
            <Car className="w-3 h-3 text-amber-400" />
            <span className="text-[8px] font-mono uppercase font-black tracking-widest text-slate-300">Driver Telemetry</span>
          </div>
          <div className="text-[10px] space-y-0.5">
            <p className="truncate text-slate-100 font-bold">{driverName}</p>
            <p className="font-mono text-[9px] text-slate-400">{vehicleInfo}</p>
            <div className="flex items-center justify-between text-[9px] text-amber-400 font-bold font-mono pt-1">
              <span>Speed: {isPlaying ? `${speed} km/h` : '0 km/h'}</span>
              <span>ETA: {etaMins > 0 ? `${etaMins}m` : 'Arrived'}</span>
            </div>
          </div>
        </div>

        {/* Distance Indicator Badge */}
        <div className="absolute bottom-2.5 left-2.5 bg-slate-900/95 backdrop-blur-xs text-white px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider flex items-center space-x-1">
          <Navigation className="w-2.5 h-2.5 text-amber-400 animate-pulse" />
          <span>Remaining: {distanceRemaining.toFixed(2)} km</span>
        </div>
      </div>

      {/* Progress Tracking Bar */}
      <div className="p-4 bg-white border-t border-slate-100 space-y-3">
        <div className="flex justify-between items-center text-[10px] text-slate-500 font-extrabold uppercase tracking-wider font-mono">
          <span className="flex items-center gap-1">📍 Pickup Point</span>
          <span className="text-amber-500">{Math.round(progress * 100)}% Trip Progress</span>
          <span className="flex items-center gap-1 font-sans">🏁 Destination</span>
        </div>
        
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
