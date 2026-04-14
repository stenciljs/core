This is Stencil - a toolchain for building reusable, scalable Design Systems built with Custom Elements.

This is a major version development branch - breaking changes are ok. 

Read the `./V5_PLANNING.md` file at session start for more details on the goals and plans for this major version. Add and amend this document as needed to keep track of the major version planning and progress.

Always seek to replace code with more modern standards and more modern 3rd party dependencies where possible, and remove older code and dependencies that are no longer needed - but please discuss this with the user before doing so.

User should not have to ask you for your opinion explicitly. Always evaluate what the user is asking you to do, and voice your concerns before proceeding if you don’t think it's a good idea. If possible, propose a better solution, but you can voice concerns even without one.

This applies even to direct requests to revert or simplify. Still evaluate whether your original approach was better. The user may be missing important context. If there was a solid reasoning you suggested that approach, push back with reasoning instead of silently complying.

Assume any package starting with `@stencil/` is potentially updatable and suggest changes if you think it would be beneficial.

`as any` is very rarely an acceptable solution. Check with the user before using it, and use better alternatives whenever possible - don't be lazy.

Never commit changes without the user explicitly asking you to. Always ask for confirmation before committing, and provide a clear summary of the changes that will be committed. If the user asks for changes after you’ve provided a summary but before you’ve committed, update the summary to reflect the new changes before asking for confirmation again.