<template>
  <div class="clinic-detail-view">
    <div class="page-header">
      <RouterLink to="/clinics" class="back-button">
        <ArrowLeft :size="18" />
        Voltar para Clínicas
      </RouterLink>
    </div>

    <div v-if="store.loadingDetail" class="loading-state">
      <Loader2 :size="48" class="icon-spin" />
      <p>Carregando dados da clínica...</p>
    </div>

    <div v-else-if="store.selectedClinic" class="detail-content">
      <div class="detail-header">
        <div class="logo-wrapper-large">
          <img v-if="clinic.logoUrl && !logoFailed" :src="clinic.logoUrl" :alt="clinic.name" class="logo" @error="logoFailed = true" />
          <Building2 v-else :size="48" class="logo-placeholder" />
        </div>
        <div class="info-header">
          <h1 class="clinic-name">{{ clinic.name }}</h1>
          <span class="clinic-id">ID: {{ clinic._id }}</span>
          <div class="header-tags">
            <span class="plan-tag">
              {{ clinic.plan }}
            </span>
            <span 
              v-if="clinic.subscriptionStatus" 
              class="status-tag"
              :class="statusClasses[clinic.subscriptionStatus] || 'status-gray'"
            >
              {{ statusLabels[clinic.subscriptionStatus] || clinic.subscriptionStatus }}
            </span>
            <span v-else class="status-tag status-gray">Sem Assinatura</span>
          </div>
        </div>
        
      </div>

      <div class="clinic-tab-layout">
        <aside class="clinic-tab-sidebar" aria-label="Navegação da clínica">
          <button type="button" class="clinic-tab-button" :class="{ active: activeTab === 'details' }" @click="activeTab = 'details'"><Building2 :size="18" /> Dados clínica</button>
          <button type="button" class="clinic-tab-button" :class="{ active: activeTab === 'subscription' }" @click="activeTab = 'subscription'"><Crown :size="18" /> Assinatura</button>
          <button type="button" class="clinic-tab-button" disabled aria-disabled="true"><ShieldCheck :size="18" /> Auditoria</button>
        </aside>
        <div class="clinic-tab-content">
      <div v-if="activeTab === 'details'" class="detail-grid">
        
        <div class="grid-column">
          <div class="info-card">
            <h4>Informações Principais</h4>
            <div class="info-item">
              <span class="label">Nome Marketing</span>
              <span class="value" :class="{ 'placeholder': !clinic.name }">
                {{ clinic.name || 'Não informado' }}
              </span>
            </div>
            <div class="info-item">
              <span class="label">Responsável</span>
              <span class="value" :class="{ 'placeholder': !clinic.responsibleName }">
                {{ clinic.responsibleName || 'Não informado' }}
              </span>
            </div>
            <div class="info-item">
              <span class="label">CNPJ</span>
              <span class="value" :class="{ 'placeholder': !clinic.cnpj }">
                {{ clinic.cnpj || 'Não informado' }}
              </span>
            </div>
          </div>
          
          <div class="info-card">
            <h4>Endereço</h4>
            <div class="info-item">
              <span class="label">CEP</span>
              <span class="value" :class="{ 'placeholder': !clinic.address?.cep }">
                {{ clinic.address?.cep || 'Não informado' }}
              </span>
            </div>
            <div class="info-item">
              <span class="label">Logradouro</span>
              <span class="value" :class="{ 'placeholder': !clinic.address?.street }">
                {{ clinic.address?.street || 'Não informado' }}, {{ clinic.address?.number || 'S/N' }}
              </span>
            </div>
            <div class="info-item">
              <span class="label">Bairro</span>
              <span class="value" :class="{ 'placeholder': !clinic.address?.district }">
                {{ clinic.address?.district || 'Não informado' }}
              </span>
            </div>
            <div class="info-item">
              <span class="label">Cidade / Estado</span>
              <span class="value" :class="{ 'placeholder': !clinic.address?.city }">
                {{ clinic.address?.city || '?' }} / {{ clinic.address?.state || '?' }}
              </span>
            </div>
          </div>
        </div>

        <div class="grid-column">
          <div class="info-card">
            <h4>Proprietário (Owner)</h4>
            <div class="info-item">
              <span class="label">Nome</span>
              <span class="value" :class="{ 'placeholder': !clinic.owner?.name }">
                {{ clinic.owner?.name || 'Não informado' }}
              </span>
            </div>
            <div class="info-item">
              <span class="label">Email</span>
              <span class="value" :class="{ 'placeholder': !clinic.owner?.email }">
                {{ clinic.owner?.email || 'Não informado' }}
              </span>
            </div>
            <div class="info-item">
              <span class="label">Telefone</span>
              <span class="value" :class="{ 'placeholder': !clinic.owner?.phone }">
                {{ clinic.owner?.phone || 'Não informado' }}
              </span>
            </div>
          </div>
          
          <div class="info-card">
            <h4>Equipe (Staff)</h4>
            <ul v-if="clinic.staff && clinic.staff.length > 0" class="staff-list">
              <li v-for="staff in clinic.staff" :key="staff._id" class="staff-item">
                <User :size="16" />
                <div class="staff-info">
                  <span class="value">{{ staff.name }}</span>
                  <span class="label">{{ staff.role }} - {{ staff.email }}</span>
                </div>
              </li>
            </ul>
            <p v-else class="empty-list">Nenhum funcionário cadastrado.</p>
          </div>
        </div>
        
        <div class="info-card grid-span-all">
          <h4>Horário de Funcionamento</h4>
          <ul class="working-hours-list">
            <li v-for="day in clinic.workingHours" :key="day.day" class="day-item">
              <span class="day-name">{{ day.day }}</span>
              <span v-if="day.isOpen" class="day-time">
                {{ day.startTime }} - {{ day.endTime }}
              </span>
              <span v-else class="day-closed">
                Fechado
              </span>
            </li>
          </ul>
        </div>

      </div>
      <section v-else-if="activeTab === 'subscription'" class="subscription-panel">
        <div class="subscription-panel-header"><div><h2>Assinatura</h2><p>Gerencie o plano, o status do pagamento e a taxa de instalação.</p></div><span class="status-tag" :class="statusClasses[clinic.subscriptionStatus] || 'status-gray'">{{ statusLabels[clinic.subscriptionStatus] || 'Sem assinatura' }}</span></div>
        <div class="subscription-form-grid">
          <div class="subscription-field"><label>Plano da clínica</label><p>Plano disponível para a clínica.</p><div class="subscription-input-row"><AppSelect v-model="selectedPlan" :options="planOptions" :disabled="loadingAction" class="subscription-select" /><button class="btn-save-status" :disabled="loadingAction || selectedPlan === clinic.plan" @click="handleSavePlan">Salvar plano</button></div></div>
          <div class="subscription-field"><label>Status do pagamento</label><p>Atualiza o status administrativo da assinatura.</p><div class="subscription-input-row"><AppSelect v-model="selectedSubscriptionStatus" :options="subscriptionStatusOptions" :disabled="loadingAction" class="subscription-select" /><button class="btn-save-status" :disabled="loadingAction || !hasSubscriptionStatusChange" @click="handleUpdateSubscriptionStatus">Salvar status</button></div></div>
          <div class="subscription-field fee-field"><div class="fee-row"><div><label>Taxa de instalação</label><p>{{ feeWaived ? 'Taxa dispensada para esta clínica.' : clinic.installationFeeCharged ? 'Taxa já paga ou satisfeita.' : 'Taxa pendente para esta clínica.' }}</p></div><button v-if="authStore.user?.role === 'super admin'" type="button" class="fee-toggle" :class="{ active: feeWaived }" role="switch" :aria-checked="feeWaived" :aria-label="feeWaived ? 'Colocar taxa de instalação novamente' : 'Retirar taxa de instalação'" :disabled="loadingAction || (clinic.installationFeeCharged && !feeWaived)" @click="handleInstallationFeeToggle"><span class="fee-toggle-knob"></span></button></div><small v-if="authStore.user?.role === 'super admin'" class="fee-hint">{{ feeWaived ? 'Desative o controle para cobrar a taxa no próximo checkout.' : clinic.installationFeeCharged ? 'A taxa paga não pode ser recolocada.' : 'Ative o controle para dispensar a taxa.' }}</small></div>
        </div>
        <button type="button" class="advanced-plan-button" @click="openPlanModal"><Edit2 :size="15" /> Configurações avançadas do plano</button>
      </section>
        </div>
      </div>
    </div>
    
    <div v-else class="empty-state">
      <AlertTriangle :size="48" />
      <h3>Clínica não encontrada</h3>
      <p>Não foi possível carregar os dados desta clínica.</p>
    </div>
    <!-- Configurações avançadas do plano -->
    <SideDrawer 
      v-if="showPlanModal" 
      @close="closePlanModal" 
      size="md"
    >
      <template #header>
        <div class="drawer-header">
          <div><h3>Configurações do plano</h3><p>Personalize o plano e os limites desta clínica.</p></div>
          <!-- Botão de fechar mobile que o SideDrawer espera -->
          <button @click="closePlanModal" class="mobile-close-btn">
            <X :size="20" />
          </button>
        </div>
      </template>

      <div class="drawer-body-content">
        <div class="drawer-section">
          <h4>Plano base</h4>
          <p class="drawer-description">Selecione o plano aplicado à clínica.</p>
          <AppSelect v-model="selectedPlan" label="Plano" :options="planOptions" :disabled="loadingAction" />
        </div>

        <div class="drawer-section">
          <h4>Funcionalidades adicionais</h4>
          <p class="drawer-description">Ajustes específicos desta clínica além do plano base.</p>
          <div class="overrides-list">
            <label v-for="(enabled, key) in overrides.modules" :key="key" class="override-item">
              <span class="override-copy"><strong>{{ moduleLabels[key] || key }}</strong><small>Disponível para esta clínica</small></span>
              <input v-model="overrides.modules[key]" type="checkbox" class="override-checkbox" :disabled="loadingAction" />
            </label>
          </div>
        </div>

        <div class="drawer-section">
          <h4>Limites adicionais</h4>
          <p class="drawer-description">Use zero para manter o limite padrão do plano.</p>
          <div class="form-group">
            <label for="extra-doctors">Profissionais extras</label>
            <input id="extra-doctors" v-model.number="overrides.limits.doctors" type="number" min="0" step="1" class="drawer-number-input" :disabled="loadingAction" />
          </div>
        </div>
      </div>

      <template #footer>
        <div class="drawer-footer">
          <button type="button" @click="closePlanModal" class="btn-cancel">Cancelar</button>
          <button 
            type="button"
            @click="handleUpdatePlan" 
            class="btn-confirm"
            :disabled="loadingAction"
          >
            {{ loadingAction ? 'Salvando...' : 'Salvar Alterações' }}
          </button>
        </div>
      </template>
    </SideDrawer>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, computed, ref, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useClinicsStore } from '../stores/clinics.js'
import { useAuthStore } from '../stores/auth.js'
import SideDrawer from '../components/global/SideDrawer.vue'
import AppSelect from '../components/global/AppSelect.vue'
import { ArrowLeft, Loader2, Building2, User, AlertTriangle, Crown, Edit2, X, ShieldCheck } from 'lucide-vue-next'

const store = useClinicsStore()
const authStore = useAuthStore()
const route = useRoute()

const clinic = computed(() => store.selectedClinic)
const feeWaived = computed(() => Boolean(clinic.value?.installationFeeWaived || clinic.value?.installationFeeCanRestore))
const loadingAction = ref(false)
const activeTab = ref('details')
const logoFailed = ref(false)
const selectedSubscriptionStatus = ref('')

// Estado do Modal de Edição de Plano
const showPlanModal = ref(false)
const selectedPlan = ref('')
const overrides = ref({
  modules: { workflows: false, finance: false, whatsapp: false, ai_reports: false },
  limits: { doctors: 0 }
})
const moduleLabels = { workflows: 'Fluxos de trabalho', finance: 'Financeiro', whatsapp: 'WhatsApp', ai_reports: 'Relatórios com IA' }

const planOptions = [
  { value: 'basic', label: 'Básico' },
  { value: 'premium', label: 'Premium' },
  { value: 'enterprise', label: 'Enterprise' },
  { value: 'enterprise_plus', label: 'Enterprise Plus' }
]

const statusLabels = {
  active: 'Ativo',
  past_due: 'Atrasado',
  canceled: 'Cancelado',
  incomplete: 'Incompleto',
  incomplete_expired: 'Expirado',
  trialing: 'Em Teste',
  unpaid: 'Não Pago',
  lifetime: 'Vitalício'
}

const subscriptionStatusOptions = [
  { value: 'active', label: 'Ativo / Pago' },
  { value: 'past_due', label: 'Atrasado' },
  { value: 'canceled', label: 'Cancelado' },
  { value: 'incomplete', label: 'Incompleto' },
  { value: 'incomplete_expired', label: 'Expirado' },
  { value: 'trialing', label: 'Em Teste' },
  { value: 'unpaid', label: 'Não Pago' },
  { value: 'lifetime', label: 'Vitalício' }
]

const statusClasses = {
  active: 'status-green',
  past_due: 'status-orange',
  canceled: 'status-red',
  incomplete: 'status-gray',
  incomplete_expired: 'status-gray',
  trialing: 'status-blue',
  unpaid: 'status-red',
  lifetime: 'status-purple'
}

const hasSubscriptionStatusChange = computed(() => {
  return Boolean(
    clinic.value
    && selectedSubscriptionStatus.value
    && selectedSubscriptionStatus.value !== clinic.value.subscriptionStatus
  )
})

watch(() => clinic.value?.subscriptionStatus, (newStatus) => {
  selectedSubscriptionStatus.value = newStatus || 'active'
}, { immediate: true })
watch(() => clinic.value?.plan, (newPlan) => { selectedPlan.value = newPlan || 'basic' }, { immediate: true })
watch(() => clinic.value?.logoUrl, () => { logoFailed.value = false })

async function handleSavePlan() {
  if (!clinic.value || selectedPlan.value === clinic.value.plan) return
  if (!confirm(`Alterar o plano da clínica para ${planOptions.find(option => option.value === selectedPlan.value)?.label || selectedPlan.value}?`)) return
  loadingAction.value = true
  try { await store.updateClinicPlan(clinic.value._id, selectedPlan.value) }
  finally { loadingAction.value = false }
}

async function handleInstallationFeeToggle() {
  if (!clinic.value || (clinic.value.installationFeeCharged && !feeWaived.value)) return
  const waived = !feeWaived.value
  if (!confirm(waived ? 'Retirar a taxa de instalação desta clínica?' : 'Colocar a taxa de instalação novamente para o próximo checkout?')) return
  loadingAction.value = true
  try { await store.setInstallationFeeWaived(clinic.value._id, waived) }
  finally { loadingAction.value = false }
}

async function handleUpdateSubscriptionStatus() {
  if (!hasSubscriptionStatusChange.value) return

  const statusLabel = statusLabels[selectedSubscriptionStatus.value] || selectedSubscriptionStatus.value
  if (!confirm(`Tem certeza que deseja alterar o status da assinatura para "${statusLabel}"?`)) return

  loadingAction.value = true
  await store.updateSubscriptionStatus(clinic.value._id, selectedSubscriptionStatus.value)
  loadingAction.value = false
}

async function handleSetLifetime() {
  if (!confirm('Tem certeza que deseja tornar esta assinatura vitalícia?')) return
  
  loadingAction.value = true
  await store.updateSubscriptionStatus(clinic.value._id, 'lifetime')
  loadingAction.value = false
}

async function handleRemoveLifetime() {
  if (!confirm('Tem certeza que deseja remover o status vitalício? O status voltará para "canceled".')) return
  
  loadingAction.value = true
  await store.updateSubscriptionStatus(clinic.value._id, 'canceled')
  loadingAction.value = false
}

function openPlanModal() {
  selectedPlan.value = clinic.value.plan || 'basic'
  
  // Init overrides based on clinic data or defaults
  if (clinic.value.planOverrides) {
     overrides.value.modules = { ...overrides.value.modules, ...(clinic.value.planOverrides.modules || {}) }
     overrides.value.limits = { ...overrides.value.limits, ...(clinic.value.planOverrides.limits || {}) }
  }
  
  showPlanModal.value = true
}

function closePlanModal() {
  showPlanModal.value = false
}

async function handleUpdatePlan() {
  if (!confirm(`Tem certeza que deseja salvar as alterações de plano e overrides?`)) return

  loadingAction.value = true
  
  // 1. Update Plan if changed
  if (selectedPlan.value && selectedPlan.value !== clinic.value.plan) {
      await store.updateClinicPlan(clinic.value._id, selectedPlan.value)
  }

  // 2. Update Overrides (We need a new store action for this)
  await store.updateClinicOverrides(clinic.value._id, overrides.value);

  closePlanModal()
  loadingAction.value = false
}

onMounted(() => {
  store.fetchClinicById(route.params.id)
})

onUnmounted(() => {
  store.clearSelectedClinic()
})
</script>

<style scoped>
.clinic-tab-layout { display: grid; grid-template-columns: 220px minmax(0, 1fr); align-items: start; gap: 1.25rem; }
.clinic-tab-sidebar { position: sticky; top: 1rem; display: flex; flex-direction: column; gap: .25rem; padding: .5rem; background: #fff; border: 1px solid #e5e7eb; border-radius: 1rem; }
.clinic-tab-button { display: flex; align-items: center; gap: .75rem; min-height: 44px; padding: .65rem .75rem; border: 1px solid transparent; border-radius: .625rem; background: transparent; color: #475569; font: inherit; font-size: .875rem; font-weight: 600; text-align: left; cursor: pointer; }
.clinic-tab-button:hover:not(:disabled) { background: #f8fafc; color: #0f172a; }
.clinic-tab-button.active { background: #eef4ff; border-color: #dbeafe; color: #2563eb; }
.clinic-tab-button:disabled { color: #94a3b8; cursor: not-allowed; }
.subscription-select { min-width: 0; flex: 1; }
.clinic-tab-content { min-width: 0; }
.subscription-panel { padding: 1.5rem; background: #fff; border: 1px solid #e5e7eb; border-radius: 1rem; }
.subscription-panel-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; padding-bottom: 1.25rem; border-bottom: 1px solid #e5e7eb; }
.subscription-panel-header h2 { margin: 0 0 .35rem; color: #111827; font-size: 1.25rem; }
.subscription-panel-header p,.subscription-field p { margin: 0; color: #64748b; font-size: .85rem; }
.subscription-form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; padding: 1.25rem 0; }
.subscription-field { padding: 1.1rem; border: 1px solid #e5e7eb; border-radius: .75rem; background: #fbfdff; }
.subscription-field label { display: block; margin-bottom: .25rem; color: #1f2937; font-size: .9rem; font-weight: 700; }
.subscription-input-row { display: flex; gap: .6rem; margin-top: 1rem; }
.subscription-input-row select { min-width: 0; flex: 1; }
.subscription-input-row button { white-space: nowrap; }
.fee-field { grid-column: 1 / -1; }
.fee-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.fee-hint { display: block; margin-top: .65rem; color: #64748b; font-size: .75rem; }
.fee-toggle { position: relative; flex: 0 0 44px; width: 44px; height: 26px; padding: 0; border: 0; border-radius: 999px; background: #cbd5e1; cursor: pointer; transition: background .2s; }
.fee-toggle.active { background: #2563eb; }
.fee-toggle:disabled { opacity: .5; cursor: not-allowed; }
.fee-toggle:focus-visible { outline: 3px solid #93c5fd; outline-offset: 2px; }
.fee-toggle-knob { position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; border-radius: 50%; background: white; box-shadow: 0 1px 3px #0f172a33; transition: transform .2s; }
.fee-toggle.active .fee-toggle-knob { transform: translateX(18px); }
.btn-waive-fee,.advanced-plan-button { display: inline-flex; align-items: center; gap: .45rem; margin-top: 1rem; padding: .65rem .9rem; border: 1px solid #cbd5e1; border-radius: .5rem; background: #fff; color: #334155; font: inherit; font-size: .85rem; font-weight: 600; cursor: pointer; }
.btn-waive-fee:disabled,.subscription-input-row button:disabled { opacity: .55; cursor: not-allowed; }
.advanced-plan-button { margin-top: 0; }
@media (max-width: 950px) { .clinic-tab-layout { grid-template-columns: 1fr; }.clinic-tab-sidebar { position: static; flex-direction: row; flex-wrap: wrap; }.subscription-form-grid { grid-template-columns: 1fr; } }
@media (max-width: 600px) { .clinic-tab-sidebar { flex-direction: column; }.subscription-input-row { flex-direction: column; }.subscription-panel { padding: 1rem; } }
/* Header da Página */
.page-header {
  margin-bottom: 1.5rem;
}
.back-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  border: 1px solid #d1d5db;
  background-color: #fff;
  transition: background-color 0.2s ease;
}
.back-button:hover {
  background-color: #f9fafb;
}

/* Estado de Carregamento */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 5rem 0;
  color: #6b7280;
}
.icon-spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Header da Clínica */
.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between; /* Espaça o info das ações */
  gap: 1.5rem;
  background-color: #fff;
  padding: 2rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
}
.logo-wrapper-large {
  flex-shrink: 0;
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background-color: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e5e7eb;
}
.logo-wrapper-large .logo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}
.logo-wrapper-large .logo-placeholder {
  color: #9ca3af;
}

.info-header {
  display: flex;
  flex-direction: column;
  flex-grow: 1; /* Ocupa o espaço restante */
}
.clinic-name {
  font-size: 1.875rem; /* 30px */
  font-weight: 700;
  color: #111827;
  margin: 0;
}
.clinic-id {
  font-size: 0.875rem;
  color: #9ca3af;
  margin-bottom: 0.75rem;
}
.header-tags {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
.plan-tag {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-primary, #0284c7);
  background-color: var(--color-primary-light, #e0f2fe);
  padding: 0.25rem 0.625rem;
  border-radius: 99px;
  text-transform: capitalize;
}

.status-tag {
  font-size: 0.875rem;
  font-weight: 500;
  padding: 0.25rem 0.625rem;
  border-radius: 99px;
  text-transform: capitalize;
}

.status-green {
  color: #166534;
  background-color: #dcfce7;
}
.status-blue {
  color: #1e40af;
  background-color: #dbeafe;
}
.status-orange {
  color: #9a3412;
  background-color: #ffedd5;
}
.status-red {
  color: #991b1b;
  background-color: #fee2e2;
}
.status-gray {
  color: #374151;
  background-color: #f3f4f6;
}
.status-purple {
  color: #6b21a8;
  background-color: #f3e8ff;
  border: 1px solid #d8b4fe;
}

/* Ações do Header */
.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.subscription-status-control {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  min-width: 260px;
}

.subscription-status-control label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
}

.subscription-status-form {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-select {
  min-width: 150px;
}

.btn-save-status {
  padding: 0.625rem 0.875rem;
  background-color: #2563eb;
  border: 1px solid transparent;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: white;
  cursor: pointer;
  transition: background-color 0.2s, opacity 0.2s;
}
.btn-save-status:hover {
  background-color: #1d4ed8;
}
.btn-save-status:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.btn-lifetime {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: #7e22ce; /* Roxo */
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}
.btn-lifetime:hover {
  background-color: #6b21a8;
}
.btn-lifetime:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-remove-lifetime {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: #fff;
  color: #ef4444; /* Vermelho */
  border: 1px solid #ef4444;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}
.btn-remove-lifetime:hover {
  background-color: #fef2f2;
}
.btn-remove-lifetime:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}


/* Grid de Detalhes */
.detail-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 1.5rem;
}
@media (min-width: 1024px) {
  .detail-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
.grid-column {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.grid-span-all {
  @media (min-width: 1024px) {
    grid-column: span 2 / span 2;
  }
}

/* Card de Informação Genérico */
.info-card {
  background-color: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
}
.info-card h4 {
  font-size: 1.125rem; /* 18px */
  font-weight: 600;
  color: #111827;
  margin: 0 0 1rem;
  border-bottom: 1px solid #f3f4f6;
  padding-bottom: 0.75rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
}
.info-item:last-child {
  margin-bottom: 0;
}
.label {
  font-size: 0.75rem; /* 12px */
  font-weight: 500;
  color: #6b7280;
  text-transform: uppercase;
  margin-bottom: 0.25rem;
}
.value {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  word-break: break-word;
}
/* Estilo do Placeholder (cinza e itálico) */
.value.placeholder {
  color: #9ca3af;
  font-style: italic;
}

/* Listas */
.staff-list, .working-hours-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.staff-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.staff-item svg {
  color: #6b7280;
  flex-shrink: 0;
}
.staff-info {
  display: flex;
  flex-direction: column;
}
.staff-info .label {
  font-size: 0.75rem;
  margin: 0;
  text-transform: none;
}

.day-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
  padding: 0.5rem 0;
}
.day-name {
  font-weight: 500;
  color: #374151;
}
.day-time {
  font-weight: 500;
  color: #166534; /* Verde */
}
.day-closed {
  font-weight: 500;
  color: #991b1b; /* Vermelho */
}
.empty-list {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

/* Estado de Erro/Vazio */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: #b91c1c;
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.75rem;
}
.empty-state h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #991b1b;
  margin: 1rem 0 0.25rem;
}
.empty-state p {
  font-size: 0.875rem;
  color: #b91c1c;
  margin: 0;
}
/* Botão de Edição de Plano */
.btn-edit-plan {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 0;
  margin-left: 0.5rem;
  display: inline-flex;
  opacity: 0.7;
  transition: opacity 0.2s;
}
.btn-edit-plan:hover {
  opacity: 1;
}

/* Drawer Styles */
.drawer-header {
  padding: 1.5rem 1.5rem 1rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.drawer-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
}
.drawer-header p { margin: .3rem 0 0; color: #64748b; font-size: .82rem; }

.drawer-body-content {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  width: 100%;
  box-sizing: border-box;
}
.drawer-section { padding: 1.15rem; border: 1px solid #e2e8f0; border-radius: .85rem; background: #fff; }
.drawer-section h4 { margin: 0 0 .3rem; color: #172033; font-size: .95rem; font-weight: 700; }
.drawer-section .drawer-description { margin-bottom: 1rem; }
.overrides-list { display: flex; flex-direction: column; gap: .55rem; }
.override-item { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: .8rem .9rem; border: 1px solid #e2e8f0; border-radius: .65rem; background: #f8fafc; cursor: pointer; }
.override-copy { display: flex; flex-direction: column; gap: .2rem; }
.override-copy strong { color: #1e293b; font-size: .85rem; font-weight: 600; }
.override-copy small { color: #64748b; font-size: .75rem; }
.override-checkbox { flex: 0 0 auto; width: 1.15rem; height: 1.15rem; accent-color: #2563eb; cursor: pointer; }
.drawer-number-input { width: 100%; box-sizing: border-box; min-height: 44px; padding: .65rem .8rem; border: 1px solid #cbd5e1; border-radius: .65rem; background: #fff; color: #1e293b; font: inherit; }
.drawer-number-input:focus { outline: 2px solid #bfdbfe; border-color: #3b82f6; }
.drawer-description {
  margin: 0 0 1.5rem;
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.5;
}

.drawer-footer {
  padding: 1.5rem;
  background-color: #f9fafb;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: auto; /* Empurra para baixo se tiver espaço sobrando */
}

/* Reutilizando form styles existentes */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.form-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.form-select {
  width: 100%;
  padding: 0.625rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: #111827;
  background-color: #fff;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.form-select:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.btn-cancel {
  padding: 0.5rem 1rem;
  background-color: #fff;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: background-color 0.2s;
}
.btn-cancel:hover {
  background-color: #f3f4f6;
}

.btn-confirm {
  padding: 0.5rem 1rem;
  background-color: #2563eb;
  border: 1px solid transparent;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: white;
  cursor: pointer;
  transition: background-color 0.2s;
}
.btn-confirm:hover {
  background-color: #1d4ed8;
}
.btn-confirm:disabled {
  background-color: #93c5fd;
  cursor: not-allowed;
}
</style>
