// Import Env/NAMESPACE/BUILD from the external app-data (kept external in the lazy build,
// maps to @stencil/core/runtime/app-data in dist). Consumers alias that to their
// collection's app-data to get correct Env values and component-specific BUILD flags.
// We only override lazyLoad: true  the one flag that must always be set for the lazy
// runtime mechanism to work regardless of what the consumer's app-data provides.
import { BUILD as _BUILD, Env, NAMESPACE } from 'virtual:app-data-external';
import type { BuildConditionals } from '@stencil/core';

export const BUILD: BuildConditionals = { ..._BUILD, lazyLoad: true };
export { Env, NAMESPACE };
