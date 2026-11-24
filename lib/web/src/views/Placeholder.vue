<script setup>
defineProps({ item: { type: Object, default: () => ({ zh: "", en: "" }) } });
</script>

<template>
  <div class="row" style="margin: 0 0 1.2rem">这一页还没迁移，先用旧控制台。</div>
  <div class="card">
    <div class="row">迁移中：接口和功能保持不变，逐页替换。</div>
    <div class="row">
      <a class="btn" :href="'./legacy?t=' + encodeURIComponent(new URLSearchParams(location.search).get('t') || '')" target="_blank">打开旧版控制台</a>
    </div>
  </div>
</template>
