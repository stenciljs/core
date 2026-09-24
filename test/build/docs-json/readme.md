# docs-json test app

This directory contains a test application which exercises the `docs-json`
output target, including the `supplementalPublicTypes` option which allows
Stencil component authors to specify a file exporting types which should be
documented even if they're not used in the public API of any Stencil components
in the project.

Here are some relevant files, with notes on what they're testing:

```
docs-json
├── docs.d.ts // generated `.d.ts` output
├── docs.json // generated documentation output
└── src
    └── components
        │ // interfaces which are not used by components in the file.
        │ // this file is specified with the `supplementalPublicTypes`
        │ // option, testing that all the types exported from the file
        │ // show up in the compiled output
        ├── interfaces.ts
        ├── my-component
        │   │ // this file exports an interface which is used in
        │   │ // `my-component.tsx`. This tests that the original
        │   │ // declaration of the interface is correctly resolved
        │   │ // for inclusion in the compiled output
        │   ├── imported-interface.ts
        │   ├── my-component.tsx
        │   └── readme.md
        │ // this exports two interfaces which are not used in the
        │ // sole component within this project. these are re-exported
        │ // from `interfaces.ts`, however, testing that the correct
        │ // types are resolved when re-exported from the file
        │ // specified for `supplementalPublicTypes`
        └── test-not-used.ts
```