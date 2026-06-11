import { getLocalVideoInfo } from './api/local'
import store from '../store/index'

const CACHE_TTL_MS = 10 * 60 * 1000
const MAX_ENTRIES = 10
const MAX_CONCURRENT_PREFETCHES = 2

/**
 * Speculative cache of `getLocalVideoInfo` results, so that the slow YouTube
 * round-trips happen before the user navigates to the watch page
 * (hovering a video card, or ahead of the next video in the queue).
 *
 * Entries are single-use: consuming one removes it, so a watch page can never
 * receive an info object that another consumer has already mutated.
 *
 * @type {Map<string, { promise: Promise<any>, timestamp: number }>}
 */
const cache = new Map()
let inFlightCount = 0

function prefetchingSupported() {
  return !!process.env.SUPPORTS_LOCAL_API && store.getters.getBackendPreference === 'local'
}

/**
 * Start fetching the video info for `videoId` in the background.
 * Opportunistic: does nothing if prefetching isn't supported, the video is
 * already cached or in flight, or too many prefetches are already running.
 * @param {string} videoId
 */
export function prefetchVideoInfo(videoId) {
  if (!videoId || !prefetchingSupported() || inFlightCount >= MAX_CONCURRENT_PREFETCHES) {
    return
  }

  const existing = cache.get(videoId)

  if (existing) {
    if (Date.now() - existing.timestamp <= CACHE_TTL_MS) {
      return
    }

    cache.delete(videoId)
  }

  inFlightCount++
  const promise = getLocalVideoInfo(videoId)

  promise
    .catch(() => {
      // drop failed prefetches so the normal load path runs untouched,
      // but only if this entry wasn't replaced in the meantime
      if (cache.get(videoId)?.promise === promise) {
        cache.delete(videoId)
      }
    })
    .finally(() => {
      inFlightCount--
    })

  cache.set(videoId, { promise, timestamp: Date.now() })

  if (cache.size > MAX_ENTRIES) {
    // Maps iterate in insertion order, so the first key is the oldest entry
    cache.delete(cache.keys().next().value)
  }
}

/**
 * Take the prefetched video info for `videoId` out of the cache.
 * Falls back to a fresh `getLocalVideoInfo` call if the prefetch failed,
 * so consumers never see a prefetch-related error.
 * @param {string} videoId
 * @returns {Promise<any>|null} null when nothing (fresh) is cached
 */
export function consumePrefetchedVideoInfo(videoId) {
  const entry = cache.get(videoId)

  if (!entry) {
    return null
  }

  cache.delete(videoId)

  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    return null
  }

  return entry.promise.catch(() => getLocalVideoInfo(videoId))
}
