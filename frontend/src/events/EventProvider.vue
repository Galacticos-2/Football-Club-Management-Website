<script setup>
import { ref, watch, onMounted, onUnmounted, computed } from "vue";
import { useEvent, loadActiveEvent } from "./useEvent";

/* ===== CHRISTMAS UI ===== */
import SnowEffect from "@/components/events/christmas/SnowEffect.vue";
import ChristmasBanner from "@/components/events/christmas/ChristmasBanner.vue";
import ChristmasSides from "@/components/events/christmas/ChristmasSides.vue";
import ChristmasLights from "@/components/events/christmas/ChristmasLights.vue";
import ChristmasGiftBox from "@/components/events/christmas/ChristmasGiftBox.vue";

/* ===== BIRTHDAY UI ===== */
import BirthdaySides from "@/components/events/birthday/BirthdaySides.vue";
import BirthdayBanner from "@/components/events/birthday/BirthdayBanner.vue";
import BalloonEffect from "@/components/events/birthday/BalloonEffect.vue";

/* =========================
   GLOBAL EVENT STATE
========================= */
const { activeEvent } = useEvent();

/* =========================
   BIRTHDAY UI STATE
========================= */
const showBirthdayBanner = ref(
  localStorage.getItem("birthday_banner_closed") !== "1"
);

const isBirthday = computed(
  () => activeEvent.value?.enabled && activeEvent.value.key === "birthday"
);

/* =========================
   CHRISTMAS UI STATE
========================= */
const isChristmas = computed(
  () => activeEvent.value?.enabled && activeEvent.value.key === "christmas"
);

const snowEnabled = computed(
  () => isChristmas.value && activeEvent.value?.config?.snow
);

/* =========================
   LOAD EVENT ON MOUNT
========================= */
onMounted(async () => {
  await loadActiveEvent();
});

/* =========================
   WATCH EVENT CHANGES
========================= */
watch(activeEvent, (ev) => {
  if (!ev?.enabled) return;

  if (ev.key === "birthday") {
    // Reset dismiss khi admin bật birthday
    localStorage.removeItem("birthday_banner_closed");
    showBirthdayBanner.value = true;
  }
});
</script>

<template>
  <!-- 🎂 BIRTHDAY -->
  <BirthdayBanner
    v-if="isBirthday && showBirthdayBanner"
    @close="showBirthdayBanner = false"
  />

  <BalloonEffect v-if="isBirthday" />
  <BirthdaySides v-if="isBirthday" />

  <!-- 🎄 CHRISTMAS -->
  <ChristmasBanner v-if="isChristmas" />
  <ChristmasGiftBox v-if="isChristmas" />
  <ChristmasLights v-if="isChristmas" />
  <component v-if="snowEnabled" :is="SnowEffect" />
  <ChristmasSides v-if="isChristmas" />

  <!-- ⚽ MAIN CONTENT -->
  <slot />
</template>
