#!/usr/bin/env node
import { chmodSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const bins = [
  resolve(here, "..", "dist", "server.js"),
  resolve(here, "..", "dist", "bin", "setup.js"),
];
for (const bin of bins) {
  try {
    chmodSync(bin, 0o755);
  } catch (err) {
    process.stderr.write(`warn: failed to chmod ${bin}: ${err}\n`);
  }
}
