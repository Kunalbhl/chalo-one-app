import { db } from '../../firebase';
import { collection, doc, getDoc, setDoc, getDocs, limit, query } from 'firebase/firestore';

export class FoodSeeder {
  static async verifyAndSeed() {
    if (!db) return;
    try {
      await this.seedCollection('restaurants', 'r1', {
        name: 'Meghana Foods',
        cuisine: 'Specialty Andhra Biryanis & Spices',
        cuisines: ['South Indian', 'Biryani'],
        rating: 4.5,
        deliveryTime: 35,
        isPureVeg: false,
        hasNonVeg: true,
        bannerImage: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800'
      });

      await this.seedCollection('restaurant_categories', 'c1', {
        name: 'Biryanis',
        restaurantId: 'r1',
        isActive: true
      });

      await this.seedCollection('restaurant_menu', 'm1', {
        restaurantId: 'r1',
        categoryId: 'c1',
        name: 'Chicken Boneless Biryani',
        price: 290,
        dietType: 'Non-Veg',
        isVeg: false,
        image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400'
      });

      // Just ensure these collections exist by checking or adding a dummy document if empty
      const collectionsToVerify = [
        'food_orders', 'food_cart', 'food_favorites', 'food_reviews', 
        'food_coupons', 'food_recent_searches', 'food_recent_orders'
      ];

      for (const col of collectionsToVerify) {
        const q = query(collection(db, col), limit(1));
        const snap = await getDocs(q);
        if (snap.empty) {
          // Add a placeholder to ensure it's initialized logically in the project (Firestore doesn't create collections until a doc is added)
          await setDoc(doc(db, col, 'system_init_placeholder'), {
             initializedAt: Date.now(),
             _isPlaceholder: true
          });
        }
      }
      
      console.log('Food module self-healing complete');
    } catch (err) {
      console.warn('Seeding failed', err);
    }
  }

  private static async seedCollection(colName: string, docId: string, defaultData: any) {
    const docRef = doc(db, colName, docId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      await setDoc(docRef, defaultData);
    }
  }
}
