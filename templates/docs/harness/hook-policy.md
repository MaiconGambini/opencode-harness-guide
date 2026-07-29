# Harness Hook Policy

## Profiles

- `minimal`: recovery profile that retains irreversible-operation and sensitive-path
  denies plus approval prompts, while disabling advisory context and activity logs.
- `standard`: minimal plus context and activity diagnostics.
- `strict`: standard plus denial of risky reads.

## Escape Hatches

- `HARNESS_PROFILE=minimal` reduces diagnostics only. It cannot bypass irreversible
  operation denies, sensitive-path denies, or approval prompts.

There is no environment-variable guard bypass. Do not weaken guards silently; use
an explicit source change reviewed through the normal workflow.
