<script setup>
import { computed, ref, watch } from "vue";

const props = defineProps({
  modelValue: { type: Number, default: 0 },
  min: { type: Number, default: 0 },
  max: { type: Number, default: 100 },
  step: { type: Number, default: 1 },
  label: { type: String, default: "" },
  suffix: { type: String, default: "" }
});
const emit = defineEmits(["update:modelValue", "change"]);

const SEGS = 50;
const el = ref(null);
const cur = ref(Number(props.modelValue) || 0);
let dragging = false;

watch(() => props.modelValue, (v) => { if (!dragging) cur.value = Number(v) || 0; });

const ratio = computed(() => {
  const span = props.max - props.min || 1;
  return Math.max(0, Math.min(1, ((Number(cur.value) || 0) - props.min) / span));
});

function segStyle(i) {
  const f = Math.max(0, Math.min(1, ratio.value * SEGS - (i - 1)));
  const pct = Math.round(f * 100);
  return { background: "linear-gradient(90deg, var(--ink) " + pct + "%, rgba(78,75,66,.10) " + pct + "%)" };
}

function quantize(v) {
  const span = props.max - props.min || 1;
  const step = props.step || 1;
  const n = Math.round((v - props.min) / step) * step + props.min;
  return Math.max(props.min, Math.min(props.max, Number(n.toFixed(6))));
}

function apply(e) {
  const box = el.value;
  if (!box) return;
  const r = box.getBoundingClientRect();
  const p = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
  cur.value = quantize(props.min + p * (props.max - props.min));
  emit("update:modelValue", cur.value);
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
  emit("change", cur.value);
}
</script>

<template>
  <div class="segslider">
    <div class="seghead">
      <span class="seglabel">{{ label }}</span>
      <span class="segval">{{ cur }}{{ suffix }}</span>
    </div>
    <div class="segs" ref="el" @pointerdown="down" @pointermove="move" @pointerup="up" @pointercancel="up">
      <span v-for="i in SEGS" :key="i" class="seg" :style="segStyle(i)"></span>
    </div>
  </div>
</template>

<style scoped>
.segslider { width: 100%; }
.seghead { display: flex; align-items: baseline; justify-content: space-between; font-size: .72rem; letter-spacing: .08em; color: var(--ink-2); margin-bottom: .22rem; }
.segval { font-size: .92rem; color: var(--ink); letter-spacing: .05em; }
.segs { display: flex; gap: 2px; height: 1rem; padding: 2px; border: 1px solid var(--ink-3); background: rgba(255,253,242,.25); cursor: pointer; touch-action: none; }
.seg { flex: 1; background: rgba(78,75,66,.10); }
</style>
