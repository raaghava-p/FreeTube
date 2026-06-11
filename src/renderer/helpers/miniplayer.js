import store from '../store/index'
import { getLocalVideoInfo } from './api/local'
import { consumePrefetchedVideoInfo } from './prefetch'

const STREAM_URL_TTL_MS = 30 * 60 * 1000
const streamUrlCache = new Map()

/** @type {HTMLVideoElement|null} */
let preloadElement = null

/**
 * Warm the browser's media cache with the upcoming stream so that
 * advancing the queue starts playback instantly.
 * @param {string} url
 */
function preloadStream(url) {
  if (!preloadElement) {
    preloadElement = document.createElement('video')
    preloadElement.preload = 'auto'
    preloadElement.muted = true
  }

  if (preloadElement.src !== url) {
    preloadElement.src = url
  }
}

/**
 * Fetch the best muxed (audio + video) stream for the miniplayer's
 * plain `<video>` element. Resolved URLs are cached so queue navigation
 * (next/previous/replay) doesn't refetch.
 * @param {string} videoId
 * @returns {Promise<string|null>} deciphered stream URL, or null when the
 * video has no muxed formats (e.g. livestreams)
 */
async function getMiniplayerStreamUrl(videoId) {
  const cached = streamUrlCache.get(videoId)

  if (cached && Date.now() - cached.timestamp <= STREAM_URL_TTL_MS) {
    return cached.url
  }

  const { info } = await (consumePrefetchedVideoInfo(videoId) ?? getLocalVideoInfo(videoId))

  const muxedFormats = (info.streaming_data?.formats ?? []).filter((format) => format.freeTubeUrl)

  if (muxedFormats.length === 0) {
    return null
  }

  const url = muxedFormats.reduce((best, format) => {
    return (format.height ?? 0) > (best.height ?? 0) ? format : best
  }).freeTubeUrl

  streamUrlCache.set(videoId, { url, timestamp: Date.now() })

  if (streamUrlCache.size > 10) {
    streamUrlCache.delete(streamUrlCache.keys().next().value)
  }

  return url
}

/**
 * Load a queue item into the miniplayer (YouTube-style bottom-right player).
 * Also prefetches the next queue item so advancing is instant.
 * @param {object} videoData queue item shape ({ videoId, title, author, lengthSeconds, ... })
 * @param {object} [options]
 * @param {boolean} [options.autoplay] false mirrors YouTube's behaviour for the
 * first "Add to queue": the miniplayer opens ready to play, but paused
 */
export async function loadVideoInMiniplayer(videoData, { autoplay = true } = {}) {
  let streamUrl = null

  try {
    streamUrl = await getMiniplayerStreamUrl(videoData.videoId)
  } catch (err) {
    console.error('Failed to load miniplayer stream:', err)
  }

  store.dispatch('enableMiniplayer', {
    videoId: videoData.videoId,
    currentTime: 0,
    videoData: { ...videoData, streamUrl, autoplay }
  })

  // resolve and buffer the next queue item's stream
  // so advancing the queue is instant
  const nextItem = store.getters.getNextQueueItem

  if (nextItem && nextItem.videoId !== videoData.videoId) {
    getMiniplayerStreamUrl(nextItem.videoId)
      .then((url) => {
        if (url) {
          preloadStream(url)
        }
      })
      .catch((err) => console.error('Failed to preload next queue stream:', err))
  }
}
