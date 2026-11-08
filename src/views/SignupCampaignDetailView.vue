<template>
  <div class="campaign-detail">
    <RouterLink :to="{ name: 'signup-campaigns' }" class="back-link">
      <ArrowLeft :size="16" aria-hidden="true" /> Campanhas
    </RouterLink>

    <div v-if="loading" class="loading"><Loader2 :size="28" class="spin" aria-label="Carregando" /></div>

    <AppEmptyState
      v-else-if="!campaign"
      :icon="Megaphone"
      title="Campanha não encontrada"
      text="Ela pode ter sido excluída."
    />

    <template v-else>
      <header class="detail-header">
        <div>
          <div class="title-row">
            <h1>{{ campaign.name }}</h1>
            <StatusBadge :variant="status.variant" :label="status.label" />
          </div>
          <p class="meta">
            {{ campaign.trialDays }} dias grátis com cartão · {{ periodLabel }}
          </p>
          <button type="button" class="link-pill" title="Copiar link" @click="copy(link)">
            <Link2 :size="15" aria-hidden="true" /> {{ link }}
          </button>
        </div>
        <div v-if="canWrite" class="header-actions">
          <button type="button" class="btn-secondary" @click="formOpen = true"><Pencil :size="16" /> Editar</button>
          <button type="button" class="btn-danger-outline" @click="deleteOpen = true"><Trash2 :size="16" /> Excluir</button>
        </div>
      </header>

      <section class="stats-grid" aria-label="Indicadores da campanha">
        <article class="stat-card">
          <span>Acessos ao link</span>
          <strong>{{ campaign.stats.visits }}</strong>
          <small>{{ campaign.stats.uniqueVisitors }} visitantes únicos · último {{ formatDateTime(campaign.stats.lastVisitAt) }}</small>
        </article>
        <article class="stat-card">
          <span>Cadastros</span>
          <strong>{{ campaign.stats.registrations }}</strong>
          <small>{{ campaign.stats.conversionRate }}% dos visitantes únicos</small>
        </article>
        <article class="stat-card">
          <span>Clínicas criadas</span>
          <strong>{{ campaign.stats.clinics }}</strong>
          <small>{{ campaign.stats.registrations - campaign.stats.clinics }} sem concluir o cadastro</small>
        </article>
        <article class="stat-card">
          <span>Em teste</span>
          <strong>{{ campaign.stats.trialing }}</strong>
          <small>{{ campaign.stats.trialsStarted }} cadastraram o cartão</small>
        </article>
        <article class="stat-card highlight">
          <span>Assinantes</span>
          <strong>{{ campaign.stats.paying }}</strong>
          <small>{{ campaign.stats.pastDue }} em atraso · {{ campaign.stats.canceled }} cancelados</small>
        </article>
      </section>

      <section class="registrations">
        <div class="section-header">
          <h2>Quem se cadastrou</h2>
          <SearchInput v-model="search" placeholder="Buscar por nome, e-mail ou telefone..." />
        </div>

        <AppDataTable
          height="calc(100vh - 38rem)"
          :columns="columns"
          :rows="rows"
          :loading="loadingRows"
          :skeleton-rows="4"
          :pagination="rowsPagination"
          :empty-icon="UserX"
          :empty-title="search ? 'Nenhum cadastro encontrado' : 'Ainda sem cadastros'"
          :empty-text="search ? 'Tente outro nome, e-mail ou telefone.' : 'Os cadastros feitos pelo link aparecem aqui.'"
          @page-change="fetchRows"
        >
          <template #cell-name="{ row }"><strong class="name">{{ row.name }}</strong></template>
          <template #cell-contact="{ row }">
            <div class="stack"><span>{{ row.email }}</span><small>{{ row.phone }}</small></div>
          </template>
          <template #cell-registeredAt="{ row }">{{ formatDateTime(row.registeredAt) }}</template>
          <template #cell-clinic="{ row }">
            <RouterLink v-if="row.clinic" :to="{ name: 'clinic-detail', params: { id: row.clinic._id } }" class="clinic-link">
              {{ row.clinic.name }} <ArrowUpRight :size="14" aria-hidden="true" />
            </RouterLink>
            <span v-else class="muted">Não concluiu o onboarding</span>
          </template>
          <template #cell-subscription="{ row }">
            <span class="status-chip" :class="subscriptionClass(row)">{{ subscriptionLabel(row) }}</span>
          </template>
        </AppDataTable>
      </section>

      <CampaignFormModal :show="formOpen" :campaign="campaign" @close="formOpen = false" @saved="onSaved" />
      <DeleteCampaignModal :campaign="deleteOpen ? campaign : null" @close="deleteOpen = false" @deleted="onDeleted" />
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { ArrowLeft, ArrowUpRight, Link2, Loader2, Megaphone, Pencil, Trash2, UserX } from 'lucide-vue-next'
import StatusBadge from '../components/global/StatusBadge.vue'
import SearchInput from '../components/global/SearchInput.vue'
import AppDataTable from '../components/global/AppDataTable.vue'
import CampaignFormModal from '../components/pages/signup-campaigns/CampaignFormModal.vue'
import DeleteCampaignModal from '../components/pages/signup-campaigns/DeleteCampaignModal.vue'
import { useClipboard } from '../composables/useClipboard'
import { useAuthStore } from '../stores/auth'
import {
  CAMPAIGN_STATUS,
  campaignLink,
  getCampaign,
  listCampaignRegistrations,
  formatDay,
  formatDateTime,
} from '../utils/signupCampaigns.js'

const columns = [
  { key: 'name', label: 'Nome' },
  { key: 'contact', label: 'Contato' },
  { key: 'registeredAt', label: 'Cadastro', width: '150px' },
  { key: 'clinic', label: 'Clínica' },
  { key: 'subscription', label: 'Assinatura', width: '140px' },
]
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { copy } = useClipboard()

const canWrite = computed(() => ['super admin', 'admin'].includes(authStore.user?.role))
const campaign = ref(null)
const loading = ref(true)
const rows = ref([])
const loadingRows = ref(true)
const rowsPagination = ref({ page: 1, pages: 1, total: 0, limit: 20 })
const search = ref('')
const formOpen = ref(false)
const deleteOpen = ref(false)
let searchTimeout = null

const status = computed(() => CAMPAIGN_STATUS[campaign.value?.status] || CAMPAIGN_STATUS.expired)
const link = computed(() => campaignLink(campaign.value?.code || ''))
const periodLabel = computed(() => {
  const c = campaign.value
  if (!c.startsAt && !c.endsAt) return 'sem prazo'
  if (!c.startsAt) return `cadastros até ${formatDay(c.endsAt)}`
  if (!c.endsAt) return `a partir de ${formatDay(c.startsAt)}`
  return `${formatDay(c.startsAt)} a ${formatDay(c.endsAt)}`
})

const SUBSCRIPTION_LABELS = { trialing: 'Em teste', active: 'Ativa', lifetime: 'Vitalícia', past_due: 'Em atraso', canceled: 'Cancelada', unpaid: 'Não paga', incomplete: 'Incompleta', incomplete_expired: 'Expirada' }
const SUBSCRIPTION_CLASSES = { trialing: 'info', active: 'success', lifetime: 'success', past_due: 'warning', canceled: 'danger', unpaid: 'danger' }
const subscriptionLabel = (row) => (row.clinic ? SUBSCRIPTION_LABELS[row.clinic.subscriptionStatus] || 'Sem assinatura' : '—')
const subscriptionClass = (row) => (row.clinic ? SUBSCRIPTION_CLASSES[row.clinic.subscriptionStatus] || 'neutral' : 'neutral')

async function fetchCampaign() {
  loading.value = true
  try {
    const { data } = await getCampaign(route.params.id)
    campaign.value = data
  } catch {
    campaign.value = null
  } finally {
    loading.value = false
  }
}

async function fetchRows(page = 1) {
  loadingRows.value = true
  try {
    const { data } = await listCampaignRegistrations(route.params.id, { page, limit: rowsPagination.value.limit, ...(search.value.trim() && { search: search.value.trim() }) })
    rows.value = data.data
    rowsPagination.value = { page: data.page, pages: data.pages, total: data.total, limit: data.limit }
  } catch {
    rows.value = []
  } finally {
    loadingRows.value = false
  }
}

watch(search, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => fetchRows(1), 400)
})

function onSaved(updated) {
  formOpen.value = false
  campaign.value = updated
}
function onDeleted() {
  deleteOpen.value = false
  router.push({ name: 'signup-campaigns' })
}

onMounted(async () => {
  await fetchCampaign()
  if (campaign.value) fetchRows(1)
})
</script>

<style scoped>
.back-link { align-items: center; color: #4b5563; display: inline-flex; font-size: 0.875rem; font-weight: 600; gap: 0.35rem; margin-bottom: 1rem; text-decoration: none; }
.back-link:hover { color: #111827; }
.loading { display: flex; justify-content: center; padding: 4rem 0; color: #6b7280; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.detail-header { align-items: flex-start; display: flex; flex-wrap: wrap; gap: 1rem; justify-content: space-between; margin-bottom: 1.5rem; }
.title-row { align-items: center; display: flex; flex-wrap: wrap; gap: 0.75rem; }
.title-row h1 { color: #111827; font-size: 1.75rem; margin: 0; }
.meta { color: #6b7280; font-size: 0.9rem; margin: 0.4rem 0 0.75rem; }
.link-pill { align-items: center; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 999px; color: #1d4ed8; cursor: pointer; display: inline-flex; font-size: 0.82rem; gap: 0.4rem; max-width: 100%; padding: 0.35rem 0.8rem; word-break: break-all; text-align: left; }
.link-pill:hover { background: #dbeafe; }
.header-actions { display: flex; gap: 0.5rem; }
.btn-secondary, .btn-danger-outline { align-items: center; border-radius: 0.5rem; cursor: pointer; display: inline-flex; font-size: 0.875rem; font-weight: 600; gap: 0.4rem; padding: 0.55rem 0.9rem; background: #fff; }
.btn-secondary { border: 1px solid #e5e7eb; color: #374151; }
.btn-secondary:hover { background: #f9fafb; }
.btn-danger-outline { border: 1px solid #fecaca; color: #dc2626; }
.btn-danger-outline:hover { background: #fef2f2; }
.stats-grid { display: grid; gap: 1rem; grid-template-columns: repeat(5, minmax(0, 1fr)); margin-bottom: 2rem; }
.stat-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 0.75rem; display: flex; flex-direction: column; gap: 0.3rem; padding: 1rem 1.1rem; }
.stat-card span { color: #6b7280; font-size: 0.78rem; font-weight: 600; text-transform: uppercase; }
.stat-card strong { color: #0f172a; font-size: 1.75rem; line-height: 1.1; }
.stat-card small { color: #6b7280; font-size: 0.78rem; }
.stat-card.highlight { border-color: #bbf7d0; background: #f0fdf4; }
.section-header { align-items: center; display: flex; flex-wrap: wrap; gap: 1rem; justify-content: space-between; margin-bottom: 1rem; }
.section-header h2 { color: #111827; font-size: 1.2rem; margin: 0; }
.name { color: #0f172a; }
.stack { display: flex; flex-direction: column; gap: 2px; }
.stack small, .muted { color: #6b7280; font-size: 0.8rem; }
.clinic-link { align-items: center; color: #2563eb; display: inline-flex; font-weight: 600; gap: 3px; text-decoration: none; }
.status-chip { border-radius: 999px; font-size: 11px; font-weight: 600; padding: 4px 8px; white-space: nowrap; }
.status-chip.success { color: #15803d; background: #dcfce7; }
.status-chip.info { color: #1d4ed8; background: #dbeafe; }
.status-chip.warning { color: #a16207; background: #fef3c7; }
.status-chip.danger { color: #b91c1c; background: #fee2e2; }
.status-chip.neutral { color: #475569; background: #f1f5f9; }
@media (max-width: 1100px) { .stats-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@media (max-width: 768px) {
  .stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .stack { align-items: flex-end; }
}
@media (max-width: 420px) { .stats-grid { grid-template-columns: 1fr; } }
</style>
