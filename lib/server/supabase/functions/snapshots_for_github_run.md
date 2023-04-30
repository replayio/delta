```sql
create or replace function snapshots_for_github_run(
  github_run_id varchar
)

returns setof record language sql as $$

SELECT snapshots.*
FROM "Snapshots" snapshots
  INNER JOIN "Runs" runs ON snapshots.run_id = runs.id
WHERE runs.github_run_id = github_run_id
ORDER BY snapshots.path ASC;

$$;
```
