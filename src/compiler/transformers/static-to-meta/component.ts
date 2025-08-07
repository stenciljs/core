import { augmentDiagnosticWithNode, buildError, join, normalizePath, relative, unique } from '@utils';
import { dirname, isAbsolute } from 'path';
import ts from 'typescript';

import type * as d from '../../../declarations';
import { tsResolveModuleName } from '../../sys/typescript/typescript-resolve-module';
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
 * A recursive function that builds a tree of classes that extend from each other.
 * Ensures that the current component class in-question receives all the static meta-data required at runtime.
 *
 * @param compilerCtx the current compiler context
 * @param classDeclaration a class declaration to analyze
 * @param dependentClasses a flat array tree of classes that extend from each other
 * @param typeChecker the TypeScript type checker
 * @returns a flat array of classes that extend from each other, including the current class
 */
const buildExtendsTree = (
  compilerCtx: d.CompilerCtx,
  classDeclaration: ts.ClassDeclaration,
  dependentClasses: { classNode: ts.ClassDeclaration; fileName: string }[],
  typeChecker: ts.TypeChecker,
  buildCtx: d.BuildCtx,
) => {
  const hasHeritageClauses = classDeclaration.heritageClauses && classDeclaration.heritageClauses.length > 0;
  if (!hasHeritageClauses) return dependentClasses;

  const extendsClause = classDeclaration.heritageClauses.find(
    (clause) => clause.token === ts.SyntaxKind.ExtendsKeyword,
  );
  if (!extendsClause) {
    return dependentClasses;
  }

  extendsClause.types.forEach((type) => {
    try {
      // happy path (normally 1 level deep): the extends type resolves to a class declaration in another file
      const aliasedSymbol = typeChecker.getAliasedSymbol(typeChecker.getSymbolAtLocation(type.expression));
      classDeclaration = aliasedSymbol?.declarations?.find(ts.isClassDeclaration);

      if (classDeclaration && !dependentClasses.some((dc) => dc.classNode === classDeclaration)) {
        const foundModule = compilerCtx.moduleMap.get(classDeclaration.getSourceFile().fileName);

        if (foundModule) {
          const source = foundModule.staticSourceFile as ts.SourceFile;
          source.statements.forEach((statement) => {
            if (ts.isClassDeclaration(statement)) {
              dependentClasses.push({ classNode: statement, fileName: source.fileName });
              buildExtendsTree(compilerCtx, statement, dependentClasses, typeChecker, buildCtx);
            }
          });
        }
      }
    } catch (e) {
      // sad path (normally >1 levels deep): the extends type does not resolve so let's find it manually:
      const currentSource = classDeclaration.getSourceFile();
      const importStatements = currentSource.statements.filter(ts.isImportDeclaration);
      const classDeclarations = currentSource.statements.filter(ts.isClassDeclaration);
      let found = false;

      // let's first check if the class is in the current source file
      if (classDeclarations.length > 1) {
        classDeclarations.forEach((statement) => {
          if (
            statement.name?.getText() === type.expression.getText() &&
            !dependentClasses.some((dc) => dc.classNode === statement)
          ) {
            found = true;
            dependentClasses.push({ classNode: statement, fileName: currentSource.fileName });
            buildExtendsTree(compilerCtx, statement, dependentClasses, typeChecker, buildCtx);
          }
        });
      }
      if (found) return;

      // if not found, let's check the import statements
      importStatements.forEach((statement) => {
        // 1) loop through import declarations in the current source file
        if (ts.isNamedImports(statement.importClause?.namedBindings)) {
          statement.importClause?.namedBindings.elements.forEach((element) => {
            // 2) loop through the named bindings of the import declaration
            if (element.name.getText() === type.expression.getText()) {
              // 3) check the name matches the `extends` type expression
              const className = element.propertyName?.getText() || element.name.getText();
              const foundFile = tsResolveModuleName(
                buildCtx.config,
                compilerCtx,
                statement.moduleSpecifier.getText().replaceAll(/['"]/g, ''),
                currentSource.fileName,
              );
              if (foundFile) {
                // 4) resolve the module name to a file
                const foundModule = compilerCtx.moduleMap.get(foundFile.resolvedModule.resolvedFileName);
                (foundModule?.staticSourceFile as ts.SourceFile).statements.forEach((statement) => {
                  if (
                    ts.isClassDeclaration(statement) &&
                    statement.name?.getText() === className &&
                    !dependentClasses.some((dc) => dc.classNode === statement)
                  ) {
                    // 5) find the class declaration
                    dependentClasses.push({ classNode: statement, fileName: foundModule.staticSourceFile.fileName });
                    // 6) check if the class declaration extends from another class
                    buildExtendsTree(compilerCtx, statement, dependentClasses, typeChecker, buildCtx);
                  }
                });
              }
            }
          });
        }
      });
    }
  });

  return dependentClasses;
};

type DeDupeMember =
  | d.ComponentCompilerProperty
  | d.ComponentCompilerState
  | d.ComponentCompilerMethod
  | d.ComponentCompilerListener
  | d.ComponentCompilerEvent
  | d.ComponentCompilerWatch;

/**
 * Given two arrays of static members, return a new array containing only the
 * members from the first array that are not present in the second array.
 * This is used to de-dupe static members that are inherited from a parent class.
 *
 * @param dedupeMembers the array of static members to de-dupe
 * @param staticMembers the array of static members to compare against
 * @returns an array of static members that are not present in the second array
 */
const deDupeMembers = <T extends DeDupeMember>(dedupeMembers: T[], staticMembers: T[]) => {
  return dedupeMembers.filter(
    (s) =>
      !staticMembers.some((d) => {
        if ((d as d.ComponentCompilerWatch).methodName) {
          return (d as any).methodName === (s as any).methodName;
        }
        return (d as any).name === (s as any).name;
      }),
  );
};

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
 * @param buildCtx the current build context, used to surface diagnostics
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
  buildCtx: d.BuildCtx,
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

  let properties = parseStaticProps(staticMembers);
  let states = parseStaticStates(staticMembers);
  let methods = parseStaticMethods(staticMembers);
  let listeners = parseStaticListeners(staticMembers);
  let events = parseStaticEvents(staticMembers);
  let watchers = parseStaticWatchers(staticMembers);
  let hasMixin = false;
  let classMethods = cmpNode.members.filter(ts.isMethodDeclaration);

  const tree = buildExtendsTree(compilerCtx, cmpNode, [], typeChecker, buildCtx);
  tree.map((extendedClass) => {
    const extendedStaticMembers = extendedClass.classNode.members.filter(isStaticGetter);
    const mixinProps = parseStaticProps(extendedStaticMembers) ?? [];
    const mixinStates = parseStaticStates(extendedStaticMembers) ?? [];
    const isMixin = mixinProps.length > 0 || mixinStates.length > 0;
    const module = compilerCtx.moduleMap.get(extendedClass.fileName);

    module.isMixin = isMixin;
    module.isExtended = true;

    properties = [...deDupeMembers(mixinProps, properties), ...properties];
    states = [...deDupeMembers(mixinStates, states), ...states];
    methods = [...deDupeMembers(parseStaticMethods(extendedStaticMembers) ?? [], methods), ...methods];
    listeners = [...deDupeMembers(parseStaticListeners(extendedStaticMembers) ?? [], listeners), ...listeners];
    events = [...deDupeMembers(parseStaticEvents(extendedStaticMembers) ?? [], events), ...events];
    watchers = [...deDupeMembers(parseStaticWatchers(extendedStaticMembers) ?? [], watchers), ...watchers];
    classMethods = [...classMethods, ...(extendedClass.classNode.members.filter(ts.isMethodDeclaration) ?? [])];

    if (isMixin) {
      hasMixin = true;
    }
  });

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
    properties,
    virtualProperties: parseVirtualProps(docs),
    states,
    methods,
    listeners,
    events,
    watchers,
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

  const visitComponentChildNode = (node: ts.Node, buildCtx: d.BuildCtx) => {
    validateComponentMembers(node, buildCtx);

    if (ts.isCallExpression(node)) {
      parseCallExpression(cmp, node);
    } else if (ts.isStringLiteral(node)) {
      parseStringLiteral(cmp, node);
    }
    node.forEachChild((child) => visitComponentChildNode(child, buildCtx));
  };
  visitComponentChildNode(cmpNode, buildCtx);
  parseClassMethods(classMethods, cmp);
  const hasModernPropertyDecls = detectModernPropDeclarations(cmpNode, cmp);

  if (!hasModernPropertyDecls && hasMixin) {
    const err = buildError(buildCtx.diagnostics);
    const target = buildCtx.config.tsCompilerOptions?.target;
    err.messageText = `Component classes can only extend from other Stencil decorated base classes when targetting more modern JavaScript (ES2022 and above).
    ${target ? `Your current TypeScript configuration is set to target \`${ts.ScriptTarget[target]}\`.` : ''} Please amend your tsconfig.json.`;
    if (!buildCtx.config._isTesting) augmentDiagnosticWithNode(err, cmpNode);
  }

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

const validateComponentMembers = (node: ts.Node, buildCtx: d.BuildCtx) => {
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
      const err = buildError(buildCtx.diagnostics);
      err.messageText = `The component "${componentName}" has a getter called "${propName}". This getter is reserved for use by Stencil components and should not be defined by the user.`;
      augmentDiagnosticWithNode(err, node);
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
