import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { UserProfile } from '../types';

export type UserRole =
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
};

let cachedProfile: UserProfile | null = null;

/**
 * Cache user profile for fast synchronous checks
 */
export function setCachedRBACProfile(profile: UserProfile | null) {
  cachedProfile = profile;
}

/**
 * Automatically determine default role for an email address.
 * kunalpareekusa@gmail.com is super_admin.
 */
export function getDefaultRoleForEmail(email: string): string {
  if (email.toLowerCase().trim() === 'kunalpareekusa@gmail.com') {
    return 'super_admin';
  }
  return 'user';
}

/**
 * Checks if a user profile, string role, or current logged-in user is a super_admin
 */
export function isSuperAdmin(roleOrUser?: any): boolean {
  if (!roleOrUser) {
    const current = cachedProfile || auth.currentUser;
    if (!current) return false;
    const email = (current as any).email || '';
    if (email.toLowerCase().trim() === 'kunalpareekusa@gmail.com') return true;
    const role = (current as any).role || '';
    return role === 'super_admin';
  }
  if (typeof roleOrUser === 'string') {
    return roleOrUser === 'super_admin';
  }
  const email = roleOrUser.email || '';
  if (email.toLowerCase().trim() === 'kunalpareekusa@gmail.com') return true;
  return roleOrUser.role === 'super_admin';
}

/**
 * Checks if a user profile, string role, or current logged-in user is an admin or super_admin
 */
export function isAdmin(roleOrUser?: any): boolean {
  if (!roleOrUser) {
    const current = cachedProfile || auth.currentUser;
    if (!current) return false;
    const email = (current as any).email || '';
    if (email.toLowerCase().trim() === 'kunalpareekusa@gmail.com') return true;
    const role = (current as any).role || '';
    return role === 'super_admin' || role === 'admin';
  }
  if (typeof roleOrUser === 'string') {
    return roleOrUser === 'super_admin' || roleOrUser === 'admin';
  }
  const email = roleOrUser.email || '';
  if (email.toLowerCase().trim() === 'kunalpareekusa@gmail.com') return true;
  const role = roleOrUser.role || '';
  return role === 'super_admin' || role === 'admin';
}

/**
 * Check if the user has a specific role
 */
export function hasRole(role: string, roleOrUser?: any): boolean {
  if (!roleOrUser) {
    const current = cachedProfile || auth.currentUser;
    if (!current) return false;
    const email = (current as any).email || '';
    if (email.toLowerCase().trim() === 'kunalpareekusa@gmail.com' && role === 'super_admin') return true;
    const currentRole = (current as any).role || 'user';
    return currentRole === role;
  }
  if (typeof roleOrUser === 'string') {
    return roleOrUser === role;
  }
  const email = roleOrUser.email || '';
  if (email.toLowerCase().trim() === 'kunalpareekusa@gmail.com' && role === 'super_admin') return true;
  const currentRole = roleOrUser.role || 'user';
  return currentRole === role;
}

/**
 * Check if user has a permission based on role permissions mapping
 */
export function hasPermission(permission: string, roleOrUser?: any): boolean {
  let userRole = 'guest';
  if (!roleOrUser) {
    const current = cachedProfile || auth.currentUser;
    if (current) {
      const email = (current as any).email || '';
      if (email.toLowerCase().trim() === 'kunalpareekusa@gmail.com') return true;
      userRole = (current as any).role || 'user';
    }
  } else if (typeof roleOrUser === 'string') {
    userRole = roleOrUser;
  } else {
    const email = roleOrUser.email || '';
    if (email.toLowerCase().trim() === 'kunalpareekusa@gmail.com') return true;
    userRole = roleOrUser.role || 'user';
  }

  if (userRole === 'super_admin') return true;
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.includes('*') || permissions.includes(permission);
}

/**
 * Checks if user can access a specific resource and action
 */
export function canAccess(resource: string, action: string, roleOrUser?: any): boolean {
  const permission = `${action}:${resource}`;
  return hasPermission(permission, roleOrUser) || hasPermission('access_app', roleOrUser);
}
