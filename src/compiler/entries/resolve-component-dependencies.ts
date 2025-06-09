import { flatOne, unique } from '@utils';

import type * as d from '../../declarations';

/**
 * For each entry in the provided collection of compiler metadata, generate several lists:
 * - dependencies that the component has (both directly and indirectly/transitively)
 * - dependencies that the component has (only directly)
 * - components that are dependent on a particular component (both directly and indirectly/transitively)
 * - components that are dependent on a particular component (only directly)
 *
 * This information is stored directly on each entry in the provided collection
 *
 * @param cmps the compiler metadata of the components whose dependencies and dependents ought to be calculated
 */
export function resolveComponentDependencies(cmps: d.ComponentCompilerMeta[]): void {
  computeDependencies(cmps);
  computeDependents(cmps);
}

/**
 * Compute the direct and transitive dependencies for each entry in the provided collection of component metadata.
 *
 * This function mutates each entry in the provided collection.
 *
 * @param cmps the metadata for the components whose dependencies ought to be calculated.
 */
function computeDependencies(cmps: d.ComponentCompilerMeta[]): void {
  const visited = new Set<d.ComponentCompilerMeta>();
  cmps.forEach((cmp) => {
    resolveTransitiveDependencies(cmp, cmps, visited);
    cmp.dependencies = unique(cmp.dependencies).sort();
  });
}

/**
 * Compute the direct and transitive dependents for each entry in the provided collection of component metadata.
 *
 * @param cmps the component metadata whose entries will have their dependents calculated
 */
function computeDependents(cmps: d.ComponentCompilerMeta[]): void {
  cmps.forEach((cmp) => {
    resolveTransitiveDependents(cmp, cmps);
  });
}

/**
 * Calculate the direct and transitive dependencies of a particular component.
 *
 * For example, given a component `foo-bar` whose `render` function references another web component `baz-buzz`:
 * ```tsx
 * // foo-bar.ts
 * render() {
 *  return <baz-buzz></baz-buzz>;
 * }
 * ```
 * where `baz-buzz` references `my-component`:
 * ```tsx
 * // baz-buzz.ts
 * render() {
 *  return <my-component></my-component>;
 * }
 * ```
 * this function will return ['baz-buzz', 'my-component'] when inspecting 'foo-bar', as 'baz-buzz' is directly used by
 * 'foo-bar', and 'my-component' is used by a component ('baz-buzz') that is being used by 'foo-bar'.
 *
 * This function mutates each entry in the provided collection.
 *
 * @param cmp the metadata for the component whose dependencies are being calculated
 * @param cmps the metadata for all components that participate in the current build
 * @param visited a collection of component metadata that has already been inspected
 * @returns a list of direct and transitive dependencies for the component being inspected
 */
function resolveTransitiveDependencies(
  cmp: d.ComponentCompilerMeta,
  cmps: d.ComponentCompilerMeta[],
  visited: Set<d.ComponentCompilerMeta>,
): string[] {
  if (visited.has(cmp)) {
    // we've already inspected this component, return its dependency list
    return cmp.dependencies;
  }
  // otherwise, add the component to our collection to mark it as 'visited'
  visited.add(cmp);

  // create a collection of dependencies of web components that the build knows about
  const dependencies = unique(cmp.potentialCmpRefs.filter((tagName) => cmps.some((c) => c.tagName === tagName)));

  cmp.dependencies = cmp.directDependencies = dependencies;

  // get a list of dependencies of the current component's dependencies
  const transitiveDeps = flatOne(
    dependencies
      .map((tagName) => cmps.find((c) => c.tagName === tagName))
      .map((c) => resolveTransitiveDependencies(c, cmps, visited)),
  );
  return (cmp.dependencies = [...dependencies, ...transitiveDeps]);
}

/**
 * Generate and set the lists of components that are:
 * 1. directly _and_ indirectly (transitively) dependent on the component being inspected
 * 2. only directly dependent on the component being inspected
 *
 * This function assumes that the {@link d.ComponentCompilerMeta#dependencies} and
 * {@link d.ComponentCompilerMeta#directDependencies} properties are pre-populated for `cmp` and all entries in `cmps`.
 *
 * This function mutates the `dependents` and `directDependents` field on the provided `cmp` argument for both lists,
 * respectively.
 *
 * @param cmp the metadata for the component whose dependents are being calculated
 * @param cmps the metadata for all components that participate in the current build
 */
function resolveTransitiveDependents(cmp: d.ComponentCompilerMeta, cmps: d.ComponentCompilerMeta[]): void {
  // the dependents of a component are any other components that list it as a direct or transitive dependency
  cmp.dependents = cmps
    .filter((c) => c.dependencies.includes(cmp.tagName))
    .map((c) => c.tagName)
    .sort();

  // the dependents of a component are any other components that list it as a direct dependency
  cmp.directDependents = cmps
    .filter((c) => c.directDependencies.includes(cmp.tagName))
    .map((c) => c.tagName)
    .sort();
}
