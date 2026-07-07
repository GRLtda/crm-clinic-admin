<template>
  <div class="subscriptions-view">
    <!-- Header da Página -->
    <div class="page-header">
      <div class="header-info">
        <h1>Assinaturas</h1>
        <p>Gerencie as assinaturas das clínicas</p>
      </div>
    </div>

    <!-- Cards de Resumo -->
    <div class="summary-cards">
      <div 
        class="summary-card" 
        :class="{ active: filters.status === '' }"
        @click="setFilter('')"
      >
        <span class="summary-value">{{ store.summary.total }}</span>
        <span class="summary-label">Total</span>
      </div>
      <div 
        class="summary-card success" 
        :class="{ active: filters.status === 'active' }"
        @click="setFilter('active')"
      >
        <span class="summary-value">{{ store.summary.active }}</span>
        <span class="summary-label">Ativas</span>
      </div>
      <div 
        class="summary-card info" 
        :class="{ active: filters.status === 'trialing' }"
        @click="setFilter('trialing')"
      >
        <span class="summary-value">{{ store.summary.trialing }}</span>
        <span class="summary-label">Em Trial</span>
      </div>
      <div 
        class="summary-card warning" 
        :class="{ active: filters.status === 'past_due' }"
        @click="setFilter('past_due')"
      >
        <span class="summary-value">{{ store.summary.past_due }}</span>
        <span class="summary-label">Atrasadas</span>
      </div>
      <div 
        class="summary-card danger" 
        :class="{ active: filters.status === 'canceled' }"
        @click="setFilter('canceled')"
      >
        <span class="summary-value">{{ store.summary.canceled }}</span>
        <span class="summary-label">Canceladas</span>
      </div>
      <div 
        class="summary-card purple" 
        :class="{ active: filters.status === 'lifetime' }"
        @click="setFilter('lifetime')"
      >
        <span class="summary-value">{{ store.summary.lifetime }}</span>
        <span class="summary-label">Vitalícias</span>
      </div>
      <div 
        class="summary-card gray" 
        :class="{ active: filters.status === 'none' }"
        @click="setFilter('none')"
      >
        <span class="summary-value">{{ store.summary.none }}</span>
        <span class="summary-label">Sem Assinatura</span>
      </div>
    </div>

    <!-- Barra de Busca -->
    <div class="search-bar">
      <div class="search-input-wrapper">
        <Search :size="18" class="search-icon" />
        <input 
          v-model="searchQuery"
          type="text" 
          placeholder="Buscar por nome, responsável ou CNPJ..."
          @keyup.enter="handleSearch"
        />
      </div>
      <button v-if="filters.status || filters.search" class="btn-clear" @click="clearFilters">
        <X :size="16" />
        Limpar Filtros
      </button>
    </div>

    <!-- Estado de Carregamento -->
    <div v-if="store.loading" class="loading-state">
      <Loader2 :size="40" class="icon-spin" />
      <p>Carregando assinaturas...</p>
    </div>

    <!-- Lista de Assinaturas -->
    <div v-else-if="store.subscriptions.length > 0" class="subscriptions-list">
      <div 
        v-for="clinic in store.subscriptions" 
        :key="clinic._id" 
        class="subscription-card"
      >
        <div class="card-header">
          <div class="clinic-info">
            <div class="logo-wrapper">
              <img v-if="clinic.logoUrl" :src="clinic.logoUrl" :alt="clinic.name" />
              <Building2 v-else :size="24" class="logo-placeholder" />
            </div>
            <div class="clinic-details">
              <h3>{{ clinic.name }}</h3>
              <span class="clinic-owner">{{ clinic.owner?.email || 'Sem proprietário' }}</span>
            </div>
          </div>
          <span 
            class="status-badge"
            :class="getStatusClass(clinic.subscriptionStatus)"
          >
            {{ getStatusLabel(clinic.subscriptionStatus) }}
          </span>
        </div>

        <div class="card-body">
          <div class="info-row">
            <span class="info-label">Responsável</span>
            <span class="info-value">{{ clinic.responsibleName || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Cadastro</span>
            <span class="info-value">{{ formatDate(clinic.createdAt) }}</span>
          </div>
          <div v-if="clinic.lastPaymentFailureDate" class="info-row danger">
            <span class="info-label">Último Erro</span>
            <span class="info-value">{{ formatDate(clinic.lastPaymentFailureDate) }}</span>
          </div>
        </div>

        <div class="card-actions">
          <button class="btn-action btn-details" @click="openDetails(clinic._id)">
            <Eye :size="16" />
            Detalhes
          </button>
          <!-- Trial: para quem NÃO tem assinatura -->
          <button 
            v-if="!clinic.subscriptionStatus || clinic.subscriptionStatus === 'canceled' || clinic.subscriptionStatus === 'none'"
            class="btn-action btn-trial" 
            @click="handleGrantTrial(clinic._id, clinic.name)"
            :disabled="store.actionLoading"
          >
            <Gift :size="16" />
            Trial Grátis
          </button>
          <!-- Crédito: para quem JÁ tem assinatura ativa -->
          <button 
            v-if="clinic.subscriptionStatus === 'active' || clinic.subscriptionStatus === 'trialing' || clinic.subscriptionStatus === 'past_due'"
            class="btn-action btn-credit" 
            @click="handleGrantFreeMonth(clinic._id, clinic.name)"
            :disabled="store.actionLoading"
          >
            <Gift :size="16" />
            1 Mês Grátis
          </button>
          <button 
            v-if="clinic.subscriptionStatus !== 'lifetime'"
            class="btn-action btn-lifetime" 
            @click="handleSetLifetime(clinic._id, clinic.name)"
            :disabled="store.actionLoading"
          >
            <Crown :size="16" />
            Vitalício
          </button>
        </div>
      </div>
    </div>

    <!-- Estado Vazio -->
    <div v-else class="empty-state">
      <CreditCard :size="48" />
      <h3>Nenhuma assinatura encontrada</h3>
      <p>Ajuste os filtros ou aguarde clínicas se cadastrarem.</p>
    </div>

    <!-- Paginação -->
    <div v-if="store.pagination.pages > 1" class="pagination">
      <button 
        :disabled="store.pagination.page <= 1"
        @click="changePage(store.pagination.page - 1)"
        class="pagination-btn"
      >
        <ChevronLeft :size="18" />
      </button>
      <span class="pagination-info">
        Página {{ store.pagination.page }} de {{ store.pagination.pages }}
      </span>
      <button 
        :disabled="store.pagination.page >= store.pagination.pages"
        @click="changePage(store.pagination.page + 1)"
        class="pagination-btn"
      >
        <ChevronRight :size="18" />
      </button>
    </div>

    <!-- Drawer Lateral de Detalhes -->
    <Teleport to="body">
      <Transition name="drawer">
        <div v-if="showDetailsModal" class="drawer-overlay" @click.self="closeDetails">
          <div class="drawer-content">
            <div class="drawer-header">
              <h2>Detalhes da Assinatura</h2>
              <button class="btn-close" @click="closeDetails">
                <X :size="20" />
              </button>
            </div>

            <div v-if="store.loadingDetails" class="drawer-loading">
              <Loader2 :size="32" class="icon-spin" />
              <p>Carregando...</p>
            </div>

            <div v-else-if="store.selectedDetails" class="drawer-body">
              <!-- Informações da Clínica -->
              <div class="details-section">
                <h3>Clínica</h3>
                <div class="details-grid">
                  <div class="detail-item">
                    <span class="detail-label">Nome</span>
                    <span class="detail-value">{{ store.selectedDetails.clinic.name }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Responsável</span>
                    <span class="detail-value">{{ store.selectedDetails.clinic.responsibleName || '-' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Email</span>
                    <span class="detail-value">{{ store.selectedDetails.clinic.owner?.email || '-' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Status</span>
                    <span 
                      class="status-badge"
                      :class="getStatusClass(store.selectedDetails.clinic.subscriptionStatus)"
                    >
                      {{ getStatusLabel(store.selectedDetails.clinic.subscriptionStatus) }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Cronograma de Fases -->
              <div v-if="store.selectedDetails.schedule" class="details-section schedule-section">
                <h3>
                  <Calendar :size="16" />
                  Cronograma de Fases
                </h3>
                <div class="timeline">
                  <div 
                    v-for="phase in store.selectedDetails.schedule.phases" 
                    :key="phase.index"
                    class="timeline-item"
                    :class="{
                      'is-current': phase.isCurrent,
                      'is-past': phase.isPast,
                      'is-future': phase.isFuture
                    }"
                  >
                    <div class="timeline-marker">
                      <div class="marker-dot"></div>
                      <div v-if="phase.index < store.selectedDetails.schedule.phases.length - 1" class="marker-line"></div>
                    </div>
                    <div class="timeline-content">
                      <div class="phase-header">
                        <span class="phase-badge" :class="{ 'free': phase.coupon }">
                          {{ phase.coupon ? '🎁 Mês Grátis' : '💳 Normal' }}
                        </span>
                        <span v-if="phase.isCurrent" class="current-badge">Em andamento</span>
                      </div>
                      <div class="phase-dates">
                        <span>{{ formatDate(phase.startDate) }}</span>
                        <span class="date-separator">→</span>
                        <span>{{ formatDate(phase.endDate) }}</span>
                      </div>
                      <div v-if="phase.metadata?.reason" class="phase-reason">
                        {{ phase.metadata.reason }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Informações do Stripe -->
              <div v-if="store.selectedDetails.stripe" class="details-section">
                <h3>Stripe</h3>
                <div class="details-grid">
                  <div class="detail-item">
                    <span class="detail-label">ID</span>
                    <span class="detail-value mono">{{ store.selectedDetails.stripe.subscriptionId }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Status</span>
                    <span class="detail-value">{{ store.selectedDetails.stripe.status }}</span>
                  </div>
                  <div v-if="store.selectedDetails.stripe.currentPeriodEnd" class="detail-item">
                    <span class="detail-label">Próxima Cobrança</span>
                    <span class="detail-value">{{ formatDate(store.selectedDetails.stripe.currentPeriodEnd) }}</span>
                  </div>
                  <div v-if="store.selectedDetails.stripe.plan" class="detail-item">
                    <span class="detail-label">Plano</span>
                    <span class="detail-value">
                      {{ formatCurrency(store.selectedDetails.stripe.plan.amount) }} / {{ store.selectedDetails.stripe.plan.interval }}
                    </span>
                  </div>
                  <div v-if="store.selectedDetails.stripe.card" class="detail-item full-width">
                    <span class="detail-label">Cartão</span>
                    <span class="detail-value">
                      {{ store.selectedDetails.stripe.card.brand.toUpperCase() }} **** {{ store.selectedDetails.stripe.card.last4 }}
                    </span>
                  </div>
                </div>

                <div v-if="store.selectedDetails.stripe.latestInvoice" class="invoice-link">
                  <a 
                    :href="store.selectedDetails.stripe.latestInvoice.hostedInvoiceUrl" 
                    target="_blank"
                    class="btn-invoice"
                  >
                    <FileText :size="16" />
                    Ver Última Fatura
                  </a>
                </div>
                <div v-if="store.selectedDetails.stripe.invoices?.length" class="invoices-panel">
                  <div class="invoices-header">
                    <span>Faturas</span>
                    <small>Últimas {{ store.selectedDetails.stripe.invoices.length }}</small>
                  </div>
                  <div class="invoice-row" v-for="invoice in store.selectedDetails.stripe.invoices" :key="invoice.id">
                    <div class="invoice-main">
                      <span class="invoice-number">{{ invoice.number || invoice.id }}</span>
                      <span class="invoice-meta">
                        {{ formatDate(invoice.created) }} · {{ formatCurrency(invoice.amountDue) }}
                      </span>
                    </div>
                    <span class="invoice-status" :class="getInvoiceStatusClass(invoice)">
                      {{ getInvoiceStatusLabel(invoice) }}
                    </span>
                    <div class="invoice-actions">
                      <a
                        v-if="invoice.hostedInvoiceUrl"
                        :href="invoice.hostedInvoiceUrl"
                        target="_blank"
                        class="btn-invoice-icon"
                        title="Abrir fatura"
                      >
                        <FileText :size="15" />
                      </a>
                      <button
                        v-if="canMarkInvoicePaid(invoice)"
                        class="btn-pay-external"
                        :disabled="store.actionLoading"
                        @click="handleMarkInvoicePaidOutOfBand(invoice)"
                      >
                        <CreditCard :size="15" />
                        Pago fora
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else class="details-section">
                <h3>Stripe</h3>
                <p class="no-stripe">Nenhuma assinatura Stripe configurada.</p>
              </div>
            </div>

            <div class="drawer-footer">
              <button class="btn-secondary" @click="closeDetails">Fechar</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useSubscriptionsStore } from '../stores/subscriptions.js'
import { useClinicsStore } from '../stores/clinics.js'
import { 
  Search, 
  X, 
  Loader2, 
  Building2, 
  Eye, 
  Gift, 
  Crown,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  FileText,
  Calendar
} from 'lucide-vue-next'

const store = useSubscriptionsStore()
const clinicsStore = useClinicsStore()

const searchQuery = ref('')
const showDetailsModal = ref(false)
const filters = computed(() => store.filters)

// Status helpers
const statusLabels = {
  active: 'Ativo',
  trialing: 'Em Trial',
  past_due: 'Atrasado',
  canceled: 'Cancelado',
  lifetime: 'Vitalício',
  incomplete: 'Incompleto',
  unpaid: 'Não Pago'
}

const statusClasses = {
  active: 'status-success',
  trialing: 'status-info',
  past_due: 'status-warning',
  canceled: 'status-danger',
  lifetime: 'status-purple',
  incomplete: 'status-gray',
  unpaid: 'status-danger'
}

function getStatusLabel(status) {
  return statusLabels[status] || 'Sem Assinatura'
}

function getStatusClass(status) {
  return statusClasses[status] || 'status-gray'
}

function formatDate(date) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

function formatCurrency(amount) {
  if (!amount) return '-'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(amount / 100)
}

function getInvoiceStatusLabel(invoice) {
  if (invoice.paidOutOfBand) return 'Pago fora'

  const labels = {
    paid: 'Paga',
    open: 'Aberta',
    draft: 'Rascunho',
    void: 'Cancelada',
    uncollectible: 'Incobrável'
  }

  return labels[invoice.status] || invoice.status || '-'
}

function getInvoiceStatusClass(invoice) {
  if (invoice.paidOutOfBand || invoice.status === 'paid') return 'is-paid'
  if (invoice.status === 'open') return 'is-open'
  if (invoice.status === 'uncollectible') return 'is-uncollectible'
  return 'is-muted'
}

function canMarkInvoicePaid(invoice) {
  return ['open', 'uncollectible'].includes(invoice.status)
}

// Actions
async function setFilter(status) {
  await store.setStatusFilter(status)
}

async function handleSearch() {
  await store.setSearchFilter(searchQuery.value)
}

async function clearFilters() {
  searchQuery.value = ''
  await store.clearFilters()
}

async function changePage(page) {
  await store.fetchSubscriptions(page)
}

async function openDetails(id) {
  showDetailsModal.value = true
  await store.fetchDetails(id)
}

function closeDetails() {
  showDetailsModal.value = false
  store.clearDetails()
}

async function handleGrantTrial(id, name) {
  if (!confirm(`Conceder trial de 30 dias para "${name}"?`)) return
  await store.grantTrial(id, 30)
}

async function handleGrantFreeMonth(id, name) {
  if (!confirm(`Aplicar crédito de 1 mês grátis para "${name}"? A próxima fatura será R$0,00.`)) return
  await store.grantFreeMonth(id)
}

async function handleMarkInvoicePaidOutOfBand(invoice) {
  const clinic = store.selectedDetails?.clinic
  if (!clinic?._id) return

  const method = window.prompt('Forma de pagamento externo (Pix, cartão, débito, dinheiro):', 'Pix')
  if (method === null) return

  const note = window.prompt('Observação opcional:', '') || ''
  const invoiceLabel = invoice.number || invoice.id

  if (!confirm(`Marcar a fatura ${invoiceLabel} de "${clinic.name}" como paga fora da Stripe? Nenhuma cobrança será feita no cartão.`)) return

  await store.markInvoicePaidOutOfBand(clinic._id, invoice.id, {
    method: method.trim() || 'externo',
    note: note.trim()
  })
}

async function handleSetLifetime(id, name) {
  if (!confirm(`Tornar assinatura de "${name}" vitalícia?`)) return
  await clinicsStore.updateSubscriptionStatus(id, 'lifetime')
  await store.fetchSubscriptions(store.pagination.page)
}

onMounted(() => {
  store.fetchSubscriptions()
})
</script>

<style scoped>
.subscriptions-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-info h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.25rem;
}

.header-info p {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

/* Summary Cards */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.75rem;
}

.summary-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.summary-card:hover {
  border-color: #d1d5db;
  transform: translateY(-2px);
}

.summary-card.active {
  border-color: var(--azul-principal, #3b82f6);
  background: #eff6ff;
}

.summary-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
}

.summary-label {
  display: block;
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.summary-card.success .summary-value { color: #059669; }
.summary-card.info .summary-value { color: #0284c7; }
.summary-card.warning .summary-value { color: #d97706; }
.summary-card.danger .summary-value { color: #dc2626; }
.summary-card.purple .summary-value { color: #7c3aed; }
.summary-card.gray .summary-value { color: #6b7280; }

/* Search Bar */
.search-bar {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.search-input-wrapper {
  flex: 1;
  position: relative;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
}

.search-input-wrapper input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  transition: border-color 0.2s;
}

.search-input-wrapper input:focus {
  outline: none;
  border-color: var(--azul-principal, #3b82f6);
}

.btn-clear {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-clear:hover {
  background: #f9fafb;
  color: #374151;
}

/* Loading */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: #6b7280;
}

.icon-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Subscription Cards */
.subscriptions-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 1rem;
}

.subscription-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  overflow: hidden;
  transition: box-shadow 0.2s;
}

.subscription-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1rem;
  border-bottom: 1px solid #f3f4f6;
}

.clinic-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

.logo-wrapper {
  width: 40px;
  height: 40px;
  border-radius: 0.5rem;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.logo-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.logo-placeholder {
  color: #9ca3af;
}

.clinic-details {
  min-width: 0;
}

.clinic-details h3 {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.clinic-owner {
  font-size: 0.75rem;
  color: #6b7280;
}

.status-badge {
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.25rem 0.625rem;
  border-radius: 99px;
  white-space: nowrap;
}

.status-success { background: #dcfce7; color: #166534; }
.status-info { background: #dbeafe; color: #1e40af; }
.status-warning { background: #fef3c7; color: #92400e; }
.status-danger { background: #fee2e2; color: #991b1b; }
.status-purple { background: #f3e8ff; color: #6b21a8; }
.status-gray { background: #f3f4f6; color: #374151; }

.card-body {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.8125rem;
}

.info-label {
  color: #6b7280;
}

.info-value {
  color: #111827;
  font-weight: 500;
}

.info-row.danger .info-value {
  color: #dc2626;
}

.card-actions {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #f9fafb;
  border-top: 1px solid #f3f4f6;
}

.btn-action {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  background: #fff;
  color: #374151;
}

.btn-action:hover:not(:disabled) {
  background: #f3f4f6;
}

.btn-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-details { color: #0284c7; border-color: #bae6fd; }
.btn-details:hover { background: #f0f9ff; }

.btn-trial { color: #059669; border-color: #a7f3d0; }
.btn-trial:hover { background: #ecfdf5; }

.btn-credit { color: #0d9488; border-color: #99f6e4; }
.btn-credit:hover { background: #f0fdfa; }

.btn-lifetime { color: #7c3aed; border-color: #c4b5fd; }
.btn-lifetime:hover { background: #f5f3ff; }

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  color: #6b7280;
}

.empty-state svg {
  color: #d1d5db;
  margin-bottom: 1rem;
}

.empty-state h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.5rem;
}

.empty-state p {
  margin: 0;
  font-size: 0.875rem;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
}

.pagination-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  background: #fff;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: #f3f4f6;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  font-size: 0.875rem;
  color: #6b7280;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 1rem;
}

.modal-content {
  background: #fff;
  border-radius: 0.75rem;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
}

.btn-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 0.375rem;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-close:hover {
  background: #f3f4f6;
}

.modal-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #6b7280;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.details-section {
  margin-bottom: 1.5rem;
}

.details-section:last-child {
  margin-bottom: 0;
}

.details-section h3 {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #f3f4f6;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-item.full-width {
  grid-column: span 2;
}

.detail-label {
  font-size: 0.75rem;
  color: #6b7280;
}

.detail-label.warning-text {
  color: #d97706;
}

.detail-value {
  font-size: 0.875rem;
  color: #111827;
  font-weight: 500;
}

.detail-value.mono {
  font-family: monospace;
  font-size: 0.8125rem;
}

.no-stripe {
  font-size: 0.875rem;
  color: #6b7280;
  font-style: italic;
  margin: 0;
}

.invoice-link {
  margin-top: 1rem;
}

.btn-invoice {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  color: #374151;
  font-size: 0.875rem;
  text-decoration: none;
  transition: all 0.2s;
}

.btn-invoice:hover {
  background: #f3f4f6;
}

.invoices-panel {
  margin-top: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  overflow: hidden;
}

.invoices-header,
.invoice-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 0.75rem;
  align-items: center;
}

.invoices-header {
  padding: 0.625rem 0.75rem;
  background: #f9fafb;
  font-size: 0.75rem;
  font-weight: 700;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.invoices-header small {
  grid-column: 3;
  color: #6b7280;
  font-weight: 500;
  text-transform: none;
  letter-spacing: 0;
}

.invoice-row {
  padding: 0.75rem;
  border-top: 1px solid #f3f4f6;
}

.invoice-main {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
}

.invoice-number {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #111827;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.invoice-meta {
  font-size: 0.75rem;
  color: #6b7280;
}

.invoice-status {
  font-size: 0.71875rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 99px;
  white-space: nowrap;
}

.invoice-status.is-paid { background: #dcfce7; color: #166534; }
.invoice-status.is-open { background: #fef3c7; color: #92400e; }
.invoice-status.is-uncollectible { background: #fee2e2; color: #991b1b; }
.invoice-status.is-muted { background: #f3f4f6; color: #374151; }

.invoice-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.375rem;
}

.btn-invoice-icon,
.btn-pay-external {
  min-height: 32px;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  background: #fff;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-invoice-icon {
  width: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-pay-external {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0 0.625rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #0f766e;
  border-color: #99f6e4;
}

.btn-invoice-icon:hover,
.btn-pay-external:hover:not(:disabled) {
  background: #f9fafb;
}

.btn-pay-external:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
}

.btn-secondary {
  padding: 0.5rem 1rem;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #f9fafb;
}

/* Responsive */
@media (max-width: 768px) {
  .summary-cards {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .search-bar {
    flex-direction: column;
  }
  
  .subscriptions-list {
    grid-template-columns: 1fr;
  }
  
  .card-actions {
    flex-wrap: wrap;
  }
  
  .details-grid {
    grid-template-columns: 1fr;
  }
  
  .detail-item.full-width {
    grid-column: span 1;
  }
  
  .drawer-content {
    width: 100% !important;
  }
}

/* Drawer Lateral */
.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 100;
}

.drawer-content {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 480px;
  max-width: 100%;
  background: #fff;
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.drawer-header h2 {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
}

.drawer-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: #6b7280;
}

.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.drawer-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  flex-shrink: 0;
}

/* Drawer Animation */
.drawer-enter-active,
.drawer-leave-active {
  transition: all 0.3s ease;
}

.drawer-enter-active .drawer-content,
.drawer-leave-active .drawer-content {
  transition: transform 0.3s ease;
}

.drawer-enter-from,
.drawer-leave-to {
  background: rgba(0, 0, 0, 0);
}

.drawer-enter-from .drawer-content,
.drawer-leave-to .drawer-content {
  transform: translateX(100%);
}

/* Schedule Section */
.schedule-section h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Timeline */
.timeline {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.timeline-item {
  display: flex;
  gap: 1rem;
  position: relative;
}

.timeline-marker {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 20px;
  flex-shrink: 0;
}

.marker-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #d1d5db;
  border: 2px solid #fff;
  box-shadow: 0 0 0 2px #d1d5db;
  z-index: 1;
}

.marker-line {
  width: 2px;
  flex: 1;
  background: #e5e7eb;
  min-height: 20px;
}

.timeline-item.is-current .marker-dot {
  background: #059669;
  box-shadow: 0 0 0 2px #059669;
}

.timeline-item.is-past .marker-dot {
  background: #9ca3af;
  box-shadow: 0 0 0 2px #9ca3af;
}

.timeline-item.is-future .marker-dot {
  background: #3b82f6;
  box-shadow: 0 0 0 2px #3b82f6;
}

.timeline-content {
  flex: 1;
  padding-bottom: 1.25rem;
}

.phase-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.phase-badge {
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  background: #f3f4f6;
  color: #374151;
}

.phase-badge.free {
  background: #dcfce7;
  color: #166534;
}

.current-badge {
  font-size: 0.6875rem;
  font-weight: 500;
  padding: 0.125rem 0.375rem;
  border-radius: 99px;
  background: #059669;
  color: #fff;
}

.phase-dates {
  font-size: 0.8125rem;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.date-separator {
  color: #d1d5db;
}

.phase-reason {
  font-size: 0.75rem;
  color: #9ca3af;
  font-style: italic;
  margin-top: 0.25rem;
}
</style>
