<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { BookOpenCheck, Plus, RefreshCcw, Settings2, Trash2 } from 'lucide-vue-next'
import { useToast } from 'vue-toastification'
import AppButton from '@/components/global/AppButton.vue'
import AppSelect from '@/components/global/AppSelect.vue'
import FormInput from '@/components/global/FormInput.vue'
import AdminMarkdownEditor from '@/components/knowledge-base/AdminMarkdownEditor.vue'
import {
  createKnowledgePage,
  deleteKnowledgePage,
  getKnowledgePageById,
  listKnowledgeCategories,
  listKnowledgePages,
  updateKnowledgePage,
  uploadKnowledgeImage,
} from '@/api/knowledge-base'

const toast = useToast()

const categories = ref([])
const pages = ref([])

const loading = ref(false)
const savingPage = ref(false)
const loadingSelectedPage = ref(false)
const deletingPage = ref(false)

const pageForm = reactive({
  id: null,
  categoryId: '',
  title: '',
  slug: '',
  status: 'draft',
  contentMarkdown: '',
})

const filters = reactive({
  categoryId: '',
  status: '',
  search: '',
})

const pageModeLabel = computed(() => (pageForm.id ? 'Editando página' : 'Nova página'))
const hasCategories = computed(() => categories.value.length > 0)

const categoryFilterOptions = computed(() => [
  { value: '', label: 'Todas' },
  ...categories.value.map((category) => ({
    value: category._id,
    label: category.name,
  })),
])

const filterStatusOptions = [
  { value: '', label: 'Todos' },
  { value: 'draft', label: 'Rascunho' },
  { value: 'published', label: 'Publicado' },
  { value: 'hidden', label: 'Oculto' },
]

const pageStatusOptions = [
  { value: 'draft', label: 'Rascunho' },
  { value: 'published', label: 'Publicado' },
  { value: 'hidden', label: 'Oculto' },
]

const pageCategoryOptions = computed(() =>
  categories.value.map((category) => ({
    value: category._id,
    label: category.name,
  }))
)

const filteredPages = computed(() => {
  const query = filters.search.trim().toLowerCase()

  return pages.value.filter((page) => {
    const matchesCategory = !filters.categoryId || page.category?._id === filters.categoryId
    const matchesStatus = !filters.status || page.status === filters.status
    const matchesSearch =
      !query ||
      page.title.toLowerCase().includes(query) ||
      page.slug.toLowerCase().includes(query) ||
      page.category?.name?.toLowerCase().includes(query)

    return matchesCategory && matchesStatus && matchesSearch
  })
})

function statusLabel(status) {
  if (status === 'published') return 'Publicado'
  if (status === 'hidden') return 'Oculto'
  return 'Rascunho'
}

function statusClass(status) {
  if (status === 'published') return 'badge-published'
  if (status === 'hidden') return 'badge-hidden'
  return 'badge-draft'
}

function resetPageForm() {
  pageForm.id = null
  pageForm.title = ''
  pageForm.slug = ''
  pageForm.status = 'draft'
  pageForm.contentMarkdown = ''
  pageForm.categoryId = categories.value[0]?._id || ''
}

function applyPagePayload(payload) {
  pageForm.id = payload._id
  pageForm.title = payload.title || ''
  pageForm.slug = payload.slug || ''
  pageForm.status = payload.status || 'draft'
  pageForm.contentMarkdown = payload.contentMarkdown || ''
  pageForm.categoryId = payload.category?._id || payload.category || categories.value[0]?._id || ''
}

async function fetchCategories() {
  const response = await listKnowledgeCategories()
  categories.value = response.data || []
}

async function fetchPages() {
  const response = await listKnowledgePages()
  pages.value = response.data || []
}

async function refreshAll() {
  try {
    loading.value = true
    await Promise.all([fetchCategories(), fetchPages()])

    if (!pageForm.categoryId && categories.value.length > 0) {
      pageForm.categoryId = categories.value[0]._id
    }
  } catch (error) {
    console.error('[KnowledgeBasePagesView] Erro ao carregar dados:', error)
    toast.error('Não foi possível carregar as páginas da base de conhecimento.')
  } finally {
    loading.value = false
  }
}

async function startNewPage() {
  if (!hasCategories.value) {
    toast.warning('Crie ao menos uma categoria antes de adicionar páginas.')
    return
  }
  resetPageForm()
}

async function startEditPage(pageId) {
  try {
    loadingSelectedPage.value = true
    const response = await getKnowledgePageById(pageId)
    applyPagePayload(response.data)
  } catch (error) {
    console.error('[KnowledgeBasePagesView] Erro ao carregar página:', error)
    toast.error('Não foi possível carregar os dados da página.')
  } finally {
    loadingSelectedPage.value = false
  }
}

async function submitPage() {
  if (!hasCategories.value) {
    toast.warning('Você precisa de pelo menos uma categoria.')
    return
  }

  if (!pageForm.title.trim()) {
    toast.warning('Informe o título da página.')
    return
  }

  if (!pageForm.categoryId) {
    toast.warning('Selecione uma categoria.')
    return
  }

  try {
    savingPage.value = true
    const isEditing = Boolean(pageForm.id)

    const payload = {
      categoryId: pageForm.categoryId,
      title: pageForm.title,
      slug: pageForm.slug,
      status: pageForm.status,
      contentMarkdown: pageForm.contentMarkdown,
    }

    const response = isEditing
      ? await updateKnowledgePage(pageForm.id, payload)
      : await createKnowledgePage(payload)

    await fetchPages()
    applyPagePayload(response.data)

    toast.success(isEditing ? 'Página atualizada.' : 'Página criada.')
  } catch (error) {
    console.error('[KnowledgeBasePagesView] Erro ao salvar página:', error)
    toast.error(error.response?.data?.message || 'Erro ao salvar página.')
  } finally {
    savingPage.value = false
  }
}

async function removePage() {
  if (!pageForm.id) return

  const confirmDelete = window.confirm(`Excluir a página "${pageForm.title}"?`)
  if (!confirmDelete) return

  try {
    deletingPage.value = true
    await deleteKnowledgePage(pageForm.id)
    toast.success('Página removida.')
    resetPageForm()
    await fetchPages()
  } catch (error) {
    console.error('[KnowledgeBasePagesView] Erro ao remover página:', error)
    toast.error(error.response?.data?.message || 'Erro ao remover página.')
  } finally {
    deletingPage.value = false
  }
}

async function uploadEditorImage(file, altText) {
  try {
    const response = await uploadKnowledgeImage(file, altText)
    return response.data?.url
  } catch (error) {
    console.error('[KnowledgeBasePagesView] Erro no upload da imagem:', error)
    toast.error(error.response?.data?.message || 'Erro ao enviar imagem.')
    return null
  }
}

onMounted(async () => {
  await refreshAll()
  resetPageForm()
})
</script>

<template>
  <div class="knowledge-pages-view">
    <header class="page-header">
      <div>
        <h1 class="page-title">Páginas da Base de Conhecimento</h1>
        <p class="page-subtitle">
          Fluxo focado em escrita: lista à esquerda, conteúdo no meio e configurações na direita.
        </p>
      </div>

      <div class="header-actions">
        <AppButton variant="default" :loading="loading" @click="refreshAll">
          <RefreshCcw :size="16" />
          Atualizar
        </AppButton>
      </div>
    </header>

    <div v-if="!hasCategories" class="card empty-state">
      <p>
        Você ainda não possui categorias. Crie a primeira em
        <router-link class="inline-link" to="/knowledge-base/categories">Categorias</router-link>.
      </p>
    </div>

    <div v-else class="workspace-grid">
      <section class="card list-panel">
        <div class="panel-top">
          <h2 class="panel-title">
            <BookOpenCheck :size="18" />
            Páginas
          </h2>
          <AppButton type="button" variant="secondary" size="sm" @click="startNewPage">
            <Plus :size="14" />
            Nova página
          </AppButton>
        </div>

        <div class="filters-grid">
          <AppSelect
            v-model="filters.categoryId"
            label="Categoria"
            :options="categoryFilterOptions"
            default-option="Todas"
          />

          <AppSelect
            v-model="filters.status"
            label="Status"
            :options="filterStatusOptions"
            default-option="Todos"
          />

          <label class="field-label">
            Buscar
            <input v-model="filters.search" class="field-input" type="text" placeholder="Título ou slug" />
          </label>
        </div>

        <div v-if="filteredPages.length" class="page-list">
          <button
            v-for="page in filteredPages"
            :key="page._id"
            type="button"
            class="page-item"
            :class="{ active: page._id === pageForm.id }"
            @click="startEditPage(page._id)"
          >
            <div class="page-item-top">
              <span class="page-item-title">{{ page.title }}</span>
              <span class="status-badge" :class="statusClass(page.status)">
                {{ statusLabel(page.status) }}
              </span>
            </div>
            <div class="page-item-meta">
              <span>{{ page.category?.name || 'Sem categoria' }}</span>
              <span>{{ page.slug || '-' }}</span>
            </div>
          </button>
        </div>

        <p v-else class="empty-message">Nenhuma página encontrada com os filtros atuais.</p>
      </section>

      <section class="card editor-panel">
        <div class="panel-top panel-top-editor">
          <div>
            <h2 class="panel-title">Conteúdo Markdown</h2>
            <p class="panel-note">Escreva com foco total no artigo. As configurações ficam ao lado.</p>
          </div>
          <span class="mode-chip">{{ pageModeLabel }}</span>
        </div>

        <AdminMarkdownEditor
          v-model="pageForm.contentMarkdown"
          class="editor-component"
          :upload-image="uploadEditorImage"
          :disabled="savingPage || loadingSelectedPage"
        />
      </section>

      <aside class="card settings-panel">
        <div class="panel-top">
          <h2 class="panel-title panel-title-settings">
            <Settings2 :size="17" />
            Editar página
          </h2>
          <small v-if="loadingSelectedPage" class="loading-hint">Carregando...</small>
        </div>

        <form class="settings-form" @submit.prevent="submitPage">
          <FormInput v-model="pageForm.title" label="Título" placeholder="Ex: Como agendar consulta" required />

          <FormInput
            v-model="pageForm.slug"
            label="Slug (opcional)"
            placeholder="Ex: como-agendar-consulta"
          />

          <AppSelect
            v-model="pageForm.categoryId"
            label="Categoria"
            :options="pageCategoryOptions"
            default-option="Selecione"
          />

          <AppSelect
            v-model="pageForm.status"
            label="Status"
            :options="pageStatusOptions"
            default-option="Rascunho"
          />

          <div class="settings-tip">
            Dica: publique apenas quando o conteúdo estiver revisado. Rascunho e oculto não aparecem para clientes.
          </div>

          <div class="settings-actions">
            <AppButton type="submit" variant="primary" :loading="savingPage" class="btn-full">
              {{ pageForm.id ? 'Salvar alterações' : 'Criar página' }}
            </AppButton>

            <AppButton type="button" variant="default" @click="resetPageForm" class="btn-full">
              Limpar formulário
            </AppButton>

            <AppButton
              v-if="pageForm.id"
              type="button"
              variant="dangerous"
              :loading="deletingPage"
              class="btn-full"
              @click="removePage"
            >
              <Trash2 :size="14" />
              Excluir página
            </AppButton>
          </div>
        </form>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.knowledge-pages-view {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.page-title {
  margin: 0;
  font-size: 1.4rem;
  line-height: 1.1;
  color: #0f172a;
  font-weight: 600;
}

.page-subtitle {
  margin: 0.4rem 0 0 0;
  color: #64748b;
  max-width: 760px;
  font-size: 0.92rem;
}

.header-actions {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
}

.text-link,
.inline-link {
  color: #2563eb;
  text-decoration: none;
  font-weight: 500;
}

.text-link:hover,
.inline-link:hover {
  text-decoration: underline;
}

.workspace-grid {
  display: grid;
  grid-template-columns: minmax(290px, 340px) minmax(0, 1fr) minmax(300px, 350px);
  gap: 1rem;
  align-items: start;
}

.card {
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 1rem;
  box-shadow: 0 3px 16px rgba(15, 23, 42, 0.04);
  padding: 1rem;
}

.panel-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.7rem;
  margin-bottom: 0.9rem;
}

.panel-title {
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 1rem;
  color: #0f172a;
  font-weight: 600;
}

.panel-title-settings {
  font-size: 0.96rem;
}

.panel-note {
  margin: 0.35rem 0 0 0;
  color: #64748b;
  font-size: 0.82rem;
}

.loading-hint {
  color: #64748b;
  font-size: 0.75rem;
}

.mode-chip {
  display: inline-flex;
  align-items: center;
  border: 1px solid #dbe4ff;
  background-color: #eef2ff;
  color: #1d4ed8;
  border-radius: 999px;
  padding: 0.2rem 0.55rem;
  font-size: 0.73rem;
  font-weight: 500;
}

.list-panel {
  min-height: 640px;
  display: flex;
  flex-direction: column;
}

.filters-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.65rem;
  margin-bottom: 0.8rem;
}

.field-label {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.82rem;
  font-weight: 500;
  color: #374151;
}

.field-input {
  border: 1px solid #d1d5db;
  border-radius: 0.75rem;
  padding: 0.7rem 0.82rem;
  font-size: 0.88rem;
  background-color: #ffffff;
  color: #111827;
}

.field-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.16);
}

.page-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 560px;
  overflow-y: auto;
  padding-right: 0.2rem;
}

.page-item {
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 0.6rem 0.65rem;
  background-color: #ffffff;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
}

.page-item:hover {
  border-color: #bfdbfe;
  box-shadow: 0 2px 10px rgba(37, 99, 235, 0.12);
  transform: translateY(-1px);
}

.page-item.active {
  border-color: #93c5fd;
  background-color: #eff6ff;
}

.page-item-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.45rem;
}

.page-item-title {
  color: #0f172a;
  font-size: 0.9rem;
  font-weight: 500;
  line-height: 1.3;
}

.page-item-meta {
  margin-top: 0.32rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  color: #64748b;
  font-size: 0.75rem;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.16rem 0.48rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 500;
}

.badge-draft {
  background-color: #f1f5f9;
  color: #475569;
}

.badge-published {
  background-color: #dcfce7;
  color: #166534;
}

.badge-hidden {
  background-color: #fee2e2;
  color: #991b1b;
}

.editor-panel {
  min-height: 640px;
  display: flex;
  flex-direction: column;
}

.panel-top-editor {
  margin-bottom: 0.65rem;
}

.editor-component {
  flex: 1;
  min-height: 0;
}

.editor-panel :deep(.markdown-editor) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.editor-panel :deep(.editor-input) {
  flex: 1;
  min-height: 560px;
}

.settings-panel {
  position: sticky;
  top: 0;
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.settings-tip {
  background-color: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 0.6rem 0.7rem;
  color: #64748b;
  font-size: 0.77rem;
  line-height: 1.45;
}

.settings-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.btn-full {
  width: 100%;
}

.empty-state p,
.empty-message {
  margin: 0;
  color: #64748b;
  font-size: 0.86rem;
}

@media (max-width: 1380px) {
  .workspace-grid {
    grid-template-columns: minmax(270px, 320px) minmax(0, 1fr);
  }

  .settings-panel {
    grid-column: 1 / -1;
    position: static;
  }

  .settings-actions {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .btn-full {
    width: auto;
  }
}

@media (max-width: 980px) {
  .workspace-grid {
    grid-template-columns: 1fr;
  }

  .list-panel,
  .editor-panel {
    min-height: auto;
  }

  .editor-panel :deep(.editor-input) {
    min-height: 420px;
  }
}

@media (max-width: 760px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
