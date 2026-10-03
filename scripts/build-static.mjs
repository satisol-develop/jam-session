import { existsSync, mkdirSync, renameSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const stash = path.join(root, "node_modules", ".jam-stash");
const moves = [
  [path.join(root, "src", "app", "api"), path.join(stash, "api")],
  [path.join(root, "src", "proxy.ts"), path.join(stash, "proxy.ts")],
];

rmSync(stash, { recursive: true, force: true });
mkdirSync(stash, { recursive: true });
rmSync(path.join(root, ".next"), { recursive: true, force: true });

function restore() {
  for (const [from, to] of moves) {
    if (existsSync(to)) renameSync(to, from);
  }
}

try {
  for (const [from, to] of moves) {
    if (existsSync(from)) renameSync(from, to);
  }
  const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
  const res = spawnSync(process.execPath, [nextBin, "build"], {
    stdio: "inherit",
    env: { ...process.env, NEXT_OUTPUT: "export" },
    cwd: root,
  });
  process.exitCode = res.status ?? 1;
} finally {
  restore();
}
