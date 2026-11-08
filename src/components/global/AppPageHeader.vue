<template>
  <header class="page-heading">
    <div v-if="icon" class="heading-icon"><component :is="icon" :size="24" /></div>
    <div class="heading-text">
      <h1>{{ title }}</h1>
      <p v-if="subtitle">{{ subtitle }}</p>
    </div>
    <div v-if="$slots.actions" class="heading-actions"><slot name="actions" /></div>
  </header>
</template>

<script setup>
/**
 * Cabeçalho padrão das páginas do admin (ícone + título + subtítulo + ações),
 * idêntico ao da Auditoria do sistema. Ver docs/PADRAO_CABECALHO_PAGINA.md.
 */
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  icon: { type: [Object, Function], required: true },
})
</script>

<style scoped>
.page-heading {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  margin-bottom: 1.25rem;
}
.heading-icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 46px;
  height: 46px;
  border-radius: 12px;
  color: #2563eb;
  background: #eff6ff;
}
.heading-text { min-width: 0; }
.page-heading h1 {
  margin: 0 0 0.2rem;
  font-size: 1.75rem;
  color: #172033;
}
.page-heading p {
  margin: 0;
  color: #64748b;
  font-size: 0.9rem;
}
.heading-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}
@media (max-width: 700px) {
  .page-heading { align-items: flex-start; flex-wrap: wrap; }
  .heading-actions { margin-left: 0; width: 100%; }
}
</style>
