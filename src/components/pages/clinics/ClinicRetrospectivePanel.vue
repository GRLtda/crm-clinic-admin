<script setup>
// Aba "Retrospectiva" do detalhe da clínica (docs/RETROSPECTIVA.md).
// Um cartão por ano: status, liberação, versão, visualização e compartilhamentos; JSON dos stories no drawer.
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { CalendarClock, Eye, FileJson, Gift, Loader2, RefreshCw, Share2 } from 'lucide-vue-next'
import api from '../../../utils/api'
import AppButton from '../../global/AppButton.vue'
import AppEmptyState from '../../global/AppEmptyState.vue'
import SideDrawer from '../../global/SideDrawer.vue'

const props = defineProps({ clinicId: { type: String, required: true } })

const STATUS = {
  draft: { label: 'Rascunho', tone: 'neutral' },
  scheduled: { label: 'Agendada', tone: 'warning' },
  published: { label: 'Publicada', tone: 'success' },
}

const items = ref([])
const loading = ref(true)
const error = ref('')
const detail = ref({ open: false, loading: false, error: '', data: null, year: null })
let version = 0

const dateTime = (value) => (value
  ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
  : '—')
const statusOf = (item) => STATUS[item.status] || { label: item.status, tone: 'neutral' }
const plural = (n, one, many) => `${Number(n || 0).toLocaleString('pt-BR')} ${Number(n) === 1 ? one : many}`
const releaseLabel = (item) => (item.status === 'published' ? 'Publicada em' : 'Liberação')
const releaseDate = (item) => (item.status === 'published' ? item.publishedAt || item.publishAt : item.publishAt)

async function load() {
  const current = ++version
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get(`/clinics/${props.clinicId}/retrospectives`)
    if (current === version) items.value = Array.isArray(data?.data) ? data.data : []
  } catch {
    if (current === version) { items.value = []; error.value = 'Não foi possível carregar as retrospectivas desta clínica. Tente atualizar em instantes.' }
  } finally {
    if (current === version) loading.value = false
  }
}

async function openDetail(item) {
  detail.value = { open: true, loading: true, error: '', data: null, year: item.year }
  try {
    const { data } = await api.get(`/retrospectives/${item._id}`)
    const doc = data?.data || null
    detail.value.data = doc && {
      year: doc.year, designKey: doc.designKey, reduced: doc.reduced, copyVariant: doc.copyVariant,
      period: doc.period, inProgressMonth: doc.inProgressMonth, generatedAt: doc.generatedAt,
      generatorVersion: doc.generatorVersion, stories: doc.stories,
    }
  } catch {
    detail.value.error = 'Não foi possível abrir os dados gerados desta retrospectiva. Tente de novo.'
  } finally {
    detail.value.loading = false
  }
}
const closeDetail = () => { detail.value.open = false }

watch(() => props.clinicId, load)
onMounted(load)
onBeforeUnmount(() => { version++ })
</script>

<template>
  <section class="clinic-retro">
    <header class="panel-head">
      <div>
        <h2><Gift :size="20" />Retrospectiva</h2>
        <p>Retrospectivas anuais geradas para esta clínica: liberação, visualização pelo dono e compartilhamentos.</p>
      </div>
      <AppButton :loading="loading" @click="load"><RefreshCw :size="16" /> Atualizar</AppButton>
    </header>

    <p v-if="error" class="state-error" role="alert">{{ error }}</p>

    <div v-else-if="loading && !items.length" class="loading" role="status"><Loader2 :size="18" class="spin" /> Carregando retrospectivas…</div>

    <AppEmptyState v-else-if="!items.length" class="empty" :icon="Gift" title="Nenhuma retrospectiva gerada para esta clínica" text="Quando o script anual gerar a retrospectiva desta clínica, ela aparece aqui com o status e o acompanhamento." />

    <div v-else class="cards">
      <article v-for="item in items" :key="item._id" class="card" :aria-label="`Retrospectiva ${item.year}`">
        <header>
          <h3>Retrospectiva {{ item.year }}</h3>
          <span class="badge" :class="statusOf(item).tone">{{ statusOf(item).label }}</span>
        </header>

        <dl class="facts">
          <div><dt>{{ releaseLabel(item) }}</dt><dd><CalendarClock :size="15" />{{ dateTime(releaseDate(item)) }}</dd></div>
          <div><dt>Versão</dt><dd>{{ item.reduced ? 'Reduzida' : 'Completa' }} · {{ plural(item.storiesCount, 'story', 'stories') }}</dd></div>
          <div>
            <dt>Visualizou?</dt>
            <dd v-if="item.tracking?.firstViewedAt" class="yes">
              <Eye :size="15" />Sim, em {{ dateTime(item.tracking.firstViewedAt) }}
              <small v-if="item.firstViewedBy?.name">por {{ item.firstViewedBy.name }}</small>
              <small>{{ plural(item.tracking.viewCount, 'abertura', 'aberturas') }}</small>
            </dd>
            <dd v-else class="no">Não</dd>
          </div>
          <div><dt>Compartilhamentos</dt><dd><Share2 :size="15" />{{ Number(item.tracking?.shareCount || 0).toLocaleString('pt-BR') }}<small v-if="item.tracking?.lastSharedAt">último em {{ dateTime(item.tracking.lastSharedAt) }}</small></dd></div>
        </dl>

        <footer>
          <span class="muted">Gerada em {{ dateTime(item.generatedAt) }}</span>
          <AppButton size="sm" @click="openDetail(item)"><FileJson :size="15" /> Ver dados gerados</AppButton>
        </footer>
      </article>
    </div>

    <SideDrawer v-if="detail.open" size="lg" @close="closeDetail">
      <template #header>
        <div class="drawer-head"><h3>Dados gerados · {{ detail.year }}</h3><p>Snapshot congelado que o app mostra ao dono. Sem nomes de pacientes nem valores em R$.</p></div>
      </template>
      <div class="drawer-body">
        <div v-if="detail.loading" class="loading" role="status"><Loader2 :size="18" class="spin" /> Carregando dados…</div>
        <p v-else-if="detail.error" class="state-error" role="alert">{{ detail.error }}</p>
        <pre v-else class="json" tabindex="0" aria-label="JSON da retrospectiva">{{ JSON.stringify(detail.data, null, 2) }}</pre>
      </div>
    </SideDrawer>
  </section>
</template>

<style scoped>
.clinic-retro { text-align: left; display: flex; flex-direction: column; gap: 1rem; min-width: 0; }
.panel-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap; }
.panel-head h2 { display: flex; align-items: center; gap: 0.5rem; margin: 0; font-size: 1.15rem; color: #111827; }
.panel-head p { margin: 0.3rem 0 0; color: #64748b; font-size: 0.9rem; }
.cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1rem; }
.card { background: #fff; border: 1px solid #e5e7eb; border-radius: 1rem; padding: 1.1rem 1.25rem; display: flex; flex-direction: column; gap: 1rem; min-width: 0; }
.card header { display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; }
.card h3 { margin: 0; font-size: 1rem; font-weight: 600; color: #1f2937; }
.badge { font-size: 0.75rem; font-weight: 600; padding: 0.2rem 0.6rem; border-radius: 999px; border: 1px solid transparent; }
.badge.neutral { background: #f1f5f9; color: #475569; border-color: #e2e8f0; }
.badge.warning { background: #fffbeb; color: #b45309; border-color: #fde68a; }
.badge.success { background: #ecfdf5; color: #047857; border-color: #a7f3d0; }
.facts { margin: 0; display: grid; gap: 0.75rem; }
.facts > div { display: grid; grid-template-columns: 140px minmax(0, 1fr); gap: 0.75rem; align-items: baseline; }
dt { color: #64748b; font-size: 0.82rem; }
dd { margin: 0; color: #111827; font-size: 0.9rem; font-weight: 500; display: flex; align-items: center; flex-wrap: wrap; gap: 0.35rem; }
dd small { flex-basis: 100%; color: #64748b; font-size: 0.78rem; font-weight: 400; }
dd.yes { color: #047857; }
dd.no { color: #64748b; }
.card footer { display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; flex-wrap: wrap; border-top: 1px solid #f1f5f9; padding-top: 0.85rem; }
.muted { color: #64748b; font-size: 0.8rem; }
.loading { display: flex; align-items: center; gap: 0.5rem; color: #64748b; font-size: 0.9rem; padding: 1rem 0; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.empty { background: #fff; border: 1px solid #e5e7eb; border-radius: 1rem; padding: 2rem 1rem; }
.state-error { color: #b91c1c; background: #fef2f2; border: 1px solid #fecaca; border-radius: 0.6rem; padding: 0.7rem 1rem; font-size: 0.85rem; margin: 0; }
.drawer-head { text-align: left; }
.drawer-head h3 { margin: 0; font-size: 1.05rem; color: #111827; }
.drawer-head p { margin: 0.3rem 0 0; color: #64748b; font-size: 0.85rem; }
.drawer-body { padding: 0.25rem 0; }
.json { text-align: left; margin: 0; padding: 1rem; background: #0f172a; color: #e2e8f0; border-radius: 0.75rem; font-size: 0.78rem; line-height: 1.5; overflow: auto; max-height: calc(100vh - 220px); white-space: pre; }
@media (max-width: 600px) { .facts > div { grid-template-columns: 1fr; gap: 0.2rem; } }
</style>
