import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../utils/api'

const emptyPagination = () => ({ page: 1, limit: 20, total: 0, pages: 1 })
const retryableStatuses = new Set([502, 503, 504])

function errorDetails(error) {
  const body = error.response?.data
  return {
    status: error.response?.status,
    message: body?.error?.message || body?.message || 'Não foi possível carregar os registros de auditoria.',
    errorId: body?.error?.details?.error_id,
    requestId: body?.meta?.request_id
  }
}

function createAuditStore(id, endpoint) {
  return defineStore(id, () => {
    const items = ref([])
    const pagination = ref(emptyPagination())
    const loading = ref(false)
    const refreshing = ref(false)
    const error = ref(null)
    let requestSequence = 0

    async function fetchAudits(params, attempt = 0) {
      const sequence = ++requestSequence
      const hasPreviousData = items.value.length > 0
      loading.value = !hasPreviousData
      refreshing.value = hasPreviousData
      error.value = null

      try {
        const response = await api.get(endpoint, { params })
        if (sequence !== requestSequence) return
        items.value = Array.isArray(response.data?.data) ? response.data.data : []
        pagination.value = { ...emptyPagination(), ...response.data?.pagination }
      } catch (requestError) {
        const status = requestError.response?.status
        const shouldRetry = attempt < 2 && (!requestError.response || retryableStatuses.has(status))
        if (shouldRetry) {
          await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)))
          if (sequence !== requestSequence) return
          return fetchAudits(params, attempt + 1)
        }
        if (sequence === requestSequence) error.value = errorDetails(requestError)
      } finally {
        if (sequence === requestSequence) {
          loading.value = false
          refreshing.value = false
        }
      }
    }

    return { items, pagination, loading, refreshing, error, fetchAudits }
  })
}

// O cliente administrativo já usa uma baseURL terminada em `/admin`.
export const useSystemAuditStore = createAuditStore('system-audit', '/audit/system')
export const useFinancialAuditStore = createAuditStore('financial-audit', '/audit/financial')
