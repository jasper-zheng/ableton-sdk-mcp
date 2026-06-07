// WP1 perception verification client. Exercises the layered query API,
// addressing, and selection capture against the in-Live kernel.
//
// Run (Live Beta open + Developer Mode + `npm start -- --live ...`):
//   node test-perception.mjs
import WebSocket from "ws";

const URL = "ws://127.0.0.1:17890";
const ws = new WebSocket(URL);
let nextId = 1;
const pending = new Map();

function call(method, params) {
  return new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

const results = [];
function check(name, cond, detail = "") {
  results.push({ name, ok: !!cond });
  console.log(`${cond ? "✅" : "❌"} ${name}${detail ? " — " + detail : ""}`);
}

const CREATE = `
const song = context.application.song;
const track = await song.createMidiTrack();
track.name = "Agent Test";
const clip = await track.clipSlots[0].createMidiClip(4);
clip.name = "Hello Notes";
clip.notes = [
  { pitch: 60, startTime: 0, duration: 1, velocity: 100 },
  { pitch: 64, startTime: 1, duration: 1, velocity: 100 },
  { pitch: 67, startTime: 2, duration: 1, velocity: 100 },
  { pitch: 72, startTime: 3, duration: 1, velocity: 100 },
];
return "created";
`;

ws.on("open", async () => {
  try {
    console.log("→ connected to", URL, "\n");

    // 1. Overview
    let ctx = (await call("get_context")).result;
    console.log("song:", { tempo: ctx.tempo, scale: ctx.scale, grid: ctx.grid, trackCount: ctx.trackCount });
    let agent = ctx.tracks.find((t) => t.name === "Agent Test");
    if (!agent) {
      console.log("(no 'Agent Test' track — creating it)");
      await call("run_code", { code: CREATE });
      ctx = (await call("get_context")).result;
      agent = ctx.tracks.find((t) => t.name === "Agent Test");
    }
    check("get_context returns rich overview", ctx.tracks.length > 0 && !!ctx.scale && Array.isArray(ctx.scenes));
    check("track carries a resolvable addr", agent && agent.addr && agent.addr.kind === "track", JSON.stringify(agent?.addr));
    check("mixer values present (numeric volume)", typeof agent?.mixer?.volume === "number", `volume=${agent?.mixer?.volume}`);
    check("clip-slot occupancy serialized", Array.isArray(agent?.clipSlots) && agent.clipSlots.some((s) => s.hasClip));

    // 2. Notes
    const occupied = agent.clipSlots.find((s) => s.hasClip);
    const notesRes = (await call("get_clip_notes", { addr: { kind: "clipSlot", track: agent.index, slot: occupied.slot } })).result;
    const pitches = (notesRes.notes ?? []).map((n) => n.pitch).sort((a, b) => a - b);
    check("get_clip_notes returns the 4 notes", JSON.stringify(pitches) === JSON.stringify([60, 64, 67, 72]), `pitches=${JSON.stringify(pitches)}`);

    // 3. Devices — ensure a Reverb, then deep-read it
    let trackFull = (await call("get_track", { addr: agent.addr })).result;
    if (!trackFull.devices.some((d) => d.name === "Reverb")) {
      console.log("(inserting Reverb on Agent Test)");
      const r = await call("run_code", { code: `await context.application.song.tracks[${agent.index}].insertDevice("Reverb", 0); return "ok";` });
      check("insertDevice('Reverb') ok", r.ok, r.error ?? "");
      trackFull = (await call("get_track", { addr: agent.addr })).result;
    }
    const reverbIdx = trackFull.devices.findIndex((d) => d.name === "Reverb");
    check("get_track returns full device tree", reverbIdx >= 0, `devices=${trackFull.devices.map((d) => d.name).join(",")}`);
    const dev = (await call("get_device", { addr: { kind: "device", track: agent.index, index: reverbIdx } })).result;
    const firstWithValue = (dev.parameters ?? []).find((p) => typeof p.value === "number");
    check("get_device returns params with numeric values", !!firstWithValue, firstWithValue ? `${firstWithValue.name}=${firstWithValue.value}` : "none");

    // 4. Address round-trip
    const rt = (await call("get_track", { addr: { kind: "track", index: agent.index } })).result;
    check("address round-trips to same track", rt.name === agent.name, `${rt.name} === ${agent.name}`);

    // 5. Selection (manual)
    const sel = (await call("get_selection")).result.selection;
    if (sel) {
      check("get_selection returns a captured selection", Array.isArray(sel.addresses), `scope=${sel.scope}, addrs=${JSON.stringify(sel.addresses)}`);
    } else {
      console.log("ℹ️  get_selection: none captured yet. To test: right-click a clip/track in Live → 'Send to Agent', then re-run.");
    }

    // summary
    const passed = results.filter((r) => r.ok).length;
    console.log(`\n${passed}/${results.length} checks passed${passed === results.length ? " ✅" : " ❌"}`);
  } catch (e) {
    console.error("client error:", e);
  } finally {
    ws.close();
  }
});

ws.on("message", (data) => {
  const msg = JSON.parse(data.toString());
  const p = pending.get(msg.id);
  if (p) {
    pending.delete(msg.id);
    p.resolve(msg);
  }
});
ws.on("error", (e) => console.error("WebSocket error:", e.message));
