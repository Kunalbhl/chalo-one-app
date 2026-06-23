import React, { useState } from 'react';
import { ChaloWallet, ReferralState, LeaderboardUser } from '../types';
import { LEADERBOARD_WEEKLY, LEADERBOARD_MONTHLY, LEADERBOARD_ALLTIME } from '../data';
import { Wallet, Gift, Award, Share2, Copy, History, RefreshCw, Check, ArrowRight, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface WalletReferralProps {
  wallet: ChaloWallet;
  addWalletPoints: (pts: number, desc: string) => void;
  redeemPointsToCash: (pts: number) => void;
}

export default function WalletReferral({
  wallet,
  addWalletPoints,
  redeemPointsToCash
}: WalletReferralProps) {
  const [copied, setCopied] = useState(false);
  const [activeLeaderboardTab, setActiveLeaderboardTab] = useState<'weekly' | 'monthly' | 'allTime'>('weekly');
  const [redeemPointsAmount, setRedeemPointsAmount] = useState<number>(2000); // 2000 Points = Rs 100

  const referralCode = "CHALO777KUNAL";
  const shareLink = `https://chalo.in/invite?code=${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentLeaderboard = 
    activeLeaderboardTab === 'weekly' ? LEADERBOARD_WEEKLY : 
    activeLeaderboardTab === 'monthly' ? LEADERBOARD_MONTHLY : 
    LEADERBOARD_ALLTIME;

  // Process referral friend signup simulation
  const simulateFriendSignUp = () => {
    addWalletPoints(2000, "Referral Bonus: Friend signed up via code!");
    alert("🎉 Fantastic! You invited 'Rajiv Sen' and earned 2000 Chalo points (= ₹100 direct cashback value) successfully! Points credited instantly to your Chalo Wallet.");
  };

  const handleRedeem = (e: React.FormEvent) => {
    e.preventDefault();
    if (wallet.points < redeemPointsAmount) {
      alert("❌ Insufficient Chalo Points balance! Refer friends to earn more points (2000 pts per invite).");
      return;
    }
    redeemPointsToCash(redeemPointsAmount);
  };

  return (
    <div id="wallet_referral_container" className="p-4 max-w-xl mx-auto space-y-4 font-sans text-gray-850">
      
      {/* 1. Chalo Wallet visual credit card/stats */}
      <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 text-white rounded-3xl p-5 shadow-lg relative overflow-hidden space-y-3.5">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-widest text-amber-100 opacity-90 block">CHALO EVERYDAY WALLET</span>
            <span className="text-3xl font-extrabold font-mono text-white">₹{wallet.balance.toFixed(2)}</span>
          </div>
          <div className="p-3 bg-white/15 rounded-2xl">
            <Wallet className="w-6 h-6 text-white" />
          </div>
        </div>

        <div className="flex justify-between border-t border-white/15 pt-3 text-xs">
          <div>
            <span className="text-[9px] text-amber-100 uppercase tracking-wider block opacity-85">Chalo Reward Points</span>
            <span className="font-bold text-base font-mono">{wallet.points} Points</span>
          </div>
          <div className="text-right">
            <span className="text-[9px] text-amber-100 uppercase tracking-wider block opacity-85">Cash Equivalent</span>
            <span className="font-bold text-sm font-mono">₹{(wallet.points / 20).toFixed(0)} Cashback</span>
          </div>
        </div>
      </div>

      {/* 2. Conversion/Redemption form */}
      <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-xs space-y-3">
        <div className="flex items-center space-x-1">
          <RefreshCw className="w-4 h-4 text-amber-500 shrink-0" />
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-800">Convert Points to Wallet Cash</h3>
        </div>
        <p className="text-[11px] text-gray-500 pb-1">
          Formula: **20 Chalo Points = ₹1**. Convert 2000 points to receive a flat **₹100** cashback in your primary wallet immediately.
        </p>

        <form onSubmit={handleRedeem} className="flex gap-2">
          <input
            type="number"
            value={redeemPointsAmount}
            onChange={(e) => setRedeemPointsAmount(Number(e.target.value))}
            min={100}
            id="redeem_points_input"
            className="w-1/2 p-2.5 bg-gray-50 border border-gray-150 rounded-xl text-xs font-bold font-mono outline-none text-center"
            placeholder="Points Amount"
            required
          />
          <button
            type="submit"
            id="redeem_submit_btn"
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1 cursor-pointer transition-all shadow-xs"
          >
            <span>Convert to ₹{(redeemPointsAmount / 20).toFixed(0)} Cash</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* 3. Referral panel */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-2xl border border-amber-200/60 space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-1">
              <Gift className="w-4.5 h-4.5 text-orange-600 shrink-0" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-orange-850">Refer Friends, Get ₹100 Outright</h3>
            </div>
            <p className="text-[11px] text-orange-800 leading-relaxed font-medium">
              Share your invite link! You get **2000 points (₹100)** the second your friend signs up on Chalo.
            </p>
          </div>
          
          <button
            type="button"
            onClick={simulateFriendSignUp}
            className="bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-[10px] py-1.5 px-3 rounded-lg flex items-center space-x-1 shrink-0 cursor-pointer shadow-xs"
          >
            Simulate Refer
          </button>
        </div>

        {/* Copy Share Code input bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <div className="flex items-center justify-between bg-white px-3 py-2.5 rounded-xl border border-amber-200/50">
            <span className="text-xs font-bold font-mono text-gray-800">{referralCode}</span>
            <span className="text-[9px] bg-orange-100 text-orange-700 uppercase font-black px-1.5 py-0.2 rounded">Invite Code</span>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="bg-white border border-amber-200/80 hover:bg-orange-100/30 text-amber-800 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="text-emerald-600">Copied Link!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-amber-600" />
                <span>Share Referral Link</span>
              </>
            )}
          </button>
        </div>

        {/* Custom vector QR image placeholder */}
        <div className="flex items-center space-x-3 bg-white/60 p-2.5 rounded-xl border border-amber-100 text-left">
          {/* Stylized QR placeholder vector */}
          <div className="w-12 h-12 bg-white p-1 rounded-lg border border-amber-200 shrink-0 grid grid-cols-4 gap-0.5 shadow-xs">
            <div className="bg-orange-600 rounded-xs"></div><div className="bg-orange-600 rounded-xs"></div><div className="bg-gray-100 rounded-xs"></div><div className="bg-orange-600 rounded-xs"></div>
            <div className="bg-gray-150 rounded-xs"></div><div className="bg-gray-150 rounded-xs"></div><div className="bg-orange-600 rounded-xs"></div><div className="bg-gray-150 rounded-xs"></div>
            <div className="bg-orange-650 rounded-xs"></div><div className="bg-gray-100 rounded-xs"></div><div className="bg-orange-600 rounded-xs"></div><div className="bg-orange-650 rounded-xs"></div>
            <div className="bg-orange-600 rounded-xs"></div><div className="bg-orange-650 rounded-xs"></div><div className="bg-gray-150 rounded-xs"></div><div className="bg-orange-600 rounded-xs"></div>
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-orange-900 font-mono tracking-tight block">YOUR ACCOUNT QR CODE</span>
            <span className="text-[11px] text-gray-500 leading-none">Friends can scan your phone screen inside any Chalo app let-up to signup instantly.</span>
          </div>
        </div>
      </div>

      {/* 4. Leaderboard structure (Weekly / Monthly / All-time) */}
      <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-xs space-y-3.5">
        <div className="flex items-center space-x-1.5">
          <Award className="w-5 h-5 text-amber-500" />
          <h3 className="text-sm font-extrabold text-gray-900 font-display">Referral Champions Leaderboard</h3>
        </div>

        {/* Tab filters */}
        <div className="flex border-b border-gray-100 pb-1">
          {(['weekly', 'monthly', 'allTime'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveLeaderboardTab(tab)}
              className={`flex-1 py-1.5 text-xs font-bold border-b-2 tracking-wide transition capitalize cursor-pointer ${
                activeLeaderboardTab === tab
                  ? 'border-amber-500 text-amber-600 font-extrabold'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab === 'allTime' ? 'All Time' : tab}
            </button>
          ))}
        </div>

        {/* Profiles listed */}
        <div className="space-y-2">
          {currentLeaderboard.map((user) => {
            const isFirst = user.rank === 1;
            return (
              <div
                key={user.rank}
                className={`flex items-center justify-between p-2 rounded-xl transition ${
                  user.isMe ? 'bg-amber-100/50 border border-amber-300 font-bold' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className={`w-6 h-6 text-xs font-bold flex items-center justify-center rounded-full ${
                    isFirst ? 'bg-amber-500 text-white ring-2 ring-amber-200' : 'text-gray-500 bg-gray-100'
                  }`}>
                    {user.rank}
                  </span>
                  <div>
                    <span className="text-xs font-bold leading-tight text-gray-900">{user.name}</span>
                    {user.isMe && (
                      <span className="text-[9px] bg-amber-500 text-white font-extrabold px-1.5 py-0.2 rounded ml-1 font-mono uppercase">ME</span>
                    )}
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-gray-800">{user.points.toLocaleString()} Points</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Wallet history log */}
      <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-xs space-y-3">
        <div className="flex items-center space-x-1.5 pb-1">
          <History className="w-4.5 h-4.5 text-gray-500" />
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-400">Transaction log</h3>
        </div>

        <div className="divide-y divide-gray-100">
          {wallet.history.map((tx) => (
            <div key={tx.id} className="py-2.5 flex justify-between items-start first:pt-0 last:pb-0">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-gray-900">{tx.description}</p>
                <div className="flex text-[10px] text-gray-400 font-mono space-x-2">
                  <span>ID: {tx.id}</span>
                  <span>•</span>
                  <span>Spent: {tx.pointsSpentOrEarned} pts</span>
                </div>
              </div>

              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${tx.type === 'credit' ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'}`}>
                {tx.type === 'credit' ? '+' : '-'}₹{tx.amount.toFixed(0)}
              </span>
            </div>
          ))}

          {wallet.history.length === 0 && (
            <p className="text-xs text-center text-gray-400 py-3">No wallet transactions recorded yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
