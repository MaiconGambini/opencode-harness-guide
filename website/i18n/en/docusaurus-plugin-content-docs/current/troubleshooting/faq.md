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

If it is below 20, update it at [nodejs.org](https://nodejs.org) and run
`npm install` again.

### "OpenCode does not recognize the commands"

Close and reopen OpenCode. The configuration in `opencode.jsonc` is loaded
only at startup, so changes take effect only after a restart.

### "Can I install on top of my current configuration?"

Not in version 1. Back up your `~/.config/opencode` folder before cloning.
Then manually copy over whatever you want to keep.

## Usage

### "What does WIP=1 mean?"

Only one feature can be `in_progress` at a time. This avoids abandoned
parallel work and keeps the focus on finishing before starting something new.

### "Do I need the sprint contract for every task?"

No. Simple tasks (one to three files, obvious scope) use the fast mode. The
sprint contract is reserved for complex or ambiguous features.

### "What happens if I skip the handoff?"

The next session does not know what was done. You lose continuity and have to
re-explain the context. The handoff is mandatory at the end of every session,
even if the work is not finished.

### "Can I work on more than one feature at the same time?"

No. WIP=1 is a core rule. If you discover adjacent work, add it as
`not_started` and continue on the active feature.

## Errors

### "init.ps1 fails but the project works"

Record the error in `STATE.md` as a blocker. Fix it before creating new
features. The harness should not operate on a broken baseline.

### "The documentation site build fails"

Broken links or missing pages cause a build failure. Check the error message
— Docusaurus indicates the file and the problematic link.

### "I lost the session state"

If the handoff was not done, check whether the `STATE.md` and
`session-handoff.md` files have enough information. If not, you will need to
reconstruct the context manually — the harness has no automatic recovery for
sessions without a handoff.
