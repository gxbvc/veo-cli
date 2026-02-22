import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import { getApiKey } from "../config.js";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function generateFilename(prompt: string): string {
  const slug = slugify(prompt.slice(0, 30));
  const timestamp = Math.floor(Date.now() / 1000);
  return `${slug}-extended-${timestamp}.mp4`;
}

function formatElapsed(ms: number): string {
  const secs = Math.floor(ms / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  const remainSecs = secs % 60;
  return `${mins}m${remainSecs}s`;
}

export async function extendCommand(prompt: string, opts: any) {
  try {
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey });

    const model = opts.model || "veo-3.1-generate-preview";

    if (!opts.video) {
      throw new Error("--video is required for extend command");
    }

    if (!fs.existsSync(opts.video)) {
      throw new Error(`Video file not found: ${opts.video}`);
    }

    const videoBytes = fs.readFileSync(opts.video).toString("base64");

    const request: any = {
      model,
      prompt,
      video: {
        videoBytes,
        mimeType: "video/mp4",
      },
      config: {
        numberOfVideos: 1,
        resolution: "720p",
      },
    };

    console.error(`Extending video with ${model}...`);
    const startTime = Date.now();

    let operation = await ai.models.generateVideos(request);

    while (!operation.done) {
      const elapsed = formatElapsed(Date.now() - startTime);
      console.error(`Waiting for video extension... ${elapsed} elapsed`);
      await new Promise((resolve) => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation });
    }

    const elapsed = formatElapsed(Date.now() - startTime);
    console.error(`Video extended in ${elapsed}`);

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
