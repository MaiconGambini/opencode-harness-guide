---
sidebar_position: 4
---

# Limitations

What the OpenCode Harness does not do in the current configuration — and what
is an explicit gap, not a capability.

## It is not a SaaS product

The harness is a set of configuration files and scripts. There is no server,
API, authentication or dashboard.

## It does not merge into existing configuration

The current installation supports only the clean path (clone into an empty
folder or after a backup). There is no merge script that preserves your current
configuration while adding the harness.

## It is not a package manager

There is no installation CLI, automatic update or semantic versioning.
Updates are done via `git pull`.

## It does not document all skills

The site documents the harness flow. Specialized skills (frontend, backend, and
security) that coexist in the repository do not have their own documentation
chapters.

## It is not fully cross-platform

The harness was designed and tested on Windows with PowerShell 5.1+. The
export and installation scripts are specific to PowerShell. The Node runtime
is portable, but shell scripts are not provided.

## Dependencies

- OpenCode installed and working.
- Node.js 20+ for plugins.
- PowerShell 5.1+ for the installation scripts.
- Git for cloning and version control.
