<script setup>
import { onMounted, ref } from "vue";
import { api, toast } from "../api.js";

const cookie = ref("");
const loading = ref(true);

async function load() {
  loading.value = true;
  try {
    const s = (await api("/api/state")).settings || {};
    cookie.value = String(s.baiduCookie || "");
  } catch (e) {
    toast("读取失败");
  } finally {
    loading.value = false;
  }
}

async function save() {
  try {
    await api("/api/settings", { method: "POST", body: { baiduCookie: cookie.value.trim() } });
    toast("已保存");
  } catch (e) {
    toast("保存失败");
  }
}

onMounted(load);
</script>

<template>
  <div v-if="loading" class="row">读取中…</div>
  <div v-else class="card">
    <label class="lbl">百度贴吧 Cookie</label>
    <textarea v-model="cookie" rows="6" placeholder="粘贴贴吧的 Cookie" style="min-height: 8rem"></textarea>
    <div class="row" style="justify-content: flex-end">
      <button class="btn" @click="save">保存</button>
    </div>
  </div>
</template>
