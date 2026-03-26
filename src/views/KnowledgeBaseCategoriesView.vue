<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { FolderTree, Pencil, RefreshCcw, Trash2 } from 'lucide-vue-next'
import { useToast } from 'vue-toastification'
import AppButton from '@/components/global/AppButton.vue'
import FormInput from '@/components/global/FormInput.vue'
import {
  createKnowledgeCategory,
  deleteKnowledgeCategory,
  listKnowledgeCategories,
  updateKnowledgeCategory,
} from '@/api/knowledge-base'

const toast = useToast()

const categories = ref([])
const loading = ref(false)
const saving = ref(false)

const form = reactive({
  id: null,
  name: '',
  slug: '',
  displayOrder: 0,
})

const modeLabel = computed(() => (form.id ? 'Editar categoria' : 'Nova categoria'))

function resetForm() {
  form.id = null
  form.name = ''
  form.slug = ''
  form.displayOrder = 0
}

function startEditCategory(category) {
  form.id = category._id
  form.name = category.name || ''
  form.slug = category.slug || ''
  form.displayOrder = category.displayOrder || 0
}

async function fetchCategories() {
  const response = await listKnowledgeCategories()
  categories.value = response.data || []
}

async function refreshAll() {
  try {
    loading.value = true
    await fetchCategories()
  } catch (error) {
    console.error('[KnowledgeBaseCategoriesView] Erro ao carregar categorias:', error)
    toast.error('Não foi possível carregar as categorias.')
  } finally {
    loading.value = false
  }
}

async function submitCategory() {
  if (!form.name.trim()) {
    toast.warning('Informe o nome da categoria.')
    return
  }

  try {
    saving.value = true
    const payload = {
      name: form.name,
      slug: form.slug,
      displayOrder: form.displayOrder,
    }

    if (form.id) {
      await updateKnowledgeCategory(form.id, payload)
      toast.success('Categoria atualizada.')
    } else {
      await createKnowledgeCategory(payload)
      toast.success('Categoria criada.')
    }

    resetForm()
    await refreshAll()
  } catch (error) {
    console.error('[KnowledgeBaseCategoriesView] Erro ao salvar categoria:', error)
    toast.error(error.response?.data?.message || 'Erro ao salvar categoria.')
  } finally {
    saving.value = false
  }
}

async function removeCategory(category) {
  const confirmDelete = window.confirm(
    `Excluir a categoria "${category.name}"? As páginas dessa categoria tambem serao removidas.`
  )

  if (!confirmDelete) return

  try {
    await deleteKnowledgeCategory(category._id)
    toast.success('Categoria removida.')

    if (form.id === category._id) {
      resetForm()
    }

    await refreshAll()
  } catch (error) {
    console.error('[KnowledgeBaseCategoriesView] Erro ao remover categoria:', error)
    toast.error(error.response?.data?.message || 'Erro ao remover categoria.')
  }
}

onMounted(async () => {
  await refreshAll()
})
</script>

<template>
  <div class="knowledge-categories-view">
    <header class="page-header">
      <div>
        <h1 class="page-title">Categorias da Base de Conhecimento</h1>
        <p class="page-subtitle">
          Aqui você organiza as categorias da central de ajuda. O gerenciamento de páginas fica em outra aba.
        </p>
      </div>

      <div class="header-actions">
        <router-link class="text-link" to="/knowledge-base/pages">Gerenciar páginas</router-link>
        <AppButton variant="default" :loading="loading" @click="refreshAll">
          <RefreshCcw :size="16" />
          Atualizar
        </AppButton>
      </div>
    </header>

    <section class="card category-card">
      <div class="card-header">
        <h2>
          <FolderTree :size="18" />
          {{ modeLabel }}
        </h2>
      </div>

      <form class="form-grid" @submit.prevent="submitCategory">
        <FormInput v-model="form.name" label="Nome" placeholder="Ex: Agendamentos" required />
        <FormInput v-model="form.slug" label="Slug (opcional)" placeholder="Ex: agendamentos" />

        <label class="field-label">
          Ordem de exibição
          <input v-model.number="form.displayOrder" class="field-input" type="number" min="0" />
        </label>

        <div class="form-actions">
          <AppButton type="submit" variant="primary" :loading="saving">
            {{ form.id ? 'Salvar categoria' : 'Criar categoria' }}
          </AppButton>
          <AppButton v-if="form.id" type="button" variant="default" @click="resetForm">
            Cancelar
          </AppButton>
        </div>
      </form>

      <ul v-if="categories.length" class="category-list">
        <li v-for="category in categories" :key="category._id" class="category-item">
          <div class="category-info">
            <strong>{{ category.name }}</strong>
            <span>{{ category.slug || '-' }}</span>
          </div>

          <div class="category-meta">
            <span class="order-chip">Ordem {{ category.displayOrder || 0 }}</span>
            <div class="category-actions">
              <button type="button" class="icon-btn" @click="startEditCategory(category)">
                <Pencil :size="15" />
              </button>
              <button type="button" class="icon-btn danger" @click="removeCategory(category)">
                <Trash2 :size="15" />
              </button>
            </div>
          </div>
        </li>
      </ul>
      <p v-else class="empty-message">Nenhuma categoria criada ainda.</p>
    </section>
  </div>
</template>

<style scoped>
.knowledge-categories-view {
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
  font-size: 1.45rem;
  color: #0f172a;
}

.page-subtitle {
  margin: 0.35rem 0 0 0;
  color: #64748b;
  max-width: 760px;
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

.card {
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 1rem;
  box-shadow: 0 3px 16px rgba(15, 23, 42, 0.04);
}

.category-card {
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

.form-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
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
  gap: 1rem;
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

.category-meta {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.order-chip {
  font-size: 0.74rem;
  color: #64748b;
  background-color: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  padding: 0.2rem 0.5rem;
}

.category-actions {
  display: inline-flex;
  gap: 0.4rem;
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

.empty-message {
  margin: 1rem 0 0 0;
  color: #64748b;
  font-size: 0.86rem;
}

@media (max-width: 760px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
    justify-content: space-between;
  }

  .category-item {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
