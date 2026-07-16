import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where,
  orderBy,
  limit,
  DocumentData,
  QueryConstraint,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth } from '../firebase';

export const OperationType = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LIST: 'list',
  GET: 'get',
  WRITE: 'write',
} as const;
export type OperationType = typeof OperationType[keyof typeof OperationType];

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const FirestoreService = {
  /**
   * Add or set a document at a specific path
   */
  async setDocument(collectionPath: string, docId: string, data: any): Promise<void> {
    try {
      const docRef = doc(db, collectionPath, docId);
      await setDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${collectionPath}/${docId}`);
    }
  },

  /**
   * Get a document once
   */
  async getDocument<T = DocumentData>(collectionPath: string, docId: string): Promise<T | null> {
    try {
      const docRef = doc(db, collectionPath, docId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as unknown as T;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `${collectionPath}/${docId}`);
      return null;
    }
  },

  /**
   * Update a document partially
   */
  async updateDocument(collectionPath: string, docId: string, data: any): Promise<void> {
    try {
      const docRef = doc(db, collectionPath, docId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${collectionPath}/${docId}`);
    }
  },

  /**
   * Delete a document
   */
  async deleteDocument(collectionPath: string, docId: string): Promise<void> {
    try {
      const docRef = doc(db, collectionPath, docId);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${collectionPath}/${docId}`);
    }
  },

  /**
   * Get all documents from a collection/query
   */
  async getCollection<T = DocumentData>(collectionPath: string, constraints: QueryConstraint[] = []): Promise<T[]> {
    try {
      const colRef = collection(db, collectionPath);
      const q = query(colRef, ...constraints);
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as unknown as T);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, collectionPath);
      return [];
    }
  },

  /**
   * Create real-time listener for a single document
   */
  subscribeDocument<T = DocumentData>(
    collectionPath: string, 
    docId: string, 
    onNext: (data: T | null) => void,
    onError?: (error: any) => void
  ): () => void {
    const docRef = doc(db, collectionPath, docId);
    return onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        onNext({ id: snap.id, ...snap.data() } as unknown as T);
      } else {
        onNext(null);
      }
    }, (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, `${collectionPath}/${docId}`);
    });
  },

  /**
   * Create real-time listener for a collection or query
   */
  subscribeCollection<T = DocumentData>(
    collectionPath: string,
    constraints: QueryConstraint[],
    onNext: (data: T[]) => void,
    onError?: (error: any) => void
  ): () => void {
    const colRef = collection(db, collectionPath);
    const q = query(colRef, ...constraints);
    return onSnapshot(q, (snap) => {
      const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as unknown as T);
      onNext(items);
    }, (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, collectionPath);
    });
  }
};
