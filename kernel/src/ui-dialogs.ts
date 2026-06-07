import type { Ctx } from "./protocol.js";

/**
 * In-Live UI helpers for the safety/UX layer (WP6). Thin wrappers over the SDK's
 * `ctx.ui.showModalDialog` (a webview modal that posts a result string back) and
 * `ctx.ui.withinProgressDialog`. Exposed to run_code as the `ui` binding so the
 * agent can confirm destructive/large actions and show progress for long work.
 *
 * The confirm dialog is served as a self-contained `data:` URL (no hosting), styled
 * to match Live's dark theme. The HTML posts `{method:"close_and_send",
 * params:[JSON.stringify({approved})]}` which resolves showModalDialog's promise.
 */

export type ConfirmOptions = {
  title?: string;
  summary: string;
  items?: string[];
  danger?: boolean;
  approveLabel?: string;
  cancelLabel?: string;
};

const esc = (s: unknown): string =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Build the self-contained, Live-themed confirmation HTML. */
export function buildConfirmHtml(opts: ConfirmOptions): string {
  const title = esc(opts.title ?? "Agent action");
  const summary = esc(opts.summary);
  const items = (opts.items ?? []).map((i) => `<li>${esc(i)}</li>`).join("");
  const approve = esc(opts.approveLabel ?? "Approve");
  const cancel = esc(opts.cancelLabel ?? "Cancel");
  const danger = opts.danger ? " danger" : "";
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${title}</title>
<script>
  const wk = window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.live;
  const wv2 = window.chrome && window.chrome.webview;
  function send(m){ if (wk) window.webkit.messageHandlers.live.postMessage(m); else if (wv2) window.chrome.webview.postMessage(m); }
  function done(approved){ send({ method:"close_and_send", params:[JSON.stringify({ approved })] }); }
  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('ok').focus();
    document.addEventListener('keydown', (e) => { if (e.key === 'Enter') done(true); if (e.key === 'Escape') done(false); });
  });
</script>
<style>
  *,*::before,*::after{box-sizing:border-box} *{margin:0} button{font:inherit}
  :root{
    --bg:hsl(0,0%,21%); --ctl:hsl(0,0%,16%); --ctl2:hsl(0,0%,22%);
    --txt:hsl(0,0%,78%); --txt2:hsl(0,0%,48%); --bd:hsl(0,0%,7%);
    --accent:hsl(31,100%,67%); --danger:hsl(2,70%,58%); --on:hsl(0,0%,7%);
  }
  html{background:var(--bg);color:var(--txt);font-family:"AbletonSansSmall",sans-serif;font-size:12px;font-weight:500;-webkit-font-smoothing:antialiased;height:100%}
  body{height:100%;display:flex;flex-direction:column;gap:.9em;padding:1.2em}
  h1{font-size:1.15rem;font-weight:600}
  .summary{color:var(--txt);line-height:1.45}
  ul{list-style:none;display:flex;flex-direction:column;gap:.2em;background:var(--ctl);border:1px solid var(--bd);border-radius:6px;padding:.6em .8em;max-height:9.5em;overflow:auto}
  li{color:var(--txt);line-height:1.4}::marker{content:""}
  li::before{content:"•  ";color:var(--txt2)}
  .spacer{flex:1}
  .buttons{display:flex;gap:.5em;justify-content:flex-end}
  .btn{font-size:1rem;line-height:1;background:var(--ctl);color:var(--txt);border:1px solid var(--bd);height:24px;padding:0 1.2em;border-radius:12px;cursor:pointer;user-select:none}
  .btn:hover{background:var(--ctl2)}
  .btn:focus{outline:2px solid var(--txt2)}
  .btn.go:active{color:var(--on);background:var(--accent)}
  .btn.go.danger:active{background:var(--danger);color:#fff}
</style></head>
<body>
  <h1>${title}</h1>
  <div class="summary">${summary}</div>
  ${items ? `<ul>${items}</ul>` : ""}
  <div class="spacer"></div>
  <div class="buttons">
    <button class="btn" onclick="done(false)">${cancel}</button>
    <button class="btn go${danger}" id="ok" onclick="done(true)">${approve}</button>
  </div>
</body></html>`;
}

/**
 * Show a confirmation/preview modal in Live. Returns the user's decision.
 * Throws if the dialog can't be shown (caller should treat that as "not approved"
 * for destructive work — failing closed).
 */
export async function confirmDialog(ctx: Ctx, opts: ConfirmOptions): Promise<boolean> {
  const html = buildConfirmHtml(opts);
  const url = `data:text/html,${encodeURIComponent(html)}`;
  const h = Math.min(420, 150 + (opts.items?.length ?? 0) * 22);
  const raw = await ctx.ui.showModalDialog(url, 420, h);
  try {
    return JSON.parse(raw).approved === true;
  } catch {
    return false;
  }
}

/** Run `cb` inside Live's progress dialog (text + 0–100 bar + cancel AbortSignal). */
export function progressDialog(
  ctx: Ctx,
  text: string,
  cb: (update: (t: string, p?: number) => Promise<void>, signal: AbortSignal) => Promise<unknown>,
): Promise<unknown> {
  return ctx.ui.withinProgressDialog(text, { progress: 0 }, cb);
}
