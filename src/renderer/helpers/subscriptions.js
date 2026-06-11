import store from '../store/index'

const SUBSCRIPTION_FETCH_CONCURRENCY = 8

/**
 * Maps `items` through async `fn` with at most `limit` requests in flight at once.
 * The subscription tabs use this instead of an unbounded `Promise.all`, because
 * profiles with hundreds of subscriptions would otherwise burst-fire hundreds of
 * simultaneous requests at YouTube and trip its rate limiting.
 * @template T, U
 * @param {T[]} items
 * @param {(item: T, index: number) => Promise<U>} fn
 * @param {number} limit
 * @returns {Promise<U[]>}
 */
export async function concurrentRequestLimitedMap(items, fn, limit = SUBSCRIPTION_FETCH_CONCURRENCY) {
  const results = new Array(items.length)
  let nextIndex = 0

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex++
      results[index] = await fn(items[index], index)
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))

  return results
}

/**
 * `fetch` wrapper for YouTube RSS feeds that retries when YouTube rate limits us
 * (HTTP 429, or 403 which YouTube uses for rate limited RSS requests),
 * waiting with exponential backoff plus jitter and honouring the
 * Retry-After header when present.
 * @param {string} url
 * @param {RequestInit} [options]
 * @param {number} [maxRetries]
 * @returns {Promise<Response>}
 */
export async function fetchWithRateLimitHandling(url, options = {}, maxRetries = 3) {
  let response

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    response = await fetch(url, options)

    if (response.status !== 429 && response.status !== 403) {
      return response
    }

    if (attempt < maxRetries) {
      const retryAfterSeconds = parseInt(response.headers.get('Retry-After'))
      const delay = !isNaN(retryAfterSeconds)
        ? retryAfterSeconds * 1000
        : (2 ** attempt) * 1000 + Math.random() * 1000

      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  return response
}

/**
 * Filtering and sort based on user preferences
 * @param {any[]} videos
 */
export function updateVideoListAfterProcessing(videos) {
  let videoList = videos

  if (store.getters.getHideLiveStreams) {
    videoList = videoList.filter(item => {
      return (!item.liveNow && !item.isUpcoming)
    })
  }

  if (store.getters.getHideUpcomingPremieres) {
    videoList = videoList.filter(item => {
      if (item.isRSS) {
        // viewCount is our only method of detecting premieres in RSS
        // data without sending an additional request.
        // If we ever get a better flag, use it here instead.
        return item.viewCount !== '0'
      }
      // Observed for premieres in Local API Subscriptions.
      return (item.premiereDate == null ||
        // Invidious API
        // `premiereTimestamp` only available on premiered videos
        // https://docs.invidious.io/api/common_types/#videoobject
        item.premiereTimestamp == null
      )
    })
  }

  // ordered last to show first eligible video from channel
  // if the first one incidentally failed one of the above checks
  if (store.getters.getOnlyShowLatestFromChannel) {
    const authors = new Map()
    videoList = videoList.filter((video) => {
      if (!video.authorId) {
        return true
      }

      if (!authors.has(video.authorId)) {
        authors.set(video.authorId, 1)
        return true
      } else {
        const currentVideos = authors.get(video.authorId)

        if (currentVideos < store.getters.getOnlyShowLatestFromChannelNumber) {
          authors.set(video.authorId, currentVideos + 1)
          return true
        }
      }

      return false
    })
  }

  videoList.sort((a, b) => {
    return b.published - a.published
  })

  return videoList
}

/**
 * @param {string} rssString
 * @param {string} channelId
 */
export async function parseYouTubeRSSFeed(rssString, channelId) {
  // doesn't need to be asynchronous, but doing it allows us to do the relatively slow DOM querying in parallel
  try {
    const xmlDom = new DOMParser().parseFromString(rssString, 'application/xml')
    const channelName = xmlDom.querySelector('author > name').textContent
    const entries = xmlDom.querySelectorAll('entry')

    const promises = []

    for (const entry of entries) {
      promises.push(parseRSSEntry(entry, channelId, channelName))
    }

    return {
      name: channelName,
      videos: await Promise.all(promises)
    }
  } catch {
    return {
      videos: []
    }
  }
}

/**
 * @param {Element} entry
 * @param {string} channelId
 * @param {string} channelName
 */
async function parseRSSEntry(entry, channelId, channelName) {
  // doesn't need to be asynchronous, but doing it allows us to do the relatively slow DOM querying in parallel

  const rawViewCount = entry.getElementsByTagName('media:statistics')[0]?.getAttribute('views')

  let viewCount = null

  if (rawViewCount) {
    const parsedViewCount = parseInt(rawViewCount)

    if (!isNaN(parsedViewCount)) {
      viewCount = parsedViewCount
    }
  }

  return {
    authorId: channelId,
    author: channelName,
    // querySelector doesn't support xml namespaces so we have to use getElementsByTagName here
    videoId: entry.getElementsByTagName('yt:videoId')[0].textContent,
    title: entry.querySelector('title').textContent,
    published: Date.parse(entry.querySelector('published').textContent),
    viewCount,
    type: 'video',
    lengthSeconds: '0:00',
    isRSS: true
  }
}
