const state = {
  isEnabled: false,
  videoId: null,
  currentTime: 0,
  videoData: null
}

const getters = {
  getMiniplayerEnabled: (state) => state.isEnabled,
  getMiniplayerVideoId: (state) => state.videoId,
  getMiniplayerCurrentTime: (state) => state.currentTime,
  getMiniplayerVideoData: (state) => state.videoData
}

const actions = {
  enableMiniplayer({ commit }, { videoId, currentTime, videoData }) {
    commit('setMiniplayerEnabled', true)
    commit('setMiniplayerVideoId', videoId)
    commit('setMiniplayerCurrentTime', currentTime)
    commit('setMiniplayerVideoData', videoData)
  },

  disableMiniplayer({ commit }) {
    commit('setMiniplayerEnabled', false)
    commit('setMiniplayerVideoId', null)
    commit('setMiniplayerCurrentTime', 0)
    commit('setMiniplayerVideoData', null)
  },

  updateMiniplayerTime({ commit }, currentTime) {
    commit('setMiniplayerCurrentTime', currentTime)
  }
}

const mutations = {
  setMiniplayerEnabled(state, value) {
    state.isEnabled = value
  },

  setMiniplayerVideoId(state, videoId) {
    state.videoId = videoId
  },

  setMiniplayerCurrentTime(state, currentTime) {
    state.currentTime = currentTime
  },

  setMiniplayerVideoData(state, videoData) {
    state.videoData = videoData
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
