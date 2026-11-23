<template>
  <div class="birthday-sides">
    <!-- Left cake -->
    <img
      class="side-img left"
      src="@/assets/sinhnhat.png"
      alt="Birthday cake left"
    />

    <!-- Right cake -->
    <img
      class="side-img right"
      src="@/assets/sinhnhat.png"
      alt="Birthday cake right"
    />
  </div>
</template>

<script setup>
// purely decorative component
</script>

<style scoped>
.birthday-sides {
  pointer-events: none;
}

/* ===== COMMON ===== */
.side-img {
  position: fixed;
  top: 50%;
  transform: translateY(-50%);
  width: 180px;
  height: auto;
  z-index: 900;
  opacity: 0.95;

  transform-origin: center bottom; /* 👈 lắc quanh đáy bánh */
}

/* LEFT */
.side-img.left {
  left: -25px;
  animation: cake-sway-left 7s ease-in-out infinite;
}

/* RIGHT */
.side-img.right {
  right: -25px;
  animation: cake-sway-right 6.5s ease-in-out infinite;
}

/* ===== ANIMATION ===== */
@keyframes cake-sway-left {
  0%   { transform: translateY(-50%) rotate(0deg); }
  25%  { transform: translateY(-50%) rotate(2deg); }
  50%  { transform: translateY(-50%) rotate(0deg); }
  75%  { transform: translateY(-50%) rotate(-2deg); }
  100% { transform: translateY(-50%) rotate(0deg); }
}

@keyframes cake-sway-right {
  0%   { transform: translateY(-50%) rotate(0deg); }
  25%  { transform: translateY(-50%) rotate(-2.5deg); }
  50%  { transform: translateY(-50%) rotate(0deg); }
  75%  { transform: translateY(-50%) rotate(2.5deg); }
  100% { transform: translateY(-50%) rotate(0deg); }
}

/* ===== RESPONSIVE ===== */
@media (max-width: 992px) {
  .side-img {
    width: 140px;
  }
}

@media (max-width: 576px) {
  .side-img {
    display: none;
  }
}

</style>
