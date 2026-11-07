<template>
  <div class="campaigns-view">
    <div class="page-header">
      <div>
        <h2 class="page-title">Campanhas de cadastro</h2>
        <p class="page-subtitle">Links de eventos com dias grátis. Acompanhe acessos, cadastros e assinaturas.</p>
      </div>
      <div class="header-actions">
        <SearchInput v-model="search" placeholder="Buscar por nome ou código..." />
        <button v-if="canWrite" class="btn-primary" type="button" @click="openCreate">
          <Plus :size="18" aria-hidden="true" /> Nova campanha
        </button>
      </div>
    </div>

    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Campanha</th>
            <th>Situação</th>
            <th>Acessos</th>
            <th>Cadastros</th>
            <th>Clínicas</th>
            <th>Assinantes</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody v-if="!loading">
          <tr v-for="campaign in campaigns" :key="campaign._id" class="clickable" @click="openDetail(campaign)">
            <td data-label="Campanha">
              <div class="campaign-cell">
                <strong>{{ campaign.name }}</strong>
                <span class="link-text">{{ campaignLink(campaign.code) }}</span>
                <small>{{ campaign.trialDays }} dias grátis · {{ periodLabel(campaign) }}</small>
              </div>
            </td>
            <td data-label="Situação">
              <StatusBadge :variant="statusOf(campaign).variant" :label="statusOf(campaign).label" />
            </td>
            <td data-label="Acessos">
              <span class="metric">{{ campaign.stats.visits }}</span>
              <small class="metric-sub">{{ campaign.stats.uniqueVisitors }} únicos</small>
            </td>
            <td data-label="Cadastros">
              <span class="metric">{{ campaign.stats.registrations }}</span>
              <small class="metric-sub">{{ campaign.stats.conversionRate }}% dos visitantes</small>
            </td>
            <td data-label="Clínicas">
              <span class="metric">{{ campaign.stats.clinics }}</span>
              <small class="metric-sub">{{ campaign.stats.trialing }} em teste</small>
            </td>
            <td data-label="Assinantes">
              <span class="metric">{{ campaign.stats.paying }}</span>
            </td>
            <td data-label="Ações" @click.stop>
              <div class="row-actions">
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
            </td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr v-for="n in 4" :key="n">
            <td v-for="col in 7" :key="col"><SkeletonLoader width="80%" height="16px" /></td>
          </tr>
        </tbody>
      </table>

      <AppEmptyState
        v-if="!loading && campaigns.length === 0"
        :icon="Megaphone"
        :title="search ? 'Nenhuma campanha encontrada' : 'Nenhuma campanha criada'"
        :text="search ? 'Tente outro nome ou código.' : 'Crie uma campanha para gerar o link do evento.'"
      />
    </div>

    <AppPagination
      v-if="!loading && pagination.pages > 1"
      :current-page="pagination.page"
      :total-pages="pagination.pages"
      :total-items="pagination.total"
      :items-on-page="campaigns.length"
      label="campanhas"
      @page-changed="fetchCampaigns"
    />

    <CampaignFormModal :show="formOpen" :campaign="editing" @close="formOpen = false" @saved="onSaved" />
    <DeleteCampaignModal :campaign="deleting" @close="deleting = null" @deleted="onDeleted" />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { Plus, Pencil, Trash2, Link2, Megaphone } from 'lucide-vue-next'
import SearchInput from '../components/global/SearchInput.vue'
import StatusBadge from '../components/global/StatusBadge.vue'
import SkeletonLoader from '../components/global/SkeletonLoader.vue'
import AppPagination from '../components/global/AppPagination.vue'
import AppEmptyState from '../components/global/AppEmptyState.vue'
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
.table-container { background: #fff; border: 1px solid #e5e7eb; border-radius: 0.75rem; overflow: hidden; margin-bottom: 1.5rem; }
.data-table { width: 100%; border-collapse: collapse; text-align: left; }
.data-table th, .data-table td { padding: 1rem 1.25rem; border-bottom: 1px solid #e5e7eb; vertical-align: middle; font-size: 0.875rem; color: #374151; }
.data-table tr:last-child td { border-bottom: none; }
.data-table th { font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase; background: #f9fafb; }
.clickable { cursor: pointer; transition: background 0.15s; }
.clickable:hover { background: #f8fbff; }
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
@media (max-width: 900px) {
  .data-table thead { display: none; }
  .table-container { border: none; background: transparent; }
  .data-table tr { display: block; background: #fff; border: 1px solid #e5e7eb; border-radius: 0.75rem; margin-bottom: 1rem; }
  .data-table td { display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding: 0.75rem 1rem; }
  .data-table td::before { content: attr(data-label); font-weight: 600; color: #6b7280; text-transform: uppercase; font-size: 0.72rem; flex-shrink: 0; }
  .campaign-cell { text-align: right; align-items: flex-end; }
}
</style>
