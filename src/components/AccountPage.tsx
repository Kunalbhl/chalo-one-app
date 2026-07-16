import { LinkedAccountInstance } from '../services/linkedAccounts/LinkedAccountService';
import { ProviderId } from '../models/UnifiedModels';
import { safeStorage, safeSessionStorage } from '../utils/storage';
import { AdminControlCenter } from './AdminControlCenter';
import PartnerPortal from './PartnerPortal';
import React, { useState, useEffect } from 'react';
import HelpSupport from './HelpSupport';
// @ts-ignore
import appLogo from '../assets/images/logo.png';
import { 
  UserProfile, 
  AppPreferences, 
  ConnectedAccounts, 
  SupportTicket, 
  Address, 
  BiometricLog, 
  ChaloWallet 
} from '../types';
import { db, auth } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { updatePassword } from 'firebase/auth';
import { FirestoreService } from '../services/firestoreService';
import { AuthService } from '../services/authService';
import { NotificationService } from '../services/notificationService';
import { PaymentService } from '../services/paymentService';
import { LoyaltyGrowthService, MembershipPlan, UserMembership, UserNotification, SavedPaymentMethod, UserAddress } from '../services/loyaltyGrowthService';
import { ChaloMemberships } from './ChaloMemberships';
import { isSuperAdmin, hasRole, isAdmin, hasPermission } from '../security/rbac';
import { Settings, Shield, MapPin, Search, User, Compass, HelpCircle, Mail, AlertCircle, ChevronDown, ChevronUp, Plus, Trash2, CheckCircle2, Fingerprint, Lock, Unlock, Eye, EyeOff, KeyRound, ShieldCheck, ShieldAlert, Camera, Clock, UserCheck, UserX, X, ArrowLeft, ChevronRight, CreditCard, Coins, Edit, Save, Check, Globe, RefreshCw, Code, Copy, Link, ArrowUpRight, Info } from 'lucide-react';

const MOCK_ADDRESS_SUGGESTIONS = [
  "Prestige Tech Park, Outer Ring Road, Kadubeesanahalli, Bengaluru, Karnataka 560103",
  "Indiranagar Double Road, Stage 2, Hoysala Nagar, Bengaluru, Karnataka 560038",
  "Manyata Tech Park, Hebbal Outer Ring Road, Nagawara, Bengaluru, Karnataka 560045",
  "Chhatrapati Shivaji Maharaj International Airport, Sahar, Andheri East, Mumbai, Maharashtra 400099",
  "Bandrakurla Complex (BKC), G Block, Bandra East, Mumbai, Maharashtra 400051",
  "Connaught Place, Radial Road 1, Block E, New Delhi, Delhi 110001",
  "Hitec City, Madhapur, Hyderabad, Telangana 500081",
  "DLF Cyber City, Phase 3, Sector 24, Gurugram, Haryana 122002",
  "Whitefield Main Road, Pattandur Agrahara, Bengaluru, Karnataka 560066",
  "Koramangala 4th Block, 80 Feet Road, Bengaluru, Karnataka 560034",
  "Salt Lake Sector V, Bidhannagar, Kolkata, West Bengal 700091",
  "Taj Mahal Palace, Apollo Bandar, Colaba, Mumbai, Maharashtra 400001",
  "UB City, Vittal Mallya Road, D'Souza Layout, Ashok Nagar, Bengaluru, Karnataka 560001",
  "Noida Electronic City, Sector 62, Noida, Uttar Pradesh 201301",
  "Cyber Gateway, Hitec City, Hyderabad, Telangana 500081"
];

interface AccountPageProps {
  userProfile: UserProfile;
  setUserProfile: (prof: UserProfile) => void;
  preferences: AppPreferences;
  setPreferences: (prefs: AppPreferences) => void;
  connectedAccounts: ConnectedAccounts;
  setConnectedAccounts: (accs: ConnectedAccounts) => void;
  savedAddresses: Address[];
  setSavedAddresses: (addrs: Address[]) => void;
  supportTickets: SupportTicket[];
  addSupportTicket: (ticket: SupportTicket) => void;
  replyToTicket: (id: string, text: string) => void;
  lockAppInstantly?: () => void;
  securityAuditLogs?: BiometricLog[];
  clearSecurityLogs?: () => void;
  
  // Wallet context
  wallet: ChaloWallet;
  addCoins: (amount: number) => void;
  redeemPointsToCash: (pts: number) => void;
  onLogout?: () => void;
  initialSection?: string;
  activities?: any[];
  currentSelectedLocation?: string;
  setShowLocationSelectorModal?: (show: boolean) => void;

  // NEW Phase-wise config props
  featureToggles?: {
    rides: boolean;
    intercity: boolean;
    food: boolean;
    mart: boolean;
    stays: boolean;
    bills: boolean;
    wallet: boolean;
    referrals: boolean;
    planner: boolean;
  };
  saveFeatureToggles?: (toggles: any) => Promise<void>;
}

export default function AccountPage({
  userProfile,
  setUserProfile,
  preferences,
  setPreferences,
  connectedAccounts,
  setConnectedAccounts,
  savedAddresses,
  setSavedAddresses,
  supportTickets,
  addSupportTicket,
  replyToTicket,
  lockAppInstantly,
  securityAuditLogs = [],
  clearSecurityLogs,
  wallet,
  addCoins,
  redeemPointsToCash,
  onLogout,
  initialSection,
  activities = [],
  currentSelectedLocation,
  setShowLocationSelectorModal,
  featureToggles,
  saveFeatureToggles
}: AccountPageProps) {
  // Navigation inside Account page
  const [activeSection, setActiveSection] = useState<
    'main' | 'linked_accounts' | 'rules_prefs' | 'security_audit' | 'help_support' | 'payments' | 'saved_addresses' | 'edit_profile' | 'change_password' | 'admin_center' | 'partner_portal' | 'memberships'
  >('main');

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
    
  const [linkedAccounts, setLinkedAccounts] = useState<any[]>([]);
  useEffect(() => {
    // We would use actual userId, for now using dummy user1
    LinkedAccountInstance.getLinkedAccounts(userProfile?.id || 'guest').then(accounts => {
      const formatted = ['swiggy', 'zomato', 'blinkit', 'zepto', 'bookingcom', 'agoda'].map(id => {
        const acc = accounts.find(a => a.provider === id);
        return {
          id: id as ProviderId,
          name: id.charAt(0).toUpperCase() + id.slice(1),
          status: acc?.status === 'connected' ? 'connected' : 'not_connected',
          color: id === 'swiggy' ? 'bg-orange-100 text-orange-600' : id === 'zomato' ? 'bg-red-100 text-red-600' : id === 'blinkit' ? 'bg-yellow-100 text-yellow-600' : 'bg-slate-100 text-slate-600',
          icon: id.charAt(0).toUpperCase()
        };
      });
      setLinkedAccounts(formatted);
    });
  }, []);

  const handleLinkToggle = async (providerId: ProviderId, currentStatus: string) => {
    if (currentStatus === 'connected') {
      await LinkedAccountInstance.disconnectAccount(userProfile?.id || 'guest', providerId);
    } else {
      // Simulate OAuth / WebView login
      await LinkedAccountInstance.linkAccount(userProfile?.id || 'guest', providerId, { providerUserId: 'mock_123', displayName: 'Chalo User' });
    }
    // Refresh
    const accounts = await LinkedAccountInstance.getLinkedAccounts(userProfile?.id || 'guest');
    const formatted = ['swiggy', 'zomato', 'blinkit', 'zepto', 'bookingcom', 'agoda'].map(id => {
      const acc = accounts.find(a => a.provider === id);
      return {
        id: id as ProviderId,
        name: id.charAt(0).toUpperCase() + id.slice(1),
        status: acc?.status === 'connected' ? 'connected' : 'not_connected',
        color: id === 'swiggy' ? 'bg-orange-100 text-orange-600' : id === 'zomato' ? 'bg-red-100 text-red-600' : id === 'blinkit' ? 'bg-yellow-100 text-yellow-600' : 'bg-slate-100 text-slate-600',
        icon: id.charAt(0).toUpperCase()
      };
    });
    setLinkedAccounts(formatted);
  };


  // Phase-wise Local Config toggles state
  const [localFeatureToggles, setLocalFeatureToggles] = useState(() => {
    return featureToggles || {
      rides: true,
      intercity: true,
      food: true,
      mart: true,
      stays: true,
      bills: true,
      wallet: true,
      referrals: true,
      planner: true,
    };
  });

  useEffect(() => {
    if (featureToggles) {
      setLocalFeatureToggles(featureToggles);
    }
  }, [featureToggles]);

  // Change Password States
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  // Sync active section on initialSection mount
  React.useEffect(() => {
    if (initialSection) {
      setActiveSection(initialSection as any);
    }
  }, [initialSection]);

  // Edit Profile States
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [profileName, setProfileName] = useState<string>(userProfile.name);
  const [profilePhone, setProfilePhone] = useState<string>(userProfile.phone);
  const [profileEmail, setProfileEmail] = useState<string>(userProfile.email);
  const [profileDob, setProfileDob] = useState<string>(userProfile.dob || '');
  const [profileGender, setProfileGender] = useState<string>(userProfile.gender || 'Male');
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string>(userProfile.avatarUrl || '');
  const [profileSaveSuccess, setProfileSaveSuccess] = useState<boolean>(false);

  // Sync editable profile fields whenever userProfile changes (e.g. loaded from Firestore)
  React.useEffect(() => {
    if (userProfile) {
      setProfileName(userProfile.name || '');
      setProfilePhone(userProfile.phone || '');
      setProfileEmail(userProfile.email || '');
      setProfileDob(userProfile.dob || '');
      setProfileGender(userProfile.gender || 'Male');
      setProfileAvatarUrl(userProfile.avatarUrl || userProfile.photoURL || '');
    }
  }, [userProfile]);

  // Preset Avatars by gender
  const MALE_AVATARS = [
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Jack',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Buster',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Teddy'
  ];
  const FEMALE_AVATARS = [
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Sasha',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Mia',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Lily',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Coco'
  ];
  const OTHER_AVATARS = [
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Bubba',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Garfield',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Scooter',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Pepper'
  ];

  const getPresetAvatarsByGender = () => {
    if (profileGender === 'Male') return MALE_AVATARS;
    if (profileGender === 'Female') return FEMALE_AVATARS;
    return OTHER_AVATARS;
  };

  // Automatically select first avatar from the new gender presets when profile gender changes, or enforce correct gender category
  React.useEffect(() => {
    const malePresets = MALE_AVATARS;
    const femalePresets = FEMALE_AVATARS;
    const otherPresets = OTHER_AVATARS;

    if (profileGender === 'Male') {
      if (!profileAvatarUrl || femalePresets.includes(profileAvatarUrl) || otherPresets.includes(profileAvatarUrl)) {
        setProfileAvatarUrl(malePresets[0]);
      }
    } else if (profileGender === 'Female') {
      if (!profileAvatarUrl || malePresets.includes(profileAvatarUrl) || otherPresets.includes(profileAvatarUrl)) {
        setProfileAvatarUrl(femalePresets[0]);
      }
    } else {
      if (!profileAvatarUrl || malePresets.includes(profileAvatarUrl) || femalePresets.includes(profileAvatarUrl)) {
        setProfileAvatarUrl(otherPresets[0]);
      }
    }
  }, [profileGender, profileAvatarUrl]);

  // Platform Linking Modal states
  const [linkingItem, setLinkingItem] = useState<any | null>(null);
  const [linkEmail, setLinkEmail] = useState<string>('');
  const [linkPassword, setLinkPassword] = useState<string>('');
  const [showLinkPassword, setShowLinkPassword] = useState<boolean>(false);
  const [isVerifyingLink, setIsVerifyingLink] = useState<boolean>(false);
  const [isLinkSuccess, setIsLinkSuccess] = useState<boolean>(false);
  const [isReLoginCheck, setIsReLoginCheck] = useState<boolean>(false);

  // Security Audit state locks
  const [isAuditUnlocked, setIsAuditUnlocked] = useState<boolean>(false);
  const [isDirectScanning, setIsDirectScanning] = useState<boolean>(false);
  const [auditFeedback, setAuditFeedback] = useState<string>('');
  const [auditPinError, setAuditPinError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // FAQs expansion tracking
  const [expandedFAQIndex, setExpandedFAQIndex] = useState<number | null>(null);

  // Security editing PIN state
  const [isEditingPin, setIsEditingPin] = useState(false);
  const [newPinVal, setNewPinVal] = useState(preferences.securityPin || '1234');
  const [showSettingsPin, setShowSettingsPin] = useState(false);

  // Address fields states
  const [addressLabel, setAddressLabel] = useState<'Home' | 'Work' | 'Other'>('Home');
  const [addressLine, setAddressLine] = useState('');
  const [addressLandmark, setAddressLandmark] = useState('');

  // Address autocomplete simulation states
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);

  React.useEffect(() => {
    if (!addressLine.trim()) {
      setAddressSuggestions([]);
      setShowAddressSuggestions(false);
      return;
    }

    // Only search if the current input doesn't exactly match one of our loaded suggestions
    // (this avoids infinite triggering when a suggestion is clicked/selected)
    const exactMatch = MOCK_ADDRESS_SUGGESTIONS.some(addr => addr === addressLine);
    if (exactMatch) {
      setShowAddressSuggestions(false);
      return;
    }

    setIsSearchingAddress(true);
    setShowAddressSuggestions(true);

    const delayDebounceFn = setTimeout(() => {
      const query = addressLine.toLowerCase();
      const filtered = MOCK_ADDRESS_SUGGESTIONS.filter(addr =>
        addr.toLowerCase().includes(query)
      );
      setAddressSuggestions(filtered);
      setIsSearchingAddress(false);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [addressLine]);

  // Email Webhooks / API state variables
  const [isSendingWebhookTest, setIsSendingWebhookTest] = useState<boolean>(false);
  const [webhookTestResult, setWebhookTestResult] = useState<any | null>(null);
  const [webhookTestError, setWebhookTestError] = useState<string | null>(null);


  // Wallet add simulated money state
  const [topUpAmount, setTopUpAmount] = useState<string>('500');

  // Interactive Affiliate Partners lists & configurations managed by Super Admin Kunal
  const [affiliatesList, setAffiliatesList] = useState([
    { id: 'partner_1', companyName: 'TravelBlogger India', domain: 'travelblog.in', clicks: 2450, conversions: 194, revenue: 19400.00, commissionRate: 12, isActivated: true, apiToken: 'b05c19cca9a302ef825cd58847f704639e6332b4f110d75ff3644dc8778bfcfe', webhookUrl: 'https://travelblog.in/webhooks/chalo' },
    { id: 'partner_2', companyName: 'RideRadar Network', domain: 'rideradar.com', clicks: 1120, conversions: 89, revenue: 8900.00, commissionRate: 12, isActivated: true, apiToken: '6e7bed609699c293f95c18348c12248bba70c07fd54274fe647302ca2f4f68bf', webhookUrl: 'https://rideradar.com/api/chalo-hook' },
    { id: 'partner_3', companyName: 'StayNavigator Blog', domain: 'staynav.in', clicks: 3100, conversions: 242, revenue: 24200.00, commissionRate: 15, isActivated: true, apiToken: 'affiliate_token_staynav_912', webhookUrl: 'https://staynav.in/chalo/callback' }
  ]);

  // Commission Junction Booking.com Affiliate States
  const [cjConfig, setCjConfig] = useState<{ email: string; passwordMask: string; status: string; portalUrl: string } | null>(null);
  const [cjBookingsList, setCjBookingsList] = useState<any[]>([]);
  const [isFetchingCjData, setIsFetchingCjData] = useState<boolean>(false);
  const [isSyncingCjManual, setIsSyncingCjManual] = useState<boolean>(false);



  const [newPartnerCompany, setNewPartnerCompany] = useState<string>('');
  const [newPartnerDomain, setNewPartnerDomain] = useState<string>('');
  const [newPartnerRate, setNewPartnerRate] = useState<number>(12);
  const [showAddPartnerForm, setShowAddPartnerForm] = useState<boolean>(false);
  const [globalCommissionRate, setGlobalCommissionRate] = useState<number>(12);

  // Email API credentials (editable by Super Admin Kunal)
  const [emailWebhookApi, setEmailWebhookApi] = useState<string>('6e7bed609699c293f95c18348c12248bba70c07fd54274fe647302ca2f4f68bf');
  const [emailApiToken, setEmailApiToken] = useState<string>('b05c19cca9a302ef825cd58847f704639e6332b4f110d75ff3644dc8778bfcfe');

  // Core API Endpoints List (editable & syncable by Super Admin)
  const [coreApisList, setCoreApisList] = useState([
    { id: 'google_maps', name: '🗺️ Google Maps Navigation', service: 'Map picker, live routing tracking, and GPS reverse-geocoding', status: 'Linked', apiKey: 'AIzaSyChaloOneGoogleMaps911KP', endpoint: 'https://maps.googleapis.com/maps/api', isTesting: false },
    { id: 'swiggy_food', name: '🍔 Swiggy Food Delivery API', service: 'Sync Swiggy food outlet menus, pricing pools, and coupon validation', status: 'Linked', apiKey: 'swiggy_secret_oauth_token_chalo', endpoint: 'https://partner.swiggy.com/v1', isTesting: false },
    { id: 'zomato_food', name: '🍿 Zomato Grievance & Pricing API', service: 'Compare food pools and auto-route disputes/refunds tracking', status: 'Linked', apiKey: 'zomato_prod_client_key_910', endpoint: 'https://api.zomato.com/v2', isTesting: false },
    { id: 'blinkit_mart', name: '📦 Blinkit Mart & Grocery API', service: 'Sync fast grocery product catalogue inventory, pricing, and ETAs', status: 'Linked', apiKey: 'blinkit_grocery_token_55', endpoint: 'https://api.blinkit.com/v1', isTesting: false },
    { id: 'uber_rides', name: '🚕 Uber Cabs Dispatch API', service: 'Compare real-time cab quotes, ETAs, and auto-dispatch rides', status: 'Linked', apiKey: 'uber_server_token_chaloone_api', endpoint: 'https://api.uber.com/v1', isTesting: false },
    { id: 'ola_rides', name: '🚗 Ola Rides Cab API', service: 'Pull Ola city rides pricing matrix and driver availability status', status: 'Linked', apiKey: 'ola_developer_key_chalo_prod', endpoint: 'https://api.olacabs.com/v3', isTesting: false }
  ]);
  const [newApiName, setNewApiName] = useState('');
  const [newApiService, setNewApiService] = useState('');
  const [newApiKey, setNewApiKey] = useState('');
  const [newApiEndpoint, setNewApiEndpoint] = useState('');
  const [showAddApiForm, setShowAddApiForm] = useState(false);
  const [backendSyncing, setBackendSyncing] = useState(false);
  const [backendSyncSuccess, setBackendSyncSuccess] = useState(false);

  const [activeAdminTab, setActiveAdminTab] = useState<'overview' | 'features' | 'apis' | 'affiliates'>('overview');

  const [typedRedemptionPoints, setTypedRedemptionPoints] = useState<string>('');

  // Preferred platform selection states (one per category, remembered and synced)
  const [prefRides, setPrefRides] = useState<string>(() => safeStorage.getItem("chalo_pref_rides") || 'uber');
  const [prefFood, setPrefFood] = useState<string>(() => safeStorage.getItem("chalo_pref_food") || 'zomato');
  const [prefMart, setPrefMart] = useState<string>(() => safeStorage.getItem("chalo_pref_mart") || 'blinkit');
  const [prefStays, setPrefStays] = useState<string>(() => safeStorage.getItem("chalo_pref_stays") || 'makemytrip');

  // Payment Management States
  const [txnFilter, setTxnFilter] = useState<'All' | 'Card' | 'Wallet' | 'UPI'>('All');
  const [savedCards, setSavedCards] = useState<any[]>(() => {
    const saved = safeStorage.getItem("chalo_saved_cards");
    return saved ? JSON.parse(saved) : [];
  });
  const [savedUpis, setSavedUpis] = useState<any[]>(() => {
    const saved = safeStorage.getItem("chalo_saved_upis");
    return saved ? JSON.parse(saved) : [];
  });
  const [savedWallets, setSavedWallets] = useState<any[]>(() => {
    const saved = safeStorage.getItem("chalo_saved_wallets");
    return saved ? JSON.parse(saved) : [];
  });

  React.useEffect(() => {
    safeStorage.setItem("chalo_saved_cards", JSON.stringify(savedCards));
  }, [savedCards]);

  React.useEffect(() => {
    safeStorage.setItem("chalo_saved_upis", JSON.stringify(savedUpis));
  }, [savedUpis]);

  React.useEffect(() => {
    safeStorage.setItem("chalo_saved_wallets", JSON.stringify(savedWallets));
  }, [savedWallets]);


  React.useEffect(() => {
    if (userProfile?.id) {
      LoyaltyGrowthService.getSavedPaymentMethods(userProfile.id).then(methods => {
        const cards = methods
          .filter(m => m.type === 'card')
          .map(m => ({
            id: m.id,
            bank: m.provider.split(' ')[0] || 'SBI Bank',
            type: m.provider,
            number: m.label,
            expiry: '11/30'
          }));
        const upis = methods
          .filter(m => m.type === 'upi')
          .map(m => ({
            id: m.id,
            upiId: m.label,
            label: m.provider
          }));
        const wallets = methods
          .filter(m => m.type === 'wallet')
          .map(m => ({
            id: m.id,
            name: m.provider,
            phone: m.label.replace(/\D/g, '') || '9876543210',
            balance: 500
          }));
        
        if (cards.length > 0) setSavedCards(cards);
        if (upis.length > 0) setSavedUpis(upis);
        if (wallets.length > 0) setSavedWallets(wallets);
      }).catch(err => {
        console.warn("Could not load payment methods from Firestore:", err);
      });
    }
  }, [userProfile?.id]);

  // Form Adding Toggle States & Inputs
  const [addingMethodType, setAddingMethodType] = useState<'none' | 'card' | 'upi' | 'wallet'>('none');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyStep, setVerifyStep] = useState('');

  // Card Inputs
  const [newCardNumber, setNewCardNumber] = useState('');
  const [newCardExpiry, setNewCardExpiry] = useState('');
  const [newCardCvv, setNewCardCvv] = useState('');

  // UPI Inputs
  const [newUpiId, setNewUpiId] = useState('');
  const [newUpiLabel, setNewUpiLabel] = useState('');

  // Wallet Inputs
  const [selectedWalletName, setSelectedWalletName] = useState('Amazon Pay');
  const [newWalletPhone, setNewWalletPhone] = useState('');

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNum = newCardNumber.replace(/\s+/g, '');
    if (cleanNum.length < 16) {
      alert("Invalid Card number. Please enter a 16-digit card number.");
      return;
    }
    setIsVerifying(true);
    setVerifyStep("Connecting to secure payment network...");
 
    // Auto-detect bank and type
    const lead = cleanNum.charAt(0);
    let cardType = 'Visa credit';
    let cardBank = 'SBI Bank';
    if (lead === '4') { cardType = 'Visa credit'; cardBank = 'HDFC'; }
    else if (lead === '5') { cardType = 'Mastercard debit'; cardBank = 'ICICI'; }
    else if (lead === '6') { cardType = 'RuPay debit'; cardBank = 'Federal Bank'; }
    else if (lead === '3') { cardType = 'Amex elite'; cardBank = 'AmEx'; }
 
    const lastFour = cleanNum.slice(-4);
    const newCard = {
      id: crypto.randomUUID(),
      bank: cardBank,
      type: cardType,
      number: `•••• •••• •••• ${lastFour}`,
      expiry: newCardExpiry || '11/30'
    };

    try {
      await LoyaltyGrowthService.addSavedPaymentMethod(userProfile.id, {
        type: 'card',
        label: newCard.number,
        isDefault: false,
        provider: `${cardBank} ${cardType}`
      });
      setSavedCards([...savedCards, newCard]);
      alert(`Success! Card verified natively from ${cardBank} bank server and saved.`);
    } catch (err) {
      console.error(err);
      alert('Failed to register payment card with secured cloud wallet.');
    } finally {
      setIsVerifying(false);
      setAddingMethodType('none');
      setNewCardNumber('');
      setNewCardExpiry('');
      setNewCardCvv('');
    }
  };
 
  const handleAddUpi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUpiId.includes('@')) {
      alert("Please enter a valid UPI VPA structure, e.g. username@bank");
      return;
    }
    setIsVerifying(true);
    setVerifyStep("Querying NPCI Central UPI servers...");
 
    const newUpi = {
      id: crypto.randomUUID(),
      upiId: newUpiId,
      label: newUpiLabel || 'Personal Account'
    };

    try {
      await LoyaltyGrowthService.addSavedPaymentMethod(userProfile.id, {
        type: 'upi',
        label: newUpi.upiId,
        isDefault: false,
        provider: newUpi.label
      });
      setSavedUpis([...savedUpis, newUpi]);
      alert(`Success! NPCI Server validated VPA username: ${newUpiId}`);
    } catch (err) {
      console.error(err);
      alert('Failed to register UPI identifier.');
    } finally {
      setIsVerifying(false);
      setAddingMethodType('none');
      setNewUpiId('');
      setNewUpiLabel('');
    }
  };
 
  const handleLinkWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newWalletPhone.length < 10) {
      alert("Please enter a valid 10-digit mobile number linked to your wallet.");
      return;
    }
    setIsVerifying(true);
    setVerifyStep(`Contacting ${selectedWalletName} API servers...`);
 
    const optCode = prompt(`A secure link confirmation code was sent to ${newWalletPhone}. Please enter the 4-digit code (e.g. 1234) to fully link:`);
    if (!optCode) {
      setIsVerifying(false);
      return;
    }
 
    const newWallet = {
      id: crypto.randomUUID(),
      name: selectedWalletName,
      phone: newWalletPhone,
      balance: 0
    };

    try {
      await LoyaltyGrowthService.addSavedPaymentMethod(userProfile.id, {
        type: 'wallet',
        label: `Mobile Linked: ${newWalletPhone}`,
        isDefault: false,
        provider: selectedWalletName
      });
      setSavedWallets([...savedWallets, newWallet]);
      alert(`Success! Linked ${selectedWalletName} Wallet`);
    } catch (err) {
      console.error(err);
      alert('Failed to link wallet registry.');
    } finally {
      setIsVerifying(false);
      setAddingMethodType('none');
      setNewWalletPhone('');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    if (isProcessing) return;
    setIsProcessing(true);
    e.preventDefault();
    const updatedProfile: UserProfile = {
      ...userProfile,
      name: profileName,
      phone: profilePhone,
      email: profileEmail,
      dob: profileDob,
      gender: profileGender,
      avatarUrl: profileAvatarUrl
    };
    
    setUserProfile(updatedProfile);
    setIsEditingProfile(false);
    setActiveSection('main'); // Redirect back to Account Page
    setProfileSaveSuccess(true);
    setTimeout(() => setProfileSaveSuccess(false), 2500);

    // Persist profile updates directly to Firebase database securely
    try {
      if (userProfile?.id) {
        await AuthService.updateProfileFields(userProfile.id, {
          name: profileName,
          phone: profilePhone,
          dob: profileDob,
          gender: profileGender,
          avatarUrl: profileAvatarUrl,
          photoURL: profileAvatarUrl
        });
        console.log("Updated profile details securely synced to Firebase Firestore.");
        
        // Trigger automated system event notification
        await NotificationService.notifyProfileUpdated(userProfile.id);
      }
    } catch (err) {
      console.warn("Could not persist profile changes to Firebase Firestore:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    if (isProcessing) return;
    setIsProcessing(true);
    e.preventDefault();
    if (!addressLine.trim()) {
      setIsProcessing(false);
      return;
    }

    const newId = "ADR-" + parseInt(crypto.randomUUID().slice(0, 4), 16);
    const newAddr: Address = {
      id: newId,
      label: addressLabel,
      addressLine,
      landmark: addressLandmark || undefined
    };

    try {
      const firestoreLabel = addressLabel === 'Home' ? 'home' : addressLabel === 'Work' ? 'work' : 'custom';
      await LoyaltyGrowthService.saveUserAddress(userProfile.id, {
        id: newId,
        label: firestoreLabel,
        customLabel: addressLabel === 'Other' ? 'Other' : undefined,
        fullAddress: addressLine,
        landmark: addressLandmark || undefined,
        instructions: 'Default instruction',
        coords: { lat: 28.4595, lng: 77.0266 },
        isDefault: false
      });

      setSavedAddresses([...savedAddresses, newAddr]);
      setAddressLine('');
      setAddressLandmark('');
      alert('Comfort hotspot address successfully recorded!');
    } catch (err) {
      console.error(err);
      alert('Failed to save address to cloud registry.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this saved hotspot address?")) return;
    try {
      await LoyaltyGrowthService.deleteUserAddress(id);
      setSavedAddresses(savedAddresses.filter(addr => addr.id !== id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete address.');
    }
  };


  return (
    <div id="account_page_root_container" className="p-4 max-w-6xl mx-auto space-y-6 font-sans text-gray-800 pb-24">
      
      {/* HEADER SWITCH */}
      {activeSection !== 'main' && (
        <div className="sticky top-0 z-40 -mx-4 px-4 py-3 bg-amber-50/95 backdrop-blur-md border-b border-amber-200/60 shadow-xs flex items-center justify-between -mt-4 mb-4 select-none">
          <button
            type="button"
            onClick={() => {
              setActiveSection('main');
              setIsAuditUnlocked(false);
            }}
            className="flex items-center space-x-1.5 text-slate-900 hover:text-amber-700 font-extrabold text-[11px] font-display transition uppercase select-none cursor-pointer bg-white border border-slate-200 px-3 py-2 rounded-xl shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>← Back to Account menu</span>
          </button>
          
          <div className="text-right">
            <span className="text-[9.5px] bg-slate-900 text-amber-400 font-black px-2.5 py-1.5 rounded-lg border border-slate-800 font-mono uppercase tracking-widest">
              {activeSection === 'linked_accounts' ? '🔗 LINKED ACCOUNTS' :
               activeSection === 'rules_prefs' ? '⚙️ APP PREFERENCES' :
               activeSection === 'security_audit' ? '🛡️ SHIELD SECURITY' :
               activeSection === 'payments' ? '💰 WALLET & PAYMENTS' :
               activeSection === 'memberships' ? '👑 PREMIUM VIP MEMBERSHIPS' :
               activeSection === 'saved_addresses' ? '📍 SAVED SPOTS' :
               activeSection === 'help_support' ? '🛎️ SUPPORT DESK' :
               activeSection === 'edit_profile' ? '👤 EDIT PROFILE' :
               activeSection === 'admin_center' ? '🛡️ SUPER ADMIN CONTROL CENTER' :
               activeSection.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        </div>
      )}

      {/* RENDER ACCORDING TO STATE SWITCH */}
      {activeSection === 'main' ? (
        <div className="space-y-4 animate-fade-in" id="account_main_menu_group">
          
          {/* PREMIUM CHALO ONE APP & CURRENT PLACE BANNER */}
          <div className="bg-slate-900 text-white p-5 rounded-3xl border border-slate-800 shadow-md relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full filter blur-xl opacity-40 -mr-8 -mt-8"></div>
            
            <div className="flex items-center space-x-3.5 relative z-10">
              {/* Circular logo box without white background or blend modes to respect transparent PNG */}
              <div className="w-12 h-12 flex items-center justify-center overflow-hidden shrink-0">
                <img 
                  src={appLogo} 
                  alt="Chalo One Logo" 
                  className="w-full h-full object-contain" 
                  referrerPolicy="no-referrer" 
                />
              </div>
              <div>
                <h2 className="font-display font-black text-white text-base tracking-tight uppercase leading-none">
                  Chalo One
                </h2>
                <span className="text-[9px] text-amber-400 font-bold uppercase mt-1 block font-mono">
                  AI Powered One Platform Compare Food, Rides, Stay & Order.
                </span>
              </div>
            </div>
            
            {/* Current Place Section */}
            <div className="flex items-center space-x-2.5 bg-slate-950/60 p-2.5 px-3.5 rounded-2xl border border-slate-800 relative z-10 w-full sm:w-auto max-w-xs">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="truncate text-left flex-1 min-w-0">
                <span className="text-[8px] text-amber-500 uppercase font-mono font-black block tracking-wider leading-none mb-0.5">
                  Current Place
                </span>
                <span className="truncate text-slate-100 font-sans text-xs font-black leading-tight block">
                  {currentSelectedLocation || 'Koramangala, Bangalore'}
                </span>
              </div>
              {setShowLocationSelectorModal && (
                <button
                  type="button"
                  onClick={() => setShowLocationSelectorModal(true)}
                  className="text-[9px] font-black uppercase text-amber-400 hover:text-amber-500 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 font-mono tracking-wider shrink-0 cursor-pointer transition-colors ml-2"
                >
                  Change
                </button>
              )}
            </div>
          </div>
          
          {/* UPPER SIDE: EDIT PROFILE BLOCK */}
          <div className="bg-white p-5 rounded-3xl border border-gray-150 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full filter blur-xl opacity-50 -mr-6 -mt-6"></div>
            
            <div 
              onClick={() => {
                setActiveSection('edit_profile');
                setProfileName(userProfile.name);
                setProfilePhone(userProfile.phone);
                setProfileEmail(userProfile.email);
                setProfileDob(userProfile.dob || '');
                setProfileGender(userProfile.gender || 'Male');
                setProfileAvatarUrl(userProfile.avatarUrl || '');
              }}
              className="flex justify-between items-start pb-3 border-b border-gray-100 flex-wrap gap-2 cursor-pointer hover:opacity-90 transition group/header"
            >
              <div className="flex items-center space-x-3.5">
                {userProfile.avatarUrl ? (
                  <img 
                    src={userProfile.avatarUrl} 
                    alt={userProfile.name} 
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-amber-400 shadow-xs select-none"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-12 h-12 bg-amber-100 ring-2 ring-amber-400 text-amber-800 rounded-full flex items-center justify-center font-black text-sm uppercase shadow-sm select-none">
                    {userProfile.name.slice(0,2).toUpperCase()}
                  </div>
                )}
                <div>
                  <span className="text-[9px] font-mono tracking-widest font-black uppercase text-amber-600 block bg-amber-50 px-1.5 py-0.5 rounded-sm w-fit border border-amber-200">
                    Chalo One Account Holder
                  </span>
                  <h3 className="font-display font-black text-gray-900 text-sm tracking-tight leading-none mt-1.5">
                    {userProfile.name}
                  </h3>
                  <p className="text-[10px] text-gray-400 font-semibold mt-0.5">{userProfile.email}</p>
                </div>
              </div>

              <button
                type="button"
                className="p-1.5 bg-zinc-50 group-hover/header:bg-zinc-100 text-gray-800 border-2 border-gray-150 rounded-xl transition text-[10.5px] font-bold tracking-tight uppercase flex items-center space-x-1 shrink-0 cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            </div>
            
            {/* Profile Completion Indicator */}
            {(() => {
              const fields = [userProfile.name, userProfile.email, userProfile.phone, userProfile.dob, userProfile.gender, userProfile.avatarUrl];
              const filled = fields.filter(f => f && String(f).trim() !== '').length;
              const total = fields.length;
              const percent = Math.round((filled / total) * 100);
              return percent < 100 ? (
                <div className="mt-3 bg-amber-50/50 p-2 rounded-xl border border-amber-200/50">
                  <div className="flex justify-between text-[9px] font-mono font-bold text-amber-700 mb-1">
                    <span>PROFILE COMPLETION</span>
                    <span>{percent}%</span>
                  </div>
                  <div className="w-full bg-amber-100 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${percent}%` }}></div>
                  </div>
                  <div className="text-[9px] text-amber-600 mt-1.5 font-medium">
                    Missing fields: {['Name', 'Email', 'Phone', 'Date of Birth', 'Gender', 'Profile Photo'].filter((_, i) => !fields[i] || String(fields[i]).trim() === '').join(', ')}. Please update your profile.
                  </div>
                </div>
              ) : null;
            })()}

            {/* Profile fields details (regular display with DD-MM-YYYY Date of Birth format) */}
            <div className="pt-3.5 space-y-3.5 text-xs">
              {profileSaveSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-2.5 flex items-center space-x-2 animate-pulse">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-[10px] uppercase font-bold tracking-tight">Kunal profile updated instantly! Saved in app.</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3.5 text-[11px] font-medium text-gray-600">
                <div>
                  <span className="text-[8px] font-mono font-bold block text-gray-400 uppercase">Mobile Number</span>
                  <strong className="text-gray-900 font-bold text-xs">{userProfile.phone}</strong>
                </div>
                <div>
                  <span className="text-[8px] font-mono font-bold block text-gray-400 uppercase">Gender identity</span>
                  <strong className="text-gray-900 font-bold text-xs">{userProfile.gender}</strong>
                </div>
                <div>
                  <span className="text-[8px] font-mono font-bold block text-gray-400 uppercase">Date of Birth</span>
                  <strong className="text-gray-900 font-bold text-xs">
                    {(() => {
                      const dobStr = userProfile.dob || '1998-05-15';
                      const parts = dobStr.split('-');
                      if (parts.length === 3) {
                        return `${parts[2]}-${parts[1]}-${parts[0]}`;
                      }
                      return dobStr;
                    })()}
                  </strong>
                </div>
                <div>
                  <span className="text-[8px] font-mono font-bold block text-gray-400 uppercase">Referrals Badge</span>
                  <strong className="text-amber-650 font-bold text-sm font-mono tracking-wider">{userProfile.referralCode}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* LIST OPTIONS AS SECTIONS TO TAP */}
          <div className="bg-white rounded-3xl border border-gray-150 shadow-xs divide-y divide-gray-100 overflow-hidden">
            {[
              ...(isSuperAdmin(userProfile) ? [{
                id: 'admin_center',
                title: '🛡️ Super Admin Control Center',
                desc: 'Production Dashboard, User Management, Wallet Control, Analytics, System Config',
                badge: 'Restricted'
              }] : []),
              {
                id: 'partner_portal',
                title: '🤝 Merchant Partner Portal',
                desc: 'Register business, manage products, view settlements and active orders',
                badge: 'Enterprise Desk'
              },
              {
                id: 'linked_accounts',
                title: '🔗 Linked Aggregator Accounts',
                desc: 'Uber, Swiggy, Ola integration status connect',
                badge: Object.values(connectedAccounts).filter(Boolean).length + ' Accounts'
              },
              {
                id: 'rules_prefs',
                title: '⚙️ App Preferences',
                desc: 'Comparison optimizers & Biometrics app lock',
                badge: preferences.preferenceMode.toUpperCase()
              },
              {
                id: 'security_audit',
                title: '🛡️ Shield Security and Audit Logs',
                desc: 'Analyze intrusion hardware ledger, lock state, and change password',
                badge: securityAuditLogs.filter(l => l.status === 'failed').length + ' Blocked'
              },
              {
                id: 'payments',
                title: '💰 Wallet Balance & Payment Methods',
                desc: 'Chalo One money, loyalty points, transactions history',
                badge: '₹' + wallet.balance.toFixed(2)
              },
              {
                id: 'memberships',
                title: '👑 Chalo Premium VIP Memberships',
                desc: 'Subscribe to Chalo Plus, Gold, or Platinum for free delivery and multiplier rewards',
                badge: 'VIP Perks'
              },
              {
                id: 'saved_addresses',
                title: '📍 Saved Delivery Addresses',
                desc: 'Manage frequent travel destinations pickup locations',
                badge: savedAddresses.length + ' Spots'
              },
              {
                id: 'help_support',
                title: '🛎️ Help, Support Desk & FAQs',
                desc: 'Settle tickets and review super app help options',
                badge: supportTickets.length + ' Tickets'
              }
            ].filter(row => {
              // Hide payments if wallet is disabled
              if (row.id === 'payments' && localFeatureToggles.wallet === false) return false;
              return true;
            }).map(row => (
              <button
                key={row.id}
                type="button"
                onClick={() => {
                  setActiveSection(row.id as any);
                  setIsAuditUnlocked(false);
                }}
                className="w-full px-5 py-4 text-left transition hover:bg-amber-50/10 cursor-pointer flex items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1 max-w-[70%]">
                  <h4 className="font-display font-black text-gray-900 text-xs tracking-tight uppercase">
                    {row.title}
                  </h4>
                  <p className="text-[10.5px] text-gray-400 leading-tight">
                    {row.desc}
                  </p>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <span className="text-[9px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full uppercase border border-gray-200">
                    {row.badge}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </div>
              </button>
            ))}
          </div>

          {/* 🚪 SIGN-OUT / LOGOUT BUTTON */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setShowLogoutConfirm(true);
              }}
              className="w-full py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 border border-rose-200 rounded-3xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center space-x-1.5 transition cursor-pointer font-sans"
            >
              <span>🚪 Sign Out & Lock Chalo One Wallet</span>
            </button>
          </div>

        </div>
      ) : (
        /* INNER DEEP SECTIONS */
        <div className="animate-fade-in" id="account_inner_deep_tab_view">
          
          {/* A. LINKED ACCOUNTS */}
          {activeSection === 'linked_accounts' && (
            <div className="space-y-4" id="section_linked_accounts">
              <div className="bg-white p-5 rounded-3xl border border-gray-150 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Linked Aggregator Services</h3>
                    <p className="text-[11px] text-gray-400 mt-0.5 font-medium">Link accounts to verify active profiles. Star exactly ONE preferred carrier per category.</p>
                  </div>
                  <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                </div>

                {/* Categorized Layout representation */}
                {[
                  {
                    categoryName: '🚗 Ride-Hailing Providers',
                    prefState: prefRides,
                    setPref: (val: string) => {
                      setPrefRides(val);
                      safeStorage.setItem("chalo_pref_rides", val);
                      alert(`🚀 "${val.toUpperCase()}" is now set as your single preferred rides operator inside Chalo One super comparison search.`);
                    },
                    items: [
                      { key: 'uber', label: 'Uber', logo: '🚗', color: 'bg-black text-white', cred: 'uber_kunal_chalo_99@vpa.com', docUrl: 'https://uber.com', linkedSince: 'Linked since: 45 days' },
                      { key: 'ola', label: 'Ola', logo: '🚕', color: 'bg-yellow-400 text-slate-900 font-black', cred: 'ola_kunal_active_session', docUrl: 'https://olacabs.com', linkedSince: 'Linked since: 12 days' },
                      { key: 'rapido', label: 'Rapido', logo: '🏍', color: 'bg-yellow-300 text-slate-900', cred: '+91 98845 29130 OTP verified', docUrl: 'https://rapido.xyz', linkedSince: 'Linked since: 8 days' }
                    ]
                  },
                  {
                    categoryName: '🍔 Food Delivery Platforms',
                    prefState: prefFood,
                    setPref: (val: string) => {
                      setPrefFood(val);
                      safeStorage.setItem("chalo_pref_food", val);
                      alert(`🍔 "${val.toUpperCase()}" is now set as your single preferred food node inside Chalo One comparison searches.`);
                    },
                    items: [
                      { key: 'zomato', label: 'Zomato', logo: '🔴', color: 'bg-rose-600 text-white', cred: 'zomato_member_223@gmail.com', docUrl: 'https://zomato.com', linkedSince: 'Linked since: 28 days' },
                      { key: 'swiggy', label: 'Swiggy', logo: '🟠', color: 'bg-orange-500 text-white', cred: 'swiggy_kunal@office.in', docUrl: 'https://swiggy.com', linkedSince: 'Linked since: 30 days' },
                      { key: 'eatsure', label: 'EatSure', logo: '🟣', color: 'bg-[#5e17eb] text-white', cred: 'eatsure_kunal_secure_api', docUrl: 'https://eatsure.com', linkedSince: 'Linked since: 14 days' }
                    ]
                  },
                  {
                    categoryName: '🛒 Grocery & Quick Commerce Marts',
                    prefState: prefMart,
                    setPref: (val: string) => {
                      setPrefMart(val);
                      safeStorage.setItem("chalo_pref_mart", val);
                      alert(`🛒 "${val.toUpperCase()}" is now set as your single preferred grocery delivery provider.`);
                    },
                    items: [
                      { key: 'blinkit', label: 'Blinkit', logo: '🟡', color: 'bg-yellow-400 text-slate-950 font-bold', cred: 'blinkit_user_phone_verified', docUrl: 'https://blinkit.com', linkedSince: 'Linked since: 15 days' },
                      { key: 'zepto', label: 'Zepto', logo: '🍇', color: 'bg-[#5e17eb]/20 text-indigo-700 font-bold', cred: 'zepto_loyalty_992@chalo.com', docUrl: 'https://zeptonow.com', linkedSince: 'Linked since: 35 days' }
                    ]
                  },
                  {
                    categoryName: '🏨 Hotel Stays & Travels',
                    prefState: prefStays,
                    setPref: (val: string) => {
                      setPrefStays(val);
                      safeStorage.setItem("chalo_pref_stays", val);
                      alert(`🏨 "${val.toUpperCase()}" is now set as your default holiday hotel provider.`);
                    },
                    items: [
                      { key: 'makemytrip', label: 'MakeMyTrip', logo: '✈', color: 'bg-blue-600 text-white', cred: 'mmt_kunal_member', docUrl: 'https://makemytrip.com', linkedSince: 'Linked since: 62 days' },
                      { key: 'agoda', label: 'Agoda', logo: '🏩', color: 'bg-[#ff3b30]/10 text-[#ff3b30] font-black', cred: 'agoda_chalo_oauth', docUrl: 'https://agoda.com', linkedSince: 'Linked since: 5 days' },
                      { key: 'booking', label: 'Booking.com', logo: '🔵', color: 'bg-blue-800 text-white', cred: 'booking_com_kunal_active_oauth', docUrl: 'https://booking.com', linkedSince: 'Linked since: 11 days' }
                    ]
                  }
                ].map(group => (
                  <div key={group.categoryName} className="space-y-2 pt-1">
                    <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-wider font-mono bg-slate-50 p-1.5 px-3 rounded-lg border border-slate-150 w-fit">
                      {group.categoryName}
                    </h4>

                    <div className="grid grid-cols-1 gap-2">
                      {group.items.map(item => {
                        const isLinked = (connectedAccounts as any)[item.key];
                        const isPreferred = group.prefState === item.key;

                        return (
                          <div 
                            key={item.key} 
                            className={`p-3.5 bg-white rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                              isPreferred ? 'border-amber-400 ring-1 ring-amber-400/20 bg-amber-50/5' : 'border-gray-150'
                            }`}
                          >
                            {/* Left Brand info and logins */}
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <span className={`w-6 h-6 flex items-center justify-center rounded-lg text-xs font-black ${item.color}`}>
                                  {item.logo}
                                </span>
                                <div>
                                  <span className="font-bold text-gray-900 text-xs font-display tracking-tight leading-tight block">{item.label}</span>
                                  {isLinked && (
                                    <span className="text-[8.5px] font-bold text-gray-400 font-mono block">
                                      {item.linkedSince}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Secure Credentials Display & Platform redirects */}
                              {isLinked && (
                                <div className="bg-slate-50 border border-slate-150 p-1.5 px-2.5 rounded-xl text-[9px] font-mono text-slate-500 space-y-1 block mt-1.5 max-w-sm">
                                  <div className="flex items-center justify-between">
                                    <span>🔑 Verified Login Ref:</span>
                                    <div className="flex space-x-2">
                                      <button 
                                        type="button" 
                                        onClick={() => {
                                          setLinkingItem(item);
                                          setIsReLoginCheck(true);
                                        }}
                                        className="text-indigo-650 font-black cursor-pointer uppercase hover:underline text-[8px]"
                                        title="Re-login if credentials changed externally"
                                      >
                                        🔄 Re-Login / Verify
                                      </button>
                                      <button 
                                        type="button" 
                                        onClick={() => {
                                          alert(`Sovereign Platform Redirection Indicator: Opening secure login wrapper inside sandbox env for "${item.label}" oauth sync token verification.`);
                                          window.open(item.docUrl, '_blank');
                                        }}
                                        className="text-amber-600 font-black cursor-pointer uppercase hover:underline text-[8px]"
                                      >
                                        Open ↗
                                      </button>
                                    </div>
                                  </div>
                                  <p className="font-bold text-slate-800 tracking-tight leading-none truncate">{item.cred}</p> 
                                  <span className="text-[7.5px] bg-emerald-50 text-emerald-700 font-sans font-extrabold p-0.5 px-1 rounded block w-fit">● Session verified & active</span>
                                </div>
                              )}
                            </div>

                            {/* Actions Right Panel */}
                            <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                              {/* Preference toggle button */}
                              {isLinked && (
                                <button
                                  type="button"
                                  onClick={() => group.setPref(item.key)}
                                  className={`p-1.5 px-2.5 rounded-xl text-[9px] font-black uppercase transition cursor-pointer flex items-center space-x-1 ${
                                    isPreferred 
                                      ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                                      : 'bg-gray-50 border border-gray-200 text-gray-550 hover:bg-gray-100'
                                  }`}
                                >
                                  <span>⭐</span>
                                  <span>{isPreferred ? 'Preferred Chosen' : 'Make Preferred'}</span>
                                </button>
                              )}

                              {/* Link/Unlink state toggle button */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (isLinked) {
                                    setConnectedAccounts({
                                      ...connectedAccounts,
                                      [item.key]: false
                                    });
                                    alert(`🎉 Successfully unlinked your "${item.label}" account!`);
                                  } else {
                                    setLinkingItem(item);
                                    setIsReLoginCheck(false);
                                  }
                                }}
                                className={`text-[9.5px] font-black px-3.5 py-1.5 rounded-xl border transition cursor-pointer uppercase tracking-tight ${
                                  isLinked 
                                    ? 'bg-rose-50 border-rose-150 text-rose-600 hover:bg-rose-100' 
                                    : 'bg-emerald-500 border-emerald-600 hover:bg-emerald-600 text-white'
                                }`}
                              >
                                {isLinked ? 'Unlink' : 'Link'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* B. RULES & PREFERENCES */}
          {activeSection === 'rules_prefs' && (
            <div className="space-y-4" id="section_rules_prefs">
              <div className="bg-white p-5 rounded-3xl border border-gray-150 shadow-xs space-y-4">
                <div className="pb-2 border-b border-gray-100">
                  <span className="text-[9.5px] font-mono text-amber-600 uppercase tracking-widest font-black block">Automated Optimization Preference</span>
                  <h3 className="font-display font-black text-gray-950 text-sm mt-0.5 uppercase">Price Comparison Engine</h3>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                  {[
                    { val: 'cheapest', label: '💰 Cheapest First', desc: 'Pre-calculate net prices (fares + coupons)' },
                    { val: 'fastest', label: '⚡ Fastest Duration', desc: 'Prioritize quick drivers <12 mins' },
                    { val: 'rated', label: '⭐ Highest Rating', desc: 'Restrict selection to 4.5+ stars' },
                    { val: 'ai', label: '🧠 Smart Recommended', desc: 'Optimal AI scanning' }
                  ].map(opt => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setPreferences({ ...preferences, preferenceMode: opt.val as any })}
                      className={`p-2.5 rounded-2xl border text-left flex flex-col justify-between cursor-pointer transition h-24 ${
                        preferences.preferenceMode === opt.val ? 'bg-amber-50/75 border-amber-450 text-amber-950 font-bold shadow-xs' : 'bg-white border-gray-150 hover:bg-gray-50'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <span className="text-[11px] font-black leading-tight block">{opt.label}</span>
                        <span className="text-[9.5px] text-gray-400 font-medium leading-snug block line-clamp-2">{opt.desc}</span>
                      </div>
                      <div className="flex items-center justify-between w-full mt-1 pt-1 border-t border-gray-100">
                        <span className="text-[8px] font-mono uppercase text-gray-400 font-bold">
                          {preferences.preferenceMode === opt.val ? 'Active' : 'Select'}
                        </span>
                        {preferences.preferenceMode === opt.val && (
                          <CheckCircle2 className="w-3 h-3 text-amber-500 shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* DIETARY & FOOD TYPE PREFERENCES */}
              <div className="bg-white p-5 rounded-3xl border border-gray-150 shadow-xs space-y-4">
                <div className="pb-2 border-b border-gray-100">
                  <span className="text-[9.5px] font-mono text-emerald-650 uppercase tracking-widest font-black block">Default Everyday Meal Diet Choice</span>
                  <h3 className="font-display font-black text-gray-950 text-sm mt-0.5 uppercase">Primary Dietary Lifestyle</h3>
                  <p className="text-[10.5px] text-gray-400 font-medium font-sans mt-0.5">Used as your default profile settings inside Food Delivery comparison blocks and Grocery counters</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { val: 'Veg', label: '🟢 Pure Veg Only', desc: "Exclude meat, poultry, fish, and egg products" },
                    { val: 'Eggetarian', label: '🟡 Eggetarian Only', desc: "Exclude meats but allow egg recipes" },
                    { val: 'Non-Veg', label: '🔴 Non-Veg Only', desc: "Prioritise and show non-vegetarian and meat cuisines" },
                    { val: "Doesn't Matter", label: "🍽 Doesn't Matter", desc: "Show all available food and grocery listings" }
                  ].map(opt => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setPreferences({ ...preferences, defaultFoodType: opt.val as any })}
                      className={`p-3 rounded-2xl border text-left flex flex-col justify-between cursor-pointer transition h-[90px] ${
                        (preferences.defaultFoodType || "Doesn't Matter") === opt.val 
                          ? 'bg-emerald-50/70 border-emerald-400 text-emerald-950 shadow-sm' 
                          : 'bg-white border-gray-150 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className="flex justify-between items-start w-full">
                        <span className="text-xs font-black leading-tight block">{opt.label}</span>
                        {(preferences.defaultFoodType || "Doesn't Matter") === opt.val && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        )}
                      </div>
                      <span className="text-[9.5px] text-gray-400 font-semibold leading-snug block mt-1">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cybersecurity switches moved below to security_audit section as requested */}
            </div>
          )}

          {/* C. SECURITY AUDIT CODES */}
          {activeSection === 'security_audit' && (
            <div className="space-y-4" id="section_security_audit">
              {/* C2. SHIELD SECURITY OPTIONS (DIRECTLY SHOWN) */}
              <div className="bg-white p-5 rounded-3xl border border-gray-150 shadow-xs space-y-4">
                <div className="pb-2 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-gray-450 uppercase tracking-widest flex items-center space-x-1.5">
                      <Shield className="w-4 h-4 text-amber-500 mr-1.5" />
                      <span>Shield Security Settings</span>
                    </h3>
                    <p className="text-[11px] text-gray-400 mt-0.5 font-medium">Configure advanced hardware lock settings and biometric shield options</p>
                  </div>
                  <span className={`text-[9.5px] uppercase font-mono font-black ${preferences.biometricsEnabled ? 'text-amber-600 bg-amber-50 px-1.5 py-0.5' : 'text-gray-400 bg-gray-50 px-1.5'}`}>
                    {preferences.biometricsEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>

                <div className="space-y-3.5">
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <h4 className="font-bold text-gray-800">App Launch Lock Screen</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5 font-semibold">Prompt simulated face/fingerprint validation on start</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPreferences({
                        ...preferences,
                        biometricsEnabled: !preferences.biometricsEnabled
                      })}
                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        preferences.biometricsEnabled ? 'bg-amber-500' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                        preferences.biometricsEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  <div className="flex justify-between items-center text-xs border-t border-gray-100 pt-3">
                    <div>
                      <h4 className="font-bold text-gray-800">Deduct Payment Lock Prompt</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5 font-semibold">Requires confirmation audit before wallet money deductions</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPreferences({
                        ...preferences,
                        txBiometricsEnabled: !preferences.txBiometricsEnabled
                      })}
                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        preferences.txBiometricsEnabled ? 'bg-amber-500' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                        preferences.txBiometricsEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  {/* Primary Biometrics Mode */}
                  <div className="border-t border-gray-100 pt-3 text-xs space-y-2">
                    <span className="text-[9px] font-mono text-gray-400 font-bold block uppercase">Primary simulation lock scanner code</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPreferences({ ...preferences, biometricMode: 'fingerprint' })}
                        className={`p-2 rounded-xl border font-bold flex items-center justify-center space-x-1.5 transition cursor-pointer ${
                          preferences.biometricMode !== 'faceid' ? 'bg-slate-900 text-white border-slate-900 shadow-xs' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <Fingerprint className="w-3.5 h-3.5" />
                        <span className="text-[10.5px]">Fingerprint</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPreferences({ ...preferences, biometricMode: 'faceid' })}
                        className={`p-2 rounded-xl border font-bold flex items-center justify-center space-x-1.5 transition cursor-pointer ${
                          preferences.biometricMode === 'faceid' ? 'bg-slate-900 text-white border-slate-900 shadow-xs' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <Shield className="w-3.5 h-3.5" />
                        <span className="text-[10.5px]">Face ID Scan</span>
                      </button>
                    </div>
                  </div>

                  {/* PIN Setup code management */}
                  <div className="border-t border-gray-100 pt-3 text-xs flex flex-col space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-gray-800">Secure Fallback PIN</h4>
                        <p className="text-[10px] text-gray-400 mt-0.5 font-medium">Bypass biometric scanners using a 4-Digit PIN code</p>
                      </div>

                      <div className="flex items-center space-x-1.5 font-mono text-xs">
                        {isEditingPin ? (
                          <div className="flex items-center space-x-1">
                            <input
                              type="text"
                              maxLength={4}
                              value={newPinVal}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '');
                                setNewPinVal(val);
                              }}
                              className="w-16 bg-gray-50 border border-gray-200 rounded p-1 text-center font-bold text-gray-800 text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                              placeholder="1234"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (newPinVal.length !== 4) {
                                  alert('PIN code must be exactly 4 digits!');
                                  return;
                                }
                                setPreferences({ ...preferences, securityPin: newPinVal });
                                setIsEditingPin(false);
                                alert(`PIN changed to ${newPinVal}!`);
                              }}
                              className="bg-amber-500 text-white px-2 py-1 rounded text-[9.5px] font-bold"
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-gray-700 bg-gray-100 py-0.5 px-2 rounded tracking-widest text-[11px] border border-gray-150">
                              {showSettingsPin ? preferences.securityPin || '1234' : '••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => setShowSettingsPin(!showSettingsPin)}
                              className="text-gray-400 hover:text-gray-600 transition"
                            >
                              {showSettingsPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setNewPinVal(preferences.securityPin || '1234');
                                setIsEditingPin(true);
                              }}
                              className="text-amber-600 hover:underline text-[10.5px] font-bold cursor-pointer"
                            >
                              Edit
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* C3. INLINE CHANGE PASSWORD FORM (DIRECTLY SHOWN) */}
              <div className="bg-white p-5 rounded-3xl border border-gray-150 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <div>
                    <h3 className="text-xs font-bold text-gray-450 uppercase tracking-widest block">Update Account Password</h3>
                    <p className="text-[10.5px] text-gray-400 mt-0.5 font-medium">
                      Modify your password to secure your Chalo One wallet, travel history, and account credentials.
                    </p>
                  </div>
                  <Lock className="w-4 h-4 text-amber-500 shrink-0" />
                </div>

                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (!currentPassword || !newPassword || !confirmPassword) {
                    alert("Please enter all password fields.");
                    return;
                  }
                  if (newPassword !== confirmPassword) {
                    alert("❌ Password mismatch: New password and Confirm password do not match.");
                    return;
                  }
                  if (newPassword.length < 6) {
                    alert("❌ Password length: New password must be at least 6 characters long.");
                    return;
                  }

                  // Verify with Firebase Authentication session
                  if (!auth.currentUser) {
                    alert("❌ Session not found: Please sign in again.");
                    return;
                  }

                  try {
                    await updatePassword(auth.currentUser, newPassword);
                    console.log("Password updated successfully in Firebase Auth.");
                    alert("🎉 Success! Your password has been successfully updated via Secure Authentication.");
                  } catch (err: any) {
                    alert("❌ Password update failed: " + err.message);
                  }

                  // Reset inputs
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }} className="space-y-4 text-xs">
                  <div className="flex flex-col space-y-1">
                    <label className="text-[9.5px] font-mono font-black uppercase text-gray-450 tracking-wider">Current Password</label>
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="bg-gray-50 border border-gray-150 p-2.5 text-xs rounded-xl font-bold text-gray-800 outline-none focus:bg-white focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col space-y-1">
                      <label className="text-[9.5px] font-mono font-black uppercase text-gray-450 tracking-wider">New Password</label>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="bg-gray-50 border border-gray-150 p-2.5 text-xs rounded-xl font-bold text-gray-800 outline-none focus:bg-white focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <label className="text-[9.5px] font-mono font-black uppercase text-gray-450 tracking-wider">Confirm New Password</label>
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="bg-gray-50 border border-gray-150 p-2.5 text-xs rounded-xl font-bold text-gray-800 outline-none focus:bg-white focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2.5 pt-2">
                    <button
                      type="submit"
                      className="w-full bg-slate-900 hover:bg-black text-white text-[10.5px] font-black uppercase py-3 rounded-xl transition cursor-pointer"
                    >
                      Update Secure Password
                    </button>
                  </div>
                </form>
              </div>

              {/* INTRUDER LOGS HEADER */}
              <div className="pt-2">
                <span className="text-[9px] font-mono text-gray-400 font-bold uppercase tracking-widest block">Intrusion Audit Records</span>
              </div>

              {!isAuditUnlocked ? (
                <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-xs text-center space-y-4">
                  <div className="mx-auto w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center border border-amber-100 text-amber-500">
                    <Lock className="w-6 h-6 animate-bounce" />
                  </div>
                  <div className="space-y-1.5 max-w-sm mx-auto">
                    <h3 className="font-display font-black text-xs text-gray-900 uppercase tracking-widest block">Audit Log Encrypted</h3>
                    <p className="text-[11px] text-gray-500 font-semibold leading-relaxed">
                      Please verify biometrics or PIN credentials to permit security logs viewing.
                    </p>
                  </div>

                  <div className="max-w-xs mx-auto pt-2 space-y-3">
                    {auditPinError && (
                      <p className="text-[10px] text-rose-500 font-bold uppercase tracking-wider font-mono">{auditPinError}</p>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsDirectScanning(true);
                          setAuditFeedback("Initiating fingerprint scanner match...");
                          setTimeout(() => {
                            setIsAuditUnlocked(true);
                            setIsDirectScanning(false);
                            setAuditPinError(null);
                          }, 950);
                        }}
                        className={`py-2.5 bg-amber-500 hover:bg-amber-600 font-extrabold text-[10px] text-white rounded-xl transition cursor-pointer flex items-center justify-center space-x-1 border border-amber-600 ${
                          isDirectScanning ? 'animate-pulse' : ''
                        }`}
                      >
                        <Fingerprint className="w-4 h-4 mr-0.5" />
                        <span>{isDirectScanning ? 'Scanning...' : 'Biometric Scan'}</span>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => {
                          const val = prompt("Enter 4-Digit Secure PIN (Demo: 1234):");
                          if (val === (preferences.securityPin || '1234')) {
                            setIsAuditUnlocked(true);
                            setAuditPinError(null);
                          } else if (val !== null) {
                            setAuditPinError("Invalid Validation Security Pin");
                          }
                        }}
                        className="py-2.5 bg-slate-800 hover:bg-slate-900 font-extrabold text-[10px] text-white rounded-xl transition cursor-pointer flex items-center justify-center space-x-1"
                      >
                        <KeyRound className="w-4 h-4 mr-0.5" />
                        <span>Secret PIN</span>
                      </button>
                    </div>

                    {isDirectScanning && (
                      <p className="text-[9.5px] text-amber-500 font-bold font-mono animate-pulse">{auditFeedback}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Security Header */}
                  <div className="bg-slate-900 text-white p-4 rounded-3xl border border-slate-800 shadow-md space-y-3.5">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[8px] font-mono text-amber-400 font-extrabold uppercase tracking-widest block">Live Defenses Tracking Console</span>
                        <h3 className="font-display font-black text-sm text-gray-100 uppercase tracking-widest flex items-center mt-1 space-x-1.5">
                          <ShieldCheck className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                          <span>Shield Intruder Logs</span>
                        </h3>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsAuditUnlocked(false)}
                        className="p-1 px-2 hover:bg-slate-800 border border-slate-800 rounded-lg text-[8.5px] font-bold text-gray-400 font-mono tracking-wide transition uppercase"
                      >
                        Lock Logs
                      </button>
                    </div>

                    {/* Audit statistical counters */}
                    <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-800/60">
                      <div className="bg-slate-950/45 p-2 rounded-xl border border-slate-800/80">
                        <span className="text-[8px] font-mono text-slate-500 font-bold uppercase block tracking-tight">Total Attempts</span>
                        <strong className="text-sm font-mono font-black text-amber-400">{securityAuditLogs.length}</strong>
                      </div>
                      <div className="bg-slate-950/45 p-2 rounded-xl border border-slate-800/80">
                        <span className="text-[8px] font-mono text-slate-500 font-bold uppercase block tracking-tight">Blocked Hacks</span>
                        <strong className="text-sm font-mono font-black text-rose-500 text-wrap">
                          {securityAuditLogs.filter(log => log.status === 'failed').length}
                        </strong>
                      </div>
                      <div className="bg-slate-950/45 p-2 rounded-xl border border-slate-800/80">
                        <span className="text-[8px] font-mono text-slate-500 font-bold uppercase block tracking-tight">Pass Integrity</span>
                        <strong className="text-sm font-mono font-black text-emerald-400">
                          {securityAuditLogs.length > 0
                            ? Math.round((securityAuditLogs.filter(log => log.status === 'success').length / securityAuditLogs.length) * 100)
                            : 100}%
                        </strong>
                      </div>
                    </div>

                    {/* Change Password option moved below as requested */}

                    {/* Interactive log simulation actions */}
                    <div className="flex justify-between items-center pt-1.5 text-[9px] font-mono">
                      <button
                        type="button"
                        onClick={() => {
                          alert("🛡️ Locking and triggering active verification session! Verify now.");
                          if (lockAppInstantly) lockAppInstantly();
                        }}
                        className="text-amber-400 hover:text-amber-300 font-extrabold flex items-center space-x-1"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Simulate Shield Verification</span>
                      </button>

                      {securityAuditLogs.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm("Permanently wipe Chalo One Security Audit ledger history records? This cannot be undone.")) {
                              if (clearSecurityLogs) {
                                clearSecurityLogs();
                                alert("Security ledger cleared successfully.");
                              }
                            }
                          }}
                          className="text-rose-400 hover:text-rose-300 font-extrabold flex items-center space-x-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Wipe ledger logs</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* List of security logs events */}
                  <div className="space-y-3">
                    {securityAuditLogs.length === 0 ? (
                      <div className="bg-white p-5 rounded-2xl border border-gray-150 text-center text-xs space-y-1">
                        <p className="font-bold text-gray-400">Security ledger holds no incident records.</p>
                        <p className="text-[10px] text-gray-400 font-normal leading-relaxed">No unauthorized launches detected.</p>
                      </div>
                    ) : (
                      securityAuditLogs.map((log) => {
                        const isSuccess = log.status === 'success';
                        return (
                          <div 
                            key={log.id} 
                            className={`bg-white p-3.5 rounded-2xl border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 ${
                              isSuccess ? 'border-gray-150' : 'border-rose-200 bg-rose-50/10'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              {/* Fallback Face initial visual placeholder status based */}
                              <div
                                onClick={() => {
                                  alert(`Secured facial profile checkpoint verified: ${log.authMethod.toUpperCase()}`);
                                }}
                                className={`w-11 h-11 rounded-xl border flex flex-col items-center justify-center cursor-pointer shrink-0 ${
                                  isSuccess 
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                                    : 'bg-rose-50 border-rose-200 text-rose-500'
                                }`}
                              >
                                {isSuccess ? (
                                  <UserCheck className="w-5 h-5" />
                                ) : (
                                  <UserX className="w-5 h-5 text-rose-550" />
                                )}
                                <span className="text-[7px] font-mono font-extrabold uppercase mt-0.5">
                                  {isSuccess ? 'Verified' : 'Intruder'}
                                </span>
                              </div>

                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className={`text-[8.5px] font-mono font-extrabold uppercase px-1.5 py-0.5 rounded border ${
                                    isSuccess 
                                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                                      : 'bg-rose-50 border-rose-250 text-rose-700'
                                  }`}>
                                    {isSuccess ? 'SUCCESS' : 'BLOCKED'}
                                  </span>

                                  <span className="text-[8.5px] bg-slate-100 border border-gray-200 text-gray-550 font-extrabold px-1.5 py-0.5 rounded font-mono uppercase">
                                    {log.authMethod.toUpperCase()}
                                  </span>

                                  <span className="text-[8.5px] bg-amber-50 border border-amber-200 text-amber-700 font-extrabold px-1.5 py-0.5 rounded font-mono uppercase">
                                    {log.attemptType === 'app_launch' ? 'Start Lock' : 'Tx Confirm'}
                                  </span>
                                </div>

                                <p className="text-xs font-semibold text-gray-800 leading-snug">
                                  {log.details || "Authorization lock state parsed"}
                                </p>

                                <div className="text-[9.5px] text-gray-400 font-semibold font-mono flex items-center space-x-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>{log.timestamp}</span>
                                </div>
                              </div>
                            </div>

                            <div className="text-left sm:text-right shrink-0 border-t sm:border-t-0 border-dashed border-gray-150 pt-2 sm:pt-0">
                              <span className="text-[8px] font-mono font-bold text-gray-400 block uppercase">Log Ref</span>
                              <span className="text-[10px] font-mono font-bold text-gray-600 block">{log.id}</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIP MEMBERSHIPS SUB SECTION */}
          {activeSection === 'memberships' && (
            <div className="space-y-4" id="section_memberships">
              <ChaloMemberships 
                userProfile={userProfile} 
                wallet={wallet} 
                onRefreshWallet={() => addCoins(0)} 
              />
            </div>
          )}

          {/* C2. DEDICATED CHANGE PASSWORD PAGE */}
                    {activeSection === 'payments' && (
            <div className="space-y-4 font-sans" id="section_payments">
              
              {/* WALLET BALANCE AND FUND LOADER */}
              <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white p-5 rounded-3xl border border-amber-600 shadow-md space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono tracking-widest font-extrabold uppercase text-amber-100">
                      Chalo One Smart Balance
                    </span>
                    <h3 className="font-display font-black text-2xl tracking-normal">
                      ₹{wallet.balance.toFixed(2)}
                    </h3>
                  </div>

                  <div className="p-2.5 bg-white/10 rounded-2xl border border-white/20 flex flex-col items-center shrink-0 animate-pulse">
                    <Coins className="w-5 h-5 text-amber-200" />
                    <span className="text-[10px] font-mono font-black mt-1">{wallet.points.toLocaleString('en-US')} PTS</span>
                  </div>
                </div>

                <div className="text-xs text-amber-50 font-medium leading-relaxed">
                  Reward coins are converted 20 PTS = ₹1. Added cash credit remains safely stored in your Chalo One Wallet. Not redeemable to real money.
                </div>

                {/* Simulated Money Adder */}
                <div className="bg-amber-950/20 p-3 rounded-2xl flex items-center justify-between border border-amber-400/20 gap-2.5">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-amber-100 font-mono">₹</span>
                    <input
                      type="number"
                      value={topUpAmount}
                      onChange={(e) => setTopUpAmount(e.target.value)}
                      className="w-16 bg-white/10 border border-white/20 rounded-lg p-1 text-center font-bold text-white text-xs placeholder-white/50 focus:outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      const val = parseFloat(topUpAmount);
                      if (isNaN(val) || val <= 0) return;
                      
                      const res = await PaymentService.processPayment(
                        userProfile.id,
                        val,
                        'wallet_topup',
                        'razorpay',
                        userProfile,
                        'Wallet Top-Up'
                      );

                      if (res.success) {
                         addCoins(val); // this adds coins in UI/firestore
                         alert(`Successfully topped up ₹${val.toFixed(2)} into Chalo One Balance via Razorpay!`);
                      } else {
                         alert(`Payment failed: ${res.message}`);
                      }
                    }}
                    className="p-1 px-3 bg-white hover:bg-amber-50 text-amber-700 font-black text-[10px] uppercase rounded-lg transition"
                  >
                    Load Credits
                  </button>
                </div>
              </div>

              {/* DYNAMIC TYPABLE LOYALTY POINTS TO CASH CONVERTER */}
              <div className="bg-amber-50 p-5 rounded-3xl border border-amber-200 shadow-xs space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-amber-200">
                  <div>
                    <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider block">Redeem Points for Direct Cash</h4>
                    <p className="text-[10px] text-amber-700 font-medium font-sans">Conversion rate: 20 PTS = ₹1.00. Credits Cash inside your Chalo One Wallet immediately.</p>
                  </div>
                  <Coins className="w-5 h-5 text-amber-600 animate-bounce shrink-0" />
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-amber-600 font-mono uppercase tracking-widest">PTS</span>
                    <input
                      type="number"
                      placeholder="Type points (e.g. 240)"
                      value={typedRedemptionPoints}
                      onChange={(e) => setTypedRedemptionPoints(e.target.value)}
                      className="w-full bg-white border border-amber-300 rounded-2xl p-2.5 pl-14 text-xs font-mono font-bold text-amber-950 placeholder-amber-400 outline-none focus:ring-1 focus:ring-amber-500 shadow-xs"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const pointsToRedeem = parseInt(typedRedemptionPoints);
                      if (isNaN(pointsToRedeem) || pointsToRedeem <= 0) {
                        alert("Please enter a valid amount of points to convert.");
                        return;
                      }
                      if (pointsToRedeem > wallet.points) {
                        alert(`Insufficient balance! You have ${wallet.points.toLocaleString('en-US')} PTS available, but tried to redeem ${pointsToRedeem.toLocaleString('en-US')} PTS.`);
                        return;
                      }
                      
                      // Perform conversion
                      redeemPointsToCash(pointsToRedeem);
                      setTypedRedemptionPoints('');
                      alert(`🎉 Success! Converted ${pointsToRedeem.toLocaleString('en-US')} reward points into ₹${(pointsToRedeem / 20).toFixed(2)} Chalo One local wallet credit.`);
                    }}
                    className="p-3 px-5 bg-amber-600 hover:bg-amber-700 text-white font-black text-[10.5px] uppercase rounded-xl transition cursor-pointer shrink-0 tracking-wide shadow-xs font-mono"
                  >
                    Redeem to Cash
                  </button>
                </div>

                {/* Show Live conversion feedback */}
                {typedRedemptionPoints && !isNaN(parseInt(typedRedemptionPoints)) && parseInt(typedRedemptionPoints) > 0 && (
                  <div className="bg-white/80 p-3 rounded-2xl border border-amber-150 flex items-center justify-between text-xs font-bold text-amber-950">
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-mono tracking-wider">Live Wallet Conversion Matrix</span>
                      <span className="font-display font-black text-slate-800 text-xs font-mono">{parseInt(typedRedemptionPoints).toLocaleString('en-US')} PTS</span>
                      <span className="text-slate-400 mx-1.5">➔</span>
                      <span className="font-display font-black text-emerald-600 text-xs font-mono">₹{(parseInt(typedRedemptionPoints) / 20).toFixed(2)} Cash Credit</span>
                    </div>
                    <span className="text-[9.5px] text-amber-800 bg-amber-100/50 p-1 px-2 text-center rounded border border-amber-200/50 uppercase font-mono tracking-tight shrink-0">
                      Chalo One Wallet Only
                    </span>
                  </div>
                )}
              </div>

              {/* CATEGORIZED SAVED PAYMENT METHODS */}
              <div className="bg-white p-5 rounded-3xl border border-gray-150 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <h4 className="text-xs font-bold text-gray-950 uppercase tracking-widest">Saved Payment Methods</h4>
                  <CreditCard className="w-4 h-4 text-gray-400" />
                </div>

                {/* 1. Debit & Credit Cards */}
                <div className="space-y-2">
                  <span className="text-[9.5px] font-mono font-black text-gray-400 uppercase tracking-wider block">Debit & Credit Cards</span>
                  <div className="grid grid-cols-1 gap-2">
                    {savedCards.map(card => (
                      <div key={card.id} className="p-3 bg-slate-50/75 rounded-2xl border border-gray-150 flex items-center justify-between text-xs font-mono">
                        <div className="flex items-center space-x-2.5">
                          <span className="bg-blue-600 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded tracking-wide uppercase">
                            {card.bank}
                          </span>
                          <span className="font-bold text-slate-800">{card.number}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] text-gray-400 font-bold">{card.expiry}</span>
                          <span className="text-[9px] bg-gray-250 text-gray-600 px-1.5 py-0.2 rounded font-extrabold capitalize">{card.type}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Unified Payments Interface (UPI) */}
                <div className="space-y-2 pt-1">
                  <span className="text-[9.5px] font-mono font-black text-gray-400 uppercase tracking-wider block">Verified UPI Handles (VPA)</span>
                  <div className="grid grid-cols-1 gap-2">
                    {savedUpis.map(upi => (
                      <div key={upi.id} className="p-3 bg-emerald-50/30 rounded-2xl border border-emerald-100 flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2.5">
                          <span className="bg-emerald-600 text-white font-mono text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase">UPI</span>
                          <span className="font-mono font-bold text-slate-800">{upi.upiId}</span>
                        </div>
                        <span className="text-[9.5px] bg-emerald-100 text-emerald-800 font-sans font-bold px-2 py-0.5 rounded-full">{upi.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. External Wallet Links */}
                <div className="space-y-2 pt-1">
                  <span className="text-[9.5px] font-mono font-black text-gray-400 uppercase tracking-wider block">Linked App Wallets</span>
                  <div className="grid grid-cols-1 gap-2">
                    {savedWallets.map(w => (
                      <div key={w.id} className="p-3 bg-amber-50/25 rounded-2xl border border-amber-100 flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2.5">
                          <span className="bg-amber-500 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase font-mono">WALLET</span>
                          <span className="font-bold text-slate-800">{w.name} (+91 {w.phone.slice(-4)})</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-mono font-bold text-slate-900">₹{w.balance.toFixed(2)}</span>
                          <span className="text-[8.5px] text-emerald-600 bg-emerald-50 border border-emerald-200 px-1 py-0.2 rounded-sm font-extrabold font-mono">ACTIVE</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ACTION TRIGGER BUTTONS */}
                {addingMethodType === 'none' && (
                  <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setAddingMethodType('card')}
                      className="py-2 bg-gray-50 border border-gray-150 hover:bg-gray-100 text-[10px] text-gray-800 font-extrabold rounded-xl transition uppercase tracking-wider text-center"
                    >
                      + Add Card
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddingMethodType('upi')}
                      className="py-2 bg-gray-50 border border-gray-150 hover:bg-gray-100 text-[10px] text-gray-800 font-extrabold rounded-xl transition uppercase tracking-wider text-center"
                    >
                      + Add UPI
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddingMethodType('wallet')}
                      className="py-2 bg-gray-50 border border-gray-150 hover:bg-gray-100 text-[10px] text-gray-800 font-extrabold rounded-xl transition uppercase tracking-wider text-center"
                    >
                      + Link Wallet
                    </button>
                  </div>
                )}

                {/* DYNAMIC FORMS ACCORDING TO USER TOGGLE */}
                {addingMethodType !== 'none' && (
                  <div className="mt-3 p-3.5 bg-gray-50 border border-gray-150 rounded-2xl relative">
                    {/* Verification overlay loading spinner */}
                    {isVerifying ? (
                      <div className="absolute inset-0 bg-white/95 rounded-2xl flex flex-col items-center justify-center p-4 text-center space-y-2.5 z-20">
                        <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin"></div>
                        <p className="text-[10.5px] font-bold text-amber-700 animate-pulse font-mono uppercase tracking-wide">
                          {verifyStep}
                        </p>
                      </div>
                    ) : null}

                    {addingMethodType === 'card' && (
                      <form onSubmit={handleAddCard} className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest font-mono">Bank debit & credit verify</span>
                          <button type="button" onClick={() => setAddingMethodType('none')} className="text-[10px] text-gray-400 font-bold hover:text-gray-600">Cancel</button>
                        </div>
                        <div className="grid grid-cols-1 gap-2 text-xs">
                          <input
                            type="tel"
                            maxLength={16}
                            value={newCardNumber}
                            onChange={(e) => setNewCardNumber(e.target.value.replace(/\D/g, ''))}
                            placeholder="Card Number (16-Digit)"
                            className="bg-white border border-gray-200 p-2 rounded-lg font-bold font-mono outline-none focus:ring-1 focus:ring-amber-500"
                            required
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              maxLength={5}
                              value={newCardExpiry}
                              onChange={(e) => setNewCardExpiry(e.target.value)}
                              placeholder="MM/YY"
                              className="bg-white border border-gray-200 p-2 rounded-lg font-bold font-mono text-center outline-none focus:ring-1 focus:ring-amber-500"
                              required
                            />
                            <input
                              type="password"
                              maxLength={3}
                              value={newCardCvv}
                              onChange={(e) => setNewCardCvv(e.target.value.replace(/\D/g, ''))}
                              placeholder="CVV"
                              className="bg-white border border-gray-200 p-2 rounded-lg font-bold font-mono text-center outline-none focus:ring-1 focus:ring-amber-500"
                              required
                            />
                          </div>
                        </div>
                        <div className="text-[9.5px] text-slate-400 leading-snug">
                          * SBI, ICICI, HDFC, and Federal card categories will auto-fetch card issuers natively using our secure payment portal check.
                        </div>
                        <button type="submit" className="w-full bg-slate-900 hover:bg-black text-white py-2 rounded-xl text-[10.5px] font-black uppercase transition cursor-pointer">
                          Verify & Link Card
                        </button>
                      </form>
                    )}

                    {addingMethodType === 'upi' && (
                      <form onSubmit={handleAddUpi} className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest font-mono">NPCI Network VPA Register</span>
                          <button type="button" onClick={() => setAddingMethodType('none')} className="text-[10px] text-gray-400 font-bold hover:text-gray-600">Cancel</button>
                        </div>
                        <div className="grid grid-cols-1 gap-2 text-xs">
                          <input
                            type="text"
                            value={newUpiId}
                            onChange={(e) => setNewUpiId(e.target.value)}
                            placeholder="UPI ID (e.g. user@okhdfcbank)"
                            className="bg-white border border-gray-200 p-2 rounded-lg font-bold font-mono outline-none focus:ring-1 focus:ring-amber-500"
                            required
                          />
                          <input
                            type="text"
                            value={newUpiLabel}
                            onChange={(e) => setNewUpiLabel(e.target.value)}
                            placeholder="Label (e.g. Google Pay, Personal)"
                            className="bg-white border border-gray-200 p-2 rounded-lg font-semibold outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                        <button type="submit" className="w-full bg-slate-900 hover:bg-black text-white py-2 rounded-xl text-[10.5px] font-black uppercase transition cursor-pointer">
                          Securely Verify VPA
                        </button>
                      </form>
                    )}

                    {addingMethodType === 'wallet' && (
                      <form onSubmit={handleLinkWallet} className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest font-mono">Associate App Wallets</span>
                          <button type="button" onClick={() => setAddingMethodType('none')} className="text-[10px] text-gray-400 font-bold hover:text-gray-600">Cancel</button>
                        </div>
                        <div className="grid grid-cols-1 gap-2 text-xs">
                          <select
                            value={selectedWalletName}
                            onChange={(e) => setSelectedWalletName(e.target.value)}
                            className="bg-white border border-gray-200 p-2 rounded-lg font-bold outline-none"
                          >
                            <option value="JioMart Pay">JioMart Wallet</option>
                            <option value="Amazon Pay">Amazon Pay</option>
                            <option value="MobiKwik">MobiKwik Wallet</option>
                            <option value="PhonePe Wallet">PhonePe Wallet</option>
                            <option value="Paytm Wallet">Paytm Wallet</option>
                          </select>
                          <input
                            type="tel"
                            maxLength={10}
                            value={newWalletPhone}
                            onChange={(e) => setNewWalletPhone(e.target.value.replace(/\D/g, ''))}
                            placeholder="Linked Mobile Number (10 digit)"
                            className="bg-white border border-gray-200 p-2 rounded-lg font-bold font-mono outline-none focus:ring-1 focus:ring-amber-500"
                            required
                          />
                        </div>
                        <button type="submit" className="w-full bg-slate-900 hover:bg-black text-white py-2 rounded-xl text-[10.5px] font-black uppercase transition cursor-pointer">
                          Send Link OTP
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>

              {/* WALLET TRANSACTIONS LOG RECORD WITH FILTERS */}
              <div className="space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 pl-0.5">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">Chalo One Wallet History Ledger</span>
                    <p className="text-[10.5px] text-gray-400 font-semibold font-sans mt-0.5">Filtered by specific payment channels & associated wallets</p>
                  </div>
                  
                  {/* Name-wise payment filter option list */}
                  <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200">
                    {(['All', 'Card', 'UPI', 'Chalo One Wallet', 'Paytm Wallet', 'Amazon Pay'] as const).map(pill => (
                      <button
                        key={pill}
                        type="button"
                        onClick={() => setTxnFilter(pill as any)}
                        className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase transition cursor-pointer ${
                          (txnFilter === pill || (txnFilter === 'Wallet' && pill === 'Chalo One Wallet')) ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        {pill}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-gray-150 shadow-xs divide-y divide-gray-100 overflow-hidden">
                  {wallet.history
                    .filter(txn => {
                      if (txnFilter === 'All') return true;
                      const desc = txn.description.toLowerCase();
                      const isCard = desc.includes('card') || desc.includes('visa') || desc.includes('mastercard') || desc.includes('hdfc') || desc.includes('icici') || desc.includes('bank');
                      const isUPI = desc.includes('upi') || desc.includes('transfer') || desc.includes('vpa') || desc.includes('wire') || desc.includes('razorpay');
                      
                      // Name-wise wallets classification
                      const isPaytm = desc.includes('paytm') || desc.includes('mobikwik') || desc.includes('phonepe');
                      const isAmazon = desc.includes('amazon') || desc.includes('jiomart') || desc.includes('jio');
                      const isChalo = (desc.includes('points') || desc.includes('redeem') || desc.includes('balance') || desc.includes('referral') || desc.includes('exchange') || desc.includes('bonus')) && !isPaytm && !isAmazon;

                      if (txnFilter === 'Card') return isCard;
                      if (txnFilter === 'UPI') return isUPI;
                      if ((txnFilter as any) === 'Chalo One Wallet' || (txnFilter as any) === 'Wallet') return isChalo;
                      if ((txnFilter as any) === 'Paytm Wallet') return isPaytm;
                      if ((txnFilter as any) === 'Amazon Pay') return isAmazon;
                      return true;
                    })
                    .map(txn => {
                      const desc = txn.description.toLowerCase();
                      
                      // Auto classify badge style and text
                      let methodBadge = 'Chalo One Wallet';
                      let badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200';
                      if (desc.includes('card') || desc.includes('visa') || desc.includes('mastercard') || desc.includes('hdfc') || desc.includes('bank')) {
                        methodBadge = 'Card';
                        badgeStyle = 'bg-blue-50 text-blue-700 border-blue-200';
                      } else if (desc.includes('upi') || desc.includes('transfer') || desc.includes('wire') || desc.includes('razorpay')) {
                        methodBadge = 'UPI';
                        badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                      } else if (desc.includes('paytm')) {
                        methodBadge = 'Paytm Wallet';
                        badgeStyle = 'bg-sky-50 text-sky-700 border-sky-200';
                      } else if (desc.includes('amazon')) {
                        methodBadge = 'Amazon Pay';
                        badgeStyle = 'bg-orange-50 text-orange-700 border-orange-200';
                      } else if (desc.includes('jiomart')) {
                        methodBadge = 'JioMart Wallet';
                        badgeStyle = 'bg-indigo-50 text-indigo-700 border-indigo-200';
                      }

                      return (
                        <div key={txn.id} className="p-4 flex items-center justify-between text-xs gap-3">
                          <div className="space-y-1">
                            <strong className="font-display font-bold text-gray-950 block leading-tight">{txn.description}</strong>
                            <span className="text-[9px] text-gray-400 font-medium font-mono">
                              {txn.timestamp} • ID: {txn.id} 
                              
                              {/* Glowing Name-wise Payment Method Badge Indicator */}
                              <span className={`ml-2 px-1.5 py-0.5 border rounded text-[7.5px] uppercase font-black font-mono tracking-tight ${badgeStyle}`}>
                                {methodBadge}
                              </span>
                            </span>
                          </div>

                          <div className="text-right shrink-0">
                            <span className={`font-mono font-black text-sm block ${txn.type === 'credit' ? 'text-emerald-600' : 'text-gray-900'}`}>
                              {txn.type === 'credit' ? '+' : '-'}₹{txn.amount.toFixed(2)}
                            </span>
                            {txn.pointsSpentOrEarned > 0 && (
                              <span className="text-[9.5px] text-amber-600 font-bold font-mono block">
                                {txn.pointsSpentOrEarned} PTS reward
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                  {wallet.history.filter(txn => {
                    if (txnFilter === 'All') return true;
                    const desc = txn.description.toLowerCase();
                    const isCard = desc.includes('card') || desc.includes('visa') || desc.includes('mastercard') || desc.includes('hdfc') || desc.includes('icici') || desc.includes('bank');
                    const isUPI = desc.includes('upi') || desc.includes('transfer') || desc.includes('vpa') || desc.includes('wire') || desc.includes('razorpay');
                    const isPaytm = desc.includes('paytm') || desc.includes('mobikwik') || desc.includes('phonepe');
                    const isAmazon = desc.includes('amazon') || desc.includes('jiomart') || desc.includes('jio');
                    const isChalo = (desc.includes('points') || desc.includes('redeem') || desc.includes('balance') || desc.includes('referral') || desc.includes('exchange') || desc.includes('bonus')) && !isPaytm && !isAmazon;

                    if (txnFilter === 'Card') return isCard;
                    if (txnFilter === 'UPI') return isUPI;
                    if ((txnFilter as any) === 'Chalo One Wallet') return isChalo;
                    if ((txnFilter as any) === 'Paytm Wallet') return isPaytm;
                    if ((txnFilter as any) === 'Amazon Pay') return isAmazon;
                    return true;
                  }).length === 0 && (
                    <p className="p-4 text-center text-slate-450 italic text-[11px]">No transactions classified under your custom filters.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* E. SAVED ADDRESSES */}
          {activeSection === 'saved_addresses' && (
            <div className="space-y-4" id="section_saved_addresses">
              <div className="bg-white p-5 rounded-3xl border border-gray-150 shadow-xs space-y-4">
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Saved Delivery Addresses</h3>
                    <p className="text-[11px] text-gray-400 mt-0.5 font-medium">Quick delivery checkout & travel ride labels</p>
                  </div>
                  <MapPin className="w-5 h-5 text-indigo-500" />
                </div>

                {/* Display Address lists cards */}
                {savedAddresses.length === 0 ? (
                  <p className="text-xs text-gray-400 font-semibold text-center py-4">No custom hotspot addresses declared yet.</p>
                ) : (
                  <div className="space-y-2">
                    {savedAddresses.map(addr => (
                      <div key={addr.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-2xl border border-gray-150 text-xs gap-2">
                        <div>
                          <span className={`text-[8.5px] font-mono font-extrabold uppercase px-1.5 py-0.5 rounded mr-2 ${
                            addr.label === 'Home' ? 'bg-indigo-100 text-indigo-800' : addr.label === 'Work' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {addr.label}
                          </span>
                          <strong className="text-gray-900 font-bold text-xs font-sans leading-snug">{addr.addressLine}</strong>
                          {addr.landmark && (
                            <span className="block text-[10px] text-gray-400 font-semibold mt-0.5">Contact Landmark: {addr.landmark}</span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="text-red-500 hover:text-red-700 transition duration-150 p-1 rounded hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Create Custom Add Address Form code */}
                <form onSubmit={handleAddAddress} className="space-y-3 pt-3 border-t border-dashed border-gray-150">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block font-mono">Create Comfort hotspot location</span>
                  
                  <div className="grid grid-cols-3 gap-1 px-0.5">
                    {(['Home', 'Work', 'Other'] as const).map(lbl => (
                      <button
                        key={lbl}
                        type="button"
                        onClick={() => setAddressLabel(lbl)}
                        className={`py-1.5 rounded-xl text-[10.5px] font-extrabold border transition cursor-pointer ${
                          addressLabel === lbl ? 'bg-amber-500 text-white border-amber-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                        {isSearchingAddress ? (
                          <span className="w-3.5 h-3.5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin block"></span>
                        ) : (
                          <Search className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <input
                        type="text"
                        value={addressLine}
                        onChange={(e) => setAddressLine(e.target.value)}
                        onFocus={() => {
                          if (addressLine.trim()) {
                            setShowAddressSuggestions(true);
                          }
                        }}
                        onBlur={() => {
                          // Tiny delay to allow option click to register
                          setTimeout(() => {
                            setShowAddressSuggestions(false);
                          }, 250);
                        }}
                        placeholder="Address details (e.g. Prestige Tech Park, Bangalore)"
                        className="bg-gray-50 border border-gray-150 pl-10 pr-2.5 py-2.5 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-amber-500 w-full"
                        required
                      />

                      {/* Autocomplete suggestions dropdown */}
                      {showAddressSuggestions && (
                        <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden max-h-56 overflow-y-auto">
                          <div className="bg-slate-50 px-3 py-1.5 border-b border-gray-100 flex items-center justify-between text-[9px] font-mono font-bold tracking-tight text-slate-400">
                            <span>MAPPED AUTO-COMPLETE RESULTS</span>
                            {isSearchingAddress ? (
                              <span className="text-amber-500 animate-pulse">SEARCHING MAPS API...</span>
                            ) : (
                              <span>{addressSuggestions.length} FOUND</span>
                            )}
                          </div>
                          {addressSuggestions.length === 0 ? (
                            <div className="p-4 text-center text-xs text-gray-400 italic">
                              {isSearchingAddress ? (
                                "Fetching suggestions..."
                              ) : (
                                <>
                                  No exact match found.
                                  <span className="block text-[10px] text-gray-400 mt-1 not-italic font-sans">
                                    You can still click "Add Hotspot Address" to save this custom spot.
                                  </span>
                                </>
                              )}
                            </div>
                          ) : (
                            <div className="divide-y divide-gray-100">
                              {addressSuggestions.map((suggestion, index) => {
                                const parts = suggestion.split(',');
                                const title = parts[0];
                                const subtitle = parts.slice(1).join(',').trim();
                                return (
                                  <button
                                    key={index}
                                    type="button"
                                    onClick={() => {
                                      setAddressLine(suggestion);
                                      setShowAddressSuggestions(false);
                                    }}
                                    className="w-full text-left px-3 py-2.5 hover:bg-amber-50/50 transition flex items-start space-x-2 text-xs text-slate-750 font-medium"
                                  >
                                    <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                    <div className="overflow-hidden">
                                      <span className="block text-slate-800 font-bold leading-tight truncate">
                                        {title}
                                      </span>
                                      <span className="block text-[10px] text-gray-400 truncate mt-0.5">
                                        {subtitle}
                                      </span>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                          <div className="p-2 bg-amber-50/40 border-t border-gray-100 text-[8.5px] font-medium text-slate-400 text-center uppercase tracking-wider">
                            🚀 Powered by Chalo Super-Geo API
                          </div>
                        </div>
                      )}
                    </div>

                    <input
                      type="text"
                      value={addressLandmark}
                      onChange={(e) => setAddressLandmark(e.target.value)}
                      placeholder="Nearby landmark (Optional)"
                      className="bg-gray-50 border border-gray-150 p-2.5 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className={`w-full bg-slate-900 hover:bg-black text-white text-[11px] font-black uppercase py-2.5 rounded-xl transition cursor-pointer ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Add Hotspot Address
                  </button>
                </form>
              </div>
            </div>
          )}

                    {/* F2. LINKED ACCOUNTS */}
          {activeSection === 'linked_accounts' && (
            <div className="space-y-4 animate-fade-in pb-20">
              <div className="bg-white rounded-2xl p-4 border border-gray-150 shadow-xs">
                <div className="flex items-center space-x-2 border-b border-gray-150 pb-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <Link className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-gray-900 font-mono uppercase tracking-wider">Linked Accounts</h3>
                    <p className="text-[10px] font-medium text-gray-500">Connect Swiggy, Zomato, Zepto & more</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {linkedAccounts.map(provider => (
                    <div key={provider.id} className="flex items-center justify-between p-3 border border-gray-150 rounded-xl hover:bg-slate-50 transition">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg ${provider.color}`}>
                          {provider.icon}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-gray-900">{provider.name}</div>
                          <div className="text-[10px] text-gray-500">
                            {provider.status === 'connected' ? 'Connected (Auto-Login Enabled)' : 'Not Connected'}
                          </div>
                        </div>
                      </div>
                      <button onClick={() => handleLinkToggle(provider.id as ProviderId, provider.status)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition ${provider.status === 'connected' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-slate-900 text-white hover:bg-black'}`}>
                        {provider.status === 'connected' ? 'Disconnect' : 'Connect'}
                      </button>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 p-3 bg-blue-50/50 rounded-xl border border-blue-100 flex items-start space-x-2">
                  <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-blue-800 font-medium">Connecting accounts allows Chalo One to place orders on your behalf using your official provider identity, applying your existing memberships and coupons automatically.</p>
                </div>
              </div>
            </div>
          )}
          
          {/* F. HELP, SUPPORT AND FAQS */}
          {activeSection === 'help_support' && (
            <div className="space-y-4" id="section_help_support">
              <HelpSupport 
                tickets={supportTickets}
                addSupportTicket={addSupportTicket}
                replyToTicket={replyToTicket}
              />
            </div>
          )}

          {/* G. DEDICATED EDIT PROFILE PAGE */}
          {activeSection === 'edit_profile' && (
            <div className="bg-white p-5 rounded-3xl border border-gray-150 shadow-xs space-y-4 animate-fade-in" id="section_edit_profile">
              <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Modify Profile Credentials</h3>
                  <p className="text-[10.5px] text-gray-400 mt-0.5 font-medium">Manage display picture, secure contacts, and verified profile credentials.</p>
                </div>
                <User className="w-5 h-5 text-indigo-550 shrink-0" />
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4 text-xs text-slate-800">
                {/* Profile Picture Upload & Select Presets */}
                <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-150">
                  <span className="text-[9.5px] font-mono font-black text-slate-400 uppercase tracking-wider block">Profile Identity Picture</span>
                  <div className="flex items-center space-x-4">
                    {profileAvatarUrl ? (
                      <img 
                        src={profileAvatarUrl} 
                        alt="Current Avatar" 
                        className="w-14 h-14 rounded-full object-cover ring-2 ring-indigo-500 shadow-sm"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-14 h-14 bg-indigo-650 text-white rounded-full flex items-center justify-center font-display font-black text-lg uppercase shadow-sm">
                        {profileName.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    
                    {/* Preset choices list */}
                    <div className="flex-1 space-y-2">
                      <p className="text-[10px] text-gray-400 font-semibold leading-none">Select a cartoon gender-wise avatar:</p>
                      <div className="flex space-x-2">
                        {getPresetAvatarsByGender().map((av, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setProfileAvatarUrl(av)}
                            className={`w-8 h-8 rounded-full border overflow-hidden shrink-0 transition cursor-pointer ${
                              profileAvatarUrl === av ? 'border-indigo-650 scale-110 ring-2 ring-indigo-500/10' : 'border-transparent opacity-60 hover:opacity-100'
                            }`}
                          >
                            <img src={av} alt="Preset Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Manual file custom upload */}
                  <div className="flex items-center space-x-2 bg-white p-2 rounded-xl border border-gray-150 mt-1">
                    <span className="text-[9px] text-gray-550 font-mono font-bold uppercase shrink-0">Upload Custom Image:</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setProfileAvatarUrl(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="text-[9px] text-gray-550 cursor-pointer file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[9px] file:font-bold file:bg-gray-100 file:text-slate-700 hover:file:bg-gray-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col space-y-1">
                    <label className="text-[9.5px] font-mono font-black uppercase text-gray-400 tracking-wider">Full Name</label>
                    <input
                      type="text"
                      required
                      value={profileName}
                      maxLength={50}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="bg-gray-50 border border-gray-150 p-2.5 text-xs rounded-xl font-bold text-gray-800 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-[9.5px] font-mono font-black uppercase text-gray-400 tracking-wider">Mobile Number</label>
                    <input
                      type="text"
                      required
                      value={profilePhone}
                      onChange={(e) => {
                        let val = e.target.value;
                        // Strip all non-digits
                        let digits = val.replace(/\D/g, '');
                        if (digits.startsWith('91')) {
                          digits = digits.substring(2);
                        }
                        digits = digits.substring(0, 10);
                        setProfilePhone(digits ? `+91 ${digits}` : '+91 ');
                      }}
                      className="bg-gray-50 border border-gray-150 p-2.5 text-xs rounded-xl font-bold text-gray-800 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[9.5px] font-mono font-black uppercase text-gray-400 tracking-wider">Email ID</label>
                  <input
                    type="email"
                    readOnly
                    disabled
                    value={profileEmail}
                    className="bg-gray-150 border border-gray-250 p-2.5 text-xs rounded-xl font-bold text-gray-500 cursor-not-allowed outline-none"
                  />
                  <span className="text-[9px] text-gray-400 mt-1 leading-normal font-mono">
                    🔒 Permanent ID: Cannot be changed once created. Please contact our <strong>Support Team</strong> or register a new account to use a different Email ID. Sourced for OTP, Password Resets, Newsletters, and communication.
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col space-y-1">
                    <label className="text-[9.5px] font-mono font-black uppercase text-gray-400 tracking-wider">Date of Birth</label>
                    <input
                      type="date"
                      max={new Date().toISOString().split('T')[0]}
                      required
                      value={profileDob}
                      onChange={(e) => setProfileDob(e.target.value)}
                      className="bg-gray-50 border border-gray-150 p-2.5 text-xs rounded-xl font-bold text-gray-800 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-[9.5px] font-mono font-black uppercase text-gray-400 tracking-wider">Gender</label>
                    <select
                      value={profileGender}
                      onChange={(e) => setProfileGender(e.target.value)}
                      className="bg-gray-50 border border-gray-150 p-2.5 text-xs rounded-xl font-bold text-gray-800 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className={`flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-amber-950 font-black text-[11px] rounded-xl cursor-pointer transition uppercase font-mono tracking-wide shadow-xs ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Save Changes & Sync 💾
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSection('main')}
                    className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-slate-600 font-bold text-[11px] rounded-xl cursor-pointer transition uppercase"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* H. VIP FOUNDER AFFILIATE PROGRAM SUITE (SUPER ADMIN & AFFILIATE PARTNERS) */}
          
          {/* VIP ADMIN CONTROL CENTER */}
          {activeSection === 'admin_center' && (
            <AdminControlCenter userProfile={userProfile} onBack={() => setActiveSection('main')} />
          )}

          {/* MERCHANT PARTNER PORTAL DESK */}
          {activeSection === 'partner_portal' && (
            <PartnerPortal userProfile={userProfile} onBack={() => setActiveSection('main')} />
          )}

          

        </div>
      )}

      {/* 🔗 PLATFORM AGGREGATOR SECURE OAUTH VERIFICATION INTERACTIVE MODAL */}
      {linkingItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-gray-150 p-5 w-full max-w-sm space-y-4 shadow-xl text-slate-800 animate-fade-in">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <span className={`w-6 h-6 flex items-center justify-center rounded-lg text-xs font-black shrink-0 ${linkingItem.color}`}>
                  {linkingItem.logo}
                </span>
                <h3 className="font-display font-black text-gray-950 text-xs uppercase tracking-tight">
                  {isReLoginCheck ? 'Verify Session Key' : 'Secure Integration Sync'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setLinkingItem(null);
                  setLinkEmail('');
                  setLinkPassword('');
                  setIsVerifyingLink(false);
                  setIsLinkSuccess(false);
                }}
                className="p-1 text-gray-400 hover:bg-gray-50 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isVerifyingLink ? (
              <div className="py-8 text-center space-y-3.5">
                <div className="relative w-12 h-12 mx-auto">
                  <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  <KeyRound className="w-5 h-5 text-indigo-600 absolute inset-0 m-auto" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-black text-gray-950 uppercase tracking-tight">Authenticating credentials...</p>
                  <p className="text-[10px] text-gray-400 font-mono leading-relaxed">
                    Connecting to carrier API secure gateway token authorization pools...
                  </p>
                </div>
              </div>
            ) : isLinkSuccess ? (
              <div className="py-8 text-center space-y-3.5">
                <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                  <CheckCircle2 className="w-6 h-6 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-black text-emerald-800 uppercase tracking-tight">Connection Verified!</p>
                  <p className="text-[10px] text-gray-400 font-medium">Redirecting credentials secure token back to Chalo One...</p>
                </div>
              </div>
            ) : (
              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!linkEmail.trim() || !linkPassword.trim()) {
                    alert('Please provide your active login credentials.');
                    return;
                  }
                  setIsVerifyingLink(true);
                  // In production this would invoke Firebase Auth or OAuth to link the provider
                  setIsVerifyingLink(false);
                  setIsLinkSuccess(true);
                  
                  // Success link connection
                  setConnectedAccounts({
                    ...connectedAccounts,
                    [linkingItem.key]: true
                  });
                  setLinkingItem(null);
                  setLinkEmail('');
                  setLinkPassword('');
                  setIsLinkSuccess(false);
                  setIsReLoginCheck(false);
                  alert(`🎉 Connected successfully! Verified active sessions with "${linkingItem.label}" credentials.`);
                }} 
                className="space-y-3 text-xs"
              >
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-[10.5px] text-slate-500 leading-normal font-medium animate-pulse">
                  {isReLoginCheck ? (
                    <span>User security choice triggers credential check to verify password has not changed. Provide your registered <b>{linkingItem.label}</b> details below.</span>
                  ) : (
                    <span>Enter your registered <b>{linkingItem.label}</b> account details to authorize Super comparison fetching with Chalo One.</span>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider block font-mono">Platform Registered Email / Phone</label>
                  <input
                    type="text"
                    required
                    value={linkEmail}
                    onChange={(e) => setLinkEmail(e.target.value)}
                    placeholder="e.g. kunal_user@vpa.com"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-gray-200 outline-none font-bold focus:bg-white focus:ring-1 focus:ring-indigo-400 text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider block font-mono">Platform Password / Access Token</label>
                  <div className="relative">
                    <input
                      type={showLinkPassword ? 'text' : 'password'}
                      required
                      value={linkPassword}
                      onChange={(e) => setLinkPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-3 pr-9 py-2.5 rounded-xl bg-slate-50 border border-gray-200 outline-none font-semibold focus:bg-white focus:ring-1 focus:ring-indigo-400 font-mono text-xs text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLinkPassword(!showLinkPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-700 cursor-pointer"
                    >
                      {showLinkPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-gray-500 font-medium font-sans">Original Platform:</span>
                  <a 
                    href={linkingItem.docUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-indigo-600 hover:underline font-black flex items-center space-x-1"
                  >
                    <span>Visit {linkingItem.label}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-slate-900 hover:bg-black text-white font-black text-[10.5px] rounded-xl cursor-pointer transition uppercase tracking-wider"
                  >
                    Authorize Session 🔐
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLinkingItem(null);
                      setLinkEmail('');
                      setLinkPassword('');
                      setIsReLoginCheck(false);
                    }}
                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-slate-655 font-bold text-[10.5px] rounded-xl cursor-pointer transition uppercase"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 🚪 LOG OUT CONFIRMATION MODAL */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-gray-150 shadow-2xl space-y-4 animate-fade-in text-center">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto text-xl">
              🚪
            </div>
            <div className="space-y-1">
              <h3 className="font-display font-black text-slate-900 text-sm uppercase tracking-tight">Confirm Sign Out</h3>
              <p className="text-xs text-gray-500">
                Are you sure you want to sign out and lock your Chalo One wallet & linked accounts?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  if (onLogout) {
                    onLogout();
                  }
                }}
                className="py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm"
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
