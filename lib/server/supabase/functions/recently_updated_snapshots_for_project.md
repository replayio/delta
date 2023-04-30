```sql
create or replace function recently_updated_snapshots_for_project(
  project_id uuid,
  after_created_at date,
  max_limit numeric
)

returns setof record language sql as $$

SELECT snapshots.*
FROM "Snapshots" snapshots
  INNER JOIN "Runs"     runs      ON snapshots.run_id = runs.id
  INNER JOIN "Branches" branches  ON runs.branch_id = branches.id
  INNER JOIN "Projects" projects  ON branches.project_id = projects.id
WHERE projects.id = project_id
  AND snapshots.primary_num_pixels != 0
  AND snapshots.primary_diff_path != ''
  AND snapshots.created_at >= after_created_at
ORDER BY snapshots.path, snapshots.created_at DESC
LIMIT max_limit;

$$;
```