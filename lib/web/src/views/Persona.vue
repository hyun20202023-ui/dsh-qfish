<script setup>
import { onMounted, ref, watch, onBeforeUnmount } from "vue";
import { api, toast } from "../api.js";

const SECTIONS = [
  { key: "identity", zh: "身份", en: "IDENTITY" },
  { key: "personality", zh: "性格", en: "PERSONALITY" },
  { key: "style", zh: "语言风格", en: "STYLE" },
  { key: "hobby", zh: "兴趣", en: "INTEREST" },
  { key: "dislike", zh: "讨厌", en: "DISLIKE" },
  { key: "other", zh: "其他", en: "OTHER" }
];

const text = ref({ identity: "", personality: "", style: "", hobby: "", dislike: "", other: "" });
const loading = ref(true);
const total = ref(0);

function parse(src) {
  const out = { identity: "", personality: "", style: "", hobby: "", dislike: "", other: "" };
  const byName = {};
  for (const s of SECTIONS) byName[s.zh] = s.key;
  let cur = "";
  for (const line of String(src || "").split(/\r?\n/)) {
    const t = line.trim();
    if (t.startsWith("##")) {
      const name = t.replace(/^#+\s*/, "").trim();
      if (byName[name] === undefined) continue;
      cur = byName[name];
      continue;
    }
    if (cur) out[cur] += line + "\n";
  }
  return out;
}

function build() {
  return SECTIONS.map((s) => "## " + s.zh + "\n" + String(text.value[s.key] || "").trim()).join("\n\n") + "\n";
}

async function load() {
  loading.value = true;
  try {
    const st = await api("/api/state");
    const f = (st.files || []).find((x) => x.name === "1-persona.md");
    if (f) {
      text.value = parse(f.text);
      total.value = String(f.text || "").length;
    }
  } catch (e) {
    toast("人设读取失败");
  } finally {
    loading.value = false;
  }
}

let timer = null;
let saving = false;
async function save() {
  if (saving) return;
  saving = true;
  try {
    await api("/api/file", { method: "POST", body: { name: "1-persona.md", text: build() } });
    total.value = build().length;
  } catch (e) {
    toast("保存失败");
  } finally {
    saving = false;
  }
}

function schedule() {
  clearTimeout(timer);
  timer = setTimeout(save, 350);
}

watch(text, schedule, { deep: true });
onBeforeUnmount(() => clearTimeout(timer));
onMounted(load);
</script>

<template>
  <div class="prop-grid">
    <div v-for="s in SECTIONS" :key="s.key" class="prop">
      <label class="lbl">{{ s.zh }} / {{ s.en }}</label>
      <textarea v-model="text[s.key]" spellcheck="false"></textarea>
    </div>
  </div>
</template>
