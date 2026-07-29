---
name: wstg-information-gathering
description: Use when performing reconnaissance, fingerprinting web servers, discovering application entry points, enumerating application content and infrastructure, reviewing web metadata for information leakage, or mapping application architecture during a penetration test or security assessment.
---

# WSTG Information Gathering

Systematically discover and enumerate a target web application's attack surface using OWASP WSTG v4.2 methodologies. This skill covers 10 test cases (WSTG-INFO-01 through WSTG-INFO-10) for uncovering exposed configuration details, server fingerprints, application components, entry points, and architectural weaknesses before exploitation begins. The goal is to build a comprehensive map of what an attacker can learn about the target without exploiting vulnerabilities directly.

## Quick Reference

| ID | Test | Objective |
|---|---|---|
| WSTG-INFO-01 | Search Engine Discovery Reconnaissance | Find sensitive information exposed via search engine indexes and caches |
| WSTG-INFO-02 | Fingerprint Web Server | Determine web server type and version for known-vulnerability matching |
| WSTG-INFO-03 | Review Webserver Metafiles | Discover hidden paths, functionality, and sensitive metadata in robots.txt, sitemaps, security.txt, etc. |
| WSTG-INFO-04 | Enumerate Applications on Webserver | Identify all web applications hosted on the target infrastructure |
| WSTG-INFO-05 | Review Webpage Content | Find information leakage in HTML comments, JavaScript, and source maps |
| WSTG-INFO-06 | Identify Application Entry Points | Map all HTTP endpoints, parameters, headers, and data injection points |
| WSTG-INFO-07 | Map Execution Paths | Document application workflows, decision points, and code coverage |
| WSTG-INFO-08 | Fingerprint Web Application Framework | Identify the web framework, CMS, or application components in use |
| WSTG-INFO-09 | Fingerprint Web Application | Merged into WSTG-INFO-08 |
| WSTG-INFO-10 | Map Application Architecture | Map infrastructure components: proxies, load balancers, databases, firewalls |

---

## WSTG-INFO-01: Search Engine Discovery Reconnaissance

### Objective
Identify sensitive design and configuration information exposed directly on the organization's website or indirectly via third-party services (forums, code repositories, newsgroups).

### How to Test
Search engines index content based on tags (TITLE, META), link structure, and sitemaps. If robots.txt is incomplete or meta robots tags are absent, sensitive content enters public indexes. Search across multiple engines because each has a different crawl schedule and ranking algorithm: Google, Bing, DuckDuckGo, Shodan (for Internet-connected devices), the Internet Archive Wayback Machine (for historical content), and specialized engines like Common Crawl and binsearch.info.

Apply search operators to narrow results to the target domain:
- `site:` to restrict results to a specific domain
- `inurl:` to find keywords in URLs
- `intitle:` to find keywords in page titles
- `intext:` or `inbody:` to find keywords in page body content
- `filetype:` to narrow to specific file extensions (pdf, xls, php, sql, etc.)
- `cache:` to view previously indexed versions of pages that may have changed or been removed

Chain operators creatively to discover specific sensitive files and information. This technique, known as "Google dorking," works across any search engine supporting operator syntax. Consult dork databases for predefined patterns targeting:
- Files containing usernames or passwords
- Sensitive directories and configuration files
- Error messages revealing internal paths or stack traces
- Vulnerable files and servers
- Admin interfaces and footholds

### What to Look For
- Network diagrams and infrastructure configuration documents
- Archived forum posts or emails from administrators disclosing procedures
- Login procedures, username formats, and credential dumps
- Private keys, API tokens, and cloud service configuration files
- Error messages revealing internal paths, database schemas, or stack traces
- Development, test, UAT, and staging environment URLs not intended for public access
- Backup files (.bak, .old, .sql, .zip) indexed in search results

### Remediation
- Review sensitivity of all design and configuration information before posting online
- Implement and validate an up-to-date robots.txt with appropriate Disallow directives
- Use META robots tags (NOINDEX, NOFOLLOW) on pages that should not appear in search results
- Request removal of inadvertently indexed content through search engine webmaster tools
- Apply authentication to sensitive environments (staging, dev, admin panels)
- Periodically audit search engine indexes for leaked content using the site: operator

---

## WSTG-INFO-02: Fingerprint Web Server

### Objective
Determine the type and version of a running web server to identify known version-specific vulnerabilities and plan appropriate attack vectors.

### How to Test
**Banner Grabbing:** Send an HTTP request and examine the `Server` response header. The banner often reveals the exact software and version (e.g., `Apache/2.4.41 (Unix)`, `nginx/1.17.3`, `lighttpd/1.4.54`). When the header is obfuscated (e.g., `Server: Website.com`), analyze the ordering and presence of response header fields. Different server families emit headers in characteristic sequences—Apache puts Date before Server; nginx puts Server before Date. This method is probabilistic, not definitive.

**Malformed Requests:** Send intentionally incorrect HTTP requests (invalid methods, malformed protocol versions, excessively long URLs) to trigger default error pages. Default 400, 404, and 500 error pages differ markedly between server types in HTML structure, text content, and included version footers. Examine the response body for version strings and structural patterns even when the Server header is suppressed.

**Automated Fingerprinting:** Use scanning tools that maintain response signature databases and send server-specific probes beyond manual techniques. Automated tools compare multiple response characteristics against known fingerprints for higher accuracy.

### What to Look For
- `Server` header revealing exact software and version
- Header field ordering patterns indicating server family (Apache vs. nginx vs. IIS vs. lighttpd)
- Default error page HTML structure, DOCTYPE declarations, and embedded version information
- Response to malformed methods revealing server type in error body (e.g., `<hr><center>nginx/1.17.3</center>`)
- Additional identifying headers: `X-Powered-By`, `X-AspNet-Version`, `X-Generator`

### Remediation
- Obscure the `Server` header using web server modules (e.g., Apache mod_headers, nginx server_tokens off)
- Deploy a hardened reverse proxy to strip identifying headers before they reach the client
- Customize default error pages to remove server-identifying content
- Keep web servers updated with latest software and security patches—obscuring the version does not fix underlying vulnerabilities
- Recognize that header obfuscation is a defense-in-depth measure, not a substitute for patching

---

## WSTG-INFO-03: Review Webserver Metafiles for Information Leakage

### Objective
Identify hidden or obfuscated paths and functionality through analysis of metadata files. Extract information that reveals attack surface, technology details, or provides social engineering leverage.

### How to Test
**robots.txt:** Retrieve and review the Robots Exclusion Protocol file from the web root. Each `Disallow` directive reveals a path the site owner intends to keep hidden from crawlers—which makes those paths prime targets for attackers. Pay attention to User-Agent-specific blocks that reveal paths hidden only from certain crawlers. Cross-reference robots.txt entries with robots META tags in individual HTML pages; inconsistencies may indicate forgotten or transitional content.

**META Tags:** Examine the `<head>` section of each page for `<META>` tags that leak information:
- `<META NAME="ROBOTS" CONTENT="...">`—deviations from robots.txt indicate page-level overrides
- `<META NAME="Author" CONTENT="...">`—reveals personnel names for social engineering
- `<META NAME="keywords" CONTENT="...">`—discloses internal terminology and focus areas
- Open Graph (`og:*`) and Twitter Card (`twitter:*`) meta tags—expose URL structures, internal naming conventions, and application IDs

**Sitemaps:** Retrieve `sitemap.xml` from the web root and from locations referenced in robots.txt. Sitemaps enumerate public-facing pages comprehensively and may expose forgotten endpoints, administrative paths, or legacy content. Follow nested sitemap index references to discover sub-sitemaps for different application areas.

**security.txt:** Check both `/.well-known/security.txt` and `/security.txt`. This proposed standard file discloses security contact information, bug bounty program details, encryption keys, and policy links. This information enables targeted social engineering and reveals the organization's security posture and disclosure policies.

**humans.txt:** Retrieve `/humans.txt`. This file often lists team members, technologies used, and career-related paths—providing names for credential guessing, OSINT, and technology stack inference.

**.well-known/ Resources:** Systematically probe the `.well-known/` directory using a list derived from relevant RFCs and Internet drafts. Standardized URIs defined in RFC 8615 and subsequent specifications may expose configuration endpoints, authentication metadata, and service discovery information.

### What to Look For
- Disallowed paths in robots.txt pointing to admin panels, internal tools, backup directories
- robots.txt META tag inconsistencies suggesting transitional or unmaintained content
- Sensitive paths enumerated in sitemaps (staging URLs, admin portals, API endpoints)
- Contact details and policy URLs in security.txt enabling social engineering
- Team member names, roles, and technologies in humans.txt
- `.well-known/` endpoints revealing security policies, openid configuration, ACME challenges, etc.
- Differences between User-Agent-specific directives in robots.txt suggesting hidden areas for particular crawlers

### Remediation
- Use robots.txt to signal intent, not as a security control—any file or directory listed there is discoverable
- Restrict sensitive paths through authentication and authorization, not Disallow directives
- Audit robots.txt and sitemap.xml before deployment to ensure no sensitive paths are exposed
- Review and strip unnecessary META tags from production HTML
- Evaluate whether security.txt and humans.txt truly need to be public-facing
- Periodically scan `.well-known/` endpoints to ensure only intentional resources are exposed

---

## WSTG-INFO-04: Enumerate Applications on Webserver

### Objective
Identify all web applications accessible on a given infrastructure, including those at non-obvious URLs, on non-standard ports, or behind virtual hosting configurations.

### How to Test
Applications hide in three primary ways:

**1. Non-standard URLs (Different Base URL):** An application may not start at `/`. It may live at `/admin`, `/webmail`, `/dev`, or a non-guessable path. Discovery relies on:
- Directory browsing misconfiguration—if enabled, the webserver lists directory contents
- Search engine indexes—spidered content may reveal hidden application URLs via the `site:` operator
- Dictionary-based forced browsing using common administrative and application path wordlists
- Vulnerability scanners that probe for known application patterns

**2. Non-standard Ports:** Web applications may run on arbitrary TCP ports beyond 80 and 443. Perform a full 65535-port scan with service version detection. Examine results for HTTP/HTTPS services on any port. Manually verify discovered services by sending HTTP requests and inspecting responses for web server banners, HTML content, or application-specific markers.

**3. Virtual Hosts:** A single IP address may serve multiple DNS names, each routing to different applications via the HTTP `Host` header. Discovery techniques:
- **DNS Zone Transfers:** Request zone transfers from authoritative name servers. Though rarely allowed today, a successful transfer enumerates all DNS records for the domain, revealing subdomains and associated applications.
- **DNS Inverse (PTR) Queries:** Query PTR records for the target IP address to discover reverse-mapped hostnames.
- **Web-based DNS Search Services:** Use online services that aggregate DNS data and provide name-based domain searches.
- **Reverse-IP Lookup Services:** Query web-based services that map IP addresses to all known domain names hosted on them. Use multiple services, as results vary.
- **Search Engine Enumeration:** Search for the discovered domain names and IP ranges using the `ip:` or `site:` operators to uncover additional related hosts.

### What to Look For
- HTTP/HTTPS services on unexpected ports (8000, 8080, 8443, 9090, 3000, 5000, etc.)
- Directory listing pages exposing application subdirectories
- Virtual hosts serving entirely different applications on the same IP
- Administrative interfaces (Tomcat Manager, phpMyAdmin, Jenkins, etc.) at non-obvious paths
- Forgotten or legacy applications still running on the infrastructure
- Subdomains not in scope documentation but accessible on the same infrastructure
- DNS records revealing internal hostnames (intranet, vpn, db, admin prefixes)

### Remediation
- Disable directory browsing on all web servers
- Remove or restrict access to non-production applications (dev, test, staging) from public networks
- Implement proper virtual host configurations with default catch-all virtual hosts
- Restrict zone transfers to authorized secondary DNS servers only
- Audit DNS records and remove stale entries pointing to decommissioned services
- Regularly port-scan internet-facing IP ranges to detect unauthorized services

---

## WSTG-INFO-05: Review Webpage Content for Information Leakage

### Objective
Review webpage comments, metadata, JavaScript code, and front-end debug files to find information leakage that aids an attacker in understanding the application, discovering hidden functionality, or obtaining credentials.

### How to Test
**HTML Comments and Metadata:** Examine the full HTML source of every page. Search for `<!--` comment markers that may contain:
- SQL queries exposing database schema or table structure
- Hardcoded credentials or password hints left by developers
- Internal IP addresses, hostnames, or network paths
- Debugging flags and environment indicators
- Developer notes describing intended behavior or known issues

**META Tags and DTD Declarations:** Review DOCTYPE declarations and META tags for:
- Document type URLs (`strict.dtd`, `loose.dtd`, `frameset.dtd`) indicating legacy compatibility modes
- META `Refresh` tags revealing redirect targets and timing
- `http-equiv` values exposing server-side processing hints
- Proprietary META tags (`theme-color`, `apple-mobile-web-app-title`, `msapplication-TileColor`) that confirm platform targeting

**JavaScript Code Review:** Identify and retrieve all JavaScript sources—inline `<script>` blocks, externally referenced `.js` files, and dynamically loaded modules. Search for:
- Hardcoded API keys, access tokens, and secret keys (AWS, Google Maps, Stripe, etc.)
- Internal IP addresses and hostnames used in API endpoint construction
- Sensitive routes pointing to admin pages or internal services
- Database connection strings with embedded credentials
- Configuration objects exposing staging/production URLs and feature flags
- JSON blobs in `<script type="application/json">` tags containing initialization data

**Source Map Files:** Append `.map` to discovered JavaScript and CSS file URLs. Source maps connect minified production bundles to original authored source code. When exposed, they reveal:
- Full directory structures of the build environment (including usernames like `/home/sysadmin/`)
- Original function and variable names, comments, and documentation
- Complete source logic that was designed to be obfuscated
- Internal API endpoints and business logic in human-readable form

### What to Look For
- SQL fragments in HTML comments revealing table names and column structures
- API keys with unrestricted scope (check key restrictions per service, IP, HTTP referrer, or SDK)
- Hardcoded credentials in JavaScript variables or JSON configuration blocks
- Internal network addresses (`10.x.x.x`, `192.168.x.x`) in front-end code
- Source map files exposing original source code with developer comments and internal paths
- `BASE_URL_VOUCHER_API`, `ADMIN_PAGE`, or similar configuration variables in JavaScript
- Database connection strings embedded in client-side code

### Remediation
- Strip all non-essential HTML comments from production builds using build tool plugins
- Never embed credentials, API keys, or internal hostnames in client-side code—use environment variables and server-side rendering
- Restrict API keys by IP address, HTTP referrer, and service scope at the provider level
- Exclude source map files from production deployments; use them only in development and staging
- Implement automated CI/CD checks that scan built assets for secrets before deployment
- Conduct periodic reviews of rendered HTML and JavaScript in production for leaked sensitive data

---

## WSTG-INFO-06: Identify Application Entry Points

### Objective
Identify all possible entry and injection points through systematic request and response analysis to build a complete map of the application's attack surface before testing begins.

### How to Test
**Request Analysis:** Walk through every user-accessible function of the application, capturing all HTTP requests with an intercepting proxy. Document every entry point in a structured format (spreadsheet) recording: the URL path, HTTP method (GET, POST, PUT, DELETE, PATCH), all parameters in query strings and request bodies, custom and standard HTTP headers, and whether the endpoint requires authentication, uses TLS, is part of a multi-step workflow, or involves WebSockets.

Within requests, identify:
- **GET parameters:** All query string parameters after the `?` delimiter, including those in encoded or nested formats
- **POST body parameters:** Every form field, including hidden fields that carry state, pricing, quantities, or user identifiers the developer did not intend for modification
- **Hidden form fields:** Parameters not visible in the rendered UI but transmitted in the body—these often control server-side state, access levels, or business logic
- **Custom headers:** Non-standard headers (e.g., `debug: false`, `X-Forwarded-For`, `X-Client-IP`) that may influence server behavior
- **Non-standard HTTP methods:** PUT, DELETE, PATCH, OPTIONS, TRACE, and CONNECT—if enabled, these may expose unintended functionality

**Response Analysis:** Examine every response for:
- **Set-Cookie headers:** New, modified, or domain-scoped cookies that establish session state
- **Redirects (3xx):** Location headers revealing internal URL structures and multi-step flows
- **Error responses (4xx, 5xx):** Status codes and error pages that may disclose server type, framework, or internal paths
- **Interesting headers:** `Server: BIG-IP` (load balancer), `X-Cache: HIT` (caching proxy), `X-Debug-Token` (debug mode), or `Via:` (intermediate proxies)

**Gray-Box Testing:** In gray-box engagements, interview developers to identify input sources beyond HTTP: SMTP mail handlers, syslog message processors, SNMP trap receivers, SOAP/REST web services consuming external data, message queue consumers, and file upload processors. Map how external data enters the application and what format it expects.

### What to Look For
- Hidden form fields containing prices, user roles, or access control flags
- Custom HTTP headers that toggle debug modes, bypass authentication, or override IP restrictions
- URL parameters that appear encrypted or encoded—they're still potentially manipulable
- Multi-step process parameters that carry state across requests (step, flow, stage, workflow)
- WebSocket endpoints used for real-time communication with the server
- API endpoints discovered only through JavaScript analysis, not spidering
- Cookie values that appear to be structured data (Base64, JWT, serialized objects)

### Remediation
- Never trust client-side data—validate all parameters, including hidden fields, on the server
- Remove or disable debug headers and mode toggles in production
- Enforce proper authorization on every endpoint regardless of how it was discovered
- Implement Content Security Policy and proper CORS headers to restrict unintended access
- Use parameterized queries and strong input validation at all entry points
- Audit non-standard HTTP methods and disable unnecessary ones (TRACE, OPTIONS, CONNECT)

---

## WSTG-INFO-07: Map Execution Paths Through Application

### Objective
Map the target application's structure and understand principal workflows to ensure comprehensive test coverage and demonstrate testing thoroughness to stakeholders.

### How to Test
In black-box testing, achieving full code path coverage is infeasible. The practical goal is to document which paths were discovered and tested, and to reason about untested areas. Approach coverage through three lenses:

**Path Coverage:** Test each significant decision branch in the application. When a user choice leads to different outcomes (e.g., payment methods, user roles, configuration options), test each variant. Document decision points with URLs, parameter combinations, and expected behaviors. Consider boundary value analysis—test edge cases at the limits of expected input ranges.

**Data Flow (Taint Analysis):** Trace how user-supplied data flows through the application: where it enters (entry points from WSTG-INFO-06), how it is transformed (encoding, validation, sanitization), where it is stored (session, database, cache), and where it is rendered output (HTML, JSON, logs, emails). Focus on points where data crosses trust boundaries—from user to server, from database to page, from API response to DOM.

**Race Condition Coverage:** Identify shared resources that multiple concurrent requests can access (shopping cart quantities, ticket reservations, account balances, file uploads). Test simultaneous operations to find time-of-check-to-time-of-use (TOCTOU) vulnerabilities.

**Automatic Spidering:** Deploy spidering tools to discover linked resources. Start with seed URLs from manual exploration. Use both traditional spiders (which follow `<a>` links) and AJAX spiders (which execute JavaScript and interact with dynamic content). Supplement with OpenAPI/Swagger specification parsing when available—these documents enumerate API endpoints systematically.

**Code Review (Gray/White-Box):** Compare discovered paths against source code or developer-provided documentation. Identify code paths that are hard to reach through UI interaction (admin-only features, error recovery flows, deprecated but still accessible endpoints). Document gaps between what was tested and what exists in code.

### What to Look For
- Multi-step workflows where skipping steps or modifying step parameters alters behavior
- Role-based path differences—admin vs. user vs. anonymous code paths
- Error recovery paths that bypass normal business logic
- Deprecated or legacy endpoints still accessible but not linked from the current UI
- Asynchronous operations (AJAX, fetch, WebSocket) that are not discovered through traditional spidering
- Race condition windows in operations involving shared mutable state

### Remediation
- Document expected application workflows and validate that all paths enforce authorization
- Implement server-side workflow enforcement—prevent step skipping by validating state transitions
- Use transaction isolation and optimistic concurrency control for race-prone operations
- Remove or properly secure deprecated endpoints that are no longer maintained
- Provide developer documentation that maps endpoints to authorization requirements for testing

---

## WSTG-INFO-08: Fingerprint Web Application Framework

### Objective
Fingerprint the components, frameworks, and CMS platforms used by the web application to focus testing on known vulnerabilities and exploits specific to those technologies.

### How to Test
Framework identification leverages multiple signal sources because any single source can be obfuscated:

**HTTP Headers:** The `X-Powered-By` header often reveals the language or framework (e.g., `PHP/5.4.16`, `ASP.NET`, `Mono`). However, this header is easily disabled or spoofed. Also examine `X-Generator` (e.g., `Swiftlet`, `Drupal`) and `Set-Cookie` headers for framework-default cookie names.

**Cookies:** Session and preference cookies set by the application often use framework-default names that persist even when headers are suppressed. Common framework cookie signatures include:
- `CAKEPHP` or `cakephp` → CakePHP
- `PHPSESSID` → PHP
- `JSESSIONID` → Java/J2EE servers
- `laravel_session` → Laravel
- `wp-settings` → WordPress
- `ASPSESSIONID` → ASP classic
- `.AspNetCore.` → ASP.NET Core

Even when renamed, cookie structure and encoding patterns remain framework-characteristic. Refer to the cookie-to-framework mapping table for 25+ common frameworks.

**HTML Source Code:** Inspect `<head>` sections for `<meta name="generator">` tags that explicitly declare the framework and version (WordPress, Joomla, Drupal, MediaWiki). Look for framework-specific HTML comments (e.g., `<!-- ZK`, `<!-- START headerTags.cfm` for ColdFusion), hidden form fields (`__VIEWSTATE` for ASP.NET), and recognizable directory paths in `src` and `href` attributes (`/wp-content/`, `/sites/all/modules/`, `/skin/`).

**Specific Files and Folders (Forced Browsing/Dirbusting):** Brute-force known framework directories and files using wordlists of predictable paths. Each framework creates a characteristic file structure:
- WordPress: `/wp-admin/`, `/wp-includes/`, `/wp-content/`, `/wp-login.php`
- Drupal: `/sites/all/`, `/modules/`, `/themes/`, `CHANGELOG.txt` disclosing exact version
- Joomla: `/administrator/`, `/components/`, `/modules/`, `/language/`
- phpBB: `/adm/`, `/includes/`, `/styles/`, `/language/`
- Jenkins: `/jnlpJars/`, `/pluginManager/`, `/script`

Monitor HTTP response codes—a 403 (Forbidden) confirms the path exists but is protected; a 302 (redirect to login) reveals the authentication gate. Before dirbusting, check `robots.txt` for framework-specific Disallow entries that already enumerate these paths.

**File Extensions:** URL file extensions indicate the underlying technology:
- `.php` → PHP
- `.aspx`, `.ashx`, `.asmx` → ASP.NET
- `.jsp`, `.do`, `.action` → Java
- `.cfm`, `.cfc` → ColdFusion
- `.py` → Python (WSGI/FastCGI)
- `.rb` → Ruby

**Error Messages:** Trigger verbose errors by submitting unexpected input. Stack traces, PHP errors, and database error pages frequently disclose the full framework path on disk, the framework name and version, the underlying database type, and the operating system.

### What to Look For
- Exact framework name and version in `<meta name="generator">` tags
- Framework-default cookies that persist despite header obfuscation
- Characteristic directory structures confirmed via forced browsing
- CHANGELOG, README, and VERSION files disclosing exact plugin or component versions
- Error messages revealing framework internals, file paths, and database types
- JavaScript libraries and CSS frameworks that indicate the broader technology stack
- `composer.json`, `package.json`, `Gemfile`, or `requirements.txt` accidentally exposed at web root

### Remediation
- Remove or suppress `X-Powered-By`, `X-Generator`, and similar identifying headers
- Customize framework-default cookie names in configuration (though this is only obfuscation)
- Remove `<meta name="generator">` tags from production HTML output
- Restrict access to framework-specific directories and configuration files at the web server level
- Delete or restrict access to CHANGELOG, README, and other informational files in production deployments
- Configure production error handling to show generic error pages without framework details
- Recognize that obscurity alone is insufficient—maintain up-to-date patching and secure configuration as the primary defense

---

## WSTG-INFO-09: Fingerprint Web Application

This test case is now merged into WSTG-INFO-08 (Fingerprint Web Application Framework). All methodology, signals, and remediation guidance apply as described above.

---

## WSTG-INFO-10: Map Application Architecture

### Objective
Generate a map of the application's infrastructure architecture to understand how components interact, where trust boundaries exist, and how a compromise in one component might affect the entire system.

### How to Test
Start with the assumption of a single-server setup and iteratively refine the architecture map as new evidence emerges. Ask structured questions about each infrastructure layer:

**Firewall Detection:** Determine whether a firewall stands between the tester and the web server. Examine network scan results: if non-listening ports return no response or ICMP unreachable messages, a firewall is filtering. If they return TCP RST packets, the server is likely directly connected. Analyze the type of filtering (stateful firewall, router ACL, WAF) by observing how attack-like requests are handled.

**Reverse Proxy Detection:** Analyze the `Server` header—some proxies identify themselves (e.g., `BigIP`). Compare server responses to expected behavior: a reverse proxy acting as an IPS may return different error pages for known attack patterns than the backend web server would. If the server claims to support certain HTTP methods (e.g., TRACE) but those methods return errors, an intermediary is likely blocking them. Some protection systems self-identify in error pages (e.g., mod_security banners). Cache proxies can be detected by timing requests—cached responses return significantly faster than uncached ones for the same resource.

**Load Balancer Detection:** Send multiple identical requests and compare response characteristics. Differences in the `Date` header (unsynchronized server clocks), `Server` header variations, or response content indicate requests reaching different backend servers. Load balancers often inject identifying markers: F5 BIG-IP inserts a `BIGipServer` cookie; Apache mod_proxy_balancer may add `X-Forwarded-For`; HAProxy may include `X-Forwarded-Proto`. Application-level session persistence cookies may also reveal the load balancing infrastructure.

**Application Server Detection:** Distinguish between the front-end web server and the backend application server. When requests for dynamic resources return headers that differ significantly from static resources (different `Server` values, additional `Set-Cookie` headers), an application server is handling the dynamic content. Application servers often set their own cookies (e.g., `JSESSIONID` for J2EE, `PHPSESSID` for PHP) and may rewrite URLs automatically for session tracking.

**Database and Authentication Backends:** Detect database usage by observing application behavior. Dynamic content generation, numeric identifiers used for navigation (e.g., `?id=123`), and input-dependent results suggest a database backend. The specific database type usually remains unknown until a vulnerability (poor error handling, SQL injection) surfaces. Authentication backends (LDAP, RADIUS, SSO) are typically opaque from an external perspective but may be inferred from cookie names, redirect URLs, or login page structure (SAML, OAuth, OpenID Connect indicators).

### What to Look For
- Load balancer cookies (`BIGipServer`, `NSC_`, `ZopeId`, `SERVERID`)
- Reverse proxy headers (`Via:`, `X-Forwarded-For`, `X-Forwarded-Proto`, `X-Real-IP`)
- WAF detection through blocked attack patterns and custom error pages
- Application server cookies distinct from web server cookies
- Date header discrepancies indicating multiple backend servers
- Firewall filtering behavior: ICMP unreachable vs. TCP RST for closed ports
- Cache headers (`X-Cache:`, `X-Cache-Lookup:`, `Age:`) indicating caching proxies
- Authentication protocol indicators (SAML redirects, OAuth authorize endpoints, `/adfs/` paths)

### Remediation
- Configure firewalls to drop (not reject) traffic to unauthorized ports to avoid fingerprinting
- Strip or rewrite identifying headers from load balancers and proxies where possible
- Synchronize clocks across all backend servers to prevent load balancer detection via Date header analysis
- Customize error pages at every tier to be consistent and non-identifying
- Remove or obfuscate application-server-specific cookies if not required by application functionality
- Document the architecture map and use it to identify single points of failure and defense-in-depth gaps
- Treat architecture discovery as an ongoing process—infrastructure changes introduce new risks

---

## Common Vulnerability Patterns and Misconfigurations

### Information Leakage (Cross-cutting)
- **Exposed configuration files:** `.env`, `.git/config`, `web.config`, `wp-config.php.bak` accessible via web root
- **Verbose error messages:** Stack traces, database errors, and debug output enabled in production revealing internal paths, SQL queries, and framework internals
- **Backup files:** `.bak`, `.old`, `.swp`, `~` suffixed files left in web-accessible directories exposing source code
- **Version disclosure:** Exact software versions in headers, comments, and default files enabling targeted exploit selection
- **Directory listing enabled:** Allows browsing of upload directories, backup folders, and log directories

### Architectural Weaknesses
- **Staging/development environments publicly accessible:** Often less secured, with verbose logging and default credentials
- **Non-production ports exposed:** Admin interfaces on 8080, 8443, 9090 with default credentials
- **Virtual host confusion:** Default virtual host serving internal applications when accessed by IP
- **Missing default virtual host:** Requests with arbitrary Host headers reach internal applications

### Reconnaissance Efficiency Tips
- **Chain information sources:** A single leaked email address leads to a username pattern; a username pattern enables credential attacks; a server version enables targeted exploits
- **Use multiple search engines:** Google indexes 90%+ of a target; Shodan reveals services on non-standard ports; Wayback Machine shows historical content removed years ago
- **Check past versions:** The Internet Archive caches old robots.txt files, sitemaps, and pages that may reveal paths later removed from production
- **Correlate findings across tests:** A robots.txt Disallow entry (WSTG-INFO-03) combined with a JavaScript variable (WSTG-INFO-05) often points to the same hidden admin interface
- **Prioritize framework detection first:** Knowing the framework (WSTG-INFO-08) focuses all subsequent testing—skip generic scanning, go directly to framework-specific vulnerabilities
- **Sitemaps and robots.txt reveal what to test first:** These files are the developer's own map of the application—disallowed paths are the most interesting targets
- **Source maps are the highest-value single file:** When exposed, a source map often reveals more about the application in 30 seconds than hours of spidering

---

## References

- OWASP Web Security Testing Guide v4.2, Section 4.1: Information Gathering (WSTG-INFO)
- Google Hacking Database (GHDB) — Exploit-DB
- Bishop Fox Google Hacking Diggity Project
- RFC 9309 — Robots Exclusion Protocol
- RFC 9110 — HTTP Semantics (HTTP/1.1, header fields)
- RFC 8615 — Well-Known Uniform Resource Identifiers (URIs)
- draft-foudil-securitytxt — security.txt proposed standard
- IANA Well-Known URIs Registry
- OWASP Attack Surface Detector
