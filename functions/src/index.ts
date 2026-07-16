import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

// ==========================================
// 1. Email Notifications (Triggers)
// ==========================================

export const sendWelcomeEmail = functions.auth.user().onCreate(async (user) => {
  console.log('Sending welcome email to:', user.email);
  // Implement nodemailer or SendGrid logic
});

export const sendPasswordResetEmail = functions.firestore.document('users/{userId}/password_resets/{resetId}').onCreate(async (snap, context) => {
  console.log('Sending password reset email');
});

export const sendBookingConfirmationEmail = functions.firestore.document('users/{userId}/bookings/{bookingId}').onCreate(async (snap, context) => {
  console.log('Sending booking confirmation to user:', context.params.userId);
});

export const sendWalletEmail = functions.firestore.document('users/{userId}/wallet_history/{txId}').onCreate(async (snap, context) => {
  console.log('Sending wallet transaction email to user:', context.params.userId);
});

export const sendReferralEmail = functions.firestore.document('users/{userId}/referrals/{refId}').onCreate(async (snap, context) => {
  console.log('Sending referral email alert');
});

export const sendProfileUpdateEmail = functions.firestore.document('users/{userId}').onUpdate(async (change, context) => {
  console.log('Sending profile update email');
});

export const sendAdminAlerts = functions.firestore.document('admin/system/errors/{errorId}').onCreate(async (snap, context) => {
  console.log('Sending critical admin alert for system error');
});

// ==========================================
// 2. Scheduled Jobs & Background Tasks
// ==========================================

export const dailyAnalytics = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  console.log('Running daily analytics crunch...');
  // Crunch numbers and save to admin/analytics_daily
});

export const settleCommissions = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  console.log('Settling approved commissions to wallets...');
  const commsSnapshot = await db.collectionGroup('commissions').where('status', '==', 'approved').get();
  
  if (commsSnapshot.empty) {
     console.log('No approved commissions to settle.');
     return null;
  }
  
  const batch = db.batch();
  let count = 0;
  
  commsSnapshot.forEach(doc => {
     const data = doc.data();
     const userId = doc.ref.parent.parent?.id;
     if (!userId) return;
     
     // Mark as paid
     batch.set(doc.ref, { status: 'paid', updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
     
     // Add to user wallet
     const walletRef = db.collection('users').doc(userId).collection('wallet').doc('main');
     batch.set(walletRef, {
        balance: admin.firestore.FieldValue.increment(data.commissionValue),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
     }, { merge: true });
     
     // Add wallet history
     const txRef = db.collection('users').doc(userId).collection('wallet_history').doc(`WTX-${Date.now()}-${count}`);
     batch.set(txRef, {
        type: 'credit',
        amount: data.commissionValue,
        description: 'Booking Commission Settlement',
        bookingId: data.bookingId,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
     });
     
     // Update stats
     const statsRef = db.collection('admin').doc('booking_statistics');
     batch.set(statsRef, {
        paidCommission: admin.firestore.FieldValue.increment(data.commissionValue),
        approvedCommission: admin.firestore.FieldValue.increment(-data.commissionValue)
     }, { merge: true });
     
     count++;
  });
  
  if (count > 0) {
      await batch.commit();
      console.log(`Successfully settled ${count} commissions to user wallets.`);
  }
  return null;
});

export const cleanupOldNotifications = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  console.log('Cleaning up notifications older than 30 days...');
});

export const syncBooking = functions.pubsub.schedule('every 1 hours').onRun(async (context) => {
  console.log('Syncing pending bookings with Affiliate API...');
  
  // Simulate fetching from Booking.com Affiliate API
  // We look for 'pending' commissions in our DB
  const commsSnapshot = await db.collectionGroup('commissions').where('status', '==', 'pending').get();
  
  if (commsSnapshot.empty) {
     console.log('No pending commissions to sync.');
     return null;
  }
  
  const batch = db.batch();
  let count = 0;
  
  commsSnapshot.forEach(doc => {
     const data = doc.data();
     const userId = doc.ref.parent.parent?.id;
     if (!userId) return;
     
     // Simulate 80% approval, 20% cancellation randomly
     const isApproved = Math.random() > 0.2;
     const newStatus = isApproved ? 'approved' : 'cancelled';
     
     batch.set(doc.ref, { status: newStatus, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
     
     // Also update the booking document
     const bookingRef = db.collection('users').doc(userId).collection('bookings').doc(data.bookingId);
     batch.set(bookingRef, { status: isApproved ? 'confirmed' : 'cancelled', updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
     
     // Update stats
     const statsRef = db.collection('admin').doc('booking_statistics');
     if (isApproved) {
        batch.set(statsRef, {
           approvedCommission: admin.firestore.FieldValue.increment(data.commissionValue),
           pendingCommission: admin.firestore.FieldValue.increment(-data.commissionValue)
        }, { merge: true });
     } else {
        batch.set(statsRef, {
           cancelledBookings: admin.firestore.FieldValue.increment(1),
           pendingCommission: admin.firestore.FieldValue.increment(-data.commissionValue)
        }, { merge: true });
     }
     
     count++;
  });
  
  if (count > 0) {
      await batch.commit();
      console.log(`Successfully synced ${count} bookings via Affiliate API simulation.`);
  }
  return null;
});

export const processNotificationQueue = functions.pubsub.schedule('every 5 minutes').onRun(async (context) => {
  console.log('Processing bulk notification queue...');
});
