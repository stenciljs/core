import { MockElement } from './node';

export function dataset(elm: MockElement) {
  const ds: any = {};
  const attributes = elm.attributes;
  const attrLen = attributes.length;

  for (let i = 0; i < attrLen; i++) {
    const attr = attributes.item(i);
    const nodeName = attr.nodeName;
    if (nodeName.startsWith('data-')) {
      ds[dashToPascalCase(nodeName)] = attr.nodeValue;
    }
  }

  return new Proxy(ds, {
    get(_obj, camelCaseProp: string) {
      return ds[camelCaseProp];
    },
    set(_obj, camelCaseProp: string, value) {
      const dataAttr = toDataAttribute(camelCaseProp);
      elm.setAttribute(dataAttr, value);
      return true;
    },
  });
}

function toDataAttribute(str: string) {
  return (
    'data-' +
    String(str)
      .replace(/([A-Z0-9])/g, (g) => ' ' + g[0])
      .trim()
      .replace(/ /g, '-')
      .toLowerCase()
  );
}

function dashToPascalCase(str: string) {
  str = String(str).slice(5);
  return str
    .split('-')
    .map((segment, index) => {
      if (index === 0) {
        return segment.charAt(0).toLowerCase() + segment.slice(1);
      }
      return segment.charAt(0).toUpperCase() + segment.slice(1);
    })
    .join('');
}
