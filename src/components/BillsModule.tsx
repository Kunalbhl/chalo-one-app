import React, { useState } from 'react';
import { 
  Zap, 
  Phone, 
  Droplet, 
  Wifi, 
  Flame, 
  Tv, 
  Plus, 
  Search, 
  Calendar, 
  CreditCard, 
  Wallet, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  Bell,
  Trash2,
  Lock,
  Sparkles
} from 'lucide-react';
import { SavedBill, BillCategory, ChaloWallet } from '../types';

interface BillsModuleProps {
  wallet: ChaloWallet;
  deductWalletCoins: (amount: number, description: string) => void;
  addOrderToActivity: (order: any) => void;
  savedBills: SavedBill[];
  setSavedBills: (bills: SavedBill[]) => void;
}

const CATEGORY_ICONS: Record<BillCategory, React.ReactNode> = {
  Mobile: <Phone className="w-4 h-4 text-sky-500" />,
  Electricity: <Zap className="w-4 h-4 text-amber-500" />,
  Water: <Droplet className="w-4 h-4 text-blue-500" />,
  Broadband: <Wifi className="w-4 h-4 text-indigo-500" />,
  Gas: <Flame className="w-4 h-4 text-orange-500" />,
  DTH: <Tv className="w-4 h-4 text-red-500" />
};

const CATEGORY_COLORS: Record<BillCategory, string> = {
  Mobile: 'bg-sky-50 border-sky-100 text-sky-800',
  Electricity: 'bg-amber-50 border-amber-100 text-amber-800',
  Water: 'bg-blue-50 border-blue-100 text-blue-800',
  Broadband: 'bg-indigo-50 border-indigo-100 text-indigo-800',
  Gas: 'bg-orange-50 border-orange-100 text-orange-800',
  DTH: 'bg-red-50 border-red-100 text-red-850'
};

const PROVIDERS_BY_CATEGORY: Record<BillCategory, string[]> = {
  Mobile: ['Jio Postpaid', 'Airtel Postpaid', 'Vi Postpaid', 'BSNL'],
  Electricity: ['BESCOM (Bangalore)', 'BSES Rajdhani (Delhi)', 'MSEB (Mumbai)', 'CESC (Kolkata)', 'TNEB (Tamil Nadu)'],
  Water: ['BWSSB (Bangalore)', 'Delhi Jal Board (DJB)', 'MCGM (Mumbai)', 'HMWSSB (Hyderabad)'],
  Broadband: ['ACT FiberNet', 'Airtel Xstream Fiber', 'JioFiber', 'Tata Play Fiber', 'Hathway'],
  Gas: ['Indraprastha Gas (IGL)', 'Mahanagar Gas (MGL)', 'Adani Total Gas', 'HP Gas', 'Indane Gas'],
  DTH: ['Tata Play', 'Airtel Digital TV', 'Dish TV', 'Videocon d2h', 'Sun Direct']
};

export default function BillsModule({
  wallet,
  deductWalletCoins,
  addOrderToActivity,
  savedBills,
  setSavedBills
}: BillsModuleProps) {
  const [activeTab, setActiveTab] = useState<'outstanding' | 'paid' | 'history'>('outstanding');
  
  // States for adding a new bill manually
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategory, setNewCategory] = useState<BillCategory>('Mobile');
  const [newProvider, setNewProvider] = useState(PROVIDERS_BY_CATEGORY['Mobile'][0]);
  const [newAccountNumber, setNewAccountNumber] = useState('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newAmountDue, setNewAmountDue] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newAutoPay, setNewAutoPay] = useState(false);

  // States for Auto-Fetch
  const [fetchQuery, setFetchQuery] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [fetchResult, setFetchResult] = useState<SavedBill[] | null>(null);

  // Pay Bill states
  const [payingBill, setPayingBill] = useState<SavedBill | null>(null);
  const [payMethod, setPayMethod] = useState<'wallet' | 'upi' | 'card'>('wallet');

  // Sync provider on category change
  const handleCategoryChange = (cat: BillCategory) => {
    setNewCategory(cat);
    setNewProvider(PROVIDERS_BY_CATEGORY[cat][0]);
  };

  // Add bill manually
  const handleAddBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountNumber.trim() || !newCustomerName.trim()) {
      alert('Please fill out all required details.');
      return;
    }

    const bill: SavedBill = {
      id: 'BILL-' + Math.floor(100000 + Math.random() * 900000),
      category: newCategory,
      provider: newProvider,
      accountNumber: newAccountNumber,
      customerName: newCustomerName,
      amountDue: newAmountDue ? parseFloat(newAmountDue) : 0,
      dueDate: newDueDate || new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString().split('T')[0],
      status: newAmountDue && parseFloat(newAmountDue) > 0 ? 'Unpaid' : 'Paid',
      autoPayEnabled: newAutoPay
    };

    setSavedBills([bill, ...savedBills]);
    setShowAddModal(false);
    
    // Reset fields
    setNewAccountNumber('');
    setNewCustomerName('');
    setNewAmountDue('');
    setNewDueDate('');
    setNewAutoPay(false);
    
    alert(`Successfully added utility link for ${bill.provider} (${bill.category})!`);
  };

  // Trigger Automatic Fetch
  const handleAutoFetch = () => {
    if (!fetchQuery.trim()) {
      alert('Please enter your Mobile Number or Email ID first.');
      return;
    }
    
    setIsFetching(true);
    setFetchResult(null);

    // Simulate aggregator billing API lookup
    setTimeout(() => {
      setIsFetching(false);
      
      const mockedFetchedBills: SavedBill[] = [
        {
          id: 'FETCH-1',
          category: 'Electricity',
          provider: 'BESCOM (Bangalore)',
          accountNumber: '99201489021',
          customerName: 'Kunal Pareek',
          amountDue: 1420.00,
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 12).toISOString().split('T')[0],
          status: 'Unpaid',
          autoPayEnabled: false
        },
        {
          id: 'FETCH-2',
          category: 'Mobile',
          provider: 'Airtel Postpaid',
          accountNumber: fetchQuery.includes('@') ? '+91 99882 10492' : fetchQuery,
          customerName: 'Kunal Pareek',
          amountDue: 599.00,
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString().split('T')[0],
          status: 'Unpaid',
          autoPayEnabled: true
        },
        {
          id: 'FETCH-3',
          category: 'Broadband',
          provider: 'Airtel Xstream Fiber',
          accountNumber: 'ACT-BLR-89210',
          customerName: 'Kunal Pareek',
          amountDue: 943.00,
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 9).toISOString().split('T')[0],
          status: 'Unpaid',
          autoPayEnabled: false
        }
      ];

      setFetchResult(mockedFetchedBills);
    }, 1200);
  };

  // Add auto-fetched bills to list
  const importFetchedBills = () => {
    if (!fetchResult) return;
    
    // Filter duplicates based on provider & account number
    const filtered = fetchResult.filter(fb => {
      return !savedBills.some(sb => sb.provider === fb.provider && sb.accountNumber === fb.accountNumber);
    });

    if (filtered.length === 0) {
      alert('All fetched bills are already linked in your profile!');
      setFetchResult(null);
      return;
    }

    setSavedBills([...filtered, ...savedBills]);
    setFetchResult(null);
    setFetchQuery('');
    alert(`Imported ${filtered.length} active utility bills successfully into your dashboard!`);
  };

  // Initiate Pay flow
  const handlePayInitiate = (bill: SavedBill) => {
    setPayingBill(bill);
  };

  // Complete Payment Action
  const handlePayComplete = () => {
    if (!payingBill) return;

    if (payMethod === 'wallet' && wallet.balance < payingBill.amountDue) {
      alert('Insufficient Chalo One Wallet balance! Please add funds or select another payment option.');
      return;
    }

    const payAmount = payingBill.amountDue;

    // Deduct coins if wallet is used, else simulate card/upi checkout
    if (payMethod === 'wallet') {
      deductWalletCoins(payAmount, `Utility payment: ${payingBill.provider} (${payingBill.category})`);
    } else {
      alert(`Payment of ₹${payAmount.toFixed(2)} processed successfully via ${payMethod === 'card' ? 'Saved Credit Card' : 'BHIM UPI app verification'}!`);
    }

    // Add to Activities Center
    addOrderToActivity({
      id: 'CHALO-BILL-' + Math.floor(100000 + Math.random() * 900000),
      category: 'intercity', // Categorized inside general tracking
      platform: payingBill.provider,
      merchant: `${payingBill.category} Utility Settlement`,
      title: `${payingBill.category} Bill Paid`,
      subtitle: `Account No: ${payingBill.accountNumber} • Paid via ${payMethod.toUpperCase()}`,
      date: 'Today',
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      amount: payAmount,
      status: 'completed',
      statusLabel: 'Settled',
      paymentMethod: payMethod.toUpperCase()
    });

    // Update status in SavedBills list
    setSavedBills(savedBills.map(b => {
      if (b.id === payingBill.id) {
        return {
          ...b,
          status: 'Paid',
          amountDue: 0,
          lastPaidDate: new Date().toISOString().split('T')[0]
        };
      }
      return b;
    }));

    setPayingBill(null);
    alert(`⚡ Bill payment of ₹${payAmount.toFixed(2)} for ${payingBill.provider} settled successfully! Receipt generated in activities.`);
  };

  // Delete/unlink bill
  const handleDeleteBill = (id: string) => {
    if (window.confirm('Are you sure you want to unlink this bill provider account?')) {
      setSavedBills(savedBills.filter(b => b.id !== id));
    }
  };

  // Filter lists
  const unpaidList = savedBills.filter(b => b.status === 'Unpaid' || b.amountDue > 0);
  const paidList = savedBills.filter(b => b.status === 'Paid' && b.amountDue === 0);

  return (
    <div id="bills_module_view" className="space-y-4 p-4">
      {/* HEADER SECTION */}
      <div className="bg-white p-5 rounded-3xl border border-gray-150 shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div>
            <span className="text-[9.5px] font-mono text-indigo-600 uppercase tracking-widest font-black block">⚡ Chalo One Pay Bills</span>
            <h2 className="font-display font-black text-gray-950 text-base uppercase mt-0.5">Utility & Recharge Center</h2>
            <p className="text-[10.5px] text-gray-400 mt-0.5 font-medium leading-relaxed">Consolidate bills, link carriers, and settle instantly with automated reminders.</p>
          </div>
          <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-600 shadow-sm">
            <Zap className="w-5 h-5 text-indigo-600 animate-pulse" />
          </div>
        </div>

        {/* STATS TILES BAR */}
        <div className="grid grid-cols-2 gap-2 pt-4">
          <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-2xl flex flex-col justify-between">
            <span className="text-[9px] text-slate-400 uppercase font-black font-mono">Unpaid Utilities</span>
            <span className="text-sm font-black text-rose-600 font-display mt-2">
              ₹{unpaidList.reduce((sum, b) => sum + b.amountDue, 0).toFixed(2)}
            </span>
            <span className="text-[8.5px] text-slate-400 font-bold mt-1 block">{unpaidList.length} Outstanding dues</span>
          </div>

          <div className="p-3.5 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex flex-col justify-between">
            <span className="text-[9px] text-emerald-650 uppercase font-black font-mono">Wallet Balance</span>
            <span className="text-sm font-black text-emerald-800 font-display mt-2">
              ₹{wallet.balance.toFixed(2)}
            </span>
            <span className="text-[8.5px] text-emerald-600 font-bold mt-1 block">Ready for auto-debit</span>
          </div>
        </div>
      </div>

      {/* AUTO-FETCH BILLS SECTION */}
      <div className="bg-white p-4.5 rounded-3xl border border-gray-150 shadow-xs space-y-3">
        <div className="flex items-center space-x-1.5 pb-1">
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
          <h4 className="text-[10.5px] font-black font-display text-gray-950 uppercase tracking-tight">Smart Auto-Fetch Utility Dues</h4>
        </div>
        
        <p className="text-[10px] text-gray-400 font-medium leading-relaxed">
          Type your registered Mobile Number or Email to query active unpaid bills across major networks automatically.
        </p>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={fetchQuery}
              onChange={(e) => setFetchQuery(e.target.value)}
              placeholder="Enter Mobile (+91...) or Email ID"
              className="w-full pl-3 pr-8 py-2 rounded-xl bg-slate-50 border border-gray-200 text-xs focus:bg-white focus:ring-1 focus:ring-indigo-400 outline-none font-bold"
            />
            <Search className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
          </div>
          
          <button
            type="button"
            onClick={handleAutoFetch}
            disabled={isFetching}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-black text-[10.5px] rounded-xl flex items-center space-x-1 cursor-pointer select-none transition shadow-xs uppercase font-mono shrink-0"
          >
            {isFetching ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <span>Fetch Bills ⚡</span>
            )}
          </button>
        </div>

        {/* Auto Fetch Result Box */}
        {fetchResult && (
          <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-3.5 space-y-3 mt-1">
            <div className="flex justify-between items-center">
              <span className="text-[9.5px] font-mono font-black text-indigo-700 uppercase tracking-wider">📡 {fetchResult.length} Active Bills Detected</span>
              <span className="text-[8.5px] font-mono text-indigo-500 font-semibold">Source: BBPS Network</span>
            </div>

            <div className="space-y-2">
              {fetchResult.map((fb, idx) => (
                <div key={idx} className="bg-white p-2.5 rounded-xl border border-indigo-50 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 bg-slate-50 border border-slate-100 rounded-lg shrink-0">
                      {CATEGORY_ICONS[fb.category]}
                    </div>
                    <div>
                      <h5 className="text-[10px] font-black text-slate-800 uppercase">{fb.provider}</h5>
                      <p className="text-[9px] text-slate-400 font-mono mt-0.5">Account: {fb.accountNumber}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-black text-indigo-900 font-display block">₹{fb.amountDue.toFixed(2)}</span>
                    <span className="text-[8.5px] text-rose-500 font-mono font-bold mt-0.5 block">Due: {fb.dueDate}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={importFetchedBills}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] rounded-xl cursor-pointer transition uppercase text-center"
              >
                Import & Save Selected Bills
              </button>
              <button
                type="button"
                onClick={() => setFetchResult(null)}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-slate-600 font-bold text-[10px] rounded-xl cursor-pointer transition uppercase text-center"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* BILL LISTS SEGMENT SELECTOR */}
      <div className="flex border-b border-gray-150">
        {[
          { id: 'outstanding', label: 'Outstanding Dues', count: unpaidList.length },
          { id: 'paid', label: 'Saved Accounts', count: paidList.length }
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-2.5 font-display font-black text-[11px] tracking-wider uppercase border-b-2 text-center transition cursor-pointer relative ${
              activeTab === tab.id 
                ? 'border-indigo-600 text-indigo-950' 
                : 'border-transparent text-slate-450 hover:text-slate-800'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[8.5px] bg-indigo-100 text-indigo-700 font-mono font-extrabold shrink-0">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* OUTSTANDING DUES CONTENT */}
      {activeTab === 'outstanding' && (
        <div className="space-y-2.5">
          {unpaidList.map((bill) => (
            <div key={bill.id} className="bg-white p-4 rounded-3xl border border-gray-150 shadow-xs flex flex-col justify-between gap-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className={`p-2 rounded-2xl shrink-0 border ${CATEGORY_COLORS[bill.category]}`}>
                    {CATEGORY_ICONS[bill.category]}
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <h4 className="font-display font-black text-gray-950 text-xs uppercase leading-none">{bill.provider}</h4>
                      <span className="text-[8.5px] bg-rose-50 text-rose-650 px-1.5 py-0.5 rounded-md font-mono font-bold uppercase tracking-tight">Unpaid</span>
                    </div>
                    <p className="text-[10px] text-gray-400 font-mono mt-1">ID: {bill.accountNumber} • {bill.customerName}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-black font-mono text-gray-900">₹{bill.amountDue.toFixed(2)}</span>
                  <p className="text-[9px] text-slate-400 font-mono mt-0.5">Due: {bill.dueDate}</p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const nextBills = savedBills.map(b => b.id === bill.id ? { ...b, autoPayEnabled: !b.autoPayEnabled } : b);
                      setSavedBills(nextBills);
                    }}
                    className={`flex items-center space-x-1 text-[9px] font-bold uppercase px-2 py-1 rounded-lg border transition cursor-pointer ${
                      bill.autoPayEnabled 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-150' 
                        : 'bg-slate-50 text-slate-450 border-slate-150 hover:bg-slate-100'
                    }`}
                  >
                    <Bell className="w-3 h-3 shrink-0" />
                    <span>{bill.autoPayEnabled ? 'Auto-Pay Enabled' : 'Enable Auto-Pay'}</span>
                  </button>
                </div>

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => handleDeleteBill(bill.id)}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition border border-transparent hover:border-rose-100 cursor-pointer"
                    title="Unlink utility account"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePayInitiate(bill)}
                    className="px-4.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10.5px] font-black rounded-xl transition cursor-pointer uppercase shadow-xs font-mono"
                  >
                    Pay Bill ⚡
                  </button>
                </div>
              </div>
            </div>
          ))}

          {unpaidList.length === 0 && (
            <div className="bg-white p-8 rounded-3xl border border-gray-150 text-center space-y-2">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
              <h4 className="text-xs font-black text-gray-900 uppercase">You are all caught up!</h4>
              <p className="text-[10px] text-gray-400">All linked utility provider bills have been settled successfully.</p>
            </div>
          )}
        </div>
      )}

      {/* SAVED ACCOUNTS CONTENT */}
      {activeTab === 'paid' && (
        <div className="space-y-2.5">
          {paidList.map((bill) => (
            <div key={bill.id} className="bg-white p-4 rounded-3xl border border-gray-150 shadow-xs flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className={`p-2 rounded-2xl shrink-0 border ${CATEGORY_COLORS[bill.category]}`}>
                  {CATEGORY_ICONS[bill.category]}
                </div>
                <div>
                  <h4 className="font-display font-black text-gray-900 text-xs uppercase leading-none">{bill.provider}</h4>
                  <p className="text-[10px] text-gray-400 font-mono mt-1">ID: {bill.accountNumber} • {bill.customerName}</p>
                  {bill.lastPaidDate && (
                    <span className="text-[8.5px] text-emerald-600 font-mono block mt-1">Last Paid: {bill.lastPaidDate}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleDeleteBill(bill.id)}
                  className="p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-500 rounded-lg transition cursor-pointer border border-transparent"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Prompt to request checking / refreshing bills manually
                    alert(`Sync Complete: No active outstanding bills found on ${bill.provider} billing server for account ${bill.accountNumber}.`);
                  }}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[9px] font-bold rounded-lg transition cursor-pointer uppercase"
                >
                  Sync Now
                </button>
              </div>
            </div>
          ))}

          {paidList.length === 0 && (
            <div className="bg-slate-50/50 p-6 rounded-3xl border border-dashed border-gray-200 text-center space-y-1">
              <p className="text-[10px] text-gray-400 font-semibold italic">No saved active utility accounts linked yet.</p>
              <p className="text-[9px] text-gray-400">Saved accounts allow one-tap checking for active bills.</p>
            </div>
          )}
        </div>
      )}

      {/* QUICK MANUALLY ADD UTILITY LINK BAR */}
      <button
        type="button"
        onClick={() => setShowAddModal(true)}
        className="w-full py-3 bg-white hover:bg-gray-50 text-indigo-700 border border-indigo-200 border-dashed rounded-2xl text-[10.5px] font-black uppercase tracking-wider flex items-center justify-center space-x-1.5 cursor-pointer select-none transition"
      >
        <Plus className="w-4 h-4 text-indigo-600" />
        <span>Add Bill Category & Network Manually</span>
      </button>

      {/* ADD BILL MANUAL MODAL OVERLAY */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-gray-150 p-5 w-full max-w-sm space-y-4 shadow-xl">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <h3 className="font-display font-black text-gray-950 text-sm uppercase">Link Utility Account</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 text-gray-400 hover:bg-gray-50 rounded-lg"
              >
                <Trash2 className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleAddBill} className="space-y-3 text-xs text-slate-800">
              {/* Category selector */}
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider font-mono">1. Select Utility Category</label>
                <div className="grid grid-cols-3 gap-1">
                  {(['Mobile', 'Electricity', 'Water', 'Broadband', 'Gas', 'DTH'] as BillCategory[]).map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleCategoryChange(cat)}
                      className={`p-2 rounded-xl border text-[10px] font-bold text-center flex items-center space-x-1.5 justify-center cursor-pointer transition ${
                        newCategory === cat 
                          ? 'bg-indigo-50 border-indigo-400 text-indigo-900' 
                          : 'bg-white border-gray-150 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      {CATEGORY_ICONS[cat]}
                      <span>{cat}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Provider Selector */}
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider font-mono">2. Billing Network Provider</label>
                <select
                  value={newProvider}
                  onChange={(e) => setNewProvider(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-gray-200 outline-none font-bold focus:bg-white"
                >
                  {PROVIDERS_BY_CATEGORY[newCategory].map(prov => (
                    <option key={prov} value={prov}>{prov}</option>
                  ))}
                </select>
              </div>

              {/* Account / Phone Number */}
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider font-mono">3. Customer Phone / Account ID</label>
                <input
                  type="text"
                  required
                  value={newAccountNumber}
                  onChange={(e) => setNewAccountNumber(e.target.value)}
                  placeholder={newCategory === 'Mobile' ? 'e.g. +91 99882 10492' : 'e.g. BESCOM-88190'}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-gray-200 outline-none font-semibold focus:bg-white"
                />
              </div>

              {/* Customer Name */}
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider font-mono">4. Customer Registered Name</label>
                <input
                  type="text"
                  required
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  placeholder="e.g. Kunal Pareek"
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-gray-200 outline-none font-semibold focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Due Amount Optional */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider font-mono">Unpaid Amount (₹)</label>
                  <input
                    type="number"
                    value={newAmountDue}
                    onChange={(e) => setNewAmountDue(e.target.value)}
                    placeholder="Optional (e.g. 599)"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-gray-200 outline-none font-semibold focus:bg-white"
                  />
                </div>

                {/* Due Date Optional */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider font-mono">Due Date</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-gray-200 outline-none font-semibold focus:bg-white"
                  />
                </div>
              </div>

              {/* Auto pay toggle */}
              <div className="flex items-center justify-between p-1 pt-2">
                <span className="text-[10px] text-gray-500 font-semibold">Enable wallet automated pay reminder</span>
                <input
                  type="checkbox"
                  checked={newAutoPay}
                  onChange={(e) => setNewAutoPay(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10.5px] rounded-xl cursor-pointer transition uppercase"
                >
                  Link Network Account
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-slate-600 font-semibold text-[10.5px] rounded-xl cursor-pointer transition uppercase"
                >
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BILL PAYMENT CONFIRMATION MODAL */}
      {payingBill && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-gray-150 p-5 w-full max-w-sm space-y-4 shadow-xl">
            <div className="flex items-center space-x-1.5 pb-2 border-b border-gray-100">
              <Lock className="w-4 h-4 text-indigo-600" />
              <h3 className="font-display font-black text-gray-950 text-xs uppercase tracking-tight">Authorized Payment Settlement</h3>
            </div>

            <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-150 text-center space-y-1">
              <span className="text-[9px] text-slate-400 uppercase font-mono font-black">{payingBill.category} Bill • {payingBill.provider}</span>
              <h2 className="text-2xl font-black font-mono text-indigo-950">₹{payingBill.amountDue.toFixed(2)}</h2>
              <p className="text-[9.5px] text-slate-400 font-semibold">ID: {payingBill.accountNumber} • Owner: {payingBill.customerName}</p>
            </div>

            {/* PAYMENT METHODS SELECTOR */}
            <div className="space-y-1.5">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block font-mono">Select Payment Instrument</span>
              <div className="grid grid-cols-1 gap-1.5">
                <button
                  type="button"
                  onClick={() => setPayMethod('wallet')}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
                    payMethod === 'wallet' 
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold' 
                      : 'bg-white border-gray-150 hover:bg-gray-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Wallet className="w-4 h-4 text-emerald-600" />
                    <div>
                      <p className="text-[10.5px] font-extrabold uppercase leading-none">Chalo One Wallet Balance</p>
                      <p className="text-[9px] text-slate-400 mt-0.5">Available: ₹{wallet.balance.toFixed(2)}</p>
                    </div>
                  </div>
                  {payMethod === 'wallet' && <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />}
                </button>

                <button
                  type="button"
                  onClick={() => setPayMethod('upi')}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
                    payMethod === 'upi' 
                      ? 'bg-indigo-50 border-indigo-400 text-indigo-950 font-bold' 
                      : 'bg-white border-gray-150 hover:bg-gray-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-xs">📱</span>
                    <div>
                      <p className="text-[10.5px] font-extrabold uppercase leading-none">BHIM Unified Payments Interface (UPI)</p>
                      <p className="text-[9px] text-slate-400 mt-0.5">Instant secure auth via UPI PIN</p>
                    </div>
                  </div>
                  {payMethod === 'upi' && <CheckCircle className="w-4 h-4 text-indigo-600 shrink-0" />}
                </button>

                <button
                  type="button"
                  onClick={() => setPayMethod('card')}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
                    payMethod === 'card' 
                      ? 'bg-indigo-50 border-indigo-400 text-indigo-950 font-bold' 
                      : 'bg-white border-gray-150 hover:bg-gray-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-4 h-4 text-indigo-600" />
                    <div>
                      <p className="text-[10.5px] font-extrabold uppercase leading-none">Linked HDFC Credit Card</p>
                      <p className="text-[9px] text-slate-400 mt-0.5">•••• •••• •••• 9812</p>
                    </div>
                  </div>
                  {payMethod === 'card' && <CheckCircle className="w-4 h-4 text-indigo-600 shrink-0" />}
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handlePayComplete}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10.5px] rounded-xl cursor-pointer transition uppercase"
              >
                Confirm Payment & Authorize
              </button>
              <button
                type="button"
                onClick={() => setPayingBill(null)}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-slate-600 font-bold text-[10.5px] rounded-xl cursor-pointer transition uppercase"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
