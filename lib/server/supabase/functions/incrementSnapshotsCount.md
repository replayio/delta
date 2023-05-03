```sql
create or replace function increment_snapshots_count(
  run_id uuid
)

returns int2 language sql as $$

UPDATE runs
SET num_snapshots = num_snapshots + 1
WHERE id = run_id
RETURNING num_snapshots;

$$;
```