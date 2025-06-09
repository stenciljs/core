import { EVENT_FLAGS } from '@utils';
import ts from 'typescript';

import type * as d from '../../declarations';
import { addCoreRuntimeApi, CREATE_EVENT, RUNTIME_APIS } from './core-runtime-apis';

/**
 * For a Stencil component, generate the code to create custom emitted events, based on `@Event()` decorators
 * @param moduleFile the 'home module' of the class for which code is being generated
 * @param cmp the component metadata associated with the provided module
 * @returns the generated event creation code
 */
export const addCreateEvents = (moduleFile: d.Module, cmp: d.ComponentCompilerMeta): ts.ExpressionStatement[] => {
  return cmp.events.map((ev) => {
    addCoreRuntimeApi(moduleFile, RUNTIME_APIS.createEvent);

    // for `@Event('eventName', { <eventOptions> }`, generate assignment to the class constructor of the form:
    // this.eventName = createEvent(this, 'eventName', eventOptionsAsBitwiseNumber);
    return ts.factory.createExpressionStatement(
      ts.factory.createAssignment(
        ts.factory.createPropertyAccessExpression(ts.factory.createThis(), ts.factory.createIdentifier(ev.method)),
        ts.factory.createCallExpression(ts.factory.createIdentifier(CREATE_EVENT), undefined, [
          ts.factory.createThis(),
          ts.factory.createStringLiteral(ev.name),
          ts.factory.createNumericLiteral(computeFlags(ev)),
        ]),
      ),
    );
  });
};

/**
 * Generate a bit flag encoded with event behavior information.
 *
 * This function uses the provided event metadata to determine which flags are set. {@link EVENT_FLAGS} acts as the
 * backing data structure that sets the actual bits on the returned value.
 *
 * @param eventMeta the metadata associated with the event
 * @returns the encoded event behaviors
 */
const computeFlags = (eventMeta: d.ComponentCompilerEvent): number => {
  let flags = 0;
  if (eventMeta.bubbles) {
    flags |= EVENT_FLAGS.Bubbles;
  }
  if (eventMeta.composed) {
    flags |= EVENT_FLAGS.Composed;
  }
  if (eventMeta.cancelable) {
    flags |= EVENT_FLAGS.Cancellable;
  }
  return flags;
};
