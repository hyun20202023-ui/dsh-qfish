<script setup>
import { onMounted, ref, computed, watch } from "vue";
import { api, toast } from "../api.js";

const props = defineProps({ q: { type: String, default: "" } });

const rows = ref([]);
const mood = ref({});
const memBy = ref({});
const loading = ref(true);
const page = ref(0);
const PER = 12;
const detail = ref("");
const form = ref({});
const saving = ref(false);
const ready = ref(false);
let saveTimer = null;
const memPage = ref(0);
const MEM_PER = 3;

async function load() {
  loading.value = true;
  try {
    const [list, moods, mem] = await Promise.all([
      api("/api/contacts"),
      api("/api/mood").catch(() => []),
      api("/api/memory").catch(() => [])
    ]);
    rows.value = list || [];
    const mm = {};
    for (const m of moods || []) mm[String(m.qq)] = m;
    mood.value = mm;
    const by = {};
    for (const m of mem || []) {
      const k = String(m.from || "");
      (by[k] = by[k] || []).push(m);
    }
    memBy.value = by;
  } catch (e) {
    toast("读取失败");
  } finally {
    loading.value = false;
  }
}

const shown = computed(() => {
  const kw = String(props.q || "").trim();
  const list = !kw ? rows.value : rows.value.filter((r) => String(r.name || "").includes(kw) || String(r.qq).includes(kw) || String(r.nick || "").includes(kw));
  return [...list].sort((a, b) => {
    const d = mems(b).length - mems(a).length;
    if (d !== 0) return d;
    return String(a.name || a.nick || a.qq).localeCompare(String(b.name || b.nick || b.qq), "zh");
  });
});

const pages = computed(() => Math.max(1, Math.ceil(shown.value.length / PER)));
const pageRows = computed(() => shown.value.slice(page.value * PER, page.value * PER + PER));
watch([pages, page], () => { if (page.value > pages.value - 1) page.value = Math.max(0, pages.value - 1); });

function open(r) {
  detail.value = r.qq;
  memPage.value = 0;
  ready.value = false;
  setTimeout(() => { ready.value = true; }, 300);
  form.value = {
    qq: r.qq,
    name: r.name || "",
    nick: r.nick || "",
    note: r.note || "",
    role: r.role || "",
    likes: r.likes || "",
    dislikes: r.dislikes || "",
    style: r.style || "",
    chance: typeof r.chance === "number" ? r.chance : 0.5,
    cool: r.cool === true
  };
}

const current = computed(() => rows.value.find((r) => String(r.qq) === String(detail.value)) || null);

function favor(r) {
  const m = mood.value[String(r.qq)];
  return m && typeof m.value === "number" ? m.value : 50;
}
function favorState(v) {
  if (v >= 75) return { text: "卖萌", cls: "moe" };
  if (v <= 10) return { text: "暴躁", cls: "angry" };
  if (v <= 25) return { text: "冷淡", cls: "cold" };
  return { text: "平常", cls: "" };
}
function mems(r) {
  return memBy.value[String(r.qq)] || [];
}
const memPages = computed(() => Math.max(1, Math.ceil(mems(current.value || {}).length / MEM_PER)));
const memPageRows = computed(() => mems(current.value || {}).slice(memPage.value * MEM_PER, memPage.value * MEM_PER + MEM_PER));
watch([detail, memPages], () => { if (memPage.value > memPages.value - 1) memPage.value = Math.max(0, memPages.value - 1); });

function dateOf(ms) {
  const d = new Date(Number(ms || 0));
  const p = (n) => String(n).padStart(2, "0");
  return (d.getMonth() + 1) + "-" + p(d.getDate()) + " " + p(d.getHours()) + ":" + p(d.getMinutes());
}

async function delContact() {

  const qq = detail.value;
  ready.value = false;
  try {
    await api("/api/contacts", { method: "DELETE", body: { qq } });
    detail.value = "";
    await load();
    toast("已删除");
  } catch (e) {
    toast("删除失败");
  }
}

async function delRow(r) {

  try {
    await api("/api/contacts", { method: "DELETE", body: { qq: r.qq } });
    await load();
    toast("已删除");
  } catch (e) {
    toast("删除失败");
  }
}

async function delMem(m) {

  try {
    await api("/api/memory", { method: "POST", body: { id: m.id, action: "delete" } });
    await load();
    toast("已删除");
  } catch (e) {
    toast("删除失败");
  }
}

async function save() {
  if (saving.value) return;
  saving.value = true;
  try {
    await api("/api/contacts", { method: "POST", body: form.value });
    toast("已保存");
    await load();
  } catch (e) {
    toast("保存失败");
  } finally {
    saving.value = false;
  }
}

watch(form, () => {
  if (!ready.value || !detail.value || saving.value) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(save, 500);
}, { deep: true });

onMounted(async () => {
  await load();
  const qq = new URLSearchParams(location.search).get("contact");
  if (qq) {
    const hit = rows.value.find((r) => String(r.qq) === String(qq));
    if (hit) open(hit);
  }
});
</script>

<template>
  <div v-if="loading" class="row">读取中…</div>
  <div v-else-if="shown.length === 0" class="row">没有联系人</div>

  <template v-else-if="!detail">
    <div class="pager-top">
      <button class="pg" :disabled="page === 0" @click="page--">‹</button>
      <span>{{ page + 1 }} / {{ pages }}</span>
      <button class="pg" :disabled="page >= pages - 1" @click="page++">›</button>
    </div>
    <div class="list">
      <div v-for="r in pageRows" :key="r.qq" class="rowitem" @click="open(r)">
        <img :src="r.avatar" class="av" />
        <b class="name">{{ r.name || r.nick || r.qq }}</b>
        <span class="qq">{{ r.qq }}</span>
        <button class="xbtn" title="删除联系人" @click.stop="delRow(r)">×</button>
      </div>
    </div>
  </template>

  <template v-else-if="current">
    <div class="detail">
      <div class="dhead">
        <button class="btn" @click="detail = ''">‹ 返回</button>
        <img :src="current.avatar" class="av big" />
        <div>
          <div class="dname">{{ current.name || current.nick || current.qq }}</div>
          <div class="qq">{{ current.qq }}</div>
        </div>
        <button class="xbtn" title="删除联系人" @click="delContact">×</button>
      </div>

      <div class="favor">
        <span class="flabel">好感度</span>
        <div class="ftrack"><i :style="{ width: Math.max(0, Math.min(100, favor(current))) + '%' }"></i></div>
        <span class="fval" :class="favorState(favor(current)).cls">{{ favor(current) }} · {{ favorState(favor(current)).text }}</span>
      </div>

      <div class="grid2" style="margin-top: 1rem">
        <div><label class="lbl">名字</label><input v-model="form.name" type="text" /></div>
        <div><label class="lbl">称呼</label><input v-model="form.nick" type="text" /></div>
        <div><label class="lbl">身份</label><input v-model="form.role" type="text" /></div>
        <div><label class="lbl">说话风格</label><input v-model="form.style" type="text" /></div>
        <div><label class="lbl">喜欢</label><input v-model="form.likes" type="text" /></div>
        <div><label class="lbl">讨厌</label><input v-model="form.dislikes" type="text" /></div>
      </div>
      <label class="lbl" style="margin-top: .9rem">备注</label>
      <textarea v-model="form.note" rows="2" class="notearea"></textarea>

      <div class="memtitle">
        <span>记忆 {{ mems(current).length }}</span>
        <span v-if="mems(current).length" class="mpager">
          <button class="pg" :disabled="memPage === 0" @click="memPage--">‹</button>
          <span>{{ memPage + 1 }} / {{ memPages }}</span>
          <button class="pg" :disabled="memPage >= memPages - 1" @click="memPage++">›</button>
        </span>
      </div>
      <div v-if="mems(current).length === 0" class="dim">还没有记忆</div>
      <div v-else class="memlist">
        <div v-for="m in memPageRows" :key="m.id" class="mem">
          <div class="memhead">
            <span class="memdate dim">{{ dateOf(m.at) }}<span v-if="m.pinned"> · 锁定</span></span>
            <button class="memdel" title="删除这条记忆" @click="delMem(m)">×</button>
          </div>
          <div class="memtext">{{ m.text }}</div>
        </div>
      </div>
    </div>
  </template>
</template>

<style scoped>
.pager-top { display: flex; align-items: center; justify-content: flex-end; gap: .6rem; font-size: .72rem; color: var(--ink-2); padding-bottom: .2rem; }
.pg { border: 1px solid var(--ink-3); background: transparent; color: var(--ink); font-family: var(--font); font-size: .8rem; line-height: 1; padding: .1rem .55rem; cursor: pointer; }
.pg:disabled { opacity: .35; cursor: default; }

.list { display: flex; flex-direction: column; }
.rowitem { display: flex; align-items: center; gap: .8rem; padding: .55rem .2rem; border-bottom: 1px solid rgba(78,75,66,.14); cursor: pointer; }
.rowitem:hover { background: rgba(255,253,242,.35); }
.av { width: 2.2rem; height: 2.2rem; object-fit: cover; }
.name { font-weight: 400; font-size: 1rem; }
.qq { font-family: ui-monospace, Consolas, monospace; font-size: .72rem; color: var(--ink-2); }

.detail { display: flex; flex-direction: column; gap: .1rem; }
.detail :deep(.grid2) { gap: .55rem 1.2rem; }
.detail :deep(.lbl) { margin-bottom: .25rem; }
.detail :deep(input[type="text"]),
.detail :deep(textarea) { background: rgba(255,253,242,.35); border: 1px solid var(--ink-3); font-size: .8rem; padding: .4rem .55rem; }
.detail :deep(input[type="text"]:focus),
.detail :deep(textarea:focus) { background: rgba(255,253,242,.55); }
.dhead { display: flex; align-items: center; gap: .9rem; margin-bottom: .5rem; }
.av.big { width: 3rem; height: 3rem; }
.dname { font-size: 1.15rem; }

.favor { display: flex; align-items: center; gap: .6rem; }
.flabel { font-size: .68rem; letter-spacing: .14em; color: var(--ink-2); width: 2.8rem; }
.ftrack { width: 12rem; height: .34rem; background: rgba(78,75,66,.14); }
.ftrack i { display: block; height: 100%; background: var(--ink-2); }
.fval { font-size: .72rem; color: var(--ink-2); }
.fval.moe { color: #a05f8f; }
.fval.angry { color: var(--accent); }
.fval.cold { color: #5b6f86; }

.memtitle { margin-top: .55rem; font-size: .8rem; letter-spacing: .16em; color: var(--ink-2); display: flex; align-items: center; justify-content: space-between; }
.mpager { display: flex; align-items: center; gap: .5rem; letter-spacing: .05em; }
.notearea { height: 2.9rem; }
.memlist { margin-top: .3rem; height: 14.5rem; overflow: auto; border-left: 2px solid var(--ink-3); padding-left: .8rem; }
.mem { padding: .35rem 0; border-bottom: 1px solid rgba(78,75,66,.1); }
.memhead { display: flex; align-items: center; justify-content: space-between; }
.memdate { font-size: .66rem; letter-spacing: .08em; }
.memdel { border: none; background: transparent; color: var(--ink-2); font-size: .95rem; line-height: 1; cursor: pointer; padding: 0 .2rem; }
.memdel:hover { color: var(--accent); }
.memtext { font-size: .8rem; line-height: 1.55; white-space: pre-wrap; margin-top: .15rem; }
</style>

<style scoped>
.xbtn { margin-left: auto; border: none; background: transparent; color: var(--ink-2); font-size: 1.35rem; line-height: 1; cursor: pointer; padding: 0 .3rem; }
.xbtn:hover { color: var(--accent); }
</style>
