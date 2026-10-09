#!/usr/bin/env node
const fs = require("fs/promises");
const { existsSync } = require("fs");
const path = require("path");

const TEMPLATES = {
  javascript: "nodejs-service",
  typescript: "nodejs-typescript-service",
};
const DEFAULT_TEMPLATE = "javascript";
const USAGE = `Usage: create-service <service-name> [--template <${Object.keys(TEMPLATES).join("|")}>]`;

function parseArgs(args) {
  let serviceName;
  let template = DEFAULT_TEMPLATE;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--template") {
      template = args[++i];
      if (!template) throw new Error("--template needs a value");
    } else if (arg.startsWith("--template=")) {
      template = arg.slice("--template=".length);
    } else if (arg.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    } else if (!serviceName) {
      serviceName = arg;
    } else {
      throw new Error(`Unexpected argument: ${arg}`);
    }
  }

  return { serviceName, template };
}

async function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(`Error: ${err.message}\n${USAGE}`);
    process.exit(1);
  }
  const { serviceName, template } = options;

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

  const templateDir = path.join(__dirname, "..", "templates", TEMPLATES[template]);
  await fs.cp(templateDir, serviceDir, { recursive: true });

  console.log(`Created ${template} service ${serviceName} at ${serviceDir}`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
