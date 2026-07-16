import { db } from '../firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp, 
  runTransaction
} from 'firebase/firestore';

// ============================================================================
// ENTERPRISE PLATFORM SERVICES (Search, Health, Finance, Personalization)
// ============================================================================

export interface PlatformConfig {
  taxes: {
    gst: number;
    cgst: number;
    sgst: number;
    igst: number;
  };
  fees: {
    platformFee: number;
    deliveryFeeBase: number;
    packagingFee: number;
  };
  commissions: {
    food: number;
    mart: number;
    rides: number;
    stays: number;
  };
}

export interface SystemHealthLog {
  id: string;
  timestamp: any;
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  latencyMs: number;
  errorRate: number;
}

export interface SecurityAuditLog {
  id: string;
  userId: string;
  action: string;
  ipAddress: string;
  deviceInfo: string;
  status: 'success' | 'failure';
  timestamp: any;
}

export interface FinanceInvoice {
  id: string;
  orderId: string;
  merchantId: string;
  customerId: string;
  subtotal: number;
  taxes: { type: string; amount: number }[];
  platformFee: number;
  total: number;
  status: 'paid' | 'pending' | 'refunded';
  createdAt: any;
}

export const EnterprisePlatformService = {
  // 1. AI PERSONALIZATION
  async getPersonalizedFeed(userId: string): Promise<any> {
    try {
      // Fetch user's past orders to determine preferences
      const ordersSnap = await getDocs(query(collection(db, 'orders'), where('userId', '==', userId), limit(10)));
      const cuisines = new Set<string>();
      const merchants = new Set<string>();
      
      ordersSnap.forEach(doc => {
        const data = doc.data();
        if (data.merchantId) merchants.add(data.merchantId);
        // Add more parsing logic based on actual data
      });

      return {
        recommendedMerchants: Array.from(merchants),
        suggestedCategories: ['Fast Food', 'Healthy', 'Grocery Basics'],
        smartReorder: [],
        timeBasedSuggestions: ['Breakfast Deals', 'Morning Coffee']
      };
    } catch (error) {
      console.error("Personalization Error", error);
      return { recommendedMerchants: [], suggestedCategories: [], smartReorder: [], timeBasedSuggestions: [] };
    }
  },

  // 2. UNIVERSAL SEARCH
  async globalSearch(searchQuery: string): Promise<any> {
    const q = searchQuery.toLowerCase();
    try {
      // In a real production app, this would use Algolia or ElasticSearch via Cloud Functions.
      // Doing basic prefix matching for demonstration.
      const results = {
        food: [] as any[],
        mart: [] as any[],
        services: [] as any[]
      };

      const merchantsSnap = await getDocs(query(collection(db, 'merchants'), limit(20)));
      merchantsSnap.forEach(doc => {
        const data = doc.data();
        if (data.name?.toLowerCase().includes(q) || data.cuisine?.toLowerCase().includes(q)) {
          results.food.push({ id: doc.id, ...data });
        }
      });

      return results;
    } catch (error) {
      console.error("Search Error", error);
      return { food: [], mart: [], services: [] };
    }
  },

  // 7. FINANCIAL MANAGEMENT
  async generateInvoice(orderData: any): Promise<FinanceInvoice> {
    try {
      const config = await this.getPlatformConfig();
      const subtotal = orderData.totalAmount || 0;
      const gstAmount = (subtotal * config.taxes.gst) / 100;
      const cgstAmount = (subtotal * config.taxes.cgst) / 100;
      
      const invoice: Omit<FinanceInvoice, 'id'> = {
        orderId: orderData.id,
        merchantId: orderData.restaurantId || orderData.merchantId,
        customerId: orderData.userId,
        subtotal,
        taxes: [
          { type: 'GST', amount: gstAmount },
          { type: 'CGST', amount: cgstAmount }
        ],
        platformFee: config.fees.platformFee,
        total: subtotal + gstAmount + cgstAmount + config.fees.platformFee,
        status: 'paid',
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'finance_invoices'), invoice);
      return { id: docRef.id, ...invoice } as FinanceInvoice;
    } catch (error) {
      console.error("Invoice Generation Error", error);
      throw error;
    }
  },

  async getFinanceInvoices(limitCount = 10): Promise<FinanceInvoice[]> {
    try {
      const snap = await getDocs(query(collection(db, 'finance_invoices'), limit(limitCount)));
      const invoices: FinanceInvoice[] = [];
      snap.forEach(doc => invoices.push({ id: doc.id, ...doc.data() } as FinanceInvoice));
      return invoices;
    } catch (error) {
      console.error("Failed to fetch finance invoices", error);
      return [];
    }
  },

  // 9. SYSTEM HEALTH
  async logSystemHealth(service: string, status: SystemHealthLog['status'], latencyMs: number, errorRate: number): Promise<void> {
    try {
      await addDoc(collection(db, 'system_health_logs'), {
        service,
        status,
        latencyMs,
        errorRate,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error("System Health Logging Error", error);
    }
  },

  async getSystemHealthDashboard(): Promise<SystemHealthLog[]> {
    try {
      const snap = await getDocs(query(collection(db, 'system_health_logs'), orderBy('timestamp', 'desc'), limit(50)));
      const logs: SystemHealthLog[] = [];
      snap.forEach(doc => logs.push({ id: doc.id, ...doc.data() } as SystemHealthLog));
      return logs;
    } catch (error) {
      console.error("System Health Dashboard Error", error);
      return [];
    }
  },

  // 11. ENTERPRISE SECURITY
  async logSecurityEvent(auditData: Omit<SecurityAuditLog, 'id' | 'timestamp'>): Promise<void> {
    try {
      await addDoc(collection(db, 'security_audit_logs'), {
        ...auditData,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error("Security Audit Logging Error", error);
    }
  },

  // 14. PLATFORM SETTINGS
  async getPlatformConfig(): Promise<PlatformConfig> {
    try {
      const snap = await getDoc(doc(db, 'platform_settings', 'global_config'));
      if (snap.exists()) {
        return snap.data() as PlatformConfig;
      }
      
      // Default config
      const defaultConfig: PlatformConfig = {
        taxes: { gst: 5, cgst: 2.5, sgst: 2.5, igst: 0 },
        fees: { platformFee: 5, deliveryFeeBase: 35, packagingFee: 10 },
        commissions: { food: 15, mart: 10, rides: 20, stays: 12 }
      };
      
      // Save default
      await setDoc(doc(db, 'platform_settings', 'global_config'), defaultConfig);
      return defaultConfig;
    } catch (error) {
      console.error("Config Error", error);
      return {
        taxes: { gst: 5, cgst: 2.5, sgst: 2.5, igst: 0 },
        fees: { platformFee: 5, deliveryFeeBase: 35, packagingFee: 10 },
        commissions: { food: 15, mart: 10, rides: 20, stays: 12 }
      };
    }
  },

  async updatePlatformConfig(config: Partial<PlatformConfig>): Promise<void> {
    try {
      await updateDoc(doc(db, 'platform_settings', 'global_config'), config);
    } catch (error) {
      console.error("Update Config Error", error);
      throw error;
    }
  }
};
