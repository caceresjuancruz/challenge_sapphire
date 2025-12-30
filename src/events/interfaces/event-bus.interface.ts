import { DomainEvent, EventType } from '../types/domain-events.js';

export type EventHandler<T = unknown> = (event: DomainEvent<T>) => void | Promise<void>;

export interface IEventBus {
  emit<T>(event: DomainEvent<T>): void;
  on<T>(eventType: EventType, handler: EventHandler<T>): void;
  off<T>(eventType: EventType, handler: EventHandler<T>): void;
}
