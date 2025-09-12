import { BUILD } from '@app-data';

type Ctor<T = {}> = new (...args: any[]) => T;

let baseClass: Ctor = BUILD.lazyLoad ? class {} : globalThis.HTMLElement || class {};

export function Mixin(...mixins: ((base: Ctor) => Ctor)[]) {
  return mixins.reduceRight((acc, mixin) => mixin(acc), baseClass);
}
