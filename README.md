# Utility

A collection of small, standalone tools and toys. Each one lives in its own
subfolder, is self-contained (single HTML file, inline CSS and JS, no build
step, no dependencies), and is served straight from GitHub Pages.

## Layout

```
/                     this README
/<tool-name>/         one folder per utility
  index.html          the whole tool
  manifest.json       PWA manifest (installable tools)
  icon-192.png
  icon-512.png
```

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

## Adding a tool

Create a new folder at the repo root with an `index.html` inside, keep it
dependency-free, and add a section here. If it should install to a home screen,
drop in a `manifest.json` alongside it with `start_url` and `scope` set to
`"./"` so the paths stay correct under the `/utility/` Pages subpath.
