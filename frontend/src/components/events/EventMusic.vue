<script setup>
import { ref, watch, onMounted, onUnmounted } from "vue";

const props = defineProps({
  src: String,        // URL nhạc (đổi theo event)
  enabled: Boolean,   // event có bật hay không
});

const audio = ref(null);
const unlocked = ref(false);

/**
 * Unlock + play (autoplay-safe)
 */
async function unlockAndPlay() {
  if (!audio.value || unlocked.value || !props.enabled || !props.src) return;

  audio.value.volume = 0.35;
  audio.value.loop = true;

  try {
    await audio.value.play();
    unlocked.value = true;
  } catch {
    // Chrome sẽ cho phép sau interaction tiếp theo
  }
}

/**
 * 🔑 Unlock ngay khi component mount
 * (chỉ mount 1 lần trong App.vue)
 */
onMounted(() => {
  window.addEventListener("click", unlockAndPlay);
});

/**
 * Khi đổi src (đổi event) → phát lại nhạc mới
 */
watch(
  () => props.src,
  async (newSrc) => {
    if (!audio.value) return;

    audio.value.pause();
    audio.value.currentTime = 0;
    unlocked.value = false;

    if (newSrc && props.enabled) {
      // chờ tick nhỏ để src apply xong
      setTimeout(unlockAndPlay, 0);
    }
  }
);

/**
 * Khi disable event
 */
watch(
  () => props.enabled,
  (on) => {
    if (!audio.value) return;

    if (!on) {
      audio.value.pause();
      audio.value.currentTime = 0;
      unlocked.value = false;
    }
  }
);

onUnmounted(() => {
  audio.value?.pause();
});
</script>

<template>
  <!-- audio KHÔNG hiển thị UI -->
  <audio ref="audio" :src="src" preload="auto" />
</template>
