import { Component, h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';

import { Prop } from '../../declarations';

describe('SVG element', () => {
  it('should render #text nodes', async () => {
    @Component({ tag: 'cmp-a' })
    class CmpA {
      @Prop() lines: any[] = [1];

      render() {
        return (
          <svg viewBox="0 0 100 4">
            {this.lines.map((a) => {
              return [<text>Hola {a}</text>];
            })}
          </svg>
        );
      }
    }
    const { root, waitForChanges } = await newSpecPage({
      components: [CmpA],
      html: `<cmp-a></cmp-a>`,
    });
    expect(root).toEqualHtml(`
      <cmp-a>
        <svg viewBox=\"0 0 100 4\">
          <text>Hola 1</text>
        </svg>
      </cmp-a>
    `);
    root.lines = [1, 2];
    await waitForChanges();
    expect(root).toEqualHtml(`
      <cmp-a>
        <svg viewBox=\"0 0 100 4\">
          <text>Hola 1</text>
          <text>Hola 2</text>
        </svg>
      </cmp-a>
    `);

    // Ensure all SVG elements have the SVG namespace
    const namespaces = root.querySelectorAll('text').map((e: any) => e.namespaceURI);

    expect(namespaces).toEqual(['http://www.w3.org/2000/svg', 'http://www.w3.org/2000/svg']);
  });

  it('should render camelCase attributes', async () => {
    @Component({ tag: 'cmp-a' })
    class CmpA {
      render() {
        const A = 'a' as any;
        return (
          <svg id="my-svg" viewBox="0 0 100 4" preserveAspectRatio="none">
            <A xlinkHref="/path"></A>
            <a href="/path"></a>
          </svg>
        );
      }
    }
    const { root } = await newSpecPage({
      components: [CmpA],
      html: `<cmp-a></cmp-a>`,
    });
    expect(root).toEqualHtml(`
      <cmp-a>
        <svg id=\"my-svg\" preserveAspectRatio=\"none\" viewBox=\"0 0 100 4\">
          <a xlink:href="/path"></a>
          <a href="/path"></a>
        </svg>
      </cmp-a>
    `);
  });

  it('should map camelCase props to kebab-case svg attributes', async () => {
    @Component({ tag: 'cmp-a' })
    class CmpA {
      render() {
        const circleProps = { cx: 15, cy: 5, r: 3, stroke: 'green', strokeWidth: 3 };
        return (
          <svg viewBox="0 0 30 10">
            <circle {...circleProps} />
            <rect width={4} height={4} fillOpacity={0.5} />
          </svg>
        );
      }
    }
    const { root } = await newSpecPage({
      components: [CmpA],
      html: `<cmp-a></cmp-a>`,
    });
    expect(root).toEqualHtml(`
      <cmp-a>
        <svg viewBox=\"0 0 30 10\">
          <circle cx=\"15\" cy=\"5\" r=\"3\" stroke=\"green\" stroke-width=\"3\"></circle>
          <rect width=\"4\" height=\"4\" fill-opacity=\"0.5\"></rect>
        </svg>
      </cmp-a>
    `);
  });

  it('should update and remove kebab-case mapped svg attributes', async () => {
    @Component({ tag: 'cmp-a' })
    class CmpA {
      @Prop() strokeWidth?: number = 3;

      render() {
        return (
          <svg viewBox="0 0 30 10">
            <circle cx="15" cy="5" r="3" strokeWidth={this.strokeWidth} />
          </svg>
        );
      }
    }
    const { root, waitForChanges } = await newSpecPage({
      components: [CmpA],
      html: `<cmp-a></cmp-a>`,
    });
    let circle = root.querySelector('circle');
    expect(circle.getAttribute('stroke-width')).toBe('3');

    root.strokeWidth = 5;
    await waitForChanges();
    circle = root.querySelector('circle');
    expect(circle.getAttribute('stroke-width')).toBe('5');

    root.strokeWidth = undefined;
    await waitForChanges();
    circle = root.querySelector('circle');
    expect(circle.hasAttribute('stroke-width')).toBe(false);
  });

  describe('path', () => {
    @Component({ tag: 'cmp-a' })
    class CmpA {
      render() {
        return (
          <div>
            <a href="#">Dude!!</a>
            <svg id="my-svg" viewBox="0 0 100 4" preserveAspectRatio="none">
              <path id="my-svg-path" d="M 0,2 L 100,2" stroke="#FFEA82" stroke-width="4" fill-opacity="0" />
            </svg>
          </div>
        );
      }
    }

    let path: SVGGeometryElement;
    beforeEach(async () => {
      const page = await newSpecPage({
        components: [CmpA],
        html: `<cmp-a></cmp-a>`,
      });
      path = page.root.querySelector('#my-svg-path');
    });

    it('path namespace is SVG', () => {
      expect(path.namespaceURI).toEqual('http://www.w3.org/2000/svg');
    });

    it('allows read access to the ownerSVGElement property', () => {
      expect(path.ownerSVGElement).toEqual(null);
    });

    it('allows read access to the viewportElement property', () => {
      expect(path.viewportElement).toEqual(null);
    });

    it('allows access to the getTotalLength() method', () => {
      expect(path.getTotalLength()).toEqual(0);
    });

    it('allows access to the isPointInFill() method', () => {
      expect(path.isPointInFill()).toEqual(false);
    });

    it('allows access to the isPointInStroke() method', () => {
      expect(path.isPointInStroke()).toEqual(false);
    });
  });
});
