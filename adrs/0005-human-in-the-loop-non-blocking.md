# ADR 0005 — Human-in-the-loop must not block the flow (no full-gate)

- **Status:** Accepted
- **Date:** GATE 1 (recorded in the submitted PRD)

## Context

Interaction data is extracted from PDF leaflets by a vision model, so **a human must
review it**. The question is whether a warning that has not yet been reviewed should be
shown to the patient.

**The full-gate model:** withhold every warning until a pharmacist approves it.

## Decision

**No full-gate.** Every warning — including `contraindicated` and `major` — is shown to the
patient **immediately**, labelled *"awaiting professional confirmation"*. Pharmacists
review **in parallel**, without blocking anything.

## Why

Full-gating sounds safer but is more dangerous in practice:

1. **The people who most need a warning would wait longest for it.** A `contraindicated`
   finding is the most urgent and also the one needing the most careful review, so it
   would sit in the queue longest. The patient takes the medicine while it waits.
2. **The queue has no service-level agreement.** Nobody has committed to pharmacists being
   on duty around the clock. Full-gating turns "nobody has reviewed this yet" into "the
   user sees nothing", which is indistinguishable from "there is no interaction".
3. **Silence reads as safety.** This is the worst failure mode in a medical product: the
   user infers "the system did not warn me" means "this combination is safe".

The opposite trade-off — showing a warning that a pharmacist later rejects — is much
milder, because every warning carries its review status and the verbatim source for the
user to check, and because rule 2 already forbids the system from stating clinical
conclusions.

## Implementation

| Status | Shown to patient | Label |
|---|---|---|
| `pending` | ✅ in full | "Awaiting professional confirmation" |
| `approved` | ✅ in full | "Confirmed by a pharmacist" |
| `rejected` | ❌ hidden | — |

Frontend: `frontend/src/components/interactions/ReviewStatusTag.tsx`

**Never** add a condition like `if (reviewStatus !== 'approved') return null` to a display
path. That is the full-gate growing back.

## Consequences

✅ 100% of warnings reach the user immediately — itself a PRD success metric
✅ A backed-up review queue does not degrade the user experience

❌ A wrong warning can be seen before it is rejected, so the status label and the verbatim
quote are **mandatory** and must never be abbreviated
❌ We need a way to retract or flag a warning that a pharmacist rejects after a user has
already seen it
