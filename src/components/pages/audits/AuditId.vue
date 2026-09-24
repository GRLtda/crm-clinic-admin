<script setup>
import { Copy } from 'lucide-vue-next'
import { useToast } from 'vue-toastification'

defineProps({ value: { type: String, default: '' }, label: { type: String, default: '' } })
const toast = useToast()

async function copyId(value) {
  if (!value) return
  try {
    await navigator.clipboard.writeText(value)
    toast.success('ID copiado para a área de transferência.')
  } catch {
    toast.error('Não foi possível copiar o ID.')
  }
}
</script>

<template>
  <button v-if="value" type="button" class="copy-id" :title="`Copiar ID ${value}`" @click="copyId(value)">
    <span v-if="label" class="copy-label">{{ label }}</span>
    <span class="id-value">{{ value }}</span>
    <Copy :size="13" aria-hidden="true" />
  </button>
  <span v-else class="missing">{{ label || 'Não informado' }}</span>
</template>

<style scoped>
.copy-id { display: inline-flex; max-width: 100%; align-items: center; gap: .35rem; padding: 0; border: 0; background: transparent; color: #475569; cursor: pointer; text-align: left; }
.copy-id:hover .id-value { color: #2563eb; text-decoration: underline; }
.copy-label { color: #111827; font-weight: 600; }
.id-value { overflow: hidden; font-family: ui-monospace, monospace; font-size: .72rem; text-overflow: ellipsis; white-space: nowrap; }
.copy-label + .id-value::before { content: '· '; color: #94a3b8; }
.missing { color: #94a3b8; }
</style>
