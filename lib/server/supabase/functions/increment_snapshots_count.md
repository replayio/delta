```sql
create or replace function increment_snapshots_count(
  job_id uuid
)

returns int2 language sql as $$

UPDATE "Jobs"
SET num_snapshots = num_snapshots + 1
WHERE id = job_id
RETURNING num_snapshots;

$$;
```