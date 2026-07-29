---
name: wstg-api-testing
description: Use when testing API security, REST API testing, GraphQL security, API authentication, API authorization, API rate limiting, API input validation, or web service security during a penetration test or security assessment. Covers OWASP WSTG v4.2 API Testing methodology including introspection abuse, injection, DoS, batching attacks, and underlying API exposure.
---

# OWASP WSTG v4.2 — API Testing

Follow the methodology below to systematically test GraphQL APIs for the vulnerabilities described in the OWASP Web Security Testing Guide v4.2. GraphQL eliminates traditional REST endpoint sprawl but introduces its own attack surface: introspectable schemas, recursive queries, batched operations, and a lack of built-in authorization and input validation.

GraphQL bridges to backend APIs and databases. Every flaw you would test for in REST or SQL applies here, but the entry point looks different. Use the schema as your map.

---

## Quick-Reference: Test Cases

| ID | Objective |
|---|---|
| WSTG-APIT-01 | Testing GraphQL — Assess that a secure, production-ready configuration is deployed. Validate all input fields against generic attacks. Ensure proper access controls are applied. |

---

## WSTG-APIT-01 — Testing GraphQL

### Summary

GraphQL provides schema introspection, nested objects, and flexible queries. These features accelerate development but expose applications to attack vectors unique to GraphQL (introspection queries, recursive DoS, batching) as well as generic API attacks (SQL injection, XSS). Authorization is not enforced by GraphQL itself — the application layer must implement it.

### Objectives

- Assess that a secure and production-ready GraphQL configuration is deployed.
- Validate all input fields against generic injection attacks.
- Ensure proper access controls are enforced on every resolver.

---

### 1. Introspection Queries

**Why it matters:** Introspection is GraphQL's self-documentation mechanism. It exposes every type, query, mutation, subscription, field, argument, and directive. An attacker armed with the full schema knows exactly what data is available, what mutations exist, and where sensitive fields (tokens, passwords, PII) live.

#### Methodology

1. Send an HTTP POST to the GraphQL endpoint with a full introspection query against `__schema`. Collect `queryType`, `mutationType`, `subscriptionType`, all `types`, their `fields` (including deprecated), `inputFields`, `enumValues`, and `directives`.
2. Visualize the schema using a tool like GraphQL Voyager to build an entity-relationship diagram. Identify relationships: which objects reference each other, where nested queries can recurse, and where sensitive fields appear.
3. Check whether the GraphQL endpoint exposes a GraphiQL or GraphQL Playground interface in production. These IDEs build documentation panels from introspection data and should never be reachable in production.
4. If introspection is disabled, attempt to extract schema information through error messages. GraphQL error responses often leak type names, field names, and expected argument types — each piece builds a fragment of the schema.

#### What to look for

- Introspection returning the complete schema without authentication or authorization.
- GraphiQL or Playground accessible in production environments.
- Error messages that reveal field names, type names, or argument expectations.
- Mutations that accept or return sensitive data (API tokens, session identifiers, PII) visible in the schema.

#### Remediation

- Restrict introspection to authenticated and authorized users only.
- Disable GraphiQL and Playground in production entirely.
- Return generic error messages that do not disclose type or field information.
- Apply strict access control on the schema endpoint — some tools may break if introspection is fully disabled, so prefer role-based restriction.

---

### 2. Authorization

**Why it matters:** GraphQL has no built-in authorization. Every resolver must independently verify that the current user (or token) is authorized to access the requested data or perform the requested mutation. Without this, any authenticated user — or unauthenticated user — can traverse the entire graph.

#### Methodology

1. Extract all queries and mutations from the introspection schema.
2. For each query, test with different authentication contexts: unauthenticated, low-privilege user, high-privilege user, and a token belonging to a different user entirely.
3. Pay special attention to queries that accept identifiers (user IDs, object IDs, veterinary IDs). Substitute another user's ID while using your own authentication token to test for Insecure Direct Object Reference (IDOR) through the GraphQL layer.
4. Test mutations that modify data. Attempt to mutate resources you do not own using your own session. Attempt to mutate resources after revoking or omitting the authorization header.
5. Test whether authentication tokens themselves are exposed through queries. If a query like `auth(veterinaryName: "X")` returns a token, you have a critical data exposure issue.

#### What to look for

- Accessing another user's data by substituting their ID in a query while using your own authentication token (broken object-level authorization).
- Performing mutations (associations, deletions, updates) on resources belonging to another user.
- Queries that return authentication tokens, passwords, or secrets without verifying the requester's identity.
- Mutations that execute successfully without any authentication header.
- Role-escalation: a low-privilege role successfully executing queries or mutations intended for admins.

#### Remediation

- Implement authorization checks in every resolver, not just at the HTTP middleware layer.
- Validate that the authenticated user owns or is permitted to access the requested resource on every query.
- Never expose authentication tokens or secrets through query responses.
- Enforce authorization at the data-fetching layer, not just at the schema level — a resolver returning data from a database must check ownership.

---

### 3. Injection Attacks

**Why it matters:** GraphQL fields and arguments are forwarded to backend APIs and databases. If input is concatenated into SQL queries, OS commands, or rendered without escaping, the injection surface is identical to REST — but hidden behind the GraphQL query syntax.

#### 3a. SQL Injection

1. Identify arguments that accept strings and appear to query a database (search fields, name filters, prefix lookups).
2. Inject SQL payloads into those arguments: single quotes, `UNION SELECT`, boolean-based payloads, time-based payloads.
3. A GraphQL query concatenating user input looks like: `{ dogs(namePrefix: "ab%' UNION SELECT ...") { id name } }`. The payload lives inside a GraphQL argument string, but the SQL syntax is standard.
4. Use schema knowledge to craft meaningful extractions: table names, column names, and relationships discovered during introspection help target sensitive configuration tables.

#### 3b. Cross-Site Scripting (XSS)

1. Inject script payloads into GraphQL arguments, especially those reflected in error responses.
2. GraphQL validation errors often echo the submitted value verbatim. If the client renders error messages unsanitized, reflected XSS is possible.
3. Test all scalar types: even an argument typed as `Int` will produce an error including your injected string value — check whether that error is rendered unsafely.

#### 3c. Custom Scalar Injection

1. Custom scalar types (DateTime, JSON, URL) lack built-in validation in GraphQL. These are prime candidates for injection attacks.
2. Treat custom scalars as unsanitized input. Test with SQL injection, command injection, and XSS payloads.

#### What to look for

- Error responses that include raw user input (potential XSS).
- SQL errors returned in GraphQL error messages revealing database type or structure.
- UNION-based extraction returning data from unrelated tables.
- Custom scalars accepting arbitrary strings without server-side validation.

#### Remediation

- Never concatenate user input into SQL queries, OS commands, or HTML output. Use parameterized queries.
- Validate all input against an allowlist before GraphQL resolvers process it. Use a library like `graphql-constraint-directive` to define validation in the schema.
- Implement output encoding: escape error messages before rendering in the browser.
- Treat custom scalar types with the same scrutiny as freeform text input — validate and sanitize.
- Input validation alone is not a complete solution; combine it with parameterized queries and contextual output encoding.

---

### 4. Denial of Service (DoS) via Deep Nested Queries

**Why it matters:** GraphQL allows arbitrarily nested queries through relationships. If a `Dog` type references `Veterinary`, and `Veterinary` references `Dog`, an attacker can craft a deeply recursive query that consumes exponential CPU, memory, or database connections — effectively a DoS attack from a single request.

#### Methodology

1. Use the introspection schema or Voyager diagram to identify circular relationships (A references B, B references A).
2. Craft a query that nests the circular relationship many levels deep.
3. Add a high `limit` argument (e.g., `limit: 1000000`) to amplify the data volume returned at each level.
4. Measure response time and server resource usage. A single query that causes a timeout or significant degradation indicates a DoS vulnerability.

#### What to look for

- Circular type relationships visible in the schema.
- Absence of query depth limits (server processes arbitrarily deep queries).
- Absence of query complexity scoring or cost analysis.
- Queries with high limit values that return massive datasets without pagination enforcement.
- Server timeout or crash from a single crafted query.

#### Remediation

- **Timeouts:** Restrict the maximum time a query is permitted to run.
- **Maximum query depth:** Reject queries that exceed a defined nesting depth (e.g., depth > 7).
- **Maximum query complexity:** Assign a cost to each field and reject queries exceeding a total cost threshold.
- **Server-time-based throttling:** Limit the cumulative server time a single user or IP can consume.
- **Query-complexity-based throttling:** Limit the total complexity score of queries a user can submit within a window.
- **Pagination enforcement:** Require limits on list fields and set reasonable maximum page sizes.

---

### 5. Batching Attacks

**Why it matters:** GraphQL supports sending multiple queries in a single HTTP POST body as a JSON array. This allows an attacker to pack many operations into one request, bypassing network-level rate limiters, WAF rules, and brute-force protections designed for one-operation-per-request patterns.

#### Methodology

1. Send batched queries to enumerate or brute-force:
   - Enumerate objects with sequential IDs by batching multiple `{ resource(id: N) { field } }` queries.
   - Brute-force multi-factor authentication codes, password reset tokens, or other short-lived secrets.
   - Extract auth tokens by batching auth queries with enumerated usernames.
2. Craft queries that alias the same operation repeatedly: `{ a1: resource(id:1) { x } a2: resource(id:2) { x } ... }`. Aliasing achieves the same effect as array batching within a single GraphQL document.
3. Test whether the server processes all batched queries even if one fails — partial execution may still leak data.

#### What to look for

- Successful enumeration of resources by ID through a batched request.
- Auth token extraction through batched auth queries.
- Server processing all batched operations without rate-limiting or rejecting the batch.
- Alias-based batching achieving the same bypass as array-based batching.
- Bypass of WAF or rate-limiter that counts requests but not operations-per-request.

#### Remediation

- Implement object-level rate limiting in application code — count operations, not HTTP requests.
- Prevent batching for sensitive queries (authentication, token generation, password operations).
- Limit the maximum number of queries per batched request.
- Apply the same complexity scoring and depth analysis to batched queries as to single queries.
- Consider disabling batching entirely if your application does not require it.

---

### 6. Detailed Error Messages

**Why it matters:** GraphQL runtime errors often include stack traces, internal type information, database error messages, or configuration details. These leak the internal architecture to an attacker, enabling more targeted attacks.

#### Methodology

1. Send invalid GraphQL queries, malformed JSON, unexpected field names, wrong argument types, and excessively large values.
2. Send queries that reference non-existent types or fields.
3. Examine every error response for:
   - Stack traces with file paths.
   - Database error messages (table names, column names, query snippets).
   - Server framework and version information.
   - Internal IP addresses or hostnames.
   - Debug flags or environment indicators.
4. Fuzz all input fields systematically — the goal is to trigger unexpected error paths that reveal details the happy-path error handler suppresses.

#### What to look for

- Stack traces exposed in GraphQL error responses.
- Database errors revealing schema structure.
- Internal paths, class names, or method names.
- Debug mode indicators (e.g., `"debug": true`, development error formatting).
- Wrapped backend API error messages forwarded unchanged to the client.

#### Remediation

- Configure the GraphQL server to return generic error messages in production — never expose stack traces or internal details.
- Implement a centralized error-handling layer that sanitizes all responses before they reach the client.
- Log detailed errors server-side for debugging; never send them to the client.
- Disable debug and development modes in production deployments.

---

### 7. Exposure of the Underlying API

**Why it matters:** GraphQL is often deployed as a translation layer in front of existing REST or RPC APIs. If the GraphQL node forwards requests to the underlying API without re-checking authorization, or if GraphQL arguments are passed directly to backend routes, an attacker may manipulate the underlying API paths or escalate privileges using the GraphQL node's own credentials.

#### Methodology

1. Identify arguments that accept or resemble URL paths, route parameters, or resource identifiers.
2. Test path traversal: send `id=1/delete`, `id=../admin`, or other path-altering values to see if GraphQL concatenates them into underlying API routes.
3. Test IDOR at the underlying API level: an argument like `veterinaryId: 2` might be forwarded as `/api/users/2`. Attempt to access resources you should not have permission to view.
4. Check whether the underlying API trusts the GraphQL node's authorization context rather than the original requester's — the node may be making backend calls with elevated privileges.
5. Mutate the structure of arguments to include unexpected fields that might map to underlying API parameters not exposed in the GraphQL schema.

#### What to look for

- Arguments that appear to map directly to underlying REST API paths.
- Path manipulation through GraphQL arguments.
- The GraphQL node executing backend requests with its own (possibly elevated) credentials instead of the user's.
- Accessing or modifying resources belonging to other users through argument manipulation.
- Underlying API errors leaked through the GraphQL error response.

#### Remediation

- Validate all arguments against an allowlist before forwarding to underlying APIs — reject any input containing path characters or unexpected structures.
- Propagate the original user's authorization context through to the underlying API; never use the GraphQL node's service credentials for user-bound operations.
- Re-validate authorization at every layer — the GraphQL node and the underlying API should independently enforce access control.
- Map GraphQL arguments explicitly to backend parameters; do not use dynamic routing based on user-controlled input.

---

## Common Vulnerability Patterns

- **Introspection left open:** The most common GraphQL misconfiguration. An open introspection endpoint is equivalent to shipping your database schema and API documentation to every attacker.
- **Authorization deferred to the schema:** Teams assume defining a mutation in the schema is enough — they forget to check ownership in the resolver. Every field returned by a resolver must be authorized.
- **Nested-object DoS overlooked:** Circular references in the data model are normal (e.g., `User→Posts→Author→User`). Without depth limiting, this becomes a one-request DoS.
- **Batching bypassing WAF:** WAFs count HTTP requests. A batched GraphQL request is one HTTP request — containing hundreds of brute-force attempts.
- **Error messages as an oracle:** GraphQL errors often distinguish between "resource not found" and "access denied." This difference allows an attacker to enumerate valid IDs.
- **Custom scalars as unvalidated input:** Developers trust the GraphQL type system. A custom scalar has no built-in validation — it is raw, attacker-controlled input.

---

## Bug-Finding Efficiency Tips

1. **Start with introspection.** If it is open, you have the entire attack surface mapped before writing a single payload. If it is closed, use error messages to reconstruct the schema incrementally.
2. **Map relationships visually** before crafting injection or DoS payloads. Circular relationships are your DoS targets. Fields named `token`, `password`, `secret`, or `key` are your authorization targets.
3. **Test authorization before injection.** Authorization flaws are more common and often higher impact than injection in GraphQL deployments.
4. **Use aliases for efficiency.** A single query with aliases can test multiple authorization scenarios simultaneously: `{ me: myInfo(token: t1, id: 1) other: myInfo(token: t2, id: 2) }`.
5. **Batch to bypass rate limiting.** If single-request brute-force is blocked, test batched queries. If array batching is blocked, test alias-based batching.
6. **Fuzz custom scalars aggressively.** These are the least-validated input paths in most GraphQL deployments.
7. **Check error messages on every request.** GraphQL returns errors alongside partial data — the error block is often more informative than the data block.

---

## Remediation Summary

| Attack Surface | Primary Remediation |
|---|---|
| Introspection exposure | Restrict to authenticated, authorized users. Disable in production if not needed. |
| Authorization bypass | Enforce authorization in every resolver. Validate resource ownership on every read and write. |
| SQL/Command Injection | Use parameterized queries. Validate all inputs. Treat custom scalars as untrusted. |
| XSS via error reflection | Escape error messages before rendering. Return generic errors in production. |
| Deep-nested DoS | Enforce query depth limits, complexity scoring, timeouts, and pagination. |
| Batching abuse | Limit operations per request. Disable batching for sensitive queries. Apply rate limits per operation, not per request. |
| Detailed error leakage | Return generic error messages in production. Log details server-side only. |
| Underlying API exposure | Validate arguments strictly. Propagate user context, not service credentials. Re-authorize at every layer. |

---

## References

- OWASP Web Security Testing Guide v4.2 — Section 4.12: API Testing
- WSTG-APIT-01: Testing GraphQL
- GraphQL Official Site: https://graphql.org
- How to GraphQL — Security: https://www.howtographql.com/advanced/4-security/
- GraphQL Constraint Directive: https://github.com/confuser/graphql-constraint-directive
- GraphQL Cheat Sheet (OWASP): https://cheatsheetseries.owasp.org/cheatsheets/GraphQL_Cheat_Sheet.html
- 5 Common GraphQL Security Vulnerabilities (Payatu)
- GraphQL Common Vulnerabilities and How to Exploit Them (Medium)
