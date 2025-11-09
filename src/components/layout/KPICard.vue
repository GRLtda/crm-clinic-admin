<template>
    <div class="kpi-card">
      <div class="kpi-icon-wrapper">
        <component :is="icon" :size="24" class="kpi-icon" />
      </div>
      <div class="kpi-content">
        <span class="kpi-title">{{ title }}</span>
        <span class="kpi-value">{{ value }}</span>
      </div>
    </div>
  </template>
  
  <script setup>
  defineProps({
    title: String,
    value: [String, Number],
    icon: Object // Ícone do Lucide
  })
  </script>
  
  <style scoped>
  .kpi-card {
    display: flex;
    align-items: center;
    background-color: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem; /* 12px */
    padding: 1.5rem; /* 24px */
  }
  
  .kpi-icon-wrapper {
    flex-shrink: 0;
    display: grid;
    place-items: center;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background-color: var(--color-primary-light, #e0f2fe); /* Fundo azul claro */
    margin-right: 1rem; /* 16px */
  }
  
  .kpi-icon {
    color: var(--color-primary, #0284c7); /* Azul */
  }
  
  .kpi-content {
    display: flex;
    flex-direction: column;
  }
  
  .kpi-title {
    font-size: 0.875rem; /* 14px */
    font-weight: 500;
    color: #6b7280; /* Cinza */
    margin-bottom: 0.25rem; /* 4px */
  }
  
  .kpi-value {
    font-size: 1.875rem; /* 30px */
    font-weight: 700;
    color: #111827; /* Preto suave */
    line-height: 1;
  }
  </style>