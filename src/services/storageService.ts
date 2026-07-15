import { 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';
import { storage } from '../firebase';

export const StorageService = {
  /**
   * Upload user profile avatar photo
   */
  async uploadAvatar(userId: string, file: Blob | File): Promise<string> {
    if (!storage) throw new Error('Firebase Storage is not initialized');
    const storageRef = ref(storage, `avatars/${userId}/${Date.now()}_profile.jpg`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  },

  /**
   * Upload receipt image or document
   */
  async uploadReceipt(userId: string, folder: string, file: Blob | File): Promise<string> {
    if (!storage) throw new Error('Firebase Storage is not initialized');
    const storageRef = ref(storage, `receipts/${userId}/${folder}/${Date.now()}_receipt.jpg`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  },

  /**
   * Upload generic documents
   */
  async uploadDocument(userId: string, docName: string, file: Blob | File): Promise<string> {
    if (!storage) throw new Error('Firebase Storage is not initialized');
    const storageRef = ref(storage, `documents/${userId}/${Date.now()}_${docName}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  }
};
