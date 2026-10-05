# Utility

A collection of small, standalone tools and toys. Each one lives in its own
subfolder, is self-contained (single HTML file, inline CSS and JS, no build
step, no dependencies), and is served straight from GitHub Pages.

## Layout

```
/                     this README
/index.html           landing page — the menu of tools
/<tool-name>/         one folder per utility
  index.html          the whole tool
  manifest.json       PWA manifest (installable tools)
  icon-192.png
  icon-512.png
```

Visiting the repo root serves `/index.html`, a dark, touch-friendly menu with one
button per tool. It is plain HTML with no script — to add a tool, copy one
`<a class="tool">` block and change the `href`, name and description. The comment
above the first block says the same thing in place.

Every tool is published under the same URL pattern:

```
https://conwatcher.github.io/utility/<tool-name>/
```

## Tools

### Minesweeper

The classic game, rebuilt as a single file for touch. First entry in the
collection.

**URL:** https://conwatcher.github.io/utility/minesweeper/
**Source:** [`minesweeper/index.html`](minesweeper/index.html)

- Three classic difficulties — Beginner 9×9 / 10 mines, Intermediate 16×16 / 40,
  Expert 30×16 / 99
- **Flag Mode** toggle: a persistent switch that turns every tap into a flag
  placement, so there is no need for a right-click or a long-press on a tablet.
  It glows amber while active and stays on until you turn it off (the setting is
  remembered between sessions)
- Long-press also flags at any time, and right-click works on desktop
- Tapping a satisfied number clears the cells around it (chording)
- Flood-fill on empty cells, first-click safety (the first tap always opens a
  safe region), timer, mine counter, and win/lose states with a reset button
- Dark theme, cell sizes that scale to the viewport for comfortable tapping on
  iPad Safari
- Installable as a PWA — open the URL in Safari and choose **Share → Add to Home
  Screen** to launch it full-screen

### Scorched Tanks

A turn-based artillery duel against an AI opponent, in the lineage of the Amiga-era
*Scorched Tanks* and *Scorched Earth*. Set your angle, set your power, read the wind,
pick a warhead, and try to bury the other tank before it buries you.

**URL:** https://conwatcher.github.io/utility/scorched-tanks/
**Source:** [`scorched-tanks/index.html`](scorched-tanks/index.html)

- Procedurally generated destructible terrain — every shot carves the battlefield, and
  the ground can collapse out from under a tank
- Ballistics under gravity **and** wind; the wind is rerolled every turn and shown
  before you commit, so it is information rather than a surprise
- Six weapons — Shell, Heavy Shell, **Roller** (lands short and rolls downhill into a
  target), **MIRV** (splits into five warheads at the top of its arc), **Baby Nuke**,
  and **Dirt Ball** (no damage; it raises terrain to reposition or bury)
- An AI that solves a real firing solution against the live terrain and wind, with four
  skill levels — Rookie, Gunner, Veteran, Deadeye — that tune how far off it
  deliberately aims
- Economy and a shop between rounds: buy ammunition, armour plating for extra maximum
  health, and parachutes that cancel the fall damage when the ground gives way
- Single round, best of 3, or best of 5, with cash, ammunition and upgrades carried
  across rounds
- Synthesised sound effects, explosion particles and screen shake — no asset files
- Dark theme, mouse or keyboard (arrows aim, space fires, **M** mutes)
- Installable as a PWA — **Share → Add to Home Screen**

### Snafu

A remake of Mattel's *Snafu* (Intellivision, 1981): the growing-trail arcade game
with two formats, Trap and Bite.

**URL:** https://conwatcher.github.io/utility/snafu/
**Source:** [`snafu/index.html`](snafu/index.html)

- **Trap**: up to four trails that never stop growing. Crash into a wall, an
  obstacle or any trail and you're out, and every survivor scores a point. No 180°
  turns. Computer players fill any trail without a human
- **Bite**: two serpents of 10 segments that grow toward 20 when left alone. Run
  into the other serpent's tail to bite off a segment. Walls, obstacles and bodies
  cost you one. First to zero loses the round
- Variations as toggles: 4-way or 8-way movement, no / some / lots of obstacles
  (placed symmetrically so nobody gets a better start), crashed trails that stay as
  walls or vanish
- Speed 1–9, three computer skill levels (Easy turns only when about to hit
  something; Normal and Hard measure open space; Hard also hunts), 1–99 rounds
- 0, 1 or 2 humans. 0 is a watch mode. Keyboard (WASD + QEZC, arrows / numpad),
  gamepads, and an on-screen touch disc modelled on the Intellivision controller
- An original looping chiptune kicks in when the field is down to two, plus
  synthesised crash, bite and countdown sounds. No asset files. **M** mutes
- Installable as a PWA: **Share → Add to Home Screen**

## Adding a tool

Create a new folder at the repo root with an `index.html` inside, keep it
dependency-free, and add a section here. Also add a button for it to the root
landing page (`/index.html`) — copy an existing `<a class="tool">` block and change
the `href`, name and description. Point the `href` at the file
(`./<tool-name>/index.html`), not just the folder, so the link also works when the
files are opened locally rather than from GitHub Pages. If it should install to a home screen, drop in a
`manifest.json` alongside it with `start_url` and `scope` set to `"./"` so the paths
stay correct under the `/utility/` Pages subpath.
