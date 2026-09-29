---
title: "Krazy Karts — Real-Time Multiplayer Racing (Proof of Concept)"
summary: "Real-time multiplayer racing proof of concept in Unreal Engine 5 with custom replication, client-side prediction, server reconciliation, and spline-based remote-proxy interpolation."
date: "2026-05-20"
draft: false
tags:
  - Unreal Engine
  - C++
  - PC
  - Multiplayer
  - Networking
  - Personal Project
image: "/images/projects/krazy-karts.svg"
---

- **Project Type:** Personal project (not professional work)
- **Engine / Language:** Unreal Engine 5.7, C++ (with data-driven Blueprint content)
- **Target Platform:** PC (Windows)

## Systems Architected

- **Vehicle Movement Component** — force-based driving model computing throttle, air resistance, and rolling resistance to derive acceleration and torque-based steering, run identically on client and server for deterministic replay (`Source/KrazyKarts/GoKartMovementComponent.cpp`).
- **Custom Replication Component** — replaced Unreal's default movement replication (`SetReplicateMovement(false)`) with a hand-rolled `UActorComponent` that replicates authoritative server state and drives per-role behavior (authority / autonomous proxy / simulated proxy) (`Source/KrazyKarts/Vehicle/GoKartReplicationComponent.cpp`).
- **Client-Side Prediction & Server Reconciliation** — client simulates moves locally and immediately, queues them as unacknowledged, and replays any not yet acknowledged by the server once corrected state arrives via `OnRep_ServerState`, eliminating input latency without desyncing from the server.
- **Remote Proxy Interpolation** — Hermite cubic spline interpolation (position + velocity + Slerp rotation) between periodic server snapshots for simulated proxies, producing smooth motion for other players' vehicles despite low-frequency network updates.

## Engineering Challenge

**Problem:** Vehicles for remote clients (simulated proxies) only receive position/velocity updates a few times per second (`SetNetUpdateFrequency`), so naively snapping to each new server transform produced visible jitter and teleporting, while the locally-controlled vehicle needed to feel instantly responsive to input despite round-trip latency to the authoritative server.

**Solution:** Split the problem by network role. For the locally-controlled kart, I implemented client-side prediction: input is simulated immediately and stored in an unacknowledged move queue; when the server's authoritative state replicates back, the client resets to that state and replays only the moves the server hasn't yet acknowledged, correcting drift without any visible snap. For remote vehicles, instead of interpolating linearly between two raw positions, I built a Hermite cubic spline from the last known and newly-received transform/velocity pairs, so both position and velocity stay continuous across the interpolation window — this removed the jitter that linear lerp introduced whenever velocity changed between snapshots.
