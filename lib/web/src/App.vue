<script setup>
import { onMounted, onBeforeUnmount, ref, computed, watch } from "vue";
import Persona from "./views/Persona.vue";
import RawFile from "./views/RawFile.vue";
import Chats from "./views/Chats.vue";
import Reminders from "./views/Reminders.vue";
import Contacts from "./views/Contacts.vue";
import Mood from "./views/Mood.vue";
import Logs from "./views/Logs.vue";
import chibi from "./assets/chibi.png";
import Slang from "./views/Slang.vue";
import Banned from "./views/Banned.vue";
import Tics from "./views/Tics.vue";
import Stickers from "./views/Stickers.vue";
import Memes from "./views/Memes.vue";
import Bili from "./views/Bili.vue";
import Config from "./views/Config.vue";
import Groups from "./views/Groups.vue";
import Proxy from "./views/Proxy.vue";
import Tieba from "./views/Tieba.vue";
import Placeholder from "./views/Placeholder.vue";

const VIEWS = {
  chats: Chats, reminders: Reminders, contacts: Contacts, mood: Mood, logs: Logs,
  slang: Slang, banned: Banned, tics: Tics, stickers: Stickers,
  bili: Bili, config: Config, groups: Groups, proxy: Proxy, tieba: Tieba, memes: Memes
};

const DESC = {
  persona: "六个分区决定它是谁：身份、性格、语言风格、兴趣、讨厌、其他。兴趣会同步成 B 站兴趣，影响它平时刷什么；讨厌的会尽量避开。",
  talk: "会话满 30 轮或 40 万字符自动轮换；群聊缓存 30 条、每轮注入 30 条；摘要每会话最多 4 段。好感度 0–100，≥75 卖萌、11–25 冷淡、≤10 暴躁，只对名单内生效。",
  reminders: "待办全局最多 10 条，到点私聊或群里 @ 发起人；出现提醒最多 50 条。",
  mood: "六项数值 0–100，按聊天内容加减；敏感度控制加减幅度；变化记录保留最近几十条。",
  lexicon: "黑话分骂人、普通两张表，各 40 条，满了删最旧；禁词是回复里不出现的词或句式；语言模仿学对方口头禅，上限 80 条，每 30 次对话最多用 5 次。",
  stickers: "存储上限 100 张，超了自动删最旧；标签用于按场景挑表情；回复时按概率自动配图。",
  settings: "B 站观看记录最多 50 条，满了删最旧；九宫格图只留最近 20 张，视频抽完即删。行为参数、代理、贴吧也在这里。",
  groups: "群不活跃清理：最少人数、间隔天数、多久没说话、每次最多踢几个、新成员保护期；默认关闭。",
  logs: "dsh-qqbot 最近 150 行日志。"
};
const GROUPS = [
  { id: "persona", zh: "人设", en: "PERSONA", pages: [
    { id: "persona", zh: "人设", en: "IDENTITY", file: "1-persona.md", kind: "persona" },
    { id: "language", zh: "语言", en: "LANGUAGE", file: "2-language.md" },
    { id: "scenes", zh: "场景", en: "SCENES", file: "3-scenes.md" },
    { id: "tools", zh: "工具", en: "TOOLS", file: "4-tools.md" }
  ]},
  { id: "talk", zh: "联系", en: "NETWORK", pages: [
    { id: "chats", zh: "会话", en: "CHATS" },
    { id: "contacts", zh: "社交", en: "CONTACTS" }
  ]},
  { id: "reminders", zh: "待办", en: "TASKS", pages: [{ id: "reminders", zh: "待办", en: "TASKS" }] },
  { id: "mood", zh: "心情", en: "MOOD", pages: [{ id: "mood", zh: "心情", en: "MOOD" }] },

  { id: "lexicon", zh: "词库", en: "LEXICON", pages: [
    { id: "slang", zh: "黑话表", en: "SLANG" },
    { id: "banned", zh: "禁词表", en: "BANNED" },
    { id: "tics", zh: "语言模仿", en: "TICS" },
    { id: "memes", zh: "梗百科", en: "MEMES" }
  ]},
  { id: "stickers", zh: "表情库", en: "STICKERS", pages: [{ id: "stickers", zh: "表情库", en: "STICKERS" }] },
  { id: "settings", zh: "配置", en: "CONFIG", pages: [
    { id: "bili", zh: "B站", en: "BILIBILI" },
    { id: "config", zh: "参数", en: "CONFIG" },
    { id: "proxy", zh: "代理", en: "PROXY" },
    { id: "tieba", zh: "贴吧", en: "TIEBA" }
  ]},
  { id: "groups", zh: "群管理", en: "GROUPS", pages: [{ id: "groups", zh: "群管理", en: "GROUPS" }] },
  { id: "logs", zh: "运行日志", en: "LOGS", pages: [{ id: "logs", zh: "运行日志", en: "LOGS" }] }
];

function fromHash() {
  const h = String(location.hash || "").replace(/^#\/?/, "");
  if (!h) return null;
  const [g, pg] = h.split("/");
  const G = GROUPS.find((x) => x.id === g);
  if (!G) return null;
  return { group: G.id, page: (G.pages.find((x) => x.id === pg) || G.pages[0]).id };
}
const search = ref("");
const flashing = ref(false);
const pageWipe = ref(false);
const __init = fromHash();
const group = ref(__init ? __init.group : "persona");
const page = ref(__init ? __init.page : "persona");

watch(page, () => {
  pageWipe.value = true;
  setTimeout(() => { pageWipe.value = false; }, 280);
});
watch([group, page], () => { search.value = ""; });
watch([group, page], ([g, p]) => { try { location.hash = "#/" + g + "/" + p; } catch {} });
const canvas = ref(null);
let timer = null;
let raf = 0;
let cleanupResize = null;

const curGroup = computed(() => GROUPS.find((g) => g.id === group.value) || GROUPS[0]);
const pages = computed(() => curGroup.value.pages);
const curPage = computed(() => pages.value.find((p) => p.id === page.value) || pages.value[0]);

let groupTimer = 0;
function pickGroup(g) {
  if (g.id === group.value) return;
  flashing.value = true;
  clearTimeout(groupTimer);
  groupTimer = setTimeout(() => {
    group.value = g.id;
    page.value = g.pages[0].id;
  }, 270);
  setTimeout(() => { flashing.value = false; }, 640);
}

function setupParticles() {
  const c = canvas.value;
  if (!c) return;
  const ctx = c.getContext("2d");
  const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight; };
  resize();
  window.addEventListener("resize", resize);
  const ps = Array.from({ length: 46 }, () => ({
    x: Math.random() * c.width, y: Math.random() * c.height,
    s: Math.random() * 1.4 + .5, v: Math.random() * .28 + .06, a: Math.random() * .28 + .08
  }));
  const loop = () => {
    ctx.clearRect(0, 0, c.width, c.height);
    for (const p of ps) {
      p.y -= p.v;
      if (p.y < -4) { p.y = c.height + 4; p.x = Math.random() * c.width; }
      ctx.fillStyle = "rgba(78,75,66," + p.a + ")";
      ctx.fillRect(p.x, p.y, p.s, p.s);
    }
    raf = requestAnimationFrame(loop);
  };
  loop();
  return () => window.removeEventListener("resize", resize);
}

onMounted(() => { cleanupResize = setupParticles(); });
onBeforeUnmount(() => { clearInterval(timer); cancelAnimationFrame(raf); if (cleanupResize) cleanupResize(); });

const view = computed(() => {
  const p = curPage.value;
  if (p.kind === "persona") return Persona;
  if (p.file) return RawFile;
  return VIEWS[p.id] || Placeholder;
});
const hasSearch = computed(() => curPage.value.id === "chats" || curPage.value.id === "contacts");
const viewProps = computed(() => ({ item: curPage.value, file: curPage.value.file, q: search.value }));
</script>

<template>
  <div id="grid"></div>
  <div id="rings"><div class="ring r1"></div><div class="ring r2"></div><div class="ring r3"></div></div>
  <canvas id="particles" ref="canvas"></canvas>
  <div id="scan"></div><div id="vig"></div>
  <div v-if="flashing" class="transit">
    <div v-for="i in 8" :key="i" class="tb" :style="{ '--i': i - 1 }"></div>
  </div>

  <div class="shell">
    <header class="top">
      <div class="brand"><span class="sq"></span>qfish<span class="dim">// 控制台</span></div>
      <div class="rule"></div>
      <div class="top-right">
        <span class="pill on">DSH 在线</span>
        <span class="pill on">QQ 在线</span>
      </div>
    </header>

    <nav class="tabs">
      <button
        v-for="g in GROUPS"
        :key="g.id"
        class="tab"
        :class="{ on: group === g.id }"
        @click="pickGroup(g)"
      >{{ g.zh }} <small>{{ g.en }}</small></button>
    </nav>

    <main class="mainrow">
      <div class="leftcol">
        <div class="grouphead">
          <div class="gh-name">{{ curGroup.zh }}</div>
          <div class="gh-en">{{ curGroup.en }}</div>
          <div class="gh-desc">{{ DESC[curGroup.id] || "" }}</div>
        </div>
        <div class="menu-title">MENU</div>
        <nav class="subnav">
          <ul>
            <li
              v-for="p in pages"
              :key="p.id"
              :class="{ on: page === p.id }"
              @click="page = p.id"
            >{{ p.zh }} <small>{{ p.en }}</small></li>
          </ul>
        </nav>
      </div>

      <div class="center">
        <section class="panel">
          <div class="panel-head">
            <span>{{ curPage.zh }} / {{ curPage.en }}</span>
            <label v-if="hasSearch" class="headsearch">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="10.5" cy="10.5" r="6.5" />
                <path d="M15.5 15.5 21 21" />
              </svg>
              <input v-model="search" type="text" />
            </label>
          </div>
          <div class="panel-body" :class="{ 'no-scroll': ['chats','contacts','mood','slang','banned','tics'].includes(curPage.id) }">
            <div v-if="pageWipe" class="pagewipe"></div>
            <div class="swapwrap" :key="curPage.id">
              <component :is="view" v-bind="viewProps" />
            </div>
          </div>
        </section>
      </div>
    </main>

    <footer class="bar">
      <span>QFISH 0.3.38</span>
      <span>WS 3001</span>
      <img :src="chibi" class="corner" alt="" />
    </footer>
  </div>
</template>
