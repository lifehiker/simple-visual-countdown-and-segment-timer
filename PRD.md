# simple-visual-countdown-and-segment-timer

*Custom build — 2026-04-13T20:42:36.400Z*

## Overview
A clean, minimal web-based countdown and segment timer designed for people who need a fast, distraction-free timer they can start in seconds. Existing timer apps are often cluttered, ad-heavy, mobile-first, or too slow to configure when someone just wants a visible countdown on a laptop or external display. This app solves that by providing a dark-theme, large-format timer with instant start controls, keyboard shortcuts, segment-based routines, fullscreen presentation mode, sound alerts, and local preset saving, all without requiring accounts or a backend.

## Target user
A solo professional such as a coach, teacher, facilitator, fitness instructor, or remote worker who regularly runs timed sessions from a laptop connected to a larger screen. They need a timer that is readable from across the room, quick to configure, and reliable during live use. Current options fail because they are either too visually noisy, require too many clicks, hide fullscreen mode behind menus, force signups, or do not support reusable named segments like “Intro”, “Work”, “Break”, and “Q&A”.

## Core features
- **Simple countdown timer**
  - Enter a duration in minutes and seconds.
  - Start, pause, and reset controls.
  - Keyboard shortcuts: `Space` for start/pause, `r` for reset.
  - Optimized so a 5-minute timer can be started in 2 clicks.

- **Segment timer**
  - Create a list of named segments.
  - Each segment has a name and duration in seconds.
  - Run segments sequentially.
  - Automatically advance to the next segment when one ends.
  - Show current segment name prominently.

- **Large centered dark-theme display**
  - Minimal UI with large timer text centered on screen.
  - High contrast dark theme by default.
  - Responsive layout for laptop and external display use.

- **Fullscreen mode**
  - One-click fullscreen toggle using browser Fullscreen API.
  - Full timer display remains readable at distance.

- **Sound alerts**
  - Play a short alert sound when a countdown ends.
  - Play a short alert sound at the end of each segment.
  - Use a bundled local audio asset, no external dependency.

- **Save/load presets**
  - Save simple countdown presets with a name and duration.
  - Save segment timer presets with a name and ordered segments.
  - Load, overwrite, and delete presets.
  - Persist all presets in `localStorage`.

- **No account / local-only persistence**
  - All timer state and presets stored in browser `localStorage`.
  - No user authentication required for MVP.
  - No server-side data storage required for MVP.

## Tech stack
Use the standard stack, but keep implementation intentionally minimal and local-first.

- **Framework**
  - Next.js 15.x (App Router)
  - React 19.x
  - TypeScript 5.x

- **Styling/UI**
  - Tailwind CSS 3.x or 4.x compatible with Next.js 15
  - shadcn/ui latest stable
  - lucide-react for icons

- **State/validation**
  - React hooks + context only
  - Zod for validating preset shapes loaded from `localStorage`

- **Persistence**
  - `localStorage` only for MVP
  - No backend persistence used
  - PostgreSQL + Prisma included in stack but not used by app logic in MVP

- **Audio / browser APIs**
  - HTMLAudioElement for alert playback
  - Fullscreen API
  - `requestAnimationFrame` or interval-based timer loop with drift correction using timestamps

- **Standard stack dependencies included but unused in MVP**
  - PostgreSQL 16
  - Prisma 5.x
  - NextAuth v5
  - Stripe latest
  - Resend latest
  - Coolify for deployment

- **Suggested package list**
  - `next`
  - `react`
  - `react-dom`
  - `typescript`
  - `tailwindcss`
  - `postcss`
  - `autoprefixer`
  - `class-variance-authority`
  - `clsx`
  - `tailwind-merge`
  - `lucide-react`
  - `zod`

## Monetization
**Free**

Justification:
- This is a simple utility app with no accounts, no backend, and no cloud cost beyond hosting.
- Adding payment would create unnecessary friction for a tool whose core value is speed and simplicity.
- A free product is aligned with the MVP scope and fastest path to launch.
- Stripe remains in the standard stack but is not implemented in MVP.

Price points:
- Free: all features included
- No paid tier in MVP

## Build instructions for Codex
1. **Initialize project**
   - Create a new Next.js 15 app with App Router, TypeScript, ESLint, and Tailwind.
   - Project name: `minimal-timer`.
   - Use `src/` directory structure.

2. **Install dependencies**
   - Add shadcn/ui setup and install core components needed: `button`, `input`, `card`, `dialog`, `dropdown-menu`, `separator`.
   - Install `lucide-react`, `zod`, `clsx`, `tailwind-merge`, `class-variance-authority`.
   - Keep Prisma, NextAuth, Stripe, and Resend out of runtime usage for MVP, but structure project so they can be added later if needed.

3. **Set up app layout**
   - Create `src/app/layout.tsx` with global dark theme styling.
   - Create `src/app/globals.css` with minimal dark background, neutral foreground, and large-display-friendly defaults.
   - Set page metadata title to `Minimal Timer`.

4. **Create the main page**
   - Build `src/app/page.tsx` as a single-screen app.
   - Layout sections:
     - top mode switcher: `Countdown` / `Segments`
     - center display area with very large timer text
     - current segment name area
     - bottom controls and preset actions
   - Keep everything usable without scrolling on common laptop sizes.

5. **Define TypeScript data models**
   - Create `src/types/timer.ts` with:
     ```ts
     export type TimerMode = "countdown" | "segments";

     export type CountdownPreset = {
       id: string;
       type: "countdown";
       name: string;
       durationSec: number;
       createdAt: string;
       updatedAt: string;
     };

     export type Segment = {
       id: string;
       name: string;
       durationSec: number;
     };

     export type SegmentPreset = {
       id: string;
       type: "segments";
       name: string;
       segments: Segment[];
       createdAt: string;
       updatedAt: string;
     };

     export type Preset = CountdownPreset | SegmentPreset;
     ```

6. **Add validation schemas**
   - Create `src/lib/schemas.ts` using Zod for `Segment`, `CountdownPreset`, `SegmentPreset`, and `Preset[]`.
   - Validate all data loaded from `localStorage`.
   - If invalid, fail gracefully by ignoring corrupted entries and resetting to empty arrays.

7. **Implement localStorage helpers**
   - Create `src/lib/storage.ts`.
   - Use keys:
     - `minimal-timer:countdown-presets`
     - `minimal-timer:segment-presets`
     - `minimal-timer:last-state`
   - Export functions:
     - `getCountdownPresets()`
     - `saveCountdownPresets()`
     - `getSegmentPresets()`
     - `saveSegmentPresets()`
     - `getLastState()`
     - `saveLastState()`
   - Ensure all functions are client-safe and only access `window` in client context.

8. **Create timer utility functions**
   - Create `src/lib/time.ts`.
   - Add:
     - `formatDuration(totalSec: number): string` -> `MM:SS` for under 1 hour, `HH:MM:SS` if needed
     - `clampDuration(sec: number): number`
     - `minutesToSeconds(min: number): number`
   - Keep formatting large and stable for display.

9. **Implement countdown timer hook**
   - Create `src/hooks/useCountdownTimer.ts`.
   - State:
     - `durationSec`
     - `remainingMs`
     - `isRunning`
   - Actions:
     - `start()`
     - `pause()`
     - `toggle()`
     - `reset()`
     - `setDurationSec()`
   - Use timestamp-based drift correction, not naive decrement-per-second logic.
   - Expose derived `remainingSec`.

10. **Implement segment timer hook**
    - Create `src/hooks/useSegmentTimer.ts`.
    - State:
      - `segments: Segment[]`
      - `currentIndex`
      - `remainingMs`
      - `isRunning`
      - `isComplete`
    - Actions:
      - `start()`
      - `pause()`
      - `toggle()`
      - `reset()`
      - `setSegments()`
      - `skipToSegment(index: number)` optional only if easy
    - Behavior:
      - auto-advance to next segment
      - when final segment ends, stop and mark complete
      - trigger sound callback on each segment completion

11. **Add alert sound support**
    - Place a short bundled audio file in `public/sounds/alert.mp3`.
    - Create `src/hooks/useAlertSound.ts`.
    - Return `playAlert()` that safely attempts playback and catches browser autoplay errors.
    - Trigger on countdown completion and on each segment boundary/end.

12. **Build countdown configuration UI**
    - Create `src/components/countdown-panel.tsx`.
    - Inputs:
      - minutes
      - seconds
    - Buttons:
      - start/pause
      - reset
      - save preset
    - Optimize UX:
      - default quick value of 5 minutes
      - changing inputs updates timer duration when not running
      - one primary action button

13. **Build segment editor UI**
    - Create `src/components/segment-panel.tsx`.
    - Allow adding, editing, and removing segments.
    - Each row:
      - segment name input
      - minutes input
      - seconds input
      - delete button
    - Include “Add segment” and “Save preset”.
    - Require at least one valid segment to start.

14. **Build display and controls**
    - Create `src/components/timer-display.tsx`.
    - Props:
      - `timeText`
      - `label`
      - `isRunning`
      - `mode`
    - Large centered typography, readable from distance.
    - Create `src/components/fullscreen-button.tsx` using Fullscreen API.
    - Show current segment name above or below timer when in segment mode.

15. **Implement presets UI**
    - Create `src/components/preset-manager.tsx`.
    - Separate lists for countdown and segment presets based on current mode.
    - Actions:
      - load preset
      - overwrite current preset by name or selected id
      - delete preset
    - Use simple local dialogs or inline forms.
    - Preset save shape:
      - countdown: `{ id, type, name, durationSec, createdAt, updatedAt }`
      - segments: `{ id, type, name, segments, createdAt, updatedAt }`

16. **Add keyboard shortcuts**
    - Create `src/hooks/useKeyboardShortcuts.ts`.
    - Bind:
      - `Space` => start/pause active timer
      - `r` => reset active timer
    - Ignore shortcuts when focus is inside an input, textarea, or contenteditable element.
    - Register on main page client side only.

17. **Persist last-used state**
    - Save current mode, countdown duration, and in-progress segment definitions to `minimal-timer:last-state`.
    - Restore on page load.
    - Do not persist active running state across refresh; always restore paused.

18. **Polish UX and edge cases**
    - Disable start if duration is zero or no valid segments exist.
    - Reset should return to original configured duration/segment start.
    - If a segment preset is loaded while another timer is running, stop current timer first.
    - Ensure timer text does not shift width as numbers change; use tabular numerals if possible.
    - Ensure fullscreen works from a user gesture button.

19. **Prepare static-friendly deployment**
    - Keep app client-heavy and avoid backend requirements.
    - If using static export, configure `next.config.ts` appropriately; otherwise keep simple SSR-compatible setup.
    - Add `Dockerfile` for Next.js standalone output.
    - Add `.dockerignore`.
    - Ensure app can run on Coolify with `npm install && npm run build && npm start`.

20. **Final verification**
    - Verify:
      - countdown starts in 2 clicks from default state
      - keyboard shortcuts work
      - segment auto-advance works
      - sound plays on completion
      - presets save/load/delete correctly via `localStorage`
      - fullscreen works
      - dark theme is consistent
    - Verify `npm run build` passes, create Dockerfile with `output:standalone`, deploy to Coolify.
