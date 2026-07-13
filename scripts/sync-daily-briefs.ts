import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateDailyBrief } from "../app/lib/daily-briefs/validate";

export function generateDailyBriefModule(inputFiles: string[]): string {
  const files = [...inputFiles].sort((left, right) => right.localeCompare(left));
  const imports = files
    .map((file, index) => `import brief${index} from "../../../data/daily-briefs/${file}";`)
    .join("\n");
  const values = files.map((_, index) => `brief${index}`).join(", ");
  const prefix = imports ? `${imports}\n` : "";
  return `${prefix}import type { DailyPlatformBrief } from "./types";\nimport { validateDailyBrief } from "./validate";\n\nexport const STATIC_DAILY_BRIEFS: DailyPlatformBrief[] = [${values}]\n  .map(validateDailyBrief)\n  .sort((left, right) => right.date.localeCompare(left.date));\n`;
}

export async function syncDailyBriefs(root: string): Promise<number> {
  const dataDir = resolve(root, "data/daily-briefs");
  await mkdir(dataDir, { recursive: true });
  const files = (await readdir(dataDir)).filter((file) => file.endsWith(".json")).sort();
  for (const file of files) validateDailyBrief(JSON.parse(await readFile(resolve(dataDir, file), "utf8")));
  await writeFile(
    resolve(root, "app/lib/daily-briefs/static-data.ts"),
    generateDailyBriefModule(files),
    "utf8",
  );
  return files.length;
}

const scriptPath = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === scriptPath) {
  const root = resolve(dirname(scriptPath), "..");
  const count = await syncDailyBriefs(root);
  console.log(`已同步 ${count} 期三平台日报`);
}
