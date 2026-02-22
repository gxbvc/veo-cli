# veo-cli

CLI for generating videos with Google Veo 3.1 (text-to-video, image-to-video, interpolation, reference images, extension).

## Commands

```bash
# Text-to-video
veo-cli generate "a cinematic shot of a lion"                          # Basic generation
veo-cli generate "a lion" -o lion.mp4                                  # Specify output path
veo-cli generate "a lion" --aspect 9:16                                # Portrait video
veo-cli generate "a lion" --resolution 1080p --duration 8              # Higher res (requires 8s)
veo-cli generate "a lion" --negative "cartoon, low quality"            # Negative prompt
veo-cli generate "a lion" --seed 42                                    # Seed for determinism
veo-cli generate "a lion" --model veo-3.1-fast-generate-preview        # Use fast model

# Image-to-video (starting frame)
veo-cli generate "cat wakes up" --image cat.png                        # Animate from image

# Interpolation (first + last frame, Veo 3.1 only)
veo-cli generate "cat jumps" --image start.png --last-frame end.png    # Fill between frames

# Reference images (preserve subject, Veo 3.1 only, max 3)
veo-cli generate "woman walks" --ref dress.png --ref face.png          # Subject preservation

# Extend a Veo-generated video (~7s, Veo 3.1 only)
veo-cli extend "the butterfly lands" --video butterfly.mp4             # Extend existing video
```

## Models

| Model | Audio | Resolution | Duration |
|-------|-------|-----------|----------|
| `veo-3.1-generate-preview` (default) | ✔️ | 720p, 1080p, 4k | 4, 6, 8s |
| `veo-3.1-fast-generate-preview` | ✔️ | 720p, 1080p, 4k | 4, 6, 8s |
| `veo-3` | ✔️ | 720p, 1080p | 8s only |
| `veo-3-fast` | ✔️ | 720p, 1080p | 8s only |
| `veo-2` | ❌ | 720p | 5, 6, 8s |

## Parameters

| Flag | Values | Notes |
|------|--------|-------|
| `--aspect` | `16:9` (default), `9:16` | |
| `--resolution` | `720p` (default), `1080p`, `4k` | 1080p/4k require 8s duration |
| `--duration` | `4`, `6`, `8` | Must be `8` for 1080p/4k/extension/ref images |
| `--negative` | text | Things to avoid |
| `--seed` | number | Slightly improves determinism |
| `--person` | `allow_all`, `allow_adult`, `dont_allow` | Varies by mode |

## Output Format

```json
{"ok": true, "data": {"file": "output.mp4", "model": "veo-3.1-generate-preview", "aspect_ratio": "16:9", "resolution": "720p", "duration": "8", "elapsed": "1m2s"}}
{"ok": false, "error": "message"}
```

Video file is written to disk. JSON metadata goes to stdout. Progress goes to stderr.

## Notes

- Generation takes 11s–6min (async polling)
- Videos include audio natively (Veo 3+)
- Generated videos stored on server for 2 days
- Extension only works on Veo-generated videos, 720p only

Requires `.env` with `GEMINI_API_KEY`. Get one at https://aistudio.google.com/apikey
