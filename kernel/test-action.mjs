// WP2 verification: hardened run_code (TS transpile, containment, timeout,
// withinTransaction helper, phased errors) against the in-Live kernel.
//
// Run (Live Beta open + Developer Mode + `npm start -- --live ...`):
//   node test-action.mjs
import WebSocket from "ws";

const URL = "ws://127.0.0.1:17890";
const ws = new WebSocket(URL);
let nextId = 1;
const pending = new Map();

function call(method, params) {
  return new Promise((resolve) => {
    const id = nextId++;
    pending.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
  });
}
const run = (code, timeoutMs) => call("run_code", { code, ...(timeoutMs ? { timeoutMs } : {}) });

const results = [];
function check(name, cond, detail = "") {
  results.push(!!cond);
  console.log(`${cond ? "✅" : "❌"} ${name}${detail ? " — " + detail : ""}`);
}

ws.on("open", async () => {
  try {
    console.log("→ connected to", URL, "\n");

    // 1. TS transpile (type annotation must be stripped & run)
    let r = await run(`const n: number = 21; const f = (x: number): number => x * 2; return f(n);`);
    check("TS transpile runs (21*2)", r.ok && r.result === 42, `result=${r.result}`);

    // 2. Containment — process/require/globalThis shadowed away
    r = await run(`return typeof process + "," + typeof require + "," + typeof globalThis;`);
    check("containment (no process/require/globalThis)", r.ok && r.result === "undefined,undefined,undefined", `got=${r.result}`);

    // 3. withinTransaction helper is exposed and returns its callback value
    r = await run(`return withinTransaction(() => 20 + 22);`);
    check("withinTransaction helper works", r.ok && r.result === 42, `result=${r.result}`);

    // 4. Wall-clock timeout — awaited work bounded (sync loops are NOT guarded)
    const t0 = Date.now();
    r = await run(`await sleep(60000); return "done";`, 1500);
    const dt = Date.now() - t0;
    check("async op times out (wall-clock)", !r.ok && r.phase === "timeout", `phase=${r.phase}, ${dt}ms`);

    // 4b. Host still responsive afterwards
    const ctx = (await call("get_context")).result;
    check("host responsive after timeout", !!ctx && Array.isArray(ctx.tracks), `tracks=${ctx?.tracks?.length}`);

    // 5. Runtime error — phased + logs survive
    r = await run(`log("before boom"); throw new Error("boom");`);
    check("runtime error reported with logs", !r.ok && r.phase === "runtime" && (r.logs || []).includes("before boom"), `phase=${r.phase}, logs=${JSON.stringify(r.logs)}`);

    // 6. Transpile error — malformed TS
    r = await run(`const broken: = ;`);
    check("transpile error reported", !r.ok && r.phase === "transpile", `phase=${r.phase}`);

    // 7. Regression — real mutation via run_code (TS), non-invasive tempo round-trip
    r = await run(`
      const s = context.application.song;
      const orig: number = s.tempo;
      s.tempo = 124;
      const changed = s.tempo;
      s.tempo = orig;
      return { changed, restored: s.tempo, orig };
    `);
    check("run_code mutation round-trips (tempo)", r.ok && r.result?.changed === 124 && r.result?.restored === r.result?.orig, JSON.stringify(r.result));

    // 8. Modern ES syntax passes through to native Node (disableESTransforms) —
    //    nullish coalescing, optional chaining, ??=, numeric separators.
    r = await run(`
      const o = { a: { b: 7 } };
      const m: Record<string, number[]> = {};
      m["k"] ??= [];
      m["k"].push(o?.a?.b ?? 1);
      return { x: (null ?? 5), y: o?.z?.w ?? -1, m: m["k"], big: 1_000 };
    `);
    check("ES syntax ?? / ?. / ??= run natively", r.ok && r.result?.x === 5 && r.result?.y === -1 && JSON.stringify(r.result?.m) === "[7]" && r.result?.big === 1000, JSON.stringify(r.result) + (r.error ? ` err=${r.error}` : ""));

    const passed = results.filter(Boolean).length;
    console.log(`\n${passed}/${results.length} checks passed${passed === results.length ? " ✅" : " ❌"}`);
  } catch (e) {
    console.error("client error:", e);
  } finally {
    ws.close();
  }
});

ws.on("message", (data) => {
  const msg = JSON.parse(data.toString());
  const resolve = pending.get(msg.id);
  if (resolve) {
    pending.delete(msg.id);
    resolve(msg);
  }
});
ws.on("error", (e) => console.error("WebSocket error:", e.message));
