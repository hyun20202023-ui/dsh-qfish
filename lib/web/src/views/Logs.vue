<script setup>
import { onMounted, ref } from "vue";
import { api, toast } from "../api.js";

const text = ref("");
const loading = ref(true);

async function load() {
  loading.value = true;
  try {
    const r = await api("/api/logs");
    text.value = typeof r === "string" ? r : JSON.stringify(r, null, 2);
  } catch (e) {
    toast("读取失败");
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="row" style="margin: 0 0 1.2rem; justify-content: space-between">
    <span>dsh-qqbot 最近日志</span>
    <button class="btn" @click="load">刷新</button>
  </div>
  <div v-if="loading" class="row">读取中…</div>
  <pre v-else class="logs">{{ text }}</pre>
</template>

<style scoped>
.logs {
  margin: 0; padding: 1rem 1.2rem; background: rgba(20,21,21,.06);
  border: 1px solid var(--ink-3); font-family: ui-monospace, Consolas, monospace;
  font-size: .82rem; line-height: 1.55; white-space: pre-wrap; word-break: break-all;
  max-height: 60vh; overflow: auto;
}
</style>
