---
title: "Spades Relax"
summary: "Mobile multiplayer Spades for iOS and Android at GameDuell. I worked on core gameplay, round flow and results, tutorials, effects and game feel, plus features spanning front end and backend."
date: "2026-09-30"
draft: false
tags:
  - Unity
  - C#
  - Mobile
  - Multiplayer
  - Professional Project
image: "/images/projects/spades-relax/icon.png"
demoUrl: "https://play.google.com/store/apps/details?id=com.gameduell.spades.relax.classic.card.game&hl=gsw"
---

- **Project Type:** Professional project at GameDuell
- **Platforms:** iOS, Android
- **My Role:** Unity Game Programmer. I owned each of the features described below end to end.
- **Team:** 3 developers, 2 2D artists, 1 product owner, 1 product manager, 1 UX designer, 1 game designer
- **Tech:** Unity, C#, Zenject (DI), MVP, DOTween, Spine, shaders, automated integration tests
- **Availability:** Currently available in the US only

**Spades Relax** is a live multiplayer Spades game where you play the classic trick-taking card game against real players, in solo or team mode. It is live on both stores:

- [Google Play](https://play.google.com/store/apps/details?id=com.gameduell.spades.relax.classic.card.game&hl=gsw)
- [App Store](https://apps.apple.com/us/app/spades-relax-classic-card-game/id6755433257?l=fr-FR)

<iframe
  src="https://www.youtube.com/embed/gpRkx39kAdE"
  title="Spades Relax — Trailer"
  style="width: 100%; aspect-ratio: 16 / 9; border: 0; border-radius: 0.5rem;"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowfullscreen
  loading="lazy"
></iframe>

![Spades Relax match table](/images/projects/spades-relax/screenshot-1.jpg)

## What I Worked On

I was one of three developers on a small cross-functional team and worked on core gameplay across the whole match lifecycle, from setup through round end and round result. I also built the tutorials and first-time user experience, VFX and SFX, and polished game feel and animations. The features below are the ones I owned completely, from design of the technical solution through to shipping.

- **Celebration System.** Designed and built an event-driven system that detects gameplay milestones in real time (successful and failed bids, special achievements) and triggers visual and audio feedback for the right player among four competing seats in a team-based format.
  - **Precise timing:** Semantic outcomes are derived from raw score and trick state at exact trigger points, such as the moment a winning trick completes.
  - **Decoupled architecture:** A publish/subscribe messaging pattern separates "when to celebrate" (game logic) from "how to celebrate" (per-seat visual and audio presentation). New celebration types can be added without touching the detection logic, and the game-rule logic stays testable and independent from presentation.
  - **Conflict-safe UI:** Guards prevent overlapping animations when multiple celebration conditions are true at the same time.
- **Skippable Round Result Popup (front end and backend).** After every round, all clients see a synced round result popup (scores, bids, bags) before the next round can start. I replaced the single shared, fixed-length countdown with per-player readiness confirmation, so players who are ready don't wait on anyone else. This needed changes in both the Unity client and the backend.
  - **Client:** The continue button is active immediately, without waiting for animations or the timer. Tapping it publishes a message on the local message bus, switches the button to a "waiting for players" state, and is translated by the gameplay state chart into a generic "I'm ready" network message.
  - **Backend:** The round result is handled as a simultaneous state, where every player is expected to respond instead of one active player. Each player gets an individual timeout (separate values for humans, games with bots and AI players). The round advances once every player has either confirmed or timed out, so fast players aren't held up and AFK players can't block the game.
  - **Authoritative countdown:** The server sends each player's own timeout timestamp, and the client ticks the countdown down locally, so the UI always matches the server's deadline.
  - **Bots:** Bots take part in the same synchronization contract as humans, with a very short timeout and no explicit confirm message, so there is no special-casing in gameplay logic, only in timeout configuration.
  - **Architecture:**  Implemented a simultaneous-state for the Spades backend state machine that would wait for the timout or all players confirmation before advancing.
  - **Instant Play Next:** A feature-flagged option goes further. Confirming the round result can skip the match-end screen entirely and go straight to matchmaking for the next match.
- **Guided Effects Sequencer.** Designed and built a designer-facing system that choreographs subtle shader-driven effects (glows and pulses on buttons and table tiles) to guide the player's eye to the right element at the right time on the home screen. Timing lives in data instead of in each widget.
  - **Designer-editable choreography:** Sequences are ScriptableObject assets. Designers define which effect groups play, start delays, per-item stagger, sort order (such as top-to-bottom), pauses between cycles and initial state in the Inspector, and re-tune timing without code changes or a rebuild. I also built a custom Unity editor window that gives designers an overview of all effects, so they can keep track of them as the number grows.
  - **Self-registering effects:** Effects live across many prefabs and appear and disappear at runtime (screen transitions, pooling, feature flags), so the sequencer holds no hard references. Each effect registers itself with an injected sequencer service on enable and unregisters on disable or destroy, and groups are matched by a string ID. Effects placed in any prefab work automatically, and several effect implementations can act as one logical group.
  - **Single timing authority:** One sequencer drives all playback. I used DOTween Sequences to construct and loop the effects, with one looping Sequence per group (start delay, group cycle, pause, repeat), instead of per-effect coroutines or Update polling. Groups run on independent cadences and can be enabled or disabled individually, for example muted while a modal is open, without disturbing other groups. The whole system is easy to reset on scene changes.
  - **Tween-driven shader time:** Shader effects don't run on engine time. A tween drives the shader's time property, which gives complete control over the shader time cycle. An effect can be paused mid-cycle and resumed from exactly the same phase, or can be reset to its starting point.
- **Dynamic Round Result Screen.** Built the round result screen that shows game statistics and gives players a full history of the match so far. One presenter serves two structurally different modes, 2 teams of 2 and 4 individual players.
  - **One UI, two data shapes:** The server stores every stat per player, but the screen sometimes needs it per team (summed pairs) and sometimes per player, using separate table prefabs. I centralised the mode difference in one dispatch step, so row population stays mode-agnostic, nothing is duplicated per mode and a third mode would be easy to add.
  - **Stable local-player-first order:** The server sends data by absolute seat index, but the UI presents the local player and their teammate first. I build the display order once per round and index every stat row through it, which keeps all columns consistent and avoids mismatched-column bugs.
  - **Growing round history:** Rows for every previous round are instantiated dynamically, from the current round back to round 1, through the DI container so each row gets its dependencies injected. Data collection is kept separate from prefab construction.
  - **Defensive against desync:** An early-out guard against a mismatch between the server's and the client's round index fails safe instead of throwing, so a desync can't soft-lock the popup. State is reset both when the popup opens and when it closes, so no stale data carries over between rounds.
- **Auto-Chat System.** Designed and built an event-driven system that makes players feel more socially present by autonomously sending greetings, contextual reactions and answers to the chat, without feeling scripted or spammy. It uses an abstract base service shared across the studio's card games and a game-specific subclass, wired through Zenject.
  - **Reusable architecture:** The shared base owns the common plumbing (welcome messages, message bus subscriptions, cooldown bookkeeping) and exposes a few override points for settings and welcome messages. Each game adds its own rules on top, such as trick-win reactions and bid-based triggers, without duplicating timer or bus code.
  - **Anti-spam throttling:** Several layers prevent chat spam. There is a per-player cooldown while a message is in flight, turn thresholds and caps on reactions per round that reset each round.
  - **Contextual reactions:** Reactions depend on real game state instead of random triggers. A players only react to a trick they actually wanted, based on its bid and tricks taken.
  - **Decoupled from gameplay:** Gameplay commands only publish a domain event on the internal message bus. The chat service subscribes and independently decides eligibility, timing and content, which keeps gameplay code clean and testable.
  - **Human timing and lifecycle:** Randomised delays via DOTween simulate reaction time, with the tween lifecycle managed explicitly to avoid leaked callbacks. The service resets cleanly between rounds and matches, and it stays silent during the first-time user experience so onboarding isn't distracted.

## Screenshots

![Spades Broken celebration effect](/images/projects/spades-relax/screenshot-2.jpg)

![Round result screen](/images/projects/spades-relax/screenshot-4.jpg)

![Table selection and leagues](/images/projects/spades-relax/screenshot-3.jpg)

*Store screenshots and trailer © GameDuell GmbH.*
