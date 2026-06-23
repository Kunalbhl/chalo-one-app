import React, { useState } from 'react';
import { ChaloWallet, WalletTransaction, ReferralState } from '../types';
import { LEADERBOARD_WEEKLY, LEADERBOARD_MONTHLY, LEADERBOARD_ALLTIME } from '../data';
import { Coins, Award, Users, Share2, QrCode, ArrowUpRight, HelpCircle, ArrowRightLeft, Gift, Zap } from 'lucide-react';

interface ReferralAndWalletProps {
  wallet: ChaloWallet;
  addCoins: (points: number) => void;
  redeemPointsToCash: (points: number) => void;
}

export default function ReferralAndWallet({ wallet, addCoins, redeemPointsToCash }: ReferralAndWalletProps) {
  const [activeTab, setActiveTab] = useState<'wallet' | 'referral'>('wallet');
  const [redeemPoints, setRedeemPoints] = useState<string>('2000');
  const [transferPhone, setTransferPhone] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [activeLeaderboardPeriod, setActiveLeaderboardPeriod] = useState<'weekly' | 'monthly' | 'alltime'>('weekly');
  const [copied, setCopied] = useState(false);

  // Invite codes information
  const referralState: ReferralState = {
    code: "CHALO911KP",
    pointsEarned: 12000,
    signupsCount: 6,
    weeklyLeaderboard: LEADERBOARD_WEEKLY,
    monthlyLeaderboard: LEADERBOARD_MONTHLY,
    allTimeLeaderboard: LEADERBOARD_ALLTIME
  };

  const handleCopyLink = () => {
    setCopied(true);
    navigator.clipboard?.writeText(`https://chalo.app/invite?code=${referralState.code}`);
    setTimeout(() => setCopied(false), 2000);
  };

  const processRedeem = () => {
    const pts = parseInt(redeemPoints, 10);
    if (isNaN(pts) || pts <= 0) {
      alert("Please enter a valid amount of points to redeem.");
      return;
    }
    if (wallet.points < pts) {
      alert(`Oops! You need at least ${pts} points to redeem! Your current balance matches: ${wallet.points} points.`);
      return;
    }
    redeemPointsToCash(pts);
    alert(`Success! Redeemed ${pts} Points corresponding to ₹${(pts / 20).toFixed(2)} cash added to your Wallet balance!`);
    setRedeemPoints('0');
  };

  // Transfer wallet balance simulation
  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const money = parseFloat(transferAmount);
    if (isNaN(money) || money <= 0) return;

    if (wallet.balance < money) {
      alert(`Failed: Insufficient Wallet Balance. Current: ₹${wallet.balance}`);
      return;
    }

    // Process subtraction internally
    redeemPointsToCash(-money * 20); // deducts money relative to the balance
    alert(`Success! Sent ₹${money} instantly to +91 ${transferPhone}. Ref ID: TXN${Math.floor(1000000 + Math.random() * 9000000)}`);
    setTransferAmount('');
    setTransferPhone('');
  };

  const leaderboardSource = activeLeaderboardPeriod === 'weekly' 
    ? referralState.weeklyLeaderboard 
    : activeLeaderboardPeriod === 'monthly' 
    ? referralState.monthlyLeaderboard 
    : referralState.allTimeLeaderboard;

  return (
    <div id="referrals_and_wallet_container" className="p-4 max-w-xl mx-auto space-y-4 font-sans text-gray-800">
      <div className="flex border-b border-gray-150 shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab('wallet')}
          className={`flex-1 py-2.5 font-display font-semibold text-xs tracking-wider uppercase border-b-2 transition ${
            activeTab === 'wallet' ? 'border-amber-500 text-amber-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          💳 Chalo Wallet & Pay
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('referral')}
          className={`flex-1 py-2.5 font-display font-semibold text-xs tracking-wider uppercase border-b-2 transition ${
            activeTab === 'referral' ? 'border-amber-500 text-amber-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          🎁 Referrals & Rewards
        </button>
      </div>

      {activeTab === 'wallet' ? (
        <div className="space-y-4 animate-fade-in">
          {/* Card Wallet Display Balance / Points */}
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-2xl p-5 shadow-md relative overflow-hidden">
            <div className="absolute right-0 bottom-0 opacity-10 font-bold font-mono text-9xl pointer-events-none select-none">
              ₹
            </div>

            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs uppercase tracking-widest text-amber-100 font-semibold font-mono">CHALO WALLET SUPERPAY</span>
                <h4 className="text-3xl font-mono font-extrabold mt-1">₹{wallet.balance.toFixed(2)}</h4>
              </div>
              <div className="text-right font-mono text-xs">
                <span className="text-amber-100 uppercase tracking-wider text-[10px] font-bold block">Reward points</span>
                <span className="text-lg font-extrabold">{wallet.points.toLocaleString('en-US')} PTS</span>
              </div>
            </div>

            <div className="mt-6 flex justify-between items-center bg-amber-600/40 p-3 rounded-xl backdrop-blur-xs font-mono text-[10.5px]">
              <div>
                <span className="text-amber-100 mr-2">Conversion Formula:</span>
                <strong className="text-white font-extrabold">20 PTS = ₹1</strong>
              </div>
              <button
                type="button"
                onClick={() => addCoins(2000)} // Cheat code to add points
                className="bg-white/20 hover:bg-white/30 text-white transition font-extrabold px-3 py-1 rounded"
              >
                ⚙️ Add Test +2000 pts
              </button>
            </div>
          </div>

          {/* Quick Point Redeem Center */}
          <div id="points_redemption_card" className="bg-white rounded-2xl border border-gray-150 p-4 space-y-3 shadow-xs">
            <div className="flex items-center space-x-1">
              <Gift className="w-5 h-5 text-amber-500" />
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Redeem points for Direct Cash</h3>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-150 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <label htmlFor="redeem_pts_input" className="text-[10px] text-gray-400 font-bold block mb-1">Enter Points to Redeem</label>
                  <input
                    id="redeem_pts_input"
                    type="number"
                    value={redeemPoints}
                    onChange={(e) => setRedeemPoints(e.target.value)}
                    placeholder="e.g. 2000"
                    className="w-full text-sm font-extrabold text-gray-800 bg-white border border-gray-200 rounded-lg p-2 focus:ring-1 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div className="shrink-0 text-right">
                  <span className="text-[10px] text-gray-400 font-bold block mb-1">Conversion Preview</span>
                  <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-lg px-3 py-2 font-mono text-xs font-extrabold">
                    +₹{((parseInt(redeemPoints) || 0) / 20).toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="text-[10.5px] text-slate-500 font-medium leading-relaxed bg-amber-50/50 p-2.5 rounded-lg border border-amber-100/50">
                <span className="font-bold text-amber-800">Conversion Rate:</span> 20 Points = ₹1 Cash. 
                <span className="block mt-0.5 text-[9.5px] text-slate-400">Redeem Points for direct cash will only add direct Chalo Wallet cash credits. It is purely for in-app microsettlements and is <strong>not redeemable, withdrawable, or transferable for real money</strong>.</span>
              </div>

              <button
                type="button"
                id="points_redeemer_btn"
                onClick={processRedeem}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold py-2.5 rounded-xl transition cursor-pointer"
              >
                Redeem instantly
              </button>
            </div>
          </div>

          {/* Money Transfer simulation form */}
          <div className="bg-white rounded-2xl border border-gray-150 p-4 space-y-3 shadow-xs">
            <div className="flex items-center space-x-1">
              <ArrowRightLeft className="w-4.5 h-4.5 text-gray-400" />
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Instant Money Transfer</h3>
            </div>

            <form onSubmit={handleTransfer} className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2.5">
                <input
                  type="tel"
                  value={transferPhone}
                  onChange={(e) => setTransferPhone(e.target.value)}
                  placeholder="Receiver Phone (10 digit)"
                  className="bg-gray-50 border border-gray-150 p-2.5 rounded-xl text-xs font-semibold outline-none"
                  required
                />
                <input
                  type="number"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder="Amount (in Rupees)"
                  className="bg-gray-50 border border-gray-150 p-2.5 rounded-xl text-xs font-semibold outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                id="transfer_money_btn"
                className="w-full bg-gray-900 hover:bg-black text-white text-xs font-extrabold py-2.5 rounded-xl transition cursor-pointer"
              >
                Send Money
              </button>
            </form>
          </div>

          {/* Wallet Transaction history lists */}
          <div className="space-y-2.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-0.5">Transaction Ledger</span>
            <div className="space-y-2">
              {wallet.history.map(tx => (
                <div key={tx.id} className="bg-white p-3.5 rounded-xl border border-gray-150 flex justify-between items-center shadow-xs">
                  <div>
                    <h5 className="text-xs font-bold text-gray-900">{tx.description}</h5>
                    <span className="text-[10px] text-gray-400 block font-mono mt-0.5">TXND: {tx.id}</span>
                  </div>

                  <div className="text-right font-mono text-xs">
                    <span className={`font-bold ${tx.type === 'credit' ? 'text-emerald-600' : 'text-red-650'}`}>
                      {tx.type === 'credit' ? '+' : '-'}₹{tx.amount}
                    </span>
                    <span className="text-[9.5px] text-gray-400 block font-semibold">{tx.pointsSpentOrEarned > 0 ? `(${tx.pointsSpentOrEarned} pts)` : ''}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Referral program tab with Invitation card and weekly/monthly leaderboards */
        <div className="space-y-4 animate-fade-in">
          {/* Main Invitation info panel */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-4 border border-indigo-150 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1.5 flex-1 text-center md:text-left">
              <span className="text-[10px] bg-indigo-600 text-white font-extrabold uppercase px-2 py-0.5 rounded font-mono">Chalo Ambassador</span>
              <h3 className="text-sm font-extrabold text-gray-950 font-display">Invite Friend ➔ Collect 2000 Points!</h3>
              <p className="text-xs text-indigo-800 leading-relaxed font-semibold">
                Earn equivalent to **₹100 direct Cash** the minute your friends sign-up on Chalo! Weekly leaders get surprise hampers from our Brand Partners!
              </p>
            </div>
            {/* Simple vector QR simulator */}
            <div className="bg-white p-2.5 rounded-xl border border-indigo-100 flex flex-col items-center shrink-0">
              <QrCode className="w-12 h-12 text-gray-800" />
              <span className="text-[8.5px] font-bold text-gray-400 uppercase font-mono mt-1">Scan to Signup</span>
            </div>
          </div>

          {/* Share links boxes */}
          <div className="bg-white rounded-2xl border border-gray-150 p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[9.5px] text-gray-400 font-bold block">YOUR INVITE CODE</span>
                <strong className="text-base font-mono font-black text-gray-950 pl-0.5">{referralState.code}</strong>
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                id="copy_referral_btn"
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-extrabold py-2 px-4 rounded-xl transition cursor-pointer"
              >
                {copied ? 'Copied Link!' : 'Share Referral'}
              </button>
            </div>
          </div>

          {/* Ambassador stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-gray-150 p-3.5 rounded-2xl text-center shadow-xs">
              <Users className="w-5 h-5 text-indigo-600 mx-auto mb-1" />
              <span className="text-[10px] text-gray-400 font-bold uppercase block">Referral Signups</span>
              <strong className="text-lg font-mono text-gray-950 block mt-0.5">{referralState.signupsCount} Friends</strong>
            </div>

            <div className="bg-white border border-gray-150 p-3.5 rounded-2xl text-center shadow-xs flex flex-col justify-between items-center min-h-[110px]">
              <div className="w-full">
                <Award className="w-5 h-5 text-indigo-600 mx-auto mb-1" />
                <span className="text-[10px] text-gray-400 font-bold uppercase block">Points Earned</span>
                <strong className="text-lg font-mono text-gray-950 block mt-0.5">
                  {Number(referralState.pointsEarned).toLocaleString('en-US')} PTS
                </strong>
              </div>
              <button
                type="button"
                id="btn_redirect_redeem"
                onClick={() => {
                  setActiveTab('wallet');
                  setTimeout(() => {
                    const el = document.getElementById('points_redemption_card');
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth' });
                      el.classList.add('ring-2', 'ring-amber-400');
                      setTimeout(() => el.classList.remove('ring-2', 'ring-amber-400'), 2000);
                    }
                  }, 150);
                }}
                className="mt-2 text-[9px] bg-amber-100 hover:bg-amber-200 text-amber-800 px-2 py-1 rounded font-extrabold transition cursor-pointer"
              >
                Convert to cash credits ➔
              </button>
            </div>
          </div>

          {/* Gamified Referral Leaderboards */}
          <div className="space-y-3.5 pt-1">
            <div className="flex justify-between items-center pb-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">Leaderboard Rankings</span>
              {/* Filter pills */}
              <div className="flex space-x-1 bg-gray-100 p-0.5 rounded-lg border border-gray-200">
                {(['weekly', 'monthly', 'alltime'] as const).map(period => (
                  <button
                    key={period}
                    type="button"
                    onClick={() => setActiveLeaderboardPeriod(period)}
                    className={`px-2 py-1 rounded text-[10px] font-semibold uppercase whitespace-nowrap transition cursor-pointer ${
                      activeLeaderboardPeriod === period ? 'bg-white text-gray-955 font-extrabold shadow-xs' : 'text-gray-500'
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>

            {/* Leaderboard Lists */}
            <div className="bg-white rounded-2xl border border-gray-150 overflow-hidden shadow-xs">
              {leaderboardSource.map((user) => (
                <div
                  key={user.rank}
                  className={`px-4 py-3 flex items-center justify-between border-b border-gray-50 last:border-none ${
                    user.isMe ? 'bg-amber-50/50' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className={`w-5 text-xs font-extrabold leading-none ${user.rank === 1 ? 'text-amber-500 font-mono text-sm' : user.rank <= 3 ? 'text-indigo-600' : 'text-gray-400'}`}>
                      {user.rank === 1 ? '🥇' : user.rank === 2 ? '🥈' : user.rank === 3 ? '🥉' : `#${user.rank}`}
                    </span>
                    <span className="text-xs font-bold text-gray-955">{user.name}</span>
                  </div>
                  <span className="text-xs font-mono font-extrabold text-indigo-700">{user.points} PTS</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
