```sql
create or replace function snapshots_for_most_recent_job_on_branch(
  project_id uuid,
  branch_name text
)

returns setof record language sql as $$

SELECT snapshots.*
FROM "Snapshots" snapshots
  INNER JOIN "Jobs"     jobs      ON snapshots.job_id = jobs.id
  INNER JOIN "Branches" branches  ON jobs.branch_id = branches.id
  INNER JOIN "Projects" projects  ON branches.project_id = projects.id
WHERE projects.id = project_id
AND branches.name = branch_name
ORDER BY snapshots.file ASC;

$$;
```