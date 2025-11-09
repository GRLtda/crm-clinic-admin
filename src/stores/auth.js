import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'

// 👇 MUDANÇA AQUI: Lendo a variável do .env
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export const useAuthStore = defineStore('auth-admin', () => {
  // ---------------------------------
  // State 📦
  // ---------------------------------
  
  // Tenta carregar o token e o usuário do localStorage ao iniciar
  const token = ref(localStorage.getItem('admin_token') || null)
  const user = ref(JSON.parse(localStorage.getItem('admin_user')) || null)
  
  const loading = ref(false)
  const error = ref(null)
  
  const router = useRouter()
  const toast = useToast() // Instanciar o toast

  // ---------------------------------
  // Getters  COMPUTED 💻
  // ---------------------------------
  
  // Verifica se o usuário está autenticado
  const isAuthenticated = computed(() => !!token.value)
  
  // Retorna os headers de autorização prontos para usar
  const authHeaders = computed(() => ({
    Authorization: `Bearer ${token.value}`
  }))

  // ---------------------------------
  // Actions ⚡
  // ---------------------------------

  /**
   * 🚀 Ação de Login
   * Tenta autenticar o admin com username e password.
   */
  async function login(username, password) {
    loading.value = true
    error.value = null

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        username: username,
        password: password
      })

      // ✅ Sucesso (Conforme a API que você mandou)
      const data = response.data

      // 1. Salva o token e usuário no State
      token.value = data.token
      user.value = {
        _id: data._id,
        name: data.name,
        role: data.role
      }

      // 2. Salva no localStorage para persistir
      localStorage.setItem('admin_token', data.token)
      localStorage.setItem('admin_user', JSON.stringify(user.value))

      // 3. Redireciona para o Dashboard (vamos criar essa rota)
      router.push('/') // Redireciona para a home do admin

      // 4. 🎉 Exibe o toast de SUCESSO
      toast.success('Login realizado com sucesso!')

      return true
      
    } catch (err) {
      // ❌ Erro
      if (err.response && err.response.status === 401) {
        error.value = 'Usuário ou senha inválidos.'
      } else {
        error.value = 'Ocorreu um erro. Tente novamente.'
      }
      console.error(err)

      // 5. 💥 Exibe o toast de ERRO
      toast.error(error.value)

      return false

    } finally {
      loading.value = false
    }
  }

  /**
   * 🏃 Ação de Logout
   */
  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    router.push('/login') // Força o redirecionamento para o login
    toast.info('Você saiu da sua conta.') // (Opcional) Toast no logout
  }

  // ---------------------------------
  // Exportar 📤
  // ---------------------------------
  return {
    token,
    user,
    loading,
    error,
    isAuthenticated,
    authHeaders,
    login,
    logout
  }
})