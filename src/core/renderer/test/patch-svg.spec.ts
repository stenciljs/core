import { h } from '../h';
import { VNode } from '../vnode';
import { mockElement, mockRenderer } from '../../../testing/mocks';

describe('renderer', () => {
  const patch = mockRenderer();

  var elm: any;
  var vnode0: any;

  beforeEach(function() {
    elm = mockElement('div');
    vnode0 = new VNode();
    vnode0.elm = elm;
  });

  describe('created element', () => {

    it('has tag', () => {
      elm = patch(vnode0, h('div', null)).elm;
      expect(elm.tagName).toEqual('DIV');
    });

    it('should automatically get svg namespace', function() {
      var SVGNamespace = 'http://www.w3.org/2000/svg';
      var XHTMLNamespace = 'http://www.w3.org/1999/xhtml';

      const svgElm = mockElement('svg');
      vnode0.elm = svgElm;
      elm = patch(vnode0, null, h('svg', null,
        h('foreignObject', null,
          h('div', null, 'I am HTML embedded in SVG')
        )
      )).elm;

      expect(elm.firstChild.namespaceURI).toEqual(SVGNamespace);
      expect(elm.firstChild.firstChild.namespaceURI).toEqual(XHTMLNamespace);
    });
  });
});
