import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import { useAuthStore } from './auth.js'
import { useToast } from 'vue-toastification'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export const useCampaignsStore = defineStore('campaigns-admin', () => {
  const loading = ref(false)
  const campaigns = ref([])

  const authStore = useAuthStore()
  const toast = useToast()

  async function fetchCampaigns() {
    loading.value = true

    try {
      const response = await axios.get(`${API_BASE_URL}/campaigns`, {
        headers: authStore.authHeaders,
      })

      campaigns.value = response.data.data || response.data || []
    } catch (error) {
      console.error('Erro ao buscar campanhas:', error)
      campaigns.value = []
      toast.error('Nao foi possivel carregar as campanhas.')
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    campaigns,
    fetchCampaigns,
  }
})
