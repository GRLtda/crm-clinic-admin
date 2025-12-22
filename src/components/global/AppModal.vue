<template>
    <transition name="modal-fade">
      <SideDrawer v-if="show" :size="drawerSize" @close="close">
        <template #header>
          <div class="modal-header">
            <h3 class="modal-title">
              <slot name="title">Título do Modal</slot>
            </h3>
            <button class="mobile-close-btn" @click="close">
              <X :size="20" />
            </button>
          </div>
        </template>
  
        <!-- Default slot content -->
        <slot />
  
        <template #footer>
          <div v-if="$slots.footer" class="modal-footer">
            <slot name="footer" />
          </div>
        </template>
      </SideDrawer>
    </transition>
  </template>
  
  <script setup>
  import { onMounted, onUnmounted, computed } from 'vue'
  import { X } from 'lucide-vue-next'
  import SideDrawer from './SideDrawer.vue'
  
  const props = defineProps({
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
  
  // Map width string to SideDrawer size
  const drawerSize = computed(() => {
    // Extract number from pixels string
    const widthNum = parseInt(props.width) || 500
  
    if (widthNum <= 420) return 'sm'
    if (widthNum <= 500) return 'md'
    if (widthNum <= 700) return 'lg'
    return 'xl'
  })
  
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
  
  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 1rem 1.5rem;
    background-color: #f9fafb;
    border-top: 1px solid #e5e7eb;
  }
  
  /* Animação de Fade (wrapper) */
  .modal-fade-enter-active,
  .modal-fade-leave-active {
    transition: opacity 0.2s ease;
  }
  .modal-fade-enter-from,
  .modal-fade-leave-to {
    opacity: 0;
  }
  </style>