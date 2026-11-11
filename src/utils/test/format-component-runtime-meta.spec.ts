import { stubComponentCompilerMeta } from '../../compiler/types/tests/ComponentCompilerMeta.stub';
import { CMP_FLAGS } from '../constants';
import { formatComponentRuntimeMeta } from '../format-component-runtime-meta';

describe('formatComponentRuntimeMeta', () => {
  it('sets the shadowClonable flag when clonable is enabled on a shadow component', () => {
    const compilerMeta = stubComponentCompilerMeta({
      encapsulation: 'shadow',
      shadowClonable: true,
    });

    const [flags] = formatComponentRuntimeMeta(compilerMeta, false) as [number, ...unknown[]];

    expect(flags & CMP_FLAGS.shadowDomEncapsulation).toBeTruthy();
    expect(flags & CMP_FLAGS.shadowClonable).toBeTruthy();
  });

  it('does not set the shadowClonable flag when clonable is disabled', () => {
    const compilerMeta = stubComponentCompilerMeta({
      encapsulation: 'shadow',
      shadowClonable: false,
    });

    const [flags] = formatComponentRuntimeMeta(compilerMeta, false) as [number, ...unknown[]];

    expect(flags & CMP_FLAGS.shadowClonable).toBeFalsy();
  });

  it('does not set the shadowClonable flag for non-shadow components', () => {
    const compilerMeta = stubComponentCompilerMeta({
      encapsulation: 'scoped',
      shadowClonable: true,
    });

    const [flags] = formatComponentRuntimeMeta(compilerMeta, false) as [number, ...unknown[]];

    expect(flags & CMP_FLAGS.shadowClonable).toBeFalsy();
  });
});
