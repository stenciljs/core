import { join, normalizePath, relative, unique } from '@utils';
import { dirname, isAbsolute } from 'path';
import ts from 'typescript';

import type * as d from '../../../declarations';
import { addComponentMetaStatic } from '../add-component-meta-static';
import { setComponentBuildConditionals } from '../component-build-conditionals';
import { detectModernPropDeclarations } from '../detect-modern-prop-decls';
import { getComponentTagName, getStaticValue, isInternal, isStaticGetter, serializeSymbol } from '../transform-utils';
import { parseAttachInternals } from './attach-internals';
import { parseCallExpression } from './call-expression';
import { parseClassMethods } from './class-methods';
import { parseStaticElementRef } from './element-ref';
import { parseStaticEncapsulation, parseStaticShadowDelegatesFocus } from './encapsulation';
import { parseStaticEvents } from './events';
import { parseFormAssociated } from './form-associated';
import { parseStaticListeners } from './listeners';
import { parseStaticMethods } from './methods';
import { parseStaticProps } from './props';
import { parseStaticStates } from './states';
import { parseStringLiteral } from './string-literal';
import { parseStaticStyles } from './styles';
import { parseStaticWatchers } from './watchers';

const BLACKLISTED_COMPONENT_METHODS = [
  /**
   * If someone would define a getter called "shadowRoot" on a component
   * this would cause issues when Stencil tries to hydrate the component.
   */
  'shadowRoot',
];

/**
 * Given a {@see ts.ClassDeclaration} which represents a Stencil component
 * class declaration, parse and format various pieces of data about static class
 * members which we use in the compilation process.
 *
 * This performs some checks that this class is indeed a Stencil component
 * and, if it is, will perform a side-effect, adding an object containing
 * metadata about the component to the module map and the node map.
 *
 * Additionally, it will optionally transform the supplied class declaration
 * node to add a static getter for the component metadata if the transformation
 * options specify to do so.
 *
 * @param compilerCtx the current compiler context
 * @param typeChecker a TypeScript type checker instance
 * @param cmpNode the TypeScript class declaration for the component
 * @param moduleFile Stencil's IR for a module, used here as an out param
 * @param transformOpts options which control various aspects of the
 * transformation
 * @returns the TypeScript class declaration IR instance with which the
 * function was called
 */
export const parseStaticComponentMeta = (
  compilerCtx: d.CompilerCtx,
  typeChecker: ts.TypeChecker,
  cmpNode: ts.ClassDeclaration,
  moduleFile: d.Module,
  transformOpts?: d.TransformOptions,
): ts.ClassDeclaration => {
  if (cmpNode.members == null) {
    return cmpNode;
  }
  const staticMembers = cmpNode.members.filter(isStaticGetter);
  const tagName = getComponentTagName(staticMembers);
  if (tagName == null) {
    return cmpNode;
  }

  const symbol = typeChecker ? typeChecker.getSymbolAtLocation(cmpNode.name) : undefined;
  const docs = serializeSymbol(typeChecker, symbol);
  const isCollectionDependency = moduleFile.isCollectionDependency;
  const encapsulation = parseStaticEncapsulation(staticMembers);
  const cmp: d.ComponentCompilerMeta = {
    attachInternalsMemberName: parseAttachInternals(staticMembers),
    formAssociated: parseFormAssociated(staticMembers),
    tagName: tagName,
    excludeFromCollection: moduleFile.excludeFromCollection,
    isCollectionDependency,
    componentClassName: cmpNode.name ? cmpNode.name.text : '',
    elementRef: parseStaticElementRef(staticMembers),
    encapsulation,
    shadowDelegatesFocus: !!parseStaticShadowDelegatesFocus(encapsulation, staticMembers),
    properties: parseStaticProps(staticMembers),
    virtualProperties: parseVirtualProps(docs),
    states: parseStaticStates(staticMembers),
    methods: parseStaticMethods(staticMembers),
    listeners: parseStaticListeners(staticMembers),
    events: parseStaticEvents(staticMembers),
    watchers: parseStaticWatchers(staticMembers),
    styles: parseStaticStyles(compilerCtx, tagName, moduleFile.sourceFilePath, isCollectionDependency, staticMembers),
    internal: isInternal(docs),
    assetsDirs: parseAssetsDirs(staticMembers, moduleFile.jsFilePath),
    styleDocs: [],
    docs,
    jsFilePath: moduleFile.jsFilePath,
    sourceFilePath: moduleFile.sourceFilePath,
    sourceMapPath: moduleFile.sourceMapPath,

    hasAttributeChangedCallbackFn: false,
    hasComponentWillLoadFn: false,
    hasComponentDidLoadFn: false,
    hasComponentShouldUpdateFn: false,
    hasComponentWillUpdateFn: false,
    hasComponentDidUpdateFn: false,
    hasComponentWillRenderFn: false,
    hasComponentDidRenderFn: false,
    hasConnectedCallbackFn: false,
    hasDisconnectedCallbackFn: false,
    hasElement: false,
    hasEvent: false,
    hasLifecycle: false,
    hasListener: false,
    hasListenerTarget: false,
    hasListenerTargetWindow: false,
    hasListenerTargetDocument: false,
    hasListenerTargetBody: false,
    hasListenerTargetParent: false,
    hasMember: false,
    hasMethod: false,
    hasMode: false,
    hasModernPropertyDecls: false,
    hasAttribute: false,
    hasProp: false,
    hasPropNumber: false,
    hasPropBoolean: false,
    hasPropString: false,
    hasPropMutable: false,
    hasReflect: false,
    hasRenderFn: false,
    hasState: false,
    hasStyle: false,
    hasVdomAttribute: false,
    hasVdomXlink: false,
    hasVdomClass: false,
    hasVdomFunctional: false,
    hasVdomKey: false,
    hasVdomListener: false,
    hasVdomPropOrAttr: false,
    hasVdomRef: false,
    hasVdomRender: false,
    hasVdomStyle: false,
    hasVdomText: false,
    hasWatchCallback: false,
    isPlain: false,
    htmlAttrNames: [],
    htmlTagNames: [],
    htmlParts: [],
    isUpdateable: false,
    potentialCmpRefs: [],

    dependents: [],
    dependencies: [],
    directDependents: [],
    directDependencies: [],
  };

  const visitComponentChildNode = (node: ts.Node) => {
    validateComponentMembers(node);

    if (ts.isCallExpression(node)) {
      parseCallExpression(cmp, node);
    } else if (ts.isStringLiteral(node)) {
      parseStringLiteral(cmp, node);
    }
    node.forEachChild(visitComponentChildNode);
  };
  visitComponentChildNode(cmpNode);
  parseClassMethods(cmpNode, cmp);
  detectModernPropDeclarations(cmpNode, cmp);

  cmp.htmlAttrNames = unique(cmp.htmlAttrNames);
  cmp.htmlTagNames = unique(cmp.htmlTagNames);
  cmp.potentialCmpRefs = unique(cmp.potentialCmpRefs);
  setComponentBuildConditionals(cmp);

  if (transformOpts && transformOpts.componentMetadata === 'compilerstatic') {
    cmpNode = addComponentMetaStatic(cmpNode, cmp);
  }

  // add to module map
  const foundIndex = moduleFile.cmps.findIndex(
    (c) => c.tagName === cmp.tagName && c.sourceFilePath === cmp.sourceFilePath,
  );
  if (foundIndex > -1) moduleFile.cmps[foundIndex] = cmp;
  else moduleFile.cmps.push(cmp);

  // add to node map
  compilerCtx.nodeMap.set(cmpNode, cmp);

  return cmpNode;
};

const validateComponentMembers = (node: ts.Node) => {
  /**
   * validate if:
   */
  if (
    /**
     * the component has a getter called "shadowRoot"
     */
    ts.isGetAccessorDeclaration(node) &&
    ts.isIdentifier(node.name) &&
    typeof node.name.escapedText === 'string' &&
    BLACKLISTED_COMPONENT_METHODS.includes(node.name.escapedText) &&
    /**
     * the parent node is a class declaration
     */
    node.parent &&
    ts.isClassDeclaration(node.parent)
  ) {
    const propName = node.name.escapedText;
    const decorator = ts.getDecorators(node.parent)[0];
    /**
     * the class is actually a Stencil component, has a decorator with a property named "tag"
     */
    if (
      ts.isCallExpression(decorator.expression) &&
      decorator.expression.arguments.length === 1 &&
      ts.isObjectLiteralExpression(decorator.expression.arguments[0]) &&
      decorator.expression.arguments[0].properties.some(
        (prop) => ts.isPropertyAssignment(prop) && prop.name.getText() === 'tag',
      )
    ) {
      const componentName = node.parent.name.getText();
      throw new Error(
        `The component "${componentName}" has a getter called "${propName}". This getter is reserved for use by Stencil components and should not be defined by the user.`,
      );
    }
  }
};

const parseVirtualProps = (docs: d.CompilerJsDoc) => {
  return docs.tags
    .filter(({ name }) => name === 'virtualProp')
    .map(parseVirtualProp)
    .filter((prop) => !!prop);
};

const parseVirtualProp = (tag: d.CompilerJsDocTagInfo): d.ComponentCompilerVirtualProperty => {
  const results = /^\s*(?:\{([^}]+)\}\s+)?(\w+)\s+-\s+(.*)$/.exec(tag.text);
  if (!results) {
    return undefined;
  }
  const [, type, name, docs] = results;
  return {
    type: type == null ? 'any' : type.trim(),
    name: name.trim(),
    docs: docs.trim(),
  };
};

const parseAssetsDirs = (staticMembers: ts.ClassElement[], componentFilePath: string): d.AssetsMeta[] => {
  const dirs: string[] = getStaticValue(staticMembers, 'assetsDirs') || [];
  const componentDir = normalizePath(dirname(componentFilePath));

  return dirs.map((dir) => {
    // get the relative path from the component file to the assets directory
    dir = normalizePath(dir.trim());

    let absolutePath = dir;
    let cmpRelativePath = dir;
    if (isAbsolute(dir)) {
      // if this is an absolute path already, let's convert it to be relative
      cmpRelativePath = relative(componentDir, dir);
    } else {
      // create the absolute path to the asset dir
      absolutePath = join(componentDir, dir);
    }
    return {
      absolutePath,
      cmpRelativePath,
      originalComponentPath: dir,
    };
  });
};
