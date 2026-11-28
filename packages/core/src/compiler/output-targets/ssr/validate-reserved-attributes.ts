import type * as d from '@stencil/core';

import { HYDRATE_CHILD_ID, HYDRATE_ID } from '../../../runtime/runtime-constants';
import { buildError, relative, toDashCase } from '../../../utils';

/** Attributes server rendering writes on component hosts and the nodes they render. */
const SSR_ATTRIBUTES = new Set([HYDRATE_ID, HYDRATE_CHILD_ID, 's-sn', 's-mode']);

/**
 * Report props whose attribute would collide with one server rendering writes (`@Prop() sId` is
 * `s-id`): the server would overwrite or remove the value and the client would misread it. Only
 * relevant to builds that render on a server, so it's run by the `ssr` and `ssr-wasm` outputs.
 *
 * Complex props have no attribute of their own, but templates bind `ssrProp()` values under the
 * dash-cased prop name, so that's checked too.
 *
 * @param config the validated config
 * @param buildCtx the current build context
 */
export const validateSsrReservedAttributes = (config: d.ValidatedConfig, buildCtx: d.BuildCtx) => {
  for (const cmp of buildCtx.components) {
    for (const prop of cmp.properties) {
      const attribute = prop.attribute ?? toDashCase(prop.name);
      if (!SSR_ATTRIBUTES.has(attribute)) continue;

      const err = buildError(buildCtx.diagnostics);
      err.header = 'Reserved Attribute Name';
      err.messageText =
        `The "${prop.name}" prop of <${cmp.tagName}> uses the attribute "${attribute}", which ` +
        `Stencil writes when it renders on the server. Rename the prop, or give it another ` +
        `attribute name: @Prop({ attribute: '...' }).`;
      err.absFilePath = cmp.sourceFilePath;
      err.relFilePath = relative(config.rootDir, cmp.sourceFilePath);
    }
  }
};
