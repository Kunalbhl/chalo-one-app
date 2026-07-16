import { db } from '../firebase';
import { doc, getDoc, collection, getCountFromServer, getDocs, limit, query } from 'firebase/firestore';

export const HealthService = {
  async getSystemHealth() {
    if (!db) return null;
    try {
      const healthRef = doc(db, 'admin', 'system_health');
      const healthSnap = await getDoc(healthRef);
      
      let data = healthSnap.exists() ? healthSnap.data() : {};
      
      // Real-time counts
      const usersSnap = await getCountFromServer(collection(db, 'users'));
      const activeUsers = usersSnap.data().count;

      const ticketsSnap = await getCountFromServer(collection(db, 'support_tickets'));
      const supportTickets = ticketsSnap.data().count;

      return {
        activeUsers,
        supportTickets,
        ...data,
        status: 'OPERATIONAL'
      };
    } catch (e) {
      console.error('Failed to get system health', e);
      return { status: 'DEGRADED', error: e };
    }
  }
};
