```sql
create or replace function snapshots_for_run(
  run_id varchar
)

returns setof record language sql as $$

SELECT snapshots.*
FROM "Snapshots" snapshots
  INNER JOIN "Jobs" jobs ON snapshots.job_id = jobs.id
WHERE jobs.run_id = run_id
ORDER BY snapshots.path ASC;

$$;
```
