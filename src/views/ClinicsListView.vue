<template>
    <div class="clinics-list-view">
      <div class="page-header">
        <h2 class="page-title">Clínicas</h2>
        <div class="header-actions">
          <SearchInput
            v-model="localSearch"
            placeholder="Buscar clínica por nome, cnpj, id..."
          />
          </div>
      </div>
  
      <div v-if="store.loading" class="clinics-list" aria-busy="true">
        <div v-for="n in store.pagination.limit" :key="`skel-${n}`" class="clinic-row skeleton-row">
          <SkeletonLoader width="44px" height="44px" radius="12px" />
          <div class="skeleton-content"><SkeletonLoader width="180px" height="16px" /><SkeletonLoader width="130px" height="12px" /></div>
        </div>
      </div>
      <div v-else-if="store.clinics.length > 0" class="clinics-list">
        <div class="list-header" aria-hidden="true"><span>Clínica</span><span>Responsável</span><span>Plano e assinatura</span><span>Localização</span><span></span></div>
        <RouterLink v-for="clinic in store.clinics" :key="clinic._id" :to="{ name: 'clinic-detail', params: { id: clinic._id } }" class="clinic-row">
          <span class="clinic-identity"><span class="logo-wrapper"><img v-if="clinic.logoUrl && !failedLogos.has(clinic._id)" :src="clinic.logoUrl" :alt="`Logo da clínica ${clinic.name}`" @error="failedLogos.add(clinic._id)" /><Building2 v-else :size="21" aria-hidden="true" /></span><span class="identity-text"><strong>{{ clinic.name }}</strong><small>{{ clinic.cnpj || 'CNPJ não cadastrado' }}</small></span></span>
          <span class="list-value" data-label="Responsável">{{ clinic.responsibleName || clinic.owner?.name || 'Não informado' }}</span>
          <span class="plan-status" data-label="Plano e assinatura"><span class="plan-chip">{{ clinic.plan || 'Sem plano' }}</span><span class="status-chip" :class="statusClass(clinic.subscriptionStatus)">{{ statusLabel(clinic.subscriptionStatus) }}</span></span>
          <span class="list-value" data-label="Localização">{{ clinic.address?.city ? `${clinic.address.city}${clinic.address.state ? `, ${clinic.address.state}` : ''}` : 'Não informada' }}</span>
          <span class="row-action">Ver clínica <ArrowRight :size="16" aria-hidden="true" /></span>
        </RouterLink>
      </div>
      
      <div v-else class="empty-state">
        <Building2 :size="48" />
        <h3>Nenhuma clínica encontrada</h3>
        <p>Tente ajustar seu filtro de busca.</p>
      </div>
  
      <AppPagination
        v-if="!store.loading && store.pagination.pages > 1"
        :current-page="store.pagination.page"
        :total-pages="store.pagination.pages"
        :total-items="store.pagination.total"
        :items-on-page="store.clinics.length"
        @page-changed="handlePageChange"
        class="pagination-footer"
        label="clínicas"
      />
    </div>
  </template>
  
  <script setup>
  import { onMounted, ref, watch } from 'vue'
  import { useClinicsStore } from '../stores/clinics.js' // (Ajuste o caminho)
  import { Building2, ArrowRight } from 'lucide-vue-next'
  import AppPagination from '../components/global/AppPagination.vue'
  import SearchInput from '../components/global/SearchInput.vue'
  import SkeletonLoader from '../components/global/SkeletonLoader.vue'
  
  const store = useClinicsStore()
  const debounceTimeout = ref(null)
  const failedLogos = ref(new Set())
  const statusLabels = { active: 'Ativo', past_due: 'Atrasado', canceled: 'Cancelado', incomplete: 'Incompleto', incomplete_expired: 'Expirado', trialing: 'Em teste', unpaid: 'Não pago', lifetime: 'Vitalício' }
  const statusLabel = (status) => statusLabels[status] || status || 'Sem assinatura'
  const statusClass = (status) => ({ active: 'success', lifetime: 'success', trialing: 'info', past_due: 'warning', canceled: 'danger', unpaid: 'danger' })[status] || 'neutral'
  
  const localSearch = ref(store.filters.search)
  
  // Carrega os dados iniciais
  onMounted(() => {
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
  
  /* Grid de Cards */
  .clinics-grid {
    display: grid;
    /* 3 colunas, com largura mínima de 350px por card */
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 1.5rem; /* 24px */
  }
  
  /* Estado Vazio */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    color: #6b7280;
    background-color: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
  }
  .empty-state h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #111827;
    margin: 1rem 0 0.25rem;
  }
  .empty-state p {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0;
  }
  
  /* Paginação */
  .pagination-footer {
    margin-top: 1.5rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
  }
  .clinics-list { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
  .list-header, .clinic-row { display: grid; grid-template-columns: minmax(220px, 2fr) minmax(140px, 1.2fr) minmax(170px, 1.3fr) minmax(130px, 1fr) 110px; align-items: center; gap: 16px; padding: 14px 18px; }
  .list-header { background: #f8fafc; color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; }
  .clinic-row { border-top: 1px solid #e2e8f0; color: #334155; font-size: 13px; text-decoration: none; min-height: 76px; transition: background .15s; }
  .clinic-row:hover { background: #f8fbff; }
  .clinic-row:focus-visible { outline: 2px solid #2563eb; outline-offset: -3px; }
  .clinic-identity { display: flex; align-items: center; gap: 12px; min-width: 0; }
  .logo-wrapper { flex: 0 0 44px; width: 44px; height: 44px; display: grid; place-items: center; overflow: hidden; border-radius: 12px; color: #64748b; background: #f1f5f9; }
  .logo-wrapper img { width: 100%; height: 100%; object-fit: cover; }
  .identity-text { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
  .identity-text strong { color: #0f172a; font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .identity-text small { color: #64748b; font-size: 12px; }
  .list-value { overflow: hidden; text-overflow: ellipsis; }
  .plan-status { display: flex; flex-wrap: wrap; gap: 6px; }
  .plan-chip, .status-chip { border-radius: 999px; padding: 4px 8px; font-size: 11px; font-weight: 600; }
  .plan-chip { color: #1d4ed8; background: #eff6ff; text-transform: capitalize; }
  .status-chip.success { color: #15803d; background: #dcfce7; }
  .status-chip.info { color: #1d4ed8; background: #dbeafe; }
  .status-chip.warning { color: #a16207; background: #fef3c7; }
  .status-chip.danger { color: #b91c1c; background: #fee2e2; }
  .status-chip.neutral { color: #475569; background: #f1f5f9; }
  .row-action { display: inline-flex; justify-content: flex-end; align-items: center; gap: 5px; color: #2563eb; font-weight: 600; white-space: nowrap; }
  .skeleton-row { display: flex; }
  .skeleton-content { display: flex; flex-direction: column; gap: 7px; }
  @media (max-width: 850px) {
    .list-header { display: none; }
    .clinic-row { grid-template-columns: minmax(0, 1fr) auto; gap: 8px 16px; }
    .clinic-identity { grid-column: 1 / -1; }
    .list-value, .plan-status { grid-column: 1; }
    .list-value::before, .plan-status::before { content: attr(data-label) ': '; color: #64748b; font-weight: 600; }
    .row-action { grid-column: 2; grid-row: 2 / span 3; }
  }
  </style>
