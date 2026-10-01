This is Stencil - a toolchain for building reusable, scalable Design Systems built with Custom Elements.

This is a major version development branch - breaking changes are ok. 

Read the `./V5_PLANNING.md` file at session start for more details on the goals and plans for this major version. Add and amend this document as needed to keep track of the major version planning and progress.

Always seek to replace code with more modern standards and more modern 3rd party dependencies where possible, and remove older code and dependencies that are no longer needed - but please discuss this with the user before doing so.

User should not have to ask you for your opinion explicitly. Always evaluate what the user is asking you to do, and voice your concerns before proceeding if you don’t think it's a good idea. If possible, propose a better solution, but you can voice concerns even without one.

This applies even to direct requests to revert or simplify. Still evaluate whether your original approach was better. The user may be missing important context. If there was a solid reasoning you suggested that approach, push back with reasoning instead of silently complying.

Assume any package starting with `@stencil/` is potentially updatable and suggest changes if you think it would be beneficial.

`as any` is very rarely an acceptable solution. Check with the user before using it, and use better alternatives whenever possible - don't be lazy.

Prefer implied return types for internal/private functions and methods. Use explicit return types only for exported declarations (public API surface), interface implementations, and recursive functions.

Never commit changes without the user explicitly asking you to. Always ask for confirmation before committing, and provide a clear summary of the changes that will be committed. If the user asks for changes after you’ve provided a summary but before you’ve committed, update the summary to reflect the new changes before asking for confirmation again.

Keep all code comments terse as you can ... but don't delete existing comments without good reason. *NEVER* include in any comment or doc, context information that is *only* relevant to the current session. Read any comment you add as "if someone else were reading this code in 6 months, would they understand it?" If the answer is no, trim the bullshit down to the bear minimum.

Generally, non-trivial changes should pass -
- `pnpm build`
- `pnpm typecheck`
- `pnpm test`
- `pnpm lint`

To run a specific unit test: `pnpm -F PACKAGE_NAME test TEST_NAME`

Tests are important. If you notice an area that is not well covered by tests, mention it and add a note to the planning document that tests should be added. If you are adding new functionality, add tests for it. If you are fixing a bug, add a test that reproduces the bug and then fixes it.

When stuck on any problem, try adding debug logging. Ask the user to paste the results if need be. Having added debug / console.log messaging, do not remove them until it has been confirmed that the issue has been resolved by the user. 

Stop with the 

// ---------------------------------------------------------------------------
// Something ...
// ---------------------------------------------------------------------------

after everything. It's not necessary and makes the code harder to read.

If you find dead code, or code that is no longer needed, mention it to the user and ask if it can be removed.