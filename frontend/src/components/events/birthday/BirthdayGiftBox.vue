<template>
  <!-- 🎂 Trigger -->
  <div
    v-if="isBirthday"
    class="birthday-gift-box"
    @click="openGreeting"
  >
    🎂 Happy Birthday from Real Madrid
  </div>

  <!-- 🎂 Animation (CHỈ mở khi click) -->
  <BirthdayGiftAnimation
    v-if="showModal"
    :message="greetingMessage"
    @close="handleClose"
  />
</template>

<script setup>
import { ref, computed,  onMounted, onBeforeUnmount } from "vue";
import { useEvent } from "@/events/useEvent";
import { useGreeting } from "@/events/useGreeting";
import BirthdayGiftAnimation from "./BirthdayGiftAnimation.vue";

const { activeEvent } = useEvent();
const { greetingMessage, loadGreeting, resetGreeting } = useGreeting();

const showModal = ref(false);

const isBirthday = computed(() =>
  activeEvent.value?.enabled === true &&
  activeEvent.value?.key === "birthday"
);
onMounted(() => {
  resetGreeting();
  showModal.value = false;
});

onBeforeUnmount(() => {
  resetGreeting();
});

async function openGreeting() {
  await loadGreeting("birthday");
  showModal.value = true;
}

function handleClose() {
  showModal.value = false;
  resetGreeting();
}
</script>


<style scoped>
/* 🎂 Birthday Gift Box — PILL BUTTON */
.birthday-gift-box {
  display: inline-flex;
  align-items: center;
  gap: 8px;

  background: linear-gradient(90deg, #ff6fae, #ff9acb);
  color: #ffffff;

  padding: 12px 26px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.95rem;

  cursor: pointer;
  user-select: none;

  box-shadow: 0 6px 22px rgba(255, 111, 174, 0.45);

  /* 🎈 Attention animation */
  animation: birthday-float 3s ease-in-out infinite;

  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    opacity 0.15s ease;
}

.birthday-gift-box:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(255, 111, 174, 0.6);
  opacity: 0.95;
}

.birthday-gift-box:active {
  transform: scale(0.97);
}

/* 🎈 Float nhẹ (khác Christmas shake) */
@keyframes birthday-float {
  0%   { transform: translateY(0); }
  50%  { transform: translateY(-4px); }
  100% { transform: translateY(0); }
}
</style>
