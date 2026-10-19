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

function extractVideoBase64(interaction: any): string | undefined {
  if (interaction?.output_video?.data) return interaction.output_video.data;
  for (const output of interaction?.outputs || []) {
    if (output?.type === "video" && output?.data) return output.data;
  }
  return undefined;
}

export async function extendCommand(prompt: string, opts: any) {
  try {
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey });

    const model = opts.model || "gemini-omni-1.1-flash";

    if (!opts.video) {
      throw new Error("--video is required for extend command");
    }

    if (!fs.existsSync(opts.video)) {
      throw new Error(`Video file not found: ${opts.video}`);
    }

    console.error(`Uploading video for extension with ${model}...`);
    const startTime = Date.now();

    // Upload the video with the Files API, then reference it by URI.
    let videoFile: any = await ai.files.upload({
      file: opts.video,
      config: { mimeType: "video/mp4" },
    });

    while (videoFile.state === "PROCESSING") {
      const elapsed = formatElapsed(Date.now() - startTime);
      console.error(`Waiting for upload to process... ${elapsed} elapsed`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
      videoFile = await ai.files.get({ name: videoFile.name });
    }

    if (videoFile.state === "FAILED") {
      throw new Error("Video upload failed to process");
    }

    console.error(`Extending video with ${model}...`);

    const interaction: any = await ai.interactions.create({
      model,
      input: [
        { type: "video", uri: videoFile.uri },
        { type: "text", text: prompt },
      ],
    });

    const elapsed = formatElapsed(Date.now() - startTime);
    console.error(`Video extended in ${elapsed}`);

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
