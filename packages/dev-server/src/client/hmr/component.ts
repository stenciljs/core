import { setHmrAttr, hasShadowRoot } from './utils';
import type { HostElement } from '../types';

export const hmrComponents = (element: Element, versionId: string, hmrTagNames: string[]): string[] => {
  const updatedTags: string[] = []

  hmrTagNames.forEach((hmrTagName) => {
    hmrComponent(updatedTags, element, versionId, hmrTagName)
  })

  return updatedTags.sort()
}

const hmrComponent = (
  updatedTags: string[],
  element: Element,
  versionId: string,
  cmpTagName: string
): void => {
  if (
    element.nodeName.toLowerCase() === cmpTagName &&
    typeof (element as HostElement)['s-hmr'] === 'function'
  ) {
    ;(element as HostElement)['s-hmr']!(versionId)
    setHmrAttr(element, versionId)

    if (updatedTags.indexOf(cmpTagName) === -1) {
      updatedTags.push(cmpTagName)
    }
  }

  if (hasShadowRoot(element)) {
    hmrComponent(updatedTags, element.shadowRoot as unknown as Element, versionId, cmpTagName)
  }

  if (element.children) {
    for (let i = 0; i < element.children.length; i++) {
      hmrComponent(updatedTags, element.children[i], versionId, cmpTagName)
    }
  }
}
