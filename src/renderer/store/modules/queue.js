import { generateRandomUniqueId } from '../../helpers/playlists'
import { showToast } from '../../helpers/utils'
import i18n from '../../i18n/index'

const state = {
  queueItems: [],
  currentQueueIndex: -1,
  autoplayQueue: true
}

const getters = {
  getQueueItems: (state) => state.queueItems,

  getQueueLength: (state) => state.queueItems.length,

  hasQueue: (state) => state.queueItems.length > 0,

  getCurrentQueueIndex: (state) => state.currentQueueIndex,

  isPlayingFromQueue: (state) => state.currentQueueIndex >= 0 && state.currentQueueIndex < state.queueItems.length,

  getCurrentQueueItem: (state) => {
    if (state.currentQueueIndex >= 0 && state.currentQueueIndex < state.queueItems.length) {
      return state.queueItems[state.currentQueueIndex]
    }
    return null
  },

  getNextQueueItem: (state) => {
    const nextIndex = state.currentQueueIndex + 1
    if (nextIndex < state.queueItems.length) {
      return state.queueItems[nextIndex]
    }
    return null
  },

  getPreviousQueueItem: (state) => {
    const prevIndex = state.currentQueueIndex - 1
    if (prevIndex >= 0) {
      return state.queueItems[prevIndex]
    }
    return null
  },

  canPlayNextInQueue: (state) => {
    return state.currentQueueIndex < state.queueItems.length - 1
  },

  canPlayPreviousInQueue: (state) => {
    return state.currentQueueIndex > 0
  },

  getAutoplayQueue: (state) => state.autoplayQueue,

  isVideoInQueue: (state) => (videoId) => {
    return state.queueItems.some(item => item.videoId === videoId)
  }
}

const actions = {
  addToQueue({ commit }, videoData) {
    const queueVideo = {
      videoId: videoData.videoId,
      title: videoData.title,
      author: videoData.author,
      authorId: videoData.authorId,
      lengthSeconds: videoData.lengthSeconds,
      timeAdded: Date.now(),
      queueItemId: generateRandomUniqueId(),
      type: 'video'
    }

    commit('addToQueue', queueVideo)
    showToast(i18n.global.t('Video.Video added to queue'))
  },

  addVideosToQueue({ commit }, videos) {
    const queueVideos = videos.map(video => ({
      videoId: video.videoId,
      title: video.title,
      author: video.author,
      authorId: video.authorId,
      lengthSeconds: video.lengthSeconds,
      timeAdded: Date.now(),
      queueItemId: generateRandomUniqueId(),
      type: 'video'
    }))

    commit('addVideosToQueue', queueVideos)
    showToast(i18n.global.t('Video.Videos added to queue', { count: videos.length }))
  },

  removeFromQueue({ commit, state }, queueItemId) {
    const exists = state.queueItems.some(item => item.queueItemId === queueItemId)

    if (exists) {
      commit('removeFromQueue', { queueItemId })
      showToast(i18n.global.t('Video.Video removed from queue'))
    }
  },

  clearQueue({ commit }) {
    commit('clearQueue')
    showToast(i18n.global.t('Video.Queue cleared'))
  },

  setCurrentQueueIndex({ commit }, index) {
    commit('setCurrentQueueIndex', index)
  },

  playFromQueue({ commit, state }, videoId) {
    const index = state.queueItems.findIndex(item => item.videoId === videoId)
    if (index !== -1) {
      commit('setCurrentQueueIndex', index)
    }
  },

  playNextInQueue({ commit, state }) {
    if (state.currentQueueIndex < state.queueItems.length - 1) {
      commit('setCurrentQueueIndex', state.currentQueueIndex + 1)
    }
  },

  playPreviousInQueue({ commit, state }) {
    if (state.currentQueueIndex > 0) {
      commit('setCurrentQueueIndex', state.currentQueueIndex - 1)
    }
  },

  moveQueueItem({ commit }, { fromIndex, toIndex }) {
    commit('moveQueueItem', { fromIndex, toIndex })
  },

  toggleAutoplayQueue({ commit, state }) {
    commit('setAutoplayQueue', !state.autoplayQueue)
  }
}

const mutations = {
  addToQueue(state, videoData) {
    state.queueItems.push(videoData)
  },

  addVideosToQueue(state, videos) {
    state.queueItems.push(...videos)
  },

  removeFromQueue(state, { queueItemId }) {
    const index = state.queueItems.findIndex(item => item.queueItemId === queueItemId)
    if (index === -1) return

    state.queueItems.splice(index, 1)

    // Adjust currentQueueIndex based on where the removed item was
    if (state.queueItems.length === 0) {
      state.currentQueueIndex = -1
    } else if (index < state.currentQueueIndex) {
      state.currentQueueIndex--
    } else if (index === state.currentQueueIndex) {
      // Now points to what was the next item; clamp if we removed the last item
      if (state.currentQueueIndex >= state.queueItems.length) {
        state.currentQueueIndex = state.queueItems.length - 1
      }
    }
  },

  clearQueue(state) {
    state.queueItems = []
    state.currentQueueIndex = -1
  },

  setCurrentQueueIndex(state, index) {
    if (index === -1 || (index >= 0 && index < state.queueItems.length)) {
      state.currentQueueIndex = index
    }
  },

  moveQueueItem(state, { fromIndex, toIndex }) {
    const len = state.queueItems.length
    // Bounds check
    if (fromIndex < 0 || fromIndex >= len || toIndex < 0 || toIndex >= len || fromIndex === toIndex) {
      return
    }

    const item = state.queueItems.splice(fromIndex, 1)[0]
    state.queueItems.splice(toIndex, 0, item)

    // Adjust currentQueueIndex if the currently playing item was moved
    if (state.currentQueueIndex === fromIndex) {
      state.currentQueueIndex = toIndex
    } else if (fromIndex < state.currentQueueIndex && toIndex >= state.currentQueueIndex) {
      state.currentQueueIndex--
    } else if (fromIndex > state.currentQueueIndex && toIndex <= state.currentQueueIndex) {
      state.currentQueueIndex++
    }
  },

  setAutoplayQueue(state, value) {
    state.autoplayQueue = value
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
