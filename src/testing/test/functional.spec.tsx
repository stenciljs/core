import { Fragment, h } from '@stencil/core';
import { newSpecPage, SpecPage } from '@stencil/core/testing';

import { ClassComponent } from './__fixtures__/cmp';

describe('testing function and class components', () => {
  it('can render a single functional component', async () => {
    const MyFunctionalComponent = () => <div>Hello World</div>;
    const page: SpecPage = await newSpecPage({
      components: [MyFunctionalComponent],
      template: () => <MyFunctionalComponent></MyFunctionalComponent>,
    });
    expect(page.root).toEqualHtml(`<div>Hello World</div>`);
  });

  it('can render a single functional component with props', async () => {
    const MyFunctionalComponent = (props: { foo: 'bar' }) => <div>{props.foo}</div>;
    const page: SpecPage = await newSpecPage({
      components: [MyFunctionalComponent],
      template: () => <MyFunctionalComponent foo="bar"></MyFunctionalComponent>,
    });
    expect(page.root).toEqualHtml(`<div>bar</div>`);
  });

  it('can render a single functional component with children', async () => {
    const MyFunctionalComponent: Fragment = (props: never, children: Fragment) => <div>{children}</div>;
    const page: SpecPage = await newSpecPage({
      components: [MyFunctionalComponent],
      template: () => <MyFunctionalComponent>Hello World</MyFunctionalComponent>,
    });
    expect(page.root).toEqualHtml(`<div>Hello World</div>`);
  });

  it('can render a single functional component with children and props', async () => {
    const MyFunctionalComponent = (props: { foo: 'bar' }, children: Fragment) => (
      <div>
        {children} - {props.foo}
      </div>
    );
    const page: SpecPage = await newSpecPage({
      components: [MyFunctionalComponent],
      template: () => <MyFunctionalComponent foo="bar">Hello World</MyFunctionalComponent>,
    });
    expect(page.root).toEqualHtml(`<div>Hello World - bar</div>`);
  });

  it('can render a class component with a functional component', async () => {
    const MyFunctionalComponent = (props: never, children: Fragment) => (
      <div>I am a functional component - {children}</div>
    );
    const page: SpecPage = await newSpecPage({
      components: [ClassComponent],
      template: () => (
        <class-component>
          <MyFunctionalComponent>Yes I am!</MyFunctionalComponent>
        </class-component>
      ),
    });
    expect(page.root).toEqualHtml(`<class-component>
  <mock:shadow-root>
    <div>
      <h1>
        I am a class component
      </h1>
      <slot></slot>
    </div>
  </mock:shadow-root>
  <div>
    I am a functional component - Yes I am!
  </div>
</class-component>
`);
  });

  it('can render a functional component within a class component', async () => {
    const MyFunctionalComponent = (props: never, children: Fragment) => (
      <div>
        <h1>I am a functional component</h1>
        {children}
      </div>
    );
    const page: SpecPage = await newSpecPage({
      components: [ClassComponent],
      template: () => (
        <MyFunctionalComponent>
          <class-component>Yes I am!</class-component>
        </MyFunctionalComponent>
      ),
    });
    expect(page.body).toEqualHtml(`<div>
    <h1>
      I am a functional component
    </h1>
    <class-component>
      <mock:shadow-root>
        <div>
          <h1>
            I am a class component
          </h1>
          <slot></slot>
        </div>
      </mock:shadow-root>
      Yes I am!
    </class-component>
  </div>`);
  });
});
