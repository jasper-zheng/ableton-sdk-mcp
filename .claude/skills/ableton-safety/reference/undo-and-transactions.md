# Undo & transactions (one action = one Cmd-Z)

## The undo model
- The SDK has **no programmatic undo** — you cannot revert your own changes in code.
- BUT **every mutation is individually undoable** via Live's native undo (Cmd-Z / Ctrl-Z).
- So the safety net is Live's undo stack. Your job: make each agent action a **single,
  clean undo entry** and tell the user how to revert.

## Group a batch into one undo step
`withinTransaction(fn)` collapses multiple mutations into **one** user-facing undo entry.
The callback must be **synchronous** (you can't `await` inside it) — but it may **return
a Promise**, and returning `Promise.all([...])` groups multiple async operations:
```ts
// one Cmd-Z reverts all three tracks + their clips
await withinTransaction(() => Promise.all([
  buildDrums(song),
  buildBass(song),
  buildChords(song),
]));
```
Without grouping, a 4-track build is ~dozens of separate undo steps — annoying and
error-prone for the user to unwind. With grouping, it's one.

Nested transactions collapse into the outermost one, so a playbook can wrap its whole
build in a single `withinTransaction(() => Promise.all([...]))`.

### Pattern for a playbook/large build
```ts
const song = context.application.song;
// 1) perceive + plan (read-only) OUTSIDE the transaction
// 2) confirm (ui.confirm) OUTSIDE the transaction
// 3) do all mutations inside ONE grouped transaction:
await withinTransaction(() => Promise.all([ /* create tracks, set notes, set params */ ]));
// 4) report: "...  press Cmd-Z to undo."
```
Note: helper calls inside `Promise.all` should each return their promise (don't `await`
them sequentially before the `Promise.all`, or they won't be grouped).

## Always report the undo hint
End every mutating action with a one-line summary and **"press Cmd-Z to undo"**. If you
grouped the batch, say "one Cmd-Z reverts the whole thing." This is the user's safety
valve — make it explicit every time.

## What you can't undo for them
Loading is irreversible-ish only in that you can't *load* presets/samples (SDK limit),
so there's nothing to undo there. For everything you *can* do (tracks/clips/notes/
devices/params), Live's undo covers it — lean on it instead of trying to "restore" in code.
