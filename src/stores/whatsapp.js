import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import { useAuthStore } from './auth.js'
import { useToast } from 'vue-toastification'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export const useWhatsappStore = defineStore('whatsapp-admin', () => {
  // ---------------------------------
  // State 📦
  // ---------------------------------
  const loading = ref(true) // Carregamento inicial da página
  const status = ref('disconnected') // 'connected', 'qrcode', 'creating_qr', 'disconnected'
  const qrCodeData = ref(null) // O 'data:image/png;base64,...'
  const sending = ref(false) // Carregamento do form de envio unitário
  const broadcasting = ref(false) // Carregamento do broadcast em massa
  const broadcastResult = ref(null) // { total, success, failed, errors[] }

  const pollingInterval = ref(null) // ID do nosso setInterval

  const authStore = useAuthStore()
  const toast = useToast()

  // ---------------------------------
  // Actions ⚡
  // ---------------------------------

  /**
   * 🛑 Para o polling (verificação automática)
   */
  function stopPolling() {
    if (pollingInterval.value) {
      clearInterval(pollingInterval.value)
      pollingInterval.value = null
    }
  }

  /**
   * 🔄 Verifica o status (GET /qrcode) e age de acordo
   */
  async function checkConnection() {
    try {
      const response = await axios.get(`${API_BASE_URL}/whatsapp/qrcode`, {
        headers: authStore.authHeaders
      })

      const data = response.data
      const normalizedStatus = data.status?.toLowerCase() || 'disconnected'
      status.value = normalizedStatus

      if (normalizedStatus === 'connected') {
        qrCodeData.value = null
        stopPolling()
      }
      else if (normalizedStatus === 'qrcode') {
        qrCodeData.value = data.qrCode
        startPollingStatus()
      }
      else if (normalizedStatus === 'creating_qr') {
        qrCodeData.value = null
        setTimeout(() => checkConnection(), 5000)
      }
      else {
        qrCodeData.value = null
        stopPolling()
      }

    } catch (err) {
      console.error('Erro ao buscar QR Code:', err)
      toast.error('Não foi possível verificar o status do WhatsApp.')
      status.value = 'disconnected'
    } finally {
      loading.value = false
    }
  }

  /**
   * polling (GET /status)
   * Usado APENAS quando um QR code está sendo exibido.
   */
  async function pollStatusOnly() {
    try {
      const response = await axios.get(`${API_BASE_URL}/whatsapp/status`, {
        headers: authStore.authHeaders
      })
      if (response.data.status === 'connected') {
        toast.success('WhatsApp Conectado!')
        status.value = 'connected'
        qrCodeData.value = null
        stopPolling()
      }
    } catch (err) {
      // Ignora erros de polling, o checkConnection vai pegar
    }
  }

  /**
   * 🏁 Inicia o polling de status (a cada 5s)
   */
  function startPollingStatus() {
    if (pollingInterval.value) return

    pollingInterval.value = setInterval(() => {
      pollStatusOnly()
    }, 5000)
  }

  /**
   * 📤 Envia uma mensagem de teste para um número específico
   */
  async function sendMessage(to, message) {
    if (!to || !message) {
      toast.error('Número e mensagem são obrigatórios.')
      return false
    }

    sending.value = true
    try {
      await axios.post(`${API_BASE_URL}/whatsapp/send`,
        { to, message },
        { headers: authStore.authHeaders }
      )
      toast.success(`Mensagem enviada para ${to}!`)
      return true

    } catch (err) {
      console.error('Erro ao enviar mensagem:', err)
      const errorMsg = err.response?.data?.message || 'Erro ao enviar mensagem.'
      toast.error(errorMsg)
      return false
    } finally {
      sending.value = false
    }
  }

  /**
   * 📢 Envia mensagem em massa para todos os donos de clínicas ativas/past_due
   */
  async function broadcastMessage(message) {
    if (!message || !message.trim()) {
      toast.error('Digite uma mensagem antes de disparar.')
      return false
    }

    broadcasting.value = true
    broadcastResult.value = null

    try {
      const response = await axios.post(
        `${API_BASE_URL}/whatsapp/broadcast`,
        { message },
        { headers: authStore.authHeaders }
      )
      broadcastResult.value = response.data
      toast.success(`Broadcast concluído! ✅ ${response.data.success} enviados / ❌ ${response.data.failed} falharam.`)
      return true

    } catch (err) {
      console.error('[Broadcast] Erro ao disparar mensagens em massa:', err)
      const errorMsg = err.response?.data?.message || 'Erro ao realizar o broadcast.'
      toast.error(errorMsg)
      return false
    } finally {
      broadcasting.value = false
    }
  }

  /**
   * 🚪 Desconecta a sessão
   */
  async function logout() {
    stopPolling()
    loading.value = true
    try {
      await axios.post(`${API_BASE_URL}/whatsapp/logout`, {}, {
        headers: authStore.authHeaders
      })
      toast.info('WhatsApp desconectado.')
      status.value = 'disconnected'
      await checkConnection()

    } catch (err) {
      console.error('Erro ao desconectar:', err)
      toast.error('Não foi possível desconectar.')
    } finally {
      loading.value = false
    }
  }

  // ---------------------------------
  // Exportar 📤
  // ---------------------------------
  return {
    loading,
    status,
    qrCodeData,
    sending,
    broadcasting,
    broadcastResult,

    checkConnection,
    stopPolling,
    sendMessage,
    broadcastMessage,
    logout
  }
})