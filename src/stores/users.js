import { defineStore } from 'pinia'
import { ref, reactive } from 'vue' // 👈 Importar 'reactive'
import axios from 'axios'
import { useAuthStore } from './auth.js' // (Ajuste o caminho se necessário)
import { useToast } from 'vue-toastification'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export const useUsersStore = defineStore('users-admin', () => {
  // ---------------------------------
  // State 📦
  // ---------------------------------
  const loading = ref(true)
  const users = ref([])
  
  // 💡 Armazena os filtros atuais
  const filters = reactive({
    search: '',
    role: ''
  })
  
  const pagination = ref({
    total: 0,
    page: 1,
    pages: 1,
    limit: 10
  })
  
  const authStore = useAuthStore()
  const toast = useToast()

  // ---------------------------------
  // Actions ⚡
  // ---------------------------------
  
  /**
   * 🚀 Busca os usuários da API com paginação e filtros
   */
  async function fetchUsers(page = 1) {
    loading.value = true
    
    // (Simula um delay para vermos o skeleton)
    // await new Promise(r => setTimeout(r, 1500)); 

    // 1. Monta os parâmetros de query
    const params = {
      page: page,
      limit: pagination.value.limit
    }
    // Adiciona filtros apenas se não estiverem vazios
    if (filters.search) {
      params.search = filters.search
    }
    if (filters.role) {
      params.role = filters.role
    }

    try {
      // ❓ (Vou assumir que o endpoint é /users. Ajuste se for diferente)
      const response = await axios.get(`${API_BASE_URL}/users`, { 
        params: params, // 👈 Envia os parâmetros
        headers: authStore.authHeaders
      })
      
      // ✅ Sucesso
      const data = response.data
      users.value = data.data
      pagination.value = {
        total: data.total,
        page: data.page,
        pages: data.pages,
        limit: data.limit
      }

    } catch (err) {
      // ❌ Erro
      console.error('Erro ao buscar usuários:', err)
      toast.error('Não foi possível carregar a lista de usuários.')
      users.value = []
      pagination.value = { total: 0, page: 1, pages: 1, limit: 10 }
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 🏃 Aplica o filtro de "role" e busca novamente
   */
  async function setRoleFilter(newRole) {
    filters.role = newRole
    await fetchUsers(1) // Reseta para a página 1
  }
  
  /**
   * 🏃 Aplica o filtro de "search" e busca novamente
   */
  async function setSearchFilter(newSearch) {
    filters.search = newSearch
    await fetchUsers(1) // Reseta para a página 1
  }

  // ---------------------------------
  // Exportar 📤
  // ---------------------------------
  return {
    loading,
    users,
    filters, // 👈 Exportar os filtros
    pagination,
    fetchUsers,
    setRoleFilter, // 👈 Exportar a ação
    setSearchFilter // 👈 Exportar a ação
  }
})