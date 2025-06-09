import type * as d from '@stencil/core/internal';

export function toHaveReceivedEvent(eventSpy: d.EventSpy) {
  if (!eventSpy) {
    throw new Error(`toHaveReceivedEvent event spy is null`);
  }

  if (typeof (eventSpy as any).then === 'function') {
    throw new Error(`event spy must be a resolved value, not a promise, before it can be tested`);
  }

  if (!eventSpy.eventName) {
    throw new Error(`toHaveReceivedEvent did not receive an event spy`);
  }

  const pass = eventSpy.events.length > 0;

  return {
    message: () => `expected to have ${pass ? 'not ' : ''}called "${eventSpy.eventName}" event`,
    pass: pass,
  };
}

export function toHaveReceivedEventTimes(eventSpy: d.EventSpy, count: number) {
  if (!eventSpy) {
    throw new Error(`toHaveReceivedEventTimes event spy is null`);
  }

  if (typeof (eventSpy as any).then === 'function') {
    throw new Error(`event spy must be a resolved value, not a promise, before it can be tested`);
  }

  if (!eventSpy.eventName) {
    throw new Error(`toHaveReceivedEventTimes did not receive an event spy`);
  }

  const pass = eventSpy.length === count;

  return {
    message: () =>
      `expected event "${eventSpy.eventName}" to have been called ${count} times, but was called ${
        eventSpy.events.length
      } time${eventSpy.events.length > 1 ? 's' : ''}`,
    pass: pass,
  };
}

export function toHaveReceivedEventDetail(eventSpy: d.EventSpy, eventDetail: any) {
  if (!eventSpy) {
    throw new Error(`toHaveReceivedEventDetail event spy is null`);
  }

  if (typeof (eventSpy as any).then === 'function') {
    throw new Error(`event spy must be a resolved value, not a promise, before it can be tested`);
  }

  if (!eventSpy.eventName) {
    throw new Error(`toHaveReceivedEventDetail did not receive an event spy`);
  }

  if (!eventSpy.lastEvent) {
    throw new Error(`event "${eventSpy.eventName}" was not received`);
  }

  const pass = deepEqual(eventSpy.lastEvent.detail, eventDetail);

  expect(eventSpy.lastEvent.detail).toEqual(eventDetail);

  return {
    message: () => `expected event "${eventSpy.eventName}" detail to ${pass ? 'not ' : ''}equal`,
    pass: pass,
  };
}

export function toHaveFirstReceivedEventDetail(eventSpy: d.EventSpy, eventDetail: any) {
  if (!eventSpy) {
    throw new Error(`toHaveFirstReceivedEventDetail event spy is null`);
  }

  if (typeof (eventSpy as any).then === 'function') {
    throw new Error(`event spy must be a resolved value, not a promise, before it can be tested`);
  }

  if (!eventSpy.eventName) {
    throw new Error(`toHaveFirstReceivedEventDetail did not receive an event spy`);
  }

  if (!eventSpy.firstEvent) {
    throw new Error(`event "${eventSpy.eventName}" was not received`);
  }

  const pass = deepEqual(eventSpy.firstEvent.detail, eventDetail);

  expect(eventSpy.firstEvent.detail).toEqual(eventDetail);

  return {
    message: () => `expected event "${eventSpy.eventName}" detail to ${pass ? 'not ' : ''}equal`,
    pass: pass,
  };
}

export function toHaveLastReceivedEventDetail(eventSpy: d.EventSpy, eventDetail: any) {
  if (!eventSpy) {
    throw new Error(`toHaveLastReceivedEventDetail event spy is null`);
  }

  if (typeof (eventSpy as any).then === 'function') {
    throw new Error(`event spy must be a resolved value, not a promise, before it can be tested`);
  }

  if (!eventSpy.eventName) {
    throw new Error(`toHaveLastReceivedEventDetail did not receive an event spy`);
  }

  if (!eventSpy.firstEvent) {
    throw new Error(`event "${eventSpy.eventName}" was not received`);
  }

  const pass = deepEqual(eventSpy.lastEvent.detail, eventDetail);

  expect(eventSpy.lastEvent.detail).toEqual(eventDetail);

  return {
    message: () => `expected event "${eventSpy.eventName}" detail to ${pass ? 'not ' : ''}equal`,
    pass: pass,
  };
}

export function toHaveNthReceivedEventDetail(eventSpy: d.EventSpy, index: number, eventDetail: any) {
  if (!eventSpy) {
    throw new Error(`toHaveNthReceivedEventDetail event spy is null`);
  }

  if (typeof (eventSpy as any).then === 'function') {
    throw new Error(`event spy must be a resolved value, not a promise, before it can be tested`);
  }

  if (!eventSpy.eventName) {
    throw new Error(`toHaveNthReceivedEventDetail did not receive an event spy`);
  }

  if (!eventSpy.firstEvent) {
    throw new Error(`event "${eventSpy.eventName}" was not received`);
  }

  const event = eventSpy.events[index];

  if (!event) {
    throw new Error(`event at index ${index} was not received`);
  }

  const pass = deepEqual(event.detail, eventDetail);

  expect(event.detail).toEqual(eventDetail);

  return {
    message: () => `expected event "${eventSpy.eventName}" detail to ${pass ? 'not ' : ''}equal`,
    pass: pass,
  };
}

// from https://www.npmjs.com/package/fast-deep-equal
// License in NOTICE.md
const deepEqual = function equal(a: any, b: any) {
  if (a === b) return true;

  if (a && b && typeof a == 'object' && typeof b == 'object') {
    const arrA = Array.isArray(a),
      arrB = Array.isArray(b);
    let i, length, key;

    if (arrA && arrB) {
      length = a.length;
      if (length != b.length) return false;
      for (i = length; i-- !== 0; ) if (!equal(a[i], b[i])) return false;
      return true;
    }

    if (arrA != arrB) return false;

    const dateA = a instanceof Date,
      dateB = b instanceof Date;
    if (dateA != dateB) return false;
    if (dateA && dateB) return a.getTime() == b.getTime();

    const regexpA = a instanceof RegExp,
      regexpB = b instanceof RegExp;
    if (regexpA != regexpB) return false;
    if (regexpA && regexpB) return a.toString() == b.toString();

    const keys = Object.keys(a);
    length = keys.length;

    if (length !== Object.keys(b).length) return false;

    for (i = length; i-- !== 0; ) if (!Object.prototype.hasOwnProperty.call(b, keys[i])) return false;

    for (i = length; i-- !== 0; ) {
      key = keys[i];
      if (!equal(a[key], b[key])) return false;
    }

    return true;
  }

  return a !== a && b !== b;
};
