// WP0 external harness stand-in: connects to the in-Live kernel over WebSocket,
// reads context, runs an action (create MIDI track + clip + notes), re-reads.
//
// Run (with Live Beta open + Developer Mode on + `npm start` running):
//   node test-client.mjs
import WebSocket from "ws";

const URL = "ws://127.0.0.1:17890";

const ACTION = `
const song = context.application.song;
const track = await song.createMidiTrack();
track.name = "Agent Test";
const clip = await track.clipSlots[0].createMidiClip(4); // 1 bar
clip.name = "Hello Notes";
clip.notes = [
  { pitch: 60, startTime: 0, duration: 1, velocity: 100 },
  { pitch: 64, startTime: 1, duration: 1, velocity: 100 },
  { pitch: 67, startTime: 2, duration: 1, velocity: 100 },
  { pitch: 72, startTime: 3, duration: 1, velocity: 100 },
];
log("created " + clip.notes.length + " notes on track '" + track.name + "'");
return { trackName: track.name, clipName: clip.name, noteCount: clip.notes.length };
`;

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

ws.on("open", async () => {
  try {
    console.log("→ connected to", URL);

    console.log("\n=== 1. get_context (before) ===");
    const before = await call("get_context");
    console.log(JSON.stringify(before.result, null, 2));

    console.log("\n=== 2. run_code (create MIDI track + clip + notes) ===");
    const action = await call("run_code", { code: ACTION });
    console.log("ok:", action.ok);
    if (action.logs?.length) console.log("logs:", action.logs);
    if (action.ok) console.log("result:", JSON.stringify(action.result, null, 2));
    else console.error("error:", action.error);

    console.log("\n=== 3. get_context (after — should include 'Agent Test') ===");
    const after = await call("get_context");
    console.log(JSON.stringify(after.result, null, 2));

    const created = after.result?.tracks?.some((t) => t.name === "Agent Test");
    console.log(
      `\n${created ? "✅ PASS" : "❌ FAIL"}: 'Agent Test' track ${created ? "is" : "is NOT"} present in the post-action snapshot.`,
    );
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
