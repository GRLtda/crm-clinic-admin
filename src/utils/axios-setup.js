import axios from 'axios'
import { useAuthStore } from '../stores/auth'

export function setupAxiosInterceptors(router) {
    axios.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error.response && error.response.status === 401) {
                const authStore = useAuthStore()

                if (authStore.token) {
                    authStore.logout()
                }
            }
            return Promise.reject(error)
        }
    )
}
