---
title: "Card Duel — Multiplayer Card Game"
summary: "Turn-based multiplayer card game with server-validated draws and mobile deployment on iOS and Android."
date: "2026-06-01"
draft: false
tags:
  - Unity
  - Mobile
  - Multiplayer
  - Networking
  - C#
image: "/images/projects/unity-mobile-multiplayer.svg"
demoUrl: ""
repoUrl: ""
---

## Header Snapshot

- **Role:** Gameplay & Networking Programmer
- **Engine / Language:** Unity, C#
- **Platforms:** iOS, Android
- **Team Size:** 4
- **Development Time:** 6 months

## Systems Architected

- Turn-based state machine driving match flow and win conditions
- Server-authoritative hand and draw pile management to prevent client-side cheating
- Custom RPC layer for low-latency player actions
- Mobile-optimized UI with adaptive layouts for phone and tablet

## Engineering Challenge

Card draws needed to be unpredictable to players but fully deterministic and verifiable
on the server to prevent manipulation. Solved by moving all randomness and deck state to
the server, with clients only receiving the result of each action — eliminating an entire
class of client-side exploits while keeping perceived latency low through optimistic UI
updates.

## Code & Artifacts

- [GitHub Repository](#)
- [Architecture Diagram](#)
