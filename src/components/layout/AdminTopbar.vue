<template>
  <header class="admin-topbar">
    <div class="topbar-left">
      <button class="hamburger-button" @click="layoutStore.openSidebar">
        <Menu :size="24" />
      </button>
    </div>

    <div class="topbar-right">
      <div class="user-profile" v-click-outside="closeDropdown">
        <button class="user-button" @click.prevent="toggleDropdown">
          <AvatarPlaceholder
            v-if="authStore.user?.name"
            :name="authStore.user.name"
            size="32px"
            fontSize="0.8rem"
          />
          <AvatarPlaceholder
            v-else
            name="Admin"
            size="32px"
            fontSize="0.8rem"
          />
          <span class="user-name-text">{{ authStore.user?.name || 'Admin' }}</span>
          <ChevronDown :size="16" class="chevron-icon" />
        </button>

        <transition name="dropdown-fade">
          <div v-if="isDropdownOpen" class="user-dropdown">
            <div class="dropdown-header">
              <span class="dropdown-username">{{
                authStore.user?.name
              }}</span>
              <span class="dropdown-role">{{ authStore.user?.role }}</span>
            </div>
            
            <ActionButton
              label="Sair"
              :icon="LogOut"
              variant="danger"
              @click="handleLogout"
            />
          </div>
        </transition>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth.js'
import { useLayoutStore } from '../../stores/layout.js'
import ActionButton from '../global/ActionButton.vue'
import AvatarPlaceholder from '../global/AvatarPlaceholder.vue' // 👈 Importar
import { ChevronDown, LogOut, Menu } from 'lucide-vue-next'
import vClickOutside from '../../directives/click-outside.js'

const authStore = useAuthStore()
const layoutStore = useLayoutStore()
const isDropdownOpen = ref(false)
const route = useRoute()

const pageTitle = computed(() => {
  return route.meta.title || 'Painel Admin'
})

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value
}

const closeDropdown = () => {
  isDropdownOpen.value = false
}

const handleLogout = () => {
  closeDropdown()
  authStore.logout()
}
</script>

<style scoped>
.admin-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 65px;
  padding: 0 1.5rem;
  background-color: #ffffff;
  z-index: 10;
  flex-shrink: 0;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.hamburger-button {
  display: none;
  padding: 0.5rem;
  border: none;
  background-color: transparent;
  color: #111827;
  cursor: pointer;
  transition: background-color 0.2s ease;
}
.hamburger-button:hover {
  background-color: #f4f4f5;
}

.topbar-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.topbar-right {
  display: flex;
  align-items: center;
}
.user-profile {
  position: relative;
}
.user-button {
  display: flex;
  align-items: center;
  gap: 0.5rem; /* Adicionado um gap para separar o avatar do nome */
  background-color: transparent;
  border: none;
  padding: 0.5rem;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}
.user-button:hover {
  background-color: #f4f4f5;
}
/* 👇 NOVO NOME DA CLASSE para evitar conflito com AvatarPlaceholder */
.user-name-text {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}
.chevron-icon {
  color: #6b7280;
}
.user-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 220px;
  background-color: #ffffff;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  padding: 0.5rem;
  z-index: 20;
}
.dropdown-header {
  padding: 0.625rem 0.875rem;
  border-bottom: 1px solid #f3f4f6;
  margin-bottom: 0.5rem;
}
.dropdown-username {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #111;
  line-height: 1.3;
}
.dropdown-role {
  display: block;
  font-size: 0.75rem;
  color: #6b7280;
}
.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}
.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}

@media (max-width: 1024px) {
  .admin-topbar {
    padding: 0 1rem;
  }
  .hamburger-button {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>