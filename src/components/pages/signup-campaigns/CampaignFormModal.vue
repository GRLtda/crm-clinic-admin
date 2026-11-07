<template>
  <AppModal :show="show" width="500px" @close="emit('close')">
    <template #title>{{ isEdit ? 'Editar campanha' : 'Nova campanha' }}</template>

    <form id="campaign-form" class="campaign-form" novalidate @submit.prevent="submit">
      <FormInput
        v-model="form.name"
        label="Nome da campanha"
        name="name"
        placeholder="Posicionamento no Digital"
        :required="true"
        :error="errors.name"
        :disabled="saving"
        @update:model-value="clearError('name')"
      />

      <FormInput
        v-model="form.code"
        label="Código do link"
        name="code"
        placeholder="posicionamento-no-digital"
        :required="!isEdit"
        :disabled="isEdit || saving"
        :error="errors.code"
        :hint="isEdit ? 'O código não pode ser alterado depois de criado.' : `Link: ${campaignLink(form.code || 'codigo')}`"
        @update:model-value="onCodeInput"
      />

      <FormInput
        v-model="form.trialDays"
        label="Dias grátis"
        name="trialDays"
        type="number"
        min="1"
        max="90"
        :required="true"
        :error="errors.trialDays"
        :disabled="saving"
        hint="Teste na Stripe com cartão obrigatório. Vale para novos cadastros."
        @update:model-value="clearError('trialDays')"
      />

      <div class="date-row">
        <FormInput
          v-model="form.startsAt"
          label="Início"
          name="startsAt"
          type="date"
          :error="errors.startsAt"
          :disabled="saving"
          hint="Vazio: começa já."
          @update:model-value="clearError('startsAt')"
        />
        <FormInput
          v-model="form.endsAt"
          label="Fim"
          name="endsAt"
          type="date"
          :error="errors.endsAt"
          :disabled="saving"
          hint="Vazio: sem prazo."
          @update:model-value="clearError('endsAt')"
        />
      </div>

      <FormInput
        v-model="form.active"
        type="checkbox"
        name="active"
        label="Campanha ativa (o link concede o benefício)"
        :disabled="saving"
      />

      <p v-if="generalError" class="general-error" role="alert">{{ generalError }}</p>
    </form>

    <template #footer>
      <button type="button" class="btn-secondary" :disabled="saving" @click="emit('close')">Cancelar</button>
      <button type="submit" form="campaign-form" class="btn-primary" :disabled="saving">
        {{ saving ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Criar campanha' }}
      </button>
    </template>
  </AppModal>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import AppModal from '../../global/AppModal.vue'
import FormInput from '../../global/FormInput.vue'
import {
  campaignLink,
  createCampaign,
  updateCampaign,
  toDateInput,
  startOfDayIso,
  endOfDayIso,
} from '../../../utils/signupCampaigns.js'

const props = defineProps({
  show: { type: Boolean, default: false },
  campaign: { type: Object, default: null },
})
const emit = defineEmits(['close', 'saved'])
const toast = useToast()

const isEdit = computed(() => Boolean(props.campaign?._id))
const saving = ref(false)
const generalError = ref('')
const codeTouched = ref(false)
const form = reactive({ name: '', code: '', trialDays: 30, startsAt: '', endsAt: '', active: true })
const errors = reactive({ name: '', code: '', trialDays: '', startsAt: '', endsAt: '' })

const slugify = (value) => String(value || '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40).replace(/-+$/g, '')

function reset() {
  const c = props.campaign
  Object.assign(form, {
    name: c?.name || '',
    code: c?.code || '',
    trialDays: c?.trialDays ?? 30,
    startsAt: toDateInput(c?.startsAt),
    endsAt: toDateInput(c?.endsAt),
    active: c ? c.active !== false : true,
  })
  Object.keys(errors).forEach((key) => { errors[key] = '' })
  generalError.value = ''
  codeTouched.value = Boolean(c)
}

watch(() => props.show, (open) => { if (open) reset() }, { immediate: true })

// Sugere o código a partir do nome até o usuário editar o código.
watch(() => form.name, (name) => {
  if (!isEdit.value && !codeTouched.value) form.code = slugify(name)
})

function clearError(field) {
  errors[field] = ''
  generalError.value = ''
}

function onCodeInput() {
  codeTouched.value = true
  clearError('code')
}

function validate() {
  let ok = true
  if (!form.name.trim()) { errors.name = 'Informe o nome da campanha.'; ok = false }
  if (!isEdit.value && !/^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/.test(form.code.trim())) {
    errors.code = 'Use até 40 letras minúsculas, números ou hífens, sem hífen no início ou no fim.'
    ok = false
  }
  const days = Number(form.trialDays)
  if (!Number.isInteger(days) || days < 1 || days > 90) { errors.trialDays = 'Informe de 1 a 90 dias.'; ok = false }
  if (form.startsAt && form.endsAt && form.endsAt < form.startsAt) { errors.endsAt = 'O fim deve ser depois do início.'; ok = false }
  return ok
}

async function submit() {
  generalError.value = ''
  if (!validate()) return
  saving.value = true
  const payload = {
    name: form.name.trim(),
    trialDays: Number(form.trialDays),
    startsAt: startOfDayIso(form.startsAt),
    endsAt: endOfDayIso(form.endsAt),
    active: Boolean(form.active),
  }
  try {
    const { data } = isEdit.value
      ? await updateCampaign(props.campaign._id, payload)
      : await createCampaign({ ...payload, code: form.code.trim() })
    toast.success(isEdit.value ? 'Campanha atualizada.' : 'Campanha criada.')
    emit('saved', data)
  } catch (error) {
    const fields = error.response?.data?.fields
    if (fields && Object.keys(fields).some((key) => key in errors)) {
      for (const [key, message] of Object.entries(fields)) if (key in errors) errors[key] = message
    } else {
      generalError.value = error.response?.data?.message || 'Não foi possível salvar a campanha. Tente novamente.'
    }
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.campaign-form {
  display: flex;
  flex-direction: column;
}
.date-row {
  display: grid;
  gap: 0 1rem;
  grid-template-columns: 1fr 1fr;
}
.general-error {
  color: #dc2626;
  font-size: 0.875rem;
  margin: 0.5rem 0 0;
}
.btn-primary,
.btn-secondary {
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  padding: 0.625rem 1rem;
}
.btn-primary {
  background: var(--color-primary, #0284c7);
  border: none;
  color: #fff;
}
.btn-secondary {
  background: #fff;
  border: 1px solid #e5e7eb;
  color: #374151;
}
.btn-primary:disabled,
.btn-secondary:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
@media (max-width: 480px) {
  .date-row {
    grid-template-columns: 1fr;
  }
}
</style>
