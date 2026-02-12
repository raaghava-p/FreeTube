<template>
  <ft-card class="relative">
    <div>
      <h3 class="queueTitle">
        {{ $t('Video.Queue') }}
      </h3>

      <span class="queueIndex">
        {{ currentQueueIndexOneBased }} / {{ queueLength }}
      </span>

      <div class="queueButtons">
        <button
          class="queueButton"
          :class="{ queueButtonActive: autoplayQueue }"
          :aria-label="$t('Video.Autoplay Queue')"
          :aria-pressed="autoplayQueue"
          :title="$t('Video.Autoplay Queue')"
          @click="handleToggleAutoplayQueue"
        >
          <font-awesome-icon
            class="queueIcon"
            :icon="['fas', 'play']"
          />
        </button>

        <button
          class="queueButton"
          :aria-label="$t('Video.Clear Queue')"
          :title="$t('Video.Clear Queue')"
          @click="handleClearQueue"
        >
          <font-awesome-icon
            class="queueIcon"
            :icon="['fas', 'trash']"
          />
        </button>
      </div>

      <div
        ref="queueItemsWrapper"
        class="queueItemsWrapper"
      >
        <ft-list-video-numbered
          v-for="(item, index) in queueItems"
          :key="item.queueItemId"
          ref="queueItem"
          class="queueItem"
          :data="item"
          :video-index="index"
          :is-current-video="currentQueueIndex === index"
          appearance="watchPlaylistItem"
          :can-move-video-up="index > 0"
          :can-move-video-down="index < queueItems.length - 1"
          :can-remove-from-playlist="true"
          @pause-player="$emit('pause-player')"
          @move-video-up="moveVideoUp(index)"
          @move-video-down="moveVideoDown(index)"
          @remove-from-playlist="removeFromQueue(item.queueItemId)"
        />
      </div>
    </div>
  </ft-card>
</template>

<script src="./watch-video-queue.js" />
<style scoped src="./watch-video-queue.css" />
