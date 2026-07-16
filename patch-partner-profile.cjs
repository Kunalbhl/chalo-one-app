const fs = require('fs');
let code = fs.readFileSync('src/components/PartnerPortal.tsx', 'utf8');

const oldProfile = `<div className="flex justify-between border-b border-slate-850 pb-1.5">
                  <span className="text-slate-500">GST Identification:</span>
                  <span className="text-white font-bold">{partner.gstNumber || 'N/A'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-850 pb-1.5">
                  <span className="text-slate-500">PAN Registration:</span>
                  <span className="text-white font-bold">{partner.panNumber || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Address:</span>
                  <span className="text-right max-w-[65%] leading-tight text-slate-400">{partner.address}</span>
                </div>
              </div>
            </div>`;

const newProfile = `<div className="flex justify-between border-b border-slate-850 pb-1.5">
                  <span className="text-slate-500">GST Identification:</span>
                  <span className="text-white font-bold">{partner.gstNumber || 'N/A'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-850 pb-1.5">
                  <span className="text-slate-500">PAN Registration:</span>
                  <span className="text-white font-bold">{partner.panNumber || 'N/A'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-850 pb-1.5">
                  <span className="text-slate-500">FSSAI License:</span>
                  <span className="text-white font-bold">{partner.fssaiNumber || 'N/A'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-850 pb-1.5">
                  <span className="text-slate-500">Drug License:</span>
                  <span className="text-white font-bold">{partner.drugLicense || 'N/A'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-850 pb-1.5">
                  <span className="text-slate-500">Hotel/Taxi Reg:</span>
                  <span className="text-white font-bold">{partner.registrationNumber || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Address:</span>
                  <span className="text-right max-w-[65%] leading-tight text-slate-400">{partner.address}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-950 border border-slate-850 p-4 rounded-3xl space-y-3.5">
              <h5 className="text-[10px] font-bold uppercase text-emerald-400 tracking-wider font-mono">Settlement & Bank Details</h5>
              <div className="space-y-2 text-[10.5px] font-mono text-slate-300">
                <div className="flex justify-between border-b border-slate-850 pb-1.5">
                  <span className="text-slate-500">Bank Name:</span>
                  <span>{partner.bankName || 'Not Set'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-850 pb-1.5">
                  <span className="text-slate-500">Account Number:</span>
                  <span className="text-white font-bold">{partner.bankAccountNumber ? '•••• ' + partner.bankAccountNumber.slice(-4) : 'Not Set'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-850 pb-1.5">
                  <span className="text-slate-500">IFSC Code:</span>
                  <span>{partner.bankIfsc || 'Not Set'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-850 pb-1.5">
                  <span className="text-slate-500">Account Holder:</span>
                  <span>{partner.bankHolderName || 'Not Set'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-850 pb-1.5">
                  <span className="text-slate-500">Settlement Frequency:</span>
                  <span>Daily (Next Day)</span>
                </div>
                <button className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-400 font-bold uppercase rounded-lg text-[9px] transition mt-2">
                  Update Bank Details
                </button>
              </div>
            </div>`;

code = code.replace(oldProfile, newProfile);
fs.writeFileSync('src/components/PartnerPortal.tsx', code);
