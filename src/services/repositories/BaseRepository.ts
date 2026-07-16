import { doc, getDoc, collection, getDocs, query, QueryConstraint, DocumentData } from 'firebase/firestore';
import { db } from '../../firebase';
import { WriteGuard } from '../WriteGuard';
import { CacheService } from '../core/CacheService';

export abstract class BaseRepository<T> {
  protected abstract collectionName: string;

  async getById(id: string): Promise<T | null> {
    const cacheKey = `${this.collectionName}/${id}`;
    const cached = CacheService.get(cacheKey);
    if (cached) return cached;

    const docRef = doc(db, this.collectionName, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    
    const data = { id: snap.id, ...snap.data() } as T;
    CacheService.set(cacheKey, data);
    return data;
  }

  async set(id: string, data: Partial<T>): Promise<boolean> {
    CacheService.clear(`${this.collectionName}/${id}`);
    return await WriteGuard.safeSet(this.collectionName, id, data);
  }

  async update(id: string, data: Partial<T>): Promise<boolean> {
    CacheService.clear(`${this.collectionName}/${id}`);
    return await WriteGuard.safeUpdate(this.collectionName, id, data);
  }
}
