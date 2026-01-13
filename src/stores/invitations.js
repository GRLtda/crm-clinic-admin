import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import axios from 'axios'
import { useAuthStore } from './auth.js'
import { useToast } from 'vue-toastification'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export const useInvitationsStore = defineStore('invitations-admin', () => {
  // ---------------------------------
  // State 📦
  // ---------------------------------
  const loadingList = ref(true)
  const loadingCreate = ref(false)

  const invitations = ref([])

  const filters = reactive({
    status: 'pending' // Default to 'pending'
  })

  const pagination = ref({
    total: 0,
    page: 1,
    pages: 1,
    limit: 15 // Set a reasonable limit
  })

  const authStore = useAuthStore()
  const toast = useToast()

  // ---------------------------------
  // Actions ⚡
  // ---------------------------------

  /**
   * 🚀 Busca a lista de convites (paginada)
   */
  async function fetchInvitations(page = 1) {
    loadingList.value = true

    const params = {
      page: page,
      limit: pagination.value.limit
    }
    if (filters.status) {
      params.status = filters.status
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/users/registro`, {
        params: params,
        headers: authStore.authHeaders
      })

      const data = response.data
      invitations.value = data.data
      pagination.value = {
        total: data.total,
        page: data.page,
        pages: data.pages,
        limit: data.limit
      }

    } catch (err) {
      console.error('Erro ao buscar convites:', err)
      toast.error('Não foi possível carregar a lista de convites.')
      invitations.value = []
      pagination.value = { total: 0, page: 1, pages: 1, limit: 15 }
    } finally {
      loadingList.value = false
    }
  }

  /**
   * 🏃 Aplica o filtro de "status" e busca novamente
   */
  async function setStatusFilter(newStatus) {
    filters.status = newStatus
    await fetchInvitations(1) // Reseta para a página 1
  }

  /**
   * 🚀 Cria um novo convite
   */
  async function createInvitation(name, email, phone, plan, sendWelcomeMessage, trialDays = 0) {
    loadingCreate.value = true
    try {
      const response = await axios.post(`${API_BASE_URL}/users/registro`,
        { name, email, phone, plan, sendWelcomeMessage, trialDays },
        { headers: authStore.authHeaders }
      )

      toast.success(response.data.message || 'Convite criado com sucesso.')

      // Retorna o convite (que inclui o token) para o modal
      return response.data.invitation

    } catch (err) {
      console.error('Erro ao criar convite:', err)
      const errorMsg = err.response?.data?.message || 'Erro ao criar convite.'
      toast.error(errorMsg)
      return null
    } finally {
      loadingCreate.value = false
    }
  }

  /**
   * ❌ Exclui um convite pendente
   */
  async function deleteInvitation(invitationId) {
    try {
      await axios.delete(`${API_BASE_URL}/users/registro/${invitationId}`, {
        headers: authStore.authHeaders
      })

      toast.success('Convite excluído.')

      // Remove da lista local para atualização instantânea da UI
      invitations.value = invitations.value.filter(inv => inv._id !== invitationId)

    } catch (err) {
      console.error('Erro ao excluir convite:', err)
      const errorMsg = err.response?.data?.message || 'Não foi possível excluir o convite.'
      toast.error(errorMsg)
    }
  }


  // ---------------------------------
  // Exportar 📤
  // ---------------------------------
  return {
    loadingList,
    loadingCreate,
    invitations,
    filters,
    pagination,
    fetchInvitations,
    setStatusFilter,
    createInvitation,
    deleteInvitation
  }
})