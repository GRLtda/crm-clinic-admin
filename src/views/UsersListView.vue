<template>
  <div class="users-list-view">
    <div class="page-header">
      <h2 class="page-title">Usuários do Sistema</h2>
      
      <div class="header-actions">
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
      </div>
    </div>

    <div class="table-container">
      <table class="users-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Contato</th>
            <th>Função (Role)</th>
            <th>Clínica</th>
            <th>Status</th>
            <th>Registrado em</th>
          </tr>
        </thead>
        
        <tbody v-if="!store.loading">
          <tr v-for="user in store.users" :key="user._id">
            <td data-label="Nome">
              <div class="user-cell">
                <AvatarPlaceholder
                  :name="user.name"
                  size="40px"
                  fontSize="0.875rem"
                />
                <div class="user-info">
                  <span class="user-name">{{ user.name }}</span>
                  <span class="user-id">ID: {{ user._id }}</span>
                </div>
              </div>
            </td>
            <td data-label="Contato">
              <div class="contact-cell">
                <span class="user-email">{{ user.email }}</span>
                <span class="user-phone">{{ user.phone }}</span>
              </div>
            </td>
            <td data-label="Função">
              <span class="user-role">{{ user.role }}</span>
            </td>
            <td data-label="Clínica">
              <span class="user-clinic">{{ user.clinic?.name || 'N/A' }}</span>
            </td>
            <td data-label="Status">
              <StatusBadge
                :variant="user.isActive ? 'success' : 'danger'"
                :label="user.isActive ? 'Ativo' : 'Inativo'"
              />
            </td>
            <td data-label="Registrado em">
              <span class="user-date">{{
                formatDate(user.createdAt)
              }}</span>
            </td>
          </tr>
        </tbody>

        <tbody v-if="store.loading">
          <tr v-for="n in skeletonRows" :key="n" class="skeleton-row">
            <td data-label="Nome">
              <div class="user-cell">
                <SkeletonLoader width="40px" height="40px" radius="50%" />
                <div class="user-info">
                  <SkeletonLoader width="150px" height="16px" />
                  <SkeletonLoader width="100px" height="12px" />
                </div>
              </div>
            </td>
            <td data-label="Contato">
              <div class="contact-cell">
                <SkeletonLoader width="180px" height="16px" />
                <SkeletonLoader width="120px" height="12px" />
              </div>
            </td>
            <td data-label="Função">
              <SkeletonLoader width="80px" height="24px" radius="99px" />
            </td>
            <td data-label="Clínica">
              <SkeletonLoader width="120px" height="16px" />
            </td>
            <td data-label="Status">
              <SkeletonLoader width="70px" height="24px" radius="99px" />
            </td>
            <td data-label="Registrado em">
              <SkeletonLoader width="100px" height="16px" />
            </td>
          </tr>
        </tbody>
      </table>
      
      <div v-if="!store.loading && store.users.length === 0" class="empty-state">
        <UserX :size="48" />
        <h3>Nenhum usuário encontrado</h3>
        <p>Tente ajustar seus filtros de busca.</p>
      </div>

    </div> <AppPagination
      v-if="!store.loading && store.pagination.totalPages > 1"
      :current-page="store.pagination.page"
      :total-pages="store.pagination.pages"
      :total-items="store.pagination.total"
      :items-on-page="store.users.length"
      @page-changed="handlePageChange"
    />

  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import { useUsersStore } from '../stores/users.js'
import { UserX, Filter } from 'lucide-vue-next'
import AppPagination from '../components/global/AppPagination.vue'
import SkeletonLoader from '../components/global/SkeletonLoader.vue'
import StatusBadge from '../components/global/StatusBadge.vue'
import SearchInput from '../components/global/SearchInput.vue'
import AppSelect from '../components/global/AppSelect.vue'
import AvatarPlaceholder from '../components/global/AvatarPlaceholder.vue' // 👈 Importado aqui

const store = useUsersStore()
const skeletonRows = ref(10)
const debounceTimeout = ref(null)

const localSearch = ref(store.filters.search)
const localRole = ref(store.filters.role)
const roleOptions = ref([
  { value: 'owner', label: 'Dono (Owner)' },
  { value: 'medico', label: 'Médico' },
  { value: 'recepcionista', label: 'Recepcionista' },
  { value: 'gerente', label: 'Gerente' }
])

onMounted(() => {
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

/* Container da Tabela */
.table-container {
  background-color: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  overflow: hidden;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.users-table th,
.users-table td {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  vertical-align: middle;
}

.users-table th {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background-color: #f9fafb;
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
  font-style: italic;
}
.user-id {
  text-transform: none;
}
.user-date {
  text-transform: none;
}

/* Skeleton */
.skeleton-row td {
  border-bottom: 1px solid #e5e7eb;
}
.skeleton-row .user-info {
  gap: 0.5rem;
}
.skeleton-row .contact-cell {
  gap: 0.5rem;
}

/* Estado Vazio */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: #6b7280;
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


/* ------------------------- */
/* RESPONSIVO (768px)        */
/* ------------------------- */
@media (max-width: 768px) {
  .users-table thead {
    display: none;
  }

  .table-container {
    border: none;
    background-color: transparent;
    border-radius: 0;
  }

  .users-table tr {
    display: block;
    background-color: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    margin-bottom: 1rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }
  .users-table tbody tr:last-child {
    margin-bottom: 0;
  }

  .users-table td {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #f3f4f6;
  }
  .users-table tr td:last-child {
    border-bottom: none;
  }

  .users-table td::before {
    content: attr(data-label);
    font-size: 0.75rem;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    margin-right: 1rem;
  }
  
  .users-table td .user-cell,
  .users-table td .contact-cell {
    flex-grow: 1;
    text-align: right;
  }
  .users-table td .user-name {
    font-size: 0.875rem;
  }
  .users-table td .user-id {
    font-size: 0.75rem;
  }
  .users-table td .user-email {
    font-size: 0.875rem;
    word-break: break-all;
  }

  /* Garante que a célula de usuário (avatar + info) 
    fique alinhada à direita no mobile.
  */
  .users-table td[data-label="Nome"] .user-cell {
    justify-content: flex-end;
  }

  .skeleton-row td {
    display: flex;
    justify-content: space-between;
  }
  .skeleton-row td[data-label="Nome"] .user-info {
    align-items: flex-end;
  }
  .skeleton-row td[data-label="Contato"] .contact-cell {
    align-items: flex-end;
  }
}
</style>