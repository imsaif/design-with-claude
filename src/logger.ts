const isDebug = process.env.DWC_DEBUG === "1";

function stamp(): string {
  return new Date().toISOString();
}

export const log = {
  info(msg: string, extra?: Record<string, unknown>) {
    process.stderr.write(
      `[dwc ${stamp()}] ${msg}${extra ? ` ${JSON.stringify(extra)}` : ""}\n`,
    );
  },
  debug(msg: string, extra?: Record<string, unknown>) {
    if (!isDebug) return;
    process.stderr.write(
      `[dwc ${stamp()} debug] ${msg}${extra ? ` ${JSON.stringify(extra)}` : ""}\n`,
    );
  },
  error(msg: string, err?: unknown) {
    const detail =
      err instanceof Error ? `${err.message}\n${err.stack ?? ""}` : err ? JSON.stringify(err) : "";
    process.stderr.write(`[dwc ${stamp()} error] ${msg}${detail ? ` :: ${detail}` : ""}\n`);
  },
};
