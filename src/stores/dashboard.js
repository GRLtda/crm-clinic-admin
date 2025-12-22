import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import { useAuthStore } from './auth.js' // (Ajuste o caminho se necessário)
import { useToast } from 'vue-toastification'

// 👇 MUDANÇA AQUI: Lendo a variável do .env
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export const useDashboardStore = defineStore('dashboard-admin', () => {
  // ---------------------------------
  // State 📦
  // ---------------------------------
  const loading = ref(true)
  const currentPeriod = ref('12m') // Período padrão
  const totals = ref({
    totalClinics: 0,
    totalUsers: 0,
    totalPatients: 0,
    totalAppointments: 0
  })
  const chartsData = ref({
    period: '12m',
    newClinicsPerPeriod: [],
    newPatientsPerPeriod: [],
    newUsersPerPeriod: [], // Adicionado
    appointmentStatusDistribution: []
  })

  const authStore = useAuthStore()
  const toast = useToast()

  // ---------------------------------
  // Actions ⚡
  // ---------------------------------

  /**
   * 🚀 Busca os dados de resumo da API
   * @param {string} period - '7d', '1m', '6m', '12m'
   */
  async function fetchSummary(period = '12m') {
    loading.value = true
    currentPeriod.value = period

    try {
      const response = await axios.get(`${API_BASE_URL}/summary`, {
        params: { period: period },
        headers: authStore.authHeaders
      })

      // ✅ Sucesso
      const data = response.data
      totals.value = data.totals
      chartsData.value = data.charts

    } catch (err) {
      // ❌ Erro
      console.error('Erro ao buscar resumo do dashboard:', err)
      toast.error('Não foi possível carregar os dados do dashboard.')

      // Reseta para dados vazios em caso de erro
      totals.value = { totalClinics: 0, totalUsers: 0, totalPatients: 0, totalAppointments: 0 }
      chartsData.value = { period: period, newClinicsPerPeriod: [], newPatientsPerPeriod: [], appointmentStatusDistribution: [] }

    } finally {
      loading.value = false
    }
  }

  // ---------------------------------
  // Exportar 📤
  // ---------------------------------
  return {
    loading,
    currentPeriod,
    totals,
    chartsData,
    fetchSummary
  }
})