import { EventEmitter } from 'events';
import { injectable } from 'inversify';
import { IEventBus, EventHandler } from './interfaces/event-bus.interface.js';
import { DomainEvent, EventType } from './types/domain-events.js';

@injectable()
export class InMemoryEventBus implements IEventBus {
  private emitter = new EventEmitter();
  private handlerMap = new WeakMap<EventHandler<unknown>, (...args: unknown[]) => void>();

  emit<T>(event: DomainEvent<T>): void {
    this.emitter.emit(event.type, event);
  }

  on<T>(eventType: EventType, handler: EventHandler<T>): void {
    const wrappedHandler = (event: DomainEvent<T>): void => {
      Promise.resolve(handler(event)).catch((err: unknown) => {
        console.error('Event handler error:', err);
      });
    };
    this.handlerMap.set(
      handler as EventHandler<unknown>,
      wrappedHandler as (...args: unknown[]) => void
    );
    this.emitter.on(eventType, wrappedHandler);
  }

  off<T>(eventType: EventType, handler: EventHandler<T>): void {
    const wrappedHandler = this.handlerMap.get(handler as EventHandler<unknown>);
    if (wrappedHandler) {
      this.emitter.off(eventType, wrappedHandler);
      this.handlerMap.delete(handler as EventHandler<unknown>);
    }
  }
}
