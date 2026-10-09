import { DEFAULT_TEMPLATE } from "./createService.constants.js";

export default function parseArgs(args) {
  let serviceName;
  let template = DEFAULT_TEMPLATE;
  let help = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "-h" || arg === "--help" || arg === "-help") {
      help = true;
    } else if (arg === "--template") {
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

  return { serviceName, template, help };
}
