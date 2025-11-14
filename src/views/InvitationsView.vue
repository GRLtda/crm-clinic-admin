<template>
    <div class="invitations-list-view">
      <div class="page-header">
        <h2 class="page-title">Convites de Registro</h2>
        <div class="header-actions">
          <AppSelect
            v-model="localStatus"
            :icon="Filter"
            :options="statusOptions"
            class="filter-select"
          />
          <button class="btn-primary-invite" @click="isInviteModalOpen = true">
            <UserPlus :size="18" />
            Convidar Usuário
          </button>
        </div>
      </div>
  
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>E-mail</th>
              <th>Telefone</th>
              <th>Plano</th>
              <th>Status</th>
              <th>Expira Em</th>
              <th>Ações</th>
            </tr>
          </thead>
          
          <tbody v-if="!store.loadingList">
            <tr v-for="invite in store.invitations" :key="invite._id">
              <td data-label="E-mail">
                <span class="email-cell">{{ invite.email }}</span>
              </td>
              <td data-label="Telefone">
                <span>{{ invite.phone || 'N/A' }}</span>
              </td>
              <td data-label="Plano">
                <span class="plan-cell">{{ invite.plan }}</span>
              </td>
              <td data-label="Status">
                <StatusBadge
                  :variant="invite.status === 'pending' ? 'neutral' : 'success'"
                  :label="invite.status === 'pending' ? 'Pendente' : 'Aceito'"
                />
              </td>
              <td data-label="Expira Em">
                <span>{{ formatDate(invite.expiresAt) }}</span>
              </td>
              <td data-label="Ações">
                <button
                  v-if="invite.status === 'pending'"
                  class="btn-action-delete"
                  title="Excluir convite"
                  @click="handleDelete(invite._id, invite.email)"
                >
                  <Trash2 :size="18" />
                </button>
              </td>
            </tr>
          </tbody>
  
          <tbody v-if="store.loadingList">
            <tr v-for="n in skeletonRows" :key="n" class="skeleton-row">
              <td data-label="E-mail"><SkeletonLoader width="220px" height="16px" /></td>
              <td data-label="Telefone"><SkeletonLoader width="120px" height="16px" /></td>
              <td data-label="Plano"><SkeletonLoader width="80px" height="24px" radius="99px" /></td>
              <td data-label="Status"><SkeletonLoader width="90px" height="24px" radius="99px" /></td>
              <td data-label="Expira Em"><SkeletonLoader width="100px" height="16px" /></td>
              <td data-label="Ações"><SkeletonLoader width="32px" height="32px" radius="0.375rem" /></td>
            </tr>
          </tbody>
        </table>
        
        <div v-if="!store.loadingList && store.invitations.length === 0" class="empty-state">
          <MailX :size="48" />
          <h3>Nenhum convite encontrado</h3>
          <p>Tente ajustar o filtro de status ou crie um novo convite.</p>
        </div>
      </div>
      
      <AppPagination
        v-if="!store.loadingList && store.pagination.pages > 1"
        :current-page="store.pagination.page"
        :total-pages="store.pagination.pages"
        :total-items="store.pagination.total"
        :items-on-page="store.invitations.length"
        @page-changed="handlePageChange"
      />
  
      <InviteUserModal
        :show="isInviteModalOpen"
        @close="isInviteModalOpen = false"
        @success="handleInviteSuccess"
      />
      
      <ShowInviteLinkModal
        :show="isLinkModalOpen"
        :invitation="generatedInvitation"
        @close="isLinkModalOpen = false"
      />
    </div>
  </template>
  
  <script setup>
  import { onMounted, ref, watch } from 'vue'
  import { useInvitationsStore } from '../stores/invitations.js'
  import { UserPlus, Trash2, Filter, MailX } from 'lucide-vue-next'
  import AppPagination from '../components/global/AppPagination.vue'
  import SkeletonLoader from '../components/global/SkeletonLoader.vue'
  import StatusBadge from '../components/global/StatusBadge.vue'
  import AppSelect from '../components/global/AppSelect.vue'
  import InviteUserModal from '../components/pages/invitations/InviteUserModal.vue'
  import ShowInviteLinkModal from '../components/pages/invitations/ShowInviteLinkModal.vue'
  
  const store = useInvitationsStore()
  const skeletonRows = ref(10)
  
  const isInviteModalOpen = ref(false)
  const isLinkModalOpen = ref(false)
  const generatedInvitation = ref(null)
  
  const localStatus = ref(store.filters.status)
  const statusOptions = ref([
    { value: 'pending', label: 'Pendentes' },
    { value: 'accepted', label: 'Aceitos' },
    { value: '', label: 'Todos os Convites' }
  ])
  
  onMounted(() => {
    skeletonRows.value = store.pagination.limit
    store.fetchInvitations(1) 
  })
  
  watch(localStatus, (newValue) => {
    store.setStatusFilter(newValue)
  })
  
  const handlePageChange = (newPage) => {
    store.fetchInvitations(newPage)
  }
  
  const handleDelete = (id, email) => {
    if (window.confirm(`Tem certeza que deseja excluir o convite para ${email}?`)) {
      store.deleteInvitation(id)
    }
  }
  
  const handleInviteSuccess = (invitation) => {
    generatedInvitation.value = invitation
    isInviteModalOpen.value = false // Fecha o modal de criação
    isLinkModalOpen.value = true // Abre o modal do link
    
    // Atualiza a lista, mas apenas se o filtro atual for "pendentes" ou "todos"
    if (store.filters.status === 'pending' || store.filters.status === '') {
       store.fetchInvitations(store.pagination.page)
    }
  }
  
  const formatDate = (dateString) => {
    const options = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    return new Date(dateString).toLocaleDateString('pt-BR', options)
  }
  </script>
  
  <style scoped>
  /* Estilos do Page Header (similares ao UsersListView) */
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
  .filter-select {
    width: 200px;
  }
  
  /* Botão Primário de Convite */
  .btn-primary-invite {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: #fff;
    background-color: var(--color-primary, #0284c7);
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }
  .btn-primary-invite:hover {
    background-color: var(--color-primary-dark, #0369a1);
  }
  
  /* Estilos da Tabela (similares ao UsersListView) */
  .table-container {
    background-color: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    overflow: hidden;
    margin-bottom: 1.5rem;
  }
  .data-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
  }
  .data-table th,
  .data-table td {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #e5e7eb;
    vertical-align: middle;
    font-size: 0.875rem;
    color: #374151;
  }
  .data-table tr:last-child td {
    border-bottom: none;
  }
  .data-table th {
    font-size: 0.75rem;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    background-color: #f9fafb;
  }
  
  .email-cell {
    font-weight: 500;
    color: #111827;
  }
  .plan-cell {
    text-transform: capitalize;
    font-weight: 500;
  }
  
  /* Botão de Deletar */
  .btn-action-delete {
    background: transparent;
    border: none;
    color: #dc2626;
    padding: 0.5rem;
    border-radius: 0.375rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .btn-action-delete:hover {
    background-color: #fee2e2;
    color: #991b1b;
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
    max-width: 300px;
    text-align: center;
  }
  
  /* Responsivo (baseado no UsersListView) */
  @media (max-width: 768px) {
    .data-table thead {
      display: none;
    }
    .table-container {
      border: none;
      background-color: transparent;
    }
    .data-table tr {
      display: block;
      background-color: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 0.75rem;
      margin-bottom: 1rem;
    }
    .data-table td {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
    }
    .data-table td::before {
      content: attr(data-label);
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      font-size: 0.75rem;
    }
    .skeleton-row td {
       display: flex;
       justify-content: space-between;
    }
  }
  </style>