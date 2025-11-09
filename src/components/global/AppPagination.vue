<template>
    <div class="pagination-container" v-if="totalPages > 1">
      <div class="total-info">
        Mostrando <strong>{{ itemsOnPage }}</strong> de
        <strong>{{ totalItems }}</strong> usuários
      </div>
  
      <div class="controls">
        <button
          class="page-button"
          @click="changePage(currentPage - 1)"
          :disabled="currentPage === 1"
        >
          <ChevronLeft :size="16" />
          Anterior
        </button>
  
        <span class="page-numbers">
          Página <strong>{{ currentPage }}</strong> de
          <strong>{{ totalPages }}</strong>
        </span>
  
        <button
          class="page-button"
          @click="changePage(currentPage + 1)"
          :disabled="currentPage === totalPages"
        >
          Próxima
          <ChevronRight :size="16" />
        </button>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
  
  const props = defineProps({
    currentPage: {
      type: Number,
      required: true,
      default: 1
    },
    totalPages: {
      type: Number,
      required: true,
      default: 1
    },
    totalItems: {
      type: Number,
      required: true,
      default: 0
    },
    itemsOnPage: {
      type: Number,
      required: true,
      default: 0
    }
  })
  
  const emit = defineEmits(['page-changed'])
  
  const changePage = (page) => {
    if (page < 1 || page > props.totalPages || page === props.currentPage) {
      return
    }
    emit('page-changed', page)
  }
  </script>
  
  <style scoped>
  .pagination-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    background-color: #fff;
    border-top: 1px solid #e5e7eb;
    border-radius: 0 0 0.75rem 0.75rem; /* Arredonda cantos inferiores */
  }
  
  .total-info {
    font-size: 0.875rem; /* 14px */
    color: #4b5563; /* Cinza */
  }
  
  .controls {
    display: flex;
    align-items: center;
    gap: 0.5rem; /* 8px */
  }
  
  .page-numbers {
    font-size: 0.875rem;
    color: #4b5563;
    margin: 0 0.5rem;
  }
  
  .page-button {
    display: flex;
    align-items: center;
    gap: 0.25rem; /* 4px */
    padding: 0.5rem 1rem; /* 8px 16px */
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
    background-color: #fff;
    border: 1px solid #d1d5db; /* Borda cinza */
    border-radius: 0.375rem; /* 6px */
    cursor: pointer;
    transition: background-color 0.2s ease;
  }
  
  .page-button:hover:not(:disabled) {
    background-color: #f9fafb; /* Fundo cinza claro */
  }
  
  .page-button:disabled {
    color: #9ca3af; /* Cinza mais claro */
    cursor: not-allowed;
    opacity: 0.7;
  }
  </style>