import { beforeEach, describe, expect, it } from 'vitest';
import type * as d from '@stencil/core';

import { validateNamespace } from '../validate-namespace';

describe('validateNamespace', () => {
  const diagnostics: d.Diagnostic[] = [];

  beforeEach(() => {
    diagnostics.length = 0;
  });

  it('should not allow special characters in namespace', () => {
    validateNamespace('My/Namespace', undefined, diagnostics);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].messageText).toBe('Namespace "My/Namespace" contains invalid characters: /');

    diagnostics.length = 0;
    validateNamespace('My%20Namespace', undefined, diagnostics);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].messageText).toBe('Namespace "My%20Namespace" contains invalid characters: %');

    diagnostics.length = 0;
    validateNamespace('My:Namespace', undefined, diagnostics);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].messageText).toBe('Namespace "My:Namespace" contains invalid characters: :');
  });

  it('should not allow spaces in namespace', () => {
    validateNamespace('My Namespace', undefined, diagnostics);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].messageText).toBe('Namespace "My Namespace" contains invalid characters:  ');
  });

  it('should not allow dash for last character of namespace', () => {
    validateNamespace('MyNamespace-', undefined, diagnostics);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].messageText).toBe('Namespace "MyNamespace-" cannot have a dash for the last character');
  });

  it('should not allow dash for first character of namespace', () => {
    validateNamespace('-MyNamespace', undefined, diagnostics);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].messageText).toBe('Namespace "-MyNamespace" cannot have a dash for the first character');
  });

  it('should not allow number for first character of namespace', () => {
    validateNamespace('88MyNamespace', undefined, diagnostics);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].messageText).toBe('Namespace "88MyNamespace" cannot have a number for the first character');
  });

  it('should enforce namespace being at least 3 characters', () => {
    validateNamespace('ab', undefined, diagnostics);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].messageText).toBe('Namespace "ab" must be at least 3 characters');
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
