---
name: wayfinder
description: Map a large, uncertain, multi-session initiative into one-at-a-time decision work before committing to implementation.
disable-model-invocation: true
---

# Wayfinder

Use only when the destination is clear but the path is not, and the decisions cannot fit in one session.

1. Define the destination and explicit out-of-scope boundary.
2. Create `agent-os/specs/<initiative>/wayfinder.md` as the map. Record decisions made, open decision tasks, dependencies, risks, and unknowns that are not yet sharp enough to task.
3. Work exactly one unblocked decision task at a time. Claim it in the map before investigation.
4. Resolve the task using research, prototype, or grilling as appropriate. Record the result, source artifacts, and newly discovered dependencies.
5. Add only decisions that are now precise enough to state. Keep vague future concerns in the map's unknowns section.
6. When the path is clear, use `spec-lead` to synthesize the decisions into the approved specification, then use `to-tickets` and PREVC for delivery.

Wayfinder produces decisions, not production implementation.
