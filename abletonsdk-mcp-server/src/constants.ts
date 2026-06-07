/** WebSocket URL of the in-Live kernel (override with ABLETON_KERNEL_URL). */
export const KERNEL_URL = process.env.ABLETON_KERNEL_URL ?? "ws://127.0.0.1:17890";

/** Max characters returned by a tool before truncation (keeps agent context bounded). */
export const CHARACTER_LIMIT = 25000;

/** Per-call timeout so a dead/slow kernel never hangs a tool indefinitely. */
export const CALL_TIMEOUT_MS = 60000;
