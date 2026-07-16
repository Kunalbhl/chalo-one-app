import React, { useState, useEffect } from 'react';
import { 
  Coins, 
  Percent, 
  Users, 
  BellRing, 
  BarChart3, 
  Plus, 
  Trash2, 
  Check, 
  TrendingUp, 
  Sparkles, 
  Settings, 
  Gift, 
  FileText, 
  RefreshCw,
  Clock,
  Briefcase
} from 'lucide-react';
import { LoyaltyGrowthService, RewardRule, CouponCampaign, RewardTransaction } from '../services/loyaltyGrowthService';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  AreaChart, 
  Area 
} from 'recharts';

export const AdminGrowthCenter = () => {
  const [activeSubTab, setActiveSubTab] = useState<'rewards' | 'coupons' | 'memberships' | 'notifications' | 'analytics'>('analytics');
  const [loading, setLoading] = useState<boolean>(false);
  const [analytics, setAnalytics] = useState<any>(null);
  
  // Rewards & Loyalty States
  const [rewardRules, setRewardRules] = useState<RewardRule[]>([]);
  const [newRule, setNewRule] = useState<Partial<RewardRule>>({
    action: 'ride_completed',
    pointsMultiplier: 1,
    flatPoints: 0,
    bonusCampaignActive: false,
    campaignMultiplier: 1,
    description: ''
  });
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  // Coupon Campaigns States
  const [couponCampaigns, setCouponCampaigns] = useState<CouponCampaign[]>([]);
  const [newCoupon, setNewCoupon] = useState<Partial<CouponCampaign>>({
    code: '',
    type: 'percentage',
    value: 10,
    category: 'all',
    scope: 'platform',
    minOrder: 150,
    maxDiscount: 100,
    usageLimit: 500,
    perUserLimit: 2,
    expiry: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0]
  });

  // Notifications Campaigns State
  const [notifTitle, setNotifTitle] = useState<string>('');
  const [notifBody, setNotifBody] = useState<string>('');
  const [notifCategory, setNotifCategory] = useState<'wallet' | 'loyalty' | 'membership' | 'campaign'>('campaign');
  const [notifPriority, setNotifPriority] = useState<'high' | 'medium' | 'low'>('medium');

  // Load Admin Data
  const loadAdminData = async () => {
    setLoading(true);
    try {
      const analyticData = await LoyaltyGrowthService.getSuperAdminAnalytics();
      setAnalytics(analyticData);

      const rules = await LoyaltyGrowthService.getRewardRules();
      setRewardRules(rules);

      const coupons = await LoyaltyGrowthService.getCouponCampaigns();
      setCouponCampaigns(coupons);
    } catch (err) {
      console.error("Failed to load growth admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  // Reward Rule Handlers
  const handleUpdateRule = async (ruleId: string, updates: Partial<RewardRule>) => {
    try {
      await LoyaltyGrowthService.updateRewardRule(ruleId, updates);
      setRewardRules(prev => prev.map(r => r.id === ruleId ? { ...r, ...updates } : r));
      alert("Reward rule updated successfully.");
      setEditingRuleId(null);
    } catch (err) {
      alert("Error updating rule: " + err);
    }
  };

  // Coupon Campaign Handlers
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoupon.code) {
      alert("Coupon code required.");
      return;
    }
    try {
      const campaignPayload: Omit<CouponCampaign, 'usageCount'> = {
        id: newCoupon.code.toUpperCase(),
        code: newCoupon.code.toUpperCase(),
        type: newCoupon.type || 'percentage',
        value: Number(newCoupon.value) || 0,
        category: newCoupon.category || 'all',
        scope: newCoupon.scope || 'platform',
        minOrder: Number(newCoupon.minOrder) || 0,
        maxDiscount: Number(newCoupon.maxDiscount) || 0,
        usageLimit: Number(newCoupon.usageLimit) || 100,
        perUserLimit: Number(newCoupon.perUserLimit) || 1,
        expiry: newCoupon.expiry || ''
      };

      await LoyaltyGrowthService.createCouponCampaign(campaignPayload);
      setCouponCampaigns(prev => [...prev, { ...campaignPayload, usageCount: 0 }]);
      alert(`Coupon "${campaignPayload.code}" launched successfully!`);
      // Reset
      setNewCoupon({
        code: '',
        type: 'percentage',
        value: 10,
        category: 'all',
        scope: 'platform',
        minOrder: 150,
        maxDiscount: 100,
        usageLimit: 500,
        perUserLimit: 2,
        expiry: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0]
      });
    } catch (err) {
      alert("Error launching coupon: " + err);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!window.confirm("Permanently delete this coupon campaign?")) return;
    try {
      await LoyaltyGrowthService.deleteCouponCampaign(id);
      setCouponCampaigns(prev => prev.filter(c => c.id !== id));
      alert("Coupon deleted.");
    } catch (err) {
      alert("Error deleting coupon: " + err);
    }
  };

  // Broadcast Notification Campaign
  const handleSendNotificationCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifBody.trim()) {
      alert("Notification title and body required.");
      return;
    }
    try {
      // Create broadcast message (simulated to all users, or targeted)
      await LoyaltyGrowthService.createNotification({
        userId: 'all', // simulated system broadcast
        title: notifTitle,
        body: notifBody,
        category: notifCategory,
        priority: notifPriority,
        channels: { push: true, email: true, inApp: true }
      });
      alert(`Platform campaign "${notifTitle}" successfully broadcasted to Chalo subscribers!`);
      setNotifTitle('');
      setNotifBody('');
    } catch (err) {
      alert("Error dispatching notifications: " + err);
    }
  };

  // Real Data to be implemented. Currently empty as requested by user.
  const [membershipGrowthData, setMembershipGrowthData] = useState<any[]>([]);
  const [campaignPerformanceData, setCampaignPerformanceData] = useState<any[]>([]);

  return (
    <div id="admin_growth_center_container" className="space-y-6">
      
      {/* Upper Navigation Row */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>Growth, Loyalty & Communications Hub</span>
          </h2>
          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
            Configure Chalo Reward points, membership billing perks, BOGO/stacked coupon campaigns, and push analytics.
          </p>
        </div>

        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850">
          {[
            { id: 'analytics', label: 'ROI Analytics', icon: BarChart3 },
            { id: 'rewards', label: 'Reward Rules', icon: Coins },
            { id: 'coupons', label: 'Coupon Engine', icon: Percent },
            { id: 'memberships', label: 'Memberships', icon: Users },
            { id: 'notifications', label: 'Broadcast Center', icon: BellRing }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition ${
                activeSubTab === tab.id ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center p-12 bg-slate-900/40 border border-slate-850 rounded-3xl">
          <RefreshCw className="w-6 h-6 text-amber-400 animate-spin mr-3" />
          <span className="text-slate-400 font-mono text-xs uppercase">Loading Growth Matrix Database Registers...</span>
        </div>
      )}

      {!loading && (
        <div className="space-y-6">
          
          {/* TAB 1: ANALYTICS & DASHBOARD */}
          {activeSubTab === 'analytics' && analytics && (
            <div className="space-y-6">
              
              {/* Highlight Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-850 p-4 rounded-3xl text-left">
                  <span className="text-[9px] font-mono text-slate-400 uppercase font-bold block">Total Loyalty Points Distributed</span>
                  <h3 className="text-xl font-black text-white font-mono mt-1">{(analytics.loyaltyStats?.pointsDistributed || 0).toLocaleString()} pts</h3>
                  <span className="text-[8px] font-mono text-amber-400 block mt-1">🔥 Conversion Rate: {analytics.loyaltyStats?.rewardConversionRate}%</span>
                </div>
                <div className="bg-slate-900 border border-slate-850 p-4 rounded-3xl text-left">
                  <span className="text-[9px] font-mono text-slate-400 uppercase font-bold block">Active Chalo Subscribers</span>
                  <h3 className="text-xl font-black text-white font-mono mt-1">{(analytics.membershipStats?.totalSubscribers || 0).toLocaleString()} users</h3>
                  <span className="text-[8px] font-mono text-emerald-400 block mt-1">📈 Plus: +{analytics.membershipStats?.growthPlus}% | Gold: +{analytics.membershipStats?.growthGold}%</span>
                </div>
                <div className="bg-slate-900 border border-slate-850 p-4 rounded-3xl text-left">
                  <span className="text-[9px] font-mono text-slate-400 uppercase font-bold block">Coupon Campaign Redemptions</span>
                  <h3 className="text-xl font-black text-white font-mono mt-1">{(analytics.couponStats?.totalRedemptions || 0).toLocaleString()} times</h3>
                  <span className="text-[8px] font-mono text-amber-400 block mt-1">🏷️ Top Code: {analytics.couponStats?.topPerformingCoupon}</span>
                </div>
                <div className="bg-slate-900 border border-slate-850 p-4 rounded-3xl text-left">
                  <span className="text-[9px] font-mono text-slate-400 uppercase font-bold block">Super-App User Retention Rate</span>
                  <h3 className="text-xl font-black text-white font-mono mt-1">{analytics.userEngagement?.repeatCustomerRate}%</h3>
                  <span className="text-[8px] font-mono text-emerald-400 block mt-1">✨ Customer CSAT Score: {analytics.userEngagement?.customerSatisfaction} / 5</span>
                </div>
              </div>

              {/* Graphical Analysis Panels */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Chart 1: Subscriber Growth Levels */}
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
                  <h4 className="text-xs font-black uppercase text-white tracking-wider">Chalo Premium Subscriber Growth Levels (monthly)</h4>
                  <div className="h-64">
                    {membershipGrowthData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={membershipGrowthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorPlus" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorGold" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#eab308" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} />
                          <YAxis stroke="#94a3b8" fontSize={9} />
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} labelStyle={{ color: '#fff' }} />
                          <Legend wrapperStyle={{ fontSize: 9 }} />
                          <Area type="monotone" dataKey="Plus" stroke="#3b82f6" fillOpacity={1} fill="url(#colorPlus)" />
                          <Area type="monotone" dataKey="Gold" stroke="#eab308" fillOpacity={1} fill="url(#colorGold)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 font-mono text-[10px] uppercase">
                        No data available
                      </div>
                    )}
                  </div>
                </div>

                {/* Chart 2: Coupon ROI */}
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
                  <h4 className="text-xs font-black uppercase text-white tracking-wider">Active Promotional Campaign ROI %</h4>
                  <div className="h-64">
                    {campaignPerformanceData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={campaignPerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} />
                          <YAxis stroke="#94a3b8" fontSize={9} />
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} labelStyle={{ color: '#fff' }} />
                          <Legend wrapperStyle={{ fontSize: 9 }} />
                          <Bar dataKey="ROI" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="Redemptions" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 font-mono text-[10px] uppercase">
                        No data available
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: REWARD RULES ENGINE */}
          {activeSubTab === 'rewards' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Rules List (Left 2 columns) */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                  <span className="text-xs font-black uppercase tracking-wider text-white">Active Loyalty Accrual Rules</span>
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">Configured Globally</span>
                </div>

                <div className="space-y-3">
                  {rewardRules.map(rule => {
                    const isEditing = editingRuleId === rule.id;
                    return (
                      <div key={rule.id} className="p-4 bg-slate-950 border border-slate-850 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="space-y-1">
                          <span className="bg-slate-900 border border-slate-800 text-slate-300 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded uppercase">
                            {rule.action.replace('_', ' ')}
                          </span>
                          <p className="text-xs text-white font-bold">{rule.description}</p>
                          <div className="flex items-center space-x-3 text-[10px] font-mono text-slate-400 mt-1">
                            <span>Accrual: {rule.pointsMultiplier} pt / ₹10</span>
                            {rule.bonusCampaignActive && (
                              <span className="text-amber-400 font-bold">🔥 Bonus: x{rule.campaignMultiplier || 1.5} Campaign Active</span>
                            )}
                          </div>
                        </div>

                        <div className="flex space-x-2 shrink-0">
                          {isEditing ? (
                            <div className="flex space-x-2">
                              <input 
                                type="number" 
                                value={rule.pointsMultiplier} 
                                onChange={(e) => handleUpdateRule(rule.id, { pointsMultiplier: Number(e.target.value) })}
                                className="w-16 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white text-center"
                              />
                              <button 
                                onClick={() => setEditingRuleId(null)}
                                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 p-1.5 rounded-xl font-bold text-xs"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => setEditingRuleId(rule.id)}
                              className="text-[9px] font-black uppercase text-amber-400 hover:text-amber-500 bg-slate-900 border border-slate-850 px-3 py-1.5 rounded-xl transition"
                            >
                              Modify Accrual
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Loyalty Campaign Creator (Right 1 column) */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
                <span className="text-xs font-black uppercase tracking-wider text-white block">Accrual Event Generator</span>
                <p className="text-[10px] text-slate-400 font-mono">Simulate point awarding directly to verify integration pipelines (Birthday, referrals, custom festivals).</p>
                
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const targetUser = prompt("Enter target user identifier (e.g. user1):", "user1");
                  const ptsStr = prompt("Enter reward points count (e.g. 100):", "150");
                  if (!targetUser || !ptsStr) return;
                  await LoyaltyGrowthService.awardPoints(targetUser, Number(ptsStr), 'festival', 'Simulated Holiday Campaign Trigger');
                  alert("Handshake Complete. Loyalty database entries updated.");
                }} className="space-y-3">
                  <button 
                    type="submit"
                    className="w-full py-3 bg-amber-400 hover:bg-amber-500 text-slate-950 text-[10px] font-black uppercase rounded-2xl flex items-center justify-center space-x-2 transition"
                  >
                    <Gift className="w-4 h-4" />
                    <span>Trigger Reward Handshake</span>
                  </button>
                </form>
              </div>

            </div>
          )}

          {/* TAB 3: COUPON ENGINE */}
          {activeSubTab === 'coupons' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Add Coupon Form */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4 text-left">
                <span className="text-xs font-black uppercase tracking-wider text-white block">Launch New Coupon Campaign</span>
                
                <form onSubmit={handleCreateCoupon} className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-slate-400 uppercase">Coupon Promo Code</label>
                    <input 
                      type="text" 
                      placeholder="e.g. CHALODOUBLE" 
                      value={newCoupon.code}
                      onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-slate-400 uppercase">Coupon Type</label>
                      <select 
                        value={newCoupon.type}
                        onChange={(e) => setNewCoupon({ ...newCoupon, type: e.target.value as any })}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-300"
                      >
                        <option value="percentage">Percentage %</option>
                        <option value="flat">Flat Cash ₹</option>
                        <option value="free_delivery">Free Delivery</option>
                        <option value="cashback">Instant Cashback</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-slate-400 uppercase">Discount Value</label>
                      <input 
                        type="number" 
                        value={newCoupon.value}
                        onChange={(e) => setNewCoupon({ ...newCoupon, value: Number(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-slate-400 uppercase">Category Scope</label>
                      <select 
                        value={newCoupon.category}
                        onChange={(e) => setNewCoupon({ ...newCoupon, category: e.target.value as any })}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-300"
                      >
                        <option value="all">All Modules</option>
                        <option value="rides">Rides Only</option>
                        <option value="food">Food Delivery</option>
                        <option value="mart">Mart / Grocery</option>
                        <option value="stays">Stays</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-slate-400 uppercase">Campaign Scope</label>
                      <select 
                        value={newCoupon.scope}
                        onChange={(e) => setNewCoupon({ ...newCoupon, scope: e.target.value as any })}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-300"
                      >
                        <option value="platform">Platform-Wide</option>
                        <option value="membership">Membership-Only</option>
                        <option value="referral">Referral Program</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-slate-400 uppercase">Min Order (₹)</label>
                      <input 
                        type="number" 
                        value={newCoupon.minOrder}
                        onChange={(e) => setNewCoupon({ ...newCoupon, minOrder: Number(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-slate-400 uppercase">Max Discount (₹)</label>
                      <input 
                        type="number" 
                        value={newCoupon.maxDiscount}
                        onChange={(e) => setNewCoupon({ ...newCoupon, maxDiscount: Number(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-3 bg-amber-400 hover:bg-amber-500 text-slate-950 text-[10px] font-black uppercase rounded-2xl flex items-center justify-center space-x-1.5 transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Launch Campaign Code</span>
                  </button>
                </form>
              </div>

              {/* Coupon Campaigns List */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
                <span className="text-xs font-black uppercase tracking-wider text-white block">Active Coupon Databases</span>
                
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {couponCampaigns.map(coup => (
                    <div key={coup.id} className="p-4 bg-slate-950 border border-slate-850 rounded-2xl flex justify-between items-center gap-3">
                      <div className="text-left space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-amber-400 font-mono text-xs">{coup.code}</span>
                          <span className="bg-slate-900 border border-slate-850 text-slate-400 text-[8px] font-mono px-1.5 py-0.5 rounded font-bold uppercase">{coup.scope}</span>
                        </div>
                        <p className="text-[11px] text-slate-300 font-medium">
                          {coup.type === 'percentage' ? `${coup.value}% off` : coup.type === 'flat' ? `₹${coup.value} flat discount` : coup.type === 'free_delivery' ? 'Free Delivery' : `₹${coup.value}% Cashback`} 
                          {coup.category !== 'all' && ` on ${coup.category}`}
                        </p>
                        <div className="flex items-center space-x-3 text-[9px] font-mono text-slate-500">
                          <span>Min: ₹{coup.minOrder} | Max: ₹{coup.maxDiscount}</span>
                          <span className="text-emerald-400 font-bold">Used: {coup.usageCount} / {coup.usageLimit}</span>
                        </div>
                      </div>

                      <button 
                        onClick={() => handleDeleteCoupon(coup.id)}
                        className="p-1.5 bg-red-950/40 hover:bg-red-900 text-red-400 hover:text-white rounded-xl border border-red-900/30 transition shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: MEMBERSHIP plans & benefit editor */}
          {activeSubTab === 'memberships' && (
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { id: 'Plus', name: 'Chalo Plus', price: '₹199 / mo', color: 'border-blue-500/20 text-blue-400' },
                  { id: 'Gold', name: 'Chalo Gold', price: '₹499 / mo', color: 'border-yellow-500/20 text-yellow-400' },
                  { id: 'Platinum', name: 'Chalo Platinum', price: '₹999 / mo', color: 'border-purple-500/20 text-purple-400' }
                ].map(plan => (
                  <div key={plan.id} className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex flex-col justify-between text-left relative overflow-hidden">
                    <div className="space-y-2">
                      <span className={`text-[10px] font-mono font-bold uppercase tracking-wider block ${plan.color}`}>{plan.id} VIP Plan</span>
                      <h4 className="text-sm font-black text-white">{plan.name}</h4>
                      <h3 className="text-xl font-mono font-black text-amber-400 mt-2">{plan.price}</h3>
                    </div>
                    
                    <div className="pt-4 mt-4 border-t border-slate-850 space-y-2 text-[10px] text-slate-400 font-medium">
                      <p>✓ Automated subscription billing cycles</p>
                      <p>✓ Cashback multipliers and priority VIP assistance</p>
                      <p>✓ Exclusive loyalty tiers unlock benefits</p>
                    </div>

                    <button 
                      onClick={() => alert(`VIP benefit configurations saved on plan "${plan.name}"!`)}
                      className="w-full mt-6 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-850 text-white text-[9px] font-black uppercase rounded-2xl transition"
                    >
                      Update Perks Configuration
                    </button>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* TAB 5: COMMUNICATIONS & BROADCASTS */}
          {activeSubTab === 'notifications' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Form */}
              <div className="lg:col-span-1 bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4 text-left">
                <span className="text-xs font-black uppercase tracking-wider text-white block">Create Broadcast Bulletin</span>
                <p className="text-[10px] text-slate-400 font-mono">Dispatches dynamic notifications in-app to active devices.</p>

                <form onSubmit={handleSendNotificationCampaign} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-slate-400 uppercase">Alert Title</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Flash 10% Gold Reward Points!" 
                      value={notifTitle}
                      onChange={(e) => setNotifTitle(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-slate-400 uppercase">Alert Message Body</label>
                    <textarea 
                      placeholder="e.g. Ride this weekend and get credited with instant cashback points..." 
                      value={notifBody}
                      onChange={(e) => setNotifBody(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-slate-400 uppercase">Category</label>
                      <select 
                        value={notifCategory}
                        onChange={(e) => setNotifCategory(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-2 py-2 text-xs text-slate-300"
                      >
                        <option value="campaign">Campaigns</option>
                        <option value="loyalty">Loyalty</option>
                        <option value="wallet">Wallet balances</option>
                        <option value="membership">Memberships</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-slate-400 uppercase">Priority</label>
                      <select 
                        value={notifPriority}
                        onChange={(e) => setNotifPriority(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-2 py-2 text-xs text-slate-300"
                      >
                        <option value="medium">Medium</option>
                        <option value="high">Urgent/High</option>
                        <option value="low">Low/System</option>
                      </select>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-3 bg-amber-400 hover:bg-amber-500 text-slate-950 text-[10px] font-black uppercase rounded-2xl flex items-center justify-center space-x-1.5 transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Broadcast Message Campaign</span>
                  </button>
                </form>
              </div>

              {/* Campaign Feed */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4 text-left">
                <span className="text-xs font-black uppercase tracking-wider text-white block">Communications Bulletins history</span>
                
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 text-xs">
                  <div className="p-4 bg-slate-950 border border-slate-850 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="bg-amber-400/10 border border-amber-400/20 text-amber-400 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded uppercase">Loyalty</span>
                      <span className="text-[9px] font-mono text-slate-500">Sent 2 hours ago</span>
                    </div>
                    <h5 className="font-bold text-white uppercase text-xs">Birthday Bonus Points Awarded!</h5>
                    <p className="text-slate-400 text-[11px]">Happy Birthday from Chalo One! Check your reward ledger for bonus coins.</p>
                  </div>

                  <div className="p-4 bg-slate-950 border border-slate-850 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="bg-blue-400/10 border border-blue-400/20 text-blue-400 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded uppercase">Membership</span>
                      <span className="text-[9px] font-mono text-slate-500">Sent 1 day ago</span>
                    </div>
                    <h5 className="font-bold text-white uppercase text-xs">Platinum Perks Active!</h5>
                    <p className="text-slate-400 text-[11px]">Free Unlimited Deliveries successfully activated on your multi-vertical order queue.</p>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
};
