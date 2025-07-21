export type EventListener<T = unknown> = (data: T) => void;
export type UnsubscribeFn = () => void;

export class EventEmitter<T = unknown> {
  private listeners: Set<EventListener<T>> = new Set();

  emit(data: T): void {
    this.listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error('Error in event listener:', error);
      }
    });
  }

  subscribe(listener: EventListener<T>): UnsubscribeFn {
    this.listeners.add(listener);
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  clear(): void {
    this.listeners.clear();
  }

  get listenerCount(): number {
    return this.listeners.size;
  }
}