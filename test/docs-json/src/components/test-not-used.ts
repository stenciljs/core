/**
 * If I show up then a re-export w/ alias and `export type` works!
 */
export interface ReExportedUnderNewNameWithType {
  test: string;
}

/**
 * If I show up then a re-export w/ alias works!
 */
export interface ReExportedUnderNewName {
  test: string;
}

/**
 * If I show up then a re-export works!
 */
export interface ReExported {
  test: string;
}

/**
 * If I show up then a re-export w/ `export type` works!
 */
export interface ReExportedWithType {
  test: string;
}

/**
 * If I show up then a `export * from '...'` works!
 */
export interface IncludedInWildcard {
  test: string;
}
