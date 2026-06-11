import store from '../store/index'

// Circuit breaker: when the SponsorBlock/DeArrow server keeps failing,
// stop hammering it for a while instead of delaying every video card and
// watch page with doomed requests.
const FAILURE_THRESHOLD = 3
const COOLDOWN_MS = 5 * 60 * 1000

const circuits = new Map()

function circuitOpen(key) {
  const circuit = circuits.get(key)
  if (!circuit || circuit.failures < FAILURE_THRESHOLD) {
    return false
  }

  if (Date.now() - circuit.lastFailure > COOLDOWN_MS) {
    circuits.delete(key)
    return false
  }

  return true
}

function recordFailure(key) {
  const circuit = circuits.get(key) ?? { failures: 0, lastFailure: 0 }
  circuit.failures++
  circuit.lastFailure = Date.now()
  circuits.set(key, circuit)

  if (circuit.failures === FAILURE_THRESHOLD) {
    console.error(`${key} failed ${FAILURE_THRESHOLD} times, pausing requests for ${COOLDOWN_MS / 60000} minutes`)
  }
}

function recordSuccess(key) {
  circuits.delete(key)
}

async function getVideoHash(videoId) {
  const videoIdBuffer = new TextEncoder().encode(videoId)

  const hashBuffer = await crypto.subtle.digest('SHA-256', videoIdBuffer)
  const hashArray = new Uint8Array(hashBuffer)

  return hashArray[0].toString(16).padStart(2, '0') +
    hashArray[1].toString(16).padStart(2, '0')
}

/**
 * @typedef {'sponsor' | 'selfpromo' | 'interaction' | 'intro' | 'outro' | 'preview' | 'music_offtopic' | 'filler'} SponsorBlockCategory
 */

/**
 * @param {string} videoId
 * @param {SponsorBlockCategory[]} categories
 * @returns {Promise<{
 *   UUID: string,
 *   actionType: string,
 *   category: SponsorBlockCategory,
 *   description: string,
 *   locked: 1|0,
 *   segment: [
 *     number,
 *     number
 *   ],
 *   videoDuration: number,
 *   votes: number
 * }[]>}
 */
export async function sponsorBlockSkipSegments(videoId, categories) {
  if (circuitOpen('SponsorBlock')) {
    return []
  }

  const videoIdHashPrefix = await getVideoHash(videoId)
  const requestUrl = `${store.getters.getSponsorBlockUrl}/api/skipSegments/${videoIdHashPrefix}?categories=${JSON.stringify(categories)}`

  try {
    const response = await fetch(requestUrl)

    // 404 means that there are no segments registered for the video
    if (response.status === 404) {
      recordSuccess('SponsorBlock')
      return []
    }

    // Sometimes the sponsor block server goes down or returns other errors
    if (!response.ok) {
      throw new Error(await response.text())
    }

    const json = await response.json()
    recordSuccess('SponsorBlock')
    return json
      .filter((result) => result.videoID === videoId)
      .flatMap((result) => result.segments)
  } catch (error) {
    recordFailure('SponsorBlock')
    console.error('failed to fetch SponsorBlock segments', requestUrl, error)
    throw error
  }
}

export async function deArrowData(videoId) {
  if (circuitOpen('DeArrow')) {
    return undefined
  }

  const videoIdHashPrefix = await getVideoHash(videoId)
  const requestUrl = `${store.getters.getSponsorBlockUrl}/api/branding/${videoIdHashPrefix}`

  try {
    const response = await fetch(requestUrl)

    // 404 means that there are no segments registered for the video
    if (response.status === 404) {
      recordSuccess('DeArrow')
      return undefined
    }

    const json = await response.json()
    recordSuccess('DeArrow')
    return json[videoId] ?? undefined
  } catch (error) {
    recordFailure('DeArrow')
    console.error('failed to fetch DeArrow data', requestUrl, error)
    throw error
  }
}

export async function deArrowThumbnail(videoId, timestamp) {
  if (circuitOpen('DeArrowThumbnail')) {
    return undefined
  }

  let requestUrl = `${store.getters.getDeArrowThumbnailGeneratorUrl}/api/v1/getThumbnail?videoID=` + videoId
  if (timestamp != null) {
    requestUrl += `&time=${timestamp}`
  }

  try {
    const response = await fetch(requestUrl)

    // 204 means that there are no thumbnails found for the video
    if (response.status === 204) {
      recordSuccess('DeArrowThumbnail')
      return undefined
    }

    if (response.ok) {
      recordSuccess('DeArrowThumbnail')
      return response.url
    }

    // this usually means that a thumbnail was not generated on the server yet so we'll log the error but otherwise ignore it.
    const json = await response.json()
    console.error(json)
    return undefined
  } catch (error) {
    recordFailure('DeArrowThumbnail')
    console.error('failed to fetch DeArrow data', requestUrl, error)
    throw error
  }
}
