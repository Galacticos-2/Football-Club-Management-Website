// src/events/useGreeting.js
import { ref } from "vue";
import api from "@/api/api.js";

export function useGreeting() {
  const greetingMessage = ref(null);
  const loading = ref(false);

  async function loadGreeting(eventKey) {
    if (loading.value) return;

    loading.value = true;
    try {
      const res = await api.get(`/events/${eventKey}/random-greeting`);
      greetingMessage.value = res.data?.message ?? null;
    } catch (err) {
      console.error("Failed to load greeting", err);
      greetingMessage.value = null;
    } finally {
      loading.value = false;
    }
  }

  function resetGreeting() {
    greetingMessage.value = null;
  }

  return {
    greetingMessage,
    loadGreeting,
    resetGreeting,
  };
}
