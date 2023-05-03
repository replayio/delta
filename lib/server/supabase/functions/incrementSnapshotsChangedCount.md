```sql
create or replace function increment_snapshots_changed_count(
  run_id uuid
)

returns int2 language sql as $$

UPDATE runs
SET num_snapshots_changed = num_snapshots_changed + 1
WHERE id = run_id
RETURNING num_snapshots_changed;

$$;
```