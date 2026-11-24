<script setup>
import { onMounted, ref } from "vue";
import { api, toast } from "../api.js";
import ToggleSwitch from "../components/ToggleSwitch.vue";
import SegSlider from "../components/SegSlider.vue";
import ClockRange from "../components/ClockRange.vue";
import InterestBubbles from "../components/InterestBubbles.vue";

const me = ref(null);
const interests = ref([]);
const memories = ref([]);
const st = ref({});
const loading = ref(true);
const openMem = ref("");

const BILI = [
  { k: "biliAutoWatch", label: "自动看视频", type: "bool", hint: "触发时自己去找视频看" },
  { k: "biliIdleEnabled", label: "空闲自己刷", type: "bool", hint: "没人聊的时候自己看" },
  { k: "biliIdleStart", label: "开始时间", type: "num", min: 0, max: 23 },
  { k: "biliIdleEnd", label: "结束时间", type: "num", min: 0, max: 24 },
  { k: "biliIdlePerHour", label: "每小时最多", type: "num", min: 0, max: 10 },
  { k: "biliMaxDuration", label: "视频时长上限（分钟）", type: "num", min: 1, max: 120 },
  { k: "biliInterestAuto", label: "兴趣自动生长", type: "bool" },
  { k: "biliExploreChance", label: "尝鲜概率（%）", type: "num", min: 0, max: 100 },
  { k: "biliMemoryPublic", label: "观看记录可公开", type: "bool" }
];
const BILI_REST = BILI.filter((f) => f.k !== "biliIdleStart" && f.k !== "biliIdleEnd");

async function load() {
  loading.value = true;
  try {
    const [m, i, mem, state] = await Promise.all([
      api("/api/bili/me").catch(() => null),
      api("/api/bili/interests").catch(() => []),
      api("/api/bili/memories").catch(() => []),
      api("/api/state")
    ]);
    me.value = m;
    interests.value = i || [];
    memories.value = (mem || []).slice(0, 8);
    st.value = state.settings || {};
  } catch (e) {
    toast("读取失败");
  } finally {
    loading.value = false;
  }
}

async function save(k, v) {
  try {
    await api("/api/settings", { method: "POST", body: { [k]: v } });
    st.value[k] = v;
    toast("已保存");
  } catch (e) {
    toast("保存失败");
    await load();
  }
}

async function removeInterest(tag) {
  try {
    await api("/api/bili/interests", { method: "POST", body: { remove: tag } });
    toast("已删除「" + tag + "」");
    await load();
  } catch (e) {
    toast("删除失败");
  }
}

function bubbleSize(pct) {
  const p = Math.max(0, Math.min(100, Number(pct) || 0));
  const rem = 0.72 + Math.pow(p / 100, 0.7) * 0.62;
  return rem.toFixed(2) + "rem";
}

function toggle(k) {
  save(k, !st.value[k]);
}

function num(k, v, min, max) {
  let n = Number(v);
  if (Number.isNaN(n)) return;
  if (min !== undefined) n = Math.max(min, n);
  if (max !== undefined) n = Math.min(max, n);
  save(k, n);
}

onMounted(load);
</script>

<template>
  <div v-if="loading" class="row">读取中…</div>
  <template v-else>
    <div class="card">
      <div class="row" style="margin: 0 0 .8rem; justify-content: space-between">
        <span>B站账号</span>
        <span class="dim">{{ me && me.loggedIn ? "已登录" : "未登录" }}</span>
      </div>
      <div v-if="me && me.loggedIn" style="display: flex; gap: 1rem; align-items: center">
        <img :src="me.face" referrerpolicy="no-referrer" style="width: 3.2rem; height: 3.2rem; border-radius: 50%; object-fit: cover" @error="$event.target.style.display = 'none'" />
        <div>
          <div>{{ me.name }}</div>
          <div class="dim">LV{{ me.level }} · 观看记录 {{ memories.length }} 条</div>
        </div>
      </div>
      <div v-else class="row">没登录，用机器人自己的 B站 账号扫码绑定。</div>
    </div>

    <div class="card">
      <div class="row" style="margin: 0 0 .6rem">视频与兴趣</div>
      <div class="clockrow">
        <ClockRange
          :start="Number(st.biliIdleStart) || 0"
          :end="Number(st.biliIdleEnd) || 0"
          @change="(v) => { num('biliIdleStart', v.start, 0, 23); num('biliIdleEnd', v.end, 0, 24); }"
        />
      </div>

      <div v-for="f in BILI_REST" :key="f.k" class="settingrow">
        <div v-if="f.type !== 'num'" style="flex: 1; min-width: 0">
          <div>{{ f.label }}</div>
          <div v-if="f.hint" class="dim" style="font-size: .8rem">{{ f.hint }}</div>
        </div>
        <template v-if="f.type === 'bool'">
          <ToggleSwitch :model-value="st[f.k] !== false" @update:model-value="(v) => save(f.k, v)" />
        </template>
        <div v-else style="flex: 1; min-width: 14rem; max-width: 34rem">
          <SegSlider
            :model-value="Number(st[f.k]) || 0" :min="f.min" :max="f.max"
            :label="f.label" @change="(v) => num(f.k, v, f.min, f.max)"
          />
        </div>
      </div>
    </div>

    <div class="card">
      <div class="row" style="margin: 0 0 .8rem; justify-content: space-between">
        <span>兴趣标签</span>
        <span class="dim">{{ interests.length }} / 40</span>
      </div>
      <InterestBubbles :items="interests" @remove="removeInterest" />
      <div class="bubblelegend">
        <span class="lg"><i class="dot persona"></i>来自人设</span>
      </div>
    </div>

    <div class="card">
      <div class="row" style="margin: 0 0 .8rem; justify-content: space-between">
        <span>最近看过的</span>
        <span class="dim">共 {{ memories.length }} 条</span>
      </div>
      <div v-for="m in memories" :key="m.bvid" class="memitem">
        <div class="memrow" @click="openMem = openMem === m.bvid ? '' : m.bvid">
          <span class="dim memdate">{{ m.at ? new Date(m.at).toLocaleDateString("zh-CN") : "" }}</span>
          <span class="memtitle">{{ m.title }}</span>
          <span class="dim memtag">{{ (m.tags || [])[0] || "" }}</span>
          <span class="memarrow">{{ openMem === m.bvid ? "▾" : "▸" }}</span>
        </div>
        <div v-if="openMem === m.bvid" class="membody">
          <div v-if="m.summary" class="memsec">
            <div class="memlabel">摘要</div>
            <div class="memtext">{{ m.summary }}</div>
          </div>
          <div v-if="m.reaction" class="memsec">
            <div class="memlabel">锐评</div>
            <div class="memtext">{{ m.reaction }}</div>
          </div>
          <div v-if="!m.summary && !m.reaction" class="dim">这条没有摘要</div>
          <div class="memfoot">
            <span class="dim">{{ (m.tags || []).join(" / ") }}</span>
            <a v-if="m.url" :href="m.url" target="_blank" class="memlink">打开视频</a>
          </div>
        </div>
      </div>
    </div>
  </template>
</template>

<style scoped>
.settingrow { display: flex; align-items: center; gap: 1rem; padding: .55rem 0; border-bottom: 1px solid rgba(78,75,66,.12); }
.clockrow { display: flex; gap: 2.2rem; justify-content: center; padding: .6rem 0 .9rem; border-bottom: 1px solid rgba(78,75,66,.12); }
.bubblelegend { display: flex; gap: 1.2rem; justify-content: center; font-size: .72rem; color: var(--ink-2); margin-top: .3rem; }
.lg { display: inline-flex; align-items: center; gap: .35rem; }
.dot { width: .55rem; height: .55rem; border-radius: 50%; border: 1px solid rgba(78,75,66,.4); background: rgba(255,253,242,.6); }
.dot.persona { border-color: rgba(185,83,59,.8); background: rgba(185,83,59,.2); }
.memitem { border-bottom: 1px solid rgba(78,75,66,.1); }
.memrow { display: flex; gap: .8rem; padding: .4rem 0; font-size: .92rem; cursor: pointer; align-items: baseline; }
.memrow:hover { background: rgba(255,253,242,.35); }
.memdate { width: 6.5rem; flex: none; }
.memtitle { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.memtag { width: 5rem; flex: none; text-align: right; }
.memarrow { width: 1rem; flex: none; color: var(--ink-2); }
.membody { padding: .2rem 0 .7rem 6.5rem; }
.memsec { margin-bottom: .55rem; }
.memlabel { font-size: .7rem; letter-spacing: .18em; color: var(--ink-2); margin-bottom: .18rem; }
.memtext { font-size: .86rem; line-height: 1.65; white-space: pre-wrap; }
.memfoot { display: flex; justify-content: space-between; gap: 1rem; font-size: .72rem; color: var(--ink-2); margin-top: .3rem; }
.memlink { color: var(--accent); text-decoration: none; border-bottom: 1px solid currentColor; }
.sw { display: inline-block; width: 3rem; height: 1.35rem; border: 1px solid var(--ink-3); background: rgba(255,253,242,.5); position: relative; cursor: pointer; }
.sw i { position: absolute; top: .15rem; left: .15rem; width: 1rem; height: 1rem; background: var(--ink-2); transition: .15s; }
.sw.on { border-color: var(--ink-2); }
.sw.on i { left: 1.7rem; background: var(--accent); }
</style>
