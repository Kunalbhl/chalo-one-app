import { doc, getDoc, setDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';

export class WriteGuard {
  private static lastWriteTimestamps: Map<string, number> = new Map();
  private static THROTTLE_MS = 10000; // 10 seconds default throttle

  static async safeSet(
    collection: string,
    id: string,
    data: any,
    options: { merge?: boolean, throttleMs?: number } = { merge: true }
  ): Promise<boolean> {
    const docPath = `${collection}/${id}`;
    
    // Throttle check
    const throttleMs = options.throttleMs || this.THROTTLE_MS;
    const lastWrite = this.lastWriteTimestamps.get(docPath) || 0;
    const now = Date.now();
    
    if (now - lastWrite < throttleMs) {
      console.debug(`[WriteGuard] Throttled write to ${docPath}`);
      return false;
    }

    try {
      const docRef = doc(db, collection, id);
      const snap = await getDoc(docRef);
      
      // Deduplication check
      if (snap.exists() && this.isIdentical(snap.data(), data, options.merge)) {
        console.debug(`[WriteGuard] Deduplicated write to ${docPath} - no changes`);
        return false;
      }

      await setDoc(docRef, data, options);
      this.lastWriteTimestamps.set(docPath, Date.now());
      return true;
    } catch (e: any) {
      this.handleFirestoreError(e, docPath);
      return false;
    }
  }

  static async safeUpdate(
    collection: string,
    id: string,
    data: any,
    options: { throttleMs?: number } = {}
  ): Promise<boolean> {
    const docPath = `${collection}/${id}`;
    
    const throttleMs = options.throttleMs || this.THROTTLE_MS;
    const lastWrite = this.lastWriteTimestamps.get(docPath) || 0;
    const now = Date.now();
    
    if (now - lastWrite < throttleMs) {
      console.debug(`[WriteGuard] Throttled update to ${docPath}`);
      return false;
    }

    try {
      const docRef = doc(db, collection, id);
      const snap = await getDoc(docRef);
      
      if (!snap.exists()) {
        console.warn(`[WriteGuard] Cannot update non-existent doc ${docPath}`);
        return false;
      }
      
      if (this.isIdentical(snap.data(), data, true)) {
        console.debug(`[WriteGuard] Deduplicated update to ${docPath} - no changes`);
        return false;
      }

      await updateDoc(docRef, data);
      this.lastWriteTimestamps.set(docPath, Date.now());
      return true;
    } catch (e: any) {
      this.handleFirestoreError(e, docPath);
      return false;
    }
  }

  private static isIdentical(existing: any, updates: any, merge?: boolean): boolean {
    if (!existing || !updates) return false;
    
    // Only check fields present in updates (merge behavior)
    if (merge) {
      for (const key of Object.keys(updates)) {
        if (typeof updates[key] === 'object' && updates[key] !== null) {
          // Complex objects or FieldValues (like serverTimestamp) - assume changed for safety if not strictly identical
          // A deep equals could be implemented, but simple JSON comparison is often enough for basic state
          if (JSON.stringify(existing[key]) !== JSON.stringify(updates[key])) return false;
        } else if (existing[key] !== updates[key]) {
          return false;
        }
      }
      return true;
    }
    
    // Full replacement behavior
    return JSON.stringify(existing) === JSON.stringify(updates);
  }

  private static handleFirestoreError(e: any, context: string) {
    if (e.code === 'permission-denied' || e.code === 'resource-exhausted') {
      console.error(`[WriteGuard] CRITICAL: ${e.code} at ${context}. Halting retries.`, e.message);
      // We could throw here, but absorbing it prevents app crashes while stopping infinite loops
    } else {
      console.warn(`[WriteGuard] Write failed at ${context}:`, e);
    }
  }
}
