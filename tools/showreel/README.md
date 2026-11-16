# Showreel

Turns raw gameplay footage into short portfolio showreels: title card, cut clips with captions, transitions, music and an outro. Built on [Remotion](https://www.remotion.dev) (React → MP4). ffmpeg comes bundled via `ffmpeg-static`, so nothing else needs installing.

Each reel is one JSON file in `reels/`. Claude writes and edits these files. You can also edit them by hand.

## Setup

```bash
npm install
```

## Workflow

1. **Add footage.** Put a project's clips (and any screenshots) in `public/footage/<project>/` (subfolders are fine; analysis scans them too), and music in `public/music/`. Both folders are git-ignored.
2. **Analyse.** `npm run analyze -- <project>` writes `analysis/<project>/report.md` (lengths, resolutions, detected scene cuts, busiest moments) plus contact sheets with a timestamp burned into every frame. Claude reads these to pick in/out points. To look closer at part of one recording: `npm run analyze -- <project> --only "<part of file name>" --from 120 --to 150 --every 0.5` writes finer sheets to `analysis/<project>/zoom/`.
3. **Write the reel.** Create `reels/<project>.json` (see below), or ask Claude: *"make a 45s reel for krazy-karts from the analysis, captions from the project page"*.
4. **Review cheaply.** `npm run render -- <project> --stills` renders one frame per scene to `out/<project>-stills/`.
5. **Render.** `npm run render -- <project>` writes:
   - `out/<project>.mp4`: full 1080p reel
   - `out/<project>-loop.mp4`: 720p, muted, clips only, for autoplay on the portfolio site

Other flags: `--full` / `--loop` / `--stills` render only that output, and `--draft` renders at half resolution for checking cuts. `npm run studio` opens Remotion Studio, a live preview with a timeline. It shows `reels/example.json`, which you can edit there or replace with another reel's contents.

The render script checks the reel first: missing files, and `to` times past the end of a clip, are reported before any rendering starts. It then cuts, crops and scales each clip's segment with ffmpeg into `.cache/<project>/`, so Remotion works from a few MB of pre-cut clips instead of copying hours of raw footage. Unchanged clips are reused on the next render. You can delete `.cache/` at any time.

## Reel file

Paths are relative to `public/`. Times are in seconds.

```jsonc
{
  "title": "Krazy Karts",
  "subtitle": "Real-time multiplayer racing",          // optional
  "role": "Gameplay & Network Programmer",            // optional, shown in the accent colour
  "tech": ["Unreal Engine 5", "C++"],                 // optional, shown as chips
  "accent": "#38bdf8",                                // default #38bdf8
  "fps": 30, "width": 1920, "height": 1080,           // defaults; 1080x1920 gives a vertical reel
  "introSeconds": 3,
  "introAt": 4,                                       // optional; play the title card after this many clips (cold open)
  "music": "music/track.mp3",                         // optional; fades in and out, loops if short
  "musicVolume": 0.8, "musicStart": 12.5,             // musicStart skips into the track
  "musicLoop": false,                                 // optional; let the track end instead of looping, e.g. a final hit timed to the outro
  "transition": "fade",                               // fade | slide | wipe | cut
  "transitionSeconds": 0.4,
  "crop": { "x": 173, "y": 147, "width": 1574, "height": 885 },  // optional, source pixels; e.g. cut browser bars
  "clips": [
    { "src": "footage/krazy-karts/race.mp4", "from": 12.5, "to": 16, "caption": "Client-side prediction" },
    { "src": "footage/krazy-karts/crash.mp4", "from": 3, "to": 5, "speed": 0.5 },        // slow motion
    { "src": "footage/krazy-karts/menu.mp4", "from": 0, "to": 2, "volume": 1 },          // keep game audio
    { "src": "footage/krazy-karts/hud.mp4", "from": 8, "to": 11, "crop": { "x": 400, "y": 200, "width": 960, "height": 540 } },  // zoom in
    { "src": "footage/krazy-karts/finish.mp4", "from": 30, "to": 33, "transition": "fade" },  // transition into this clip
    { "src": "footage/krazy-karts/ab.mp4", "from": 2, "to": 7, "fit": "contain", "labels": ["Prediction OFF", "Prediction ON"] },  // side-by-side capture, letterboxed, one label per pane
    { "src": "footage/krazy-karts/screenshot.png", "duration": 2.5 }                     // still, slow push-in; shrinks above its caption if it has one
  ],
  "outro": { "name": "Lukas Fritsch", "lines": ["Gameplay & Systems Programmer"], "url": "github.com/IsarDude", "transition": "fade" }
}
```

**Overlays.** A clip can carry one top-right panel, with times in source seconds (the same timeline as `from`/`to`):

```jsonc
// Console panel that prints each recorded line when the video reaches its time
"log": { "title": "FGameplayMessageSubsystem broadcasts (recorded)", "lines": [{ "at": 16.34, "text": "Level.Request.Load  Level.Map.SkiFi1" }] }

// Live spring-damper recoil curve, simulated from the weapon's real values; shots are impulse times
"springGraph": { "label": "SpringRecoilBehaviour · DA_Shotgun", "stiffness": 12, "damping": 8, "strength": 30, "kickRatio": 0.1, "shots": [193.633, 194.5] }
```

Only put lines in a `log` that were actually recorded for that clip. `reels/super-shooter.json` uses both.

Game audio is muted when the reel has music, and kept when it doesn't. A clip's `volume` overrides this. A crop is scaled up to fill the frame, so keep it close to 16:9 (or the reel's own aspect ratio).

**Cutting on the beat.** At 30 fps and 90 BPM a beat is exactly 20 frames, so clip lengths in whole beats keep every hard cut on the beat. A fade overlaps its two clips by `transitionSeconds`, so lengthen each neighbour by half of that to keep the fade's midpoint on the beat. Use `musicStart` to line a drop up with the first cut. `reels/webgl-card-games.json` is a worked example.

**Putting a reel on the site.** The full render is too big for git. Re-encode it into `public/videos/<page-slug>/` and grab a poster frame, then embed it in the project's markdown with a `<video>` tag (see the Super Shooter page):

```bash
ffmpeg -i out/<project>.mp4 -c:v libx264 -preset slow -crf 25 -pix_fmt yuv420p -c:a aac -b:a 160k -movflags +faststart ../../public/videos/<page-slug>/showreel.mp4
```

```bash
ffmpeg -ss <title-card-time> -i out/<project>.mp4 -frames:v 1 -q:v 3 ../../public/videos/<page-slug>/poster.jpg
```

## Tips

- 30–60 s per project. Lead with the best shot, and keep most clips to 1–3 s.
- Record clean: 60 fps, no debug overlays, same resolution as the export.
- Use music you have the rights to: royalty-free libraries, or the game's own soundtrack if you're allowed to.
- Remotion is free for individuals and companies of up to 3 people. Larger companies need a [company licence](https://www.remotion.dev/license).

`reels/example.json` uses generated test clips in `public/footage/example/` so the pipeline can be checked without real footage.
