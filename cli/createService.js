#!/usr/bin/env node
const fs = require("fs/promises");
const { existsSync } = require("fs");
const path = require("path");

async function main() {
  const serviceName = process.argv[2];

  if (!serviceName) {
    console.error("Usage: create-service <service-name>");
    process.exit(1);
  }

  const serviceDir = path.join(process.cwd(), serviceName);

  if (existsSync(serviceDir)) {
    console.error(`Error: Directory ${serviceDir} already exists.`);
    process.exit(1);
  }

  const templateDir = path.join(__dirname, "templates", "nodejs-service");
  await fs.cp(templateDir, serviceDir, { recursive: true });

  console.log(`Created service ${serviceName} at ${serviceDir}`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
