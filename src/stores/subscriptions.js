import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import axios from 'axios'
import { useAuthStore } from './auth.js'
import { useToast } from 'vue-toastification'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export const useSubscriptionsStore = defineStore('subscriptions-admin', () => {
    // ---------------------------------
    // State 📦
    // ---------------------------------
    const loading = ref(true)
    const subscriptions = ref([])

    const filters = reactive({
        status: '',
        search: ''
    })

    const pagination = ref({
        total: 0,
        page: 1,
        pages: 1,
        limit: 20
    })

    const summary = ref({
        total: 0,
        active: 0,
        trialing: 0,
        past_due: 0,
        canceled: 0,
        lifetime: 0,
        none: 0
    })

    // Detalhes
    const loadingDetails = ref(false)
    const selectedDetails = ref(null)

    // Ação em progresso
    const actionLoading = ref(false)

    const authStore = useAuthStore()
    const toast = useToast()

    // ---------------------------------
    // Actions ⚡
    // ---------------------------------

    /**
     * 🚀 Busca lista de assinaturas (paginada com filtros)
     */
    async function fetchSubscriptions(page = 1) {
        loading.value = true

        const params = {
            page: page,
            limit: pagination.value.limit
        }

        if (filters.status) {
            params.status = filters.status
        }
        if (filters.search) {
            params.search = filters.search
        }

        try {
            const response = await axios.get(`${API_BASE_URL}/subscriptions`, {
                params: params,
                headers: authStore.authHeaders
            })

            const data = response.data
            subscriptions.value = data.data
            pagination.value = {
                total: data.total,
                page: data.page,
                pages: data.pages,
                limit: data.limit
            }
            summary.value = data.summary || summary.value

        } catch (err) {
            console.error('Erro ao buscar assinaturas:', err)
            toast.error('Não foi possível carregar a lista de assinaturas.')
            subscriptions.value = []
        } finally {
            loading.value = false
        }
    }

    /**
     * Aplica filtro de status
     */
    async function setStatusFilter(status) {
        filters.status = status
        await fetchSubscriptions(1)
    }

    /**
     * Aplica filtro de busca
     */
    async function setSearchFilter(search) {
        filters.search = search
        await fetchSubscriptions(1)
    }

    /**
     * Limpa todos os filtros
     */
    async function clearFilters() {
        filters.status = ''
        filters.search = ''
        await fetchSubscriptions(1)
    }

    /**
     * 🔍 Busca detalhes de uma assinatura
     */
    async function fetchDetails(id) {
        loadingDetails.value = true
        selectedDetails.value = null

        try {
            const response = await axios.get(`${API_BASE_URL}/subscriptions/${id}/details`, {
                headers: authStore.authHeaders
            })
            selectedDetails.value = response.data
        } catch (err) {
            console.error('Erro ao buscar detalhes:', err)
            toast.error('Não foi possível carregar os detalhes da assinatura.')
        } finally {
            loadingDetails.value = false
        }
    }

    /**
     * Limpa detalhes selecionados
     */
    function clearDetails() {
        selectedDetails.value = null
    }

    /**
     * 🎁 Concede trial/mês grátis
     */
    async function grantTrial(id, days = 30) {
        actionLoading.value = true

        try {
            const response = await axios.post(`${API_BASE_URL}/subscriptions/${id}/grant-trial`,
                { days },
                { headers: authStore.authHeaders }
            )

            toast.success(response.data.message || 'Trial concedido com sucesso!')

            // Atualiza a lista
            await fetchSubscriptions(pagination.value.page)

            return true
        } catch (err) {
            console.error('Erro ao conceder trial:', err)
            toast.error(err.response?.data?.message || 'Erro ao conceder trial.')
            return false
        } finally {
            actionLoading.value = false
        }
    }

    /**
     * ❌ Cancela assinatura
     */
    async function cancelSubscription(id, immediately = false) {
        actionLoading.value = true

        try {
            const response = await axios.post(`${API_BASE_URL}/subscriptions/${id}/cancel`,
                { immediately },
                { headers: authStore.authHeaders }
            )

            toast.success(response.data.message || 'Assinatura cancelada!')

            // Atualiza a lista
            await fetchSubscriptions(pagination.value.page)

            return true
        } catch (err) {
            console.error('Erro ao cancelar assinatura:', err)
            toast.error(err.response?.data?.message || 'Erro ao cancelar assinatura.')
            return false
        } finally {
            actionLoading.value = false
        }
    }

    /**
     * 🎁 Concede 1 mês grátis via crédito (para quem já tem assinatura)
     */
    async function grantFreeMonth(id, reason = 'Mês grátis concedido pelo admin') {
        actionLoading.value = true

        try {
            const response = await axios.post(`${API_BASE_URL}/subscriptions/${id}/grant-free-month`,
                { reason },
                { headers: authStore.authHeaders }
            )

            toast.success(response.data.message || 'Mês grátis concedido!')

            // Atualiza a lista
            await fetchSubscriptions(pagination.value.page)

            return true
        } catch (err) {
            console.error('Erro ao conceder mês grátis:', err)
            toast.error(err.response?.data?.message || 'Erro ao conceder mês grátis.')
            return false
        } finally {
            actionLoading.value = false
        }
    }

    // ---------------------------------
    // Exportar 📤
    // ---------------------------------
    return {
        loading,
        subscriptions,
        filters,
        pagination,
        summary,
        loadingDetails,
        selectedDetails,
        actionLoading,

        fetchSubscriptions,
        setStatusFilter,
        setSearchFilter,
        clearFilters,
        fetchDetails,
        clearDetails,
        grantTrial,
        grantFreeMonth,
        cancelSubscription
    }
})

