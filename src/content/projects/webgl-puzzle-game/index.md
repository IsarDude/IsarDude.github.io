---
title: "Drift — WebGL Puzzle Game"
summary: "Browser-based Unity puzzle game optimized for fast load times and low memory footprint."
date: "2026-02-20"
draft: false
tags:
  - Unity
  - WebGL
  - Optimization
  - C#
image: "/images/projects/webgl-unity.svg"
demoUrl: ""
repoUrl: ""
---

## Header Snapshot

- **Role:** Gameplay & Performance Programmer
- **Engine / Language:** Unity, C#
- **Platforms:** WebGL (Browser)
- **Team Size:** 2
- **Development Time:** 2 months

## Systems Architected

- Addressables-based asset streaming to cut initial load size
- Manual garbage collection scheduling to avoid frame hitches on low-end browsers
- Custom build pipeline for WebGL compression and texture size budgets

## Engineering Challenge

Browser runtimes have tight memory ceilings and no control over garbage collection
timing, which caused visible frame hitches during gameplay. Solved by batching object
allocations, pooling short-lived objects, and explicitly triggering incremental GC during
low-activity moments (e.g. level transitions) instead of letting Unity's GC run
unpredictably mid-gameplay.

## Code & Artifacts

- [Play in Browser](#)
- [GitHub Repository](#)
