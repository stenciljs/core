import { constrainTimeouts, type MockWindow } from '@stencil/mock-doc';
import { STENCIL_DOC_DATA } from 'src/runtime/runtime-constants';

import type * as d from '@stencil/core';
import { runtimeLogging } from './runtime-log';

/**
 * Maintain a unique `docData` object across multiple hydration runs
 * to ensure that host ids remain unique.
 */
const docData: d.DocData = {
  hostIds: 0,
  rootLevelIds: 0,
  staticComponents: new Set<string>(),
} as d.DocData;

/**
 * Reset the docData counters. Useful for testing to ensure deterministic IDs.
 */
export function resetHydrateDocData() {
  docData.hostIds = 0;
  docData.rootLevelIds = 0;
  docData.staticComponents.clear();
}

export function initializeWindow(
  win: MockWindow,
  doc: Document,
  opts: d.HydrateDocumentOptions,
  results: d.HydrateResults,
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
    // TODO(STENCIL-345) - Evaluate reconciling MockWindow, Window differences
    // @ts-ignore
    win.customElements = null;
  } catch {}

  if (opts.constrainTimeouts) {
    constrainTimeouts(win);
  }

  runtimeLogging(win, opts, results);

  (doc as d.StencilDocument)[STENCIL_DOC_DATA] = docData;

  return win;
}
