This test suite is focused on ensuring that component's with static class fields compiles correctly.
With TypeScript v5.0, exported classes with static exports would be compiled as:

```ts
class StaticMembers {};
StaticMembers.property = '';
StaticMembers.anotherProperty = '';
export { StaticMembers };
```

However, Stencil would also inject the `export` keyword in front of the class declaration, resulting in two exports:

```ts
export class StaticMembers {};
StaticMembers.property = '';
StaticMembers.anotherProperty = '';
export { StaticMembers }; // 2 exports causes an error!
```

Which produces an error when we get to the rollup stage:

```console
[ ERROR ]  Rollup: Parse Error: ./test-app/static-members/cmp.tsx:35:9
           Duplicate export 'StaticMembers' (Note that you need plugins to import files that are not JavaScript) at
           ... (elided) ...
```

See: https://github.com/stenciljs/core/issues/4424 for more information
See: https://www.typescriptlang.org/play?#code/KYDwDg9gTgLgBAYwDYEMDOa4GUYpgSwQFlgBbAI2CkwG8BYAKDjjVwITjCgjCpgE84AXjgAmANyMAvkA
for a TS playground reproduction of the `export` keyword being moved around