import { BUILD } from 'virtual:app-data';
// @ts-expect-error - resetPlatform is only exported from test bundle
import { plt, resetPlatform, win } from 'virtual:platform';
import { beforeEach, describe, expect, it } from 'vitest';

import { resetBuildConditionals } from '../../testing/reset-build-conditionals';
import { bootstrapLazy } from '../bootstrap-loader';
import { HYDRATED_CSS } from '../runtime-constants';
import type { LazyBundlesRuntimeData } from '../../declarations';

const minimalBundle = (tagName: string): LazyBundlesRuntimeData => [['bundle-id', [[0, tagName]]]];

describe('bootstrapLazy - CSS style injection', () => {
  beforeEach(() => {
    resetPlatform();
    resetBuildConditionals(BUILD);
    plt.$nonce$ = undefined;
  });

  it('does not inject a style element when no components are registered', () => {
    bootstrapLazy([]);
    expect(win.document.head.querySelector('[data-styles]')).toBeNull();
  });

  it('injects hydration CSS when invisiblePrehydration and hydratedClass are enabled', () => {
    BUILD.invisiblePrehydration = true;
    BUILD.hydratedClass = true;
    BUILD.hydratedAttribute = false;

    bootstrapLazy(minimalBundle('test-cmp'));

    const styleEl = win.document.head.querySelector('[data-styles]');
    expect(styleEl).not.toBeNull();
    expect(styleEl.textContent).toContain('test-cmp');
    expect(styleEl.textContent).toContain(HYDRATED_CSS);
  });

  it('injects hydration CSS when invisiblePrehydration and hydratedAttribute are enabled', () => {
    BUILD.invisiblePrehydration = true;
    BUILD.hydratedClass = false;
    BUILD.hydratedAttribute = true;

    bootstrapLazy(minimalBundle('test-cmp'));

    const styleEl = win.document.head.querySelector('[data-styles]');
    expect(styleEl).not.toBeNull();
    expect(styleEl.textContent).toContain(HYDRATED_CSS);
  });

  it('does not inject a style element when invisiblePrehydration is disabled', () => {
    BUILD.invisiblePrehydration = false;

    bootstrapLazy(minimalBundle('test-cmp'));

    expect(win.document.head.querySelector('[data-styles]')).toBeNull();
  });

  it('does not inject a style element when neither hydratedClass nor hydratedAttribute is enabled', () => {
    BUILD.invisiblePrehydration = true;
    BUILD.hydratedClass = false;
    BUILD.hydratedAttribute = false;

    bootstrapLazy(minimalBundle('test-cmp'));

    expect(win.document.head.querySelector('[data-styles]')).toBeNull();
  });

  it('applies a nonce from plt.$nonce$ to the style element', () => {
    BUILD.invisiblePrehydration = true;
    BUILD.hydratedClass = true;
    plt.$nonce$ = 'test-nonce-123';

    bootstrapLazy(minimalBundle('test-cmp'));

    const styleEl = win.document.head.querySelector('[data-styles]');
    expect(styleEl).not.toBeNull();
    expect(styleEl.getAttribute('nonce')).toBe('test-nonce-123');
  });

  it('applies a nonce from a <meta name="csp-nonce"> tag when plt.$nonce$ is unset', () => {
    BUILD.invisiblePrehydration = true;
    BUILD.hydratedClass = true;
    plt.$nonce$ = undefined;

    const meta = win.document.createElement('meta');
    meta.setAttribute('name', 'csp-nonce');
    meta.setAttribute('content', 'meta-nonce-456');
    win.document.head.appendChild(meta);

    bootstrapLazy(minimalBundle('test-cmp'));

    const styleEl = win.document.head.querySelector('[data-styles]');
    expect(styleEl).not.toBeNull();
    expect(styleEl.getAttribute('nonce')).toBe('meta-nonce-456');
  });
});
