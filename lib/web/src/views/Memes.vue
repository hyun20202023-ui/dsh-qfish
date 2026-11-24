<script setup>
import { onMounted, ref, computed, watch } from "vue";
import { api, toast } from "../api.js";

const items = ref([]);
const total = ref(0);
const loading = ref(true);
const page = ref(0);
const PER = 14;
const q = ref("");
const openTitle = ref("");
const draft = ref({ title: "", tag: "", content: "" });

async function load() {
  loading.value = true;
  try {
    const d = await api("/api/memes" + (q.value.trim() ? "?q=" + encodeURIComponent(q.value.trim()) : ""));
    items.value = d.items || [];
    total.value = d.total || 0;
    page.value = 0;
  } catch (e) {
    toast("读取失败");
  } finally {
    loading.value = false;
  }
}

const pages = computed(() => Math.max(1, Math.ceil(items.value.length / PER)));
const pageRows = computed(() => items.value.slice(page.value * PER, page.value * PER + PER));
watch([pages, page], () => { if (page.value > pages.value - 1) page.value = Math.max(0, pages.value - 1); });

async function save(item) {
  try {
    await api("/api/memes", { method: "POST", body: { title: item.title, content: item.content || "", tag: item.tag || "" } });
    toast("已保存");
  } catch (e) { toast("保存失败"); }
}

async function add() {
  const t = draft.value.title.trim();
  if (!t) return toast("标题不能空");
  try {
    await api("/api/memes", { method: "POST", body: { title: t, content: draft.value.content.trim(), tag: draft.value.tag.trim() } });
    draft.value = { title: "", tag: "", content: "" };
    await load();
    toast("已添加");
  } catch (e) { toast("添加失败"); }
}

async function del(item) {
  try {
    await api("/api/memes", { method: "POST", body: { deleteTitle: item.title } });
    await load();
    toast("已删除");
  } catch (e) { toast("删除失败"); }
}

onMounted(load);
</script>

<template>
  <div class="topline">
    <span class="dim">梗百科 · {{ total }} 条</span>
    <div style="display: flex; align-items: center; gap: .5rem">
      <button class="pg" :disabled="page === 0" @click="page--">‹</button>
      <span class="dim">{{ page + 1 }} / {{ pages }}</span>
      <button class="pg" :disabled="page >= pages - 1" @click="page++">›</button>
      <input v-model="q" type="text" placeholder="搜索" style="width: 9rem" @keyup.enter="load" />
    </div>
  </div>

  <div class="addrow">
    <input v-model="draft.title" type="text" placeholder="标题" style="width: 12rem" />
    <input v-model="draft.tag" type="text" placeholder="标签" style="width: 8rem" />
    <input v-model="draft.content" type="text" placeholder="内容" style="flex: 1" @keyup.enter="add" />
    <button class="btn" @click="add">添加</button>
  </div>

  <div v-if="loading" class="row">读取中…</div>
  <div v-else-if="items.length === 0" class="row">还没有词条</div>

  <div v-for="m in pageRows" :key="m.title" class="memecard">
    <div class="mhead" @click="openTitle = openTitle === m.title ? '' : m.title">
      <span class="marrow">{{ openTitle === m.title ? "▾" : "▸" }}</span>
      <span class="mtitle">{{ m.title }}</span>
      <span v-if="m.tag" class="mtag">{{ m.tag }}</span>
      <span class="mprev dim">{{ openTitle === m.title ? "" : (m.content || "") }}</span>
      <button class="xbtn" @click.stop="del(m)">×</button>
    </div>
    <div v-if="openTitle === m.title" class="mbody">
      <div class="grid2">
        <div><label class="lbl">标题</label><input v-model="m.title" type="text" /></div>
        <div><label class="lbl">标签</label><input v-model="m.tag" type="text" /></div>
      </div>
      <label class="lbl" style="margin-top: .5rem">内容</label>
      <textarea v-model="m.content" class="mcontent"></textarea>
      <div class="row" style="justify-content: flex-end; margin: .4rem 0 0">
        <button class="btn" @click="save(m)">保存</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.topline { display: flex; align-items: center; justify-content: space-between; margin-bottom: .3rem; font-size: .74rem; }
.addrow { display: flex; gap: .6rem; margin-bottom: .35rem; }
.divider { height: .5rem; background: var(--ink); margin-bottom: .3rem; }
.memecard { border-bottom: 1px solid rgba(78,75,66,.14); }
.mhead { display: flex; align-items: baseline; gap: .6rem; padding: .42rem 0; cursor: pointer; }
.marrow { width: .9rem; flex: none; color: var(--ink-2); font-size: .8rem; }
.mbody { padding: .1rem 0 .7rem 1.5rem; }
.mcontent { height: 6rem; font-size: .85rem; line-height: 1.6; }
.mhead:hover { background: rgba(255,253,242,.3); }
.mtitle { font-size: .95rem; flex: none; }
.mtag { font-size: .68rem; border: 1px solid var(--ink-3); padding: 0 .35rem; color: var(--ink-2); flex: none; }
.mprev { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: .78rem; }
.xbtn { border: none; background: transparent; color: var(--ink-2); font-size: 1.05rem; cursor: pointer; padding: 0 .2rem; }
.xbtn:hover { color: var(--accent); }
.pg { border: 1px solid var(--ink-3); background: transparent; color: var(--ink); font-family: var(--font); font-size: .8rem; line-height: 1; padding: .1rem .5rem; cursor: pointer; }
.pg:disabled { opacity: .35; cursor: default; }
</style>
