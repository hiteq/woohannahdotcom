import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const repoRoot = process.cwd();
const contentImages = path.join(repoRoot, "content", "Images");
const targetImages = path.join(process.cwd(), "public", "Images");

export function isFileUpToDate(srcStat, dstStat) {
  if (!dstStat) return false;
  if (!dstStat.isFile?.()) return false;
  // If we preserve dst mtime after copy, (size + mtime) is a cheap and reliable check.
  return (
    dstStat.size === srcStat.size &&
    Math.trunc(dstStat.mtimeMs) === Math.trunc(srcStat.mtimeMs)
  );
}

async function copyDir(src, dst) {
  await fs.mkdir(dst, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  await Promise.all(
    entries.map(async (e) => {
      const s = path.join(src, e.name);
      const d = path.join(dst, e.name);
      if (e.isDirectory()) return copyDir(s, d);
      if (e.isFile()) {
        // overwrite if changed
        const srcStat = await fs.stat(s);
        let dstStat = null;
        try {
          dstStat = await fs.stat(d);
        } catch {
          // missing dst is fine
        }

        if (isFileUpToDate(srcStat, dstStat)) return;

        await fs.copyFile(s, d);
        // Preserve timestamps so next run can be an O(1) skip.
        await fs.utimes(d, srcStat.atime, srcStat.mtime);
      }
    }),
  );
}

export async function syncContentImages({ src = contentImages, dst = targetImages } = {}) {
  await copyDir(src, dst);
  console.log(`[sync] Images copied: ${src} -> ${dst}`);
}

async function main() {
  try {
    await syncContentImages();
  } catch (err) {
    console.log("[sync] Failed to copy Images. Is content/Images present?");
    console.log(err);
    process.exitCode = 1;
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  await main();
}
