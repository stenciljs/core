import { Component, h, Method, Prop } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';

@Component({
  tag: 'shared-cmp',
  shadow: true,
})
class SharedCmp {
  @Prop() a = 'Boom!';

  render() {
    return `${this.a}`;
  }
}

describe('prop', () => {
  const spy = jest.spyOn(console, 'warn').mockImplementation();

  afterEach(() => spy.mockReset());
  afterAll(() => spy.mockRestore());

  it('should show warning when immutable prop is mutated', async () => {
    @Component({ tag: 'cmp-a' })
    class CmpA {
      @Prop() a = 1;

      @Method()
      async update() {
        this.a = 2;
      }

      render() {
        return `${this.a}`;
      }
    }

    const { root, waitForChanges } = await newSpecPage({
      components: [CmpA],
      html: `<cmp-a></cmp-a>`,
    });

    expect(root).toEqualHtml('<cmp-a>1</cmp-a>');

    await root.update();
    await waitForChanges();

    expect(root).toEqualHtml('<cmp-a>2</cmp-a>');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toMatch(/@Prop\(\) "[A-Za-z-]+" on <[A-Za-z-]+> is immutable/);
  });

  it('should not show warning when mutable prop is mutated', async () => {
    @Component({ tag: 'cmp-a' })
    class CmpA {
      @Prop({ mutable: true }) a = 1;

      @Method()
      async update() {
        this.a = 2;
      }

      render() {
        return `${this.a}`;
      }
    }

    const { root, waitForChanges } = await newSpecPage({
      components: [CmpA],
      html: `<cmp-a></cmp-a>`,
    });

    expect(root).toEqualHtml('<cmp-a>1</cmp-a>');

    await root.update();
    await waitForChanges();

    expect(root).toEqualHtml('<cmp-a>2</cmp-a>');
    expect(spy).not.toHaveBeenCalled();
  });

  it('should not show warning when immutable prop is mutated from parent', async () => {
    @Component({ tag: 'cmp-a' })
    class CmpA {
      @Prop() a = 1;

      render() {
        return `${this.a}`;
      }
    }

    const { root, waitForChanges } = await newSpecPage({
      components: [CmpA],
      html: `<cmp-a></cmp-a>`,
    });

    expect(root).toEqualHtml('<cmp-a>1</cmp-a>');

    root.a = 2;
    await waitForChanges();

    expect(root).toEqualHtml('<cmp-a>2</cmp-a>');
    expect(spy).not.toHaveBeenCalled();
  });

  it('should not show warning when component is used across multiple tests - first time', async () => {
    const { root, waitForChanges } = await newSpecPage({
      components: [SharedCmp],
      html: `<shared-cmp></shared-cmp>`,
    });

    root.a = 'Bam!';
    await waitForChanges();

    expect(spy).not.toHaveBeenCalled();
  });

  it('should not show warning when component is used across multiple tests - second time', async () => {
    const { root, waitForChanges } = await newSpecPage({
      components: [SharedCmp],
      html: `<shared-cmp></shared-cmp>`,
    });

    root.a = 'Boom!';
    await waitForChanges();

    expect(spy).not.toHaveBeenCalled();
  });
});
