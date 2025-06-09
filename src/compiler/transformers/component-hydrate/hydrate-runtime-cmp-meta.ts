import { CMP_FLAGS, formatComponentRuntimeMeta } from '@utils';
import ts from 'typescript';

import type * as d from '../../../declarations';
import { addStaticStyleGetterWithinClass } from '../add-static-style';
import { convertValueToLiteral, createStaticGetter } from '../transform-utils';

export const addHydrateRuntimeCmpMeta = (classMembers: ts.ClassElement[], cmp: d.ComponentCompilerMeta) => {
  const compactMeta: d.ComponentRuntimeMetaCompact = formatComponentRuntimeMeta(cmp, true);
  const cmpMeta: d.ComponentRuntimeMeta = {
    $flags$: compactMeta[0],
    $tagName$: compactMeta[1],
    $members$: compactMeta[2],
    $listeners$: compactMeta[3],
    $lazyBundleId$: fakeBundleIds(cmp),
    $attrsToReflect$: getHydrateAttrsToReflect(cmp),
  };
  // We always need shadow-dom shim in hydrate runtime
  if (cmpMeta.$flags$ & CMP_FLAGS.shadowDomEncapsulation) {
    // TODO(STENCIL-854): Remove code related to legacy shadowDomShim field
    cmpMeta.$flags$ |= CMP_FLAGS.needsShadowDomShim;
  }
  const staticMember = createStaticGetter('cmpMeta', convertValueToLiteral(cmpMeta));
  addStaticStyleGetterWithinClass(classMembers, cmp);

  classMembers.push(staticMember);
};

const fakeBundleIds = (_cmp: d.ComponentCompilerMeta) => {
  return '-';
};

const getHydrateAttrsToReflect = (cmp: d.ComponentCompilerMeta): d.ComponentRuntimeReflectingAttr[] => {
  return cmp.properties.reduce((attrs: d.ComponentRuntimeReflectingAttr[], prop: d.ComponentCompilerProperty) => {
    if (prop.reflect) {
      attrs.push([prop.name, prop.attribute]);
    }
    return attrs;
  }, []);
};
