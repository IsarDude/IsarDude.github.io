---
title: "Native C++ Inventory & Interaction System"
summary: "Reusable Unreal Engine C++ inventory and interaction framework exposed to Blueprints for designer iteration."
date: "2026-04-10"
draft: false
tags:
  - Unreal Engine
  - C++
  - PC
  - Gameplay Systems
image: "/images/projects/unreal-cpp-systems.svg"
demoUrl: ""
repoUrl: ""
---

## Header Snapshot

- **Role:** Gameplay Systems Programmer
- **Engine / Language:** Unreal Engine 5, C++
- **Platforms:** PC (Windows)
- **Team Size:** 3
- **Development Time:** 4 months

## Systems Architected

- Custom `UActorComponent`-based inventory with stack management and item serialization
- Interaction system built on native `AActor` interfaces, exposed to Blueprints via `UFUNCTION(BlueprintCallable)`
- Memory-conscious item data using data assets instead of per-instance duplication
- Profiled and optimized using Unreal Insights to remove per-tick allocations

## Engineering Challenge

Designers needed to iterate on item behavior without touching C++, while the core
inventory logic had to stay fast and memory-safe. Solved by keeping all performance-critical
logic (storage, stacking, serialization) in native C++ classes, and exposing narrow,
well-defined Blueprint hooks for item-specific behavior — giving designers flexibility
without risking the integrity of the underlying system.

## Code & Artifacts

- [GitHub Repository](#)
- [Class Architecture (UML)](#)
