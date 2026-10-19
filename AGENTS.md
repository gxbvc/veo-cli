# veo-cli

CLI for generating videos with Google Gemini Omni Flash (`gemini-omni-1.1-flash`; text-to-video, image-to-video, interpolation, reference images, extension).

## Commands

```bash
# Text-to-video
veo-cli generate "a cinematic shot of a lion"                          # Basic generation
veo-cli generate "a lion" -o lion.mp4                                  # Specify output path
veo-cli generate "a lion" --aspect 9:16                                # Portrait video
veo-cli generate "a lion" --resolution 1080p --duration 8              # Higher res (requires 8s)
veo-cli generate "a lion" --negative "cartoon, low quality"            # Things to avoid (appended to prompt)
veo-cli generate "a lion" --model gemini-omni-1.1-flash                # Explicit model (same as default)

# Image-to-video (starting frame)
veo-cli generate "cat wakes up" --image cat.png                        # Animate from image

# Interpolation (first + last frame)
veo-cli generate "cat jumps" --image start.png --last-frame end.png    # Fill between frames

# Reference images (preserve subject, max 3)
veo-cli generate "woman walks" --ref dress.png --ref face.png          # Subject preservation

# Extend a video (3-10s continuation)
veo-cli extend "the butterfly lands" --video butterfly.mp4             # Extend existing video
```

## Models

| Model | Audio | Resolution | Duration |
|-------|-------|-----------|----------|
| `gemini-omni-1.1-flash` (default) | ✔️ | 360p, 720p, 1080p, 4k | model-chosen |
| `veo-3.1-generate-preview` (deprecated Oct 22, 2026) | ✔️ | 720p, 1080p, 4k | 4, 6, 8s |
| `veo-3.1-fast-generate-preview` (deprecated Oct 22, 2026) | ✔️ | 720p, 1080p, 4k | 4, 6, 8s |

## Parameters

| Flag | Values | Notes |
|------|--------|-------|
| `--aspect` | `16:9` (default), `9:16` | |
| `--resolution` | `720p` (default), `360p`, `1080p`, `4k` | |
| `--duration` | `4`, `6`, `8` | Not supported by `gemini-omni-1.1-flash`; ignored |
| `--negative` | text | Things to avoid; appended to the prompt |
| `--seed` | number | Not supported by `gemini-omni-1.1-flash`; ignored |
| `--person` | `allow_all`, `allow_adult`, `dont_allow` | Not supported by `gemini-omni-1.1-flash`; ignored |

## Output Format

```json
{"ok": true, "data": {"file": "output.mp4", "model": "gemini-omni-1.1-flash", "aspect_ratio": "16:9", "resolution": "720p", "duration": "8", "elapsed": "1m2s"}}
{"ok": false, "error": "message"}
```

Video file is written to disk. JSON metadata goes to stdout. Progress goes to stderr.

## Notes

- The call blocks until the video is ready (time depends on duration, resolution, and API load)
- Videos include audio natively
- Videos include a SynthID watermark

Requires `.env` with `GEMINI_API_KEY`. Get one at https://aistudio.google.com/apikey
