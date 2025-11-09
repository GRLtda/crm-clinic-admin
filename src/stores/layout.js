import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * Store para controlar o estado da UI (ex: Sidebar mobile)
 */
export const useLayoutStore = defineStore('layout', () => {
  // State
  const isSidebarOpen = ref(false)

  // Actions
  function openSidebar() {
    isSidebarOpen.value = true
  }

  function closeSidebar() {
    isSidebarOpen.value = false
  }

  function toggleSidebar() {
    isSidebarOpen.value = !isSidebarOpen.value
  }

  return { isSidebarOpen, openSidebar, closeSidebar, toggleSidebar }
})