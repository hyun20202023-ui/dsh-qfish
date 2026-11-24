<script setup>
import { computed, ref, watch } from "vue";

const props = defineProps({
  start: { type: Number, default: 0 },
  end: { type: Number, default: 23 },
  max: { type: Number, default: 23 }
});
const emit = defineEmits(["update", "change"]);

const S = 240;
const C = S / 2;
const R = 100;
const el = ref(null);
let dragging = "";
let localStart = ref(props.start);
let localEnd = ref(props.end);

const count = computed(() => props.max + 1);
const hStart = computed(() => clamp(localStart.value));
const hEnd = computed(() => clamp(localEnd.value));

watch(() => [props.start, props.end], () => {
  if (dragging) return;
  localStart.value = clamp(props.start);
  localEnd.value = clamp(props.end);
});

function clamp(v) {
  return Math.max(0, Math.min(props.max, Math.round(Number(v) || 0)));
}
function angleOf(i) {
  return (-90 + (360 / count.value) * i) * (Math.PI / 180);
}

const ticks = computed(() => {
  const list = [];
  for (let i = 0; i < count.value; i++) {
    const a = angleOf(i);
    const major = i % 3 === 0;
    const r1 = R - (major ? 18 : 11);
    list.push({
      i,
      x1: C + Math.cos(a) * r1,
      y1: C + Math.sin(a) * r1,
      x2: C + Math.cos(a) * R,
      y2: C + Math.sin(a) * R,
      major
    });
  }
  return list;
});

function pointOf(h) {
  const a = angleOf(h);
  return { x: C + Math.cos(a) * (R - 10), y: C + Math.sin(a) * (R - 10) };
}
const pStart = computed(() => pointOf(hStart.value));
const pEnd = computed(() => pointOf(hEnd.value));

const sectorPath = computed(() => {
  const step = (360 / count.value) * (Math.PI / 180);
  const a0 = angleOf(hStart.value);
  const a1 = angleOf(hEnd.value);
  let span = a1 - a0;
  while (span < 0) span += Math.PI * 2;
  if (span === 0) span = Math.PI * 2;
  const r = R - 10;
  const x0 = C + Math.cos(a0) * r;
  const y0 = C + Math.sin(a0) * r;
  const x1 = C + Math.cos(a0 + span) * r;
  const y1 = C + Math.sin(a0 + span) * r;
  const large = span > Math.PI ? 1 : 0;
  return "M " + C + " " + C + " L " + x0 + " " + y0 + " A " + r + " " + r + " 0 " + large + " 1 " + x1 + " " + y1 + " Z";
});

function idxFromEvent(e) {
  const box = el.value;
  if (!box) return 0;
  const r = box.getBoundingClientRect();
  const dx = e.clientX - (r.left + r.width / 2);
  const dy = e.clientY - (r.top + r.height / 2);
  let deg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
  if (deg < 0) deg += 360;
  const step = 360 / count.value;
  return Math.round(deg / step) % count.value;
}

function nearHandle(e) {
  const idx = idxFromEvent(e);
  const dS = Math.min(Math.abs(idx - hStart.value), count.value - Math.abs(idx - hStart.value));
  const dE = Math.min(Math.abs(idx - hEnd.value), count.value - Math.abs(idx - hEnd.value));
  return dS <= dE ? "start" : "end";
}

function apply(e) {
  const idx = idxFromEvent(e);
  if (dragging === "start") localStart.value = idx;
  else if (dragging === "end") localEnd.value = idx;
  emit("update", { start: localStart.value, end: localEnd.value });
}

function down(e) {
  dragging = nearHandle(e);
  try { e.target.setPointerCapture?.(e.pointerId); } catch {}
  apply(e);
}
function move(e) { if (dragging) apply(e); }
function up() {
  if (!dragging) return;
  dragging = "";
  emit("change", { start: hStart.value, end: hEnd.value });
}
</script>

<template>
  <div class="rangewrap" ref="el" @pointerdown="down" @pointermove="move" @pointerup="up" @pointercancel="up">
    <svg :viewBox="'0 0 ' + S + ' ' + S" class="dial">
      <circle :cx="C" :cy="C" :r="R - 30" fill="none" stroke="rgba(78,75,66,.16)" stroke-dasharray="2 4" />
      <circle v-if="hStart === hEnd" :cx="C" :cy="C" :r="R - 10" fill="rgba(78,75,66,.13)" />
      <path v-else :d="sectorPath" fill="rgba(78,75,66,.13)" />
      <line
        v-for="t in ticks" :key="t.i"
        :x1="t.x1" :y1="t.y1" :x2="t.x2" :y2="t.y2"
        :stroke="t.i === hStart || t.i === hEnd ? 'var(--ink)' : 'rgba(78,75,66,.7)'"
        :stroke-width="t.i === hStart || t.i === hEnd ? 2.2 : (t.major ? 1.5 : .9)"
      />
      <circle :cx="pStart.x" :cy="pStart.y" r="4" fill="none" stroke="var(--ink)" stroke-width="1.6" />
      <circle :cx="pEnd.x" :cy="pEnd.y" r="4" fill="var(--ink)" />
      <circle :cx="C" :cy="C" r="2" fill="var(--ink)" />
    </svg>
    <div class="dialcenter">
      <div class="dialnum">
        {{ String(hStart).padStart(2, "0") }}:00
        <span class="dash">—</span>
        {{ String(hEnd).padStart(2, "0") }}:00
      </div>
      <div class="diallabel">运行时段{{ hStart === hEnd ? " · 全天" : (hEnd < hStart ? " · 次日" : "") }}</div>
    </div>
  </div>
</template>

<style scoped>
.rangewrap { position: relative; width: 14rem; height: 14rem; cursor: pointer; touch-action: none; user-select: none; }
.dial { width: 100%; height: 100%; display: block; }
.dialcenter { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; pointer-events: none; }
.dialnum { font-size: 1.55rem; letter-spacing: .03em; line-height: 1; display: flex; align-items: baseline; gap: .25rem; }
.dash { color: var(--ink-2); font-size: 1.1rem; }
.diallabel { margin-top: .4rem; font-size: .72rem; letter-spacing: .24em; color: var(--ink-2); }
</style>
