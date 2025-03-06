import ts from 'typescript';

import type * as d from '../../../declarations';
import { isMethod } from '../transform-utils';

export const parseClassMethods = (cmpNode: ts.ClassDeclaration, cmpMeta: d.ComponentCompilerMeta) => {
  const classMembers = cmpNode.members;
  if (!classMembers || classMembers.length === 0) {
    return;
  }

  const classMethods = classMembers.filter((m) => ts.isMethodDeclaration(m));
  if (classMethods.length === 0) {
    return;
  }
  const hasHostData = classMethods.some((m) => isMethod(m, 'hostData'));

  cmpMeta.hasAttributeChangedCallbackFn = classMethods.some((m) => isMethod(m, 'attributeChangedCallback'));
  cmpMeta.hasConnectedCallbackFn = classMethods.some((m) => isMethod(m, 'connectedCallback'));
  cmpMeta.hasDisconnectedCallbackFn = classMethods.some((m) => isMethod(m, 'disconnectedCallback'));
  cmpMeta.hasComponentWillLoadFn = classMethods.some((m) => isMethod(m, 'componentWillLoad'));
  cmpMeta.hasComponentWillUpdateFn = classMethods.some((m) => isMethod(m, 'componentWillUpdate'));
  cmpMeta.hasComponentWillRenderFn = classMethods.some((m) => isMethod(m, 'componentWillRender'));
  cmpMeta.hasComponentDidRenderFn = classMethods.some((m) => isMethod(m, 'componentDidRender'));
  cmpMeta.hasComponentDidLoadFn = classMethods.some((m) => isMethod(m, 'componentDidLoad'));
  cmpMeta.hasComponentShouldUpdateFn = classMethods.some((m) => isMethod(m, 'componentShouldUpdate'));
  cmpMeta.hasComponentDidUpdateFn = classMethods.some((m) => isMethod(m, 'componentDidUpdate'));
  cmpMeta.hasLifecycle =
    cmpMeta.hasComponentWillLoadFn ||
    cmpMeta.hasComponentDidLoadFn ||
    cmpMeta.hasComponentWillUpdateFn ||
    cmpMeta.hasComponentDidUpdateFn;
  cmpMeta.hasRenderFn = classMethods.some((m) => isMethod(m, 'render')) || hasHostData;
  cmpMeta.hasVdomRender = cmpMeta.hasVdomRender || hasHostData;
};
