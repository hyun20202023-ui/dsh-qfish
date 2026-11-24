<script setup>
import { onMounted, ref } from "vue";
import { api, toast } from "../api.js";

const rows = ref([]);
const loading = ref(true);

const FIELDS = [
  { k: "minMembers", label: "最少人数", min: 1, max: 5000 },
  { k: "intervalDays", label: "清理间隔（天）", min: 1, max: 365 },
  { k: "inactiveDays", label: "多少天没说话", min: 1, max: 3650 },
  { k: "maxKickPerRun", label: "每次最多踢", min: 1, max: 100 },
  { k: "joinGraceDays", label: "新成员保护（天）", min: 0, max: 365 }
];

async function load() {
  loading.value = true;
  try {
    rows.value = (await api("/api/groupctl")) || [];
  } catch (e) {
    toast("读取失败");
  } finally {
    loading.value = false;
  }
}

async function save(r) {
  const cfg = r.cfg || {};
  try {
    await api("/api/groupctl", { method: "POST", body: {
      gid: r.gid, enabled: cfg.enabled === true,
      minMembers: cfg.minMembers, intervalDays: cfg.intervalDays,
      inactiveDays: cfg.inactiveDays, maxKickPerRun: cfg.maxKickPerRun,
      joinGraceDays: cfg.joinGraceDays
    }});
    toast("已保存");
  } catch (e) {
    toast("保存失败");
  }
}

function toggle(r) {
  r.cfg = r.cfg || {};
  r.cfg.enabled = !(r.cfg.enabled === true);
  save(r);
}

onMounted(load);
</script>

<template>
  <div class="row" style="margin: 0 0 1.2rem; justify-content: space-between">
    <span>群管理 · {{ rows.length }} 个群</span>
    <span class="dim">不活跃清理默认关闭</span>
  </div>

  <div v-if="loading" class="row">读取中…</div>
  <div v-else-if="rows.length === 0" class="row">还没有群配置</div>

  <div v-for="r in rows" :key="r.gid" class="card" style="margin-bottom: 1rem">
    <div class="row" style="margin: 0 0 .4rem; justify-content: space-between">
      <span>{{ r.name || r.gid }} <span class="dim">· {{ r.gid }}</span></span>
      <span class="sw" :class="{ on: r.cfg && r.cfg.enabled }" @click="toggle(r)"><i></i></span>
    </div>
    <div class="grid2">
      <div v-for="f in FIELDS" :key="f.k" class="row" style="margin: .2rem 0; justify-content: space-between">
        <span>{{ f.label }}</span>
        <input
          type="number" style="width: 6rem" :value="(r.cfg || {})[f.k]"
          @change="(r.cfg = r.cfg || {})[f.k] = Number($event.target.value); save(r)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.sw { display: inline-block; width: 3rem; height: 1.35rem; border: 1px solid var(--ink-3); background: rgba(255,253,242,.5); position: relative; cursor: pointer; }
.sw i { position: absolute; top: .15rem; left: .15rem; width: 1rem; height: 1rem; background: var(--ink-2); transition: .15s; }
.sw.on { border-color: var(--ink-2); }
.sw.on i { left: 1.7rem; background: var(--accent); }
</style>
