import { mockBuildCtx, mockCompilerCtx, mockValidatedConfig } from '@stencil/core/testing';

import type * as d from '../../../declarations';
import { generateAppTypes } from '../generate-app-types';
import { stubComponentCompilerEvent } from './ComponentCompilerEvent.stub';
import { stubComponentCompilerMeta } from './ComponentCompilerMeta.stub';

describe('generateAppTypes', () => {
  let config: d.ValidatedConfig;
  let compilerCtx: d.CompilerCtx;
  let buildCtx: d.BuildCtx;

  const mockFs = {
    writeFile: jest.fn(),
  };

  beforeEach(() => {
    config = mockValidatedConfig({
      srcDir: '/',
    });
    compilerCtx = {
      ...mockCompilerCtx(config),
      fs: mockFs as any,
    };
    buildCtx = mockBuildCtx(config, compilerCtx);

    mockFs.writeFile.mockResolvedValueOnce({ changedContent: true });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should generate a type declaration file without custom event types', async () => {
    const compilerComponentMeta = stubComponentCompilerMeta({
      tagName: 'my-component',
      componentClassName: 'MyComponent',
      events: [],
    });
    buildCtx.components = [compilerComponentMeta];

    await generateAppTypes(config, compilerCtx, buildCtx, 'src');

    expect(mockFs.writeFile).toHaveBeenCalledWith(
      '/components.d.ts',
      `/* eslint-disable */
/* tslint:disable */
/**
 * This is an autogenerated file created by the Stencil compiler.
 * It contains typing information for all components that exist in this project.
 */
import { HTMLStencilElement, JSXBase } from "@stencil/core/internal";
export namespace Components {
        interface MyComponent {
        }
}
declare global {
        interface HTMLMyComponentElement extends Components.MyComponent, HTMLStencilElement {
        }
        var HTMLMyComponentElement: {
                prototype: HTMLMyComponentElement;
                new (): HTMLMyComponentElement;
        };
        interface HTMLElementTagNameMap {
                "my-component": HTMLMyComponentElement;
        }
}
declare namespace LocalJSX {
      interface MyComponent {
        }
        interface IntrinsicElements {
              "my-component": MyComponent;
        }
}
export { LocalJSX as JSX };
declare module "@stencil/core" {
        export namespace JSX {
                interface IntrinsicElements {
                        "my-component": LocalJSX.MyComponent & JSXBase.HTMLAttributes<HTMLMyComponentElement>;
                }
        }
}
`,
      {
        immediateWrite: true,
      }
    );
  });

  it('should generate a type declaration file with custom event types', async () => {
    const compilerComponentMeta = stubComponentCompilerMeta({
      tagName: 'my-component',
      componentClassName: 'MyComponent',
      hasEvent: true,
      events: [stubComponentCompilerEvent()],
    });
    buildCtx.components = [compilerComponentMeta];

    await generateAppTypes(config, compilerCtx, buildCtx, 'src');

    expect(mockFs.writeFile).toHaveBeenCalledWith(
      '/components.d.ts',
      `/* eslint-disable */
/* tslint:disable */
/**
 * This is an autogenerated file created by the Stencil compiler.
 * It contains typing information for all components that exist in this project.
 */
import { HTMLStencilElement, JSXBase } from "@stencil/core/internal";
import { UserImplementedEventType } from "./some/stubbed/path/resources";
export { UserImplementedEventType } from "./some/stubbed/path/resources";
export namespace Components {
        interface MyComponent {
        }
}
export interface MyComponentCustomEvent<T> extends CustomEvent<T> {
        detail: T;
        target: HTMLMyComponentElement;
}
declare global {
        interface HTMLMyComponentElement extends Components.MyComponent, HTMLStencilElement {
        }
        var HTMLMyComponentElement: {
                prototype: HTMLMyComponentElement;
                new (): HTMLMyComponentElement;
        };
        interface HTMLElementTagNameMap {
                "my-component": HTMLMyComponentElement;
        }
}
declare namespace LocalJSX {
      interface MyComponent {
                "onMyEvent"?: (event: MyComponentCustomEvent<UserImplementedEventType>) => void;
        }
        interface IntrinsicElements {
              "my-component": MyComponent;
        }
}
export { LocalJSX as JSX };
declare module "@stencil/core" {
        export namespace JSX {
                interface IntrinsicElements {
                        "my-component": LocalJSX.MyComponent & JSXBase.HTMLAttributes<HTMLMyComponentElement>;
                }
        }
}
`,
      {
        immediateWrite: true,
      }
    );
  });
});
