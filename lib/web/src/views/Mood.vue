<script setup>
import { onMounted, onBeforeUnmount, ref, computed, watch, nextTick } from "vue";
import { api, toast } from "../api.js";

const KEYS = ["开心", "生气", "难过", "委屈", "尴尬", "害羞"];
const v = ref({});
const history = ref([]);
const sensitivity = ref(30);
const loading = ref(true);
const canvas = ref(null);
const segs = ref(null);
const SEGS = 50;
const filled = computed(() => (Number(sensitivity.value) || 0) / 100 * SEGS);
function segStyle(i) {
  const f = Math.max(0, Math.min(1, filled.value - (i - 1)));
  const pct = Math.round(f * 100);
  return { background: "linear-gradient(90deg, var(--ink) " + pct + "%, rgba(78,75,66,.10) " + pct + "%)" };
}
let dragging = false;

async function load() {
  loading.value = true;
  try {
    const d = await api("/api/mood-self");
    v.value = d.v || {};
    history.value = (d.history || []).slice(0, 8);
    sensitivity.value = typeof d.sensitivity === "number" ? d.sensitivity : 30;
  } catch (e) {
    toast("读取失败");
  } finally {
    loading.value = false;
  }
  await nextTick();
  draw();
}

function draw() {
  const c = canvas.value;
  if (!c) return;
  const ctx = c.getContext("2d");
  const W = c.width, H = c.height;
  const cx = W / 2, cy = H / 2 + 6;
  const R = Math.min(W, H) * 0.34;
  ctx.clearRect(0, 0, W, H);
  const n = KEYS.length;
  const ang = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / n;

  // 网格
  for (let ring = 1; ring <= 4; ring++) {
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const a = ang(i % n);
      const r = (R * ring) / 4;
      const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = "rgba(78,75,66,.18)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  // 轴线 + 标签
  ctx.font = "11px 'Fusion Pixel', sans-serif";
  ctx.fillStyle = "rgba(78,75,66,.75)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let i = 0; i < n; i++) {
    const a = ang(i);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
    ctx.strokeStyle = "rgba(78,75,66,.22)";
    ctx.stroke();
    const lx = cx + Math.cos(a) * (R + 18);
    const ly = cy + Math.sin(a) * (R + 14);
    ctx.fillStyle = "rgba(78,75,66,.8)";
    ctx.fillText(KEYS[i], lx, ly);
  }
  // 数据面
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const val = Math.max(0, Math.min(100, Number(v.value[KEYS[i]] || 0)));
    const a = ang(i);
    const r = R * (1 + (3 * val) / 100) / 4;
    const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = "rgba(185,83,59,.22)";
  ctx.fill();
  ctx.strokeStyle = "rgba(185,83,59,.85)";
  ctx.lineWidth = 1.6;
  ctx.stroke();
  // 顶点
  for (let i = 0; i < n; i++) {
    const val = Math.max(0, Math.min(100, Number(v.value[KEYS[i]] || 0)));
    const a = ang(i);
    const r = R * (1 + (3 * val) / 100) / 4;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 2.4, 0, Math.PI * 2);
    ctx.fillStyle = "#b9533b";
    ctx.fill();
  }
}

watch(v, () => nextTick(draw), { deep: true });
onMounted(load);
onBeforeUnmount(() => {});

function setFromEvent(e) {
  const el = segs.value;
  if (!el) return;
  const r = el.getBoundingClientRect();
  const ratio = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
  sensitivity.value = Math.round(ratio * 100);
}
function startDrag(e) {
  dragging = true;
  try { e.target.setPointerCapture?.(e.pointerId); } catch {}
  setFromEvent(e);
}
function onDrag(e) {
  if (!dragging) return;
  setFromEvent(e);
}
function endDrag() {
  if (!dragging) return;
  dragging = false;
  saveSens();
}

async function saveSens() {
  try {
    await api("/api/settings", { method: "POST", body: { moodSensitivity: Number(sensitivity.value) } });
    toast("敏感度已保存");
  } catch (e) {
    toast("保存失败");
  }
}

async function reset() {
  try {
    await api("/api/mood-self/reset", { method: "POST", body: {} });
    await load();
    toast("已重置");
  } catch (e) {
    toast("重置失败");
  }
}
</script>

<template>
  <div v-if="loading" class="row">读取中…</div>
  <div v-else class="mood-page">
    <div class="top">
      <div class="radar">
        <canvas ref="canvas" width="440" height="380"></canvas>
      </div>
      <div class="hist">
        <div class="histhead">
          <span>变化记录</span>
          <button class="btn danger" @click="reset">重置心情</button>
        </div>
        <div v-for="(h, i) in history" :key="i" class="hrow">
          <span class="dim htime">{{ h.time }}</span>
          <span class="hreason">{{ h.reason }}</span>
          <span class="dim hsource">{{ h.source || "" }}</span>
          <span class="dim hquote">{{ h.quote || "" }}</span>
        </div>
        <div v-if="history.length === 0" class="dim">还没有记录</div>
      </div>
    </div>

    <div class="sens">
      <div class="senshead">
        <span class="slabel">敏感度</span>
        <span class="sval">{{ sensitivity }}%</span>
      </div>
      <div class="segs" ref="segs" @pointerdown="startDrag" @pointermove="onDrag" @pointerup="endDrag" @pointercancel="endDrag">
        <span v-for="i in SEGS" :key="i" class="seg" :style="segStyle(i)"></span>
      </div>
      <div class="sensfoot"><span class="dim">0</span><span class="dim">100</span></div>
    </div>
  </div>
</template>

<style scoped>
.mood-page { display: flex; flex-direction: column; gap: .6rem; height: 100%; }
.mood-page > .top { flex: 1; }
.top { display: flex; gap: 2rem; align-items: center; }
.radar { flex: none; display: flex; align-items: center; justify-content: center; }
.hist { flex: 1; min-width: 0; }
.histhead { display: flex; align-items: center; justify-content: space-between; font-size: .8rem; letter-spacing: .16em; color: var(--ink-2); margin-bottom: .35rem; }
.hrow { display: flex; gap: .8rem; align-items: baseline; padding: .3rem 0; border-bottom: 1px solid rgba(78,75,66,.12); font-size: .78rem; }
.htime { width: 7rem; flex: none; }
.hreason { width: 4.5rem; flex: none; color: var(--ink); }
.hsource { width: 8.5rem; flex: none; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.hquote { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.sens { margin-top: .4rem; }
.senshead { display: flex; align-items: baseline; justify-content: space-between; font-size: .72rem; letter-spacing: .22em; color: var(--ink-2); margin-bottom: .3rem; }
.sval { font-size: 1.05rem; letter-spacing: .06em; color: var(--ink); }
.segs { display: flex; gap: 2px; height: 1.05rem; padding: 2px; border: 1px solid var(--ink-3); background: rgba(255,253,242,.25); cursor: pointer; touch-action: none; }
.seg { flex: 1; background: rgba(78,75,66,.10); }
.sensfoot { display: flex; justify-content: space-between; font-size: .66rem; letter-spacing: .12em; margin-top: .18rem; }
</style>
