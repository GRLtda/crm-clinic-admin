<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useHelpCenterStore } from '../../stores/help-center'
import { Plus, Pencil, Trash2, Eye, EyeOff, Search, FolderOpen, FileText, GripVertical } from 'lucide-vue-next'

const router = useRouter()
const store = useHelpCenterStore()

// State
const activeTab = ref('articles')
const searchQuery = ref('')
const filterCategory = ref('')
const filterStatus = ref('')

// Category modal
const showCategoryModal = ref(false)
const editingCategory = ref(null)
const categoryForm = ref({ name: '', icon: 'HelpCircle', description: '' })

onMounted(async () => {
  await Promise.all([store.fetchCategories(), store.fetchArticles()])
})

// Computed
const filteredArticles = computed(() => {
  let result = store.articles
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(a => a.title.toLowerCase().includes(q) || a.tags?.some(t => t.includes(q)))
  }
  if (filterCategory.value) {
    result = result.filter(a => a.category?._id === filterCategory.value)
  }
  if (filterStatus.value !== '') {
    const published = filterStatus.value === 'published'
    result = result.filter(a => a.published === published)
  }
  return result
})

// Category actions
function openCategoryModal(category = null) {
  if (category) {
    editingCategory.value = category
    categoryForm.value = { name: category.name, icon: category.icon || 'HelpCircle', description: category.description || '' }
  } else {
    editingCategory.value = null
    categoryForm.value = { name: '', icon: 'HelpCircle', description: '' }
  }
  showCategoryModal.value = true
}

async function saveCategory() {
  if (!categoryForm.value.name.trim()) return
  try {
    if (editingCategory.value) {
      await store.updateCategory(editingCategory.value._id, categoryForm.value)
    } else {
      await store.createCategory(categoryForm.value)
    }
    showCategoryModal.value = false
    await store.fetchCategories()
  } catch (e) { /* toast handled in store */ }
}

async function handleDeleteCategory(id) {
  if (!confirm('Tem certeza que deseja excluir esta categoria?')) return
  try {
    await store.deleteCategory(id)
  } catch (e) { /* toast handled in store */ }
}

// Article actions
function goToCreateArticle() {
  router.push('/help-center/new')
}

function goToEditArticle(id) {
  router.push(`/help-center/${id}/edit`)
}

async function handleDeleteArticle(id) {
  if (!confirm('Tem certeza que deseja excluir este artigo?')) return
  try {
    await store.deleteArticle(id)
  } catch (e) { /* toast handled in store */ }
}

async function handleTogglePublish(id) {
  try {
    await store.togglePublish(id)
  } catch (e) { /* toast handled in store */ }
}

function formatDate(date) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const iconOptions = [
  'HelpCircle', 'Users', 'Calendar', 'Settings', 'CreditCard',
  'UserCircle', 'BookOpen', 'Zap', 'Shield', 'Star', 'Bell', 'FileText'
]
</script>

<template>
  <div class="help-center-admin">
    <!-- Header -->
    <div class="page-header">
      <div class="header-info">
        <h1>Central de Ajuda</h1>
        <p class="subtitle">Gerencie categorias e artigos do Help Center.</p>
      </div>
      <button class="btn-primary" @click="activeTab === 'articles' ? goToCreateArticle() : openCategoryModal()">
        <Plus :size="18" />
        {{ activeTab === 'articles' ? 'Novo Artigo' : 'Nova Categoria' }}
      </button>
    </div>

    <!-- Tabs -->
    <div class="tabs-bar">
      <button class="tab-btn" :class="{ active: activeTab === 'articles' }" @click="activeTab = 'articles'">
        <FileText :size="16" /> Artigos ({{ store.totalArticles }})
      </button>
      <button class="tab-btn" :class="{ active: activeTab === 'categories' }" @click="activeTab = 'categories'">
        <FolderOpen :size="16" /> Categorias ({{ store.categories.length }})
      </button>
    </div>

    <!-- Articles Tab -->
    <div v-if="activeTab === 'articles'">
      <!-- Filters -->
      <div class="filters-bar">
        <div class="search-wrapper">
          <Search :size="16" class="search-icon" />
          <input v-model="searchQuery" type="text" placeholder="Buscar artigos..." class="search-input" />
        </div>
        <select v-model="filterCategory" class="filter-select">
          <option value="">Todas as categorias</option>
          <option v-for="cat in store.categories" :key="cat._id" :value="cat._id">{{ cat.name }}</option>
        </select>
        <select v-model="filterStatus" class="filter-select">
          <option value="">Todos os status</option>
          <option value="published">Publicados</option>
          <option value="draft">Rascunhos</option>
        </select>
      </div>

      <!-- Articles Table -->
      <div class="table-wrapper">
        <table v-if="filteredArticles.length > 0" class="data-table">
          <thead>
            <tr>
              <th>Título</th>
              <th>Categoria</th>
              <th>Status</th>
              <th>Atualizado em</th>
              <th class="actions-col">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="article in filteredArticles" :key="article._id">
              <td class="title-cell">
                <strong>{{ article.title }}</strong>
                <span v-if="article.tags?.length" class="tags-preview">
                  <span v-for="tag in article.tags.slice(0, 3)" :key="tag" class="tag-chip">{{ tag }}</span>
                </span>
              </td>
              <td>
                <span class="category-badge">{{ article.category?.name || '-' }}</span>
              </td>
              <td>
                <span class="status-badge" :class="article.published ? 'published' : 'draft'">
                  {{ article.published ? 'Publicado' : 'Rascunho' }}
                </span>
              </td>
              <td>{{ formatDate(article.updatedAt) }}</td>
              <td class="actions-col">
                <div class="action-buttons">
                  <button class="action-btn" @click="handleTogglePublish(article._id)" :title="article.published ? 'Despublicar' : 'Publicar'">
                    <Eye v-if="article.published" :size="16" />
                    <EyeOff v-else :size="16" />
                  </button>
                  <button class="action-btn" @click="goToEditArticle(article._id)" title="Editar">
                    <Pencil :size="16" />
                  </button>
                  <button class="action-btn danger" @click="handleDeleteArticle(article._id)" title="Excluir">
                    <Trash2 :size="16" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-state">
          <FileText :size="48" />
          <h3>Nenhum artigo encontrado</h3>
          <p>Crie seu primeiro artigo clicando no botão acima.</p>
        </div>
      </div>
    </div>

    <!-- Categories Tab -->
    <div v-if="activeTab === 'categories'">
      <div class="table-wrapper">
        <table v-if="store.categories.length > 0" class="data-table">
          <thead>
            <tr>
              <th style="width: 40px;"></th>
              <th>Nome</th>
              <th>Ícone</th>
              <th>Artigos</th>
              <th>Publicados</th>
              <th class="actions-col">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cat in store.categories" :key="cat._id">
              <td><GripVertical :size="16" class="grip-icon" /></td>
              <td>
                <strong>{{ cat.name }}</strong>
                <p v-if="cat.description" class="cell-description">{{ cat.description }}</p>
              </td>
              <td><span class="icon-preview">{{ cat.icon }}</span></td>
              <td>{{ cat.articleCount || 0 }}</td>
              <td>{{ cat.publishedCount || 0 }}</td>
              <td class="actions-col">
                <div class="action-buttons">
                  <button class="action-btn" @click="openCategoryModal(cat)" title="Editar">
                    <Pencil :size="16" />
                  </button>
                  <button class="action-btn danger" @click="handleDeleteCategory(cat._id)" title="Excluir">
                    <Trash2 :size="16" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-state">
          <FolderOpen :size="48" />
          <h3>Nenhuma categoria ainda</h3>
          <p>Crie sua primeira categoria para organizar os artigos.</p>
        </div>
      </div>
    </div>

    <!-- Category Modal -->
    <div v-if="showCategoryModal" class="modal-overlay" @click.self="showCategoryModal = false">
      <div class="modal-box">
        <h2>{{ editingCategory ? 'Editar Categoria' : 'Nova Categoria' }}</h2>
        <form @submit.prevent="saveCategory" class="modal-form">
          <div class="form-group">
            <label>Nome *</label>
            <input v-model="categoryForm.name" type="text" placeholder="Ex: Primeiros Passos" required />
          </div>
          <div class="form-group">
            <label>Ícone (Lucide)</label>
            <select v-model="categoryForm.icon">
              <option v-for="icon in iconOptions" :key="icon" :value="icon">{{ icon }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Descrição</label>
            <textarea v-model="categoryForm.description" placeholder="Descrição breve..." rows="3"></textarea>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="showCategoryModal = false">Cancelar</button>
            <button type="submit" class="btn-primary" :disabled="store.loading">
              {{ editingCategory ? 'Salvar' : 'Criar' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Loading overlay -->
    <div v-if="store.loading" class="loading-overlay">
      <div class="spinner"></div>
    </div>
  </div>
</template>

<style scoped>
.help-center-admin {
  position: relative;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}
.header-info h1 {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0;
}
.subtitle {
  color: var(--cinza-texto);
  margin: 0.25rem 0 0 0;
  font-size: 0.9rem;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background-color: var(--azul-principal);
  color: #fff;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s;
}
.btn-primary:hover { background-color: var(--azul-escuro); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-secondary {
  padding: 0.625rem 1.25rem;
  background-color: #f3f4f6;
  color: #374151;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s;
}
.btn-secondary:hover { background-color: #e5e7eb; }

/* Tabs */
.tabs-bar {
  display: flex;
  gap: 0.5rem;
  border-bottom: 2px solid #e5e7eb;
  margin-bottom: 1.5rem;
}
.tab-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  color: var(--cinza-texto);
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}
.tab-btn.active { color: var(--azul-principal); border-bottom-color: var(--azul-principal); }
.tab-btn:hover { color: var(--azul-principal); }

/* Filters */
.filters-bar {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}
.search-wrapper {
  position: relative;
  flex: 1;
  min-width: 200px;
}
.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--cinza-texto);
}
.search-input {
  width: 100%;
  padding: 0.625rem 0.75rem 0.625rem 2.25rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  background: #f9fafb;
  transition: all 0.2s;
}
.search-input:focus { outline: none; border-color: var(--azul-principal); background: #fff; box-shadow: 0 0 0 3px rgba(0, 87, 255, 0.1); }
.filter-select {
  padding: 0.625rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  background: #f9fafb;
  cursor: pointer;
  min-width: 160px;
}
.filter-select:focus { outline: none; border-color: var(--azul-principal); }

/* Table */
.table-wrapper {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  overflow: hidden;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
}
.data-table th {
  text-align: left;
  padding: 0.75rem 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--cinza-texto);
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}
.data-table td {
  padding: 0.875rem 1rem;
  border-bottom: 1px solid #f3f4f6;
  font-size: 0.875rem;
}
.data-table tbody tr:hover { background-color: #f9fafb; }
.data-table tbody tr:last-child td { border-bottom: none; }

.title-cell strong { display: block; margin-bottom: 0.25rem; }
.tags-preview { display: flex; gap: 0.25rem; flex-wrap: wrap; }
.tag-chip {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  background: #eef2ff;
  color: var(--azul-principal);
  font-size: 0.7rem;
  border-radius: 1rem;
  font-weight: 500;
}
.category-badge {
  display: inline-block;
  padding: 0.25rem 0.625rem;
  background: #f3f4f6;
  border-radius: 0.375rem;
  font-size: 0.8rem;
  font-weight: 500;
}
.status-badge {
  display: inline-block;
  padding: 0.25rem 0.625rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
}
.status-badge.published { background: #dcfce7; color: #16a34a; }
.status-badge.draft { background: #fef3c7; color: #d97706; }

.cell-description { color: var(--cinza-texto); font-size: 0.8rem; margin: 0.25rem 0 0 0; }
.icon-preview { font-family: monospace; font-size: 0.8rem; color: var(--cinza-texto); }
.grip-icon { color: #d1d5db; cursor: grab; }

.actions-col { width: 120px; text-align: right; }
.action-buttons { display: flex; gap: 0.25rem; justify-content: flex-end; }
.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 0.375rem;
  color: var(--cinza-texto);
  transition: all 0.2s;
}
.action-btn:hover { background: #f3f4f6; color: #374151; }
.action-btn.danger:hover { background: #fef2f2; color: #dc2626; }

/* Empty State */
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--cinza-texto);
}
.empty-state h3 { margin: 1rem 0 0.5rem; font-size: 1.125rem; color: #374151; }
.empty-state p { margin: 0; }

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-box {
  background: #fff;
  border-radius: 0.75rem;
  padding: 1.5rem;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}
.modal-box h2 { margin: 0 0 1.25rem 0; font-size: 1.25rem; }
.modal-form { display: flex; flex-direction: column; gap: 1rem; }
.form-group label { display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 0.375rem; color: #374151; }
.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-family: inherit;
  transition: border-color 0.2s;
}
.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus { outline: none; border-color: var(--azul-principal); box-shadow: 0 0 0 3px rgba(0, 87, 255, 0.1); }
.modal-actions { display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 0.5rem; }

/* Loading */
.loading-overlay {
  position: fixed;
  inset: 0;
  background: rgba(255, 255, 255, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}
.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top-color: var(--azul-principal);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
