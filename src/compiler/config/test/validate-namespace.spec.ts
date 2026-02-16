import type * as d from '@stencil/core/declarations';

import { validateNamespace } from '../validate-namespace';

// TODO(STENCIL-968): Update tests to check diagnostic messages
describe('validateNamespace', () => {
  const diagnostics: d.Diagnostic[] = [];

  beforeEach(() => {
    diagnostics.length = 0;
  });

  it('should not allow special characters in namespace', () => {
    validateNamespace('My/Namespace', undefined, diagnostics);
    expect(diagnostics).toHaveLength(1);

    diagnostics.length = 0;
    validateNamespace('My%20Namespace', undefined, diagnostics);
    expect(diagnostics).toHaveLength(1);

    diagnostics.length = 0;
    validateNamespace('My:Namespace', undefined, diagnostics);
    expect(diagnostics).toHaveLength(1);
  });

  it('should not allow spaces in namespace', () => {
    validateNamespace('My Namespace', undefined, diagnostics);
    expect(diagnostics).toHaveLength(1);
  });

  it('should not allow dash for last character of namespace', () => {
    validateNamespace('MyNamespace-', undefined, diagnostics);
    expect(diagnostics).toHaveLength(1);
  });

  it('should not allow dash for first character of namespace', () => {
    validateNamespace('-MyNamespace', undefined, diagnostics);
    expect(diagnostics).toHaveLength(1);
  });

  it('should not allow number for first character of namespace', () => {
    validateNamespace('88MyNamespace', undefined, diagnostics);
    expect(diagnostics).toHaveLength(1);
  });

  it('should enforce namespace being at least 3 characters', () => {
    validateNamespace('ab', undefined, diagnostics);
    expect(diagnostics).toHaveLength(1);
  });

  it('should allow $ in the namespace', () => {
    const { namespace, fsNamespace } = validateNamespace('$MyNamespace', undefined, diagnostics);
    expect(namespace).toBe('$MyNamespace');
    expect(fsNamespace).toBe('$mynamespace');
  });

  it('should allow underscore in the namespace', () => {
    const { namespace, fsNamespace } = validateNamespace('My_Namespace', undefined, diagnostics);
    expect(namespace).toBe('My_Namespace');
    expect(fsNamespace).toBe('my_namespace');
  });

  it('should allow dash in the namespace', () => {
    const { namespace, fsNamespace } = validateNamespace('My-Namespace', undefined, diagnostics);
    expect(namespace).toBe('MyNamespace');
    expect(fsNamespace).toBe('my-namespace');
  });

  it('should set user namespace', () => {
    const { namespace, fsNamespace } = validateNamespace('MyNamespace', undefined, diagnostics);
    expect(namespace).toBe('MyNamespace');
    expect(fsNamespace).toBe('mynamespace');
  });

  it('should set default namespace', () => {
    const { namespace, fsNamespace } = validateNamespace(undefined, undefined, diagnostics);
    expect(namespace).toBe('App');
    expect(fsNamespace).toBe('app');
  });
});
