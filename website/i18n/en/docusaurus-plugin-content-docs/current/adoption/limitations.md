---
sidebar_position: 4
---

# Limitations

What the OpenCode Harness does not do in the current version. Knowing the
limits avoids frustration and helps you decide whether the harness is the
right tool for your case.

## It is not a SaaS product

The harness is a set of configuration files and scripts. There is no server,
API, authentication, or dashboard.

## It does not merge into an existing configuration

Version 1 supports only a clean install — cloning into an empty folder or
installing after a backup. There is no merge script that preserves your
current configuration while adding the harness.

## It is not a package manager

There is no install CLI, automatic update, or semantic versioning. Updates are
done via `git pull`.

## It does not document every skill

The site documents the harness workflow. Specialized skills (frontend,
backend, offensive security) that coexist in the repository do not have their
own chapters in the documentation.

## It is not fully cross-platform

The harness was designed and tested on Windows with PowerShell 5.1+. The
export and install scripts are PowerShell-specific. The Node runtime is
portable, but no equivalent shell scripts are provided for Linux or macOS.

## Dependencies

- OpenCode installed and working.
- Node.js 20+ for the plugins.
- PowerShell 5.1+ for the install scripts.
- Git for cloning and version control.
