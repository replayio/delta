import { Branch, Project } from "../../types";
import { getOctokit } from "./octokit";
import { PullRequest } from "./types";

export async function getPulls(organization: string, repository: string) {
  const octokit = await getOctokit();
  const response = await octokit.request(
    `GET /repos/${organization}/${repository}/pulls`,
    {
      organization,
      repo: repository,
    }
  );

  return response.data as PullRequest[];
}

export async function findPullRequestForProjectAndUserAndBranch(
  project: Project,
  userLogin: string,
  branchName: string
): Promise<PullRequest | null> {
  const pulls = await getPulls(project.organization, project.repository);
  return (
    pulls.find(
      (pull) => pull.user?.login === userLogin && pull.head.ref === branchName
    ) ?? null
  );
}
