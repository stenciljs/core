import { plt } from '@platform';

interface SetPlatformOptions {
  raf?: (c: FrameRequestCallback) => number;
  ael?: (
    el: EventTarget,
    eventName: string,
    listener: EventListenerOrEventListenerObject,
    options: boolean | AddEventListenerOptions,
  ) => void;
  rel?: (
    el: EventTarget,
    eventName: string,
    listener: EventListenerOrEventListenerObject,
    options: boolean | AddEventListenerOptions,
  ) => void;
  ce?: (eventName: string, opts?: any) => CustomEvent;
}

export const setPlatformOptions = (opts: SetPlatformOptions) => Object.assign(plt, opts);
