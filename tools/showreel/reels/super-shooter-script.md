# Super Shooter: Gameplay Systems Showreel (~55s)

**Tone:** fast, game-feel focused. Gameplay clips first, with code and Blueprint views as quick cutaways.

| Time | Visual | Voiceover / on-screen text |
|---|---|---|
| 0:00–0:05 | Fast gunfight montage, then the title card | **SUPER SHOOTER**. "A third-person shooter vertical slice. Every system is data-driven." |
| 0:05–0:17 | Cycle through weapons: rifle, shotgun, grenade launcher. Cut to the `UGunDataAsset` dropdowns in the editor. | "Every gun is just a data asset. Firing, spread, recoil and aim are interchangeable strategies, so a new weapon takes a few dropdowns instead of a new class, and no recompile." *(text: Strategy-Pattern Weapon Framework)* |
| 0:17–0:25 | Slow-motion firing of an automatic weapon, camera kick visible, with a spring graph overlay | "Recoil is a spring-damper system. Each shot is an impulse, so rapid fire stacks and settles naturally. It's applied as a delta, so it never fights the player's aim." *(text: Spring Recoil)* |
| 0:25–0:35 | Aiming the grenade launcher, with the glowing arc and impact marker updating live | "For arcing weapons, a live trajectory preview. It uses the real projectile's speed, gravity and collision, so the arc lands exactly where the shot does." *(text: Predictive Aim Preview)* |
| 0:35–0:44 | Bots patrolling, spotting the player, strafing and shooting, fleeing, then investigating the last known position. Behavior Tree view on screen. | "Bots see through Unreal's perception system. They're team-aware, react to unseen damage, and stop firing the moment line of sight breaks." *(text: Perception-Driven AI)* |
| 0:44–0:51 | Main menu → match → scoreboard → end-match screen | "The UI is MVVM and message-driven. Gameplay code never touches a widget. Score changes broadcast as messages and the HUD just reacts." *(text: Tag-Driven MVVM UI)* |
| 0:51–0:55 | Best kill-cam style shot and end card | "Unreal Engine 5.7, C++. Built to scale." + your name/portfolio URL |

## Notes
- Keep the end card honest ("Personal project") to match the portfolio page.
- A 10-second cut of the weapon-swap and recoil sections works well for social media.
