# Functional Programming Standard

- Prefer pure business functions with explicit inputs and outputs.
- Keep I/O at boundaries: controllers, repositories, adapters, or server routes.
- Inject dependencies through parameters or constructors.
- Avoid hidden global state and shared mutable state.
- Prefer immutable transformations and small composable functions.
- Use early returns and maximum two indentation levels.
- Business logic must be testable without network, database, filesystem, or framework runtime.
