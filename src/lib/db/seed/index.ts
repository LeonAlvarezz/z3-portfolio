import { $ } from "bun";
import { getEnvFile, getMode } from "../utils/get-mode";

async function main() {
  const args = process.argv.slice(2);
  const mode = getMode(args);
  const envFile = getEnvFile(mode);
  console.log(`🌱 Running ${mode} seed with ${envFile}...`);

  if (mode === "prod") {
    await $`bun --env-file=${envFile} run src/lib/db/seed/seed-prod.ts`;
  } else {
    await $`bun --env-file=${envFile} run src/lib/db/seed/seed-dev.ts`;
  }

  console.log(`✅ ${mode} seed completed successfully!`);
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Unexpected error during seeding:", err);
  process.exit(1);
});
