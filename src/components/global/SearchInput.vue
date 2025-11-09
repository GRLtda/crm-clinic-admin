<template>
    <div class="search-input-wrapper">
      <Search :size="18" class="search-icon" />
      <input
        type="text"
        :placeholder="placeholder"
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
        class="search-input"
      />
    </div>
  </template>
  
  <script setup>
  import { Search } from 'lucide-vue-next'
  
  defineProps({
    modelValue: {
      type: String,
      default: ''
    },
    placeholder: {
      type: String,
      default: 'Buscar...'
    }
  })
  
  defineEmits(['update:modelValue'])
  </script>
  
  <style scoped>
.search-input-wrapper {
  position: relative;
  width: 320px;
}
  .search-icon {
    position: absolute;
    top: 50%;
    left: 0.875rem; /* 14px */
    transform: translateY(-50%);
    color: #9ca3af; /* Cinza */
    pointer-events: none; /* Permite clicar no input através do ícone */
  }
  
  .search-input {
    width: 100%;
    padding: 0.625rem 1rem 0.625rem 2.5rem; /* 10px 16px 10px 40px */
    font-size: 0.875rem; /* 14px */
    line-height: 1.5;
    color: #111;
    background-color: #fff;
    border: 1px solid #d1d5db; /* Borda cinza */
    border-radius: 0.5rem; /* 8px */
    transition:
      border-color 0.15s ease-in-out,
      box-shadow 0.15s ease-in-out;
    box-sizing: border-box;
  }
  
  .search-input:focus {
    outline: none;
    border-color: var(--color-primary, #007bff);
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
  }
  
  .search-input::placeholder {
    color: #9ca3af;
  }

  @media (max-width: 768px) {
  .search-input-wrapper {
    width: 100%;
  }
}
  </style>