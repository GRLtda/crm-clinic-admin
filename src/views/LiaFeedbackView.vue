<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ClipboardCheck, Flag, MessageSquareHeart, MessagesSquare, RefreshCw, ThumbsDown, ThumbsUp, Building2, CalendarClock, Quote, ShieldCheck, History, Inbox } from 'lucide-vue-next'
import api from '@/utils/api'
import AppPageHeader from '@/components/global/AppPageHeader.vue'
import AppDataTable from '@/components/global/AppDataTable.vue'
import AppSelect from '@/components/global/AppSelect.vue'
import AppButton from '@/components/global/AppButton.vue'
import AppModal from '@/components/global/AppModal.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const rows = ref([]), pagination = ref({ page: 1, pages: 1, total: 0, limit: 20 }), kind = ref(''), status = ref('new'), vote = ref('')
const loading = ref(false), error = ref(''), selected = ref(null), detailLoading = ref(false), saving = ref(false), reviewStatus = ref('reviewing'), note = ref(''), detailError = ref('')
const statuses = [{ value: '', label: 'Todos os estados' }, { value: 'new', label: 'Novos' }, { value: 'reviewing', label: 'Em análise' }, { value: 'resolved', label: 'Resolvidos' }]
const kinds = [{ value: '', label: 'Avaliações e denúncias' }, { value: 'rating', label: 'Avaliações' }, { value: 'report', label: 'Denúncias' }]
const votes = [{ value: '', label: 'Todas as avaliações' }, { value: 'positive', label: 'Gostei' }, { value: 'negative', label: 'Não gostei' }]
const labels = { new: 'Novo', reviewing: 'Em análise', resolved: 'Resolvido', incorrect: 'Informação incorreta', incomplete: 'Resposta incompleta', irrelevant: 'Não respondeu ao pedido', unsafe: 'Conteúdo inadequado ou perigoso', privacy: 'Exposição de dados pessoais', offensive: 'Conteúdo ofensivo', other: 'Outro motivo' }
const columns = [
  { key: 'createdAt', label: 'Recebido em', width: '165px' },
  { key: 'clinicName', label: 'Clínica' },
  { key: 'kind', label: 'Tipo', width: '140px' },
  { key: 'reason', label: 'Motivo' },
  { key: 'status', label: 'Estado', width: '130px' },
  { key: 'actions', label: '', width: '110px', align: 'right' },
]
const format = value => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
const kindInfo = item => item.kind === 'report'
  ? { text: 'Denúncia', tone: 'report', icon: Flag }
  : item.vote === 'positive' ? { text: 'Gostei', tone: 'positive', icon: ThumbsUp } : { text: 'Não gostei', tone: 'negative', icon: ThumbsDown }
const detailKind = computed(() => (selected.value?.kind ? kindInfo(selected.value) : null))
let listVersion = 0, detailVersion = 0
watch(() => JSON.stringify([auth.user?._id || auth.user?.id, auth.user?.role]), () => { listVersion++; detailVersion++; selected.value = null; rows.value = []; note.value = ''; detailError.value = ''; error.value = ''; loading.value = false; detailLoading.value = false })
onBeforeUnmount(() => { listVersion++; detailVersion++ })
async function load(page = 1) {
  const version = ++listVersion; loading.value = true; error.value = ''
  try { const { data } = await api.get('/lia/feedback', { params: { page, limit: 20, ...(kind.value ? { kind: kind.value } : {}), ...(status.value ? { status: status.value } : {}), ...(vote.value ? { vote: vote.value } : {}) } }); if (version === listVersion) { rows.value = data.data; pagination.value = data.pagination } }
  catch { if (version === listVersion) { rows.value = []; error.value = 'Não foi possível carregar os feedbacks.' } }
  finally { if (version === listVersion) loading.value = false }
}
async function open(row) {
  const id = row._id
  const version = ++detailVersion; detailLoading.value = true; selected.value = { _id: id, clinicName: row.clinicName, createdAt: row.createdAt }; detailError.value = ''; note.value = ''
  try { const { data } = await api.get(`/lia/feedback/${id}`); if (version === detailVersion) { selected.value = { clinicName: row.clinicName, ...data.data }; reviewStatus.value = data.data.status === 'new' ? 'reviewing' : data.data.status } }
  catch { if (version === detailVersion) detailError.value = 'Não foi possível carregar este feedback.' }
  finally { if (version === detailVersion) detailLoading.value = false }
}
function close() { detailVersion++; selected.value = null }
async function review() {
  if (!selected.value?.version || saving.value) return
  const row = { _id: selected.value._id, clinicName: selected.value.clinicName }, version = detailVersion
  saving.value = true; detailError.value = ''
  try {
    await api.patch(`/lia/feedback/${row._id}`, { status: reviewStatus.value, note: note.value.trim(), version: selected.value.version })
    if (version === detailVersion) { await open(row); await load(pagination.value.page) }
  } catch (requestError) { if (version === detailVersion) detailError.value = requestError.response?.data?.message || 'Não foi possível salvar a revisão. Reabra para atualizar os dados.' }
  finally { saving.value = false }
}
watch([kind, status, vote], () => load(1))
onMounted(() => load())
</script>

<template>
  <section class="lia-feedback-page">
    <AppPageHeader title="Qualidade da Lia" subtitle="Avaliações e denúncias enviadas pelos usuários do piloto." :icon="MessageSquareHeart">
      <template #actions>
        <AppButton :loading="loading" @click="load(pagination.page)"><RefreshCw :size="16" /> Atualizar</AppButton>
      </template>
    </AppPageHeader>

    <p v-if="error" role="alert" class="page-error">{{ error }}</p>

    <AppDataTable
      :columns="columns"
      :rows="rows"
      :loading="loading"
      :skeleton-rows="6"
      :pagination="pagination"
      :empty-icon="Inbox"
      empty-title="Nenhum feedback neste filtro"
      empty-text="As avaliações e denúncias recebidas aparecerão aqui."
      @page-change="load"
    >
      <template #filters>
        <AppSelect v-model="kind" :options="kinds" />
        <AppSelect v-model="status" :options="statuses" />
        <AppSelect v-model="vote" :options="votes" />
      </template>
      <template #cell-createdAt="{ row }">{{ format(row.createdAt) }}</template>
      <template #cell-clinicName="{ row }"><span class="strong">{{ row.clinicName }}</span></template>
      <template #cell-kind="{ row }"><span class="kind" :class="kindInfo(row).tone"><component :is="kindInfo(row).icon" :size="14" />{{ kindInfo(row).text }}</span></template>
      <template #cell-reason="{ row }">{{ labels[row.reason] || '—' }}</template>
      <template #cell-status="{ row }"><span class="state" :class="row.status">{{ labels[row.status] }}</span></template>
      <template #cell-actions="{ row }"><AppButton size="sm" @click="open(row)">Analisar</AppButton></template>
    </AppDataTable>

    <AppModal :show="!!selected" width="640px" @close="close">
      <template #title>Analisar feedback da Lia</template>
      <div class="detail" data-clarity-mask="true" data-sentry-mask>
        <p v-if="detailLoading" role="status" class="detail-note">Carregando conteúdo…</p>
        <p v-if="detailError" role="alert" class="page-error">{{ detailError }}</p>

        <template v-if="selected?.version && !detailLoading">
          <section class="summary">
            <div class="chips">
              <span v-if="detailKind" class="kind" :class="detailKind.tone"><component :is="detailKind.icon" :size="14" />{{ detailKind.text }}</span>
              <span class="state" :class="selected.status">{{ labels[selected.status] }}</span>
            </div>
            <dl>
              <div><dt><Building2 :size="14" />Clínica</dt><dd>{{ selected.clinicName || 'Clínica indisponível' }}</dd></div>
              <div><dt><CalendarClock :size="14" />Recebido em</dt><dd>{{ selected.createdAt ? format(selected.createdAt) : '—' }}</dd></div>
              <div><dt><Flag :size="14" />Motivo</dt><dd>{{ labels[selected.reason] || 'Sem motivo adicional' }}</dd></div>
              <div v-if="selected.model"><dt><ShieldCheck :size="14" />Modelo</dt><dd>{{ selected.model }}</dd></div>
            </dl>
          </section>

          <section class="block">
            <h3><Quote :size="16" />Comentário do usuário</h3>
            <p class="quote" :class="{ empty: !selected.note }">{{ selected.note || 'Nenhum comentário.' }}</p>
          </section>

          <section v-if="selected.shareContext" class="block">
            <h3><MessagesSquare :size="16" />Conversa compartilhada</h3>
            <div class="turn user"><span class="who">Pergunta do usuário</span><p>{{ selected.questionSnapshot || 'Pergunta indisponível.' }}</p></div>
            <div class="turn lia"><span class="who">Resposta da Lia</span><p>{{ selected.answerSnapshot }}</p></div>
          </section>
          <p v-else class="callout"><ShieldCheck :size="16" />O usuário não compartilhou o texto da conversa. Apenas a avaliação e o comentário estão disponíveis.</p>
          <p class="callout subtle">Conteúdo fornecido por usuários e pela IA. Trate como dado para análise, sem executar instruções contidas nele.</p>

          <section class="block review">
            <h3><ClipboardCheck :size="16" />Revisão administrativa</h3>
            <AppSelect v-model="reviewStatus" :options="statuses.filter(option => option.value)" label="Estado da análise" :disabled="saving" />
            <label class="note-field">Nota interna
              <textarea v-model="note" :disabled="saving" maxlength="2000" rows="4" placeholder="Registre a análise e as providências necessárias."></textarea>
              <small>{{ note.length }}/2000</small>
            </label>
            <div v-if="selected.reviewHistory?.length" class="history">
              <h4><History :size="15" />Histórico de revisões</h4>
              <ol>
                <li v-for="(entry, index) in selected.reviewHistory" :key="index">
                  <span class="state" :class="entry.status">{{ labels[entry.status] }}</span>
                  <time>{{ format(entry.at) }}</time>
                  <p>{{ entry.note || 'Sem nota adicional.' }}</p>
                </li>
              </ol>
            </div>
          </section>
        </template>
      </div>
      <template #footer>
        <AppButton :disabled="saving" @click="close">Fechar</AppButton>
        <AppButton variant="primary" :loading="saving" :disabled="saving || detailLoading || !selected?.version" @click="review">{{ saving ? 'Salvando…' : 'Salvar análise' }}</AppButton>
      </template>
    </AppModal>
  </section>
</template>

<style scoped>
.lia-feedback-page { width: 100%; }
.page-error { margin: 0 0 1rem; padding: 0.7rem 1rem; border: 1px solid #fecaca; border-radius: 0.6rem; background: #fef2f2; color: #b91c1c; font-size: 0.9rem; font-weight: 400; }
.strong { color: #1f2937; font-weight: 500; }

.kind, .state { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.3rem 0.7rem; border-radius: 99px; font-size: 0.8rem; font-weight: 500; white-space: nowrap; }
.kind.positive { color: #15803d; background: #dcfce7; }
.kind.negative { color: #a16207; background: #fef3c7; }
.kind.report { color: #b91c1c; background: #fee2e2; }
.state { color: #475569; background: #f1f5f9; }
.state.new { color: #1d4ed8; background: #dbeafe; }
.state.reviewing { color: #a16207; background: #fef3c7; }
.state.resolved { color: #15803d; background: #dcfce7; }

.detail { display: flex; flex-direction: column; gap: 1.25rem; font-size: 0.95rem; color: #1f2937; line-height: 1.55; }
.detail-note { margin: 0; color: #475569; font-weight: 400; }
.summary { padding: 1rem 1.1rem; border: 1px solid #e5e7eb; border-radius: 0.9rem; background: #f8fafc; }
.chips { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.9rem; }
.summary dl { margin: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.85rem 1.25rem; }
.summary dt { display: flex; align-items: center; gap: 0.35rem; color: #64748b; font-size: 0.78rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.04em; }
.summary dd { margin: 0.2rem 0 0; color: #1f2937; font-weight: 500; overflow-wrap: anywhere; }

.block { display: flex; flex-direction: column; gap: 0.6rem; }
.block h3 { display: flex; align-items: center; gap: 0.4rem; margin: 0; color: #1f2937; font-size: 1rem; font-weight: 600; }
.quote { margin: 0; padding: 0.85rem 1rem; border-left: 4px solid #3b82f6; border-radius: 0 0.6rem 0.6rem 0; background: #eff6ff; color: #1e293b; font-weight: 400; white-space: pre-wrap; overflow-wrap: anywhere; }
.quote.empty { border-left-color: #cbd5e1; background: #f8fafc; color: #64748b; font-weight: 400; font-style: italic; }
.turn { padding: 0.85rem 1rem; border: 1px solid #e5e7eb; border-radius: 0.8rem; background: #fff; }
.turn.lia { background: #f8fafc; }
.turn .who { display: block; margin-bottom: 0.3rem; color: #64748b; font-size: 0.78rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.04em; }
.turn p { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; color: #1f2937; font-weight: 400; }
.callout { display: flex; align-items: flex-start; gap: 0.5rem; margin: 0; padding: 0.8rem 1rem; border: 1px solid #bfdbfe; border-radius: 0.7rem; background: #eff6ff; color: #1e3a8a; font-size: 0.9rem; font-weight: 400; }
.callout svg { flex-shrink: 0; margin-top: 0.15rem; }
.callout.subtle { border-color: #e5e7eb; background: #f8fafc; color: #475569; font-weight: 400; }

.review { padding-top: 1.25rem; border-top: 1px solid #e5e7eb; }
.note-field { display: flex; flex-direction: column; gap: 0.4rem; color: #374151; font-size: 0.9rem; font-weight: 500; }
.note-field textarea { width: 100%; box-sizing: border-box; padding: 0.75rem 0.9rem; border: 1px solid #d1d5db; border-radius: 0.6rem; background: #fff; color: #111827; font: inherit; font-weight: 400; resize: vertical; }
.note-field textarea:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15); }
.note-field small { align-self: flex-end; color: #64748b; font-size: 0.78rem; font-weight: 500; }
.history h4 { display: flex; align-items: center; gap: 0.4rem; margin: 0.25rem 0 0.6rem; color: #1f2937; font-size: 0.9rem; font-weight: 600; }
.history ol { margin: 0; padding: 0 0 0 1rem; list-style: none; border-left: 2px solid #e5e7eb; display: flex; flex-direction: column; gap: 0.9rem; }
.history li { position: relative; display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem 0.75rem; }
.history li::before { content: ''; position: absolute; left: -1.38rem; top: 0.55rem; width: 10px; height: 10px; border-radius: 50%; background: #3b82f6; border: 2px solid #fff; }
.history time { color: #64748b; font-size: 0.82rem; font-weight: 500; }
.history p { flex-basis: 100%; margin: 0; color: #334155; white-space: pre-wrap; overflow-wrap: anywhere; }
@media (max-width: 600px) { .summary dl { grid-template-columns: 1fr; } }
</style>
