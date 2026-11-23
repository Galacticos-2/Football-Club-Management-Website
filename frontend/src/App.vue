<!-- src/App.vue -->
<script setup>
import { ref, onMounted, computed } from 'vue'
import { RouterView } from 'vue-router'
import NavBar from '@/components/NavBar.vue'
import FooterBar from '@/components/FooterBar.vue'
import ToastHost from '@/components/ToastHost.vue'
import EventProvider from "@/events/EventProvider.vue";
import EventMusic from "@/components/events/EventMusic.vue";
import { useEvent } from "@/events/useEvent";
// 🔥 1) STATE THEME GLOBAL
// =========================================
const theme = ref(localStorage.getItem("theme") || "light")

// 🔥 2) Áp theme vào <html> khi load
onMounted(() => {
  document.documentElement.setAttribute("data-bs-theme", theme.value)
})

// 🔥 3) Hàm chuyển đổi Light ↔ Dark
function toggleTheme() {
  theme.value = theme.value === "light" ? "dark" : "light"
  document.documentElement.setAttribute("data-bs-theme", theme.value)
  localStorage.setItem("theme", theme.value)
}
const { activeEvent } = useEvent();

/**
 * 🔊 Ghép URL nhạc từ backend
 */
const musicSrc = computed(() => {
  if (!activeEvent.value?.music_url) return null;
  const base = import.meta.env.VITE_API_BASE.replace("/api", "");
  return base + activeEvent.value.music_url;
});

</script>


<template>
  <EventProvider>
    <!-- 🔊 EVENT MUSIC (LUÔN MOUNT) -->
    <EventMusic
      :enabled="!!activeEvent?.music_enabled"
      :src="musicSrc"
    />

    <!-- Navbar cố định -->
    <NavBar :theme="theme" @toggle-theme="toggleTheme" />

    <!-- Nội dung chính -->
    <main class="app-content">
      <RouterView />
      <FooterBar />
    </main>

    <!-- Toast notifications -->
    <ToastHost />
  </EventProvider>
</template>


<style scoped>
/* Bù đúng chiều cao thực tế của navbar (~56px) */
.app-content {
  padding-top: 56px;
}
</style>

<style>
html,
body {
  margin: 0;
  padding: 0;
}

/* Navbar full width + viền mỏng dưới cho nền trắng */
.navbar {
  width: 100%;
  left: 0;
  right: 0;
  top: 0;
  z-index: 1030;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}
/* ================================
   🔥 Dark Mode – Page Section Headers
===================================*/
html[data-bs-theme="dark"] .section-header,
html[data-bs-theme="dark"] .players-section,
html[data-bs-theme="dark"] .news-section-header {
  background: #1e1e1e !important;
  color: #e5e5e5 !important;
}





</style>
