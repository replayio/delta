# Replay Delta

### Contributing

```sh
# Install dependencies
yarn install

# If you want to generate diffs locally, you'll also need
brew install graphicsmagick
brew install imagemagick

# Run dev server on port 3000
yarn dev
```

### Resources

- [Supabase](https://app.supabase.com/) - Database, file storage, authentication
- [GitHub webhooks](https://docs.github.com/webhooks-and-events/webhooks/webhook-events-and-payloads) - Primary source of app data
- [GitHub REST API](https://docs.github.com/en/rest) - Used to update PR (status checks, comments)
- [Next.js](https://nextjs.org/) - Hosts front end
- [LogTail](https://logtail.com/) - Error logging

### How does the Delta GitHub app work?

Currently the only app integrated with Delta is the [Replay devtools](https://github.com/replayio/devtools).

For a GitHub repository to integrate with Delta, it must:
1. Create a Project in the Delta Supabase `projects` table (requires admin access)
1. Install the [GitHub “Delta” app](https://github.com/apps/replay-delta)
1. Setup a GitHub Workflow should be setup like [this one](https://github.com/replayio/devtools/blob/main/.github/workflows/delta.yml) to
    - Use Playwright to generate screenshots of UI
    - Upload screenshots to delta (as base64 images)

When a commit is pushed to the primary branch (typically `main`) or a when a PR is opened against that branch:
  - GitHub webhook will notify Delta by posting to *https://delta.replay.io/api/handleGithubEvents*
  - Delta cares specifically about the following events:
    - `“pull_request”`
      - `“opened”` (or `“reopened”`): Creates or updates `branches` record in Supabase
      - `"closed"`: Update `branches` record in Supabase
    - `"workflow_run"` when run for the workflow named “*Delta*” (other workflows are ignored) 
      - `“in_progress”`: Insert `runs` record in Supabase and use GitHub API to create a *check* on the PR
      - `"completed"`: Compares Snapshots from the just-finished Run to those from the most recent run of the Primary branch and uses the GitHub API to update the *check* on PR (and to add/update a comment if images have changed)

At any point, users can view open PRs at [delta.replay.io](https://delta.replay.io/):
  - This app is auto-deployed to Vercel from `main`
  - The app fetches GH actions and screenshot data from Supabase
  - Branches (and GitHub Workflow runs) can be selected from drop-down menus at the top