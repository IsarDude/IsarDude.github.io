---
title: "Racer - Real-Time Multiplayer (Proof of Concept)"
summary: "Proof of concept for real-time multiplayer racing in Unreal Engine 5, with custom replication, client-side prediction, server reconciliation and spline interpolation for remote karts."
order: 5
draft: false
tags:
  - Unreal Engine
  - C++
  - PC
  - Multiplayer
  - Networking
  - Personal Project
image: "/images/projects/krazy-karts-multiplayer/cover.jpg"
---

- **Project Type:** Personal project (not professional work)
- **Engine / Language:** Unreal Engine 5.7, C++ (with data-driven Blueprint content)
- **Target Platform:** PC (Windows)

<video src="/videos/krazy-karts-multiplayer/showreel.mp4" poster="/videos/krazy-karts-multiplayer/poster.jpg" width="1920" height="1080" controls preload="metadata" playsinline class="w-full h-auto rounded-lg" aria-label="Showreel of Racer netcode: replication, client-side prediction, server reconciliation and spline interpolation"></video>

## Systems I built

- **Vehicle movement component.** A force-based driving model that computes throttle, air resistance and rolling resistance to get acceleration, plus torque-based steering. It runs identically on client and server, so moves replay deterministically.
- **Custom replication component.** Replaces Unreal's default movement replication with a hand-written actor component that replicates the authoritative server state and drives behavior per network role: authority, autonomous proxy or simulated proxy.
- **Client-side prediction and server reconciliation.** The client simulates each move immediately and queues it as unacknowledged. When corrected state arrives from the server, it replays the moves the server hasn't acknowledged yet, so the player feels no input latency and the client stays in sync with the server.
- **Remote proxy interpolation.** Hermite cubic spline interpolation (position and velocity, with Slerp for rotation) between periodic server snapshots, so other players' karts move smoothly even though network updates are infrequent.

## Engineering challenge

**Problem:** Remote karts (simulated proxies) only receive position and velocity updates a few times per second. Snapping to each new server transform made them jitter and teleport. The locally controlled kart, on the other hand, had to respond to input instantly despite the round trip to the authoritative server.

**Solution:** I split the problem by network role. The locally controlled kart uses client-side prediction: input is simulated immediately and stored in an unacknowledged move queue. When the server's authoritative state comes back, the client resets to it and replays only the moves the server hasn't acknowledged yet, which corrects drift without a visible snap. For remote karts I build a Hermite cubic spline from the last known and the newly received transform and velocity, so position and velocity both stay continuous across the interpolation window. Linear interpolation between two raw positions had caused jitter whenever velocity changed between snapshots, and the spline removed it.

### 1. Predict locally, send every move

Each tick the autonomous proxy builds a timestamped move, simulates it immediately, stores it in the unacknowledged queue, and sends it to the server. The server runs the exact same move simulation, so both sides stay deterministic. Because the client is untrusted, the server's move validation rejects moves from clients that try to run ahead of server time.

```cpp
// Every tick, on the locally controlled kart
if (LocalRole == ROLE_AutonomousProxy)
{
	FGoKartMove LastMove = GoKartMovementComponent->GetLastMove();
	AddMove(LastMove);          // remember it until the server acknowledges it
	Server_SendMove(LastMove);  // authoritative copy runs on the server
}

// Anti-cheat: a client may not simulate more time than has actually passed.
bool UGoKartReplicationComponent::Server_SendMove_Validate(FGoKartMove Move)
{
	float ProposedTime = ClientSimulatedTime + Move.DeltaTime;
	bool ClientNotRunningAhead = ProposedTime < GetWorld()->TimeSeconds;

	if (!ClientNotRunningAhead) return false;
	if (!Move.IsValid()) return false;

	return true;
}
```

### 2. Reconcile by replaying unacknowledged moves

When the authoritative state replicates back, the client snaps to the server's transform and velocity, discards every move the server has already processed, and re-simulates the rest on top. The player's input never waits on the network, and any drift is corrected without a visible rubber-band.

```cpp
void UGoKartReplicationComponent::AutonomousProxy_OnRep_ServerState()
{
	if (GoKartMovementComponent == nullptr) return;

	// 1. Rewind to the server's truth
	GetOwner()->SetActorTransform(ServerState.Transform);
	GoKartMovementComponent->SetVelocity(ServerState.Velocity);

	// 2. Drop moves the server has already applied
	ClearAcknowledgedMoves(ServerState.LastMove);

	// 3. Replay everything the server hasn't seen yet
	for (const FGoKartMove& Move : UnacknowledgedMoveQueue)
	{
		GoKartMovementComponent->SimulateMove(Move);
	}
}

void UGoKartReplicationComponent::ClearAcknowledgedMoves(const FGoKartMove& LastMove)
{
	TArray<FGoKartMove> NewMoves;
	for (auto Move : UnacknowledgedMoveQueue)
	{
		if (Move.MoveTime > LastMove.MoveTime)
		{
			NewMoves.Add(Move);
		}
	}
	UnacknowledgedMoveQueue = NewMoves;
}
```

### 3. Hermite spline for remote karts

For other players' karts, each snapshot starts a new interpolation segment. The segment begins at where the kart was *drawn* (not where the last snapshot said it was), so there is no pop when a packet arrives. Velocities are fed in as tangents, so speed stays continuous across segments. Rotation uses a Slerp.

```cpp
struct FHermiteCubicSpline
{
	FVector StartLocation, StartDerivative, TargetLocation, TargetDerivative;

	FVector InterpolateLocation(float LerpRatio) const
	{
		return FMath::CubicInterp(StartLocation, StartDerivative, TargetLocation, TargetDerivative, LerpRatio);
	}
	FVector InterpolateDerivative(float LerpRatio) const
	{
		return FMath::CubicInterpDerivative(StartLocation, StartDerivative, TargetLocation, TargetDerivative, LerpRatio);
	}
};

void UGoKartReplicationComponent::ClientTick(float DeltaTime)
{
	TimeSinceLastUpdate += DeltaTime;
	if (TimeBetweenUpdates < KINDA_SMALL_NUMBER) return;

	// Clamp so a late update doesn't extrapolate past the target and snap back.
	float LerpRatio = FMath::Clamp(TimeSinceLastUpdate / TimeBetweenUpdates, 0.f, 1.f);
	FHermiteCubicSpline Spline = CreateSpline();

	InterpolateLocation(Spline, LerpRatio);
	InterpolateVelocity(Spline, LerpRatio);
	InterpolateRotation(LerpRatio);
}

FHermiteCubicSpline UGoKartReplicationComponent::CreateSpline()
{
	FHermiteCubicSpline Spline;
	Spline.StartLocation    = LastClientTransform.GetLocation();   // where the kart was drawn
	Spline.TargetLocation   = ServerState.Transform.GetLocation(); // where the server says it is
	Spline.StartDerivative  = LastClientVelocity * VelocityToDerivative();
	Spline.TargetDerivative = ServerState.Velocity * VelocityToDerivative();
	return Spline;
}
```