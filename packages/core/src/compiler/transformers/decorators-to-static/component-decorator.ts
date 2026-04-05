import ts from 'typescript';
import type * as d from '@stencil/core';

import { augmentDiagnosticWithNode, buildError, validateComponentTag } from '../../../utils';
import {
  convertValueToLiteral,
  createStaticGetter,
  retrieveTsDecorators,
} from '../transform-utils';
import { getDecoratorParameters } from './decorator-utils';
import { styleToStatic } from './style-to-static';

// Track if we've already shown the deprecated API error this build
let hasShownDeprecatedApiError = false;

/**
 * Reset the deprecated API error flag. Call this at the start of each build.
 */
export const resetDeprecatedApiWarning = () => {
  hasShownDeprecatedApiError = false;
};

/**
 * Internal interface that includes both new and deprecated properties
 * for detection and migration purposes.
 */
interface ComponentOptionsWithDeprecated extends d.ComponentOptions {
  /** @deprecated Use `encapsulation: { type: 'shadow' }` instead */
  shadow?: boolean | { delegatesFocus?: boolean; slotAssignment?: 'manual' | 'named' };
  /** @deprecated Use `encapsulation: { type: 'scoped' }` instead */
  scoped?: boolean;
  /** @deprecated Use `@AttachInternals()` decorator instead */
  formAssociated?: boolean;
}

/**
 * Perform code generation to create new class members for a Stencil component
 * which will drive the runtime functionality specified by various options
 * passed to the `@Component` decorator.
 *
 * Inputs are validated (@see {@link validateComponent}) before code generation
 * is performed.
 *
 * **Note**: in this function and in functions that it calls the `newMembers`
 * parameter is treated as an out parameter and mutated, with new class members
 * added to it.
 *
 * @param config a user-supplied config
 * @param typeChecker a TypeScript type checker instance
 * @param diagnostics an array of diagnostics for surfacing errors and warnings
 * @param cmpNode a TypeScript class declaration node corresponding to a
 * Stencil component
 * @param newMembers an out param to hold newly generated class members
 * @param componentDecorator the TypeScript decorator node for the `@Component`
 * decorator
 */
export const componentDecoratorToStatic = (
  config: d.ValidatedConfig,
  typeChecker: ts.TypeChecker,
  diagnostics: d.Diagnostic[],
  cmpNode: ts.ClassDeclaration,
  newMembers: ts.ClassElement[],
  componentDecorator: ts.Decorator,
) => {
  const [componentOptions] = getDecoratorParameters<ComponentOptionsWithDeprecated>(
    componentDecorator,
    typeChecker,
    diagnostics,
  );
  if (!componentOptions) {
    return;
  }

  // Check for deprecated API usage before validation
  if (!checkForDeprecatedApi(diagnostics, componentOptions, componentDecorator)) {
    return;
  }

  if (
    !validateComponent(
      config,
      diagnostics,
      typeChecker,
      componentOptions,
      cmpNode,
      componentDecorator,
    )
  ) {
    return;
  }

  newMembers.push(createStaticGetter('is', convertValueToLiteral(componentOptions.tag.trim())));

  // Process the new encapsulation property
  if (componentOptions.encapsulation) {
    const enc = componentOptions.encapsulation;

    if (enc.type === 'shadow') {
      newMembers.push(createStaticGetter('encapsulation', convertValueToLiteral('shadow')));

      if (enc.mode === 'closed') {
        newMembers.push(createStaticGetter('shadowMode', convertValueToLiteral('closed')));
      }

      if (enc.delegatesFocus === true) {
        newMembers.push(createStaticGetter('delegatesFocus', convertValueToLiteral(true)));
      }

      if (enc.slotAssignment === 'manual') {
        newMembers.push(createStaticGetter('slotAssignment', convertValueToLiteral('manual')));
      }
    } else if (enc.type === 'scoped') {
      newMembers.push(createStaticGetter('encapsulation', convertValueToLiteral('scoped')));

      if (enc.patches && enc.patches.length > 0) {
        newMembers.push(createStaticGetter('patches', convertValueToLiteral(enc.patches)));
      }
    } else if (enc.type === 'none') {
      // 'none' is the default, no need to set encapsulation getter
      // but we still need to handle patches
      if (enc.patches && enc.patches.length > 0) {
        newMembers.push(createStaticGetter('patches', convertValueToLiteral(enc.patches)));
      }
    }
  }

  styleToStatic(newMembers, componentOptions);

  const assetsDirs = componentOptions.assetsDirs || [];

  if (assetsDirs.length > 0) {
    newMembers.push(createStaticGetter('assetsDirs', convertValueToLiteral(assetsDirs)));
  }
};

/**
 * Check for usage of deprecated API properties and emit helpful error messages.
 * Returns false if deprecated API is detected (halts compilation).
 * Only shows detailed error once per build to avoid flooding the console.
 *
 * @param diagnostics an array of diagnostics for surfacing errors
 * @param componentOptions the options passed to the `@Component` decorator
 * @param componentDecorator the TypeScript decorator node
 * @returns whether the component uses only the new API (true = valid)
 */
const checkForDeprecatedApi = (
  diagnostics: d.Diagnostic[],
  componentOptions: ComponentOptionsWithDeprecated,
  componentDecorator: ts.Decorator,
): boolean => {
  const deprecatedProps: string[] = [];

  if (componentOptions.shadow !== undefined) {
    deprecatedProps.push('shadow');
  }

  if (componentOptions.scoped !== undefined) {
    deprecatedProps.push('scoped');
  }

  if (componentOptions.formAssociated !== undefined) {
    deprecatedProps.push('formAssociated');
  }

  if (deprecatedProps.length > 0) {
    // Only show the full error message once per build
    if (!hasShownDeprecatedApiError) {
      hasShownDeprecatedApiError = true;
      const err = buildError(diagnostics);
      err.messageText = `@Component() uses deprecated API removed in Stencil v5.

The "shadow", "scoped", and "formAssociated" properties have been replaced:
  • shadow: true → encapsulation: { type: "shadow" }
  • scoped: true → encapsulation: { type: "scoped" }
  • formAssociated: true → Use @AttachInternals() decorator

Run 'stencil migrate --dry-run' to see all affected files.
Run 'stencil migrate' to automatically update your components.`;
      augmentDiagnosticWithNode(err, findTagNode(deprecatedProps[0], componentDecorator));
    }
    return false;
  }

  return true;
};

/**
 * Perform validation on a Stencil component in preparation for some
 * component-level code generation, checking that the class declaration node
 * itself doesn't have any problems and that the options passed to the
 * `@Component` decorator are valid.
 *
 * @param config a user-supplied config
 * @param diagnostics an array of diagnostics for surfacing errors and warnings
 * @param typeChecker a TypeScript type checker instance
 * @param componentOptions the options passed to the `@Component` director
 * @param cmpNode a TypeScript class declaration node corresponding to a
 * Stencil component
 * @param componentDecorator the TypeScript decorator node for the `@Component`
 * decorator
 * @returns whether or not the component is valid
 */
const validateComponent = (
  config: d.ValidatedConfig,
  diagnostics: d.Diagnostic[],
  typeChecker: ts.TypeChecker,
  componentOptions: d.ComponentOptions,
  cmpNode: ts.ClassDeclaration,
  componentDecorator: ts.Decorator,
) => {
  // Validate encapsulation options
  if (componentOptions.encapsulation) {
    const enc = componentOptions.encapsulation;

    if (enc.type === 'shadow') {
      // Validate slotAssignment
      if (enc.slotAssignment && enc.slotAssignment !== 'manual' && enc.slotAssignment !== 'named') {
        const err = buildError(diagnostics);
        err.messageText = `The "slotAssignment" option must be either "manual" or "named".`;
        augmentDiagnosticWithNode(err, findTagNode('slotAssignment', componentDecorator));
        return false;
      }

      // Validate mode
      if (enc.mode && enc.mode !== 'open' && enc.mode !== 'closed') {
        const err = buildError(diagnostics);
        err.messageText = `The "mode" option must be either "open" or "closed".`;
        augmentDiagnosticWithNode(err, findTagNode('mode', componentDecorator));
        return false;
      }
    }

    // Validate patches for non-shadow encapsulation
    if ((enc.type === 'none' || enc.type === 'scoped') && enc.patches) {
      const validPatches = ['all', 'children', 'clone', 'insert'];
      for (const patch of enc.patches) {
        if (!validPatches.includes(patch)) {
          const err = buildError(diagnostics);
          err.messageText = `Invalid patch "${patch}". Valid patches are: ${validPatches.join(', ')}.`;
          augmentDiagnosticWithNode(err, findTagNode('patches', componentDecorator));
          return false;
        }
      }
    }
  }

  const constructor = cmpNode.members.find(ts.isConstructorDeclaration);
  if (constructor && constructor.parameters.length > 0) {
    const err = buildError(diagnostics);
    err.messageText = `Classes decorated with @Component can not have a "constructor" that takes arguments.
    All data required by a component must be passed by using class properties decorated with @Prop()`;
    augmentDiagnosticWithNode(err, constructor.parameters[0]);
    return false;
  }

  // check if class has more than one decorator
  const otherDecorator = retrieveTsDecorators(cmpNode)?.find((d) => d !== componentDecorator);
  if (otherDecorator) {
    const err = buildError(diagnostics);
    err.messageText = `Classes decorated with @Component can not be decorated with more decorators.
    Stencil performs extensive static analysis on top of your components in order to generate the necessary metadata, runtime decorators at the components level make this task very hard.`;
    augmentDiagnosticWithNode(err, otherDecorator);
    return false;
  }

  const tag = componentOptions.tag;
  if (typeof tag !== 'string' || tag.trim().length === 0) {
    const err = buildError(diagnostics);
    err.messageText = `tag missing in component decorator`;
    augmentDiagnosticWithNode(err, componentDecorator);
    return false;
  }

  const tagError = validateComponentTag(tag);
  if (tagError) {
    const err = buildError(diagnostics);
    err.messageText = `${tagError}. Please refer to https://html.spec.whatwg.org/multipage/custom-elements.html#valid-custom-element-name for more info.`;
    augmentDiagnosticWithNode(err, findTagNode('tag', componentDecorator));
    return false;
  }

  if (!config._isTesting) {
    const nonTypeExports = typeChecker
      .getExportsOfModule(typeChecker.getSymbolAtLocation(cmpNode.getSourceFile()))
      .filter(
        (symbol) =>
          (symbol.flags &
            (ts.SymbolFlags.Interface | ts.SymbolFlags.TypeAlias | ts.SymbolFlags.Enum)) ===
          0,
      )
      .filter((symbol) => symbol.name !== cmpNode.name.text);

    nonTypeExports.forEach((symbol) => {
      const err = buildError(diagnostics);
      err.messageText = `To allow efficient bundling, modules using @Component() can only have a single export which is the component class itself.
      Any other exports should be moved to a separate file.
      For further information check out: https://stenciljs.com/docs/module-bundling`;
      const errorNode = symbol.valueDeclaration ? symbol.valueDeclaration : symbol.declarations[0];

      augmentDiagnosticWithNode(err, errorNode);
    });
    if (nonTypeExports.length > 0) {
      return false;
    }
  }
  return true;
};

/**
 * Given a TypeScript Decorator node, try to find a property with a given name
 * on an object possibly passed to it as an argument. If found, return the node
 * to initialize the value, and if no such property is found return the
 * decorator instead.
 *
 * @param propName the name of the argument to search for
 * @param node the decorator node to search within
 * @returns the initializer for the property (if found) or the decorator
 */
const findTagNode = (propName: string, node: ts.Decorator): ts.Decorator | ts.Expression => {
  let out: ts.Decorator | ts.Expression = node;

  if (ts.isDecorator(node) && ts.isCallExpression(node.expression)) {
    const arg = node.expression.arguments[0];
    if (ts.isObjectLiteralExpression(arg)) {
      arg.properties.forEach((prop) => {
        if (ts.isPropertyAssignment(prop) && prop.name.getText() === propName) {
          out = prop.initializer;
        }
      });
    }
  }

  return out;
};
