---
name: wstg-configuration-management
description: Use when testing web server configuration, deployment management, TLS/SSL settings, HTTP security headers, file permissions, subdomain takeover, cloud storage, server hardening, default credentials, backup file exposure, administrative interface enumeration, HTTP method testing, HSTS validation, cross-domain policies, or infrastructure security during a penetration test or security assessment.
---

# WSTG Configuration and Deployment Management Testing (WSTG v4.2)

Comprehensive methodology for testing web server configuration, deployment management, and infrastructure security. Covers all 11 WSTG-CONF test cases from OWASP WSTG v4.2.

## Quick Reference

| ID | Test | Objective |
|----|------|-----------|
| WSTG-CONF-01 | Network Infrastructure Configuration | Validate infrastructure configurations, patch levels, and admin tool security |
| WSTG-CONF-02 | Application Platform Configuration | Ensure defaults removed, no debug code, proper logging |
| WSTG-CONF-03 | File Extensions Handling | Discover sensitive file extensions and handler bypasses |
| WSTG-CONF-04 | Old Backup and Unreferenced Files | Find forgotten files exposing source code or credentials |
| WSTG-CONF-05 | Enumerate Admin Interfaces | Identify hidden administration portals and functionality |
| WSTG-CONF-06 | HTTP Methods | Test for dangerous HTTP verbs, access control bypass, XST, and method overriding |
| WSTG-CONF-07 | HTTP Strict Transport Security | Validate HSTS header presence and configuration |
| WSTG-CONF-08 | RIA Cross Domain Policy | Review crossdomain.xml and clientaccesspolicy.xml for overly permissive settings |
| WSTG-CONF-09 | File Permission | Identify overly permissive file and directory permissions |
| WSTG-CONF-10 | Subdomain Takeover | Detect dangling DNS records pointing to unclaimed services |
| WSTG-CONF-11 | Cloud Storage | Assess cloud storage access control misconfigurations |

---

## WSTG-CONF-01: Test Network Infrastructure Configuration

### Objective

Map the full application infrastructure and validate that each element is properly secured, patched, and free from known vulnerabilities. A single vulnerable component can compromise the entire infrastructure.

### How to Test

**Architecture Mapping.** Identify every element: web servers, application servers, database servers, authentication backends, reverse proxies, load balancers, and administrative tools. Document how they interact and what ports, protocols, and services are exposed.

**Known Server Vulnerabilities.** Review the software stack version-by-version against vendor advisories and public vulnerability databases. Automated scanners produce both false positives (vendors backport patches without bumping version numbers) and false negatives (obscured banners, undisclosed vulnerabilities). Obtain internal version and patch information whenever possible. Software reaching end-of-life exposes the application to vulnerabilities that will never be patched, forcing risky full upgrades.

**Administrative Tools.** Enumerate all administrative interfaces — web-based panels, FTP servers, WebDAV, network file systems (NFS, CIFS), and application-embedded admin panels. Review access control mechanisms protecting each. Third-party management interfaces accessible from the public internet are a significant attack surface.

### What to Look For

- Outdated or unpatched server software with known CVEs
- End-of-life operating systems or server components
- Default credentials on infrastructure components
- Administrative interfaces exposed to the public internet
- Unnecessary services running on open ports
- Heterogeneous infrastructure (mixed IIS/Apache) with asymmetric configurations

### Remediation

- Maintain a controlled port list with change management
- Apply vendor patches according to a defined cycle; prioritize publicly exploitable CVEs
- Replace end-of-life software with supported versions
- Restrict administrative interfaces to internal networks or VPN-only access
- Change all default credentials and require multi-factor authentication on admin interfaces

---

## WSTG-CONF-02: Test Application Platform Configuration

### Objective

Ensure default installations have been hardened: sample files removed, debugging code disabled, logging properly configured, and the server runs with minimal privileges.

### How to Test

**Sample and Known Files.** Enumerate all server content and verify each file belongs to the production application. Default sample applications have historically contained critical vulnerabilities (CVE-1999-0449 in IIS Exair, CAN-2002-1744 in IIS CodeBrws.asp, CAN-2003-1172 in Apache Cocoon).

**Comment Review.** Examine HTML, JavaScript, and CSS source for developer comments leaking internal paths, IP addresses, credential hints, commented-out admin links, or disabled functionality.

**Server Hardening.** Verify: only required modules are enabled; custom error pages replace defaults (preventing server version disclosure); server processes run with minimal OS privileges; sensitive configuration files are not world-readable or shared with write access; encryption keys for shared configuration use strong passwords; worker process identities have only read access to configuration.

**Logging Review.** Evaluate across six dimensions:
1. **Sensitive data.** Confirm logs do not capture passwords, session tokens, access tokens, PII, encryption keys, database connection strings, or source code
2. **Location.** Logs must be stored on a dedicated separate server to prevent attackers from wiping traces after compromise
3. **Storage.** Logs must reside on a separate disk partition to prevent log-flooding DoS from filling the OS partition
4. **Rotation.** Logs must be rotated per security policy, compressed after rotation, with post-rotation permissions restricting web server write access
5. **Access control.** Log data must never be visible to end users; log viewing interfaces must use separate access control schemas
6. **Review.** Administrators must actively review logs for attack patterns: high volumes of 40x (CGI scanning) and 50x (exploitation attempts)

### What to Look For

- Default sample applications, test pages, or documentation still present
- HTML comments leaking internal information
- Enabled server modules not required for application functionality
- Default error pages exposing server version
- Server process running as root/SYSTEM
- Passwords, tokens, or PII in access or error logs
- Logs on the same partition as the OS
- Unauthenticated access to log files

### Remediation

- Remove all sample files, documentation, test scripts, and unused extensions before production
- Implement a build process that strips development comments from deployed code
- Disable all unused server modules; configure custom error pages revealing no internals
- Run web server under a dedicated, low-privilege service account
- Centralize logs to a dedicated server on a separate partition
- Never log credentials, tokens, session IDs, or PII; validate data before logging

---

## WSTG-CONF-03: Test File Extensions Handling for Sensitive Information

### Objective

Discover how the web server handles different file extensions. Identify extensions that return raw source code or sensitive data instead of executing server-side. Detect file upload filter bypasses.

### How to Test

**Forced Browsing.** For each web directory, submit requests with different file extensions and observe how the server responds. Map directories that permit script execution versus those returning files as plain text. In load-balanced environments, test each server individually — heterogeneous configurations cause asymmetric behavior.

**Sensitive Extension Detection.** Test for extensions that should never be served:
- `.asa`, `.inc`, `.config` — server-side include and configuration files often containing credentials
- `.zip`, `.tar`, `.gz`, `.tgz`, `.rar` — archives potentially containing full source trees
- `.java` — server-side source files
- `.txt`, `.pdf`, `.docx`, `.rtf`, `.xlsx`, `.pptx` — documents that may contain sensitive data if unintentionally published
- `.bak`, `.old`, `~` — editor backup files exposing source code

**Inference from Naming.** If `viewuser.jsp` exists, test `edituser.jsp`, `adduser.jsp`, `deleteuser.jsp`. If `/app/user` exists, test `/app/admin` and `/app/manager`.

**File Upload Filter Bypass.** Exploit Windows 8.3 filename expansion quirks: `file.phtml`, `shell.phPWND`, or `SHELL~1.PHP` may bypass extension-based upload filters.

**Gray-Box.** Inspect web server MIME type mappings and handler assignments for each extension across all servers.

### What to Look For

- `.inc` files returning database credentials in plain text
- Configuration files exposing connection strings or API keys
- Archive files downloadable from the webroot
- Backup files returning source code instead of executing
- Directories permitting script execution where uploads are stored
- File upload filters bypassable via case variations or 8.3 expansion

### Remediation

- Configure the server to serve only explicitly required file extensions
- Deny direct access to `.inc`, `.config`, `.bak`, `.old`, `.tmp`, `.swp`, and archive files
- Store configuration and include files outside the webroot
- Validate uploaded files by content type and magic bytes, not just extension
- Normalize filenames before validation to prevent case-sensitivity and 8.3 bypasses

---

## WSTG-CONF-04: Review Old Backup and Unreferenced Files for Sensitive Information

### Objective

Find forgotten, backup, or unreferenced files exposing source code, credentials, configuration details, or administrative functionality. These are created through in-place editing, backup operations, file system snapshots, or deployment mistakes.

### How to Test

**Inference from Published Content.** Enumerate all application pages. Use naming schemes to infer unreferenced files. Map directory structures to find sibling admin or backup directories.

**Source Code Clues.** Manually review HTML and JavaScript for: commented-out links to hidden pages, JavaScript conditionals revealing admin UI paths, hidden forms with disabled submit elements, and `robots.txt` Disallow entries enumerating sensitive directories.

**Blind Guessing.** Use wordlists of common filenames against every enumerated directory. For each known file, test with backup extensions appended: `~`, `.bak`, `.old`, `.orig`, `.copy`, `.tmp`, `.swp`, `.save`, `.1`, `.tar`, `.zip`, `.gz`. Also test the extension before, after, and in place of the original extension.

**Directory Listing.** Request all enumerated directories to identify any that return a directory index — revealing every unreferenced file in one response.

**Search Engine Caches.** Query search engines for the target domain. Cached pages may reference content no longer linked from the application. The `site:` operator helps scope results.

**File System Snapshots.** Test for accessible snapshot directories (e.g., `/.snapshot/monthly.1/view.php`) containing historical code versions with vulnerabilities fixed in current versions.

**Windows Conventions.** Files prefixed with "Copy of" or localized equivalents keep their original extension and execute rather than disclose source, but may contain outdated logic triggering informative errors.

**Filename Filter Bypass.** Exploit differences in filename parsing between application, web server, and OS using Windows 8.3 expansion, character removal, and truncation rules.

### What to Look For

- Source code disclosure from `.bak` or `.old` files of server-side scripts
- Database credentials in forgotten include files or configuration backups
- Archive files containing entire webroot snapshots
- Admin pages not linked from published content
- Vulnerable old script versions with known issues fixed in current versions
- Log files in web-accessible directories containing session IDs or PII
- Accessible `.snapshot` directories with historical vulnerable code

### Remediation

- Prohibit editing files in-place on production servers
- Store data files, log files, and configuration files outside the webroot
- Schedule periodic automated scans for backup extensions in web-accessible directories
- Deny web server access to snapshot directories through server configuration
- Disable directory listing on all web-accessible directories

---

## WSTG-CONF-05: Enumerate Infrastructure and Application Admin Interfaces

### Objective

Discover hidden administrative interfaces and test whether they are accessible to unauthorized or unauthenticated users.

### How to Test

**Directory Enumeration.** Attempt common admin paths: `/admin`, `/administrator`, `/manager`, `/console`, `/cpanel`, `/webadmin`. Use search engine dorks to find inadvertently indexed admin interfaces.

**Source Code Clues.** Examine all HTML, JavaScript, and CSS for hidden links to administration functionality. Shared headers and footers often conditionally render admin links.

**Default Paths and Credentials.** Consult application server documentation for default admin paths and credentials. Well-known defaults include WordPress (`/wp-admin`), phpMyAdmin, Tomcat (`/manager/html`), WebSphere (`/admin/logon.jsp`), WebLogic (`/AdminMain`), and FrontPage (`/admin.dll`).

**Alternative Ports.** Administrative interfaces often run on separate ports: Tomcat on 8080, JBoss on 9990, WebLogic on 7001. Enumerate the host for web services on non-standard ports.

**Parameter Tampering.** Test for hidden form fields (`<input type="hidden" name="admin" value="no">`) or cookies (`useradmin=0`) that gate administrative functionality. Toggle these values to attempt privilege escalation.

**Gray-Box.** Review source code to verify authorization models enforce strict separation between normal and administrative users. Verify shared UI components do not leak admin information to unprivileged users.

### What to Look For

- Admin interfaces accessible without authentication
- Default credentials on discovered interfaces
- Admin paths exposed through `robots.txt` disallow directives
- Hidden form fields or cookies controlling admin access
- Admin interfaces on alternate ports without access controls
- Missing brute-force protection on admin login forms

### Remediation

- Restrict admin interfaces to internal IP ranges or require VPN access
- Implement strong multi-factor authentication on all administrative interfaces
- Change all default credentials immediately; remove unused default admin interfaces
- Implement account lockout or rate limiting on admin authentication endpoints
- Audit code to ensure admin UI components are never rendered to unprivileged users

---

## WSTG-CONF-06: Test HTTP Methods

### Objective

Enumerate supported HTTP methods, test for access control bypass via non-standard verbs, detect cross-site tracing (XST) potential, and identify HTTP method overriding.

### How to Test

**Discover Supported Methods.** Issue an OPTIONS request and examine the `Allow` response header. Verify by sending requests using each discovered method — some servers misreport supported methods.

**Test PUT Method.** Attempt to upload a file to writable directories via PUT requests. Successful uploads allow an attacker to place web shells, deface pages, or store malicious content.

**Access Control Bypass.** Identify a page normally returning a 302 redirect or 401 on unauthenticated GET. Replay using HEAD, POST, PUT, DELETE, or arbitrary verbs. A 200 OK response without authentication indicates method-based authorization bypass.

**Cross-Site Tracing (XST).** Issue a TRACE request with a custom header. If the server reflects it in the response body, TRACE is enabled. Combined with XSS, this steals HttpOnly cookies and Authorization tokens from request headers.

**HTTP Method Overriding.** When a restricted method returns "405 Method Not Allowed", replay with method override headers: `X-HTTP-Method`, `X-HTTP-Method-Override`, or `X-Method-Override`. If the server responds with success, overriding is supported and can bypass front-end restrictions from proxies, firewalls, or WAFs.

### What to Look For

- PUT or DELETE enabled without authentication
- Arbitrary HTTP verbs bypassing authorization on protected pages
- TRACE method enabled, reflecting request headers
- Method override headers accepted by the framework
- RESTful APIs accepting methods on endpoints that should be more restrictive

### Remediation

- Disable all HTTP methods not explicitly required using server configuration
- Apply authentication and authorization checks at the framework level, independent of HTTP method
- Disable the TRACE method on all web servers and proxies
- Disable HTTP method override support or restrict it to specific trusted headers

---

## WSTG-CONF-07: Test HTTP Strict Transport Security

### Objective

Validate that the application sends a valid HSTS header enforcing HTTPS, preventing SSL stripping attacks and protecting users who type HTTP URLs or follow insecure links.

### How to Test

**Header Presence.** Examine HTTPS responses for the `Strict-Transport-Security` header. Verify correct header name — typographical errors cause browsers to ignore it.

**max-age Directive.** Verify `max-age` meets the security baseline. Values under 31536000 (one year) provide limited protection. Two years (63072000) is recommended for preloading.

**includeSubDomains Directive.** Confirm presence if the organization owns subdomains. Without it, an attacker can impersonate a subdomain over HTTP, and session cookies scoped to the parent domain may leak.

**preload Directive.** Check whether `preload` is included and the domain is in browser HSTS preload lists. Preloading eliminates the first-visit vulnerability window.

**HTTP Response.** Verify HTTP requests redirect to HTTPS, and the HSTS header is sent only on HTTPS responses. HSTS headers received over HTTP are ignored.

### What to Look For

- HSTS header missing entirely
- `max-age` under one year (31536000 seconds)
- `includeSubDomains` missing when subdomains exist
- HSTS header sent on HTTP responses (ignored by browsers)
- Mixed content: HTTPS pages loading HTTP resources

### Remediation

- Send `Strict-Transport-Security: max-age=31536000; includeSubDomains` on all HTTPS responses
- Extend `max-age` to at least one year; two years for preload eligibility
- Submit domain to browser HSTS preload lists after confirming full HTTPS deployment
- Enforce HTTPS-only cookies using the `Secure` flag

---

## WSTG-CONF-08: Test RIA Cross Domain Policy

### Objective

Audit cross-domain policy files (`crossdomain.xml`, `clientaccesspolicy.xml`) for overly permissive settings that enable cross-site request forgery and unauthorized cross-domain data access.

### How to Test

**Retrieve Policy Files.** Request `crossdomain.xml` and `clientaccesspolicy.xml` from the application root and from every subdirectory. The master policy at the root is checked first, but individual directories can contain additional policies.

**Evaluate Permissions.** For each policy file, examine: `site-control` (does the master permit arbitrary policy files?), `allow-access-from` (which domains, ports, protocols are granted access?), `allow-http-request-headers-from` (which domains can send arbitrary headers?), and the `secure` attribute (`secure="false"` permits non-HTTPS connections).

**Identify Overly Permissive Patterns.** `domain="*"` grants any domain access. `permitted-cross-domain-policies="all"` allows subsidiary policies to override the master. `headers="*"` allows any HTTP header in cross-domain requests. `secure="false"` enables man-in-the-middle attacks.

**Test File Upload Abuse.** Check whether file upload endpoints can host attacker-controlled policy files at predictable paths, bypassing restrictive master policies.

### What to Look For

- `crossdomain.xml` with `domain="*"` granting universal access
- `secure="false"` permitting non-HTTPS cross-domain requests
- `clientaccesspolicy.xml` with overly broad domain grants
- Policy files in subdirectories overriding restrictive master policies

### Remediation

- Remove policy files entirely if RIA cross-domain access is not required
- Restrict `allow-access-from` to explicitly listed, trusted domains only
- Always use `secure="true"` to enforce HTTPS for cross-domain connections
- Use `permitted-cross-domain-policies="master-only"` to prevent subsidiary overrides
- Restrict header permissions to only those required by the application

---

## WSTG-CONF-09: Test File Permission

### Objective

Identify files and directories with overly permissive access settings that expose sensitive information or allow unauthorized modification.

### How to Test

**Recursive Permission Review.** Examine all files and directories within the web application structure, recursively from the webroot upward. Focus on:
- Web files/directories — verify content is not modifiable by unauthorized users
- Configuration files — ensure credentials, API keys, and connection strings are readable only by the application service account
- Sensitive data files — private keys and password files must have minimal read access
- Log files — verify readable only by the logging service and administrators
- Executables — scripts (`.php`, `.asp`, `.jsp`, `.jar`) must not be writable by the web server process unless required
- Database files — must not be world-readable
- Temp files/directories — must not be world-readable
- Upload directories — must prevent script execution and not grant excessive permissions

**World-Readable Configuration.** Configuration files frequently ship with default world-readable permissions. Sensitive data within becomes exposed to any local user or remote attacker with a low-privilege shell.

### What to Look For

- Configuration files with world-readable permissions containing passwords or API tokens
- Web-accessible directories writable by the web server process
- Executable scripts writable by non-owner users
- Private key files readable beyond the application service account
- Upload directories inheriting execute permissions

### Remediation

- Apply least privilege to all files and directories
- Set configuration files readable only by the application service account and administrators
- Ensure web server process has read-only access to application files unless write is required
- Remove world-readable permissions from all sensitive files, keys, and logs
- Configure upload directories to prevent script execution
- Audit file permissions regularly

---

## WSTG-CONF-10: Test for Subdomain Takeover

### Objective

Identify DNS resource records pointing to unclaimed or deprovisioned services, allowing an adversary to register the orphaned resource and take control of the subdomain.

### How to Test

**DNS Enumeration.** Enumerate all DNS resource records (A, CNAME, MX, NS, TXT) using dictionary attacks, brute force, certificate transparency logs, and search engine OSINT.

**Identify Dangling Records.** For each subdomain, verify the pointed-to service still exists and is controlled by the organization. Investigate records returning `NXDOMAIN`, `SERVFAIL`, `REFUSED`, or connection timeouts.

**Test CNAME Records.** When a CNAME points to a hostname returning `NXDOMAIN`, the referenced hostname may be available for registration. If the service provider lacks ownership verification, an adversary can claim it.

**Test A Records.** When an A record points to a cloud service IP returning a 404 or "not found" page (e.g., GitHub Pages "There isn't a GitHub Pages site here"), the subdomain may be claimable through the provider's provisioning interface.

**Test NS Records.** An expired or purchasable nameserver domain represents the highest-impact takeover — the adversary gains control over the entire DNS resolution chain.

**Verify Claimability.** Confirm whether the service provider requires ownership verification. Providers lacking this check allow any user to claim a subdomain by configuring their resource to respond to that hostname.

### What to Look For

- CNAME records pointing to non-existent or unregistered hostnames
- A records to cloud IPs returning 404/not-found pages
- NS records referencing expired or purchasable nameserver domains
- Subdomains pointing to deprovisioned resources (deleted GitHub repos, terminated S3 buckets, removed Heroku apps)
- DNS records for migrated services whose old entries were not cleaned up

### Remediation

- Remove DNS resource records pointing to deprovisioned or inactive services immediately
- Implement a decommissioning process that includes DNS record removal
- Conduct continuous monitoring and periodic audits of all DNS records
- Maintain a full inventory of subdomains and their associated services

---

## WSTG-CONF-11: Test Cloud Storage

### Objective

Assess whether cloud storage services are configured with proper access controls, preventing unauthorized read, write, or deletion of stored objects.

### How to Test

**Identify Storage URLs.** Locate cloud storage URLs in HTTP responses (image tags, scripts, stylesheets), JavaScript source, API responses, configuration files, and documentation.

**Test Read Access.** Attempt to retrieve objects from identified storage URLs without authentication. Test for both specific object access and directory listing capabilities.

**Test Write Access.** Attempt to upload files to identified storage endpoints. Successful upload to a publicly writable bucket allows hosting malicious content, tampering with application data, or phishing.

**Test Delete Access.** Attempt to remove objects. Successful deletion disrupts application functionality or removes evidence.

**Amazon S3 Specifics.** S3 uses two URL formats: virtual hosted (`bucket-name.s3.region.amazonaws.com`) and path-style (`s3.region.amazonaws.com/bucket-name`). Test both and the legacy global endpoint (`s3.amazonaws.com/bucket-name`). Buckets are private by default but explicit policies or public ACLs can grant unintended access.

**Gray-Box.** Review cloud provider consoles for bucket/container policies, IAM roles, and access control lists. Verify public access blocks are enabled and policies grant only necessary permissions.

### What to Look For

- Publicly readable storage buckets exposing sensitive data
- Publicly writable buckets allowing arbitrary upload
- Object listing enabled, exposing all stored files
- Authenticated users accessing objects belonging to other users
- Storage URLs discoverable in client-side code
- Cloud policies granting `*` principal access

### Remediation

- Block all public access at the bucket or container level using provider features
- Implement bucket policies granting least-privilege access to specific principals
- Enable access logging on storage services to detect unauthorized access
- Encrypt sensitive objects at rest and in transit
- Regularly audit bucket policies and access control lists
- Use pre-signed URLs with expiration for temporary access instead of embedding storage URLs in client code

---

## Common Vulnerability Patterns and Misconfigurations

### Highest-Impact Issues by Frequency

1. **Backup files in webroot** — Source code disclosure via `.bak`, `.old`, `~` files is among the most prevalent exploitable findings. A single backup can expose database credentials, API keys, and full application logic.
2. **Default credentials on admin interfaces** — Unchanged defaults on Tomcat, Jenkins, phpMyAdmin, WordPress, and similar platforms provide immediate administrative access.
3. **Directory listing enabled** — Revealing every file in a directory accelerates discovery of backup files, config files, and unlinked admin pages.
4. **TRACE method enabled** — Combined with XSS, enables theft of HttpOnly cookies and Authorization tokens.
5. **Missing HSTS header** — Leaves users vulnerable to SSL stripping, particularly on public Wi-Fi.
6. **Overly permissive crossdomain.xml** — `domain="*"` policies enable CSRF attacks against Flash and legacy RIA clients.
7. **Cloud storage buckets with public list/read access** — Increasingly targeted by ransomware actors and automated scanners.
8. **Log files containing credentials** — GET parameters logged with passwords create a secondary credential store.

### Bug-Finding Efficiency Tips

- **Start with robots.txt.** It explicitly enumerates directories the site owner wants hidden — the fastest way to discover admin panels, backup directories, and staging environments.
- **Test file extensions systematically.** For every known file, append `.bak`, `.old`, `.orig`, `.save`, `~`, `.tmp`, `.swp`, `.1`, `.tar.gz`, and `.zip`. This frequently yields source code disclosure.
- **Review comments.** Developer comments in HTML and JavaScript regularly reference hidden pages, internal IPs, and disabled functionality — often overlooked in automated scans.
- **Enumerate DNS records first.** Dangling CNAME records and unclaimed cloud endpoints can yield immediate subdomain takeover without interacting with the application.
- **Check HSTS and security headers early.** Fast response-header-level verification provides immediate insight into the organization's security maturity.
- **Test HTTP methods on protected endpoints, not just the root.** Method-switching bypasses are frequently missed when testing only on unauthenticated public endpoints.
- **Review S3 bucket URLs in client-side code.** Developers embed direct bucket references in HTML and JavaScript more often than they realize.
- **In load-balanced environments, test each server individually.** Asymmetric configurations between nodes produce missed vulnerabilities.

---

## References

- OWASP Web Security Testing Guide v4.2 — Configuration and Deployment Management Testing (WSTG-CONF)
- OWASP Testing Guide: https://owasp.org/www-project-web-security-testing-guide/v42/
- OWASP Logging Cheat Sheet
- NIST SP 800-92 — Guide to Computer Security Log Management
- PCI DSS v3.2.1 Requirement 10 (logging and monitoring)
- CWE-732: Incorrect Permission Assignment for Critical Resource
- RFC 6797 — HTTP Strict Transport Security (HSTS)
- Adobe Cross-Domain Policy File Specification
- HSTS Preload List: https://hstspreload.org
