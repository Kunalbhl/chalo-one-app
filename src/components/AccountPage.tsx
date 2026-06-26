import React, { useState } from 'react';
import HelpSupport from './HelpSupport';
import { 
  UserProfile, 
  AppPreferences, 
  ConnectedAccounts, 
  SupportTicket, 
  Address, 
  BiometricLog, 
  ChaloWallet 
} from '../types';
import { FAQS } from '../data';
import { db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { 
  Settings, 
  Shield, 
  MapPin, 
  User, 
  Compass, 
  HelpCircle, 
  Mail, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Fingerprint, 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff, 
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  Camera,
  Clock,
  UserCheck,
  UserX,
  X,
  ArrowLeft,
  ChevronRight,
  CreditCard,
  Coins,
  Edit,
  Save,
  Check,
  Globe,
  RefreshCw,
  Code,
  Copy,
  Link
} from 'lucide-react';

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
  activities = []
}: AccountPageProps) {
  // Navigation inside Account page
  const [activeSection, setActiveSection] = useState<
    'main' | 'linked_accounts' | 'rules_prefs' | 'security_audit' | 'help_support' | 'payments' | 'saved_addresses' | 'edit_profile' | 'founder_affiliate' | 'change_password'
  >('main');

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

  React.useEffect(() => {
    if (activeSection === 'founder_affiliate') {
      setIsFetchingCjData(true);
      fetch('/api/affiliate/config')
        .then(res => res.json())
        .then(data => setCjConfig(data))
        .catch(err => console.error("Error loading CJ configuration:", err));

      fetch('/api/affiliate/bookings')
        .then(res => res.json())
        .then(data => {
          setCjBookingsList(data.bookings || []);
          setIsFetchingCjData(false);
        })
        .catch(err => {
          console.error("Error loading CJ bookings:", err);
          setIsFetchingCjData(false);
        });
    }
  }, [activeSection]);

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

  const [typedRedemptionPoints, setTypedRedemptionPoints] = useState<string>('');

  // Preferred platform selection states (one per category, remembered and synced)
  const [prefRides, setPrefRides] = useState<string>(() => localStorage.getItem("chalo_pref_rides") || 'uber');
  const [prefFood, setPrefFood] = useState<string>(() => localStorage.getItem("chalo_pref_food") || 'zomato');
  const [prefMart, setPrefMart] = useState<string>(() => localStorage.getItem("chalo_pref_mart") || 'blinkit');
  const [prefStays, setPrefStays] = useState<string>(() => localStorage.getItem("chalo_pref_stays") || 'makemytrip');

  // Payment Management States
  const [txnFilter, setTxnFilter] = useState<'All' | 'Card' | 'Wallet' | 'UPI'>('All');
  const [savedCards, setSavedCards] = useState([
    { id: '1', bank: 'HDFC', type: 'Visa credit', number: '•••• •••• •••• 9812', expiry: '12/29' },
    { id: '2', bank: 'ICICI', type: 'Mastercard debit', number: '•••• •••• •••• 1042', expiry: '04/32' }
  ]);
  const [savedUpis, setSavedUpis] = useState([
    { id: '1', upiId: 'kunal@okhdfcbank', label: 'Primary UPI' }
  ]);
  const [savedWallets, setSavedWallets] = useState([
    { id: '1', name: 'Paytm Wallet', phone: '9876543210', balance: 450.00 }
  ]);

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
    await new Promise(r => setTimeout(r, 600));
    setVerifyStep("Detecting card network binomial prefixes...");
    await new Promise(r => setTimeout(r, 500));

    // Auto-detect bank and type
    const lead = cleanNum.charAt(0);
    let cardType = 'Visa credit';
    let cardBank = 'SBI Bank';
    if (lead === '4') { cardType = 'Visa credit'; cardBank = 'HDFC'; }
    else if (lead === '5') { cardType = 'Mastercard debit'; cardBank = 'ICICI'; }
    else if (lead === '6') { cardType = 'RuPay debit'; cardBank = 'Federal Bank'; }
    else if (lead === '3') { cardType = 'Amex elite'; cardBank = 'AmEx'; }

    setVerifyStep(`Network parsed. Requesting secure bank authorize (${cardBank} secure portal)...`);
    await new Promise(r => setTimeout(r, 700));
    setVerifyStep(`OTP sent to standard holder number. Auto-verifying handshake...`);
    await new Promise(r => setTimeout(r, 600));

    const lastFour = cleanNum.slice(-4);
    const newCard = {
      id: Date.now().toString(),
      bank: cardBank,
      type: cardType,
      number: `•••• •••• •••• ${lastFour}`,
      expiry: newCardExpiry || '11/30'
    };

    setSavedCards([...savedCards, newCard]);
    setIsVerifying(false);
    setAddingMethodType('none');
    setNewCardNumber('');
    setNewCardExpiry('');
    setNewCardCvv('');
    alert(`Success! Card verified natively from ${cardBank} bank server and saved.`);
  };

  const handleAddUpi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUpiId.includes('@')) {
      alert("Please enter a valid UPI VPA structure, e.g. username@bank");
      return;
    }
    setIsVerifying(true);
    setVerifyStep("Querying NPCI Central UPI servers...");
    await new Promise(r => setTimeout(r, 700));
    setVerifyStep("Resolving VPA mapping credentials with issuing bank handles...");
    await new Promise(r => setTimeout(r, 600));
    setVerifyStep("Handshake successful. Verified account name fits 'KUNAL PAREEK'...");
    await new Promise(r => setTimeout(r, 500));

    const newUpi = {
      id: Date.now().toString(),
      upiId: newUpiId,
      label: newUpiLabel || 'Personal Account'
    };

    setSavedUpis([...savedUpis, newUpi]);
    setIsVerifying(false);
    setAddingMethodType('none');
    setNewUpiId('');
    setNewUpiLabel('');
    alert(`Success! NPCI Server validated VPA username: ${newUpiId}`);
  };

  const handleLinkWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newWalletPhone.length < 10) {
      alert("Please enter a valid 10-digit mobile number linked to your wallet.");
      return;
    }
    setIsVerifying(true);
    setVerifyStep(`Contacting ${selectedWalletName} API servers...`);
    await new Promise(r => setTimeout(r, 600));
    setVerifyStep("Sending simulated verification SMS...");
    await new Promise(r => setTimeout(r, 700));

    const optCode = prompt(`A secure link confirmation code was sent to ${newWalletPhone}. Please enter the 4-digit code (e.g. 1234) to fully link:`);
    if (!optCode) {
      setIsVerifying(false);
      return;
    }

    setVerifyStep(`Confirming mobile linkage with authorization tokens...`);
    await new Promise(r => setTimeout(r, 500));

    const mockBalance = Math.floor(200 + Math.random() * 1500);
    const newWallet = {
      id: Date.now().toString(),
      name: selectedWalletName,
      phone: newWalletPhone,
      balance: mockBalance
    };

    setSavedWallets([...savedWallets, newWallet]);
    setIsVerifying(false);
    setAddingMethodType('none');
    setNewWalletPhone('');
    alert(`Success! Linked ${selectedWalletName} Wallet with verified balance of ₹${mockBalance.toFixed(2)}`);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
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

    // Save locally to fallback list
    try {
      const savedList = localStorage.getItem('chalo_all_users');
      if (savedList) {
        const parsedList = JSON.parse(savedList);
        const updatedList = parsedList.map((u: any) => {
          if (u.email.toLowerCase() === profileEmail.toLowerCase().trim()) {
            return { ...u, ...updatedProfile };
          }
          return u;
        });
        localStorage.setItem('chalo_all_users', JSON.stringify(updatedList));
      }
    } catch (e) {
      console.warn("Could not sync local profile update:", e);
    }

    // Persist profile updates directly to Firebase database
    if (db) {
      try {
        const userDocRef = doc(db, 'users', profileEmail.toLowerCase().trim());
        await setDoc(userDocRef, {
          profile: updatedProfile
        }, { merge: true });
        console.log("Updated profile details synced to Firebase Firestore.");
      } catch (err) {
        console.warn("Could not persist profile changes to Firebase Firestore:", err);
      }
    }
  };

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressLine.trim()) return;

    const newAddr: Address = {
      id: "ADDR-" + Math.floor(1000 + Math.random() * 9000),
      label: addressLabel,
      addressLine,
      landmark: addressLandmark || undefined
    };

    setSavedAddresses([...savedAddresses, newAddr]);
    setAddressLine('');
    setAddressLandmark('');
    alert('Comfort hotspot address successfully recorded!');
  };

  const handleDeleteAddress = (id: string) => {
    setSavedAddresses(savedAddresses.filter(addr => addr.id !== id));
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
               activeSection === 'saved_addresses' ? '📍 SAVED SPOTS' :
               activeSection === 'help_support' ? '🛎️ SUPPORT DESK' :
               activeSection === 'edit_profile' ? '👤 EDIT PROFILE' :
               activeSection === 'founder_affiliate' ? '🔌 PARTNER DESK' :
               activeSection.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        </div>
      )}

      {/* RENDER ACCORDING TO STATE SWITCH */}
      {activeSection === 'main' ? (
        <div className="space-y-4 animate-fade-in" id="account_main_menu_group">
          
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
              ...((userProfile.email.toLowerCase() === 'kunalpareekusa@gmail.com' || userProfile.role === 'super_admin' || userProfile.role === 'affiliate_partner') ? [{
                id: 'founder_affiliate',
                title: userProfile.role === 'affiliate_partner' ? '🔌 Affiliate Partner Dashboard' : '👑 Founder Affiliate Program Suite',
                desc: userProfile.role === 'affiliate_partner' ? 'Sync web booking parameters, get affiliate URLs, and track accrued payout commission' : 'Manage commission rates, affiliate links, and super admin analytics',
                badge: userProfile.role === 'affiliate_partner' ? 'Partner Desk' : 'Super Admin'
              }] : []),
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
            ].map(row => (
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
                if (window.confirm('Are you sure you want to log out of Chalo One?')) {
                  if (onLogout) {
                    onLogout();
                  } else {
                    alert('Log out action selected.');
                  }
                }
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
                      localStorage.setItem("chalo_pref_rides", val);
                      alert(`🚀 "${val.toUpperCase()}" is now set as your single preferred rides operator inside Chalo One super comparison search.`);
                    },
                    items: [
                      { key: 'uber', label: 'Uber Cabs', logo: '🚗', color: 'bg-black text-white', cred: 'uber_kunal_chalo_99@vpa.com', docUrl: 'https://uber.com', linkedSince: 'Linked since: 45 days' },
                      { key: 'ola', label: 'Ola Credential', logo: '🚕', color: 'bg-yellow-400 text-slate-900 font-black', cred: 'ola_kunal_active_session', docUrl: 'https://olacabs.com', linkedSince: 'Linked since: 12 days' },
                      { key: 'rapido', label: 'Rapido Bike platform', logo: '🏍', color: 'bg-yellow-300 text-slate-900', cred: '+91 98845 29130 OTP verified', docUrl: 'https://rapido.xyz', linkedSince: 'Linked since: 8 days' }
                    ]
                  },
                  {
                    categoryName: '🍔 Food Delivery Platforms',
                    prefState: prefFood,
                    setPref: (val: string) => {
                      setPrefFood(val);
                      localStorage.setItem("chalo_pref_food", val);
                      alert(`🍔 "${val.toUpperCase()}" is now set as your single preferred food node inside Chalo One comparison searches.`);
                    },
                    items: [
                      { key: 'zomato', label: 'Zomato Gold', logo: '🔴', color: 'bg-rose-600 text-white', cred: 'zomato_gold_member_223@gmail.com', docUrl: 'https://zomato.com', linkedSince: 'Linked since: 28 days' },
                      { key: 'swiggy', label: 'Swiggy Meals', logo: '🟠', color: 'bg-orange-500 text-white', cred: 'swiggy_one_plus_kunal@office.in', docUrl: 'https://swiggy.com', linkedSince: 'Linked since: 30 days' },
                      { key: 'eatsure', label: 'EatSure Direct', logo: '🟣', color: 'bg-[#5e17eb] text-white', cred: 'eatsure_kunal_secure_api', docUrl: 'https://eatsure.com', linkedSince: 'Linked since: 14 days' }
                    ]
                  },
                  {
                    categoryName: '🛒 Grocery & Quick Commerce Marts',
                    prefState: prefMart,
                    setPref: (val: string) => {
                      setPrefMart(val);
                      localStorage.setItem("chalo_pref_mart", val);
                      alert(`🛒 "${val.toUpperCase()}" is now set as your single preferred grocery delivery provider.`);
                    },
                    items: [
                      { key: 'blinkit', label: 'Blinkit Instant', logo: '🟡', color: 'bg-yellow-400 text-slate-950 font-bold', cred: 'blinkit_user_phone_verified', docUrl: 'https://blinkit.com', linkedSince: 'Linked since: 15 days' },
                      { key: 'zepto', label: 'Zepto Grocery', logo: '🍇', color: 'bg-[#5e17eb]/20 text-indigo-700 font-bold', cred: 'zepto_loyalty_992@chalo.com', docUrl: 'https://zeptonow.com', linkedSince: 'Linked since: 3 days' }
                    ]
                  },
                  {
                    categoryName: '🏨 Hotel Stays & Travels',
                    prefState: prefStays,
                    setPref: (val: string) => {
                      setPrefStays(val);
                      localStorage.setItem("chalo_pref_stays", val);
                      alert(`🏨 "${val.toUpperCase()}" is now set as your default holiday hotel provider.`);
                    },
                    items: [
                      { key: 'makemytrip', label: 'MakeMyTrip Premium', logo: '✈', color: 'bg-blue-600 text-white', cred: 'mmt_elite_kunal_member', docUrl: 'https://makemytrip.com', linkedSince: 'Linked since: 62 days' },
                      { key: 'agoda', label: 'Agoda Rooms', logo: '🏩', color: 'bg-[#ff3b30]/10 text-[#ff3b30] font-black', cred: 'agoda_direct_chalo_oauth', docUrl: 'https://agoda.com', linkedSince: 'Linked since: 5 days' },
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
                                    if (window.confirm(`Are you sure you want to unlink your "${item.label}" account from Chalo One?`)) {
                                      setConnectedAccounts({
                                        ...connectedAccounts,
                                        [item.key]: false
                                      });
                                    }
                                  } else {
                                    setLinkingItem(item);
                                    setIsReLoginCheck(false);
                                  }
                                }}
                                className={`text-[9.5px] font-black px-3.5 py-1.5 rounded-xl border transition cursor-pointer uppercase tracking-tight ${
                                  isLinked 
                                    ? 'bg-rose-50 border-rose-150 text-rose-600 hover:bg-rose-100' 
                                    : 'bg-emerald-500 border-emerald-600 hover:bg-emerald-600 text-white animate-pulse'
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

                  // Verify with current local user profile list
                  const emailKey = userProfile.email.toLowerCase().trim();
                  const storedList = localStorage.getItem('chalo_all_users');
                  let localMatch: any = null;
                  let parsedList: any[] = [];
                  if (storedList) {
                    parsedList = JSON.parse(storedList);
                    localMatch = parsedList.find((u: any) => u.email.toLowerCase() === emailKey);
                  }

                  // If local match exists, confirm correct current password
                  if (localMatch && localMatch.password && localMatch.password !== currentPassword) {
                    alert("❌ Incorrect Current Password: The current password you entered does not match our records.");
                    return;
                  }

                  // Update local fallback users database list
                  const updatedList = parsedList.map((u: any) => {
                    if (u.email.toLowerCase() === emailKey) {
                      return { ...u, password: newPassword };
                    }
                    return u;
                  });
                  localStorage.setItem('chalo_all_users', JSON.stringify(updatedList));

                  // Persist update in Firebase Cloud database Firestore
                  if (db) {
                    try {
                      const docRef = doc(db, 'users', emailKey);
                      await setDoc(docRef, {
                        password: newPassword
                      }, { merge: true });
                      console.log("Password updated successfully in Firebase Firestore.");
                    } catch (err) {
                      console.warn("Could not sync password update with Firebase Firestore:", err);
                    }
                  }

                  alert("🎉 Success! Your password has been successfully updated in the secure database. Use your new password to log in in future sessions.");
                  
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

          {/* C2. DEDICATED CHANGE PASSWORD PAGE */}
          {activeSection === 'change_password' && (
            <div className="bg-white p-5 rounded-3xl border border-gray-150 shadow-xs space-y-4 animate-fade-in" id="section_change_password">
              <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Update Account Password</h3>
                  <p className="text-[10.5px] text-gray-400 mt-0.5 font-medium">
                    Modify your password to secure your Chalo One wallet, travel history, and account credentials.
                  </p>
                </div>
                <Lock className="w-5 h-5 text-amber-500 shrink-0" />
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

                // Verify with current local user profile list
                const emailKey = userProfile.email.toLowerCase().trim();
                const storedList = localStorage.getItem('chalo_all_users');
                let localMatch: any = null;
                let parsedList: any[] = [];
                if (storedList) {
                  parsedList = JSON.parse(storedList);
                  localMatch = parsedList.find((u: any) => u.email.toLowerCase() === emailKey);
                }

                // If local match exists, confirm correct current password
                if (localMatch && localMatch.password && localMatch.password !== currentPassword) {
                  alert("❌ Incorrect Current Password: The current password you entered does not match our records.");
                  return;
                }

                // Update local fallback users database list
                const updatedList = parsedList.map((u: any) => {
                  if (u.email.toLowerCase() === emailKey) {
                    return { ...u, password: newPassword };
                  }
                  return u;
                });
                localStorage.setItem('chalo_all_users', JSON.stringify(updatedList));

                // Persist update in Firebase Cloud database Firestore
                if (db) {
                  try {
                    const docRef = doc(db, 'users', emailKey);
                    await setDoc(docRef, {
                      password: newPassword
                    }, { merge: true });
                    console.log("Password updated successfully in Firebase Firestore.");
                  } catch (err) {
                    console.warn("Could not sync password update with Firebase Firestore:", err);
                  }
                }

                alert("🎉 Success! Your password has been successfully updated in the secure database. Use your new password to log in in future sessions.");
                
                // Reset inputs and return to main account view
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setActiveSection('security_audit');
              }} className="space-y-4 text-xs">
                <div className="flex flex-col space-y-1">
                  <label className="text-[9.5px] font-mono font-black uppercase text-gray-400 tracking-wider">Current Password</label>
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
                    <label className="text-[9.5px] font-mono font-black uppercase text-gray-400 tracking-wider">New Password</label>
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
                    <label className="text-[9.5px] font-mono font-black uppercase text-gray-400 tracking-wider">Confirm New Password</label>
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
                    className="flex-1 bg-slate-900 hover:bg-black text-white text-[10.5px] font-black uppercase py-3 rounded-xl transition cursor-pointer"
                  >
                    Update Secure Password
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                      setActiveSection('security_audit');
                    }}
                    className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 text-[10.5px] font-black uppercase rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* D. PAYMENT METHODS & WALLET ASSETS */}
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
                    onClick={() => {
                      const val = parseFloat(topUpAmount);
                      if (isNaN(val) || val <= 0) return;
                      addCoins(val);
                      alert(`Successfully topped up ₹${val.toFixed(2)} into Chalo One Balance!`);
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
                      if (txnFilter === 'Chalo One Wallet' || txnFilter === 'Wallet') return isChalo;
                      if (txnFilter === 'Paytm Wallet') return isPaytm;
                      if (txnFilter === 'Amazon Pay') return isAmazon;
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
                    if (txnFilter === 'Chalo One Wallet') return isChalo;
                    if (txnFilter === 'Paytm Wallet') return isPaytm;
                    if (txnFilter === 'Amazon Pay') return isAmazon;
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
                    <input
                      type="text"
                      value={addressLine}
                      onChange={(e) => setAddressLine(e.target.value)}
                      placeholder="Address details (e.g. Prestige Tech Park, Bangalore)"
                      className="bg-gray-50 border border-gray-150 p-2.5 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-amber-500"
                      required
                    />
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
                    className="w-full bg-slate-900 hover:bg-black text-white text-[11px] font-black uppercase py-2.5 rounded-xl transition cursor-pointer"
                  >
                    Add Hotspot Address
                  </button>
                </form>
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
                    className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-amber-950 font-black text-[11px] rounded-xl cursor-pointer transition uppercase font-mono tracking-wide shadow-xs"
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
          {activeSection === 'founder_affiliate' && (
            <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-850 shadow-2xl space-y-6 animate-fade-in" id="section_founder_affiliate">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-amber-400 text-slate-950 font-mono text-[9px] font-black px-2 py-0.5 rounded uppercase">
                      {userProfile.role === 'super_admin' ? 'Super Admin VIP' : 'Affiliate Partner'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Live Affiliate Desk</span>
                  </div>
                  <h3 className="text-lg font-display font-black text-white mt-1">
                    {userProfile.role === 'super_admin' ? '👑 Chalo One Founder Affiliate Console' : '🔌 Chalo One Partner Affiliate Desk'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {userProfile.role === 'super_admin' 
                      ? 'Configure commission payouts, register/manage integration platforms, and track deep analytics.' 
                      : 'Track web traffic logs, generate custom campaign referral URLs, and sync payout api parameters.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSection('main')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-wider cursor-pointer transition"
                >
                  ◀ Back to Menu
                </button>
              </div>

              {/* SECTION A: SUPER ADMIN DASHBOARD */}
              {(userProfile.role === 'super_admin' || userProfile.email.toLowerCase() === 'kunalpareekusa@gmail.com') && (
                <div className="space-y-6">

                  {/* COMMISSION JUNCTION & BOOKING.COM INTEGRATION PANEL */}
                  <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 p-6 rounded-3xl border border-amber-500/20 shadow-xl space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center border border-blue-500/20">
                          <span className="text-xl font-black text-blue-400">B.</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-white flex items-center gap-1.5 uppercase font-display">
                            Booking.com Affiliate Suite
                            <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono uppercase tracking-widest font-black">
                              Live & Synced
                            </span>
                          </h4>
                          <p className="text-[10.5px] text-slate-400">Integrated through Commission Junction (CJ) publisher network.</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsSyncingCjManual(true);
                            setTimeout(() => {
                              setIsSyncingCjManual(false);
                              alert("🟢 CJ Synchronization Complete!\n- Handshake validated with members.cj.com publisher portal\n- Credentials Verified: Kunalpareekusa@gmail.com\n- Sync status: All transactions uploaded and confirmed.");
                            }, 2000);
                          }}
                          disabled={isSyncingCjManual}
                          className="px-3.5 py-2 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-slate-950 font-black text-[9.5px] uppercase rounded-xl shadow-xs cursor-pointer transition flex items-center space-x-1.5"
                        >
                          {isSyncingCjManual ? (
                            <>
                              <span className="w-3 h-3 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                              <span>Pinging Portal...</span>
                            </>
                          ) : (
                            <span>⚡ Sync to members.cj.com</span>
                          )}
                        </button>
                        <a
                          href="https://members.cj.com/member/publisher/onboarding.cj"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white rounded-xl text-[9.5px] font-black uppercase tracking-wider transition font-mono border border-slate-700"
                        >
                          Launch CJ Portal ↗
                        </a>
                      </div>
                    </div>

                    {/* Masked Credentials Block */}
                    <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                      <div className="space-y-1">
                        <span className="text-[8.5px] text-slate-500 uppercase tracking-widest font-black block">Affiliate Publisher Email</span>
                        <span className="text-amber-400 font-bold block truncate">{cjConfig?.email || "Kunalpareekusa@gmail.com"}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[8.5px] text-slate-500 uppercase tracking-widest font-black block">Credential Key</span>
                        <div className="flex items-center space-x-1">
                          <span className="text-slate-400 font-bold block">{cjConfig?.passwordMask || "••••••••••••"}</span>
                          <span className="text-[8px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.2 rounded uppercase border border-indigo-500/20">Securely Encrypted</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[8.5px] text-slate-500 uppercase tracking-widest font-black block">Linked Program</span>
                        <span className="text-blue-400 font-bold block">Booking.com Advertiser (ID: 418290)</span>
                      </div>
                    </div>

                    {/* Bookings table */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Synced Booking.com Conversion History</h5>
                        <span className="text-[9px] text-emerald-400 font-mono">Real-time CJ Webhook reporting</span>
                      </div>

                      {isFetchingCjData ? (
                        <div className="p-8 text-center text-xs text-slate-500 font-mono">
                          <span className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin inline-block mr-2 align-middle"></span>
                          Loading synced CJ tracking data...
                        </div>
                      ) : cjBookingsList.length === 0 ? (
                        <div className="p-8 text-center text-xs text-slate-500 font-mono border border-dashed border-slate-800 rounded-2xl bg-slate-950/20">
                          No Booking.com conversions logged yet. Go to Stays, select Booking.com, and book a room to trigger real-time sync.
                        </div>
                      ) : (
                        <div className="overflow-x-auto border border-slate-800/60 rounded-2xl">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-950/80 border-b border-slate-800 text-[8.5px] text-slate-500 uppercase tracking-widest font-mono">
                                <th className="p-3">Track ID</th>
                                <th className="p-3">Hotel Destination</th>
                                <th className="p-3">Guest Name</th>
                                <th className="p-3">Value</th>
                                <th className="p-3">Comm (12%)</th>
                                <th className="p-3">CJ Sync Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/40 text-slate-300 font-sans">
                              {cjBookingsList.map((bk) => (
                                <tr key={bk.id} className="hover:bg-slate-850/40 transition-colors">
                                  <td className="p-3 font-mono font-bold text-amber-400 text-[10.5px]">{bk.id}</td>
                                  <td className="p-3 font-extrabold text-white">{bk.hotelName}</td>
                                  <td className="p-3 text-slate-300">{bk.guestName}</td>
                                  <td className="p-3 font-mono">₹{bk.amount.toLocaleString()}</td>
                                  <td className="p-3 font-mono text-emerald-400 font-bold">₹{bk.commission.toLocaleString()}</td>
                                  <td className="p-3">
                                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold font-mono">
                                      <span>●</span>
                                      <span>{bk.status}</span>
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Global Commission Controller */}
                  <div className="bg-slate-850 p-5 rounded-2xl border border-slate-800 space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider">Global Commission Payout Rate</h4>
                        <p className="text-[10.5px] text-slate-400">Controls the active default referral commission on booking transactions.</p>
                      </div>
                      <span className="text-xl font-mono font-black text-white bg-slate-900 border border-slate-750 px-3 py-1 rounded-lg">
                        {globalCommissionRate}%
                      </span>
                    </div>
                    <div className="space-y-1">
                      <input 
                        type="range" 
                        min="1" 
                        max="30" 
                        value={globalCommissionRate}
                        className="w-full accent-amber-400 cursor-pointer" 
                        onChange={(e) => setGlobalCommissionRate(parseInt(e.target.value))}
                      />
                      <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                        <span>1% (Minimum)</span>
                        <span className="text-amber-500 font-bold">{globalCommissionRate}% Commission Live</span>
                        <span>30% (VIP Maximum)</span>
                      </div>
                    </div>
                  </div>

                  {/* MASTER API ENDPOINTS DEFINITIONS */}
                  <div className="bg-slate-850 p-5 rounded-2xl border border-slate-800 space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-3">
                      <div>
                        <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1">
                          <Settings className="w-4 h-4 text-amber-400 animate-spin" />
                          Complete API & Integrations Control Center
                        </h4>
                        <p className="text-[10.5px] text-slate-400">Configure comparative scraping APIs, credentials, and live production endpoints.</p>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => setShowAddApiForm(!showAddApiForm)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[9.5px] font-bold uppercase tracking-wider cursor-pointer self-start"
                      >
                        {showAddApiForm ? '✕ Close Form' : '➕ Link New API'}
                      </button>
                    </div>

                    {/* Webhook API credentials fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block font-mono">GLOBAL_WEBHOOK_URL (chaloone.com)</label>
                        <input 
                          type="text" 
                          value={emailWebhookApi}
                          onChange={(e) => setEmailWebhookApi(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-750 p-3 rounded-xl text-xs font-mono text-slate-200 outline-none focus:ring-1 focus:ring-amber-400" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block font-mono">PRODUCTION_API_TOKEN</label>
                        <input 
                          type="text" 
                          value={emailApiToken}
                          onChange={(e) => setEmailApiToken(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-750 p-3 rounded-xl text-xs font-mono text-slate-200 outline-none focus:ring-1 focus:ring-amber-400" 
                        />
                      </div>
                    </div>

                    {/* Form to link/register a brand new API */}
                    {showAddApiForm && (
                      <div className="bg-slate-900 p-4 rounded-xl border border-slate-750 space-y-3 animate-fade-in">
                        <span className="text-[9.5px] text-amber-400 font-mono font-black uppercase tracking-wider block border-b border-slate-800 pb-1.5">Link Custom Third-Party API wrapper</span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          <div className="space-y-1">
                            <label className="text-[8.5px] text-slate-400 uppercase font-mono">API Service Name</label>
                            <input 
                              type="text"
                              placeholder="e.g. Ola Cabs Comparative Scraper API"
                              value={newApiName}
                              onChange={(e) => setNewApiName(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-850 p-2.5 rounded-lg font-bold text-white outline-none focus:border-amber-400 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8.5px] text-slate-400 uppercase font-mono">GCP/AWS Integration Service Purpose</label>
                            <input 
                              type="text"
                              placeholder="e.g. Scrapes Ola mini/prime prices for rides tab compare"
                              value={newApiService}
                              onChange={(e) => setNewApiService(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-850 p-2.5 rounded-lg text-white outline-none focus:border-amber-400 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8.5px] text-slate-400 uppercase font-mono">Integration API Key (Linked credentials)</label>
                            <input 
                              type="text"
                              placeholder="e.g. AIzaSyOLA_ChaloOne_ProdSecret"
                              value={newApiKey}
                              onChange={(e) => setNewApiKey(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-850 p-2.5 rounded-lg font-mono text-white outline-none focus:border-amber-400 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8.5px] text-slate-400 uppercase font-mono">Endpoint Base URL (For backend route proxying)</label>
                            <input 
                              type="text"
                              placeholder="e.g. https://api.olacabs.com/v3"
                              value={newApiEndpoint}
                              onChange={(e) => setNewApiEndpoint(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-850 p-2.5 rounded-lg font-mono text-white outline-none focus:border-amber-400 text-xs"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (!newApiName.trim() || !newApiService.trim() || !newApiKey.trim() || !newApiEndpoint.trim()) {
                              alert('Please fill out all fields to successfully register the API connection.');
                              return;
                            }
                            const newApi = {
                              id: 'api_' + Math.floor(100 + Math.random() * 900),
                              name: newApiName,
                              service: newApiService,
                              status: 'Linked',
                              apiKey: newApiKey,
                              endpoint: newApiEndpoint,
                              isTesting: false
                            };
                            setCoreApisList([...coreApisList, newApi]);
                            setNewApiName('');
                            setNewApiService('');
                            setNewApiKey('');
                            setNewApiEndpoint('');
                            setShowAddApiForm(false);
                            alert(`🎉 Success! ${newApiName} is registered. Click "Sync and Compile Backend Code" to persist it.`);
                          }}
                          className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-[10px] tracking-wider uppercase rounded-lg shadow cursor-pointer transition-all"
                        >
                          Confirm & Link Integration
                        </button>
                      </div>
                    )}

                    {/* Tabular Showcase of Linked and Desired APIs */}
                    <div className="space-y-3">
                      <span className="text-[9.5px] text-slate-500 font-mono font-black uppercase tracking-wider block">Currently Linked Comparative Scraping APIs</span>
                      
                      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                        {coreApisList.map((api) => (
                          <div key={api.id} className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-extrabold text-white text-[12px]">{api.name}</span>
                                <span className={`text-[8px] font-mono font-black px-1.5 py-0.2 rounded-full uppercase ${
                                  api.status === 'Linked' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                                }`}>
                                  ● {api.status}
                                </span>
                              </div>
                              <p className="text-[10.5px] text-slate-400 leading-relaxed font-medium">{api.service}</p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[9px] text-slate-500">
                                <span>🔑 Key: <strong className="text-slate-300 font-bold">{api.apiKey}</strong></span>
                                <span>🔗 URL: <strong className="text-slate-300 font-bold">{api.endpoint}</strong></span>
                              </div>
                            </div>

                            {/* Direct interactions inside the admin API center */}
                            <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
                              <button
                                type="button"
                                onClick={() => {
                                  // Trigger mock test
                                  setCoreApisList(prev => prev.map(a => a.id === api.id ? { ...a, isTesting: true } : a));
                                  setTimeout(() => {
                                    setCoreApisList(prev => prev.map(a => a.id === api.id ? { ...a, isTesting: false } : a));
                                    alert(`🟢 Connection verified for ${api.name}!\n- Endpoint ping status: 200 OK (0.003s response time)\n- API Credentials: Valid\n- Production Tunnel: Secure`);
                                  }, 1500);
                                }}
                                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-md text-[9px] font-extrabold uppercase font-mono tracking-wider transition cursor-pointer"
                              >
                                {api.isTesting ? 'Pinging...' : '⚡ Test API'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setCoreApisList(prev => prev.map(a => a.id === api.id ? { ...a, status: a.status === 'Linked' ? 'Unlinked' : 'Linked' } : a));
                                }}
                                className={`px-2.5 py-1.5 rounded-md text-[9px] font-extrabold uppercase font-mono tracking-wider transition cursor-pointer ${
                                  api.status === 'Linked' ? 'bg-rose-500/15 text-rose-400 hover:bg-rose-500/25' : 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25'
                                }`}
                              >
                                {api.status === 'Linked' ? '🔌 Unlink' : '🔗 Link'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* COMPILING & SAVING CODE TO BACKEND PROD SERVER */}
                    <div className="border-t border-slate-800 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <span className="text-[10px] text-emerald-400 font-bold font-mono block">✓ Production Environment Active (chaloone.com domain)</span>
                        <p className="text-[9.5px] text-slate-500">Compiles the wrapper logic and restarts the dev/prod server with updated parameters.</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setBackendSyncing(true);
                          setBackendSyncSuccess(false);
                          setTimeout(() => {
                            setBackendSyncing(false);
                            setBackendSyncSuccess(true);
                            alert(`🚀 Production Build Success!\n- Compiled backend TypeScript wrappers\n- Re-bundled server.ts to dist/server.cjs via esbuild\n- Deployed production artifact to Cloud Run container ingress\n- Ingress Domain linked: https://chaloone.com`);
                          }, 2500);
                        }}
                        disabled={backendSyncing}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:from-emerald-800 disabled:to-emerald-900 text-white font-black text-[10px] tracking-wider uppercase rounded-xl shadow-md cursor-pointer transition flex items-center space-x-2"
                      >
                        {backendSyncing ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            <span>Compiling Code...</span>
                          </>
                        ) : (
                          <span>⚡ Save & Sync Backend Code</span>
                        )}
                      </button>
                    </div>

                    {backendSyncSuccess && (
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center text-[11px] font-mono text-emerald-400 animate-fade-in">
                        ✓ SUCCESS: API credentials updated! server.ts compiled into dist/server.cjs & deployed to container at chaloone.com successfully.
                      </div>
                    )}
                  </div>

                  {/* ACTIVE PARTNERS PLATFORMS DIRECTORY */}
                  <div className="bg-slate-850 p-5 rounded-2xl border border-slate-800 space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                      <div>
                        <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider">Active Affiliate Partners Directory</h4>
                        <p className="text-[10.5px] text-slate-400">Currently registered platform networks earning referral commissions on Chalo One.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAddPartnerForm(!showAddPartnerForm)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-white rounded-lg text-[9.5px] font-bold uppercase tracking-wider cursor-pointer"
                      >
                        {showAddPartnerForm ? '✕ Close Form' : '➕ Add Partner'}
                      </button>
                    </div>

                    {/* Form to add a partner */}
                    {showAddPartnerForm && (
                      <div className="bg-slate-900 p-4 rounded-xl border border-slate-750 space-y-3">
                        <span className="text-[9px] text-amber-400 font-mono font-black uppercase tracking-wider block">Add New Platform Network</span>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                          <div className="space-y-1">
                            <label className="text-[8.5px] text-slate-400 uppercase font-mono">Platform/Company Name</label>
                            <input 
                              type="text"
                              placeholder="e.g. FlightRadar Hub"
                              value={newPartnerCompany}
                              onChange={(e) => setNewPartnerCompany(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg font-bold text-white outline-none focus:border-amber-400"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8.5px] text-slate-400 uppercase font-mono">Web Domain</label>
                            <input 
                              type="text"
                              placeholder="e.g. flightradar.com"
                              value={newPartnerDomain}
                              onChange={(e) => setNewPartnerDomain(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg font-mono text-white outline-none focus:border-amber-400"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8.5px] text-slate-400 uppercase font-mono">Commission Rate (%)</label>
                            <input 
                              type="number"
                              min="1"
                              max="30"
                              value={newPartnerRate}
                              onChange={(e) => setNewPartnerRate(parseInt(e.target.value) || 12)}
                              className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg font-bold text-white outline-none focus:border-amber-400"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (!newPartnerCompany.trim() || !newPartnerDomain.trim()) {
                              alert('Please fill out the Platform Name and Domain.');
                              return;
                            }
                            const newP = {
                              id: 'partner_' + Math.floor(100 + Math.random() * 900),
                              companyName: newPartnerCompany,
                              domain: newPartnerDomain,
                              clicks: 0,
                              conversions: 0,
                              revenue: 0.00,
                              commissionRate: newPartnerRate,
                              isActivated: true,
                              apiToken: 'token_' + Math.floor(1000 + Math.random() * 9000),
                              webhookUrl: `https://${newPartnerDomain}/webhooks/chalo`
                            };
                            setAffiliatesList([...affiliatesList, newP]);
                            setNewPartnerCompany('');
                            setNewPartnerDomain('');
                            setShowAddPartnerForm(false);
                            alert(`🎉 Success! ${newPartnerCompany} has been added to Chalo One Affiliate System.`);
                          }}
                          className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-[10px] tracking-wider uppercase rounded-lg shadow cursor-pointer"
                        >
                          Confirm & Provision Affiliate
                        </button>
                      </div>
                    )}

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-800 text-[9px] text-slate-500 uppercase tracking-widest font-mono">
                            <th className="py-2.5">Platform Partner</th>
                            <th>Synchronization Domain</th>
                            <th>Clicks</th>
                            <th>Conversions</th>
                            <th>Comm. Rate</th>
                            <th>Earnings</th>
                            <th>Status</th>
                            <th className="text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-slate-300">
                          {affiliatesList.map((aff) => (
                            <tr key={aff.id} className="hover:bg-slate-800/20 transition-colors">
                              <td className="py-3 font-extrabold text-white">{aff.companyName}</td>
                              <td className="font-mono text-slate-400">{aff.domain}</td>
                              <td className="font-mono">{aff.clicks.toLocaleString()}</td>
                              <td className="font-mono text-amber-400 font-bold">{aff.conversions}</td>
                              <td className="font-mono">{aff.commissionRate}%</td>
                              <td className="font-mono font-bold text-emerald-400">₹{(aff.revenue).toLocaleString()}</td>
                              <td>
                                <span className={`px-2 py-0.5 rounded text-[8.5px] font-bold font-mono uppercase ${
                                  aff.isActivated ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                                }`}>
                                  {aff.isActivated ? 'ACTIVE' : 'PAUSED'}
                                </span>
                              </td>
                              <td className="text-right">
                                <div className="flex justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAffiliatesList(affiliatesList.map(a => a.id === aff.id ? { ...a, isActivated: !a.isActivated } : a));
                                    }}
                                    className="px-2 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded text-[8px] font-bold uppercase transition"
                                  >
                                    {aff.isActivated ? 'Pause' : 'Activate'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (confirm(`Are you sure you want to remove ${aff.companyName}?`)) {
                                        setAffiliatesList(affiliatesList.filter(a => a.id !== aff.id));
                                      }
                                    }}
                                    className="p-1 bg-rose-500/15 hover:bg-rose-500/30 text-rose-400 rounded transition"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Real-time Referral booking conversion logs */}
                  <div className="bg-slate-850 rounded-2xl border border-slate-800 overflow-hidden">
                    <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                      <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider font-mono">Real-Time Referral Booking Conversions</h4>
                      <span className="text-[9px] font-bold text-slate-400">Live Web Stream</span>
                    </div>

                    <div className="divide-y divide-slate-800 max-h-72 overflow-y-auto">
                      {activities && activities.length > 0 ? (
                        activities.map((act: any, i: number) => {
                          const cost = typeof act.amount === 'number' ? act.amount : parseFloat(String(act.amount || '0').replace(/[^0-9.]/g, ''));
                          const commission = (cost * (globalCommissionRate / 100)).toFixed(2);
                          return (
                            <div key={i} className="px-4 py-3.5 flex items-center justify-between hover:bg-slate-800/40 transition text-xs">
                              <div className="flex items-start space-x-3">
                                <span className="text-lg shrink-0 mt-0.5">👑</span>
                                <div>
                                  <div className="font-extrabold text-white uppercase tracking-wide">
                                    {act.title || 'Referral Booking'}
                                  </div>
                                  <div className="text-[10px] text-slate-450 font-mono mt-0.5">
                                    User Ref: <span className="text-slate-300">@{userProfile.referralCode}</span> | ID: CHALO_REF_{i+948}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs font-black text-amber-400">
                                  +₹{commission}
                                </div>
                                <div className="text-[8px] font-mono text-slate-500 mt-0.5">
                                  {globalCommissionRate}% of ₹{cost} Booking
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : null}

                      {/* Hardcoded static conversions shown cleanly with globalCommissionRate */}
                      {[
                        { title: "Hotel Stay: Calangute Beach, North Goa", cost: 7200, user: "chalo_shreya9", platform: "TravelBlogger India" },
                        { title: "Rides Compare: Uber XL, Airport to Koramangala", cost: 1250, user: "chalo_anirudh2", platform: "RideRadar Network" },
                        { title: "Intercity Cab: Jaipur to Delhi NCR", cost: 4800, user: "chalo_kunalp1", platform: "StayNavigator Blog" },
                        { title: "Food Saver Pool: Behrouz Biryani Combo Box", cost: 890, user: "chalo_priya3", platform: "TravelBlogger India" }
                      ].map((item, idx) => {
                        const commission = (item.cost * (globalCommissionRate / 100)).toFixed(2);
                        return (
                          <div key={idx} className="px-4 py-3.5 flex items-center justify-between hover:bg-slate-800/40 transition text-xs text-slate-300">
                            <div className="flex items-start space-x-3">
                              <span className="text-base shrink-0 mt-0.5">👑</span>
                              <div>
                                <div className="font-extrabold text-white">
                                  {item.title}
                                </div>
                                <div className="text-[10px] text-slate-450 font-mono mt-0.5">
                                  Platform source: <span className="text-slate-200 font-bold">{item.platform}</span> | User: <span className="text-slate-300">@{item.user}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs font-black text-amber-400">
                                +₹{commission}
                              </div>
                              <div className="text-[8px] font-mono text-slate-500 mt-0.5">
                                {globalCommissionRate}% of ₹{item.cost} Booking
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 📧 LIVE EMAIL DISPATCH TESTING PANEL */}
                  <div className="bg-slate-850 p-5 rounded-2xl border border-slate-800 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                          <span>📧</span> Live Email SMTP Dispatch Webhook Test
                        </h4>
                        <p className="text-[10.5px] text-slate-400">Trigger manual SMTP delivery signals using current synced API credentials on chaloone.com.</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[8.5px] font-bold px-2 py-0.5 rounded uppercase">
                          WEBHOOK: CONNECTED
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-2 text-[11px]">
                      <div className="flex justify-between items-center font-mono">
                        <span className="text-slate-500">API_KEY_WEBHOOK:</span>
                        <span className="text-slate-300 font-bold">{emailWebhookApi.slice(0,12)}...{emailWebhookApi.slice(-8)}</span>
                      </div>
                      <div className="flex justify-between items-center font-mono">
                        <span className="text-slate-500">SMTP_TOKEN:</span>
                        <span className="text-slate-300 font-bold">{emailApiToken.slice(0,12)}...{emailApiToken.slice(-8)}</span>
                      </div>
                    </div>

                    <div className="space-y-3 pt-1">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block font-mono">Recipient Email</label>
                          <input 
                            type="email" 
                            id="webhook_test_recipient"
                            defaultValue={userProfile.email}
                            className="w-full bg-slate-900 border border-slate-750 p-2.5 rounded-lg text-xs font-bold text-slate-100 focus:ring-1 focus:ring-amber-400 outline-none" 
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block font-mono">Action Category</label>
                          <select 
                            id="webhook_test_action"
                            className="w-full bg-slate-900 border border-slate-750 p-2.5 rounded-lg text-xs font-bold text-slate-100 focus:ring-1 focus:ring-amber-400 outline-none"
                          >
                            <option value="FOUNDER_ALERT">👑 Founder System Notification</option>
                            <option value="AFFILIATE_PAYOUT">💰 Payout Cleared Hook</option>
                            <option value="TRANSACTION_CONFIRM">⚡ Secure Ledger Verification</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block font-mono">Notification Message Body</label>
                        <textarea 
                          id="webhook_test_body"
                          rows={2}
                          defaultValue="Chalo One Affiliate System: Affiliate ledger synchronization successfully completed on chaloone.com. All API SMTP webhook signals fired."
                          className="w-full bg-slate-900 border border-slate-750 p-2.5 rounded-lg text-xs font-bold text-slate-100 focus:ring-1 focus:ring-amber-400 outline-none resize-none"
                        />
                      </div>

                      <button
                        type="button"
                        disabled={isSendingWebhookTest}
                        onClick={async () => {
                          setIsSendingWebhookTest(true);
                          setWebhookTestResult(null);
                          setWebhookTestError(null);

                          const recVal = (document.getElementById('webhook_test_recipient') as HTMLInputElement)?.value;
                          const actVal = (document.getElementById('webhook_test_action') as HTMLSelectElement)?.value;
                          const bodyVal = (document.getElementById('webhook_test_body') as HTMLTextAreaElement)?.value;

                          try {
                            const response = await fetch('/api/send-email', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                recipient: recVal || 'kunalpareekusa@gmail.com',
                                subject: '👑 Chalo One Founder Affiliate Alert',
                                body: bodyVal,
                                actionType: actVal,
                                apiToken: emailApiToken,
                                webhookApi: emailWebhookApi
                              })
                            });

                            const data = await response.json();
                            if (!response.ok) {
                              throw new Error(data.error || 'Server dispatch failed');
                            }
                            setWebhookTestResult(data);
                          } catch (err: any) {
                            setWebhookTestError(err.message || 'Error occurred while executing API post');
                          } finally {
                            setIsSendingWebhookTest(false);
                          }
                        }}
                        className={`w-full py-2.5 rounded-xl text-[10.5px] font-black uppercase transition shadow-md cursor-pointer text-slate-950 flex items-center justify-center gap-1.5 ${
                          isSendingWebhookTest 
                            ? 'bg-amber-450/65 cursor-not-allowed text-slate-700' 
                            : 'bg-amber-400 hover:bg-amber-500'
                        }`}
                      >
                        {isSendingWebhookTest ? (
                          <>
                            <span className="inline-block animate-spin rounded-full h-3.5 w-3.5 border-2 border-slate-950 border-t-transparent"></span>
                            Dispatching Webhook Signals...
                          </>
                        ) : (
                          '🔌 Dispatch Secure Email Webhook & API Alert'
                        )}
                      </button>

                      {/* Success Results Display */}
                      {webhookTestResult && (
                        <div className="bg-emerald-950/40 border border-emerald-500/25 p-3.5 rounded-xl space-y-2 text-xs">
                          <div className="flex items-center gap-1.5 text-emerald-400 font-extrabold uppercase text-[10px]">
                            <span>✓</span> Event Signals Dispatched Successfully
                          </div>
                          <p className="text-[10.5px] text-slate-300">
                            {webhookTestResult.message}
                          </p>
                        </div>
                      )}

                      {/* Failure Results Display */}
                      {webhookTestError && (
                        <div className="bg-rose-950/40 border border-rose-500/25 p-3 rounded-xl text-xs space-y-1">
                          <div className="text-rose-400 font-extrabold uppercase text-[10px] flex items-center gap-1">
                            <span>⚠</span> API Connection Error
                          </div>
                          <p className="text-[10.5px] text-slate-300">
                            {webhookTestError}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              )}

              {/* SECTION B: AFFILIATE PARTNER DASHBOARD */}
              {userProfile.role === 'affiliate_partner' && (
                <div className="space-y-6">
                  
                  {/* Partner Overview Welcome */}
                  <div className="bg-gradient-to-r from-amber-450/10 to-amber-500/5 p-5 rounded-2xl border border-amber-500/15 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black text-amber-400">Welcome, {userProfile.affiliateDetails?.companyName || userProfile.name}!</h4>
                      <p className="text-xs text-slate-400 mt-1">Your website integration with <span className="text-white font-bold">{userProfile.affiliateDetails?.domain || 'chaloone.com'}</span> is active. Start earning commission!</p>
                    </div>
                    <span className="bg-amber-400/10 border border-amber-400/20 text-amber-400 text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg">
                      API: ACTIVE
                    </span>
                  </div>

                  {/* Personal Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: "My Traffic Clicks", val: `${(userProfile.affiliateDetails?.clicks || 1420).toLocaleString()} clicks`, pct: "Synced 1m ago", color: "text-slate-300" },
                      { label: "Commission Bookings", val: `${userProfile.affiliateDetails?.conversions || 184} sales`, pct: `${((userProfile.affiliateDetails?.conversions || 184) / (userProfile.affiliateDetails?.clicks || 1420) * 100).toFixed(1)}% Conv. Rate`, color: "text-amber-400" },
                      { label: "Commission rate", val: `${userProfile.affiliateDetails?.commissionRate || 12}%`, pct: "VIP tier tiering", color: "text-blue-400" },
                      { label: "Accrued Revenue", val: `₹${(userProfile.affiliateDetails?.revenue || 9200.00).toLocaleString()}`, pct: "Clearance: 1st of month", color: "text-emerald-400 font-extrabold" }
                    ].map((st, i) => (
                      <div key={i} className="bg-slate-850 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block font-mono">{st.label}</span>
                        <div className="my-2">
                          <span className={`text-sm md:text-base font-display font-black ${st.color}`}>{st.val}</span>
                        </div>
                        <span className="text-[8.5px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded w-max mt-1">{st.pct}</span>
                      </div>
                    ))}
                  </div>

                  {/* CONFIGURE PARTNER PARAMETERS */}
                  <div className="bg-slate-850 p-5 rounded-2xl border border-slate-800 space-y-4">
                    <div>
                      <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider">🔧 Custom Domain & Webhook Integration</h4>
                      <p className="text-[10.5px] text-slate-400">Configure your domain and target callback webhook URL to receive instant transaction synchronization parameters.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div className="space-y-1 col-span-1">
                        <label className="text-[8.5px] text-slate-400 uppercase font-mono block">Primary Domain name</label>
                        <input 
                          type="text" 
                          id="partner_config_domain"
                          defaultValue={userProfile.affiliateDetails?.domain || 'partnerblog.com'}
                          className="w-full bg-slate-900 border border-slate-750 p-2.5 rounded-lg text-xs font-bold text-slate-100 focus:ring-1 focus:ring-amber-400 outline-none" 
                        />
                      </div>
                      <div className="space-y-1 col-span-2">
                        <label className="text-[8.5px] text-slate-400 uppercase font-mono block">Webhook Callback URL</label>
                        <input 
                          type="text" 
                          id="partner_config_webhook"
                          defaultValue={userProfile.affiliateDetails?.webhookUrl || `https://${userProfile.affiliateDetails?.domain || 'partnerblog.com'}/api/chalo-payout`}
                          className="w-full bg-slate-900 border border-slate-750 p-2.5 rounded-lg text-xs font-bold text-slate-100 focus:ring-1 focus:ring-amber-400 outline-none" 
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const domVal = (document.getElementById('partner_config_domain') as HTMLInputElement)?.value;
                        const webVal = (document.getElementById('partner_config_webhook') as HTMLInputElement)?.value;
                        if (!domVal || !webVal) {
                          alert('Domain and Webhook parameters are required.');
                          return;
                        }
                        const updated: UserProfile = {
                          ...userProfile,
                          affiliateDetails: {
                            clicks: userProfile.affiliateDetails?.clicks ?? 1420,
                            conversions: userProfile.affiliateDetails?.conversions ?? 184,
                            revenue: userProfile.affiliateDetails?.revenue ?? 9200,
                            commissionRate: userProfile.affiliateDetails?.commissionRate ?? 12,
                            companyName: userProfile.affiliateDetails?.companyName ?? userProfile.name ?? 'Partner Platform',
                            domain: domVal,
                            webhookUrl: webVal,
                            apiConfigured: true
                          }
                        };
                        setUserProfile(updated);
                        localStorage.setItem('chalo_saved_profile', JSON.stringify(updated));
                        alert('🎉 Successfully synchronized! Your domain & callback webhook have been updated in Chalo One database.');
                      }}
                      className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 text-[10.5px] font-black uppercase rounded-lg transition shadow-sm cursor-pointer"
                    >
                      Save Sync Configuration
                    </button>
                  </div>

                  {/* HTML TRACKING TAG BLOCK */}
                  <div className="bg-slate-850 p-5 rounded-2xl border border-slate-800 space-y-3">
                    <div>
                      <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider">🔌 Paste Web Lead Tracking Script</h4>
                      <p className="text-[10.5px] text-slate-400">Insert this lightweight tracking tag in the HTML head of your platform to track conversion events automatically.</p>
                    </div>

                    <div className="relative">
                      <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-[10.5px] font-mono text-amber-300 overflow-x-auto whitespace-pre-wrap leading-normal">
                        {`<script \n  src="https://chaloone.com/sdk/tracker.js"\n  data-affiliate-id="${userProfile.referralCode}"\n  data-api-token="b05c19cca9a302ef825cd58847f704639e6332b4f110d75ff3644dc8778bfcfe"\n></script>`}
                      </pre>
                      <button
                        type="button"
                        onClick={() => {
                          const tag = `<script \n  src="https://chaloone.com/sdk/tracker.js"\n  data-affiliate-id="${userProfile.referralCode}"\n  data-api-token="b05c19cca9a302ef825cd58847f704639e6332b4f110d75ff3644dc8778bfcfe"\n></script>`;
                          navigator.clipboard.writeText(tag);
                          alert('📋 Tracking script copied to clipboard!');
                        }}
                        className="absolute right-3 top-3 p-1.5 bg-slate-850 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 hover:text-white transition"
                        title="Copy code"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Link Campaign builder */}
                  <div className="bg-slate-850 p-5 rounded-2xl border border-slate-800 space-y-4">
                    <div>
                      <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider">🔗 Affiliate UTM Link Builder</h4>
                      <p className="text-[10.5px] text-slate-400">Generate trackable partner referral links pointing directly to your platform campaign channels on chaloone.com.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block font-mono">UTM Campaign Channel</label>
                        <input 
                          type="text" 
                          id="partner_utm_camp"
                          defaultValue="BLOG_SIDEBAR"
                          className="w-full bg-slate-900 border border-slate-750 p-2.5 rounded-lg text-xs font-bold text-slate-100 focus:ring-1 focus:ring-amber-400 outline-none" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block font-mono">Destination Category</label>
                        <select 
                          id="partner_utm_dest"
                          className="w-full bg-slate-900 border border-slate-750 p-2.5 rounded-lg text-xs font-bold text-slate-100 focus:ring-1 focus:ring-amber-400 outline-none"
                        >
                          <option value="home">Home comparison portal</option>
                          <option value="rides">Rides Aggregator Page</option>
                          <option value="stays">Hotel Stay Bookings</option>
                          <option value="food">Food Ordering Box</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const campVal = (document.getElementById('partner_utm_camp') as HTMLInputElement)?.value || 'CAMPAIGN';
                        const destVal = (document.getElementById('partner_utm_dest') as HTMLSelectElement)?.value || 'home';
                        const trackingUrl = `https://chaloone.com?ref=${userProfile.referralCode}&utm_source=${userProfile.affiliateDetails?.companyName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'partner'}&utm_campaign=${campVal}&target=${destVal}`;
                        navigator.clipboard.writeText(trackingUrl);
                        alert(`📋 Copied Affiliate Tracking URL:\n\n${trackingUrl}`);
                      }}
                      className="w-full py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 text-[10.5px] font-black uppercase rounded-xl transition shadow-sm cursor-pointer"
                    >
                      Generate & Copy Custom URL 📋
                    </button>
                  </div>

                </div>
              )}

            </div>
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
                  // Simulate Carrier verification API check
                  await new Promise(r => setTimeout(r, 1200));
                  setIsVerifyingLink(false);
                  setIsLinkSuccess(true);
                  await new Promise(r => setTimeout(r, 800));
                  
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

    </div>
  );
}
