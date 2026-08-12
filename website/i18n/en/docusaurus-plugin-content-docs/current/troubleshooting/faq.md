---
sidebar_position: 1
---

# Frequently Asked Questions

## Installation

### "npm install failed"

Check that Node.js 20+ is installed:

```powershell
node --version
```

If it is below 20, update it at [nodejs.org](https://nodejs.org).

### "OpenCode does not recognize the commands"

Close and reopen OpenCode. The configuration in `opencode.jsonc` is loaded
only at startup.

### "Can I install on top of my current configuration?"

Not in version 1. Back up your `~/.config/opencode` folder before cloning.
Then, manually copy whatever you want to keep.

## Usage

### "What does WIP=1 mean?"

Only one feature can be `in_progress` at a time. This prevents abandoned
parallel work and keeps focus.

### "Do I need the sprint contract for every task?"

No. Simple tasks (1-3 files, obvious scope) use fast mode. The sprint
contract is for complex or ambiguous features.

### "What happens if I skip the handoff?"

The next session does not know what was done. You lose continuity and need
to re-explain the context. The handoff is mandatory at the end of every
session, even if the work has not finished.

### "Can I work on more than one feature at the same time?"

No. WIP=1 is a core rule. If you discover adjacent work, add it as
`not_started` and continue on the active feature.

## Errors

### "init.ps1 fails but the project works"

Record the error in `STATE.md` as a blocker. Fix it before creating new
features. The harness should not operate with a broken baseline.

### "The documentation site build fails"

Broken links or missing pages cause a build failure. Check the error
message — Docusaurus indicates the file and the problematic link.

### "I lost the session state"

If the handoff was not done, check whether the `STATE.md` and
`session-handoff.md` files have enough information. If not, you will need to
reconstruct the context manually — the harness has no automatic recovery of
sessions without a handoff.
