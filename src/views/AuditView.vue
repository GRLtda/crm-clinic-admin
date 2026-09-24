<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { AlertCircle, ChevronDown, Filter, RefreshCw, Search, ShieldCheck, WalletCards } from 'lucide-vue-next'
import AppPagination from '../components/global/AppPagination.vue'
import SkeletonLoader from '../components/global/SkeletonLoader.vue'
import StatusBadge from '../components/global/StatusBadge.vue'
import AuditId from '../components/pages/audits/AuditId.vue'
import { useFinancialAuditStore, useSystemAuditStore } from '../stores/audits'

const props = defineProps({ kind: { type: String, required: true } })
const route = useRoute()
const router = useRouter()
const isFinancial = computed(() => props.kind === 'financial')
const store = isFinancial.value ? useFinancialAuditStore() : useSystemAuditStore()
const expanded = ref(new Set())
const debounceTimer = ref()

const filters = reactive({
  search: String(route.query.search || ''), startDate: String(route.query.startDate || '').slice(0, 10),
  endDate: String(route.query.endDate || '').slice(0, 10), clinicId: String(route.query.clinicId || ''),
  userId: String(route.query.userId || ''), action: String(route.query.action || ''),
  eventType: String(route.query.eventType || ''), outcome: String(route.query.outcome || ''), source: String(route.query.source || ''),
  limit: Math.min(100, Math.max(1, Number(route.query.limit) || 20))
})

const outcomeOptions = computed(() => isFinancial.value
  ? [['', 'Todos os resultados'], ['PENDING', 'Pendente'], ['SUCCESS', 'Sucesso'], ['FAILURE', 'Falha']]
  : [['', 'Todos os resultados'], ['SUCCESS', 'Sucesso'], ['FAILURE', 'Falha'], ['DENIED', 'Negado']])
const sourceOptions = [['', 'Todas as origens'], ['USER_REQUEST', 'Solicitação do usuário'], ['ADMIN_REQUEST', 'Solicitação administrativa'], ['STRIPE_WEBHOOK', 'Webhook Stripe'], ['SYSTEM_JOB', 'Rotina do sistema'], ['MANUAL_ADJUSTMENT', 'Ajuste manual']]
const title = computed(() => isFinancial.value ? 'Auditoria financeira' : 'Auditoria do sistema')
const subtitle = computed(() => isFinancial.value ? 'Acompanhe eventos de cobrança e assinatura.' : 'Acompanhe ações administrativas e alterações no sistema.')

function isoBoundary(value, end = false) {
  if (!value) return undefined
  return new Date(`${value}T${end ? '23:59:59.999' : '00:00:00.000'}`).toISOString()
}
function requestParams(page = Number(route.query.page) || 1) {
  const common = { page, limit: filters.limit, startDate: isoBoundary(filters.startDate), endDate: isoBoundary(filters.endDate, true), clinicId: filters.clinicId || undefined, outcome: filters.outcome || undefined, search: filters.search.trim() || undefined }
  return isFinancial.value
    ? { ...common, eventType: filters.eventType || undefined, source: filters.source || undefined }
    : { ...common, userId: filters.userId || undefined, action: filters.action || undefined }
}
async function load(page = Number(route.query.page) || 1) {
  const params = requestParams(page)
  const query = Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== ''))
  await router.replace({ query })
  await store.fetchAudits(params)
}
function applyFilters() { load(1) }
function clearFilters() {
  Object.assign(filters, { search: '', startDate: '', endDate: '', clinicId: '', userId: '', action: '', eventType: '', outcome: '', source: '', limit: 20 })
  load(1)
}
function toggle(id) {
  const next = new Set(expanded.value)
  next.has(id) ? next.delete(id) : next.add(id)
  expanded.value = next
}
watch(() => filters.search, () => { clearTimeout(debounceTimer.value); debounceTimer.value = setTimeout(() => load(1), 400) })
onMounted(() => load())
onBeforeUnmount(() => clearTimeout(debounceTimer.value))

const fallback = value => value === undefined || value === null || value === '' ? 'Não informado' : String(value)
function displayValue(value) {
  if (value === undefined || value === null || value === '') return 'Não informado'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}
function formatDate(value) {
  if (!value || Number.isNaN(new Date(value).getTime())) return 'Não informado'
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'medium' }).format(new Date(value))
}
function formatMoney(amount) {
  if (amount?.value == null) return 'Não informado'
  try { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: (amount.currency || 'BRL').toUpperCase() }).format(amount.value / 100) }
  catch { return `${amount.value / 100} ${amount.currency || 'BRL'}` }
}
function outcomeLabel(value) { return { SUCCESS: 'Sucesso', FAILURE: 'Falha', DENIED: 'Negado', PENDING: 'Pendente' }[value] || fallback(value) }
function outcomeVariant(value) { return value === 'SUCCESS' ? 'success' : value === 'PENDING' ? 'neutral' : 'danger' }
function actorName(item) { return item.actor?.name || item.actor?.email || 'Não informado' }
function clinicName(item) { return item.clinicSnapshot?.name || item.clinicSnapshot?.email || 'Não informado' }
function snapshotId(snapshot, legacy) { return snapshot?.id || legacy || '' }
</script>

<template>
  <section class="audit-page">
    <header class="page-heading">
      <div class="heading-icon"><component :is="isFinancial ? WalletCards : ShieldCheck" :size="24" /></div>
      <div><h1>{{ title }}</h1><p>{{ subtitle }}</p></div>
      <button class="refresh-button" type="button" :disabled="store.refreshing" @click="load()"><RefreshCw :size="17" :class="{ spinning: store.refreshing }" /> Atualizar</button>
    </header>

    <form class="filters-card" @submit.prevent="applyFilters">
      <div class="search-field"><Search :size="18" /><input v-model="filters.search" type="search" :placeholder="isFinancial ? 'Buscar descrição, clínica, assinante, invoice...' : 'Buscar descrição, ator, clínica ou alvo...'" /></div>
      <label><span>Data inicial</span><input v-model="filters.startDate" type="date" /></label>
      <label><span>Data final</span><input v-model="filters.endDate" type="date" /></label>
      <label><span>Clínica (ID)</span><input v-model.trim="filters.clinicId" placeholder="ObjectId da clínica" /></label>
      <label v-if="!isFinancial"><span>Usuário autor (ID)</span><input v-model.trim="filters.userId" placeholder="ObjectId do usuário" /></label>
      <label v-if="isFinancial"><span>Tipo do evento</span><input v-model.trim="filters.eventType" placeholder="Ex.: PAYMENT_APPROVED" /></label>
      <label v-else><span>Ação</span><input v-model.trim="filters.action" placeholder="Ex.: EMPLOYEE_ROLE_UPDATE" /></label>
      <label><span>Resultado</span><select v-model="filters.outcome"><option v-for="option in outcomeOptions" :key="option[0]" :value="option[0]">{{ option[1] }}</option></select></label>
      <label v-if="isFinancial"><span>Origem</span><select v-model="filters.source"><option v-for="option in sourceOptions" :key="option[0]" :value="option[0]">{{ option[1] }}</option></select></label>
      <label><span>Por página</span><select v-model.number="filters.limit"><option :value="10">10</option><option :value="20">20</option><option :value="50">50</option><option :value="100">100</option></select></label>
      <div class="filter-actions"><button type="button" class="clear-button" @click="clearFilters">Limpar</button><button type="submit" class="apply-button"><Filter :size="16" /> Aplicar filtros</button></div>
    </form>

    <div v-if="store.error" class="error-state" role="alert"><AlertCircle :size="22" /><div><strong>Falha ao carregar a auditoria</strong><p>{{ store.error.message }}</p><p v-if="store.error.errorId">ID do erro: <AuditId :value="store.error.errorId" /></p><p v-if="store.error.requestId">ID da requisição: <AuditId :value="store.error.requestId" /></p></div><button type="button" @click="load()">Tentar novamente</button></div>

    <div v-if="store.loading" class="audit-list skeleton-list"><div v-for="n in filters.limit" :key="n" class="audit-row"><SkeletonLoader width="42px" height="42px" radius="10px" /><div class="skeleton-copy"><SkeletonLoader width="60%" height="16px" /><SkeletonLoader width="38%" height="12px" /></div></div></div>

    <div v-else-if="!store.error && store.items.length" class="audit-list" :class="{ refreshing: store.refreshing }">
      <article v-for="item in store.items" :key="item._id" class="audit-item">
        <button type="button" class="audit-summary" :aria-expanded="expanded.has(item._id)" @click="toggle(item._id)">
          <div class="event-mark" :class="`mark-${item.outcome?.toLowerCase()}`"><component :is="isFinancial ? WalletCards : ShieldCheck" :size="20" /></div>
          <div class="event-main"><div class="event-title"><strong>{{ fallback(item.description) }}</strong><StatusBadge :variant="outcomeVariant(item.outcome)" :label="outcomeLabel(item.outcome)" /></div><div class="event-meta"><span>{{ isFinancial ? fallback(item.eventType) : fallback(item.action) }}</span><span>{{ clinicName(item) }}</span><span>{{ formatDate(item.createdAt) }}</span></div></div>
          <div v-if="isFinancial" class="amount">{{ formatMoney(item.amount) }}</div><ChevronDown class="chevron" :class="{ open: expanded.has(item._id) }" :size="19" />
        </button>
        <div v-if="expanded.has(item._id)" class="audit-details">
          <div class="detail-grid">
            <div><span>ID do evento</span><AuditId :value="item._id" /></div>
            <div><span>Clínica</span><AuditId :value="snapshotId(item.clinicSnapshot, item.clinic)" :label="clinicName(item)" /></div>
            <div><span>Ator</span><AuditId :value="snapshotId(item.actor, item.user)" :label="actorName(item)" /></div>
            <div><span>Origem</span><strong>{{ fallback(item.source) }}</strong></div>
            <template v-if="!isFinancial">
              <div><span>Alvo</span><AuditId :value="item.target?.id" :label="item.target?.name || item.target?.email || ''" /></div><div><span>Entidade</span><strong>{{ fallback(item.entity) }}</strong><AuditId v-if="item.entityId" :value="item.entityId" /></div>
              <div><span>Categoria</span><strong>{{ fallback(item.category) }}</strong></div><div><span>IP</span><strong>{{ fallback(item.ip) }}</strong></div><div><span>Request ID</span><AuditId :value="item.requestId" /></div><div class="wide"><span>User agent</span><strong>{{ fallback(item.userAgent) }}</strong></div>
            </template>
            <template v-else>
              <div><span>Assinante</span><AuditId :value="item.subscriberSnapshot?.id" :label="item.subscriberSnapshot?.name || item.subscriberSnapshot?.email || ''" /></div><div><span>Correlação</span><AuditId :value="item.correlationId" /></div><div><span>Request ID</span><AuditId :value="item.requestId" /></div>
              <div><span>Plano</span><strong>{{ fallback(item.plan?.name || item.plan?.current) }}</strong><small v-if="item.plan?.previous">Anterior: {{ item.plan.previous }}</small></div><div><span>Status</span><strong>{{ fallback(item.status?.current) }}</strong><small v-if="item.status?.previous">Anterior: {{ item.status.previous }}</small></div><div><span>Período</span><strong>{{ formatDate(item.billingPeriod?.start) }} — {{ formatDate(item.billingPeriod?.end) }}</strong></div>
              <div v-for="(value, key) in item.stripe" :key="key"><span>Stripe · {{ key }}</span><AuditId :value="value" /></div>
            </template>
          </div>
          <div v-if="!isFinancial && item.details?.summary" class="detail-section"><span>Resumo</span><p>{{ item.details.summary }}</p></div>
          <div v-if="!isFinancial && item.details?.changes?.length" class="changes"><span>Alterações</span><div v-for="(change, index) in item.details.changes" :key="`${change.field}-${index}`" class="change-row"><strong>{{ change.field }}</strong><code>{{ displayValue(change.old) }}</code><span>→</span><code>{{ displayValue(change.new) }}</code></div></div>
        </div>
      </article>
    </div>
    <div v-else-if="!store.error" class="empty-state"><component :is="isFinancial ? WalletCards : ShieldCheck" :size="44" /><h2>Nenhum evento encontrado</h2><p>Não há registros para os filtros informados.</p><button type="button" @click="clearFilters">Limpar filtros</button></div>

    <AppPagination v-if="!store.loading && !store.error && store.pagination.pages > 1" :current-page="store.pagination.page" :total-pages="store.pagination.pages" :total-items="store.pagination.total" :items-on-page="store.items.length" label="eventos" @page-changed="load" />
  </section>
</template>

<style scoped>
.audit-page { width: 100%; color: #172033; }.page-heading { display: flex; align-items: center; gap: .85rem; margin-bottom: 1.25rem; }.page-heading h1 { margin: 0 0 .2rem; font-size: 1.75rem; }.page-heading p { margin: 0; color: #64748b; font-size: .9rem; }.heading-icon { display: grid; place-items: center; width: 46px; height: 46px; border-radius: 12px; color: #2563eb; background: #eff6ff; }.refresh-button { margin-left: auto; display: flex; align-items: center; gap: .45rem; padding: .6rem .85rem; border: 1px solid #dbe2ea; border-radius: 8px; background: white; color: #334155; cursor: pointer; }.spinning { animation: spin 1s linear infinite; }@keyframes spin { to { transform: rotate(360deg); } }
.filters-card { display: grid; grid-template-columns: repeat(5, minmax(140px, 1fr)); gap: .85rem; padding: 1rem; margin-bottom: 1rem; border: 1px solid #e2e8f0; border-radius: 12px; background: white; box-shadow: 0 1px 2px #0f172a0a; }.filters-card label { display: flex; flex-direction: column; gap: .35rem; }.filters-card label span { color: #64748b; font-size: .72rem; font-weight: 600; text-transform: uppercase; }.filters-card input,.filters-card select { box-sizing: border-box; width: 100%; height: 40px; padding: 0 .7rem; border: 1px solid #d8e0e9; border-radius: 8px; background: white; color: #334155; font: inherit; font-size: .8rem; }.filters-card input:focus,.filters-card select:focus { outline: 2px solid #bfdbfe; border-color: #3b82f6; }.search-field { position: relative; grid-column: span 2; align-self: end; }.search-field svg { position: absolute; top: 11px; left: 11px; color: #94a3b8; }.search-field input { padding-left: 2.35rem; }.filter-actions { display: flex; align-self: end; justify-content: flex-end; gap: .5rem; }.filter-actions button,.error-state button,.empty-state button { height: 40px; padding: 0 .8rem; border-radius: 8px; cursor: pointer; font-weight: 600; }.clear-button { border: 1px solid #dbe2ea; background: white; color: #475569; }.apply-button { display: flex; align-items: center; gap: .4rem; border: 0; background: #2563eb; color: white; }
.audit-list { overflow: hidden; border: 1px solid #e2e8f0; border-radius: 12px; background: white; transition: opacity .2s; }.audit-list.refreshing { opacity: .6; pointer-events: none; }.audit-item + .audit-item { border-top: 1px solid #e8edf3; }.audit-summary { display: flex; align-items: center; gap: .9rem; width: 100%; padding: 1rem; border: 0; background: white; text-align: left; cursor: pointer; }.audit-summary:hover { background: #f8fafc; }.event-mark { display: grid; flex: 0 0 auto; place-items: center; width: 42px; height: 42px; border-radius: 10px; background: #f1f5f9; color: #64748b; }.mark-success { color: #15803d; background: #f0fdf4; }.mark-failure,.mark-denied { color: #b91c1c; background: #fef2f2; }.mark-pending { color: #a16207; background: #fefce8; }.event-main { min-width: 0; flex: 1; }.event-title { display: flex; align-items: center; gap: .65rem; }.event-title strong { overflow: hidden; color: #1e293b; font-size: .9rem; text-overflow: ellipsis; white-space: nowrap; }.event-meta { display: flex; gap: .55rem; margin-top: .35rem; color: #64748b; font-size: .75rem; }.event-meta span + span::before { content: '•'; margin-right: .55rem; color: #cbd5e1; }.amount { color: #0f172a; font-weight: 700; white-space: nowrap; }.chevron { color: #94a3b8; transition: transform .2s; }.chevron.open { transform: rotate(180deg); }
.audit-details { padding: .25rem 1rem 1rem 4.8rem; background: #fbfdff; }.detail-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .9rem 1.25rem; padding: 1rem; border: 1px solid #e8edf3; border-radius: 9px; background: white; }.detail-grid > div { display: flex; min-width: 0; flex-direction: column; gap: .3rem; }.detail-grid span,.detail-section > span,.changes > span { color: #64748b; font-size: .68rem; font-weight: 700; text-transform: uppercase; }.detail-grid strong { overflow-wrap: anywhere; font-size: .78rem; }.detail-grid small { color: #64748b; font-size: .7rem; }.wide { grid-column: span 2; }.detail-section,.changes { margin-top: .75rem; padding: .9rem 1rem; border: 1px solid #e8edf3; border-radius: 9px; background: white; }.detail-section p { margin: .35rem 0 0; font-size: .82rem; }.change-row { display: grid; grid-template-columns: 1fr 2fr auto 2fr; align-items: center; gap: .6rem; margin-top: .55rem; font-size: .76rem; }.change-row code { padding: .4rem; overflow-wrap: anywhere; border-radius: 5px; background: #f1f5f9; }
.error-state { display: flex; align-items: flex-start; gap: .8rem; padding: 1rem; border: 1px solid #fecaca; border-radius: 10px; background: #fff7f7; color: #991b1b; }.error-state p { margin: .25rem 0 0; font-size: .8rem; }.error-state button { margin-left: auto; border: 1px solid #fecaca; background: white; color: #991b1b; }.empty-state { padding: 4rem 1rem; border: 1px solid #e2e8f0; border-radius: 12px; background: white; color: #64748b; text-align: center; }.empty-state h2 { margin: .8rem 0 .3rem; color: #1e293b; font-size: 1.15rem; }.empty-state p { margin: 0 0 1rem; font-size: .85rem; }.empty-state button { border: 1px solid #dbe2ea; background: white; color: #334155; }.skeleton-list .audit-row { display: flex; align-items: center; gap: 1rem; padding: 1rem; }.skeleton-copy { display: flex; flex: 1; flex-direction: column; gap: .55rem; }
@media (max-width: 1100px) { .filters-card { grid-template-columns: repeat(3, 1fr); }.detail-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 700px) { .page-heading { align-items: flex-start; flex-wrap: wrap; }.refresh-button { margin-left: 0; }.filters-card { grid-template-columns: 1fr; }.search-field { grid-column: span 1; }.filter-actions { justify-content: stretch; }.filter-actions button { flex: 1; }.audit-summary { align-items: flex-start; }.event-title,.event-meta { align-items: flex-start; flex-direction: column; }.event-meta span + span::before { display: none; }.amount { display: none; }.audit-details { padding: .25rem .7rem .8rem; }.detail-grid { grid-template-columns: 1fr; }.wide { grid-column: span 1; }.change-row { grid-template-columns: 1fr; }.change-row > span { display: none; } }
</style>
