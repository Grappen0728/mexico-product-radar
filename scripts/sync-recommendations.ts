import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateReport } from "../app/lib/recommendations/validate";

export function renderStaticDataModule(files: string[]): string {
  if (files.length === 0) {
    return `import { SAMPLE_REPORT } from "./sample";\nimport type { RecommendationReport } from "./types";\n\nexport const STATIC_REPORTS: RecommendationReport[] = [SAMPLE_REPORT]\n  .sort((left, right) => right.date.localeCompare(left.date));\n`;
  }

  const imports = files
    .map((file, index) => `import report${index} from "../../../data/recommendations/${file}";`)
    .join("\n");
  const reports = files.map((_, index) => `report${index} as RecommendationReport`).join(", ");
  return `import { SAMPLE_REPORT } from "./sample";\n${imports}\nimport type { RecommendationReport } from "./types";\n\nexport const STATIC_REPORTS: RecommendationReport[] = [SAMPLE_REPORT, ${reports}]\n  .sort((left, right) => right.date.localeCompare(left.date));\n`;
}

export async function syncRecommendations(root: string): Promise<number> {
  const dataDir = resolve(root, "data/recommendations");
  await mkdir(dataDir, { recursive: true });
  const files = (await readdir(dataDir)).filter((file) => file.endsWith(".json")).sort();
  for (const file of files) {
    validateReport(JSON.parse(await readFile(resolve(dataDir, file), "utf8")));
  }
  await writeFile(
    resolve(root, "app/lib/recommendations/static-data.ts"),
    renderStaticDataModule(files),
    "utf8",
  );
  return files.length;
}

const scriptPath = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === scriptPath) {
  const root = resolve(dirname(scriptPath), "..");
  const count = await syncRecommendations(root);
  console.log(`已同步 ${count} 条历史推荐`);
}
