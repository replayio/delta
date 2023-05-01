import Opaque from "ts-opaque";

export type Project = {
  created_at: string;

  // Database ids and keys
  id: Opaque<"string", Project>;
  short: Opaque<"string", Project>;

  // Cached attributes
  name: string;
  organization: string;
  public: boolean;
  primary_branch: string;
  repository: string;
};
export type ProjectId = Project["id"];
export type ProjectShort = Project["short"];

export type BranchStatus = "closed" | "open";
export type Branch = {
  created_at: string;

  // Database ids and keys
  id: Opaque<"string", Branch>;
  project_id: ProjectId;

  // GitHub API ids
  check_id: Opaque<"string", Branch>;
  comment_id: Opaque<"string", Branch>;

  // Cached attributes
  head_sha: string;
  name: string;
  organization: string;
  pr_number: number;

  // Update in response to Workflow jobs
  status: BranchStatus | null;
};
export type BranchId = Branch["id"];
export type CheckId = Branch["check_id"];
export type CommentId = Branch["comment_id"];

export type RunStatus = "success" | "failure" | "neutral";
export type Run = {
  created_at: string;

  // Database ids and keys
  id: Opaque<"string", Run>;
  branch_id: BranchId;

  // GitHub API ids
  github_run_id: Opaque<"number", Run>;

  // Cached attributes
  actor: string;

  // Updated by RPCs in response to snapshot images being uploaded
  num_snapshots: number;
  num_snapshots_changed: number;

  // Set based on the initial results of running the Workflow
  // Updated based on user actions
  status: RunStatus | null;
};
export type RunId = Run["id"];
export type GithubRunId = Run["github_run_id"];

export type SnapshotStatus = "Duplicate" | "Uploaded";
export type Snapshot = {
  created_at: string;

  // Database ids and keys
  id: Opaque<"string", Snapshot>;
  run_id: RunId;

  // GitHub API ids
  github_job_id: Opaque<"number", Run>;

  // Cached attributes
  // Snapshot file name (as declared in test);
  // Used to associates snapshots between branches
  file: string;
  // Storage path;
  // Used to load image data (base64 string)
  path: string;
  // Storage path;
  // Used to load diff image data (base64 string)
  primary_diff_path?: string;
  // How much this Snapshot differs from the primary branch snapshot
  primary_num_pixels: number;
  // Snapshot (base64) data was uploaded to storage
  // (or if not if a this string has already been uploaded)
  status: SnapshotStatus | null;
};
export type SnapshotId = Snapshot["id"];
export type GithubJobId = Snapshot["github_job_id"];

export type GithubEvent = {
  action: string;
  branch_name?: string;
  check: Object;
  comment: Object;
  event_type: string;
  head_sha: string;
  id: Opaque<"number", GithubEvent>;
  payload: Object;
  pr_number?: string;

  github_job_id?: GithubJobId;
  github_run_id?: GithubRunId;
};
export type GithubEventId = GithubEvent["id"];
