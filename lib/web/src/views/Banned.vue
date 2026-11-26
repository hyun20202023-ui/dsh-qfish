<script setup>
import { onMounted, ref, computed, watch } from "vue";
import { api, toast } from "../api.js";

const words = ref([]);
const loading = ref(true);
const page = ref(0);
const PER = 40;
const draft = ref("");

async function load() {
  loading.value = true;
  try {
    const r = await api("/api/banned");
    let arr = r;
    if (typeof r === "string") { try { arr = JSON.parse(r); } catch { arr = String(r).split(/\r?\n/); } }
    words.value = Array.isArray(arr) ? arr : [];
    page.value = 0;
  } catch (e) {
    toast("读取失败");
  } finally {
    loading.value = false;
  }
}

const pages = computed(() => Math.max(1, Math.ceil(words.value.length / PER)));
const pageRows = computed(() => words.value.slice(page.value * PER, page.value * PER + PER));
watch([pages, page], () => { if (page.value > pages.value - 1) page.value = Math.max(0, pages.value - 1); });

async function add() {
  const w = draft.value.trim();
  if (!w) return;
  try {
    await api("/api/banned", { method: "POST", body: { word: w } });
    words.value.push(w);
    draft.value = "";
    toast("已添加");
  } catch (e) {
    toast("添加失败");
  }
}

async function del(w) {
  try {
    await api("/api/banned", { method: "DELETE", body: { word: w } });
    words.value = words.value.filter((x) => x !== w);
    toast("已删除");
  } catch (e) {
    toast("删除失败");
  }
}

onMounted(load);
</script>

<template>
  <div class="topline">
    <span class="dim">禁词 · {{ words.length }} 条</span>
    <div style="display: flex; align-items: center; gap: .6rem">
      <button class="pg" :disabled="page === 0" @click="page--">‹</button>
      <span class="dim">{{ page + 1 }} / {{ pages }}</span>
      <button class="pg" :disabled="page >= pages - 1" @click="page++">›</button>
    </div>
  </div>

  <div class="hint dim">
    直接写词 = 原样匹配；句式里 <b>/*/</b> 代表 1 个字，<b>/-/</b> 代表 2–10 个字，例如「你/*/死」会命中「你去死」。
  </div>

  <div class="addrow">
    <input v-model="draft" type="text" placeholder="新增禁词" style="flex: 1" @keyup.enter="add" />
    <button class="btn" @click="add">添加</button>
  </div>

  <div v-if="loading" class="row">读取中…</div>
  <div v-else class="chips">
    <span v-for="w in pageRows" :key="w" class="chip">
      {{ w }}
      <b @click="del(w)">×</b>
    </span>
  </div>
</template>

<style scoped>
.topline { display: flex; align-items: center; justify-content: space-between; margin-bottom: .3rem; font-size: .74rem; }
.hint { font-size: .72rem; line-height: 1.6; margin: 0 0 .35rem; letter-spacing: .02em; }
.hint b { color: var(--ink); font-weight: 400; border: 1px solid var(--ink-3); padding: 0 .3rem; border-radius: 3px; }
.addrow { display: flex; gap: .7rem; margin-bottom: .5rem; }
.chips { display: flex; flex-wrap: wrap; gap: .45rem; align-content: flex-start; }
.chip { border: 1px solid var(--ink-3); background: rgba(255,253,242,.35); padding: .2rem .55rem; display: inline-flex; gap: .45rem; align-items: center; font-size: .85rem; }
.chip b { cursor: pointer; color: var(--accent); font-weight: 400; }
.xbtn, .pg { border: 1px solid var(--ink-3); background: transparent; color: var(--ink); font-family: var(--font); font-size: .8rem; line-height: 1; padding: .1rem .5rem; cursor: pointer; }
.pg:disabled { opacity: .35; cursor: default; }
</style>
