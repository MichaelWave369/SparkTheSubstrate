# Security policy

Spark is planned as a free and open-source project. The game includes
browser code, a Cloudflare Worker backend and optional online/co-op and
progress-backup services. Security reports matter even when gameplay is free.

## Reporting a vulnerability

**Do not disclose live exploits, credentials, private save data or sensitive
user information in a public issue, public pull request or gameplay clip.**

Once enabled on the repository, use GitHub's **private vulnerability
reporting** / repository Security Advisories to describe a suspected issue.
If that channel is not enabled, contact the repository owner through an
existing private communication channel and ask for a safe reporting route
before sharing exploit details.

Provide the affected version, a minimal reproduction on test data,
expected behavior and observed behavior. Do not attack hosted services
or access other users' records to demonstrate a problem.

No bounty, guaranteed response window, or production security certification
is implied. If sensitive data has already been exposed, rotate affected
credentials and evaluate logs and earlier commits before publication.

## Useful focus areas

- Cloudflare/D1 authorization and room/session isolation
- Cross-player messages, identity handling, reconnect and replay boundaries
- Save import/export validation and legacy-archive sandbox isolation
- WebXR session lifecycle, untrusted controller/browser input and render errors
- Build/Actions secrets and third-party dependency provenance
