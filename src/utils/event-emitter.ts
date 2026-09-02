import { Logger, defaultLogger } from './logger.js';

export type EventListener<T = unknown> = (data: T) => void;
export type UnsubscribeFn = () => void;

export class EventEmitter<T = unknown> {
  private listeners: Set<EventListener<T>> = new Set();
  private logger: Logger;

  /**
   * @param logger Optional logger for listener errors. Defaults to the shared {@link defaultLogger}
   *   so emitter errors honour the package log level instead of writing to `console` directly.
   */
  constructor(logger: Logger = defaultLogger) {
    this.logger = logger;
  }

  emit(data: T): void {
    this.listeners.forEach((listener) => {
      try {
        listener(data);
      } catch (error) {
        this.logger.error('Error in event listener:', error);
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
