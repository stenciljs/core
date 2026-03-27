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
 */
export const Component =
  (_opts?: any): ClassDecorator =>
  (target) =>
    target;

/**
 * No-op property decorator stub for @Element()
 */
export const Element = (): PropertyDecorator => () => {};

/**
 * No-op property decorator stub for @Event()
 */
export const Event =
  (_opts?: any): PropertyDecorator =>
  () => {};

/**
 * No-op property decorator stub for @AttachInternals()
 */
export const AttachInternals =
  (_opts?: any): PropertyDecorator =>
  () => {};

/**
 * No-op method decorator stub for @Listen()
 */
export const Listen =
  (_eventName: string, _opts?: any): MethodDecorator =>
  () => {};

/**
 * No-op method decorator stub for @Method()
 */
export const Method =
  (_opts?: any): MethodDecorator =>
  () => {};

/**
 * No-op property decorator stub for @Prop()
 */
export const Prop =
  (_opts?: any): PropertyDecorator =>
  () => {};

/**
 * No-op property decorator stub for @State()
 */
export const State = (): PropertyDecorator => () => {};

/**
 * No-op method decorator stub for @Watch()
 */
export const Watch =
  (_propName: any, _opts?: any): MethodDecorator =>
  () => {};

/**
 * No-op method decorator stub for @PropSerialize()
 */
export const PropSerialize =
  (_propName: any): MethodDecorator =>
  () => {};

/**
 * No-op method decorator stub for @AttrDeserialize()
 */
export const AttrDeserialize =
  (_propName: any): MethodDecorator =>
  () => {};

/**
 * No-op compile-time utility stub for resolveVar()
 * At runtime, this just returns the string representation of whatever is passed in.
 */
export const resolveVar = <T>(variable: T): string => String(variable);
