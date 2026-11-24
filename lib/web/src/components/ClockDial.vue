<script setup>
import { computed, ref } from "vue";

const props = defineProps({
  modelValue: { type: Number, default: 0 },
  label: { type: String, default: "" },
  max: { type: Number, default: 23 }
});
const emit = defineEmits(["update:modelValue", "change"]);

const S = 200;
const C = S / 2;
const R = 82;
const el = ref(null);
let dragging = false;

const hour = computed(() => Math.max(0, Math.min(props.max, Number(props.modelValue) || 0)));
const count = computed(() => (props.max === 23 ? 24 : props.max + 1));

function angleOf(i) {
  return (-90 + (360 / count.value) * i) * (Math.PI / 180);
}

const ticks = computed(() => {
  const list = [];
  for (let i = 0; i < count.value; i++) {
    const a = angleOf(i);
    const major = i % 3 === 0;
    const r1 = R - (major ? 15 : 9);
    const r2 = R;
    list.push({
      i,
      x1: C + Math.cos(a) * r1,
      y1: C + Math.sin(a) * r1,
      x2: C + Math.cos(a) * r2,
      y2: C + Math.sin(a) * r2,
      major
    });
  }
  return list;
});

const pointer = computed(() => {
  const a = angleOf(hour.value);
  return {
    x: C + Math.cos(a) * (R - 8),
    y: C + Math.sin(a) * (R - 8),
    cx: C + Math.cos(a) * 4,
    cy: C + Math.sin(a) * 4
  };
});

function apply(e) {
  const box = el.value;
  if (!box) return;
  const r = box.getBoundingClientRect();
  const dx = e.clientX - (r.left + r.width / 2);
  const dy = e.clientY - (r.top + r.height / 2);
  let deg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
  if (deg < 0) deg += 360;
  const step = 360 / count.value;
  let idx = Math.round(deg / step) % count.value;
  emit("update:modelValue", idx);
}

function down(e) {
  dragging = true;
  try { e.target.setPointerCapture?.(e.pointerId); } catch {}
  apply(e);
}
function move(e) { if (dragging) apply(e); }
function up() {
  if (!dragging) return;
  dragging = false;
  emit("change", hour.value);
}
</script>

<template>
  <div class="dialwrap" ref="el" @pointerdown="down" @pointermove="move" @pointerup="up" @pointercancel="up">
    <svg :viewBox="'0 0 ' + S + ' ' + S" class="dial">
      <circle :cx="C" :cy="C" :r="R - 24" fill="none" stroke="rgba(78,75,66,.18)" stroke-dasharray="2 4" />
      <line
        v-for="t in ticks" :key="t.i"
        :x1="t.x1" :y1="t.y1" :x2="t.x2" :y2="t.y2"
        :stroke="t.i === hour ? 'var(--ink)' : 'rgba(78,75,66,.55)'"
        :stroke-width="t.i === hour ? 2.4 : (t.major ? 1.6 : 1)"
      />
      <line :x1="C" :y1="C" :x2="pointer.x" :y2="pointer.y" stroke="var(--ink)" stroke-width="1.2" opacity=".55" />
      <circle :cx="pointer.x" :cy="pointer.y" r="3.4" fill="var(--accent)" />
      <circle :cx="C" :cy="C" r="2" fill="var(--ink)" />
    </svg>
    <div class="dialcenter">
      <div class="dialnum">{{ String(hour).padStart(2, "0") }}:00</div>
      <div class="diallabel">{{ label }}</div>
    </div>
  </div>
</template>

<style scoped>
.dialwrap { position: relative; width: 11.5rem; height: 11.5rem; cursor: pointer; touch-action: none; user-select: none; }
.dial { width: 100%; height: 100%; display: block; }
.dialcenter { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; pointer-events: none; }
.dialnum { font-size: 2.05rem; letter-spacing: .04em; line-height: 1; }
.diallabel { margin-top: .35rem; font-size: .72rem; letter-spacing: .22em; color: var(--ink-2); }
</style>
