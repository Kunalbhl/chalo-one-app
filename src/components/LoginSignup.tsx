import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Phone, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  User, 
  Calendar, 
  Gift, 
  ShieldCheck, 
  CheckCircle,
  Car,
  ShoppingCart,
  Zap,
  Fingerprint,
  Scan,
  KeyRound,
  ArrowRight
} from 'lucide-react';
import { UserProfile, AppPreferences } from '../types';

interface LoginSignupProps {
  onLoginSuccess: (user: UserProfile, prefs?: AppPreferences) => void;
  savedPreferences: AppPreferences;
}

export default function LoginSignup({ onLoginSuccess, savedPreferences }: LoginSignupProps) {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [emailOrPhone, setEmailOrPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);

  // Signup fields
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [dob, setDob] = useState<string>('');
  const [gender, setGender] = useState<string>('Male');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [signupReferralCode, setSignupReferralCode] = useState<string>('');

  // Affiliate Partner parameters
  const [isAffiliate, setIsAffiliate] = useState<boolean>(false);
  const [companyName, setCompanyName] = useState<string>('');
  const [partnerDomain, setPartnerDomain] = useState<string>('chaloone.com');

  // Quick Biometric login preference options for returning users
  const [hasRegisteredUser, setHasRegisteredUser] = useState<boolean>(false);
  const [registeredUser, setRegisteredUser] = useState<UserProfile | null>(null);

  // All registered users database fallback
  const [allUsers, setAllUsers] = useState<any[]>(() => {
    const saved = localStorage.getItem('chalo_all_users');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    const defaultList = [
      {
        id: 'user_kunal',
        name: 'Kunal Pareek',
        phone: '+91 99882 10492',
        email: 'kunalpareekusa@gmail.com',
        dob: '1998-05-15',
        gender: 'Male',
        savedAddresses: [],
        referralCode: 'Kunal_911',
        role: 'super_admin',
        avatarUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix',
        password: 'password123'
      }
    ];
    localStorage.setItem('chalo_all_users', JSON.stringify(defaultList));
    return defaultList;
  });

  useEffect(() => {
    // Check if there is already a registered user stored
    const saved = localStorage.getItem('chalo_saved_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setHasRegisteredUser(true);
        setRegisteredUser(parsed);
        // Pre-fill login
        setEmailOrPhone(parsed.email || parsed.phone || '');
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrPhone.trim() || !password.trim()) {
      alert('Please fill in your credentials.');
      return;
    }

    // Attempt to match with saved profile in our registered users database
    const matchedUser = allUsers.find(
      u => u.email.toLowerCase() === emailOrPhone.toLowerCase().trim() || u.phone.trim() === emailOrPhone.trim()
    );

    if (!matchedUser) {
      alert('❌ This account Email ID or Phone Number is not registered. Please click the "Register" tab to create a new account.');
      return;
    }

    if (matchedUser.password && matchedUser.password !== password) {
      // Direct pass for Kunal's convenience or direct credentials
      if (emailOrPhone.toLowerCase().trim() !== 'kunalpareekusa@gmail.com' || password !== 'password123') {
        alert('❌ Incorrect password. Please try again.');
        return;
      }
    }

    const authenticatedUser: UserProfile = {
      id: matchedUser.id,
      name: matchedUser.name,
      phone: matchedUser.phone,
      email: matchedUser.email,
      dob: matchedUser.dob,
      gender: matchedUser.gender,
      savedAddresses: matchedUser.savedAddresses || [],
      referralCode: matchedUser.referralCode,
      referredBy: matchedUser.referredBy,
      role: matchedUser.role || (matchedUser.email.toLowerCase() === 'kunalpareekusa@gmail.com' ? 'super_admin' : 'user'),
      avatarUrl: matchedUser.avatarUrl || 'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix',
      affiliateDetails: matchedUser.affiliateDetails
    };

    // Save remember me configuration
    if (rememberMe) {
      localStorage.setItem('chalo_remember_me', 'true');
      localStorage.setItem('chalo_saved_profile', JSON.stringify(authenticatedUser));
    } else {
      localStorage.removeItem('chalo_remember_me');
    }

    localStorage.setItem('chalo_is_logged_in', 'true');
    onLoginSuccess(authenticatedUser);
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim() || !dob.trim() || !password.trim()) {
      alert('Please fill out all fields to create your account.');
      return;
    }

    const emailLower = email.toLowerCase().trim();
    const existing = allUsers.find(u => u.email.toLowerCase() === emailLower);
    if (existing) {
      alert(`❌ An account with the Email ID "${emailLower}" is already registered. Please sign in instead.`);
      return;
    }

    // Generate own referral code: Name + some random code
    const generatedReferral = `${name.replace(/\s+/g, '')}_${Math.floor(100 + Math.random() * 900)}`;

    let inviteeRewardAllocated = false;
    let referrerName = '';

    // Validate the entered referral code
    if (signupReferralCode.trim()) {
      const codeToSearch = signupReferralCode.trim().toLowerCase();
      const referrerUser = allUsers.find(u => u.referralCode && u.referralCode.toLowerCase() === codeToSearch);
      
      if (referrerUser) {
        referrerName = referrerUser.name;
        inviteeRewardAllocated = true;
        
        // Allocate points to referrer
        const refEmail = referrerUser.email.toLowerCase();
        const refWalletStr = localStorage.getItem(`chalo_wallet_${refEmail}`);
        let refWallet = { points: 4200, balance: 350.00, history: [] as any[] };
        if (refWalletStr) {
          try { refWallet = JSON.parse(refWalletStr); } catch(e) {}
        }
        refWallet.points += 2000;
        refWallet.history.unshift({
          id: 'TXN_' + Math.floor(100000 + Math.random() * 900000),
          description: `Referral signup bonus: Invited ${name}`,
          type: 'credit',
          amount: 100.00, // Equivalent value
          pointsSpentOrEarned: 2000,
          timestamp: new Date().toLocaleDateString()
        });
        localStorage.setItem(`chalo_wallet_${refEmail}`, JSON.stringify(refWallet));
      } else {
        alert('⚠️ Warning: The referral code you entered is invalid. Continuing registration without referral bonus.');
      }
    }

    // Set default avatar depending on gender if none is actively selected
    const chosenAvatar = avatarUrl || getPresetAvatarsByGender()[0];

    const newUser: UserProfile & { password?: string } = {
      id: isAffiliate ? 'partner_' + Math.floor(Math.random() * 10000) : 'user_' + Math.floor(Math.random() * 100000),
      name,
      phone,
      email: emailLower,
      dob,
      gender,
      savedAddresses: [],
      referralCode: generatedReferral,
      referredBy: signupReferralCode.trim() || undefined,
      role: isAffiliate ? 'affiliate_partner' : (emailLower === 'kunalpareekusa@gmail.com' ? 'super_admin' : 'user'),
      avatarUrl: chosenAvatar,
      password: password,
      ...(isAffiliate ? {
        affiliateDetails: {
          companyName: companyName || 'Partner Network',
          domain: partnerDomain || 'chaloone.com',
          clicks: 0,
          conversions: 0,
          revenue: 0,
          commissionRate: 12,
          apiConfigured: true,
          isActivated: true
        }
      } : {})
    };

    // Save back to registered users database fallback list
    const updatedUsers = [...allUsers, newUser];
    setAllUsers(updatedUsers);
    localStorage.setItem('chalo_all_users', JSON.stringify(updatedUsers));

    // Save starter wallet for the new registered user
    const startPoints = inviteeRewardAllocated ? 2000 : 0;
    const starterWallet = {
      points: startPoints,
      balance: inviteeRewardAllocated ? 100.00 : 0.00,
      history: inviteeRewardAllocated ? [
        {
          id: 'TXN_' + Math.floor(100000 + Math.random() * 900000),
          description: `Referral welcome bonus via ${referrerName}`,
          type: 'credit',
          amount: 100.00,
          pointsSpentOrEarned: 2000,
          timestamp: new Date().toLocaleDateString()
        }
      ] : []
    };
    localStorage.setItem(`chalo_wallet_${emailLower}`, JSON.stringify(starterWallet));

    localStorage.setItem('chalo_saved_profile', JSON.stringify(newUser));
    localStorage.setItem('chalo_is_logged_in', 'true');
    if (rememberMe) {
      localStorage.setItem('chalo_remember_me', 'true');
    }

    if (inviteeRewardAllocated) {
      alert(`🎉 Registration successful! Welcome to Chalo One, ${name}! You have received 2000 reward points (₹100 cashback equivalent) for signing up with ${referrerName}'s invite code!`);
    } else {
      alert(`🎉 Registration successful! Welcome to Chalo One, ${name}!`);
    }

    onLoginSuccess(newUser);
  };

  // Profile Image Selection / File upload Base64 utility
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

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
    if (gender === 'Male') return MALE_AVATARS;
    if (gender === 'Female') return FEMALE_AVATARS;
    return OTHER_AVATARS;
  };

  // Quick secure options login
  const handleQuickBiometricLogin = (mode: 'fingerprint' | 'faceid' | 'pin') => {
    if (!registeredUser) return;
    
    // Simulate biometric matching
    alert(`🔑 Secure login verified using simulated device ${mode === 'fingerprint' ? 'Fingerprint Scan' : mode === 'faceid' ? 'Face ID Pattern' : 'Passcode PIN'}!`);
    
    localStorage.setItem('chalo_is_logged_in', 'true');
    onLoginSuccess(registeredUser);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 relative overflow-hidden select-none">
      
      {/* GLOWING AMBIENT TOP DESIGN BACKGROUND */}
      <div className="absolute top-[-100px] left-[-100px] w-[350px] h-[350px] rounded-full bg-amber-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-100px] right-[-100px] w-[350px] h-[350px] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />

      {/* TOP HEADER BRAND BAR */}
      <div className="text-center pt-8 space-y-2">
        <div className="inline-flex p-3 bg-gradient-to-br from-amber-400 to-amber-500 rounded-3xl text-slate-950 shadow-lg animate-bounce">
          <Sparkles className="w-7 h-7" />
        </div>
        <div>
          <h1 className="font-display font-black text-2xl tracking-tight uppercase">Chalo One</h1>
          <p className="text-[10px] text-amber-400 font-mono tracking-widest uppercase font-bold">AI Powered One Platform, Compare, Plan, Book & Order</p>
        </div>
      </div>

      {/* MIDDLE CONTAINER: SIGNUP / LOGIN PORTAL */}
      <div className="my-auto py-6 max-w-sm mx-auto w-full">
        <div className="bg-slate-900/80 border border-slate-800 rounded-[32px] p-6 space-y-5 shadow-xl backdrop-blur-md">
          
          {/* LOGIN VS SIGNUP CHIPS SELECTOR */}
          <div className="flex bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800/60">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 rounded-xl text-xs font-black tracking-wider uppercase transition cursor-pointer ${
                isLogin ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 rounded-xl text-xs font-black tracking-wider uppercase transition cursor-pointer ${
                !isLogin ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Register
            </button>
          </div>

          {/* DYNAMIC FORM SEGMENTS */}
          {isLogin ? (
            /* A. LOGIN PORTAL */
            <form onSubmit={handleManualLogin} className="space-y-4">
              <div className="space-y-3">
                
                {/* Email / Mobile */}
                <div className="space-y-1">
                  <label className="text-[9.5px] text-slate-400 font-mono font-black uppercase tracking-wider block">Registered Email or Mobile</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={emailOrPhone}
                      onChange={(e) => setEmailOrPhone(e.target.value)}
                      placeholder="email@example.com or +91 99882..."
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 focus:border-amber-500 focus:outline-none text-xs font-bold text-white transition-colors"
                    />
                    <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                  </div>
                </div>

                {/* Password with Show Password functionality */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[9.5px] text-slate-400 font-mono font-black uppercase tracking-wider">Account Access Password</label>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-3 rounded-2xl bg-slate-950 border border-slate-800 focus:border-amber-500 focus:outline-none text-xs font-mono text-white transition-colors"
                    />
                    <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3.5 text-slate-500 hover:text-white transition"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Affiliate Toggles */}
                <div className="space-y-2 pt-1 px-1">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-slate-800 text-amber-500 focus:ring-0 bg-slate-950 cursor-pointer w-4 h-4"
                      />
                      <span className="text-[10.5px] text-slate-400 font-bold select-none">Remember Me on this device</span>
                    </label>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-800/50 pt-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isAffiliate}
                        onChange={(e) => setIsAffiliate(e.target.checked)}
                        className="rounded border-slate-800 text-amber-500 focus:ring-0 bg-slate-950 cursor-pointer w-4 h-4"
                      />
                      <span className="text-[10.5px] text-amber-400 font-extrabold uppercase select-none">🔑 I am an Affiliate Partner</span>
                    </label>
                  </div>
                </div>

                {isAffiliate && (
                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-850 space-y-2 text-xs animate-fade-in">
                    <span className="text-[9px] text-amber-500 font-mono font-black uppercase tracking-wider block">Affiliate Platform Credentials</span>
                    <div className="space-y-1">
                      <label className="text-[8.5px] text-slate-500 uppercase font-mono block">Registered Platform Name</label>
                      <input 
                        type="text"
                        placeholder="e.g. TravelBlogger India"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 p-2 rounded-lg text-xs font-bold text-white outline-none focus:border-amber-400"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8.5px] text-slate-500 uppercase font-mono block">Primary Sync Domain</label>
                      <input 
                        type="text"
                        placeholder="e.g. travelblog.com"
                        value={partnerDomain}
                        onChange={(e) => setPartnerDomain(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 p-2 rounded-lg text-xs font-bold text-white outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                )}

              </div>

              {/* Submit Manual login */}
              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs tracking-widest uppercase rounded-2xl transition shadow-lg cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <span>Enter Chalo One</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* B. DEVICE QUICK BIOMETRIC UNLOCK FALLBACK FOR RETURNING USERS */}
              {hasRegisteredUser && registeredUser && (
                <div className="pt-4 border-t border-slate-800/60 space-y-2.5">
                  <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-widest block text-center">Or Unlock instantly with secure choices</span>
                  
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleQuickBiometricLogin('fingerprint')}
                      className="p-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800/60 rounded-2xl flex flex-col items-center justify-center space-y-1 transition cursor-pointer"
                    >
                      <Fingerprint className="w-5 h-5 text-amber-400" />
                      <span className="text-[8.5px] font-bold text-slate-400">Fingerprint</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickBiometricLogin('faceid')}
                      className="p-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800/60 rounded-2xl flex flex-col items-center justify-center space-y-1 transition cursor-pointer"
                    >
                      <Scan className="w-5 h-5 text-amber-400" />
                      <span className="text-[8.5px] font-bold text-slate-400">Face ID</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickBiometricLogin('pin')}
                      className="p-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800/60 rounded-2xl flex flex-col items-center justify-center space-y-1 transition cursor-pointer"
                    >
                      <KeyRound className="w-5 h-5 text-amber-400" />
                      <span className="text-[8.5px] font-bold text-slate-400">Pass PIN</span>
                    </button>
                  </div>
                </div>
              )}
            </form>
          ) : (
            /* B. SIGNUP PORTAL WITH ALL INFORMATION EXPLICITLY REQUIRED */
            <form onSubmit={handleSignupSubmit} className="space-y-3.5 text-xs">
              
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 font-mono font-black uppercase tracking-wider block">Full Name</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Kunal Pareek"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 focus:outline-none text-xs font-bold text-white"
                  />
                  <User className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                </div>
              </div>

              {/* Email ID & Phone number Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 font-mono font-black uppercase tracking-wider block">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="kunal@gmail.com"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 focus:outline-none text-xs font-bold text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 font-mono font-black uppercase tracking-wider block">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 99882 10492"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 focus:outline-none text-xs font-bold text-white font-mono"
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 font-mono font-black uppercase tracking-wider block">Set Account Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 focus:outline-none text-xs font-mono text-white"
                  />
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-500 hover:text-white transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Date of Birth & Gender */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 font-mono font-black uppercase tracking-wider block">Date of Birth</label>
                  <input
                    type="date"
                    required
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 focus:outline-none text-xs font-bold text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 font-mono font-black uppercase tracking-wider block">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-2 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 focus:outline-none text-xs font-bold text-white appearance-none"
                  >
                    <option value="Male" className="bg-slate-900">Male</option>
                    <option value="Female" className="bg-slate-900">Female</option>
                    <option value="Other" className="bg-slate-900">Other</option>
                  </select>
                </div>
              </div>

              {/* Profile Avatar Selection */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[9px] text-slate-400 font-mono font-black uppercase tracking-wider block">Choose or Upload Profile Pic</label>
                <div className="flex items-center space-x-3">
                  {/* Active Selected */}
                  <img
                    src={avatarUrl || getPresetAvatarsByGender()[0]}
                    alt="Selected Avatar"
                    className="w-10 h-10 rounded-full border border-amber-500 object-cover shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Preset options */}
                  <div className="flex space-x-1.5 overflow-x-auto scrollbar-none">
                    {getPresetAvatarsByGender().map((av, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setAvatarUrl(av)}
                        className={`w-8 h-8 rounded-full border overflow-hidden shrink-0 transition cursor-pointer ${
                          avatarUrl === av ? 'border-amber-500 scale-110' : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={av} alt="Preset Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-2 bg-slate-950 p-2 rounded-xl border border-slate-800/50">
                  <span className="text-[8.5px] text-slate-400 font-mono font-bold uppercase shrink-0">Upload Custom:</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="text-[8px] text-slate-400 cursor-pointer file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[8px] file:font-bold file:bg-slate-800 file:text-white hover:file:bg-slate-700"
                  />
                </div>
              </div>

              {/* Referral Code (Optional) */}
              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 font-mono font-black uppercase tracking-wider block flex justify-between">
                  <span>Referral Code (Optional)</span>
                  <span className="text-amber-400 text-[8.5px] font-bold">Earn 2000 smart points (₹100)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={signupReferralCode}
                    onChange={(e) => setSignupReferralCode(e.target.value)}
                    placeholder="Enter inviter code e.g. Kunal_911"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 focus:outline-none text-xs font-mono text-white placeholder:text-slate-600 font-bold uppercase"
                  />
                  <Gift className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                </div>
              </div>

              {/* Affiliate Registration Checkbox & fields */}
              <div className="border-t border-slate-800/50 pt-2 space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAffiliate}
                    onChange={(e) => setIsAffiliate(e.target.checked)}
                    className="rounded border-slate-800 text-amber-500 focus:ring-0 bg-slate-950 cursor-pointer w-4 h-4"
                  />
                  <span className="text-[10.5px] text-amber-400 font-extrabold uppercase select-none">🔌 Register as Affiliate Partner</span>
                </label>

                {isAffiliate && (
                  <div className="grid grid-cols-2 gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
                    <div className="space-y-1">
                      <label className="text-[8.5px] text-slate-500 uppercase font-mono block">Platform / Company</label>
                      <input 
                        type="text"
                        required={isAffiliate}
                        placeholder="e.g. TravelBlogger"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 p-2 rounded-lg text-[10px] text-white outline-none focus:border-amber-400 font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8.5px] text-slate-500 uppercase font-mono block">Primary Web Domain</label>
                      <input 
                        type="text"
                        required={isAffiliate}
                        placeholder="e.g. travelblog.com"
                        value={partnerDomain}
                        onChange={(e) => setPartnerDomain(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 p-2 rounded-lg text-[10px] text-white outline-none focus:border-amber-400 font-bold"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Registration */}
              <button
                type="submit"
                className="w-full mt-2 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs tracking-wider uppercase rounded-xl transition shadow-lg cursor-pointer"
              >
                Create Account & Settle In
              </button>
            </form>
          )}

        </div>
      </div>

      {/* BOTTOM SLIDE-SHOW CAROUSEL: DISCOVER BENEFITS & TIME SAVING ADVANTAGES */}
      <div className="mt-auto pb-4 max-w-sm mx-auto w-full space-y-3">
        <span className="text-[9.5px] text-slate-500 font-mono font-extrabold uppercase tracking-widest block text-center">⏳ Why Chalo One?</span>
        
        <div className="bg-slate-900/60 border border-slate-900 rounded-3xl p-4 grid grid-cols-2 gap-3 text-left">
          <div className="space-y-1">
            <div className="flex items-center space-x-1">
              <Car className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="text-[10px] font-black uppercase text-slate-200">Rides Aggreg</span>
            </div>
            <p className="text-[9px] text-slate-400 leading-normal">Compares Uber, Ola, Rapido and BluSmart. Saves up to 30% on daily commutes.</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-1">
              <ShoppingCart className="w-3.5 h-3.5 text-orange-400 shrink-0" />
              <span className="text-[10px] font-black uppercase text-slate-200">Super Basket</span>
            </div>
            <p className="text-[9px] text-slate-400 leading-normal">Checks Swiggy One vs Zomato Gold menus. Settle baskets with 1-click flat checkouts.</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-1">
              <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-[10px] font-black uppercase text-slate-200">Utilities Desk</span>
            </div>
            <p className="text-[9px] text-slate-400 leading-normal">Auto-fetches utility invoices from electricity, broadband and mobile networks.</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-1">
              <Gift className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span className="text-[10px] font-black uppercase text-slate-200">Loyalty Coins</span>
            </div>
            <p className="text-[9px] text-slate-400 leading-normal">Earn smart points on every comparison and convert them straight to wallet cash!</p>
          </div>
        </div>
        <div className="text-center text-[8px] text-slate-600 mt-4 font-mono uppercase tracking-widest leading-none">
          © 2026 Chalo One Technologies Private Limited. All Rights Reserved.
        </div>
      </div>

    </div>
  );
}
