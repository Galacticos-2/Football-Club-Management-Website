<template>
  <div class="overlay">
    <div class="stage">

      <!-- 🎁 Gift box -->
      <div ref="box" class="gift-box">
        <div ref="lid" class="lid"></div>
        <div class="box-body"></div>
      </div>

      <!-- ✨ Glow -->
      <div ref="glow" class="glow"></div>

      <!-- 💌 Card -->
      <div ref="card" class="invitation-card">
        <div class="invite-header">
          <span class="cake">🎂</span>
          <h2>Happy Birthday</h2>
          <span class="cake">🎂</span>
        </div>

        <div class="invite-body">
          <p class="invite-message">
            {{ message }}
          </p>
        </div>

        <div class="invite-footer">
          <button class="close-btn" @click="$emit('close')">
            Close
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { gsap } from "gsap";

defineProps({
  message: {
    type: String,
    default: ""
  }
});

const box = ref(null);
const lid = ref(null);
const glow = ref(null);
const card = ref(null);

onMounted(() => {
  const tl = gsap.timeline();

  // Initial state
  gsap.set(lid.value, { rotateX: 0 });
  gsap.set(glow.value, { opacity: 0, scale: 0.6 });
  gsap.set(card.value, { opacity: 0, scale: 0.6 });

  tl
    // 1️⃣ Box drops
    .from(box.value, {
      y: -120,
      scale: 0.6,
      opacity: 0,
      duration: 0.6,
      ease: "back.out(1.7)"
    })

    // 2️⃣ Gentle shake (birthday nhẹ hơn)
    .to(box.value, {
      x: -6,
      duration: 0.08,
      yoyo: true,
      repeat: 5
    })

    // 3️⃣ Lid opens
    .to(lid.value, {
      rotateX: -115,
      duration: 0.65,
      ease: "power3.out"
    })

    // 4️⃣ Glow burst
    .to(glow.value, {
      opacity: 1,
      scale: 1.5,
      duration: 0.4,
      ease: "power2.out"
    }, "-=0.25")

    // 5️⃣ Hide box
    .to(box.value, {
      opacity: 0,
      scale: 0.4,
      duration: 0.3,
      ease: "power2.in"
    })

    // 6️⃣ Card appears
    .to(card.value, {
      opacity: 1,
      scale: 1,
      duration: 0.5,
      ease: "back.out(1.6)"
    });
});
</script>

<style scoped>
/* ===== Overlay ===== */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stage {
  position: relative;
  width: 360px;
  height: 360px;
}

/* 🎂 Icon */
.cake {
  font-size: 1.3rem;
  filter: drop-shadow(0 0 6px rgba(255, 180, 200, 0.7));
}

/* 🎁 Gift box */
.gift-box {
  position: absolute;
  top: 40px;
  left: 50%;
  transform: translateX(-50%);
  width: 160px;
  height: 140px;
  transform-style: preserve-3d;
}

.box-body {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #ff8fab, #ffb3c1);
  border-radius: 14px;
}

.lid {
  position: absolute;
  top: -22px;
  width: 100%;
  height: 30px;
  background: linear-gradient(135deg, #ff6f91, #ff8fab);
  border-radius: 10px;
  transform-origin: bottom center;
}

/* ✨ Glow */
.glow {
  position: absolute;
  inset: 40px;
  background: radial-gradient(
    circle,
    rgba(255, 200, 220, 0.9),
    rgba(255, 200, 220, 0.45) 40%,
    transparent 65%
  );
  border-radius: 50%;
  z-index: 0;
}

/* 💌 Card */
.invitation-card {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);

  width: 300px;
  padding: 24px 22px;

  background: linear-gradient(135deg, #ff8fab, #ffb3c1);
  border-radius: 18px;
  color: #fff;
  text-align: center;

  z-index: 2;
  box-shadow: 0 20px 45px rgba(0, 0, 0, 0.45);
  border: 3px solid rgba(255, 255, 255, 0.65);

  display: flex;
  flex-direction: column;
  gap: 14px;
}

.invite-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.invite-header h2 {
  font-size: 1.4rem;
  font-weight: 700;
  margin: 0;
}

.invite-body {
  background: rgba(255, 255, 255, 0.18);
  border-radius: 12px;
  padding: 14px;
}

.invite-message {
  font-size: 0.95rem;
  line-height: 1.5;
  white-space: pre-line;
}

.invite-footer {
  text-align: center;
}

.close-btn {
  background: #ffffff;
  color: #ff5d8f;
  border: none;
  padding: 8px 26px;
  border-radius: 999px;
  font-weight: 700;
  cursor: pointer;
}

.close-btn:hover {
  background: #ffe6ee;
}
</style>
