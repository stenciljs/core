import { MockDocument } from '../document';

describe('style', () => {
  let doc: MockDocument;
  beforeEach(() => {
    doc = new MockDocument();
  });

  it('style set CSS2Properties', () => {
    const elm = doc.createElement('div');
    elm.style.color = 'red';
    elm.style.fontSize = '14px';

    expect(elm.getAttribute('style')).toEqual(`color: red; font-size: 14px;`);
    expect(elm.style.length).toEqual(2);
    expect(elm.style.color).toEqual(`red`);
    expect(elm.style.fontSize).toEqual(`14px`);
    expect(elm.style.getPropertyValue('color')).toEqual(`red`);
    expect(elm.style.getPropertyValue('font-size')).toEqual(`14px`);
  });

  it('style setProperty()', () => {
    const elm = doc.createElement('div');
    elm.style.setProperty('color', 'red');
    elm.style.setProperty('font-size', '14px');

    expect(elm.getAttribute('style')).toEqual(`color: red; font-size: 14px;`);
    expect(elm.style.length).toEqual(2);
    expect(elm.style.color).toEqual(`red`);
    expect(elm.style.fontSize).toEqual(`14px`);
    expect(elm.style.getPropertyValue('color')).toEqual(`red`);
    expect(elm.style.getPropertyValue('font-size')).toEqual(`14px`);
  });

  it('set style attr', () => {
    const elm = doc.createElement('div');
    elm.setAttribute('style', 'color: red; font-size: 14px;');

    expect(elm.getAttribute('style')).toEqual(`color: red; font-size: 14px;`);
    expect(elm.style.length).toEqual(2);
    expect(elm.style.color).toEqual(`red`);
    expect(elm.style.fontSize).toEqual(`14px`);
    expect(elm.style.getPropertyValue('color')).toEqual(`red`);
    expect(elm.style.getPropertyValue('font-size')).toEqual(`14px`);
  });

  it('parse style attr', () => {
    let elm = doc.createElement('div');
    elm.innerHTML = `<div style="color: red; font-size: 14px;">text</div>`;
    elm = elm.firstElementChild;

    expect(elm.getAttribute('style')).toEqual(`color: red; font-size: 14px;`);
    expect(elm.style.length).toEqual(2);
    expect(elm.style.color).toEqual(`red`);
    expect(elm.style.fontSize).toEqual(`14px`);
    expect(elm.style.getPropertyValue('color')).toEqual(`red`);
    expect(elm.style.getPropertyValue('font-size')).toEqual(`14px`);
  });

  it('no style attr', () => {
    let elm = doc.createElement('div');
    elm.innerHTML = `<div>text</div>`;
    elm = elm.firstElementChild;

    expect(elm.getAttribute('style')).toEqual(null);
    expect(elm.style.length).toEqual(0);
    expect(elm.style.color).toEqual(``);
    expect(elm.style.fontSize).toEqual(``);
    expect(elm.style.getPropertyValue('color')).toEqual(``);
    expect(elm.style.getPropertyValue('font-size')).toEqual(``);
  });
});
