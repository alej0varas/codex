import path from "path";
import { spawnSync } from "node:child_process";

export function shortenPath(p: string, maxLength = 40): string {
  const home = process.env["HOME"];
  // Replace home directory with '~' if applicable.
  const displayPath =
    home !== undefined && p.startsWith(home) ? p.replace(home, "~") : p;
  if (displayPath.length <= maxLength) {
    return displayPath;
  }

  const parts = displayPath.split(path.sep);
  let result = "";
  for (let i = parts.length - 1; i >= 0; i--) {
    const candidate = path.join("~", "...", ...parts.slice(i));
    if (candidate.length <= maxLength) {
      result = candidate;
    } else {
      break;
    }
  }
  return result || displayPath.slice(-maxLength);
}

export function shortCwd(maxLength = 40): string {
  return shortenPath(process.cwd(), maxLength);
}
// Get a display name for notifications: repository name if in a git repo, else current directory name
export function getNotificationName(): string {
  try {
    const res = spawnSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" });
    if (res.status === 0 && res.stdout) {
      return path.basename(res.stdout.trim());
    }
  } catch {
    // ignore errors
  }
  return path.basename(process.cwd());
}
