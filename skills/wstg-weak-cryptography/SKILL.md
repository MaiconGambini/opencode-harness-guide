---
name: wstg-weak-cryptography
description: Use when testing cryptographic implementations, weak SSL/TLS configurations, sensitive data transmission, padding oracle vulnerabilities, weak encryption algorithms, insecure cryptographic storage, or hashing weaknesses during a penetration test or security assessment.
---

# WSTG Weak Cryptography Testing

Cryptographic failures rank consistently among the OWASP Top 10 because they expose sensitive data, break authentication, and enable spoofing attacks. This skill covers all four WSTG-CRYP test cases for systematically auditing transport security, padding oracles, unencrypted channels, and weak encryption implementations.

## Quick-Reference Table

| Test ID | Objective |
|---------|-----------|
| WSTG-CRYP-01 | Validate TLS configuration, certificate strength, and resistance to downgrade/stripping attacks |
| WSTG-CRYP-02 | Detect padding oracles that leak decryption state through error messages or timing side-channels |
| WSTG-CRYP-03 | Identify sensitive data (credentials, tokens, PII) transmitted over unencrypted channels |
| WSTG-CRYP-04 | Audit encryption algorithm choices, key lengths, IV handling, hashing, and random number generation |

---

## WSTG-CRYP-01: Weak Transport Layer Security

### Objective

Validate the server's TLS configuration, review the digital certificate's cryptographic strength and validity, and ensure TLS security is enforced consistently across the application -- not bypassable through downgrade attacks, mixed content, or absent HSTS.

### How to Test

**Server Configuration**

Enumerate every TLS service port. For each, determine which protocol versions (SSLv2, SSLv3, TLS 1.0/1.1/1.2/1.3), cipher suites, and extensions are accepted. Any of the following indicates a finding:

- SSLv2 (DROWN)
- SSLv3 (POODLE)
- TLSv1.0 (BEAST)
- EXPORT-grade cipher suites (FREAK)
- NULL cipher suites (authentication only, no encryption)
- Anonymous cipher suites (no server authentication)
- RC4 ciphers (NOMORE)
- CBC-mode ciphers with TLS < 1.2 (BEAST, Lucky 13)
- TLS compression enabled (CRIME)
- Weak DHE key exchange parameters < 2048 bits (LOGJAM)

The Mozilla Server Side TLS Guide provides the canonical recommended configuration. Use it as the baseline for acceptable protocols and cipher ordering.

**Digital Certificates**

Examine every certificate presented by each TLS endpoint:

- **Key strength:** Must be at least 2048-bit RSA or equivalent ECC. Anything less is brute-force feasible.
- **Signature algorithm:** Must be SHA-256 or stronger. MD5 and SHA-1 are collision-vulnerable and must not appear.
- **Validity period:** The certificate must be within its NotBefore/NotAfter window. Certificates issued after 1 September 2020 must not exceed 398 days of validity.
- **Trust chain:** The certificate must chain to a trusted CA -- a public CA for external applications, an internal enterprise CA for internal applications. Do not flag internal applications simply because the testing workstation does not trust the internal CA.
- **Subject Alternative Name (SAN):** The SAN field must match the hostname being accessed. Modern browsers ignore the Common Name field entirely. Accessing a host by IP address will always appear untrusted because no certificate includes an IP SAN by default.
- **Wildcard certificates:** While convenient, wildcard certificates introduce lateral-movement risk. If one subdomain is compromised, the wildcard key can impersonate any subdomain.

**Information Leakage:** Certificates may expose internal hostnames, domain names, or organizational details in the Issuer and SAN fields. Map these for network reconnaissance and social engineering vectors.

**Implementation Vulnerabilities**

Historically, TLS libraries themselves have contained exploitable bugs. Verify that server software is patched against known vulnerabilities including:

- Debian OpenSSL predictable PRNG (CVE-2008-0166)
- OpenSSL insecure renegotiation (CVE-2009-3555)
- OpenSSL Heartbleed (CVE-2014-0160)
- F5 TLS POODLE (CVE-2014-8730)
- Microsoft Schannel DoS (CVE-2014-6321)

**Application-Level TLS Enforcement**

Even with a correctly configured server, application-level mistakes undo transport security:

- **Mixed Active Content:** Scripts, CSS, or other active resources loaded over plain HTTP into an HTTPS page allow an attacker with network position to inject arbitrary code. Modern browsers block active mixed content by default, but verify that no active resources are requested over HTTP.
- **Mixed Passive Content:** Images and media loaded over HTTP leak metadata (Referer, cookies without Secure flag) and allow defacement. Lower severity but still a finding.
- **HTTP-to-HTTPS Redirect:** A plain HTTP request that receives a 301 redirect to HTTPS can be intercepted by a man-in-the-middle before the redirect completes, enabling sslstrip-style attacks. The defense is HSTS preloading -- verify the domain appears on the browser preload list.
- **HSTS Header:** Confirm the `Strict-Transport-Security` header is present with a non-trivial `max-age` and ideally the `includeSubDomains` and `preload` directives.

### What to Look For

- Any supported protocol below TLS 1.2.
- Any weak cipher suite (EXPORT, NULL, anonymous, RC4, 3DES).
- Certificates with key size < 2048 bits or signed with SHA-1/MD5.
- Expired certificates or certificates lacking a valid SAN.
- Mixed content (active or passive) on HTTPS pages.
- Absent or misconfigured HSTS header.
- Redirect chains that start on HTTP without preload protection.

### Remediation

- Disable all protocol versions below TLS 1.2. Prefer TLS 1.3.
- Configure cipher suites per Mozilla's "Intermediate" compatibility level.
- Deploy 2048-bit RSA or 256-bit ECC certificates signed with SHA-256 or stronger.
- Use a certificate monitoring service to detect approaching expirations.
- Serve all resources over HTTPS. Implement Content-Security-Policy with `upgrade-insecure-requests`.
- Deploy HSTS with `max-age=31536000; includeSubDomains; preload` and submit the domain to the HSTS preload list.
- Redirect all HTTP traffic to HTTPS at the web server or load balancer level before any application logic executes.

---

## WSTG-CRYP-02: Padding Oracle

### Objective

Identify encrypted data that relies on block cipher padding and determine whether the application leaks padding validity through error messages, response differences, or timing side-channels. A confirmed padding oracle allows an attacker to decrypt ciphertexts and forge arbitrary encrypted values without knowledge of the key.

### How to Test

**Why Padding Oracles Matter**

Block ciphers encrypt data in fixed-size blocks (8 or 16 bytes). When plaintext does not align to a block boundary, padding is added -- typically PKCS#7, which fills remaining bytes with the padding length value. If the application reveals whether padding is valid after decryption, an attacker can iteratively manipulate ciphertext and observe responses to recover each plaintext byte. In CBC mode, flipping a bit in ciphertext block N causes the corresponding bit in plaintext block N+1 to flip after decryption, making the attack systematic.

**Black-Box Testing**

1. **Identify encrypted input points.** Look for values that appear random and Base64-encoded. Measure the decoded byte length -- candidates for block ciphers have lengths that are multiples of 8 or 16 and share a common divisor across different sessions.

2. **Verify oracle behavior through bit tampering.** Decode the candidate value. If the IV is prepended (common), the total length is `(block_count + 1) * block_size`. Flip the last bit of the second-to-last block and re-encode and submit. Then flip the last bit of the third-to-last block and submit. If the encrypted value is a single block (IV stored server-side or hardcoded), prepend a random block and flip bits in it systematically.

3. **Observe response differentiation.** The application must exhibit at least three distinguishable states after decryption:
   - Valid ciphertext, correct decryption (normal application behavior).
   - Valid padding but garbled plaintext (application logic error).
   - Invalid padding (padding error).
   If the application reveals which state occurred -- through distinct error messages (e.g., ASP.NET's "Padding is invalid and cannot be removed" or Java's `BadPaddingException`), HTTP status codes, or measurable timing differences -- a padding oracle exists.

4. **Confirm with a full attack.** If the three states are distinguishable, attempt to decrypt a known ciphertext to confirm exploitability.

**Gray-Box Testing (Source or Binary Access)**

Examine every code path where client-supplied encrypted data is decrypted:

- Verify that ciphertext integrity is checked before decryption using HMAC, an authenticated encryption mode (GCM, CCM), or Encrypt-then-MAC composition. AES-CBC without authentication is not sufficient.
- Verify that all error conditions during decryption and subsequent processing produce identical responses. A single different code path for padding failure versus MAC failure creates an oracle.

### What to Look For

- Base64-encoded values whose decoded lengths are multiples of 8 or 16.
- Any response differentiation when submitting tampered ciphertext (different HTTP status, different body content, different response time).
- Exception messages mentioning "padding," "decryption," or "cryptographic."
- Absence of authenticated encryption (GCM, CCM, or HMAC-over-ciphertext).

### Remediation

- Replace unauthenticated CBC-mode encryption with an authenticated encryption mode (AES-GCM or AES-CCM).
- If CBC is unavoidable, apply Encrypt-then-MAC: compute HMAC-SHA256 over the ciphertext and verify before any decryption attempt.
- Ensure all error paths during cryptographic processing return identical, generic responses. Do not differentiate between padding failure, MAC failure, or decryption failure.
- Use constant-time comparison for any cryptographic integrity checks to eliminate timing side-channels.

---

## WSTG-CRYP-03: Sensitive Information via Unencrypted Channels

### Objective

Identify all sensitive data transmitted by the application and assess whether each channel provides adequate encryption and privacy guarantees. Data that requires protection at rest must also be protected in transit.

### How to Test

**Define What Is Sensitive**

Establish a taxonomy of sensitive data for the application under test:

- Authentication material: credentials, PINs, session identifiers, tokens, cookies.
- Regulated data: credit card numbers, healthcare records, PII (social security numbers, passport details, bank account numbers, driver's license numbers).
- Business-critical data: proprietary algorithms, internal IP addresses, user roles, financial transactions.

**Audit Every Transmission Channel**

- **HTTP vs. HTTPS:** Verify that sensitive data never traverses plain HTTP. This includes API endpoints, form submissions, WebSocket connections, and file downloads.
- **Basic Authentication over HTTP:** Basic Auth encodes credentials in Base64 (not encrypted). The `WWW-Authenticate: Basic` header over HTTP is a critical finding. Even over HTTPS, Basic Auth sends credentials on every request -- prefer token-based or session-based authentication.
- **Form-Based Authentication over HTTP:** Inspect the `action` attribute of all login forms. If the scheme is `http://`, credentials are sent in cleartext. Also inspect intercepted traffic for `POST` bodies containing credentials sent over HTTP.
- **Cookies Without the Secure Flag:** Session cookies, authentication tokens, and any cookie containing sensitive data must set the `Secure` attribute. Without it, the browser may transmit the cookie over unencrypted HTTP if any request to the domain is made over HTTP. Verify every `Set-Cookie` header for sensitive cookies includes `Secure; HttpOnly`.
- **Credentials in Source Code and Configuration Files:** Search the codebase and configuration files for hardcoded passwords, API keys, encryption keys, shared secrets, and connection strings. Search for keywords: `password`, `passwd`, `pwd`, `secret`, `key`, `token`, `private key`, `shared key`.
- **Sensitive Data in Logs:** Audit application and server logs for PII, credentials, session tokens, or full HTTP request/response bodies. Logs are often transmitted and stored with weaker protections than the application itself.
- **PII in Source Comments or Documentation:** Search source code, README files, and internal wikis for phone numbers, email addresses, ID numbers, and other PII using format-specific patterns.

### What to Look For

- Any HTTP (non-HTTPS) request carrying authentication headers, session cookies, passwords, or PII in the URL, body, or headers.
- `Set-Cookie` response headers on sensitive cookies that lack the `Secure` flag.
- `http://` URLs in form `action` attributes, JavaScript `fetch`/`XMLHttpRequest` calls, or WebSocket `ws://` connections.
- Hardcoded secrets in source code, config files, or deployment scripts.
- PII or credentials in log files.

### Remediation

- Enforce HTTPS for the entire application. Redirect all HTTP requests to HTTPS at the infrastructure level.
- Set the `Secure` and `HttpOnly` flags on all cookies. Set the `SameSite` attribute to `Lax` or `Strict` to mitigate CSRF.
- Replace Basic Authentication with token-based or OAuth-based authentication.
- Remove all hardcoded secrets from source code. Store secrets in a secrets manager (environment variables at minimum, a vault for production).
- Implement log redaction to strip credentials, tokens, and PII before writing to log files.
- Configure the Content-Security-Policy header with `block-all-mixed-content` and `upgrade-insecure-requests`.

---

## WSTG-CRYP-04: Weak Encryption

### Objective

Audit every cryptographic operation in the application -- encryption, hashing, random number generation, key derivation -- and verify that algorithm choices, parameters, and implementations meet current cryptographic best practices.

### How to Test

**Algorithm and Parameter Audit**

Validate each cryptographic primitive against current minimum strength requirements:

| Primitive | Minimum Requirement | Forbidden |
|-----------|-------------------|-----------|
| Symmetric encryption | AES-128 or stronger | DES, RC4, Blowfish, 3DES (2TDEA) |
| Asymmetric encryption | RSA 2048 or ECC Curve25519 | RSA < 2048, 160-bit ECDSA |
| Key exchange | DH/ECDH 2048+ bits | DH < 2048 |
| Message hashing | SHA-256 or stronger | MD5, SHA-1, MD4 |
| Message authentication | HMAC-SHA256 | HMAC-MD5, CBC-MAC |
| Password hashing | PBKDF2 (≥10,000 iterations), bcrypt, scrypt, Argon2 | MD5, SHA-1, SHA-256 (fast hashes) |
| Random number generation | CSPRNG (os.urandom, SecureRandom, /dev/urandom) | java.util.Random, rand(), Math.random() |
| Digital signatures | RSA-PSS, ECDSA (256-bit+) | SHA1withRSA, MD5withRSA |

**Mode of Operation**

- **ECB (Electronic Code Book):** Never use. Identical plaintext blocks produce identical ciphertext blocks, revealing data patterns. This is trivially visible in encrypted images.
- **CBC (Cipher Block Chaining):** Acceptable only when the IV is cryptographically random, unpredictable, and unique per encryption. Reusing an IV with the same key breaks semantic security. CBC without authentication (CBC mode alone, not combined with HMAC) is vulnerable to padding oracle attacks.
- **GCM / CCM:** Authenticated encryption modes. Preferred. GCM requires a unique nonce per encryption under the same key -- nonce reuse is catastrophic, revealing the authentication key.

**Initialization Vector (IV) Handling**

- The IV must be generated from a cryptographically secure random number generator (CSPRNG).
- The IV must never be reused with the same encryption key.
- The IV must be unpredictable (not a counter, not derived from the plaintext, not a timestamp).

**Key Derivation for Passwords**

- Use PBKDF2 with HMAC-SHA256 or HMAC-SHA512 and at least 10,000 iterations (NIST minimum; 100,000+ is recommended for new systems).
- Use bcrypt, scrypt, or Argon2id -- these are memory-hard and resist GPU/ASIC acceleration better than PBKDF2.
- Never use fast hashes (MD5, SHA-1, SHA-256) alone for password storage. They are designed for speed, which benefits attackers.
- Generate a unique random salt per password. Store the salt alongside the hash.

**Source Code Review Keywords**

Search the codebase for these indicators of weak cryptography:

- Algorithm keywords: `MD4`, `MD5`, `RC4`, `RC2`, `DES`, `Blowfish`, `SHA-1`, `SHA1`, `ECB`
- Java APIs to flag: `Cipher.getInstance("DES/...")`, `Cipher.getInstance("...ECB...")`, `MessageDigest.getInstance("MD5")`, `Signature.getInstance("SHA1withRSA")`, `PBKDF2WithHmacMD5`, `IvParameterSpec` (verify random generation), `java.util.Random` (must be `java.security.SecureRandom`), `SecretKeyFactory` (review algorithm parameter)
- Hardcoded secrets: search for `password`, `passwd`, `pwd`, `secret`, `key`, `token`, `private key`, `shared secret`, `admin`, `root`, `superuser`

**Static Analysis Guidance**

Cross-reference findings with CWE mappings:

- CWE-261: Weak cryptography for passwords
- CWE-326: Inadequate encryption strength
- CWE-327: Use of a broken or risky cryptographic algorithm
- CWE-328: Reversible one-way hash
- CWE-329: Not using a random IV with CBC mode
- CWE-330: Use of insufficiently random values
- CWE-347: Improper verification of cryptographic signature
- CWE-354: Improper validation of integrity check value
- CWE-547: Use of hard-coded security-relevant constants
- CWE-780: RSA without OAEP padding

### What to Look For

- Any occurrence of MD5, SHA-1, DES, RC4, RC2, Blowfish, or 3DES in cryptographic contexts.
- ECB mode selection in symmetric encryption.
- CBC mode without accompanying HMAC or AEAD.
- RSA keys below 2048 bits or ECC curves below 256 bits.
- Deterministic or predictable IV generation (counter, timestamp, hardcoded value, reused across encryptions).
- `java.util.Random` or equivalent non-cryptographic PRNG used for key generation, IV, or salt.
- Password hashing with single-round fast hashes (MD5, SHA-1, SHA-256) instead of PBKDF2/bcrypt/Argon2.
- PBKDF2 with fewer than 10,000 iterations or with MD5 as the HMAC function.
- Hardcoded encryption keys, passwords, or seeds in source code or configuration.

### Remediation

- Replace all weak algorithms with their modern equivalents: AES-256-GCM for encryption, SHA-256 or SHA-512 for hashing, HMAC-SHA256 for authentication, and Argon2id for password storage.
- Use authenticated encryption (AES-GCM or ChaCha20-Poly1305) whenever encrypting data. Never use unauthenticated CBC.
- Generate IVs, nonces, and salts exclusively from the operating system's CSPRNG. Never reuse them with the same key.
- For RSA, use OAEP padding (RSA/ECB/OAEPWithSHA-256AndMGF1Padding). For signatures, use RSA-PSS or ECDSA.
- Set PBKDF2 iterations to at least 100,000 for new deployments. Generate a 16+ byte random salt per password.
- Extract all cryptographic keys and secrets from source code into a secrets management system.
- Update cryptographic policies and libraries to versions that deprecate and reject weak algorithms.

---

## Common Vulnerability Patterns and Misconfigurations

**Pattern: TLS Everywhere Except One Endpoint.** A common mistake is securing the main web application with TLS but leaving ancillary services (internal APIs, admin panels, WebSocket endpoints, file upload handlers) on plain HTTP. Test every port, every subdomain, and every protocol.

**Pattern: Certificate Validation Disabled.** Mobile applications and IoT devices frequently disable certificate validation in their TLS client code to simplify development. This code ships to production, making all TLS connections trivially man-in-the-middled. Audit `NSAppTransportSecurity` (iOS), `network_security_config.xml` (Android), and custom `TrustManager` implementations.

**Pattern: CBC + No MAC = Padding Oracle.** Developers select AES-CBC because the library offers it. They omit authentication because the data "doesn't need integrity." The result is a padding oracle. Assume every unauthenticated CBC implementation is vulnerable until proven otherwise.

**Pattern: ECB by Default.** Some cryptography libraries default to ECB mode. Developers who do not explicitly specify a mode end up with ECB, which leaks structural information about plaintext. Always verify the mode parameter in every `Cipher.getInstance()` or equivalent call.

**Pattern: Non-Cryptographic Random.** `Math.random()`, `rand()`, and `java.util.Random` are fast but predictable. When used for IVs, session tokens, password reset tokens, or encryption keys, these become guessable. Search code for any PRNG that is not explicitly a CSPRNG.

## Bug-Finding Efficiency Tips

1. **Test TLS configuration first.** It is the fastest win -- a single scan against a domain reveals protocol versions, ciphers, and certificate issues in seconds. An A+ on SSL Labs means you can move on; anything less warrants deeper investigation.
2. **Correlate encrypted values with session changes.** Submit the same form twice with different inputs. If the encrypted token length changes in multiples of 8 or 16, a block cipher is likely in use and worth testing for padding oracle behavior.
3. **Intercept and replay with bit flipping.** For any Base64-looking parameter, decode, flip one bit in a non-header byte (avoid corrupting the Base64 structure), re-encode, and submit. Any differential response is worth investigating further.
4. **Search source code before manual testing.** Run a single grep for `MD5`, `ECB`, `DES`, `SHA1`, `java.util.Random` across the entire codebase. The results prioritize the highest-value manual testing targets.
5. **Test certificate validation on every client, not just the main website.** Mobile apps, thick clients, and internal services often have custom TLS stacks with weaker validation.
6. **Check HSTS preload status on every domain.** Sites that redirect HTTP to HTTPS without preloading are still vulnerable to first-request MITM. The preload list is the only reliable defense.

---

## References

- OWASP Web Security Testing Guide v4.2, Section 4.9: Weak Cryptography
- OWASP Transport Layer Protection Cheat Sheet
- OWASP Cryptographic Storage Cheat Sheet
- OWASP Password Storage Cheat Sheet
- Mozilla Server Side TLS Guide
- NIST FIPS 140-2, Security Requirements for Cryptographic Modules
- NIST Special Publication 800-131A Rev. 2: Transitioning the Use of Cryptographic Algorithms and Key Lengths
- Wikipedia: Padding Oracle Attack
- Juliano Rizzo, Thai Duong, "Practical Padding Oracle Attacks" (USENIX WOOT 2010)
- ISO 18033-1:2015 – Encryption Algorithms
- ISO 18033-2:2015 – Asymmetric Ciphers
- ISO 18033-3:2015 – Block Ciphers
