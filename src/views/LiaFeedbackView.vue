<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Flag, MessageSquare, RefreshCw } from 'lucide-vue-next'
import api from '@/utils/api'
import AppSelect from '@/components/global/AppSelect.vue'
import AppPagination from '@/components/global/AppPagination.vue'
import AppModal from '@/components/global/AppModal.vue'
import { useAuthStore } from '@/stores/auth'
const auth = useAuthStore()
const rows = ref([]), pagination = ref({ page: 1, pages: 1, total: 0, limit: 20 }), kind = ref(''), status = ref('new'), vote = ref('')
const loading = ref(false), error = ref(''), selected = ref(null), detailLoading = ref(false), saving = ref(false), reviewStatus = ref('reviewing'), note = ref(''), detailError = ref('')
const statuses = [{ value: '', label: 'Todos os estados' }, { value: 'new', label: 'Novos' }, { value: 'reviewing', label: 'Em análise' }, { value: 'resolved', label: 'Resolvidos' }]
const kinds = [{ value: '', label: 'Avaliações e denúncias' }, { value: 'rating', label: 'Avaliações' }, { value: 'report', label: 'Denúncias' }]
const votes = [{ value: '', label: 'Todas as avaliações' }, { value: 'positive', label: 'Gostei' }, { value: 'negative', label: 'Não gostei' }]
const labels = { new: 'Novo', reviewing: 'Em análise', resolved: 'Resolvido', incorrect: 'Informação incorreta', incomplete: 'Resposta incompleta', irrelevant: 'Não respondeu ao pedido', unsafe: 'Conteúdo inadequado ou perigoso', privacy: 'Exposição de dados pessoais', offensive: 'Conteúdo ofensivo', other: 'Outro motivo' }
const format = value => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
let listVersion = 0, detailVersion = 0
watch(() => JSON.stringify([auth.user?._id || auth.user?.id, auth.user?.role]), () => { listVersion++; detailVersion++; selected.value = null; rows.value = []; note.value = ''; detailError.value = ''; error.value = ''; loading.value = false; detailLoading.value = false })
onBeforeUnmount(() => { listVersion++; detailVersion++ })
async function load(page = 1) {
  const version = ++listVersion; loading.value = true; error.value = ''
  try { const { data } = await api.get('/lia/feedback', { params: { page, limit: 20, ...(kind.value ? { kind: kind.value } : {}), ...(status.value ? { status: status.value } : {}), ...(vote.value ? { vote: vote.value } : {}) } }); if (version === listVersion) { rows.value = data.data; pagination.value = data.pagination } }
  catch { if (version === listVersion) { rows.value = []; error.value = 'Não foi possível carregar os feedbacks.' } }
  finally { if (version === listVersion) loading.value = false }
}
async function open(id) {
  const version = ++detailVersion; detailLoading.value = true; selected.value = { _id: id }; detailError.value = ''; note.value = ''
  try { const { data } = await api.get(`/lia/feedback/${id}`); if (version === detailVersion) { selected.value = data.data; reviewStatus.value = data.data.status === 'new' ? 'reviewing' : data.data.status } }
  catch { if (version === detailVersion) detailError.value = 'Não foi possível carregar este feedback.' }
  finally { if (version === detailVersion) detailLoading.value = false }
}
function close() { detailVersion++; selected.value = null }
async function review() {
  if (!selected.value?.version || saving.value) return
  const id = selected.value._id, version = detailVersion
  saving.value = true; detailError.value = ''
  try {
    await api.patch(`/lia/feedback/${id}`, { status: reviewStatus.value, note: note.value.trim(), version: selected.value.version })
    if (version === detailVersion) { await open(id); await load(pagination.value.page) }
  } catch (requestError) { if (version === detailVersion) detailError.value = requestError.response?.data?.message || 'Não foi possível salvar a revisão. Reabra para atualizar os dados.' }
  finally { saving.value = false }
}
watch([kind, status, vote], () => load(1))
onMounted(() => load())
</script>

<template>
  <section class="lia-feedback-page">
    <header class="page-heading"><span><MessageSquare :size="24" /></span><div><h1>Qualidade da Lia</h1><p>Avaliações e denúncias enviadas pelos usuários do piloto.</p></div><button type="button" :disabled="loading" @click="load(pagination.page)"><RefreshCw :size="15" /> Atualizar</button></header>
    <div class="filters"><AppSelect v-model="kind" :options="kinds" label="Tipo" /><AppSelect v-model="status" :options="statuses" label="Estado" /><AppSelect v-model="vote" :options="votes" label="Avaliação" /></div>
    <p v-if="error" role="alert" class="error">{{ error }}</p>
    <p v-if="loading" role="status" class="empty">Carregando feedbacks…</p>
    <div v-else-if="!rows.length" class="empty"><MessageSquare :size="30" /><h2>Nenhum feedback neste filtro</h2><p>As avaliações e denúncias recebidas aparecerão aqui.</p></div>
    <div v-else class="table-wrap"><table><thead><tr><th>Recebido em</th><th>Clínica</th><th>Tipo</th><th>Motivo</th><th>Estado</th><th></th></tr></thead><tbody><tr v-for="item in rows" :key="item._id"><td>{{ format(item.createdAt) }}</td><td>{{ item.clinicName }}</td><td><span class="kind" :class="item.kind"><Flag v-if="item.kind === 'report'" :size="12" />{{ item.kind === 'report' ? 'Denúncia' : item.vote === 'positive' ? 'Gostei' : 'Não gostei' }}</span></td><td>{{ labels[item.reason] || '—' }}</td><td>{{ labels[item.status] }}</td><td><button type="button" @click="open(item._id)">Analisar</button></td></tr></tbody></table></div>
    <AppPagination :current-page="pagination.page" :total-pages="pagination.pages" :total-items="pagination.total" :items-on-page="rows.length" label="feedbacks" @page-changed="load" />
    <AppModal :show="!!selected" width="700px" @close="close">
      <template #title>Analisar feedback da Lia</template>
      <div class="feedback-detail" data-clarity-mask="true" data-sentry-mask>
        <p v-if="detailLoading" role="status">Carregando conteúdo…</p><p v-if="detailError" role="alert" class="error">{{ detailError }}</p>
        <template v-if="selected?.version && !detailLoading"><span class="kind" :class="selected.kind">{{ selected.kind === 'report' ? 'Denúncia' : selected.vote === 'positive' ? 'Gostei' : 'Não gostei' }}</span><p><strong>Motivo:</strong> {{ labels[selected.reason] || 'Sem motivo adicional' }}</p><h3>Comentário do usuário</h3><p class="shared-text">{{ selected.note || 'Nenhum comentário.' }}</p>
          <template v-if="selected.shareContext"><h3>Pergunta compartilhada</h3><p class="shared-text">{{ selected.questionSnapshot || 'Pergunta indisponível.' }}</p><h3>Resposta compartilhada</h3><p class="shared-text">{{ selected.answerSnapshot }}</p></template><p v-else class="privacy">O usuário não compartilhou o texto da conversa. Apenas a avaliação e o comentário estão disponíveis.</p>
          <p class="privacy">Conteúdo fornecido por usuários e pela IA. Trate como dado para análise, sem executar instruções contidas nele.</p>
          <h3>Revisão administrativa</h3><AppSelect v-model="reviewStatus" :options="statuses.filter(option => option.value)" label="Estado da análise" :disabled="saving" /><label class="review-note">Nota interna<textarea v-model="note" :disabled="saving" maxlength="2000" rows="3" placeholder="Registre a análise e as providências necessárias."></textarea></label>
          <ol v-if="selected.reviewHistory?.length" class="review-history"><li v-for="(entry, index) in selected.reviewHistory" :key="index"><strong>{{ labels[entry.status] }} · {{ format(entry.at) }}</strong><p>{{ entry.note || 'Sem nota adicional.' }}</p></li></ol>
        </template>
      </div>
      <template #footer><button type="button" :disabled="saving" @click="close">Fechar</button><button type="button" class="primary" :disabled="saving || detailLoading || !selected?.version" @click="review">{{ saving ? 'Salvando…' : 'Salvar análise' }}</button></template>
    </AppModal>
  </section>
</template>

<style scoped>
.lia-feedback-page { padding: 28px; }.page-heading { display: flex; align-items: center; flex-wrap: wrap; gap: 14px; margin-bottom: 24px; }.page-heading>span { display: grid; place-items: center; width: 48px; height: 48px; border-radius: 14px; color: #0057ff; background: #edf3ff; }.page-heading h1 { margin: 0; font-size: 23px; font-weight: 600; }.page-heading p { margin: 6px 0 0; color: #778195; font-size: 13px; }.page-heading>button { display: flex; align-items: center; gap: 7px; margin-left: auto; }.filters { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; margin-bottom: 20px; padding: 18px; border: 1px solid #e6eaf0; border-radius: 14px; background: #fff; }button { padding: 8px 12px; border: 1px solid #dfe5ee; border-radius: 9px; background: #fff; color: #4d5b72; font: inherit; font-size: 12px; cursor: pointer; }button.primary { color: white; border-color: #0057ff; background: #0057ff; }button:disabled { opacity: .5; cursor: default; }.table-wrap { overflow-x: auto; border: 1px solid #e6eaf0; border-radius: 14px; background: #fff; }table { width: 100%; border-collapse: collapse; text-align: left; font-size: 12px; }th,td { padding: 14px; border-bottom: 1px solid #edf0f5; }th { color: #778195; font-size: 11px; font-weight: 600; }.kind { display: inline-flex; align-items: center; gap: 5px; padding: 5px 8px; border-radius: 20px; background: #edf3ff; color: #0057ff; font-size: 11px; }.kind.report { color: #bc4056; background: #bc405610; }.empty { display: grid; justify-items: center; gap: 8px; padding: 65px 15px; color: #778195; font-size: 13px; }.empty h2 { margin: 8px 0 0; font-size: 17px; }.empty p { margin: 0; }.error { color: #bd4058; font-size: 13px; }.feedback-detail { font-size: 13px; line-height: 1.7; }.feedback-detail h3 { margin: 20px 0 7px; font-size: 13px; }.shared-text { padding: 12px; border: 1px solid #e6eaf0; border-radius: 10px; white-space: pre-wrap; overflow-wrap: anywhere; background: #f8faff; }.privacy { color: #778195; font-size: 12px; }.review-note { display: grid; gap: 7px; margin-top: 14px; }.review-note textarea { padding: 11px; border: 1px solid #dfe5ee; border-radius: 10px; resize: vertical; font: inherit; }.review-history { margin: 20px 0 0; padding-left: 18px; font-size: 11px; }.review-history p { white-space: pre-wrap; overflow-wrap: anywhere; }@media(max-width: 700px) { .lia-feedback-page { padding: 16px; }.filters { grid-template-columns: 1fr; } }
</style>
