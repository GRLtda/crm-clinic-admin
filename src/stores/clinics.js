import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import axios from 'axios'
import { useAuthStore } from './auth.js' // (Ajuste o caminho se necessário)
import { useToast } from 'vue-toastification'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export const useClinicsStore = defineStore('clinics-admin', () => {
  // ---------------------------------
  // State 📦
  // ---------------------------------
  const loading = ref(true)
  const clinics = ref([])

  const filters = reactive({
    search: ''
  })

  const pagination = ref({
    total: 0,
    page: 1,
    pages: 1,
    limit: 12
  })

  // 👇 NOVOS STATES (para a página de detalhes)
  const loadingDetail = ref(true)
  const selectedClinic = ref(null)

  const authStore = useAuthStore()
  const toast = useToast()

  // ---------------------------------
  // Actions ⚡
  // ---------------------------------

  /**
   * 🚀 Busca a lista de clínicas (paginada)
   */
  async function fetchClinics(page = 1) {
    loading.value = true

    const params = {
      page: page,
      limit: pagination.value.limit
    }
    if (filters.search) {
      params.search = filters.search
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/clinics`, {
        params: params,
        headers: authStore.authHeaders
      })

      const data = response.data
      clinics.value = data.data
      pagination.value = {
        total: data.total,
        page: data.page,
        pages: data.pages,
        limit: data.limit
      }

    } catch (err) {
      console.error('Erro ao buscar clínicas:', err)
      toast.error('Não foi possível carregar a lista de clínicas.')
      clinics.value = []
      pagination.value = { total: 0, page: 1, pages: 1, limit: 12 }
    } finally {
      loading.value = false
    }
  }

  async function setSearchFilter(newSearch) {
    filters.search = newSearch
    await fetchClinics(1) // Reseta para a página 1
  }

  // 👇 NOVA AÇÃO (para buscar uma clínica por ID)
  /**
   * 🚀 Busca uma clínica específica pelo ID
   */
  async function fetchClinicById(id) {
    loadingDetail.value = true
    selectedClinic.value = null

    try {
      // (Assumindo que este é o endpoint para buscar um por ID)
      const response = await axios.get(`${API_BASE_URL}/clinics/${id}`, {
        headers: authStore.authHeaders
      })
      selectedClinic.value = response.data

    } catch (err) {
      console.error(`Erro ao buscar clínica ${id}:`, err)
      toast.error('Não foi possível carregar os detalhes da clínica.')
    } finally {
      loadingDetail.value = false
    }
  }

  // 👇 NOVA AÇÃO (para limpar os dados ao sair da página)
  function clearSelectedClinic() {
    selectedClinic.value = null
  }

  // 👇 NOVA AÇÃO (para atualizar o status da assinatura)
  async function updateSubscriptionStatus(id, status) {
    try {
      const response = await axios.patch(`${API_BASE_URL}/clinics/${id}/subscription`, { status }, {
        headers: authStore.authHeaders
      })

      // Atualiza o estado local se a clínica estiver selecionada
      if (selectedClinic.value && selectedClinic.value._id === id) {
        selectedClinic.value.subscriptionStatus = response.data.subscriptionStatus
      }

      toast.success('Status da assinatura atualizado com sucesso!')
      return true
    } catch (err) {
      console.error(`Erro ao atualizar status da assinatura:`, err)
      toast.error('Erro ao atualizar status.')
      return false
    }
  }

  async function updateClinicPlan(id, plan) {
    console.log('[Store] updateClinicPlan called with:', { id, plan })
    try {
      const response = await axios.patch(`${API_BASE_URL}/clinics/${id}/plan`, { plan }, {
        headers: authStore.authHeaders
      })

      console.log('[Store] API Response:', response.data)

      // Atualiza o estado local se a clínica estiver selecionada
      if (selectedClinic.value && selectedClinic.value._id === id) {
        console.log('[Store] Updating selectedClinic plan from', selectedClinic.value.plan, 'to', response.data.plan)
        selectedClinic.value.plan = response.data.plan
      } else {
        console.warn('[Store] selectedClinic mismatch or null', { selected: selectedClinic.value, id })
      }

      toast.success('Plano atualizado com sucesso!')
      return true
    } catch (err) {
      console.error(`Erro ao atualizar plano:`, err)
      toast.error('Erro ao atualizar plano.')
    }
  }

  async function updateClinicOverrides(id, overrides) {
    try {
      const response = await axios.patch(`${API_BASE_URL}/clinics/${id}/overrides`, { overrides }, {
        headers: authStore.authHeaders
      })

      if (selectedClinic.value && selectedClinic.value._id === id) {
        selectedClinic.value.planOverrides = response.data.planOverrides
      }

      toast.success('Overrides atualizados com sucesso!')
      return true
    } catch (err) {
      console.error(`Erro ao atualizar overrides:`, err)
      toast.error('Erro ao atualizar overrides.')
      return false
    }
  }

  async function setInstallationFeeWaived(id, waived) {
    try {
      const response = await axios.patch(`${API_BASE_URL}/subscriptions/${id}/installation-fee`, { waived }, {
        headers: authStore.authHeaders
      })
      if (selectedClinic.value?._id === id) {
        selectedClinic.value.installationFeeCharged = response.data.installationFeeCharged
        selectedClinic.value.installationFeeWaived = response.data.installationFeeWaived
        selectedClinic.value.installationFeeCanRestore = false
      }
      toast.success(waived ? 'Taxa de instalação retirada.' : 'Taxa de instalação reativada.')
      return true
    } catch (err) {
      toast.error(err.response?.data?.message || 'Não foi possível atualizar a taxa de instalação.')
      return false
    }
  }

  // ---------------------------------
  // Exportar 📤
  // ---------------------------------
  async function setTrialEnd(id, trialEndsAt) {
    try {
      const response = await axios.patch(`${API_BASE_URL}/subscriptions/${id}/trial-end`, { trialEndsAt }, { headers: authStore.authHeaders })
      if (selectedClinic.value?._id === id) Object.assign(selectedClinic.value, response.data)
      toast.success('Fim do período de teste atualizado.')
      return true
    } catch (err) {
      toast.error(err.response?.data?.message || 'Não foi possível atualizar o período de teste.')
      return false
    }
  }

  return {
    loading,
    clinics,
    filters,
    pagination,
    fetchClinics,
    setSearchFilter,

    // 👇 Exportar novos itens
    loadingDetail,
    selectedClinic,
    fetchClinicById,
    clearSelectedClinic,
    updateSubscriptionStatus,
    updateClinicPlan,
    updateClinicOverrides,
    setInstallationFeeWaived,
    setTrialEnd
  }
})
