<template>
  <div class="campaigns-view">
    <AppPageHeader title="Campanhas de cadastro" subtitle="Links de eventos com dias grátis. Acompanhe acessos, cadastros e assinaturas." :icon="PageIcon">
      <template #actions>
        <button v-if="canWrite" class="btn-primary" type="button" @click="openCreate">
          <Plus :size="18" aria-hidden="true" /> Nova campanha
        </button>
      </template>
    </AppPageHeader>

    <AppDataTable
      :columns="columns"
      :rows="campaigns"
      :loading="loading"
      :skeleton-rows="4"
      clickable
      :pagination="pagination"
      :empty-icon="Megaphone"
      :empty-title="search ? 'Nenhuma campanha encontrada' : 'Nenhuma campanha criada'"
      :empty-text="search ? 'Tente outro nome ou código.' : 'Crie uma campanha para gerar o link do evento.'"
      @row-click="openDetail"
      @page-change="fetchCampaigns"
    >
      <template #filters>
    <SearchInput v-model="search" placeholder="Buscar por nome ou código..." />
      </template>
      <template #cell-name="{ row: campaign }">
        <div class="campaign-cell">
          <strong>{{ campaign.name }}</strong>
          <span class="link-text">{{ campaignLink(campaign.code) }}</span>
          <small>{{ campaign.trialDays }} dias grátis · {{ periodLabel(campaign) }}</small>
        </div>
      </template>
      <template #cell-status="{ row: campaign }">
        <StatusBadge :variant="statusOf(campaign).variant" :label="statusOf(campaign).label" />
      </template>
      <template #cell-visits="{ row: campaign }">
        <div><span class="metric">{{ campaign.stats.visits }}</span><small class="metric-sub">{{ campaign.stats.uniqueVisitors }} únicos</small></div>
      </template>
      <template #cell-registrations="{ row: campaign }">
        <div><span class="metric">{{ campaign.stats.registrations }}</span><small class="metric-sub">{{ campaign.stats.conversionRate }}% dos visitantes</small></div>
      </template>
      <template #cell-clinics="{ row: campaign }">
        <div><span class="metric">{{ campaign.stats.clinics }}</span><small class="metric-sub">{{ campaign.stats.trialing }} em teste</small></div>
      </template>
      <template #cell-paying="{ row: campaign }">
        <span class="metric">{{ campaign.stats.paying }}</span>
      </template>
      <template #cell-actions="{ row: campaign }">
        <div class="row-actions" @click.stop @keydown.enter.stop>
          <button type="button" class="icon-btn" title="Copiar link" aria-label="Copiar link" @click="copy(campaignLink(campaign.code))">
            <Link2 :size="17" />
          </button>
          <button v-if="canWrite" type="button" class="icon-btn" title="Editar" aria-label="Editar campanha" @click="openEdit(campaign)">
            <Pencil :size="17" />
          </button>
          <button v-if="canWrite" type="button" class="icon-btn danger" title="Excluir" aria-label="Excluir campanha" @click="askDelete(campaign)">
            <Trash2 :size="17" />
          </button>
        </div>
      </template>
    </AppDataTable>

    <CampaignFormModal :show="formOpen" :campaign="editing" @close="formOpen = false" @saved="onSaved" />
    <DeleteCampaignModal :campaign="deleting" @close="deleting = null" @deleted="onDeleted" />
  </div>
</template>

<script setup>
import AppPageHeader from '@/components/global/AppPageHeader.vue'
import { Megaphone as PageIcon } from 'lucide-vue-next'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { Plus, Pencil, Trash2, Link2, Megaphone } from 'lucide-vue-next'
import SearchInput from '../components/global/SearchInput.vue'
import StatusBadge from '../components/global/StatusBadge.vue'
import AppDataTable from '../components/global/AppDataTable.vue'
import CampaignFormModal from '../components/pages/signup-campaigns/CampaignFormModal.vue'
import DeleteCampaignModal from '../components/pages/signup-campaigns/DeleteCampaignModal.vue'
import { useClipboard } from '../composables/useClipboard'
import { useAuthStore } from '../stores/auth'
import { CAMPAIGN_STATUS, campaignLink, listCampaigns, formatDay } from '../utils/signupCampaigns.js'

const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()
const { copy } = useClipboard()

const canWrite = computed(() => ['super admin', 'admin'].includes(authStore.user?.role))
const columns = [
  { key: 'name', label: 'Campanha' },
  { key: 'status', label: 'Situação', width: '110px' },
  { key: 'visits', label: 'Acessos' },
  { key: 'registrations', label: 'Cadastros' },
  { key: 'clinics', label: 'Clínicas' },
  { key: 'paying', label: 'Assinantes', width: '100px' },
  { key: 'actions', label: 'Ações', width: '120px', align: 'right' },
]
const campaigns = ref([])
const loading = ref(true)
const search = ref('')
const pagination = ref({ page: 1, pages: 1, total: 0, limit: 20 })
const formOpen = ref(false)
const editing = ref(null)
const deleting = ref(null)
let searchTimeout = null

const statusOf = (campaign) => CAMPAIGN_STATUS[campaign.status] || CAMPAIGN_STATUS.expired
const periodLabel = (campaign) => {
  if (!campaign.startsAt && !campaign.endsAt) return 'sem prazo'
  if (!campaign.startsAt) return `até ${formatDay(campaign.endsAt)}`
  if (!campaign.endsAt) return `a partir de ${formatDay(campaign.startsAt)}`
  return `${formatDay(campaign.startsAt)} a ${formatDay(campaign.endsAt)}`
}

async function fetchCampaigns(page = 1) {
  loading.value = true
  try {
    const { data } = await listCampaigns({ page, limit: pagination.value.limit, ...(search.value.trim() && { search: search.value.trim() }) })
    campaigns.value = data.data
    pagination.value = { page: data.page, pages: data.pages, total: data.total, limit: data.limit }
  } catch (error) {
    console.error('Erro ao carregar campanhas:', error)
    toast.error('Não foi possível carregar as campanhas.')
    campaigns.value = []
  } finally {
    loading.value = false
  }
}

watch(search, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => fetchCampaigns(1), 400)
})

function openCreate() { editing.value = null; formOpen.value = true }
function openEdit(campaign) { editing.value = campaign; formOpen.value = true }
function askDelete(campaign) { deleting.value = campaign }
function openDetail(campaign) { router.push({ name: 'signup-campaign-detail', params: { id: campaign._id } }) }

function onSaved() {
  formOpen.value = false
  fetchCampaigns(pagination.value.page)
}
function onDeleted() {
  deleting.value = null
  fetchCampaigns(1)
}

onMounted(() => fetchCampaigns(1))
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem; }
.page-title { font-size: 1.875rem; font-weight: 700; color: #111827; margin: 0; }
.page-subtitle { color: #6b7280; font-size: 0.9rem; margin: 0.35rem 0 0; }
.header-actions { display: flex; gap: 1rem; flex-wrap: wrap; align-items: center; }
.btn-primary { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.625rem 1rem; font-size: 0.875rem; font-weight: 600; color: #fff; background: var(--color-primary, #0284c7); border: none; border-radius: 0.5rem; cursor: pointer; }
.btn-primary:hover { background: var(--color-primary-dark, #0369a1); }
.campaign-cell { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.campaign-cell strong { color: #0f172a; font-size: 0.95rem; }
.link-text { color: #2563eb; font-size: 0.8rem; word-break: break-all; }
.campaign-cell small, .metric-sub { color: #6b7280; font-size: 0.75rem; }
.metric { display: block; color: #0f172a; font-size: 1rem; font-weight: 700; }
.row-actions { display: flex; gap: 0.25rem; }
.icon-btn { background: transparent; border: none; border-radius: 0.375rem; color: #4b5563; cursor: pointer; padding: 0.45rem; }
.icon-btn:hover { background: #f1f5f9; color: #111827; }
.icon-btn.danger { color: #dc2626; }
.icon-btn.danger:hover { background: #fee2e2; color: #991b1b; }
@media (max-width: 768px) {
  .campaign-cell { text-align: right; align-items: flex-end; }
}
</style>
