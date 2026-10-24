---
title: "Super Shooter — Third-Person Shooter Vertical Slice"
summary: "Third-person team-deathmatch shooter vertical slice in Unreal Engine 5 with a data-driven weapon framework, perception-driven AI, and a message-decoupled MVVM UI system."
date: "2026-10-24"
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

- **Modular Weapon Framework.** A strategy-pattern architecture instantiated per weapon from a `UGunDataAsset`. A weapon is composed of interchangeable behaviours. `FiringBehaviour`, `SpreadBehaviour`, `RecoilBehaviour` and `AimBehaviour` are created by a `UWeaponComponent` when a gun is equipped. A new gun (hitscan or projectile, automatic or semi-auto, tight or spread, snappy or floaty recoil, with or without an aiming aid) is assembled entirely from interchangeable components, each driving one aspect of the weapon's behaviour.
- **Perception-Driven Combat AI.** `AShooterAiController` drives bots through Unreal's sight sense and a Behavior Tree (patrol, strafe-and-shoot, flee, investigate the last known position). Target acquisition is team-aware (`IsHostile`), reacts to damage from unseen attackers, and releases the trigger the moment line of sight is lost, so combat stays reactive to what the AI can actually see rather than to raw distance checks.
- **Tag-Driven, Message-Decoupled UI (MVVM).** `UUiServiceSubsystem` pushes CommonUI widgets onto menu/HUD stacks purely from Tag lookups against a `UUICatalog` data asset, triggered by `FGameplayMessageSubsystem` broadcasts rather than direct references. Gameplay code never touches a widget class; ViewModels (`MainMenuViewModel`, `EndMatchViewModel`, `ScoreViewModel`, `TimerViewModel`) are the only bridge between the two. Game model changes, such as score updates, are broadcast as gameplay messages, so the HUD and the end-of-match overlay react to them without the game model ever knowing a widget exists.
- **Async Level Streaming Service.** `ULevelLoaderSubsystem` listens for tagged "load level" messages, resolves them through a `ULevelRegistryDataAsset` lookup table, and streams the target map via `FStreamableManager` on a soft object path, keeping level references entirely data-driven.


## Engineering Challenges

### 1. One weapon component, any gun: the strategy pattern in practice

**Problem:** A shooter needs many guns that differ along several independent axes — hitscan vs. projectile, automatic vs. semi-auto, tight vs. spread, snappy vs. floaty recoil, with or without an aiming aid. Subclassing `AGun` per weapon (`AutomaticHitscanSpreadGun`, `SemiAutoProjectileGun`, …) explodes combinatorially, duplicates logic, and forces a C++ change and recompile for every new gun.

**Solution:** Each axis becomes its own *strategy* behind a small abstract interface, and the gun is reduced to a data asset that names which strategy to use for each one:

```cpp
UCLASS(Abstract)
class UFiringBehaviour : public UObject
{
public:
	virtual void Execute(FAimRay& ViewpointRay, FAimRay& WeaponRay, UWeaponComponent* WeaponComponent,
	                     AActor* InstigatorActor, AController* InstigatorController) {}
};

UCLASS(Abstract)
class USpreadBehaviour : public UObject
{
public:
	virtual void Initialize(const UGunDataAsset* InitialGunData);
	virtual FVector CalculateSpread(FVector BaseDirection) { return BaseDirection; }
	virtual void IncreaseHeat(float HeatPerShot) {}
	virtual void SpreadCoolDownOverTime(float DeltaTime) {}
};

UCLASS(Abstract)
class URecoilBehaviour : public UObject
{
public:
	virtual void Initialize(const UGunDataAsset* CurrentGunData);
	virtual void ApplyImpulse(float Strength) {}
	virtual FRotator GetCurrentRecoil(float DeltaTime) { return FRotator::ZeroRotator; }
};

// AimBehaviour follows the same shape: Execute / Stop / OnShotFired / Initialize / Reset
```

The `UGunDataAsset` holds a `TSubclassOf<>` for each strategy next to the tuning numbers they read (damage, fire rate, spread, spring stiffness, …). Picking a behaviour for a gun is a dropdown in the editor:

```cpp
UPROPERTY(EditDefaultsOnly) TSubclassOf<UFiringBehaviour> FiringBehaviour;
UPROPERTY(EditDefaultsOnly) TSubclassOf<USpreadBehaviour> SpreadBehaviour;
UPROPERTY(EditDefaultsOnly) TSubclassOf<URecoilBehaviour> RecoilBehaviour;
UPROPERTY(EditDefaultsOnly) TSubclassOf<UAimBehaviour>    AimBehaviour;
```

When a gun is equipped, `UWeaponComponent::SetupWeaponBehaviors` is the only place that turns those classes into live strategy objects. Every strategy is optional except firing, and the previous gun's strategies are simply dropped:

```cpp
void UWeaponComponent::SetupWeaponBehaviors(AGun* NewGun)
{
	const UGunDataAsset* GunData = NewGun->GetGunData();

	FiringBehaviour = nullptr; SpreadBehaviour = nullptr;
	RecoilBehaviour = nullptr; AimBehaviour    = nullptr;

	if (GunData->FiringBehaviour)
		FiringBehaviour = NewObject<UFiringBehaviour>(this, GunData->FiringBehaviour);

	if (GunData->SpreadBehaviour)
	{
		SpreadBehaviour = NewObject<USpreadBehaviour>(this, GunData->SpreadBehaviour);
		SpreadBehaviour->Initialize(GunData);
	}

	if (GunData->RecoilBehaviour)
	{
		RecoilBehaviour = NewObject<URecoilBehaviour>(this, GunData->RecoilBehaviour);
		RecoilBehaviour->Initialize(GunData);
	}

	if (GunData->AimBehaviour)
	{
		AimBehaviour = NewObject<UAimBehaviour>(this, GunData->AimBehaviour);
		AimBehaviour->Initialize(this, FiringBehaviour);   // aim aids can inspect the firing strategy
	}
}
```

From then on the component is completely ignorant of what kind of gun it is holding. `Shoot()` just runs whichever strategies exist, and the same code path serves a hitscan rifle and a grenade launcher:

```cpp
void UWeaponComponent::Shoot()
{
	// ...build the camera ray and the muzzle ray...
	FiringBehaviour->Execute(ViewPointAimRay, WeaponAimRay, this, GetOwner(), PlayerController);
	CurrentGun->PlayMuzzleFlash();
	CurrentGun->PlayShotSound();
	ApplyRecoil();                       // RecoilBehaviour->ApplyImpulse(...) if one is assigned
	if (AimBehaviour) AimBehaviour->OnShotFired();
}
```

Two details make the pattern pay off. First, strategies that need to cooperate do it through their interfaces instead of knowing about each other's concrete classes: the projectile preview aim behaviour receives the firing behaviour in `Initialize` and asks it for the launch direction, so the preview can never disagree with the real shot (see challenge 3). Second, the base classes provide safe no-op defaults, so a gun with no spread or no aim aid just leaves that slot empty. The result: a new weapon is a new data asset, and a genuinely new *behaviour* (the spring recoil in challenge 2, for example) is one new class that every existing gun can opt into without being touched.

### 2. Recoil that settles naturally instead of snapping back

**Problem:** Authored recoil curves are rigid: every shot replays the same pattern, rapid fire stacks awkwardly (curves restart or overlap), and the return to rest looks mechanical. Designers also had to author a new curve for every weapon.

**Solution:** `SpringRecoilBehaviour` models the camera kick as a mass-spring-damper. Each shot is just an *impulse* into the system; the spring and damper do the rest, so rapid fire accumulates and decays physically with no special cases. Three tuning values on the `UGunDataAsset` (`Stiffness`, `Damping`, `RecoilStrength`) cover everything from a tight pistol to a heavy launcher. The impulse is split between an instant kick and velocity so a weapon can feel either snappy or floaty, and yaw gets a random sway proportional to the shot:

```cpp
void UUSpringRecoilBehaviour::ApplyImpulse(float Strength)
{
	// Part of the shot is an instant offset ("kick"), the rest becomes spring velocity
	const float PitchVelocityImpulseRatio = 1.f - GunData->RecoilKickToVelocityRation;
	PitchVelocity += Strength * PitchVelocityImpulseRatio;
	CurrentPitch  += Strength * GunData->RecoilKickToVelocityRation;
	YawVelocity   += FMath::RandRange(-Strength * GunData->HorizontalWeaponSwayRatio,
	                                   Strength * GunData->HorizontalWeaponSwayRatio);
}

FRotator UUSpringRecoilBehaviour::GetCurrentRecoil(float DeltaTime)
{
	// Hooke's law with damping, integrated per frame: a = -k*x - c*v
	PitchVelocity += (-GunData->Stiffness * CurrentPitch - GunData->Damping * PitchVelocity) * DeltaTime;
	YawVelocity   += (-GunData->Stiffness * CurrentYaw   - GunData->Damping * YawVelocity)   * DeltaTime;

	CurrentPitch += PitchVelocity * DeltaTime;
	CurrentYaw   += YawVelocity   * DeltaTime;

	return FRotator(CurrentPitch, CurrentYaw, 0.f);
}
```

The second half of the problem is *how* the offset reaches the player's view. If recoil were written as an absolute rotation it would fight the player's mouse input. Instead, `UWeaponComponent::HandleRecoil` feeds only the **frame-to-frame delta** of the spring into the controller's rotation:

```cpp
void UWeaponComponent::HandleRecoil(float DeltaTime)
{
	FRotator RecoilOffset = RecoilBehaviour->GetCurrentRecoil(DeltaTime);
	FRotator Delta = RecoilOffset - PreviousRecoilOffset;   // only what changed this frame

	AController* PlayerController = GetOwner()->GetInstigatorController();
	PlayerController->SetControlRotation(PlayerController->GetControlRotation() + Delta);
	PreviousRecoilOffset = RecoilOffset;
}
```

Because the spring always returns toward zero, the sum of all deltas returns the view to where the player was aiming, while player input stays additive on top the whole time — the camera kicks up and eases back down without ever overriding the player.

### 3. A live "will this land here?" preview for arcing projectiles

**Problem:** Grenade-style weapons are hard to aim without feedback, and a static guideline lies as soon as the muzzle moves, the projectile has gravity, or a wall is in the way. The preview must use the *same* launch direction, speed and gravity as the real projectile or it is worse than no preview at all, and it has to run every frame while aiming without hitching.

**Solution:** The preview is split into three small responsibilities. `UProjectilePreviewAimBehaviour` (an `AimBehaviour` plugged in through the weapon's data asset) asks the real firing behaviour and projectile class for the launch direction, speed and gravity, so the preview and the shot can never drift apart:

```cpp
FVector LaunchDir = FiringBehaviour->GetFiringDirection(ViewpointRay, WeaponRay, Range);
float   Speed     = Projectile->GetSpeedForRange(GetWorld(), Range);
float   GravScale = Projectile->GetGravityScale();

UProjectileTrajectorySolver::PredictArc(
	this, WeaponRay.StartPoint, LaunchDir * Speed, GravScale,
	/*MaxSimTime*/ 5.f, PathPoints, HitResult,
	Projectile->GetProjectileSize().X, /*SimFrequency*/ 30.f, IgnoredActors);

ArcRenderer->UpdateArc(PathPoints, HitResult.bBlockingHit, HitResult.ImpactPoint, HitResult.ImpactNormal);
```

`UProjectileTrajectorySolver` is a thin, collision-aware wrapper around the engine's path prediction. It simulates with the projectile's own radius and gravity scale and ignores the shooter and the gun, so the arc ends exactly where the real projectile would hit:

```cpp
FPredictProjectilePathParams Params;
Params.StartLocation       = StartLocation;
Params.LaunchVelocity      = LaunchVelocity;
Params.bTraceWithCollision = true;
Params.ProjectileRadius    = ProjectileRadius;
Params.SimFrequency        = SimFrequency;      // points per second — higher = smoother
Params.OverrideGravityZ    = FMath::Abs(World->GetGravityZ()) * -GravityScale;
Params.ActorsToIgnore      = ActorsToIgnore;
```

Finally, `AProjectileArcRenderer` turns the point list into a continuous tube: it builds a world-space spline from the points and rebuilds one `USplineMeshComponent` per segment with clamped tangents, fading each segment's opacity along the path, then places an impact marker aligned to the surface normal:

```cpp
// Clamp tangent magnitude to segment length for a clean tube shape
float SegmentLen = (Points[i+1] - Points[i]).Size();
StartTangent = StartTangent.GetClampedToMaxSize(SegmentLen);
EndTangent   = EndTangent.GetClampedToMaxSize(SegmentLen);
Mesh->SetStartAndEnd(Points[i], StartTangent, Points[i + 1], EndTangent);

// Fade out along the arc
float Alpha = 1.f - (float)i / (float)NumSegments;
Mesh->SetScalarParameterValueOnMaterials(FName("Opacity"), Alpha);
```

The aim behaviour hides the arc when a shot is fired and pauses the preview for one fire-rate interval (`60 / FireRateRPM`), so it never shows a stale trajectory for a projectile that already left the barrel. Any new arcing weapon gets the preview for free by pointing its data asset at the same aim behaviour and a renderer class.
