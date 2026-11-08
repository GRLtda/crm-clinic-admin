<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { AlertTriangle, Coins, Gauge, MessageSquare, RefreshCw, Sparkles } from 'lucide-vue-next'
import api from '../../../utils/api'
import AppDataTable from '../../global/AppDataTable.vue'
import AppSelect from '../../global/AppSelect.vue'
import AppButton from '../../global/AppButton.vue'
import AppEmptyState from '../../global/AppEmptyState.vue'
import KPICard from '../../layout/KPICard.vue'
import AreaChart from '../../layout/charts/AreaChart.vue'
import { PERIOD_OPTIONS, errorLabel, formatBrl, formatDateTime, formatInt, formatMs, formatPercent, formatTokens, formatUsd, plural, shortDay, toolLabel } from '../../../utils/liaFormat'

// Resumo do uso da Lia por uma clínica (docs/LIA_ADMIN.md#aba-lia-no-detalhe-da-clínica).
const props = defineProps({ clinicId: { type: String, required: true } })

const days = ref('30')
const data = ref(null)
const loading = ref(true)
const error = ref('')
let version = 0

const totals = computed(() => data.value?.totals)
const quality = computed(() => data.value?.quality)
const hasUsage = computed(() => (totals.value?.replies || 0) > 0 || (quality.value?.errors || 0) > 0)

const chart = computed(() => ({
  categories: (data.value?.daily || []).map((d) => shortDay(d.date)),
  series: [{ name: 'Tokens', data: (data.value?.daily || []).map((d) => d.tokens) }],
}))
const tools = computed(() => {
  const list = data.value?.tools || []
  const max = Math.max(...list.map((t) => t.calls), 1)
  return list.slice(0, 6).map((t) => ({ ...t, width: `${Math.max((t.calls / max) * 100, 2)}%` }))
})
const status = computed(() => quality.value?.actions?.byStatus || {})

const userColumns = [
  { key: 'name', label: 'Usuário' },
  { key: 'tokens', label: 'Tokens', width: '120px', align: 'right' },
  { key: 'cost', label: 'Custo estimado', width: '130px', align: 'right' },
  { key: 'replies', label: 'Respostas', width: '100px', align: 'right' },
  { key: 'lastAt', label: 'Último uso', width: '150px' },
]

async function load() {
  const current = ++version
  loading.value = true
  error.value = ''
  try {
    const response = await api.get(`/lia-usage/clinic/${props.clinicId}`, { params: { days: days.value } })
    if (current === version) data.value = response.data
  } catch {
    if (current === version) { data.value = null; error.value = 'Não foi possível carregar o uso da Lia desta clínica.' }
  } finally {
    if (current === version) loading.value = false
  }
}

watch([days, () => props.clinicId], load)
onMounted(load)
onBeforeUnmount(() => { version++ })
</script>

<template>
  <section class="clinic-lia">
    <header class="panel-head">
      <div>
        <h2><Sparkles :size="20" />Lia nesta clínica</h2>
        <p>Como esta clínica está usando a Lia: consumo, quem usa, ferramentas e problemas.</p>
      </div>
      <div class="head-actions">
        <div class="period"><AppSelect v-model="days" :options="PERIOD_OPTIONS" default-option="Período" /></div>
        <AppButton :loading="loading" @click="load"><RefreshCw :size="16" /> Atualizar</AppButton>
      </div>
    </header>

    <p v-if="error" class="state-error" role="alert">{{ error }}</p>

    <AppEmptyState v-else-if="!loading && data && !hasUsage" class="empty" :icon="Sparkles" title="Sem uso da Lia no período" text="Esta clínica ainda não conversou com a Lia nos últimos dias selecionados." />

    <template v-else>
      <div class="kpis">
        <KPICard title="Tokens consumidos" :value="loading ? '—' : formatTokens(totals?.tokens.total)" :icon="Coins" :hint="loading ? '' : `${formatInt(totals?.avgTokensPerReply)} por resposta`" />
        <KPICard title="Custo estimado" :value="loading ? '—' : formatBrl(data?.cost?.brl)" :icon="Gauge" :hint="loading ? '' : `${formatUsd(data?.cost?.usd)} · estimativa`" />
        <KPICard title="Respostas" :value="loading ? '—' : formatInt(totals?.replies)" :icon="MessageSquare" :hint="loading ? '' : `${plural(totals?.conversations, 'conversa nova', 'conversas novas')} · ${formatMs(totals?.avgLatencyMs)} médios`" />
        <KPICard title="Taxa de erro" :value="loading ? '—' : formatPercent(quality?.errorRate)" :icon="AlertTriangle" :hint="loading ? '' : `${plural(quality?.errors, 'erro', 'erros')} · ${formatPercent(quality?.actions.failureRate)} das ações falharam`" :tone="quality?.errorRate >= 2 ? 'danger' : 'neutral'" />
      </div>

      <section class="card">
        <header><h3>Tokens por dia</h3><span>{{ plural(totals?.activeUsers, 'usuário ativo', 'usuários ativos') }}</span></header>
        <div class="chart-box"><AreaChart v-if="data" bare :categories="chart.categories" :series="chart.series" /></div>
      </section>

      <section class="card flush">
          <header class="pad"><h3>Quem usa</h3><span>{{ plural(data?.usersTotal, 'usuário', 'usuários') }}</span></header>
          <AppDataTable :columns="userColumns" :rows="data?.users || []" row-key="id" :loading="loading" :skeleton-rows="3" height="18rem" :empty-icon="Sparkles" empty-title="Sem usuários" empty-text="Nenhum usuário usou a Lia no período.">
            <template #cell-name="{ row }"><strong>{{ row.name }}</strong><small class="sub">{{ row.role }}</small></template>
            <template #cell-tokens="{ row }">{{ formatTokens(row.tokens) }}</template>
            <template #cell-cost="{ row }">{{ formatBrl(row.cost.brl) }}</template>
            <template #cell-replies="{ row }">{{ formatInt(row.replies) }}</template>
            <template #cell-lastAt="{ row }">{{ formatDateTime(row.lastAt) }}</template>
          </AppDataTable>
      </section>

      <div class="two">
        <section class="card">
          <header><h3>Ferramentas mais usadas</h3><span>{{ plural(tools.reduce((sum, t) => sum + t.calls, 0), 'chamada', 'chamadas') }}</span></header>
          <ul v-if="tools.length" class="tool-list">
            <li v-for="tool in tools" :key="tool.tool">
              <div class="tool-top"><strong>{{ toolLabel(tool.tool) }}</strong><span>{{ formatInt(tool.calls) }}<small v-if="tool.errors"> · {{ tool.errors }} com erro</small></span></div>
              <div class="bar"><span :style="{ width: tool.width }"></span></div>
            </li>
          </ul>
          <p v-else class="muted">{{ loading ? 'Carregando…' : 'Nenhuma ferramenta usada no período.' }}</p>
        </section>

        <section class="card">
          <header><h3>Ações com confirmação</h3><span>{{ formatInt(quality?.actions.total) }} no período</span></header>
          <ul class="status-list">
            <li><span class="dot success"></span>Concluídas<strong>{{ formatInt(status.success) }}</strong></li>
            <li><span class="dot failed"></span>Falharam<strong>{{ formatInt(status.failed) }}</strong></li>
            <li><span class="dot pending"></span>Pendentes<strong>{{ formatInt((status.pending || 0) + (status.processing || 0)) }}</strong></li>
            <li><span class="dot cancelled"></span>Canceladas ou expiradas<strong>{{ formatInt(status.cancelled) }}</strong></li>
          </ul>
        </section>
      </div>

      <section class="card">
          <header><h3>Erros recentes e feedbacks</h3><RouterLink to="/lia/feedback" class="link">Ver feedbacks</RouterLink></header>
          <p class="feedback-line">
            <strong>{{ formatInt(data?.feedback.total) }}</strong> feedbacks recebidos<span v-if="data?.feedback.new" class="new"> · {{ data.feedback.new }} {{ data.feedback.new === 1 ? 'novo' : 'novos' }}</span>
          </p>
          <ul v-if="data?.recentErrors.length" class="error-list">
            <li v-for="item in data.recentErrors" :key="item.id"><strong>{{ errorLabel(item.code) }}</strong><span>{{ formatDateTime(item.createdAt) }}</span></li>
          </ul>
          <p v-else class="muted">{{ loading ? 'Carregando…' : 'Nenhum erro no período.' }}</p>
      </section>
    </template>
  </section>
</template>

<style scoped>
.clinic-lia { display: flex; flex-direction: column; gap: 1rem; min-width: 0; }
.panel-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap; }
.panel-head h2 { display: flex; align-items: center; gap: 0.5rem; margin: 0; font-size: 1.15rem; color: #111827; }
.panel-head p { margin: 0.3rem 0 0; color: #64748b; font-size: 0.9rem; }
.head-actions { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
.period { width: 190px; flex-shrink: 0; }
.period :deep(.form-group) { margin-bottom: 0; }
.kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 1rem; }
.card { background: #fff; border: 1px solid #e5e7eb; border-radius: 1rem; padding: 1.1rem 1.25rem; min-width: 0; }
.card.flush { padding: 1.1rem 0 0; overflow: hidden; }
.card.flush :deep(.app-data-table) { border: 0; border-radius: 0; border-top: 1px solid #e5e7eb; }
.card header { display: flex; justify-content: space-between; align-items: baseline; gap: 1rem; margin-bottom: 0.9rem; }
.card header.pad { padding: 0 1.25rem; }
.card h3 { margin: 0; font-size: 0.95rem; font-weight: 600; color: #1f2937; }
.card header span, .muted { color: #64748b; font-size: 0.82rem; }
.link { color: #2563eb; font-size: 0.82rem; font-weight: 500; text-decoration: none; }
.link:hover { text-decoration: underline; }
.chart-box { height: 220px; }
.two { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
.sub { display: block; margin-top: 0.15rem; color: #64748b; font-size: 0.78rem; text-transform: capitalize; }
.tool-list, .status-list, .error-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.8rem; }
.tool-top { display: flex; justify-content: space-between; gap: 0.75rem; font-size: 0.85rem; color: #1f2937; margin-bottom: 0.3rem; }
.tool-top strong { font-weight: 500; }
.tool-top small { color: #b91c1c; }
.bar { height: 7px; border-radius: 99px; background: #f1f5f9; overflow: hidden; }
.bar span { display: block; height: 100%; border-radius: 99px; background: #3b82f6; }
.status-list li { display: grid; grid-template-columns: auto 1fr auto; gap: 0.6rem; align-items: center; font-size: 0.9rem; color: #475569; }
.status-list strong { color: #111827; font-weight: 600; }
.dot { width: 10px; height: 10px; border-radius: 50%; }
.dot.success { background: #10b981; } .dot.failed { background: #ef4444; } .dot.pending { background: #f59e0b; } .dot.cancelled { background: #94a3b8; }
.feedback-line { margin: 0 0 0.8rem; color: #475569; font-size: 0.9rem; }
.feedback-line strong { color: #111827; }
.feedback-line .new { color: #b91c1c; font-weight: 500; }
.error-list { gap: 0.55rem; }
.error-list li { display: flex; justify-content: space-between; gap: 0.75rem; font-size: 0.85rem; padding: 0.5rem 0.7rem; background: #fef2f2; border-radius: 0.6rem; color: #7f1d1d; }
.error-list li span { color: #b91c1c; }
.empty { background: #fff; border: 1px solid #e5e7eb; border-radius: 1rem; padding: 2rem 1rem; }
.state-error { color: #b91c1c; background: #fef2f2; border: 1px solid #fecaca; border-radius: 0.6rem; padding: 0.7rem 1rem; font-size: 0.85rem; margin: 0; }
@media (max-width: 1000px) { .two { grid-template-columns: 1fr; } }
</style>
