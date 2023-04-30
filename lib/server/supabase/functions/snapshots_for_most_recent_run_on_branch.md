```sql
create or replace function snapshots_for_most_recent_run_on_branch(
  project_id uuid,
  branch_name text
)

returns setof record language sql as $$

SELECT snapshots.*
FROM "Snapshots" snapshots
  INNER JOIN "Runs"     runs      ON snapshots.job_id = runs.id
  INNER JOIN "Branches" branches  ON runs.branch_id = branches.id
WHERE branches.project_id = project_id
  AND branches.name = branch_name
ORDER BY snapshots.file ASC;

$$;
```