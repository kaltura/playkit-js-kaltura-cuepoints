export type Handler<T> = (event: T) => void;
export type WildcardHandler = (event: any) => void;

export interface Event {
  type: string;
}

export class EventsManager<T extends Event> {
  private _eventListeners: Record<string, Handler<any>[]> = {};
  private _wildcardEventListeners: WildcardHandler[] = [];

  on<TEvent extends Event>(type: TEvent['type'], handler: Handler<TEvent>): void;
  on(type: '*', handler: WildcardHandler): void;
  on(type: string, handler: any): void {
    if (type === '*') {
      this._wildcardEventListeners.push(handler);
      return;
    }
    (this._eventListeners[type] || (this._eventListeners[type] = [])).push(handler);
  }

  off<TEvent extends Event>(type: TEvent['type'], handler: Handler<TEvent>): void;
  off(type: '*', handler: WildcardHandler): void;
  off(type: string, handler: any): void {
    if (type === '*') {
      this._wildcardEventListeners = this._wildcardEventListeners.filter(item => item !== handler);
      return;
    }
    if (!this._eventListeners[type]) {
      return;
    }
    this._eventListeners[type] = this._eventListeners[type].filter(item => item !== handler);
  }

  emit(event: T): void {
    (this._eventListeners[event.type] || []).slice().map(handler => {
      handler(event);
    });
    this._wildcardEventListeners.slice().map(handler => {
      handler(event);
    });
  }
}
