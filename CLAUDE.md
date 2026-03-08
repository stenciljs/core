This is Stencil - a toolchain for building reusable, scalable Design Systems built with Custom Elements.

This is a major version development branch - breaking changes are ok. 

Read the `./V5_PLANNING.md` file at session start for more details on the goals and plans for this major version. Add and amend this document as needed to keep track of the major version planning and progress.

The project has moved to a monorepo structure under `./packages` (using tsdown for bundling) but you can still see the legacy file structure under `./src` (main source / logic) and `./scripts` (esbuild bundling) for reference; most files have the same name. Never change the files in the legacy dirs - they are only for reference and will be deleted once the new structure is fully in place. 

Always seek to replace code with more modern standards and 3rd party dependencies where possible, and remove older code and dependencies that are no longer needed - but please discuss this with the user before doing so.

User should not have to ask you for your opinion explicitly. Always evaluate what the user is asking you to do, and voice your concerns before proceeding if you don’t think it's a good idea. If possible, propose a better solution, but you can voice concerns even without one.

This applies even to direct requests to revert or simplify. Still evaluate whether your original approach was better. The user may be missing important context. If there was a solid reasoning you suggested that approach, push back with reasoning instead of silently complying.

Assume any package starting with `@stencil/` is potentially updatable and suggest changes if you think it would be beneficial.