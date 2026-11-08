<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ShieldAlert, RefreshCw, AlertTriangle, Ban, XCircle, Activity, CheckCircle2 } from 'lucide-vue-next'
import api from '../utils/api'
import AppPageHeader from '../components/global/AppPageHeader.vue'
import AppDataTable from '../components/global/AppDataTable.vue'
import AppSelect from '../components/global/AppSelect.vue'
import AppButton from '../components/global/AppButton.vue'
import KPICard from '../components/layout/KPICard.vue'
import AreaChart from '../components/layout/charts/AreaChart.vue'
import { PERIOD_OPTIONS, errorLabel, formatDateTime, formatInt, formatPercent, shortDay } from '../utils/liaFormat'

const days = ref('30')
const overview = ref(null)
const overviewLoading = ref(true)
const overviewError = ref('')

const page = ref(1)
const errors = ref({ data: [], pagination: { page: 1, pages: 1, total: 0 } })
const errorsLoading = ref(true)
const errorsError = ref('')

let overviewVersion = 0
let errorsVersion = 0

const quality = computed(() => overview.value?.quality)
const actionStatus = computed(() => quality.value?.actions?.byStatus || {})

const chart = computed(() => ({
  categories: (overview.value?.daily || []).map((d) => shortDay(d.date)),
  series: [{ name: 'Erros', data: (overview.value?.daily || []).map((d) => d.errors) }],
}))

const healthy = computed(() => quality.value && quality.value.errorRate < 2 && quality.value.actions.failureRate < 10)

const errorColumns = [
  { key: 'createdAt', label: 'Quando', width: '150px' },
  { key: 'clinicName', label: 'Clínica', width: '200px' },
  { key: 'code', label: 'Tipo de erro', width: '230px' },
  { key: 'stage', label: 'Etapa', width: '120px' },
  { key: 'message', label: 'Detalhe' },
]
const topColumns = [
  { key: 'code', label: 'Tipo de erro' },
  { key: 'count', label: 'Ocorrências', width: '120px', align: 'right' },
  { key: 'lastAt', label: 'Última vez', width: '150px' },
]
const toolColumns = [
  { key: 'tool', label: 'Ferramenta' },
  { key: 'failed', label: 'Falhas', width: '90px', align: 'right' },
  { key: 'total', label: 'Total', width: '90px', align: 'right' },
  { key: 'rate', label: 'Taxa de falha', width: '130px', align: 'right' },
]
const toolRows = computed(() => (quality.value?.failingTools || []).map((t) => ({ ...t, id: t.tool, rate: (t.failed / t.total) * 100 })))
const topRows = computed(() => (quality.value?.topErrors || []).map((e) => ({ ...e, id: e.code })))

async function loadOverview() {
  const version = ++overviewVersion
  overviewLoading.value = true
  overviewError.value = ''
  try {
    const { data } = await api.get('/lia-usage/overview', { params: { days: days.value } })
    if (version === overviewVersion) overview.value = data
  } catch {
    if (version === overviewVersion) overviewError.value = 'Não foi possível carregar os indicadores de qualidade.'
  } finally {
    if (version === overviewVersion) overviewLoading.value = false
  }
}

async function loadErrors() {
  const version = ++errorsVersion
  errorsLoading.value = true
  errorsError.value = ''
  try {
    const { data } = await api.get('/lia-usage/errors', { params: { days: days.value, page: page.value, limit: 10 } })
    if (version === errorsVersion) errors.value = data
  } catch {
    if (version === errorsVersion) {
      errors.value = { data: [], pagination: { page: 1, pages: 1, total: 0 } }
      errorsError.value = 'Não foi possível carregar a lista de erros.'
    }
  } finally {
    if (version === errorsVersion) errorsLoading.value = false
  }
}

function refresh() {
  loadOverview()
  loadErrors()
}

watch(days, () => { page.value = 1; refresh() })

function changePage(next) {
  page.value = next
  loadErrors()
}

onMounted(refresh)
onBeforeUnmount(() => { overviewVersion++; errorsVersion++ })
</script>

<template>
  <div class="lia-quality">
    <AppPageHeader title="Lia: erros e qualidade" subtitle="Acompanhe falhas, ações que não concluíram e pedidos fora do escopo." :icon="ShieldAlert">
      <template #actions>
        <div class="period"><AppSelect v-model="days" :options="PERIOD_OPTIONS" default-option="Período" /></div>
        <AppButton :loading="overviewLoading || errorsLoading" @click="refresh"><RefreshCw :size="16" /> Atualizar</AppButton>
      </template>
    </AppPageHeader>

    <p v-if="overviewError" class="state-error" role="alert">{{ overviewError }}</p>

    <div v-if="overview" class="health" :class="healthy ? 'ok' : 'warn'" role="status">
      <component :is="healthy ? CheckCircle2 : AlertTriangle" :size="18" />
      <span v-if="healthy">A Lia está saudável no período: poucos erros e ações concluindo normalmente.</span>
      <span v-else>Atenção: a taxa de erro ({{ formatPercent(quality.errorRate) }}) ou de falha nas ações ({{ formatPercent(quality.actions.failureRate) }}) está acima do esperado.</span>
    </div>

    <div class="kpi-grid">
      <KPICard title="Taxa de erro" :value="overviewLoading ? '—' : formatPercent(quality?.errorRate)" :icon="Activity" />
      <KPICard title="Erros no período" :value="overviewLoading ? '—' : formatInt(quality?.errors)" :icon="XCircle" />
      <KPICard title="Ações que falharam" :value="overviewLoading ? '—' : formatPercent(quality?.actions?.failureRate)" :icon="AlertTriangle" />
      <KPICard title="Fora do escopo" :value="overviewLoading ? '—' : formatPercent(quality?.outOfScopeRate)" :icon="Ban" />
    </div>

    <div class="panel-grid">
      <section class="panel">
        <header><h2>Erros por dia</h2><span>{{ formatInt(quality?.errors) }} no período</span></header>
        <div class="chart-box"><AreaChart v-if="overview" bare :categories="chart.categories" :series="chart.series" /></div>
      </section>
      <section class="panel">
        <header><h2>Ações com confirmação</h2><span>{{ formatInt(quality?.actions?.total) }} no período</span></header>
        <ul class="status-list">
          <li><span class="dot success"></span>Concluídas<strong>{{ formatInt(actionStatus.success) }}</strong></li>
          <li><span class="dot failed"></span>Falharam<strong>{{ formatInt(actionStatus.failed) }}</strong></li>
          <li><span class="dot pending"></span>Pendentes<strong>{{ formatInt((actionStatus.pending || 0) + (actionStatus.processing || 0)) }}</strong></li>
          <li><span class="dot cancelled"></span>Canceladas ou expiradas<strong>{{ formatInt(actionStatus.cancelled) }}</strong></li>
        </ul>
      </section>
    </div>

    <div class="panel-grid even">
      <section class="panel flush">
        <header class="pad"><h2>Erros mais frequentes</h2></header>
        <AppDataTable :columns="topColumns" :rows="topRows" row-key="id" :loading="overviewLoading" :skeleton-rows="3" height="22rem"
          :empty-icon="CheckCircle2" empty-title="Nenhum erro no período" empty-text="Quando algo falhar, os tipos mais comuns aparecem aqui.">
          <template #cell-code="{ row }"><strong>{{ errorLabel(row.code) }}</strong><small class="code">{{ row.code }}</small></template>
          <template #cell-count="{ row }">{{ formatInt(row.count) }}</template>
          <template #cell-lastAt="{ row }">{{ formatDateTime(row.lastAt) }}</template>
        </AppDataTable>
      </section>
      <section class="panel flush">
        <header class="pad"><h2>Ferramentas com falha</h2></header>
        <AppDataTable :columns="toolColumns" :rows="toolRows" row-key="id" :loading="overviewLoading" :skeleton-rows="3" height="22rem"
          :empty-icon="CheckCircle2" empty-title="Nenhuma ferramenta falhou" empty-text="Falhas de agendamento e outras ações aparecem aqui.">
          <template #cell-tool="{ row }"><code>{{ row.tool }}</code></template>
          <template #cell-failed="{ row }"><span class="err">{{ formatInt(row.failed) }}</span></template>
          <template #cell-total="{ row }">{{ formatInt(row.total) }}</template>
          <template #cell-rate="{ row }">{{ formatPercent(row.rate) }}</template>
        </AppDataTable>
      </section>
    </div>

    <section class="recent">
      <h2>Erros recentes</h2>
      <p v-if="errorsError" class="state-error" role="alert">{{ errorsError }}</p>
      <AppDataTable :columns="errorColumns" :rows="errors.data" row-key="id" :loading="errorsLoading" :skeleton-rows="6" :pagination="errors.pagination"
        height="calc(100vh - 30rem)" :empty-icon="CheckCircle2" empty-title="Nenhum erro registrado" empty-text="Nenhuma falha da Lia no período selecionado."
        @page-change="changePage">
        <template #cell-createdAt="{ row }">{{ formatDateTime(row.createdAt) }}</template>
        <template #cell-code="{ row }"><strong>{{ errorLabel(row.code) }}</strong><small class="code">HTTP {{ row.statusCode }}</small></template>
        <template #cell-stage="{ row }">{{ row.stage === 'confirmation' ? 'Confirmação' : 'Mensagem' }}</template>
        <template #cell-message="{ row }"><span class="msg">{{ row.message || '—' }}</span></template>
      </AppDataTable>
    </section>
  </div>
</template>

<style scoped>
.lia-quality { width: 100%; }
.kpi-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1rem; margin-bottom: 1rem; }
.panel-grid { display: grid; grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); gap: 1rem; margin-bottom: 1rem; }
.panel-grid.even { grid-template-columns: repeat(2, minmax(0, 1fr)); margin-bottom: 1.25rem; }
.panel { background: #fff; border: 1px solid #e5e7eb; border-radius: 1rem; padding: 1.25rem; min-width: 0; }
.panel.flush { padding: 1.25rem 0 0; overflow: hidden; }
.panel.flush :deep(.app-data-table) { border: 0; border-radius: 0; border-top: 1px solid #e5e7eb; }
.panel header { display: flex; justify-content: space-between; align-items: baseline; gap: 1rem; margin-bottom: 1rem; }
.panel header.pad { padding: 0 1.25rem; }
.panel h2, .recent h2 { margin: 0; font-size: 1rem; color: #111827; }
.recent h2 { margin-bottom: 0.75rem; }
.panel header span { color: #64748b; font-size: 0.8rem; }
.chart-box { height: 220px; margin-top: 0.75rem; }
.health { display: flex; align-items: center; gap: 0.6rem; padding: 0.8rem 1rem; border-radius: 0.75rem; margin-bottom: 1rem; font-size: 0.9rem; }
.health.ok { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
.health.warn { background: #fffbeb; color: #92400e; border: 1px solid #fde68a; }
.status-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.9rem; }
.status-list li { display: grid; grid-template-columns: auto 1fr auto; gap: 0.6rem; align-items: center; font-size: 0.9rem; color: #475569; }
.status-list strong { color: #111827; }
.dot { width: 10px; height: 10px; border-radius: 50%; }
.dot.success { background: #10b981; } .dot.failed { background: #ef4444; } .dot.pending { background: #f59e0b; } .dot.cancelled { background: #94a3b8; }
.code { display: block; color: #94a3b8; font-size: 0.75rem; margin-top: 0.15rem; }
.err { color: #b91c1c; font-weight: 600; }
.msg { color: #475569; overflow-wrap: anywhere; }
code { font-size: 0.8rem; background: #f1f5f9; padding: 0.15rem 0.4rem; border-radius: 0.35rem; }
.period { width: 190px; flex-shrink: 0; }
.period :deep(.form-group) { margin-bottom: 0; }
.state-error { color: #b91c1c; background: #fef2f2; border: 1px solid #fecaca; border-radius: 0.6rem; padding: 0.7rem 1rem; font-size: 0.85rem; }
@media (max-width: 1100px) { .kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .panel-grid, .panel-grid.even { grid-template-columns: 1fr; } }
@media (max-width: 600px) { .kpi-grid { grid-template-columns: 1fr; } }
</style>
