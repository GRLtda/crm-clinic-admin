import axios from 'axios'
import { useAuthStore } from '../stores/auth'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL
})

// Interceptador de Requisição: Adiciona o token se existir
api.interceptors.request.use((config) => {
    const authStore = useAuthStore()
    if (authStore.token) {
        config.headers.Authorization = `Bearer ${authStore.token}`
    }
    return config
}, (error) => {
    return Promise.reject(error)
})

// Interceptador de Resposta: Trata expiração do token (401) e bloqueios (403)
api.interceptors.response.use((response) => {
    return response
}, async (error) => {
    const originalRequest = error.config
    const authStore = useAuthStore()

    // Se o erro for 401 e não for uma tentativa de refresh token
    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/refresh-token') {
        originalRequest._retry = true

        const success = await authStore.refreshTokenAction()

        if (success) {
            // Atualiza o header da requisição original e tenta novamente
            originalRequest.headers.Authorization = `Bearer ${authStore.token}`
            return api(originalRequest)
        } else {
            // Se falhar o refresh, desloga
            authStore.logout()
        }
    }

    // Se o erro for 403 e tiver a flag de trocar senha (imposto pelo backend)
    if (error.response?.status === 403 && error.response?.data?.mustChangePassword) {
        authStore.mustChangePassword = true
        localStorage.setItem('must_change_password', 'true')
        window.location.href = '/change-password'
    }

    return Promise.reject(error)
})

export default api
