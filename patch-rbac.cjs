const fs = require('fs');
let code = fs.readFileSync('src/security/rbac.ts', 'utf8');

const newRolesDef = `export type UserRole =
  | 'super_admin'
  | 'developer'
  | 'user'
  | 'agent'
  | 'partner'
  | 'merchant_owner'
  | 'manager'
  | 'employee'
  | 'driver';

// Centralized role permissions (RBAC Engine)
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: ['*'],
  developer: [
    'canManageFirebase', 'canManageStorage', 'canViewAuditLogs', 
    'canManageFeatureFlags', 'canManageRemoteConfig', 'canManageSettings', 'canManageAnalytics'
  ],
  agent: [
    'onboard_users', 'referral_tracking', 'commission_tracking', 
    'view_own_earnings', 'withdraw_own_earnings'
  ],
  partner: [
    'register_business', 'manage_own_business', 'manage_own_products', 'view_own_settlement',
    'view_reports', 'manage_branches', 'manage_employees'
  ],
  merchant_owner: [
    'manage_own_business', 'manage_own_products', 'view_own_settlement',
    'view_reports', 'manage_branches', 'manage_employees'
  ],
  manager: [
    'manage_own_products', 'view_reports', 'manage_employees', 'process_orders'
  ],
  employee: [
    'process_orders', 'view_inventory'
  ],
  driver: [
    'receive_orders', 'update_order_status', 'view_own_earnings'
  ],
  user: [
    'access_app', 'use_wallet', 'book_rides', 'order_food', 'order_mart', 'book_stays', 'pay_bills'
  ],
  guest: ['access_app_limited']
};`;

code = code.replace(/export type UserRole =[\s\S]*?guest: \['access_app_limited'\]\n\};/, newRolesDef);
fs.writeFileSync('src/security/rbac.ts', code);
