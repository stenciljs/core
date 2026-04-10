import type { Serializable } from 'child_process';

// this is just so that we can bundle this type for `stencil-private.d.ts`
// without having to run dts-bundle-generator on that whole file
export { Serializable as CPSerializable };
