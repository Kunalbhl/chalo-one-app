import { db } from '../../firebase';
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, query, where } from 'firebase/firestore';
import { ProviderId, LinkedAccount } from '../../models/UnifiedModels';

export class LinkedAccountService {
  async getLinkedAccounts(userId: string): Promise<LinkedAccount[]> {
    const q = query(collection(db, 'linked_accounts'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as LinkedAccount);
  }

  async getLinkedAccount(userId: string, provider: ProviderId): Promise<LinkedAccount | null> {
    const docRef = doc(db, 'linked_accounts', `${userId}_${provider}`);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return snapshot.data() as LinkedAccount;
    }
    return null;
  }

  async linkAccount(userId: string, provider: ProviderId, authData: any): Promise<void> {
    const docRef = doc(db, 'linked_accounts', `${userId}_${provider}`);
    await setDoc(docRef, {
      userId,
      provider,
      status: 'connected',
      ...authData,
      lastLogin: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
  }

  async disconnectAccount(userId: string, provider: ProviderId): Promise<void> {
    const docRef = doc(db, 'linked_accounts', `${userId}_${provider}`);
    await setDoc(docRef, {
      status: 'not_connected',
      accessToken: null,
      refreshToken: null,
      updatedAt: serverTimestamp()
    }, { merge: true });
  }
}

export const LinkedAccountInstance = new LinkedAccountService();
