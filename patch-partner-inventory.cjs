const fs = require('fs');
let code = fs.readFileSync('src/components/PartnerPortal.tsx', 'utf8');

const oldForm = `<form onSubmit={async (e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    const name = fd.get('name') as string;
                    const sku = fd.get('sku') as string;
                    const qty = Number(fd.get('qty'));
                    const thresh = Number(fd.get('thresh'));
                    if (!name || !sku) return;

                    try {
                      const newId = \`INV-\${Date.now()}\`;
                      const invRef = doc(db, \`partners/\${partner.id}/branches/\${selectedBranchId}/inventory\`, newId);
                      await setDoc(invRef, {
                        id: newId,
                        name,
                        sku,
                        quantity: qty,
                        minThreshold: thresh,
                        updatedAt: new Date().toISOString()
                      });
                      await writeAuditLog('ADD_INVENTORY_ITEM', { name, sku, quantity: qty });
                      setShowRestockItemId(null);
                    } catch (err: any) {
                      alert("Error: " + err.message);
                    }
                  }} className="space-y-3 font-mono text-[10px]">
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Material Name *</label>
                      <input name="name" required placeholder="e.g. Fresh Paneer / Cheese" className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">SKU identifier *</label>
                        <input name="sku" required placeholder="e.g. RAW-PAN-10" className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Initial stock level</label>
                        <input type="number" name="qty" defaultValue={50} className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Min Alert Threshold</label>
                      <input type="number" name="thresh" defaultValue={10} className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white" />
                    </div>
                    <button type="submit" className="w-full py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black uppercase rounded-xl mt-2">
                      Register Stock SKU
                    </button>
                  </form>`;

const newForm = `<form onSubmit={async (e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    const name = fd.get('name') as string;
                    const sku = fd.get('sku') as string;
                    const barcode = fd.get('barcode') as string;
                    const qty = Number(fd.get('qty'));
                    const thresh = Number(fd.get('thresh'));
                    const supplier = fd.get('supplier') as string;
                    const purchasePrice = Number(fd.get('purchasePrice'));
                    const sellingPrice = Number(fd.get('sellingPrice'));
                    const expiry = fd.get('expiry') as string;
                    if (!name || !sku) return;

                    try {
                      const newId = \`INV-\${Date.now()}\`;
                      const invRef = doc(db, \`partners/\${partner.id}/branches/\${selectedBranchId}/inventory\`, newId);
                      await setDoc(invRef, {
                        id: newId,
                        name, sku, barcode,
                        quantity: qty,
                        minThreshold: thresh,
                        supplier, purchasePrice, sellingPrice, expiry,
                        updatedAt: new Date().toISOString()
                      });
                      await writeAuditLog('ADD_INVENTORY_ITEM', { name, sku, quantity: qty });
                      setShowRestockItemId(null);
                    } catch (err: any) {
                      alert("Error: " + err.message);
                    }
                  }} className="space-y-3 font-mono text-[10px]">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Material Name *</label>
                        <input name="name" required placeholder="Item Name" className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">SKU *</label>
                        <input name="sku" required placeholder="SKU-123" className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Barcode</label>
                        <input name="barcode" placeholder="UPC/EAN" className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Initial Stock</label>
                        <input type="number" name="qty" defaultValue={50} className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Alert Threshold</label>
                        <input type="number" name="thresh" defaultValue={10} className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Purchase Price</label>
                        <input type="number" step="0.01" name="purchasePrice" defaultValue={0} className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Selling Price (Optional)</label>
                        <input type="number" step="0.01" name="sellingPrice" defaultValue={0} className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Supplier</label>
                        <input name="supplier" placeholder="Supplier Name" className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Expiry Date</label>
                        <input type="date" name="expiry" className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white" />
                      </div>
                    </div>
                    <button type="submit" className="w-full py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black uppercase rounded-xl mt-2">
                      Register Stock SKU
                    </button>
                  </form>`;

code = code.replace(oldForm, newForm);
fs.writeFileSync('src/components/PartnerPortal.tsx', code);
