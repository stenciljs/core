import { HostElement } from '../../declarations';
import { hasShadowRoot, setHmrAttr } from './hmr-util';

/**
 * Perform Hot Module Replacement for a given Stencil component (identified
 * uniquely via its tag name) in the DOM tree rooted at a given starting
 * element.
 *
 * @param element the root element within which to do Hot Module Replacement
 * @param versionId the current HMR version ID
 * @param hmrTagNames an out param containing a list of updated Stencil
 * component tag names
 * @returns a reference to the tag name array
 */
export const hmrComponents = (element: Element, versionId: string, hmrTagNames: string[]) => {
  const updatedTags: string[] = [];

  hmrTagNames.forEach((hmrTagName) => {
    hmrComponent(updatedTags, element, versionId, hmrTagName);
  });

  return updatedTags.sort();
};

/**
 * Perform Hot Module Replacement (HMR) for a particular Stencil component
 * based on its tag name by searching through the DOM tree rooted at a starting
 * element and, if any element in the subtree has the tag name of interest,
 * calling the {@link HostElement['s-hmr']} callback on that element in order
 * to update it.
 *
 * This will also recur into the shadow root of any elements which have one, so
 * that nested components can also be reloaded.
 *
 * @param updatedTags an out param which will be modified to include the tag
 * names of any successfully-updated elements
 * @param element the element from which to start searching
 * @param versionId the current HMR version id
 * @param cmpTagName the tag name of interest
 */
const hmrComponent = (updatedTags: string[], element: Element, versionId: string, cmpTagName: string) => {
  // drill down through every node in the page
  // to include shadow roots and look for this
  // component tag to run hmr() on
  if (element.nodeName.toLowerCase() === cmpTagName && typeof (element as HostElement)['s-hmr'] === 'function') {
    (element as HostElement)['s-hmr'](versionId);
    setHmrAttr(element, versionId);

    if (updatedTags.indexOf(cmpTagName) === -1) {
      updatedTags.push(cmpTagName);
    }
  }

  // recur into any elements which have a shadow root
  if (hasShadowRoot(element)) {
    hmrComponent(updatedTags, element.shadowRoot as any, versionId, cmpTagName);
  }

  if (element.children) {
    for (let i = 0; i < element.children.length; i++) {
      hmrComponent(updatedTags, element.children[i], versionId, cmpTagName);
    }
  }
};
