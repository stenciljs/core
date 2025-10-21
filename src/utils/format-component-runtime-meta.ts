import type * as d from '../declarations';
import { CMP_FLAGS, LISTENER_FLAGS, MEMBER_FLAGS } from './constants';

export const formatLazyBundleRuntimeMeta = (
  bundleId: any,
  cmps: d.ComponentCompilerMeta[],
): d.LazyBundleRuntimeData => {
  return [bundleId, cmps.map((cmp) => formatComponentRuntimeMeta(cmp, true))];
};

/**
 * Transform metadata about a component from the compiler to a compact form for
 * use at runtime.
 *
 * @param compilerMeta component metadata gathered during compilation
 * @param includeMethods include methods in the component's members or not
 * @returns a compact format for component metadata, intended for runtime use
 */
export const formatComponentRuntimeMeta = (
  compilerMeta: d.ComponentCompilerMeta,
  includeMethods: boolean,
): d.ComponentRuntimeMetaCompact => {
  let flags = 0;
  if (compilerMeta.encapsulation === 'shadow') {
    flags |= CMP_FLAGS.shadowDomEncapsulation;
    if (compilerMeta.shadowDelegatesFocus) {
      flags |= CMP_FLAGS.shadowDelegatesFocus;
    }
  } else if (compilerMeta.encapsulation === 'scoped') {
    flags |= CMP_FLAGS.scopedCssEncapsulation;
  }
  if (compilerMeta.formAssociated) {
    flags |= CMP_FLAGS.formAssociated;
  }
  if (compilerMeta.encapsulation !== 'shadow' && compilerMeta.htmlTagNames.includes('slot')) {
    flags |= CMP_FLAGS.hasSlotRelocation;
  }
  if (compilerMeta.hasRenderFn) {
    flags |= CMP_FLAGS.hasRenderFn;
  }
  if (compilerMeta.hasMode) {
    flags |= CMP_FLAGS.hasMode;
  }
  if (compilerMeta.hasModernPropertyDecls) {
    flags |= CMP_FLAGS.hasModernPropertyDecls;
  }

  const members = formatComponentRuntimeMembers(compilerMeta, includeMethods);
  const hostListeners = formatHostListeners(compilerMeta);
  const watchers = formatComponentRuntimeReactiveHandlers(compilerMeta, 'watchers');
  const serializers = formatComponentRuntimeReactiveHandlers(compilerMeta, 'serializers');
  const deserializers = formatComponentRuntimeReactiveHandlers(compilerMeta, 'deserializers');

  return trimFalsy([
    flags,
    compilerMeta.tagName,
    Object.keys(members).length > 0 ? members : undefined,
    hostListeners.length > 0 ? hostListeners : undefined,
    Object.keys(watchers).length > 0 ? watchers : undefined,
    Object.keys(serializers).length > 0 ? serializers : undefined,
    Object.keys(deserializers).length > 0 ? deserializers : undefined,
  ]);
};

export const stringifyRuntimeData = (data: any) => {
  const json = JSON.stringify(data);
  if (json.length > 10000) {
    // JSON metadata is big, JSON.parse() is faster
    // https://twitter.com/mathias/status/1143551692732030979
    return `JSON.parse(${JSON.stringify(json)})`;
  }
  return json;
};

/**
 * Transforms Stencil compiler metadata into a {@link d.ComponentCompilerMeta} object.
 * This handles processing any compiler metadata transformed from components' uses of `@Watch()`, `@PropSerialize()`, and `@AttrDeserialize()`.
 * The map of watched properties to their callback(s) will be immediately available
 * to the runtime at bootstrap.
 *
 * @param compilerMeta Component metadata gathered during compilation
 * @param decorator The decorator type to be processed: 'watchers', 'serializers', or 'deserializers'
 * @returns An object mapping watched properties to their respective callback(s)
 */
const formatComponentRuntimeReactiveHandlers = (
  compilerMeta: d.ComponentCompilerMeta,
  decorator: 'watchers' | 'serializers' | 'deserializers',
) => {
  const handlers: d.ComponentConstructorChangeHandlers = {};

  compilerMeta[decorator]?.forEach(({ propName, methodName }) => {
    handlers[propName] = [...(handlers[propName] ?? []), methodName];
  });

  return handlers;
};

const formatComponentRuntimeMembers = (
  compilerMeta: d.ComponentCompilerMeta,
  includeMethods = true,
): d.ComponentRuntimeMembers => {
  return {
    ...formatPropertiesRuntimeMember(compilerMeta.properties),
    ...formatStatesRuntimeMember(compilerMeta.states),
    ...(includeMethods ? formatMethodsRuntimeMember(compilerMeta.methods) : {}),
  };
};

const formatPropertiesRuntimeMember = (properties: d.ComponentCompilerProperty[]) => {
  const runtimeMembers: d.ComponentRuntimeMembers = {};

  properties.forEach((member) => {
    runtimeMembers[member.name] = trimFalsy([
      /**
       * [0] member type
       */
      formatFlags(member),
      formatAttrName(member),
    ]);
  });
  return runtimeMembers;
};

const formatFlags = (compilerProperty: d.ComponentCompilerProperty) => {
  let type = formatPropType(compilerProperty.type);
  if (compilerProperty.mutable) {
    type |= MEMBER_FLAGS.Mutable;
  }
  if (compilerProperty.reflect) {
    type |= MEMBER_FLAGS.ReflectAttr;
  }
  if (compilerProperty.getter) {
    type |= MEMBER_FLAGS.Getter;
  }
  if (compilerProperty.setter) {
    type |= MEMBER_FLAGS.Setter;
  }
  return type;
};

/**
 * We mainly add the alternative kebab-case attribute name because it might
 * be used in an HTML environment (non JSX). Since we support hydration of
 * complex types we provide a kebab-case attribute name for properties with
 * these types.
 */
const kebabCaseSupportForTypes = ['string', 'unknown'];

const formatAttrName = (compilerProperty: d.ComponentCompilerProperty) => {
  if (kebabCaseSupportForTypes.includes(typeof compilerProperty.attribute)) {
    // string attr name means we should observe this attribute
    if (compilerProperty.name === compilerProperty.attribute) {
      // property name and attribute name are the exact same
      // true value means to use the property name for the attribute name
      return undefined;
    }

    // property name and attribute name are not the same
    // so we need to return the actual string value
    // example: "multiWord" !== "multi-word"
    return compilerProperty.attribute;
  }

  // we shouldn't even observe an attribute for this property
  return undefined;
};

const formatPropType = (type: d.ComponentCompilerPropertyType) => {
  if (type === 'string') {
    return MEMBER_FLAGS.String;
  }
  if (type === 'number') {
    return MEMBER_FLAGS.Number;
  }
  if (type === 'boolean') {
    return MEMBER_FLAGS.Boolean;
  }
  if (type === 'any') {
    return MEMBER_FLAGS.Any;
  }
  return MEMBER_FLAGS.Unknown;
};

const formatStatesRuntimeMember = (states: d.ComponentCompilerState[]) => {
  const runtimeMembers: d.ComponentRuntimeMembers = {};

  states.forEach((member) => {
    runtimeMembers[member.name] = [
      /**
       * [0] member flags
       */
      MEMBER_FLAGS.State,
    ];
  });
  return runtimeMembers;
};

const formatMethodsRuntimeMember = (methods: d.ComponentCompilerMethod[]) => {
  const runtimeMembers: d.ComponentRuntimeMembers = {};

  methods.forEach((member) => {
    runtimeMembers[member.name] = [
      /**
       * [0] member flags
       */
      MEMBER_FLAGS.Method,
    ];
  });
  return runtimeMembers;
};

const formatHostListeners = (compilerMeta: d.ComponentCompilerMeta) => {
  return compilerMeta.listeners.map((compilerListener) => {
    const hostListener: d.ComponentRuntimeHostListener = [
      computeListenerFlags(compilerListener),
      compilerListener.name,
      compilerListener.method,
    ];
    return hostListener;
  });
};

const computeListenerFlags = (listener: d.ComponentCompilerListener) => {
  let flags = 0;
  if (listener.capture) {
    flags |= LISTENER_FLAGS.Capture;
  }
  if (listener.passive) {
    flags |= LISTENER_FLAGS.Passive;
  }
  switch (listener.target) {
    case 'document':
      flags |= LISTENER_FLAGS.TargetDocument;
      break;
    case 'window':
      flags |= LISTENER_FLAGS.TargetWindow;
      break;
    case 'body':
      flags |= LISTENER_FLAGS.TargetBody;
      break;
    case 'parent' as any:
      flags |= LISTENER_FLAGS.TargetParent;
      break;
  }
  return flags;
};

const trimFalsy = (data: any): any => {
  const arr = data as any[];
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i]) {
      break;
    }
    // if falsy, safe to pop()
    arr.pop();
  }

  return arr;
};
