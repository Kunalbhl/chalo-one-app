type Listener = (data: any) => void;

export class EventBus {
  private static listeners: Map<string, Listener[]> = new Map();

  static subscribe(event: string, listener: Listener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }

  static publish(event: string, data: any) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.forEach((listener) => listener(data));
    }
  }
}
