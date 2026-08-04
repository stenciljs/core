Copy Task Tests
===============

This directory aims to test and validate the behavior for Stencils [Copy Task for Output Targets](https://stenciljs.com/docs/copy-tasks#copy-tasks-for-output-targets). It has a copy task defined in `test/copy-task/stencil.config.ts` and builds this starter projects to then validate if the right files where copies.

## Given

We have a copy task defined as part of an output target, e.g. 

```ts
{
  type: 'dist-custom-elements',
  copy: [{
    src: './utils',
    dest: './dist/utilsExtra',
  }]
}
```

I expect that a `utilsExtra` directory is created that does __not__ copy the following entries:

- files in `__fixtures__` and `__mocks__` directories
- as well as files named `desktop.ini`

Furthermore I expect that no JS files are copied over within the collection directory.
