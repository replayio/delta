import Opaque from "ts-opaque";

export type Project = {
  created_at: string;
  id: Opaque<"number", Project>;
  name: string;
  organization: string;
  public: boolean;
  primary_branch: string;
  repository: string;
  slug: Opaque<"string", Project>;
};
export type ProjectId = Project["id"];
export type ProjectSlug = Project["slug"];

export type Branch = {
  created_at: string;
  id: Opaque<"number", Branch>;
  name: string;
  organization: string;
  project_id: ProjectId;
};
export type BranchId = Branch["id"];

export type PullRequestStatus = "closed" | "open";
export type PullRequest = {
  branch_id: BranchId;
  created_at: string;
  id: Opaque<"number", PullRequest>;

  // Github API
  github_check_id: Opaque<"number", PullRequest> | null;
  github_comment_id: Opaque<"number", PullRequest> | null;
  github_head_sha: string;
  github_pr_number: number;
  github_status: PullRequestStatus;
};
export type PullRequestId = PullRequest["id"];
export type GithubCheckId = PullRequest["github_check_id"];
export type GithubCommentId = PullRequest["github_comment_id"];

export type RunStatus = "queued" | "completed";
export type Run = {
  created_at: string;
  id: Opaque<"number", Run>;
  pull_request_id: PullRequestId;

  // Github API
  github_actor: string;
  github_run_id: Opaque<"number", Run>;
  github_status: RunStatus;

  // Workflow API
  delta_has_user_approval: boolean;
};
export type RunId = Run["id"];
export type GithubRunId = Run["github_run_id"];

export type Snapshot = {
  created_at: string;
  id: Opaque<"number", Snapshot>;
  run_id: RunId;

  // GitHub API
  github_run_id: Opaque<"number", Run>;

  // Workflow API
  delta_file: string;
  delta_path: string;
};
export type SnapshotId = Snapshot["id"];

export type GithubEventType =
  | "check_run"
  | "check_suite"
  | "issues"
  | "pull_request"
  | "workflow_job"
  | "workflow_run";

export type GithubEvent = {
  created_at: string;
  id: Opaque<"number", GithubEvent>;
  payload: Object;
  project_id: ProjectId;
  type: GithubEventType;
};
export type GithubEventId = GithubEvent["id"];

export type ErrorLog = {
  created_at: string;
  delta_error_code: number;
  http_status_code: number;
  id: Opaque<"number", ErrorLog>;
  message: string;
  parsed_stack: Object;
};
export type ErrorLogId = ErrorLog["id"];
