import { safeStorage, safeSessionStorage } from '../utils/storage';
import { db } from '../firebase';
import { collection, doc, setDoc, serverTimestamp, getDocs, deleteDoc } from 'firebase/firestore';

export interface SavedAddress {
  id?: string;
  name: string;
  formattedAddress: string;
  placeId: string;
  latitude: number;
  longitude: number;
  createdAt?: any;
  updatedAt?: any;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  errorCode?: string;
  errorMessage?: string;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// Robust local and cross-session caching for reducing API quota usage
class MapsCache {
  private static prefix = 'chalo_maps_cache_';
  
  static get<T>(key: string): T | null {
    try {
      const stored = safeStorage.getItem(this.prefix + key);
      if (stored) {
        const entry: CacheEntry<T> = JSON.parse(stored);
        // Cache entries are valid for 24 hours
        if (Date.now() - entry.timestamp < 24 * 60 * 60 * 1000) {
          return entry.data;
        } else {
          safeStorage.removeItem(this.prefix + key);
        }
      }
    } catch (e) {
      console.warn("Cache read failed:", e);
    }
    return null;
  }

  static set<T>(key: string, data: T): void {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now()
      };
      safeStorage.setItem(this.prefix + key, JSON.stringify(entry));
    } catch (e) {
      console.warn("Cache write failed:", e);
    }
  }
}

// MapService acts as the centralized manager for all Google Maps Platform APIs.
class MapService {
  private apiKey: string = '';
  private lastInput: string = '';
  private debounceTimeout: any = null;

  constructor() {
    this.apiKey =
      (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY ||
      process.env.VITE_GOOGLE_MAPS_API_KEY ||
      '';
  }

  getApiKey(): string {
    return this.apiKey;
  }

  hasValidKey(): boolean {
    return Boolean(this.apiKey) && this.apiKey !== 'YOUR_API_KEY';
  }

  isOffline(): boolean {
    return typeof navigator !== 'undefined' && !navigator.onLine;
  }

  /**
   * Exponential Backoff Retry Logic for handling transient errors
   */
  async retryWithBackoff<T>(fn: () => Promise<T>, maxRetries = 3, initialDelay = 1000): Promise<T> {
    let delay = initialDelay;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (err: any) {
        if (this.isOffline()) {
          throw new Error('Offline: Network connection is unavailable.');
        }
        if (attempt === maxRetries) {
          throw err;
        }
        console.warn(`Maps API attempt ${attempt} failed. Retrying in ${delay}ms...`, err);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
      }
    }
    throw new Error('Max retries exceeded');
  }

  /**
   * 1. Current Location
   * Uses browser/device geolocation. Gracefully handles permission denied.
   */
  async getCurrentLocation(): Promise<ApiResponse<{ lat: number; lng: number }>> {
    try {
      const result = await new Promise<{ lat: number; lng: number }>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation is not supported by this browser.'));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
          },
          (error) => {
            let msg = 'Failed to retrieve your location.';
            if (error.code === error.PERMISSION_DENIED) {
              msg = 'Location permission was denied. Please enable location services.';
            }
            reject(new Error(msg));
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      });
      return { success: true, data: result };
    } catch (error: any) {
      return {
        success: false,
        errorCode: 'GEOLOCATION_ERROR',
        errorMessage: error.message || 'Failed to retrieve geolocation.'
      };
    }
  }

  /**
   * 2. Autocomplete Predictions (with 300ms Debouncing and Caching)
   */
  async getPlacePredictions(input: string): Promise<ApiResponse<any[]>> {
    if (this.isOffline()) {
      return {
        success: false,
        errorCode: 'OFFLINE',
        errorMessage: 'Network is offline. Using local suggestions fallback.'
      };
    }

    if (!this.hasValidKey()) {
      return {
        success: false,
        errorCode: 'MISSING_KEY',
        errorMessage: 'Google Maps API key is missing or invalid.'
      };
    }

    const cached = MapsCache.get<any[]>(`autocomplete:${input}`);
    if (cached) {
      return { success: true, data: cached };
    }

    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    this.lastInput = input;

    return new Promise((resolve) => {
      this.debounceTimeout = setTimeout(async () => {
        try {
          const res = await this.retryWithBackoff(async () => {
            if (!window.google || !window.google.maps) {
              throw new Error('Google Maps API has not loaded yet.');
            }
            const autocompleteService = new window.google.maps.places.AutocompleteService();
            return new Promise<any[]>((resService, rejService) => {
              autocompleteService.getPlacePredictions(
                {
                  input,
                  componentRestrictions: { country: 'in' },
                },
                (predictions, status) => {
                  if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
                    resService(predictions);
                  } else if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
                    resService([]);
                  } else {
                    rejService(new Error(`Autocomplete failed with status: ${status}`));
                  }
                }
              );
            });
          });

          MapsCache.set(`autocomplete:${input}`, res);
          resolve({ success: true, data: res });
        } catch (error: any) {
          resolve({
            success: false,
            errorCode: 'AUTOCOMPLETE_ERROR',
            errorMessage: error.message || 'Failed to fetch autocomplete predictions.'
          });
        }
      }, 300);
    });
  }

  /**
   * 3. Place Details (with Cache and Retry)
   */
  async getPlaceDetails(placeId: string, fields: string[] = ['geometry', 'formatted_address', 'name']): Promise<ApiResponse<any>> {
    const cacheKey = `details:${placeId}:${fields.join(',')}`;
    const cached = MapsCache.get<any>(cacheKey);
    if (cached) {
      return { success: true, data: cached };
    }

    if (this.isOffline()) {
      return {
        success: false,
        errorCode: 'OFFLINE',
        errorMessage: 'Network is offline. Place details cannot be loaded.'
      };
    }

    try {
      const details = await this.retryWithBackoff(async () => {
        if (!window.google || !window.google.maps) {
          throw new Error('Google Maps API has not loaded yet.');
        }
        const dummyDiv = document.createElement('div');
        const placesService = new window.google.maps.places.PlacesService(dummyDiv);

        return new Promise<any>((resolve, reject) => {
          placesService.getDetails(
            {
              placeId,
              fields: fields.map(f => {
                if (f === 'displayName') return 'name';
                if (f === 'formattedAddress') return 'formatted_address';
                if (f === 'location') return 'geometry';
                return f;
              })
            },
            (place, status) => {
              if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
                resolve(place);
              } else {
                reject(new Error(`Place Details failed with status: ${status}`));
              }
            }
          );
        });
      });

      MapsCache.set(cacheKey, details);
      return { success: true, data: details };
    } catch (error: any) {
      return {
        success: false,
        errorCode: 'DETAILS_ERROR',
        errorMessage: error.message || 'Failed to fetch place details.'
      };
    }
  }

  /**
   * 4. Geocoding (with Cache and Retry)
   */
  async geocodeAddress(address: string): Promise<ApiResponse<{ lat: number; lng: number; formattedAddress: string; placeId?: string }>> {
    const cacheKey = `geocode:${address}`;
    const cached = MapsCache.get<any>(cacheKey);
    if (cached) {
      return { success: true, data: cached };
    }

    if (this.isOffline()) {
      return {
        success: false,
        errorCode: 'OFFLINE',
        errorMessage: 'Network is offline. Geocoding failed.'
      };
    }

    try {
      const result = await this.retryWithBackoff(async () => {
        if (!window.google || !window.google.maps) {
          throw new Error('Google Maps API has not loaded yet.');
        }
        const geocoder = new window.google.maps.Geocoder();
        return new Promise<any>((resolve, reject) => {
          geocoder.geocode({ address }, (results, status) => {
            if (status === window.google.maps.GeocoderStatus.OK && results && results[0]) {
              resolve({
                lat: results[0].geometry.location.lat(),
                lng: results[0].geometry.location.lng(),
                formattedAddress: results[0].formatted_address,
                placeId: results[0].place_id,
              });
            } else {
              reject(new Error(`Geocoding failed with status: ${status}`));
            }
          });
        });
      });

      MapsCache.set(cacheKey, result);
      return { success: true, data: result };
    } catch (error: any) {
      return {
        success: false,
        errorCode: 'GEOCODE_ERROR',
        errorMessage: error.message || 'Failed to geocode address.'
      };
    }
  }

  /**
   * 5. Reverse Geocoding (with Cache and Retry)
   */
  async reverseGeocode(lat: number, lng: number): Promise<ApiResponse<{ formattedAddress: string; placeId?: string }>> {
    const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
    const cacheKey = `reverse_geocode:${key}`;
    const cached = MapsCache.get<any>(cacheKey);
    if (cached) {
      return { success: true, data: cached };
    }

    if (this.isOffline()) {
      return {
        success: false,
        errorCode: 'OFFLINE',
        errorMessage: 'Network is offline. Reverse geocoding failed.'
      };
    }

    try {
      const result = await this.retryWithBackoff(async () => {
        if (!window.google || !window.google.maps) {
          throw new Error('Google Maps API has not loaded yet.');
        }
        const geocoder = new window.google.maps.Geocoder();
        return new Promise<any>((resolve, reject) => {
          geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === window.google.maps.GeocoderStatus.OK && results && results[0]) {
              resolve({
                formattedAddress: results[0].formatted_address,
                placeId: results[0].place_id,
              });
            } else {
              reject(new Error(`Reverse geocoding failed with status: ${status}`));
            }
          });
        });
      });

      MapsCache.set(cacheKey, result);
      return { success: true, data: result };
    } catch (error: any) {
      return {
        success: false,
        errorCode: 'REVERSE_GEOCODE_ERROR',
        errorMessage: error.message || 'Failed to reverse geocode location.'
      };
    }
  }

  /**
   * 6. Directions & Distance Matrix (unified interface with Cache and Retry)
   */
    async computeRoute(
    origin: string | google.maps.LatLngLiteral,
    destination: string | google.maps.LatLngLiteral,
    travelMode: 'DRIVING' | 'WALKING' | 'BICYCLING' | 'TRANSIT' = 'DRIVING',
    waypoints: { location: string | google.maps.LatLngLiteral; stopover?: boolean }[] = [],
    optimizeWaypoints: boolean = false
  ): Promise<ApiResponse<{
    distanceKm: number;
    durationMins: number;
    polyline: string;
    viewport?: google.maps.LatLngBoundsLiteral;
  }>> {
    const originStr = typeof origin === 'string' ? origin : `${origin.lat.toFixed(5)},${origin.lng.toFixed(5)}`;
    const destStr = typeof destination === 'string' ? destination : `${destination.lat.toFixed(5)},${destination.lng.toFixed(5)}`;
    const wpStr = waypoints.map(w => typeof w.location === 'string' ? w.location : `${w.location.lat},${w.location.lng}`).join('|');
    const cacheKey = `route:${originStr}:${destStr}:${travelMode}:${wpStr}:${optimizeWaypoints}`;
    const cached = MapsCache.get<any>(cacheKey);
    if (cached) {
      return { success: true, data: cached };
    }

    if (this.isOffline()) {
      return {
        success: false,
        errorCode: 'OFFLINE',
        errorMessage: 'Network is offline. Route calculations failed.'
      };
    }

    try {
      const result = await this.retryWithBackoff(async () => {
        if (!window.google || !window.google.maps) {
          throw new Error('Google Maps API has not loaded yet.');
        }
        const directionsService = new window.google.maps.DirectionsService();
        return new Promise<any>((resolve, reject) => {
          directionsService.route(
            {
              origin,
              destination,
              travelMode: window.google.maps.TravelMode[travelMode],
              waypoints,
              optimizeWaypoints,
            },
            (res, status) => {
              if (status === window.google.maps.DirectionsStatus.OK && res && res.routes[0]) {
                const route = res.routes[0];
                const leg = route.legs[0];
                const distanceKm = Number(((leg.distance?.value || 0) / 1000).toFixed(1));
                const durationMins = Math.round((leg.duration?.value || 0) / 60);
                const polyline = route.overview_polyline || '';
                const bounds = route.bounds;
                const viewport = bounds
                  ? {
                      north: bounds.getNorthEast().lat(),
                      east: bounds.getNorthEast().lng(),
                      south: bounds.getSouthWest().lat(),
                      west: bounds.getSouthWest().lng(),
                    }
                  : undefined;

                resolve({
                  distanceKm,
                  durationMins,
                  polyline,
                  viewport,
                });
              } else {
                reject(new Error(`Directions calculation failed with status: ${status}`));
              }
            }
          );
        });
      });

      MapsCache.set(cacheKey, result);
      return { success: true, data: result };
    } catch (error: any) {
      return {
        success: false,
        errorCode: 'ROUTE_ERROR',
        errorMessage: error.message || 'Failed to compute route.'
      };
    }
  }

  
  /**
   * Distance Matrix & ETA
   */
  async getDistanceMatrix(
    origins: (string | google.maps.LatLngLiteral)[],
    destinations: (string | google.maps.LatLngLiteral)[],
    travelMode: 'DRIVING' | 'WALKING' | 'BICYCLING' | 'TRANSIT' = 'DRIVING'
  ): Promise<ApiResponse<any>> {
    const originStrs = origins.map(o => typeof o === 'string' ? o : `${o.lat.toFixed(5)},${o.lng.toFixed(5)}`).join('|');
    const destStrs = destinations.map(d => typeof d === 'string' ? d : `${d.lat.toFixed(5)},${d.lng.toFixed(5)}`).join('|');
    const cacheKey = `distancematrix:${originStrs}:${destStrs}:${travelMode}`;

    const cached = MapsCache.get<any>(cacheKey);
    if (cached) {
      return { success: true, data: cached };
    }

    if (this.isOffline()) {
      return {
        success: false,
        errorCode: 'OFFLINE',
        errorMessage: 'Network is offline. Distance matrix failed.'
      };
    }

    try {
      const result = await this.retryWithBackoff(async () => {
        if (!window.google || !window.google.maps) {
          throw new Error('Google Maps API has not loaded yet.');
        }
        const service = new window.google.maps.DistanceMatrixService();
        return new Promise<any>((resolve, reject) => {
          service.getDistanceMatrix(
            {
              origins,
              destinations,
              travelMode: window.google.maps.TravelMode[travelMode],
            },
            (res, status) => {
              if (status === window.google.maps.DistanceMatrixStatus.OK && res) {
                resolve(res);
              } else {
                reject(new Error(`Distance Matrix failed with status: ${status}`));
              }
            }
          );
        });
      });

      MapsCache.set(cacheKey, result);
      return { success: true, data: result };
    } catch (error: any) {
      return {
        success: false,
        errorCode: 'DISTANCE_MATRIX_ERROR',
        errorMessage: error.message || 'Failed to fetch distance matrix.'
      };
    }
  }

  /**
   * 7. Nearby Search (with Cache and Retry)
   */
  async nearbySearch(
    center: google.maps.LatLngLiteral,
    radius: number = 3000,
    type: string = 'restaurant'
  ): Promise<ApiResponse<any[]>> {
    const centerStr = `${center.lat.toFixed(5)},${center.lng.toFixed(5)}`;
    const cacheKey = `nearby:${centerStr}:${radius}:${type}`;
    const cached = MapsCache.get<any[]>(cacheKey);
    if (cached) {
      return { success: true, data: cached };
    }

    if (this.isOffline()) {
      return {
        success: false,
        errorCode: 'OFFLINE',
        errorMessage: 'Network is offline. Nearby search failed.'
      };
    }

    try {
      const results = await this.retryWithBackoff(async () => {
        if (!window.google || !window.google.maps) {
          throw new Error('Google Maps API has not loaded yet.');
        }
        const dummyDiv = document.createElement('div');
        const placesService = new window.google.maps.places.PlacesService(dummyDiv);

        return new Promise<any[]>((resolve, reject) => {
          placesService.nearbySearch(
            {
              location: center,
              radius,
              type,
            },
            (res, status) => {
              if (status === window.google.maps.places.PlacesServiceStatus.OK && res) {
                resolve(res);
              } else if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
                resolve([]);
              } else {
                reject(new Error(`Nearby search failed with status: ${status}`));
              }
            }
          );
        });
      });

      MapsCache.set(cacheKey, results);
      return { success: true, data: results };
    } catch (error: any) {
      return {
        success: false,
        errorCode: 'NEARBY_ERROR',
        errorMessage: error.message || 'Failed to fetch nearby spots.'
      };
    }
  }

  /**
   * 8. Saved Addresses Operations in Firestore
   */
  async saveAddress(uid: string, address: Omit<SavedAddress, 'createdAt' | 'updatedAt'>): Promise<ApiResponse<void>> {
    try {
      const docId = address.id || `ADDR-${Date.now()}`;
      const docRef = doc(db, 'users', uid, 'saved_addresses', docId);
      
      await setDoc(docRef, {
        ...address,
        id: docId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        errorCode: 'DB_SAVE_ERROR',
        errorMessage: error.message || 'Failed to save address.'
      };
    }
  }

  async getSavedAddresses(uid: string): Promise<ApiResponse<SavedAddress[]>> {
    try {
      const colRef = collection(db, 'users', uid, 'saved_addresses');
      const snapshot = await getDocs(colRef);
      const addresses: SavedAddress[] = [];
      snapshot.forEach((doc) => {
        addresses.push({ id: doc.id, ...doc.data() } as SavedAddress);
      });
      return { success: true, data: addresses };
    } catch (error: any) {
      return {
        success: false,
        errorCode: 'DB_FETCH_ERROR',
        errorMessage: error.message || 'Failed to fetch saved addresses.'
      };
    }
  }

  async deleteSavedAddress(uid: string, docId: string): Promise<ApiResponse<void>> {
    try {
      const docRef = doc(db, 'users', uid, 'saved_addresses', docId);
      await deleteDoc(docRef);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        errorCode: 'DB_DELETE_ERROR',
        errorMessage: error.message || 'Failed to delete saved address.'
      };
    }
  }
}

export const mapService = new MapService();
