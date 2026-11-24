<script setup>
import { onMounted, ref, computed, watch } from "vue";
import { api, toast } from "../api.js";

const map = ref({});
const loading = ref(true);
const page = ref(0);
const PER = 14;
const type = ref("insult");
const draft = ref({ term: "", meaning: "" });

async function load() {
  loading.value = true;
  try {
    map.value = (await api("/api/slang?type=" + type.value)) || {};
    page.value = 0;
  } catch (e) {
    toast("读取失败");
  } finally {
    loading.value = false;
  }
}

const rows = computed(() => Object.entries(map.value).map(([term, meaning]) => ({ term, meaning })));
const pages = computed(() => Math.max(1, Math.ceil(rows.value.length / PER)));
const pageRows = computed(() => rows.value.slice(page.value * PER, page.value * PER + PER));
watch([pages, page], () => { if (page.value > pages.value - 1) page.value = Math.max(0, pages.value - 1); });

async function save(row) {
  try {
    await api("/api/slang", { method: "POST", body: { term: row.term, oldTerm: row.term, meaning: row.meaning, type: type.value } });
  } catch (e) {
    toast("保存失败");
  }
}

async function del(row) {
  try {
    await api("/api/slang", { method: "DELETE", body: { term: row.term, oldTerm: row.term, type: type.value } });
    delete map.value[row.term];
    toast("已删除");
  } catch (e) {
    toast("删除失败");
  }
}

async function add() {
  const term = draft.value.term.trim();
  if (!term) return toast("词不能空");
  try {
    await api("/api/slang", { method: "POST", body: { term, meaning: draft.value.meaning.trim(), type: type.value } });
    map.value[term] = draft.value.meaning.trim();
    draft.value = { term: "", meaning: "" };
    toast("已添加");
  } catch (e) {
    toast("添加失败");
  }
}

function switchType(t) {
  type.value = t;
  load();
}

onMounted(load);
</script>

<template>
  <div class="topline">
    <span class="dim">{{ type === "insult" ? "黑话（阴阳/骂人）" : "普通黑话" }} · {{ rows.length }} 条</span>
    <div style="display: flex; align-items: center; gap: .6rem">
      <button class="pg" :disabled="page === 0" @click="page--">‹</button>
      <span class="dim">{{ page + 1 }} / {{ pages }}</span>
      <button class="pg" :disabled="page >= pages - 1" @click="page++">›</button>
      <button class="btn" @click="switchType(type === 'insult' ? 'normal' : 'insult')">
        切到{{ type === "insult" ? "普通" : "黑话" }}
      </button>
    </div>
  </div>

  <div class="addrow">
    <input v-model="draft.term" type="text" placeholder="词" class="colterm" />
    <input v-model="draft.meaning" type="text" placeholder="意思" class="colmean" @keyup.enter="add" />
    <button class="btn colbtn" @click="add">添加</button>
  </div>
  <div class="divider"></div>

  <div v-if="loading" class="row">读取中…</div>
  <div class="list">
    <div v-for="row in pageRows" :key="row.term" class="kvrow">
      <input v-model="row.term" type="text" class="colterm" @change="save(row)" />
      <input v-model="row.meaning" type="text" class="colmean" @change="save(row)" />
      <button class="xbtn colbtn" @click="del(row)">×</button>
    </div>
  </div>
</template>

<style scoped>
.topline { display: flex; align-items: center; justify-content: space-between; margin-bottom: .3rem; font-size: .74rem; }
.addrow { display: flex; gap: .7rem; margin-bottom: .45rem; }
.addrow .colterm, .kvrow .colterm { width: 12rem; flex: none; }
.addrow .colmean, .kvrow .colmean { flex: 1; min-width: 0; }
.addrow .colbtn, .kvrow .colbtn { width: 3.4rem; flex: none; padding: 0 .25rem; letter-spacing: 0; white-space: nowrap; }
.divider { height: .55rem; background: var(--ink); margin: 0 0 .35rem; }
.list { display: flex; flex-direction: column; }
.kvrow { display: flex; gap: .7rem; align-items: center; padding: .3rem 0; border-bottom: 1px solid rgba(78,75,66,.12); }
.kvrow input { padding: .3rem .5rem; font-size: .85rem; }
.xbtn { border: none; background: transparent; color: var(--ink-2); font-size: 1.1rem; line-height: 1; cursor: pointer; padding: 0 .2rem; text-align: center; }
.xbtn:hover { color: var(--accent); }
.pg { border: 1px solid var(--ink-3); background: transparent; color: var(--ink); font-family: var(--font); font-size: .8rem; line-height: 1; padding: .1rem .5rem; cursor: pointer; }
.pg:disabled { opacity: .35; cursor: default; }
</style>
