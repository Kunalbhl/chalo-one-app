import React, { useState, useEffect } from 'react';
// @ts-ignore
import appLogo from './assets/images/logo.png';
import { db, auth } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { AuthService } from './services/authService';
import { FirestoreService } from './services/firestoreService';
import { WalletService } from './services/walletService';
import { NotificationService } from './services/notificationService';
import { 
  UserProfile, 
  Address, 
  ChaloWallet, 
  WalletTransaction, 
  AppPreferences, 
  ConnectedAccounts, 
  UnifiedCart as UnifiedCartType, 
  OrderActivity, 
  SupportTicket,
  FoodItem,
  MartItem,
  HotelOption,
  StayQuery,
  BiometricLog,
  SavedBill
} from './types';

// Importing feature modules
import RidesModule from './components/RidesModule';
import IntercityModule from './components/IntercityModule';
import FoodModule from './components/FoodModule';
import MartModule from './components/MartModule';
import StaysModule from './components/StaysModule';
import AIAssistant from './components/AIAssistant';
import ReferralAndWallet from './components/ReferralAndWallet';
import AccountPage from './components/AccountPage';
import ActivityCenter from './components/ActivityCenter';
import UnifiedCart from './components/UnifiedCart';
import BiometricShield from './components/BiometricShield';
import LoginSignup from './components/LoginSignup';
import BillsModule from './components/BillsModule';
import ChaloMapView from './components/ChaloMapView';
import CommuteAlertSystem from './components/CommuteAlertSystem';
import { FOOD_ITEMS, MART_ITEMS } from './data';

import { 
  Home as HomeIcon, 
  Compass, 
  ShoppingBag, 
  ShoppingCart, 
  Trees, 
  Wallet, 
  Sparkles, 
  Settings, 
  MessageSquare, 
  Info, 
  MapPin, 
  Search, 
  Bell, 
  User, 
  ClipboardCheck, 
  ChevronRight, 
  X, 
  Menu,
  Ticket,
  Car,
  Bot,
  ArrowLeft,
  ArrowRight,
  SlidersHorizontal,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const weeklySavingsData = [
  { week: 'Wk 1', Cab: 80, Food: 60, Grocery: 50, Total: 190 },
  { week: 'Wk 2', Cab: 120, Food: 90, Grocery: 70, Total: 280 },
  { week: 'Wk 3', Cab: 100, Food: 85, Grocery: 65, Total: 250 },
  { week: 'Wk 4', Cab: 140, Food: 110, Grocery: 85, Total: 335 },
  { week: 'Wk 5', Cab: 150, Food: 120, Grocery: 95, Total: 365 },
];

export default function App() {
  const [activeTab, setActiveTabRaw] = useState<string>('home');
  const [tabHistory, setTabHistory] = useState<string[]>([]);
  const [moduleBackHandler, setModuleBackHandler] = useState<(() => boolean) | null>(null);

  const registerModuleBackHandler = (handler: (() => boolean) | null) => {
    setModuleBackHandler(() => handler);
  };

  const setActiveTab = (tab: string | ((prev: string) => string)) => {
    const nextTab = typeof tab === 'function' ? tab(activeTab) : tab;
    if (nextTab !== activeTab) {
      setModuleBackHandler(null); // Reset back handler on tab change
      if (nextTab !== 'rides') {
        setInitialDestination('');
      }
      setTabHistory(prev => {
        if (prev.length > 0 && prev[prev.length - 1] === activeTab) {
          return prev;
        }
        return [...prev, activeTab];
      });
      setActiveTabRaw(nextTab);
    }
  };

  const handleGoBack = () => {
    if (moduleBackHandler) {
      const handled = moduleBackHandler();
      if (handled) return; // handled by the internal module
    }

    if (tabHistory.length > 0) {
      const copy = [...tabHistory];
      const previous = copy.pop();
      setTabHistory(copy);
      if (previous) {
        setActiveTabRaw(previous);
      }
    } else {
      setActiveTabRaw('home');
    }
  };
  const [aiInitialQuery, setAiInitialQuery] = useState<string>('');
  const [initialDestination, setInitialDestination] = useState<string>('');
  const [accountInitialSection, setAccountInitialSection] = useState<string>('main');
  const redirectToLinkedAccounts = () => {
    setAccountInitialSection('linked_accounts');
    setActiveTab('preferences');
  };
  const [showFloatingChat, setShowFloatingChat] = useState<boolean>(false);
  const [showNotificationCenter, setShowNotificationCenter] = useState<boolean>(true);
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState<boolean>(false);
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);

  // Global selected location and modals states
  const [currentSelectedLocation, setCurrentSelectedLocation] = useState<string>('Koramangala, Bangalore');
  const [walletInitialTab, setWalletInitialTab] = useState<'wallet' | 'referral'>('wallet');
  const [showLocationSelectorModal, setShowLocationSelectorModal] = useState<boolean>(false);
  const [gpsFetching, setGpsFetching] = useState<boolean>(false);
  const [gpsResolvedAddress, setGpsResolvedAddress] = useState<string | null>(null);
  const [gpsCoordinates, setGpsCoordinates] = useState<string | null>(null);

  // Add new address state
  const [showAddNewAddressForm, setShowAddNewAddressForm] = useState<boolean>(false);
  const [newAddrLabel, setNewAddrLabel] = useState<string>('');
  const [newAddrLine, setNewAddrLine] = useState<string>('');
  const [newAddrLandmark, setNewAddrLandmark] = useState<string>('');

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 200 || document.documentElement.scrollTop > 200) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Chalo login persistence state
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  // 1. User Profile context (Cleaned of any hardcoded admin or dummy account)
  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: '',
    name: '',
    phone: '',
    email: '',
    dob: '',
    gender: 'Male',
    savedAddresses: [],
    referralCode: '',
    role: 'user'
  });

  // NEW: Feature permissions / phase-wise toggles state
  const DEFAULT_FEATURE_TOGGLES = {
    rides: true,
    intercity: true,
    food: true,
    mart: true,
    stays: true,
    bills: true,
    wallet: true,
    referrals: true,
    planner: true
  };

  const [featureToggles, setFeatureToggles] = useState<any>(() => {
    const saved = localStorage.getItem('chalo_feature_toggles');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return DEFAULT_FEATURE_TOGGLES;
  });

  useEffect(() => {
    if (!db) return;
    const fetchToggles = async () => {
      try {
        const configDocRef = doc(db, 'system_config', 'features');
        const docSnap = await getDoc(configDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data && data.toggles) {
            setFeatureToggles(data.toggles);
            localStorage.setItem('chalo_feature_toggles', JSON.stringify(data.toggles));
          }
        }
      } catch (e) {
        console.warn("Could not fetch feature toggles from Firestore:", e);
      }
    };
    fetchToggles();
  }, [db]);

  const saveFeatureToggles = async (toggles: any) => {
    setFeatureToggles(toggles);
    localStorage.setItem('chalo_feature_toggles', JSON.stringify(toggles));
    if (!db) return;
    try {
      const configDocRef = doc(db, 'system_config', 'features');
      await setDoc(configDocRef, {
        id: 'features',
        toggles,
        updatedBy: userProfile?.email || 'unknown_user',
        updatedAt: new Date().toISOString()
      }, { merge: true });
      console.log("Feature toggles updated in Firestore successfully.");
    } catch (e) {
      console.warn("Could not save feature toggles to Firestore:", e);
    }
  };

  // Redirect if trying to access disabled modules
  useEffect(() => {
    if (featureToggles) {
      if (activeTab === 'rides' && featureToggles.rides === false) {
        setActiveTab('home');
      }
      if (activeTab === 'intercity' && featureToggles.intercity === false) {
        setActiveTab('home');
      }
      if (activeTab === 'food' && featureToggles.food === false) {
        setActiveTab('home');
      }
      if (activeTab === 'mart' && featureToggles.mart === false) {
        setActiveTab('home');
      }
      if (activeTab === 'stays' && featureToggles.stays === false) {
        setActiveTab('home');
      }
      if (activeTab === 'bills' && featureToggles.bills === false) {
        setActiveTab('home');
      }
      if (activeTab === 'wallet' && featureToggles.wallet === false) {
        setActiveTab('home');
      }
    }
  }, [activeTab, featureToggles]);

  // Saved Utility Bills state with local storage preservation
  const [savedBills, setSavedBills] = useState<SavedBill[]>(() => {
    const saved = localStorage.getItem('chalo_saved_bills');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn('Stale bills in local storage, fallback to default');
      }
    }
    return [
      {
        id: 'BILL-001',
        category: 'Electricity',
        billerName: 'BESCOM Karnataka',
        consumerId: '5409211082',
        amount: 840.00,
        dueDate: '2026-07-15',
        status: 'unpaid'
      },
      {
        id: 'BILL-002',
        category: 'Broadband',
        billerName: 'ACT Fibernet Bangalore',
        consumerId: 'ACT11049282',
        amount: 1150.00,
        dueDate: '2026-07-10',
        status: 'unpaid'
      }
    ];
  });

  // Sync saved bills to local storage whenever they change
  useEffect(() => {
    localStorage.setItem('chalo_saved_bills', JSON.stringify(savedBills));
  }, [savedBills]);

  // 2. Chalo wallet balances with account-specific local storage preservation
  const [wallet, setWallet] = useState<ChaloWallet>(() => {
    const savedProfileStr = localStorage.getItem('chalo_user_profile');
    let emailKey = 'guest';
    if (savedProfileStr) {
      try {
        const p = JSON.parse(savedProfileStr);
        if (p?.email) emailKey = p.email.toLowerCase();
      } catch (e) {}
    }
    const saved = localStorage.getItem(`chalo_wallet_${emailKey}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      points: 4200,
      balance: 350.00,
      history: [
        {
          id: 'TXN102',
          description: 'Referral signup welcome bonus',
          type: 'credit',
          amount: 100.00,
          pointsSpentOrEarned: 2000,
          timestamp: 'June 20, 2026'
        }
      ]
    };
  });

  // 3. User Search settings with account-specific local storage preservation
  const [preferences, setPreferences] = useState<AppPreferences>(() => {
    const savedProfileStr = localStorage.getItem('chalo_user_profile');
    let emailKey = 'guest';
    if (savedProfileStr) {
      try {
        const p = JSON.parse(savedProfileStr);
        if (p?.email) emailKey = p.email.toLowerCase();
      } catch (e) {}
    }
    const saved = localStorage.getItem(`chalo_preferences_${emailKey}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      food: ['Zomato', 'Swiggy'],
      mart: ['Blinkit', 'Zepto', 'Instamart'],
      rides: ['Uber', 'Ola', 'Rapido'],
      stays: ['Booking.com', 'Agoda'],
      preferenceMode: 'cheapest',
      defaultFoodType: 'Non-Veg',
      biometricsEnabled: false, // Biometrics off by default!
      biometricMode: 'fingerprint',
      txBiometricsEnabled: false, // Biometrics off by default!
      securityPin: '1234'
    };
  });

  // Chalo Security App Lock and Biometric verification states
  const [isUnlocked, setIsUnlocked] = useState<boolean>(true);
  const [appMounted, setAppMounted] = useState<boolean>(false);
  const [pendingTx, setPendingTx] = useState<{
    type: 'deduct' | 'redeem_credit' | 'redeem_debit';
    amount: number;
    points?: number;
    description: string;
    callback: () => void;
  } | null>(null);

  // Core biometric security attempts audit log sequence list
  const [securityAuditLogs, setSecurityAuditLogs] = useState<BiometricLog[]>([
    {
      id: 'SEC-LOG-812034',
      timestamp: new Date(Date.now() - 1000 * 60 * 120).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      attemptType: 'app_launch',
      authMethod: 'faceid',
      status: 'success',
      selfieUrl: '', // Will display built-in secure high contrast SVG matrix
      details: 'Secure App Lock successfully released via Face ID'
    },
    {
      id: 'SEC-LOG-459201',
      timestamp: new Date(Date.now() - 1000 * 60 * 640).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      attemptType: 'app_launch',
      authMethod: 'faceid',
      status: 'failed',
      selfieUrl: '', // Will display built-in intruder profile matrix
      details: 'Unidentified face pattern detected. App unlock blocked.'
    },
    {
      id: 'SEC-LOG-230911',
      timestamp: new Date(Date.now() - 1000 * 60 * 1440).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      attemptType: 'transaction',
      authMethod: 'fingerprint',
      status: 'success',
      selfieUrl: '',
      details: 'Transaction authorized: Wallet payment check of ₹120.00'
    }
  ]);

  const recordSecurityLog = (attempt: Omit<BiometricLog, 'id' | 'timestamp'>) => {
    const newLog: BiometricLog = {
      id: 'SEC-LOG-' + Math.floor(100000 + Math.random() * 900000),
      timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      ...attempt
    };
    setSecurityAuditLogs(prev => {
      const nextLogs = [newLog, ...prev];
      persistFirebaseUpdate(wallet, preferences, nextLogs);
      return nextLogs;
    });
  };

  useEffect(() => {
    if (!appMounted) {
      if (preferences.biometricsEnabled !== false) {
        setIsUnlocked(false);
      }
      setAppMounted(true);
    }
  }, [preferences.biometricsEnabled, appMounted]);

  // Auto-fetch current GPS location on first session load/reload
  useEffect(() => {
    if (isLoggedIn && sessionStorage.getItem('chalo_gps_auto_fetched') !== 'true') {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            if (window.google && window.google.maps && window.google.maps.Geocoder) {
              const geocoder = new window.google.maps.Geocoder();
              geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                if (status === 'OK' && results && results[0]) {
                  const resolved = results[0].formatted_address;
                  setCurrentSelectedLocation(resolved);
                  setGpsResolvedAddress(resolved);
                  setGpsCoordinates(`Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`);
                  sessionStorage.setItem('chalo_gps_auto_fetched', 'true');
                } else {
                  const fallbackAdd = `GPS Sourced: Sector 15, Gurgaon (Coords: ${lat.toFixed(4)}, ${lng.toFixed(4)})`;
                  setCurrentSelectedLocation(fallbackAdd);
                  setGpsResolvedAddress(fallbackAdd);
                  sessionStorage.setItem('chalo_gps_auto_fetched', 'true');
                }
              });
            } else {
              fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
                .then(res => res.json())
                .then(data => {
                  const resolved = data && data.display_name ? data.display_name : `Sourced GPS: Sector 6, Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
                  setCurrentSelectedLocation(resolved);
                  setGpsResolvedAddress(resolved);
                  setGpsCoordinates(`Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`);
                  sessionStorage.setItem('chalo_gps_auto_fetched', 'true');
                })
                .catch(() => {
                  const fallbackAdd = `Sourced GPS: Sector 6, Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
                  setCurrentSelectedLocation(fallbackAdd);
                  setGpsResolvedAddress(fallbackAdd);
                  sessionStorage.setItem('chalo_gps_auto_fetched', 'true');
                });
            }
          },
          (error) => {
            console.warn("Auto startup GPS failed, using smart default office address", error);
            const fallbackAdd = "Chalo One Tech Office, RMZ Ecospace Outer Ring Road, Bengaluru, Karnataka 560103";
            setCurrentSelectedLocation(fallbackAdd);
            setGpsResolvedAddress(fallbackAdd);
            setGpsCoordinates("Lat: 12.93524, Lng: 77.62451");
            sessionStorage.setItem('chalo_gps_auto_fetched', 'true');
          },
          { enableHighAccuracy: true, timeout: 8000 }
        );
      } else {
        const fallbackAdd = "Koramangala 4th Block, Bengaluru, Karnataka 560034";
        setCurrentSelectedLocation(fallbackAdd);
        sessionStorage.setItem('chalo_gps_auto_fetched', 'true');
      }
    }
  }, [isLoggedIn]);

  // Synchronize and refresh referral codes of legacy users to the new format
  useEffect(() => {
    if (isLoggedIn && userProfile) {
      const currentCode = userProfile.referralCode || '';
      if (!currentCode.startsWith('CHALO')) {
        const cleanName = userProfile.name.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 5);
        const randomNum = Math.floor(100 + Math.random() * 900);
        const upgradedCode = `CHALO${cleanName}${randomNum}`;
        
        const updatedProfile = {
          ...userProfile,
          referralCode: upgradedCode
        };
        setUserProfile(updatedProfile);
        localStorage.setItem('chalo_user_profile', JSON.stringify(updatedProfile));

        // Persist profile updates directly to Firebase database
        if (db && auth.currentUser) {
          try {
            const userDocRef = doc(db, 'users', auth.currentUser.uid);
            setDoc(userDocRef, {
              name: updatedProfile.name || '',
              email: updatedProfile.email || '',
              phone: updatedProfile.phone || '',
              dob: updatedProfile.dob || '',
              gender: updatedProfile.gender || 'Male',
              photoURL: updatedProfile.avatarUrl || '',
              role: updatedProfile.role || 'user',
              emailVerified: auth.currentUser?.emailVerified || false,
              lastLogin: new Date().toISOString()
            }, { merge: true }).then(() => {
              console.log("Upgraded referral details synced to Firebase Firestore.");
            }).catch(err => {
              console.warn("Could not sync upgraded referral to Firebase:", err);
            });
          } catch (err) {
            console.warn("Could not persist profile changes to Firebase Firestore:", err);
          }
        }

        console.log(`Upgraded legacy referral code of ${userProfile.name} to ${upgradedCode}`);
      }
    }
  }, [isLoggedIn, userProfile, db]);

  // 4. Integrations switches
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccounts>({
    ola: false,
    uber: false,
    rapido: false,
    swiggy: false,
    zomato: false,
    blinkit: false,
    zepto: false,
    booking: false,
    agoda: false,
    makemytrip: false
  });

  // 5. Saved frequently pickup drop hotspots
  const [savedAddresses, setSavedAddresses] = useState<Address[]>(() => {
    const savedProfileStr = localStorage.getItem('chalo_user_profile');
    let emailKey = 'guest';
    if (savedProfileStr) {
      try {
        const p = JSON.parse(savedProfileStr);
        if (p?.email) emailKey = p.email.toLowerCase().trim();
      } catch (e) {}
    }
    const saved = localStorage.getItem(`chalo_saved_addresses_${emailKey}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  // 6. Unified shopping basket cart state
  const [cart, setCart] = useState<UnifiedCartType>({
    foodItems: [],
    martItems: []
  });

  // 7. Support tickets
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);

  // Sync active user profile to local storage whenever it changes
  useEffect(() => {
    if (userProfile) {
      localStorage.setItem('chalo_user_profile', JSON.stringify(userProfile));
    }
  }, [userProfile]);

  // Sync preferences to account-specific local storage whenever they change
  useEffect(() => {
    if (userProfile?.email) {
      const emailKey = userProfile.email.toLowerCase().trim();
      localStorage.setItem(`chalo_preferences_${emailKey}`, JSON.stringify(preferences));
    }
  }, [preferences, userProfile]);

  // Sync wallet to account-specific local storage whenever it changes
  useEffect(() => {
    if (userProfile?.email) {
      const emailKey = userProfile.email.toLowerCase().trim();
      localStorage.setItem(`chalo_wallet_${emailKey}`, JSON.stringify(wallet));
    }
  }, [wallet, userProfile]);

  // Sync saved addresses to account-specific local storage whenever they change
  useEffect(() => {
    if (userProfile?.email) {
      const emailKey = userProfile.email.toLowerCase().trim();
      localStorage.setItem(`chalo_saved_addresses_${emailKey}`, JSON.stringify(savedAddresses));
    }
  }, [savedAddresses, userProfile]);

  // Sync connected accounts to account-specific local storage whenever they change
  useEffect(() => {
    if (userProfile?.email) {
      const emailKey = userProfile.email.toLowerCase().trim();
      localStorage.setItem(`chalo_connected_accounts_${emailKey}`, JSON.stringify(connectedAccounts));
    }
  }, [connectedAccounts, userProfile]);

  // -------- GLOBAL SEMANTIC SEARCH CODES -------- //
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');
  const [globalRecentSearches, setGlobalRecentSearches] = useState<string[]>([
    'Book a ride to work',
    'Zepto Cafe fresh cookies',
    'Best hotels in Jaipur',
    'Check reward wallet history'
  ]);
  const [globalSearchFocused, setGlobalSearchFocused] = useState<boolean>(false);

  const SEMANTIC_SERVICES = [
    {
      id: 'rides',
      title: 'Rides',
      icon: '🚗',
      desc: 'Book a ride / compare Cab options',
      keywords: ['ride', 'cab', 'uber', 'ola', 'rapido', 'work', 'office', 'travel', 'car', 'taxi', 'drive', 'hail', 'commute']
    },
    {
      id: 'intercity',
      title: 'Intercity Routes',
      icon: '✈️',
      desc: 'Outstation routes and price comparisons',
      keywords: ['outstation', 'trip', 'delhi', 'jaipur', 'intercity', 'destination', 'long distance', 'highway', 'city', 'travel']
    },
    {
      id: 'food',
      title: 'Food Delivery',
      icon: '🍔',
      desc: 'Order delicious meals cross-comparatively',
      keywords: ['food', 'delivery', 'biryani', 'pizza', 'zomato', 'swiggy', 'meals', 'lunch', 'dinner', 'eat', 'restaurant', 'burger', 'hungry']
    },
    {
      id: 'mart',
      title: 'Fast Grocery',
      icon: '🛒',
      desc: 'Blinkit, Zepto, Swiggy Instamart comparisons',
      keywords: ['grocery', 'groceries', 'list', 'milk', 'blinkit', 'zepto', 'instamart', 'mart', 'veggies', 'vegetables', 'fruit', 'bread', 'butter']
    },
    {
      id: 'stays',
      title: 'Book Stays',
      icon: '🏨',
      desc: 'Agoda & Booking.com live comparative tariffs',
      keywords: ['hotel', 'stay', 'agoda', 'booking.com', 'room', 'resort', 'vacation', 'lodging', 'hotels']
    },
    {
      id: 'ai',
      title: 'Chalo One AI Assistant',
      icon: '🤖',
      desc: 'Ask AI engine for comparing savings, etc.',
      keywords: ['ai', 'assistant', 'ask', 'advisor', 'bot', 'chat', 'gemini', 'chalooneai', 'chalo', 'help', 'coupon', 'deals']
    },
    {
      id: 'wallet',
      title: 'Chalo One Wallet',
      icon: '💳',
      desc: 'Recharge or view transaction details',
      keywords: ['wallet', 'balance', 'referral', 'cash', 'money', 'add funds', 'recharge', 'pay', 'rupees']
    },
    {
      id: 'checkout',
      title: 'Super Basket',
      icon: '🧺',
      desc: 'Manage your unified comparison cart',
      keywords: ['cart', 'checkout', 'basket', 'items', 'order']
    },
    {
      id: 'activity',
      title: 'Activity Center',
      icon: '📋',
      desc: 'Check recent orders or timeline logs',
      keywords: ['activity', 'timeline', 'history', 'orders', 'past', 'receipt']
    },
    {
      id: 'bills',
      title: 'Utility Bills & Recharges',
      icon: '⚡',
      desc: 'Pay electricity, water, DTH, or broadband bills with coupon rewards',
      keywords: ['bill', 'bills', 'electricity', 'water', 'gas', 'recharge', 'wifi', 'broadband', 'utility', 'dth', 'postpaid']
    }
  ];

  const getSemanticSuggestions = () => {
    const query = globalSearchQuery.trim().toLowerCase();
    if (!query) return [];
    
    // Exact titles/desc matches or keyword check
    return SEMANTIC_SERVICES.filter(service => {
      const matchTitle = service.title.toLowerCase().includes(query);
      const matchDesc = service.desc.toLowerCase().includes(query);
      const matchKey = service.keywords.some(kw => query.includes(kw) || kw.includes(query));
      return matchTitle || matchDesc || matchKey;
    });
  };

  const handleGlobalSearchSubmit = (customQuery?: string) => {
    const rawVal = customQuery !== undefined ? customQuery : globalSearchQuery;
    const trimmed = rawVal.trim();
    if (!trimmed) return;

    // Track in recent searches locally
    setGlobalRecentSearches(prev => {
      const filtered = prev.filter(q => q.toLowerCase() !== trimmed.toLowerCase());
      return [trimmed, ...filtered].slice(0, 5);
    });

    const activeQuery = trimmed.toLowerCase();
    const matches = SEMANTIC_SERVICES.filter(service => {
      const matchTitle = service.title.toLowerCase().includes(activeQuery);
      const matchDesc = service.desc.toLowerCase().includes(activeQuery);
      const matchKey = service.keywords.some(kw => activeQuery.includes(kw) || kw.includes(activeQuery));
      return matchTitle || matchDesc || matchKey;
    });

    if (matches.length > 0) {
      setActiveTab(matches[0].id);
      setGlobalSearchQuery('');
    } else {
      setAiInitialQuery(trimmed);
      setActiveTab('ai');
      setGlobalSearchQuery('');
    }
    setGlobalSearchFocused(false);
  };
  // ---------------------------------------------- //

  // 8. Ongoing and past orders list
  const [activities, setActivities] = useState<OrderActivity[]>([
    {
      id: "CHALO-RIDE-911",
      category: "rides",
      platform: "Uber",
      merchant: "Delhi-NCR Premium Cabs",
      title: "Self Hailed Sedan Route to Airport",
      subtitle: "Assigned Captain: Amit Kumar • DL 1CA 4492",
      date: "Today",
      time: "Heading to pickup",
      amount: 285.00,
      status: "active",
      statusLabel: "Arriving in 3 mins",
      paymentMethod: "UPI_AUTOPAY",
      etaMins: 3
    }
  ]);

  // Real-time Authentication & Cloud Sync State Listener
  useEffect(() => {
    let unsubscribeDoc: (() => void) | null = null;

    const unsubscribeAuth = AuthService.onAuthChanged(async (user) => {
      if (user) {
        setIsLoggedIn(true);
        
        // Listen to real-time updates across decoupled secure collections from Firestore
        const unsubProfile = FirestoreService.subscribeDocument<any>('users', user.uid, (cloudData) => {
          if (cloudData) {
            const mappedProfile: UserProfile = {
              id: user.uid,
              name: cloudData.name || '',
              email: cloudData.email || '',
              phone: cloudData.phone || '',
              dob: cloudData.dob || '',
              gender: cloudData.gender || 'Male',
              savedAddresses: [],
              referralCode: `CHALO${user.uid.substring(user.uid.length - 5).toUpperCase()}`,
              avatarUrl: cloudData.photoURL || '',
              role: cloudData.role || 'user'
            };
            setUserProfile(mappedProfile);
          }
        });

        const unsubWallet = FirestoreService.subscribeDocument<ChaloWallet>('wallets', user.uid, (cloudData) => {
          if (cloudData) {
            setWallet(cloudData);
          }
        });

        const unsubPrefs = FirestoreService.subscribeDocument<AppPreferences>('preferences', user.uid, (cloudData) => {
          if (cloudData) {
            setPreferences(cloudData);
          }
        });

        const unsubAddresses = FirestoreService.subscribeDocument<any>('addresses', user.uid, (cloudData) => {
          if (cloudData && cloudData.addresses) {
            setSavedAddresses(cloudData.addresses);
          }
        });

        const unsubLogs = FirestoreService.subscribeDocument<any>('security_logs', user.uid, (cloudData) => {
          if (cloudData && cloudData.logs) {
            setSecurityAuditLogs(cloudData.logs);
          }
        });

        const unsubConnected = FirestoreService.subscribeDocument<ConnectedAccounts>('connected_accounts', user.uid, (cloudData) => {
          if (cloudData) {
            setConnectedAccounts(cloudData);
          }
        });

        unsubscribeDoc = () => {
          unsubProfile();
          unsubWallet();
          unsubPrefs();
          unsubAddresses();
          unsubLogs();
          unsubConnected();
        };
      } else {
        setIsLoggedIn(false);
        if (unsubscribeDoc) {
          unsubscribeDoc();
          unsubscribeDoc = null;
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) {
        unsubscribeDoc();
      }
    };
  }, [db]);

  const persistFirebaseUpdate = async (
    updatedWallet: ChaloWallet, 
    updatedPrefs: AppPreferences, 
    updatedLogs?: BiometricLog[],
    updatedConnectedAccounts?: ConnectedAccounts,
    updatedProfile?: UserProfile
  ) => {
    const activeProfile = updatedProfile || userProfile;
    const userId = auth.currentUser?.uid || activeProfile?.id;
    if (!userId) return; // Ignore if user is not logged in
    
    if (!db) return;
    try {
      // 1. Update user profile document users/{uid} containing ONLY the specified 10 fields!
      const userDocRef = doc(db, 'users', userId);
      await setDoc(userDocRef, {
        name: activeProfile.name || '',
        email: activeProfile.email || '',
        phone: activeProfile.phone || '',
        dob: activeProfile.dob || '',
        gender: activeProfile.gender || 'Male',
        photoURL: activeProfile.avatarUrl || '',
        role: activeProfile.role || 'user',
        emailVerified: auth.currentUser?.emailVerified || false,
        lastLogin: new Date().toISOString()
      }, { merge: true });

      // 2. Update wallet document wallets/{uid}
      await setDoc(doc(db, 'wallets', userId), updatedWallet, { merge: true });

      // 3. Update AppPreferences document preferences/{uid}
      await setDoc(doc(db, 'preferences', userId), updatedPrefs, { merge: true });

      // 4. Update saved addresses document addresses/{uid}
      await setDoc(doc(db, 'addresses', userId), { addresses: savedAddresses }, { merge: true });

      // 5. Update security logs document security_logs/{uid}
      if (updatedLogs !== undefined || securityAuditLogs.length > 0) {
        await setDoc(doc(db, 'security_logs', userId), { logs: updatedLogs !== undefined ? updatedLogs : securityAuditLogs }, { merge: true });
      }

      // 6. Update connected accounts document connected_accounts/{uid}
      const activeConnected = updatedConnectedAccounts !== undefined ? updatedConnectedAccounts : connectedAccounts;
      await setDoc(doc(db, 'connected_accounts', userId), activeConnected, { merge: true });

    } catch (e) {
      console.warn('Could not persist state updates to Firestore:', e);
    }
  };

  const handleHeaderGPSFetch = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setGpsFetching(true);
    setGpsResolvedAddress(null);
    setGpsCoordinates(null);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const coordsStr = `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`;
        setGpsCoordinates(coordsStr);
        
        // Dynamic reverse geocoding using Google Maps API if available, else highly robust Nominatim fallback
        if (window.google && window.google.maps && window.google.maps.Geocoder) {
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
              setGpsResolvedAddress(results[0].formatted_address);
            } else {
              setGpsResolvedAddress(`Sourced Location, Sector 15 (Coords: ${lat.toFixed(5)}, ${lng.toFixed(5)})`);
            }
            setGpsFetching(false);
          });
        } else {
          fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
            .then(res => res.json())
            .then(data => {
              if (data && data.display_name) {
                setGpsResolvedAddress(data.display_name);
              } else {
                setGpsResolvedAddress(`Sourced GPS: Sector 6, Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`);
              }
              setGpsFetching(false);
            })
            .catch(() => {
              setGpsResolvedAddress(`Sourced GPS: Sector 6, Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`);
              setGpsFetching(false);
            });
        }
      },
      (error) => {
        console.warn("GPS failed", error);
        const lat = 12.93524;
        const lng = 77.62451;
        const coordsStr = `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`;
        setGpsCoordinates(coordsStr);
        setGpsResolvedAddress(`Chalo One Tech Office, RMZ Ecospace Outer Ring Road, Bengaluru, Karnataka 560103`);
        setGpsFetching(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleAddNewAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddrLine.trim() || !newAddrLabel.trim()) return;
    const newAddr: Address = {
      id: 'ADDR-' + (savedAddresses.length + 1),
      label: newAddrLabel.trim(),
      addressLine: newAddrLine.trim(),
      landmark: newAddrLandmark.trim()
    };
    const updated = [...savedAddresses, newAddr];
    setSavedAddresses(updated);
    setCurrentSelectedLocation(`${newAddr.label}: ${newAddr.addressLine}`);
    
    // Clear fields
    setNewAddrLabel('');
    setNewAddrLine('');
    setNewAddrLandmark('');
    setShowAddNewAddressForm(false);
    setShowLocationSelectorModal(false);
  };

  const handleSaveWorkAddress = (addressLine: string) => {
    const existingWorkIdx = savedAddresses.findIndex(addr => addr.label === 'Work');
    let updatedAddrs = [...savedAddresses];
    if (existingWorkIdx !== -1) {
      updatedAddrs[existingWorkIdx] = {
        ...updatedAddrs[existingWorkIdx],
        addressLine: addressLine,
        landmark: 'Office Space',
        lat: 12.9716,
        lng: 77.5946
      };
    } else {
      updatedAddrs.push({
        id: 'ADDR-' + (Date.now()),
        label: 'Work',
        addressLine: addressLine,
        landmark: 'Office Space',
        lat: 12.9716,
        lng: 77.5946
      });
    }
    setSavedAddresses(updatedAddrs);
    const emailKey = userProfile?.email ? userProfile.email.toLowerCase().trim() : 'guest';
    localStorage.setItem(`chalo_saved_addresses_${emailKey}`, JSON.stringify(updatedAddrs));
    persistFirebaseUpdate(wallet, preferences);
  };

  // Add / Settle ongoing activities helper
  const addOrderToActivity = (activity: any) => {
    const formatted: OrderActivity = {
      id: activity.id || "CHALO-SETTLED-" + Math.floor(100000 + Math.random() * 900000),
      category: activity.category || 'mart',
      platform: activity.platform || 'Blinkit',
      merchant: activity.merchant || 'Partner Store',
      title: activity.title || 'Settled Order',
      subtitle: activity.subtitle || 'Payment Settled via Super-App',
      date: activity.date || 'Today',
      time: activity.time || 'Secs ago',
      amount: activity.amount || 0,
      status: activity.status === 'completed' ? 'completed' : 'active',
      statusLabel: activity.statusLabel || 'Active',
      paymentMethod: activity.paymentMethod || 'UPI'
    };
    setActivities(prev => [formatted, ...prev]);
  };

  // Dynamic Personalization Engine based on repeating user habits and history
  const getPersonalizedPrompts = () => {
    const prompts: any[] = [];

    // 1. COMMUTE HABIT: check if there's a work address or if they commute
    const workAddr = savedAddresses.find(a => a.label === 'Work');
    const hasRideActivity = activities.some(a => a.category === 'rides');
    
    if (workAddr || hasRideActivity) {
      prompts.push({
        id: 'commute-office',
        type: 'commute',
        title: '💼 Office Commute',
        subtitle: `Heading to your office? Book a premium ride to ${workAddr ? workAddr.addressLine : 'office'}.`,
        ctaText: 'Book Cab',
        icon: '🚗',
        action: () => {
          setInitialDestination(workAddr?.addressLine || 'Chalo One Tech Office, RMZ Ecospace');
          setActiveTab('rides');
        }
      });
    }

    // 2. REPEATED ORDERS: if they have placed orders before, show instant reorder
    const orderFrequency: { [key: string]: { count: number; item: any; category: 'food' | 'mart' } } = {};
    
    activities.forEach(act => {
      if (act.category === 'food' || act.category === 'mart') {
        const key = act.title;
        if (!orderFrequency[key]) {
          orderFrequency[key] = {
            count: 1,
            item: act,
            category: act.category
          };
        } else {
          orderFrequency[key].count += 1;
        }
      }
    });

    // Add reorder prompt for items
    Object.keys(orderFrequency).forEach(title => {
      const freq = orderFrequency[title];
      prompts.push({
        id: `reorder-${title.replace(/\s+/g, '-').toLowerCase()}`,
        type: 'reorder',
        title: freq.count >= 2 ? `🔄 Repeat Order: ${title}` : `🛒 Buy ${title} Again`,
        subtitle: `You ordered "${title}" via ${freq.item.platform} before (${freq.count}x). Click to buy again.`,
        ctaText: 'Re-order',
        icon: freq.category === 'food' ? '🍔' : '🥛',
        action: () => {
          if (freq.category === 'food') {
            const foundItem = FOOD_ITEMS.find(f => f.name === title) || {
              id: freq.item.id || 'f-custom',
              name: title,
              restaurant: freq.item.merchant || 'Restaurant',
              platform: freq.item.platform as any || 'Zomato',
              price: freq.item.amount,
              deliveryFee: 0,
              discount: 0,
              deliveryTime: 30,
              rating: 4.5,
              image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
              isVeg: true
            };
            addToFoodCart(foundItem);
          } else {
            const foundItem = MART_ITEMS.find(m => m.name === title) || {
              id: freq.item.id || 'm-custom',
              name: title,
              brand: freq.item.merchant || 'Store',
              weightVolume: '1 Unit',
              category: 'Grocery',
              image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
              prices: [{ platform: freq.item.platform as any || 'Blinkit', price: freq.item.amount, discountedPrice: freq.item.amount, deliveryTime: 10, inStock: true }]
            };
            addMartToCart(foundItem, freq.item.platform);
          }
          setActiveTab('checkout');
        }
      });
    });

    // 3. UNPAID BILLS: if any bills are unpaid
    savedBills.forEach(bill => {
      if (bill.status && bill.status.toLowerCase() === 'unpaid') {
        prompts.push({
          id: `bill-${bill.id}`,
          type: 'bill',
          title: `⚡ Unpaid Bill: ${bill.category}`,
          subtitle: `Your ${bill.billerName} bill of ₹${bill.amountDue || bill.amount} is due.`,
          ctaText: 'Pay Bill',
          icon: '⚡',
          action: () => {
            setActiveTab('bills');
          }
        });
      }
    });

    // 4. Default dynamic prompt to consult AI based on preference
    prompts.push({
      id: 'advisor-saving',
      type: 'smart',
      title: '🤖 Chalo AI Companion',
      subtitle: `Your mode is "${preferences.preferenceMode}". Let us compare surge and discounts.`,
      ctaText: 'Ask AI',
      icon: '✨',
      action: () => {
        setAiInitialQuery(`Analyze my preferences for ${preferences.preferenceMode} mode across services and recommend the best ways to maximize savings.`);
        setActiveTab('ai');
      }
    });

    return prompts;
  };

  const cancelActivity = (id: string) => {
    setActivities(prev => prev.map(act => {
      if (act.id === id) {
        return { ...act, status: 'cancelled', statusLabel: 'Cancelled' };
      }
      return act;
    }));
  };

  const addWalletPoints = (pts: number) => {
    const nextWallet = {
      ...wallet,
      points: wallet.points + pts,
      history: [
        {
          id: 'TXN-' + Math.floor(100000 + Math.random() * 900000),
          description: 'Earned loyalty comparative saver points',
          type: 'credit' as const,
          amount: 0.00,
          pointsSpentOrEarned: pts,
          timestamp: 'Just now'
        },
        ...wallet.history
      ]
    };
    setWallet(nextWallet);
    persistFirebaseUpdate(nextWallet, preferences);
  };

  const executeDeductWalletCoins = (rs: number) => {
    const nextWallet = {
      ...wallet,
      balance: Math.max(0, wallet.balance - rs),
      history: [
        {
          id: 'TXN-' + Math.floor(100000 + Math.random() * 900000),
          description: 'Payment settlement via Chalo One Wallet Balance',
          type: 'debit' as const,
          amount: rs,
          pointsSpentOrEarned: 0,
          timestamp: 'Just now'
        },
        ...wallet.history
      ]
    };
    setWallet(nextWallet);
    persistFirebaseUpdate(nextWallet, preferences);
  };

  const deductWalletCoins = (rs: number) => {
    if (preferences.txBiometricsEnabled) {
      setPendingTx({
        type: 'deduct',
        amount: rs,
        description: 'Payment settlement check for instant order checkout',
        callback: () => executeDeductWalletCoins(rs)
      });
    } else {
      executeDeductWalletCoins(rs);
    }
  };

  const handleDeductBillCoins = (rs: number, description: string) => {
    if (preferences.txBiometricsEnabled) {
      setPendingTx({
        type: 'deduct',
        amount: rs,
        description: description || 'Payment settlement check for utility bill',
        callback: () => executeDeductWalletCoins(rs)
      });
    } else {
      executeDeductWalletCoins(rs);
    }
  };

  const executeRedeemPointsToCash = (pts: number) => {
    const isDeduction = pts < 0;
    const absPts = Math.abs(pts);
    let nextWallet: ChaloWallet;

    if (isDeduction) {
      // Money transfer peer deduction
      const amt = absPts / 20;
      nextWallet = {
        ...wallet,
        balance: Math.max(0, wallet.balance - amt),
        history: [
          {
            id: 'TXN-' + Math.floor(100000 + Math.random() * 900000),
            description: `Transfer money outward`,
            type: 'debit' as const,
            amount: amt,
            pointsSpentOrEarned: 0,
            timestamp: 'Today'
          },
          ...wallet.history
        ]
      };
    } else {
      // Credit exchange PTS values
      const cashAmount = pts / 20;
      nextWallet = {
        ...wallet,
        points: Math.max(0, wallet.points - pts),
        balance: wallet.balance + cashAmount,
        history: [
          {
            id: 'TXN-' + Math.floor(100000 + Math.random() * 900000),
            description: 'Redeemed comparative saver points into Wallet Credit',
            type: 'credit' as const,
            amount: cashAmount,
            pointsSpentOrEarned: pts,
            timestamp: 'Today'
          },
          ...wallet.history
        ]
      };
    }
    setWallet(nextWallet);
    persistFirebaseUpdate(nextWallet, preferences);
  };

  const redeemPointsToCash = (pts: number) => {
    const isDeduction = pts < 0;
    const amount = isDeduction ? Math.abs(pts) / 20 : Math.abs(pts) / 20;
    const description = isDeduction 
      ? `Outward wire transfer transaction`
      : `Points credit ledger exchange conversion`;

    if (preferences.txBiometricsEnabled) {
      setPendingTx({
        type: isDeduction ? 'redeem_debit' : 'redeem_credit',
        amount,
        points: pts,
        description,
        callback: () => executeRedeemPointsToCash(pts)
      });
    } else {
      executeRedeemPointsToCash(pts);
    }
  };

  const applyReferralCodePostSignup = async (code: string): Promise<{ success: boolean; message: string }> => {
    if (!userProfile || !auth.currentUser) {
      return { success: false, message: 'Please log in first.' };
    }
    
    const trimmedCode = code.trim().toUpperCase();
    if (!trimmedCode) {
      return { success: false, message: 'Please enter a valid referral code.' };
    }
    
    // Check if trying to apply own code
    if (userProfile.referralCode && userProfile.referralCode.toLowerCase() === trimmedCode.toLowerCase()) {
      return { success: false, message: 'You cannot use your own referral code!' };
    }
    
    // Check if already referred
    if (userProfile.referredBy) {
      return { success: false, message: 'You have already applied a referral code!' };
    }
    
    // Verify code in Firestore first for absolute real-time central correctness
    let referrerData: { email: string; name: string; userId?: string } | null = null;
    if (db) {
      try {
        const docSnap = await getDoc(doc(db, 'referral_codes', trimmedCode));
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data && data.email) {
            referrerData = { 
              email: data.email.toLowerCase(), 
              name: data.name || 'User',
              userId: data.userId
            };
          }
        }
      } catch (e) {
        console.warn("Error verifying referral code in post-signup:", e);
      }
    }

    if (!referrerData) {
      return { success: false, message: 'Invalid referral code. Please check and try again.' };
    }

    const referrerEmail = referrerData.email;
    const referrerName = referrerData.name;
    const referrerUserId = referrerData.userId || '';
    
    // Valid code! Apply rewards
    // 1. Reward the current user
    let updatedWallet: any = null;
    setWallet(prev => {
      updatedWallet = {
        ...prev,
        points: prev.points + 2000,
        history: [
          {
            id: 'TXN-' + Math.floor(100000 + Math.random() * 900000),
            type: 'credit' as const,
            amount: 100.00,
            pointsSpentOrEarned: 2000,
            description: `Referral Welcome Bonus via ${referrerName}`,
            createdAt: new Date().toLocaleDateString()
          },
          ...prev.history
        ]
      };
      return updatedWallet;
    });

    // Persist changes to Firestore for both users
    if (db) {
      try {
        const myUid = auth.currentUser.uid;
        // 1. Current User's wallet document update
        await setDoc(doc(db, 'wallets', myUid), updatedWallet || wallet, { merge: true });

        // 2. Referrer User's wallet document update
        if (referrerUserId) {
          const refWalletRef = doc(db, 'wallets', referrerUserId);
          const refWalletSnap = await getDoc(refWalletRef);
          let currentRefWallet = { points: 2000, balance: 100.00, history: [] as any[] };
          if (refWalletSnap.exists()) {
            const refDbData = refWalletSnap.data();
            currentRefWallet = {
              ...refDbData,
              points: (refDbData.points || 0) + 2000,
              history: [
                {
                  id: 'TXN-' + Math.floor(100000 + Math.random() * 900005),
                  type: 'credit',
                  amount: 100.00,
                  pointsSpentOrEarned: 2000,
                  description: `Referral post-signup bonus: Invited ${userProfile.name}`,
                  createdAt: new Date().toLocaleDateString()
                },
                ...(refDbData.history || [])
              ]
            } as any;
          }
          await setDoc(refWalletRef, currentRefWallet, { merge: true });

          // 3. Store sub-collection referral details under the referrer
          await setDoc(doc(db, 'referrals', referrerUserId, 'joined', myUid), {
            name: userProfile.name,
            email: userProfile.email,
            joinedAt: new Date().toISOString(),
            pointsAwarded: 2000
          });
        }

      } catch (e) {
        console.warn("Error updating Firestore for post-signup referral:", e);
      }
    }
    
    // 3. Update current user profile
    const updatedProfile = {
      ...userProfile,
      referredBy: trimmedCode
    };
    setUserProfile(updatedProfile);
    localStorage.setItem('chalo_user_profile', JSON.stringify(updatedProfile));
    
    return { success: true, message: `Success! Both you and ${referrerName} have been allocated 2,000 points!` };
  };

  const addSupportTicket = (ticket: SupportTicket) => {
    setSupportTickets(prev => [ticket, ...prev]);
  };

  const replyToTicket = (id: string, text: string) => {
    setSupportTickets(prev => prev.map(t => {
      if (t.id === id) {
        return {
          ...t,
          messages: [
            ...t.messages,
            { sender: 'user', text, timestamp: new Date().toLocaleTimeString() }
          ]
        };
      }
      return t;
    }));
  };

  // Cart operations
  const addToFoodCart = (item: FoodItem) => {
    setCart(prev => {
      const idx = prev.foodItems.findIndex(f => f.item.id === item.id && f.item.platform === item.platform);
      if (idx > -1) {
        const next = [...prev.foodItems];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return { ...prev, foodItems: next };
      } else {
        return { ...prev, foodItems: [...prev.foodItems, { item, quantity: 1 }] };
      }
    });
    alert(`Added ${item.name} from ${item.platform} to super basket!`);
  };

  const removeFromFoodCart = (item: FoodItem) => {
    setCart(prev => {
      const idx = prev.foodItems.findIndex(f => f.item.id === item.id && f.item.platform === item.platform);
      if (idx === -1) return prev;
      const next = [...prev.foodItems];
      const newQty = next[idx].quantity - 1;
      if (newQty <= 0) {
        next.splice(idx, 1);
      } else {
        next[idx] = { ...next[idx], quantity: newQty };
      }
      return { ...prev, foodItems: next };
    });
  };

  const addMartToCart = (item: MartItem, platform: string) => {
    setCart(prev => {
      const idx = prev.martItems.findIndex(m => m.item.id === item.id && m.platform === platform);
      if (idx > -1) {
        const next = [...prev.martItems];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return { ...prev, martItems: next };
      } else {
        return { ...prev, martItems: [...prev.martItems, { item, platform, quantity: 1 }] };
      }
    });
    alert(`Added ${item.name} from ${platform} to super basket!`);
  };

  const removeMartFromCart = (item: MartItem, platform: string) => {
    setCart(prev => {
      const idx = prev.martItems.findIndex(m => m.item.id === item.id && m.platform === platform);
      if (idx === -1) return prev;
      const next = [...prev.martItems];
      const newQty = next[idx].quantity - 1;
      if (newQty <= 0) {
        next.splice(idx, 1);
      } else {
        next[idx] = { ...next[idx], quantity: newQty };
      }
      return { ...prev, martItems: next };
    });
  };

  const clearCart = () => {
    setCart({ foodItems: [], martItems: [] });
  };

  // Convert Activity lists mapping status flags to 'ongoing' or 'completed'
  const convertedActivityList = activities.map(act => ({
    id: act.id,
    category: act.category,
    platform: act.platform,
    title: act.title,
    subtitle: act.subtitle,
    date: act.date,
    time: act.time,
    amount: act.amount,
    status: act.status === 'active' ? 'ongoing' as const : act.status === 'cancelled' ? 'cancelled' as const : 'completed' as const,
    eta: act.etaMins ? `${act.etaMins} mins` : undefined,
    otpConfirm: act.id === 'CHALO-RIDE-911' ? '2987' : undefined,
    routeString: act.id === 'CHALO-RIDE-911' ? 'Driver is near Block 4B crossing, taking turn' : undefined,
    pickupCoords: act.pickupCoords || (act.id === 'CHALO-RIDE-911' ? { lat: 12.9352, lng: 77.6245 } : undefined),
    destCoords: act.destCoords || (act.id === 'CHALO-RIDE-911' ? { lat: 12.9719, lng: 77.6412 } : undefined)
  }));

  const cartUnifiedCount = cart.foodItems.length + cart.martItems.length + (cart.stayBooking ? 1 : 0);

  const addCoinsToBalance = (amount: number) => {
    const nextWallet = {
      ...wallet,
      balance: wallet.balance + amount,
      history: [
        {
          id: 'TXN-' + Math.floor(100000 + Math.random() * 900000),
          description: 'Added funds from simulated bank card',
          type: 'credit' as const,
          amount: amount,
          pointsSpentOrEarned: 0,
          timestamp: 'Just now'
        },
        ...wallet.history
      ]
    };
    setWallet(nextWallet);
    persistFirebaseUpdate(nextWallet, preferences);
  };

  // Helper to resolve currently selected bottom nav segment item
  const selectedBottomNode = ['activity', 'preferences'].includes(activeTab) ? activeTab : 'home';

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col text-slate-900 font-sans tracking-tight antialiased">
        <div className="w-full bg-white min-h-screen flex flex-col shadow-2xl relative md:border-x border-slate-150 transition-all duration-300">
          <LoginSignup 
            savedPreferences={preferences}
            onLoginSuccess={(profile) => {
              setUserProfile(profile);
              setIsLoggedIn(true);
              localStorage.setItem('chalo_is_logged_in', 'true');
              localStorage.setItem('chalo_user_profile', JSON.stringify(profile));

              // Load user-specific states if they exist, else initialize defaults
              const emailKey = profile.email.toLowerCase();
              
              const savedWallet = localStorage.getItem(`chalo_wallet_${emailKey}`);
              if (savedWallet) {
                try { setWallet(JSON.parse(savedWallet)); } catch (e) {}
              } else {
                // If it is a brand new signup, it might already have been populated in localStorage by the Register step,
                // or we fallback to default starter wallet
                setWallet({
                  points: profile.referredBy ? 2000 : 0,
                  balance: profile.referredBy ? 100.00 : 0.00,
                  history: profile.referredBy ? [
                    {
                      id: 'TXN_' + Math.floor(100000 + Math.random() * 900000),
                      description: 'Referral welcome bonus',
                      type: 'credit',
                      amount: 100.00,
                      pointsSpentOrEarned: 2000,
                      timestamp: new Date().toLocaleDateString()
                    }
                  ] : []
                });
              }

              const savedPrefs = localStorage.getItem(`chalo_preferences_${emailKey}`);
              if (savedPrefs) {
                try { setPreferences(JSON.parse(savedPrefs)); } catch (e) {}
              } else {
                setPreferences({
                  food: ['Zomato', 'Swiggy'],
                  mart: ['Blinkit', 'Zepto', 'Instamart'],
                  rides: ['Uber', 'Ola', 'Rapido'],
                  stays: ['Booking.com', 'Agoda'],
                  preferenceMode: 'cheapest',
                  defaultFoodType: 'Non-Veg',
                  biometricsEnabled: false,
                  biometricMode: 'fingerprint',
                  txBiometricsEnabled: false,
                  securityPin: '1234'
                });
              }

              const savedAddrs = localStorage.getItem(`chalo_saved_addresses_${emailKey}`);
              if (savedAddrs) {
                try { setSavedAddresses(JSON.parse(savedAddrs)); } catch (e) {}
              } else {
                setSavedAddresses([]);
              }

              const savedLogs = localStorage.getItem(`chalo_security_audit_logs_${emailKey}`);
              if (savedLogs) {
                try { setSecurityAuditLogs(JSON.parse(savedLogs)); } catch (e) {}
              } else {
                setSecurityAuditLogs([]);
              }
            }} 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-900 font-sans tracking-tight antialiased">
      
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full bg-white min-h-screen flex flex-col shadow-2xl relative md:border-x border-slate-150 transition-all duration-300"
      >
        
        {/* 🛡️ APP LAUNCH LOCK OVERLAY */}
        <BiometricShield 
          isOpen={!isUnlocked} 
          onUnlock={() => setIsUnlocked(true)} 
          primaryMode={preferences.biometricMode}
          attemptType="app_launch"
          onAuthResult={recordSecurityLog}
        />

        {/* 🛡️ SECURITY TRANSACTION confirmation authorization */}
        <BiometricShield 
          isOpen={!!pendingTx}
          onUnlock={() => {
            if (pendingTx) {
              pendingTx.callback();
              setPendingTx(null);
            }
          }}
          isTransactionAuth={true}
          transactionAmount={pendingTx?.amount}
          transactionDescription={pendingTx?.description}
          onCancelTransaction={() => setPendingTx(null)}
          primaryMode={preferences.biometricMode}
          attemptType="transaction"
          onAuthResult={recordSecurityLog}
        />
        
        {/* PREMIUM GLOBAL HEADER BAR */}
        <header className="sticky top-0 z-30 bg-slate-900 text-white px-4 py-3 flex flex-col space-y-2.5 md:space-y-0 shadow-md">
          {/* Main row */}
          <div className="flex items-center justify-between w-full">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-2">
              {activeTab !== 'home' && (
                <button
                  type="button"
                  id="header-go-back-btn"
                  onClick={handleGoBack}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl flex items-center justify-center transition border border-slate-700 cursor-pointer mr-1 shrink-0"
                  title="Go back to the previous screen"
                >
                  <ArrowLeft className="w-3.5 h-3.5 animate-pulse" />
                </button>
              )}
              <div className="flex items-center space-x-2 cursor-pointer select-none" onClick={() => setActiveTab('home')}>
                {/* Logo container styled for a transparent PNG logo without a white background */}
                <div className="w-8 h-8 flex items-center justify-center overflow-hidden shrink-0">
                  <img 
                    src={appLogo} 
                    alt="Chalo One Logo" 
                    className="w-full h-full object-contain" 
                    referrerPolicy="no-referrer" 
                  />
                </div>
                <div className="min-w-0">
                  <h1 className="font-display font-black text-sm tracking-tight uppercase leading-none truncate">Chalo One</h1>
                  <span className="text-[7.5px] text-amber-400 font-bold uppercase mt-0.5 block font-mono sm:hidden truncate max-w-[110px]">AI Super Comparator</span>
                  <span className="text-[8px] text-amber-400 font-bold uppercase mt-1 hidden sm:block font-mono">AI Powered One Platform Compare Food, Rides, Stay & Order.</span>
                </div>
              </div>
            </div>

            {/* Actions list */}
            <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
              {/* On Desktop: Show location here */}
              <div className="hidden md:flex">
                <button
                  type="button"
                  onClick={() => setShowLocationSelectorModal(true)}
                  className="flex items-center space-x-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-750 text-slate-100 rounded-full border border-slate-700/60 transition shadow-inner cursor-pointer"
                >
                  <MapPin className="w-3 h-3 text-emerald-400 animate-pulse shrink-0" />
                  <span className="text-[9.5px] font-mono font-bold tracking-tight truncate max-w-[150px]">
                    {currentSelectedLocation ? (currentSelectedLocation.includes(':') ? currentSelectedLocation.split(':')[1].trim() : currentSelectedLocation.split(',')[0]) : "Koramangala, Bengaluru"}
                  </span>
                  <span className="text-[8px] text-amber-400 font-black uppercase tracking-wider">▼ CHANGE</span>
                </button>
              </div>

              {/* Refer & Earn Premium Header Action */}
              <motion.button
                type="button"
                onClick={() => {
                  setWalletInitialTab('referral');
                  setActiveTab('wallet');
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-1 px-2.5 py-1.5 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-slate-950 font-display font-black text-[9px] uppercase rounded-full shadow-sm cursor-pointer border border-amber-300/30 transition-all shrink-0"
              >
                <Ticket className="w-3.5 h-3.5 text-slate-950" />
                <span className="hidden sm:inline">Refer & Earn</span>
                <span className="sm:hidden">Refer</span>
              </motion.button>

              {/* Cart trigger with counts badge */}
              <button
                type="button"
                onClick={() => setActiveTab('checkout')}
                className="relative p-1.5 hover:bg-slate-800 rounded-xl transition cursor-pointer text-slate-300 shrink-0"
                title="Super comparison cart checkout"
              >
                <ShoppingCart className="w-4.5 h-4.5" />
                {cartUnifiedCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 font-display text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-slate-900">
                    {cartUnifiedCount}
                  </span>
                )}
              </button>

              {/* Quick avatar link with instant navigation to preferences (AccountPage) */}
              <button
                type="button"
                onClick={() => {
                  setAccountInitialSection('edit_profile');
                  setActiveTab('preferences');
                }}
                className="w-8 h-8 rounded-full bg-amber-400 hover:scale-105 active:scale-95 text-slate-950 flex items-center justify-center font-display font-black text-xs uppercase shadow-xs select-none cursor-pointer transition border border-amber-350 shrink-0"
                title="Account settings"
              >
                {userProfile.name.slice(0,2).toUpperCase()}
              </button>
            </div>
          </div>

          {/* On Mobile: Show a dedicated, full-width, beautiful location row underneath so it fits and aligns perfectly */}
          <div className="flex md:hidden w-full pt-1.5">
            <button
              type="button"
              onClick={() => setShowLocationSelectorModal(true)}
              className="flex items-center justify-between w-full px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-100 rounded-xl border border-slate-700/60 transition shadow-inner cursor-pointer"
            >
              <div className="flex items-center space-x-2 truncate">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 animate-pulse shrink-0" />
                <span className="text-[10px] font-mono font-bold tracking-tight text-slate-200 truncate">
                  Deliver to: {currentSelectedLocation ? (currentSelectedLocation.includes(':') ? currentSelectedLocation.split(':')[1].trim() : currentSelectedLocation) : "Koramangala, Bengaluru"}
                </span>
              </div>
              <span className="text-[8px] bg-slate-900 px-2 py-0.5 rounded text-amber-400 font-mono font-black uppercase tracking-wider shrink-0 ml-2">CHANGE</span>
            </button>
          </div>
        </header>

        {/* LOCATION SELECTOR OVERLAY MODAL */}
        <AnimatePresence>
          {showLocationSelectorModal && (
            <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-150 flex flex-col text-slate-850"
              >
                {/* Header */}
                <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-amber-400" />
                    <h3 className="font-display font-black uppercase tracking-tight text-sm text-amber-50">Select Delivery Location</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowLocationSelectorModal(false);
                      setShowAddNewAddressForm(false);
                    }}
                    className="p-1 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-5 overflow-y-auto max-h-[80vh] space-y-4">
                  {/* GPS Option */}
                  <div className="bg-amber-50 border border-amber-150 p-4 rounded-2xl space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-mono font-black uppercase">Realtime GPS</span>
                      <span className="text-[8px] text-slate-400 font-bold font-mono">Accuracy: 5 meters</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleHeaderGPSFetch}
                      disabled={gpsFetching}
                      className="w-full bg-slate-900 hover:bg-slate-950 text-white p-3 rounded-xl font-display font-black text-xs uppercase flex items-center justify-center space-x-2 cursor-pointer shadow-sm disabled:opacity-50 transition"
                    >
                      <Compass className={`w-4 h-4 text-amber-400 ${gpsFetching ? 'animate-spin' : ''}`} />
                      <span>{gpsFetching ? 'Fetching Precise Coordinates...' : 'Use Current Location'}</span>
                    </button>

                    {/* Coordinates & Resolved Address Display */}
                    {(gpsCoordinates || gpsResolvedAddress) && (
                      <div className="bg-white border border-amber-100 p-3 rounded-xl space-y-2 text-left text-xs">
                        {gpsCoordinates && (
                          <div className="flex items-center space-x-1 font-mono text-[10px] font-extrabold text-slate-500">
                            <span className="bg-slate-100 px-1.5 py-0.2 rounded text-slate-600">GPS Coords</span>
                            <span>{gpsCoordinates}</span>
                          </div>
                        )}
                        {gpsResolvedAddress && (
                          <div className="space-y-1">
                            <span className="text-[9px] text-emerald-600 font-extrabold font-mono block uppercase">✓ Geocoded Address Sourced</span>
                            <p className="font-sans font-bold text-slate-800 text-xs leading-normal">{gpsResolvedAddress}</p>
                            <button
                              type="button"
                              onClick={() => {
                                setCurrentSelectedLocation(gpsResolvedAddress);
                                setShowLocationSelectorModal(false);
                              }}
                              className="mt-2 text-[10px] bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-black px-2.5 py-1 rounded-lg uppercase cursor-pointer block text-center w-full transition"
                            >
                              Confirm & Select This GPS Location
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Saved Addresses List */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-extrabold text-slate-450 uppercase font-mono tracking-wider pl-1 block">My Saved Addresses</span>
                    {savedAddresses.length === 0 ? (
                      <p className="text-xs text-slate-450 italic pl-1">No saved addresses found.</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto divide-y divide-slate-50 pr-1">
                        {savedAddresses.map((addr) => (
                          <button
                            key={addr.id}
                            type="button"
                            onClick={() => {
                              setCurrentSelectedLocation(`${addr.label}: ${addr.addressLine}`);
                              setShowLocationSelectorModal(false);
                            }}
                            className="w-full text-left p-3 hover:bg-slate-50 border border-slate-100 hover:border-slate-200 rounded-xl flex items-start space-x-3 transition cursor-pointer text-xs"
                          >
                            <div className="p-2 bg-slate-100 rounded-xl text-amber-500 mt-0.5 shrink-0">
                              <MapPin className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-extrabold text-slate-900 uppercase font-mono text-[10px] flex items-center space-x-1.5">
                                <span>{addr.label}</span>
                                <span className="bg-slate-200/60 px-1 py-0.1 rounded text-slate-500 font-normal normal-case">Saved</span>
                              </div>
                              <p className="text-slate-700 font-semibold truncate mt-0.5">{addr.addressLine}</p>
                              {addr.landmark && (
                                <p className="text-[10px] text-slate-400 mt-0.5">Landmark: {addr.landmark}</p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Add New Address trigger */}
                  {!showAddNewAddressForm ? (
                    <button
                      type="button"
                      onClick={() => setShowAddNewAddressForm(true)}
                      className="w-full border border-dashed border-slate-300 hover:border-amber-400 p-3 rounded-2xl text-center text-xs font-bold text-amber-800 hover:text-amber-950 hover:bg-amber-50/20 transition cursor-pointer"
                    >
                      + Add New Master Address
                    </button>
                  ) : (
                    <form onSubmit={handleAddNewAddress} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3 text-xs text-left">
                      <div className="flex items-center justify-between border-b border-slate-150 pb-1.5 mb-1">
                        <span className="font-extrabold text-slate-800 uppercase font-mono text-[10px]">New Master Address Form</span>
                        <button
                          type="button"
                          onClick={() => setShowAddNewAddressForm(false)}
                          className="text-[10px] text-slate-400 hover:text-slate-600 font-bold uppercase font-mono"
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase font-mono block">Address Label</label>
                        <input
                          type="text"
                          required
                          value={newAddrLabel}
                          onChange={(e) => setNewAddrLabel(e.target.value)}
                          placeholder="e.g. Work, Gym, Parents, Cafe"
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-1 focus:ring-amber-400 text-xs font-bold placeholder-slate-400 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase font-mono block">Full Address Line (Google Search)</label>
                        <ChaloMapView 
                          label="" 
                          placeholder="Search any city, street, or address in India" 
                          initialValue={newAddrLine} 
                          onLocationSelect={(addr) => setNewAddrLine(addr)}
                          showMap={false}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase font-mono block">Landmark (Optional)</label>
                        <input
                          type="text"
                          value={newAddrLandmark}
                          onChange={(e) => setNewAddrLandmark(e.target.value)}
                          placeholder="e.g. Opposite Metro Station, Behind Temple"
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-1 focus:ring-amber-400 text-xs font-bold placeholder-slate-400 focus:outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-amber-400 hover:bg-amber-500 text-slate-950 p-2.5 rounded-xl font-display font-black uppercase text-xs shadow-xs transition cursor-pointer"
                      >
                        Save Address to Master & Select
                      </button>
                    </form>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Dynamic Global Navigation Path & Previous Button - Just that button only, no full line background */}
        {activeTab !== 'home' && (
          <div className="px-4 py-2 flex items-center sticky top-[57px] z-20 bg-transparent select-none pointer-events-none">
            <button
              onClick={handleGoBack}
              className="pointer-events-auto text-[11px] bg-slate-900 hover:bg-slate-800 text-white border border-slate-750 font-extrabold px-3.5 py-1.5 rounded-full transition uppercase flex items-center space-x-1 cursor-pointer shadow-md hover:scale-102"
            >
              <span>← Previous</span>
            </button>
          </div>
        )}

        {/* MAIN CONTAINER FRAME */}
        <main className="flex-1 bg-slate-50 overflow-y-auto">
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 45 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -45 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
            >
              {/* 1. Dashboard Landing Hub */}
              {activeTab === 'home' && (
                <div id="dashboard_view" className="p-4 space-y-4">

                  {/* Semantic Global Search Bar */}
                  <div id="global_search_container" className="bg-white p-4.5 rounded-3xl border border-slate-150 shadow-xs space-y-2.5 relative z-10 transition-transform">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Search className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider font-mono">Global Super Search</span>
                      </div>
                      {(globalSearchQuery || globalSearchFocused) && (
                        <button
                          id="btn_clear_global_search"
                          type="button"
                          onClick={() => {
                            setGlobalSearchQuery('');
                            setGlobalSearchFocused(false);
                          }}
                          className="text-[9px] text-slate-500 hover:text-slate-800 font-extrabold uppercase transition"
                        >
                          Cancel
                        </button>
                      )}
                    </div>

                    <form
                      id="global_search_form"
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleGlobalSearchSubmit();
                      }}
                      className="relative flex items-center"
                    >
                      <input
                        id="input_global_search"
                        type="text"
                        value={globalSearchQuery}
                        onFocus={() => setGlobalSearchFocused(true)}
                        onChange={(e) => setGlobalSearchQuery(e.target.value)}
                        placeholder='Try "Book a ride to work" or "grocery list"...'
                        className="w-full pl-3 pr-20 py-2.5 bg-slate-50 border border-slate-250 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 text-slate-900 transition"
                      />
                      <button
                        id="btn_submit_global_search"
                        type="submit"
                        className="absolute right-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-xl text-[9.5px] font-black uppercase tracking-tight transition cursor-pointer"
                      >
                        Search
                      </button>
                    </form>

                    {/* FOCUS STATE Panel for Auto searches / trending tags */}
                    <AnimatePresence>
                      {globalSearchFocused && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.15, ease: 'easeOut' }}
                          className="bg-slate-50 rounded-2xl border border-slate-200 p-3 space-y-3"
                        >
                          {globalRecentSearches.length > 0 && (
                            <div>
                              <span className="text-[8px] font-black text-rose-600 uppercase tracking-widest block mb-1 font-mono">⏰ Recent Searches</span>
                              <div className="flex flex-wrap gap-1">
                                {globalRecentSearches.map((term, i) => (
                                  <button
                                    key={i}
                                    type="button"
                                    onClick={() => {
                                      setGlobalSearchQuery(term);
                                      handleGlobalSearchSubmit(term);
                                    }}
                                    className="px-2.5 py-1 bg-white hover:bg-indigo-50 text-[10px] font-bold text-gray-700 border border-gray-200 rounded-lg cursor-pointer transition flex items-center space-x-1"
                                  >
                                    <span>🔍</span>
                                    <span>{term}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          <div>
                            <span className="text-[8px] font-black text-indigo-700 uppercase tracking-widest block mb-1 font-mono">🔥 Trending on Chalo One</span>
                            <div className="grid grid-cols-2 gap-1.5 text-xs text-slate-800">
                              {[
                                { label: 'Cheapest Airport Rides 🚗', val: 'rides' },
                                { label: 'Zepto Milk Deals 🥛', val: 'mart' },
                                { label: 'Lounge Discounts 🏨', val: 'stays' },
                                { label: 'Instant Biryani deals 🍱', val: 'food' }
                              ].map((trend, i) => (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => {
                                    setGlobalSearchQuery(trend.label);
                                    setActiveTab(trend.val);
                                    setGlobalSearchFocused(false);
                                  }}
                                  className="p-2 bg-white hover:bg-indigo-50 rounded-lg border border-gray-200 text-left text-[10px] font-bold text-gray-800 transition cursor-pointer"
                                >
                                  {trend.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Suggestions list based on text typed */}
                    <AnimatePresence>
                      {globalSearchQuery.trim().length > 0 && (
                        <motion.div
                          id="global_search_suggestions"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.15, ease: 'easeOut' }}
                          className="bg-slate-50 rounded-2xl border border-slate-150 p-2 space-y-1"
                        >
                          <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest pl-2 block mb-1 font-mono">Matching Services</span>
                          {getSemanticSuggestions().map((srv) => (
                            <button
                              key={srv.id}
                              id={`search_suggest_item_${srv.id}`}
                              type="button"
                              onClick={() => {
                                setActiveTab(srv.id);
                                setGlobalSearchQuery('');
                                setGlobalSearchFocused(false);
                              }}
                              className="w-full text-left p-2 hover:bg-white hover:shadow-xs rounded-xl transition flex items-center justify-between cursor-pointer border border-transparent hover:border-slate-150"
                            >
                              <div className="flex items-center space-x-2">
                                <span className="text-sm">{srv.icon}</span>
                                <div className="flex flex-col">
                                  <span className="text-[10.5px] font-extrabold text-slate-800 uppercase">{srv.title}</span>
                                  <span className="text-[8.5px] text-slate-400 font-semibold">{srv.desc}</span>
                                </div>
                              </div>
                              <span className="text-[9.5px] text-amber-500 font-bold uppercase mr-1">Go →</span>
                            </button>
                          ))}
                          {getSemanticSuggestions().length === 0 && (
                            <p id="no_match_text" className="text-[9px] text-slate-450 italic pl-2 py-1">No direct tool matches. Press Enter to consult the Chalo One AI Advisor!</p>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Quick recommended prompts query chips */}
                    <div id="quick_prompts_container" className="flex flex-wrap gap-1.5 pt-1">
                      <span className="text-[8px] text-slate-400 font-bold block w-full uppercase tracking-wider pl-0.5">Quick Actions:</span>
                      {[
                        { text: 'Book a ride to work', tabId: 'rides' },
                        { text: 'Show grocery list', tabId: 'mart' },
                        { text: 'Best Biryani deals', tabId: 'food' },
                        { text: 'Check wallet balance', tabId: 'wallet' },
                      ].map((item, idx) => (
                        <button
                          key={idx}
                          id={`quick_query_chip_${idx}`}
                          type="button"
                          onClick={() => {
                            setGlobalSearchQuery(item.text);
                            setActiveTab(item.tabId);
                          }}
                          className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-650 hover:text-slate-800 border border-slate-150 rounded-lg text-[9px] font-bold transition cursor-pointer"
                        >
                          {item.text}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Promo offer banner */}
                  <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-3xl p-5 shadow-sm relative overflow-hidden">
                    <div className="absolute right-0 top-0 opacity-10 pointer-events-none text-9xl font-black font-display rotate-12 select-none">
                      75%
                    </div>

                    <div className="flex justify-between items-start gap-3">
                      <div className="space-y-1.5 max-w-[75%]">
                        <span className="text-[9px] bg-slate-900/40 text-amber-100 font-extrabold uppercase px-2.5 py-0.5 rounded-full inline-block font-mono">
                          Instant Savings Hub
                        </span>
                        <h2 className="text-lg font-display font-extrabold leading-tight tracking-tight mt-0.5 text-amber-50">
                          Never configure ten apps again.
                        </h2>
                        <p className="text-[11px] text-amber-50 mt-1 leading-normal font-medium">
                          Settle cab rides, groceries, meal reservations and staying packages with a flat checkout coupon. Apply coupon code <b className="font-mono text-white">CHALOSAVE</b> for ₹75 Off!
                        </p>
                      </div>

                      <div className="p-3 bg-white/10 rounded-2xl border border-white/20 flex flex-col items-center shrink-0 text-white shadow-xs">
                        <Ticket className="w-5 h-5 text-amber-200 animate-pulse" />
                        <span className="text-[9.5px] font-mono font-black mt-1">₹75 OFF</span>
                      </div>
                    </div>
                  </div>

                  {/* Main Launch Categories Grid: SHOWING VISUAL PRIMARY AGGREGATIONS TOGETHER */}
                  <div id="categories_grid_container">


                    <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest pl-1 font-mono">Go & Order Comparison Services</span>
                    {(() => {
                      const allTiles = [
                        { 
                          id: 'rides', 
                          title: '🚕 Local Cabs', 
                          desc: 'Compare Uber, Ola, and Rapido routes and prices instantly', 
                          colorClass: 'border-blue-100 bg-blue-50/40 text-blue-800 hover:border-blue-200',
                          tab: 'rides',
                          label: 'Book Cabs ➔'
                        },
                        { 
                          id: 'intercity', 
                          title: '✈️ Outstation Cabs', 
                          desc: 'Book long-distance highway routes and outstation cab tariffs', 
                          colorClass: 'border-cyan-100 bg-cyan-50/40 text-cyan-850 hover:border-cyan-200',
                          tab: 'intercity',
                          label: 'Compare Intercity ➔'
                        },
                        { 
                          id: 'food', 
                          title: '🍔 Food Delivery', 
                          desc: 'Compare live Swiggy and Zomato restaurant menu pricing', 
                          colorClass: 'border-orange-100 bg-orange-50/40 text-orange-850 hover:border-orange-200',
                          tab: 'food',
                          label: 'Order Food ➔'
                        },
                        { 
                          id: 'mart', 
                          title: '🛒 Fast Grocery', 
                          desc: 'Compare grocery bags on Blinkit, Zepto, and Instamart', 
                          colorClass: 'border-emerald-100 bg-emerald-50/40 text-emerald-850 hover:border-emerald-200',
                          tab: 'mart',
                          label: 'Shop Grocery ➔'
                        },
                        { 
                          id: 'stays', 
                          title: '🏨 Book Stays', 
                          desc: 'Compare live tariffs and reviews on Agoda and Booking.com', 
                          colorClass: 'border-purple-100 bg-purple-50/40 text-purple-850 hover:border-purple-200',
                          tab: 'stays',
                          label: 'Find Stays ➔'
                        },
                        { 
                          id: 'bills', 
                          title: '⚡ Utility Bills', 
                          desc: 'Pay electricity, water, gas, or broadband bills with coupon rewards', 
                          colorClass: 'border-rose-100 bg-rose-50/40 text-rose-850 hover:border-rose-200',
                          tab: 'bills',
                          label: 'Pay Bills ➔'
                        }
                      ];

                      // Filter tiles based on both feature permission toggles and globalSearchQuery
                      const visibleTiles = allTiles.filter(tile => {
                        // Check if feature is disabled globally by Super Admin
                        if (featureToggles && featureToggles[tile.id] === false) {
                          return false;
                        }

                        if (!globalSearchQuery.trim()) return true;
                        const query = globalSearchQuery.toLowerCase();
                        return (
                          tile.title.toLowerCase().includes(query) ||
                          tile.desc.toLowerCase().includes(query) ||
                          tile.id.toLowerCase().includes(query)
                        );
                      });

                      if (visibleTiles.length === 0) {
                        return (
                          <div id="no_services_match_message" className="bg-white border border-rose-100 rounded-3xl p-6 text-center space-y-3 shadow-xs mt-2">
                            <div className="mx-auto w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-500">
                              <SlidersHorizontal className="w-6 h-6 animate-pulse" />
                            </div>
                            <h3 className="text-xs font-black text-gray-950 uppercase tracking-tight">No services match your criteria</h3>
                            <p className="text-[11px] text-gray-500 max-w-sm mx-auto leading-relaxed">
                              We couldn't find any Chalo One modules matching your filter "{globalSearchQuery}". Please try resetting or clear the search field to view all services.
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setGlobalSearchQuery('');
                                setGlobalSearchFocused(false);
                              }}
                              className="px-4 py-2 bg-slate-900 hover:bg-slate-950 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer"
                            >
                              Clear Search Filter
                            </button>
                          </div>
                        );
                      }

                      return (
                        <motion.div 
                          id="categories_motion_grid"
                          variants={{
                            hidden: { opacity: 0 },
                            visible: {
                              opacity: 1,
                              transition: {
                                staggerChildren: 0.05
                              }
                            }
                          }}
                          initial="hidden"
                          animate="visible"
                          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 mt-2 font-display font-bold"
                        >
                          {visibleTiles.map(tile => (
                            <motion.div
                              key={tile.id}
                              id={`category_tile_${tile.id}`}
                              variants={{
                                hidden: { opacity: 0, scale: 0.9, y: 15 },
                                visible: { 
                                  opacity: 1, 
                                  scale: 1, 
                                  y: 0,
                                  transition: { type: 'spring', stiffness: 260, damping: 20 }
                                },
                                hover: { 
                                  scale: 1.02, 
                                  y: -2, 
                                  boxShadow: '0 8px 16px -2px rgba(0,0,0,0.04), 0 4px 6px -1px rgba(0,0,0,0.01)',
                                  transition: { type: 'spring', stiffness: 440, damping: 14 }
                                }
                              }}
                              whileHover="hover"
                              onClick={() => setActiveTab(tile.tab as any)}
                              className={`p-3.5 rounded-2xl border flex flex-col justify-between shadow-xs transition-all cursor-pointer min-h-[115px] w-full ${tile.colorClass}`}
                            >
                              <div>
                                <span className="text-xs font-black tracking-tight leading-none uppercase">{tile.title}</span>
                                <span className="text-[10px] text-gray-500 font-medium font-sans leading-normal mt-1.5 block">{tile.desc}</span>
                              </div>
                              <div className="pt-2 flex items-center justify-between">
                                <span className="text-[9.5px] font-black uppercase tracking-wide opacity-90">{tile.label}</span>
                              </div>
                            </motion.div>
                          ))}
                        </motion.div>
                      );
                    })()}
                  </div>

                  {/* Dynamic Personalized Quick-Actions (Chalo AI Habit Companion) */}
                  {getPersonalizedPrompts().length > 0 && (
                    <div id="personalized_habits_panel" className="bg-gradient-to-r from-emerald-50/50 to-teal-50/50 border border-emerald-150 p-4 rounded-2xl shadow-xs space-y-2.5 mt-1 pb-4">
                      <div className="flex items-center justify-between border-b border-emerald-100 pb-2 mb-1">
                        <div className="flex items-center space-x-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                          <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-widest font-mono">Chalo AI Habit Companion</span>
                        </div>
                        <span className="text-[8px] text-slate-400 font-bold bg-white border border-slate-150 px-2 py-0.5 rounded-full font-mono">Live Sync</span>
                      </div>
                      
                      <p className="text-[10.5px] text-slate-600 leading-relaxed font-semibold">
                        We noticed your regular patterns. Click any action below to execute it instantly:
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {getPersonalizedPrompts().map((prompt) => (
                          <button
                            key={prompt.id}
                            type="button"
                            onClick={prompt.action}
                            className="bg-white hover:bg-emerald-50/20 border border-slate-200 hover:border-emerald-300 p-2.5 rounded-xl text-left transition flex flex-col justify-between shadow-2xs cursor-pointer group"
                          >
                            <div className="space-y-1 w-full">
                              <div className="flex items-center space-x-1.5 w-full">
                                <span className="text-sm shrink-0">{prompt.icon}</span>
                                <span className="text-[11px] font-extrabold text-slate-800 group-hover:text-emerald-950 transition truncate">{prompt.title}</span>
                              </div>
                              <p className="text-[9.5px] text-slate-500 font-medium leading-tight line-clamp-2">{prompt.subtitle}</p>
                            </div>
                            <div className="pt-2 w-full flex justify-end">
                              <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 group-hover:bg-emerald-100 group-hover:text-emerald-700 px-2 py-0.5 rounded-lg transition">
                                {prompt.ctaText} →
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* REST OF THE FEATURES SHOWING SEGREGATED TOGETHER BELOW WITH USES */}
                  <div className="space-y-2.5">
                    <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest pl-1 font-mono">Assisted Intelligence & Wallet Utilities</span>
                    
                    {/* A. Chalo One AI Shortcuts block */}
                    <div 
                      onClick={() => setActiveTab('ai')}
                      className="bg-gradient-to-br from-indigo-900 to-indigo-950 text-white rounded-3xl p-4.5 border border-indigo-950 hover:border-indigo-400 space-y-3 shadow-md cursor-pointer hover:scale-[1.01] active:scale-99 transition-all duration-150"
                    >
                      <div className="flex items-center space-x-1.5">
                        <Bot className="w-4 h-4 text-amber-350 animate-pulse shrink-0" />
                        <span className="text-[9.5px] text-amber-350 font-mono font-extrabold uppercase tracking-widest">Chalo One AI Live Optimizer</span>
                      </div>

                      <p className="text-[11px] leading-relaxed text-indigo-100 font-medium pl-0.5">
                        "Behrouz Biryani has a flat **discount coupon** on Zomato, lowering final cart cost to **₹285** vs Swiggy checkout price of **₹320**. Recommend comparing Blinkit groceries for instant milk deals saving 10%."
                      </p>

                      <div className="flex items-center space-x-1 text-[10.5px] text-amber-350 font-black uppercase hover:underline pl-0.5">
                        <span>Consult AI engine</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    {/* B. Quick Wallet block */}
                    <div 
                      onClick={() => {
                        setWalletInitialTab('wallet');
                        setActiveTab('wallet');
                      }}
                      className="bg-white p-4.5 rounded-3xl border border-gray-150 hover:border-amber-400 shadow-xs flex justify-between items-center text-xs cursor-pointer hover:bg-amber-50/10 hover:scale-[1.01] active:scale-99 transition-all duration-150"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-2xl shadow-xs">
                          <Wallet className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-gray-900 leading-none uppercase text-[11px]">Chalo One Wallet Balance</h3>
                          <p className="text-[10px] text-gray-400 mt-1 font-semibold">Ready for seamless automatic payouts</p>
                        </div>
                      </div>

                      <div className="text-right font-mono text-xs shrink-0 pl-1">
                        <strong className="text-sm font-black text-gray-950 block">₹{wallet.balance.toFixed(2)}</strong>
                        <span className="text-[9.5px] text-amber-600 font-black uppercase hover:underline mt-0.5 block">
                          Details & Code
                        </span>
                      </div>
                    </div>

                    {/* C. Interactive Unified Cart summary */}
                    <div 
                      onClick={() => setActiveTab('checkout')}
                      className="bg-white p-4.5 rounded-3xl border border-gray-150 hover:border-amber-400 shadow-xs flex justify-between items-center text-xs cursor-pointer hover:bg-amber-50/10 hover:scale-[1.01] active:scale-99 transition-all duration-150"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-xs relative">
                          <ShoppingCart className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-gray-900 leading-none uppercase text-[11px]">Super Basket</h3>
                          <p className="text-[10px] text-gray-400 mt-1 font-semibold">{cartUnifiedCount} comparative items selected</p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <button
                          type="button"
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[9.5px] uppercase rounded-xl transition cursor-pointer"
                        >
                          Checkout Cart
                        </button>
                      </div>
                    </div>

                    {/* D. Live Interactive Platform Radar */}
                    <div className="bg-white p-4.5 rounded-3xl border border-gray-150 shadow-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Compass className="w-4 h-4 text-amber-500 animate-spin" />
                          <h3 className="font-extrabold text-gray-900 uppercase text-[11px] tracking-tight">Chalo Active Live Radar</h3>
                        </div>
                        <span className="text-[8px] bg-emerald-100 text-emerald-850 font-mono font-bold px-1.5 py-0.5 rounded-full uppercase">All Engines Green</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2.5">
                        <div 
                          onClick={() => setActiveTab('rides')}
                          className="p-2.5 bg-slate-50 hover:bg-blue-50/40 rounded-2xl border border-slate-100 hover:border-blue-200 text-[11px] cursor-pointer transition duration-150 hover:scale-[1.02]"
                        >
                          <div className="flex items-center justify-between text-[9px] font-mono font-bold uppercase text-slate-400">
                            <span>CAB NETWORKS</span>
                            <span className="text-emerald-600">● 100% ONLINE</span>
                          </div>
                          <p className="font-bold text-slate-800 mt-1">Uber vs Ola surge matches</p>
                          <span className="text-[9.5px] text-slate-500 block mt-0.5 leading-snug font-medium">Average savings per trip: ₹45 with Chalo optimizer</span>
                        </div>
                        <div 
                          onClick={() => setActiveTab('mart')}
                          className="p-2.5 bg-slate-50 hover:bg-emerald-50/40 rounded-2xl border border-slate-100 hover:border-emerald-200 text-[11px] cursor-pointer transition duration-150 hover:scale-[1.02]"
                        >
                          <div className="flex items-center justify-between text-[9px] font-mono font-bold uppercase text-slate-400">
                            <span>GROCERY SPEED</span>
                            <span className="text-emerald-600">● 10 MINS</span>
                          </div>
                          <p className="font-bold text-slate-800 mt-1">Blinkit, Zepto, Instamart</p>
                          <span className="text-[9.5px] text-slate-500 block mt-0.5 leading-snug font-medium">Highest density stock: Koramangala Warehouse</span>
                        </div>
                      </div>
                    </div>

                    {/* E. Chalo One Stats & Savings Analyzer */}
                    <div 
                      onClick={() => {
                        setWalletInitialTab('wallet');
                        setActiveTab('wallet');
                      }}
                      className="bg-gradient-to-r from-teal-900 to-emerald-950 text-white p-5 rounded-3xl space-y-4 shadow-sm relative overflow-hidden border border-emerald-900 cursor-pointer hover:border-emerald-400 transition-all duration-150"
                    >
                      <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none text-9xl font-black font-mono rotate-12 select-none">
                        ₹
                      </div>
                      <div className="space-y-1">
                        <span className="text-[8.5px] bg-white/20 text-emerald-300 font-mono font-extrabold uppercase px-2 py-0.5 rounded-full inline-block">
                          CHALO ONE METRICS
                        </span>
                        <h4 className="text-sm font-display font-black tracking-tight pt-1">
                          Consolidated Weekly Savings Ledger (Click for ledger wallet)
                        </h4>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center pt-1.5">
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveTab('rides');
                          }}
                          className="bg-white/10 hover:bg-white/25 p-2.5 rounded-2xl border border-white/10 hover:border-blue-400 cursor-pointer transition duration-150"
                        >
                          <span className="text-[9px] text-emerald-300 font-mono font-bold block">CAB DEALS</span>
                          <strong className="text-base font-black font-mono text-emerald-100 block mt-0.5">₹420</strong>
                          <span className="text-[8px] text-emerald-300 font-bold block mt-0.5">Sourced Tab ➔</span>
                        </div>
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveTab('food');
                          }}
                          className="bg-white/10 hover:bg-white/25 p-2.5 rounded-2xl border border-white/10 hover:border-orange-400 cursor-pointer transition duration-150"
                        >
                          <span className="text-[9px] text-emerald-300 font-mono font-bold block">FOOD SAVINGS</span>
                          <strong className="text-base font-black font-mono text-emerald-100 block mt-0.5">₹350</strong>
                          <span className="text-[8px] text-emerald-300 font-bold block mt-0.5">Sourced Tab ➔</span>
                        </div>
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveTab('mart');
                          }}
                          className="bg-white/10 hover:bg-white/25 p-2.5 rounded-2xl border border-white/10 hover:border-emerald-400 cursor-pointer transition duration-150"
                        >
                          <span className="text-[9px] text-emerald-300 font-mono font-bold block">GROCERY VALUE</span>
                          <strong className="text-base font-black font-mono text-emerald-100 block mt-0.5">₹290</strong>
                          <span className="text-[8px] text-emerald-300 font-bold block mt-0.5">Sourced Tab ➔</span>
                        </div>
                      </div>

                      {/* Money-Saved Trends Chart */}
                      <div 
                        className="mt-4 pt-4 border-t border-white/10" 
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] text-emerald-300 font-mono uppercase tracking-wider font-bold">Money-Saved Trends (Weekly)</span>
                          <span className="text-[10px] text-white/75 font-sans font-medium">Cumulative Savings: ₹1,060</span>
                        </div>
                        <div className="h-[140px] w-full mt-1">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={weeklySavingsData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                              <XAxis dataKey="week" stroke="rgba(255,255,255,0.4)" fontSize={9} tickLine={false} axisLine={false} />
                              <YAxis stroke="rgba(255,255,255,0.4)" fontSize={9} tickLine={false} axisLine={false} />
                              <Tooltip 
                                contentStyle={{ backgroundColor: '#022c22', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', fontSize: '10px', color: '#fff' }}
                                itemStyle={{ color: '#34d399' }}
                                labelStyle={{ fontWeight: 'bold', color: '#fff' }}
                              />
                              <Line type="monotone" dataKey="Total" stroke="#10b981" strokeWidth={2.5} activeDot={{ r: 5 }} dot={{ r: 3 }} name="Total Saved" />
                              <Line type="monotone" dataKey="Cab" stroke="#60a5fa" strokeWidth={1.5} dot={{ r: 1 }} name="Cabs" />
                              <Line type="monotone" dataKey="Food" stroke="#fb923c" strokeWidth={1.5} dot={{ r: 1 }} name="Food" />
                              <Line type="monotone" dataKey="Grocery" stroke="#a7f3d0" strokeWidth={1.5} dot={{ r: 1 }} name="Grocery" />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="flex items-center justify-between mt-2.5 px-1">
                          <div className="flex items-center gap-3 text-[8.5px] font-mono text-white/60">
                            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 block"></span>Total</span>
                            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-400 block"></span>Cabs</span>
                            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-orange-400 block"></span>Food</span>
                            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-300 block"></span>Grocery</span>
                          </div>
                          <span className="text-[8px] text-emerald-400 font-mono">Live Sync active</span>
                        </div>
                      </div>
                    </div>

                    {/* F. Smart Travel Planner Trigger Banner */}
                    <div 
                      onClick={() => {
                        setAiInitialQuery("I want to plan a custom trip using the Chalo Smart Travel Planner 🚀");
                        setActiveTab('ai');
                      }}
                      className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 hover:border-amber-400 rounded-3xl p-4.5 flex items-center justify-between gap-4 text-xs cursor-pointer hover:scale-[1.01] active:scale-99 transition-all duration-150"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center space-x-1.5 text-amber-700">
                          <Sparkles className="w-4 h-4 animate-pulse shrink-0" />
                          <span className="font-extrabold text-[10.5px] uppercase tracking-wide">Elite Vacation Planner</span>
                        </div>
                        <p className="font-semibold text-slate-800 leading-snug">
                          Planning a trip? Our interactive chatbot designs the perfect day-by-day comfort & family-wise itinerary.
                        </p>
                        <span className="text-[9.5px] text-slate-500 block font-mono font-bold">100% Kid, Elder, and Pet Friendly connectivity planning</span>
                      </div>
                      <button
                        type="button"
                        className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[9.5px] uppercase rounded-xl transition cursor-pointer shadow-xs shrink-0"
                      >
                        Plan Trip
                      </button>
                    </div>

                    {/* G. Partner Hotspots & Trending Route Quotes */}
                    <div className="bg-white p-4.5 rounded-3xl border border-gray-150 shadow-xs space-y-3.5">
                      <span className="text-[9.5px] text-gray-400 font-black uppercase font-mono tracking-widest block">Trending Platform Routines</span>
                      <div className="space-y-2.5 divide-y divide-slate-100 text-xs">
                        <div 
                          onClick={() => setActiveTab('intercity')}
                          className="pt-2 pb-2 flex items-center justify-between text-slate-700 cursor-pointer hover:bg-slate-50/80 hover:scale-[1.005] px-2 rounded-xl border border-transparent hover:border-slate-150 transition-all duration-150"
                        >
                          <div>
                            <p className="font-extrabold text-slate-800">Jaipur to Delhi NCR Cab route</p>
                            <span className="text-[10px] text-slate-500 mt-0.5 block font-sans font-medium">Compare stay navigator and outstation tariffs</span>
                          </div>
                          <span className="font-mono font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg">₹4,800 Sourced</span>
                        </div>
                        <div 
                          onClick={() => setActiveTab('mart')}
                          className="pt-2.5 pb-2 flex items-center justify-between text-slate-700 cursor-pointer hover:bg-slate-50/80 hover:scale-[1.005] px-2 rounded-xl border border-transparent hover:border-slate-150 transition-all duration-150"
                        >
                          <div>
                            <p className="font-extrabold text-slate-800">10-Min Organic Vegetables Bag</p>
                            <span className="text-[10px] text-slate-500 mt-0.5 block font-sans font-medium">Blinkit vs Instamart side-by-side match</span>
                          </div>
                          <span className="font-mono font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">₹120 Sourced</span>
                        </div>
                        <div 
                          onClick={() => setActiveTab('rides')}
                          className="pt-2.5 pb-2 flex items-center justify-between text-slate-700 cursor-pointer hover:bg-slate-50/80 hover:scale-[1.005] px-2 rounded-xl border border-transparent hover:border-slate-150 transition-all duration-150"
                        >
                          <div>
                            <p className="font-extrabold text-slate-800">Whitefield tech park airport express</p>
                            <span className="text-[10px] text-slate-500 mt-0.5 block font-sans font-medium">Cheapest luxury cabs matching Ola and Uber</span>
                          </div>
                          <span className="font-mono font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">₹850 Sourced</span>
                        </div>
                      </div>
                    </div>

                    {/* Real-Time Commute Alert Notification System */}
                    <CommuteAlertSystem 
                      savedAddresses={savedAddresses}
                      onSaveWorkAddress={handleSaveWorkAddress}
                      setActiveTab={setActiveTab}
                      setInitialDestination={setInitialDestination}
                    />

                  </div>

                </div>
              )}

              {/* 2. Cabs comparison tab representation */}
              {activeTab === 'rides' && (
                <RidesModule 
                  preferenceMode={preferences.preferenceMode}
                  defaultRidesOrder={preferences.rides}
                  addOrderToActivity={addOrderToActivity}
                  walletBalance={wallet.balance}
                  deductWalletCoins={deductWalletCoins}
                  setActiveTab={setActiveTab}
                  connectedAccounts={connectedAccounts}
                  currentSelectedLocation={currentSelectedLocation}
                  redirectToLinkedAccounts={redirectToLinkedAccounts}
                  onBackRegister={registerModuleBackHandler}
                  initialDestination={initialDestination}
                />
              )}

              {/* 3. Intercity travels representation */}
              {activeTab === 'intercity' && (
                <IntercityModule 
                  addOrderToActivity={addOrderToActivity} 
                  setActiveTab={setActiveTab}
                  connectedAccounts={connectedAccounts}
                  currentSelectedLocation={currentSelectedLocation}
                  preferenceMode={preferences.preferenceMode}
                  redirectToLinkedAccounts={redirectToLinkedAccounts}
                  onBackRegister={registerModuleBackHandler}
                />
              )}

              {/* 4. Food comparisons representation */}
              {activeTab === 'food' && (
                <FoodModule 
                  cart={cart}
                  addToCart={addToFoodCart}
                  removeFromCart={removeFromFoodCart}
                  preferenceMode={preferences.preferenceMode}
                  defaultFoodOrder={preferences.food}
                  defaultFoodType={preferences.defaultFoodType}
                  setActiveTab={setActiveTab}
                  connectedAccounts={connectedAccounts}
                  currentSelectedLocation={currentSelectedLocation}
                  redirectToLinkedAccounts={redirectToLinkedAccounts}
                  onBackRegister={registerModuleBackHandler}
                />
              )}

              {/* 5. Instamart groceries list representation */}
              {activeTab === 'mart' && (
                <MartModule 
                  cart={cart}
                  addMartToCart={addMartToCart}
                  removeMartFromCart={removeMartFromCart}
                  preferenceMode={preferences.preferenceMode}
                  defaultFoodType={preferences.defaultFoodType}
                  setActiveTab={setActiveTab}
                  connectedAccounts={connectedAccounts}
                  currentSelectedLocation={currentSelectedLocation}
                  redirectToLinkedAccounts={redirectToLinkedAccounts}
                />
              )}

              {/* 6. Hotels booking representation */}
              {activeTab === 'stays' && (
                <StaysModule 
                  addOrderToActivity={addOrderToActivity} 
                  userProfile={userProfile} 
                  setActiveTab={setActiveTab}
                  connectedAccounts={connectedAccounts}
                  currentSelectedLocation={currentSelectedLocation}
                  preferenceMode={preferences.preferenceMode}
                  redirectToLinkedAccounts={redirectToLinkedAccounts}
                  setAiInitialQuery={setAiInitialQuery}
                  onBackRegister={registerModuleBackHandler}
                />
              )}

              {/* 7. Unified checkout cart representation */}
              {activeTab === 'checkout' && (
                <UnifiedCart 
                  cart={cart}
                  updateFoodQuantity={removeFromFoodCart as any}
                  updateMartQuantity={removeMartFromCart as any}
                  clearCart={clearCart}
                  walletBalance={wallet.balance}
                  deductWalletCoins={deductWalletCoins}
                  addOrderToActivity={addOrderToActivity}
                />
              )}

              {/* 8. Super AI Assistant representation */}
              {activeTab === 'ai' && (
                <AIAssistant 
                  preferenceMode={preferences.preferenceMode}
                  foodPrefs={preferences.food}
                  martPrefs={preferences.mart}
                  ridePrefs={preferences.rides}
                  initialQuery={aiInitialQuery}
                  onClearInitialQuery={() => setAiInitialQuery('')}
                  setActiveTab={setActiveTab}
                  isDedicatedPage={true}
                  featureToggles={featureToggles}
                  personalizedPrompts={getPersonalizedPrompts()}
                  onMinimize={() => {
                    setActiveTab('home');
                    setShowFloatingChat(true);
                  }}
                />
              )}

              {/* 9. Wallet Ledger & Referral rankings */}
              {activeTab === 'wallet' && (
                <ReferralAndWallet 
                  wallet={wallet}
                  addCoins={addWalletPoints}
                  redeemPointsToCash={redeemPointsToCash}
                  initialTab={walletInitialTab}
                  userProfile={userProfile}
                  applyReferralCodePostSignup={applyReferralCodePostSignup}
                />
              )}

              {/* 10. Live ongoing orders timeline tracking: INTEGRATED ACTIVITY VIEW */}
              {activeTab === 'activity' && (
                <ActivityCenter 
                  activityList={convertedActivityList}
                  cancelActivity={cancelActivity}
                  onActivityClick={(category) => setActiveTab(category)}
                  addSupportTicket={addSupportTicket}
                />
              )}

              {/* 10.5 Utility Bills & recharges representation */}
              {activeTab === 'bills' && (
                <BillsModule 
                  wallet={wallet}
                  deductWalletCoins={handleDeductBillCoins}
                  addOrderToActivity={addOrderToActivity}
                  savedBills={savedBills}
                  setSavedBills={setSavedBills}
                />
              )}

              {/* 11. Profile configuration setup rules settings: REWRITTEN TO ACCOUNT PAGE */}
              {activeTab === 'preferences' && (
                <AccountPage 
                  initialSection={accountInitialSection}
                  userProfile={userProfile}
                  setUserProfile={(profile) => {
                    setUserProfile(profile);
                    persistFirebaseUpdate(wallet, preferences, undefined, undefined, profile);
                  }}
                  preferences={preferences}
                  setPreferences={(prefs) => {
                    setPreferences(prefs);
                    persistFirebaseUpdate(wallet, prefs);
                  }}
                  connectedAccounts={connectedAccounts}
                  setConnectedAccounts={(accs) => {
                    setConnectedAccounts(accs);
                    persistFirebaseUpdate(wallet, preferences, undefined, accs);
                  }}
                  currentSelectedLocation={currentSelectedLocation}
                  setShowLocationSelectorModal={setShowLocationSelectorModal}
                  savedAddresses={savedAddresses}
                  setSavedAddresses={(addrs) => {
                    setSavedAddresses(addrs);
                    const emailKey = userProfile?.email ? userProfile.email.toLowerCase().trim() : 'guest';
                    localStorage.setItem(`chalo_saved_addresses_${emailKey}`, JSON.stringify(addrs));
                    persistFirebaseUpdate(wallet, preferences);
                  }}
                  supportTickets={supportTickets}
                  addSupportTicket={addSupportTicket}
                  replyToTicket={replyToTicket}
                  lockAppInstantly={() => setIsUnlocked(false)}
                  securityAuditLogs={securityAuditLogs}
                  clearSecurityLogs={() => {
                    setSecurityAuditLogs([]);
                    persistFirebaseUpdate(wallet, preferences, []);
                  }}
                  wallet={wallet}
                  addCoins={addCoinsToBalance}
                  redeemPointsToCash={redeemPointsToCash}
                  onLogout={async () => {
                    try {
                      await AuthService.logout();
                    } catch (e) {
                      console.warn("Error signing out:", e);
                    }
                    setIsLoggedIn(false);
                  }}
                  activities={activities}
                  featureToggles={featureToggles}
                  saveFeatureToggles={saveFeatureToggles}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Global Floating Actions Panel (Chalo AI Chat & Scroll to Top) */}
        <div className="fixed bottom-24 right-6 z-50 flex flex-col items-end space-y-3.5 pointer-events-none">
          
          {/* Scroll to Top Arrow Button */}
          {showScrollTop && (
            <motion.button
              type="button"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              initial={{ opacity: 0, scale: 0.8, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 15 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="pointer-events-auto flex items-center justify-center w-11 h-11 bg-slate-900 border border-slate-750 text-white hover:text-amber-400 rounded-full shadow-2xl cursor-pointer transition-all duration-250"
              title="Scroll back to top"
            >
              <svg className="w-5 h-5 stroke-current fill-none stroke-[2.5]" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
              </svg>
            </motion.button>
          )}

          {/* Floating Chalo AI Chat Bot */}
          <div className="pointer-events-auto relative flex flex-col items-end">
              <motion.button
                id="btn_floating_ai_chat"
                type="button"
                onClick={() => setShowFloatingChat(!showFloatingChat)}
                initial={{ opacity: 0, scale: 0.8, x: 50 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center justify-center w-12 h-12 rounded-full shadow-2xl cursor-pointer border relative transition-all duration-300 ${
                  showFloatingChat 
                    ? 'bg-slate-900 border-slate-750 text-amber-400' 
                    : 'bg-amber-400 border-amber-350 text-slate-950 animate-bounce'
                }`}
                style={{ animationDuration: '3s' }}
              >
                <motion.div
                  animate={showFloatingChat ? { rotate: 90 } : { scale: [1, 1.05, 1] }}
                  transition={{ repeat: showFloatingChat ? 0 : Infinity, duration: 1.5 }}
                >
                  {showFloatingChat ? <span className="text-sm font-bold font-mono">✕</span> : <Bot className="w-6 h-6" />}
                </motion.div>
                {!showFloatingChat && (
                  <span className="absolute -top-1 -left-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                  </span>
                )}
              </motion.button>

              {/* Floating Mini Chat Window */}
              <AnimatePresence>
                {showFloatingChat && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 60, rotate: -2 }}
                    animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 60, rotate: -2 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                    className="absolute bottom-14 right-0 w-[340px] sm:w-[400px] h-[500px] max-h-[70vh] bg-white rounded-3xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden z-50 text-slate-900"
                  >
                    {/* Chat Header */}
                    <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800 shrink-0">
                      <div className="flex items-center space-x-2">
                        <Bot className="w-4 h-4 text-amber-400 animate-pulse" />
                        <span className="text-xs font-black uppercase tracking-wider font-display text-amber-450">Chalo One AI Chat</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {/* Maximize to Dedicated Page Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('ai');
                            setShowFloatingChat(false);
                          }}
                          className="flex items-center space-x-1 text-slate-300 hover:text-amber-400 transition text-[10px] font-bold uppercase tracking-wider bg-slate-800 px-2 py-1 rounded-lg border border-slate-750 cursor-pointer"
                          title="Open in Full Dedicated View"
                        >
                          <Maximize2 className="w-3 h-3" />
                          <span className="hidden sm:inline">Maximize</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowFloatingChat(false)}
                          className="text-slate-400 hover:text-white transition text-xs font-bold font-mono p-1 cursor-pointer"
                        >
                          Close ✕
                        </button>
                      </div>
                    </div>

                    {/* Main Chat Assistant Frame inside Floater */}
                    <div className="flex-1 overflow-y-auto bg-slate-50 relative p-1.5">
                      <AIAssistant 
                        preferenceMode={preferences.preferenceMode}
                        foodPrefs={preferences.food}
                        martPrefs={preferences.mart}
                        ridePrefs={preferences.rides}
                        initialQuery={aiInitialQuery}
                        onClearInitialQuery={() => setAiInitialQuery('')}
                        setActiveTab={setActiveTab}
                        onCloseFloatingChat={() => setShowFloatingChat(false)}
                        featureToggles={featureToggles}
                        personalizedPrompts={getPersonalizedPrompts()}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

        </div>

        {/* BOTTOM NAVIGATION FOOTER: PERFECTLY RESTRICTED TO HOME, ACTIVITY, AND ACCOUNT PAGE */}
        <footer className="sticky bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-800 flex justify-between items-center px-4 py-2 text-gray-400 text-[10px] font-display font-black shadow-lg">
          {[
            { id: 'activity', label: 'Activity', icon: ClipboardCheck },
            { id: 'home', label: 'Home', icon: HomeIcon },
            { id: 'preferences', label: 'Account', icon: User }
          ].map(btn => {
            const Icon = btn.icon;
            const isCurrent = selectedBottomNode === btn.id;
            return (
              <button
                key={btn.id}
                type="button"
                onClick={() => {
                  if (btn.id === 'home') {
                    // Reset back to parent landing home view
                    setActiveTab('home');
                  } else {
                    if (btn.id === 'preferences') {
                      setAccountInitialSection('main');
                    }
                    setActiveTab(btn.id);
                  }
                }}
                className={`flex-1 flex flex-col items-center py-1.5 transition uppercase tracking-wider cursor-pointer ${
                  isCurrent ? 'text-amber-500 font-extrabold scale-102' : 'text-slate-400 hover:text-white font-medium'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="mt-1 text-[9.5px] leading-none">{btn.label}</span>
              </button>
            );
          })}
        </footer>

      </motion.div>
    </div>
  );
}
