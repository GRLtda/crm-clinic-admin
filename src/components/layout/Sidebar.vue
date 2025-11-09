<template>
    <aside class="admin-sidebar" :class="{ 'is-open': layoutStore.isSidebarOpen }">
      <div class="sidebar-header">
        <a href="/" class="logo">
          <Briefcase :size="28" />
          <span class="logo-text">CRM Admin</span>
        </a>
        <button class="sidebar-close-button" @click="layoutStore.closeSidebar">
          <X :size="24" />
        </button>
      </div>
  
      <nav class="sidebar-nav">
        <ul class="nav-list">
          <li v-for="link in navLinks" :key="link.name" class="nav-item">
            <RouterLink :to="link.path" class="nav-link" @click="layoutStore.closeSidebar">
              <component :is="link.icon" :size="20" class="nav-icon" />
              <span class="nav-text">{{ link.name }}</span>
            </RouterLink>
          </li>
        </ul>
      </nav>
    </aside>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  import { RouterLink } from 'vue-router'
  import { useLayoutStore } from '../../stores/layout.js'
  import { LayoutDashboard, Users, Briefcase, X, Building, MessageSquare } from 'lucide-vue-next'
  
  const layoutStore = useLayoutStore()
  
  const navLinks = ref([
    {
      name: 'Dashboard',
      path: '/',
      icon: LayoutDashboard
    },
    {
      name: 'Usuários',
      path: '/users',
      icon: Users
    },
    {
      name: 'Clínicas',
      path: '/clinics',
      icon: Building
    },
    {
    name: 'WhatsApp',
    path: '/whatsapp',
    icon: MessageSquare
  }
  ])
  </script>
  
  <style scoped>
  .admin-sidebar {
    width: 260px;
    background-color: #ffffff;
    border-right: 1px solid #e5e7eb;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    height: 100vh;
    transition: transform 0.3s ease-in-out;
    
    /* ❌ 'position: sticky' e 'top: 0' removidos daqui */
  }
  
  /* Header (Logo) */
  .sidebar-header {
    height: 65px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 1.5rem;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .logo {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    text-decoration: none;
    color: var(--color-primary, #0284c7);
  }
  
  .logo-text {
    font-size: 1.25rem;
    font-weight: 700;
    color: #111827;
  }
  
  /* Botão de Fechar (Mobile) */
  .sidebar-close-button {
    display: none;
    padding: 0.5rem;
    border-radius: 0.375rem;
    border: none;
    background-color: transparent;
    color: #374151;
    cursor: pointer;
  }
  .sidebar-close-button:hover {
    background-color: #f4f4f5;
  }
  
  
  /* Navegação */
  .sidebar-nav {
    padding: 1.5rem 1rem;
  }
  .nav-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .nav-link {
    display: flex;
    align-items: center;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    text-decoration: none;
    font-size: 0.9375rem;
    font-weight: 500;
    color: #4b5563;
    transition:
      background-color 0.2s ease,
      color 0.2s ease;
    margin-bottom: 0.25rem;
  }
  .nav-icon {
    margin-right: 0.875rem;
  }
  .nav-link:hover {
    background-color: #f9fafb;
    color: #111827;
  }
  .nav-link.router-link-exact-active {
    background-color: var(--color-primary-light, #e0f2fe);
    color: var(--color-primary-dark, #0369a1);
  }
  
  /* ------------------------- */
  /* RESPONSIVO (1024px)       */
  /* ------------------------- */
  @media (max-width: 1024px) {
    .admin-sidebar {
      position: fixed; /* Isso está correto para o mobile */
      left: 0;
      top: 0;
      z-index: 50;
      transform: translateX(-100%);
    }
  
    .admin-sidebar.is-open {
      transform: translateX(0);
      box-shadow: 0 0 40px rgba(0, 0, 0, 0.1);
    }
  
    .sidebar-close-button {
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
  </style>