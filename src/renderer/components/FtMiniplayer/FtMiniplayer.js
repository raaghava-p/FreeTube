import { defineComponent } from 'vue'
import { mapActions, mapGetters } from 'vuex'

export default defineComponent({
  name: 'FtMiniplayer',
  data() {
    return {
      isPaused: false,
      hlsPlayer: null,
      hasError: false,
      errorMessage: ''
    }
  },
  computed: {
    ...mapGetters([
      'getMiniplayerEnabled',
      'getMiniplayerVideoId',
      'getMiniplayerVideoData',
      'getMiniplayerCurrentTime',
      'canPlayNextInQueue',
      'canPlayPreviousInQueue',
      'getAutoplayQueue'
    ]),

    isEnabled() {
      return this.getMiniplayerEnabled
    },

    videoId() {
      return this.getMiniplayerVideoId
    },

    videoData() {
      return this.getMiniplayerVideoData
    },

    title() {
      return this.videoData?.title || ''
    },

    canPlayNext() {
      return this.canPlayNextInQueue
    },

    canPlayPrevious() {
      return this.canPlayPreviousInQueue
    }
  },
  watch: {
    isEnabled(newVal) {
      if (newVal && this.videoData) {
        this.hasError = false
        this.errorMessage = ''
        this.$nextTick(() => {
          this.initPlayer()
        })
      }
    },

    videoId() {
      if (this.isEnabled && this.videoData) {
        this.hasError = false
        this.errorMessage = ''
        this.$nextTick(() => {
          this.initPlayer()
        })
      }
    }
  },
  methods: {
    ...mapActions([
      'disableMiniplayer',
      'playNextInQueue',
      'playPreviousInQueue'
    ]),

    async initPlayer() {
      try {
        const video = this.$refs.video
        if (!video) {
          console.warn('Miniplayer: video element not found')
          return
        }

        if (!this.videoData) {
          console.warn('Miniplayer: no video data')
          this.hasError = true
          this.errorMessage = 'No video data available'
          return
        }

        // Use the stored stream URL if available
        if (this.videoData.streamUrl) {
          video.src = this.videoData.streamUrl
          video.currentTime = this.getMiniplayerCurrentTime || 0
          try {
            await video.play()
            this.isPaused = false
          } catch (e) {
            console.error('Miniplayer autoplay failed:', e)
            this.isPaused = true
          }
        } else {
          console.warn('Miniplayer: no stream URL')
          this.hasError = true
          this.errorMessage = 'Video stream not available'
        }
      } catch (err) {
        console.error('Miniplayer initialization error:', err)
        this.hasError = true
        this.errorMessage = 'Failed to initialize player'
      }
    },

    togglePlay() {
      const video = this.$refs.video
      if (!video) return

      if (video.paused) {
        video.play()
        this.isPaused = false
      } else {
        video.pause()
        this.isPaused = true
      }
    },

    handleVideoEnded() {
      if (this.getAutoplayQueue && this.canPlayNext) {
        this.playNext()
      }
    },

    async playNext() {
      if (!this.canPlayNext) return

      await this.playNextInQueue()
      // Navigate to next video in queue
      const queueItems = this.$store.getters.getQueueItems
      const currentIndex = this.$store.getters.getCurrentQueueIndex
      const nextItem = queueItems[currentIndex]

      if (nextItem) {
        this.$router.push({
          path: `/watch/${nextItem.videoId}`,
          query: { fromQueue: 'true' }
        })
        this.closeMiniplayer()
      }
    },

    async playPrevious() {
      if (!this.canPlayPrevious) return

      await this.playPreviousInQueue()
      const queueItems = this.$store.getters.getQueueItems
      const currentIndex = this.$store.getters.getCurrentQueueIndex
      const prevItem = queueItems[currentIndex]

      if (prevItem) {
        this.$router.push({
          path: `/watch/${prevItem.videoId}`,
          query: { fromQueue: 'true' }
        })
        this.closeMiniplayer()
      }
    },

    expandMiniplayer() {
      // Navigate back to the watch page
      const video = this.$refs.video
      const currentTime = video ? video.currentTime : 0

      this.$router.push({
        path: `/watch/${this.videoId}`,
        query: {
          timestamp: Math.floor(currentTime),
          fromQueue: 'true'
        }
      })
      this.closeMiniplayer()
    },

    closeMiniplayer() {
      const video = this.$refs.video
      if (video) {
        video.pause()
        video.src = ''
      }
      this.disableMiniplayer()
    }
  }
})
