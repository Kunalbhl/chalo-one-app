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

  // Quick Biometric login preference options for returning users
  const [hasRegisteredUser, setHasRegisteredUser] = useState<boolean>(false);
  const [registeredUser, setRegisteredUser] = useState<UserProfile | null>(null);

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

    // Attempt to match with saved profile (or allow a fallback default)
    let authenticatedUser: UserProfile;

    if (registeredUser && (emailOrPhone === registeredUser.email || emailOrPhone === registeredUser.phone)) {
      authenticatedUser = registeredUser;
    } else {
      // Create or use default Kunal Pareek credentials as standard fallback
      authenticatedUser = {
        id: 'user_kunal',
        name: 'Kunal Pareek',
        phone: emailOrPhone.includes('@') ? '+91 99882 10492' : emailOrPhone,
        email: emailOrPhone.includes('@') ? emailOrPhone : 'kunalpareekusa@gmail.com',
        dob: '1998-05-15',
        gender: 'Male',
        savedAddresses: [],
        referralCode: 'CHALO911KP',
        avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=150'
      };
    }

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

    const newUser: UserProfile = {
      id: 'user_' + Math.floor(Math.random() * 100000),
      name,
      phone,
      email,
      dob,
      gender,
      savedAddresses: [],
      referralCode: 'CHALO' + Math.floor(100 + Math.random() * 900) + name.slice(0, 2).toUpperCase(),
      avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&q=80&w=150'
    };

    localStorage.setItem('chalo_saved_profile', JSON.stringify(newUser));
    localStorage.setItem('chalo_is_logged_in', 'true');
    if (rememberMe) {
      localStorage.setItem('chalo_remember_me', 'true');
    }

    alert(`🎉 Registration successful! Welcome to Chalo One, ${name}!`);
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

  // Preset Avatar selects
  const PRESET_AVATARS = [
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=150', // Abstract pink-blue silk
    'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&q=80&w=150', // 3D Pastel Geometry
    'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?auto=format&fit=crop&q=80&w=150', // Colorful Dynamic Wave Lines
    'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=150'  // Abstract Dark Gold Geometry
  ];

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

                {/* Remember Me Toggle */}
                <div className="flex items-center justify-between pt-1 px-1">
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

              </div>

              {/* Submit Manual login */}
              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs tracking-widest uppercase rounded-2xl transition shadow-lg cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <span>Enter Super App</span>
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
                    src={avatarUrl || PRESET_AVATARS[0]}
                    alt="Selected Avatar"
                    className="w-10 h-10 rounded-full border border-amber-500 object-cover shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Preset options */}
                  <div className="flex space-x-1.5 overflow-x-auto scrollbar-none">
                    {PRESET_AVATARS.map((av, idx) => (
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
      </div>

    </div>
  );
}
