
import { doc, setDoc, serverTimestamp, writeBatch, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { AuditService } from './auditService';


export interface PaymentTransaction {
  transactionId: string;
  userId: string;
  orderId: string;
  paymentId?: string;
  signature?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'captured' | 'failed' | 'refunded';
  purpose: 'wallet_topup' | 'ride' | 'food' | 'mart' | 'stay' | 'membership' | 'general';
  paymentMethod: string;
  gateway: 'razorpay';
  notes?: string;
  createdAt?: any;
  updatedAt?: any;
}

// Ensure the Razorpay script is loaded
const loadRazorpay = () => {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

export const PaymentService = {
  /**
   * Process a payment securely via official Razorpay SDK
   */
  async processPayment(
    userId: string,
    amount: number,
    purpose: PaymentTransaction['purpose'],
    paymentMethod: string,
    userProfile: { name: string; email: string; phone: string },
    notes?: string
  ): Promise<{ success: boolean; transactionId?: string; message: string }> {
    try {
      const res = await loadRazorpay();
      if (!res) {
        return { success: false, message: 'Razorpay SDK failed to load. Are you online?' };
      }

      const transactionId = `TXN-${Date.now()}`;
      
      // 1. Create order on the backend
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, receipt: transactionId, notes })
      });
      
      const orderData = await response.json();
      if (!response.ok) {
        throw new Error(orderData.error || 'Failed to create Razorpay order');
      }

      // 2. Log pending transaction to Firestore
      const txRef = doc(db, 'users', userId, 'transactions', transactionId);
      await setDoc(txRef, {
        transactionId,
        userId,
        orderId: orderData.id,
        amount,
        currency: 'INR',
        status: 'pending',
        purpose,
        paymentMethod,
        gateway: 'razorpay',
        notes: notes || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Log activity
      const logRef = doc(db, 'activity_logs', `LOG-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`);
      await setDoc(logRef, {
        type: 'Payment Started',
        userId,
        details: `Started payment for ${purpose} - ₹${amount}`,
        timestamp: serverTimestamp()
      });

      // 3. Open Razorpay Checkout
      return new Promise((resolve) => {
        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'Chalo One',
          description: `Payment for ${purpose}`,
          order_id: orderData.id,
          prefill: {
            name: userProfile.name,
            email: userProfile.email,
            contact: userProfile.phone
          },
          handler: async function (response: any) {
            try {
              // 4. Verify signature on backend
              const verifyRes = await fetch('/api/payments/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  transactionId,
                  userId,
                  amount,
                  purpose
                })
              });
              
              const verifyData = await verifyRes.json();
              if (verifyRes.ok && verifyData.success) {
                // If verifyRes succeeds, backend handled the wallet increment if needed.
                
                // Update transaction locally as success
                await setDoc(txRef, {
                  paymentId: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                  status: 'captured',
                  updatedAt: serverTimestamp()
                }, { merge: true });

                const successLogRef = doc(db, 'activity_logs', `LOG-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`);
                await setDoc(successLogRef, {
                  type: 'Payment Success',
                  userId,
                  details: `Successful payment for ${purpose} - ₹${amount}`,
                  timestamp: serverTimestamp()
                });

                resolve({ success: true, transactionId, message: 'Payment verified and captured securely.' });
              } else {
                // Verification failed
                await setDoc(txRef, {
                  status: 'failed',
                  updatedAt: serverTimestamp()
                }, { merge: true });
                resolve({ success: false, transactionId, message: 'Payment signature verification failed.' });
              }
            } catch (err: any) {
               resolve({ success: false, transactionId, message: err.message || 'Error verifying payment' });
            }
          },
          theme: {
            color: '#4f46e5'
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', async function (response: any) {
           await setDoc(txRef, {
              status: 'failed',
              updatedAt: serverTimestamp(),
              notes: response.error.description
            }, { merge: true });
            
            const failLogRef = doc(db, 'activity_logs', `LOG-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`);
            await setDoc(failLogRef, {
              type: 'Payment Failed',
              userId,
              details: `Failed payment for ${purpose} - ₹${amount}`,
              timestamp: serverTimestamp()
            });

           resolve({ success: false, transactionId, message: response.error.description || 'Payment failed' });
        });
        rzp.open();
      });

    } catch (error: any) {
      return { success: false, message: error.message || 'An error occurred during payment processing.' };
    }
  }
};
