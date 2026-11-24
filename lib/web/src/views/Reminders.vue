<script setup>
import { onMounted, ref } from "vue";
import { api, toast } from "../api.js";

const rows = ref([]);
const loading = ref(true);

async function load() {
  loading.value = true;
  try {
    rows.value = (await api("/api/reminders")) || [];
  } catch (e) {
    toast("读取失败");
  } finally {
    loading.value = false;
  }
}

async function del(r) {

  try {
    await api("/api/reminders?id=" + encodeURIComponent(r.id), { method: "DELETE" });
    rows.value = rows.value.filter((x) => x.id !== r.id);
    toast("已删除");
  } catch (e) {
    toast("删除失败");
  }
}

onMounted(load);
</script>

<template>
  <div class="row" style="margin: 0 0 1.2rem; justify-content: space-between">
    <span>共 {{ rows.length }} 条提醒</span>
    <span class="dim">新提醒由机器人创建</span>
  </div>
  <div v-if="loading" class="row">读取中…</div>
  <div v-else-if="rows.length === 0" class="row">没有待办</div>

  <div v-for="r in rows" :key="r.id" class="card" style="margin-bottom: .9rem; padding: 1rem 1.2rem">
    <div style="display: flex; gap: 1rem; align-items: flex-start">
      <img :src="r.avatar" style="width: 2.6rem; height: 2.6rem; object-fit: cover" />
      <div style="flex: 1">
        <div style="display: flex; gap: .8rem; align-items: baseline">
          <b style="font-weight: 400">{{ r.text }}</b>
          <span class="dim">{{ r.kind }} · {{ r.target }}</span>
        </div>
        <div class="dim" style="margin-top: .3rem">{{ r.time }}</div>
      </div>
      <button class="btn danger" @click="del(r)">删除</button>
    </div>
  </div>
</template>
