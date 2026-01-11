import fs from "node:fs/promises"
import path from "node:path"

const repoRoot = path.resolve(process.cwd(), "..")
const contentImages = path.join(repoRoot, "content", "Images")
const targetImages = path.join(process.cwd(), "public", "Images")

async function copyDir(src, dst) {
  await fs.mkdir(dst, { recursive: true })
  const entries = await fs.readdir(src, { withFileTypes: true })
  await Promise.all(
    entries.map(async (e) => {
      const s = path.join(src, e.name)
      const d = path.join(dst, e.name)
      if (e.isDirectory()) return copyDir(s, d)
      if (e.isFile()) {
        // overwrite if changed
        const [sb, db] = await Promise.allSettled([fs.stat(s), fs.stat(d)])
        const dstStat = db.status === "fulfilled" ? db.value : null
        if (dstStat && dstStat.size === sb.value.size) return
        await fs.copyFile(s, d)
      }
    }),
  )
}

try {
  await copyDir(contentImages, targetImages)
  console.log(`[sync] Images copied: ${contentImages} -> ${targetImages}`)
} catch (err) {
  console.log("[sync] Failed to copy Images. Is content/Images present?")
  console.log(err)
  process.exitCode = 1
}

