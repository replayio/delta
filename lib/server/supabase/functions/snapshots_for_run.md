TODO [FE-1432] Rename 'github_run_id' param to 'run_id' and replace with `SELECT snapshots.*` once `run_id` attribute removed.

```sql
create or replace function snapshots_for_run(
  github_run_id varchar
)

returns setof record language sql as $$

SELECT snapshots.created_at,
       snapshots.id,
       snapshots.job_id,
       snapshots.file,
       snapshots.path,
       snapshots.primary_diff_path,
       snapshots.status
FROM "Snapshots" snapshots
  INNER JOIN "Jobs" jobs ON snapshots.job_id = jobs.id
WHERE jobs.run_id = github_run_id
ORDER BY snapshots.path ASC;

$$;
```
