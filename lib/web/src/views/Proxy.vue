<script setup>
import { onMounted, ref } from "vue";
import { api, toast } from "../api.js";

const FIELDS = [
  { k: "proxyUrl", label: "代理地址", hint: "http://127.0.0.1:7890 这种" },
  { k: "clashApi", label: "Clash API", hint: "http://127.0.0.1:9090" },
  { k: "clashGroup", label: "Clash 分组", hint: "留空用默认分组" }
];
const st = ref({});
const loading = ref(true);

async function load() {
  loading.value = true;
  try { st.value = (await api("/api/state")).settings || {}; }
  catch (e) { toast("读取失败"); }
  finally { loading.value = false; }
}

async function save(k) {
  try {
    await api("/api/settings", { method: "POST", body: { [k]: String(st.value[k] || "") } });
    toast("已保存");
  } catch (e) { toast("保存失败"); }
}

onMounted(load);
</script>

<template>
  <div v-if="loading" class="row">读取中…</div>
  <div v-else class="card">
    <div v-for="f in FIELDS" :key="f.k" style="margin-bottom: 1.2rem">
      <label class="lbl">{{ f.label }}</label>
      <input v-model="st[f.k]" type="text" :placeholder="f.hint" @change="save(f.k)" />
    </div>
    <div class="dim" style="font-size: .8rem">改完自动保存；代理只影响机器人的网络请求。</div>
  </div>
</template>
