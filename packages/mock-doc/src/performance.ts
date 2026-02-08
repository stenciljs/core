/**
 * https://developer.mozilla.org/en-US/docs/Web/API/Performance
 */
export class MockPerformance implements Performance {
  timeOrigin: number;
  eventCounts: EventCounts;

  constructor() {
    this.timeOrigin = Date.now();
    this.eventCounts = new Map<string, number>();
  }

  addEventListener() {
    //
  }

  clearMarks() {
    //
  }

  clearMeasures() {
    //
  }

  clearResourceTimings() {
    //
  }

  dispatchEvent() {
    return true;
  }

  getEntries() {
    return [] as any;
  }

  getEntriesByName() {
    return [] as any;
  }

  getEntriesByType() {
    return [] as any;
  }

  // Stencil's implementation of `mark` is non-compliant with the `Performance` interface. Because Stencil will
  // instantiate an instance of this class and may attempt to assign it to a variable of type `Performance`, the return
  // type must match the `Performance` interface (rather than typing this function as returning `void` and ignoring the
  // associated errors returned by the type checker)
  // @ts-ignore
  mark(): PerformanceMark {
    //
  }

  // Stencil's implementation of `measure` is non-compliant with the `Performance` interface. Because Stencil will
  // instantiate an instance of this class and may attempt to assign it to a variable of type `Performance`, the return
  // type must match the `Performance` interface (rather than typing this function as returning `void` and ignoring the
  // associated errors returned by the type checker)
  // @ts-ignore
  measure(): PerformanceMeasure {
    //
  }

  get navigation() {
    return {} as any;
  }

  now() {
    return Date.now() - this.timeOrigin;
  }

  get onresourcetimingbufferfull() {
    return null as any;
  }

  removeEventListener() {
    //
  }

  setResourceTimingBufferSize() {
    //
  }

  get timing() {
    return {} as any;
  }

  toJSON() {
    //
  }
}

export function resetPerformance(perf: Performance) {
  if (perf != null) {
    try {
      (perf as MockPerformance).timeOrigin = Date.now();
    } catch (e) {}
  }
}
