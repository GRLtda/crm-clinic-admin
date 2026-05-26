<template>
  <div class="campaigns-view">
    <div class="page-header">
      <div>
        <span class="eyebrow">Campanhas</span>
        <h2 class="page-title">Cupons de setup gratis</h2>
        <p class="page-subtitle">Acompanhe os acessos, cadastros e assinaturas vindas dos QR codes.</p>
      </div>
      <button class="refresh-button" type="button" :disabled="store.loading" @click="store.fetchCampaigns()">
        <Loader2 v-if="store.loading" :size="16" class="icon-spin" />
        <span>Atualizar</span>
      </button>
    </div>

    <div v-if="store.loading" class="loading-state">
      <Loader2 :size="40" class="icon-spin" />
      <span>Carregando campanhas...</span>
    </div>

    <div v-else class="campaign-grid">
      <article v-for="campaign in store.campaigns" :key="campaign.slug" class="campaign-card">
        <div class="campaign-card-header">
          <div class="campaign-icon">
            <Gift :size="22" />
          </div>
          <div>
            <h3>{{ campaign.name }}</h3>
            <a :href="campaign.url" target="_blank" rel="noreferrer">{{ campaign.url }}</a>
          </div>
        </div>

        <div class="setup-badge">Setup gratis por 3 dias</div>

        <div class="metrics-grid">
          <div class="metric">
            <MousePointerClick :size="18" />
            <span>Ativacoes</span>
            <strong>{{ campaign.activations }}</strong>
          </div>
          <div class="metric">
            <Users :size="18" />
            <span>Cadastros</span>
            <strong>{{ campaign.registrations }}</strong>
          </div>
          <div class="metric">
            <Building :size="18" />
            <span>Clinicas</span>
            <strong>{{ campaign.clinicsCreated }}</strong>
          </div>
          <div class="metric highlight">
            <CreditCard :size="18" />
            <span>Assinaram</span>
            <strong>{{ campaign.subscriptionsCompleted }}</strong>
          </div>
        </div>

        <div class="recent-block">
          <h4>Ultimos leads</h4>
          <div v-if="campaign.recentLeads?.length" class="lead-list">
            <div v-for="lead in campaign.recentLeads" :key="lead._id" class="lead-row">
              <div>
                <strong>{{ lead.contact?.name || lead.contact?.email || 'Lead anonimo' }}</strong>
                <span>{{ lead.contact?.email || formatDate(lead.createdAt) }}</span>
              </div>
              <span class="lead-status" :class="{ paid: lead.subscriptionCompletedAt }">
                {{ lead.subscriptionCompletedAt ? 'Assinou' : lead.registeredAt ? 'Cadastrou' : 'Ativou' }}
              </span>
            </div>
          </div>
          <p v-else class="empty-copy">Nenhum lead registrado ainda.</p>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useCampaignsStore } from '../stores/campaigns.js'
import { Building, CreditCard, Gift, Loader2, MousePointerClick, Users } from 'lucide-vue-next'

const store = useCampaignsStore()

onMounted(() => {
  store.fetchCampaigns()
})

function formatDate(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  }).format(new Date(value))
}
</script>

<style scoped>
.campaigns-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.page-header {
  align-items: flex-start;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.eyebrow {
  color: var(--azul-principal, #3b82f6);
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
}

.page-title {
  color: var(--preto, #111827);
  font-family: var(--fonte-titulo);
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0.25rem 0 0.25rem;
}

.page-subtitle {
  color: #6b7280;
  margin: 0;
}

.refresh-button {
  align-items: center;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  color: #374151;
  cursor: pointer;
  display: inline-flex;
  font-weight: 700;
  gap: 0.45rem;
  min-height: 40px;
  padding: 0 0.9rem;
}

.refresh-button:disabled {
  cursor: wait;
  opacity: 0.7;
}

.loading-state {
  align-items: center;
  color: var(--azul-principal, #3b82f6);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 4rem 0;
}

.icon-spin {
  animation: spin 1s linear infinite;
}

.campaign-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.campaign-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
}

.campaign-card-header {
  align-items: center;
  display: flex;
  gap: 0.8rem;
}

.campaign-icon {
  align-items: center;
  background: #eff6ff;
  border-radius: 999px;
  color: var(--azul-principal, #3b82f6);
  display: flex;
  height: 44px;
  justify-content: center;
  width: 44px;
}

.campaign-card h3 {
  color: #111827;
  font-size: 1.1rem;
  margin: 0 0 0.15rem;
}

.campaign-card a {
  color: #6b7280;
  font-size: 0.82rem;
  text-decoration: none;
  word-break: break-all;
}

.setup-badge {
  background: #ecfdf5;
  border: 1px solid #bbf7d0;
  border-radius: 999px;
  color: #047857;
  display: inline-flex;
  font-size: 0.78rem;
  font-weight: 800;
  margin: 1rem 0;
  padding: 0.35rem 0.7rem;
}

.metrics-grid {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.metric {
  background: #f9fafb;
  border: 1px solid #eef2f7;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-height: 106px;
  padding: 0.8rem;
}

.metric svg {
  color: #6b7280;
}

.metric span {
  color: #6b7280;
  font-size: 0.76rem;
  font-weight: 700;
}

.metric strong {
  color: #111827;
  font-size: 1.45rem;
}

.metric.highlight {
  background: #eff6ff;
  border-color: #bfdbfe;
}

.metric.highlight svg,
.metric.highlight strong {
  color: var(--azul-principal, #3b82f6);
}

.recent-block {
  border-top: 1px solid #eef2f7;
  margin-top: 1rem;
  padding-top: 1rem;
}

.recent-block h4 {
  color: #111827;
  font-size: 0.9rem;
  margin: 0 0 0.65rem;
}

.lead-list {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.lead-row {
  align-items: center;
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
}

.lead-row div {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.lead-row strong {
  color: #111827;
  font-size: 0.86rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lead-row span {
  color: #6b7280;
  font-size: 0.75rem;
}

.lead-status {
  background: #f3f4f6;
  border-radius: 999px;
  color: #4b5563 !important;
  flex-shrink: 0;
  font-weight: 800;
  padding: 0.25rem 0.5rem;
}

.lead-status.paid {
  background: #dcfce7;
  color: #166534 !important;
}

.empty-copy {
  color: #9ca3af;
  font-size: 0.85rem;
  margin: 0;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 1200px) {
  .campaign-grid,
  .metrics-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .page-header {
    flex-direction: column;
  }
}
</style>
