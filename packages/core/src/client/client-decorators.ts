/**
 * Runtime stubs for Stencil decorators.
 *
 * These decorators are compile-time metadata flags that Stencil's compiler parses
 * and transforms. At runtime, they do nothing - the actual component behavior is
 * wired up by the compiled output, not by these decorators.
 *
 * These stubs exist so that:
 * 1. Component classes can be instantiated directly in tests without going through
 *    Stencil's full compilation pipeline
 * 2. The decorators don't throw "X is not a function" errors when used outside
 *    of Stencil's build process
 */

/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * No-op class decorator stub for @Component()
 * @param _opts - component options (ignored at runtime)
 * @returns a class decorator that returns the target unchanged
 */
export const Component =
  (_opts?: any): ClassDecorator =>
  (target) =>
    target;

/**
 * No-op property decorator stub for @Element()
 * @returns a property decorator that does nothing
 */
export const Element = (): PropertyDecorator => () => {};

/**
 * No-op property decorator stub for @Event()
 * @param _opts - event options (ignored at runtime)
 * @returns a property decorator that does nothing
 */
export const Event =
  (_opts?: any): PropertyDecorator =>
  () => {};

/**
 * No-op property decorator stub for @AttachInternals()
 * @param _opts - attach internals options (ignored at runtime)
 * @returns a property decorator that does nothing
 */
export const AttachInternals =
  (_opts?: any): PropertyDecorator =>
  () => {};

/**
 * No-op method decorator stub for @Listen()
 * @param _eventName - event name to listen for (ignored at runtime)
 * @param _opts - listen options (ignored at runtime)
 * @returns a method decorator that does nothing
 */
export const Listen =
  (_eventName: string, _opts?: any): MethodDecorator =>
  () => {};

/**
 * No-op method decorator stub for @Method()
 * @param _opts - method options (ignored at runtime)
 * @returns a method decorator that does nothing
 */
export const Method =
  (_opts?: any): MethodDecorator =>
  () => {};

/**
 * No-op property decorator stub for @Prop()
 * @param _opts - prop options (ignored at runtime)
 * @returns a property decorator that does nothing
 */
export const Prop =
  (_opts?: any): PropertyDecorator =>
  () => {};

/**
 * No-op property decorator stub for @State()
 * @returns a property decorator that does nothing
 */
export const State = (): PropertyDecorator => () => {};

/**
 * No-op method decorator stub for @Watch()
 * @param _propName - property name to watch (ignored at runtime)
 * @param _opts - watch options (ignored at runtime)
 * @returns a method decorator that does nothing
 */
export const Watch =
  (_propName: any, _opts?: any): MethodDecorator =>
  () => {};

/**
 * No-op method decorator stub for @PropSerialize()
 * @param _propName - property name to serialize (ignored at runtime)
 * @returns a method decorator that does nothing
 */
export const PropSerialize =
  (_propName: any): MethodDecorator =>
  () => {};

/**
 * No-op method decorator stub for @AttrDeserialize()
 * @param _propName - property name to deserialize (ignored at runtime)
 * @returns a method decorator that does nothing
 */
export const AttrDeserialize =
  (_propName: any): MethodDecorator =>
  () => {};

/**
 * No-op compile-time utility stub for resolveVar()
 * At runtime, this just returns the string representation of whatever is passed in.
 * @param variable - the variable to resolve
 * @returns the string representation of the variable
 */
export const resolveVar = <T>(variable: T): string => String(variable);
