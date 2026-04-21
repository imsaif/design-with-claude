const isDebug = process.env.DWIC_DEBUG === "1";

function stamp(): string {
  return new Date().toISOString();
}

export const log = {
  info(msg: string, extra?: Record<string, unknown>) {
    process.stderr.write(
      `[dwic ${stamp()}] ${msg}${extra ? ` ${JSON.stringify(extra)}` : ""}\n`,
    );
  },
  debug(msg: string, extra?: Record<string, unknown>) {
    if (!isDebug) return;
    process.stderr.write(
      `[dwic ${stamp()} debug] ${msg}${extra ? ` ${JSON.stringify(extra)}` : ""}\n`,
    );
  },
  error(msg: string, err?: unknown) {
    const detail =
      err instanceof Error ? `${err.message}\n${err.stack ?? ""}` : err ? JSON.stringify(err) : "";
    process.stderr.write(`[dwic ${stamp()} error] ${msg}${detail ? ` :: ${detail}` : ""}\n`);
  },
};
