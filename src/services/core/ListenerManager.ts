import { Unsubscribe } from 'firebase/firestore';

export class ListenerManager {
  private static listeners: Map<string, Unsubscribe> = new Map();

  static subscribe(key: string, unsubscribe: Unsubscribe) {
    if (this.listeners.has(key)) {
      this.listeners.get(key)!();
    }
    this.listeners.set(key, unsubscribe);
  }

  static unsubscribe(key: string) {
    if (this.listeners.has(key)) {
      this.listeners.get(key)!();
      this.listeners.delete(key);
    }
  }

  static unsubscribeAll() {
    this.listeners.forEach((unsub) => unsub());
    this.listeners.clear();
  }
}
