<script setup>
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { AlertTriangle, ArrowRight, Ban, Building2, CalendarClock, CircleDollarSign, HardDrive, LayoutDashboard, MoonStar, Sparkles, UserCheck, Users } from 'lucide-vue-next'
import { useDashboardStore } from '../stores/dashboard.js'
import AppPageHeader from '../components/global/AppPageHeader.vue'
import AppDataTable from '../components/global/AppDataTable.vue'
import KPICard from '../components/layout/KPICard.vue'
import AreaChart from '../components/layout/charts/AreaChart.vue'
import DoughnutChart from '../components/layout/charts/DoughnutChart.vue'
import { formatBrl, formatInt, formatPercent, formatTokens, formatUsd, plural } from '../utils/liaFormat'

const store = useDashboardStore()
const periods = [
  { label: '7 Dias', value: '7d' },
  { label: '1 Mês', value: '1m' },
  { label: '6 Meses', value: '6m' },
  { label: '12 Meses', value: '12m' },
]
const STATUS_LABELS = { active: 'Ativas', trialing: 'Em teste', past_due: 'Atrasadas', unpaid: 'Não pagas', canceled: 'Canceladas', lifetime: 'Vitalícias', incomplete: 'Incompletas', incomplete_expired: 'Expiradas', none: 'Sem assinatura' }

const data = computed(() => store.summary)
const money = computed(() => data.value?.permissions?.money)
const lia = computed(() => (data.value?.lia && !data.value.lia.unavailable ? data.value.lia : null))
const revenue = computed(() => data.value?.revenue)
const funnel = computed(() => data.value?.funnel)

const clinicsChart = computed(() => ({
  categories: (funnel.value?.newClinics || []).map((item) => item.dateLabel),
  series: [{ name: 'Novas clínicas', data: (funnel.value?.newClinics || []).map((item) => item.count) }],
}))
const statusChart = computed(() => ({
  labels: (data.value?.base.byStatus || []).map((item) => STATUS_LABELS[item.status] || item.status),
  series: (data.value?.base.byStatus || []).map((item) => item.count),
}))
const planChart = computed(() => ({
  labels: (data.value?.base.byPlan || []).map((item) => item.label),
  series: (data.value?.base.byPlan || []).map((item) => item.count),
}))

const dayMonth = (value) => (value ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(new Date(value)) : '—')
const daysAgo = (value) => {
  if (!value) return 'nenhum atendimento registrado'
  const days = Math.max(Math.floor((Date.now() - new Date(value).getTime()) / 86400000), 0)
  return `último atendimento há ${plural(days, 'dia', 'dias')}`
}
const gib = (bytes) => `${(bytes / 1024 ** 3).toFixed(1).replace('.', ',')} GB`
const reasonLabel = (reason) => (reason ? reason.replaceAll('_', ' ') : 'motivo não informado')
const initial = (name) => (name || '?').trim().charAt(0).toUpperCase()
const daysFrom = (value) => Math.floor((new Date(value).getTime() - Date.now()) / 86400000)
// Vencimento do teste: hoje, amanhã ou em N dias; urgente quando falta até 2 dias.
const trialChip = (row) => {
  const left = Math.max(daysFrom(row.trialEndsAt), 0)
  return { text: left === 0 ? 'Vence hoje' : left === 1 ? 'Vence amanhã' : `Vence em ${left} dias`, tone: left <= 2 ? 'danger' : 'warning' }
}
const idleChip = (row) => {
  if (!row.lastAppointmentAt) return { text: 'Sem atendimentos', tone: 'muted' }
  const days = Math.max(-daysFrom(row.lastAppointmentAt), 0)
  return { text: `${days} dias parada`, tone: days >= 30 ? 'danger' : 'warning' }
}

const attentionPanels = computed(() => {
  const lists = data.value?.attention || {}
  return [
    { key: 'trials', tone: 'amber', title: 'Testes vencendo', icon: CalendarClock, rows: lists.trialsEnding || [], total: funnel.value?.trialsEnding, empty: 'Nenhum teste vence nos próximos 7 dias.', detail: (row) => `${row.plan} · vence ${dayMonth(row.trialEndsAt)}` },
    { key: 'pastDue', tone: 'red', title: 'Pagamentos atrasados', icon: CircleDollarSign, rows: lists.pastDue || [], total: revenue.value?.pastDue, empty: 'Nenhum pagamento atrasado.', detail: (row) => `${row.plan} · ${reasonLabel(row.reason)}` },
    { key: 'storage', tone: 'blue', title: 'Armazenamento no limite', icon: HardDrive, rows: lists.storage || [], total: data.value?.base.storageNearLimitCount, empty: 'Nenhuma clínica perto do limite do plano.', detail: (row) => `${row.percent}% · ${gib(row.usedBytes)} de ${gib(row.limitBytes)}` },
    { key: 'inactive', tone: 'slate', title: 'Sem movimento na agenda', icon: MoonStar, rows: lists.inactive || [], total: data.value?.base.inactiveCount, empty: 'Todas as clínicas têm atendimentos nos últimos 14 dias.', detail: (row) => daysAgo(row.lastAppointmentAt) },
  ]
})

const campaignColumns = [
  { key: 'label', label: 'Campanha' },
  { key: 'clinics', label: 'Clínicas', width: '100px', align: 'right' },
  { key: 'trialing', label: 'Em teste', width: '100px', align: 'right' },
  { key: 'paying', label: 'Assinantes', width: '110px', align: 'right' },
  { key: 'conversionRate', label: 'Conversão', width: '110px', align: 'right' },
]
const campaignRows = computed(() => (funnel.value?.campaigns || []).map((row) => ({ ...row, id: row.campaign })))

const changePeriod = (period) => store.fetchSummary(period)
onMounted(() => store.fetchSummary(store.currentPeriod))
</script>

<template>
  <div class="dashboard-view">
    <AppPageHeader title="Resumo Geral" subtitle="Receita, entrada de clientes e saúde da plataforma." :icon="LayoutDashboard">
      <template #actions>
        <div class="period-filters" role="group" aria-label="Período">
          <button v-for="period in periods" :key="period.value" type="button" :class="['filter-button', { active: store.currentPeriod === period.value }]" :aria-pressed="store.currentPeriod === period.value" :disabled="store.loading" @click="changePeriod(period.value)">{{ period.label }}</button>
        </div>
      </template>
    </AppPageHeader>

    <p v-if="store.error" class="state-error" role="alert">{{ store.error }}</p>

    <div class="kpi-grid">
      <KPICard v-if="money || store.loading" title="Receita mensal estimada" :value="store.loading ? '—' : formatBrl(revenue?.mrr)" :icon="CircleDollarSign" :hint="revenue?.unpricedActive ? `${plural(revenue.unpricedActive, 'clínica sem preço de tabela', 'clínicas sem preço de tabela')}` : ''" tone="warning" />
      <KPICard title="Clínicas pagantes" :value="store.loading ? '—' : formatInt(revenue?.payingClinics)" :icon="UserCheck" :hint="revenue?.lifetimeClinics ? `+ ${plural(revenue.lifetimeClinics, 'vitalícia', 'vitalícias')}` : ''" />
      <KPICard title="Em teste" :value="store.loading ? '—' : formatInt(funnel?.trialing)" :icon="CalendarClock" :hint="funnel?.trialsEnding ? `${funnel.trialsEnding} vencem em 7 dias` : ''" tone="warning" />
      <KPICard title="Inadimplentes" :value="store.loading ? '—' : formatInt(revenue?.pastDue)" :icon="AlertTriangle" :hint="revenue?.pastDue ? 'Atrasadas ou não pagas' : ''" tone="danger" />
      <KPICard title="Cancelamentos no período" :value="store.loading ? '—' : formatInt(revenue?.canceledInPeriod)" :icon="Ban" hint="Aproximado pela última atualização" />
      <KPICard title="Clínicas / usuários" :value="store.loading ? '—' : `${formatInt(data?.base.totalClinics)} / ${formatInt(data?.base.totalUsers)}`" :icon="Users" :hint="funnel ? `${plural(funnel.createdInPeriod, 'clínica nova', 'clínicas novas')} no período · conversão ${formatPercent(funnel.conversionRate)}` : ''" />
    </div>

    <div class="charts-grid">
      <AreaChart title="Novas clínicas" :categories="clinicsChart.categories" :series="clinicsChart.series" />
      <DoughnutChart title="Status das assinaturas" :labels="statusChart.labels" :series="statusChart.series" />
      <DoughnutChart title="Clínicas por plano" :labels="planChart.labels" :series="planChart.series" />
    </div>

    <h2 class="section-title">Precisa de atenção</h2>
    <div class="attention-grid">
      <section v-for="panel in attentionPanels" :key="panel.key" class="panel attention" :class="`tone-${panel.tone}`">
        <header>
          <h3><span class="panel-icon"><component :is="panel.icon" :size="16" /></span>{{ panel.title }}</h3>
          <span v-if="panel.total" class="count">{{ formatInt(panel.total) }}</span>
        </header>
        <ul v-if="panel.rows.length" class="clinic-rows">
          <li v-for="row in panel.rows" :key="row.clinicId">
            <RouterLink class="clinic-row" :to="{ name: 'clinic-detail', params: { id: row.clinicId } }">
              <span class="avatar" aria-hidden="true">{{ initial(row.name) }}</span>
              <span class="info">
                <strong :title="row.name">{{ row.name }}</strong>
                <span class="meta">
                  <span v-if="panel.key === 'trials'" class="chip" :class="trialChip(row).tone">{{ trialChip(row).text }}</span>
                  <span v-else-if="panel.key === 'pastDue'" class="chip danger">{{ row.status === 'unpaid' ? 'Não paga' : 'Atrasada' }}</span>
                  <span v-else-if="panel.key === 'storage'" class="chip" :class="row.percent >= 95 ? 'danger' : 'warning'">{{ row.percent }}% usado</span>
                  <span v-else class="chip" :class="idleChip(row).tone">{{ idleChip(row).text }}</span>
                  <small v-if="panel.key === 'trials'">{{ row.plan }} · até {{ dayMonth(row.trialEndsAt) }}</small>
                  <small v-else-if="panel.key === 'pastDue'" :title="reasonLabel(row.reason)">{{ row.plan }}</small>
                  <small v-else-if="panel.key === 'storage'">{{ gib(row.usedBytes) }} de {{ gib(row.limitBytes) }}</small>
                  <small v-else-if="row.lastAppointmentAt">{{ daysAgo(row.lastAppointmentAt) }}</small>
                </span>
                <small v-if="panel.key === 'pastDue'" class="reason" :title="reasonLabel(row.reason)">{{ reasonLabel(row.reason) }}</small>
                <span v-if="panel.key === 'storage'" class="meter" :class="{ full: row.percent >= 95 }"><span :style="{ width: Math.min(row.percent, 100) + '%' }"></span></span>
              </span>
              <ArrowRight :size="16" class="go" aria-hidden="true" />
            </RouterLink>
          </li>
        </ul>
        <p v-else class="ok">{{ store.loading ? 'Carregando…' : panel.empty }}</p>
      </section>
    </div>

    <div class="bottom-grid">
      <section class="panel flush">
        <header class="pad"><h3><Building2 :size="17" />Cadastros por campanha</h3></header>
        <AppDataTable :columns="campaignColumns" :rows="campaignRows" row-key="id" :loading="store.loading" :skeleton-rows="3" height="16rem" :empty-icon="Building2" empty-title="Sem campanhas" empty-text="Cadastros vindos de campanhas aparecem aqui.">
          <template #cell-label="{ row }"><strong>{{ row.label }}</strong></template>
          <template #cell-conversionRate="{ row }">{{ formatPercent(row.conversionRate) }}</template>
        </AppDataTable>
      </section>

      <section v-if="data?.permissions?.lia" class="panel lia">
        <header><h3><Sparkles :size="17" />Lia</h3><span v-if="lia" class="muted">últimos {{ lia.days }} dias</span></header>
        <p v-if="data.lia?.unavailable" class="ok">Não foi possível carregar os dados da Lia agora.</p>
        <template v-else-if="lia">
          <dl>
            <div><dt>Tokens</dt><dd>{{ formatTokens(lia.tokens) }}</dd></div>
            <div v-if="lia.cost"><dt>Custo estimado</dt><dd>{{ formatBrl(lia.cost.brl) }} <small>{{ formatUsd(lia.cost.usd) }}</small></dd></div>
            <div><dt>Taxa de erro</dt><dd :class="{ bad: lia.errorRate >= 2 }">{{ formatPercent(lia.errorRate) }}</dd></div>
            <div><dt>Feedbacks novos</dt><dd :class="{ bad: lia.newFeedback > 0 }">{{ formatInt(lia.newFeedback) }}</dd></div>
          </dl>
          <nav class="lia-links"><RouterLink to="/lia">Uso e tokens</RouterLink><RouterLink to="/lia/quality">Erros e qualidade</RouterLink><RouterLink to="/lia/feedback">Feedbacks</RouterLink></nav>
        </template>
        <p v-else class="ok">Carregando…</p>
      </section>
    </div>
  </div>
</template>

<style scoped>
.dashboard-view { width: 100%; }
.period-filters { display: flex; background-color: #f3f4f6; padding: 0.25rem; border-radius: 0.75rem; }
.filter-button { border: none; background: transparent; padding: 0.5rem 1rem; border-radius: 0.5rem; font: inherit; font-size: 0.875rem; font-weight: 600; color: var(--cinza-texto); cursor: pointer; transition: all 0.2s ease; }
.filter-button:hover:not(:disabled) { color: var(--azul-principal); background: rgba(255, 255, 255, 0.5); }
.filter-button.active { background: var(--branco); color: var(--azul-principal); box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05); }
.filter-button:disabled { opacity: 0.6; cursor: not-allowed; }

.kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 1.25rem; }
.charts-grid { display: grid; grid-template-columns: minmax(0, 2fr) repeat(2, minmax(0, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
.section-title { margin: 0 0 0.75rem; font-size: 1.1rem; color: #111827; }
.attention-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(290px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
.bottom-grid { display: grid; grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); gap: 1rem; }

.panel { background: #fff; border: 1px solid #e5e7eb; border-radius: 1rem; padding: 1.1rem 1.25rem; min-width: 0; }
.panel.flush { padding: 1.1rem 0 0; overflow: hidden; }
.panel.flush :deep(.app-data-table) { border: 0; border-radius: 0; border-top: 1px solid #e5e7eb; }
.panel header { display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; }
.panel header.pad { padding: 0 1.25rem; }
.panel h3 { display: flex; align-items: center; gap: 0.45rem; margin: 0; font-size: 0.95rem; font-weight: 600; color: #1f2937; }
.count { min-width: 1.6rem; padding: 0.1rem 0.5rem; border-radius: 99px; background: #fef3c7; color: #a16207; font-size: 0.78rem; font-weight: 600; text-align: center; }
.muted { color: #64748b; font-size: 0.8rem; }
.panel h3 .panel-icon { display: grid; place-items: center; width: 28px; height: 28px; border-radius: 8px; background: #f1f5f9; color: #475569; }
.attention.tone-amber .panel-icon { background: #fef3c7; color: #a16207; }
.attention.tone-red .panel-icon { background: #fee2e2; color: #b91c1c; }
.attention.tone-blue .panel-icon { background: #dbeafe; color: #1d4ed8; }
.clinic-rows { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.35rem; }
.clinic-row { display: flex; align-items: center; gap: 0.75rem; padding: 0.6rem 0.65rem; border: 1px solid #f1f5f9; border-radius: 0.75rem; text-decoration: none; transition: background 0.15s, border-color 0.15s; }
.clinic-row:hover { background: #f8fafc; border-color: #e2e8f0; }
.clinic-row:focus-visible { outline: 2px solid #3b82f6; outline-offset: 1px; }
.clinic-row .avatar { display: grid; place-items: center; flex-shrink: 0; width: 34px; height: 34px; border-radius: 10px; background: #eef2ff; color: #3b5bdb; font-size: 0.9rem; font-weight: 600; }
.clinic-row .info { display: flex; flex-direction: column; gap: 0.15rem; min-width: 0; flex: 1; }
.clinic-row strong { color: #111827; font-size: 0.9rem; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.clinic-row small { color: #64748b; font-size: 0.8rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.clinic-row .meta { display: flex; flex-wrap: wrap; align-items: center; gap: 0.25rem 0.5rem; }
.clinic-row .reason { display: block; }
.clinic-row .chip { flex-shrink: 0; padding: 0.15rem 0.55rem; border-radius: 99px; background: #f1f5f9; color: #475569; font-size: 0.75rem; font-weight: 500; white-space: nowrap; }
.chip.warning { background: #fef3c7; color: #a16207; }
.chip.danger { background: #fee2e2; color: #b91c1c; }
.chip.muted { background: #f1f5f9; color: #64748b; }
.clinic-row .go { flex-shrink: 0; color: #cbd5e1; transition: color 0.15s, transform 0.15s; }
.clinic-row:hover .go { color: #3b82f6; transform: translateX(2px); }
.meter { display: block; height: 5px; border-radius: 99px; background: #e2e8f0; overflow: hidden; margin-top: 0.2rem; }
.meter span { display: block; height: 100%; border-radius: 99px; background: #f59e0b; }
.meter.full span { background: #ef4444; }
.ok { margin: 0; color: #64748b; font-size: 0.85rem; }

.lia dl { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.9rem 1rem; margin: 0 0 1rem; }
.lia dt { color: #64748b; font-size: 0.78rem; font-weight: 500; }
.lia dd { margin: 0.15rem 0 0; color: #111827; font-size: 1.15rem; font-weight: 600; }
.lia dd small { color: #64748b; font-size: 0.75rem; font-weight: 400; }
.lia dd.bad { color: #b91c1c; }
.lia-links { display: flex; flex-wrap: wrap; gap: 0.5rem 1rem; }
.lia-links a { color: #2563eb; font-size: 0.85rem; font-weight: 500; text-decoration: none; }
.lia-links a:hover { text-decoration: underline; }
.state-error { color: #b91c1c; background: #fef2f2; border: 1px solid #fecaca; border-radius: 0.6rem; padding: 0.7rem 1rem; font-size: 0.85rem; }

@media (max-width: 1100px) { .charts-grid, .bottom-grid { grid-template-columns: 1fr; } }
@media (max-width: 768px) { .period-filters { width: 100%; } .filter-button { flex: 1; padding: 0.5rem 0.4rem; } }
</style>
