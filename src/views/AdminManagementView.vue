<script setup>
import { onMounted, ref } from 'vue'
import { Plus, Users, Shield, Trash2, Mail, Phone, Calendar, AlertCircle, Copy, Check, X, Loader2 } from 'lucide-vue-next'
import api from '../utils/api'
import { useAuthStore } from '../stores/auth'
import { useToast } from 'vue-toastification'

const authStore = useAuthStore()
const toast = useToast()

const admins = ref([])
const loading = ref(true)
const isCreateModalOpen = ref(false)
const showPasswordModal = ref(false)
const generatedAdmin = ref(null)

const newAdmin = ref({
  name: '',
  email: '',
  phone: '',
  role: 'admin'
})

const lastAutoEmail = ref('')

const handleNameInput = () => {
  if (!newAdmin.value.name) return
  
  // Clean name: removes multiple spaces, Trim
  const cleanName = newAdmin.value.name.replace(/\s+/g, ' ').trim().toLowerCase()
  const nameParts = cleanName.split(' ')
  
  if (nameParts.length >= 2) {
    const firstName = nameParts[0]
    const lastName = nameParts[nameParts.length - 1]
    
    // Simple sanitization (remove special chars from names if any)
    const sanitize = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "")
    const generatedEmail = `${sanitize(firstName)}.${sanitize(lastName)}@agendadoutor.com`
    
    // Logic: Fill if empty OR if we are typing and the previous value was auto-generated
    if (!newAdmin.value.email || newAdmin.value.email === lastAutoEmail.value) {
      newAdmin.value.email = generatedEmail
      lastAutoEmail.value = generatedEmail
    }
  }
}

const fetchTeam = async () => {
  loading.value = true
  try {
    const response = await api.get('/team')
    admins.value = response.data
  } catch (err) {
    toast.error('Erro ao carregar equipe.')
    console.error(err)
  } finally {
    loading.value = false
  }
}

const handleCreateAdmin = async () => {
  try {
    const response = await api.post('/team', newAdmin.value)
    generatedAdmin.value = response.data
    isCreateModalOpen.value = false
    showPasswordModal.value = true
    fetchTeam()
    toast.success('Administrador convidado com sucesso!')
    newAdmin.value = { name: '', email: '', phone: '', role: 'admin' }
  } catch (err) {
    toast.error(err.response?.data?.message || 'Erro ao criar administrador.')
  }
}

const handleDeleteAdmin = async (admin) => {
  if (admin._id === authStore.user?._id) {
    toast.error('Você não pode se remover da equipe.')
    return
  }

  if (!confirm(`Deseja realmente remover o acesso de ${admin.name}?`)) return

  try {
    await api.delete(`/team/${admin._id}`)
    fetchTeam()
    toast.success('Membro removido com sucesso.')
  } catch (err) {
    toast.error('Erro ao remover membro.')
  }
}

const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text)
  toast.info('Copiado para a área de transferência')
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('pt-BR')
}

onMounted(fetchTeam)
</script>

<template>
  <div class="admin-management-page">
    <header class="page-header">
      <div class="header-content">
        <h1>Gestão de Equipe</h1>
        <p>Gerencie os administradores e níveis de permissão da plataforma.</p>
      </div>
      <button 
        v-if="authStore.user?.role === 'super admin'"
        @click="isCreateModalOpen = true"
        class="btn-primary main-action"
      >
        <Plus :size="20" />
        <span>Novo Administrador</span>
      </button>
    </header>

    <div class="page-content-wrapper">
      <!-- Stats Grid -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon blue">
            <Users :size="24" />
          </div>
          <div class="stat-info">
            <span class="stat-label">Total de Membros</span>
            <span class="stat-value">{{ admins.length }}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon amber">
            <Shield :size="24" />
          </div>
          <div class="stat-info">
            <span class="stat-label">Super Admins</span>
            <span class="stat-value">{{ admins.filter(a => a.role === 'super admin').length }}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon green">
            <Mail :size="24" />
          </div>
          <div class="stat-info">
            <span class="stat-label">Convites Pendentes</span>
            <span class="stat-value">{{ admins.filter(a => a.firstLogin).length }}</span>
          </div>
        </div>
      </div>

      <!-- Data Table Section -->
      <div class="table-container shadow-premium">
        <table class="data-table">
          <thead>
            <tr>
              <th>Membro</th>
              <th>Papel</th>
              <th>Contato</th>
              <th>Status</th>
              <th class="text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading" v-for="i in 5" :key="i">
              <td colspan="5" class="placeholder-row">
                <div class="skeleton-bar"></div>
              </td>
            </tr>
            <tr v-else v-for="admin in admins" :key="admin._id" class="row-hover">
              <td>
                <div class="member-cell">
                  <div class="avatar-pseudo">{{ admin.name.charAt(0) }}</div>
                  <div class="member-info">
                    <span class="member-name">{{ admin.name }}</span>
                    <span class="member-id">ID: {{ admin._id.slice(-6) }}</span>
                  </div>
                </div>
              </td>
              <td>
                <span class="role-badge" :class="admin.role.replace(' ', '-')">
                  {{ admin.role }}
                </span>
              </td>
              <td>
                <div class="contact-details">
                  <div class="contact-item">
                    <Mail :size="14" /> {{ admin.email }}
                  </div>
                  <div class="contact-item">
                    <Phone :size="14" /> {{ admin.phone }}
                  </div>
                </div>
              </td>
              <td>
                <div class="status-box">
                  <div class="status-badge" :class="{ 'pending': admin.firstLogin, 'active': !admin.firstLogin }">
                    <span class="status-dot"></span>
                    <span class="status-text">{{ admin.firstLogin ? 'Pendente' : 'Ativo' }}</span>
                  </div>
                  <span v-if="admin.firstLogin" class="expiry-hint">Expira {{ formatDate(admin.inviteExpiresAt) }}</span>
                </div>
              </td>
              <td class="actions-cell">
                <button 
                  v-if="admin.role !== 'super admin' || (authStore.user?.role === 'super admin' && admin._id !== authStore.user?._id)"
                  @click="handleDeleteAdmin(admin)"
                  class="btn-delete"
                  title="Remover acesso"
                >
                  <Trash2 :size="18" />
                </button>
              </td>
            </tr>
            <tr v-if="!loading && admins.length === 0">
              <td colspan="5" class="empty-state">Nenhum administrador encontrado.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create Admin Drawer -->
    <div v-if="isCreateModalOpen" class="drawer-overlay" @click.self="isCreateModalOpen = false">
      <div class="drawer-panel">
        <div class="drawer-header">
          <div class="header-text">
            <h2>Novo Membro</h2>
            <p>Convidar um novo administrador para a plataforma.</p>
          </div>
          <button @click="isCreateModalOpen = false" class="btn-icon">
            <X :size="24" />
          </button>
        </div>
        
        <form @submit.prevent="handleCreateAdmin" class="drawer-form">
          <div class="form-group">
            <label>Nome Completo (Nome e Sobrenome)</label>
            <input 
              v-model="newAdmin.name" 
              @input="handleNameInput"
              type="text" 
              required 
              placeholder="Ex: Guilherme Silvestre"
            >
          </div>
          
          <div class="form-group">
            <label>E-mail Corporativo</label>
            <input v-model="newAdmin.email" type="email" required placeholder="joao@clinica.ai">
          </div>
          
          <div class="form-group">
            <label>Telefone / WhatsApp</label>
            <input v-model="newAdmin.phone" type="text" required placeholder="(00) 00000-0000">
          </div>

          <div class="form-group">
            <label>Nível de Acesso (Papel)</label>
            <div class="role-grid">
              <label 
                v-for="role in ['admin', 'suporte', 'super admin']" 
                :key="role"
                class="role-card"
                :class="{ 'active': newAdmin.role === role }"
              >
                <input type="radio" v-model="newAdmin.role" :value="role">
                <Shield :size="20" />
                <div class="role-meta">
                  <span class="role-title">{{ role }}</span>
                  <span class="role-desc">
                    {{ role === 'super admin' ? 'Acesso total' : role === 'admin' ? 'Gestão padrão' : 'Apenas suporte' }}
                  </span>
                </div>
              </label>
            </div>
          </div>

          <div class="drawer-footer">
            <div class="security-notice">
              <AlertCircle :size="16" />
              <span>Uma senha temporária será gerada para o primeiro acesso.</span>
            </div>
            <button type="submit" class="btn-primary full-width">
              <span>Enviar Convite</span>
              <Loader2 v-if="loading" class="animate-spin" :size="20" />
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Password Disclosure Modal -->
    <div v-if="showPasswordModal" class="modal-overlay dark">
      <div class="disclosure-card">
        <div class="success-icon">
          <Check :size="40" stroke-width="3" />
        </div>
        <h2>Administrador Criado!</h2>
        <p>Copie a senha temporária abaixo e envie para o novo membro.</p>

        <div class="password-box">
          <span class="label">Senha Temporária</span>
          <div class="pwd-content">
            <code>{{ generatedAdmin?.tempPassword }}</code>
            <button @click="copyToClipboard(generatedAdmin?.tempPassword)" class="btn-icon">
              <Copy :size="18" />
            </button>
          </div>
        </div>

        <button @click="showPasswordModal = false" class="btn-action">Entendido</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-management-page {
  padding: 0;
  width: 100%;
  min-height: calc(100vh - 64px);
  background: #f8fafc;
  display: flex;
  flex-direction: column;
}

.page-content-wrapper {
  padding: 2.5rem;
  flex: 1;
  width: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 2rem 3rem;
  border-bottom: 2px solid #f1f5f9;
}

.page-header h1 {
  font-family: 'Montserrat', sans-serif;
  font-size: 2.75rem;
  color: #0f172a;
  margin-bottom: 0.25rem;
  letter-spacing: -0.06em;
  line-height: 1;
}

.page-header p {
  font-size: 1rem;
  color: #64748b;
  font-weight: 500;
}

.btn-primary {
  background: var(--azul-principal);
  color: white;
  padding: 0.625rem 1.25rem;
  border-radius: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.2);
}

.btn-primary:hover {
  background: var(--azul-escuro);
  transform: translateY(-1px);
}

/* Stats */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem 1.75rem;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  border: 1px solid #f1f5f9;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 20px -5px rgba(0, 0, 0, 0.05);
  border-color: #e2e8f0;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon.blue { background: #eff6ff; color: #3b82f6; }
.stat-icon.amber { background: #fffbeb; color: #f59e0b; }
.stat-icon.green { background: #f0fdf4; color: #10b981; }

.stat-label {
  display: block;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
}

/* Table */
.table-container {
  background: white;
  border-radius: 1rem;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.data-table th {
  background: #f8fafc;
  padding: 1rem 1.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  color: #64748b;
  letter-spacing: 0.05em;
  border-bottom: 1px solid #e2e8f0;
}

.data-table td {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.member-info {
  display: flex;
  flex-direction: column;
}

.member-name {
  font-weight: 600;
  color: #1e293b;
  font-size: 0.9375rem;
}

.member-id {
  font-size: 0.75rem;
  color: #94a3b8;
}

.role-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 2rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
}

.role-badge {
  display: inline-flex;
  padding: 0.35rem 0.85rem;
  border-radius: 2rem;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.role-badge.super-admin { 
  background: #e0f2fe; 
  color: #0369a1; 
  border: 1px solid #bae6fd; 
}
.role-badge.admin { 
  background: #f1f5f9; 
  color: #475569; 
  border: 1px solid #e2e8f0; 
}
.role-badge.suporte { 
  background: #f5f3ff; 
  color: #6d28d9; 
  border: 1px solid #ddd6fe; 
}

.shadow-premium {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.01);
  border: 1px solid #f1f5f9;
}

.data-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.data-table th {
  padding: 1.25rem 1.5rem;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  border-bottom: 2px solid #f8fafc;
}

.data-table td {
  padding: 1.5rem;
  vertical-align: middle;
  border-bottom: 1px solid #f1f5f9;
}

.data-table tr.row-hover:hover {
  background: #fcfdfe;
}

.member-cell {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.avatar-pseudo {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  color: #475569;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1.125rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.8125rem;
  font-weight: 600;
}

.status-badge.active {
  background: #f0fdf4;
  color: #166534;
}

.status-badge.pending {
  background: #fffbeb;
  color: #92400e;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.active .status-dot { background: #22c55e; }
.pending .status-dot { background: #f59e0b; }

.status-box {
  display: flex;
  flex-direction: column;
}

.expiry-hint {
  font-size: 0.7rem;
  color: #94a3b8;
  margin-top: 0.375rem;
  font-weight: 500;
  padding-left: 0.75rem;
}

.contact-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.contact-item {
  font-size: 0.875rem;
  color: #475569;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.contact-item svg {
  color: #94a3b8;
}

.main-action {
  padding: 1rem 1.75rem;
  font-weight: 700;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
}

/* Drawer */
.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(8px);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
  animation: fadeIn 0.3s ease;
}

.drawer-panel {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  max-width: 480px;
  background: white;
  box-shadow: -10px 0 40px rgba(0,0,0,0.08);
  display: flex;
  flex-direction: column;
  animation: slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 101;
}

@keyframes slideInRight {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.drawer-header {
  padding: 2rem;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  background: #fafbfc;
}

.drawer-header h2 {
  font-size: 1.5rem;
  color: #0f172a;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.drawer-header p {
  font-size: 0.875rem;
  color: #64748b;
  margin-top: 0.25rem;
}

.drawer-form {
  padding: 2rem;
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.75rem;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.form-group input {
  padding: 0.875rem 1rem;
  border-radius: 0.75rem;
  border: 1.5px solid #e2e8f0;
  font-size: 1rem;
  transition: all 0.2s ease;
  background: #f8fafc;
}

.form-group input:focus {
  background: white;
  border-color: var(--azul-principal);
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
  outline: none;
}

.role-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.role-option {
  flex: 1;
  padding: 1rem;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 0.5125rem;
  background: #fcfcfc;
}

.role-option:hover {
  border-color: #cbd5e1;
  background: white;
}

.role-option.active {
  border-color: var(--azul-principal);
  background: #eff6ff;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
}

.role-title {
  font-weight: 700;
  font-size: 0.9375rem;
  text-transform: capitalize;
  color: #1e293b;
}

.role-desc {
  font-size: 0.75rem;
  color: #64748b;
}

.drawer-footer {
  padding: 2rem;
  border-top: 1px solid #f1f5f9;
  background: #f8fafc;
}

.security-notice {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #64748b;
  font-size: 0.75rem;
  margin-bottom: 1.25rem;
}

.full-width {
  width: 100%;
  justify-content: center;
  padding: 1rem;
  font-size: 1rem;
}

/* Disclosure */
.disclosure-card {
  background: white;
  width: 100%;
  max-width: 400px;
  padding: 3rem 2rem;
  border-radius: 2rem;
  text-align: center;
}

.success-icon {
  width: 80px;
  height: 80px;
  background: #f0fdf4;
  color: #10b981;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
}

.disclosure-card h2 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.disclosure-card p {
  color: #64748b;
  font-size: 0.875rem;
  margin-bottom: 2rem;
}

.password-box {
  background: #f8fafc;
  padding: 1.5rem;
  border-radius: 1.25rem;
  border: 2px dashed #e2e8f0;
  margin-bottom: 2rem;
}

.password-box .label {
  display: block;
  font-size: 0.625rem;
  font-weight: 800;
  text-transform: uppercase;
  color: #94a3b8;
  letter-spacing: 0.1em;
  margin-bottom: 0.75rem;
}

.pwd-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.pwd-content code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--azul-principal);
  letter-spacing: -0.05em;
}

.btn-action {
  width: 100%;
  background: #0f172a;
  color: white;
  padding: 1rem;
  border-radius: 1rem;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-action:hover {
  background: #1e293b;
  transform: translateY(-2px);
}

/* Animations */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes slideInRight {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Tooltips e utilitários */
.capitalize { text-transform: capitalize; }
.text-center { text-align: center; }

@media (max-width: 768px) {
  .drawer-panel { max-width: 100%; }
  .stats-grid { grid-template-columns: 1fr; }
  .admin-management-page { padding: 1rem; }
}

.placeholder-row {
  height: 60px;
}

.skeleton-bar {
  height: 20px;
  background: #f1f5f9;
  border-radius: 4px;
  width: 80%;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}
</style>
