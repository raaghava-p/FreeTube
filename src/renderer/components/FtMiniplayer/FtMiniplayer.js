import { defineComponent } from 'vue'
import { mapActions, mapGetters } from 'vuex'
import { loadVideoInMiniplayer } from '../../helpers/miniplayer'

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

      if (newVal) {
        document.addEventListener('keydown', this.handleEscape)
      } else {
        document.removeEventListener('keydown', this.handleEscape)
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
  beforeUnmount() {
    document.removeEventListener('keydown', this.handleEscape)
  },
  methods: {
    ...mapActions([
      'disableMiniplayer',
      'playNextInQueue',
      'playPreviousInQueue'
    ]),

    handleEscape(event) {
      // matches YouTube: Esc closes the miniplayer,
      // unless the user is typing somewhere
      const tagName = event.target.tagName

      if (event.key === 'Escape' && tagName !== 'INPUT' && tagName !== 'TEXTAREA') {
        this.closeMiniplayer()
      }
    },

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

          // matches YouTube: the first "Add to queue" opens the miniplayer
          // ready to play, but paused
          if (this.videoData.autoplay === false) {
            this.isPaused = true
            return
          }

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
      const nextItem = this.$store.getters.getCurrentQueueItem

      if (nextItem) {
        // play within the miniplayer, like YouTube, instead of navigating away
        await loadVideoInMiniplayer(nextItem)
      }
    },

    async playPrevious() {
      if (!this.canPlayPrevious) return

      await this.playPreviousInQueue()
      const prevItem = this.$store.getters.getCurrentQueueItem

      if (prevItem) {
        await loadVideoInMiniplayer(prevItem)
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
