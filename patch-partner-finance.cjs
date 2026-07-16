const fs = require('fs');
let code = fs.readFileSync('src/components/PartnerPortal.tsx', 'utf8');

const oldGrid = `<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-slate-950 border border-slate-850 p-4 rounded-3xl text-center space-y-1">
              <span className="text-[9px] font-bold text-slate-500 uppercase font-mono block">Realtime Wallet Balance</span>
              <strong className="text-2xl font-black text-emerald-400 font-mono">₹{(partner.walletBalance || 0).toFixed(2)}</strong>
              <p className="text-[8px] text-slate-500 font-mono">Funds credited instantly on successful delivery</p>
            </div>
            <div className="bg-slate-950 border border-slate-850 p-4 rounded-3xl text-center space-y-1">
              <span className="text-[9px] font-bold text-slate-500 uppercase font-mono block">Pending Settlement Release</span>
              <strong className="text-2xl font-black text-amber-400 font-mono">
                ₹{settlements.filter(s => s.status === 'Pending').reduce((sum, s) => sum + s.netPayout, 0).toFixed(2)}
              </strong>
              <p className="text-[8px] text-slate-500 font-mono">Verified in the next payout batch run</p>
            </div>
            <div className="bg-slate-950 border border-slate-850 p-4 rounded-3xl text-center space-y-1">
              <span className="text-[9px] font-bold text-slate-500 uppercase font-mono block">Total Settlements Released</span>
              <strong className="text-2xl font-black text-slate-100 font-mono">
                ₹{settlements.filter(s => s.status === 'Paid').reduce((sum, s) => sum + s.netPayout, 0).toFixed(2)}
              </strong>
              <p className="text-[8px] text-slate-500 font-mono">Disbursed securely via Bank routing</p>
            </div>
          </div>`;

const newGrid = `<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            <div className="bg-slate-950 border border-slate-850 p-4 rounded-3xl text-center space-y-1">
              <span className="text-[9px] font-bold text-slate-500 uppercase font-mono block">Wallet Balance</span>
              <strong className="text-xl font-black text-emerald-400 font-mono">₹{(partner.walletBalance || 0).toFixed(2)}</strong>
            </div>
            <div className="bg-slate-950 border border-slate-850 p-4 rounded-3xl text-center space-y-1">
              <span className="text-[9px] font-bold text-slate-500 uppercase font-mono block">Pending Settlement</span>
              <strong className="text-xl font-black text-amber-400 font-mono">
                ₹{settlements.filter(s => s.status === 'Pending').reduce((sum, s) => sum + s.netPayout, 0).toFixed(2)}
              </strong>
            </div>
            <div className="bg-slate-950 border border-slate-850 p-4 rounded-3xl text-center space-y-1">
              <span className="text-[9px] font-bold text-slate-500 uppercase font-mono block">Settlements Paid</span>
              <strong className="text-xl font-black text-slate-100 font-mono">
                ₹{settlements.filter(s => s.status === 'Paid').reduce((sum, s) => sum + s.netPayout, 0).toFixed(2)}
              </strong>
            </div>
            <div className="bg-slate-950 border border-slate-850 p-4 rounded-3xl text-center space-y-1">
              <span className="text-[9px] font-bold text-slate-500 uppercase font-mono block">Total Commission</span>
              <strong className="text-xl font-black text-rose-400 font-mono">
                ₹{settlements.reduce((sum, s) => sum + (s.platformFee || 0), 0).toFixed(2)}
              </strong>
            </div>
            <div className="bg-slate-950 border border-slate-850 p-4 rounded-3xl text-center space-y-1">
              <span className="text-[9px] font-bold text-slate-500 uppercase font-mono block">Taxes Remitted</span>
              <strong className="text-xl font-black text-indigo-400 font-mono">
                ₹{settlements.reduce((sum, s) => sum + (s.totalTax || 0), 0).toFixed(2)}
              </strong>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-4">
            <button className="bg-slate-900 border border-slate-800 text-[10px] uppercase font-bold text-slate-300 py-1.5 px-3 rounded-lg hover:bg-slate-800 transition">
              Download GST Report
            </button>
            <button className="bg-slate-900 border border-slate-800 text-[10px] uppercase font-bold text-slate-300 py-1.5 px-3 rounded-lg hover:bg-slate-800 transition">
              Download CSV Ledger
            </button>
          </div>
          `;

code = code.replace(oldGrid, newGrid);
fs.writeFileSync('src/components/PartnerPortal.tsx', code);
