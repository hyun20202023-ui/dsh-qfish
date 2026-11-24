<script setup>
import { onMounted, ref, computed } from "vue";
import { api, toast, TOKEN } from "../api.js";

const names = ref([]);
const tags = ref({});
const loading = ref(true);
const q = ref("");
const editing = ref("");
const tagDraft = ref("");

async function load() {
  loading.value = true;
  try {
    const st = await api("/api/state");
    names.value = st.stickers || [];
    tags.value = st.stickerTags || {};
  } catch (e) {
    toast("读取失败");
  } finally {
    loading.value = false;
  }
}

const shown = computed(() => {
  const kw = q.value.trim();
  if (!kw) return names.value;
  return names.value.filter((n) => n.includes(kw) || String(tags.value[n] || "").includes(kw));
});

function isAnim(n) {
  return /\.(gif|webp)$/i.test(String(n));
}

function thumb(n) {
  return "/api/sticker?thumb=1&name=" + encodeURIComponent(n) + "&t=" + encodeURIComponent(TOKEN);
}

function srcOf(n) {
  const mode = isAnim(n) ? "anim" : "thumb";
  return "/api/sticker?" + mode + "=1&name=" + encodeURIComponent(n) + "&t=" + encodeURIComponent(TOKEN);
}

function open(n) {
  editing.value = n;
  tagDraft.value = String(tags.value[n] || "");
}

async function saveTags() {
  const n = editing.value;
  if (!n) return;
  try {
    await api("/api/sticker/tag", { method: "POST", body: { name: n, tags: tagDraft.value } });
    tags.value[n] = tagDraft.value;
    editing.value = "";
    toast("标签已保存");
  } catch (e) {
    toast("保存失败");
  }
}

async function del(n) {

  try {
    await api("/api/sticker?name=" + encodeURIComponent(n), { method: "DELETE" });
    names.value = names.value.filter((x) => x !== n);
    toast("已删除");
  } catch (e) {
    toast("删除失败");
  }
}

onMounted(load);
</script>

<template>
  <div class="row" style="margin: 0 0 1.2rem; justify-content: space-between">
    <span>表情库 · {{ names.length }} 张</span>
    <input v-model="q" type="text" placeholder="搜索文件名 / 标签" style="width: 16rem" />
  </div>

  <div v-if="loading" class="row">读取中…</div>
  <div v-else-if="shown.length === 0" class="row">还没有表情</div>
  <div class="grid">
    <div v-for="n in shown" :key="n" class="cell">
      <img :src="srcOf(n)" loading="lazy" @click="open(n)" @error="(e) => { if (!e.target.dataset.fb) { e.target.dataset.fb = '1'; e.target.src = thumb(n); } }" />
      <div class="meta">
        <span class="tagtext" @click="open(n)">{{ tags[n] || "未打标签" }}</span>
        <b @click="del(n)">×</b>
      </div>
    </div>
  </div>

  <div v-if="editing" class="card" style="margin-top: 1.2rem">
    <div class="row" style="justify-content: space-between">
      <span>标签：{{ editing }}</span>
      <button class="btn" @click="editing = ''">关闭</button>
    </div>
    <div class="row" style="margin: 0; gap: .8rem">
      <input v-model="tagDraft" type="text" placeholder="用空格或逗号分隔" style="flex: 1" @keyup.enter="saveTags" />
      <button class="btn" @click="saveTags">保存</button>
    </div>
  </div>
</template>

<style scoped>
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(7.5rem, 1fr)); gap: .9rem; }
.cell { border: 1px solid var(--ink-3); background: rgba(255,253,242,.35); }
.cell img { width: 100%; height: 7.5rem; object-fit: contain; display: block; cursor: pointer; }
.meta { display: flex; align-items: center; gap: .4rem; padding: .25rem .4rem; font-size: .75rem; color: var(--ink-2); }
.tagtext { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; cursor: pointer; }
.meta b { color: var(--accent); cursor: pointer; font-weight: 400; }
</style>
