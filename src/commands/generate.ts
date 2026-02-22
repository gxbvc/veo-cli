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

export async function generateCommand(prompt: string, opts: any) {
  try {
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey });

    const model = opts.model || "veo-3.1-generate-preview";

    // Build request
    const request: any = {
      model,
      prompt,
    };

    // Image input (starting frame)
    if (opts.image) {
      if (!fs.existsSync(opts.image)) {
        throw new Error(`Image file not found: ${opts.image}`);
      }
      request.image = {
        imageBytes: readImageAsBase64(opts.image),
        mimeType: getMimeType(opts.image),
      };
    }

    // Config options
    const config: any = {};

    if (opts.aspect) config.aspectRatio = opts.aspect;
    if (opts.resolution) config.resolution = opts.resolution;
    if (opts.duration) config.durationSeconds = parseInt(opts.duration, 10);
    if (opts.negative) config.negativePrompt = opts.negative;
    if (opts.seed !== undefined) config.seed = parseInt(opts.seed, 10);
    if (opts.person) config.personGeneration = opts.person;

    // Last frame (interpolation)
    if (opts.lastFrame) {
      if (!fs.existsSync(opts.lastFrame)) {
        throw new Error(`Last frame image not found: ${opts.lastFrame}`);
      }
      config.lastFrame = {
        imageBytes: readImageAsBase64(opts.lastFrame),
        mimeType: getMimeType(opts.lastFrame),
      };
    }

    // Reference images
    if (opts.ref && opts.ref.length > 0) {
      if (opts.ref.length > 3) {
        throw new Error("Maximum 3 reference images allowed");
      }
      config.referenceImages = opts.ref.map((refPath: string) => {
        if (!fs.existsSync(refPath)) {
          throw new Error(`Reference image not found: ${refPath}`);
        }
        return {
          image: {
            imageBytes: readImageAsBase64(refPath),
            mimeType: getMimeType(refPath),
          },
          referenceType: "asset",
        };
      });
    }

    if (Object.keys(config).length > 0) {
      request.config = config;
    }

    // Start generation
    console.error(`Generating video with ${model}...`);
    const startTime = Date.now();

    let operation = await ai.models.generateVideos(request);

    // Poll until done
    while (!operation.done) {
      const elapsed = formatElapsed(Date.now() - startTime);
      console.error(`Waiting for video generation... ${elapsed} elapsed`);
      await new Promise((resolve) => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation });
    }

    const elapsed = formatElapsed(Date.now() - startTime);
    console.error(`Video generated in ${elapsed}`);

    // Download the video
    const outputPath = opts.output || generateFilename(prompt);

    const generatedVideo = operation.response?.generatedVideos?.[0];
    if (!generatedVideo?.video) {
      throw new Error("No video in response");
    }

    await ai.files.download({
      file: generatedVideo.video,
      downloadPath: outputPath,
    });

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
