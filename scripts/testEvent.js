const fetch = require("node-fetch");
const chunk = require("lodash/chunk");

async function testEvent(req) {
  let res;

  try {
    res = await fetch(
      //   "https://replay-visuals.vercel.app/api/github-event",
      "http://localhost:3000/api/github-event",

      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-GitHub-Delivery": "9b32b050-8184-11ed-8267-d5a289a274dc",
          "X-GitHub-Event": "workflow_job",
          "X-GitHub-Hook-ID": "393511247",
          "X-GitHub-Hook-Installation-Target-ID": "274973",
          "X-GitHub-Hook-Installation-Target-Type": "integration",
        },
        body: JSON.stringify(req),
      }
    );

    // const json = await body.json();
    if (res.status !== 200) {
      const body = await res.text();
      console.log(res.status, body);
      return body;
    }
    const body = await res.json();
    return body;
  } catch (e) {
    console.error("error", e);
  }
}
(async () => {
  const issuePayload = {
    action: "reopened",
    issue: {
      url: "https://api.github.com/repos/replayio/devtools/issues/7897",
      repository_url: "https://api.github.com/repos/replayio/devtools",
      labels_url:
        "https://api.github.com/repos/replayio/devtools/issues/7897/labels{/name}",
      comments_url:
        "https://api.github.com/repos/replayio/devtools/issues/7897/comments",
      events_url:
        "https://api.github.com/repos/replayio/devtools/issues/7897/events",
      html_url: "https://github.com/replayio/devtools/issues/7897",
      id: 1395630457,
      node_id: "I_kwDOD5HfIc5TL6F5",
      number: 7897,
      title:
        "Reticulating splines/Unable to decode token error message when opening the following replays",
      user: {
        login: "jperl",
        id: 1136652,
        node_id: "MDQ6VXNlcjExMzY2NTI=",
        avatar_url: "https://avatars.githubusercontent.com/u/1136652?v=4",
        gravatar_id: "",
        url: "https://api.github.com/users/jperl",
        html_url: "https://github.com/jperl",
        followers_url: "https://api.github.com/users/jperl/followers",
        following_url:
          "https://api.github.com/users/jperl/following{/other_user}",
        gists_url: "https://api.github.com/users/jperl/gists{/gist_id}",
        starred_url:
          "https://api.github.com/users/jperl/starred{/owner}{/repo}",
        subscriptions_url: "https://api.github.com/users/jperl/subscriptions",
        organizations_url: "https://api.github.com/users/jperl/orgs",
        repos_url: "https://api.github.com/users/jperl/repos",
        events_url: "https://api.github.com/users/jperl/events{/privacy}",
        received_events_url:
          "https://api.github.com/users/jperl/received_events",
        type: "User",
        site_admin: false,
      },
      labels: [
        {
          id: 4146026721,
          node_id: "LA_kwDOD5HfIc73H1jh",
          url: "https://api.github.com/repos/replayio/devtools/labels/qa-wolf",
          name: "qa-wolf",
          color: "ededed",
          default: false,
          description: null,
        },
      ],
      state: "open",
      locked: false,
      assignee: null,
      assignees: [],
      milestone: null,
      comments: 0,
      created_at: "2022-10-04T04:02:37Z",
      updated_at: "2022-12-21T23:10:05Z",
      closed_at: null,
      author_association: "COLLABORATOR",
      active_lock_reason: null,
      body: '🐛 on DevTools\n\nNOTE: This bug seems time sensitive as it will resolve itself later on in the day. As a time reference the errors were first reported 5.7 hours ago from now. Link to suite here. (https://app.qawolf.com/suites/cl8tbf15u91840766sjnxpjczl9?status=fail)\nSteps to recreate:\n• Log into Replay\n• Open one of the following replays\nAirtable Replay\n"/recording/airtable-playwright-test--6847ab82-8b0a-4dc2-af73-eb6bf14918e7?point=12331705040172899620536796682649667&time=5072.277283660569&hasFrames=true"\nvisual studio code replay\n/recording/visual-studio-code-replay-example--e64e05d0-7e55-4165-aa03-0e026335785a\nHello World\n"/recording/hello-world--aae188fb-57d2-46af-a23a-0adba3ed0687?point=2305843009213693954&time=496&hasFrames=false"\n1000 hits\n"/recording/1000-hits--76ff5bc7-fcf7-459b-a711-86b1df46a6f4"\nReact TodoMVC ass replay\n/recording/react-todomvc-ass--a09ba001-9b5c-4976-8bdf-5e8d361f2c81")\nQA Wolf\n/recording/qa-wolf--be0267fe-c058-4fea-b8cd-89bbc4ef7780\\\nTime travel QA8\n/recording/time-travel-qa8--a7576f44-e4d3-46f3-a349-058b65a17046\n\nExpected: Replay to successfully load\nResults: Stuck on reticulating splines message\nLoom link (Reticulating splines):\nhttps://www.loom.com/share/a86fd5b8294f45d899fbfdbf6e18c33b\nReplay Link (Unable to decode token):\nhttps://app.replay.io/recording/airtable-playwright-test--789e971f-ab77-448a-b6cf-d5052850fdf8?point=11358149378275848320960643066757120&time=5437&hasFrames=false\n\nBug report:\nhttps://app.qawolf.com/bug-reports/cl8tod99221823965n8bvyfvanc\n\nAffected tests:\n• View and click comments - https://app.qawolf.com/test/ckwplw54m000808joeya7e1um\n• View DevTools, pause information, settings, docs - https://app.qawolf.com/test/ckwqrl004000508jl8no5ff1r\n• Filter console by errors from user role - https://app.qawolf.com/test/ckz2wtlbn79217551p4n6ik4ccg\n• Filter console by warnings - https://app.qawolf.com/test/ckz2xr1f984214951p4w9uydpnm\n• Filter console by logs on user role - https://app.qawolf.com/test/ckz317xi210610584zm54y50b2fp\n• Assert console error on Replays with 1000+ console messages - https://app.qawolf.com/test/ckz7kni7y16626152qqker2w2a2\n• Advance and rewind callstack from print statement and view callstack as user role - https://app.qawolf.com/test/ckzcww59j162991150mf8l6kh88q\n• Assert unowned replay hides collaborator UI - https://app.qawolf.com/test/ckzd4tpva22704551m21umi4rsx\n• Focus mode: drag handles to select focus region - https://app.qawolf.com/test/cl0ipor5h136667050mjt1n8oboj\n• Assert focused elements show in network tab - https://app.qawolf.com/test/cl0lik2t776316851uw8mlkwalj\n• Assert focused elements show in events - https://app.qawolf.com/test/cl0lj7y6g79749850se1liwa0a6\n• Developer: add/delete non-event comment - https://app.qawolf.com/test/cl1mlpa8s111916550psesuxggc5\n• Developer: change dark mode via settings - https://app.qawolf.com/test/cl1pfh8au153715550qki3l7sl29\n• Developer role can filter console by logs - https://app.qawolf.com/test/cl1xuvvaw97904750nfuk1cdptt\n• Developer role can filter console by warnings - https://app.qawolf.com/test/cl1xv0dck101894350nfm9u62ihc\n• Developer role can filter console by errors - https://app.qawolf.com/test/cl1xvimxm94301850p99ygal2d9\n• Developer role able to edit print statement - https://app.qawolf.com/test/cl1xvs3c3120697050nf63fc94gy\n• Developer: view, advance, and rewind callstack from print statement - https://app.qawolf.com/test/cl1y1zf2d89716651mdkag1cehj',
      reactions: {
        url: "https://api.github.com/repos/replayio/devtools/issues/7897/reactions",
        total_count: 0,
        "+1": 0,
        "-1": 0,
        laugh: 0,
        hooray: 0,
        confused: 0,
        heart: 0,
        rocket: 0,
        eyes: 0,
      },
      timeline_url:
        "https://api.github.com/repos/replayio/devtools/issues/7897/timeline",
      performed_via_github_app: null,
      state_reason: "reopened",
    },
    repository: {
      id: 261218081,
      node_id: "MDEwOlJlcG9zaXRvcnkyNjEyMTgwODE=",
      name: "devtools",
      full_name: "replayio/devtools",
      private: false,
      owner: {
        login: "replayio",
        id: 60818315,
        node_id: "MDEyOk9yZ2FuaXphdGlvbjYwODE4MzE1",
        avatar_url: "https://avatars.githubusercontent.com/u/60818315?v=4",
        gravatar_id: "",
        url: "https://api.github.com/users/replayio",
        html_url: "https://github.com/replayio",
        followers_url: "https://api.github.com/users/replayio/followers",
        following_url:
          "https://api.github.com/users/replayio/following{/other_user}",
        gists_url: "https://api.github.com/users/replayio/gists{/gist_id}",
        starred_url:
          "https://api.github.com/users/replayio/starred{/owner}{/repo}",
        subscriptions_url:
          "https://api.github.com/users/replayio/subscriptions",
        organizations_url: "https://api.github.com/users/replayio/orgs",
        repos_url: "https://api.github.com/users/replayio/repos",
        events_url: "https://api.github.com/users/replayio/events{/privacy}",
        received_events_url:
          "https://api.github.com/users/replayio/received_events",
        type: "Organization",
        site_admin: false,
      },
      html_url: "https://github.com/replayio/devtools",
      description: "Replay.io DevTools",
      fork: false,
      url: "https://api.github.com/repos/replayio/devtools",
      forks_url: "https://api.github.com/repos/replayio/devtools/forks",
      keys_url: "https://api.github.com/repos/replayio/devtools/keys{/key_id}",
      collaborators_url:
        "https://api.github.com/repos/replayio/devtools/collaborators{/collaborator}",
      teams_url: "https://api.github.com/repos/replayio/devtools/teams",
      hooks_url: "https://api.github.com/repos/replayio/devtools/hooks",
      issue_events_url:
        "https://api.github.com/repos/replayio/devtools/issues/events{/number}",
      events_url: "https://api.github.com/repos/replayio/devtools/events",
      assignees_url:
        "https://api.github.com/repos/replayio/devtools/assignees{/user}",
      branches_url:
        "https://api.github.com/repos/replayio/devtools/branches{/branch}",
      tags_url: "https://api.github.com/repos/replayio/devtools/tags",
      blobs_url:
        "https://api.github.com/repos/replayio/devtools/git/blobs{/sha}",
      git_tags_url:
        "https://api.github.com/repos/replayio/devtools/git/tags{/sha}",
      git_refs_url:
        "https://api.github.com/repos/replayio/devtools/git/refs{/sha}",
      trees_url:
        "https://api.github.com/repos/replayio/devtools/git/trees{/sha}",
      statuses_url:
        "https://api.github.com/repos/replayio/devtools/statuses/{sha}",
      languages_url: "https://api.github.com/repos/replayio/devtools/languages",
      stargazers_url:
        "https://api.github.com/repos/replayio/devtools/stargazers",
      contributors_url:
        "https://api.github.com/repos/replayio/devtools/contributors",
      subscribers_url:
        "https://api.github.com/repos/replayio/devtools/subscribers",
      subscription_url:
        "https://api.github.com/repos/replayio/devtools/subscription",
      commits_url:
        "https://api.github.com/repos/replayio/devtools/commits{/sha}",
      git_commits_url:
        "https://api.github.com/repos/replayio/devtools/git/commits{/sha}",
      comments_url:
        "https://api.github.com/repos/replayio/devtools/comments{/number}",
      issue_comment_url:
        "https://api.github.com/repos/replayio/devtools/issues/comments{/number}",
      contents_url:
        "https://api.github.com/repos/replayio/devtools/contents/{+path}",
      compare_url:
        "https://api.github.com/repos/replayio/devtools/compare/{base}...{head}",
      merges_url: "https://api.github.com/repos/replayio/devtools/merges",
      archive_url:
        "https://api.github.com/repos/replayio/devtools/{archive_format}{/ref}",
      downloads_url: "https://api.github.com/repos/replayio/devtools/downloads",
      issues_url:
        "https://api.github.com/repos/replayio/devtools/issues{/number}",
      pulls_url:
        "https://api.github.com/repos/replayio/devtools/pulls{/number}",
      milestones_url:
        "https://api.github.com/repos/replayio/devtools/milestones{/number}",
      notifications_url:
        "https://api.github.com/repos/replayio/devtools/notifications{?since,all,participating}",
      labels_url:
        "https://api.github.com/repos/replayio/devtools/labels{/name}",
      releases_url:
        "https://api.github.com/repos/replayio/devtools/releases{/id}",
      deployments_url:
        "https://api.github.com/repos/replayio/devtools/deployments",
      created_at: "2020-05-04T15:09:06Z",
      updated_at: "2022-12-18T19:42:03Z",
      pushed_at: "2022-12-21T16:59:25Z",
      git_url: "git://github.com/replayio/devtools.git",
      ssh_url: "git@github.com:replayio/devtools.git",
      clone_url: "https://github.com/replayio/devtools.git",
      svn_url: "https://github.com/replayio/devtools",
      homepage: "https://replay.io",
      size: 135619,
      stargazers_count: 378,
      watchers_count: 378,
      language: "TypeScript",
      has_issues: true,
      has_projects: true,
      has_downloads: true,
      has_wiki: true,
      has_pages: false,
      has_discussions: true,
      forks_count: 74,
      mirror_url: null,
      archived: false,
      disabled: false,
      open_issues_count: 73,
      license: {
        key: "other",
        name: "Other",
        spdx_id: "NOASSERTION",
        url: null,
        node_id: "MDc6TGljZW5zZTA=",
      },
      allow_forking: true,
      is_template: false,
      web_commit_signoff_required: false,
      topics: [],
      visibility: "public",
      forks: 74,
      open_issues: 73,
      watchers: 378,
      default_branch: "main",
    },
    organization: {
      login: "replayio",
      id: 60818315,
      node_id: "MDEyOk9yZ2FuaXphdGlvbjYwODE4MzE1",
      url: "https://api.github.com/orgs/replayio",
      repos_url: "https://api.github.com/orgs/replayio/repos",
      events_url: "https://api.github.com/orgs/replayio/events",
      hooks_url: "https://api.github.com/orgs/replayio/hooks",
      issues_url: "https://api.github.com/orgs/replayio/issues",
      members_url: "https://api.github.com/orgs/replayio/members{/member}",
      public_members_url:
        "https://api.github.com/orgs/replayio/public_members{/member}",
      avatar_url: "https://avatars.githubusercontent.com/u/60818315?v=4",
      description: "",
    },
    sender: {
      login: "jasonLaster",
      id: 254562,
      node_id: "MDQ6VXNlcjI1NDU2Mg==",
      avatar_url: "https://avatars.githubusercontent.com/u/254562?v=4",
      gravatar_id: "",
      url: "https://api.github.com/users/jasonLaster",
      html_url: "https://github.com/jasonLaster",
      followers_url: "https://api.github.com/users/jasonLaster/followers",
      following_url:
        "https://api.github.com/users/jasonLaster/following{/other_user}",
      gists_url: "https://api.github.com/users/jasonLaster/gists{/gist_id}",
      starred_url:
        "https://api.github.com/users/jasonLaster/starred{/owner}{/repo}",
      subscriptions_url:
        "https://api.github.com/users/jasonLaster/subscriptions",
      organizations_url: "https://api.github.com/users/jasonLaster/orgs",
      repos_url: "https://api.github.com/users/jasonLaster/repos",
      events_url: "https://api.github.com/users/jasonLaster/events{/privacy}",
      received_events_url:
        "https://api.github.com/users/jasonLaster/received_events",
      type: "User",
      site_admin: false,
    },
    installation: {
      id: 32444723,
      node_id: "MDIzOkludGVncmF0aW9uSW5zdGFsbGF0aW9uMzI0NDQ3MjM=",
    },
  };

  const workflowPayload = {
    action: "queued",
    workflow_job: {
      id: 10242811218,
      run_id: 3743817551,
      workflow_name: "Tests: Playwright",
      head_branch: "visuals5",
      run_url:
        "https://api.github.com/repos/replayio/devtools/actions/runs/3743817551",
      run_attempt: 6,
      node_id: "CR_kwDOD5HfIc8AAAACYoTlUg",
      head_sha: "c412f1a4b953c940964e0913a3fefbcca6c25096",
      url: "https://api.github.com/repos/replayio/devtools/actions/jobs/10242811218",
      html_url:
        "https://github.com/replayio/devtools/actions/runs/3743817551/jobs/6376783860",
      status: "queued",
      conclusion: null,
      started_at: "2022-12-21T23:07:56Z",
      completed_at: null,
      name: "run_tests",
      steps: [],
      check_run_url:
        "https://api.github.com/repos/replayio/devtools/check-runs/10242811218",
      labels: ["ubuntu-latest"],
      runner_id: null,
      runner_name: null,
      runner_group_id: null,
      runner_group_name: null,
    },
    repository: {
      id: 261218081,
      node_id: "MDEwOlJlcG9zaXRvcnkyNjEyMTgwODE=",
      name: "devtools",
      full_name: "replayio/devtools",
      private: false,
      owner: {
        login: "replayio",
        id: 60818315,
        node_id: "MDEyOk9yZ2FuaXphdGlvbjYwODE4MzE1",
        avatar_url: "https://avatars.githubusercontent.com/u/60818315?v=4",
        gravatar_id: "",
        url: "https://api.github.com/users/replayio",
        html_url: "https://github.com/replayio",
        followers_url: "https://api.github.com/users/replayio/followers",
        following_url:
          "https://api.github.com/users/replayio/following{/other_user}",
        gists_url: "https://api.github.com/users/replayio/gists{/gist_id}",
        starred_url:
          "https://api.github.com/users/replayio/starred{/owner}{/repo}",
        subscriptions_url:
          "https://api.github.com/users/replayio/subscriptions",
        organizations_url: "https://api.github.com/users/replayio/orgs",
        repos_url: "https://api.github.com/users/replayio/repos",
        events_url: "https://api.github.com/users/replayio/events{/privacy}",
        received_events_url:
          "https://api.github.com/users/replayio/received_events",
        type: "Organization",
        site_admin: false,
      },
      html_url: "https://github.com/replayio/devtools",
      description: "Replay.io DevTools",
      fork: false,
      url: "https://api.github.com/repos/replayio/devtools",
      forks_url: "https://api.github.com/repos/replayio/devtools/forks",
      keys_url: "https://api.github.com/repos/replayio/devtools/keys{/key_id}",
      collaborators_url:
        "https://api.github.com/repos/replayio/devtools/collaborators{/collaborator}",
      teams_url: "https://api.github.com/repos/replayio/devtools/teams",
      hooks_url: "https://api.github.com/repos/replayio/devtools/hooks",
      issue_events_url:
        "https://api.github.com/repos/replayio/devtools/issues/events{/number}",
      events_url: "https://api.github.com/repos/replayio/devtools/events",
      assignees_url:
        "https://api.github.com/repos/replayio/devtools/assignees{/user}",
      branches_url:
        "https://api.github.com/repos/replayio/devtools/branches{/branch}",
      tags_url: "https://api.github.com/repos/replayio/devtools/tags",
      blobs_url:
        "https://api.github.com/repos/replayio/devtools/git/blobs{/sha}",
      git_tags_url:
        "https://api.github.com/repos/replayio/devtools/git/tags{/sha}",
      git_refs_url:
        "https://api.github.com/repos/replayio/devtools/git/refs{/sha}",
      trees_url:
        "https://api.github.com/repos/replayio/devtools/git/trees{/sha}",
      statuses_url:
        "https://api.github.com/repos/replayio/devtools/statuses/{sha}",
      languages_url: "https://api.github.com/repos/replayio/devtools/languages",
      stargazers_url:
        "https://api.github.com/repos/replayio/devtools/stargazers",
      contributors_url:
        "https://api.github.com/repos/replayio/devtools/contributors",
      subscribers_url:
        "https://api.github.com/repos/replayio/devtools/subscribers",
      subscription_url:
        "https://api.github.com/repos/replayio/devtools/subscription",
      commits_url:
        "https://api.github.com/repos/replayio/devtools/commits{/sha}",
      git_commits_url:
        "https://api.github.com/repos/replayio/devtools/git/commits{/sha}",
      comments_url:
        "https://api.github.com/repos/replayio/devtools/comments{/number}",
      issue_comment_url:
        "https://api.github.com/repos/replayio/devtools/issues/comments{/number}",
      contents_url:
        "https://api.github.com/repos/replayio/devtools/contents/{+path}",
      compare_url:
        "https://api.github.com/repos/replayio/devtools/compare/{base}...{head}",
      merges_url: "https://api.github.com/repos/replayio/devtools/merges",
      archive_url:
        "https://api.github.com/repos/replayio/devtools/{archive_format}{/ref}",
      downloads_url: "https://api.github.com/repos/replayio/devtools/downloads",
      issues_url:
        "https://api.github.com/repos/replayio/devtools/issues{/number}",
      pulls_url:
        "https://api.github.com/repos/replayio/devtools/pulls{/number}",
      milestones_url:
        "https://api.github.com/repos/replayio/devtools/milestones{/number}",
      notifications_url:
        "https://api.github.com/repos/replayio/devtools/notifications{?since,all,participating}",
      labels_url:
        "https://api.github.com/repos/replayio/devtools/labels{/name}",
      releases_url:
        "https://api.github.com/repos/replayio/devtools/releases{/id}",
      deployments_url:
        "https://api.github.com/repos/replayio/devtools/deployments",
      created_at: "2020-05-04T15:09:06Z",
      updated_at: "2022-12-18T19:42:03Z",
      pushed_at: "2022-12-21T16:59:25Z",
      git_url: "git://github.com/replayio/devtools.git",
      ssh_url: "git@github.com:replayio/devtools.git",
      clone_url: "https://github.com/replayio/devtools.git",
      svn_url: "https://github.com/replayio/devtools",
      homepage: "https://replay.io",
      size: 135619,
      stargazers_count: 378,
      watchers_count: 378,
      language: "TypeScript",
      has_issues: true,
      has_projects: true,
      has_downloads: true,
      has_wiki: true,
      has_pages: false,
      has_discussions: true,
      forks_count: 74,
      mirror_url: null,
      archived: false,
      disabled: false,
      open_issues_count: 73,
      license: {
        key: "other",
        name: "Other",
        spdx_id: "NOASSERTION",
        url: null,
        node_id: "MDc6TGljZW5zZTA=",
      },
      allow_forking: true,
      is_template: false,
      web_commit_signoff_required: false,
      topics: [],
      visibility: "public",
      forks: 74,
      open_issues: 73,
      watchers: 378,
      default_branch: "main",
    },
    organization: {
      login: "replayio",
      id: 60818315,
      node_id: "MDEyOk9yZ2FuaXphdGlvbjYwODE4MzE1",
      url: "https://api.github.com/orgs/replayio",
      repos_url: "https://api.github.com/orgs/replayio/repos",
      events_url: "https://api.github.com/orgs/replayio/events",
      hooks_url: "https://api.github.com/orgs/replayio/hooks",
      issues_url: "https://api.github.com/orgs/replayio/issues",
      members_url: "https://api.github.com/orgs/replayio/members{/member}",
      public_members_url:
        "https://api.github.com/orgs/replayio/public_members{/member}",
      avatar_url: "https://avatars.githubusercontent.com/u/60818315?v=4",
      description: "",
    },
    sender: {
      login: "jasonLaster",
      id: 254562,
      node_id: "MDQ6VXNlcjI1NDU2Mg==",
      avatar_url: "https://avatars.githubusercontent.com/u/254562?v=4",
      gravatar_id: "",
      url: "https://api.github.com/users/jasonLaster",
      html_url: "https://github.com/jasonLaster",
      followers_url: "https://api.github.com/users/jasonLaster/followers",
      following_url:
        "https://api.github.com/users/jasonLaster/following{/other_user}",
      gists_url: "https://api.github.com/users/jasonLaster/gists{/gist_id}",
      starred_url:
        "https://api.github.com/users/jasonLaster/starred{/owner}{/repo}",
      subscriptions_url:
        "https://api.github.com/users/jasonLaster/subscriptions",
      organizations_url: "https://api.github.com/users/jasonLaster/orgs",
      repos_url: "https://api.github.com/users/jasonLaster/repos",
      events_url: "https://api.github.com/users/jasonLaster/events{/privacy}",
      received_events_url:
        "https://api.github.com/users/jasonLaster/received_events",
      type: "User",
      site_admin: false,
    },
    installation: {
      id: 32444723,
      node_id: "MDIzOkludGVncmF0aW9uSW5zdGFsbGF0aW9uMzI0NDQ3MjM=",
    },
  };

  const res = await testEvent(workflowPayload);
  console.log(res);
})();
