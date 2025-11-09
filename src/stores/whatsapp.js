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
  const sending = ref(false) // Carregamento do form de envio
  
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
      // console.log('WA Polling Parado');
    }
  }

  /**
   * 🔄 Verifica o status (GET /qrcode) e age de acordo
   */
  async function checkConnection() {
    // console.log('Verificando status do WA...');
    try {
      const response = await axios.get(`${API_BASE_URL}/whatsapp/qrcode`, {
        headers: authStore.authHeaders
      })
      
      const data = response.data
      status.value = data.status

      if (data.status === 'connected') {
        qrCodeData.value = null
        stopPolling() // Se conectou, para de verificar
      } 
      else if (data.status === 'qrcode') {
        qrCodeData.value = data.qrCode
        // Se estamos mostrando um QR Code, iniciamos o polling
        // para saber quando ele foi lido (virar 'connected')
        startPollingStatus()
      }
      else if (data.status === 'creating_qr') {
        qrCodeData.value = null
        // Backend está gerando, tenta de novo em 5s
        setTimeout(() => checkConnection(), 5000)
      }
      else {
        // Status inesperado ou 'disconnected'
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
   * Usado APENAS quando um QR code está sendo exibido,
   * para detectar a conexão em tempo real.
   */
  async function pollStatusOnly() {
    // console.log('Poll /status...');
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
    if (pollingInterval.value) return // Já está rodando
    
    // console.log('WA Polling Iniciado');
    pollingInterval.value = setInterval(() => {
      pollStatusOnly()
    }, 5000) // Verifica a cada 5 segundos
  }

  /**
   * 📤 Envia uma mensagem de teste
   */
  async function sendMessage(to, message) {
    if (!to || !message) {
      toast.error('Número e mensagem são obrigatórios.')
      return false
    }
    
    sending.value = true
    try {
      await axios.post(`${API_BASE_URL}/whatsapp/send-message`, 
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
   * 🚪 Desconecta a sessão
   */
  async function logout() {
    stopPolling() // Para tudo
    loading.value = true
    try {
      await axios.post(`${API_BASE_URL}/whatsapp/logout`, {}, {
        headers: authStore.authHeaders
      })
      toast.info('WhatsApp desconectado.')
      status.value = 'disconnected'
      // Busca um novo QR Code
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
    
    checkConnection,
    stopPolling,
    sendMessage,
    logout
  }
})