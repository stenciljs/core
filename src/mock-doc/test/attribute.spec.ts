import { XLINK_NS } from '../../runtime/runtime-constants';
import { MockAttr, MockAttributeMap } from '../attribute';
import { MockDocument } from '../document';
import { MockElement, MockHTMLElement } from '../node';

describe('attributes', () => {
  let doc: MockDocument;
  beforeEach(() => {
    doc = new MockDocument();
  });

  it('attribute map is iterable', () => {
    const map = new MockAttributeMap();
    const attr = new MockAttr('attr', 'value');
    map.setNamedItem(attr);

    expect(Array.from(map)[0]).toBe(attr);
  });

  it('should get attributes by index', () => {
    const element = new MockHTMLElement(doc, 'div');
    element.setAttribute('attr-0', 'value-0');
    element.setAttribute('attr-1', 'value-1');

    const attributes = Array.from(element.attributes);

    expect(attributes[0].name).toBe('attr-0');
    expect(attributes[0].value).toBe('value-0');
    expect(attributes[1].name).toBe('attr-1');
    expect(attributes[1].value).toBe('value-1');
    expect(attributes[2]).toBe(undefined);
  });

  it('attributes are case sensitive in Element', () => {
    const element = new MockElement(doc, 'div');

    element.setAttribute('viewBox', '0 0 10 10');
    expect(element.getAttribute('viewBox')).toEqual('0 0 10 10');
    expect(element.getAttribute('viewbox')).toEqual(null);

    element.removeAttribute('viewbox');
    expect(element.getAttribute('viewBox')).toEqual('0 0 10 10');
    expect(element.getAttribute('viewbox')).toEqual(null);

    element.removeAttribute('viewBox');
    expect(element.getAttribute('viewBox')).toEqual(null);

    element.setAttribute('viewBox', '0 0 10 10');
    element.setAttribute('viewbox', '0 0 20 20');

    expect(element.attributes.length).toBe(2);
    expect(element.attributes.getNamedItem('viewBox').value).toEqual('0 0 10 10');
    expect(element.attributes.getNamedItem('viewbox').value).toEqual('0 0 20 20');

    expect(element.attributes.getNamedItemNS(null, 'viewBox').value).toEqual('0 0 10 10');
    expect(element.attributes.getNamedItemNS(null, 'viewbox').value).toEqual('0 0 20 20');

    element.removeAttribute('viewBox');
    element.removeAttribute('viewbox');

    testNsAttributes(element);
  });

  it('should cast attribute values to string', () => {
    const element = new MockHTMLElement(doc, 'div');
    element.setAttribute('prop1', null);
    element.setAttribute('prop2', undefined);
    element.setAttribute('prop3', 0);
    element.setAttribute('prop4', 1);
    element.setAttribute('prop5', 'hola');
    element.setAttribute('prop6', '');

    expect(element.getAttribute('prop1')).toBe('null');
    expect(element.getAttribute('prop2')).toBe('undefined');
    expect(element.getAttribute('prop3')).toBe('0');
    expect(element.getAttribute('prop4')).toBe('1');
    expect(element.getAttribute('prop5')).toBe('hola');
    expect(element.getAttribute('prop6')).toBe('');

    expect(element).toEqualHtml(
      `<div prop1=\"null\" prop2=\"undefined\" prop3=\"0\" prop4=\"1\" prop5=\"hola\" prop6></div>`,
    );
  });

  it('should cast attributeNS values to string', () => {
    const element = new MockHTMLElement(doc, 'div');
    element.setAttributeNS(null, 'prop1', null);
    element.setAttributeNS(null, 'prop2', undefined);
    element.setAttributeNS(null, 'prop3', 0);
    element.setAttributeNS(null, 'prop4', 1);
    element.setAttributeNS(null, 'prop5', 'hola');
    element.setAttributeNS(null, 'prop6', '');

    expect(element.getAttribute('prop1')).toBe('null');
    expect(element.getAttribute('prop2')).toBe('undefined');
    expect(element.getAttribute('prop3')).toBe('0');
    expect(element.getAttribute('prop4')).toBe('1');
    expect(element.getAttribute('prop5')).toBe('hola');
    expect(element.getAttribute('prop6')).toBe('');

    expect(element).toEqualHtml(
      `<div prop1=\"null\" prop2=\"undefined\" prop3=\"0\" prop4=\"1\" prop5=\"hola\" prop6></div>`,
    );
  });

  it('attributes are case insensible in HTMLElement', () => {
    const element = new MockHTMLElement(doc, 'div');

    element.setAttribute('viewBox', '0 0 10 10');
    expect(element.getAttribute('viewBox')).toEqual('0 0 10 10');
    expect(element.getAttribute('viewbox')).toEqual('0 0 10 10');
    expect(element.getAttributeNS(null, 'viewbox')).toEqual('0 0 10 10');
    expect(element.getAttributeNS(null, 'viewBox')).toEqual(null);

    expect(element.attributes.length).toEqual(1);
    expect(element.attributes.item(0).name).toEqual('viewbox');

    element.removeAttribute('viewBox');

    expect(element.getAttribute('viewBox')).toEqual(null);
    expect(element.getAttribute('viewbox')).toEqual(null);

    element.setAttribute('viewBox', '0 0 10 10');
    element.setAttribute('viewbox', '0 0 20 20');
    expect(element.attributes.getNamedItem('viewBox').value).toEqual('0 0 20 20');
    expect(element.attributes.getNamedItem('viewbox').value).toEqual('0 0 20 20');

    expect(element.attributes.getNamedItemNS(null, 'viewBox')).toEqual(null);
    expect(element.attributes.getNamedItemNS(null, 'viewbox').value).toEqual('0 0 20 20');

    element.removeAttribute('viewbox');

    testNsAttributes(element);
  });

  it('xlink_ns namespaces should be reset', () => {
    const element = new MockHTMLElement(doc, 'div');
    element.setAttributeNS(XLINK_NS, 'href', 'google.com');
    expect(element.getAttribute('href')).toEqual('google.com');
  });

  it('draggable default value', () => {
    const div = doc.createElement('div');
    expect(div.draggable).toEqual(false);

    const img = doc.createElement('img');
    expect(img.draggable).toEqual(true);
  });

  it('draggable should reflect props to attributes', () => {
    const div = doc.createElement('div');
    div.draggable = true;
    expect(div.getAttribute('draggable')).toEqual('true');
    div.draggable = false;
    expect(div.getAttribute('draggable')).toEqual('false');
  });

  it('draggable should reflect attributes to props', () => {
    const div = doc.createElement('div');
    div.setAttribute('draggable', 'true');
    expect(div.draggable).toEqual(true);

    const img = doc.createElement('img');
    img.setAttribute('draggable', 'false');
    expect(img.draggable).toEqual(false);
  });

  describe('getAttributeNode', () => {
    it('should return an attribute node if the attribute exists', () => {
      const div = doc.createElement('div');
      div.setAttribute('draggable', 'true');
      expect(div.getAttributeNode('draggable')).toEqual({
        _name: 'draggable',
        _namespaceURI: null,
        _value: 'true',
      });
    });

    it('should return `null` if the attribute does not exist', () => {
      const div = doc.createElement('div');
      div.setAttribute('draggable', 'true');
      expect(div.getAttributeNode('test')).toEqual(null);
    });
  });

  function testNsAttributes(element: MockHTMLElement) {
    element.setAttributeNS('tEst', 'viewBox', '1');
    element.setAttributeNS('tEst', 'viewbox', '2');

    expect(element.attributes.length).toBe(2);
    expect(element.attributes.getNamedItemNS('test', 'viewBox')).toEqual(null);
    expect(element.attributes.getNamedItemNS('test', 'viewbox')).toEqual(null);
    expect(element.attributes.getNamedItemNS('tEst', 'viewBox').name).toEqual('viewBox');
    expect(element.attributes.getNamedItemNS('tEst', 'viewbox').name).toEqual('viewbox');
    expect(element.attributes.getNamedItemNS('tEst', 'viewBox').value).toEqual('1');
    expect(element.attributes.getNamedItemNS('tEst', 'viewbox').value).toEqual('2');

    element.removeAttributeNS('test', 'viewBox');
    element.removeAttributeNS('test', 'viewbox');

    expect(element.attributes.length).toBe(2);

    element.removeAttributeNS('tEst', 'viewBox');
    element.removeAttributeNS('tEst', 'viewbox');

    expect(element.attributes.length).toBe(0);

    element.setAttribute('value', '123');
    expect(element.getAttributeNS(null, 'Value')).toBe(null);
  }
});
