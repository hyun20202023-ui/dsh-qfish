<script setup>
const props = defineProps({ modelValue: { type: Boolean, default: false } });
const emit = defineEmits(["update:modelValue"]);
function flip() { emit("update:modelValue", !props.modelValue); }
</script>

<template>
  <span class="tgl" :class="{ on: modelValue }" @click="flip"><i></i></span>
</template>

<style scoped>
.tgl {
  position: relative; display: inline-block; width: 2.6rem; height: 1.35rem;
  border-radius: 1rem; background: rgba(78,75,66,.18); border: 1px solid var(--ink-3);
  cursor: pointer; transition: background .18s; flex: none;
}
.tgl i {
  position: absolute; top: .1rem; left: .1rem; width: 1.05rem; height: 1.05rem;
  border-radius: 50%; background: var(--paper); box-shadow: 0 0 0 1px rgba(78,75,66,.25);
  transition: left .18s;
}
.tgl.on { background: var(--ink); border-color: var(--ink); }
.tgl.on i { left: 1.33rem; background: var(--hl-text); }
</style>
