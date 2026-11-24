<script setup>
import { onMounted, onBeforeUnmount, ref, computed, watch } from "vue";
import { api, toast } from "../api.js";

const props = defineProps({ q: { type: String, default: "" } });

const rows = ref([]);
const names = ref({});
const limits = ref({ turns: 20, chars: 400000 });
const loading = ref(true);
const pageG = ref(0);
const pageP = ref(0);
const PER_G = 4;
const PER_P = 4;
let poll = null;

async function load(silent) {
  if (!silent) loading.value = true;
  try {
    const [list, contacts, groups, state] = await Promise.all([
      api("/api/chats"),
      api("/api/contacts").catch(() => []),
      api("/api/groupctl").catch(() => []),
      api("/api/state")
    ]);
    rows.value = list || [];
    const m = {};
    for (const c of contacts || []) m[String(c.qq)] = String(c.name || c.nick || "");
    for (const g of groups || []) if (g && g.gid && g.name) m[String(g.gid)] = String(g.name);
    names.value = m;
    const st = state.settings || {};
    limits.value = {
      turns: Number(st.sessionWindowTurns) || 20,
      chars: Number(st.sessionCharLimit) || 400000
    };
  } catch (e) {
    if (!silent) toast("读取失败");
  } finally {
    if (!silent) loading.value = false;
  }
}

const shown = computed(() => {
  const kw = String(props.q || "").trim();
  const list = !kw ? rows.value : rows.value.filter((r) => (names.value[r.target] || "").includes(kw) || String(r.target).includes(kw) || String(r.lastText || "").includes(kw));
  return [...list].sort((a, b) => (Number(b.lastMs) || 0) - (Number(a.lastMs) || 0));
});

const groupRows = computed(() => shown.value.filter((r) => r.kind === "group"));
const privateRows = computed(() => shown.value.filter((r) => r.kind !== "group"));
const groupPages = computed(() => Math.max(1, Math.ceil(groupRows.value.length / PER_G)));
const privatePages = computed(() => Math.max(1, Math.ceil(privateRows.value.length / PER_P)));
const groupPage = computed(() => groupRows.value.slice(pageG.value * PER_G, pageG.value * PER_G + PER_G));
const privatePage = computed(() => privateRows.value.slice(pageP.value * PER_P, pageP.value * PER_P + PER_P));

watch([groupPages, pageG], () => { if (pageG.value > groupPages.value - 1) pageG.value = Math.max(0, groupPages.value - 1); });
watch([privatePages, pageP], () => { if (pageP.value > privatePages.value - 1) pageP.value = Math.max(0, privatePages.value - 1); });

function label(r) { return names.value[r.target] || r.target; }

function statusKey(r) {
  if (r.busy) return "busy";
  const last = Number(r.lastMs || 0);
  return last > 0 && Date.now() - last < 5 * 60 * 1000 ? "active" : "idle";
}
function statusText(r) {
  const k = statusKey(r);
  return k === "busy" ? "回复中" : k === "active" ? "活跃" : "空闲";
}
function fmtLast(ms) {
  const t = Number(ms || 0);
  if (!t) return "—";
  const diff = Date.now() - t;
  if (diff < 60 * 1000) return "刚刚";
  if (diff < 3600 * 1000) return Math.floor(diff / 60000) + " 分钟前";
  if (diff < 86400 * 1000) return Math.floor(diff / 3600000) + " 小时前";
  const d = new Date(t);
  const p = (n) => String(n).padStart(2, "0");
  return (d.getMonth() + 1) + "-" + p(d.getDate()) + " " + p(d.getHours()) + ":" + p(d.getMinutes());
}
function pct(v, max) { return Math.max(0, Math.min(100, (Number(v) || 0) / (Number(max) || 1) * 100)); }

async function toggleSilent(r) {
  try {
    await api("/api/silent", { method: "POST", body: { key: r.key, on: !r.silent } });
    r.silent = !r.silent;
  } catch (e) { toast("操作失败"); }
}

async function del(r) {

  try {
    await api("/api/chat/delete", { method: "POST", body: { key: r.key } });
    rows.value = rows.value.filter((x) => x.key !== r.key);
    toast("已删除");
  } catch (e) { toast("删除失败"); }
}

onMounted(() => { load(); poll = setInterval(() => load(true), 8000); });
onBeforeUnmount(() => { if (poll) clearInterval(poll); });
</script>

<template>
  <div class="chats-fit">
    <div class="countline">共 {{ rows.length }} 个会话</div>

    <div v-if="loading" class="row">读取中…</div>
    <div v-else-if="shown.length === 0" class="row">没有会话</div>

    <template v-else>
      <div class="pager-top">
        <button class="pg" :disabled="pageG === 0" @click="pageG--">‹</button>
        <span>{{ pageG + 1 }} / {{ groupPages }}</span>
        <button class="pg" :disabled="pageG >= groupPages - 1" @click="pageG++">›</button>
      </div>
      <div class="list">
        <div v-for="r in groupPage" :key="r.key" class="chat">
          <div class="head">
            <img :src="r.avatar" class="av" />
            <div class="who">
              <div class="line1">
                <b class="name">{{ label(r) }}</b>
                <span class="kind">群聊</span>
                <span class="qq">{{ r.target }}</span>
                <span v-if="r.silent" class="tag mute">已静音</span>
                <span v-if="r.unread" class="tag">{{ r.unread }} 未读</span>
              </div>
              <div class="meta">
                <span class="status" :class="statusKey(r)"><span class="dot"></span>{{ statusText(r) }}</span>
                <span class="lastline">最后活跃 · {{ fmtLast(r.lastMs) }}</span>
              </div>
            </div>
            <label class="switch" :class="{ on: !r.silent }" @click.prevent="toggleSilent(r)" :title="r.silent ? '已静音，点击恢复' : '不静音，点击静音'"><i></i></label>
            <button class="xbtn" @click="del(r)" title="删除">×</button>
          </div>
          <div class="bars">
            <span class="bar"><span class="blabel">TURN</span><span class="track"><i :style="{ width: pct(r.turns, limits.turns) + '%' }"></i></span><span class="bval">{{ r.turns || 0 }}/{{ limits.turns }}</span></span>
            <span class="bar"><span class="blabel">CHAR</span><span class="track"><i :style="{ width: pct(r.chars, limits.chars) + '%' }"></i></span><span class="bval">{{ Math.round((r.chars || 0) / 1000) }}k/{{ Math.round(limits.chars / 1000) }}k</span></span>
          </div>
        </div>
      </div>

      <div v-if="groupRows.length && privateRows.length" class="divider"></div>

      <div class="pager-top">
        <button class="pg" :disabled="pageP === 0" @click="pageP--">‹</button>
        <span>{{ pageP + 1 }} / {{ privatePages }}</span>
        <button class="pg" :disabled="pageP >= privatePages - 1" @click="pageP++">›</button>
      </div>
      <div class="list">
        <div v-for="r in privatePage" :key="r.key" class="chat">
          <div class="head">
            <img :src="r.avatar" class="av" />
            <div class="who">
              <div class="line1">
                <b class="name">{{ label(r) }}</b>
                <span class="kind">私聊</span>
                <span class="qq">{{ r.target }}</span>
                <span v-if="r.silent" class="tag mute">已静音</span>
                <span v-if="r.unread" class="tag">{{ r.unread }} 未读</span>
              </div>
              <div class="meta">
                <span class="status" :class="statusKey(r)"><span class="dot"></span>{{ statusText(r) }}</span>
                <span class="lastline">最后活跃 · {{ fmtLast(r.lastMs) }}</span>
              </div>
            </div>
            <label class="switch" :class="{ on: !r.silent }" @click.prevent="toggleSilent(r)" :title="r.silent ? '已静音，点击恢复' : '不静音，点击静音'"><i></i></label>
            <button class="xbtn" @click="del(r)" title="删除">×</button>
          </div>
          <div class="bars">
            <span class="bar"><span class="blabel">TURN</span><span class="track"><i :style="{ width: pct(r.turns, limits.turns) + '%' }"></i></span><span class="bval">{{ r.turns || 0 }}/{{ limits.turns }}</span></span>
            <span class="bar"><span class="blabel">CHAR</span><span class="track"><i :style="{ width: pct(r.chars, limits.chars) + '%' }"></i></span><span class="bval">{{ Math.round((r.chars || 0) / 1000) }}k/{{ Math.round(limits.chars / 1000) }}k</span></span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.chats-fit { display: flex; flex-direction: column; }
.countline { font-size: .74rem; color: var(--ink-2); letter-spacing: .08em; margin: 0 0 .15rem; }
.list { display: flex; flex-direction: column; }
.chat { padding: .45rem 0; border-bottom: 1px solid rgba(78,75,66,.14); }
.head { display: flex; align-items: center; gap: .7rem; }
.av { width: 2.2rem; height: 2.2rem; object-fit: cover; }
.who { flex: 1; min-width: 0; }
.line1 { display: flex; gap: .55rem; align-items: baseline; }
.name { font-weight: 400; font-size: 1rem; letter-spacing: .03em; }
.kind { font-size: .64rem; letter-spacing: .14em; border: 1px solid var(--ink-3); padding: 0 .32rem; color: var(--ink-2); }
.qq { font-family: ui-monospace, Consolas, monospace; font-size: .72rem; color: var(--ink-2); }
.tag { font-size: .66rem; border: 1px solid var(--ink-3); padding: 0 .32rem; color: var(--ink-2); }
.tag.mute { border-color: var(--accent); color: var(--accent); }
.meta { display: flex; gap: .9rem; margin-top: .12rem; font-size: .7rem; letter-spacing: .06em; color: var(--ink-2); }
.status { display: inline-flex; align-items: center; gap: .35rem; }
.status .dot { width: .4rem; height: .4rem; border-radius: 50%; background: var(--ink-3); }
.status.busy { color: #7d5aa6; }
.status.busy .dot { background: #7d5aa6; }
.status.active { color: #4f7a3f; }
.status.active .dot { background: #4f7a3f; }

.switch { position: relative; width: 2.6rem; height: 1.35rem; border-radius: 1rem; background: rgba(78,75,66,.18); border: 1px solid var(--ink-3); cursor: pointer; transition: background .18s; flex: none; }
.switch i { position: absolute; top: .1rem; left: .1rem; width: 1.05rem; height: 1.05rem; border-radius: 50%; background: var(--paper); box-shadow: 0 0 0 1px rgba(78,75,66,.25); transition: left .18s; }
.switch.on { background: var(--ink); border-color: var(--ink); }
.switch.on i { left: 1.33rem; background: var(--hl-text); }

.xbtn { border: none; background: transparent; color: var(--ink-2); font-size: 1.15rem; line-height: 1; cursor: pointer; }
.xbtn:hover { color: var(--accent); }

.bars { display: flex; gap: 1.4rem; margin: .3rem 0 0 2.9rem; }
.bar { display: inline-flex; align-items: center; gap: .4rem; }
.blabel { color: var(--ink-2); font-size: .6rem; letter-spacing: .14em; width: 2.7rem; }
.track { display: inline-block; width: 7.5rem; height: .32rem; background: rgba(78,75,66,.14); }
.track i { display: block; height: 100%; background: var(--ink-2); }
.bval { font-size: .66rem; color: var(--ink-2); }

.divider { height: .55rem; background: var(--ink); margin: .4rem 0 .2rem; }
.pager-top { display: flex; align-items: center; justify-content: flex-end; gap: .6rem; padding: .15rem 0 .25rem; font-size: .72rem; color: var(--ink-2); }
.pg { border: 1px solid var(--ink-3); background: transparent; color: var(--ink); font-family: var(--font); font-size: .8rem; line-height: 1; padding: .1rem .55rem; cursor: pointer; }
.pg:disabled { opacity: .35; cursor: default; }
</style>
