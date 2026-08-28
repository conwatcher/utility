# utility

Small, self-contained browser tools — one per folder, no build step, no dependencies.
Each folder is published through GitHub Pages at
`https://conwatcher.github.io/utility/<tool-name>/`.

## Tools

### Scorched Tanks

**https://conwatcher.github.io/utility/scorched-tanks/** — [source](scorched-tanks/)

A turn-based artillery duel against an AI opponent, in the lineage of the Amiga-era
*Scorched Tanks* and *Scorched Earth*. Set your angle, set your power, read the wind,
pick a warhead, and try to bury the other tank before it buries you.

- Procedurally generated destructible terrain — every shot carves the battlefield, and
  the ground can collapse out from under a tank
- Ballistics under gravity **and** wind; the wind is rerolled each turn and shown before
  you commit to a shot
- Six weapons: Shell, Heavy Shell, Roller (rolls downhill into a target), MIRV (splits
  into five warheads at the top of its arc), Baby Nuke, and Dirt Ball (no damage — it
  raises terrain to reposition or bury)
- AI opponent that solves for a real firing solution, with four skill levels that tune
  how far off it deliberately aims
- Economy and shop between rounds — buy ammunition, armour plating, and parachutes that
  cancel a fall when the ground gives way
- Single round, best of 3, or best of 5, with cash, ammo and upgrades carried across rounds
- Synthesised sound effects, explosion particles and screen shake — no asset files
- Installable as a PWA; plays with mouse or keyboard (arrows aim, space fires, M mutes)

## Layout

```
/<tool-name>/
  index.html        # the entire tool — inline CSS + JS, no build step, no external deps
  manifest.json     # PWA manifest, start_url and scope set to "./"
  icon-192.png
  icon-512.png
```

Everything a tool needs lives in its own folder, so tools can be added or removed without
touching anything else.
