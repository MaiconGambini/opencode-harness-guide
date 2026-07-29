# Security Standard

- Secrets are server-only by default.
- Never put API keys in public environment variables or client bundles.
- Validate all external input at the boundary.
- Use least privilege for protected endpoints and jobs.
- Avoid logging secrets, tokens, passwords, or raw sensitive identifiers.
- Use explicit CORS, auth, and rate-limit rules for public surfaces.
- Treat redirects and outbound URLs as untrusted until validated.
