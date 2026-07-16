"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onActivityUpdate = exports.onUserUpdate = exports.onBookingCreated = exports.onWalletUpdate = exports.onUserDeleted = exports.onUserCreated = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const mailer_1 = require("./mailer");
const templates_1 = require("./templates");
admin.initializeApp();
const db = admin.firestore();
// ============================================================================
// AUTH AUTOMATION
// ============================================================================
exports.onUserCreated = functions.auth.user().onCreate(async (user) => {
    const email = user.email;
    const name = user.displayName || 'User';
    if (email) {
        const html = templates_1.Templates.welcomeEmail(name);
        await (0, mailer_1.sendEmail)(email, 'Welcome to Chalo One!', html);
    }
    // Admin Notification
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
        const adminHtml = templates_1.Templates.adminAlert('New User Registration', { email, uid: user.uid, name });
        await (0, mailer_1.sendEmail)(adminEmail, 'Admin Alert: New User', adminHtml);
    }
});
exports.onUserDeleted = functions.auth.user().onDelete(async (user) => {
    const email = user.email;
    const name = user.displayName || 'User';
    if (email) {
        const html = templates_1.Templates.accountDeleted(name);
        await (0, mailer_1.sendEmail)(email, 'Account Deleted - Chalo One', html);
    }
});
// ============================================================================
// FIRESTORE TRIGGERS
// ============================================================================
exports.onWalletUpdate = functions.firestore.document('wallets/{userId}').onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const balanceDiff = after.balance - before.balance;
    if (balanceDiff === 0)
        return;
    const userDoc = await db.collection('users').doc(context.params.userId).get();
    const user = userDoc.data();
    if (!user || !user.email)
        return;
    if (balanceDiff > 0) {
        const html = templates_1.Templates.walletCredited(user.name || 'User', balanceDiff, after.balance);
        await (0, mailer_1.sendEmail)(user.email, 'Chalo One Wallet Credited', html);
        // Large topup alert
        if (balanceDiff > 10000) {
            const adminEmail = process.env.ADMIN_EMAIL;
            if (adminEmail) {
                await (0, mailer_1.sendEmail)(adminEmail, 'Admin Alert: Large Top-up', templates_1.Templates.adminAlert('Large Wallet Top-up', { userId: context.params.userId, amount: balanceDiff }));
            }
        }
    }
    else {
        // Wallet debited
        const html = templates_1.Templates.walletDebited(user.name || 'User', Math.abs(balanceDiff), after.balance, 'a recent transaction');
        await (0, mailer_1.sendEmail)(user.email, 'Chalo One Wallet Payment', html);
    }
});
exports.onBookingCreated = functions.firestore.document('activity_logs/{logId}').onCreate(async (snap, context) => {
    const data = snap.data();
    // Try to determine if it's a booking/ride from activity logs
    if (data.type === 'Payment Failed') {
        const adminEmail = process.env.ADMIN_EMAIL;
        if (adminEmail) {
            await (0, mailer_1.sendEmail)(adminEmail, 'Admin Alert: Payment Failure', templates_1.Templates.adminAlert('Payment Failure Detected', data));
        }
        return;
    }
    // Booking confirmation
    if (data.status === 'completed' || data.status === 'active') {
        const userDoc = await db.collection('users').doc(data.userId || data.user_id).get();
        const user = userDoc.data();
        if (user && user.email) {
            const html = templates_1.Templates.bookingConfirmation(user.name || 'User', {
                service: data.merchant || data.title || 'Service',
                amount: data.amount || 0,
                date: new Date().toLocaleDateString()
            });
            await (0, mailer_1.sendEmail)(user.email, 'Chalo One Booking Confirmation', html);
        }
    }
});
exports.onUserUpdate = functions.firestore.document('users/{userId}').onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    // Basic Profile update detect
    if (before.name !== after.name || before.phone !== after.phone) {
        if (after.email) {
            const html = templates_1.Templates.layout(`
          <h2>Profile Updated</h2>
          <p>Hi ${after.name || 'User'},</p>
          <p>Your profile information has been successfully updated.</p>
        `, 'Profile Updated');
            await (0, mailer_1.sendEmail)(after.email, 'Profile Update - Chalo One', html);
        }
    }
});
exports.onActivityUpdate = functions.firestore.document('activity_logs/{logId}').onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    // Booking Cancellation Alert
    if (before.status !== 'cancelled' && after.status === 'cancelled') {
        const adminEmail = process.env.ADMIN_EMAIL;
        if (adminEmail) {
            await (0, mailer_1.sendEmail)(adminEmail, 'Admin Alert: Booking Cancelled', templates_1.Templates.adminAlert('Booking Cancellation Detected', after));
        }
    }
});
//# sourceMappingURL=index.js.map