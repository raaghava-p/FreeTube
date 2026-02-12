import { defineComponent } from 'vue'
import { mapActions, mapGetters } from 'vuex'
import FtCard from '../ft-card/ft-card.vue'
import FtListVideoNumbered from '../FtListVideoNumbered/FtListVideoNumbered.vue'
import { showToast } from '../../helpers/utils'

export default defineComponent({
  name: 'WatchVideoQueue',
  components: {
    'ft-card': FtCard,
    'ft-list-video-numbered': FtListVideoNumbered
  },
  props: {
    videoId: {
      type: String,
      required: true
    }
  },
  emits: ['pause-player'],
  computed: {
    ...mapGetters([
      'getQueueItems',
      'getCurrentQueueIndex',
      'getAutoplayQueue',
      'getQueueLength',
      'canPlayNextInQueue',
      'canPlayPreviousInQueue'
    ]),

    queueItems() {
      return this.getQueueItems
    },

    currentQueueIndex() {
      return this.getCurrentQueueIndex
    },

    currentQueueIndexOneBased() {
      return this.currentQueueIndex >= 0 ? this.currentQueueIndex + 1 : 0
    },

    queueLength() {
      return this.getQueueLength
    },

    autoplayQueue() {
      return this.getAutoplayQueue
    },

    shouldStopDueToQueueEnd() {
      return !this.canPlayNextInQueue
    }
  },

  watch: {
    videoId(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.updateCurrentQueuePosition()
      }
    },

    currentQueueIndex() {
      this.scrollToCurrentVideo()
    }
  },

  mounted() {
    this.updateCurrentQueuePosition()
    this.scrollToCurrentVideo()

    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('nexttrack', this.playNextVideo)
      navigator.mediaSession.setActionHandler('previoustrack', this.playPreviousVideo)
    }
  },

  beforeUnmount() {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('nexttrack', null)
      navigator.mediaSession.setActionHandler('previoustrack', null)
    }
  },

  methods: {
    ...mapActions([
      'removeFromQueue',
      'clearQueue',
      'setCurrentQueueIndex',
      'playNextInQueue',
      'playPreviousInQueue',
      'moveQueueItem',
      'toggleAutoplayQueue'
    ]),

    updateCurrentQueuePosition() {
      const index = this.queueItems.findIndex(item => item.videoId === this.videoId)
      // Always update index - if not found, -1 indicates not playing from queue
      this.setCurrentQueueIndex(index)
    },

    playNextVideo() {
      if (!this.canPlayNextInQueue) {
        showToast(this.$t('Video.Queue ended'))
        return
      }

      const nextIndex = this.currentQueueIndex + 1
      const nextItem = this.queueItems[nextIndex]

      this.playNextInQueue()

      if (nextItem) {
        this.$router.push({
          path: `/watch/${nextItem.videoId}`,
          query: { fromQueue: 'true' }
        })
        showToast(this.$t('Video.Playing Next Video'))
      }
    },

    playPreviousVideo() {
      if (!this.canPlayPreviousInQueue) {
        showToast(this.$t('Video.Beginning of queue'))
        return
      }

      const prevIndex = this.currentQueueIndex - 1
      const prevItem = this.queueItems[prevIndex]

      this.playPreviousInQueue()

      if (prevItem) {
        this.$router.push({
          path: `/watch/${prevItem.videoId}`,
          query: { fromQueue: 'true' }
        })
        showToast(this.$t('Video.Playing Previous Video'))
      }
    },

    handleClearQueue() {
      this.clearQueue()
    },

    handleToggleAutoplayQueue() {
      this.toggleAutoplayQueue()

      if (this.autoplayQueue) {
        showToast(this.$t('Video.Player.Autoplay is on'))
      } else {
        showToast(this.$t('Video.Player.Autoplay is off'))
      }
    },

    moveVideoUp(index) {
      if (index > 0) {
        this.moveQueueItem({ fromIndex: index, toIndex: index - 1 })
        this.scrollToCurrentVideo()
      }
    },

    moveVideoDown(index) {
      if (index < this.queueItems.length - 1) {
        this.moveQueueItem({ fromIndex: index, toIndex: index + 1 })
        this.scrollToCurrentVideo()
      }
    },

    scrollToCurrentVideo() {
      this.$nextTick(() => {
        const item = this.$refs.queueItem?.[this.currentQueueIndex]
        if (this.currentQueueIndex >= 0 && item?.$el) {
          item.$el.scrollIntoView({
            block: 'nearest'
          })
        }
      })
    },

    pausePlayer() {
      this.$emit('pause-player')
    }
  }
})
