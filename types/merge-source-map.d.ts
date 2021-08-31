/**
 * Ambient module declaration for the [merge-source-map library](https://github.com/keik/merge-source-map).
 *
 * At the time of this writing, no official nor third party type declaration files exist for v1.1.0 of library, and are
 * recreated here for type safety purposes.
 */
declare module 'merge-source-map' {
  interface MergeSourceMap {
    file: string;
    mappings: string;
    names: string[];
    sourceRoot?: string;
    sources: string[];
    sourcesContent?: string[];
    version: number;
  }

  /**
   * Merge an existing sourcemap with a new one
   *
   * This type declaration differs from the output of running `tsc -d` on the entrypoint of the merge-source-map
   * module. It prefers concrete `MergeSourceMap` formal arguments over `(object | string)`.
   *
   * @param oldMap the original sourcemap to merge
   * @param newMap the new sourcemap to merge with the `oldMap`
   * @returns the merged sourcemap
   */
  function merge(oldMap: MergeSourceMap, newMap: MergeSourceMap): MergeSourceMap;

  /**
   * mark the `merge` function as the default export of the module, so that the JSDoc for `merge` is properly picked up
   * by IntelliSense
   */
  export = merge;
}
