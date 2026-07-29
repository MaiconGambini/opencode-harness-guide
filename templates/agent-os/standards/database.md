# Database Standard

- Migrations must be reversible when practical.
- Enforce invariants with database constraints, not only app code.
- Add indexes for new query paths.
- Keep repository queries explicit and testable.
- Use transactions for multi-write operations.
- Consider race safety for upserts and job claiming.
- Verify migrations with upgrade and downgrade commands when possible.
