/// <reference types="../wdio/dist/components.d.ts" />

import { h } from '@stencil/core';

export function TypeTestComponent() {
  return (
    <div>
      <h1 ariaLabel="123">Hello</h1>
      <h1 ariaLabel={'123'}>Hello</h1>
      {/* @ts-expect-error */}
      <h1 ariaLabel={123}>Hello</h1>
      <attribute-complex
        // @ts-expect-error
        nu0={'123'}
        nu1={123}
        nu2={123}
        bool0={true}
        bool1={true}
        bool2={true}
        str0={'123'}
        str1={'123'}
        str2={'123'}
        obj={'123'}
      ></attribute-complex>
      <my-component
        // @ts-expect-error
        first={123}
        last={'123'}
        middle={'123'}
      ></my-component>
    </div>
  );
}
