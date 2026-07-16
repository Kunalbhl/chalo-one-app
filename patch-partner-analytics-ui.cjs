const fs = require('fs');
let code = fs.readFileSync('src/components/PartnerPortal.tsx', 'utf8');

const oldAnalyticsUI = `{activeTab === 'analytics' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Revenue Area Chart */}
            <div className="bg-slate-950 border border-slate-850 p-4 rounded-3xl space-y-2">
              <span className="text-[10px] font-bold uppercase text-white tracking-wider font-mono">Accumulated Daily Revenue (Last 10 days)</span>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsData.revChart}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={8} />
                    <YAxis stroke="#64748b" fontSize={8} />
                    <RechartsTooltip contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', fontSize: 10 }} />
                    <Area type="monotone" dataKey="Revenue" stroke="#fbbf24" fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Products Bar Chart */}
            <div className="bg-slate-950 border border-slate-850 p-4 rounded-3xl space-y-2">
              <span className="text-[10px] font-bold uppercase text-white tracking-wider font-mono">Popular Menu Items Sold</span>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.topProductsChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={8} />
                    <YAxis stroke="#64748b" fontSize={8} />
                    <RechartsTooltip contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', fontSize: 10 }} />
                    <Bar dataKey="Sales" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}`;

const newAnalyticsUI = `{activeTab === 'analytics' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl">
              <p className="text-[9px] font-bold uppercase text-slate-500 font-mono">Total Revenue</p>
              <p className="text-xl font-black text-amber-400 mt-1">₹{analyticsData.totalRev.toFixed(2)}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl">
              <p className="text-[9px] font-bold uppercase text-slate-500 font-mono">Unique Customers</p>
              <p className="text-xl font-black text-white mt-1">{analyticsData.uniqueCustomers}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl">
              <p className="text-[9px] font-bold uppercase text-slate-500 font-mono">Cancel/Refund Rate</p>
              <p className="text-xl font-black text-rose-400 mt-1">{(analyticsData.cancelRate + analyticsData.refundRate).toFixed(1)}%</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl">
              <p className="text-[9px] font-bold uppercase text-slate-500 font-mono">Repeat Cust Rate</p>
              <p className="text-xl font-black text-emerald-400 mt-1">{analyticsData.uniqueCustomers ? ((analyticsData.repeatCustomers / analyticsData.uniqueCustomers) * 100).toFixed(1) : 0}%</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Revenue Area Chart */}
            <div className="bg-slate-950 border border-slate-850 p-4 rounded-3xl space-y-2 lg:col-span-2">
              <span className="text-[10px] font-bold uppercase text-white tracking-wider font-mono">Accumulated Daily Revenue (Last 10 days)</span>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsData.revChart}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={8} />
                    <YAxis stroke="#64748b" fontSize={8} />
                    <RechartsTooltip contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', fontSize: 10 }} />
                    <Area type="monotone" dataKey="Revenue" stroke="#fbbf24" fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Peak Hours Chart */}
            <div className="bg-slate-950 border border-slate-850 p-4 rounded-3xl space-y-2">
              <span className="text-[10px] font-bold uppercase text-white tracking-wider font-mono">Peak Order Hours</span>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.peakHoursChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="hour" stroke="#64748b" fontSize={8} />
                    <RechartsTooltip contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', fontSize: 10 }} />
                    <Bar dataKey="Orders" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Products Bar Chart */}
            <div className="bg-slate-950 border border-slate-850 p-4 rounded-3xl space-y-2 lg:col-span-3">
              <span className="text-[10px] font-bold uppercase text-white tracking-wider font-mono">Popular Menu Items Sold</span>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.topProductsChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={8} />
                    <YAxis stroke="#64748b" fontSize={8} />
                    <RechartsTooltip contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', fontSize: 10 }} />
                    <Bar dataKey="Sales" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}`;

const startIndex = code.indexOf("{activeTab === 'analytics' && (");
const endIndex = code.indexOf("{/* TAB 9: BRANCH GEOGRAPHIC & SURGE SETTINGS */}");

if (startIndex !== -1 && endIndex !== -1) {
  code = code.substring(0, startIndex) + newAnalyticsUI + "\n\n      " + code.substring(endIndex);
  fs.writeFileSync('src/components/PartnerPortal.tsx', code);
} else {
  console.log("Could not find analytics UI block");
}
