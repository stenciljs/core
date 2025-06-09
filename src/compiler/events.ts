import type * as d from '../declarations';

export const buildEvents = (): d.BuildEvents => {
  const evCallbacks: EventCallback[] = [];

  const off = (callback: any) => {
    const index = evCallbacks.findIndex((ev) => ev.callback === callback);
    if (index > -1) {
      evCallbacks.splice(index, 1);
      return true;
    }
    return false;
  };

  const on = (arg0: any, arg1?: any): d.BuildOnEventRemove => {
    if (typeof arg0 === 'function') {
      const eventName: null = null;
      const callback = arg0;
      evCallbacks.push({
        eventName,
        callback,
      });
      return () => off(callback);
    } else if (typeof arg0 === 'string' && typeof arg1 === 'function') {
      const eventName = arg0.toLowerCase().trim();
      const callback = arg1;

      evCallbacks.push({
        eventName,
        callback,
      });

      return () => off(callback);
    }
    return () => false;
  };

  const emit = (eventName: d.CompilerEventName, data: any) => {
    const normalizedEventName = eventName.toLowerCase().trim();
    const callbacks = evCallbacks.slice();

    for (const ev of callbacks) {
      if (ev.eventName == null) {
        try {
          ev.callback(eventName, data);
        } catch (e) {
          console.error(e);
        }
      } else if (ev.eventName === normalizedEventName) {
        try {
          ev.callback(data);
        } catch (e) {
          console.error(e);
        }
      }
    }
  };

  const unsubscribeAll = () => {
    evCallbacks.length = 0;
  };

  return {
    emit,
    on,
    unsubscribeAll,
  };
};

interface EventCallback {
  eventName: string | null;
  callback: Function;
}
