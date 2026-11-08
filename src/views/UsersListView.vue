<template>
  <div class="users-list-view">
    <AppPageHeader title="Usuários do Sistema" subtitle="Consulte as contas cadastradas na plataforma, suas funções e clínicas." :icon="PageIcon" />

    <AppDataTable
      :columns="columns"
      :rows="store.users"
      :loading="store.loading"
      :skeleton-rows="skeletonRows"
      :pagination="store.pagination"
      :empty-icon="UserX"
      empty-title="Nenhum usuário encontrado"
      empty-text="Tente ajustar seus filtros de busca."
      @page-change="handlePageChange"
    >
      <template #filters>
        <SearchInput
          v-model="localSearch"
          placeholder="Buscar por nome, email, tel..."
        />
        <AppSelect
          v-model="localRole"
          :icon="Filter"
          defaultOption="Todas as Funções"
          :options="roleOptions"
        />
        <AppSelect
          v-model="localCampaign"
          :icon="Megaphone"
          defaultOption="Todas as origens"
          :options="campaignFilterOptions"
        />
      </template>
      <template #cell-name="{ row: user }">
        <div class="user-cell">
          <AvatarPlaceholder :name="user.name" size="40px" fontSize="0.875rem" />
          <div class="user-info">
            <span class="user-name">{{ user.name }}</span>
            <span class="user-id">ID: {{ user._id }}</span>
            <span v-if="user.signupCampaign?.code" class="campaign-chip">
              {{ campaignLabel(user.signupCampaign.code, user.signupCampaign.label) }}
            </span>
          </div>
        </div>
      </template>
      <template #skeleton-name>
        <div class="user-cell">
          <SkeletonLoader width="40px" height="40px" radius="50%" />
          <div class="user-info">
            <SkeletonLoader width="150px" height="16px" />
            <SkeletonLoader width="100px" height="12px" />
          </div>
        </div>
      </template>
      <template #cell-contact="{ row: user }">
        <div class="contact-cell">
          <span class="user-email">{{ user.email }}</span>
          <span class="user-phone">{{ user.phone }}</span>
        </div>
      </template>
      <template #cell-role="{ row: user }">
        <span class="user-role">{{ user.role }}</span>
      </template>
      <template #cell-clinic="{ row: user }">
        <div class="clinic-cell">
          <span class="user-clinic">{{ user.clinic?.name || 'N/A' }}</span>
          <RouterLink v-if="user.clinic?._id" :to="{ name: 'clinic-detail', params: { id: user.clinic._id } }" class="clinic-link" :aria-label="`Ir para a clínica ${user.clinic.name}`">
            Ir para clínica <ArrowUpRight :size="15" aria-hidden="true" />
          </RouterLink>
        </div>
      </template>
      <template #cell-status="{ row: user }">
        <StatusBadge :variant="user.isActive ? 'success' : 'danger'" :label="user.isActive ? 'Ativo' : 'Inativo'" />
      </template>
      <template #cell-createdAt="{ row: user }">
        <span class="user-date">{{ formatDate(user.createdAt) }}</span>
      </template>
    </AppDataTable>
  </div>
</template>

<script setup>
import AppPageHeader from '@/components/global/AppPageHeader.vue'
import { Users as PageIcon } from 'lucide-vue-next'
import { onMounted, ref, watch } from 'vue'
import { useUsersStore } from '../stores/users.js'
import { UserX, Filter, ArrowUpRight, Megaphone } from 'lucide-vue-next'
import { loadCampaignFilterOptions, campaignLabel } from '../utils/signupCampaigns.js'
import AppDataTable from '../components/global/AppDataTable.vue'
import SkeletonLoader from '../components/global/SkeletonLoader.vue'
import StatusBadge from '../components/global/StatusBadge.vue'
import SearchInput from '../components/global/SearchInput.vue'
import AppSelect from '../components/global/AppSelect.vue'
import AvatarPlaceholder from '../components/global/AvatarPlaceholder.vue' // 👈 Importado aqui

const store = useUsersStore()
const skeletonRows = ref(10)
const columns = [
  { key: 'name', label: 'Nome' },
  { key: 'contact', label: 'Contato' },
  { key: 'role', label: 'Função (Role)', width: '120px' },
  { key: 'clinic', label: 'Clínica' },
  { key: 'status', label: 'Status', width: '100px' },
  { key: 'createdAt', label: 'Registrado em', width: '120px' },
]
const debounceTimeout = ref(null)

const localSearch = ref(store.filters.search)
const localRole = ref(store.filters.role)
const roleOptions = ref([
  { value: 'owner', label: 'Dono (Owner)' },
  { value: 'medico', label: 'Médico' },
  { value: 'recepcionista', label: 'Recepcionista' },
  { value: 'gerente', label: 'Gerente' }
])

const campaignFilterOptions = ref([{ value: '', label: 'Todas as origens' }])
onMounted(() => {
  loadCampaignFilterOptions().then((options) => { campaignFilterOptions.value = options })
  skeletonRows.value = store.pagination.limit
  store.fetchUsers(1) 
})

watch(localSearch, (newValue) => {
  if (debounceTimeout.value) {
    clearTimeout(debounceTimeout.value)
  }
  debounceTimeout.value = setTimeout(() => {
    store.setSearchFilter(newValue)
  }, 500)
})

watch(localRole, (newValue) => {
  store.setRoleFilter(newValue)
})

const localCampaign = ref(store.filters.campaign)
watch(localCampaign, (newValue) => {
  store.setCampaignFilter(newValue)
})

const handlePageChange = (newPage) => {
  store.fetchUsers(newPage)
}

const formatDate = (dateString) => {
  const options = { day: '2-digit', month: '2-digit', year: 'numeric' }
  return new Date(dateString).toLocaleDateString('pt-BR', options)
}
</script>

<style scoped>
.users-list-view {
  width: 100%;
}
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

/* Células de Usuário */
.user-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem; /* 12px */
}
.user-info {
  display: flex;
  flex-direction: column;
}
.user-name {
  font-weight: 500;
  color: #111827;
}
.user-id {
  font-size: 0.875rem;
  color: #6b7280;
}

.campaign-chip {
  align-self: flex-start;
  background: #f0fdf4;
  border-radius: 999px;
  color: #15803d;
  font-size: 0.72rem;
  font-weight: 600;
  margin-top: 0.2rem;
  padding: 2px 8px;
}

/* Células de Contato */
.contact-cell {
  display: flex;
  flex-direction: column;
}
.user-email {
  font-weight: 500;
  color: #111827;
}
.user-phone {
  font-size: 0.875rem;
  color: #6b7280;
}

.user-role,
.user-clinic,
.user-date {
  font-size: 0.875rem;
  color: #374151;
  text-transform: capitalize;
}
.user-clinic {
  color: #6b7280;
}
.clinic-cell {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
}
.clinic-link {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  color: #2563eb;
  font-size: 0.8rem;
  font-weight: 600;
  text-decoration: none;
}
.clinic-link:hover { text-decoration: underline; }
.clinic-link:focus-visible { outline: 2px solid #2563eb; outline-offset: 3px; border-radius: 2px; }
.user-id {
  text-transform: none;
}
.user-date {
  text-transform: none;
}

@media (max-width: 768px) {
  .user-cell { justify-content: flex-end; text-align: left; }
  .contact-cell, .clinic-cell { align-items: flex-end; text-align: right; }
}
</style>
