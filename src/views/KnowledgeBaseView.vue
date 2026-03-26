<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { BookOpenCheck, FolderTree, Pencil, Plus, RefreshCcw, Trash2 } from 'lucide-vue-next'
import { useToast } from 'vue-toastification'
import AppButton from '@/components/global/AppButton.vue'
import FormInput from '@/components/global/FormInput.vue'
import AdminMarkdownEditor from '@/components/knowledge-base/AdminMarkdownEditor.vue'
import {
  createKnowledgeCategory,
  createKnowledgePage,
  deleteKnowledgeCategory,
  deleteKnowledgePage,
  getKnowledgePageById,
  listKnowledgeCategories,
  listKnowledgePages,
  updateKnowledgeCategory,
  updateKnowledgePage,
  uploadKnowledgeImage,
} from '@/api/knowledge-base'

const toast = useToast()

const categories = ref([])
const pages = ref([])

const loading = ref(false)
const savingCategory = ref(false)
const savingPage = ref(false)
const loadingSelectedPage = ref(false)
const deletingPage = ref(false)

const categoryForm = reactive({
  id: null,
  name: '',
  slug: '',
  displayOrder: 0,
})

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

const categoryModeLabel = computed(() => (categoryForm.id ? 'Editar categoria' : 'Nova categoria'))
const pageModeLabel = computed(() => (pageForm.id ? 'Editar página' : 'Nova página'))

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

const hasCategories = computed(() => categories.value.length > 0)

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

function resetCategoryForm() {
  categoryForm.id = null
  categoryForm.name = ''
  categoryForm.slug = ''
  categoryForm.displayOrder = 0
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
    console.error('[KnowledgeBaseView] Erro ao carregar dados:', error)
    toast.error('Não foi possível carregar a base de conhecimento.')
  } finally {
    loading.value = false
  }
}

function startEditCategory(category) {
  categoryForm.id = category._id
  categoryForm.name = category.name
  categoryForm.slug = category.slug
  categoryForm.displayOrder = category.displayOrder || 0
}

async function submitCategory() {
  if (!categoryForm.name.trim()) {
    toast.warning('Informe o nome da categoria.')
    return
  }

  try {
    savingCategory.value = true
    const payload = {
      name: categoryForm.name,
      slug: categoryForm.slug,
      displayOrder: categoryForm.displayOrder,
    }

    if (categoryForm.id) {
      await updateKnowledgeCategory(categoryForm.id, payload)
      toast.success('Categoria atualizada.')
    } else {
      await createKnowledgeCategory(payload)
      toast.success('Categoria criada.')
    }

    resetCategoryForm()
    await refreshAll()
  } catch (error) {
    console.error('[KnowledgeBaseView] Erro ao salvar categoria:', error)
    toast.error(error.response?.data?.message || 'Erro ao salvar categoria.')
  } finally {
    savingCategory.value = false
  }
}

async function removeCategory(category) {
  const confirmDelete = window.confirm(
    `Excluir a categoria "${category.name}"? As páginas dessa categoria também serão removidas.`
  )

  if (!confirmDelete) return

  try {
    await deleteKnowledgeCategory(category._id)
    toast.success('Categoria removida.')
    if (categoryForm.id === category._id) {
      resetCategoryForm()
    }
    if (pageForm.categoryId === category._id) {
      resetPageForm()
    }
    await refreshAll()
  } catch (error) {
    console.error('[KnowledgeBaseView] Erro ao remover categoria:', error)
    toast.error(error.response?.data?.message || 'Erro ao remover categoria.')
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
    console.error('[KnowledgeBaseView] Erro ao carregar página:', error)
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
    console.error('[KnowledgeBaseView] Erro ao salvar página:', error)
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
    console.error('[KnowledgeBaseView] Erro ao remover página:', error)
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
    console.error('[KnowledgeBaseView] Erro no upload da imagem:', error)
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
  <div class="knowledge-view">
    <header class="page-header">
      <div>
        <h1 class="page-title">Base de Conhecimento</h1>
        <p class="page-subtitle">
          Gerencie categorias e documentos em Markdown para a central de ajuda do Agenda Doutor.
        </p>
      </div>

      <div class="header-actions">
        <router-link class="text-link" to="/knowledge-base/categories">Categorias separadas</router-link>
        <router-link class="text-link" to="/knowledge-base/pages">Páginas separadas</router-link>
        <AppButton variant="default" :loading="loading" @click="refreshAll">
          <RefreshCcw :size="16" />
          Atualizar
        </AppButton>
      </div>
    </header>

    <div class="content-grid">
      <section class="card category-card">
        <div class="card-header">
          <h2>
            <FolderTree :size="18" />
            {{ categoryModeLabel }}
          </h2>
        </div>

        <form class="form-grid" @submit.prevent="submitCategory">
          <FormInput v-model="categoryForm.name" label="Nome" placeholder="Ex: Agendamentos" required />
          <FormInput
            v-model="categoryForm.slug"
            label="Slug (opcional)"
            placeholder="Ex: agendamentos"
          />

          <label class="field-label">
            Ordem de exibição
            <input v-model.number="categoryForm.displayOrder" class="field-input" type="number" min="0" />
          </label>

          <div class="form-actions">
            <AppButton type="submit" variant="primary" :loading="savingCategory">
              {{ categoryForm.id ? 'Salvar categoria' : 'Criar categoria' }}
            </AppButton>
            <AppButton
              v-if="categoryForm.id"
              type="button"
              variant="default"
              @click="resetCategoryForm"
            >
              Cancelar
            </AppButton>
          </div>
        </form>

        <ul v-if="categories.length" class="category-list">
          <li v-for="category in categories" :key="category._id" class="category-item">
            <div class="category-info">
              <strong>{{ category.name }}</strong>
              <span>{{ category.slug }}</span>
            </div>

            <div class="category-actions">
              <button type="button" class="icon-btn" @click="startEditCategory(category)">
                <Pencil :size="15" />
              </button>
              <button type="button" class="icon-btn danger" @click="removeCategory(category)">
                <Trash2 :size="15" />
              </button>
            </div>
          </li>
        </ul>
        <p v-else class="empty-message">Nenhuma categoria criada ainda.</p>
      </section>

      <section class="card page-list-card">
        <div class="card-header list-header">
          <h2>
            <BookOpenCheck :size="18" />
            Páginas
          </h2>
          <AppButton type="button" variant="secondary" size="sm" @click="startNewPage">
            <Plus :size="14" />
            Nova página
          </AppButton>
        </div>

        <div class="filters">
          <label class="field-label">
            Categoria
            <select v-model="filters.categoryId" class="field-input">
              <option value="">Todas</option>
              <option v-for="category in categories" :key="category._id" :value="category._id">
                {{ category.name }}
              </option>
            </select>
          </label>

          <label class="field-label">
            Status
            <select v-model="filters.status" class="field-input">
              <option value="">Todos</option>
              <option value="draft">Rascunho</option>
              <option value="published">Publicado</option>
              <option value="hidden">Oculto</option>
            </select>
          </label>

          <label class="field-label">
            Buscar
            <input v-model="filters.search" class="field-input" type="text" placeholder="Título ou slug" />
          </label>
        </div>

        <div class="pages-table-wrapper">
          <table v-if="filteredPages.length" class="pages-table">
            <thead>
              <tr>
                <th>Título</th>
                <th>Categoria</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="page in filteredPages"
                :key="page._id"
                class="table-row"
                @click="startEditPage(page._id)"
              >
                <td>
                  <strong>{{ page.title }}</strong>
                  <div class="slug-text">{{ page.slug }}</div>
                </td>
                <td>{{ page.category?.name || '-' }}</td>
                <td>
                  <span class="status-badge" :class="statusClass(page.status)">
                    {{ statusLabel(page.status) }}
                  </span>
                </td>
                <td>
                  <button type="button" class="icon-btn" @click.stop="startEditPage(page._id)">
                    <Pencil :size="15" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <p v-else class="empty-message">Nenhuma página encontrada com os filtros atuais.</p>
        </div>
      </section>

      <section class="card editor-card">
        <div class="card-header">
          <h2>{{ pageModeLabel }}</h2>
          <small v-if="loadingSelectedPage">Carregando página...</small>
        </div>

        <form class="editor-form" @submit.prevent="submitPage">
          <div class="editor-grid">
            <FormInput v-model="pageForm.title" label="Título" placeholder="Ex: Como agendar consulta" required />
            <FormInput
              v-model="pageForm.slug"
              label="Slug (opcional)"
              placeholder="Ex: como-agendar-consulta"
            />
          </div>

          <div class="editor-grid">
            <label class="field-label">
              Categoria
              <select v-model="pageForm.categoryId" class="field-input">
                <option disabled value="">Selecione</option>
                <option v-for="category in categories" :key="category._id" :value="category._id">
                  {{ category.name }}
                </option>
              </select>
            </label>

            <label class="field-label">
              Status
              <select v-model="pageForm.status" class="field-input">
                <option value="draft">Rascunho</option>
                <option value="published">Publicado</option>
                <option value="hidden">Oculto</option>
              </select>
            </label>
          </div>

          <div class="field-label markdown-field">
            Conteúdo Markdown
            <AdminMarkdownEditor
              v-model="pageForm.contentMarkdown"
              :upload-image="uploadEditorImage"
              :disabled="savingPage || loadingSelectedPage"
            />
          </div>

          <div class="editor-actions">
            <AppButton type="submit" variant="primary" :loading="savingPage">
              {{ pageForm.id ? 'Salvar alterações' : 'Criar página' }}
            </AppButton>

            <AppButton type="button" variant="default" @click="resetPageForm">
              Limpar formulário
            </AppButton>

            <AppButton
              v-if="pageForm.id"
              type="button"
              variant="dangerous"
              :loading="deletingPage"
              @click="removePage"
            >
              Excluir página
            </AppButton>
          </div>
        </form>
      </section>
    </div>
  </div>
</template>

<style scoped>
.knowledge-view {
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
  font-size: 1.55rem;
  color: #0f172a;
}

.page-subtitle {
  margin: 0.35rem 0 0 0;
  color: #64748b;
  max-width: 720px;
}

.header-actions {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
}

.text-link {
  color: #2563eb;
  font-size: 0.9rem;
  text-decoration: none;
  font-weight: 500;
}

.text-link:hover {
  text-decoration: underline;
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(340px, 420px) minmax(380px, 1fr);
  gap: 1rem;
  align-items: start;
}

.card {
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 1rem;
  box-shadow: 0 3px 16px rgba(15, 23, 42, 0.04);
}

.category-card,
.page-list-card {
  padding: 1rem;
}

.page-list-card {
  grid-column: 1 / 2;
}

.editor-card {
  grid-column: 2 / 3;
  grid-row: 1 / 3;
  padding: 1rem;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.9rem;
}

.card-header h2 {
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 1rem;
  color: #0f172a;
}

.card-header small {
  color: #64748b;
}

.form-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.form-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.category-list {
  margin: 1rem 0 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.category-item {
  border: 1px solid #e5e7eb;
  border-radius: 0.65rem;
  padding: 0.55rem 0.7rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.category-info {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.category-info strong {
  color: #111827;
  font-size: 0.9rem;
}

.category-info span {
  color: #64748b;
  font-size: 0.78rem;
}

.category-actions {
  display: inline-flex;
  gap: 0.4rem;
}

.filters {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.65rem;
  margin-bottom: 0.9rem;
}

.field-label {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.82rem;
  font-weight: 600;
  color: #374151;
}

.field-input {
  border: 1px solid #d1d5db;
  border-radius: 0.6rem;
  padding: 0.58rem 0.72rem;
  font-size: 0.88rem;
  background-color: #ffffff;
  color: #111827;
}

.field-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.17);
}

.pages-table-wrapper {
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  overflow: hidden;
}

.pages-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.86rem;
}

.pages-table th {
  text-align: left;
  background-color: #f8fafc;
  color: #64748b;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.65rem 0.75rem;
}

.pages-table td {
  padding: 0.7rem 0.75rem;
  border-top: 1px solid #eef2f7;
}

.table-row {
  cursor: pointer;
}

.table-row:hover {
  background-color: #f8fafc;
}

.slug-text {
  font-size: 0.74rem;
  color: #64748b;
  margin-top: 0.1rem;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.18rem 0.48rem;
  border-radius: 999px;
  font-size: 0.73rem;
  font-weight: 600;
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

.icon-btn {
  border: 1px solid #d1d5db;
  background-color: #ffffff;
  width: 28px;
  height: 28px;
  border-radius: 0.5rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
}

.icon-btn:hover {
  border-color: #3b82f6;
  color: #3b82f6;
}

.icon-btn.danger:hover {
  border-color: #ef4444;
  color: #ef4444;
}

.editor-form {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.editor-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.65rem;
}

.editor-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.markdown-field {
  font-weight: 600;
}

.empty-message {
  margin: 0;
  color: #64748b;
  font-size: 0.86rem;
  padding: 0.9rem;
}

@media (max-width: 1220px) {
  .content-grid {
    grid-template-columns: 1fr;
  }

  .editor-card {
    grid-column: auto;
    grid-row: auto;
  }

  .page-list-card {
    grid-column: auto;
  }
}

@media (max-width: 760px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .filters,
  .editor-grid {
    grid-template-columns: 1fr;
  }
}
</style>

