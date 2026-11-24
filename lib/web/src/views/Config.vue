<script setup>
import { onMounted, ref } from "vue";
import { api, toast } from "../api.js";
import SegSlider from "../components/SegSlider.vue";

const GROUPS = [
  { title: "消息与回复", fields: [
    { k: "wakeLimitPerMinute", label: "每分钟唤醒上限", min: 0, max: 60, step: 1 },
    { k: "replyMaxParts", label: "最多分几条发", min: 1, max: 10, step: 1 },
    { k: "replyPartChars", label: "每条最多多少字", min: 5, max: 500, step: 5 },
    { k: "sendGapMs", label: "发送间隔（毫秒）", min: 0, max: 10000, step: 100 },
    { k: "replyBudgetPerMin", label: "每分钟回复预算", min: 0, max: 60, step: 1 },
    { k: "messageBufferMs", label: "消息缓冲（毫秒）", min: 0, max: 10000, step: 100 }
  ]},
  { title: "会话", fields: [
    { k: "sessionWindowTurns", label: "上下文轮数", min: 1, max: 200, step: 1 },
    { k: "sessionCharLimit", label: "会话字数上限", min: 1000, max: 2000000, step: 1000 }
  ]},
  { title: "主动与概率", fields: [
    { k: "proactiveChance", label: "主动搭话概率（%）", min: 0, max: 100, step: 1 },
    { k: "chatVideoChance", label: "聊天里发视频概率（%）", min: 0, max: 100, step: 1 },
    { k: "proactiveVideoChance", label: "主动发视频概率（%）", min: 0, max: 100, step: 1 },
    { k: "groupAmbientChance", label: "群聊插话概率（%）", min: 0, max: 100, step: 1 },
    { k: "groupFollowUpSeconds", label: "接话窗口（秒）", min: 0, max: 600, step: 5 },
    { k: "knownChance", label: "熟人概率（%）", min: 0, max: 100, step: 1 }
  ]},
  { title: "表情", fields: [
    { k: "stickerChance", label: "回复带表情概率（%）", min: 0, max: 100, step: 1 },
    { k: "stickerSaveChance", label: "自动存表情概率（%）", min: 0, max: 100, step: 1 }
  ]},
  { title: "心情", fields: [
    { k: "moodCooldownTurns", label: "情绪冷却轮数", min: 0, max: 50, step: 1 },
    { k: "moodSensitivity", label: "敏感度", min: 0, max: 100, step: 1 }
  ]}
];

const st = ref({});
const loading = ref(true);

async function load() {
  loading.value = true;
  try {
    const s = await api("/api/state");
    st.value = s.settings || {};
  } catch (e) {
    toast("读取失败");
  } finally {
    loading.value = false;
  }
}

async function save(k, v, min, max) {
  let n = Number(v);
  if (Number.isNaN(n)) return;
  if (min !== undefined) n = Math.max(min, n);
  if (max !== undefined) n = Math.min(max, n);
  try {
    await api("/api/settings", { method: "POST", body: { [k]: n } });
    st.value[k] = n;
    toast("已保存");
  } catch (e) {
    toast("保存失败");
  }
}

onMounted(load);
</script>

<template>
  <div v-if="loading" class="row">读取中…</div>
  <template v-else>
    <div v-for="g in GROUPS" :key="g.title" class="card">
      <div class="row" style="margin: 0 0 .5rem">{{ g.title }}</div>
      <div v-for="f in g.fields" :key="f.k" class="cfgrow">
        <SegSlider
          :model-value="Number(st[f.k]) || 0" :min="f.min" :max="f.max" :step="f.step"
          :label="f.label" @change="(v) => save(f.k, v, f.min, f.max)"
        />
      </div>
    </div>
  </template>
</template>

<style scoped>
.cfgrow { padding: .45rem 0; border-bottom: 1px solid rgba(78,75,66,.1); }
</style>
