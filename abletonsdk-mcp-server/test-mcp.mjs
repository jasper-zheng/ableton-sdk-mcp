// WP3 verification: spawn the MCP server over stdio and exercise it as an MCP client.
// Prereq: kernel running (Live Beta + Developer Mode + `cd kernel && npm start -- --live ...`)
// and `npm run build` done here. Run:  node test-mcp.mjs
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const results = [];
const check = (name, cond, detail = "") => {
  results.push(!!cond);
  console.log(`${cond ? "✅" : "❌"} ${name}${detail ? " — " + detail : ""}`);
};
const textOf = (r) => r?.content?.find((c) => c.type === "text")?.text ?? "";

const transport = new StdioClientTransport({ command: "node", args: ["dist/index.js"] });
const client = new Client({ name: "test-mcp", version: "1.0.0" });
await client.connect(transport);

try {
  const EXPECTED = [
    "ableton_run_code",
    "ableton_get_context",
    "ableton_get_track",
    "ableton_get_device",
    "ableton_get_clip_notes",
    "ableton_get_selection",
    "ableton_render_audio",
  ];
  const names = (await client.listTools()).tools.map((t) => t.name);
  check("lists all 7 ableton_* tools", EXPECTED.every((n) => names.includes(n)), names.join(", "));

  const ruris = (await client.listResources()).resources.map((r) => r.uri);
  check("lists api + guide resources", ruris.includes("ableton://api/sdk") && ruris.includes("ableton://guide/run_code"), ruris.join(", "));

  const apiText = (await client.readResource({ uri: "ableton://api/sdk" })).contents?.[0]?.text ?? "";
  check("api resource returns the .d.ts", apiText.includes("ExtensionContext"), `${apiText.length} chars`);

  const ctx = await client.callTool({ name: "ableton_get_context", arguments: {} });
  let tempo;
  try { tempo = JSON.parse(textOf(ctx)).tempo; } catch { /* ignore */ }
  check("ableton_get_context returns the song", !ctx.isError && typeof tempo === "number", `tempo=${tempo}`);

  const rc = await client.callTool({ name: "ableton_run_code", arguments: { code: "return context.application.song.tempo;" } });
  check("ableton_run_code returns a value", !rc.isError && /\d/.test(textOf(rc)), textOf(rc).split("\n")[0]);

  const err = await client.callTool({ name: "ableton_run_code", arguments: { code: "throw new Error('boom');" } });
  check("run_code error → isError + [runtime] phase", err.isError === true && /\[runtime\]/.test(textOf(err)), textOf(err).split("\n")[0]);

  const passed = results.filter(Boolean).length;
  console.log(`\n${passed}/${results.length} checks passed${passed === results.length ? " ✅" : " ❌"}`);
} catch (e) {
  console.error("client error:", e);
} finally {
  await client.close();
}
