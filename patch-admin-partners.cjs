const fs = require('fs');
let code = fs.readFileSync('src/components/AdminControlCenter.tsx', 'utf8');

// Replace the selectedAdminPartner view block with <PartnerPortal />
const oldBlock = `
                <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
                  <div className="p-4 border-b border-slate-850 flex justify-between items-center bg-slate-950">
                    <button onClick={() => setSelectedAdminPartner(null)} className="flex items-center space-x-1 text-slate-400 hover:text-white transition">
                      <ChevronLeft className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-wider">Back to List</span>
                    </button>
                    <div className="text-right">
                      <span className={\`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full \${
                        selectedAdminPartner.verificationStatus === 'Approved' ? 'bg-emerald-500/20 text-emerald-400' :
                        selectedAdminPartner.verificationStatus === 'Rejected' ? 'bg-rose-500/20 text-rose-400' :
                        selectedAdminPartner.verificationStatus === 'Suspended' ? 'bg-rose-500/20 text-rose-400' :
                        'bg-amber-400/20 text-amber-400'
                      }\`}>
                        {selectedAdminPartner.verificationStatus}
                      </span>
                    </div>
                  </div>`;

// Wait, doing this via regex might be tricky since it's a huge block of 350 lines.
// It's better to find the bounds.
