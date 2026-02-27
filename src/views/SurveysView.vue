<template>
  <div class="surveys-view">
    <!-- Header Area -->
    <div class="header-area">
      <div class="header-titles">
        <h1 class="page-title">Avaliações do Sistema</h1>
        <p class="page-subtitle">Veja o que os usuários estão achando da plataforma.</p>
      </div>

      <!-- Stats Cards -->
      <div class="stats-area">
        <div class="stat-card">
          <div class="stat-icon-wrapper">
             <i class="fi fi-rr-users"></i>
          </div>
          <div class="stat-info">
            <p class="stat-label">Total de Respostas</p>
            <p class="stat-value">{{ totalSurveys }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabela principal -->
    <div class="table-container">
      <div v-if="loading" class="loading-state">
        <div class="spinner">
          <i class="fi fi-rr-spinner-alt"></i>
        </div>
        <p>Carregando avaliações...</p>
      </div>

      <div v-else-if="surveys.length === 0" class="empty-state">
        <div class="empty-icon">
            <i class="fi fi-rr-document-signed"></i>
        </div>
        <h3>Nenhuma avaliação ainda</h3>
        <p>Ainda não recebemos avaliações. Compartilhe o link do formulário com seus usuários!</p>
      </div>

      <div v-else class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th class="col-id">#</th>
              <th>Usuário</th>
              <th>Cargo</th>
              <th>NPS</th>
              <th class="text-right">Data</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="(survey, index) in surveys" 
              :key="survey._id"
               @click="openSurveyDetails(survey)"
              class="data-row"
            >
              <td class="col-id">{{ index + 1 }}</td>
              <td>
                <div class="user-cell">
                  <div class="avatar">
                    {{ getInitials(survey.name) }}
                  </div>
                  <span class="user-name">{{ survey.name }}</span>
                </div>
              </td>
              <td>
                <span class="badge" :class="getRoleBadgeClass(survey.role)">
                  {{ survey.role }}
                </span>
              </td>
              <td>
                <div class="nps-cell">
                  <div class="nps-dot" :class="getNpsDotClass(survey.npsScore)"></div>
                  <span class="nps-score">{{ survey.npsScore }}/10</span>
                </div>
              </td>
              <td class="text-right text-muted">
                {{ formatDate(survey.createdAt) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Overlay and Sidebar Details panel -->
    <div v-if="selectedSurvey" class="sidebar-overlay">
        <div class="sidebar-backdrop" @click="closeDetails"></div>

        <div class="sidebar-panel">
            
            <div class="sidebar-header">
                <h2>
                    <i class="fi fi-rr-document"></i>
                    Respostas da Avaliação
                </h2>
                <button @click="closeDetails" class="close-btn">
                    <i class="fi fi-rr-cross"></i>
                </button>
            </div>

            <div class="sidebar-content">
                <!-- Main user details -->
                <div class="user-profile-section">
                    <div class="profile-header">
                        <div class="avatar-large">
                            {{ getInitials(selectedSurvey.name) }}
                        </div>
                        <div class="profile-info">
                            <h3>{{ selectedSurvey.name }}</h3>
                            <p class="profile-meta">
                                <span class="badge badge-outline">{{ selectedSurvey.role }}</span>
                                &bull; {{ formatDate(selectedSurvey.createdAt) }}
                            </p>
                        </div>
                    </div>

                    <div class="nps-highlight">
                        <span class="nps-label">Nota NPS:</span>
                        <div class="nps-value-wrapper">
                            <span class="nps-value" :class="getNpsTextClass(selectedSurvey.npsScore)">
                                {{ selectedSurvey.npsScore }}
                            </span>
                            <span class="nps-max">/10</span>
                        </div>
                    </div>
                </div>

                <!-- Questions and Answers -->
                <div class="qa-section">
                    <div class="qa-item">
                        <h4>Com que frequência utiliza o sistema?</h4>
                        <p>{{ selectedSurvey.usageFrequency || 'Não informado' }}</p>
                    </div>

                    <div class="qa-item">
                        <h4>O que mais gosta no sistema hoje?</h4>
                        <p class="whitespace-pre">{{ selectedSurvey.favoriteFeature || 'Não respondeu' }}</p>
                    </div>

                    <div class="qa-item">
                        <h4>Qual é a maior dificuldade atualmente com o sistema?</h4>
                        <p class="whitespace-pre">{{ selectedSurvey.biggestDifficulty || 'Não respondeu' }}</p>
                    </div>

                    <div class="qa-item">
                        <h4>Quais novas funcionalidades poderia ter?</h4>
                        <p class="whitespace-pre">{{ selectedSurvey.newFeatures || 'Não respondeu' }}</p>
                    </div>

                    <!-- LGPD Meta -->
                    <div class="lgpd-section">
                        <h4>
                            <i class="fi fi-rr-shield-check"></i> Dados do Sistema (LGPD)
                        </h4>
                        <div class="lgpd-data">
                            <p><strong>IP:</strong> {{ selectedSurvey.ip || 'Não capturado' }}</p>
                            <p><strong>User Agent:</strong> {{ selectedSurvey.userAgent || 'Não capturado' }}</p>
                            <p><strong>Enviado em:</strong> {{ new Date(selectedSurvey.createdAt).toLocaleString('pt-BR') }}</p>
                        </div>
                    </div>

                </div>
            </div>
            
        </div>
    </div>


  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../utils/api'

const surveys = ref([])
const totalSurveys = ref(0)
const loading = ref(true)
const selectedSurvey = ref(null)

const fetchSurveys = async () => {
    try {
        loading.value = true
        const response = await api.get('/surveys')
        surveys.value = response.data.surveys || []
        totalSurveys.value = response.data.total || 0
    } catch (err) {
        console.error("Erro ao buscar avaliações", err)
        alert("Erro ao carregar os dados de avaliações do sistema.")
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    fetchSurveys()
})

const openSurveyDetails = (survey) => {
    selectedSurvey.value = survey
}

const closeDetails = () => {
    selectedSurvey.value = null
}

const getInitials = (name) => {
    if (!name) return '?'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    return name.substring(0, 2).toUpperCase()
}

const formatDate = (isoString) => {
    if(!isoString) return '-'
    const v = new Date(isoString)
    return v.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

const getRoleBadgeClass = (role) => {
    if (role === 'Médica') return 'badge-medica';
    if (role === 'Recepcionista') return 'badge-recep';
    if (role === 'Dono') return 'badge-dono';
    return '';
}

const getNpsDotClass = (score) => {
    if (score <= 6) return 'dot-red';
    if (score > 6 && score <= 8) return 'dot-yellow';
    return 'dot-green';
}

const getNpsTextClass = (score) => {
    if (score <= 6) return 'text-red';
    if (score > 6 && score <= 8) return 'text-yellow';
    return 'text-green';
}
</script>

<style scoped>
/* Globals & Layout */
.surveys-view {
  font-family: inherit;
  color: #111827;
}

.header-area {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

@media (min-width: 640px) {
  .header-area {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  color: #111827;
}

.page-subtitle {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.25rem;
  margin-bottom: 0;
}

/* Stats Cards */
.stats-area {
  display: flex;
  gap: 1rem;
}

.stat-card {
  background-color: #ffffff;
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.stat-icon-wrapper {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.5rem;
  background-color: #eef2ff;
  color: #4f46e5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

.stat-label {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
  margin: 0;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

/* Table Container */
.table-container {
  background-color: #ffffff;
  border-radius: 0.75rem;
  border: 1px solid #f3f4f6;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  overflow: hidden;
  position: relative;
}

.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 5rem 1rem;
  text-align: center;
}

.spinner {
  color: #6366f1;
  font-size: 1.875rem;
  margin-bottom: 1rem;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.empty-icon {
  width: 4rem;
  height: 4rem;
  background-color: #f9fafb;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  font-size: 1.125rem;
  font-weight: 500;
  color: #111827;
  margin: 0 0 0.25rem 0;
}

.empty-state p {
  color: #6b7280;
  max-width: 24rem;
  margin: 0;
}

/* Data Table */
.table-wrapper {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  text-align: left;
  border-collapse: collapse;
}

.data-table th {
  padding: 1rem 1.5rem;
  background-color: rgba(249, 250, 251, 0.5);
  border-bottom: 1px solid #f3f4f6;
  text-transform: uppercase;
  font-size: 0.625rem;
  font-weight: 700;
  color: #6b7280;
  letter-spacing: 0.05em;
}

.data-table td {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #f3f4f6;
}

.data-row {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.data-row:hover {
  background-color: rgba(249, 250, 251, 0.8);
}

.col-id {
  width: 3rem;
  color: #9ca3af;
  font-family: monospace;
  font-size: 0.875rem;
}

.text-right {
  text-align: right;
}

.text-muted {
  color: #6b7280;
  font-size: 0.875rem;
}

/* User Cell */
.user-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background-color: #eef2ff;
  color: #4f46e5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.875rem;
}

.user-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: #111827;
  transition: color 0.2s ease;
}

.data-row:hover .user-name {
  color: #4f46e5;
}

/* Badges */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid transparent;
}

.badge-outline {
  background-color: #f9fafb;
  border-color: #e5e7eb;
  color: #4b5563;
}

.badge-medica {
  background-color: #ecfdf5;
  color: #047857;
  border-color: #a7f3d0;
}

.badge-recep {
  background-color: #eff6ff;
  color: #1d4ed8;
  border-color: #bfdbfe;
}

.badge-dono {
  background-color: #faf5ff;
  color: #7e22ce;
  border-color: #e9d5ff;
}

/* NPS Cell */
.nps-cell {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.nps-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
}

.nps-score {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.dot-red { background-color: #ef4444; }
.dot-yellow { background-color: #eab308; }
.dot-green { background-color: #10b981; }

.text-red { color: #ef4444; }
.text-yellow { color: #ca8a04; }
.text-green { color: #10b981; }

/* Sidebar/Modal Overlay */
.sidebar-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  justify-content: flex-end;
}

.sidebar-backdrop {
  position: absolute;
  inset: 0;
  background-color: rgba(17, 24, 39, 0.4);
  backdrop-filter: blur(4px);
}

.sidebar-panel {
  position: relative;
  width: 100%;
  max-width: 32rem;
  background-color: #ffffff;
  height: 100%;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #f3f4f6;
  background-color: #ffffff;
}

.sidebar-header h2 {
  font-size: 1.125rem;
  font-weight: 700;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
}

.sidebar-header h2 i {
  color: #4f46e5;
  margin-top: 0.25rem;
}

.close-btn {
  padding: 0.5rem;
  color: #9ca3af;
  background: none;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #4b5563;
  background-color: #f3f4f6;
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  background-color: rgba(249, 250, 251, 0.5);
}

/* User Profile inside Sidebar */
.user-profile-section {
  padding: 1.5rem;
  background-color: #ffffff;
  border-bottom: 1px solid #f3f4f6;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.avatar-large {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background-color: #eef2ff;
  color: #4f46e5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.25rem;
}

.profile-info h3 {
  font-size: 1.125rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.25rem 0;
}

.profile-meta {
  font-size: 0.875rem;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
}

.nps-highlight {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  background-color: #f9fafb;
}

.nps-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: #6b7280;
}

.nps-value-wrapper {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.nps-value {
  font-size: 1.125rem;
  font-weight: 700;
}

.nps-max {
  font-size: 0.875rem;
  color: #9ca3af;
}

/* QA Section */
.qa-section {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.qa-item h4 {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.qa-item p {
  font-size: 0.875rem;
  color: #374151;
  background-color: #ffffff;
  padding: 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid #f3f4f6;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  line-height: 1.625;
  margin: 0;
}

.whitespace-pre {
  white-space: pre-line;
}

/* LGPD Section */
.lgpd-section {
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
  margin-top: 2rem;
}

.lgpd-section h4 {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #9ca3af;
  margin: 0 0 0.75rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.lgpd-data {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background-color: #f3f4f6;
  padding: 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-family: monospace;
  color: #4b5563;
  word-break: break-all;
}

.lgpd-data p {
  margin: 0;
}

.lgpd-data strong {
  font-weight: 700;
}
</style>
