---
name: wstg-input-validation
description: Use when testing for injection vulnerabilities, cross-site scripting (XSS), SQL injection, LDAP injection, XML injection, SSI injection, XPath injection, IMAP/SMTP injection, code injection, command injection, format string vulnerabilities, HTTP parameter pollution, HTTP verb tampering, HTTP splitting/smuggling, host header injection, server-side template injection, server-side request forgery, incubated vulnerabilities, or HTTP incoming request monitoring during a penetration test or security assessment.
---

# WSTG Input Validation Testing (v4.2)

Comprehensive methodology for testing input validation flaws in web applications. Derived from OWASP WSTG v4.2, sections 4.7.1 through 4.7.19.

## Quick-Reference Table

| ID | Objective |
|----|-----------|
| WSTG-INPV-01 | Reflected Cross-Site Scripting (XSS) |
| WSTG-INPV-02 | Stored Cross-Site Scripting (XSS) |
| WSTG-INPV-03 | HTTP Verb Tampering (merged into Test HTTP Methods) |
| WSTG-INPV-04 | HTTP Parameter Pollution (HPP) |
| WSTG-INPV-05 | SQL Injection (8 DBMS sub-variants) |
| WSTG-INPV-06 | LDAP Injection |
| WSTG-INPV-07 | XML Injection (includes XXE) |
| WSTG-INPV-08 | Server-Side Include (SSI) Injection |
| WSTG-INPV-09 | XPath Injection |
| WSTG-INPV-10 | IMAP/SMTP Injection |
| WSTG-INPV-11 | Code Injection (includes LFI and RFI) |
| WSTG-INPV-12 | OS Command Injection |
| WSTG-INPV-13 | Format String Injection |
| WSTG-INPV-14 | Incubated/Persistent Vulnerability |
| WSTG-INPV-15 | HTTP Splitting & Smuggling |
| WSTG-INPV-16 | HTTP Incoming Request Monitoring |
| WSTG-INPV-17 | Host Header Injection |
| WSTG-INPV-18 | Server-Side Template Injection (SSTI) |
| WSTG-INPV-19 | Server-Side Request Forgery (SSRF) |

## Common Vulnerability Patterns Across All Tests

- **Trusting client-side validation only**: Server must revalidate all input regardless of client-side checks.
- **Deny-list instead of allow-list**: Deny-lists miss novel encodings and obfuscations. Always prefer allow-lists.
- **Single-pass sanitization**: Non-recursive filtering can be bypassed by nesting malicious payloads within stripped tokens.
- **Encoding mismatches**: Different layers (WAF, app server, database) parse encodings differently, creating bypass opportunities.
- **Implicit trust in internal services**: Backend systems often lack the same security controls as frontend interfaces.
- **Concatenation-based query construction**: Building queries/documents/commands via string concatenation is the root cause of most injection flaws.

## Common Misconfigurations

- Error messages exposing database type, table names, column names, or stack traces.
- Default credentials on backend databases, PL/SQL gateways, or admin consoles.
- SSI directives (`exec`) left enabled on production web servers.
- XXE: DTD/external entity processing not disabled in XML parsers.
- File upload accepting arbitrary MIME types (e.g., `text/html` for image files).
- Missing `Content-Type` validation allowing browser MIME sniffing attacks.
- `allow_url_include` enabled in PHP, enabling RFI via data/wrapper schemes.
- CORS, reverse proxies, or CDNs trusting attacker-supplied `Host` or `X-Forwarded-Host` headers.

## Bug-Finding Efficiency Tips

1. **Map all input vectors first**: Include query strings, POST bodies, HTTP headers (User-Agent, Referer, Cookie, Host, X-Forwarded-*), hidden form fields, file upload filenames, and URL path segments.
2. **Fingerprint the stack early**: Determining the backend language, framework, database, and template engine narrows the relevant test cases dramatically.
3. **Use error-based testing first**: A single quote or special character that triggers a detailed error message is often the fastest path to confirmation.
4. **Test for polyglot behavior**: Payloads that trigger different vulnerabilities depending on context (e.g., strings that work as both XSS and template injection) are high-value.
5. **Test blind variants explicitly**: If the application suppresses errors, pivot to boolean-based, time-based, or out-of-band techniques immediately.
6. **Check the response, source, and headers**: XSS payloads may reflect in JavaScript blocks, HTML comments, or response headers, not just visible body content.
7. **Abuse trust boundaries**: Once you control a stored value (via SQLi, file upload, or HPP), test how downstream consumers process it—this reveals incubated vulnerabilities.

---

## WSTG-INPV-01: Reflected Cross-Site Scripting

**Objective**: Identify variables reflected in HTTP responses; assess input acceptance and output encoding.

**Methodology**: Three-phase approach: (1) Detect all input vectors including hidden inputs, HTTP parameters, POST data, cookies, and headers. (2) Analyze each vector by injecting harmless trigger strings and observing where they appear in the response HTML. (3) Check impact by determining whether special characters (`<`, `>`, `"`, `'`, `&`) are properly encoded, replaced, or filtered.

**What to Look For**: Unescaped angle brackets, unquoted attribute values containing user input, reflection in JavaScript blocks (requires different escaping rules for `\n`, `\r`, `'`, `"`, `\`, `\uXXXX`), reflection inside event handlers (`onfocus`, `onload`), reflection in URLs (`javascript:` protocol). Test filter evasion: case variation, encoding (URL, Unicode, hex), non-recursive filter bypass, HTTP parameter pollution, and attribute injection.

**Remediation**: Context-aware output encoding (HTML entity encoding for HTML body, JavaScript encoding for script contexts, URL encoding for href/src). Use Content-Security-Policy headers.

## WSTG-INPV-02: Stored Cross-Site Scripting

**Objective**: Identify stored input reflected on the client-side; assess encoding on output.

**Methodology**: Identify all points where user input is persisted: user profiles, shopping carts, file managers, settings, forums, blogs, logs. Test injection in each storage point, then visit the display page to check execution. Test both GET and POST submissions. Bypass client-side validation by disabling JavaScript or using an intercepting proxy. Test file upload: attempt uploading HTML content or setting image MIME types to `text/html`. Test MIME-type mishandling across browsers.

**What to Look For**: Stored input rendered without encoding; admin-only pages displaying user data (higher privilege context); file uploads served with attacker-controlled MIME types; out-of-band storage channels (batch jobs, admin consoles).

**Remediation**: Input validation at storage time; output encoding at display time regardless of apparent trust level; strict MIME type enforcement on uploads.

## WSTG-INPV-03: HTTP Verb Tampering

**Objective**: Assess which HTTP methods the server accepts and whether method restrictions are enforced.

**Methodology**: Test each endpoint with alternative HTTP methods (POST, PUT, DELETE, PATCH, TRACE, OPTIONS, CONNECT, arbitrary strings) to determine if access controls or input validation depend on the expected verb.

**What to Look For**: Bypassed authentication or authorization when using an unexpected verb; TRACE method enabled (XST attacks); overridden method via `X-HTTP-Method-Override` header.

**Remediation**: Explicit allow-list of accepted HTTP methods per endpoint. Disable dangerous methods (TRACE, OPTIONS) at the web server level.

## WSTG-INPV-04: HTTP Parameter Pollution

**Objective**: Identify backend parsing method; bypass input filters using duplicate parameters.

**Methodology**: Identify the application server (ASP.NET concatenates with comma, PHP uses last, JSP/Servlet uses first). Supply duplicate parameters with different values and observe which value the application uses. Test with three requests per parameter: normal, tampered, and duplicated. Check if duplicate parameters can bypass WAF/IPS rules by splitting payloads across parameter instances. Test server-side and client-side contexts; include `data`, `src`, `href` attributes and form actions.

**What to Look For**: Impedance mismatch between security filters and application parameter parsing; concatenated parameter values bypassing deny-list rules; client-side HPP in `XMLHttpRequest`, Flash `flashvars`, or runtime attribute creation.

**Remediation**: Use consistent parameter parsing across all application layers. Reject requests with duplicate parameter names. Apply input validation after all parameter aggregation.

## WSTG-INPV-05: SQL Injection (8 Sub-variants)

**Objective**: Identify SQL injection points; assess severity and achievable access level.

### General SQL Injection Methodology
Test all input fields, hidden POST fields, cookies, and HTTP headers. Begin with single quote, semicolon, and comment delimiters (`--`, `/* */`). Observe error messages for database fingerprinting. Test boolean conditions (`AND 1=2` vs `AND 1=1`). Use five exploitation techniques: Union operator, Boolean-based blind, Error-based, Out-of-band (OOB), and Time delay.

### WSTG-INPV-05.1: Oracle
Focus on PL/SQL Gateway endpoints (URLs containing `/pls/`, `/owa/`, `/plsql`). Test for NULL procedure execution to confirm Gateway presence. Attempt to bypass the PL/SQL Exclusion List using hex-encoded whitespace, labels, double quotes, charset conversion (e.g., `0xFF` to `Y`), backslash prefix, and SQL injection in bind variables. Test standard SQL injection with Oracle concatenation operator (`||`). Target `OWA_UTIL.CELLSPRINT`, `HTP.PRINT`, `CTXSYS.DRILOAD.VALIDATE_STMT` packages. Check for access to `SYS.DBMS_EXPORT_EXTENSION`.

### WSTG-INPV-05.2: MySQL
Fingerprint using version-specific comment syntax (`/*!40110 ...*/`). Bypass single-quote escaping with hex encoding (`0x...`) or `CHAR()` function. Note that MySQL connectors do not support stacked queries. Use `INFORMATION_SCHEMA` (v5.0+) for schema enumeration. For out-of-band: `INTO OUTFILE` with `FILE` privilege. For blind: `BENCHMARK()` or `SLEEP()` (v5.0+). Test `LOAD_FILE()` for file read access.

### WSTG-INPV-05.3: SQL Server
Leverage SQL Server-specific operators: `--` (comment), `;` (separator). Target `xp_cmdshell` for OS command execution; test re-enabling via `sp_addextendedproc` or `sp_OACreate`. Use `OPENROWSET` for port scanning and credential brute-forcing. Exploit `xp_regread`, `xp_regwrite` for registry access. Test `sp_makewebtask` for file creation. Use `WAITFOR DELAY` for time-based blind. Fingerprint with `@@version` and `db_name()`. Test for source code disclosure via `xp_cmdshell` file copy. Check `xp_sendmail` for data exfiltration.

### WSTG-INPV-05.4: PostgreSQL
Fingerprint with `::` cast operator and `version()`. Use `pg_sleep()` (v8.2+) or create custom via `libc` for timing attacks. Use `COPY` statement and `pg_read_file()` for file read. Leverage `COPY TO` for file write. Target procedural language extensions: `plpythonu` (`CREATE FUNCTION proxyshell`), `plperlu` (untrusted Perl), `libc` dynamic library functions. Test `current_database()`, `current_user`, `session_user` for information gathering.

### WSTG-INPV-05.5: MS Access
No comment characters, no stacked queries, no `LIMIT`, no `SLEEP`/`BENCHMARK`. Use null byte (`%00`) or `0x16` (`%16`) to truncate queries. Use `TOP` and `LAST` operators instead of `LIMIT`. Use `IIF()`, `MID()`, `ASC()`, `CHR()`, `LEN()` for blind injection. Enumerate columns via `GROUP BY` error messages. Attempt to read `MSysObjects`, `MSysACEs`, `MSysAccessXML` system tables. Check if `.mdb` file is web-accessible for direct download. String concatenation via `&` and `+`.

### WSTG-INPV-05.6: NoSQL Injection
Target NoSQL-specific query operators and syntax (JSON, BSON, JavaScript expressions). For MongoDB: test `$where` operator for JavaScript injection, inject special characters (`'`, `"`, `\`, `;`, `{`, `}`), test for reserved variable name pollution (e.g., `$where` as PHP variable via HPP), exploit fully-featured JavaScript execution within queries. PHP MongoDB requires single-quotes around `$` operators to prevent PHP variable interpolation.

### WSTG-INPV-05.7: ORM Injection
Identify the ORM layer (Hibernate, Sequelize, Laravel Query Builder, etc.). Test for direct SQL injection when ORM methods bypass parameterization (string concatenation in ORM queries). Check for known CVEs in the ORM library version. Test ORM-specific injection syntax (e.g., HQL injection in Hibernate). Verify that positional parameters (`?`) or named parameters are used consistently.

### WSTG-INPV-05.8: Client-Side SQL Injection
Identify Web SQL Database API usage: `openDatabase()`, `transaction()`, `executeSQL()`. Test for SQLite-syntax injection in client-side query construction. Since data is constructed in JavaScript, test that string concatenation is not used with URL fragments, `document.location.hash`, or other DOM-controlled values.

**Remediation (all SQL)**: Use parameterized queries (prepared statements) exclusively. Apply stored procedure parameter binding. Escape all special characters appropriate to the DBMS. Use least-privilege database accounts. Implement allow-list input validation. Disable dangerous procedures (`xp_cmdshell`, `UTL_HTTP`). Configure XML parsers with DTD/entity processing disabled. For NoSQL: use BSON query builders, never concatenate user input into `$where` or JavaScript expressions.

## WSTG-INPV-06: LDAP Injection

**Objective**: Identify LDAP injection points; assess severity.

**Methodology**: Test parameters used in LDAP search filters and authentication. Inject LDAP metacharacters: `&` (AND), `|` (OR), `!` (NOT), `=` (equals), `~=` (approx), `*` (wildcard), `()` (grouping). For authentication bypass, craft always-true filters similar to SQL injection (`*)(uid=*))(|(uid=*`). Test search endpoints for wildcard expansion (`*` returning all entries).

**What to Look For**: Unauthorized content disclosure, authentication bypass, information gathering about LDAP tree structure.

**Remediation**: Escape LDAP filter metacharacters (`\` prefix). Use parameterized LDAP queries. Apply allow-list input validation. Use dedicated bind accounts with minimum required permissions.

## WSTG-INPV-07: XML Injection

**Objective**: Identify XML injection points; assess exploit types including XXE.

**Methodology**: Test XML metacharacters: single quote, double quote, angle brackets (`<`, `>`), comment delimiters (`<!--`, `-->`), ampersand (`&`), CDATA section delimiters (`<![CDATA[`, `]]>`). Test tag injection to create additional XML nodes or modify existing ones (privilege escalation via duplicate nodes). Test comment injection to remove unwanted nodes. Test XXE: inject external entity definitions referencing local files (`file:///etc/passwd`, `file:///c:/boot.ini`), internal network resources, or remote URLs. Test denial of service via `/dev/random` or recursive entities.

**What to Look For**: Malformed XML errors exposing structure; attribute and tag injection leading to privilege escalation; external entity processing enabled; CDATA section handling flaws allowing XSS through XML-to-HTML conversion.

**Remediation**: Disable DTD/external entity processing in XML parsers. Validate XML against schemas. Use allow-list input validation. Apply output encoding when XML is transformed to HTML. Update vulnerable libraries (Java POI < 3.10.1, libxml2, libxerces-c).

## WSTG-INPV-08: SSI Injection

**Objective**: Identify SSI injection points; assess potential for RCE.

**Methodology**: Determine if SSI is enabled (check for `.shtml` extensions, web server type). Inject SSI directive characters (`<`, `!`, `#`, `=`, `/`, `.`, `"`, `-`, `>` and `[a-zA-Z0-9]`). Test directives: `<!--#echo var="VAR"-->` for server variables, `<!--#include virtual="FILENAME"-->` for file inclusion, `<!--#exec cmd="OS_COMMAND"-->` for command execution. Test injection in HTTP headers (User-Agent, Referer) if they are reflected in dynamically-generated pages.

**What to Look For**: `exec` directive enabled (direct RCE); include directive revealing file contents; echo directive exposing server environment variables; SSI processing in error pages or server-generated content.

**Remediation**: Disable SSI entirely if not required. Disable `exec` directive. Validate and sanitize all input before SSI processing. Use a nonce or token-based approach for dynamic includes.

## WSTG-INPV-09: XPath Injection

**Objective**: Identify XPath injection points.

**Methodology**: Test parameters used in XPath queries by injecting single quote to cause syntax errors. Craft always-true conditions (`' or '1' = '1`) for authentication bypass. Use boolean-based blind techniques with XPath functions (`string-length()`, `substring()`) to extract XML document structure character by character. Unlike SQL, no ACLs restrict XPath queries—they can access the entire XML document.

**What to Look For**: Authentication bypass; unauthorized access to XML data; blind XPath injection revealing entire database structure.

**Remediation**: Use parameterized XPath interfaces (precompiled XPath with variable binding). Escape XPath special characters. Apply allow-list input validation.

## WSTG-INPV-10: IMAP/SMTP Injection

**Objective**: Identify IMAP/SMTP injection points; understand data flow and deployment structure; assess injection impacts.

**Methodology**: Test webmail application parameters (mailbox, message ID, email addresses, subject, body, attachments). Inject null values, random values, additional parameters, and special characters (`\`, `'`, `"`, `@`, `#`, `!`, `|`). Analyze error messages to identify the backend command being constructed. Use CRLF (`%0d%0a`) sequences to terminate the expected command and inject new IMAP/SMTP commands. Determine if injection works in authenticated vs unauthenticated states (unauthenticated limits to `CAPABILITY`, `NOOP`, `AUTHENTICATE`, `LOGIN`, `LOGOUT`).

**What to Look For**: IMAP command errors in responses; ability to inject commands via header-body-footer structure; internal mail servers exposed with weaker security than front-end servers; relay/spam capability; mailbox manipulation.

**Remediation**: Use allow-list validation for all mail-related parameters. Parameterize IMAP/SMTP command construction. Escape CRLF sequences and protocol metacharacters. Run mail servers with strict authentication.

## WSTG-INPV-11: Code Injection (with LFI and RFI)

**Objective**: Identify injection points where code can be injected and executed by the server.

### Code Injection Methodology
Test for PHP injection by manipulating include paths to reference remote URLs. Test for ASP injection by injecting code that gets written to a file and executed via `Server.Execute()`. Review source for dangerous functions: `eval()`, `include()`, `require()`, `Server.Execute()`, `system()`, `exec()`.

### Local File Inclusion (LFI)
Identify scripts that take filenames as parameters. Test directory traversal (`../../../../etc/passwd`). Bypass appended extensions with null byte injection (`%00`), path truncation (4096-byte limit), or PHP wrappers: `php://filter/convert.base64-encode/resource=` for source disclosure, `zip://` for executing code in uploaded ZIP archives, `data://text/plain;base64,` for inline code execution (requires `allow_url_include`), `expect://` for command execution.

### Remote File Inclusion (RFI)
Identify scripts that directly include URL parameters. Test by supplying a URL to attacker-controlled code. Works when `allow_url_include` or equivalent is enabled.

**What to Look For**: Direct file content disclosure; source code exposure via PHP filters; code execution via wrappers or remote includes; extension-appending bypasses.

**Remediation**: Avoid passing user input to filesystem/include APIs. Use an allow-list of permitted files with index-based access. Disable `allow_url_include`. Validate file paths against an allow-list.

## WSTG-INPV-12: Command Injection

**Objective**: Identify and assess OS command injection points.

**Methodology**: Test any parameter that may be passed to system commands (filename parameters, ping utilities, file conversion tools). Inject command separators and chaining characters: `|` (pipe), `;` (semicolon), `||` (OR), `&&` (AND), `$()` (command substitution), `` ` `` (backtick), `>` (redirect), `<` (input). Test in GET, POST, headers, and cookies. For blind command injection, use time-delay commands or out-of-band callbacks.

**What to Look For**: Command output in web response; time-based delays confirming execution; out-of-band connections to attacker-controlled servers; directory listings and file reads; reverse shell capability.

**Remediation**: Use allow-list validation of allowed commands and arguments. Avoid passing user input to OS command APIs (`system()`, `exec()`, `Runtime.exec()`, `subprocess.popen()`). Use language-specific safe APIs for file operations instead of shell commands. Escape special characters for the target OS (`|`, `;`, `&`, `$`, `>`, `<`, `'`, `!`, newlines).

## WSTG-INPV-13: Format String Injection

**Objective**: Assess whether injecting format string conversion specifiers into user-controlled fields causes undesired behavior.

**Methodology**: Identify calls to format string functions (`printf`, `sprintf`, `String.format`, `str.format`) where user input is passed directly as the format string argument. Inject conversion specifiers for the target language: C/C++ (`%s`, `%p`, `%n`, `%x`), Python (`{0.__init__.__globals__}`), Java (`%s`, `%x`). Fuzz with all specifier types for the language in use. Observe for crashes, memory dumps, information disclosure, or unexpected output.

**What to Look For**: Process crashes (`Segmentation Fault`, `MissingFormatArgumentException`); memory address leakage (`%p`); stack content disclosure; Python global variable access via format string; runtime errors from missing arguments.

**Remediation**: Always use format string literals, not user-controlled strings. Pass user data as arguments: `printf("%s", userInput)`, not `printf(userInput)`. Use static analysis tools (Flawfinder for C/C++, FindSecurityBugs for Java, phpsa for PHP).

## WSTG-INPV-14: Incubated Vulnerability

**Objective**: Identify injections that are stored and require a recall step; understand recall step triggers.

**Methodology**: Test for vulnerabilities where the attack vector is persisted first and executed later: (1) File upload: upload malicious files that exploit client-side vulnerabilities (JPEG, PNG CVEs, HTML with active content). (2) Stored XSS: inject JavaScript in forum posts, comments, or profiles that other users will view. (3) SQL/XPath injection: use database injection to modify content that will later be displayed to users without proper encoding. (4) Misconfigured servers: test admin consoles (Tomcat Web Application Manager, Plesk, cPanel) for WAR/package deployment or configuration changes.

**What to Look For**: Multi-step attack chains; file upload accepting executable content; admin interfaces with weak credentials; persistence layer shared with less-secure systems (backdoor entry via batch jobs); output validation gaps after data recall.

**Remediation**: Validate input at all entry points, not just the primary web interface. Apply output encoding at display time regardless of data source. Harden admin consoles. Enforce file upload type restrictions server-side.

## WSTG-INPV-15: HTTP Splitting & Smuggling

**Objective**: Assess if the application is vulnerable to HTTP splitting; assess if the communication chain is vulnerable to smuggling.

### HTTP Splitting Methodology
Identify user-controlled values that influence response headers (Location header in redirects, Set-Cookie). Inject CRLF sequences (`%0d%0a`) to craft a second HTTP response within the same server response. Test for web cache poisoning, XSS via fake responses, and defacement. Account for application-level encoding that may block CRLF in the URL path but not the query string. Test alternative encodings (UTF-7) if characters are filtered.

### HTTP Smuggling Methodology
(Gray-box) Identify discrepancies in how front-end proxies and back-end servers parse HTTP messages: conflicting `Content-Length` vs `Transfer-Encoding: chunked` headers, duplicate `Content-Length` headers, `Content-Length` in GET requests. Leverage server-specific behaviors (e.g., IIS 5.0 48KB POST body truncation) to bypass firewalls. Test with crafted requests that parse differently at each layer in the chain.

**What to Look For**: CRLF injection in response headers; web cache poisoning; bypass of security filters via request smuggling; firewall evasion through protocol-level discrepancies.

**Remediation**: Strip or encode CRLF sequences in all user-controlled values that appear in HTTP headers. Normalize and validate HTTP messages at the proxy/server boundary. Use HTTP/2 end-to-end to eliminate smuggling. Disable request body size limits that create truncation behaviors.

## WSTG-INPV-16: HTTP Incoming Request Monitoring

**Objective**: Monitor all incoming/outgoing HTTP requests without client-side proxy changes.

**Methodology**: Three approaches: (1) Reverse proxy: configure a reverse proxy on the web server to intercept traffic without browser configuration changes. (2) Port forwarding: set up SOCKS proxy or port forwarding to redirect traffic through an interception tool. (3) TCP-level capture: use network capture tools at the TCP level, replaying with packet editing tools. For HTTPS, import the server's private key to decrypt captured traffic.

**What to Look For**: Suspicious background HTTP requests; unnecessary data exfiltration; requests to unknown domains; unexpected HTTP methods or headers in captured traffic.

**Remediation**: Not a vulnerability per se—a testing/monitoring capability. Use findings to identify unauthorized requests and harden the application accordingly.

## WSTG-INPV-17: Host Header Injection

**Objective**: Assess if the Host header is parsed dynamically; bypass security controls relying on it.

**Methodology**: Supply an attacker-controlled domain in the Host header. Test for redirect poisoning (302 to attacker domain), dispatch to unintended virtual host, or web cache poisoning via the `Host` header. If Host header is validated, test `X-Forwarded-Host`, `X-Forwarded-For`, `X-Host`, `X-HTTP-Host-Override`. Test password reset functionality: if the application uses the Host header to construct password reset URLs, the attacker can intercept reset tokens by supplying their own domain.

**What to Look For**: Redirects to attacker-specified domains; cache serving poisoned content; password reset links pointing to attacker-controlled servers; virtual host confusion.

**Remediation**: Use an allow-list of permitted Host header values. Avoid using the Host header to construct URLs in application logic. Use relative URLs or a server-configured base URL instead.

## WSTG-INPV-18: Server-Side Template Injection

**Objective**: Detect template injection points; identify the templating engine; build RCE exploits.

**Methodology**: Determine if templates are used (Jinja2, Twig, FreeMarker, Velocity, Smarty, etc.). Inject common template expressions: `{{7*7}}`, `${7*7}`, `<%= 7*7 %>`, `#{7*7}`, `[[7*7]]`. If the expression evaluates to `49`, SSTI is confirmed. Distinguish plaintext context (user input directly in template body) from code context (input inside template statement). For code context, break out of the statement with closing delimiters (`}}`) and inject new markup. Identify the specific engine by testing engine-specific syntax. Study the engine's documentation for built-in methods, security considerations, and known exploits. Explore the `self` object to chain to RCE. Test for information disclosure (environment variables, config keys, API keys).

**What to Look For**: Mathematical expressions evaluating server-side; access to server-side objects; arbitrary code execution via template engine features; sensitive data exposure through object introspection; sandbox escapes.

**Remediation**: Do not pass user input directly into template rendering engines. Use a logic-less template system or strictly separate template logic from user data. Sandbox template evaluation. Implement allow-lists for accessible objects and methods.

## WSTG-INPV-19: Server-Side Request Forgery

**Objective**: Identify SSRF injection points; test exploitability; assess severity.

**Methodology**: Test any parameter that accepts URLs or causes the server to make outbound requests. Supply URLs targeting internal services: `http://localhost/admin`, `http://127.0.0.1/admin`, `http://[::1]/admin`. Test file protocol: `file:///etc/passwd`, `file:///c:/windows/win.ini`. Test cloud metadata endpoints (AWS: `http://169.254.169.254/latest/meta-data/`). Bypass hostname filters: use alternative IP representations (decimal `2130706433`, octal `017700000001`, shortened `127.1`), DNS records resolving to `127.0.0.1`, URL tricks (`https://expected-domain@attacker-domain`, `https://attacker-domain#expected-domain`), URL encoding, and fuzzing combinations. In PDF generators, inject `<iframe>` or `<img>` tags pointing to internal services. Test for blind SSRF where the response is not directly visible but side effects occur (email, PDF reports, order processing).

**What to Look For**: Access to internal services and admin panels; cloud metadata exposure; internal file reads; port scanning of internal networks; trust-relationship exploitation (localhost bypasses authentication).

**Remediation**: Implement an allow-list of permitted URLs and protocols. Block requests to private IP ranges, loopback addresses, and cloud metadata endpoints. Disable unnecessary URL schemes (`file://`, `gopher://`, `dict://`). Validate DNS responses to prevent DNS rebinding. Apply token-based access for internal resources.

---

## Remediation Summary

| Category | Core Remediation |
|----------|-----------------|
| XSS (all types) | Context-aware output encoding; CSP headers; validate on input and output |
| SQL Injection | Parameterized queries; stored procedures; least-privilege DB accounts |
| LDAP Injection | Escape metacharacters; parameterized LDAP queries |
| XML Injection/XXE | Disable DTD/external entities; schema validation |
| SSI Injection | Disable SSI or exec directive; sanitize inputs |
| XPath Injection | Parameterized XPath; escape special characters |
| IMAP/SMTP Injection | Allow-list parameters; escape CRLF sequences |
| Code Injection/LFI/RFI | Allow-list file access; disable dangerous wrappers |
| Command Injection | Avoid OS command APIs; allow-list commands |
| Format String | Never use user input as format string argument |
| Incubated | Validate at all entry points; encode on output |
| HTTP Splitting/Smuggling | Strip CRLF; normalize HTTP messages; use HTTP/2 |
| Host Header | Allow-list valid hosts; avoid using Host header in URLs |
| SSTI | Separate template logic from user data; sandbox engines |
| SSRF | Allow-list URLs; block private IP ranges; disable dangerous schemes |

## Universal Input Validation Principles

1. **Allow-list over deny-list**: Define what is acceptable, not what is rejected.
2. **Validate on a trusted layer**: Server-side validation is mandatory; client-side is convenience only.
3. **Canonicalize before validating**: Decode to the simplest form before applying validation rules.
4. **Validate at multiple boundaries**: Input to the application, input to business logic, input to persistence, output to client.
5. **Fail closed**: Reject invalid input; never attempt to "fix" or sanitize it silently.
6. **Context-appropriate encoding**: HTML encoding for HTML, JavaScript encoding for scripts, URL encoding for URLs, SQL parameterization for databases.

## References

- OWASP WSTG v4.2, Sections 4.7.1–4.7.19
- OWASP Input Validation Cheat Sheet
- OWASP SQL Injection Prevention Cheat Sheet
- OWASP XSS Filter Evasion Cheat Sheet
- OWASP XXE Prevention Cheat Sheet
- OWASP SSRF Prevention Cheatsheet
- OWASP LDAP Injection Prevention Cheat Sheet
- OWASP Testing Guide: https://owasp.org/www-project-web-security-testing-guide/
