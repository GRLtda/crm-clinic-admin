<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { ShieldCheck, Plus, Trash2, Copy, Check, UserX, Filter } from 'lucide-vue-next'
import { useToast } from 'vue-toastification'
import api from '../utils/api'
import { useAuthStore } from '../stores/auth'
import AppPageHeader from '../components/global/AppPageHeader.vue'
import AppDataTable from '../components/global/AppDataTable.vue'
import AppModal from '../components/global/AppModal.vue'
import AppButton from '../components/global/AppButton.vue'
import AppSelect from '../components/global/AppSelect.vue'
import StyledSelect from '../components/global/StyledSelect.vue'
import FormInput from '../components/global/FormInput.vue'
import SearchInput from '../components/global/SearchInput.vue'
import StatusBadge from '../components/global/StatusBadge.vue'
import SkeletonLoader from '../components/global/SkeletonLoader.vue'
import AvatarPlaceholder from '../components/global/AvatarPlaceholder.vue'

const authStore = useAuthStore()
const toast = useToast()
const copied = ref(false)
async function copyPassword(text) {
  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
    toast.info('Senha copiada para a área de transferência.')
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    toast.error('Não foi possível copiar a senha.')
  }
}

const isSuperAdmin = computed(() => authStore.user?.role === 'super admin')

// ----- Listagem (GET /team) -----
const admins = ref([])
const loading = ref(true)
const search = ref('')
const roleFilter = ref('')

const columns = [
  { key: 'member', label: 'Membro' },
  { key: 'role', label: 'Papel', width: '140px' },
  { key: 'contact', label: 'Contato' },
  { key: 'status', label: 'Status', width: '170px' },
  { key: 'actions', label: 'Ações', width: '80px', align: 'right' },
]

const roleOptions = [
  { value: 'admin', label: 'Admin' },
  { value: 'suporte', label: 'Suporte' },
  { value: 'super admin', label: 'Super admin' },
]
const roleDescriptions = {
  'super admin': 'Acesso total à plataforma.',
  admin: 'Gestão padrão das clínicas e usuários.',
  suporte: 'Apenas consulta e suporte.',
}

const filteredAdmins = computed(() => {
  const term = search.value.trim().toLowerCase()
  return admins.value.filter((admin) => {
    if (roleFilter.value && admin.role !== roleFilter.value) return false
    if (!term) return true
    return [admin.name, admin.email, admin.phone].some((v) => String(v || '').toLowerCase().includes(term))
  })
})

const stats = computed(() => ({
  total: admins.value.length,
  superAdmins: admins.value.filter((a) => a.role === 'super admin').length,
  pending: admins.value.filter((a) => a.firstLogin).length,
}))

const formatDate = (date) => (date ? new Date(date).toLocaleDateString('pt-BR') : '')

async function fetchTeam() {
  loading.value = true
  try {
    const { data } = await api.get('/team')
    admins.value = data
  } catch (err) {
    console.error(err)
    toast.error('Erro ao carregar equipe.')
  } finally {
    loading.value = false
  }
}

// ----- Remoção (DELETE /team/:id) -----
const adminToRemove = ref(null)
const removing = ref(false)

function canRemove(admin) {
  if (admin._id === authStore.user?._id) return false
  return admin.role !== 'super admin' || isSuperAdmin.value
}

function askRemove(admin) {
  if (admin._id === authStore.user?._id) {
    toast.error('Você não pode se remover da equipe.')
    return
  }
  adminToRemove.value = admin
}

async function confirmRemove() {
  if (!adminToRemove.value) return
  removing.value = true
  try {
    await api.delete(`/team/${adminToRemove.value._id}`)
    toast.success('Membro removido com sucesso.')
    adminToRemove.value = null
    fetchTeam()
  } catch (err) {
    toast.error(err.response?.data?.message || 'Erro ao remover membro.')
  } finally {
    removing.value = false
  }
}

// ----- Criação (POST /team) -----
const createOpen = ref(false)
const saving = ref(false)
const form = ref({ name: '', email: '', phone: '', role: 'admin' })
const errors = ref({ name: '', email: '', phone: '' })
const lastAutoEmail = ref('')
const createdAdmin = ref(null)

function resetForm() {
  form.value = { name: '', email: '', phone: '', role: 'admin' }
  errors.value = { name: '', email: '', phone: '' }
  lastAutoEmail.value = ''
}

function openCreate() {
  resetForm()
  createOpen.value = true
}

const sanitize = (str) => str.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '')

// Sugere o e-mail corporativo enquanto o nome é digitado (mantém a regra anterior).
watch(() => form.value.name, (name) => {
  errors.value.name = ''
  const parts = name.replace(/\s+/g, ' ').trim().toLowerCase().split(' ')
  if (parts.length < 2) return
  const suggested = `${sanitize(parts[0])}.${sanitize(parts[parts.length - 1])}@agendadoutor.com`
  if (!form.value.email || form.value.email === lastAutoEmail.value) {
    form.value.email = suggested
    lastAutoEmail.value = suggested
  }
})
watch(() => form.value.email, () => { errors.value.email = '' })
watch(() => form.value.phone, () => { errors.value.phone = '' })

function validate() {
  const next = { name: '', email: '', phone: '' }
  if (!form.value.name.trim()) next.name = 'Informe o nome completo.'
  else if (form.value.name.trim().split(/\s+/).length < 2) next.name = 'Informe nome e sobrenome.'
  if (!form.value.email.trim()) next.email = 'Informe o e-mail.'
  else if (!/^\S+@\S+\.\S+$/.test(form.value.email)) next.email = 'E-mail em formato inválido.'
  if (!form.value.phone.trim()) next.phone = 'Informe o telefone.'
  errors.value = next
  return !Object.values(next).some(Boolean)
}

async function submitCreate() {
  if (!validate()) return
  saving.value = true
  try {
    const { data } = await api.post('/team', form.value)
    createdAdmin.value = data
    createOpen.value = false
    toast.success('Administrador convidado com sucesso!')
    fetchTeam()
  } catch (err) {
    const message = err.response?.data?.message || 'Erro ao criar administrador.'
    // Erros ligados a um campo aparecem no próprio input; o restante vira toast.
    if (/e-?mail/i.test(message)) errors.value.email = message
    else if (/telefone|phone/i.test(message)) errors.value.phone = message
    else toast.error(message)
  } finally {
    saving.value = false
  }
}

onMounted(fetchTeam)
</script>

<template>
  <div class="team-view">
    <AppPageHeader
      title="Gestão de Equipe"
      subtitle="Gerencie os administradores e níveis de permissão da plataforma."
      :icon="ShieldCheck"
    >
      <template #actions>
        <AppButton v-if="isSuperAdmin" variant="primary" @click="openCreate">
          <Plus :size="18" /> Novo Administrador
        </AppButton>
      </template>
    </AppPageHeader>

    <div class="team-stats">
      <div class="stat"><span>Total de membros</span><strong>{{ stats.total }}</strong></div>
      <div class="stat"><span>Super admins</span><strong>{{ stats.superAdmins }}</strong></div>
      <div class="stat"><span>Convites pendentes</span><strong>{{ stats.pending }}</strong></div>
    </div>

    <AppDataTable
      height="calc(100vh - 28rem)"
      :columns="columns"
      :rows="filteredAdmins"
      :loading="loading"
      :skeleton-rows="5"
      :empty-icon="UserX"
      :empty-title="search || roleFilter ? 'Nenhum membro encontrado' : 'Nenhum administrador encontrado'"
      :empty-text="search || roleFilter ? 'Ajuste a busca ou o filtro de papel.' : 'Convide um novo membro para começar.'"
    >
      <template #filters>
        <SearchInput v-model="search" placeholder="Buscar por nome, e-mail ou telefone..." />
        <AppSelect
          v-model="roleFilter"
          :icon="Filter"
          default-option="Todos os papéis"
          :options="roleOptions"
        />
      </template>

      <template #cell-member="{ row: admin }">
        <div class="member-cell">
          <AvatarPlaceholder :name="admin.name" size="40px" font-size="0.875rem" />
          <div class="member-info">
            <span class="member-name">{{ admin.name }}</span>
            <span class="member-id">ID: {{ admin._id.slice(-6) }}</span>
          </div>
        </div>
      </template>
      <template #skeleton-member>
        <div class="member-cell">
          <SkeletonLoader width="40px" height="40px" radius="50%" />
          <div class="member-info">
            <SkeletonLoader width="140px" height="16px" /><SkeletonLoader width="80px" height="12px" />
          </div>
        </div>
      </template>

      <template #cell-role="{ row: admin }">
        <span class="role-chip" :class="`role-${admin.role.replace(' ', '-')}`">{{ admin.role }}</span>
      </template>

      <template #cell-contact="{ row: admin }">
        <div class="contact-cell">
          <span class="contact-main">{{ admin.email }}</span>
          <span class="contact-sub">{{ admin.phone }}</span>
        </div>
      </template>

      <template #cell-status="{ row: admin }">
        <div class="status-cell">
          <StatusBadge
            :variant="admin.firstLogin ? 'neutral' : 'success'"
            :label="admin.firstLogin ? 'Pendente' : 'Ativo'"
          />
          <span v-if="admin.firstLogin && admin.inviteExpiresAt" class="contact-sub">
            Expira {{ formatDate(admin.inviteExpiresAt) }}
          </span>
        </div>
      </template>

      <template #cell-actions="{ row: admin }">
        <AppButton
          v-if="canRemove(admin)"
          variant="dangerous"
          size="sm"
          title="Remover acesso"
          aria-label="Remover acesso"
          @click="askRemove(admin)"
        >
          <Trash2 :size="16" />
        </AppButton>
      </template>
    </AppDataTable>

    <!-- Novo administrador -->
    <AppModal :show="createOpen" width="450px" @close="createOpen = false">
      <template #title>Novo Administrador</template>
      <form id="team-create-form" class="team-form" novalidate @submit.prevent="submitCreate">
        <p class="form-hint">Convide um novo administrador. Uma senha temporária será gerada para o primeiro acesso.</p>
        <FormInput v-model="form.name" label="Nome completo" placeholder="Ex: Maria Souza" required :error="errors.name" />
        <FormInput v-model="form.email" type="email" label="E-mail corporativo" placeholder="nome@agendadoutor.com" required :error="errors.email" />
        <FormInput v-model="form.phone" phone-mask label="Telefone / WhatsApp" placeholder="(00) 00000-0000" required :error="errors.phone" />
        <StyledSelect v-model="form.role" label="Nível de acesso" :options="roleOptions" />
        <p class="form-hint">{{ roleDescriptions[form.role] }}</p>
      </form>
      <template #footer>
        <AppButton @click="createOpen = false">Cancelar</AppButton>
        <AppButton variant="primary" type="submit" form="team-create-form" :loading="saving">Enviar convite</AppButton>
      </template>
    </AppModal>

    <!-- Senha temporária -->
    <AppModal :show="!!createdAdmin" width="450px" @close="createdAdmin = null">
      <template #title>Administrador criado</template>
      <div v-if="createdAdmin" class="password-box">
        <p class="form-hint">Copie a senha temporária e envie para <strong>{{ createdAdmin.name || 'o novo membro' }}</strong>. Ela não será exibida novamente.</p>
        <div class="password-row">
          <code>{{ createdAdmin.tempPassword }}</code>
          <AppButton size="sm" title="Copiar senha" @click="copyPassword(createdAdmin.tempPassword)">
            <Check v-if="copied" :size="16" /><Copy v-else :size="16" />
          </AppButton>
        </div>
      </div>
      <template #footer>
        <AppButton variant="primary" @click="createdAdmin = null">Entendido</AppButton>
      </template>
    </AppModal>

    <!-- Confirmar remoção -->
    <AppModal :show="!!adminToRemove" width="420px" @close="adminToRemove = null">
      <template #title>Remover acesso</template>
      <p v-if="adminToRemove" class="form-hint">
        Deseja realmente remover o acesso de <strong>{{ adminToRemove.name }}</strong>? Essa pessoa deixará de entrar no painel.
      </p>
      <template #footer>
        <AppButton @click="adminToRemove = null">Cancelar</AppButton>
        <AppButton variant="dangerous" :loading="removing" @click="confirmRemove">Remover</AppButton>
      </template>
    </AppModal>
  </div>
</template>

<style scoped>
.team-view { width: 100%; }

.team-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  margin-bottom: 1.25rem;
}
.stat {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 1rem 1.25rem;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
}
.stat span { color: #64748b; font-size: 0.8rem; }
.stat strong { color: #111827; font-size: 1.5rem; }

.member-cell { display: flex; align-items: center; gap: 0.75rem; }
.member-info, .contact-cell, .status-cell { display: flex; flex-direction: column; gap: 0.2rem; min-width: 0; }
.status-cell { align-items: flex-start; }
.member-name, .contact-main { color: #111827; font-weight: 500; }
.member-id, .contact-sub { color: #6b7280; font-size: 0.8rem; }
.contact-main { overflow: hidden; text-overflow: ellipsis; }

.role-chip {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 99px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: capitalize;
  background: #f1f5f9;
  color: #475569;
}
.role-chip.role-super-admin { background: #fef3c7; color: #a16207; }
.role-chip.role-admin { background: #e0f2fe; color: #0369a1; }
.role-chip.role-suporte { background: #f0fdf4; color: #16a34a; }

.team-form { display: flex; flex-direction: column; }
.form-hint { margin: 0 0 1rem; color: #6b7280; font-size: 0.875rem; line-height: 1.5; }
.password-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
}
.password-row code { font-size: 1.05rem; font-weight: 600; color: #111827; word-break: break-all; }

@media (max-width: 768px) {
  .team-stats { grid-template-columns: 1fr; }
  .member-cell { justify-content: flex-end; text-align: left; }
  .contact-cell, .status-cell { align-items: flex-end; text-align: right; }
}
</style>
