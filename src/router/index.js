import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import LoginView from '../views/LoginView.vue'
import AdminLayout from '../layouts/AdminLayout.vue'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: {
      title: 'Login - Admin'
    }
  },
  {
    path: '/change-password',
    name: 'change-password',
    component: () => import('../views/ChangePasswordView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Alterar Senha'
    }
  },
  {
    path: '/',
    component: AdminLayout,
    meta: {
      requiresAuth: true
    },
    children: [
      {
        path: '',
        name: 'dashboard',
        component: () => import('../views/DashboardView.vue'),
        meta: {
          title: 'Dashboard'
        }
      },
      {
        path: '/invitations',
        name: 'invitations-list',
        component: () => import('../views/InvitationsView.vue'),
        meta: {
          title: 'Convites'
        }
      },
      {
        path: '/team',
        name: 'admin-team',
        component: () => import('../views/AdminManagementView.vue'),
        meta: {
          title: 'Equipe Admin'
        }
      },
      {
        path: '/users',
        name: 'users-list',
        component: () => import('../views/UsersListView.vue'),
        meta: {
          title: 'Usuários'
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
        path: '/subscriptions',
        name: 'subscriptions-list',
        component: () => import('../views/SubscriptionsView.vue'),
        meta: {
          title: 'Assinaturas'
        }
      },
      {
        path: '/campaigns',
        name: 'campaigns-list',
        component: () => import('../views/CampaignsView.vue'),
        meta: {
          title: 'Campanhas'
        }
      },
      {
        path: '/whatsapp',
        name: 'whatsapp-connection',
        component: () => import('../views/WhatsappView.vue'),
        meta: {
          title: 'Conexão WhatsApp'
        }
      },
      {
        path: '/plans',
        name: 'plans-manager',
        component: () => import('../views/PlansManagerView.vue'),
        meta: {
          title: 'Gerenciar Planos'
        }
      },
      {
        path: '/surveys',
        name: 'surveys-list',
        component: () => import('../views/SurveysView.vue'),
        meta: {
          title: 'Avaliações'
        }
      },
      {
        path: '/notifications',
        name: 'admin-notifications',
        component: () => import('../views/AdminNotificationsView.vue'),
        meta: {
          title: 'Disparar Notificações'
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
  const authStore = useAuthStore()

  const requiresAuth = to.meta.requiresAuth
  const isAuthenticated = authStore.isAuthenticated
  const mustChange = authStore.mustChangePassword

  // 1. Se não estiver autenticado e a rota requer auth -> Login
  if (requiresAuth && !isAuthenticated) {
    return next({ name: 'login' })
  }

  // 2. Se estiver autenticado e for para o Login -> Dashboard
  if (!requiresAuth && isAuthenticated && to.name === 'login') {
    return next({ name: 'dashboard' })
  }

  // 3. Se precisar alterar senha e não estiver na rota de alteração -> Change Password
  if (isAuthenticated && mustChange && to.name !== 'change-password') {
    return next({ name: 'change-password' })
  }

  // 4. Se já alterou senha e tentar entrar na rota de alteração -> Dashboard
  if (isAuthenticated && !mustChange && to.name === 'change-password') {
    return next({ name: 'dashboard' })
  }

  next()
})

export default router
