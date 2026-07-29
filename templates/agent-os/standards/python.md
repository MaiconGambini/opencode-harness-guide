# Python Standard

- Use `uv` for dependency and command execution when present.
- Use explicit type hints for public and internal functions.
- Prefer Pydantic models for external contracts and validation.
- Use Ruff for lint and format.
- Use pytest with named fakes for external I/O.
- Keep service logic separate from HTTP routes, repositories, and adapters.
- Avoid `Any`, untyped `dict`, and broad exceptions.
- Error messages must include the offending value and expected shape.
