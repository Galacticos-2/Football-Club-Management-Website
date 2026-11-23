<template>
  <div class="birthday-modal-backdrop" @click.self="emit('close')">
    <div class="birthday-card birthday-lights">
      <h2>🎂 Happy Birthdaysssss 🎂</h2>

      <p class="message">
        {{ message }}
      </p>

      <button class="btn btn-primary mt-3" @click="emit('close')">
        Close
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  message: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["close"]);
</script>

<style scoped>
/* ===== Backdrop ===== */
.birthday-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

/* ===== Card ===== */
.birthday-card {
  position: relative;
  background: #ffffff;
  padding: 28px 32px;
  border-radius: 16px;
  max-width: 420px;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
  z-index: 1;
}

/* ===== Text ===== */
.birthday-card h2 {
  margin-bottom: 12px;
  color: #1f1f1f;
}

.message {
  font-size: 1.05rem;
  line-height: 1.6;
  color: #222;
  margin-top: 12px;
}

/* =====================================================
   🎂 BIRTHDAY LIGHTS – pastel blink (giống christmas)
===================================================== */
.birthday-lights::before,
.birthday-lights::after {
  content: "";
  position: absolute;
  inset: -10px;
  border-radius: 22px;
  pointer-events: none;

  background:
    repeating-linear-gradient(
      90deg,
      transparent 0 10px,
      #ffb3c1 10px 16px
    ),
    repeating-linear-gradient(
      180deg,
      transparent 0 10px,
      #ffd6a5 10px 16px
    ),
    repeating-linear-gradient(
      270deg,
      transparent 0 10px,
      #b5ead7 10px 16px
    ),
    repeating-linear-gradient(
      0deg,
      transparent 0 10px,
      #cdb4db 10px 16px
    );

  background-size:
    100% 5px,
    5px 100%,
    100% 5px,
    5px 100%;

  background-position:
    top left,
    top right,
    bottom right,
    bottom left;

  background-repeat: no-repeat;

  filter:
    drop-shadow(0 0 6px rgba(255, 182, 193, 0.9))
    drop-shadow(0 0 14px rgba(255, 182, 193, 0.9));
}

.birthday-lights::after {
  background-position:
    top 8px left,
    top right 8px,
    bottom 8px right,
    bottom left 8px;
}

/* ===== Animation ===== */
.birthday-lights::before {
  animation: blinkEven 1s infinite steps(1);
}

.birthday-lights::after {
  animation: blinkOdd 1s infinite steps(1);
}

@keyframes blinkEven {
  0%   { opacity: 1; }
  50%  { opacity: 0.2; filter: none; }
  100% { opacity: 1; }
}

@keyframes blinkOdd {
  0%   { opacity: 0.2; filter: none; }
  50%  { opacity: 1; }
  100% { opacity: 0.2; filter: none; }
}
</style>
