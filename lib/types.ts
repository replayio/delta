import { WorkflowRun } from "@octokit/webhooks-types";
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

export type PullRequestStatus = "closed" | "open";
export type Branch = {
  created_at: string;
  id: Opaque<"number", Branch>;
  name: string;
  organization: string;
  project_id: ProjectId;

  // Github API
  github_pr_comment_id: Opaque<"number", Branch> | null;
  github_pr_number: number | null;
  github_pr_status: PullRequestStatus;
};
export type BranchId = Branch["id"];
export type GithubCommentId = Branch["github_pr_comment_id"];

export type RunStatus = "pending" | "completed";
export type Run = {
  created_at: string;
  id: Opaque<"number", Run>;
  branch_id: BranchId;

  // Github API
  github_actor: string | null;
  github_check_id: Opaque<"number", Run> | null;
  github_conclusion: WorkflowRun["conclusion"] | null;
  github_run_id: Opaque<"number", Run>;
  github_status: RunStatus;

  // Workflow API
  delta_has_user_approval: boolean;
};
export type RunId = Run["id"];
export type GithubCheckId = Run["github_check_id"];
export type GithubConclusion = Run["github_conclusion"];
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
  action: string;
  branch_id: BranchId | null;
  created_at: string;
  handled: boolean;
  id: Opaque<"number", GithubEvent>;
  payload: Object;
  project_id: ProjectId | null;
  threw: boolean;
  type: GithubEventType;
};
export type GithubEventId = GithubEvent["id"];

export type ErrorLog = {
  created_at: string;
  delta_error_code: number;
  http_status_code: number;
  id: Opaque<"number", ErrorLog>;
  message: string;
  request_body: Object | null;
  request_headers: Object | null;
  request_method: string | null;
  request_url: string | null;
  stack: string | null;
};
export type ErrorLogId = ErrorLog["id"];

export function isProjectId(
  value: ProjectId | ProjectSlug
): value is ProjectId {
  return value != null && typeof value === "number";
}
export function isProjectSlug(
  value: ProjectId | ProjectSlug
): value is ProjectSlug {
  return value != null && typeof value === "string";
}
