<template>
    <div class="form-group">
      <label v-if="label" :for="uuid" class="form-label">{{ label }}</label>
      <div class="input-wrapper">
        <input
          :id="uuid"
          :type="type"
          :placeholder="placeholder"
          :value="modelValue"
          @input="$emit('update:modelValue', $event.target.value)"
          class="form-input"
          :disabled="disabled"
          :required="required"
        />
        </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  
  // Gera um ID único para o 'for' do label
  const uuid = ref('input-' + Math.random().toString(36).substring(2, 9))
  
  defineProps({
    label: {
      type: String,
      default: ''
    },
    modelValue: {
      type: [String, Number],
      default: ''
    },
    type: {
      type: String,
      default: 'text'
    },
    placeholder: {
      type: String,
      default: ''
    },
    disabled: {
      type: Boolean,
      default: false
    },
    required: {
      type: Boolean,
      default: false
    }
  })
  
  // Define o evento para o v-model funcionar
  defineEmits(['update:modelValue'])
  </script>
  
  <style scoped>
  .form-group {
    width: 100%;
    margin-bottom: 1rem; /* 16px */
  }
  
  .form-label {
    display: block;
    margin-bottom: 0.5rem; /* 8px */
    font-size: 0.875rem; /* 14px */
    font-weight: 500;
    color: #333; /* Cor escura para o label */
  }
  
  .input-wrapper {
    position: relative;
  }
  
  .form-input {
    width: 100%;
    padding: 0.75rem 1rem; /* 12px 16px */
    font-size: 1rem; /* 16px */
    line-height: 1.5;
    color: #111;
    background-color: #f8f9fa; /* Fundo levemente cinza */
    border: 1px solid #ced4da; /* Borda cinza clara */
    border-radius: 0.5rem; /* 8px (Bordas arredondadas) */
    transition:
      border-color 0.15s ease-in-out,
      box-shadow 0.15s ease-in-out;
    box-sizing: border-box; /* Garante que o padding não afete a largura */
  }
  
  .form-input:focus {
    outline: none;
    border-color: var(--color-primary, #007bff); /* Usa a cor primária do global.css */
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25); /* Sombra de foco */
  }
  
  .form-input::placeholder {
    color: #999; /* Cor do placeholder */
  }
  
  .form-input:disabled {
    background-color: #e9ecef; /* Fundo cinza para desabilitado */
    opacity: 1;
  }
  </style>