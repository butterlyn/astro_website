import { readFileSync } from "node:fs";
import { previewWorker } from "./preview-guard.ts";

const logFile = process.argv[2];
if (!logFile) throw new Error("Pass the Wrangler deployment log path.");
const url = readFileSync(logFile, "utf8").match(
  new RegExp(`https://${previewWorker}\\.[a-z0-9-]+\\.workers\\.dev\\b`),
)?.[0];
if (!url) throw new Error("Wrangler did not report the expected preview URL.");
console.log(`url=${url}`);
