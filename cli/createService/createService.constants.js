export const TEMPLATES = {
  javascript: "nodejs-service",
  typescript: "nodejs-typescript-service",
};
export const DEFAULT_TEMPLATE = "javascript";

const availableTemplates = Object.keys(TEMPLATES).join(" | ");

export const USAGE = `Usage: create-service <service-name> [--template <${availableTemplates}>] [--help]`;

const availableTemplatesForHelp = Object.entries(TEMPLATES)
  .map(([name, dir]) => `${name.padEnd(12)} templates/${dir}`)
  .join("\n");

export const HELP = `${USAGE}

Creates a new service in ./<service-name> from a template.

Options:
  --template <name>  Template to use (default: ${DEFAULT_TEMPLATE})
${availableTemplatesForHelp}
  -h, --help         Show this help`;