<template>
    <div class="admin-layout">
      <Sidebar />
      
      <div
        class="sidebar-overlay"
        :class="{ 'is-open': layoutStore.isSidebarOpen }"
        @click="layoutStore.closeSidebar"
      ></div>
  
      <div class="main-content">
        <AdminTopbar />
        <main class="page-content">
          <div class="page-content-wrapper">
            <RouterView />
          </div>
        </main>
      </div>
    </div>
  </template>
  
  <script setup>
  import { RouterView } from 'vue-router'
  import AdminTopbar from '../components/layout/AdminTopbar.vue'
  import Sidebar from '../components/layout/Sidebar.vue'
  import { useLayoutStore } from '../stores/layout.js'
  
  const layoutStore = useLayoutStore()
  </script>
  
  <style scoped>
  .admin-layout {
    display: flex;
    position: relative;
    height: 100vh; /* Trava a altura total da página */
    max-height: 100vh;
    overflow: hidden; /* Esconde o scrollbar principal do navegador */
  }
  
  .main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    height: 100vh; /* Garante que esta coluna ocupe toda a altura */
  }
  
  .page-content {
    border: 1px solid #e5e7eb;
    border-radius: 1rem 0 0 0rem;
    padding: 1.5rem;
    
    /* MUDANÇAS AQUI 👇 */
    flex: 1; /* Faz o conteúdo ocupar o espaço restante (abaixo da Topbar) */
    overflow-y: auto; /* A MÁGICA: Adiciona o scroll SÓ AQUI */
  }
  
  .page-content-wrapper {
    max-width: 100%;
  }
  
  
  /* Overlay (Fundo escuro) */
  .sidebar-overlay {
    display: none;
  }
  
  /* ------------------------- */
  /* RESPONSIVO (1024px)       */
  /* ------------------------- */
  @media (max-width: 1024px) {
    .page-content {
      padding: 1rem;
      border-radius: 0;
    }
  
    .sidebar-overlay {
      position: fixed;
      inset: 0;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 40;
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
    }
  
    .sidebar-overlay.is-open {
      display: block;
      opacity: 1;
      pointer-events: auto;
    }
  }
  </style>