# Contributing

Thanks for your interest in contributing to Stencil! 🎉


## Contributing Etiquette

Please see our [Contributor Code of Conduct](https://github.com/stenciljs/core/blob/main/CODE_OF_CONDUCT.md) for information on our rules of conduct.


## Reporting a Bug

* If you have a question about using Stencil, please ask in the [Stencil Discord server](https://chat.stenciljs.com).

* It is required that you clearly describe the steps necessary to reproduce the issue you are running into. Although we would love to help our users as much as possible, diagnosing issues without clear reproduction steps is extremely time-consuming and simply not sustainable.

* The issue list of this repository is exclusively for bug reports and feature requests. Non-conforming issues will be closed immediately.

* Issues with no clear steps to reproduce will not be triaged.

* If you think you have found a bug, please start by making sure it hasn't already been [reported](https://github.com/stenciljs/core/issues?utf8=%E2%9C%93&q=is%3Aissue). You can search through existing issues to see if there is a similar one reported. Include closed issues as it may have been closed with a solution.
    * If a bug report already exists, please upvote it using the :+1: reaction on the GitHub Issue summary. The team is currently unable to track "+1" style comments on the issue.

* Next, [create a new issue](https://github.com/stenciljs/core/issues/new) that thoroughly explains the problem.
    * Please fill out the issue form in full before submitting.
    * Please only include one bug per issue.


## Requesting a Feature

* If you have a question about using Stencil, please ask in the [Stencil Discord server](https://chat.stenciljs.com).

* Before requesting a feature, please start by making sure it hasn't already been [proposed](https://github.com/stenciljs/core/issues?utf8=%E2%9C%93&q=is%3Aissue). You can search through existing GitHub issues to see if there is a similar feature request has been reported. Include closed feature requests, as it may have been closed already.
    * If a feature request already exists, please upvote it using the :+1: reaction on the GitHub Issue summary. The team is currently unable to track "+1" style comments on the issue.

* Next, [create a new feature request]([https://github.com/stenciljs/core/issues/new](https://github.com/stenciljs/core/issues/new?assignees=&labels=&projects=&template=feature_request.yml&title=feat%3A+)) that thoroughly explains the feature request.
    * Please fill out the feature request form in full before submitting.
    * Please only include one feature request per report.

## Creating a Pull Request

* We appreciate you taking the time to contribute! Before submitting a pull request, we ask that you please [create an issue](#creating-an-issue) that explains the bug or feature request and let us know that you plan on creating a pull request for it. If an issue already exists, please comment on that issue letting us know you would like to submit a pull request for it. This helps us to keep track of the pull request and make sure there isn't duplicated effort.

### Setup

1. Fork the repo.
2. Clone your fork.
3. Make a branch for your change.
4. Stencil uses [volta](https://volta.sh) to manage its npm and Node versions. 
   [Install it](https://docs.volta.sh/guide/getting-started) before proceeding.
   1. There's no need to install a specific version of npm or Node right now, it shall be done automatically for you in
      the next step
5. Run `npm ci`
6. Run `npm run install.jest` to install dependencies for Stencil's testing submodule


### Updates

1. Unit test. Unit test. Unit test. Please take a look at how other unit tests are written, and you can't write too many tests.
2. If there is a `*.spec.ts` file located in the `test/` folder, update it to include a test for your change, if needed. If this file doesn't exist, please notify us.
3. First run `npm run build`. Then run `npm run test` or `npm run test.watch` to make sure all tests are working, regardless if a test was added.

### Testing Changes Against a Project Locally

#### Testing with `npm link`:

Using `npm link` is beneficial to the development cycle in that consecutive builds of Stencil are immediately available in your project, without any additional `npm install` steps needed:

1. In the directory of _stencil core_:
    1. Run `npm run build`
    2. Run `npm link`
2. In the directory of _your stencil project_:
    1. Run `npm link @stencil/core`
    2. Add the following to your `tsconfig.json`, to ensures that typescript can resolve all modules correctly:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@stencil/core/internal": ["node_modules/@stencil/core/internal"],
      "@stencil/core/internal/*": ["node_modules/@stencil/core/internal/*"],
      "@stencil/core/mock-doc": ["node_modules/@stencil/core/mock-doc"],
      "@stencil/core/mock-doc/*": ["node_modules/@stencil/core/mock-doc/*"]
    }
  }
}
```

You can then test your changes against your own stencil project.

Afterwards, to clean up:

1. In the directory of _your stencil project_:
    1. Run `npm unlink @stencil/core`
    2. Remove the modifications to your tsconfig.json
2. In the directory of _stencil core_, run `npm unlink`

> [!NOTE]  
> Instead of linking, you can reference Stencil from a local directory in the `package.json` after updating your project's `tsconfig.json` file, e.g.
> ```patch
> diff --git a/package.json b/package.json
> index 1a8320a..bb1fa3a 100644
> --- a/package.json
> +++ b/package.json
> @@ -39,11 +39,12 @@
>      "generate": "stencil generate"
>    },
>    "devDependencies": {
> -    "@stencil/core": "^4.7.0",
> +    "@stencil/core": "file:/path/to/local/stencil",
>      "@types/jest": "^29.5.6",
>      "@types/node": "^16.18.11",
>      "jest": "^29.7.0",
>      "jest-cli": "^29.7.0",
>      "puppeteer": "^21.9.0"
>    },
>    "license": "MIT"
> ```

#### Testing with `npm pack`:

There are some cases where `npm link` may fall short. For instance, when upgrading a minimum/recommended package version where the package in question has changed its typings. Rather than updating `paths` in your project's `tsconfig.json` file, it may be easier to create a tarball of the project and install in manually.

1. In the directory of _stencil core_:
    1. Run `npm run build`
    2. Run `npm pack`. This will create a tarball with the name `stencil-core-<VERSION>.tgz`
2. In the directory of _your stencil project_:
    1. Run `npm install --save-dev <PATH_TO_STENCIL_REPO_ON_DISK>/stencil-core-<VERSION>.tgz`. 
       * e.g. If you cloned the stencil repo to `~/workspaces` and built v.2.6.0, you would run `npm install ~/workspaces/stencil/stencil-2.6.0.tgz`
  
Note that this method of testing is far more laborious than using `npm link`, and requires every step to be repeated following a change to the Stencil core source.

Afterwards, to clean up:

1. In the directory of your stencil project, run `npm install --save-dev stencil@<VERSION>` for the `<VERSION>` of Stencil core that was installed in your project prior to testing. 

### Debugging the Stencil Compiler

The Stencil compiler itself can be run through a debugger, as opposed to running a Stencil project through a debugger.
This allows individuals working on the compiler itself to inspect fields, trace execution, and more during the
execution of a Stencil task (`build`, `test`, etc.).

Support for this style of debugging is currently a work in progress and may not work for every aspect of the compiler.
It is considered experimental and should not be relied on for any production means.

At this time, it's recommended that the compiler be debugged by opening this project in your editor of choice. Please
keep in mind that due to the number of possible development environment's that exist today, this guide may not include
directions for every possible debugging environment.

It is required that Stencil be built to run it through the debugger.

Note that Stencil transpiles source code using multiple worker processes. If your debugger appears to 'hang' or get
stuck, your debugger may not have switched to a worker process that has halted on a breakpoint. You may be able to
avoid this altogether by setting `--max-workers=1` when you launch Stencil (with the possibility of not being able to
reproduce timing issues between workers as a side effect).

> [!NOTE]
> If you want to have access to sourcemaps when debugging the compiler locally
> you can run the `build` script in `package.json` with the `DEBUG` environment
> variable set to `true` like so:
>
> ```sh
> DEBUG=true npm run build
> ```
>
> this will write a `.js.map` file to disk next to each JavaScript file.

#### Debugging the Compiler in VSCode

Two launch configurations for debugging the compiler can be found in the `.vscode/launch.json` configuration found in
this repository:

1. `debug stencil compiler (default config)` will run the compiler with the default Stencil configuration file
(generated at runtime).
2. `debug stencil compiler with stencil.config.ts` will run the compiler with a specific Stencil configuration file. 
You will be prompted for the location of the Stencil project containing the configuration file to debug with before the
debugger starts.

#### Debugging the Compiler in JetBrains IDEs

JetBrains does not provide means to store and reuse configuration templates at this time. By default, templates are
created of a specific 'type', such as 'NodeJS'. JetBrains does not allow for greater than one template of a specific
type to co-exist. In other words, creating a Stencil-debugger template would override other NodeJS templates in the IDE
for the project.

As a workaround, it is suggested that individuals create their own Run/Debug configurations. The following settings
are recommended:

Working directory: `~/workspaces/stencil`
JavaScript file: `bin/stencil`
Application parameters: `build --config=PATH_TO_STENCIL_PROJECT_TO_DEBUG`

The `build` application parameter can be swapped with any of the supported Stencil CLI commands. If `--config` is
omitted, Stencil will generate a default configuration file for you.

### Commit Message Format

We strive to adhere to a consistent commit message format that is consistent with the
[Angular variant of Conventional Commits](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-angular),
with a few exceptions.

This enables:
- Anyone to easily understand *what* a commit does without reading the change itself
- The history of changes to the project to be reviewed easily using tools such as `git log`
- Automated tooling to be developed for important, if mundane tasks (e.g. change log generation)

#### Type
Must be one of the following:

* **feat**: A new feature
* **fix**: A bug fix
* **docs**: Documentation only changes
* **style**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
* **refactor**: A code change that neither fixes a bug nor adds a feature
* **perf**: A code change that improves performance
* **test**: Adding missing tests
* **chore**: Changes to the build process or auxiliary tools and libraries such as documentation generation
* **revert**: Reverts a previous commit

#### Scope
The scope can be anything specifying place of the commit change. For example `renderer`, `compiler`, etc.

#### Subject
The subject contains succinct description of the change:

* use the imperative, present tense: "change" not "changed" nor "changes"
* do not capitalize first letter
* do not place a period `.` at the end
* entire length of the subject must not go over 50 characters
* describe what the commit does, not what issue it relates to or fixes
* **be brief, yet descriptive** - we should have a good understanding of what the commit does by reading the subject

#### Footer

If a pull request fixes an open GitHub issue, `fixes: #` + the issue number should be included in the footer.

Members of the Stencil engineering team should take care to add the JIRA ticket associated with a PR in the footer of
the git commit. Community members need not worry about adding a footer.

If your pull request contains a *breaking change*, please add the text 'BREAKING CHANGE:' followed by a brief
description. This description will be used in Stencil's auto-generated changelog under the `BREAKING CHANGES` section.
This syntax must be used over the 'exclamation' syntax that other projects using conventional commits may follow.

Note the newline separating the body from the footer, as well as between the JIRA ticket & 'BREAKING CHANGE:' notice:
```
<BODY>

fixes: #123

STENCIL-13: Watchers Not Firing as Expected when using the Custom Elements Build

BREAKING CHANGE: Watchers may appear to not fire in existing applications, when this is the expected behavior.
```

#### Example

Below is an example commit message that follows the guidance listed above:

```
fix(runtime): prevent watchers from prematurely firing

Wait for the CustomElementRegistry to mark the component as ready
before setting `isWatchReady`. Otherwise, watchers may fire prematurely
if `customElements.get()` or `customElements.whenDefined()` resolve
_before_ Stencil has completed instantiating a component

fixes: #123

STENCIL-13: Watchers Not Firing as Expected when using the Custom Elements Build

BREAKING CHANGE: Watchers may appear to not fire in existing applications, when this is the expected behavior.
```

where:
- the type is "fix"
- the scope is "runtime"
- the PR subject describes _what_ the PR is doing when applied
- the PR body describes _what_ and _why_, rather than _how_
- this PR is a breaking change

### Adding & Updating Documentation

Please see the [stencil-site](https://github.com/stenciljs/site) repo to update documentation.

## License

By contributing your code to this GitHub Repository, you agree to license your contribution under the MIT license.
