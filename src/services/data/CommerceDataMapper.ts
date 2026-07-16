import { db } from '../../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

export class CommerceDataMapper {
  async getFoodData(searchQuery: string) {
    try {
      const q = query(collection(db, 'food_restaurants'));
      const snapshot = await getDocs(q);
      const allData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      if (!searchQuery) return allData;
      return allData.filter(r => r.name?.toLowerCase().includes(searchQuery.toLowerCase()) || r.cuisine?.toLowerCase().includes(searchQuery.toLowerCase()));
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  async getMartData(searchQuery: string) {
    try {
      const q = query(collection(db, 'mart_products'));
      const snapshot = await getDocs(q);
      const allData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      if (!searchQuery) return allData;
      return allData.filter(p => p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || p.brand?.toLowerCase().includes(searchQuery.toLowerCase()));
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  async getStaysData(searchQuery: string, location: string) {
    try {
      const q = query(collection(db, 'stay_hotels'));
      const snapshot = await getDocs(q);
      const allData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      if (!searchQuery && !location) return allData;
      return allData.filter(s => 
        (searchQuery && s.name?.toLowerCase().includes(searchQuery.toLowerCase())) || 
        (location && s.location?.toLowerCase().includes(location.toLowerCase()))
      );
    } catch (e) {
      console.error(e);
      return [];
    }
  }
}

export const CommerceDataInstance = new CommerceDataMapper();
