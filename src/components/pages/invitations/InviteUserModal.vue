<template>
    <AppModal :show="show" @close="$emit('close')" width="450px">
      <template #title>Convidar Novo Usuário</template>
      
      <form @submit.prevent="handleSubmit" class="invite-form">
        <p class="modal-subtitle">
          Insira os dados do novo usuário (clínica) para gerar um link de registro.
        </p>
  
        <FormInput
          v-model="form.name"
          label="Nome do Proprietário"
          type="text"
          placeholder="Nome Completo"
          required
        />

        <FormInput
          v-model="form.email"
          label="E-mail do Proprietário (Owner)"
          type="email"
          placeholder="email@dominio.com"
          required
        />
  
        <FormInput
          v-model="form.phone"
          label="Telefone"
          type="tel"
          placeholder="5511999998888"
          required
        />
        
        <div class="form-group">
          <label class="form-label">Plano</label>
          <AppSelect
            v-model="form.plan"
            :options="planOptions"
          />
        </div>
  
        <div class="modal-footer">
          <button type="button" class="btn-secondary" @click="$emit('close')">
            Cancelar
          </button>
          <button type="submit" class="btn-primary" :disabled="store.loadingCreate">
            <Loader2 v-if="store.loadingCreate" :size="18" class="icon-spin" />
            {{ store.loadingCreate ? 'Enviando...' : 'Gerar Convite' }}
          </button>
        </div>
      </form>
    </AppModal>
  </template>
  
  <script setup>
  import { reactive, ref } from 'vue'
  import { useInvitationsStore } from '../../../stores/invitations.js'
  import { Loader2 } from 'lucide-vue-next'
  import AppModal from '../../global/AppModal.vue'
  import FormInput from '../../global/FormInput.vue'
  import AppSelect from '../../global/AppSelect.vue'
  
  defineProps({
    show: Boolean
  })
  
  const emit = defineEmits(['close', 'success'])
  
  const store = useInvitationsStore()
  
  const form = reactive({
    name: '',
    email: '',
    phone: '',
    plan: 'basic' // Default plan
  })
  
  const planOptions = ref([
    { value: 'basic', label: 'Basic' },
    { value: 'premium', label: 'Premium' },
    { value: 'enterprise', label: 'Enterprise' }
  ])
  
  const handleSubmit = async () => {
    const invitation = await store.createInvitation(
      form.name,
      form.email,
      form.phone,
      form.plan
    )
    
    if (invitation) {
      emit('success', invitation) // Passa o convite (com token) para o pai
      emit('close')
      // Reseta o formulário
      form.name = ''
      form.email = ''
      form.phone = ''
      form.plan = 'basic'
    }
  }
  </script>
  
  <style scoped>
  .modal-subtitle {
    font-size: 0.875rem;
    color: #6b7280;
    margin-top: -0.5rem;
    margin-bottom: 1.5rem;
  }
  
  .invite-form {
    display: flex;
    flex-direction: column;
  }
  
  /* Precisamos de um wrapper para o AppSelect que não tem label */
  .form-group {
    width: 100%;
    margin-bottom: 1rem;
  }
  .form-label {
    display: block;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: #333;
  }
  /* Força o AppSelect a ter 100% de largura no modal */
  .form-group :deep(.select-wrapper) {
    width: 100%;
  }
  
  
  /* Sobrescreve o padding do footer do modal */
  .invite-form .modal-footer {
    padding: 1.5rem 0 0; /* Remove padding lateral e superior */
    margin-top: 0.5rem;
    background-color: transparent;
    border-top: none;
  }
  
  /* Estilos de Botões (Baseado no LoginView) */
  .btn-primary, .btn-secondary {
    width: auto;
    padding: 0.625rem 1rem;
    font-size: 0.875rem;
    font-weight: 600;
    border: 1px solid transparent;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }
  
  .btn-primary {
    color: #fff;
    background-color: var(--color-primary, #0284c7);
  }
  .btn-primary:hover:not(:disabled) {
    background-color: var(--color-primary-dark, #0369a1);
  }
  .btn-primary:disabled {
    background-color: #a0c7e8;
    cursor: not-allowed;
  }
  
  .btn-secondary {
    color: #374151;
    background-color: #fff;
    border-color: #d1d5db;
  }
  .btn-secondary:hover {
    background-color: #f9fafb;
  }
  
  .icon-spin {
    animation: spin 1s linear infinite;
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  </style>