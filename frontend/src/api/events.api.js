import api from "@/services/api";

/**
 * Lấy event đang active
 */
export function getActiveEvent() {
  return api.get("/events/active");
}

/**
 * Enable một event theo key
 */
export function enableEvent(key, payload = {}) {
  return api.put(`/events/${key}/enable`, payload);
}

/**
 * Disable toàn bộ event
 */
export function disableEvent() {
  return api.put("/events/disable");
}

/**
 * 🎵 Upload music cho event (christmas / birthday)
 * @param {string} key - event key
 * @param {FormData} formData
 */
export function uploadEventMusic(key, formData) {
  return api.post(`/events/${key}/music`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}
