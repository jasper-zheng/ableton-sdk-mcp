# In-Live UI dialogs (`ui.confirm` / `ui.progress`)

These are run_code **bindings** (provided by the kernel) — no import. They drive the
SDK's webview modal + progress dialog, themed to match Live. Both **pause the run_code
wall-clock timeout** while open, so user think-time never trips it (no need to inflate
`timeoutMs`).

## `ui.confirm` — confirmation / preview
```ts
const ok = await ui.confirm({
  title: "Agent action",                 // optional (default "Agent action")
  summary: "Build an 8-bar house loop in C minor",
  items: ["+4 tracks (Drums, Bass, Chords, Lead)", "~140 notes", "set 5 mixer values"],
  danger: false,                          // true → red Approve (use for deletes)
});
if (!ok) return { cancelled: true };      // fail safe: do nothing on Cancel
// ... proceed with the (grouped) mutation ...
```
- Returns `true` (Approve / Enter) or `false` (Cancel / Esc).
- A bare string is shorthand: `await ui.confirm("Delete track 'Bass'?")`.
- **Confirm before EVERY change** (not just destructive ones) — show it BEFORE the
  mutation, ideally before opening the undo transaction. Only read-only perception skips it.
- Keep `items` to the salient changes (a preview of the plan), not every note.

## `ui.progress` — progress + cancel for long work
```ts
const result = await ui.progress("Building loop…", async (update, signal) => {
  await update("Instruments…", 25);
  if (signal.aborted) return null;        // user cancelled
  await update("Writing MIDI…", 70);
  // ... do the work ...
  return summary;
});
```
- `update(text, percent)` (0–100); `signal` aborts if the user cancels — check it and bail cleanly.
- Use for audio render or large multi-track builds; not needed for quick edits.

## Custom dialogs (advanced)
For anything beyond confirm/progress, call the SDK directly:
`await context.ui.showModalDialog(\`data:text/html,\${encodeURIComponent(html)}\`, w, h)`
— your HTML must post `{method:"close_and_send", params:[resultString]}` via
`window.webkit.messageHandlers.live.postMessage` (mac) / `window.chrome.webview.postMessage`
(win); the returned promise resolves to that string. (Wrap such calls so they don't
fight the timeout — `ui.confirm`/`ui.progress` already handle that for the common cases.)

## Caveats
- Modal dialogs **block Live's UI** while open — keep confirmations short; use the
  cancelable progress dialog for long work, not a frozen modal.
- If a dialog can't be shown, treat it as **not approved** for destructive work.
