import { augmentDiagnosticWithNode, buildError, flatOne } from '@utils';
import ts from 'typescript';

import type * as d from '../../../declarations';
import { convertValueToLiteral, createStaticGetter, retrieveTsDecorators } from '../transform-utils';
import { getDecoratorParameters, isDecoratorNamed } from './decorator-utils';

export const listenDecoratorsToStatic = (
  diagnostics: d.Diagnostic[],
  typeChecker: ts.TypeChecker,
  decoratedMembers: ts.ClassElement[],
  newMembers: ts.ClassElement[],
  decoratorName: string,
) => {
  const listeners = decoratedMembers
    .filter(ts.isMethodDeclaration)
    .map((method) => parseListenDecorators(diagnostics, typeChecker, method, decoratorName));

  const flatListeners = flatOne(listeners);
  if (flatListeners.length > 0) {
    newMembers.push(createStaticGetter('listeners', convertValueToLiteral(flatListeners)));
  }
};

const parseListenDecorators = (
  diagnostics: d.Diagnostic[],
  typeChecker: ts.TypeChecker,
  method: ts.MethodDeclaration,
  decoratorName: string,
): d.ComponentCompilerListener[] => {
  const listenDecorators = (retrieveTsDecorators(method) ?? []).filter(isDecoratorNamed(decoratorName));
  if (listenDecorators.length === 0) {
    return [];
  }

  return listenDecorators.map((listenDecorator) => {
    const methodName = method.name.getText();
    const [listenText, listenOptions] = getDecoratorParameters<string, d.ListenOptions>(listenDecorator, typeChecker);

    const eventNames = listenText.split(',');
    if (eventNames.length > 1) {
      const err = buildError(diagnostics);
      err.messageText = 'Please use multiple @Listen() decorators instead of comma-separated names.';
      augmentDiagnosticWithNode(err, listenDecorator);
    }

    const listener = parseListener(eventNames[0], listenOptions, methodName);
    if (listener.target === ('parent' as any)) {
      const err = buildError(diagnostics);
      err.messageText =
        'The "parent" target is no longer available as of Stencil 2. Please use "window", "document" or "body" instead.';
      augmentDiagnosticWithNode(err, listenDecorator);
    }
    return listener;
  });
};

export const parseListener = (eventName: string, opts: d.ListenOptions = {}, methodName: string) => {
  const rawEventName = eventName.trim();
  const listener: d.ComponentCompilerListener = {
    name: rawEventName,
    method: methodName,
    target: opts.target,
    capture: typeof opts.capture === 'boolean' ? opts.capture : false,
    passive:
      typeof opts.passive === 'boolean'
        ? opts.passive
        : // if the event name is known to be a passive event then set it to true
          PASSIVE_TRUE_DEFAULTS.has(rawEventName.toLowerCase()),
  };
  return listener;
};

const PASSIVE_TRUE_DEFAULTS = new Set([
  'dragstart',
  'drag',
  'dragend',
  'dragenter',
  'dragover',
  'dragleave',
  'drop',
  'mouseenter',
  'mouseover',
  'mousemove',
  'mousedown',
  'mouseup',
  'mouseleave',
  'mouseout',
  'mousewheel',
  'pointerover',
  'pointerenter',
  'pointerdown',
  'pointermove',
  'pointerup',
  'pointercancel',
  'pointerout',
  'pointerleave',
  'resize',
  'scroll',
  'touchstart',
  'touchmove',
  'touchend',
  'touchenter',
  'touchleave',
  'touchcancel',
  'wheel',
]);
