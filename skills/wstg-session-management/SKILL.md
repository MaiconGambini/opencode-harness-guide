---
name: wstg-session-management
description: Use when testing session management mechanisms, cookie attributes, session fixation, exposed session variables, CSRF protections, logout functionality, session timeout, session puzzling, or session hijacking during a penetration test or security assessment.
---

# OWASP WSTG v4.2: Session Management Testing

Comprehensive methodology for testing session management implementations in web applications. This skill covers all nine WSTG-SESS test cases, from cookie analysis through session hijacking. Use this skill whenever you assess how an application creates, maintains, and terminates user sessions — weak session management is the single most common path to account takeover.

## Why Session Management Testing Matters

Session management is the mechanism by which a web application maintains state across the stateless HTTP protocol. A single flaw in session token generation, transmission, or termination can allow an attacker to impersonate any user. The impact of session management bugs ranges from privilege escalation to full account takeover, making this testing category the highest-yield activity in most web application assessments.

## Quick-Reference Mapping

| Test ID | Test Name | Core Objective |
|---------|-----------|---------------|
| WSTG-SESS-01 | Session Management Schema | Evaluate token generation randomness, unpredictability, and structure |
| WSTG-SESS-02 | Cookies Attributes | Verify Secure, HttpOnly, Domain, Path, Expires, SameSite, and cookie prefixes |
| WSTG-SESS-03 | Session Fixation | Ensure session tokens are renewed after authentication |
| WSTG-SESS-04 | Exposed Session Variables | Confirm session tokens are encrypted in transit and not cached or logged |
| WSTG-SESS-05 | Cross Site Request Forgery | Determine if the application relies solely on browser-provided credentials |
| WSTG-SESS-06 | Logout Functionality | Validate server-side session invalidation and logout UI accessibility |
| WSTG-SESS-07 | Session Timeout | Confirm idle timeout is enforced server-side and tokens are destroyed |
| WSTG-SESS-08 | Session Puzzling | Detect session variable reuse across different application contexts |
| WSTG-SESS-09 | Session Hijacking | Identify cookies communicated over unencrypted channels vulnerable to theft |

---

## WSTG-SESS-01: Testing for Session Management Schema

### Objective
Verify that cookies and session tokens are created in a secure and unpredictable way, preventing attackers from predicting or forging valid session identifiers.

### How to Test

**Cookie Collection and Mapping**
Surf the entire application and document every cookie set by the server. For each cookie, record:
- Which page or action triggers its creation
- The `Set-Cookie` directive details (domain, path, flags)
- Which application areas require the cookie to function
- Whether the cookie value changes between requests, between users, or after authentication

A spreadsheet mapping cookies to application areas and their characteristics is the single most valuable artifact from this phase.

**Session Token Structure Analysis**
Examine the structure of session tokens for information leakage. Common mistakes include encoding sensitive data directly in the token (such as `192.168.100.1:owaspuser:password:15:58`) instead of using server-side lookups. Test whether the token is:
- Clear-text with obvious structure
- Encoded using hex, Base64, or other reversible encoding
- Partially hashed with static components mixed in
- A hybrid containing both static identifiers and variable portions

If static elements are identified, vary input conditions (different user accounts, different IP addresses, different browsers) and observe which portions of the token change. This reveals whether user attributes or environment data is embedded in the token.

**Predictability and Randomness Analysis**
Collect a large number of session tokens under controlled conditions and analyze for patterns:
- Are tokens provably random? Cryptographic randomness cannot produce identifiable patterns.
- Do identical input conditions produce identical tokens?
- Are portions of the token time-linked or incrementing?
- What is the actual entropy (variance) within the token space?
- Given full knowledge of the generation algorithm and previous tokens, can the next token be deduced?

Time sensitivity matters: collect tokens in rapid succession (under 50ms quantization) to isolate time-based components that would otherwise be hidden. Systems frequently use timestamps as seeds for pseudo-random generators.

**Cookie Reverse Engineering**
For cookies that appear structured, decompose them into sub-parts by identifying delimiters. Analyze each sub-part for:
- Character set (numeric, alphanumeric, hexadecimal)
- Variance across samples (static, limited-set, high-entropy)
- Relationship to known inputs (username, IP, timestamp)

Collect samples before and after authentication, and from different user accounts, to understand how the application state influences cookie values.

**Brute-Force Feasibility**
Calculate whether the session ID space is large enough to resist brute-forcing during the token's valid lifetime. A long token with high variance and a short validity period provides strong protection. A short token with low variance and a long lifetime creates a brute-force risk.

### What to Look For
- Session tokens shorter than 50 characters
- Linear algorithms based on predictable variables (client IP, username, sequential counters)
- Encoded but not encrypted tokens containing sensitive data
- Static token portions that correspond to user attributes
- Incremental or time-correlated patterns in token values
- Token space too small relative to session lifetime for brute-force resistance

### Remediation
Use cryptographic algorithms with key length of 256 bits (AES). Session ID length must be at least 50 characters. Tokens must be generated from cryptographically secure random sources, not from predictable inputs. Store all session state server-side; the token itself should be an opaque reference.

---

## WSTG-SESS-02: Testing for Cookies Attributes

### Objective
Ensure that cookies carrying session identifiers and other sensitive data use the correct security attributes to minimize attack surface.

### How to Test

**Secure Attribute Verification**
The `Secure` attribute instructs the browser to transmit the cookie only over HTTPS. If the application is accessible over both HTTP and HTTPS without redirecting to HTTPS, an active network attacker can strip the `Secure` flag and steal cookies. Verify:
- All `Set-Cookie` directives for session-related cookies include `Secure`
- The application enforces HTTPS for all authenticated pages (redirect chains, HSTS)
- Cookies cannot be forced over unencrypted transport by manually requesting HTTP

**HttpOnly Attribute Verification**
The `HttpOnly` attribute prevents client-side scripts from accessing the cookie via `document.cookie`, directly limiting the blast radius of XSS. While it does not prevent XSS attacks from making cross-site requests, it prevents cookie exfiltration via injected scripts. Verify that all session cookies carry the `HttpOnly` flag.

**Domain Attribute Verification**
The `Domain` attribute controls which hosts the cookie is sent to. A loosely scoped domain attribute (e.g., `.example.com`) exposes cookies to every subdomain, including potentially vulnerable or third-party hosted applications. Verify:
- The `Domain` attribute is as restrictive as possible
- No top-level domain attributes are set (browsers reject `.com`, `.gov`)
- If `Domain` is omitted, the cookie defaults to the exact origin, which is the most secure configuration

**Path Attribute Verification**
The `Path` attribute further restricts cookie scope within the same domain. A root path (`/`) sends cookies to every application on the same domain, increasing exposure if multiple applications share the host. Verify the path is scoped to the application that needs the cookie.

**Expires / Max-Age Verification**
- Session cookies (no `Expires` or `Max-Age`) are stored only in RAM and destroyed when the browser closes. Prefer this for authentication tokens.
- Persistent cookies survive browser restarts and must have a reasonably short lifetime appropriate to the data sensitivity.
- Verify that the application does not set persistent cookies for session management purposes.

**SameSite Attribute Verification**
The `SameSite` attribute controls cross-site request behavior and provides defense-in-depth against CSRF:
- `Strict`: Cookie sent only in first-party context. Strongest protection; may break login flows from external links.
- `Lax`: Cookie sent on top-level navigation from third-party sites (GET only). Good balance of security and usability; modern browser default.
- `None`: Cookie sent on all cross-site requests. Must be combined with `Secure`. Use only when third-party context is genuinely needed.

**Cookie Prefix Verification**
Cookie prefixes provide integrity guarantees encoded in the cookie name:
- `__Host-`: Must have `Secure`, must omit `Domain`, must have `Path=/`. Rejected by browsers if any condition is violated.
- `__Secure-`: Must have `Secure`. Less restrictive but still provides origin-binding guarantees.

### What to Look For
- Missing `Secure` flag on session cookies, especially on HTTPS-only applications
- Missing `HttpOnly` flag on session cookies
- Overly broad `Domain` attribute (e.g., `.example.com` instead of `app.example.com`)
- `Path=/` when the cookie is only needed for a specific application path
- Persistent cookies used for session management
- `SameSite=None` without `Secure`
- No cookie prefix on high-value session tokens

### Remediation
The most secure cookie configuration: `Set-Cookie: __Host-SID=<token>; path=/; Secure; HttpOnly; SameSite=Strict`. Adjust `SameSite` to `Lax` if `Strict` breaks legitimate cross-origin navigation flows. Always use cookie prefixes (`__Host-` or `__Secure-`) for session identifiers.

---

## WSTG-SESS-03: Testing for Session Fixation

### Objective
Determine whether an attacker can force a known session identifier into a victim's browser and later impersonate the victim after authentication.

### How to Test

**Session Token Renewal on Authentication**
The critical check: does the application issue a new session token upon successful login? If the same session cookie value persists before and after authentication, session fixation is trivially exploitable. An attacker obtains a valid (anonymous) session ID, tricks a victim into authenticating with it, then uses that same ID to access the victim's account.

To test:
1. Request the application without authenticating. Record the session cookie value.
2. Authenticate successfully.
3. Check whether the session cookie value changed. If it did not change, the application is vulnerable.

Note that some applications change the cookie value but keep the previous value valid server-side. Always test whether the pre-authentication cookie still grants access to authenticated functionality after login with a different session.

**Forced Cookie Testing (for Network Attackers)**
For applications without full HSTS adoption, test whether cookies that lack integrity protection can be forced on a victim:
1. Access the login page and save the pre-authentication cookie jar, excluding `__Host-` and `__Secure-` prefixed cookies.
2. Log in as the victim account to a page requiring authentication.
3. Restore the pre-authentication cookie jar.
4. Trigger a secure, authenticated function.
5. If the function succeeds, the pre-authentication cookies grant authenticated access.
6. Repeat from the attacker's account, injecting the pre-authentication cookies one by one to identify which specific cookies enable the attack.

### What to Look For
- Session token unchanged after authentication
- Pre-authentication cookies still valid for authenticated functionality
- No `__Host-` or `__Secure-` prefix on session cookies
- Application lacking full HSTS adoption when session cookies carry no integrity guarantees

### Remediation
Invalidate the existing session ID before authenticating a user. Upon successful authentication, issue a completely new session identifier. Implement full HSTS (with `includeSubDomains`) or use `__Host-` / `__Secure-` cookie prefixes to guarantee cookie integrity against network attackers.

---

## WSTG-SESS-04: Testing for Exposed Session Variables

### Objective
Ensure session tokens are protected from eavesdropping during transit, are never cached by intermediate proxies or browsers, and are not exposed in URLs or logs.

### How to Test

**Transport Encryption Verification**
Session tokens must travel exclusively over encrypted channels. Test every code path where a session token is transmitted:
- Replace `https://` with `http://` in URLs and observe whether the application still serves content with session cookies.
- Modify form `action` attributes to use HTTP and check whether the server accepts the submission with session data.
- Verify that the application does not set session cookies over HTTP responses under any circumstance.

**Session Token Renewal on Context Switch**
When a user transitions between secure (authenticated) and non-secure (anonymous) areas of the application, a different session token must be used. The token tracking anonymous activity must not be the same token used for authenticated functionality. Monitor session tokens as the user navigates between secure and non-secure areas.

**Cache-Control Directive Verification**
Every response that contains a `Set-Cookie` header or transmits session tokens must include cache prevention directives:
- `Cache-Control: no-cache` — prevents proxy reuse
- `Cache-Control: private` alone is insufficient; non-shared proxies (web cafés, corporate) can still cache
- `Cache-Control: max-age=0` — further prevents caching
- `Expires: 0` — covers HTTP/1.0 caches that ignore `Cache-Control`
- `Pragma: no-cache` — additional HTTP/1.0 coverage

Verify these directives are present on every response handling session tokens, not just on login pages.

**GET vs. POST Transport Verification**
Session tokens must never appear in URL query parameters. URLs are logged by proxies, firewalls, browser history, and server access logs, creating persistent records of session tokens. Verify:
- No session token is transmitted via GET query parameters
- POST-based session token transmission cannot be downgraded to GET by changing the request method
- Hidden form fields containing session tokens are transmitted over HTTPS

### What to Look For
- Session cookies set or sent over HTTP
- Missing or incomplete cache-control directives on authenticated responses
- Session tokens appearing in URL query parameters
- Server accepting session tokens via GET when POST is required
- Same session token used across secure and non-secure area transitions

### Remediation
Enforce HTTPS for all authenticated traffic. Set `Cache-Control: no-cache, no-store, must-revalidate` with `Expires: 0` on all responses carrying session tokens. Never transmit session identifiers in GET parameters. Use distinct session tokens for authenticated and anonymous contexts. Renew the session token after every successful authentication.

---

## WSTG-SESS-05: Testing for Cross Site Request Forgery

### Objective
Determine whether the application relies solely on credentials automatically supplied by the browser (cookies, HTTP authentication) for request authorization, making it vulnerable to CSRF.

### How to Test

**Session Dependency Analysis**
CSRF is possible when the application identifies user sessions using only information known by the browser — primarily cookies and HTTP authentication headers (Basic, Digest, NTLM). The browser automatically attaches these credentials to every request, including requests initiated by third-party sites. If the application accepts requests based on these credentials alone, without requiring additional user-specific tokens, it is vulnerable.

The fundamental test: can a properly formed request, submitted from a different origin, execute a state-changing action on behalf of an authenticated user?

**Attack Surface Identification**
CSRF affects any endpoint that changes application state. Map all state-changing operations: fund transfers, password changes, email additions, configuration updates, content publication. For each operation, determine whether the request:
- Relies purely on cookies for session identification (vulnerable)
- Includes an unpredictable CSRF token in the request body or header (protected)
- Uses custom request headers that trigger CORS preflight (protected when properly validated)
- Requires re-authentication for sensitive operations (protected)

**Request Method Considerations**
Both GET and POST endpoints are potentially vulnerable:
- GET requests are trivially exploited via `<img>`, `<script>`, `<link>`, or `<iframe>` tags that trigger automatic requests.
- POST requests require slightly more effort but are equally exploitable via auto-submitting forms or JavaScript.
- Using POST alone does not prevent CSRF. The presence of a CSRF token or other unpredictable parameter that is not automatically included by the browser is required.

**JSON Endpoint Considerations**
JSON-based APIs present unique testing considerations. Standard HTML forms cannot produce `application/json` content. However, forms with `enctype="text/plain"` can deliver JSON-like payloads. Test whether JSON endpoints accept `text/plain` content or check only for well-formed JSON, as this widens the CSRF attack surface.

### What to Look For
- State-changing endpoints that accept requests authenticated only by cookies
- No CSRF tokens in forms or as custom request headers
- GET endpoints performing state changes (delete, update, transfer)
- JSON endpoints accepting `text/plain` content type
- Critical operations (password changes, email updates) lacking re-authentication

### Remediation
Implement anti-CSRF tokens: unique, unpredictable values tied to the user's session, embedded in forms and validated server-side on each state-changing request. Use the `SameSite` cookie attribute as defense-in-depth. Require re-authentication for highly sensitive operations. Validate the `Origin` and `Referer` headers. Use custom request headers for API endpoints to force CORS preflight. Reference the OWASP CSRF Prevention Cheat Sheet for comprehensive guidance.

---

## WSTG-SESS-06: Testing for Logout Functionality

### Objective
Verify that the application provides a functional, visible logout mechanism and that invoking it properly terminates the session server-side.

### How to Test

**Logout UI Assessment**
A usable logout function must be:
- Present on every page of the application
- Immediately identifiable without scrolling
- Placed in a fixed viewport area unaffected by content scrolling
- Unambiguous in its function (clear labeling, no confusing dual-purpose buttons)

Unclear or hard-to-find logout controls cause users to close tabs without terminating sessions, leaving server-side sessions active and vulnerable to reuse.

**Server-Side Session Termination Verification**
This is the critical technical check. Many applications only clear the client-side cookie without invalidating the session server-side. A session that is only terminated client-side can be resurrected by re-injecting the previous cookie value.

To test:
1. Record the session cookie value of an authenticated session.
2. Invoke the logout function.
3. Observe whether session cookies are cleared or set to new values.
4. If new values are set, manually restore the previous cookie value.
5. Attempt to access an authenticated page. If access is granted, server-side termination failed.

Always test on multiple authenticated pages, especially security-critical ones (profile management, password change, payment). A partial logout implementation may invalidate the session for some areas but not others.

**Single Sign-On (SSO) Logout Verification**
SSO introduces session termination complexity because multiple sessions coexist: the application session and the SSO provider session.
- Log out from the application and attempt to re-access it via the SSO portal without re-authenticating.
- Log out from the SSO system and attempt to access an authenticated application page directly.
- Both actions should require re-authentication. Partial logout in SSO environments is common and dangerous.

### What to Look For
- No logout button or logout button hidden/ambiguous
- Session cookies cleared client-side but sessions still valid server-side
- SSO logout not propagating to connected applications
- Authenticated pages still accessible via browser back button after logout (indicates missing cache-control on authenticated pages)
- Confirmation messages displayed without actual session invalidation

### Remediation
Ensure every page has a clearly visible logout control. On logout, invalidate the session server-side using the framework's session destruction method (e.g., `HttpSession.invalidate()` in Java, `Session.Abandon()` in .NET). Set session cookies to new values after logout as a defense-in-depth measure. In SSO environments, implement single sign-off that terminates all connected sessions. Set `Cache-Control: no-cache, no-store` on all authenticated pages to prevent post-logout back-button access.

---

## WSTG-SESS-07: Testing Session Timeout

### Objective
Confirm the application enforces an idle timeout that automatically invalidates sessions after a period of inactivity, and that this enforcement is server-side rather than client-side.

### How to Test

**Timeout Existence Verification**
Log in to the application and wait for the expected timeout period without any interaction. After the period has elapsed, attempt to perform an authenticated action. The application should either redirect to the login page or reject the request with an expired-session response. If it continues to serve authenticated content, the timeout is either not implemented or too long for the data sensitivity.

**Client-Side vs. Server-Side Enforcement**
This distinction is critical because client-enforced timeouts are trivially bypassed:
- If the session cookie is non-persistent and contains no time-related data, the timeout is likely server-enforced.
- If the session cookie contains timestamps (login time, last access time, expiration date), the client may be involved in enforcement.
- Test by modifying client-side time values: if the cookie contains an expiration timestamp, set it far in the future and verify whether the server accepts the extended session.

**Session Resurrection Test**
After the timeout expires and the session is terminated, attempt to re-use the previous session cookie. A properly implemented timeout invalidates the session server-side, rendering the old token useless regardless of client-side cookie state. If the old token still works, session resurrection is possible — an attacker who obtains a logged-out user's cookie from browser storage or network capture can re-establish the session.

**Timeout Duration Appropriateness**
Evaluate whether the timeout duration is appropriate for the data sensitivity:
- Banking and financial applications: 5-15 minutes
- Healthcare and sensitive personal data: 15-30 minutes
- Social media and forums: up to 60 minutes
- No timeout at all: fail for any application handling user data

### What to Look For
- No idle timeout implemented
- Timeout enforced client-side only (manipulable cookie timestamps)
- Session resurrection possible after timeout by reusing old cookie values
- Timeout duration excessively long for data sensitivity
- Persistent cookies used for session management enabling indefinite sessions

### Remediation
Implement session timeout enforced entirely server-side. Track inactivity time server-side and invalidate the session after the configured period. Destroy all session tokens on timeout — do not merely expire the client-side cookie. Choose timeout durations proportionate to data sensitivity. Never rely on client-side timestamps for timeout enforcement; if they must be used, cryptographically sign them to prevent tampering.

---

## WSTG-SESS-08: Testing for Session Puzzling

### Objective
Identify session variable overloading — where the same session variable is used for multiple purposes across different application contexts — enabling authentication bypass and privilege escalation.

### How to Test

**Session Variable Enumeration**
Session puzzling occurs when the application reuses session variable names across different workflows. For example, a session variable storing password-reset context (populated from publicly accessible pages) might also be read by privileged pages as proof of identity. The attacker accesses the public endpoint to populate the variable, then navigates to the privileged endpoint that trusts the variable's presence.

This vulnerability is difficult to detect in black-box testing because it depends on accessing pages in orders the developers did not anticipate. The approach:
1. Enumerate all entry points (publicly accessible pages that set session variables), including password reset, registration, error recovery, and multi-step wizards.
2. For each entry point, catalog which session variables are set.
3. Enumerate all exit points (pages that read session variables for authorization decisions or privileged data access).
4. Test sequences where entry points set variables that exit points later trust as authorization.

**Multi-Phase Process Bypass**
Applications with multi-phase processes (registration wizards, checkout flows, account recovery) often store intermediate state in session variables. If the session variable indicating "phase completed" is the same across different processes, an attacker can complete an early phase in one flow and use that to skip ahead in another.

### What to Look For
- Authentication enforced by checking the presence of session variables rather than server-side session validation
- Password reset or recovery flows populating session variables that privileged pages trust
- Multi-step processes where phase-completion session variables are interchangeable between workflows
- Session variables set from user-supplied input in one context and interpreted as authoritative in another

### Remediation
Use each session variable for a single, consistent purpose. Namespace session variables by workflow (e.g., `password_reset.user_id` vs. `auth.user_id`). Never use session variable existence as proof of authentication — always validate session state server-side through the session management framework. Perform source code review to detect session variable overloading, as black-box detection is unreliable for this vulnerability class.

---

## WSTG-SESS-09: Testing for Session Hijacking

### Objective
Identify session cookies that can be stolen over unencrypted channels by network attackers and used to impersonate users.

### How to Test

**Cookie Theft via Missing Secure Flag (No HSTS)**
If the application lacks HSTS entirely, any cookie lacking the `Secure` attribute is vulnerable to theft. An active network attacker can inject a request to the HTTP version of the application, triggering the browser to send session cookies in cleartext. Even if the application is deployed entirely over HTTPS, missing `Secure` flags allow this attack.

To test:
1. Log in as the victim and navigate to an authenticated page.
2. Delete all cookies that have the `Secure` attribute set.
3. Save the remaining cookies (these are the ones transmitted over unencrypted HTTP).
4. Trigger an authenticated function. If it succeeds, the insecure cookies grant access.
5. Repeat from the attacker's account, injecting the captured cookies to confirm they enable session hijacking.

**Cookie Theft via Partial HSTS**
When HSTS is activated without `includeSubDomains` and session cookies carry a `Domain` attribute, an attacker can create a request to a non-existent subdomain (e.g., `fake.example.com`) over HTTP. The browser sends the domain-scoped cookies because the fake subdomain matches the `Domain` attribute, and HSTS does not protect it because `includeSubDomains` is absent.

To test under partial HSTS:
1. Log in as the victim and navigate to an authenticated page.
2. Delete all cookies that are `Secure` OR that lack a `Domain` attribute.
3. Save the remaining cookies.
4. Trigger an authenticated function. If successful, domain-scoped cookies are leaked over HTTP to non-HSTS subdomains.
5. Repeat from the attacker's account with the captured cookies.

### What to Look For
- Session cookies without `Secure` attribute on applications lacking full HSTS
- `Domain` attribute set on session cookies when HSTS is only partial (no `includeSubDomains`)
- Cookies without `__Host-` or `__Secure-` prefix in environments without full HSTS
- Applications entirely on HTTPS but not marking cookies `Secure`

### Remediation
Activate full HSTS on the apex domain with `includeSubDomains`. Mark all session cookies with the `Secure` attribute, even when the application is HTTPS-only. Use `__Host-` prefix for session cookies to guarantee `Secure` flag and `Domain`-less scoping. Avoid setting the `Domain` attribute on session cookies to prevent subdomain cookie leakage. Preload the domain into browser HSTS preload lists for maximum protection.

---

## Common Vulnerability Patterns and Misconfigurations

**Highest-Yield Bug Categories (in order of exploitation impact):**

1. **Missing session token renewal on login (WSTG-SESS-03)**: Trivially exploitable session fixation. Account takeover with zero complexity if combined with cookie injection.

2. **Session tokens in URL parameters (WSTG-SESS-04)**: Leaked to proxy logs, referer headers, browser history, and server logs. Simplest discovery method: search access logs for session identifiers.

3. **Missing `Secure` flag without HSTS (WSTG-SESS-09, SESS-02)**: Network attackers on shared WiFi, corporate networks, or compromised routers can steal cookies passively. Wireless assessments produce this finding constantly.

4. **Client-side-only logout (WSTG-SESS-06)**: Session appears terminated but server-side state persists. Re-inject the cookie and the session resurrects. Common in cookie-only authentication frameworks.

5. **Predictable session tokens (WSTG-SESS-01)**: Sequential, time-based, or low-entropy tokens. Brute-forcing sessions becomes feasible, especially with long timeout values.

6. **Session puzzling bypass (WSTG-SESS-08)**: Hard to detect in black-box testing but devastating when found. Password reset flows are the most common entry point.

7. **CSRF on critical endpoints (WSTG-SESS-05)**: Password change, email update, fund transfer. Use of POST without anti-CSRF tokens is the most common false sense of security.

**Bug-Finding Efficiency Tips:**

- Test session renewal (SESS-03) first — it takes 30 seconds and produces the highest-impact finding.
- Always test after password changes: does the session invalidate other active sessions for the same user?
- For logout testing, always attempt cookie re-injection, not just visual confirmation.
- When testing timeout, speed up the process by modifying client-side timestamps first; if that works, the timeout is client-enforced and the finding is immediate.
- Map all cookies before authentication and after — the delta reveals which cookies are authentication-dependent.
- In SSO environments, always test cross-application logout propagation — this is consistently broken.
- For session puzzling, focus on password reset, email verification, and multi-step registration flows as entry points.

---

## References

- OWASP Web Security Testing Guide v4.2, Section 4.6: Session Management Testing
- RFC 2965 — HTTP State Management Mechanism
- RFC 2616 — Hypertext Transfer Protocol — HTTP/1.1
- RFC 1750 — Randomness Recommendations for Security
- OWASP Session Management Cheat Sheet
- OWASP CSRF Prevention Cheat Sheet
- Michal Zalewski: "Strange Attractors and TCP/IP Sequence Number Analysis" (2001, 2002)
- Calzavara, Rabitti, Ragazzo, Bugliesi: "Testing for Integrity Flaws in Web Sessions"
- SameSite Cookies — draft-ietf-httpbis-cookie-same-site
