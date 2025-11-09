import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth.js' // (Ajuste o caminho se necessário)
import LoginView from '../views/LoginView.vue'
import AdminLayout from '../layouts/AdminLayout.vue' // Importar o Layout

const routes = [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: {
      title: 'Login - Admin' // (OK para a página de login)
    }
  },
  {
    path: '/',
    component: AdminLayout, // Usar o Layout como componente PAI
    meta: {
      requiresAuth: true
    },
    children: [
      // Rota Dashboard (Raiz)
      {
        path: '',
        name: 'dashboard',
        component: () => import('../views/DashboardView.vue'),
        meta: {
          title: 'Dashboard' // 👈 MUDANÇA AQUI
        }
      },
      // Rota de Usuários
      {
        path: '/users',
        name: 'users-list',
        component: () => import('../views/UsersListView.vue'),
        meta: {
          title: 'Usuários' // 👈 MUDANÇA AQUI
        }
      },
      {
        path: '/clinics',
        name: 'clinics-list',
        component: () => import('../views/ClinicsListView.vue'),
        meta: {
          title: 'Clínicas'
        }
      },
      {
        path: '/clinics/:id',
        name: 'clinic-detail',
        component: () => import('../views/ClinicDetailView.vue'),
        meta: {
          title: 'Detalhes da Clínica'
        }
      },
      {
        path: '/whatsapp',
        name: 'whatsapp-connection',
        component: () => import('../views/WhatsappView.vue'),
        meta: {
          title: 'Conexão WhatsApp'
        }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

/**
 * 🛡️ Guarda de Navegação (Navigation Guard)
 */
router.beforeEach((to, from, next) => {
  // Define o título da aba do navegador
  // (Vamos manter o sufixo ' - Admin' aqui)
  document.title = to.meta.title ? `${to.meta.title} - CRM Admin` : 'CRM Admin'

  const authStore = useAuthStore()

  const requiresAuth = to.meta.requiresAuth
  const isAuthenticated = authStore.isAuthenticated

  if (requiresAuth && !isAuthenticated) {
    next({ name: 'login' })
  } else if (!requiresAuth && isAuthenticated && to.name === 'login') {
    next({ name: 'dashboard' })
  } else {
    next()
  }
})

export default router