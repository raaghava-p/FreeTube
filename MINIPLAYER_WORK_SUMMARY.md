# Miniplayer Feature Development Summary

## Overview

This document summarizes the work done on implementing a miniplayer/Picture-in-Picture feature for the FreeTube fork with queue functionality.

## Initial State

- FreeTube already has **native Picture-in-Picture (PiP)** functionality built-in
- Press **'i'** while watching a video to toggle native PiP mode
- The queue system was previously implemented and working

## User Request

The user wanted a workflow where they could:
1. Queue a few videos
2. Press 'i' to enter miniplayer mode
3. Navigate to other pages (Subscriptions, Channels, Trending) while video continues playing
4. Click the miniplayer to return to full player view

## Implementation Attempt

### Custom Miniplayer Component Created

Created a custom in-app miniplayer with the following files:

**`src/renderer/components/FtMiniplayer/`**
- `FtMiniplayer.vue` - Template with video element, controls, and header
- `FtMiniplayer.js` - Component logic for playback control, queue navigation
- `FtMiniplayer.css` - Styling for fixed position bottom-right player

**`src/renderer/store/modules/miniplayer.js`**
- Vuex store module for miniplayer state
- Actions: `enableMiniplayer`, `disableMiniplayer`, `updateMiniplayerTime`
- State: `isEnabled`, `videoId`, `currentTime`, `videoData`

### Integration Points

- Modified `App.vue` to include `<ft-miniplayer />` component
- Modified `App.js` to import and register the component
- Modified `Watch.js` `beforeRouteLeave` to detect PiP mode and enable custom miniplayer
- Added translations to `static/locales/en-US.yaml` under `Tooltips.Miniplayer`

## Problem Encountered

**Issue:** When the custom miniplayer was active, users could not click on navigation elements (Subscriptions, Channels, Trending).

### Debugging Attempts

1. **CSS Fixes:**
   - Added explicit dimensions and `max-height`
   - Added `contain: strict` and `isolation: isolate`
   - Set high `z-index: 99999`
   - Used `pointer-events: auto`

2. **Vue Teleport:**
   - Wrapped miniplayer in `<Teleport to="body">` to render outside component hierarchy
   - Removed `scoped` from styles for teleported content

3. **Error Handling:**
   - Added `hasError` and `errorMessage` state
   - Added try-catch blocks around video initialization

**Result:** Click blocking issue persisted despite all fixes.

## Current State

The custom miniplayer has been **disabled** to restore normal app functionality:

- Removed `<ft-miniplayer />` from `App.vue`
- Simplified `beforeRouteLeave` in `Watch.js` to just destroy player without miniplayer logic

The component files still exist but are not active.

## Files Modified

| File | Status |
|------|--------|
| `src/renderer/components/FtMiniplayer/FtMiniplayer.vue` | Created (not in use) |
| `src/renderer/components/FtMiniplayer/FtMiniplayer.js` | Created (not in use) |
| `src/renderer/components/FtMiniplayer/FtMiniplayer.css` | Created (not in use) |
| `src/renderer/store/modules/miniplayer.js` | Created (not in use) |
| `src/renderer/store/index.js` | Modified (miniplayer module added) |
| `src/renderer/App.vue` | Modified (miniplayer removed) |
| `src/renderer/App.js` | Modified (miniplayer import added) |
| `src/renderer/views/Watch/Watch.js` | Modified (miniplayer logic removed) |
| `static/locales/en-US.yaml` | Modified (miniplayer tooltips added) |

## Queue Bug Fixes (Earlier in Session)

Before the miniplayer work, several queue bugs were fixed:

1. **`removeFromQueue` mutation** - Fixed index management when removing items
2. **`moveQueueItem` mutation** - Added bounds checking
3. **`playNextInQueue`/`playPreviousInQueue`** - Removed unused return values
4. **`watch-video-queue.js`** - Fixed `updateCurrentQueuePosition` and `scrollToCurrentVideo`
5. **`Watch.js`** - Removed redundant local `autoplayQueue` state

## Recommendations for Future Work

To properly implement an in-app miniplayer that persists across page navigation:

1. **Architecture Change Required:** The video player is currently tied to the Watch page component. When navigating away, the component is destroyed.

2. **Possible Solutions:**
   - Move video player to App.vue level and control visibility
   - Use a persistent video element that's shared between watch page and miniplayer
   - Implement proper state transfer between native PiP and custom miniplayer

3. **Native PiP Alternative:** The existing native PiP ('i' key) should continue playing when navigating, as it's handled by the browser/OS separately from the DOM. If it's stopping, investigate what's causing the player to be destroyed.

## Native PiP Usage (Working Feature)

The built-in Picture-in-Picture works as follows:
1. Start playing a video
2. Press **'i'** to toggle PiP mode
3. Video pops into OS-level floating window
4. Works independently of FreeTube window

**Key binding:** `src/constants.js:175` - `PICTURE_IN_PICTURE: 'i'`
**Handler:** `src/renderer/components/ft-shaka-video-player/ft-shaka-video-player.js:2307-2315`
