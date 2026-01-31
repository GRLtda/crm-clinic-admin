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
  
        <PhoneInputWithDDI
          v-model="form.phone"
          v-model:countryCode="form.ddi"
          label="Telefone com WhatsApp"
          required
        />
        
        <StyledSelect
          v-model="form.plan"
          label="Plano"
          :options="planOptions"
        />

        <StyledSelect
          v-model="form.trialDays"
          label="Período de Teste Gratuito"
          :options="trialOptions"
        />

        <div class="form-checkbox">
          <label class="checkbox-label">
            <input type="checkbox" v-model="form.setupFeeWaived" />
            Desativar Taxa de Setup
          </label>
        </div>

        <div class="form-checkbox">
          <label class="checkbox-label">
            <input type="checkbox" v-model="form.sendWelcomeMessage" />
            Enviar mensagem de boas-vindas
          </label>
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
  import StyledSelect from '../../global/StyledSelect.vue'
  import PhoneInputWithDDI from '../../global/PhoneInputWithDDI.vue'
  
  defineProps({
    show: Boolean
  })
  
  const emit = defineEmits(['close', 'success'])
  
  const store = useInvitationsStore()
  
  const form = reactive({
    name: '',
    email: '',
    phone: '',
    ddi: '55', // Default Brazil
    plan: 'basic', // Default plan
    trialDays: 0, // Default to no trial
    setupFeeWaived: false, // Default to charging setup fee
    sendWelcomeMessage: false
  })
  
  const planOptions = ref([
    { value: 'basic', label: 'Basic' },
    { value: 'premium', label: 'Premium' },
    { value: 'enterprise', label: 'Enterprise' },
    { value: 'enterprise_plus', label: 'Enterprise Plus' }
  ])

  const trialOptions = ref([
    { value: 0, label: 'Sem Teste (Padrão)' },
    { value: 2, label: '2 Dias Grátis' },
    { value: 7, label: '7 Dias Grátis' },
    { value: 30, label: '30 Dias Grátis' }
  ])
  
  const handleSubmit = async () => {
    // Format phone with DDI
    const fullPhone = `${form.ddi}${form.phone.replace(/\D/g, '')}`;

    const invitation = await store.createInvitation(
      form.name,
      form.email,
      fullPhone,
      form.plan,
      form.sendWelcomeMessage,
      form.trialDays,
      form.setupFeeWaived
    )
    
    if (invitation) {
      emit('success', invitation) // Passa o convite (com token) para o pai
      emit('close')
      // Reseta o formulário
      form.name = ''
      form.email = ''
      form.phone = ''
      form.ddi = '55'
      form.plan = 'basic'
      form.trialDays = 0
      form.setupFeeWaived = false
      form.sendWelcomeMessage = false
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
    display: flex;
    gap: 0.3rem;
    background-color: transparent;
    border-top: none;
  }

  /* Checkbox Style */
  .form-checkbox {
    margin-bottom: 1.5rem;
    padding-top: 0.5rem;
  }
  
  .checkbox-label {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.875rem;
    color: #4b5563;
    cursor: pointer;
    user-select: none;
    transition: color 0.2s;
  }

  .checkbox-label:hover {
    color: #1f2937;
  }

  /* Custom Checkbox Input */
  .checkbox-label input[type="checkbox"] {
    appearance: none;
    -webkit-appearance: none;
    background-color: #fff;
    margin: 0;
    font: inherit;
    width: 1.25rem;
    height: 1.25rem;
    border: 1.5px solid #d1d5db;
    border-radius: 0.375rem;
    display: grid;
    place-content: center;
    transition: all 0.2s ease-in-out;
    cursor: pointer;
  }

  .checkbox-label input[type="checkbox"]::before {
    content: "";
    width: 0.75rem;
    height: 0.75rem;
    transform: scale(0);
    transition: 120ms transform ease-in-out;
    box-shadow: inset 1em 1em white;
    transform-origin: center;
    /* Checkmark shape */
    clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%);
  }

  .checkbox-label input[type="checkbox"]:checked {
    background-color: var(--color-primary, #0284c7);
    border-color: var(--color-primary, #0284c7);
  }

  .checkbox-label input[type="checkbox"]:checked::before {
    transform: scale(1);
  }

  .checkbox-label input[type="checkbox"]:focus {
    outline: 2px solid transparent;
    outline-offset: 2px;
    box-shadow: 0 0 0 2px #fff, 0 0 0 4px var(--color-primary, #0284c7);
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