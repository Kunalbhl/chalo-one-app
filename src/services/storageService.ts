import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase';
import { ErrorService } from './errorService';

export interface UploadResult {
  url: string;
  path: string;
  metadata: any;
}

export const StorageService = {
  async uploadFile(
    userId: string,
    folder: 'profiles' | 'documents' | 'receipts' | 'hotels' | 'support',
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<UploadResult> {
    try {
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size exceeds 10MB limit.');
      }

      const fileExtension = file.name.split('.').pop() || '';
      const uniqueFileName = `${Date.now()}_${crypto.randomUUID().slice(0, 8)}.${fileExtension}`;
      const path = `users/${userId}/${folder}/${uniqueFileName}`;
      
      const storageRef = ref(storage, path);
      
      const metadata = {
        contentType: file.type,
        customMetadata: {
          uploadedBy: userId,
          originalName: file.name
        }
      };

      const uploadTask = uploadBytesResumable(storageRef, file, metadata);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            if (onProgress) onProgress(progress);
          },
          (error) => {
            ErrorService.logError(error, 'StorageService.uploadFile', { userId, folder });
            reject(error);
          },
          async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            resolve({
              url,
              path,
              metadata: uploadTask.snapshot.metadata
            });
          }
        );
      });
    } catch (error: any) {
      ErrorService.logError(error, 'StorageService.uploadFile', { userId, folder });
      throw error;
    }
  },

  async deleteFile(path: string): Promise<void> {
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
    } catch (error: any) {
      ErrorService.logError(error, 'StorageService.deleteFile', { path });
      throw error;
    }
  }
};
