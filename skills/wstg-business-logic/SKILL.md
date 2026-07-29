---
name: wstg-business-logic
description: Use when testing business logic flaws, data validation integrity, forged requests, workflow bypass, abuse of functionality, upload restrictions, payment manipulation, or race conditions during a penetration test or security assessment.
---

# WSTG Business Logic Testing (v4.2)

## Overview

Business logic flaws cannot be detected by automated scanners. They require manual creative thinking, understanding the application's intended functionality, and developing abuse and misuse cases. Testing business logic means asking: what happens if a user performs steps out of order, submits unexpected values, exceeds limits, or manipulates timing?

These vulnerabilities are application-specific, among the hardest to detect, and often the most damaging when exploited. The tester must understand the business process, its rules, limits, and restrictions, then systematically attempt to violate them.

When documentation is unavailable, have the client walk through the application to explain intended functionality before testing begins. Maintain a direct line to developers during testing to clarify expected behavior.

---

## Quick Reference Table

| ID | Test | Objective |
|----|------|-----------|
| WSTG-BUSL-01 | Business Logic Data Validation | Verify only logically valid data is accepted at all input and handoff points; bypass front-end validation |
| WSTG-BUSL-02 | Ability to Forge Requests | Identify guessable parameters, hidden fields, or debug functionality that can be manipulated to bypass workflow |
| WSTG-BUSL-03 | Integrity Checks | Verify the server enforces relational edits and does not trust non-editable controls, hidden fields, or client-side state |
| WSTG-BUSL-04 | Process Timing | Detect information leakage through timing differences and abuse of transaction time windows |
| WSTG-BUSL-05 | Function Use Limits | Verify hard limits exist on functions that should only execute a fixed number of times per user or session |
| WSTG-BUSL-06 | Circumvention of Workflows | Ensure steps must be completed in order; verify rollback of actions when workflows are abandoned |
| WSTG-BUSL-07 | Defenses Against Application Misuse | Assess whether the application detects and responds to aggressive probing or malicious usage patterns |
| WSTG-BUSL-08 | Upload of Unexpected File Types | Verify that unapproved file types are rejected through server-side extension, content-type, and content validation |
| WSTG-BUSL-09 | Upload of Malicious Files | Ensure uploaded files are scanned for malware, web shells, archive traversal, zip bombs, and format-specific exploits |

---

## Test Cases

### WSTG-BUSL-01: Test Business Logic Data Validation

**Objective:** Identify data injection points and validate that all checks occur on the back end and cannot be bypassed. Attempt to break the expected data format and analyze how the application handles logically invalid data.

**Why it matters:** Front-end validation alone is insufficient. Data passes between systems at handoff points where validation gaps allow attackers to inject values that are syntactically correct but logically invalid (e.g., using a valid but deceased person's SSN, or routing an in-stock order through an out-of-stock partner path).

**How to test:**
- Review documentation and map all data entry points and handoff points between systems or components.
- Perform front-end functional validation to confirm which values the UI accepts.
- Using an intercepting proxy, observe all POST/GET requests. Locate variables such as cost, quantity, identifiers, and status flags.
- Interrogate each field with logically invalid data: identifiers that do not exist, values that violate business rules (e.g., negative quantities, impossible date ranges, conflicting statuses).
- Focus especially on inter-system handoffs where validation assumptions may differ.

**What to look for:**
- The server accepts data the front end disallowed.
- A downstream system accepts data that bypasses an upstream validation step.
- Logically contradictory data is processed without error (e.g., shipping an item marked both in-stock and out-of-stock).
- The application behaves differently based on data the user should not control.

**Remediation:** Validate all inputs at every entry and handoff point on the server side. Never trust data once it has entered the system. Apply business-rule validation beyond format/syntax checks.

---

### WSTG-BUSL-02: Test Ability to Forge Requests

**Objective:** Identify guessable, predictable, or hidden parameters and functionality. Insert logically valid data that bypasses the normal business logic workflow.

**Why it matters:** Attackers circumvent the GUI to submit requests directly to the back end. Predictable or hidden parameters allow repeating discounts, unlocking debug features, or escalating privileges without following the intended process.

**How to test:**
- Observe HTTP traffic for parameters that increment predictably (sequential IDs, counters, timestamps).
- Change guessable values to access resources belonging to other users, sessions, or entities.
- Look for hidden fields (e.g., `debug=0`, `isAdmin=false`, `discountApplied=0`) that may enable developer functionality or bypass checks.
- Toggle boolean flags, enumerated statuses, and role indicators.
- Probe for undocumented endpoints or parameters by guessing common debug/developer patterns.

**What to look for:**
- Numeric IDs that can be decremented or incremented to access other records.
- Boolean flags that unlock features when flipped.
- Hidden debug parameters that expose logs, internal state, or elevated privileges.
- Easter egg functionality left in production (developer shortcuts, skip-level buttons).

**Remediation:** Never rely on client-side hidden fields for business logic decisions. Validate all server-side inputs against the user's session, role, and current workflow state. Remove debug functionality from production builds entirely.

---

### WSTG-BUSL-03: Test Integrity Checks

**Objective:** Determine what type of data is logically acceptable by each component. Identify who should be allowed to modify or read that data. Attempt to insert, update, or delete data values that should not be allowed per the business logic workflow.

**Why it matters:** Applications often use non-editable controls, drop-down menus, or hidden fields that exist only in the browser context. Submitting values through a proxy bypasses these restrictions. Without server-side integrity checks, users can escalate privileges, corrupt data, or manipulate logs.

**How to test:**
- Capture HTTP traffic and locate hidden fields. Compare their values with the GUI and submit alternative values (role changes, price modifications, access to restricted projects).
- Identify non-editable UI controls (disabled inputs, read-only fields, dropdown lists). Submit values outside the allowed set through the proxy.
- List components that store or handle data (databases, log files, configuration stores). Attempt to read, edit, or delete their contents through application endpoints.
- Try accessing write endpoints with a lower-privilege session to see if authorization is checked server-side.

**What to look for:**
- Hidden fields that the server trusts without verification.
- Non-admin users submitting values that only admin users should provide.
- Downstream systems accepting data whose integrity was destroyed at an earlier stage.
- Log entries that can be manipulated or deleted by non-administrative users.

**Remediation:** Maintain server-side copies of all business-rule values (quantities, prices). Apply strict access controls on all data read and write operations. Protect logs from unauthorized modification. Use referential integrity checks in databases.

---

### WSTG-BUSL-04: Test for Process Timing

**Objective:** Review functionality that may be impacted by time. Develop and execute misuse cases exploiting timing differences or extended transaction windows.

**Why it matters:** Timing differences can leak information about internal processing (e.g., valid vs. invalid usernames). Extended transaction windows let attackers lock resources, manipulate prices tied to market rates, or reserve inventory without purchasing.

**How to test:**
- Identify processes dependent on time: authentication responses, resource locks, price quotes, reservation windows.
- Measure response times for valid vs. invalid inputs to detect observable timing differences.
- Open transactions and hold them open beyond expected durations to test for timeout enforcement.
- Reserve resources (seats, inventory) without completing payment; observe whether they are released.
- Lock a price quote then delay completion to see if the price is honored after the underlying rate changes.

**What to look for:**
- Consistent timing differences between valid and invalid credential checks (username enumeration).
- Transactions that remain open indefinitely without timeout.
- Reserved resources that are never released back to inventory.
- Stale price quotes honored long after market conditions change.

**Remediation:** Normalize response times so all outcomes take the same duration. Implement hard transaction timeouts with automatic rollback (e.g., 5-minute reservation windows). Validate prices against current rates at final confirmation, not just at quote time.

---

### WSTG-BUSL-05: Test Number of Times a Function Can Be Used Limits

**Objective:** Identify functions that must set limits on how many times they can be called. Assess whether a logical limit exists and whether it is properly validated server-side.

**Why it matters:** Functions that provide value each time they execute (discounts, downloads, loyalty point accruals) must enforce per-user limits. Without server-side controls, attackers repeat the function indefinitely for personal gain.

**How to test:**
- Review the application for features that should only execute once or a fixed number of times per user, session, or transaction.
- Attempt to navigate back and forth through the browser to re-trigger a function that should have already been consumed.
- Apply a discount, then navigate back and attempt to apply it again or apply a different incompatible discount.
- Complete a limited function, then load/unload the shopping cart or manipulate session state to reset the counter.
- Attempt to execute the function concurrently in multiple browser tabs or sessions.

**What to look for:**
- Discounts applied multiple times by navigating back.
- Multiple incompatible discounts combined on a single transaction.
- Download or usage counters that can be bypassed by creating new sessions or manipulating state.
- The absence of a server-side counter or flag marking the function as consumed.

**Remediation:** Track function usage with a server-side counter per user or session. Invalidate coupons at the database level once used. Enforce limits through server-side state, never through client-side flags.

---

### WSTG-BUSL-06: Testing for the Circumvention of Workflows

**Objective:** Identify methods to skip steps or perform steps in the wrong order. Develop misuse cases that circumvent every identified logic flow.

**Why it matters:** Workflows assume steps complete in order. Skipping steps or abandoning transactions after side effects occur (e.g., points added to an account) lets attackers gain benefits without fulfilling obligations.

**How to test:**
- Map the entire business process flow and identify the sequence of required steps.
- Attempt to jump directly to later steps by manipulating URLs, parameters, or session state.
- Start a transaction past the point where benefits accrue (points, credits), then cancel or reduce the final tender. Verify points are rolled back correctly.
- On content management systems, post valid initial content, then edit it to include prohibited material that would have been blocked on initial submission.
- After completing one workflow, attempt to replay, resume, or clone it without starting from the beginning.

**What to look for:**
- Points or credits awarded before tender that are not rolled back on cancellation.
- Content that passes initial validation but is never re-validated on edit.
- Workflow steps that can be performed in arbitrary order.
- State transitions that lack server-side enforcement of prerequisites.

**Remediation:** Enforce workflow step ordering server-side. Defer side effects (point accrual, status changes) until the workflow completes successfully. On cancellation or failure, roll back all intermediate actions. Re-validate content on every edit.

---

### WSTG-BUSL-07: Test Defenses Against Application Misuse

**Objective:** Review all tests conducted against the system and determine which triggered defensive responses. Assess whether active defenses are sufficient to protect against automated or aggressive probing.

**Why it matters:** Without active defenses, attackers can enumerate vulnerabilities at will without detection. The application owner remains unaware of ongoing attacks.

**How to test:**
- Aggregate notes from all prior testing: which inputs triggered different responses, blocks, lockouts, or forced logouts.
- Test for per-function defenses: input character rejection, temporary account lockouts after authentication failures, rate limiting on sensitive endpoints.
- Test for application-wide misuse detection: forced browsing, bypassing presentation-layer validation, multiple access control errors, duplicated/missing parameter names, structured data with invalid format (JSON, XML), blatant injection payloads, automation-speed requests, geo-location or user-agent changes.
- Execute a sequence of increasingly suspicious actions and observe whether any cumulative defensive response triggers (account lockdown, increased monitoring, delayed responses).

**What to look for:**
- No response to any aggressive probing (the most common finding).
- Defenses limited to a single function (e.g., login lockout) with no broader detection.
- Silent detection mechanisms (logging changes, admin alerts) that may not be visible to the tester.
- The ability to scan, fuzz, or enumerate at full speed without throttling.

**Remediation:** Implement application-wide active defenses: rate limiting, anomaly detection, progressive response escalation (delay → challenge → lockdown), and automated alerting. Monitor for impossible user behaviors (geo-location jumps, user-agent changes mid-session, accessing workflow steps out of order).

---

### WSTG-BUSL-08: Test Upload of Unexpected File Types

**Objective:** Verify that unapproved file types are rejected and handled safely. Confirm file batch uploads cannot bypass security measures.

**Why it matters:** Accepting unexpected file types can lead to code execution (uploading a PHP file to a webroot), client-side attacks (HTML files with script tags), or data corruption (incorrect database files processed by parsers expecting a different format).

**How to test:**
- Study the application's logical requirements for accepted file types.
- Prepare a library of non-approved files: executables, server-side scripts (.jsp, .php, .aspx), HTML files with embedded JavaScript, and database files with extensions the application does not expect.
- Navigate to the file upload mechanism and submit each non-approved file type.
- Test whether file type validation is only client-side (bypasses with proxy).
- Test whether the application validates only `Content-Type` headers (change header to `image/jpeg` while uploading a script file).
- Test whether the application validates only by file extension (rename a `.php` file to `.php.jpg`).
- Attempt to access uploaded files directly by URL to check execution.
- Test ZIP uploads containing files with directory traversal paths.

**What to look for:**
- Client-side-only validation that an intercepting proxy bypasses.
- Content-Type-only validation that accepts any file with a spoofed MIME type.
- Extension-only validation that accepts `.php.jpg` or double extensions.
- Uploaded files directly accessible and executable at their stored URL.
- ZIP extraction that writes files outside the intended directory.

**Remediation:** Use a combination of extension allow-listing, Content-Type verification, and file content inspection (magic bytes). Store uploaded files outside the webroot when possible. Serve uploaded files through a handler that prevents execution. Validate paths during ZIP extraction.

---

### WSTG-BUSL-09: Test Upload of Malicious Files

**Objective:** Identify file upload functionality and determine which types are considered acceptable vs. dangerous. Obtain or create a set of malicious files and attempt to upload them to verify whether the application scans for and rejects malicious content.

**Why it matters:** Even when file types are validated, legitimate file formats can contain malicious payloads: web shells disguised as images, Office documents with macros, PDFs with JavaScript, XML with billion laughs attacks, CSV injection payloads, or archive files with directory traversal or decompression bombs.

**How to test:**
- Upload a web shell disguised with an allowed extension (`.php.jpg`, `.phtml`, `.shtml`, `.php5`). Verify whether the server executes it if accessed directly.
- Test extension filter evasion: change capitalization (`.PhP`), use less common extensions (`.php5`, `.phtml`, `.asp`, `.jspx`), use trailing characters (`.php.`, `.php;jpg`), use null bytes (`.asp%00.jpg`).
- Upload the EICAR test file (a safe anti-malware test signature) and verify it is detected and quarantined.
- Create a ZIP archive containing a file with directory traversal paths (`../../../shell.php`). Upload and extract; verify the file does not write outside the intended directory.
- Create a decompression bomb: a small archive that expands to enormous size. Upload and confirm the application rejects or limits extraction.
- If XML files are accepted, test for XXE and billion laughs attacks.
- For CSV uploads, test for formula injection (`=cmd|'/C calc'!A0`).
- For Office documents, test with macro-enabled files.
- For PDF uploads, test with embedded JavaScript.

**What to look for:**
- Web shells accepted and executable at their URL.
- Extension filter bypasses that allow server-side scripts through.
- No anti-malware scanning on uploaded files.
- Directory traversal in extracted archives.
- Decompression bombs that exhaust server disk or memory.
- XML, CSV, Office, or PDF format-specific exploits accepted without content inspection.

**Remediation:** Scan all uploaded files with anti-malware software. Validate both file extension and MIME type, plus inspect file content for magic bytes. Strip dangerous metadata (macros, scripts, embedded objects). Restrict extraction depth and size for archives. Apply format-specific security controls (disable external entities in XML parsers, sanitize CSV formulas).

---

## Common Vulnerability Patterns

### Data and State Trust
- **Client-side enforcement:** Relying on JavaScript validation that is trivially bypassed with a proxy.
- **Hidden field trust:** Using hidden form fields to carry prices, discounts, roles, or status flags that the server accepts without verification.
- **Non-editable control trust:** Using disabled inputs or dropdown values as authoritative when those restrictions exist only in the browser DOM.
- **Missing server-side state:** Tracking workflow progress or function usage solely through client-side cookies or parameters.

### Workflow and Sequencing
- **Premature side effects:** Awarding points, credits, or status changes before a transaction is finalized.
- **Missing rollback:** Failing to undo side effects when a user cancels mid-workflow.
- **Step skipping:** Allowing direct access to later workflow steps by manipulating URLs or parameters.
- **No re-validation on edit:** Validating content on initial submission but not on subsequent edits.

### Input and Parameter Manipulation
- **Predictable identifiers:** Sequential IDs exposing other users' data or resources.
- **Parameter pollution:** Duplicating parameters to confuse server-side parsing.
- **Type confusion:** Submitting arrays where strings are expected, or vice versa.
- **Negative values:** Submitting negative quantities, prices, or limits.

### File Upload
- **Extension-only validation:** Checking only the file extension without verifying Content-Type or magic bytes.
- **Webroot storage:** Storing uploaded files within the document root where they become directly executable.
- **ZIP path traversal:** Extracting archives that write files outside the intended directory.
- **No content scanning:** Accepting files without anti-malware or format-specific security checks.

---

## Efficiency Tips for Finding Business Logic Bugs

1. **Walk the happy path first.** Understand what the application is supposed to do before trying to break it. Ask the client or product owner to walk you through every feature.

2. **Map every handoff.** Data crossing between systems, services, or components creates validation gaps. Each handoff is an injection point.

3. **Draw the state machine.** Diagram the workflow as states and transitions. Test every transition from every state, including transitions the UI does not expose.

4. **Think in abuse cases, not just misuse cases.** A misuse case does something wrong (incorrect password). An abuse case does something the system allows but was never intended (repeated discount application).

5. **Test time as an input.** What changes if the user waits? Waits too long? Acts too fast? Uses concurrent sessions?

6. **Count everything.** Every function that provides value should have a limit. Find the limit, then try to exceed it.

7. **Subvert trust assumptions.** Every time the client sends data the server trusts, there is a potential flaw. Hidden fields, disabled controls, dropdown values, cookies, and URL parameters are all attacker-controlled.

8. **Combine weaknesses.** Individual low-severity flaws often chain into critical impact. A predictable ID plus a missing authorization check plus a direct object reference equals full data exposure.

9. **Use two sessions.** Log in as two different users (or roles) and compare responses for the same requests. Differences in access, data visibility, or functionality reveal privilege boundaries to test.

10. **Think about what the developer forgot.** Developers implement the happy path and error handling. They rarely implement betrayal paths: what if the user is the attacker?

---

## Remediation Summary

| Category | Key Remediation |
|----------|----------------|
| Data validation | Server-side validation at every entry and handoff point. Validate business rules, not just format. |
| Forged requests | Never trust client-controlled parameters for business logic. Remove debug/hidden functionality from production. |
| Integrity | Maintain server-side authority for all business-rule values. Protect logs. Enforce referential integrity. |
| Timing | Normalize response times. Implement hard transaction timeouts with automatic rollback. |
| Function limits | Track usage server-side with per-user counters. Invalidate consumable resources at the database level. |
| Workflow | Enforce step ordering server-side. Defer side effects until workflow completion. Roll back on cancellation. |
| Misuse defenses | Implement progressive defensive responses (rate limit → delay → challenge → lockdown). Monitor for anomalies. |
| File uploads | Combine extension allow-listing, Content-Type verification, magic-byte inspection, and anti-malware scanning. Store outside webroot. Limit extraction depth. |

---

## References

- OWASP Web Security Testing Guide v4.2, Section 4.10: Business Logic Testing
- OWASP Abuse Case Cheat Sheet
- OWASP File Upload Cheat Sheet
- OWASP Input Validation Cheat Sheet
- OWASP AppSensor Project
- CWE-840: Business Logic Errors
- CWE-434: Unrestricted Upload of File with Dangerous Type
- NISTIR 7864: The Common Misuse Scoring System (CMSS)
- CAPEC: Common Attack Pattern Enumeration and Classification (MITRE)
