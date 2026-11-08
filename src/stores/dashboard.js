import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import { useAuthStore } from './auth.js'
import { useToast } from 'vue-toastification'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

// Resumo do admin: receita, funil, saúde da base e Lia. Formato em api-clinic/docs/DASHBOARD_ADMIN.md.
export const useDashboardStore = defineStore('dashboard-admin', () => {
  const loading = ref(true)
  const error = ref('')
  const currentPeriod = ref('12m')
  const summary = ref(null)

  const authStore = useAuthStore()
  const toast = useToast()
  let requestId = 0

  /** @param {'7d'|'1m'|'6m'|'12m'} period */
  async function fetchSummary(period = '12m') {
    const current = ++requestId
    loading.value = true
    error.value = ''
    currentPeriod.value = period
    try {
      const { data } = await axios.get(`${API_BASE_URL}/summary`, { params: { period }, headers: authStore.authHeaders })
      if (current === requestId) summary.value = data
    } catch (err) {
      if (current !== requestId) return
      console.error('Erro ao buscar resumo do dashboard:', err)
      error.value = 'Não foi possível carregar os dados do dashboard.'
      toast.error(error.value)
      summary.value = null
    } finally {
      if (current === requestId) loading.value = false
    }
  }

  return { loading, error, currentPeriod, summary, fetchSummary }
})
