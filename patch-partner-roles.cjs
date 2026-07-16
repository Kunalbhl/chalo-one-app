const fs = require('fs');
let code = fs.readFileSync('src/components/PartnerPortal.tsx', 'utf8');

const oldRoles = `<option value="Manager">Outlet Store Manager</option>
                      <option value="Chef">Head Kitchen Chef</option>
                      <option value="Courier">Independent field courier</option>
                      <option value="Cashier">Accounting Clerk</option>`;

const newRoles = `<option value="Owner">Owner</option>
                      <option value="Manager">Manager</option>
                      <option value="Supervisor">Supervisor</option>
                      <option value="Cashier">Cashier</option>
                      <option value="Kitchen">Kitchen</option>
                      <option value="Delivery Manager">Delivery Manager</option>
                      <option value="Inventory Manager">Inventory Manager</option>
                      <option value="Customer Support">Customer Support</option>
                      <option value="Finance">Finance</option>
                      <option value="Custom Role">Custom Role</option>`;

code = code.replace(oldRoles, newRoles);
fs.writeFileSync('src/components/PartnerPortal.tsx', code);
