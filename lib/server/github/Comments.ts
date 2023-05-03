import dotenv from "dotenv";
import { GithubCommentId } from "../../types";
import { getOctokit } from "./octokit";
import { IssueComment } from "./types";

dotenv.config({ path: "./.env.local" });

export async function createComment(
  organization: string,
  repository: string,
  pullRequestNumber: number,
  { body } = { body: "..." }
) {
  const octokit = await getOctokit();
  const response = await octokit.request(
    `POST /repos/${organization}/${repository}/issues/${pullRequestNumber}/comments`,
    {
      organization,
      repo: repository,
      issue_number: pullRequestNumber,
      body,
    }
  );

  return response.data as IssueComment;
}

export async function updateComment(
  organization: string,
  repository: string,
  commentId: GithubCommentId,
  { body }
) {
  const octokit = await getOctokit();
  const response = await octokit.request(
    `PATCH /repos/${organization}/${repository}/issues/comments/${commentId}`,
    {
      organization,
      repo: repository,
      comment_id: commentId,
      body,
    }
  );

  return response.data as IssueComment;
}
