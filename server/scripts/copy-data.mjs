import { cpSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const serverRoot = resolve(scriptDir, "..");
const sourceDir = resolve(serverRoot, "src/data");
const targetDir = resolve(serverRoot, "dist/data");

mkdirSync(targetDir, { recursive: true });

for (const fileName of ["channels.json", "events.json", "salesHistory.json", "skus.json", "suppliers.json"]) {
  cpSync(resolve(sourceDir, fileName), resolve(targetDir, fileName));
}

console.log("Copied JSON seed data to server/dist/data.");
