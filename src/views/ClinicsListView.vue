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
  
      <div v-if="store.loading" class="clinics-grid">
        <ClinicCardSkeleton
          v-for="n in store.pagination.limit"
          :key="`skel-${n}`"
        />
      </div>
      <div v-else-if="store.clinics.length > 0" class="clinics-grid">
        <ClinicCard
          v-for="clinic in store.clinics"
          :key="clinic._id"
          :clinic="clinic"
        />
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
  import { Building2 } from 'lucide-vue-next'
  import AppPagination from '../components/global/AppPagination.vue'
  import SearchInput from '../components/global/SearchInput.vue'
  import ClinicCard from '../components/pages/clinics/ClinicCard.vue'
  import ClinicCardSkeleton from '../components/pages/clinics/ClinicCardSkeleton.vue'
  
  const store = useClinicsStore()
  const debounceTimeout = ref(null)
  
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
  </style>