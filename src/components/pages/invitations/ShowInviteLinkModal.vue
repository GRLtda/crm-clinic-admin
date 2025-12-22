<template>
    <AppModal :show="show" @close="$emit('close')" width="550px">
      <template #title>Link de Registro Gerado!</template>
      
      <div v-if="invitation">
        <p class="modal-subtitle">
          Envie o link abaixo para <strong>{{ invitation.email }}</strong>.
          <br>
          Este link é de uso único e expira em <strong>{{ formatRelativeDate(invitation.expiresAt) }}</strong>.
        </p>
  
        <label class="form-label">Link de Registro</label>
        <div class="link-wrapper">
          <input
            type="text"
            :value="registrationLink"
            readonly
            class="link-input"
            @focus="$event.target.select()"
          />
          <button class="copy-button" @click="copy(registrationLink)" title="Copiar link">
            <Check :size="18" v-if="copied" />
            <Copy :size="18" v-else />
          </button>
        </div>
      </div>
  
      <div class="modal-footer">
        <button type="button" class="btn-primary" @click="$emit('close')">
          Concluir
        </button>
      </div>
    </AppModal>
  </template>
  
  <script setup>
  import { computed } from 'vue'
  import { useClipboard } from '../../../composables/useClipboard.js'
  import { Copy, Check } from 'lucide-vue-next'
  import AppModal from '../../global/AppModal.vue'
  
  const props = defineProps({
    show: Boolean,
    invitation: {
      type: Object,
      default: null
    }
  })
  
  defineEmits(['close'])
  
  const { copied, copy } = useClipboard()
  
  const registrationLink = computed(() => {
    if (!props.invitation) return ''
    
    // Constrói a URL do frontend. Assume que o app de registro
    // está na mesma origem (ex: crm.com) e a rota é /register
    const clientUrl = 'https://agendadoutor.com'
    
    return `${clientUrl}/register?token=${props.invitation.token}`
  })
  
  // Helper simples para data relativa
  const formatRelativeDate = (dateString) => {
    const expires = new Date(dateString).getTime()
    const now = new Date().getTime()
    const diff = expires - now
    
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    
    if (days > 1) return `${days} dias`
    if (days === 1) return `1 dia`
    return 'menos de 1 dia'
  }
  </script>
  
  <style scoped>
  .modal-subtitle {
    font-size: 0.875rem;
    color: #6b7280;
    margin-top: -0.5rem;
    margin-bottom: 1.5rem;
    line-height: 1.5;
  }
  .form-label {
    display: block;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: #333;
  }
  
  .link-wrapper {
    display: flex;
    width: 100%;
  }
  .link-input {
    flex: 1;
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
    font-family: monospace;
    color: #111;
    background-color: #f8f9fa;
    border: 1px solid #ced4da;
    border-radius: 0.5rem 0 0 0.5rem;
    border-right: none;
    outline: none;
  }
  
  .copy-button {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 50px;
    background-color: #f8f9fa;
    border: 1px solid #ced4da;
    border-radius: 0 0.5rem 0.5rem 0;
    color: var(--color-primary, #0284c7);
    cursor: pointer;
    transition: background-color 0.2s ease;
  }
  .copy-button:hover {
    background-color: #f1f3f5;
  }
  .copy-button svg {
    color: var(--color-primary, #0284c7);
  }
  .copy-button:deep(svg.icon-check) {
    color: #16a34a; /* Verde sucesso */
  }
  
  
  /* Estilos de Botões */
  .modal-footer {
    padding-top: 1.5rem;
  }
  .btn-primary {
    padding: 0.625rem 1rem;
    font-size: 0.875rem;
    font-weight: 600;
    border: 1px solid transparent;
    border-radius: 0.5rem;
    cursor: pointer;
    color: #fff;
    background-color: var(--color-primary, #0284c7);
  }
  .btn-primary:hover {
    background-color: var(--color-primary-dark, #0369a1);
  }
  </style>