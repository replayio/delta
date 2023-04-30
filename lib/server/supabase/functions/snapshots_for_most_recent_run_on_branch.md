```sql
create or replace function snapshots_for_most_recent_run_on_branch(
  project_id uuid,
  branch_name text
)

returns setof record language sql as $$

SELECT *
FROM "Snapshots"
WHERE run_id = (
  SELECT id
  FROM "Runs"
  WHERE branch_id = (
    SELECT id
    FROM "Branches"
      WHERE project_id = project_id
        AND name = branch_name
      ORDER BY created_at DESC
      LIMIT 1
  )
  ORDER BY created_at DESC
  LIMIT 1
);

$$;
```
