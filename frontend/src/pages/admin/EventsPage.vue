<template>
  <div class="container py-4">
    <h2 class="mb-4">Event Management</h2>

    <table class="table table-hover align-middle">
      <thead class="table-light">
        <tr>
          <th>Event</th>
          <th>Time</th>
          <th>Status</th>
          <th>Music</th>
          <th class="text-end">Action</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="event in events" :key="event.key">
          <td class="fw-semibold">{{ event.name }}</td>

          <td class="text-muted">
            {{ event.startDate }} → {{ event.endDate }}
          </td>

          <td>
            <EventStatusBadge :enabled="event.enabled" />
          </td>

          <!-- 🎵 MUSIC (CHRISTMAS + BIRTHDAY) -->
          <td>
            <div v-if="event.key === 'christmas' || event.key === 'birthday'">
              <input
                type="file"
                accept="audio/mpeg"
                class="form-control form-control-sm mb-1"
                :disabled="event.enabled"
                @change="onSelectMusic($event, event.key)"
              />

              <small v-if="event.musicUploaded" class="text-success">
                🎵 Music uploaded
              </small>

              <small
                v-else-if="selectedMusic[event.key]"
                class="text-muted"
              >
                Selected: {{ selectedMusic[event.key].name }}
              </small>
            </div>
          </td>

          <td class="text-end">
            <button
              class="btn btn-outline-primary btn-sm me-2"
              @click="toggle(event)"
            >
              {{ event.enabled ? "Disable" : "Enable" }}
            </button>

            <button
              v-if="event.key === 'christmas' || event.key === 'birthday'"
              class="btn btn-outline-secondary btn-sm"
              @click="openEdit(event)"
            >
              Greeting
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- GREETING MODALS -->
  <GreetingListModal
    v-if="showGreetingModal && selectedEvent?.key === 'christmas'"
    :eventKey="selectedEvent.key"
    @close="showGreetingModal = false"
  />

  <BirthdayGreetingListModal
    v-if="showGreetingModal && selectedEvent?.key === 'birthday'"
    @close="showGreetingModal = false"
  />
</template>


<script setup>
import { ref, onMounted, watch } from "vue";
import EventStatusBadge from "@/components/admin/EventStatusBadge.vue";
import GreetingListModal from "@/components/admin/GreetingListModal.vue";
import BirthdayGreetingListModal from "@/components/admin/BirthdayGreetingListModal.vue";

import {
  enableEvent,
  disableEvent,
  uploadEventMusic,
} from "@/api/events.api";

import { useEvent, loadActiveEvent } from "@/events/useEvent";

const { activeEvent } = useEvent();

/**
 * Selected music per event
 * {
 *   christmas: File,
 *   birthday: File
 * }
 */
const selectedMusic = ref({});

/**
 * Local admin list
 */
const events = ref([
  {
    key: "christmas",
    name: "Christmas",
    startDate: "2025-12-24",
    endDate: "2025-12-25",
    enabled: false,
    musicUploaded: false,
  },
  {
    key: "newyear",
    name: "New Year",
    startDate: "2025-12-31",
    endDate: "2026-01-01",
    enabled: false,
  },
  {
    key: "birthday",
    name: "Birthday",
    startDate: "-",
    endDate: "-",
    enabled: false,
    musicUploaded: false,
  },
]);

/**
 * Toggle event
 */
async function toggle(event) {
  try {
    if (!event.enabled) {
      // Upload music if exists
      if (selectedMusic.value[event.key]) {
        const form = new FormData();
        form.append("music", selectedMusic.value[event.key]);
        form.append("eventKey", event.key);

        await uploadEventMusic(event.key, form);

        event.musicUploaded = true;
        selectedMusic.value[event.key] = null;
      }

      await enableEvent(event.key);
    } else {
      await disableEvent();
    }

    await loadActiveEvent();
  } catch (err) {
    console.error("Toggle event failed:", err);
    alert("Failed to toggle event");
  }
}

/**
 * Select music file
 */
function onSelectMusic(e, key) {
  const file = e.target.files[0];
  if (!file) return;

  if (file.type !== "audio/mpeg") {
    alert("Only MP3 files are allowed");
    return;
  }

  selectedMusic.value[key] = file;
}

/**
 * Sync on load
 */
onMounted(async () => {
  await loadActiveEvent();

  events.value.forEach((e) => {
    e.enabled = activeEvent.value
      ? e.key === activeEvent.value.key
      : false;

    if (
      activeEvent.value &&
      e.key === activeEvent.value.key &&
      activeEvent.value.music_url
    ) {
      e.musicUploaded = true;
    }
  });
});

/**
 * Sync when activeEvent changes
 */
watch(activeEvent, (ev) => {
  events.value.forEach((e) => {
    e.enabled = ev ? e.key === ev.key : false;
    e.musicUploaded = ev?.key === e.key && !!ev?.music_url;
  });
});

/**
 * Greeting modal
 */
const selectedEvent = ref(null);
const showGreetingModal = ref(false);

function openEdit(event) {
  selectedEvent.value = event;
  showGreetingModal.value = true;
}
</script>

