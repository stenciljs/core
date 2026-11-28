# Changesets

This project uses [changesets](https://github.com/changesets/changesets) for version management and changelog generation.

## Adding a changeset

When you make a change that should be released, run:

```bash
pnpm changeset
```

This will prompt you to:
1. Select which packages are affected
2. Choose the bump type (patch/minor/major)
3. Write a summary of the changes

## Lockstep versioning

All `@stencil/*` packages are configured for **lockstep versioning** - they will always have the same version number. When any package changes, all packages are bumped together.

## Release process

1. Changesets accumulate in `.changeset/` as PRs are merged
2. When ready to release, run `pnpm changeset:version` to consume changesets and bump versions
3. Review the generated CHANGELOG.md files
4. Run `pnpm changeset:publish` to publish all packages
