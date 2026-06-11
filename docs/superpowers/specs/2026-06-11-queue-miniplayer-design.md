# Queue-Driven Miniplayer (YouTube-style) — Design

**Date:** 2026-06-11
**Status:** Implemented

## Problem

The fork's `FtMiniplayer` component and `miniplayer` store existed but had no
callers — `enableMiniplayer` was never dispatched and `videoData.streamUrl`
had no producer. The user wants YouTube's queue/miniplayer behavior.

## Researched YouTube behavior (desktop)

1. First "Add to queue" opens the miniplayer bottom-right with that video,
   **paused** (ready to play)
2. With the miniplayer open, clicking a video thumbnail loads and plays it
   **directly in the miniplayer** (front of queue), instead of navigating
3. Miniplayer persists across page navigation; Expand returns to the watch
   page; Esc or the close button dismisses it (restoring normal click behavior)

## Design

### Stream source (`helpers/miniplayer.js`)
- `getMiniplayerStreamUrl(videoId)`: consumes the prefetch cache (or fetches),
  picks the highest-resolution muxed format's `freeTubeUrl` (already
  deciphered by `getLocalVideoInfo`). Returns null for livestreams →
  miniplayer shows its existing "stream not available" error
- `loadVideoInMiniplayer(videoData, {autoplay})`: fetches the stream,
  dispatches `enableMiniplayer`, then prefetches the next queue item so
  advancing is instant

### Queue store
- New `playVideoAtFrontOfQueue` action/mutation: unshift item,
  `currentQueueIndex = 0`

### ft-list-video
- `handleAddToQueue`: when the queue was empty and we're not on a watch page,
  set queue index 0 and open the miniplayer paused (YouTube behavior #1)
- `maybeInterceptClickForMiniplayer`: capture-phase click/Enter handler on the
  card root; when the miniplayer is open and the click targets a `/watch/`
  link, prevent navigation, front-insert the video, play it in the miniplayer
  (YouTube behavior #2). Capture phase beats the router-link's own handler;
  channel links and buttons are unaffected

### FtMiniplayer
- `initPlayer` honors `videoData.autoplay === false` (paused open); the
  `autoplay` attribute was removed from the `<video>` element accordingly
- Next/previous now load the queue item in place via `loadVideoInMiniplayer`
  instead of navigating to the watch page and closing
- Esc closes the miniplayer (listener attached only while open, ignores
  INPUT/TEXTAREA targets)

## Escape hatch

Closing the miniplayer restores normal click-to-watch-page behavior; the
queue itself is preserved.
