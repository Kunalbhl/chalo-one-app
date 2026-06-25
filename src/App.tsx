import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
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
  Bot
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [accountInitialSection, setAccountInitialSection] = useState<string>('main');
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
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('chalo_is_logged_in') === 'true';
  });

  // 1. User Profile context with local storage preservation
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('chalo_user_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn('Stale profile in local storage, fallback to default');
      }
    }
    return {
      id: 'user_kunal',
      name: 'Kunal Pareek',
      phone: '+91 99882 10492',
      email: 'kunalpareekusa@gmail.com',
      dob: '1998-05-15',
      gender: 'Male',
      savedAddresses: [],
      referralCode: 'CHALO911KP'
    };
  });

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
    let emailKey = 'kunalpareekusa@gmail.com';
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
    let emailKey = 'kunalpareekusa@gmail.com';
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

  // 4. Integrations switches
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccounts>({
    ola: false,
    uber: true,
    rapido: true,
    swiggy: true,
    zomato: false,
    blinkit: true,
    zepto: true,
    booking: true,
    agoda: false,
    makemytrip: false
  });

  // 5. Saved frequently pickup drop hotspots
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([
    {
      id: 'ADDR-1',
      label: 'Home',
      addressLine: 'Block 4B, Koramangala, Bangalore',
      landmark: 'Near Sony World Signal'
    },
    {
      id: 'ADDR-2',
      label: 'Work',
      addressLine: 'RMZ Ecospace, Outer Ring Road, Bangalore',
      landmark: 'Prerana Motors Lane'
    }
  ]);

  // 6. Unified shopping basket cart state
  const [cart, setCart] = useState<UnifiedCartType>({
    foodItems: [],
    martItems: []
  });

  // 7. Support tickets
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);

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
      keywords: ['ai', 'assistant', 'ask', 'advisor', 'bot', 'chat', 'gemini', 'help', 'coupon', 'deals']
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
      setActiveTab('ai');
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

  // Syncing user details locally and with Cloud Firestore is helpful
  useEffect(() => {
    async function loadFirebaseData() {
      if (!db) return;
      try {
        const userDocRef = doc(db, 'users', 'kunalpareek');
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          const cloudData = userSnap.data();
          if (cloudData.wallet) setWallet(cloudData.wallet);
          if (cloudData.preferences) setPreferences(cloudData.preferences);
          if (cloudData.addresses) setSavedAddresses(cloudData.addresses);
          if (cloudData.securityAuditLogs) setSecurityAuditLogs(cloudData.securityAuditLogs);
        }
      } catch (e) {
        console.warn('Firebase connection offline, utilising local state:', e);
      }
    }
    loadFirebaseData();
  }, []);

  const persistFirebaseUpdate = async (updatedWallet: ChaloWallet, updatedPrefs: AppPreferences, updatedLogs?: BiometricLog[]) => {
    const emailKey = userProfile?.email ? userProfile.email.toLowerCase().trim() : 'kunalpareekusa@gmail.com';
    
    // Save to account-specific keys
    localStorage.setItem(`chalo_wallet_${emailKey}`, JSON.stringify(updatedWallet));
    localStorage.setItem(`chalo_preferences_${emailKey}`, JSON.stringify(updatedPrefs));
    if (updatedLogs !== undefined) {
      localStorage.setItem(`chalo_security_audit_logs_${emailKey}`, JSON.stringify(updatedLogs));
    }
    
    // Update active user profile
    localStorage.setItem('chalo_user_profile', JSON.stringify(userProfile));

    if (!db) return;
    try {
      const userDocRef = doc(db, 'users', emailKey);
      await setDoc(userDocRef, {
        profile: userProfile,
        wallet: updatedWallet,
        preferences: updatedPrefs,
        addresses: savedAddresses,
        securityAuditLogs: updatedLogs !== undefined ? updatedLogs : securityAuditLogs
      }, { merge: true });
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
        const addressResolved = `Precise GPS Sourced: Room 402, Block 4, Palm Grove Apartments, Koramangala 4th Block, Bengaluru, Karnataka 560034`;
        setGpsResolvedAddress(addressResolved);
        setGpsFetching(false);
      },
      (error) => {
        console.warn("GPS failed", error);
        const coordsStr = `Lat: 12.93524, Lng: 77.62451`;
        setGpsCoordinates(coordsStr);
        const addressResolved = `Precise GPS Sourced: Chalo One Tech Office, RMZ Ecospace Outer Ring Road, Bengaluru, Karnataka 560103`;
        setGpsResolvedAddress(addressResolved);
        setGpsFetching(false);
      },
      { enableHighAccuracy: true, timeout: 5000 }
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

  const applyReferralCodePostSignup = (code: string): { success: boolean; message: string } => {
    if (!userProfile) {
      return { success: false, message: 'Please log in first.' };
    }
    
    const trimmedCode = code.trim();
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
    
    // Search in all users
    const allUsersData = localStorage.getItem('chalo_all_users');
    let allUsers = [];
    if (allUsersData) {
      try { allUsers = JSON.parse(allUsersData); } catch(e) {}
    }
    
    const referrerUser = allUsers.find((u: any) => u.referralCode && u.referralCode.toLowerCase() === trimmedCode.toLowerCase());
    if (!referrerUser) {
      return { success: false, message: 'Invalid referral code. Please check and try again.' };
    }
    
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
            amount: 0,
            pointsSpentOrEarned: 2000,
            description: `Referral Welcome Bonus via ${referrerUser.name}`,
            createdAt: new Date().toLocaleDateString()
          },
          ...prev.history
        ]
      };
      // Backup to localStorage
      const emailKey = userProfile.email.toLowerCase().trim();
      localStorage.setItem(`chalo_wallet_${emailKey}`, JSON.stringify(updatedWallet));
      return updatedWallet;
    });
    
    // 2. Reward the referrer
    const referrerEmailKey = referrerUser.email.toLowerCase().trim();
    const referrerWalletKey = `chalo_wallet_${referrerEmailKey}`;
    const referrerWalletData = localStorage.getItem(referrerWalletKey);
    if (referrerWalletData) {
      try {
        const rWallet = JSON.parse(referrerWalletData);
        rWallet.points += 2000;
        rWallet.history.unshift({
          id: 'TXN-' + Math.floor(100000 + Math.random() * 900005),
          type: 'credit',
          amount: 0,
          pointsSpentOrEarned: 2000,
          description: `Referral post-signup bonus: Invited ${userProfile.name}`,
          createdAt: new Date().toLocaleDateString()
        });
        localStorage.setItem(referrerWalletKey, JSON.stringify(rWallet));
      } catch(e) {}
    }
    
    // 3. Update current user profile
    const updatedProfile = {
      ...userProfile,
      referredBy: referrerUser.referralCode
    };
    setUserProfile(updatedProfile);
    localStorage.setItem('chalo_user_profile', JSON.stringify(updatedProfile));
    
    // Also update current user in all users database
    const currentIdx = allUsers.findIndex((u: any) => u.email.toLowerCase() === userProfile.email.toLowerCase());
    if (currentIdx !== -1) {
      allUsers[currentIdx] = { ...allUsers[currentIdx], referredBy: referrerUser.referralCode };
      localStorage.setItem('chalo_all_users', JSON.stringify(allUsers));
    }
    
    // Persist changes to Firebase
    setTimeout(() => {
      persistFirebaseUpdate(updatedWallet || wallet, preferences);
    }, 100);
    
    return { success: true, message: `Success! Both you and ${referrerUser.name} have been allocated 2,000 points!` };
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
    routeString: act.id === 'CHALO-RIDE-911' ? 'Driver is near Block 4B crossing, taking turn' : undefined
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
        <div className="w-full max-w-xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto bg-white min-h-screen flex flex-col shadow-2xl relative md:border-x border-slate-150 transition-all duration-300">
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
      
      <div className="w-full max-w-7xl mx-auto bg-white min-h-screen flex flex-col shadow-2xl relative md:border-x border-slate-150 transition-all duration-300">
        
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
        <header className="sticky top-0 z-30 bg-slate-900 text-white px-4 py-3 flex flex-col space-y-2.5 shadow-md">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-2.5 cursor-pointer select-none" onClick={() => setActiveTab('home')}>
              <div className="p-1 px-1.5 bg-gradient-to-br from-amber-400 to-amber-500 rounded-lg text-amber-950 shadow-sm">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h1 className="font-display font-black text-sm tracking-tight uppercase leading-none">Chalo One</h1>
                <span className="text-[8px] text-amber-400 font-bold uppercase mt-1 block font-mono">AI Powered One Platform, Compare, Plan, Book & Order</span>
              </div>
            </div>

            <div className="flex items-center space-x-3.5">
            {/* Refer & Earn Premium Header Action */}
            <motion.button
              type="button"
              onClick={() => {
                setWalletInitialTab('referral');
                setActiveTab('wallet');
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-1 px-2.5 py-1 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-slate-950 font-display font-black text-[9px] uppercase rounded-full shadow-sm cursor-pointer border border-amber-300/30 transition-all"
            >
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                transition={{ repeat: Infinity, duration: 2.5, repeatDelay: 1 }}
                className="relative"
              >
                <Ticket className="w-3.5 h-3.5 text-slate-950" />
              </motion.div>
              <span className="hidden sm:inline">Refer & Earn</span>
              <span className="sm:hidden">Refer</span>
            </motion.button>

            {/* Cart trigger with counts badge */}
            <button
              type="button"
              onClick={() => setActiveTab('checkout')}
              className="relative p-1.5 hover:bg-slate-800 rounded-xl transition cursor-pointer text-slate-300"
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
              className="w-8 h-8 rounded-full bg-amber-400 hover:scale-105 active:scale-95 text-slate-950 flex items-center justify-center font-display font-black text-xs uppercase shadow-xs select-none cursor-pointer transition border border-amber-350"
              title="Account settings"
            >
              {userProfile.name.slice(0,2).toUpperCase()}
            </button>
          </div>
        </div>

        {/* GLOBAL CURRENT LOCATION SELECTOR IN HEADER */}
        {['home', 'food', 'mart', 'intercity'].includes(activeTab) && (
          <div className="w-full flex items-center justify-between bg-slate-950/45 hover:bg-slate-950/60 p-2 rounded-xl border border-slate-800 text-xs transition-colors shadow-inner">
            <button
              type="button"
              onClick={() => setShowLocationSelectorModal(true)}
              className="flex items-center space-x-2 text-slate-300 hover:text-amber-400 font-bold truncate transition cursor-pointer text-left flex-1 min-w-0"
            >
              <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="truncate">
                <span className="text-[8px] text-amber-500 uppercase font-mono font-black block tracking-wider leading-none mb-0.5">Active Delivery Location</span>
                <span className="truncate text-slate-100 font-sans text-xs font-bold leading-none block">{currentSelectedLocation}</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setShowLocationSelectorModal(true)}
              className="text-[9px] font-black uppercase text-amber-400 hover:text-amber-500 bg-slate-900 px-2 py-1 rounded-md border border-slate-800 font-mono tracking-wider shrink-0 cursor-pointer transition ml-2"
            >
              Change ▾
            </button>
          </div>
        )}
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
                        <label className="text-[9px] font-bold text-slate-400 uppercase font-mono block">Full Address Line</label>
                        <textarea
                          required
                          rows={2}
                          value={newAddrLine}
                          onChange={(e) => setNewAddrLine(e.target.value)}
                          placeholder="House/Office number, Street, Locality, City"
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-1 focus:ring-amber-400 text-xs font-bold placeholder-slate-400 focus:outline-none"
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

        {/* Dynamic Inner Subheader with back action button when inside nested comparative view pages */}
        {!['home', 'activity', 'preferences'].includes(activeTab) && (
          <div className="bg-amber-50 border-b border-amber-100 px-4 py-2 flex items-center justify-between sticky top-[57px] z-20">
            <button
              onClick={() => setActiveTab('home')}
              className="text-[10px] font-black font-display text-amber-800 hover:text-amber-950 transition flex items-center space-x-1.5 uppercase select-none cursor-pointer"
            >
              <span>← Back to Super Dashboard</span>
            </button>
            <span className="text-[8px] bg-amber-500 font-extrabold px-1.5 py-0.5 rounded text-white font-mono uppercase tracking-wider">
              {activeTab === 'checkout' ? 'checkout basket' : activeTab === 'wallet' ? 'wallet assets' : activeTab === 'ai' ? 'super advisor' : activeTab + ' comparison'}
            </span>
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
                    {globalSearchFocused && (
                      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-3 space-y-3">
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
                      </div>
                    )}

                    {/* Suggestions list based on text typed */}
                    {globalSearchQuery.trim().length > 0 && (
                      <div id="global_search_suggestions" className="bg-slate-50 rounded-2xl border border-slate-150 p-2 space-y-1">
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
                      </div>
                    )}

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
                      className="grid grid-cols-2 gap-2.5 mt-2 font-display font-bold"
                    >
                      {[
                        { id: 'rides', title: '🚗 Rides', desc: 'Uber, Ola, Rapido comparative pricing', colorClass: 'border-blue-100 bg-blue-50/40 text-blue-800 hover:border-blue-300' },
                        { id: 'intercity', title: '✈️ Intercity Routes', desc: 'Outstation cab routes prices locator', colorClass: 'border-indigo-100 bg-indigo-50/40 text-indigo-800 hover:border-indigo-300' },
                        { id: 'food', title: '🍔 Food Delivery', desc: 'Settle Zomato & Swiggy menus saver pools', colorClass: 'border-orange-100 bg-orange-50/40 text-orange-850 hover:border-orange-300' },
                        { id: 'mart', title: '🛒 Fast Grocery', desc: 'Blinkit vs Zepto absolute price comparisons', colorClass: 'border-emerald-100 bg-emerald-50/40 text-emerald-850 hover:border-emerald-300' },
                        { id: 'stays', title: '🏨 Book Stays', desc: 'Agoda & Booking.com live comparative tariffs', colorClass: 'border-purple-100 bg-purple-50/40 text-purple-850 hover:border-purple-300' },
                        { id: 'bills', title: '⚡ Utility Bills', desc: 'Settle Broadband, Water & Electricity invoices', colorClass: 'border-yellow-100 bg-yellow-50/40 text-amber-800 hover:border-yellow-300' }
                      ].map(tile => (
                        <motion.button
                          key={tile.id}
                          id={`category_tile_${tile.id}`}
                          type="button"
                          onClick={() => {
                            const anyTile = tile as any;
                            if (anyTile.isAIPrompt) {
                              setGlobalSearchQuery(anyTile.prompt || '');
                              setActiveTab('ai');
                            } else {
                              setActiveTab(tile.id);
                            }
                          }}
                          variants={{
                            hidden: { opacity: 0, scale: 0.9, y: 15 },
                            visible: { 
                              opacity: 1, 
                              scale: 1, 
                              y: 0,
                              transition: { type: 'spring', stiffness: 260, damping: 20 }
                            },
                            hover: { 
                              scale: 1.04, 
                              y: -3, 
                              boxShadow: '0 8px 16px -2px rgba(0,0,0,0.06), 0 4px 6px -1px rgba(0,0,0,0.02)',
                              transition: { type: 'spring', stiffness: 440, damping: 14 }
                            },
                            tap: { scale: 0.97 }
                          }}
                          whileHover="hover"
                          whileTap="tap"
                          className={`p-4 rounded-3xl border text-left flex flex-col justify-between cursor-pointer shadow-xs ${tile.colorClass}`}
                        >
                          <span className="text-xs font-black tracking-tight leading-none uppercase">{tile.title}</span>
                          <span className="text-[10px] text-gray-400 font-semibold font-sans leading-tight mt-2.5 block">{tile.desc}</span>
                        </motion.button>
                      ))}
                    </motion.div>
                  </div>

                  {/* REST OF THE FEATURES SHOWING SEGREGATED TOGETHER BELOW WITH USES */}
                  <div className="space-y-2.5">
                    <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest pl-1 font-mono">Assisted Intelligence & Wallet Utilities</span>
                    
                    {/* A. Gemini AI Shortcuts block */}
                    <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 text-white rounded-3xl p-4.5 border border-indigo-950 space-y-3 shadow-md">
                      <div className="flex items-center space-x-1.5">
                        <Bot className="w-4 h-4 text-amber-350 animate-pulse shrink-0" />
                        <span className="text-[9.5px] text-amber-350 font-mono font-extrabold uppercase tracking-widest">Gemini Live Optimizer</span>
                      </div>

                      <p className="text-[11px] leading-relaxed text-indigo-100 font-medium pl-0.5">
                        "Behrouz Biryani has a flat **discount coupon** on Zomato, lowering final cart cost to **₹285** vs Swiggy checkout price of **₹320**. Recommend comparing Blinkit groceries for instant milk deals saving 10%."
                      </p>

                      <button
                        type="button"
                        onClick={() => setActiveTab('ai')}
                        className="flex items-center space-x-1 text-[10.5px] text-amber-350 font-black uppercase hover:underline cursor-pointer pl-0.5"
                      >
                        <span>Consult AI engine</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* B. Quick Wallet block */}
                    <div className="bg-white p-4.5 rounded-3xl border border-gray-150 shadow-xs flex justify-between items-center text-xs">
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
                        <button
                          type="button"
                          onClick={() => {
                            setWalletInitialTab('wallet');
                            setActiveTab('wallet');
                          }}
                          className="text-[9.5px] text-amber-600 font-black uppercase hover:underline mt-0.5 block"
                        >
                          Details & Code
                        </button>
                      </div>
                    </div>

                    {/* C. Interactive Unified Cart summary */}
                    <div className="bg-white p-4.5 rounded-3xl border border-gray-150 shadow-xs flex justify-between items-center text-xs">
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
                          onClick={() => setActiveTab('checkout')}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[9.5px] uppercase rounded-xl transition cursor-pointer"
                        >
                          Checkout Cart
                        </button>
                      </div>
                    </div>

                    {/* D. Mini Active Driver Notification banner if ongoing works exist */}
                    {activities.some(act => act.status === 'active') && (
                      <div className="bg-slate-900 text-white rounded-3xl p-4 shadow-md space-y-2.5 flex items-center justify-between">
                        <div>
                          <span className="text-[8.5px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.2 rounded uppercase font-mono">Active Ongoing Journey</span>
                          <h4 className="text-xs font-bold font-display mt-1 text-slate-100">Sedan Cab traveling to destination hotspot</h4>
                          <p className="text-[9.5px] text-slate-400 mt-0.5">Captain OTP: <strong className="text-amber-400 font-mono">2987</strong></p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setActiveTab('activity')}
                          className="p-2.5 bg-slate-800 text-white rounded-2xl hover:bg-slate-700 transition"
                        >
                          <ChevronRight className="w-4 h-4 text-amber-400" />
                        </button>
                      </div>
                    )}

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
                />
              )}

              {/* 3. Intercity travels representation */}
              {activeTab === 'intercity' && (
                <IntercityModule addOrderToActivity={addOrderToActivity} />
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
                />
              )}

              {/* 6. Hotels booking representation */}
              {activeTab === 'stays' && (
                <StaysModule addOrderToActivity={addOrderToActivity} />
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
                    localStorage.setItem('chalo_user_profile', JSON.stringify(profile));
                    const emailKey = profile.email.toLowerCase().trim();
                    localStorage.setItem(`chalo_user_profile_${emailKey}`, JSON.stringify(profile));
                    
                    // Update in registered fallback database
                    const savedUsers = JSON.parse(localStorage.getItem('chalo_all_users') || '[]');
                    const idx = savedUsers.findIndex((u: any) => u.email.toLowerCase() === emailKey);
                    if (idx !== -1) {
                      savedUsers[idx] = { ...savedUsers[idx], ...profile };
                      localStorage.setItem('chalo_all_users', JSON.stringify(savedUsers));
                    }
                    persistFirebaseUpdate(wallet, preferences);
                  }}
                  preferences={preferences}
                  setPreferences={(prefs) => {
                    setPreferences(prefs);
                    persistFirebaseUpdate(wallet, prefs);
                  }}
                  connectedAccounts={connectedAccounts}
                  setConnectedAccounts={setConnectedAccounts}
                  savedAddresses={savedAddresses}
                  setSavedAddresses={(addrs) => {
                    setSavedAddresses(addrs);
                    const emailKey = userProfile?.email ? userProfile.email.toLowerCase().trim() : 'kunalpareekusa@gmail.com';
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
                  onLogout={() => {
                    localStorage.removeItem('chalo_is_logged_in');
                    localStorage.removeItem('chalo_user_profile');
                    setIsLoggedIn(false);
                  }}
                  activities={activities}
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
                      <button
                        type="button"
                        onClick={() => setShowFloatingChat(false)}
                        className="text-slate-400 hover:text-white transition text-xs font-bold font-mono p-1"
                      >
                        Close ✕
                      </button>
                    </div>

                    {/* Main Chat Assistant Frame inside Floater */}
                    <div className="flex-1 overflow-y-auto bg-slate-50 relative p-1.5">
                      <AIAssistant 
                        preferenceMode={preferences.preferenceMode}
                        foodPrefs={preferences.food}
                        martPrefs={preferences.mart}
                        ridePrefs={preferences.rides}
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

      </div>
    </div>
  );
}
