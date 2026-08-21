import type * as d from '../../declarations';
import { CMP_FLAGS } from '../constants';
import { createShadowRoot } from '../shadow-root';

describe('createShadowRoot', () => {
  const callCreateShadowRoot = (flags: number) => {
    const host = document.createElement('div');
    const opts: ShadowRootInit[] = [];
    host.attachShadow = ((init: ShadowRootInit) => {
      opts.push(init);
      // jsdom's attachShadow does not accept the extra options we pass, so stub it
      return document.createElement('div') as unknown as ShadowRoot;
    }) as HTMLElement['attachShadow'];

    createShadowRoot.call(host, { $flags$: flags } as d.ComponentRuntimeMeta);
    return opts[0] as ShadowRootInit & { clonable?: boolean };
  };

  it('passes clonable: true to attachShadow when the shadowClonable flag is set', () => {
    const opts = callCreateShadowRoot(CMP_FLAGS.shadowDomEncapsulation | CMP_FLAGS.shadowClonable);
    expect(opts.clonable).toBe(true);
  });

  it('passes clonable: false to attachShadow when the shadowClonable flag is not set', () => {
    const opts = callCreateShadowRoot(CMP_FLAGS.shadowDomEncapsulation);
    expect(opts.clonable).toBe(false);
  });
});
