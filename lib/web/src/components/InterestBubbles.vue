<script setup>
import { onMounted, onBeforeUnmount, ref, watch, nextTick } from "vue";
import Matter from "matter-js";

const props = defineProps({ items: { type: Array, default: () => [] } });
const emit = defineEmits(["remove"]);

const W = 900;
const H = 440;

const view = ref([]);
const hoverTag = ref("");
const svgRef = ref(null);

let engine = null;
let bodies = [];
let raf = 0;
let dragBody = null;
let frame = 0;
let moveListener = null;
let downListener = null;
let upListener = null;

const { Engine, World, Bodies, Query, Body } = Matter;

function sizeFor(item) {
  const pct = Math.max(0.1, Number(item.pct) || 0.1);
  const font = pct >= 1.6 ? 16 : 12;
  const text = String(item.tag || "");
  const h = Math.round(font * 2.1);
  const w = Math.round(Math.min(300, Math.max(h * 1.25, text.length * font * 1.05 + h * 0.7)));
  return { pct, font, h, w };
}

function build() {
  if (!engine) return;
  for (const b of bodies) World.remove(engine.world, b);
  bodies = [];

  const wall = { isStatic: true, friction: 0.3, restitution: 0.1 };
  World.add(engine.world, [
    Bodies.rectangle(W / 2, -30, W + 120, 60, wall),
    Bodies.rectangle(W / 2, H + 30, W + 120, 60, wall),
    Bodies.rectangle(-30, H / 2, 60, H + 120, wall),
    Bodies.rectangle(W + 30, H / 2, 60, H + 120, wall)
  ]);

  const n = props.items.length || 1;
  props.items.forEach((it, i) => {
    const s = sizeFor(it);
    const ang = i * 2.399963;
    const rad = Math.sqrt((i + 0.5) / n);
    const x = W / 2 + Math.cos(ang) * rad * (W / 2 - 90);
    const y = H / 2 + Math.sin(ang) * rad * (H / 2 - 40);
    const body = Bodies.rectangle(x, y, s.w, s.h, {
      chamfer: { radius: s.h / 2 },
      restitution: 0.15,
      friction: 0.2,
      frictionAir: 0.08,
      density: 0.002
    });
    body.plugin = { tag: it.tag, pct: s.pct, src: it.src, font: s.font, w: s.w, h: s.h, tx: x, ty: y, phase: i * 0.7 };
    bodies.push(body);
  });
  World.add(engine.world, bodies);
}

function delPoint(b) {
  const p = { x: b.plugin.w / 2 - 10, y: -b.plugin.h / 2 + 10 };
  return {
    x: b.position.x + Math.cos(b.angle) * p.x - Math.sin(b.angle) * p.y,
    y: b.position.y + Math.sin(b.angle) * p.x + Math.cos(b.angle) * p.y
  };
}

function sync() {
  view.value = bodies.map((b) => {
    const { tag, pct, src, font, w, h } = b.plugin;
    const d = delPoint(b);
    return { tag, pct, src, font, w, h, x: b.position.x, y: b.position.y, angle: b.angle, dx: d.x, dy: d.y };
  });
}

function loop() {
  const t = Date.now() / 1000;
  for (const b of bodies) {
    if (b === dragBody) continue;
    const p = b.plugin;
    const tx = p.tx + Math.sin(t * 0.35 + p.phase) * 7;
    const ty = p.ty + Math.cos(t * 0.29 + p.phase) * 5;
    Body.setVelocity(b, {
      x: b.velocity.x * 0.9 + (tx - b.position.x) * 0.004,
      y: b.velocity.y * 0.9 + (ty - b.position.y) * 0.004
    });
    // 角度回正：把旋转拉回水平，避免翻 180 度
    Body.setAngularVelocity(b, b.angularVelocity * 0.82 - b.angle * 0.02);
  }
  Engine.update(engine, 1000 / 60);
  frame++;
  if (frame % 2 === 0) sync();
  raf = requestAnimationFrame(loop);
}

onMounted(() => {
  engine = Engine.create({ gravity: { x: 0, y: 0, scale: 0 } });
  const c = svgRef.value;
  const toWorld = (e) => {
    const r = c.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (W / r.width), y: (e.clientY - r.top) * (H / r.height) };
  };

  moveListener = (e) => {
    if (dragBody) {
      const p = toWorld(e);
      Body.setVelocity(dragBody, { x: (p.x - dragBody.position.x) * 0.35, y: (p.y - dragBody.position.y) * 0.35 });
      return;
    }
    const p = toWorld(e);
    const hit = Query.point(bodies, p)[0] || null;
    hoverTag.value = hit ? hit.plugin.tag : "";
  };
  c.addEventListener("pointermove", moveListener);

  downListener = (e) => {
    try { e.preventDefault(); } catch {}
    const p = toWorld(e);
    const hit = Query.point(bodies, p)[0] || null;
    if (!hit) return;
    const d = delPoint(hit);
    if (Math.hypot(p.x - d.x, p.y - d.y) < 11) {
      emit("remove", hit.plugin.tag);
      return;
    }
    dragBody = hit;
    try { c.setPointerCapture(e.pointerId); } catch {}
  };
  c.addEventListener("pointerdown", downListener);

  upListener = () => { dragBody = null; };
  c.addEventListener("pointerup", upListener);
  c.addEventListener("pointercancel", upListener);

  build();
  sync();
  loop();
});

watch(() => props.items, () => { nextTick(() => { if (engine) { build(); sync(); } }); }, { deep: true });

onBeforeUnmount(() => {
  cancelAnimationFrame(raf);
  const c = svgRef.value;
  if (c) {
    c.removeEventListener("pointermove", moveListener);
    c.removeEventListener("pointerdown", downListener);
    c.removeEventListener("pointerup", upListener);
    c.removeEventListener("pointercancel", upListener);
  }
  if (engine) Engine.clear(engine);
});
</script>

<template>
  <div class="bubblebox">
    <svg ref="svgRef" :viewBox="'0 0 ' + W + ' ' + H" class="bubblesvg">
      <g v-for="(b, i) in view" :key="b.tag">
        <g :transform="'translate(' + b.x + ' ' + b.y + ') rotate(' + b.angle + ')'">
          <rect
            :x="-b.w / 2" :y="-b.h / 2" :width="b.w" :height="b.h" :rx="b.h / 2" :ry="b.h / 2"
            :fill="b.src === 'persona' ? 'rgba(185,83,59,.14)' : 'rgba(255,253,242,.62)'"
            :stroke="b.src === 'persona' ? 'rgba(185,83,59,.7)' : 'rgba(78,75,66,.38)'"
            stroke-width="1"
          />
          <text
            text-anchor="middle" dominant-baseline="central"
            :font-size="b.font"
            :fill="b.src === 'persona' ? '#a2452f' : '#3f3b32'"
          >{{ b.tag }}</text>
        </g>
        <g v-if="hoverTag === b.tag" class="del" @click.stop="emit('remove', b.tag)">
          <circle :cx="b.dx" :cy="b.dy" r="8" fill="rgba(30,29,26,.85)" />
          <text
            :x="b.dx" :y="b.dy"
            text-anchor="middle" dominant-baseline="central"
            font-size="10" fill="#f0e9d8"
          >×</text>
        </g>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.bubblebox { width: 100%; }
.bubblesvg {
  width: 100%; height: auto; display: block; touch-action: none;
  cursor: default;
  user-select: none; -webkit-user-select: none;
}
text {
  font-family: "Fusion Pixel", var(--font);
  letter-spacing: .02em;
  pointer-events: none;
  user-select: none; -webkit-user-select: none;
}
.del { cursor: pointer; }
</style>
