<template>
    <transition name="modal-fade">
      <div v-if="show" class="modal-backdrop" @click.self="close">
        <div class="modal-content" :style="{ maxWidth: width }">
          <div class="modal-header">
            <h3 class="modal-title">
              <slot name="title">Título do Modal</slot>
            </h3>
            <button class="modal-close-button" @click="close">
              <X :size="20" />
            </button>
          </div>
  
          <div class="modal-body">
            <slot />
          </div>
  
          <div v-if="$slots.footer" class="modal-footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </transition>
  </template>
  
  <script setup>
  import { onMounted, onUnmounted } from 'vue'
  import { X } from 'lucide-vue-next'
  
  defineProps({
    show: {
      type: Boolean,
      default: false
    },
    width: {
      type: String,
      default: '500px'
    }
  })
  
  const emit = defineEmits(['close'])
  
  const close = () => {
    emit('close')
  }
  
  // Fechar com a tecla ESC
  const handleEscKey = (e) => {
    if (e.key === 'Escape') {
      close()
    }
  }
  
  onMounted(() => {
    window.addEventListener('keydown', handleEscKey)
  })
  
  onUnmounted(() => {
    window.removeEventListener('keydown', handleEscKey)
  })
  </script>
  
  <style scoped>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }
  
  .modal-content {
    width: 100%;
    background-color: #fff;
    border-radius: 0.75rem;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    max-height: 90vh;
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .modal-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #111827;
    margin: 0;
  }
  
  .modal-close-button {
    background: transparent;
    border: none;
    padding: 0.5rem;
    margin: -0.5rem; /* Ajuste para área de clique */
    border-radius: 50%;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .modal-close-button:hover {
    background-color: #f3f4f6;
    color: #111827;
  }
  
  .modal-body {
    padding: 1.5rem;
    overflow-y: auto;
  }
  
  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 1rem 1.5rem;
    background-color: #f9fafb;
    border-top: 1px solid #e5e7eb;
  }
  
  /* Animação de Fade */
  .modal-fade-enter-active,
  .modal-fade-leave-active {
    transition: opacity 0.2s ease;
  }
  .modal-fade-enter-from,
  .modal-fade-leave-to {
    opacity: 0;
  }
  .modal-fade-enter-active .modal-content,
  .modal-fade-leave-active .modal-content {
    transition: transform 0.2s ease;
  }
  .modal-fade-enter-from .modal-content,
  .modal-fade-leave-to .modal-content {
    transform: translateY(-20px);
  }
  </style>