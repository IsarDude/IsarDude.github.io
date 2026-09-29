---
title: "Super Shooter — Third-Person Shooter Vertical Slice"
summary: "Third-person shooter vertical slice in Unreal Engine 5 with a data-driven weapon framework, real-time projectile trajectory preview, perception-driven AI, and message-decoupled MVVM UI."
date: "2026-08-15"
draft: false
tags:
  - Unreal Engine
  - C++
  - PC
  - Gameplay Systems
  - AI
  - Personal Project
image: "/images/projects/super-shooter.svg"
---

- **Project Type:** Personal project (not professional work)
- **Engine / Language:** Unreal Engine 5.7, C++ (with data-driven Blueprint content)
- **Target Platform:** PC (Windows)

## Systems Architected

- **Modular Weapon Framework.** A strategy-pattern architecture (`UFiringBehaviour`, `USpreadBehaviour`, `URecoilBehaviour`, `UAimBehaviour`) is instantiated per-weapon from a `UGunDataAsset`, so a new gun — hitscan or projectile, automatic or semi-auto, tight or spread, snappy or floaty recoil — can be assembled entirely from data, with zero new C++. Recoil runs on a mass-spring-damper model (`SpringRecoilBehaviour`) rather than fixed curves, so it settles naturally instead of snapping back.
- **Real-Time Projectile Trajectory Preview.** For arcing weapons, `ProjectileTrajectorySolver` runs a collision-aware physics simulation every frame while aiming, and `ProjectileArcRenderer` rebuilds a tapering, fading spline-mesh tube from the resulting path — an accurate, live "will this land here" preview instead of a static guideline.
- **Perception-Driven Combat AI.** `AShooterAiController` drives enemies through Unreal's `AIPerceptionComponent`/sight-sense stack; a custom Behavior Tree task (`UBTTaskNode_ShootAtPlayer`) reads live target-acquisition state to decide when an enemy may fire, so combat stays reactive to what the AI can actually see rather than to raw distance checks.
- **Tag-Driven, Message-Decoupled UI (MVVM).** `UUiServiceSubsystem` pushes CommonUI widgets onto menu/HUD stacks purely from `FGameplayTag` lookups against a `UUICatalog`, triggered by `FGameplayMessageSubsystem` broadcasts (health changes, player death) rather than direct references — gameplay code never touches a widget class, and ViewModels (`HealthBarViewModel`, `TimerViewModel`) are the only thing that does.
- **Async Level Streaming Service.** `ULevelLoaderSubsystem` listens for tagged "load level" messages, resolves them through a `ULevelRegistryDataAsset` lookup table, and streams the target map via `FStreamableManager` on a soft object path, keeping level references entirely data-driven.

## Engineering Challenge

**Problem:** In a third-person shooter, the weapon's muzzle is offset from the camera (over-the-shoulder framing). Tracing purely from the muzzle makes shots drift from where the crosshair points — you can be dead-centered on a target and still miss. Tracing purely from the camera fixes accuracy but lets the gun "shoot through" geometry the camera can see past but the muzzle physically cannot, and puts impact VFX at a point the barrel never had line of sight to.

**Solution:** `HitscanFiringBehaviour::ShootPallet` reconciles two traces per shot instead of trusting either alone:

```cpp
// 1. Trace from the camera along the look direction — this is what the player intends to hit.
bool IsHitViewpointTrace = GetWorld()->LineTraceSingleByChannel(
    HitResultViewpoint, ViewpointRay.StartPoint, EndLocationViewpointTrace,
    ECC_GameTraceChannel1, CollisionParameters);

// 2. Trace from the physical muzzle toward that same point — validates the barrel
//    actually has line of sight to it, so it can't fire through what it can't see past.
bool IsHitWeaponTrace = GetWorld()->LineTraceSingleByChannel(
    HitResultWeapon, WeaponRay.StartPoint, EndLocationWeaponTrace,
    ECC_GameTraceChannel1, CollisionParameters);

if (IsHitWeaponTrace)
{
    PlayImpactEffects(GunData, HitResultWeapon);       // FX always grounded at the barrel
    if (IsHitViewpointTrace)
    {
        TryApplyHit(InstigatorActor, InstigatorController, GunData,
                    HitResultViewpoint, HitResultWeapon); // damage only if both traces agree
    }
}
```

Damage only applies when the camera trace and the muzzle trace agree on the same hit actor, while impact effects always spawn at the muzzle-trace point — the crosshair stays the source of truth for aim, the barrel stays the source of truth for what's physically reachable, and neither can be exploited to shoot through walls or feel inaccurate. The same path drives shotgun-style multi-pellet spread by looping the reconciled trace pair per pellet.
