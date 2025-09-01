type Constructor<T = {}> = new (...args: any[]) => T;

export function Mixin(...bases: Constructor[]) {
  // reduce right-to-left so order matches
  return bases.reduceRight((accumulator, Base) => {
    return class extends Base {
      constructor(...args: any[]) {
        super(...args);
        // copy over props from accumulator (the previously built class)
        Object.assign(this, new accumulator(...args));
      }
    };
  });
}
