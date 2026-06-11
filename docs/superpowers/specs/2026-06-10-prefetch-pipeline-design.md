# Speculative Prefetch Pipeline — Design

**Date:** 2026-06-10
**Status:** Implemented

## Problem

Loading a video requires multiple serial YouTube round-trips (watch-page data,
stream URL deciphering, SABR setup) that only start after the user clicks.
Queue advancement and video clicks feel slow compared to YouTube, which
prefetches before the click.

## Design

### Prefetch cache (`src/renderer/helpers/prefetch.js`)
- `Map<videoId, {promise, timestamp}>` of in-flight/completed `getLocalVideoInfo` calls
- `prefetchVideoInfo(videoId)` — opportunistic: no-ops when backend is Invidious,
  entry is fresh, or ≥2 prefetches already in flight
- `consumePrefetchedVideoInfo(videoId)` — single-use (deleted on read) so watch
  pages never share a mutated info object; falls back to a fresh fetch if the
  prefetched promise rejected
- 10-minute TTL, max 10 entries (oldest evicted)

### Watch page (`Watch.js`)
- `getVideoInformationLocal` consumes the prefetched info when present
- `schedulePrefetchNextInQueue` prefetches the next queue item 10s after load
  (never competes with initial buffering); re-triggered by a `nextQueueItem`
  watcher on queue reorder/removal; timer cleared in `beforeRouteLeave`

### Hover prefetch (`ft-list-video`)
- `mouseenter`/`focusin` starts a 400ms timer → prefetch; `mouseleave`/`focusout`
  cancels — deliberate hovers only, no extra rate-limit pressure from scrolling

## Error handling
A failed prefetch deletes its cache entry; the normal load path runs untouched.

## Testing
Standalone node test verified: single-use semantics, in-flight dedup,
concurrency cap with slot release, failure drop, consume-then-fail fallback,
eviction order, backend guard. ESLint clean.
