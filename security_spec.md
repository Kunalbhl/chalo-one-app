# Security Specification for Chalo One Super-App

## Data Invariants
1. A user can only access, create, or update their own user profile, preferences, notifications, wallet, and activities.
2. Only authorized administrators (Super Admin / Admin / Developer) can access administrative settings, analytics, system configurations, and list all users.
3. Seeding collections (`restaurants`, `restaurant_menu`, `food_coupons`) can be read by anyone, but can only be modified/created by authenticated users or admins.
4. Support tickets and support messages must be readable and writable by the owner who created them or by administrators.

## The "Dirty Dozen" Payloads
The following payloads are designed to test the access control layers to ensure they are rejected:
1. Malicious user tries to write to another user's profile (`/users/victim_id`).
2. Unauthenticated user tries to read system config or admin settings.
3. Malicious user tries to set their role to `super_admin` in `/users/{my_uid}`.
4. Malicious user tries to read another user's wallet history `/users/victim_uid/wallet_history/txn_123`.
5. Non-admin user tries to write to `system_config`.
6. Malicious user tries to update another user's order in `food_orders`.
7. Malicious user tries to read another user's support ticket in `support_tickets`.
8. Unauthenticated user tries to write to `audit_logs`.
9. Malicious user tries to create a custom referral code for another user.
10. Malicious user tries to write to `/admin_settings/feature_toggles`.
11. Malicious user tries to read someone else's transactions from root `transactions`.
12. Malicious user tries to modify or delete a restaurant in the public list `restaurants`.

## Test Runner (Specification)
The firestore rules will ensure all the above unauthorized payloads are securely rejected (`PERMISSION_DENIED`).
