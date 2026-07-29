---
name: wstg-identity-management
description: Use when testing user registration processes, account provisioning, role definitions (RBAC), account enumeration, username policies, or identity lifecycle management during a penetration test or security assessment. Covers OWASP WSTG v4.2 Identity Management Testing (WSTG-IDNT-01 through WSTG-IDNT-05).
---

# OWASP WSTG v4.2 — Identity Management Testing

## Overview

Identity management weaknesses allow attackers to escalate privileges, enumerate valid accounts, create unauthorized accounts, or exploit weak role definitions. Every role, registration flow, and provisioning endpoint is a potential attack surface. Test systematically rather than opportunistically — miss a single check and a vertical privilege escalation path remains open.

Identity flaws are often subtle: two responses that differ by a single word, a timing delta of 200ms on the "forgot password" flow, or a cookie token that the server trusts without re-validating. These are not always scanner-friendly; manual analysis of response content, headers, and timing is essential.

---

## Quick Reference

| Test ID | Test Name | Core Objective |
|---------|-----------|---------------|
| WSTG-IDNT-01 | Test Role Definitions | Identify roles, attempt unauthorized role switching, review permission granularity |
| WSTG-IDNT-02 | Test User Registration Process | Validate identity requirements align with security needs; test for registration forgery |
| WSTG-IDNT-03 | Test Account Provisioning Process | Verify provisioning controls, privilege boundaries, and de-provisioning safety |
| WSTG-IDNT-04 | Account Enumeration & Guessable Accounts | Enumerate valid usernames via response analysis, timing, and recovery facilities |
| WSTG-IDNT-05 | Weak or Unenforced Username Policy | Assess if username structure enables predictable account guessing |

---

## WSTG-IDNT-01: Test Role Definitions

### Objective

Identify every role in the application, attempt to switch to or access a different role without authorization, and evaluate whether the permissions assigned to each role are appropriate for its purpose.

### Why It Matters

Role definitions form the backbone of access control. If an application trusts a client-supplied role identifier without server-side validation, any user can become an administrator. Even when roles are enforced server-side, overly broad permissions — such as a "support engineer" who can download backups or impersonate customers — create paths to sensitive data.

### How to Test

**Phase 1 — Role Identification**

Discover all roles through:
- Application documentation and developer interviews.
- Source code comments, client-side JavaScript, and hidden form fields.
- Fuzzing role-bearing parameters in cookies, session tokens, request bodies, and URL paths.
- Enumerating well-known administrative paths (directories, API endpoints, subdomains).
- Testing common role names (`admin`, `manager`, `auditor`, `backup`, `supervisor`, `root`).

**Phase 2 — Testing Role Switching**

Once roles are identified, validate that unauthorized switching is prevented:
- Manipulate role-encoding parameters in cookies, JWTs, hidden fields, or request body attributes.
- Attempt direct access to endpoints and pages reserved for other roles.
- Test for horizontal escalation: can a user in one customer account access another customer's data by changing a resource identifier?
- Attempt vertical escalation: can a lower-privilege role invoke administrative functions?

Perform these tests with two authenticated sessions concurrently — one as a low-privilege user, one as a target role — to compare accessible endpoints and response content.

**Phase 3 — Reviewing Permission Granularity**

After gaining access to each role, map every permission. Ask:
- Does a support role have administrative capabilities (user management, backup access, configuration changes)?
- Does an administrator lack MFA or maker-checker controls for sensitive operations?
- Can an administrator modify their own permissions or role assignment?
- Are permissions assigned at a granular level (e.g., "can view reports but not export") or are they overly broad?

### What to Look For

- Client-side role tokens (cookies, JWTs, form fields) that the server accepts without re-validating.
- Missing server-side authorization checks on sensitive endpoints — test by accessing them directly with a low-privilege session.
- Roles with unnecessary transitive permissions (e.g., a "read-only" role that can also write).
- Administrative functions that lack confirmation steps, audit logging, or MFA re-authentication.

### Remediation

- Implement server-side RBAC with a centralized authorization decision point.
- Never trust client-supplied role identifiers; derive the role from a server-side session.
- Apply the principle of least privilege: each role receives only the minimum permissions necessary.
- Require MFA or maker-checker approval for sensitive administrative actions.
- Audit role permissions regularly and remove unused roles.

---

## WSTG-IDNT-02: Test User Registration Process

### Objective

Verify that identity requirements for user registration match business and security requirements, and that the registration process cannot be exploited to create fraudulent or duplicate accounts.

### Why It Matters

A registration process that demands only an email address — without verification — allows bulk creation of fake accounts. This enables credential stuffing, fake content injection, abuse of free-tier resources, and bypass of rate limiting by rotating accounts. Weak identity proofing during registration undermines every downstream access control.

### How to Test

**Assess Identity Requirements**

Evaluate whether registration requirements are proportional to what the account protects:
- Can anyone register for access without human vetting?
- Is there an automated approval process that skips identity verification?
- Can the same person or identity register multiple times? Test with the same email using plus-aliasing (e.g., `user+1@domain.com`), dot variations, or different addresses.
- Can a registrant choose their own role or permission level?
- What proof of identity is required — email only, mobile verification, government ID, or none?
- Are registered identities verified after registration (email confirmation link, SMS code, manual review)?

**Validate the Registration Process**

Test for forgery and manipulation:
- Can identity information be fabricated using disposable email addresses or temporary phone numbers?
- Can the exchange of identity information be manipulated during registration — modifying hidden fields, skipping client-side validation, or replaying a successful registration request with altered parameters?
- Test the registration flow with sequential requests to identify if any step can be bypassed (e.g., skipping email verification by directly calling the "account activated" endpoint).
- Submit special characters, excessively long values, or Unicode homoglyphs in name fields to test validation robustness.

### What to Look For

- Registration that auto-provisions accounts with no identity verification step.
- Missing email or phone verification before granting access.
- Ability to register multiple accounts with the same identity (or slight variations).
- Role assignment controllable during registration (e.g., `role=admin` in the request).
- No CAPTCHA or anti-automation controls on the registration endpoint.

### Remediation

- Align identity proofing requirements with the sensitivity of the data and actions the account protects.
- Require verified email addresses or phone numbers before granting access.
- Implement rate limiting and CAPTCHA on registration endpoints.
- Prevent multiple registrations by the same identity using unique constraints on verified identifiers.
- Conduct human review for high-sensitivity account creation (e.g., administrator accounts).

---

## WSTG-IDNT-03: Test Account Provisioning Process

### Objective

Determine which roles can provision other accounts, establish that no elevation of privilege occurs during provisioning, and verify that de-provisioning properly handles resources and access removal.

### Why It Matters

Account provisioning is a critical control point. If an attacker can provision an administrator account from a user account, or if a de-provisioned user retains access to shared resources, the entire identity lifecycle is compromised. Provisioning without verification is an open door for persistent access.

### How to Test

**Provisioning Authorization**

- Identify which roles can create new accounts and what types of accounts those roles can create.
- Determine whether provisioning requests are vetted or authorized by a second party before execution.
- Test whether an administrator can provision another administrator (privilege parity escalation).
- Test whether a user or administrator can provision an account with privileges greater than their own (vertical privilege escalation in provisioning).
- Attempt to self-provision additional accounts from a standard user session.

**De-Provisioning Controls**

- Test whether an administrator or user can de-provision their own account while still authenticated (self-denial of service or trail-obfuscation).
- Determine how files and resources owned by a de-provisioned user are handled: are they deleted, transferred to another user, or left orphaned with accessible references?
- Verify that de-provisioning immediately terminates all active sessions and access tokens.
- Test whether a de-provisioned account can be re-registered by an attacker before the identity is fully purged.

### What to Look For

- An administrator who can create other administrators without oversight.
- A user role that can provision accounts at any privilege level.
- Provisioning endpoints that lack server-side role validation.
- De-provisioning that leaves resources accessible (orphaned files, active API keys, unrevoked JWTs).
- Missing audit trail for provisioning and de-provisioning actions.

### Remediation

- Restrict provisioning to explicitly authorized roles only.
- Prevent any role from provisioning accounts with privileges exceeding their own.
- Require maker-checker approval for high-privilege account creation.
- Implement proper resource transfer or deletion during de-provisioning.
- Immediately revoke all sessions and access tokens upon de-provisioning.
- Log all provisioning and de-provisioning events with immutable audit records.

---

## WSTG-IDNT-04: Testing for Account Enumeration and Guessable User Account

### Objective

Determine whether the application reveals valid usernames through differential responses in authentication, registration, password recovery, or URI probing, and assess whether account identifiers are predictable.

### Why It Matters

Account enumeration is the reconnaissance phase for credential-based attacks. If an attacker can compile a list of valid usernames, brute-force success rates increase dramatically. The difference between "invalid password" and "user not found" may seem insignificant, but it halves the attack surface for password spraying. Enumeration can also occur through password reset flows, timing side channels, and directory traversal — not just login pages.

### How to Test

**Phase 1 — Response Content Analysis**

Baseline the application's behavior across three scenarios:
1. Valid username + valid password → record status code, response body, headers, and content length.
2. Valid username + invalid password → record the same.
3. Invalid username + invalid password → record the same.

Compare scenarios 2 and 3. If the application produces different error messages, status codes, response lengths, or page titles between the two, it is vulnerable to enumeration. Pay attention to subtle differences: "Login failed" versus "User not found" is obvious, but also check for differences in:
- HTML page titles
- Error code parameters in redirect URLs
- The presence or absence of specific DOM elements

**Phase 2 — Recovery Facility Testing**

Password reset and "forgot username" flows often leak existence:
- Submit an email address that is registered and observe the response.
- Submit an email address that is not registered and observe the response.
- If the application says "Email sent" for valid and "Address not found" for invalid, it is vulnerable.
- Even when messages are the same, check response times: if the application performs an LDAP/database lookup only when a user exists, the timing delta reveals validity.

**Phase 3 — URI Probing and Directory Enumeration**

For applications that use user-specific URLs or directories:
- Request `https://example.com/users/admin` and observe the response (403, 404, or 200).
- Request `https://example.com/users/nonexistentuser` and compare.
- A 403 for one and 404 for another reveals that the first user exists.

**Phase 4 — Predictable Account Identifiers**

Assess whether usernames follow a predictable pattern:
- Sequential numeric IDs (`user1001`, `user1002`).
- First-initial-last-name conventions (`jsmith`, `fmercury`).
- Role-based prefixes combined with numbers (`R1001` for realm 1, user 001).
- Test whether these patterns can be used to enumerate the user base programmatically.

**Phase 5 — Additional Enumeration Vectors**

- Analyze web page titles after failed authentication attempts.
- Check whether "friendly 404" pages (HTTP 200 with an image or message) differ between existing and non-existing users.
- Monitor response timing in every authentication-related flow, especially those involving external services (email dispatch, SMS).
- Test registration endpoints: does the application reveal that a username or email is already taken?

### What to Look For

- Different error messages for valid vs. invalid usernames.
- Different HTTP status codes or redirect URLs based on username validity.
- Timing differences exceeding 100ms in authentication or recovery flows.
- Predictable account naming conventions.
- Registration endpoints that reveal whether a username already exists.
- Default or test accounts still present in production.

### Remediation

- Return identical, generic error messages for all authentication failures regardless of root cause (e.g., "Invalid credentials" for both wrong username and wrong password).
- Ensure response length, status code, page title, and redirect URL are identical for all failure cases.
- Normalize response times by adding artificial delay or by always performing the same backend operations regardless of user existence.
- Delete default and test accounts before production release.
- Use unpredictable, non-sequential account identifiers that cannot be inferred from real names or predictable patterns.

---

## WSTG-IDNT-05: Testing for Weak or Unenforced Username Policy

### Objective

Determine whether the application enforces a consistent username policy and whether that policy — or lack thereof — facilitates account enumeration or credential-based attacks.

### Why It Matters

When usernames follow a predictable structure (e.g., first initial + last name: `jbloggs`), an attacker who knows the organization's naming convention can derive valid usernames from public employee lists, LinkedIn profiles, or email format patterns. Combined with WSTG-IDNT-04 enumeration, this converts a partial identity leak into a complete target list. Weak username policies also allow short, trivially guessable usernames (e.g., `admin`, `test`, `user`) that increase the attack surface.

### How to Test

**Determine Account Name Structure**

- Collect known usernames for the organization (from email addresses, public profiles, GitHub, social media).
- Analyze whether there is a deterministic naming convention: first name only, last name, first initial + last name, employee ID.
- Test whether the convention is consistent across the organization or varies by department.
- Check whether the same convention is used for both internal and external-facing accounts.

**Evaluate the Application's Response**

- Use the methodology from WSTG-IDNT-04 to determine whether the application differentiates between valid and invalid usernames.
- If the application does differentiate, the predictable naming convention becomes a direct enumeration tool.

**Enumerate Using Account Name Dictionaries**

- Build a dictionary of usernames based on the discovered naming convention applied to known employee names.
- Test these usernames against login, password reset, and registration endpoints to confirm validity.
- Expand the dictionary using common username patterns: `admin`, `administrator`, `root`, `sa`, `test`, `backup`, `guest`, `service`, `sysadmin`.

### What to Look For

- Highly structured, predictable account name schemes (first initial + last name, sequential employee IDs).
- Weak usernames that match common administrative defaults.
- No policy preventing short or trivially guessable usernames.
- Registration endpoint that allows choosing a username matching an existing administrative account's pattern.

### Remediation

- Return consistent, generic error messages for all authentication failures — identical for invalid username and invalid password.
- Avoid usernames that directly correspond to email addresses or real names.
- Use non-deterministic, system-generated account identifiers where feasible.
- If human-readable usernames are required, add a non-predictable suffix or use a policy that resists enumeration (e.g., minimum length, mixed character types).
- Require CAPTCHA or rate limiting on authentication endpoints to throttle dictionary attacks.

---

## Common Vulnerability Patterns Across Identity Management

These patterns recur across WSTG-IDNT test cases and represent high-signal areas for bug discovery:

**Client-Side Trust**
Applications that trust client-supplied role or identity attributes — in cookies, JWTs, hidden form fields, or URL parameters — without re-validating them server-side are trivially exploitable. Always test by manipulating any parameter that looks role-bearing.

**Differential Responses**
Any difference in the server's response — status code, body length, page title, redirect target, or response time — between valid and invalid identity inputs constitutes an information leak. These are the most common and most overlooked vulnerabilities in identity testing.

**Missing Verification Steps**
Registration and provisioning flows that skip email verification, phone verification, or human approval create opportunities for bulk account creation and privilege escalation. Check whether the verification step can be bypassed by directly requesting the post-verification endpoint.

**Weak Default Accounts**
Default, test, and service accounts left active in production provide known entry points. Usernames like `admin`, `test`, `backup`, `service`, and `guest` — especially with default credentials — are high-priority targets.

**Predictable Identifiers**
Sequential user IDs, algorithmic username generation from real names, and role-prefixed account names enable an attacker to reconstruct the entire user base from a single valid example.

**Insufficient De-Provisioning**
Accounts that are disabled but not fully deleted, resources that persist after user removal, and sessions that survive de-provisioning create backdoor access paths.

---

## Bug-Finding Efficiency Tips

1. **Prioritize enumeration first.** Before spending time on role escalation or provisioning, determine whether the application leaks valid usernames. A confirmed enumeration vector multiplies the impact of every subsequent finding.

2. **Compare, do not assume.** Always test authentication flows with three data points: known-valid, known-invalid-username, known-invalid-password. Record everything — response body, status code, headers, timing, and redirects — and diff them line by line.

3. **Test the full lifecycle.** Identity management is not just login. Registration, password reset, account lockout recovery, and de-provisioning are all equally likely to contain flaws. Attackers target the weakest link, not the most obvious one.

4. **Watch response timing.** Timing side channels are often missed by automated scanners. A 200ms delay on a "forgot password" request that triggers an email is a reliable enumeration signal that manual testing catches.

5. **Map roles completely.** Use two simultaneous authenticated sessions (low-privilege and high-privilege) to diff accessible endpoints and responses. What the high-privilege user can access that the low-privilege user cannot defines the privilege boundary to test.

6. **Test de-provisioned sessions.** After de-provisioning a test account, check whether its session tokens, API keys, and JWTs are still valid. Many applications disable the account but fail to revoke existing sessions.

7. **Automate pattern-based guessing.** Once a naming convention is identified, generate candidate usernames programmatically and test them against enumeration vectors. A single valid pattern can produce hundreds of valid accounts.

---

## Remediation Summary

| Test ID | Key Remediation |
|---------|----------------|
| WSTG-IDNT-01 | Server-side RBAC, never trust client-supplied roles, least privilege, MFA for admin actions |
| WSTG-IDNT-02 | Identity verification proportional to data sensitivity, email/phone verification, anti-automation |
| WSTG-IDNT-03 | Restrict provisioning authority, prevent privilege-parity creation, revoke sessions on de-provision |
| WSTG-IDNT-04 | Identical generic error messages for all auth failures, normalize response timing, delete default accounts |
| WSTG-IDNT-05 | Non-predictable usernames, generic error messages, rate limiting on auth endpoints |

---

## References

- OWASP Web Security Testing Guide v4.2, Section 4.3: Identity Management Testing
- Role Engineering for Enterprise Security Management, E. Coyne & J. Davis, 2007
- OWASP Access Control Cheat Sheet
- OWASP Authentication Cheat Sheet
- Username Enumeration Vulnerabilities, OWASP
