import { Command } from "commander";
import { generateCommand } from "./commands/generate.js";
import { extendCommand } from "./commands/extend.js";

const program = new Command();

function collect(val: string, arr: string[]) {
  arr.push(val);
  return arr;
}

program
  .name("veo-cli")
  .version("0.1.0")
  .description("CLI for generating videos with Google Veo 3.1");

program.command("generate")
  .description("Generate a video from text, optionally with image inputs")
  .argument("<prompt>", "Text prompt describing the video to generate")
  .option("-o, --output <path>", "Output file path (default: auto-generated)")
  .option("-i, --image <path>", "Starting frame image")
  .option("--last-frame <path>", "Ending frame image (interpolation, Veo 3.1 only)")
  .option("--ref <path>", "Reference image for subject preservation (repeatable, max 3, Veo 3.1 only)", collect, [])
  .option("--aspect <ratio>", "Aspect ratio: 16:9 (default), 9:16")
  .option("--resolution <res>", "Resolution: 720p (default), 1080p, 4k")
  .option("--duration <seconds>", "Duration: 4, 6, or 8 seconds")
  .option("--negative <text>", "Negative prompt (things to avoid)")
  .option("--seed <number>", "Seed for slightly improved determinism")
  .option("--person <mode>", "Person generation: allow_all, allow_adult, dont_allow")
  .option("--model <id>", "Model ID (default: veo-3.1-generate-preview)")
  .action(generateCommand);

program.command("extend")
  .description("Extend a previously Veo-generated video by ~7 seconds")
  .argument("<prompt>", "Text prompt for the extension")
  .requiredOption("--video <path>", "Path to the Veo-generated video to extend")
  .option("-o, --output <path>", "Output file path (default: auto-generated)")
  .option("--model <id>", "Model ID (default: veo-3.1-generate-preview)")
  .action(extendCommand);

program.parse();
