#!/usr/bin/env node
import { existsSync } from "fs";
import fs from "fs/promises";
import path from "path";

import { TEMPLATES, USAGE, HELP } from "./createService.constants.js";
import parseArgs from "./parseArgs.js";

async function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(`Error: ${err.message}\n${USAGE}`);
    process.exit(1);
  }
  const { serviceName, template, help } = options;

  if (help) {
    console.log(HELP);
    return;
  }

  if (!serviceName) {
    console.error(USAGE);
    process.exit(1);
  }

  if (!TEMPLATES[template]) {
    console.error(`Error: Unknown template "${template}".\n${USAGE}`);
    process.exit(1);
  }

  const serviceDir = path.join(process.cwd(), serviceName);

  if (existsSync(serviceDir)) {
    console.error(`Error: Directory ${serviceDir} already exists.`);
    process.exit(1);
  }

  const templateDir = path.join(
    import.meta.dirname,
    "..",
    "..",
    "templates",
    TEMPLATES[template],
  );
  await fs.cp(templateDir, serviceDir, { recursive: true });

  console.log(`Created ${template} service ${serviceName} at ${serviceDir}`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
