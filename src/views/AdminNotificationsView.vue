<script setup>
import { ref, onMounted } from 'vue'
import { Send, CheckCircle, AlertCircle, LoaderCircle, Users, Stethoscope, Building2, Globe } from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth' // using for fetching custom API data if necessary

// Componentes GLobais do CRM-Admin
import AppButton from '../components/global/AppButton.vue'
import api from '../utils/api' // importando API global para buscar clínicas, etc

const authStore = useAuthStore()

// State
const form = ref({
    targetGroup: '',
    clinicId: '',
    title: '',
    body: '',
    type: 'info',
    url: '',
    icon: '',
    sendPush: true
})

const clinics = ref([])
const isSubmitting = ref(false)
const isLoadingClinics = ref(false)
const notificationFeedback = ref(null)

const targetOptions = [
    { value: 'all_users', label: 'Absolutamente Todos (Global)', desc: 'Alcança médicos, donos e secretárias em toda a base.', icon: Globe },
    { value: 'all_owners', label: 'Apenas Titulares', desc: 'Donos e administradores das clínicas.', icon: Users },
    { value: 'all_doctors', label: 'Apenas Médicos', desc: 'Profissionais de saúde cadastrados no sistema.', icon: Stethoscope },
    { value: 'specific_clinic', label: 'Clínica Específica', desc: 'Dispara apenas para os membros da clínica selecionada.', icon: Building2 }
]

const loadClinics = async () => {
    isLoadingClinics.value = true
    try {
        const response = await api.get('/clinics?limit=1000')
        clinics.value = response.data.data
    } catch (error) {
        console.error('Failed to load clinics', error)
    } finally {
        isLoadingClinics.value = false
    }
}

onMounted(() => {
    loadClinics()
})

const submitNotification = async () => {
    if (!form.value.targetGroup || !form.value.title || !form.value.body) {
        notificationFeedback.value = { type: 'error', message: 'Preencha grupo, título e descrição.' }
        return
    }

    if (form.value.targetGroup === 'specific_clinic' && !form.value.clinicId) {
        notificationFeedback.value = { type: 'error', message: 'Selecione uma clínica.' }
        return
    }

    isSubmitting.value = true
    notificationFeedback.value = null

    try {
        const response = await api.post('/notifications/send', form.value)
        notificationFeedback.value = { type: 'success', message: response.data?.message || 'Notificações enviadas com sucesso.' }
        
        // Clear form
        form.value.title = ''
        form.value.body = ''
        form.value.url = ''
        form.value.icon = ''
        
    } catch (e) {
        const msg = e.response?.data?.error?.message || e.response?.data?.message || 'Erro ao enviar notificação.'
        notificationFeedback.value = { type: 'error', message: msg }
    } finally {
        isSubmitting.value = false
        // Limpar feedback sucesso depois de uns segundos
        if (notificationFeedback.value?.type === 'success') {
             setTimeout(() => { notificationFeedback.value = null }, 5000)
        }
    }
}

</script>

<template>
  <div class="notifications-view page-container">
    <div class="page-header">
      <h2 class="page-title">Disparar Notificações Push</h2>
      <p class="page-description">
        Envie alertas em tempo real para os usuários da aplicação AgendaDoutor. 
        As notificações aparecerão na tela se aceitaram a permissão ou no sino de notificações do painel.
      </p>
    </div>

    <!-- Alert de Feedback -->
    <div v-if="notificationFeedback" class="feedback-alert" :class="notificationFeedback.type">
        <CheckCircle v-if="notificationFeedback.type === 'success'" :size="20" />
        <AlertCircle v-else :size="20" />
        {{ notificationFeedback.message }}
    </div>

    <div class="content-grid">
      <!-- Form Column -->
      <div class="form-card card-shadow">
        <form @submit.prevent="submitNotification" class="notification-form">
          <div class="form-section">
            <h3 class="section-title">Público Alvo</h3>
            
            <div class="target-options">
                <label v-for="opt in targetOptions" :key="opt.value" class="target-radio-wrapper" :class="{'is-active': form.targetGroup === opt.value}">
                    <input type="radio" v-model="form.targetGroup" :value="opt.value" class="hidden-radio" />
                    <div class="radio-content">
                        <div class="radio-header">
                            <component :is="opt.icon" :size="22" class="opt-icon"/>
                            <div class="radio-check"></div>
                        </div>
                        <div class="radio-text">
                            <span class="radio-label">{{ opt.label }}</span>
                            <span class="radio-desc">{{ opt.desc }}</span>
                        </div>
                    </div>
                </label>
            </div>

            <div v-if="form.targetGroup === 'specific_clinic'" class="form-group slide-down">
              <label class="form-label">Selecione a Clínica</label>
              <select v-model="form.clinicId" class="form-input" :disabled="isLoadingClinics">
                <option value="" disabled>Escolha uma clínica...</option>
                <option v-for="clinic in clinics" :key="clinic._id" :value="clinic._id">
                   {{ clinic.name }} (ID: {{ clinic.customId || clinic._id.slice(-6) }})
                </option>
              </select>
              <span v-if="isLoadingClinics" class="field-hint">Carregando clínicas...</span>
            </div>
          </div>

          <div class="form-section">
             <h3 class="section-title">Conteúdo da Notificação</h3>
             
             <div class="form-group">
                <label class="form-label">Título da Notificação *</label>
                <input type="text" v-model="form.title" class="form-input" placeholder="Ex: Novo Recurso Disponível!" required maxlength="100"/>
             </div>

             <div class="form-group">
                <label class="form-label">Mensagem *</label>
                <textarea v-model="form.body" class="form-input" placeholder="Descreva o conteúdo. Ex: Conheça nossa nova ferramenta de Gestão de Estoque V2." required rows="3" maxlength="250"></textarea>
             </div>
          </div>

          <div class="form-section row-2">
             <div class="form-group">
                <label class="form-label">Cor / Tipo</label>
                <select v-model="form.type" class="form-input">
                    <option value="info">Info / Padrão (Azul)</option>
                    <option value="success">Sucesso (Verde)</option>
                    <option value="warning">Aviso / Importante (Amarelo)</option>
                    <option value="error">Alerta Crítico (Vermelho)</option>
                </select>
             </div>
             <div class="form-group">
                <label class="form-label">Ícone (URL) <span class="badge-optional">Opcional</span></label>
                <input type="url" v-model="form.icon" class="form-input" placeholder="Ex: https://img.com/icone.png"/>
             </div>
          </div>

          <div class="form-section row-2">
             <div class="form-group">
                <label class="form-label">URL de Ação <span class="badge-optional">Opcional</span></label>
                <input type="url" v-model="form.url" class="form-input" placeholder="Ex: https://agendadoutor.com/app/financas"/>
                <span class="field-hint">Se preenchido, o usuário será redirecionado para esta página ao clicar na notificação nativa.</span>
             </div>
             
             <div class="form-group toggle-group">
                <label class="form-label">Notificação Push (Sistema Operacional)</label>
                <label class="toggle-switch">
                  <input type="checkbox" v-model="form.sendPush">
                  <span class="slider round"></span>
                </label>
                <span class="field-hint">
                  Se desativado, o aviso aparecerá <b>apenas</b> no Sino do site, silenciosamente.
                </span>
             </div>
          </div>

          <div class="form-actions">
            <AppButton 
                type="submit" 
                :disabled="isSubmitting" 
                class="btn-send"
            >
                <template v-if="!isSubmitting">
                    <Send :size="18" /> Disparar Notificação
                </template>
                <template v-else>
                    <LoaderCircle class="animate-spin" :size="18" /> Enviando...
                </template>
            </AppButton>
          </div>
        </form>
      </div>

      <!-- Preview Column -->
      <div class="preview-card card-shadow">
          <h3 class="section-title">Preview</h3>
          <p class="preview-hint">Exibição estimada no app e navegador do usuário.</p>
          
          <div class="dummy-app-notification" :class="form.type">
             <div class="dummy-icon-container">
                 <img v-if="form.icon" :src="form.icon" @error="form.icon=''" alt="Ícone" class="dummy-img" />
                 <div v-else class="dummy-default-icon">
                    AD
                 </div>
             </div>
             <div class="dummy-content">
                 <h4>{{ form.title || 'Título da Notificação' }}</h4>
                 <p>{{ form.body || 'Sua mensagem vai aparecer exatamente aqui. Use um texto atrativo e claro.' }}</p>
                 <span v-if="form.url" class="dummy-link-indicator">Redireciona para link externo</span>
             </div>
          </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-container {
    padding-bottom: 2rem;
}
.page-header {
    margin-bottom: 2rem;
}
.page-title {
    font-size: 1.875rem;
    font-weight: 700;
    color: #111827;
    margin: 0 0 0.5rem 0;
}
.page-description {
    color: #6b7280;
    font-size: 0.9375rem;
    margin: 0;
    max-width: 600px;
    line-height: 1.5;
}

.card-shadow {
    background-color: white;
    border: 1px solid #f3f4f6;
    border-radius: 1.25rem;
    padding: 2rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025);
}

.content-grid {
    display: grid;
    grid-template-columns: 3fr 2fr;
    gap: 2rem;
    align-items: start;
}

.form-section {
    margin-bottom: 2rem;
    padding-bottom: 2rem;
    border-bottom: 1px solid #f3f4f6;
}
.form-section:last-of-type {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
}

.section-title {
    font-size: 1.125rem;
    font-weight: 700;
    color: #111827;
    margin: 0 0 1.25rem 0;
}

/* Redesigned Target Cards */
.target-options {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    margin-bottom: 1.25rem;
}

.hidden-radio {
    display: none;
}
.target-radio-wrapper {
    display: block;
    cursor: pointer;
    height: 100%;
}
.radio-content {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1.25rem;
    background-color: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 1rem;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    height: 100%;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.02);
}
.target-radio-wrapper:hover .radio-content {
    border-color: #cbd5e1;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
    transform: translateY(-2px);
}
.target-radio-wrapper.is-active .radio-content {
    border-color: #3b82f6;
    background-color: #f8fafc;
    box-shadow: 0 0 0 1px #3b82f6, 0 4px 6px -1px rgba(59, 130, 246, 0.1);
}
.radio-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.opt-icon {
    color: #94a3b8;
    transition: color 0.2s;
}
.target-radio-wrapper.is-active .opt-icon {
    color: #3b82f6;
}
.radio-check {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 2px solid #cbd5e1;
    position: relative;
    transition: all 0.2s;
}
.target-radio-wrapper.is-active .radio-check {
    border-color: #3b82f6;
    background-color: #3b82f6;
}
.target-radio-wrapper.is-active .radio-check::after {
    content: '';
    position: absolute;
    width: 6px;
    height: 10px;
    border: solid white;
    border-width: 0 2px 2px 0;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -60%) rotate(45deg);
}

.radio-text {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}
.radio-label {
    font-weight: 600;
    color: #1f2937;
    font-size: 0.9375rem;
}
.radio-desc {
    font-size: 0.8125rem;
    color: #64748b;
    line-height: 1.4;
}

/* Inputs Premium */
.form-group {
    margin-bottom: 1.25rem;
}
.row-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.25rem;
}
.form-label {
    display: block;
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
    margin-bottom: 0.5rem;
}
.badge-optional {
    font-size: 0.65rem;
    background: #f1f5f9;
    color: #64748b;
    padding: 2px 6px;
    border-radius: 4px;
    margin-left: 6px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}
.form-input {
    width: 100%;
    padding: 0.75rem 1rem;
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 0.75rem;
    font-size: 0.9375rem;
    color: #1e293b;
    transition: all 0.2s ease;
}
.form-input:focus {
    background-color: #ffffff;
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}
.form-input::placeholder {
    color: #94a3b8;
}
.field-hint {
    display: block;
    font-size: 0.75rem;
    color: #64748b;
    margin-top: 0.375rem;
}

.form-actions {
    margin-top: 1.5rem;
    display: flex;
    justify-content: flex-end;
}
.btn-send {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background-color: #3b82f6;
    color: white;
}
.btn-send:hover {
    background-color: #2563eb;
}

.animate-spin {
    animation: spin 1s linear infinite;
}
@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

/* Custom Toggle Switch CSS */
.toggle-group {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  margin-top: 0.25rem;
  margin-bottom: 0.25rem;
}
.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}
.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #e5e7eb;
  transition: .2s;
}
.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .2s;
}
input:checked + .slider {
  background-color: #3b82f6;
}
input:checked + .slider:before {
  transform: translateX(20px);
}
.slider.round {
  border-radius: 24px;
}
.slider.round:before {
  border-radius: 50%;
}

/* Feedback Alert */
.feedback-alert {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    border-radius: 0.5rem;
    margin-bottom: 1.5rem;
    font-weight: 500;
}
.feedback-alert.success {
    background-color: #ecfdf5;
    color: #065f46;
    border: 1px solid #a7f3d0;
}
.feedback-alert.error {
    background-color: #fef2f2;
    color: #991b1b;
    border: 1px solid #fecaca;
}

/* Preview Styles */
.preview-card {
    position: sticky;
    top: 24px;
    background-color: #f9fafb;
}
.preview-hint {
    font-size: 0.8125rem;
    color: #6b7280;
    margin: 0 0 1.5rem;
}

.dummy-app-notification {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    background: white;
    border-radius: 1rem;
    border: 1px solid #e5e7eb;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    position: relative;
    overflow: hidden;
}

/* Indicadores de Cor Visual */
.dummy-app-notification::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background-color: #3b82f6; /* info - padrao */
}
.dummy-app-notification.success::before {
    background-color: #10b981;
}
.dummy-app-notification.warning::before {
    background-color: #f59e0b;
}
.dummy-app-notification.error::before {
    background-color: #ef4444;
}

.dummy-icon-container {
    width: 48px;
    height: 48px;
    flex-shrink: 0;
    background: #f3f4f6;
    border-radius: 50%;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
}
.dummy-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
}
.dummy-default-icon {
    font-weight: bold;
    color: #9ca3af;
    font-size: 1.125rem;
}
.dummy-content h4 {
    margin: 0 0 0.25rem 0;
    font-size: 0.9375rem;
    font-weight: 600;
    color: #1f2937;
}
.dummy-content p {
    margin: 0;
    font-size: 0.875rem;
    color: #4b5563;
    line-height: 1.4;
}
.dummy-link-indicator {
    display: inline-block;
    margin-top: 0.5rem;
    font-size: 0.7rem;
    text-transform: uppercase;
    color: #2563eb;
    font-weight: 600;
    background: #eff6ff;
    padding: 2px 6px;
    border-radius: 4px;
}

@media (max-width: 1024px) {
    .content-grid {
        grid-template-columns: 1fr;
    }
    .preview-card {
        position: static;
    }
}
</style>
