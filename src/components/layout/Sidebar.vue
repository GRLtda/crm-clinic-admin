<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useLayoutStore } from '@/stores/layout' // Store de layout do Admin
import { RouterLink, useRoute } from 'vue-router'

import {
  LayoutDashboard,
  Users,
  UserPlus,
  Building,
  MessageSquare,
  ChevronDown,
  Briefcase,
  MoreHorizontal,
  CreditCard
} from 'lucide-vue-next'

const props = defineProps({
  isCollapsed: {
    type: Boolean,
    default: false
  }
})

// Emits para manter compatibilidade
const emit = defineEmits(['close', 'toggle-collapse'])

const authStore = useAuthStore()
const layoutStore = useLayoutStore() // Para controlar mobile toggle
const route = useRoute()

// Estado local para dropdowns
const isUserDropdownOpen = ref(false)
const isClinicDropdownOpen = ref(false)

// Estado para controlar quais menus estão expandidos
const expandedItems = ref([])

// Refs para o indicador flutuante
const sidebarNavRef = ref(null)
const indicatorStyle = ref({
  top: '0px',
  height: '0px',
  opacity: 0
})

const toggleExpand = (key) => {
  if (props.isCollapsed) return
  const index = expandedItems.value.indexOf(key)
  if (index === -1) {
    expandedItems.value.push(key)
  } else {
    expandedItems.value.splice(index, 1)
  }
}

const isExpanded = (key) => expandedItems.value.includes(key)

// Verifica se um item pai está ativo
const isParentActive = (children) => {
  return children.some(child => route.path.startsWith(child.to))
}

// Atualiza posição do indicador
const updateIndicator = () => {
  nextTick(() => {
    if (!sidebarNavRef.value) return
    
    // Procura por link ativo ou active-link (exato ou parcial)
    const activeLink = sidebarNavRef.value.querySelector('.active-link, .nav-link.active')
    
    if (activeLink) {
      const navRect = sidebarNavRef.value.getBoundingClientRect()
      const linkRect = activeLink.getBoundingClientRect()
      
      indicatorStyle.value = {
        top: `${linkRect.top - navRect.top}px`,
        height: `${linkRect.height}px`,
        opacity: 1
      }
    } else {
      indicatorStyle.value = { ...indicatorStyle.value, opacity: 0 }
    }
  })
}

// Watch na rota para fechar sidebar mobile E atualizar indicador
watch(() => route.path, () => {
  if (window.innerWidth <= 1024) {
    layoutStore.closeSidebar()
  }
  updateIndicator()
}, { immediate: true })

// Atualizar ao montar
onMounted(() => {
  setTimeout(updateIndicator, 100)
})

// Mapeamento das Rotas do Admin no novo layout
const sidebarSections = computed(() => {
  // Seção Principal
  const principalSection = {
    title: null,
    links: [
      { icon: LayoutDashboard, text: 'Dashboard', to: '/' },
    ]
  }

  // Seção Gestão
  const gestaoSection = {
    title: 'Gestão',
    links: [
      { icon: Users, text: 'Usuários', to: '/users' },
      { icon: UserPlus, text: 'Convites', to: '/invitations' },
      { icon: Building, text: 'Clínicas', to: '/clinics' },
      { icon: CreditCard, text: 'Assinaturas', to: '/subscriptions' },
      { icon: Briefcase, text: 'Planos', to: '/plans' }, // 👈 Novo Link
    ]
  }
  
  // Seção Comunicação / Outros
  const comunicacaoSection = {
    title: 'Comunicação',
    links: [
      { icon: MessageSquare, text: 'WhatsApp', to: '/whatsapp' },
    ]
  }

  return [principalSection, gestaoSection, comunicacaoSection]
})

</script>

<template>
  <aside 
    class="sidebar" 
    :class="{ 
      'is-collapsed': isCollapsed,
      'is-mobile-open': layoutStore.isSidebarOpen 
    }"
  >
    <div class="sidebar-header-wrapper">
      <div class="sidebar-header">
        <div class="logo-container">
           <!-- Logo Ícone + Texto (Colapsado esconde texto, Expandido mostra tudo) -->
           <img src="/icon.png" alt="Agenda Doutor" class="brand-logo-icon" />
           <span class="brand-text" v-show="!isCollapsed">Agenda Doutor</span>
        </div>
      </div>
    </div>

    <nav ref="sidebarNavRef" class="sidebar-nav">
      <!-- Indicador flutuante que desliza -->
      <div 
        class="sliding-indicator" 
        :style="{ 
          top: indicatorStyle.top, 
          height: indicatorStyle.height,
          opacity: indicatorStyle.opacity 
        }"
      ></div>

      <div v-for="(section, sectionIndex) in sidebarSections" :key="sectionIndex" class="nav-section">
        <!-- Título da seção -->
        <div v-if="section.title && !isCollapsed" class="section-title">
          {{ section.title }}
        </div>
        <div v-else-if="section.title && isCollapsed" class="section-divider"></div>
        
        <ul class="nav-links">
          <li v-for="link in section.links" :key="link.text" class="nav-item">
            <!-- Item com Submenu (Estrutura mantida do CRM, caso precisemos no futuro) -->
            <div v-if="link.children" class="nav-item-wrapper">
              <div
                class="nav-link parent-link"
                :class="{ 'active': isParentActive(link.children), 'expanded': isExpanded(link.key) }"
                @click="toggleExpand(link.key)"
                :title="isCollapsed ? link.text : ''"
              >
                <component :is="link.icon" :size="20" stroke-width="2" />
                <span v-show="!isCollapsed" class="nav-text">{{ link.text }}</span>
                <ChevronDown
                  v-show="!isCollapsed"
                  :size="16"
                  class="chevron-icon"
                  :class="{ 'rotate': isExpanded(link.key) }"
                />
              </div>

              <!-- Submenu -->
              <div
                class="submenu-wrapper"
                :class="{ 'is-open': isExpanded(link.key) && !isCollapsed }"
              >
                <ul class="submenu">
                  <li v-for="child in link.children" :key="child.text">
                    <RouterLink :to="child.to" class="submenu-link" active-class="active-child">
                      <component :is="child.icon" :size="18" stroke-width="2" class="submenu-icon" />
                      <span class="submenu-text">{{ child.text }}</span>
                    </RouterLink>
                  </li>
                </ul>
              </div>
            </div>

            <!-- Item Simples -->
            <RouterLink
              v-else
              :to="link.to"
              class="nav-link"
              :title="isCollapsed ? link.text : ''"
              :active-class="link.to === '/' ? '' : 'active-link'"
              :exact-active-class="link.to === '/' ? 'active-link' : ''"
            >
              <!-- Usando componente dinamico para manter padrao -->
              <component :is="link.icon" :size="20" stroke-width="2" />
              <span v-show="!isCollapsed" class="nav-text">{{ link.text }}</span>
            </RouterLink>
          </li>
        </ul>
      </div>
    </nav>
  </aside>
</template>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  width: 240px;
  padding: 1rem;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), padding 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s ease-in-out;
  overflow-x: hidden;
  border-top-right-radius: 1rem;
  height: 100vh;
  flex-shrink: 0;
}

.sidebar.is-collapsed {
  width: 72px;
  padding: 1rem 0.5rem;
}

/* Cabeçalho */
.sidebar-header-wrapper {
  position: relative;
  margin-bottom: 1.5rem;
}
.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: center; /* Centraliza logo */
  padding: 0.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
  height: 48px;
}
.sidebar:not(.is-collapsed) .sidebar-header {
  justify-content: flex-start;
}
.sidebar:not(.is-collapsed) .sidebar-header:hover {
  background-color: transparent; 
}
.sidebar.is-collapsed .sidebar-header {
  justify-content: center;
  padding: 0.5rem;
  cursor: default;
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  height: 100%;
}

.brand-text {
  font-family: var(--fonte-titulo);
  font-weight: 700;
  font-size: 1.125rem;
  color: var(--preto, #111827);
  white-space: nowrap;
  letter-spacing: -0.02em;
}

.brand-logo-icon {
  height: 32px;
  width: 32px;
  object-fit: contain;
}

/* Navegação */
.sidebar-nav {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow-y: auto;
  position: relative; /* Para o indicador flutuante */
}

/* Indicador flutuante que desliza */
.sliding-indicator {
  position: absolute;
  left: 0;
  width: 3px;
  background-color: var(--azul-principal, #3b82f6);
  border-radius: 0 2px 2px 0;
  transition: top 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              height 0.2s cubic-bezier(0.4, 0, 0.2, 1),
              opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 10;
  pointer-events: none;
  transform: scaleY(0.6);
  transform-origin: center;
}

/* Scrollbar */
.sidebar-nav::-webkit-scrollbar {
  width: 4px;
}
.sidebar-nav::-webkit-scrollbar-thumb {
  background-color: #e5e7eb;
  border-radius: 4px;
}

/* Seções */
.nav-section {
  margin-bottom: 0.25rem;
}
.nav-section:first-child {
  margin-top: 0;
}
.section-title {
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #9ca3af;
  padding: 0.5rem 0.75rem 0.375rem 0.75rem;
  margin-top: 0.25rem;
}
.section-divider {
  height: 1px;
  background-color: #e5e7eb;
  margin: 0.5rem 0.5rem;
}
.nav-links {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.nav-item {
  width: 100%;
}
.nav-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  text-decoration: none;
  color: #525866;
  font-weight: 500;
  font-size: 0.875rem;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  user-select: none;
  border: 1px solid transparent;
  transition: background-color 0.25s cubic-bezier(0.4, 0, 0.2, 1),
              color 0.2s ease,
              padding-left 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.nav-link svg {
  transition: color 0.2s ease, transform 0.2s ease;
}
.sidebar.is-collapsed .nav-link {
  justify-content: center;
  padding: 0.625rem;
}
.nav-text {
  transition: opacity 0.25s ease;
  white-space: nowrap;
  flex-grow: 1;
}
.sidebar.is-collapsed .nav-text {
  opacity: 0;
  width: 0;
  display: none;
}
/* Hover suave */
.nav-link:hover {
  background-color: #f0f2f5;
  color: var(--azul-principal, #3b82f6);
  padding-left: 0.875rem;
}
.nav-link:hover svg {
  color: var(--azul-principal, #3b82f6);
}
/* Ativo */
.active-link, .nav-link.active {
  background-color: #eef2ff;
  color: var(--azul-principal, #3b82f6);
  font-weight: 600;
  border: 1px solid transparent;
}
.active-link svg, .nav-link.active svg {
  color: var(--azul-principal, #3b82f6);
  transform: scale(1);
}

/* Chevron */
.chevron-icon {
  transition: transform 0.3s ease;
  color: #9ca3af;
}
.chevron-icon.rotate {
  transform: rotate(180deg);
}

/* Submenu */
.submenu-wrapper {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.3s ease-out;
}
.submenu-wrapper.is-open {
  grid-template-rows: 1fr;
}
.submenu {
  overflow: hidden;
  list-style: none;
  padding: 0;
  margin: 0 0 0 1.5rem;
  border-left: 1px solid #e5e7eb;
}
.submenu-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem 0.5rem 1rem;
  text-decoration: none;
  color: #6b7280;
  font-size: 0.8125rem;
  transition: all 0.2s ease;
  position: relative;
  margin-left: -1px;
  border-left: 2px solid transparent;
}
.submenu-link:hover {
  color: var(--preto, #111827);
}
.submenu-icon {
  color: #9ca3af;
  transition: color 0.2s ease;
}
.submenu-link:hover .submenu-icon,
.active-child .submenu-icon {
  color: var(--azul-principal, #3b82f6);
}
.active-child {
  color: var(--azul-principal, #3b82f6);
  font-weight: 500;
  background-color: #f9fafb;
  border-left-color: var(--azul-principal, #3b82f6);
}



/* ------------------------- */
/* RESPONSIVO (1024px)       */
/* ------------------------- */
@media (max-width: 1024px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    z-index: 50;
    transform: translateX(-100%);
    box-shadow: none;
    height: 100vh;
    border-radius: 0%;
    width: 260px !important; 
    padding: 1rem !important;
    background-color: white;
  }

  .sidebar.is-mobile-open {
    transform: translateX(0);
    box-shadow: 0 0 40px rgba(0, 0, 0, 0.1);
  }
  
  /* Forçar exibição de elementos no mobile quando aberto */
  .sidebar.is-mobile-open .nav-text,
  .sidebar.is-mobile-open .user-details,
  .sidebar.is-mobile-open .clinic-name,
  .sidebar.is-mobile-open .section-title {
    opacity: 1;
    width: auto;
    display: block;
  }
  
  .sidebar.is-mobile-open .nav-link {
    justify-content: flex-start;
    padding: 0.5rem 0.75rem;
  }
}
</style>