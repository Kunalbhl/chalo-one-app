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
  BiometricLog
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
  const [showNotificationCenter, setShowNotificationCenter] = useState<boolean>(true);
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState<boolean>(false);

  // 1. User Profile context
  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: 'user_kunal',
    name: 'Kunal Pareek',
    phone: '+91 99882 10492',
    email: 'kunalpareekusa@gmail.com',
    dob: '1998-05-15',
    gender: 'Male',
    savedAddresses: [],
    referralCode: 'CHALO911KP'
  });

  // 2. Chalo wallet balances
  const [wallet, setWallet] = useState<ChaloWallet>({
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
  });

  // 3. User Search settings
  const [preferences, setPreferences] = useState<AppPreferences>({
    food: ['Zomato', 'Swiggy'],
    mart: ['Blinkit', 'Zepto', 'Instamart'],
    rides: ['Uber', 'Ola', 'Rapido'],
    stays: ['Booking.com', 'Agoda'],
    preferenceMode: 'cheapest',
    biometricsEnabled: true,
    biometricMode: 'fingerprint',
    txBiometricsEnabled: true,
    securityPin: '1234'
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
      title: 'Chalo Super AI Assistant',
      icon: '🤖',
      desc: 'Ask AI engine for comparing savings, etc.',
      keywords: ['ai', 'assistant', 'ask', 'advisor', 'bot', 'chat', 'gemini', 'help', 'coupon', 'deals']
    },
    {
      id: 'wallet',
      title: 'Chalo Wallet',
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
    if (!db) return;
    try {
      const userDocRef = doc(db, 'users', 'kunalpareek');
      await setDoc(userDocRef, {
        wallet: updatedWallet,
        preferences: updatedPrefs,
        addresses: savedAddresses,
        securityAuditLogs: updatedLogs !== undefined ? updatedLogs : securityAuditLogs
      }, { merge: true });
    } catch (e) {
      console.warn('Could not persist state updates to Firestore:', e);
    }
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
          description: 'Payment settlement via Chalo Wallet Balance',
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

  const addSupportTicket = (ticket: SupportTicket) => {
    setSupportTickets(prev => [ticket, ...prev]);
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

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-900 font-sans tracking-tight antialiased">
      
      <div className="w-full max-w-xl mx-auto bg-white min-h-screen flex flex-col shadow-xl relative border-x border-slate-150">
        
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
        <header className="sticky top-0 z-30 bg-slate-900 text-white px-4 py-3 flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-2.5 cursor-pointer select-none" onClick={() => setActiveTab('home')}>
            <div className="p-1 px-1.5 bg-gradient-to-br from-amber-400 to-amber-500 rounded-lg text-amber-950 shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-display font-black text-sm tracking-tight uppercase leading-none">Chalo</h1>
              <span className="text-[8.5px] text-amber-400 font-bold uppercase mt-1 block font-mono">India's Everyday Super App</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
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
              onClick={() => setActiveTab('preferences')}
              className="w-8 h-8 rounded-full bg-amber-400 hover:scale-105 active:scale-95 text-slate-950 flex items-center justify-center font-display font-black text-xs uppercase shadow-xs select-none cursor-pointer transition border border-amber-350"
              title="Account settings"
            >
              {userProfile.name.slice(0,2).toUpperCase()}
            </button>
          </div>
        </header>

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
                          <span className="text-[8px] font-black text-indigo-700 uppercase tracking-widest block mb-1 font-mono">🔥 Trending on Chalo</span>
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
                          <p id="no_match_text" className="text-[9px] text-slate-450 italic pl-2 py-1">No direct tool matches. Press Enter to consult the Chalo AI Advisor!</p>
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
                        { id: 'stays', title: '🏨 Book Stays', desc: 'Agoda & Booking.com live comparative tariffs', colorClass: 'border-purple-100 bg-purple-50/40 text-purple-850 hover:border-purple-300' }
                      ].map(tile => (
                        <motion.button
                          key={tile.id}
                          id={`category_tile_${tile.id}`}
                          type="button"
                          onClick={() => setActiveTab(tile.id)}
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
                          <h3 className="font-extrabold text-gray-900 leading-none uppercase text-[11px]">Chalo Wallet Balance</h3>
                          <p className="text-[10px] text-gray-400 mt-1 font-semibold">Ready for seamless automatic payouts</p>
                        </div>
                      </div>

                      <div className="text-right font-mono text-xs shrink-0 pl-1">
                        <strong className="text-sm font-black text-gray-950 block">₹{wallet.balance.toFixed(2)}</strong>
                        <button
                          type="button"
                          onClick={() => setActiveTab('wallet')}
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
                />
              )}

              {/* 10. Live ongoing orders timeline tracking: INTEGRATED ACTIVITY VIEW */}
              {activeTab === 'activity' && (
                <ActivityCenter 
                  activityList={convertedActivityList}
                  cancelActivity={cancelActivity}
                />
              )}

              {/* 11. Profile configuration setup rules settings: REWRITTEN TO ACCOUNT PAGE */}
              {activeTab === 'preferences' && (
                <AccountPage 
                  userProfile={userProfile}
                  setUserProfile={setUserProfile}
                  preferences={preferences}
                  setPreferences={setPreferences}
                  connectedAccounts={connectedAccounts}
                  setConnectedAccounts={setConnectedAccounts}
                  savedAddresses={savedAddresses}
                  setSavedAddresses={setSavedAddresses}
                  supportTickets={supportTickets}
                  addSupportTicket={addSupportTicket}
                  lockAppInstantly={() => setIsUnlocked(false)}
                  securityAuditLogs={securityAuditLogs}
                  clearSecurityLogs={() => {
                    setSecurityAuditLogs([]);
                    persistFirebaseUpdate(wallet, preferences, []);
                  }}
                  wallet={wallet}
                  addCoins={addCoinsToBalance}
                  redeemPointsToCash={redeemPointsToCash}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

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
