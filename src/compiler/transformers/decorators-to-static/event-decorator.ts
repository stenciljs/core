import { augmentDiagnosticWithNode, buildWarn } from '@utils';
import ts from 'typescript';

import type * as d from '../../../declarations';
import {
  convertValueToLiteral,
  createStaticGetter,
  getAttributeTypeInfo,
  resolveType,
  retrieveTsDecorators,
  serializeSymbol,
} from '../transform-utils';
import { getDecoratorParameters, isDecoratorNamed } from './decorator-utils';

export const eventDecoratorsToStatic = (
  diagnostics: d.Diagnostic[],
  decoratedProps: ts.ClassElement[],
  typeChecker: ts.TypeChecker,
  program: ts.Program,
  newMembers: ts.ClassElement[],
  decoratorName: string,
) => {
  const events = decoratedProps
    .filter(ts.isPropertyDeclaration)
    .map((prop) => parseEventDecorator(diagnostics, typeChecker, program, prop, decoratorName))
    .filter((ev) => !!ev);

  if (events.length > 0) {
    newMembers.push(createStaticGetter('events', convertValueToLiteral(events)));
  }
};

/**
 * Parse a single instance of Stencil's `@Event()` decorator and generate metadata for the class member that is
 * decorated
 * @param diagnostics a list of diagnostics used as a part of the parsing process. Any parse errors/warnings shall be
 * added to this collection
 * @param typeChecker an instance of the TypeScript type checker, used to generate information about the `@Event()` and
 * @param program a {@link ts.Program} object
 * its surrounding context in the AST
 * @param prop the property on the Stencil component class that is decorated with `@Event()`
 * @param decoratorName the name of the decorator to look for
 * @returns generated metadata for the class member decorated by `@Event()`, or `null` if none could be derived
 */
const parseEventDecorator = (
  diagnostics: d.Diagnostic[],
  typeChecker: ts.TypeChecker,
  program: ts.Program,
  prop: ts.PropertyDeclaration,
  decoratorName: string,
): d.ComponentCompilerStaticEvent | null => {
  const eventDecorator = retrieveTsDecorators(prop)?.find(isDecoratorNamed(decoratorName));

  if (eventDecorator == null) {
    return null;
  }

  const memberName = prop.name.getText();
  if (!memberName) {
    return null;
  }

  const [eventOpts] = getDecoratorParameters<d.EventOptions>(eventDecorator, typeChecker);
  const symbol = typeChecker.getSymbolAtLocation(prop.name);
  const eventName = getEventName(eventOpts, memberName);

  validateEventName(diagnostics, prop.name, eventName);

  const eventMeta = {
    method: memberName,
    name: eventName,
    bubbles: eventOpts && typeof eventOpts.bubbles === 'boolean' ? eventOpts.bubbles : true,
    cancelable: eventOpts && typeof eventOpts.cancelable === 'boolean' ? eventOpts.cancelable : true,
    composed: eventOpts && typeof eventOpts.composed === 'boolean' ? eventOpts.composed : true,
    docs: serializeSymbol(typeChecker, symbol),
    complexType: getComplexType(typeChecker, program, prop),
  };
  return eventMeta;
};

export const getEventName = (eventOptions: d.EventOptions, memberName: string) => {
  if (eventOptions && typeof eventOptions.eventName === 'string' && eventOptions.eventName.trim().length > 0) {
    // always use the event name if given
    return eventOptions.eventName.trim();
  }
  return memberName;
};

/**
 * Derive Stencil's class member type metadata from a node in the AST
 * @param typeChecker the TypeScript type checker
 * @param program a {@link ts.Program} object
 * @param node the node in the AST to generate metadata for
 * @returns the generated metadata
 */
const getComplexType = (
  typeChecker: ts.TypeChecker,
  program: ts.Program,
  node: ts.PropertyDeclaration,
): d.ComponentCompilerPropertyComplexType => {
  const sourceFile = node.getSourceFile();
  const eventType = node.type ? getEventType(node.type) : null;
  return {
    original: eventType ? eventType.getText() : 'any',
    resolved: eventType ? resolveType(typeChecker, typeChecker.getTypeFromTypeNode(eventType)) : 'any',
    references: eventType ? getAttributeTypeInfo(eventType, sourceFile, typeChecker, program) : {},
  };
};

/**
 * Derive the type of the event from the typings of `EventEmitter`
 * @param type the AST node containing the `EventEmitter` typing
 * @returns the type taken from `EventEmitter`, or `null` if the type cannot be derived
 */
const getEventType = (type: ts.TypeNode): ts.TypeNode | null => {
  if (
    ts.isTypeReferenceNode(type) &&
    ts.isIdentifier(type.typeName) &&
    type.typeName.text === 'EventEmitter' &&
    type.typeArguments &&
    type.typeArguments.length > 0
  ) {
    return type.typeArguments[0];
  }
  return null;
};

/**
 * Helper function for validating the name of the event
 *
 * This function assumes that the name of the event has been determined prior to calling it
 *
 * @param diagnostics a list of diagnostics used as a part of the validation process. Any parse errors/warnings shall be
 * added to this collection
 * @param node the node in the AT containing the class member decorated with `@Event()`
 * @param eventName the name of the event
 */
const validateEventName = (diagnostics: d.Diagnostic[], node: ts.Node, eventName: string): void => {
  // this regex checks for a string that begins with a capital letter - e.g. 'AskJeeves', 'Zoo', 'Spotify'
  if (/^[A-Z]/.test(eventName)) {
    const diagnostic = buildWarn(diagnostics);
    diagnostic.messageText = [
      `In order to be compatible with all event listeners on elements, the event name `,
      `cannot start with a capital letter. `,
      `Please lowercase the first character for the event to best work with all listeners.`,
    ].join('');
    augmentDiagnosticWithNode(diagnostic, node);
    return;
  }

  // this regex checks for a string that begins 'on', followed by a capital letter - e.g. 'onAbout', 'onZing', 'onBlur'
  if (/^on[A-Z]/.test(eventName)) {
    const warn = buildWarn(diagnostics);
    const suggestedEventName = eventName[2].toLowerCase() + eventName.slice(3);
    warn.messageText = `Events decorated with @Event() should describe the actual DOM event name, not the handler. In other words "${eventName}" would be better named as "${suggestedEventName}".`;
    augmentDiagnosticWithNode(warn, node);
    return;
  }

  if (DOM_EVENT_NAMES.has(eventName.toLowerCase())) {
    const diagnostic = buildWarn(diagnostics);
    diagnostic.messageText = `The event name conflicts with the "${eventName}" native DOM event name.`;
    augmentDiagnosticWithNode(diagnostic, node);
    return;
  }
};

const DOM_EVENT_NAMES: Set<string> = new Set(
  [
    'CheckboxStateChange',
    'DOMContentLoaded',
    'DOMMenuItemActive',
    'DOMMenuItemInactive',
    'DOMMouseScroll',
    'MSManipulationStateChanged',
    'MSPointerHover',
    'MozAudioAvailable',
    'MozGamepadButtonDown',
    'MozGamepadButtonUp',
    'MozMousePixelScroll',
    'MozOrientation',
    'MozScrolledAreaChanged',
    'RadioStateChange',
    'SVGAbort',
    'SVGError',
    'SVGLoad',
    'SVGResize',
    'SVGScroll',
    'SVGUnload',
    'SVGZoom',
    'abort',
    'afterprint',
    'afterscriptexecute',
    'alerting',
    'animationcancel',
    'animationend',
    'animationiteration',
    'animationstart',
    'appinstalled',
    'audioend',
    'audioprocess',
    'audiostart',
    'auxclick',
    'beforeinstallprompt',
    'beforeprint',
    'beforescriptexecute',
    'beforeunload',
    'beginEvent',
    'blur',
    'boundary',
    'broadcast',
    'busy',
    'callschanged',
    'canplay',
    'canplaythrough',
    'cardstatechange',
    'cfstatechange',
    'change',
    'chargingchange',
    'chargingtimechange',
    'checking',
    'click',
    'command',
    'commandupdate',
    'compassneedscalibration',
    'complete',
    'compositionend',
    'compositionstart',
    'compositionupdate',
    'connected',
    'connecting',
    'connectionInfoUpdate',
    'contextmenu',
    'copy',
    'cut',
    'datachange',
    'dataerror',
    'dblclick',
    'delivered',
    'devicechange',
    'devicemotion',
    'deviceorientation',
    'dialing',
    'disabled',
    'dischargingtimechange',
    'disconnected',
    'disconnecting',
    'downloading',
    'drag',
    'dragend',
    'dragenter',
    'dragleave',
    'dragover',
    'dragstart',
    'drop',
    'durationchange',
    'emptied',
    'enabled',
    'end',
    'endEvent',
    'ended',
    'error',
    'focus',
    'focusin',
    'focusout',
    'fullscreenchange',
    'fullscreenerror',
    'gamepadconnected',
    'gamepaddisconnected',
    'gotpointercapture',
    'hashchange',
    'held',
    'holding',
    'icccardlockerror',
    'iccinfochange',
    'incoming',
    'input',
    'invalid',
    'keydown',
    'keypress',
    'keyup',
    'languagechange',
    'levelchange',
    'load',
    'loadeddata',
    'loadedmetadata',
    'loadend',
    'loadstart',
    'localized',
    'lostpointercapture',
    'mark',
    'message',
    'messageerror',
    'mousedown',
    'mouseenter',
    'mouseleave',
    'mousemove',
    'mouseout',
    'mouseover',
    'mouseup',
    'mousewheel',
    'mozbrowseractivitydone',
    'mozbrowserasyncscroll',
    'mozbrowseraudioplaybackchange',
    'mozbrowsercaretstatechanged',
    'mozbrowserclose',
    'mozbrowsercontextmenu',
    'mozbrowserdocumentfirstpaint',
    'mozbrowsererror',
    'mozbrowserfindchange',
    'mozbrowserfirstpaint',
    'mozbrowsericonchange',
    'mozbrowserloadend',
    'mozbrowserloadstart',
    'mozbrowserlocationchange',
    'mozbrowsermanifestchange',
    'mozbrowsermetachange',
    'mozbrowseropensearch',
    'mozbrowseropentab',
    'mozbrowseropenwindow',
    'mozbrowserresize',
    'mozbrowserscroll',
    'mozbrowserscrollareachanged',
    'mozbrowserscrollviewchange',
    'mozbrowsersecuritychange',
    'mozbrowserselectionstatechanged',
    'mozbrowsershowmodalprompt',
    'mozbrowsertitlechange',
    'mozbrowserusernameandpasswordrequired',
    'mozbrowservisibilitychange',
    'moztimechange',
    'msContentZoom',
    'nomatch',
    'notificationclick',
    'noupdate',
    'obsolete',
    'offline',
    'online',
    'orientationchange',
    'overflow',
    'pagehide',
    'pageshow',
    'paste',
    'pause',
    'play',
    'playing',
    'pointercancel',
    'pointerdown',
    'pointerenter',
    'pointerleave',
    'pointerlockchange',
    'pointerlockerror',
    'pointermove',
    'pointerout',
    'pointerover',
    'pointerup',
    'popstate',
    'popuphidden',
    'popuphiding',
    'popupshowing',
    'popupshown',
    'progress',
    'push',
    'pushsubscriptionchange',
    'ratechange',
    'readystatechange',
    'received',
    'repeatEvent',
    'reset',
    'resize',
    'resourcetimingbufferfull',
    'result',
    'resume',
    'resuming',
    'scroll',
    'seeked',
    'seeking',
    'select',
    'selectionchange',
    'selectstart',
    'sent',
    'show',
    'slotchange',
    'smartcard-insert',
    'smartcard-remove',
    'soundend',
    'soundstart',
    'speechend',
    'speechstart',
    'stalled',
    'start',
    'statechange',
    'statuschange',
    'stkcommand',
    'stksessionend',
    'storage',
    'submit',
    'suspend',
    'timeout',
    'timeupdate',
    'touchcancel',
    'touchend',
    'touchenter',
    'touchleave',
    'touchmove',
    'touchstart',
    'transitioncancel',
    'transitionend',
    'transitionrun',
    'transitionstart',
    'underflow',
    'unload',
    'updateready',
    'userproximity',
    'ussdreceived',
    'visibilitychange',
    'voicechange',
    'voiceschanged',
    'volumechange',
    'vrdisplayactivate',
    'vrdisplayblur',
    'vrdisplayconnect',
    'vrdisplaydeactivate',
    'vrdisplaydisconnect',
    'vrdisplayfocus',
    'vrdisplaypresentchange',
    'waiting',
    'wheel',
  ].map((e) => e.toLowerCase()),
);
