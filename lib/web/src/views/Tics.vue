<script setup>
import { onMounted, ref, computed, watch } from "vue";
import { api, toast } from "../api.js";

const groups = ref([]);
const loading = ref(true);
const page = ref(0);
const PER = 14;
const draft = ref({ phrase: "", scenario: "", kind: "phrase" });

async function load() {
  loading.value = true;
  try {
    groups.value = (await api("/api/tics")) || [];
    page.value = 0;
  } catch (e) {
    toast("读取失败");
  } finally {
    loading.value = false;
  }
}

const rows = computed(() => {
  const out = [];
  for (const g of groups.value) for (const t of g.list || []) out.push({ key: g.key, who: g.key === "global" ? "全局" : (g.target || g.key), kind: g.kind, ...t });
  return out;
});
const pages = computed(() => Math.max(1, Math.ceil(rows.value.length / PER)));
const pageRows = computed(() => rows.value.slice(page.value * PER, page.value * PER + PER));
watch([pages, page], () => { if (page.value > pages.value - 1) page.value = Math.max(0, pages.value - 1); });

async function save(row) {
  try {
    await api("/api/tics", { method: "PUT", body: { key: row.key, phrase: row.phrase, newPhrase: row.phrase, scenario: row.scenario, kind: row.kind } });
  } catch (e) {
    toast("保存失败");
  }
}

async function del(row) {
  try {
    await api("/api/tics", { method: "DELETE", body: { key: row.key, phrase: row.phrase } });
    await load();
    toast("已删除");
  } catch (e) {
    toast("删除失败");
  }
}

async function add() {
  const p = draft.value.phrase.trim();
  if (!p) return toast("短语不能空");
  try {
    await api("/api/tics", { method: "POST", body: { phrase: p, scenario: draft.value.scenario.trim() || "日常", kind: draft.value.kind } });
    draft.value = { phrase: "", scenario: "", kind: "phrase" };
    await load();
    toast("已添加");
  } catch (e) {
    toast("添加失败");
  }
}

onMounted(load);
</script>

<template>
  <div class="topline">
    <span class="dim">语言模仿 · {{ rows.length }} 条</span>
    <div style="display: flex; align-items: center; gap: .6rem">
      <button class="pg" :disabled="page === 0" @click="page--">‹</button>
      <span class="dim">{{ page + 1 }} / {{ pages }}</span>
      <button class="pg" :disabled="page >= pages - 1" @click="page++">›</button>
    </div>
  </div>

  <div class="addrow">
    <input v-model="draft.phrase" type="text" placeholder="短语" style="width: 11rem" />
    <input v-model="draft.scenario" type="text" placeholder="场景" style="width: 10rem" />
    <select v-model="draft.kind">
      <option value="phrase">短语</option>
      <option value="pattern">句式</option>
    </select>
    <button class="btn" @click="add">添加</button>
  </div>

  <div v-if="loading" class="row">读取中…</div>
  <div class="list">
    <div v-for="(row, i) in pageRows" :key="i" class="ticrow">
      <span class="dim who">{{ row.who }}</span>
      <input v-model="row.phrase" type="text" class="phrase" @change="save(row)" />
      <input v-model="row.scenario" type="text" class="scenario" placeholder="场景" @change="save(row)" />
      <span class="used">使用 {{ row.count }} 次</span>
      <button class="xbtn" @click="del(row)">×</button>
    </div>
  </div>
</template>

<style scoped>
.topline { display: flex; align-items: center; justify-content: space-between; margin-bottom: .3rem; font-size: .74rem; }
.addrow { display: flex; align-items: center; gap: .6rem; margin-bottom: .35rem; }
.addrow select { background: rgba(255,253,242,.5); border: 1px solid var(--ink-3); color: var(--ink); font-family: var(--font); font-size: .85rem; padding: .25rem .4rem; }
.list { display: flex; flex-direction: column; }
.ticrow { display: flex; align-items: center; gap: .6rem; padding: .28rem 0; border-bottom: 1px solid rgba(78,75,66,.12); }
.who { width: 7rem; flex: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: .75rem; }
.phrase { flex: 1; }
.scenario { width: 9rem; flex: none; }
.used { width: 5rem; flex: none; text-align: right; font-size: .72rem; color: var(--ink-2); }
.ticrow input { padding: .3rem .5rem; font-size: .85rem; }
.xbtn { border: none; background: transparent; color: var(--ink-2); font-size: 1.1rem; line-height: 1; cursor: pointer; padding: 0 .2rem; }
.xbtn:hover { color: var(--accent); }
.pg { border: 1px solid var(--ink-3); background: transparent; color: var(--ink); font-family: var(--font); font-size: .8rem; line-height: 1; padding: .1rem .5rem; cursor: pointer; }
.pg:disabled { opacity: .35; cursor: default; }
</style>
