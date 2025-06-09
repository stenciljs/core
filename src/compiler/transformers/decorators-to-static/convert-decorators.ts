import { augmentDiagnosticWithNode, buildError } from '@utils';
import ts from 'typescript';

import type * as d from '../../../declarations';
import { retrieveTsDecorators, retrieveTsModifiers, updateConstructor } from '../transform-utils';
import { attachInternalsDecoratorsToStatic } from './attach-internals';
import { componentDecoratorToStatic } from './component-decorator';
import { isDecoratorNamed } from './decorator-utils';
import { CLASS_DECORATORS_TO_REMOVE, MEMBER_DECORATORS_TO_REMOVE } from './decorators-constants';
import { elementDecoratorsToStatic } from './element-decorator';
import { eventDecoratorsToStatic } from './event-decorator';
import { ImportAliasMap } from './import-alias-map';
import { listenDecoratorsToStatic } from './listen-decorator';
import { methodDecoratorsToStatic, validateMethods } from './method-decorator';
import { propDecoratorsToStatic } from './prop-decorator';
import { stateDecoratorsToStatic } from './state-decorator';
import { watchDecoratorsToStatic } from './watch-decorator';

/**
 * Create a {@link ts.TransformerFactory} which will handle converting any
 * decorators on Stencil component classes (i.e. classes decorated with
 * `@Component`) to static representations of the options, names, etc.
 * associated with the various decorators that Stencil supports like `@Prop`,
 * `@State`, etc.
 *
 * This `TransformerFactory` returned by this function will handle all classes
 * declared within a module.
 *
 * @param config a user-supplied configuration for Stencil
 * @param diagnostics for surfacing errors and warnings
 * @param typeChecker a TypeScript typechecker instance
 * @param program a {@link ts.Program} object
 * @returns a TypeScript transformer factory which can be passed to
 * TypeScript to transform source code during the compilation process
 */
export const convertDecoratorsToStatic = (
  config: d.ValidatedConfig,
  diagnostics: d.Diagnostic[],
  typeChecker: ts.TypeChecker,
  program: ts.Program,
): ts.TransformerFactory<ts.SourceFile> => {
  return (transformCtx) => {
    let sourceFile: ts.SourceFile;
    const visit = (node: ts.Node): ts.VisitResult<ts.Node> => {
      if (ts.isClassDeclaration(node)) {
        return visitClassDeclaration(config, diagnostics, typeChecker, program, node, sourceFile);
      }
      return ts.visitEachChild(node, visit, transformCtx);
    };

    return (tsSourceFile) => {
      sourceFile = tsSourceFile;
      return ts.visitEachChild(tsSourceFile, visit, transformCtx);
    };
  };
};

/**
 * Visit {@link ts.ClassDeclaration} nodes as part of the tree-traversal
 * required for {@link convertDecoratorsToStatic} to work.
 *
 * If a given class declaration node is not decorated with `@Component` this
 * function will simply return it as-is. If it _is_ decorated, then it will
 *
 * 1. Convert the arguments to the `@Component` decorator to static values.
 * 2. Strip off properties decorated with Stencil-implemented decorators like
 * `@State`, `@Prop`, etc which need to be removed and convert their metadata
 * to static values.
 * 3. Validate that the various options selected by the component author are
 * valid, both individually and in combination.
 * 4. Return an updated class declaration node which is ready to be used in
 * the rest of the Stencil compilation pipeline (e.g. in output target
 * generation).
 *
 * @param config a user-supplied Stencil config
 * @param diagnostics for surfacing errors and warnings
 * @param typeChecker a TypeScript typechecker instance
 * @param program a {@link ts.Program} object
 * @param classNode the node currently being visited
 * @param sourceFile the source file containing the class node
 * @returns a class node, possibly updated with new static values
 */
const visitClassDeclaration = (
  config: d.ValidatedConfig,
  diagnostics: d.Diagnostic[],
  typeChecker: ts.TypeChecker,
  program: ts.Program,
  classNode: ts.ClassDeclaration,
  sourceFile: ts.SourceFile,
): ts.ClassDeclaration => {
  const importAliasMap = new ImportAliasMap(sourceFile);

  const componentDecorator = retrieveTsDecorators(classNode)?.find(isDecoratorNamed(importAliasMap.get('Component')));
  if (!componentDecorator) {
    return classNode;
  }

  const classMembers = classNode.members;
  const decoratedMembers = classMembers.filter((member) => (retrieveTsDecorators(member)?.length ?? 0) > 0);

  // create an array of all class members which are _not_ methods decorated
  // with a Stencil decorator. We do this here because we'll implement the
  // behavior specified for those decorated methods later on.
  const filteredMethodsAndFields = removeStencilMethodDecorators(Array.from(classMembers), diagnostics, importAliasMap);

  // parse component decorator
  componentDecoratorToStatic(config, typeChecker, diagnostics, classNode, filteredMethodsAndFields, componentDecorator);

  // stores a reference to fields that should be watched for changes
  // parse member decorators (Prop, State, Listen, Event, Method, Element and Watch)
  if (decoratedMembers.length > 0) {
    propDecoratorsToStatic(
      diagnostics,
      decoratedMembers,
      typeChecker,
      program,
      filteredMethodsAndFields,
      importAliasMap.get('Prop'),
    );
    stateDecoratorsToStatic(decoratedMembers, filteredMethodsAndFields, typeChecker, importAliasMap.get('State'));
    eventDecoratorsToStatic(
      diagnostics,
      decoratedMembers,
      typeChecker,
      program,
      filteredMethodsAndFields,
      importAliasMap.get('Event'),
    );
    methodDecoratorsToStatic(
      config,
      diagnostics,
      classNode,
      decoratedMembers,
      typeChecker,
      program,
      filteredMethodsAndFields,
      importAliasMap.get('Method'),
    );
    elementDecoratorsToStatic(diagnostics, decoratedMembers, filteredMethodsAndFields, importAliasMap.get('Element'));
    watchDecoratorsToStatic(typeChecker, decoratedMembers, filteredMethodsAndFields, importAliasMap.get('Watch'));
    listenDecoratorsToStatic(
      diagnostics,
      typeChecker,
      decoratedMembers,
      filteredMethodsAndFields,
      importAliasMap.get('Listen'),
    );
    attachInternalsDecoratorsToStatic(
      diagnostics,
      decoratedMembers,
      filteredMethodsAndFields,
      typeChecker,
      importAliasMap.get('AttachInternals'),
    );
  }

  validateMethods(diagnostics, classMembers);

  const currentDecorators = retrieveTsDecorators(classNode);
  const updatedClassFields: ts.ClassElement[] = updateConstructor(classNode, filteredMethodsAndFields, []);

  return ts.factory.updateClassDeclaration(
    classNode,
    [
      ...(filterDecorators(
        currentDecorators,
        CLASS_DECORATORS_TO_REMOVE.map((decorator) => importAliasMap.get(decorator)),
      ) ?? []),
      ...(retrieveTsModifiers(classNode) ?? []),
    ],
    classNode.name,
    classNode.typeParameters,
    classNode.heritageClauses,
    updatedClassFields,
  );
};

/**
 * Take a list of `ClassElement` AST nodes and remove any decorators from
 * method elements which are Stencil-specific decorators. We implement the
 * intended behavior for these Stencil-specific decorators (things like
 * `@Watch`, `@State`, etc) through a combination of compile- and
 * run-time changes, scaffolding, etc.
 *
 * This utility modifies these class elements to remove any Stencil-specific
 * decorators.
 *
 * @param classMembers a list of ClassElement AST nodes
 * @param diagnostics a collection of compiler diagnostics, to which an error
 * may be added
 * @param importAliasMap a map of Stencil decorator names to their import names
 * @returns a new list of the same ClassElement nodes, with any nodes which have
 * Stencil-specific decorators modified to remove them
 */
const removeStencilMethodDecorators = (
  classMembers: ts.ClassElement[],
  diagnostics: d.Diagnostic[],
  importAliasMap: ImportAliasMap,
): ts.ClassElement[] => {
  return classMembers.map((member) => {
    const currentDecorators = retrieveTsDecorators(member);
    const newDecorators = filterDecorators(
      currentDecorators,
      MEMBER_DECORATORS_TO_REMOVE.map((decorator) => importAliasMap.get(decorator)),
    );

    if (currentDecorators !== newDecorators) {
      if (ts.isMethodDeclaration(member)) {
        return ts.factory.updateMethodDeclaration(
          member,
          [...(newDecorators ?? []), ...(retrieveTsModifiers(member) ?? [])],
          member.asteriskToken,
          member.name,
          member.questionToken,
          member.typeParameters,
          member.parameters,
          member.type,
          member.body,
        );
      } else if (ts.isGetAccessor(member)) {
        return ts.factory.updateGetAccessorDeclaration(
          member,
          [...(newDecorators ?? []), ...(retrieveTsModifiers(member) ?? [])],
          member.name,
          member.parameters,
          member.type,
          member.body,
        );
      } else if (ts.isSetAccessor(member)) {
        const err = buildError(diagnostics);
        err.messageText = 'A get accessor should be decorated before a set accessor';
        augmentDiagnosticWithNode(err, member);
      } else if (ts.isPropertyDeclaration(member)) {
        const modifiers = retrieveTsModifiers(member);
        return ts.factory.updatePropertyDeclaration(
          member,
          [...(newDecorators ?? []), ...(modifiers ?? [])],
          member.name,
          member.questionToken,
          member.type,
          member.initializer,
        );
      } else {
        const err = buildError(diagnostics);
        err.messageText = 'Unknown class member encountered!';
        augmentDiagnosticWithNode(err, member);
      }
    }
    return member;
  });
};

/**
 * Generate a list of decorators from a syntax tree node that are not in a provided exclude list
 *
 * @param decorators the syntax tree node's decorators should be inspected
 * @param excludeList the names of decorators that should _not_ be included in the returned list
 * @returns a list of decorators on the AST node that are not in the provided list, or `undefined` if:
 * - there are no decorators on the node
 * - the node contains only decorators in the provided list
 */
export const filterDecorators = (
  decorators: ReadonlyArray<ts.Decorator> | undefined,
  excludeList: ReadonlyArray<string>,
): ReadonlyArray<ts.Decorator> | undefined => {
  if (decorators) {
    const updatedDecoratorList = decorators.filter((dec) => {
      // narrow the type of the syntax tree node, while retrieving the text of the identifier
      const decoratorName =
        ts.isCallExpression(dec.expression) &&
        ts.isIdentifier(dec.expression.expression) &&
        dec.expression.expression.text;
      // if the type narrowing logic short-circuited (i.e. returned 'false'), always return those decorators
      // otherwise, check if it is included in the provided exclude list
      return typeof decoratorName === 'boolean' || !excludeList.includes(decoratorName);
    });
    if (updatedDecoratorList.length === 0) {
      // handle the case of a zero-length list first, so an empty array is not created
      return undefined;
    } else if (updatedDecoratorList.length !== decorators.length) {
      // the updated decorator list is non-zero, but has a different length than the original decorator list,
      // create a new array of nodes from it
      return ts.factory.createNodeArray(updatedDecoratorList);
    }
  }

  // return the node's original decorators, or undefined
  return decorators;
};
