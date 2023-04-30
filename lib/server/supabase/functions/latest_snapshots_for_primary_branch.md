```sql
create or replace function latest_snapshots_for_primary_branch(
  project_id uuid
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
        AND status = 'open'
        AND organization = (
          SELECT organization
          FROM "Projects"
          WHERE id = project_id
        )
        AND name = (
          SELECT primary_branch
          FROM "Projects"
          WHERE id = project_id
        )
      ORDER BY created_at DESC
      LIMIT 1
  )
  ORDER BY created_at DESC
  LIMIT 1
);

$$;
```