import React, { useState } from 'react';
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
  ChevronRight,
  CreditCard,
  Coins,
  Edit,
  Save,
  Check
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
  lockAppInstantly?: () => void;
  securityAuditLogs?: BiometricLog[];
  clearSecurityLogs?: () => void;
  
  // Wallet context
  wallet: ChaloWallet;
  addCoins: (amount: number) => void;
  redeemPointsToCash: (pts: number) => void;
  onLogout?: () => void;
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
  lockAppInstantly,
  securityAuditLogs = [],
  clearSecurityLogs,
  wallet,
  addCoins,
  redeemPointsToCash,
  onLogout
}: AccountPageProps) {
  // Navigation inside Account page
  const [activeSection, setActiveSection] = useState<
    'main' | 'linked_accounts' | 'rules_prefs' | 'security_audit' | 'help_support' | 'payments' | 'saved_addresses'
  >('main');

  // Edit Profile States
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [profileName, setProfileName] = useState<string>(userProfile.name);
  const [profilePhone, setProfilePhone] = useState<string>(userProfile.phone);
  const [profileEmail, setProfileEmail] = useState<string>(userProfile.email);
  const [profileDob, setProfileDob] = useState<string>(userProfile.dob || '');
  const [profileGender, setProfileGender] = useState<string>(userProfile.gender || 'Male');
  const [profileSaveSuccess, setProfileSaveSuccess] = useState<boolean>(false);

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

  // Ticket fields states
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCategory, setTicketCategory] = useState<'Rides' | 'Food' | 'Mart' | 'Stays' | 'Payments' | 'Wallet'>('Rides');
  const [ticketDesc, setTicketDesc] = useState('');

  // Wallet add simulated money state
  const [topUpAmount, setTopUpAmount] = useState<string>('500');
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

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setUserProfile({
      ...userProfile,
      name: profileName,
      phone: profilePhone,
      email: profileEmail,
      dob: profileDob,
      gender: profileGender
    });
    setIsEditingProfile(false);
    setProfileSaveSuccess(true);
    setTimeout(() => setProfileSaveSuccess(false), 2500);
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

  const handleAddTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketDesc.trim()) return;

    const newTicket: SupportTicket = {
      id: "TCK-" + Math.floor(100000 + Math.random() * 900000),
      category: ticketCategory,
      subject: ticketSubject,
      description: ticketDesc,
      status: 'Open',
      createdAt: new Date().toLocaleDateString('en-IN'),
      messages: []
    };

    addSupportTicket(newTicket);
    setTicketSubject('');
    setTicketDesc('');
    alert(`Support Desk ticket generated successfully: ${newTicket.id}. Our customer team is assigned comparison review!`);
  };

  return (
    <div id="account_page_root_container" className="p-4 max-w-xl mx-auto space-y-4 font-sans text-gray-800 pb-24">
      
      {/* HEADER SWITCH */}
      {activeSection !== 'main' && (
        <button
          type="button"
          onClick={() => {
            setActiveSection('main');
            setIsAuditUnlocked(false);
          }}
          className="pb-2 flex items-center space-x-1 text-slate-900 hover:text-amber-600 font-bold text-xs font-display transition uppercase select-none"
        >
          <X className="w-4 h-4" />
          <span>← Back to Account menu</span>
        </button>
      )}

      {/* RENDER ACCORDING TO STATE SWITCH */}
      {activeSection === 'main' ? (
        <div className="space-y-4 animate-fade-in" id="account_main_menu_group">
          
          {/* UPPER SIDE: EDIT PROFILE BLOCK */}
          <div className="bg-white p-5 rounded-3xl border border-gray-150 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full filter blur-xl opacity-50 -mr-6 -mt-6"></div>
            
            <div className="flex justify-between items-start pb-3 border-b border-gray-100 flex-wrap gap-2">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 bg-amber-100 ring-2 ring-amber-400 text-amber-800 rounded-full flex items-center justify-center font-black text-base uppercase shadow-sm select-none">
                  {userProfile.name.slice(0,2).toUpperCase()}
                </div>
                <div>
                  <span className="text-[9px] font-mono tracking-widest font-black uppercase text-amber-600 block bg-amber-50 px-1.5 py-0.5 rounded-sm w-fit border border-amber-200">
                    Chalo Account Holder
                  </span>
                  <h3 className="font-display font-black text-gray-900 text-sm tracking-tight leading-none mt-1.5">
                    {userProfile.name}
                  </h3>
                  <p className="text-[10px] text-gray-400 font-semibold mt-0.5">{userProfile.email}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className="p-1.5 bg-zinc-50 hover:bg-zinc-100 text-gray-800 border-2 border-gray-150 rounded-xl transition text-[10.5px] font-bold tracking-tight uppercase flex items-center space-x-1 shrink-0"
              >
                {isEditingProfile ? <X className="w-3.5 h-3.5" /> : <Edit className="w-3.5 h-3.5" />}
                <span>{isEditingProfile ? 'Cancel' : 'Edit Profile'}</span>
              </button>
            </div>

            {/* Profile fields details (regular view or edit form fields) */}
            {isEditingProfile ? (
              <form onSubmit={handleSaveProfile} className="space-y-3.5 pt-4">
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="flex flex-col space-y-1">
                    <label className="text-[9.5px] font-mono font-black uppercase text-gray-400 tracking-wider">Full Name</label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="bg-gray-50 border border-gray-150 p-2 text-xs rounded-xl font-bold text-gray-800 focus:ring-1 focus:ring-amber-500 outline-none"
                      required
                    />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-[9.5px] font-mono font-black uppercase text-gray-400 tracking-wider">Mobile Number</label>
                    <input
                      type="text"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      className="bg-gray-50 border border-gray-150 p-2 text-xs rounded-xl font-bold text-gray-800 focus:ring-1 focus:ring-amber-500 outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3.5">
                  <div className="flex flex-col space-y-1">
                    <label className="text-[9.5px] font-mono font-black uppercase text-gray-400 tracking-wider">Email Address</label>
                    <input
                      type="email"
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      className="bg-gray-50 border border-gray-150 p-2 text-xs rounded-xl font-bold text-gray-800 focus:ring-1 focus:ring-amber-500 outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="flex flex-col space-y-1">
                    <label className="text-[9.5px] font-mono font-black uppercase text-gray-400 tracking-wider">Date of Birth</label>
                    <input
                      type="date"
                      value={profileDob}
                      onChange={(e) => setProfileDob(e.target.value)}
                      className="bg-gray-50 border border-gray-150 p-2 text-xs rounded-xl font-bold text-gray-800 focus:ring-1 focus:ring-amber-500 outline-none"
                    />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-[9.5px] font-mono font-black uppercase text-gray-400 tracking-wider">Gender</label>
                    <select
                      value={profileGender}
                      onChange={(e) => setProfileGender(e.target.value)}
                      className="bg-gray-50 border border-gray-150 p-2 text-xs rounded-xl font-bold text-gray-800 focus:ring-1 focus:ring-amber-500 outline-none"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-xl font-black text-xs font-display tracking-wider uppercase transition border-b-2 border-amber-650 cursor-pointer flex items-center justify-center space-x-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Update Profile Data</span>
                </button>
              </form>
            ) : (
              <div className="pt-3.5 space-y-3.5 text-xs">
                {profileSaveSuccess && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-2.5 flex items-center space-x-2 animate-pulse">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-[10px] uppercase font-bold tracking-tight">Kunal profile updated instantly! Saved in app.</span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3.5 text-[11px] font-medium text-gray-600">
                  <div>
                    <span className="text-[8px] font-mono font-bold block text-gray-400 uppercase">Phone contact</span>
                    <strong className="text-gray-900 font-bold text-xs">{userProfile.phone}</strong>
                  </div>
                  <div>
                    <span className="text-[8px] font-mono font-bold block text-gray-400 uppercase">Gender identity</span>
                    <strong className="text-gray-900 font-bold text-xs">{userProfile.gender}</strong>
                  </div>
                  <div>
                    <span className="text-[8px] font-mono font-bold block text-gray-400 uppercase">DOB Statement</span>
                    <strong className="text-gray-900 font-bold text-xs">{userProfile.dob || '1998-05-15'}</strong>
                  </div>
                  <div>
                    <span className="text-[8px] font-mono font-bold block text-gray-400 uppercase">Referrals Badge</span>
                    <strong className="text-amber-650 font-bold text-sm font-mono tracking-wider">{userProfile.referralCode}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* LIST OPTIONS AS SECTIONS TO TAP */}
          <div className="bg-white rounded-3xl border border-gray-150 shadow-xs divide-y divide-gray-100 overflow-hidden">
            {[
              {
                id: 'linked_accounts',
                title: '🔗 Linked Aggregator Accounts',
                desc: 'Uber, Swiggy, Ola integration status connect',
                badge: Object.values(connectedAccounts).filter(Boolean).length + ' Accounts'
              },
              {
                id: 'rules_prefs',
                title: '⚙️ Pricing Rules & Preferences',
                desc: 'Comparison optimizers & Biometrics app lock',
                badge: preferences.preferenceMode.toUpperCase()
              },
              {
                id: 'security_audit',
                title: '🛡️ Shield Security Audit logs',
                desc: 'Analyze intrusion hardware ledger and lock state',
                badge: securityAuditLogs.filter(l => l.status === 'failed').length + ' Blocked'
              },
              {
                id: 'payments',
                title: '💰 Wallet Balance & Payment Methods',
                desc: 'Chalo money, loyalty points, transactions history',
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
                      alert(`🚀 "${val.toUpperCase()}" is now set as your single preferred rides operator inside Chalo super comparison search.`);
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
                      alert(`🍔 "${val.toUpperCase()}" is now set as your single preferred food node inside Chalo comparison searches.`);
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
                                    <button 
                                      type="button" 
                                      onClick={() => {
                                        alert(`Sovereign Platform Redirection Indicator: Opening secure login wrapper inside sandbox env for "${item.label}" oauth sync token verification.`);
                                        window.open(item.docUrl, '_blank');
                                      }}
                                      className="text-amber-600 font-black cursor-pointer uppercase hover:underline text-[8px]"
                                    >
                                      Redirect to Platform ↗
                                    </button>
                                  </div>
                                  <p className="font-bold text-slate-800 tracking-tight leading-none truncate">{item.cred}</p> 
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
                                  setConnectedAccounts({
                                    ...connectedAccounts,
                                    [item.key]: !isLinked
                                  });
                                  alert(`Platform status update: "${item.label}" ${!isLinked ? 'Linked successfully with verified credential tokens.' : 'Unlinked successfully.'}`);
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

                <div className="grid grid-cols-1 gap-2.5">
                  {[
                    { val: 'cheapest', label: '💰 Cheapest Option First', desc: 'Pre-calculate net prices (fares + delivery - coupons) first.' },
                    { val: 'fastest', label: '⚡ Fastest Duration First', desc: 'Prioritize drivers and menus within <12 mins.' },
                    { val: 'rated', label: '⭐ Highest Rating First', desc: 'Restrict selection to 4.5+ star captains and kitchens.' },
                    { val: 'ai', label: '🧠 Smart Recommended AI', desc: 'Let Chalo AI scan optimal routes based on time-of-day.' }
                  ].map(opt => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setPreferences({ ...preferences, preferenceMode: opt.val as any })}
                      className={`p-3 rounded-xl border text-left flex items-start justify-between cursor-pointer transition ${
                        preferences.preferenceMode === opt.val ? 'bg-amber-50/50 border-amber-450 text-amber-950 font-bold' : 'bg-white border-gray-150 hover:bg-gray-50'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-gray-900 leading-tight block">{opt.label}</span>
                        <span className="text-[10.5px] text-gray-400 font-medium leading-relaxed block">{opt.desc}</span>
                      </div>
                      {preferences.preferenceMode === opt.val && (
                        <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      )}
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
                    { val: "Doesn't Matter", label: "🍽 Doesn't Matter", desc: "Show all menus" },
                    { val: 'Veg', label: '🟢 Pure Veg', desc: "Exclude meat and eggetarian" },
                    { val: 'Non-Veg', label: '🔴 Non-Veg First', desc: "Show multi-cuisine meats" },
                    { val: 'Eggetarian', label: '🟡 Eggetarian Only', desc: "Exclude meats but allow eggs" }
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

              {/* CYBERSECURITY SWITCHES */}
              <div className="bg-white p-5 rounded-3xl border border-gray-150 shadow-xs space-y-4">
                <div className="pb-2 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center space-x-1.5">
                      <Shield className="w-4 h-4 text-amber-500 mr-1.5" />
                      <span>Biometric Shield Lock settings</span>
                    </h3>
                    <p className="text-[11px] text-gray-400 mt-0.5 font-medium">Require validation for sensitive tasks</p>
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
            </div>
          )}

          {/* C. SECURITY AUDIT CODES */}
          {activeSection === 'security_audit' && (
            <div className="space-y-4" id="section_security_audit">
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
                            if (confirm("Permanently wipe Chalo Security Audit ledger history records? This cannot be undone.")) {
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

          {/* D. PAYMENT METHODS & WALLET ASSETS */}
          {activeSection === 'payments' && (
            <div className="space-y-4 font-sans" id="section_payments">
              
              {/* WALLET BALANCE AND FUND LOADER */}
              <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white p-5 rounded-3xl border border-amber-600 shadow-md space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono tracking-widest font-extrabold uppercase text-amber-100">
                      Chalo Smart Balance
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
                  Reward coins are converted 20 PTS = ₹1. Added cash credit remains safely stored in your Chalo Wallet. Not redeemable to real money.
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
                      alert(`Successfully topped up ₹${val.toFixed(2)} into Chalo Balance!`);
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
                    <p className="text-[10px] text-amber-700 font-medium font-sans">Conversion rate: 20 PTS = ₹1.00. Credits Cash inside your Chalo Wallet immediately.</p>
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
                      alert(`🎉 Success! Converted ${pointsToRedeem.toLocaleString('en-US')} reward points into ₹${(pointsToRedeem / 20).toFixed(2)} Chalo local wallet credit.`);
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
                      Chalo Wallet Only
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
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">Chalo Wallet History Ledger</span>
                    <p className="text-[10.5px] text-gray-400 font-semibold font-sans mt-0.5">Filtered by specific payment channels & associated wallets</p>
                  </div>
                  
                  {/* Name-wise payment filter option list */}
                  <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200">
                    {(['All', 'Card', 'UPI', 'Chalo Wallet', 'Paytm Wallet', 'Amazon Pay'] as const).map(pill => (
                      <button
                        key={pill}
                        type="button"
                        onClick={() => setTxnFilter(pill as any)}
                        className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase transition cursor-pointer ${
                          (txnFilter === pill || (txnFilter === 'Wallet' && pill === 'Chalo Wallet')) ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
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
                      if (txnFilter === 'Chalo Wallet' || txnFilter === 'Wallet') return isChalo;
                      if (txnFilter === 'Paytm Wallet') return isPaytm;
                      if (txnFilter === 'Amazon Pay') return isAmazon;
                      return true;
                    })
                    .map(txn => {
                      const desc = txn.description.toLowerCase();
                      
                      // Auto classify badge style and text
                      let methodBadge = 'Chalo Wallet';
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
                    if (txnFilter === 'Chalo Wallet') return isChalo;
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
              {/* ACCORDION FAQS */}
              <div className="bg-white p-5 rounded-3xl border border-gray-150 shadow-xs space-y-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-0.5">Chalo Support Center Guild</h3>
                <div className="space-y-2">
                  {FAQS.map((faq, i) => {
                    const isOpen = expandedFAQIndex === i;
                    return (
                      <div key={i} className="border-b border-gray-100 last:border-none pb-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setExpandedFAQIndex(isOpen ? null : i)}
                          className="w-full flex justify-between items-center text-xs font-bold text-gray-900 hover:text-amber-600 transition text-left cursor-pointer"
                        >
                          <span className="leading-snug">{faq.q}</span>
                          {isOpen ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
                        </button>
                        {isOpen && (
                          <p className="text-[11px] text-gray-500 mt-2 font-medium leading-relaxed pl-1">
                            {faq.a}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* FILED SUPPORT TICKET ACCORDION LIST */}
              {supportTickets.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-0.5 font-mono">Active Filed Tickets</span>
                  <div className="space-y-2">
                    {supportTickets.map(ticket => (
                      <div key={ticket.id} className="bg-white p-4 rounded-3xl border border-gray-150 shadow-xs space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <div>
                            <span className="text-[8.5px] bg-amber-50 text-amber-700 font-extrabold px-2 py-0.5 rounded border border-amber-200 mr-2 uppercase">
                              {ticket.category}
                            </span>
                            <span className="font-mono text-gray-400 text-[10.5px] font-bold">{ticket.id}</span>
                          </div>
                          <span className="text-[9px] font-mono font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded">
                            {ticket.status}
                          </span>
                        </div>
                        <h4 className="text-xs font-black text-gray-900 font-display leading-tight">{ticket.subject}</h4>
                        <p className="text-xs text-gray-500 leading-normal font-medium">{ticket.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CREATE SUPPORT TICKET DISPATCH */}
              <div className="bg-white p-5 rounded-3xl border border-gray-150 shadow-xs space-y-4">
                <div className="border-b border-gray-100 pb-2">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Connect with Support Desk</h3>
                  <p className="text-[11px] mt-0.5 text-gray-400 font-semibold leading-relaxed">Submit a comparative query for rides travel/food orders discrepancy</p>
                </div>

                <form onSubmit={handleAddTicket} className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Issue Category</label>
                      <select
                        value={ticketCategory}
                        onChange={(e) => setTicketCategory(e.target.value as any)}
                        className="bg-gray-50 border border-gray-150 p-2 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-amber-500"
                      >
                        <option value="Rides">🚕 Ride Services</option>
                        <option value="Food">🍿 Food delivery</option>
                        <option value="Mart">🛒 Quick Groceries</option>
                        <option value="Stays">🏨 Staying deals</option>
                        <option value="Payments">💳 Card payments</option>
                        <option value="Wallet">💰 Points & wallet</option>
                      </select>
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Subject Title</label>
                      <input
                        type="text"
                        value={ticketSubject}
                        onChange={(e) => setTicketSubject(e.target.value)}
                        placeholder="e.g. Uber excess fare debate"
                        className="bg-gray-50 border border-gray-150 p-2 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-amber-550"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex flex-col space-y-1 text-xs">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Query Description</label>
                    <textarea
                      value={ticketDesc}
                      onChange={(e) => setTicketDesc(e.target.value)}
                      rows={3}
                      placeholder="Narrate incident details, platform comparison screenshot summaries..."
                      className="bg-gray-50 border border-gray-150 p-2.5 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-amber-550"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-slate-900 hover:bg-black text-white text-[11px] font-black uppercase py-2.5 rounded-xl transition cursor-pointer"
                  >
                    Dispatch Support Ticket
                  </button>
                </form>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
