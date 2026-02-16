import { tagRequiresScoped } from '../hydrate-app';
import { expect, describe, it, afterEach, vi } from '@stencil/vitest'

describe('tagRequiresScoped', () => {

  afterEach(async () => {
    vi.resetModules();
  });

  it('should return true for a component with serializeShadowRoot: true', () => {
    expect(tagRequiresScoped('cmp-a', true)).toBe(false);
  });

  it('should return false for a component serializeShadowRoot: false', () => {
    expect(tagRequiresScoped('cmp-b', false)).toBe(true);
  });

  it('should return false for a component with serializeShadowRoot: undefined', () => {
    expect(tagRequiresScoped('cmp-c', undefined)).toBe(false);
  });

  it('should return true for a component with serializeShadowRoot: "scoped"', () => {
    expect(tagRequiresScoped('cmp-d', 'scoped')).toBe(true);
  });

  it('should return false for a component with serializeShadowRoot: "declarative-shadow-dom"', () => {
    expect(tagRequiresScoped('cmp-e', 'declarative-shadow-dom')).toBe(false);
  });

  it('should return true for a component when tag is in scoped list', () => {
    expect(tagRequiresScoped('cmp-f', { scoped: ['cmp-f'], default: 'scoped' })).toBe(true);
  });

  it('should return false for a component when tag is not scoped list', () => {
    expect(tagRequiresScoped('cmp-g', { scoped: ['cmp-f'], default: 'declarative-shadow-dom' })).toBe(false);
  });

  it('should return true for a component when default is scoped', () => {
    expect(tagRequiresScoped('cmp-g', { 'declarative-shadow-dom': ['cmp-f'], default: 'scoped' })).toBe(true);
  });

  it('should return false for a component when default is declarative-shadow-dom', () => {
    expect(tagRequiresScoped('cmp-g', { 'declarative-shadow-dom': ['cmp-f'], default: 'declarative-shadow-dom' })).toBe(
      false,
    );
  });
});
