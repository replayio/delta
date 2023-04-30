```sql
create or replace function increment_snapshots_changed_count(
  job_id uuid
)

returns int2 language sql as $$

UPDATE "Jobs"
SET num_snapshots_changed = num_snapshots_changed + 1
WHERE id = job_id
RETURNING num_snapshots_changed;

$$;
```