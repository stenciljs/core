import type * as d from '@stencil/core';

export const parseClassMethods = (classMethods: string[], cmpMeta: d.ComponentCompilerMeta) => {
  if (!classMethods?.length) {
    return;
  }

  const hasHostData = classMethods.includes('hostData');

  cmpMeta.hasAttributeChangedCallbackFn = classMethods.includes('attributeChangedCallback');
  cmpMeta.hasConnectedCallbackFn = classMethods.includes('connectedCallback');
  cmpMeta.hasDisconnectedCallbackFn = classMethods.includes('disconnectedCallback');
  cmpMeta.hasComponentWillLoadFn = classMethods.includes('componentWillLoad');
  cmpMeta.hasComponentWillUpdateFn = classMethods.includes('componentWillUpdate');
  cmpMeta.hasComponentWillRenderFn = classMethods.includes('componentWillRender');
  cmpMeta.hasComponentDidRenderFn = classMethods.includes('componentDidRender');
  cmpMeta.hasComponentDidLoadFn = classMethods.includes('componentDidLoad');
  cmpMeta.hasComponentShouldUpdateFn = classMethods.includes('componentShouldUpdate');
  cmpMeta.hasComponentDidUpdateFn = classMethods.includes('componentDidUpdate');
  cmpMeta.hasLifecycle =
    cmpMeta.hasComponentWillLoadFn ||
    cmpMeta.hasComponentDidLoadFn ||
    cmpMeta.hasComponentWillUpdateFn ||
    cmpMeta.hasComponentDidUpdateFn;
  cmpMeta.hasRenderFn = classMethods.includes('render') || hasHostData;
  cmpMeta.hasVdomRender = cmpMeta.hasVdomRender || hasHostData;
};
