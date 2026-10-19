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
  .description("CLI for generating videos with Google Gemini Omni Flash");

program.command("generate")
  .description("Generate a video from text, optionally with image inputs")
  .argument("<prompt>", "Text prompt describing the video to generate")
  .option("-o, --output <path>", "Output file path (default: auto-generated)")
  .option("-i, --image <path>", "Starting frame image")
  .option("--last-frame <path>", "Ending frame image (interpolation)")
  .option("--ref <path>", "Reference image for subject preservation (repeatable, max 3)", collect, [])
  .option("--aspect <ratio>", "Aspect ratio: 16:9 (default), 9:16")
  .option("--resolution <res>", "Resolution: 720p (default), 360p, 1080p, 4k")
  .option("--duration <seconds>", "Duration in seconds (not supported by gemini-omni-1.1-flash; ignored)")
  .option("--negative <text>", "Things to avoid (appended to the prompt)")
  .option("--seed <number>", "Seed for slightly improved determinism (not supported by gemini-omni-1.1-flash; ignored)")
  .option("--person <mode>", "Person generation: allow_all, allow_adult, dont_allow (not supported by gemini-omni-1.1-flash; ignored)")
  .option("--model <id>", "Model ID (default: gemini-omni-1.1-flash)")
  .action(generateCommand);

program.command("extend")
  .description("Extend a video with a 3-10 second continuation")
  .argument("<prompt>", "Text prompt for the extension")
  .requiredOption("--video <path>", "Path to the Veo-generated video to extend")
  .option("-o, --output <path>", "Output file path (default: auto-generated)")
  .option("--model <id>", "Model ID (default: gemini-omni-1.1-flash)")
  .action(extendCommand);

program.parse();
