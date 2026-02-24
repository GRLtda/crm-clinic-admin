import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export const useAuthStore = defineStore('auth-admin', () => {
  // ---------------------------------
  // State 📦
  // ---------------------------------

  const token = ref(localStorage.getItem('admin_token') || null)
  const refreshToken = ref(localStorage.getItem('admin_refresh_token') || null)
  const user = ref(JSON.parse(localStorage.getItem('admin_user')) || null)
  const mustChangePassword = ref(JSON.parse(localStorage.getItem('must_change_password')) || false)

  const loading = ref(false)
  const error = ref(null)

  const router = useRouter()
  const toast = useToast()

  // ---------------------------------
  // Getters  COMPUTED 💻
  // ---------------------------------

  const isAuthenticated = computed(() => !!token.value)

  const authHeaders = computed(() => ({
    Authorization: `Bearer ${token.value}`
  }))

  // ---------------------------------
  // Actions ⚡
  // ---------------------------------

  async function login(username, password) {
    loading.value = true
    error.value = null

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        username: username,
        password: password
      })

      const data = response.data

      token.value = data.token
      refreshToken.value = data.refreshToken
      mustChangePassword.value = data.mustChangePassword

      user.value = {
        _id: data._id,
        name: data.name,
        email: data.email,
        role: data.role
      }

      localStorage.setItem('admin_token', data.token)
      localStorage.setItem('admin_refresh_token', data.refreshToken)
      localStorage.setItem('admin_user', JSON.stringify(user.value))
      localStorage.setItem('must_change_password', JSON.stringify(data.mustChangePassword))

      if (data.mustChangePassword) {
        router.push('/change-password')
        toast.warning('Você precisa alterar sua senha no primeiro acesso.')
      } else {
        router.push('/')
        toast.success('Login realizado com sucesso!')
      }

      return true

    } catch (err) {
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        error.value = err.response.data.message || 'Usuário ou senha inválidos.'
      } else {
        error.value = 'Ocorreu um erro. Tente novamente.'
      }

      toast.error(error.value)
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 🔄 Ação de Refresh Token
   */
  async function refreshTokenAction() {
    if (!refreshToken.value) return false

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
        refreshToken: refreshToken.value
      })

      const { token: newToken } = response.data
      token.value = newToken
      localStorage.setItem('admin_token', newToken)
      return true
    } catch (err) {
      console.error('Falha ao renovar token:', err)
      return false
    }
  }

  /**
   * 🏃 Ação de Logout
   */
  function logout() {
    token.value = null
    refreshToken.value = null
    user.value = null
    mustChangePassword.value = false
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_refresh_token')
    localStorage.removeItem('admin_user')
    localStorage.removeItem('must_change_password')
    router.push('/login')
    toast.info('Você saiu da sua conta.')
  }

  /**
   * 🔑 Atualiza o token sem deslogar
   */
  function updateToken(newToken) {
    token.value = newToken
    localStorage.setItem('admin_token', newToken)
  }

  return {
    token,
    refreshToken,
    user,
    mustChangePassword,
    loading,
    error,
    isAuthenticated,
    authHeaders,
    login,
    refreshTokenAction,
    logout,
    updateToken
  }
})
