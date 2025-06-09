# Releasing Stencil

Stencil can either be released by CI/CD (via GitHub Actions), or manually.
An automated release is the preferred way of creating a new release of the project.
Manual releases should only be performed when there are extenuating circumstances preventing an automated release.

## Automated Releases

1. Call a `code-freeze` in the Stencil team channel
1. Check that [Stencil's Merge
   Queue](https://github.com/stenciljs/core/queue/) is empty (nothing is
   queued for merge).
1. Run the [Stencil Production Release PR Creation Workflow](https://github.com/stenciljs/core/actions/workflows/create-production-pr.yml)
   in GitHub
    1. Run the workflow from the `main` branch, _unless_ the release is for a previous major version of Stencil.
       In that scenario, select the `v#-maintenance` branch corresponding to the version of Stencil being released.
       For example, `v3-maintenance` to release a new version of Stencil v3.
    1. Stencil follows semantic versioning. Select the appropriate version from the dropdown for this release.
    1. Hit "Run Workflow" and wait for a new pull request to be created.
1. Navigate to the pull request that was opened as a result of running the Stencil Production Release PR Creation Workflow.
1. Complete the following (temporary) steps:
    1. Close the pull request and reopen it. This allows actions that the team gates pull requests on to run.
    1. Mark the pull request as ready for review.
1. Ask the Stencil team for an approval on the PR.
   Only one approval is required for pull requests that only include the version bump/prerelease commit.
1. Once approved, add it to the merge queue.
1. ⚠️ Wait for the pull request to land before continuing to the next step. ⚠️
1. Run the [Stencil Production Release Workflow](https://github.com/stenciljs/core/actions/workflows/release-production.yml)
    1. Stencil should be published under the `latest` tag, _unless_ the release is for a previous major version of
     Stencil.
    1. The base branch should be set to `main`, _unless_ the release is for a previous major version of Stencil.
    1. Tail the logs to verify everything runs successfully.
1. Proceed to the [Follow-Up section](#follow-up-steps) of this document to run manual follow-up tasks.

## Manual Releases

⚠️ Manual releases should only be performed when there are extenuating circumstances that prevent an automated one from occurring ⚠️

✍️ Authoring permissions are needed for an individual to perform a manual release. If needed, please ping Ionic leadership. ✍️

1. Call a `code-freeze` in the Stencil team channel
1. Run `npm run clean` locally to clear out any cached build artifacts.
1. Run `npm run release.prepare`. This will install dependencies, bundle Stencil, run tests, etc.
1. Check the [CHANGELOG.md](../CHANGELOG.md) and make sure it includes all the changes that have landed since the last 
release.
1. Commit the changes - use the commit message '<emoji> v<VERSION>'. e.g. `git commit -m '🤦‍ v2.7.0'` (note the emoji is 
used literally, as opposed to ':facepalm:').
1. Run `npm run release`, which will push the commit/tag to GitHub and publish to NPM.
1. Proceed to the [Follow-Up section](#follow-up-steps) of this document to run manual follow-up tasks.

# Follow-Up Steps

The following steps should be always run, regardless of whether an automated or
manual release was performed.

1. Publish the release notes in GitHub using GitHub's [release notes form](https://github.com/stenciljs/core/releases/new).
   1. Set the tag dropdown to the newly-released version's git tag
   1. Set the version title to `[VERMOJI] v[VERSION] ([yyyy.mm.dd])`.
      For example, v4.2.0 has a vermoji of 🌲, and was released on 2023.09.05.
      As a result, it was [released with the title](https://github.com/stenciljs/core/releases/tag/v4.2.0) of 🌲 4.2.0 (2023-09-05).
   1. Copy the raw contents of [CHANGELOG.md](./CHANGELOG.md) into the body
   1. Ensure that the release is set as the latest (so long as we're not published a pre-release)
   1. If anyone from the community contributed commit(s) to this release,
      append the following to the end of the GitHub release notes:

      ```md
      ## Thanks

      🎉 Thanks <GitHub_Usernames> for their contributions! 🎉
      ```
   1. Hit "Publish Release"    
1. Navigate to the [Stencil Site](https://github.com/stenciljs/site/pulls) repository and:
   1. Merge any open PRs containing documentation that has been approved, but
      not merged that is related to the release. Such PRs should be labelled as
      `do not merge: waiting for next stencil release`. It's a good idea to
      review _all_ PRs though, just in case.
   1. If the current release is a major or minor version, open a pull request
     creating a new version of the docs by following the [guide in the
     stencil-site
     repo](https://github.com/stenciljs/site/blob/main/RELEASE.md#creating-a-new-version-section).
1. If there are any 'next' branches in GitHub, say for a future major version of Stencil (e.g. `v5.0.0-dev`), now is a
   good time to rebase them against the `main` branch.
1. End the code freeze in the Stencil team Slack channel.
1. Perform the following tasks in JIRA:
   1. Ask someone with appropriate permissions to mark this version of Stencil as 'released' in JIRA on the 'Releases' page.
   1. Ask someone with appropriate permissions to stub out the next release and task for the release in JIRA.
1. Ensure all GitHub Issues associated with stories/tasks that shipped in this version of Stencil are closed.
   1. For each issue, add a comment stating the version of Stencil that
      included the fix/feature (be sure to update the version number _and_
      tag):
      
      ```md
      The fix for this issue has been released as a part of today's [Stencil
      vNUMBER release](https://github.com/stenciljs/core/releases/tag/TAG). 
      ```
1. If there's a blog post to go out (either today or this week), let the folks in the `#ask-ionic-devrel` channel know about the release and that the blog can go out.
When the blog goes out, put an announcement in the `#announcements` channel in Discord.
