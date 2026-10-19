import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import { getApiKey } from "../config.js";

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".png": return "image/png";
    case ".jpg":
    case ".jpeg": return "image/jpeg";
    case ".gif": return "image/gif";
    case ".webp": return "image/webp";
    default: throw new Error(`Unsupported image format: ${ext}`);
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function generateFilename(prompt: string): string {
  const slug = slugify(prompt.slice(0, 40));
  const timestamp = Math.floor(Date.now() / 1000);
  return `${slug}-${timestamp}.mp4`;
}

function readImageAsBase64(filePath: string): string {
  const buffer = fs.readFileSync(filePath);
  return buffer.toString("base64");
}

function formatElapsed(ms: number): string {
  const secs = Math.floor(ms / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  const remainSecs = secs % 60;
  return `${mins}m${remainSecs}s`;
}

function imageContent(filePath: string) {
  return {
    type: "image" as const,
    data: readImageAsBase64(filePath),
    mime_type: getMimeType(filePath),
  };
}

function extractVideoBase64(interaction: any): string | undefined {
  if (interaction?.output_video?.data) return interaction.output_video.data;
  for (const output of interaction?.outputs || []) {
    if (output?.type === "video" && output?.data) return output.data;
  }
  return undefined;
}

export async function generateCommand(prompt: string, opts: any) {
  try {
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey });

    const model = opts.model || "gemini-omni-1.1-flash";

    if (opts.duration) {
      console.error(`Note: --duration is not supported by ${model}; ignoring.`);
    }
    if (opts.seed !== undefined) {
      console.error(`Note: --seed is not supported by ${model}; ignoring.`);
    }
    if (opts.person) {
      console.error(`Note: --person is not supported by ${model}; ignoring.`);
    }

    // Negative prompts are not a separate parameter on this model; the docs
    // say to put negatives in the regular prompt.
    let fullPrompt = prompt;
    if (opts.negative) {
      fullPrompt = `${prompt}. Do not include: ${opts.negative}`;
    }

    // Build input
    const input: any[] = [];
    if (opts.image) {
      if (!fs.existsSync(opts.image)) {
        throw new Error(`Image file not found: ${opts.image}`);
      }
      input.push(imageContent(opts.image));
    }
    if (opts.lastFrame) {
      if (!fs.existsSync(opts.lastFrame)) {
        throw new Error(`Last frame image not found: ${opts.lastFrame}`);
      }
      input.push(imageContent(opts.lastFrame));
    }
    if (opts.ref && opts.ref.length > 0) {
      if (opts.ref.length > 3) {
        throw new Error("Maximum 3 reference images allowed");
      }
      for (const refPath of opts.ref) {
        if (!fs.existsSync(refPath)) {
          throw new Error(`Reference image not found: ${refPath}`);
        }
        input.push(imageContent(refPath));
      }
    }
    if (input.length > 0) {
      input.push({ type: "text", text: fullPrompt });
    }

    // Config options
    const responseFormat: any = { type: "video" };
    if (opts.aspect) responseFormat.aspect_ratio = opts.aspect;
    if (opts.resolution) responseFormat.resolution = opts.resolution;

    // Start generation
    console.error(`Generating video with ${model}...`);
    const startTime = Date.now();

    const interaction: any = await ai.interactions.create({
      model,
      input: input.length > 0 ? input : fullPrompt,
      response_format: responseFormat,
    });

    const elapsed = formatElapsed(Date.now() - startTime);
    console.error(`Video generated in ${elapsed}`);

    const videoData = extractVideoBase64(interaction);
    if (!videoData) {
      throw new Error("No video in response");
    }

    const outputPath = opts.output || generateFilename(prompt);
    fs.writeFileSync(outputPath, Buffer.from(videoData, "base64"));

    console.error(`Saved to ${outputPath}`);

    const result = {
      ok: true,
      data: {
        file: outputPath,
        model,
        aspect_ratio: opts.aspect || "16:9",
        resolution: opts.resolution || "720p",
        duration: opts.duration || null,
        elapsed,
      },
    };

    console.log(JSON.stringify(result));
  } catch (error) {
    console.log(JSON.stringify({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    }));
    process.exit(1);
  }
}
