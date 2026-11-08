<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Sparkles, RefreshCw, Coins, Wallet, Layers, Wrench, MessageSquare, Timer, Gauge, Building2, Users, ArrowDownWideNarrow, ArrowUpNarrowWide } from 'lucide-vue-next'
import api from '../utils/api'
import AppPageHeader from '../components/global/AppPageHeader.vue'
import AppDataTable from '../components/global/AppDataTable.vue'
import AppSelect from '../components/global/AppSelect.vue'
import AppButton from '../components/global/AppButton.vue'
import KPICard from '../components/layout/KPICard.vue'
import AreaChart from '../components/layout/charts/AreaChart.vue'
import { PERIOD_OPTIONS, formatBrl, formatUsd, plural, toolLabel, formatDateTime, formatInt, formatMs, formatPercent, formatTokens, shortDay } from '../utils/liaFormat'

const days = ref('30')
const overview = ref(null)
const overviewLoading = ref(true)
const overviewError = ref('')

const side = ref('composition') // 'composition' | 'tools'
const tab = ref('clinics') // 'clinics' | 'users'
const direction = ref('desc') // 'desc' = quem mais gasta, 'asc' = quem menos gasta
const page = ref(1)
const ranking = ref({ data: [], pagination: { page: 1, pages: 1, total: 0 }, totalTokens: 0 })
const rankingLoading = ref(true)
const rankingError = ref('')

let overviewVersion = 0
let rankingVersion = 0

const totals = computed(() => overview.value?.totals)
const tokens = computed(() => totals.value?.tokens)

const chart = computed(() => ({
  categories: (overview.value?.daily || []).map((d) => shortDay(d.date)),
  series: [{ name: 'Tokens', data: (overview.value?.daily || []).map((d) => d.tokens) }],
}))

const composition = computed(() => {
  const t = tokens.value
  if (!t) return []
  const parts = [
    { key: 'input', label: 'Entrada (prompt)', value: t.input, color: '#3b82f6' },
    { key: 'output', label: 'Saída (resposta)', value: t.output, color: '#10b981' },
    { key: 'thought', label: 'Raciocínio', value: t.thought, color: '#f59e0b' },
    { key: 'cached', label: 'Cache reaproveitado', value: t.cached, color: '#94a3b8' },
  ]
  const max = Math.max(...parts.map((p) => p.value), 1)
  return parts.map((p) => ({ ...p, width: `${Math.max((p.value / max) * 100, p.value ? 2 : 0)}%` }))
})

const tools = computed(() => {
  const list = overview.value?.tools || []
  const max = Math.max(...list.map((t) => t.calls), 1)
  const total = list.reduce((sum, t) => sum + t.calls, 0) || 1
  return list.map((t) => ({ ...t, width: `${Math.max((t.calls / max) * 100, 2)}%`, share: (t.calls / total) * 100 }))
})

const columns = computed(() => [
  { key: 'name', label: tab.value === 'clinics' ? 'Clínica' : 'Usuário' },
  { key: 'tokens', label: 'Tokens', width: '200px' },
  { key: 'cost', label: 'Custo estimado', width: '150px', align: 'right' },
  { key: 'replies', label: 'Respostas', width: '110px', align: 'right' },
  { key: 'avgTokens', label: 'Média por resposta', width: '150px', align: 'right' },
  { key: 'avgLatencyMs', label: 'Latência', width: '110px', align: 'right' },
  { key: 'errors', label: 'Erros', width: '90px', align: 'right' },
  { key: 'lastAt', label: 'Último uso', width: '150px' },
])

async function loadOverview() {
  const version = ++overviewVersion
  overviewLoading.value = true
  overviewError.value = ''
  try {
    const { data } = await api.get('/lia-usage/overview', { params: { days: days.value } })
    if (version === overviewVersion) overview.value = data
  } catch {
    if (version === overviewVersion) overviewError.value = 'Não foi possível carregar o resumo de uso da Lia.'
  } finally {
    if (version === overviewVersion) overviewLoading.value = false
  }
}

async function loadRanking() {
  const version = ++rankingVersion
  rankingLoading.value = true
  rankingError.value = ''
  try {
    const { data } = await api.get(`/lia-usage/${tab.value}`, { params: { days: days.value, direction: direction.value, page: page.value, limit: 10 } })
    if (version === rankingVersion) ranking.value = data
  } catch {
    if (version === rankingVersion) {
      ranking.value = { data: [], pagination: { page: 1, pages: 1, total: 0 }, totalTokens: 0 }
      rankingError.value = 'Não foi possível carregar o ranking.'
    }
  } finally {
    if (version === rankingVersion) rankingLoading.value = false
  }
}

function refresh() {
  loadOverview()
  loadRanking()
}

watch(days, () => { page.value = 1; refresh() })
watch([tab, direction], () => { page.value = 1; loadRanking() })

function changePage(next) {
  page.value = next
  loadRanking()
}

onMounted(refresh)
onBeforeUnmount(() => { overviewVersion++; rankingVersion++ })
</script>

<template>
  <div class="lia-usage">
    <AppPageHeader title="Lia: uso e tokens" subtitle="Veja quanto a Lia está sendo usada e quem mais consome tokens." :icon="Sparkles">
      <template #actions>
        <div class="period"><AppSelect v-model="days" :options="PERIOD_OPTIONS" default-option="Período" /></div>
        <AppButton :loading="overviewLoading || rankingLoading" @click="refresh"><RefreshCw :size="16" /> Atualizar</AppButton>
      </template>
    </AppPageHeader>

    <p v-if="overviewError" class="state-error" role="alert">{{ overviewError }}</p>
    <p v-if="overview?.cost" class="cost-note">Custo <strong>estimado</strong> a partir dos tokens (preço por milhão de tokens × uso), em dólar convertido a R$ {{ String(overview.cost.usdBrlRate).replace('.', ',') }} por US$ 1. Total no período: <strong>{{ formatBrl(overview.cost.brl) }}</strong> ({{ formatUsd(overview.cost.usd) }}), cerca de {{ formatBrl(overview.cost.perReply.brl) }} por resposta. Não é a fatura do provedor.</p>

    <div class="kpi-grid">
      <KPICard title="Tokens consumidos" :value="overviewLoading ? '—' : formatTokens(tokens?.total)" :icon="Coins" />
      <KPICard title="Custo estimado" :value="overviewLoading ? '—' : formatBrl(overview?.cost?.brl)" :icon="Wallet" />
      <KPICard title="Respostas da Lia" :value="overviewLoading ? '—' : formatInt(totals?.replies)" :icon="MessageSquare" />
      <KPICard title="Tokens por resposta" :value="overviewLoading ? '—' : formatInt(totals?.avgTokensPerReply)" :icon="Gauge" />
      <KPICard title="Latência média" :value="overviewLoading ? '—' : formatMs(totals?.avgLatencyMs)" :icon="Timer" />
    </div>

    <div class="panel-grid">
      <section class="panel chart-panel">
        <header><h2>Tokens por dia</h2><span>{{ plural(totals?.activeClinics, 'clínica', 'clínicas') }} · {{ plural(totals?.activeUsers, 'usuário ativo', 'usuários ativos') }} · {{ plural(totals?.conversations, 'conversa nova', 'conversas novas') }}</span></header>
        <div class="chart-box"><AreaChart v-if="overview" bare :categories="chart.categories" :series="chart.series" /></div>
      </section>

      <section class="panel side-panel">
        <div class="seg side-tabs" role="tablist" aria-label="Detalhes do consumo">
          <button type="button" role="tab" :aria-selected="side === 'composition'" :class="{ active: side === 'composition' }" @click="side = 'composition'"><Layers :size="15" /> Composição</button>
          <button type="button" role="tab" :aria-selected="side === 'tools'" :class="{ active: side === 'tools' }" @click="side = 'tools'"><Wrench :size="15" /> Ferramentas</button>
        </div>
        <template v-if="side === 'composition'">
        <header><h2>Composição dos tokens</h2><span>{{ formatTokens(tokens?.total) }} no total</span></header>
        <ul class="bars">
          <li v-for="part in composition" :key="part.key">
            <div class="bar-label"><span>{{ part.label }}</span><strong>{{ formatTokens(part.value) }}</strong></div>
            <div class="bar-track"><span :style="{ width: part.width, background: part.color }"></span></div>
          </li>
        </ul>
        <h3 class="sub">Modelos</h3>
        <ul class="models">
          <li v-for="model in overview?.models || []" :key="model.model"><span>{{ model.model }}</span><strong>{{ formatTokens(model.tokens) }}</strong><small>{{ formatBrl(model.cost.brl) }}</small></li>
          <li v-if="overview && !overview.models.length" class="muted">Sem chamadas no período.</li>
        </ul>
        </template>
        <template v-else>
          <header><h2>Ferramentas mais usadas</h2><span>{{ plural(tools.reduce((sum, t) => sum + t.calls, 0), 'chamada', 'chamadas') }}</span></header>
          <ul v-if="tools.length" class="tool-list">
            <li v-for="tool in tools" :key="tool.tool">
              <div class="tool-top">
                <div class="tool-name"><strong>{{ toolLabel(tool.tool) }}</strong><code>{{ tool.tool }}</code></div>
                <span class="tool-calls">{{ formatInt(tool.calls) }} <small>({{ formatPercent(tool.share) }})</small></span>
              </div>
              <div class="bar-track"><span :style="{ width: tool.width }"></span></div>
              <span :class="['tool-err', { zero: !tool.errors }]">{{ tool.errors ? `${formatInt(tool.errors)} com erro (${formatPercent(tool.errorRate)})` : 'sem erros' }}</span>
            </li>
          </ul>
          <p v-else class="muted">{{ overviewLoading ? 'Carregando…' : 'Nenhuma ferramenta usada no período.' }}</p>
        </template>
      </section>
    </div>

    <section class="ranking">
      <div class="ranking-head">
        <div class="seg" role="tablist" aria-label="Agrupar por">
          <button type="button" role="tab" :aria-selected="tab === 'clinics'" :class="{ active: tab === 'clinics' }" @click="tab = 'clinics'"><Building2 :size="15" /> Clínicas</button>
          <button type="button" role="tab" :aria-selected="tab === 'users'" :class="{ active: tab === 'users' }" @click="tab = 'users'"><Users :size="15" /> Usuários</button>
        </div>
        <div class="seg" role="group" aria-label="Ordenação">
          <button type="button" :class="{ active: direction === 'desc' }" @click="direction = 'desc'"><ArrowDownWideNarrow :size="15" /> Quem mais gasta</button>
          <button type="button" :class="{ active: direction === 'asc' }" @click="direction = 'asc'"><ArrowUpNarrowWide :size="15" /> Quem menos gasta</button>
        </div>
      </div>
      <p v-if="!rankingLoading && ranking.totalCost" class="ranking-total">Total do período (todas as {{ tab === 'clinics' ? 'clínicas' : 'contas' }}): <strong>{{ formatBrl(ranking.totalCost.brl) }}</strong> · {{ formatUsd(ranking.totalCost.usd) }} · {{ formatTokens(ranking.totalTokens) }} tokens</p>
      <p v-if="rankingError" class="state-error" role="alert">{{ rankingError }}</p>
      <AppDataTable
        :columns="columns"
        :rows="ranking.data"
        row-key="id"
        :loading="rankingLoading"
        :skeleton-rows="6"
        :pagination="ranking.pagination"
        :empty-icon="Sparkles"
        empty-title="Sem uso da Lia no período"
        empty-text="Quando houver respostas da Lia, o ranking aparece aqui."
        height="calc(100vh - 38rem)"
        @page-change="changePage"
      >
        <template #cell-name="{ row }">
          <div class="name-cell"><strong>{{ row.name }}</strong><small v-if="tab === 'users'">{{ row.clinicName }} · {{ row.role }}</small><small v-else>{{ row.activeUsers }} usuário(s) ativo(s)</small></div>
        </template>
        <template #cell-tokens="{ row }">
          <div class="token-cell"><div class="bar-track"><span :style="{ width: `${Math.max(row.share, 1)}%` }"></span></div><strong>{{ formatTokens(row.tokens) }}</strong><small>{{ formatPercent(row.share) }}</small></div>
        </template>
        <template #cell-cost="{ row }"><div class="cost-cell"><strong>{{ formatBrl(row.cost.brl) }}</strong><small>{{ formatUsd(row.cost.usd) }}</small></div></template>
        <template #cell-replies="{ row }">{{ formatInt(row.replies) }}</template>
        <template #cell-avgTokens="{ row }">{{ formatInt(row.avgTokens) }}</template>
        <template #cell-avgLatencyMs="{ row }">{{ formatMs(row.avgLatencyMs) }}</template>
        <template #cell-errors="{ row }"><span :class="['err', { zero: !row.errors }]">{{ formatInt(row.errors) }}</span></template>
        <template #cell-lastAt="{ row }">{{ formatDateTime(row.lastAt) }}</template>
      </AppDataTable>
    </section>
  </div>
</template>

<style scoped>
.lia-usage { width: 100%; }
.kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 1rem; margin-bottom: 1rem; }
.panel-grid { display: grid; grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); gap: 1rem; margin-bottom: 1.25rem; }
.panel { background: #fff; border: 1px solid #e5e7eb; border-radius: 1rem; padding: 1.25rem; min-width: 0; }
.panel header { display: flex; justify-content: space-between; align-items: baseline; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem; }
.panel h2 { margin: 0; font-size: 1rem; color: #111827; }
.panel header span { color: #64748b; font-size: 0.8rem; }
.chart-box { height: 240px; margin-top: 0.75rem; }
.bars, .models { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.85rem; }
.bar-label { display: flex; justify-content: space-between; font-size: 0.85rem; color: #475569; margin-bottom: 0.3rem; }
.bar-label strong { color: #111827; }
.bar-track { height: 8px; border-radius: 99px; background: #f1f5f9; overflow: hidden; }
.bar-track span { display: block; height: 100%; border-radius: 99px; background: #3b82f6; }
.sub { margin: 1.25rem 0 0.6rem; font-size: 0.8rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
.models { gap: 0.5rem; }
.models li { display: grid; grid-template-columns: 1fr auto auto; gap: 0.75rem; align-items: baseline; font-size: 0.85rem; color: #374151; }
.models small, .muted { color: #94a3b8; font-size: 0.78rem; }
.side-tabs { align-self: flex-start; margin-bottom: 1rem; }
.side-panel { display: flex; flex-direction: column; }
.tool-list { list-style: none; margin: 0; padding: 0 0.25rem 0 0; display: flex; flex-direction: column; gap: 0.9rem; max-height: 340px; overflow-y: auto; }
.tool-list li { display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.85rem; }
.tool-top { display: flex; justify-content: space-between; align-items: baseline; gap: 0.75rem; }
.tool-name { display: flex; flex-direction: column; gap: 0.15rem; min-width: 0; }
.tool-name strong { color: #111827; font-weight: 600; }
.tool-name code { color: #94a3b8; font-size: 0.72rem; }
.tool-calls { color: #111827; font-weight: 600; text-align: right; }
.tool-calls small { color: #94a3b8; font-weight: 400; }
.tool-err { color: #b91c1c; font-size: 0.78rem; }
.tool-err.zero { color: #94a3b8; }
.ranking-head { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 0.75rem; }
.seg { display: inline-flex; padding: 0.2rem; background: #f3f4f6; border-radius: 0.75rem; gap: 0.15rem; }
.seg button { display: inline-flex; align-items: center; gap: 0.4rem; border: 0; background: transparent; color: #64748b; font: inherit; font-size: 0.85rem; font-weight: 500; padding: 0.45rem 0.85rem; border-radius: 0.55rem; cursor: pointer; }
.seg button.active { background: #fff; color: #1d4ed8; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08); }
.name-cell, .token-cell { display: flex; flex-direction: column; gap: 0.2rem; min-width: 0; }
.name-cell strong { color: #111827; font-weight: 600; }
.name-cell small, .token-cell small { color: #64748b; font-size: 0.78rem; }
.token-cell strong { color: #111827; }
.cost-note { margin: 0 0 1rem; padding: 0.7rem 1rem; background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 0.75rem; color: #475569; font-size: 0.82rem; line-height: 1.5; }
.cost-note strong { color: #111827; }
.ranking-total { margin: 0 0 0.75rem; color: #475569; font-size: 0.85rem; }
.ranking-total strong { color: #111827; }
.cost-cell { display: flex; flex-direction: column; gap: 0.15rem; align-items: flex-end; }
.cost-cell strong { color: #111827; }
.cost-cell small { color: #64748b; font-size: 0.75rem; }
.err { color: #b91c1c; font-weight: 600; }
.err.zero { color: #94a3b8; font-weight: 400; }
.period { width: 190px; flex-shrink: 0; }
.period :deep(.form-group) { margin-bottom: 0; }
.state-error { color: #b91c1c; background: #fef2f2; border: 1px solid #fecaca; border-radius: 0.6rem; padding: 0.7rem 1rem; font-size: 0.85rem; }
@media (max-width: 1100px) { .kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .panel-grid { grid-template-columns: 1fr; } }
@media (max-width: 600px) { .kpi-grid { grid-template-columns: 1fr; } .token-cell { align-items: flex-end; } }
</style>
