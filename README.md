# veo-cli

CLI for generating videos with Google's Veo 3.1 model. Supports text-to-video, image-to-video, frame interpolation, reference images, and video extension.

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

### Frame interpolation (Veo 3.1 only)

Provide both a starting and ending frame — the model fills in the motion between them:

```bash
veo-cli generate "The car drives off a cliff" --image start.png --last-frame end.png
```

### Reference images (Veo 3.1 only)

Provide up to 3 reference images to preserve a subject's appearance:

```bash
veo-cli generate "Woman walks on the beach" --ref dress.png --ref woman.png --ref glasses.png
```

### Video extension (Veo 3.1 only)

Extend a previously Veo-generated video by ~7 seconds:

```bash
veo-cli extend "The butterfly lands on a flower" --video butterfly.mp4
```

## Models

| Model | Description | Audio | Resolutions |
|-------|-------------|-------|-------------|
| `veo-3.1-generate-preview` | Latest, highest quality (default) | ✔️ | 720p, 1080p, 4k |
| `veo-3.1-fast-generate-preview` | Fast variant | ✔️ | 720p, 1080p, 4k |
| `veo-3` | Stable | ✔️ | 720p, 1080p |
| `veo-3-fast` | Fast stable | ✔️ | 720p, 1080p |
| `veo-2` | Legacy, silent | ❌ | 720p |

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `-o, --output <path>` | Output file path | Auto-generated from prompt |
| `-i, --image <path>` | Starting frame image | — |
| `--last-frame <path>` | Ending frame (interpolation) | — |
| `--ref <path>` | Reference image (repeatable, max 3) | — |
| `--aspect <ratio>` | `16:9` or `9:16` | `16:9` |
| `--resolution <res>` | `720p`, `1080p`, `4k` | `720p` |
| `--duration <seconds>` | `4`, `6`, or `8` | Model default |
| `--negative <text>` | Negative prompt | — |
| `--seed <number>` | Seed value | — |
| `--person <mode>` | `allow_all`, `allow_adult`, `dont_allow` | Model default |
| `--model <id>` | Model identifier | `veo-3.1-generate-preview` |

## Output

JSON to stdout:

```json
{"ok": true, "data": {"file": "output.mp4", "model": "veo-3.1-generate-preview", "aspect_ratio": "16:9", "resolution": "720p", "duration": "8", "elapsed": "1m2s"}}
```

Progress messages go to stderr.

## How it works

Uses the `@google/genai` SDK's `generateVideos` method, which is an asynchronous long-running operation. The CLI polls every 10 seconds until the video is ready, then downloads it to disk. Generation typically takes 11 seconds to 6 minutes.

All videos include a SynthID watermark. Generated videos are stored on Google's servers for 2 days before being deleted.
