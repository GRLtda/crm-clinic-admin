<template>
  <AppModal :show="Boolean(campaign)" width="420px" @close="emit('close')">
    <template #title>Excluir campanha</template>

    <div v-if="campaign" class="delete-body">
      <p>
        Excluir <strong>{{ campaign.name }}</strong>? O link
        <code>{{ campaignLink(campaign.code) }}</code> deixa de dar os dias grátis e a campanha sai do painel.
      </p>
      <p>
        Os {{ campaign.stats?.registrations || 0 }} cadastros já feitos e a origem das clínicas continuam
        salvos e aparecem nos filtros de Clínicas e Usuários. O código fica reservado e não pode ser reutilizado.
      </p>
      <p v-if="errorMessage" class="general-error" role="alert">{{ errorMessage }}</p>
    </div>

    <template #footer>
      <button type="button" class="btn-secondary" :disabled="deleting" @click="emit('close')">Cancelar</button>
      <button type="button" class="btn-danger" :disabled="deleting" @click="confirm">
        {{ deleting ? 'Excluindo...' : 'Excluir campanha' }}
      </button>
    </template>
  </AppModal>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import AppModal from '../../global/AppModal.vue'
import { campaignLink, deleteCampaign } from '../../../utils/signupCampaigns.js'

const props = defineProps({ campaign: { type: Object, default: null } })
const emit = defineEmits(['close', 'deleted'])
const toast = useToast()
const deleting = ref(false)
const errorMessage = ref('')

watch(() => props.campaign, () => { errorMessage.value = '' })

async function confirm() {
  deleting.value = true
  errorMessage.value = ''
  try {
    await deleteCampaign(props.campaign._id)
    toast.success('Campanha excluída.')
    emit('deleted')
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Não foi possível excluir a campanha. Tente novamente.'
  } finally {
    deleting.value = false
  }
}
</script>

<style scoped>
.delete-body p { color: #374151; font-size: 0.9rem; line-height: 1.55; margin: 0 0 0.85rem; }
.delete-body code { background: #f1f5f9; border-radius: 4px; font-size: 0.8rem; padding: 1px 4px; word-break: break-all; }
.general-error { color: #dc2626 !important; }
.btn-secondary, .btn-danger { border-radius: 0.5rem; cursor: pointer; font-size: 0.875rem; font-weight: 600; padding: 0.625rem 1rem; }
.btn-secondary { background: #fff; border: 1px solid #e5e7eb; color: #374151; }
.btn-danger { background: #dc2626; border: none; color: #fff; }
.btn-danger:hover { background: #b91c1c; }
.btn-secondary:disabled, .btn-danger:disabled { cursor: not-allowed; opacity: 0.6; }
</style>
