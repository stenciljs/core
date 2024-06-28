/**
 * Production setAccessor() function based on Preact by
 * Jason Miller (@developit)
 * Licensed under the MIT License
 * https://github.com/developit/preact/blob/master/LICENSE
 *
 * Modified for Stencil's compiler and vdom
 */

import { BUILD } from '@app-data';
import { isMemberInElement, plt, win } from '@platform';
import { isComplexType } from '@utils';

import { VNODE_FLAGS, XLINK_NS } from '../runtime-constants';

/**
 * When running a VDom render set properties present on a VDom node onto the
 * corresponding HTML element.
 *
 * Note that this function has special functionality for the `class`,
 * `style`, `key`, and `ref` attributes, as well as event handlers (like
 * `onClick`, etc). All others are just passed through as-is.
 *
 * @param elm the HTMLElement onto which attributes should be set
 * @param memberName the name of the attribute to set
 * @param oldValue the old value for the attribute
 * @param newValue the new value for the attribute
 * @param isSvg whether we're in an svg context or not
 * @param flags bitflags for Vdom variables
 */
export const setAccessor = (
  elm: HTMLElement,
  memberName: string,
  oldValue: any,
  newValue: any,
  isSvg: boolean,
  flags: number,
) => {
  if (oldValue !== newValue) {
    let isProp = isMemberInElement(elm, memberName);
    let ln = memberName.toLowerCase();

    if (BUILD.vdomClass && memberName === 'class') {
      const classList = elm.classList;
      const oldClasses = parseClassList(oldValue);
      const newClasses = parseClassList(newValue);
      classList.remove(...oldClasses.filter((c) => c && !newClasses.includes(c)));
      classList.add(...newClasses.filter((c) => c && !oldClasses.includes(c)));
    } else if (BUILD.vdomStyle && memberName === 'style') {
      // update style attribute, css properties and values
      if (BUILD.updatable) {
        for (const prop in oldValue) {
          if (!newValue || newValue[prop] == null) {
            if (!BUILD.hydrateServerSide && prop.includes('-')) {
              elm.style.removeProperty(prop);
            } else {
              (elm as any).style[prop] = '';
            }
          }
        }
      }

      for (const prop in newValue) {
        if (!oldValue || newValue[prop] !== oldValue[prop]) {
          if (!BUILD.hydrateServerSide && prop.includes('-')) {
            elm.style.setProperty(prop, newValue[prop]);
          } else {
            (elm as any).style[prop] = newValue[prop];
          }
        }
      }
    } else if (BUILD.vdomKey && memberName === 'key') {
      // minifier will clean this up
    } else if (BUILD.vdomRef && memberName === 'ref') {
      // minifier will clean this up
      if (newValue) {
        newValue(elm);
      }
    } else if (
      BUILD.vdomListener &&
      (BUILD.lazyLoad ? !isProp : !(elm as any).__lookupSetter__(memberName)) &&
      memberName[0] === 'o' &&
      memberName[1] === 'n'
    ) {
      // Event Handlers
      // so if the member name starts with "on" and the 3rd characters is
      // a capital letter, and it's not already a member on the element,
      // then we're assuming it's an event listener
      if (memberName[2] === '-') {
        // on- prefixed events
        // allows to be explicit about the dom event to listen without any magic
        // under the hood:
        // <my-cmp on-click> // listens for "click"
        // <my-cmp on-Click> // listens for "Click"
        // <my-cmp on-ionChange> // listens for "ionChange"
        // <my-cmp on-EVENTS> // listens for "EVENTS"
        memberName = memberName.slice(3);
      } else if (isMemberInElement(win, ln)) {
        // standard event
        // the JSX attribute could have been "onMouseOver" and the
        // member name "onmouseover" is on the window's prototype
        // so let's add the listener "mouseover", which is all lowercased
        memberName = ln.slice(2);
      } else {
        // custom event
        // the JSX attribute could have been "onMyCustomEvent"
        // so let's trim off the "on" prefix and lowercase the first character
        // and add the listener "myCustomEvent"
        // except for the first character, we keep the event name case
        memberName = ln[2] + memberName.slice(3);
      }
      if (oldValue || newValue) {
        // Need to account for "capture" events.
        // If the event name ends with "Capture", we'll update the name to remove
        // the "Capture" suffix and make sure the event listener is setup to handle the capture event.
        const capture = memberName.endsWith(CAPTURE_EVENT_SUFFIX);
        // Make sure we only replace the last instance of "Capture"
        memberName = memberName.replace(CAPTURE_EVENT_REGEX, '');

        if (oldValue) {
          plt.rel(elm, memberName, oldValue, capture);
        }
        if (newValue) {
          plt.ael(elm, memberName, newValue, capture);
        }
      }
    } else if (BUILD.vdomPropOrAttr) {
      // Set property if it exists and it's not a SVG
      const isComplex = isComplexType(newValue);
      if ((isProp || (isComplex && newValue !== null)) && !isSvg) {
        try {
          if (!elm.tagName.includes('-')) {
            const n = newValue == null ? '' : newValue;

            // Workaround for Safari, moving the <input> caret when re-assigning the same valued
            if (memberName === 'list') {
              isProp = false;
            } else if (oldValue == null || (elm as any)[memberName] != n) {
              (elm as any)[memberName] = n;
            }
          } else {
            (elm as any)[memberName] = newValue;
          }
        } catch (e) {
          /**
           * in case someone tries to set a read-only property, e.g. "namespaceURI", we just ignore it
           */
        }
      }

      /**
       * Need to manually update attribute if:
       * - memberName is not an attribute
       * - if we are rendering the host element in order to reflect attribute
       * - if it's a SVG, since properties might not work in <svg>
       * - if the newValue is null/undefined or 'false'.
       */
      let xlink = false;
      if (BUILD.vdomXlink) {
        if (ln !== (ln = ln.replace(/^xlink\:?/, ''))) {
          memberName = ln;
          xlink = true;
        }
      }
      if (newValue == null || newValue === false) {
        if (newValue !== false || elm.getAttribute(memberName) === '') {
          if (BUILD.vdomXlink && xlink) {
            elm.removeAttributeNS(XLINK_NS, memberName);
          } else {
            elm.removeAttribute(memberName);
          }
        }
      } else if ((!isProp || flags & VNODE_FLAGS.isHost || isSvg) && !isComplex) {
        newValue = newValue === true ? '' : newValue;
        if (BUILD.vdomXlink && xlink) {
          elm.setAttributeNS(XLINK_NS, memberName, newValue);
        } else {
          elm.setAttribute(memberName, newValue);
        }
      }
    }
  }
};

const parseClassListRegex = /\s/;
/**
 * Parsed a string of classnames into an array
 * @param value className string, e.g. "foo bar baz"
 * @returns list of classes, e.g. ["foo", "bar", "baz"]
 */
const parseClassList = (value: string | undefined | null): string[] => (!value ? [] : value.split(parseClassListRegex));
const CAPTURE_EVENT_SUFFIX = 'Capture';
const CAPTURE_EVENT_REGEX = new RegExp(CAPTURE_EVENT_SUFFIX + '$');
