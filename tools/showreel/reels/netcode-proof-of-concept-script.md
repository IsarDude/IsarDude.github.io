# Netcode Proof of Concept: Multiplayer Showreel (~50s)

**Tone:** technical but punchy. Show side-by-side footage of two clients, plus debug overlays.

| Time | Visual | Voiceover / on-screen text |
|---|---|---|
| 0:00–0:05 | Kart drifting around a corner, then the title card | **NETCODE PROOF OF CONCEPT**. "Real-time multiplayer racing, with the netcode built from scratch." |
| 0:05–0:12 | Two game windows side by side, with the network lag simulator on (e.g. `Net PktLag=200`) | "Online games have a problem: the server is always a few hundred milliseconds behind." |
| 0:12–0:22 | Local kart responding instantly. Debug overlay shows moves queuing up. | "So the client predicts. Every input is simulated immediately and queued as unacknowledged. The player never waits on the network." *(text: Client-Side Prediction)* |
| 0:22–0:30 | Force a correction, show the kart snapping to server state, then replaying the queue | "When the server's authoritative state arrives, the client rewinds to it and replays every move the server hasn't seen yet. Drift gets corrected with no rubber-banding." *(text: Server Reconciliation)* |
| 0:30–0:40 | The other player's kart. Toggle between linear lerp (jittery) and Hermite spline (smooth). | "Other players' karts only update a few times per second. Linear interpolation jitters. I built a Hermite cubic spline from position and velocity, so motion stays smooth between snapshots." *(text: Hermite Spline Interpolation)* |
| 0:40–0:46 | Quick code flash of `Server_SendMove_Validate` | "And since clients can't be trusted, the server validates every move to stop anyone running ahead of server time." |
| 0:46–0:50 | Closing gameplay and end card | "Custom replication. Prediction. Reconciliation. Unreal Engine 5, C++." + your name/portfolio URL |

## Notes
- The lag-simulator A/B comparisons (prediction on/off, spline vs. lerp) are the strongest footage. Keep the debug overlays visible.
- Keep the end card honest ("Personal project") to match the portfolio page.
