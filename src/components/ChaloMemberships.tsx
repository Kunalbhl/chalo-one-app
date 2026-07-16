import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Check, 
  CreditCard, 
  AlertCircle, 
  RefreshCw, 
  CheckCircle2, 
  ToggleLeft, 
  ToggleRight, 
  Calendar,
  XCircle,
  HelpCircle,
  ArrowLeft,
  Coins
} from 'lucide-react';
import { LoyaltyGrowthService, MembershipPlan, UserMembership } from '../services/loyaltyGrowthService';
import { UserProfile, ChaloWallet } from '../types';

interface ChaloMembershipsProps {
  userProfile: UserProfile;
  wallet: ChaloWallet;
  onRefreshWallet?: () => void;
}

export const ChaloMemberships = ({ userProfile, wallet, onRefreshWallet }: ChaloMembershipsProps) => {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [currentMembership, setCurrentMembership] = useState<UserMembership | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [processing, setProcessing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchMembershipData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const plansList = await LoyaltyGrowthService.getMembershipPlans();
      setPlans(plansList);

      const activeMember = await LoyaltyGrowthService.getUserMembership(userProfile.id);
      setCurrentMembership(activeMember);
    } catch (err) {
      console.error("Failed to load membership status:", err);
      setErrorMsg("Unable to synchronize with Chalo VIP registry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembershipData();
  }, [userProfile.id]);

  const handleSubscribe = async (plan: MembershipPlan) => {
    if (processing) return;
    
    // Check if user has sufficient wallet balance
    if (wallet.balance < plan.price) {
      alert(`Insufficient funds. Your wallet balance is ₹${wallet.balance.toFixed(2)}, but ${plan.name} requires ₹${plan.price}. Please top up your wallet.`);
      return;
    }

    if (!window.confirm(`Confirm purchase of ${plan.name} subscription for ₹${plan.price}? This will deduct funds directly from your Chalo One wallet.`)) {
      return;
    }

    setProcessing(true);
    try {
      // 1. Debit wallet first or let service handle it (simulated or direct doc update)
      const isDeducted = await LoyaltyGrowthService.purchaseMembership(userProfile.id, plan);
      
      // Award loyalty bonus points upon membership startup!
      let bonusPoints = 200;
      if (plan.id === 'Gold') bonusPoints = 500;
      if (plan.id === 'Platinum') bonusPoints = 1000;
      await LoyaltyGrowthService.awardPoints(userProfile.id, bonusPoints, 'campaign', `VIP ${plan.name} Membership Joining Bonus`);

      alert(`Congratulations! You are now a premium ${plan.name} subscriber. ₹${plan.price} has been processed.`);
      
      if (onRefreshWallet) onRefreshWallet();
      await fetchMembershipData();
    } catch (err) {
      alert("Error processing subscription payment. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel your Chalo VIP subscription benefits? You will lose access to free delivery and multiplier rewards at the end of the billing period.")) {
      return;
    }
    setProcessing(true);
    try {
      await LoyaltyGrowthService.cancelMembership(userProfile.id);
      alert("Your subscription auto-renewal has been cancelled. Benefits remain active until current period end date.");
      await fetchMembershipData();
    } catch (err) {
      alert("Error canceling subscription: " + err);
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleAutoRenew = async () => {
    if (!currentMembership) return;
    const nextVal = !currentMembership.autoRenew;
    setProcessing(true);
    try {
      await LoyaltyGrowthService.toggleMembershipAutoRenew(userProfile.id, nextVal);
      setCurrentMembership(prev => prev ? { ...prev, autoRenew: nextVal } : null);
      alert(`Auto-renewal successfully ${nextVal ? 'enabled' : 'disabled'}.`);
    } catch (err) {
      alert("Error modifying subscription settings.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-12 rounded-3xl border border-gray-150 text-center flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
        <p className="text-xs font-mono text-gray-500 uppercase tracking-widest font-black">Syncing premium VIP member registries...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left" id="chalo_memberships_component">
      
      {/* 1. Header Hero Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 text-white p-6 rounded-3xl border border-indigo-900/40 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Sparkles className="w-40 h-40 text-amber-400" />
        </div>
        
        <div className="space-y-2 relative z-10">
          <span className="bg-amber-400/15 border border-amber-400/30 text-amber-400 text-[8.5px] font-mono font-black px-2 py-0.5 rounded uppercase tracking-wider">
            Chalo One VIP Club
          </span>
          <h2 className="text-lg font-black font-display uppercase tracking-tight">Unlock Premium Multitidonal Benefits</h2>
          <p className="text-[10.5px] text-slate-300 max-w-md font-medium leading-relaxed">
            Eliminate standard delivery charges, boost point multipliers, and gain access to premium lounge upgrades.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 2. Active Subscription Summary Card */}
      {currentMembership && (
        <div className="bg-amber-50/50 border border-amber-200 p-5 rounded-3xl space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-amber-200/60 pb-3">
            <div>
              <span className="text-[8px] font-mono text-amber-800 uppercase font-black block tracking-wider">Active Subscription</span>
              <h3 className="text-sm font-black text-amber-950 flex items-center gap-1.5 uppercase font-display">
                👑 {currentMembership.planName}
              </h3>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className={`text-[9px] font-mono font-extrabold px-2 py-0.5 rounded-full border uppercase ${
                currentMembership.status === 'active' 
                  ? 'bg-emerald-100 border-emerald-250 text-emerald-800' 
                  : 'bg-rose-100 border-rose-200 text-rose-800'
              }`}>
                {currentMembership.status}
              </span>

              {currentMembership.status === 'active' && (
                <button
                  onClick={handleCancel}
                  disabled={processing}
                  className="text-[9px] bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 font-extrabold px-2.5 py-1 rounded-xl uppercase transition"
                >
                  Cancel Plan
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-[9px] text-slate-400 font-bold block">Renewal Period</span>
              <div className="flex items-center space-x-1.5 font-mono text-slate-700 font-bold">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Ends {currentMembership.currentPeriodEnd}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[9px] text-slate-400 font-bold block">Auto Renewal Billing</span>
              <button
                onClick={handleToggleAutoRenew}
                disabled={processing}
                className="flex items-center space-x-1.5 hover:opacity-80 transition cursor-pointer"
              >
                {currentMembership.autoRenew ? (
                  <ToggleRight className="w-7 h-7 text-emerald-500" />
                ) : (
                  <ToggleLeft className="w-7 h-7 text-slate-400" />
                )}
                <span className="font-mono text-[10px] uppercase font-black text-slate-700">
                  {currentMembership.autoRenew ? 'Enabled (Automatic debit)' : 'Disabled'}
                </span>
              </button>
            </div>
          </div>

          {/* Active VIP perks readout */}
          <div className="bg-white/80 border border-amber-250/30 p-3 rounded-2xl space-y-1.5 text-[10px]">
            <span className="text-[8.5px] font-mono text-amber-800 uppercase font-black tracking-wider block">Your Live VIP Perks</span>
            <p className="text-slate-700 font-medium">⚡ Free unlimited shipping on Food, Rides, and Mart bookings</p>
            <p className="text-slate-700 font-medium">🔥 Points multiplier on wallet transactions active</p>
          </div>
        </div>
      )}

      {/* 3. VIP Tiers Choice Cards */}
      <div className="space-y-3">
        <span className="text-xs font-black uppercase text-gray-900 tracking-wider block">Available Premium Plans</span>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map(plan => {
            const isSubbedToThis = currentMembership?.planId === plan.id;
            return (
              <div 
                key={plan.id}
                className={`bg-white border rounded-3xl p-5 flex flex-col justify-between text-left relative transition ${
                  isSubbedToThis 
                    ? 'border-amber-400 ring-2 ring-amber-400/20' 
                    : 'border-gray-150 hover:border-gray-300'
                }`}
              >
                {plan.id === 'Platinum' && (
                  <span className="absolute top-3 right-3 bg-indigo-100 border border-indigo-250 text-indigo-700 text-[7.5px] font-mono font-black px-1.5 py-0.2 rounded uppercase">
                    Best Value
                  </span>
                )}

                <div className="space-y-4">
                  <div>
                    <span className="text-[9px] font-mono text-gray-400 uppercase font-bold tracking-widest block">VIP Tier</span>
                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight font-display">{plan.name}</h4>
                  </div>

                  <h3 className="text-xl font-mono font-black text-slate-900">
                    ₹{plan.price} <span className="text-[10px] text-gray-400 font-medium lowercase">/ month</span>
                  </h3>

                  <div className="space-y-2 border-t border-gray-100 pt-3">
                    {plan.benefits.map((b, i) => (
                      <div key={i} className="flex items-start space-x-1.5 text-[10.5px] text-gray-600 font-medium leading-tight">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 mt-4">
                  <button
                    onClick={() => handleSubscribe(plan)}
                    disabled={isSubbedToThis || processing}
                    className={`w-full py-2.5 text-[10px] font-black uppercase rounded-2xl transition tracking-wider ${
                      isSubbedToThis 
                        ? 'bg-amber-100 border border-amber-200 text-amber-850 cursor-not-allowed' 
                        : 'bg-slate-950 hover:bg-black text-white cursor-pointer'
                    }`}
                  >
                    {isSubbedToThis ? 'Active Plan' : `Subscribe (₹${plan.price})`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
