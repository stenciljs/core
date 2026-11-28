import { BUILD } from 'virtual:app-data';
import { getHostRef } from 'virtual:platform';
import type * as d from '@stencil/core';

export const getElement = (ref: any) =>
  BUILD.lazyLoad ? getHostRef(ref)?.$hostElement$ : (ref as d.HostElement);

/**
 * Get the shadow root for a Stencil component's host element.
 * This works for both open and closed shadow DOM modes.
 *
 * For closed shadow DOM, `element.shadowRoot` returns `null` by design,
 * but Stencil stores the reference internally so components can still
 * access their own shadow root.
 *
 * @param element The host element (from @Element() decorator)
 * @returns The shadow root, or null if no shadow root exists
 */
export const getShadowRoot = (element: HTMLElement): ShadowRoot | null => {
  // For closed shadow DOM, Stencil stores the shadow root as __shadowRoot
  // since element.shadowRoot returns null by spec for closed mode
  if (BUILD.shadowModeClosed && (element as any).__shadowRoot) {
    return (element as any).__shadowRoot;
  }
  return element.shadowRoot;
};
