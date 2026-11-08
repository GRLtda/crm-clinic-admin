<template>
    <div class="clinics-list-view">
      <AppPageHeader title="Clínicas" subtitle="Acompanhe as clínicas, seus planos e o status da assinatura." :icon="PageIcon" />
  
      <AppDataTable
        :columns="columns"
        :rows="store.clinics"
        :loading="store.loading"
        :skeleton-rows="store.pagination.limit"
        clickable
        :pagination="store.pagination"
        :empty-icon="Building2"
        empty-title="Nenhuma clínica encontrada"
        empty-text="Tente ajustar seu filtro de busca."
        @row-click="openClinic"
        @page-change="handlePageChange"
      >
        <template #filters>
          <SearchInput
            v-model="localSearch"
            placeholder="Buscar clínica por nome, cnpj, id..."
          />
          <AppSelect
            v-model="localCampaign"
            :icon="Megaphone"
            defaultOption="Todas as origens"
            :options="campaignFilterOptions"
          />
        </template>
        <template #cell-name="{ row: clinic }">
          <span class="clinic-identity"><span class="logo-wrapper"><img v-if="clinic.logoUrl && !failedLogos.has(clinic._id)" :src="clinic.logoUrl" :alt="`Logo da clínica ${clinic.name}`" @error="failedLogos.add(clinic._id)" /><Building2 v-else :size="21" aria-hidden="true" /></span><span class="identity-text"><strong>{{ clinic.name }}</strong><small>{{ clinic.cnpj || 'CNPJ não cadastrado' }}</small></span></span>
        </template>
        <template #skeleton-name>
          <span class="clinic-identity"><SkeletonLoader width="44px" height="44px" radius="12px" /><span class="identity-text"><SkeletonLoader width="150px" height="16px" /><SkeletonLoader width="110px" height="12px" /></span></span>
        </template>
        <template #cell-responsible="{ row: clinic }">{{ clinic.responsibleName || clinic.owner?.name || 'Não informado' }}</template>
        <template #cell-plan="{ row: clinic }">
          <span class="plan-status"><span class="plan-chip">{{ clinic.plan || 'Sem plano' }}</span><span class="status-chip" :class="statusClass(clinic.subscriptionStatus)">{{ statusLabel(clinic.subscriptionStatus) }}</span><span v-if="clinic.acquisition?.campaign" class="status-chip campaign">{{ campaignLabel(clinic.acquisition.campaign, clinic.acquisition.label) }}</span></span>
        </template>
        <template #cell-location="{ row: clinic }">{{ clinic.address?.city ? `${clinic.address.city}${clinic.address.state ? `, ${clinic.address.state}` : ''}` : 'Não informada' }}</template>
        <template #cell-action>
          <span class="row-action">Ver clínica <ArrowRight :size="16" aria-hidden="true" /></span>
        </template>
        <template #skeleton-action><span></span></template>
      </AppDataTable>
    </div>
  </template>
  
  <script setup>
import AppPageHeader from '@/components/global/AppPageHeader.vue'
import { Building2 as PageIcon } from 'lucide-vue-next'
  import { onMounted, ref, watch } from 'vue'
  import { useClinicsStore } from '../stores/clinics.js' // (Ajuste o caminho)
  import { Building2, ArrowRight, Megaphone } from 'lucide-vue-next'
  import AppSelect from '../components/global/AppSelect.vue'
  import { loadCampaignFilterOptions, campaignLabel } from '../utils/signupCampaigns.js'
  import { useRouter } from 'vue-router'
  import AppDataTable from '../components/global/AppDataTable.vue'
  import SearchInput from '../components/global/SearchInput.vue'
  import SkeletonLoader from '../components/global/SkeletonLoader.vue'
  
  const store = useClinicsStore()
  const router = useRouter()
  const columns = [
    { key: 'name', label: 'Clínica' },
    { key: 'responsible', label: 'Responsável' },
    { key: 'plan', label: 'Plano e assinatura' },
    { key: 'location', label: 'Localização' },
    { key: 'action', label: '', width: '110px', align: 'right' },
  ]
  const openClinic = (clinic) => router.push({ name: 'clinic-detail', params: { id: clinic._id } })
  const debounceTimeout = ref(null)
  const failedLogos = ref(new Set())
  const statusLabels = { active: 'Ativo', past_due: 'Atrasado', canceled: 'Cancelado', incomplete: 'Incompleto', incomplete_expired: 'Expirado', trialing: 'Em teste', unpaid: 'Não pago', lifetime: 'Vitalício' }
  const statusLabel = (status) => statusLabels[status] || status || 'Sem assinatura'
  const statusClass = (status) => ({ active: 'success', lifetime: 'success', trialing: 'info', past_due: 'warning', canceled: 'danger', unpaid: 'danger' })[status] || 'neutral'
  
  const localSearch = ref(store.filters.search)
  const localCampaign = ref(store.filters.campaign)

  watch(localCampaign, (newValue) => {
    store.setCampaignFilter(newValue)
  })
  
  // Carrega os dados iniciais
  const campaignFilterOptions = ref([{ value: '', label: 'Todas as origens' }])
  onMounted(() => {
    loadCampaignFilterOptions().then((options) => { campaignFilterOptions.value = options })
    store.fetchClinics(1)
  })
  
  // Watch para o filtro de busca com Debounce
  watch(localSearch, (newValue) => {
    if (debounceTimeout.value) {
      clearTimeout(debounceTimeout.value)
    }
    debounceTimeout.value = setTimeout(() => {
      store.setSearchFilter(newValue)
    }, 500)
  })
  
  // Manipulador da paginação
  const handlePageChange = (newPage) => {
    store.fetchClinics(newPage)
    window.scrollTo(0, 0); // Opcional: rola para o topo
  }
  </script>
  
  <style scoped>
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap; 
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  .page-title {
    font-size: 1.875rem;
    font-weight: 700;
    color: #111827;
    margin: 0;
  }
  .header-actions {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }
  
  .clinic-identity { display: flex; align-items: center; gap: 12px; min-width: 0; }
  .logo-wrapper { flex: 0 0 44px; width: 44px; height: 44px; display: grid; place-items: center; overflow: hidden; border-radius: 12px; color: #64748b; background: #f1f5f9; }
  .logo-wrapper img { width: 100%; height: 100%; object-fit: cover; }
  .identity-text { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
  .identity-text strong { color: #0f172a; font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .identity-text small { color: #64748b; font-size: 12px; }
  .plan-status { display: flex; flex-wrap: wrap; gap: 6px; }
  .plan-chip, .status-chip { border-radius: 999px; padding: 4px 8px; font-size: 11px; font-weight: 600; }
  .plan-chip { color: #1d4ed8; background: #eff6ff; text-transform: capitalize; }
  .status-chip.success { color: #15803d; background: #dcfce7; }
  .status-chip.info { color: #1d4ed8; background: #dbeafe; }
  .status-chip.warning { color: #a16207; background: #fef3c7; }
  .status-chip.danger { color: #b91c1c; background: #fee2e2; }
  .status-chip.neutral { color: #475569; background: #f1f5f9; }
  .status-chip.campaign { color: #15803d; background: #f0fdf4; border: 1px solid #bbf7d0; }
  .row-action { display: inline-flex; justify-content: flex-end; align-items: center; gap: 5px; color: #2563eb; font-weight: 600; white-space: nowrap; }
  </style>
