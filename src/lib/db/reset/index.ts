import { $ } from "bun";
import readline from "node:readline/promises";

type Mode = "dev" | "prod" | "test";

async function confirmProdReset() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const answer = (
      await rl.question(
        "Type RESET_PROD to confirm resetting production data: ",
      )
    ).trim();
    return answer === "RESET_PROD";
  } finally {
    rl.close();
  }
}

function getMode(args: string[]): Mode {
  if (args.includes("--test") || args.includes("test")) {
    return "test";
  }

  if (args.includes("--prod") || args.includes("prod")) {
    return "prod";
  }

  if (args.includes("--dev") || args.includes("dev")) {
    return "dev";
  }

  if (process.env.NODE_ENV === "test") {
    return "test";
  }

  if (process.env.NODE_ENV === "production") {
    return "prod";
  }

  return "dev";
}

function getEnvFile(mode: Mode) {
  switch (mode) {
    case "test":
      return ".env.test";
    case "prod":
      return ".env.prod";
    default:
      return ".env";
  }
}

async function main() {
  const args = process.argv.slice(2);
  const mode = getMode(args);
  const envFile = getEnvFile(mode);
  console.log(`🌱 Running ${mode} reset with ${envFile}...`);

  if (mode === "prod") {
    const confirmed = await confirmProdReset();
    if (!confirmed) {
      throw new Error(
        "Production reset cancelled because confirmation did not match.",
      );
    }
  }

  await $`bun --env-file=${envFile} run src/lib/db/reset/reset.ts`;

  console.log(`✅ ${mode} reset completed successfully!`);
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Unexpected error during resetting:", err);
  process.exit(1);
});
