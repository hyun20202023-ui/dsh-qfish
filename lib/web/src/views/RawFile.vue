<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from "vue";
import { api, toast } from "../api.js";

const props = defineProps({
  file: { type: String, required: true },
  item: { type: Object, default: () => ({}) }
});

const text = ref("");
const loading = ref(true);
const bytes = ref(0);

async function load() {
  loading.value = true;
  try {
    const st = await api("/api/state");
    const f = (st.files || []).find((x) => x.name === props.file);
    text.value = f ? String(f.text || "") : "";
    bytes.value = text.value.length;
  } catch (e) {
    toast("读取失败");
  } finally {
    loading.value = false;
  }
}

let timer = null;
async function save() {
  try {
    await api("/api/file", { method: "POST", body: { name: props.file, text: text.value } });
    bytes.value = text.value.length;
  } catch (e) {
    toast("保存失败");
  }
}
function schedule() {
  clearTimeout(timer);
  timer = setTimeout(save, 400);
}
watch(text, schedule);
onBeforeUnmount(() => clearTimeout(timer));
onMounted(load);
</script>

<template>
  <div v-if="loading" class="row">读取中…</div>
  <textarea v-else v-model="text" rows="20" spellcheck="false" style="min-height: 28rem"></textarea>
</template>
