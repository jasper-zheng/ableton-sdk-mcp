---
name: ableton-safety
description: Guardrails and UX for safely editing a user's Ableton Live Set — perceive before changing, don't clobber existing work, confirm EVERY change with an in-Live dialog (ui.confirm) before it happens, group each action into one undo step, and report what changed + how to revert. Consult before any run_code that creates, edits, or deletes anything (read-only perception excepted).
---

# Ableton safety & UX

Every edit hits the user's real Live Set immediately, and the SDK has **no
programmatic undo** (only Live's native Cmd-Z) and **no dry-run**. This skill is the
discipline that keeps the agent safe and legible. Apply it on top of every other
`ableton-*` skill and the playbooks.

## The five rules
1. **Perceive before you change** — `ableton_get_context` first; know what exists so
   you don't overwrite or duplicate it.
2. **Additive-first** — prefer new tracks/clips/devices on **empty** slots over
   modifying existing content. (This is good practice — it does **not** skip the
   confirmation in rule 5; additive edits are still confirmed.)
3. **Don't clobber** — never delete or overwrite tracks/clips/devices you didn't
   create; check `clipSlots[i].clip` / `track.devices` occupancy before writing.
4. **One action = one undo** — group a batch with `withinTransaction(() => Promise.all([...]))`
   so a single Cmd-Z reverts it (see `reference/undo-and-transactions.md`).
5. **Confirm every change + report** — before **ANY** action that changes the Set
   (create / edit / delete — even a single clip or one parameter), call `ui.confirm`
   **first** (`danger:true` for deletes/overwrites). Proceed only on Approve. Then end
   by reporting what changed + "press Cmd-Z to undo".

## When to confirm
**Confirm every mutation.** Any `run_code` that creates, edits, or deletes anything —
a new track/clip, a note edit, a single `setValue`, a device insert, a delete, a whole
playbook build — must `ui.confirm` before it runs (`danger:true` for deletes/overwrites).
For a multi-step build, confirm **once up front** with a plan summary, then do the
grouped build (don't pop a dialog per sub-step).

**No confirm — read-only perception only:** `get_context` / `get_device` /
`get_clip_notes` / `get_selection` (and read-only `run_code` that only returns data).
These are how you see the Set; confirming them would just spam dialogs.

Long operations (audio render, big builds) → after approval, wrap the work in
`ui.progress` so the user sees progress and can cancel.

## Reference (read on demand)
| File | When |
|------|------|
| `reference/guardrails.md` | Perceive/additive/don't-clobber checks + the full rubric |
| `reference/undo-and-transactions.md` | The undo model + the one-undo grouping pattern |
| `reference/ui-dialogs.md` | `ui.confirm` / `ui.progress` usage (the in-Live UI) |

## In-Live UI (available in run_code)
- `await ui.confirm({ title, summary, items, danger })` → `boolean` (Approve/Cancel).
- `await ui.progress(text, async (update, signal) => { … })` → progress bar + cancel.
Both **pause the run_code timeout** while open (user think-time is free). Backstop:
Claude Code also prompts for tool calls, but the in-Live dialog is the better UX for a
user looking at Live.
