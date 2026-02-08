import * as d from '@stencil/core/declarations';
import { mockValidatedConfig } from '@stencil/core/testing';
import MagicString from 'magic-string';

import { appendBuildConditionals } from '../app-data-plugin';

function setup() {
  const config = mockValidatedConfig();
  const magicString = new MagicString('');
  return { config, magicString };
}

describe('app data plugin', () => {
  it('should include the fsNamespace in the appended BUILD constant', () => {
    const { config, magicString } = setup();
    appendBuildConditionals(config, {}, magicString);
    expect(magicString.toString().includes(`export const BUILD = /* ${config.fsNamespace} */`)).toBe(true);
  });

  it.each([true, false])('should include hydratedAttribute when %p', (hydratedAttribute) => {
    const conditionals: d.BuildConditionals = {
      hydratedAttribute,
    };
    const { config, magicString } = setup();
    appendBuildConditionals(config, conditionals, magicString);
    expect(magicString.toString().includes(`hydratedAttribute: ${String(hydratedAttribute)}`)).toBe(true);
  });

  it.each([true, false])('should include hydratedClass when %p', (hydratedClass) => {
    const conditionals: d.BuildConditionals = {
      hydratedClass,
    };
    const { config, magicString } = setup();
    appendBuildConditionals(config, conditionals, magicString);
    expect(magicString.toString().includes(`hydratedClass: ${String(hydratedClass)}`)).toBe(true);
  });

  it('should append hydratedSelectorName', () => {
    const conditionals: d.BuildConditionals = {
      hydratedSelectorName: 'boop',
    };
    const { config, magicString } = setup();
    appendBuildConditionals(config, conditionals, magicString);
    expect(magicString.toString().includes('hydratedSelectorName: "boop"')).toBe(true);
  });
});
