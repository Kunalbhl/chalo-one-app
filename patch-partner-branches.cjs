const fs = require('fs');
let code = fs.readFileSync('src/components/PartnerPortal.tsx', 'utf8');

const branchesTabContent = `
      {/* BRANCHES TAB */}
      {activeTab === 'branches' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-black uppercase text-amber-400">Branch Management</h3>
              <p className="text-[10px] text-slate-400 font-mono">Manage operating hours, settings, and performance for each branch</p>
            </div>
            <button onClick={() => setShowAddBranch(true)} className="flex items-center space-x-1 bg-amber-400 text-slate-950 px-3 py-2 rounded-xl text-[10px] font-black uppercase">
              <Plus className="w-4 h-4" />
              <span>Add Branch</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {branches.map(b => (
              <div key={b.branchId} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 relative overflow-hidden group">
                {b.status === 'Open' ? (
                  <div className="absolute top-0 right-0 px-3 py-1 bg-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase rounded-bl-xl border-b border-l border-emerald-500/30">Online</div>
                ) : (
                  <div className="absolute top-0 right-0 px-3 py-1 bg-rose-500/20 text-rose-400 text-[9px] font-black uppercase rounded-bl-xl border-b border-l border-rose-500/30">Offline</div>
                )}
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center">
                    <Building className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold">{b.branchName}</h4>
                    <p className="text-[10px] text-slate-400 font-mono">Code: {b.branchCode}</p>
                  </div>
                </div>

                <div className="space-y-2 text-[11px] text-slate-300">
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                    <span>{b.address || 'Address not configured'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{b.openingHours || 'Not configured'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>Manager: {b.manager || 'Not Assigned'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Smartphone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{b.phone || 'No phone'}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-850 grid grid-cols-2 gap-2">
                  <button onClick={() => { setSelectedBranchId(b.branchId); setActiveTab('settings'); }} className="py-2 bg-slate-950 hover:bg-slate-800 border border-slate-850 rounded-xl text-[10px] text-white font-bold uppercase transition">
                    Manage Settings
                  </button>
                  <button onClick={() => { setSelectedBranchId(b.branchId); setActiveTab('analytics'); }} className="py-2 bg-slate-950 hover:bg-slate-800 border border-slate-850 rounded-xl text-[10px] text-amber-400 font-bold uppercase transition">
                    View Analytics
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
`;

code = code.replace(/{activeTab === 'staff' && \(/, branchesTabContent + "\n      {activeTab === 'staff' && (");
fs.writeFileSync('src/components/PartnerPortal.tsx', code);
