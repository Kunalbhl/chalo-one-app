import { db } from '../firebase';
import { 
  collection, doc, getDoc, getDocs, setDoc, query, where, 
  serverTimestamp, runTransaction, Timestamp, deleteDoc
} from 'firebase/firestore';
import { PaymentService } from './paymentService';

export interface BBPSOperator {
  id: string;
  category: string;
  name: string;
  billerId: string;
  fields: { name: string; type: string; regex?: string; regexError?: string }[];
}

export interface BBPSFetchResponse {
  success: boolean;
  billAmount?: number;
  dueDate?: string;
  billNumber?: string;
  consumerName?: string;
  operator?: string;
  status?: string;
  errorCode?: string;
  errorMessage?: string;
  additionalData?: any;
}

export interface SavedBiller {
  id: string;
  nickname: string;
  category: string;
  operator: string;
  billerId: string;
  consumerNumber: string;
  additionalInfo?: Record<string, string>;
  lastPaidDate?: string;
  createdAt: any;
}

export interface BillHistory {
  id: string;
  category: string;
  operator: string;
  billerId: string;
  consumerNumber: string;
  consumerName: string;
  billAmount: number;
  serviceCharge: number;
  totalAmount: number;
  currency: string;
  paymentStatus: 'pending' | 'success' | 'failed' | 'refunded';
  paymentMethod: string;
  transactionId: string;
  receiptNumber: string;
  createdAt: any;
  updatedAt: any;
}

// In-memory cache for operators
let cachedOperators: BBPSOperator[] = [];

export const BBPSService = {
  // Provider-agnostic API call to fetch operators (Simulated from Admin configuration)
  async getOperators(category?: string): Promise<BBPSOperator[]> {
    if (cachedOperators.length === 0) {
      // For now, return a static list of dynamic operators (In prod, fetch from /admin/system_config/bbps_operators)
      const opsDoc = await getDoc(doc(db, 'system_config', 'bbps_operators'));
      if (opsDoc.exists()) {
        cachedOperators = opsDoc.data().operators || [];
      } else {
        // Default seed
        cachedOperators = [
          { id: 'op_1', category: 'Electricity', name: 'BESCOM', billerId: 'BESC00000K', fields: [{ name: 'Account ID', type: 'text' }] },
          { id: 'op_2', category: 'Electricity', name: 'TATA Power', billerId: 'TATA00000M', fields: [{ name: 'Consumer Number', type: 'text' }] },
          { id: 'op_3', category: 'Water', name: 'BWSSB', billerId: 'BWSS00000K', fields: [{ name: 'RR Number', type: 'text' }] },
          { id: 'op_4', category: 'Mobile Postpaid', name: 'Jio Postpaid', billerId: 'JIO000000M', fields: [{ name: 'Mobile Number', type: 'tel' }] },
          { id: 'op_5', category: 'Broadband', name: 'Airtel Xstream', billerId: 'AIRT00000A', fields: [{ name: 'Landline/Account Number', type: 'text' }] },
          { id: 'op_6', category: 'DTH', name: 'Tata Play', billerId: 'TATA00000D', fields: [{ name: 'Subscriber ID', type: 'text' }] },
          { id: 'op_7', category: 'FASTag', name: 'ICICI FASTag', billerId: 'ICIC00000F', fields: [{ name: 'Vehicle Number', type: 'text' }] },
          { id: 'op_8', category: 'Gas', name: 'Indraprastha Gas', billerId: 'IGL000000D', fields: [{ name: 'BP Number', type: 'text' }] },
          { id: 'op_9', category: 'LPG', name: 'HP Gas', billerId: 'HPG000000L', fields: [{ name: 'LPG ID', type: 'text' }] }
        ];
      }
    }

    if (category) {
      return cachedOperators.filter(op => op.category === category);
    }
    return cachedOperators;
  },

  // API Call to BBPS Provider to fetch the bill
  async fetchBill(billerId: string, parameters: Record<string, string>): Promise<BBPSFetchResponse> {
    try {
      // Query Firestore for an existing bill that matches the parameters
      const billsRef = collection(db, 'user_bills');
      // For simplicity, we just check if any bill exists for this biller ID that is unpaid
      const q = query(billsRef, where('billerId', '==', billerId), where('status', '==', 'UNPAID'));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Return the first matching bill
        const docSnap = querySnapshot.docs[0];
        const billData = docSnap.data();
        return {
          success: true,
          billAmount: billData.amountDue || 0,
          dueDate: billData.dueDate || new Date().toISOString(),
          billNumber: billData.billNumber || docSnap.id,
          consumerName: billData.consumerName || 'Verified Consumer',
          status: 'UNPAID'
        };
      }

      // No bill found in Firestore
      return {
        success: false,
        errorCode: 'NOT_FOUND',
        errorMessage: 'No pending bill found for these details.'
      };
    } catch (error: any) {
      return {
        success: false,
        errorCode: 'FETCH_ERROR',
        errorMessage: error.message || 'Failed to fetch bill.'
      };
    }
  },

  // Initiate Bill Payment
  async payBill(
    userId: string, 
    biller: BBPSOperator, 
    parameters: Record<string, string>, 
    billDetails: BBPSFetchResponse, 
    walletBalance: number,
    consumerName: string
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      const billAmount = billDetails.billAmount || 0;
      const serviceCharge = 0; // BBPS convenience fee
      const totalAmount = billAmount + serviceCharge;

      
      // 1. Process Payment via PaymentService
      const paymentResult = await PaymentService.processPayment(
        userId,
        totalAmount,
        'general', // Service category
        'wallet',  // Payment method
        { name: consumerName || 'User', email: 'user@example.com', phone: '' },
        `Bill Payment: ${biller.name} (${parameters[Object.keys(parameters)[0]]})`
      );

      if (!paymentResult.success) {
        return { success: false, error: paymentResult.message };
      }


      // 2. Create Bill History Record
      const billHistoryRef = doc(collection(db, 'users', userId, 'bill_history'));
      const receiptNumber = 'REC-' + Date.now().toString(36).toUpperCase() + crypto.randomUUID().slice(0, 8).toUpperCase();

      const historyData: BillHistory = {
        id: billHistoryRef.id,
        category: biller.category,
        operator: biller.name,
        billerId: biller.billerId,
        consumerNumber: parameters[Object.keys(parameters)[0]],
        consumerName: consumerName,
        billAmount,
        serviceCharge,
        totalAmount,
        currency: 'INR',
        paymentStatus: 'success',
        paymentMethod: 'Wallet',
        transactionId: paymentResult.transactionId || 'TXN-' + Date.now(),
        receiptNumber,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(billHistoryRef, historyData);

      // 3. Update Admin Analytics
      const statsRef = doc(db, 'admin', 'bbps_statistics');
      await setDoc(statsRef, {
        totalBillsPaid: 1, // Will be incremented via cloud functions safely or via transaction
        totalRevenue: totalAmount,
        lastPayment: serverTimestamp()
      }, { merge: true }); // Prefer merge over absolute increments in client side, true increment in functions.

      return { success: true, transactionId: historyData.transactionId };

    } catch (error: any) {
      console.error("BBPS Payment error", error);
      return { success: false, error: error.message || 'Payment failed' };
    }
  },

  // Saved Billers Management
  async getSavedBillers(userId: string): Promise<SavedBiller[]> {
    const q = query(collection(db, 'users', userId, 'saved_billers'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavedBiller));
  },

  async saveBiller(userId: string, billerData: Omit<SavedBiller, 'id' | 'createdAt'>): Promise<string> {
    const docRef = doc(collection(db, 'users', userId, 'saved_billers'));
    await setDoc(docRef, {
      ...billerData,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  },

  async deleteSavedBiller(userId: string, billerId: string): Promise<void> {
    await deleteDoc(doc(db, 'users', userId, 'saved_billers', billerId));
  },

  // History Fetching
  async getBillHistory(userId: string): Promise<BillHistory[]> {
    const q = query(collection(db, 'users', userId, 'bill_history')); // Add orderBy in prod, needs index
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BillHistory)).sort((a, b) => {
      // Sort desc client side for now to avoid needing index
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return timeB - timeA;
    });
  }
};
