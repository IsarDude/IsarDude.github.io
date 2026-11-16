---
title: "Canasta - Fun & Friends"
summary: "Mobile multiplayer Canasta for iOS and Android at GameDuell. I joined for the polishing phase and worked on round result animations, player statistics in Firebase, sound effects and integration tests."
date: "2026-09-29"
draft: false
tags:
  - Unity
  - C#
  - Mobile
  - Multiplayer
  - Professional Project
image: "/images/projects/canasta-treff/icon.png"
demoUrl: "https://play.google.com/store/apps/details?id=com.gameduell.canasta.treff.kartenspiel&hl=gsw"
---

- **Project Type:** Professional project at GameDuell
- **Platforms:** iOS, Android
- **My Role:** Unity Game Programmer. I joined the team late, for the polishing stage.
- **Team:** 3 developers, 2 2D artists, 1 product owner, 1 product manager, 1 UX designer, 1 game designer
- **Tech:** Unity, C#, Zenject (DI), Firebase, ScriptableObjects, automated integration tests

Canasta - Fun & Friends is a free live multiplayer Canasta game. Players compete against real opponents, climb through leagues and work their way up to higher tables. It is live on both stores:

- [Google Play](https://play.google.com/store/apps/details?id=com.gameduell.canasta.treff.kartenspiel&hl=gsw)
- [App Store](https://apps.apple.com/ch/app/canasta-fun-friends/id6736938797?l=en-GB)

<iframe
  src="https://www.youtube.com/embed/WU7rs2m-HA0"
  title="Canasta - Fun & Friends trailer"
  style="width: 100%; aspect-ratio: 16 / 9; border: 0; border-radius: 0.5rem;"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowfullscreen
  loading="lazy"
></iframe>

![Canasta - Fun & Friends match table](/images/projects/canasta-treff/screenshot-1.jpg)

## What I worked on

My work covered the round result screen, player statistics, audio and automated tests. The code lives in a large monorepo with shared frontend and backend code and functionality that several games share.

- **Round result screen polish.** Added event-driven animation triggers to the round result screen and the logic that picks the right animation state for each moment, with separate animations and states for winning and losing.
- **Player statistics and profile.** Implemented tracking for game-specific player statistics such as piles frozen, Canastas achieved and highest win. I used and extended the existing tracking framework, saved the values in Firebase, and built the data flow that brings the statistics into the player profile UI.
- **Sound effects integration.** Extended the studio's SFX framework and adjusted game-wide import options. ScriptableObjects reference the sound files, and gameplay code calls the SFX service, injected through Zenject, at the moments a sound should play.
- **Integration tests.** Wrote readable integration tests with an internal testing tool, which I extended where needed. The tests play through the first two games and cover the main user flows. Like a real player, they only touch objects that are visible on screen, and they catch game-breaking bugs early.

## Screenshots

![Selecting cards to play](/images/projects/canasta-treff/screenshot-2.jpg)

![Match end with winner, XP and rewards](/images/projects/canasta-treff/screenshot-5.jpg)

![League leaderboard](/images/projects/canasta-treff/screenshot-3.jpg)

![Table selection with progression](/images/projects/canasta-treff/screenshot-4.jpg)

*Store screenshots and trailer © GameDuell GmbH.*
