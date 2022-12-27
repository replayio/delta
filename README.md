# Replay Delta

## Resources

- **Local Development** `yarn; yarn dev`
- **Frontend** Next.js
- **APIs** Next.js [APIs](https://github.com/replayio/visuals/tree/main/pages/api)
- **Database** Supabase [Table Editor](https://app.supabase.com/project/cqerexxkkntrurcacozk/editor)
- **Storage** Supabase [Snapshots](https://app.supabase.com/project/cqerexxkkntrurcacozk/storage/buckets/snapshots)
- **Authentication** Supabase
- **Logs** [LogTail](https://logtail.com/team/129603/tail?rf=1671873260000&s=216756)
- **GitHub App** [Visuals App](https://github.com/organizations/replayio/settings/apps/replay-visuals)

## Concepts

- Snapshot - metadata about an image
- Action - 1.1. w/ a GitHub Action
- Branch - 1.1 w/ a GitHub Branch
- Project - your basic team, workspace, etc...
- GitHub Event - a GitHub webhook event
- Check Run - a GitHub check that we create to update the status

Table relationships

- Branches belong to a project
- Actions belong to a branch
- Snapshots belong to an action

## Flows

1. PR Opens

- [ ] We create a branch

2. PR Closes

- [ ] We mark the branch closed

3. Action is run on main

- We create an action
- We upload all the snapshots
- We update all of the open branches

3. Action is run on a branch

- We create an action
- We create a check if needed
- We upload all the snapshots
- We update the current branch
- We update the check

4. User views a branch

- We fetch the status for the branch
- We fetch the snapshots for the latest branch
- We show the before / after for the selected snapshot

---

- We want to move DevTools APIs to GH Event handlers
