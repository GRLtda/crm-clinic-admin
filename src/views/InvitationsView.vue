<template>
    <div class="invitations-list-view">
      <AppPageHeader title="Convites de Registro" subtitle="Convide novos usuários e acompanhe os convites pendentes." :icon="PageIcon">
        <template #actions>
          <button class="btn-primary-invite" @click="isInviteModalOpen = true">
            <UserPlus :size="18" />
            Convidar Usuário
          </button>
        </template>
      </AppPageHeader>
  
      <AppDataTable
        :columns="columns"
        :rows="store.invitations"
        :loading="store.loadingList"
        :skeleton-rows="skeletonRows"
        :pagination="store.pagination"
        :empty-icon="MailX"
        empty-title="Nenhum convite encontrado"
        empty-text="Tente ajustar o filtro de status ou crie um novo convite."
        @page-change="handlePageChange"
      >
        <template #filters>
        <AppSelect
          v-model="localStatus"
          :icon="Filter"
          :options="statusOptions"
          class="filter-select"
        />
        </template>
        <template #cell-email="{ row: invite }"><span class="email-cell">{{ invite.email }}</span></template>
        <template #cell-phone="{ row: invite }">{{ invite.phone || 'N/A' }}</template>
        <template #cell-plan="{ row: invite }"><span class="plan-cell">{{ invite.plan }}</span></template>
        <template #cell-status="{ row: invite }">
          <StatusBadge
            :variant="invite.status === 'pending' ? 'neutral' : 'success'"
            :label="invite.status === 'pending' ? 'Pendente' : 'Aceito'"
          />
        </template>
        <template #cell-expiresAt="{ row: invite }">{{ formatDate(invite.expiresAt) }}</template>
        <template #cell-actions="{ row: invite }">
          <button
            v-if="invite.status === 'pending'"
            class="btn-action-delete"
            title="Excluir convite"
            @click="handleDelete(invite._id, invite.email)"
          >
            <Trash2 :size="18" />
          </button>
        </template>
      </AppDataTable>

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
import AppPageHeader from '@/components/global/AppPageHeader.vue'
import { MailPlus as PageIcon } from 'lucide-vue-next'
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
  
  </style>
