# Features

## Countdown Timer
- **Description:** Single-duration countdown with a large visual display. Users pick from preset pills or set a custom duration; the timer counts down with an animated progress bar and color-coded warnings.
- **Status:** Completed
- **Implementation notes:** Preset pills: 1m, 5m, 10m, 15m, 25m, 30m, 45m, 60m. Custom hours/minutes/seconds picker. Color shifts to warning at 20% remaining, critical at <=10 s. Pulses at <=5 s.
- **Date added:** 2024

## Segment Timer
- **Description:** Build a named sequence of timed segments that auto-advance. Add, reorder, and delete segments, name each one, then start the full session.
- **Status:** Completed
- **Implementation notes:** Up/down arrow reordering. Multi-segment progress bar shows relative widths. 1.2 s animated transition between segments with brief Next-up label. Skip-forward button in run mode.
- **Date added:** 2024

## Interval Timer
- **Description:** Work/rest cycle builder with optional warmup and cooldown phases. Configure rounds, work duration, rest duration, and optional warmup/cooldown.
- **Status:** Completed
- **Implementation notes:** Circular SVG progress ring per phase. Phase-colored display (accent=work, green=rest, amber=warmup/cooldown). Auto-advances through all phases. Skip-phase button available. Tracks current round.
- **Date added:** 2024

## Timer Library (Save/Load)
- **Description:** Save and reload countdown, segment, and interval timer configurations from localStorage. Includes recent history.
- **Status:** Completed
- **Implementation notes:** Saved via Zustand persist middleware to localStorage. Supports save, load (pendingLoad pattern), and delete. Free-tier save limit enforced.
- **Date added:** 2024

## Settings
- **Description:** User-configurable preferences persisted to localStorage.
- **Status:** Completed
- **Options:** Sound enabled, Vibration enabled, Halfway alert (50% elapsed), Final countdown tick (last 5-10 s), Keep screen awake (Wake Lock API), Theme (dark/light/system).
- **Date added:** 2024

## Keyboard Shortcuts
- **Description:** Keyboard controls for hands-free timer operation.
- **Status:** Completed
- **Shortcuts:** Space = start/pause/resume, R = reset.
- **Implementation notes:** Handled via useKeyboardShortcuts hook, active on all timer pages.
- **Date added:** 2024

## Fullscreen Mode
- **Description:** Expand the timer to fill the entire screen for visibility across a room.
- **Status:** Completed
- **Implementation notes:** Uses Fullscreen API (requestFullscreen / exitFullscreen). Available on countdown page (inline button) and segment/interval run screens (FullscreenButton component).
- **Date added:** 2024

## Dark / Light / System Theme
- **Description:** Three theme modes. System mode follows the OS preference automatically.
- **Status:** Completed
- **Implementation notes:** Theme stored in the settings Zustand store. All colors use CSS custom properties switched via a class on the root element.
- **Date added:** 2024

## Web Audio API Sounds
- **Description:** In-browser audio feedback for timer events. No external audio files required.
- **Status:** Completed
- **Implementation notes:** All sounds synthesized via the Web Audio API in src/lib/alerts.ts. Events: completion chord, final-countdown tick beep, halfway chime, phase-transition tone.
- **Date added:** 2024

## Wake Lock (Prevent Screen Sleep)
- **Description:** Keeps the screen on while a timer is running when the setting is enabled.
- **Status:** Completed
- **Implementation notes:** Uses Screen Wake Lock API. Gracefully degrades if unavailable.
- **Date added:** 2024

## No Account Required
- **Description:** Fully functional without login, registration, or any backend. All data stored locally.
- **Status:** Completed
- **Implementation notes:** No server, no auth. Zustand stores with localStorage persistence.
- **Date added:** 2024