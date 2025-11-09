<template>
    <span :class="['status-badge', variantClass]">
      <span class="dot"></span>
      {{ label }}
    </span>
  </template>
  
  <script setup>
  import { computed } from 'vue'
  
  const props = defineProps({
    variant: {
      type: String,
      default: 'neutral' // 'success', 'danger', 'neutral'
    },
    label: {
      type: String,
      required: true
    }
  })
  
  const variantClass = computed(() => `variant-${props.variant}`)
  </script>
  
  <style scoped>
  .status-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.25rem 0.625rem; /* 4px 10px */
    font-size: 0.75rem; /* 12px */
    font-weight: 500;
    border-radius: 9999px; /* Pill shape */
    white-space: nowrap;
  }
  
  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    margin-right: 0.375rem; /* 6px */
  }
  
  /* Success (Ativo) */
  .variant-success {
    background-color: #dcfce7; /* Verde claro */
    color: #166534; /* Verde escuro */
  }
  .variant-success .dot {
    background-color: #22c55e; /* Verde */
  }
  
  /* Danger (Inativo) */
  .variant-danger {
    background-color: #fee2e2; /* Vermelho claro */
    color: #991b1b; /* Vermelho escuro */
  }
  .variant-danger .dot {
    background-color: #ef4444; /* Vermelho */
  }
  
  /* Neutral */
  .variant-neutral {
    background-color: #f3f4f6; /* Cinza claro */
    color: #4b5563; /* Cinza escuro */
  }
  .variant-neutral .dot {
    background-color: #9ca3af; /* Cinza */
  }
  </style>