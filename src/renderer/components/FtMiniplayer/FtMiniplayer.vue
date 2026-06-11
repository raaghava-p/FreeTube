<template>
  <Teleport to="body">
    <div
      v-if="isEnabled"
      class="miniplayer"
    >
      <div class="miniplayerHeader">
        <span class="miniplayerTitle">{{ title }}</span>
        <button
          class="miniplayerClose"
          :title="$t('Close')"
          @click="closeMiniplayer"
        >
          <font-awesome-icon :icon="['fas', 'times']" />
        </button>
      </div>
      <div
        v-if="!hasError"
        class="miniplayerVideo"
        role="button"
        tabindex="0"
        @click="expandMiniplayer"
        @keydown.enter="expandMiniplayer"
      >
        <!-- eslint-disable-next-line vuejs-accessibility/media-has-caption -->
        <video
          ref="video"
          class="miniplayerVideoElement"
          @ended="handleVideoEnded"
        />
      </div>
      <div
        v-else
        class="miniplayerError"
      >
        {{ errorMessage }}
      </div>
      <div class="miniplayerControls">
        <button
          class="miniplayerButton"
          :title="$t('Tooltips.Miniplayer.Play/Pause')"
          @click="togglePlay"
        >
          <font-awesome-icon :icon="isPaused ? ['fas', 'play'] : ['fas', 'pause']" />
        </button>
        <button
          v-if="canPlayPrevious"
          class="miniplayerButton"
          :title="$t('Video.Playing Previous Video')"
          @click="playPrevious"
        >
          <font-awesome-icon :icon="['fas', 'step-backward']" />
        </button>
        <button
          v-if="canPlayNext"
          class="miniplayerButton"
          :title="$t('Video.Playing Next Video')"
          @click="playNext"
        >
          <font-awesome-icon :icon="['fas', 'step-forward']" />
        </button>
        <button
          class="miniplayerButton"
          :title="$t('Tooltips.Miniplayer.Expand')"
          @click="expandMiniplayer"
        >
          <font-awesome-icon :icon="['fas', 'expand']" />
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script src="./FtMiniplayer.js" />
<style src="./FtMiniplayer.css" />
