import { constrainTimeouts, type MockWindow } from '@stencil/mock-doc';
import type * as d from '@stencil/core';

import { STENCIL_DOC_DATA } from '../../runtime/runtime-constants';
import { runtimeLogging } from './runtime-log';

const createDocData = (): d.DocData =>
  ({
    hostIds: 0,
    rootLevelIds: 0,
    staticComponents: new Set<string>(),
  }) as d.DocData;

/**
 * Shared across fragment renders (`fullDocument: false`). Several fragments usually end up in
 * one page, so their hydration ids must not collide - this keeps counting across calls until
 * `resetSsrDocData()` is called.
 *
 * Full-document renders don't use it: a document is a whole page, so each gets its own
 * `docData` and its ids always start from 1. That keeps the output deterministic without any
 * reset, and stays correct when several renders run concurrently.
 */
const fragmentDocData: d.DocData = createDocData();

/**
 * Restart the hydration ids used by fragment renders (`fullDocument: false`).
 *
 * Optional - ids only need to be unique within a page, and they are without it. Call it once at
 * the start of each request that renders fragments, to get the same output for the same input.
 * Never call it between fragments that end up in the same page, or their ids will collide.
 * Full-document renders always start from 1 and aren't affected.
 */
export function resetSsrDocData() {
  const docData = fragmentDocData;
  docData.hostIds = 0;
  docData.rootLevelIds = 0;
  docData.staticComponents.clear();
}

export function initializeWindow(
  win: MockWindow,
  doc: Document,
  opts: d.SsrDocumentOptions,
  results: d.SsrResults,
) {
  if (typeof opts.url === 'string') {
    try {
      win.location.href = opts.url;
    } catch {}
  }

  if (typeof opts.userAgent === 'string') {
    try {
      win.navigator.userAgent = opts.userAgent;
    } catch {}
  }
  if (typeof opts.cookie === 'string') {
    try {
      doc.cookie = opts.cookie;
    } catch {}
  }
  if (typeof opts.referrer === 'string') {
    try {
      (doc as any).referrer = opts.referrer;
    } catch {}
  }
  if (typeof opts.direction === 'string') {
    try {
      doc.documentElement.setAttribute('dir', opts.direction);
    } catch {}
  }
  if (typeof opts.language === 'string') {
    try {
      doc.documentElement.setAttribute('lang', opts.language);
    } catch {}
  }
  if (typeof opts.buildId === 'string') {
    try {
      doc.documentElement.setAttribute('data-stencil-build', opts.buildId);
    } catch {}
  }

  try {
    win.customElements = null;
  } catch {}

  if (opts.constrainTimeouts) {
    constrainTimeouts(win);
  }

  runtimeLogging(win, opts, results);

  (doc as d.StencilDocument)[STENCIL_DOC_DATA] =
    (opts as d.SsrFactoryOptions).fullDocument === false ? fragmentDocData : createDocData();

  return win;
}
