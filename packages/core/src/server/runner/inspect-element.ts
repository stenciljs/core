import type * as d from '../../declarations';

export function inspectElement(results: d.HydrateResults, elm: Element, depth: number) {
  const children = [...Array.from(elm.children), ...Array.from(elm.shadowRoot ? elm.shadowRoot.children : [])];

  for (let i = 0, ii = children.length; i < ii; i++) {
    const childElm = children[i];
    const tagName = childElm.nodeName.toLowerCase();

    if (tagName.includes('-')) {
      // we've already collected components that were hydrated
      // now that the document is completed we can count how
      // many they are and their depth
      const cmp = results.components.find((c) => c.tag === tagName);
      if (cmp != null) {
        cmp.count++;
        if (depth > cmp.depth) {
          cmp.depth = depth;
        }
      }
    } else {
      switch (tagName) {
        case 'a':
          const anchor = collectAttributes(childElm);
          anchor.href = (childElm as HTMLAnchorElement).href;
          if (typeof anchor.href === 'string') {
            if (!results.anchors.some((a) => a.href === anchor.href)) {
              results.anchors.push(anchor);
            }
          }
          break;

        case 'img':
          const img = collectAttributes(childElm);
          img.src = (childElm as HTMLImageElement).src;
          if (typeof img.src === 'string') {
            if (!results.imgs.some((a) => a.src === img.src)) {
              results.imgs.push(img);
            }
          }
          break;

        case 'link':
          const link = collectAttributes(childElm);
          link.href = (childElm as HTMLLinkElement).href;
          if (typeof link.rel === 'string' && link.rel.toLowerCase() === 'stylesheet') {
            if (typeof link.href === 'string') {
              if (!results.styles.some((s) => s.link === link.href)) {
                delete link.rel;
                delete link.type;
                results.styles.push(link);
              }
            }
          }
          break;

        case 'script':
          const script = collectAttributes(childElm);

          if (childElm.hasAttribute('src')) {
            script.src = (childElm as HTMLScriptElement).src;
            if (typeof script.src === 'string') {
              if (!results.scripts.some((s) => s.src === script.src)) {
                results.scripts.push(script);
              }
            }
          } else {
            const staticDataKey = childElm.getAttribute('data-stencil-static');
            if (staticDataKey) {
              // <script data-stencil-static="page.state" type="application/json">DATA</script>
              results.staticData.push({
                id: staticDataKey,
                type: childElm.getAttribute('type'),
                content: childElm.textContent,
              });
            }
          }
          break;
      }
    }

    depth++;

    inspectElement(results, childElm, depth);
  }
}

function collectAttributes(node: Element) {
  const parsedElm: d.HydrateElement = {};
  const attrs = node.attributes;
  for (let i = 0, ii = attrs.length; i < ii; i++) {
    const attr = attrs.item(i);
    const attrName = attr.nodeName.toLowerCase();
    if (SKIP_ATTRS.has(attrName)) {
      continue;
    }
    const attrValue = attr.nodeValue;
    if (attrName === 'class' && attrValue === '') {
      continue;
    }
    parsedElm[attrName] = attrValue;
  }
  return parsedElm;
}

const SKIP_ATTRS = new Set(['s-id', 'c-id']);
