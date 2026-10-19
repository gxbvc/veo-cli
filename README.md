# veo-cli

CLI for generating videos with Google's Gemini Omni Flash model (`gemini-omni-1.1-flash`). Supports text-to-video, image-to-video, frame interpolation, reference images, and video extension.

## Prerequisites

- Node.js 20+
- A Gemini API key ([get one here](https://aistudio.google.com/apikey))

## Setup

```bash
cd ~/tools/veo-cli
npm install
npm run build
npm link

# Set up credentials (uses same key as nanobanana-cli)
ln -s ../nanobanana-cli/.env .env
# Or create your own:
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
```

## Usage

### Text-to-video

```bash
veo-cli generate "A cinematic shot of a majestic lion in the savannah"
veo-cli generate "A lion running" -o lion.mp4
veo-cli generate "Pizza making montage" --aspect 9:16
veo-cli generate "Grand Canyon drone shot" --resolution 4k --duration 8
veo-cli generate "A sunset" --negative "cartoon, drawing, low quality"
```

### Image-to-video (animate a starting frame)

```bash
veo-cli generate "The cat wakes up and stretches" --image sleeping-cat.png
```

### Frame interpolation

Provide both a starting and ending frame — the model fills in the motion between them:

```bash
veo-cli generate "The car drives off a cliff" --image start.png --last-frame end.png
```

### Reference images

Provide up to 3 reference images to preserve a subject's appearance:

```bash
veo-cli generate "Woman walks on the beach" --ref dress.png --ref woman.png --ref glasses.png
```

### Video extension

Extend a video with a 3–10 second continuation:

```bash
veo-cli extend "The butterfly lands on a flower" --video butterfly.mp4
```

## Models

| Model | Description | Audio | Resolutions |
|-------|-------------|-------|-------------|
| `gemini-omni-1.1-flash` | Fast video generation, editing, keyframe interpolation, extension with native audio (default) | ✔️ | 360p, 720p, 1080p, 4k |
| `veo-3.1-generate-preview` | Deprecated, shut down Oct 22, 2026 | ✔️ | 720p, 1080p, 4k |
| `veo-3.1-fast-generate-preview` | Deprecated, shut down Oct 22, 2026 | ✔️ | 720p, 1080p, 4k |

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `-o, --output <path>` | Output file path | Auto-generated from prompt |
| `-i, --image <path>` | Starting frame image | — |
| `--last-frame <path>` | Ending frame (interpolation) | — |
| `--ref <path>` | Reference image (repeatable, max 3) | — |
| `--aspect <ratio>` | `16:9` or `9:16` | `16:9` |
| `--resolution <res>` | `360p`, `720p`, `1080p`, `4k` | `720p` |
| `--duration <seconds>` | Not supported by `gemini-omni-1.1-flash`; ignored | — |
| `--negative <text>` | Things to avoid (appended to the prompt) | — |
| `--seed <number>` | Not supported by `gemini-omni-1.1-flash`; ignored | — |
| `--person <mode>` | Not supported by `gemini-omni-1.1-flash`; ignored | Model default |
| `--model <id>` | Model identifier | `gemini-omni-1.1-flash` |

## Output

JSON to stdout:

```json
{"ok": true, "data": {"file": "output.mp4", "model": "gemini-omni-1.1-flash", "aspect_ratio": "16:9", "resolution": "720p", "duration": "8", "elapsed": "1m2s"}}
```

Progress messages go to stderr.

## How it works

Uses the `@google/genai` SDK's `interactions.create` method with `response_format: { type: "video" }`. The call blocks until the video is ready, then the base64 video data is written straight to disk. Generation time depends on duration, resolution, and API load.

Videos include a SynthID watermark.
