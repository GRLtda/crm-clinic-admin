<template>
    <button :class="buttonClasses" @click="$emit('click')">
      <component v-if="icon" :is="icon" class="icon" :size="18" />
      <span v-if="label">{{ label }}</span>
    </button>
  </template>
  
  <script setup>
  import { computed } from 'vue'
  
  const props = defineProps({
    label: {
      type: String,
      default: ''
    },
    icon: {
      type: Object, // Espera o componente do ícone (ex: LogOut)
      default: null
    },
    // Define a cor/estilo. Ex: 'danger', 'primary', 'ghost'
    variant: {
      type: String,
      default: 'default' // 'default', 'danger', 'ghost'
    }
  })
  
  defineEmits(['click'])
  
  const buttonClasses = computed(() => [
    'action-button',
    `variant-${props.variant}`
  ])
  </script>
  
  <style scoped>
  .action-button {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 0.625rem 0.875rem; /* 10px 14px */
    font-size: 0.875rem; /* 14px */
    font-weight: 500;
    text-align: left;
    border: none;
    border-radius: 0.375rem; /* 6px */
    cursor: pointer;
    transition: background-color 0.2s ease;
    background-color: transparent;
    color: #333;
  }
  
  .icon {
    margin-right: 0.625rem; /* 10px */
    flex-shrink: 0; /* Impede o ícone de encolher */
  }
  
  /* --- Variantes de Cor --- */
  
  /* Padrão (Ghost) */
  .action-button.variant-default:hover {
    background-color: #f4f4f5; /* Cinza bem claro */
    color: #111;
  }
  
  /* Perigo (para Sair) */
  .action-button.variant-danger {
    color: #dc2626; /* Vermelho */
  }
  .action-button.variant-danger:hover {
    background-color: #fee2e2; /* Fundo vermelho claro */
    color: #b91c1c; /* Vermelho escuro */
  }
  </style>