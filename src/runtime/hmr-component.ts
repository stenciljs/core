import { getHostRef } from '@platform';
import { HOST_FLAGS } from '@utils';

import type * as d from '../declarations';
import { initializeComponent } from './initialize-component';

/**
 * Kick off hot-module-replacement for a component. In order to replace the
 * component in-place we:
 *
 * 1. get a reference to the {@link d.HostRef} for the element
 * 2. reset the element's runtime flags
 * 3. re-run the initialization logic for the element (via
 *    {@link initializeComponent})
 *
 * @param hostElement the host element for the component which we want to start
 * doing HMR
 * @param cmpMeta runtime metadata for the component
 * @param hmrVersionId the current HMR version ID
 */
export const hmrStart = (hostElement: d.HostElement, cmpMeta: d.ComponentRuntimeMeta, hmrVersionId: string) => {
  // ¯\_(ツ)_/¯
  const hostRef = getHostRef(hostElement);

  // reset state flags to only have been connected
  hostRef.$flags$ = HOST_FLAGS.hasConnected;

  // TODO
  // detach any event listeners that may have been added
  // because we're not passing an exact event name it'll
  // remove all of this element's event, which is good

  // re-initialize the component
  initializeComponent(hostElement, hostRef, cmpMeta, hmrVersionId);
};
