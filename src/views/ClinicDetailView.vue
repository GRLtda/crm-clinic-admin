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
          <img v-if="clinic.logoUrl" :src="clinic.logoUrl" :alt="clinic.name" class="logo" />
          <Building2 v-else :size="48" class="logo-placeholder" />
        </div>
        <div class="info-header">
          <h1 class="clinic-name">{{ clinic.name }}</h1>
          <span class="clinic-id">ID: {{ clinic._id }}</span>
          <div class="header-tags">
            <span class="plan-tag">
              {{ clinic.plan }}
              <button @click="openPlanModal" class="btn-edit-plan" title="Alterar Plano">
                <Edit2 :size="12" />
              </button>
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
        
        <div class="header-actions">
          <button 
            v-if="clinic.subscriptionStatus !== 'lifetime'"
            @click="handleSetLifetime" 
            class="btn-lifetime"
            :disabled="loadingAction"
          >
            <Crown :size="16" />
            Tornar Vitalício
          </button>
          <button 
            v-else
            @click="handleRemoveLifetime" 
            class="btn-remove-lifetime"
            :disabled="loadingAction"
          >
            <XCircle :size="16" />
            Remover Vitalício
          </button>
        </div>
      </div>

      <div class="detail-grid">
        
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
    </div>
    
    <div v-else class="empty-state">
      <AlertTriangle :size="48" />
      <h3>Clínica não encontrada</h3>
      <p>Não foi possível carregar os dados desta clínica.</p>
    </div>
    <!-- SideDrawer de Alteração de Plano -->
    <SideDrawer 
      v-if="showPlanModal" 
      @close="closePlanModal" 
      size="sm"
    >
      <template #header>
        <div class="drawer-header">
          <h3>Alterar Plano</h3>
          <!-- Botão de fechar mobile que o SideDrawer espera -->
          <button @click="closePlanModal" class="mobile-close-btn">
            <X :size="20" />
          </button>
        </div>
      </template>

      <div class="drawer-body-content">
        <p class="drawer-description">Selecione o novo plano para esta clínica. O limite de médicos será atualizado imediatamente.</p>
        
        <div class="form-group">
          <label>Novo Plano</label>
          <select v-model="selectedPlan" class="form-select">
            <template v-for="opt in planOptions" :key="opt.value">
              <option :value="opt.value">
                {{ opt.label }}
              </option>
            </template>
          </select>
        </div>
      </div>

      <template #footer>
        <div class="drawer-footer">
          <button @click="closePlanModal" class="btn-cancel">Cancelar</button>
          <button 
            @click="handleUpdatePlan" 
            class="btn-confirm"
            :disabled="loadingAction || selectedPlan === clinic.plan"
          >
            {{ loadingAction ? 'Salvando...' : 'Salvar Alterações' }}
          </button>
        </div>
      </template>
    </SideDrawer>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, computed, ref } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useClinicsStore } from '../stores/clinics.js'
import SideDrawer from '../components/global/SideDrawer.vue'
import { ArrowLeft, Loader2, Building2, User, AlertTriangle, Crown, XCircle, Edit2, X } from 'lucide-vue-next'

const store = useClinicsStore()
const route = useRoute()

const clinic = computed(() => store.selectedClinic)
const loadingAction = ref(false)

// Estado do Modal de Edição de Plano
const showPlanModal = ref(false)
const selectedPlan = ref('')
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
  showPlanModal.value = true
}

function closePlanModal() {
  showPlanModal.value = false
}

async function handleUpdatePlan() {
  if (!selectedPlan.value) return
  if (selectedPlan.value === clinic.value.plan) {
    closePlanModal()
    return
  }

  if (!confirm(`Tem certeza que deseja alterar o plano para ${selectedPlan.value}?`)) return

  loadingAction.value = true
  const success = await store.updateClinicPlan(clinic.value._id, selectedPlan.value)
  if (success) {
    closePlanModal()
  }
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

.drawer-body-content {
  /* O padding já vem do componente SideDrawer, mas podemos ajustar se necessário */
}
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