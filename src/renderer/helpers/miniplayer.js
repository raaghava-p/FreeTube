import store from '../store/index'
import { getLocalVideoInfo } from './api/local'
import { consumePrefetchedVideoInfo, prefetchVideoInfo } from './prefetch'

/**
 * Fetch the best muxed (audio + video) stream for the miniplayer's
 * plain `<video>` element.
 * @param {string} videoId
 * @returns {Promise<string|null>} deciphered stream URL, or null when the
 * video has no muxed formats (e.g. livestreams)
 */
async function getMiniplayerStreamUrl(videoId) {
  const { info } = await (consumePrefetchedVideoInfo(videoId) ?? getLocalVideoInfo(videoId))

  const muxedFormats = (info.streaming_data?.formats ?? []).filter((format) => format.freeTubeUrl)

  if (muxedFormats.length === 0) {
    return null
  }

  return muxedFormats.reduce((best, format) => {
    return (format.height ?? 0) > (best.height ?? 0) ? format : best
  }).freeTubeUrl
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

  const nextItem = store.getters.getNextQueueItem

  if (nextItem && nextItem.videoId !== videoData.videoId) {
    prefetchVideoInfo(nextItem.videoId)
  }
}
