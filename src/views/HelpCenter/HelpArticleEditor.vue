<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useHelpCenterStore } from '../../stores/help-center'
import { ArrowLeft, Save, Eye, Image, Upload, Bold, Italic, Heading, List, Link, Code, AlertTriangle } from 'lucide-vue-next'
import { marked } from 'marked'

const route = useRoute()
const router = useRouter()
const store = useHelpCenterStore()

const isEditing = computed(() => !!route.params.id)
const articleId = computed(() => route.params.id)

// Form state
const form = ref({
  title: '',
  category: '',
  content: '',
  excerpt: '',
  coverImage: '',
  published: false,
  tags: '',
})

const showPreview = ref(false)
const saving = ref(false)
const uploadingImage = ref(false)
const imageInput = ref(null)

// Load data
onMounted(async () => {
  await store.fetchCategories()

  if (isEditing.value) {
    const article = await store.fetchArticle(articleId.value)
    if (article) {
      form.value = {
        title: article.title || '',
        category: article.category?._id || article.category || '',
        content: article.content || '',
        excerpt: article.excerpt || '',
        coverImage: article.coverImage || '',
        published: article.published || false,
        tags: Array.isArray(article.tags) ? article.tags.join(', ') : '',
      }
    }
  }
})

// Markdown preview
const renderedContent = computed(() => {
  if (!form.value.content) return '<p style="color: #9ca3af;">Comece a escrever no editor...</p>'
  try {
    return marked(form.value.content)
  } catch (e) {
    return '<p style="color: #dc2626;">Erro ao renderizar markdown</p>'
  }
})

// Save
async function handleSave() {
  if (!form.value.title.trim()) return
  if (!form.value.category) return
  if (!form.value.content.trim()) return

  saving.value = true
  try {
    const payload = {
      title: form.value.title,
      category: form.value.category,
      content: form.value.content,
      excerpt: form.value.excerpt || undefined,
      coverImage: form.value.coverImage || undefined,
      published: form.value.published,
      tags: form.value.tags,
    }

    if (isEditing.value) {
      await store.updateArticle(articleId.value, payload)
    } else {
      const created = await store.createArticle(payload)
      if (created) {
        router.replace(`/help-center/${created._id}/edit`)
      }
    }
  } catch (e) { /* toast handled in store */ }
  finally {
    saving.value = false
  }
}

// Image upload
function triggerImageUpload() {
  imageInput.value?.click()
}

async function handleImageUpload(event) {
  const file = event.target.files?.[0]
  if (!file) return

  uploadingImage.value = true
  try {
    const result = await store.uploadImage(file)
    if (result?.url) {
      // Insere a imagem no markdown na posição do cursor
      const textarea = document.getElementById('markdown-editor')
      const cursorPos = textarea?.selectionStart || form.value.content.length
      const imageMarkdown = `\n![${file.name}](${result.url})\n`
      form.value.content =
        form.value.content.substring(0, cursorPos) +
        imageMarkdown +
        form.value.content.substring(cursorPos)
    }
  } catch (e) { /* toast handled in store */ }
  finally {
    uploadingImage.value = false
    if (imageInput.value) imageInput.value.value = ''
  }
}

// Markdown toolbar helpers
function insertMarkdown(prefix, suffix = '', placeholder = '') {
  const textarea = document.getElementById('markdown-editor')
  if (!textarea) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selectedText = form.value.content.substring(start, end)
  const insertion = selectedText || placeholder

  form.value.content =
    form.value.content.substring(0, start) +
    prefix + insertion + suffix +
    form.value.content.substring(end)

  // Reposiciona o cursor
  const newPos = start + prefix.length + insertion.length + suffix.length
  setTimeout(() => {
    textarea.focus()
    textarea.setSelectionRange(newPos, newPos)
  }, 0)
}

function goBack() {
  router.push('/help-center')
}
</script>

<template>
  <div class="article-editor">
    <!-- Header -->
    <div class="editor-header">
      <button class="back-btn" @click="goBack">
        <ArrowLeft :size="18" />
        Voltar
      </button>
      <h1>{{ isEditing ? 'Editar Artigo' : 'Novo Artigo' }}</h1>
      <div class="header-actions">
        <label class="publish-toggle">
          <input type="checkbox" v-model="form.published" />
          <span>{{ form.published ? 'Publicado' : 'Rascunho' }}</span>
        </label>
        <button class="btn-outline" @click="showPreview = !showPreview">
          <Eye :size="16" />
          {{ showPreview ? 'Editor' : 'Preview' }}
        </button>
        <button class="btn-primary" @click="handleSave" :disabled="saving">
          <Save :size="16" />
          {{ saving ? 'Salvando...' : 'Salvar' }}
        </button>
      </div>
    </div>

    <!-- Editor Content -->
    <div class="editor-body">
      <!-- Sidebar -->
      <aside class="editor-sidebar">
        <div class="form-group">
          <label>Título *</label>
          <input v-model="form.title" type="text" placeholder="Título do artigo..." />
        </div>

        <div class="form-group">
          <label>Categoria *</label>
          <select v-model="form.category">
            <option value="" disabled>Selecione uma categoria...</option>
            <option v-for="cat in store.categories" :key="cat._id" :value="cat._id">{{ cat.name }}</option>
          </select>
        </div>

        <div class="form-group">
          <label>Resumo</label>
          <textarea v-model="form.excerpt" placeholder="Resumo curto para cards..." rows="3"></textarea>
        </div>

        <div class="form-group">
          <label>Tags</label>
          <input v-model="form.tags" type="text" placeholder="tag1, tag2, tag3..." />
          <span class="field-hint">Separadas por vírgula</span>
        </div>

        <div class="form-group">
          <label>Imagem de Capa</label>
          <input v-model="form.coverImage" type="text" placeholder="URL da imagem de capa..." />
        </div>
      </aside>

      <!-- Main Editor -->
      <main class="editor-main">
        <!-- Toolbar -->
        <div v-if="!showPreview" class="editor-toolbar">
          <button type="button" @click="insertMarkdown('**', '**', 'negrito')" title="Negrito"><Bold :size="16" /></button>
          <button type="button" @click="insertMarkdown('*', '*', 'itálico')" title="Itálico"><Italic :size="16" /></button>
          <button type="button" @click="insertMarkdown('## ', '', 'Título')" title="Título"><Heading :size="16" /></button>
          <button type="button" @click="insertMarkdown('\n- ', '', 'item da lista')" title="Lista"><List :size="16" /></button>
          <button type="button" @click="insertMarkdown('[', '](url)', 'texto do link')" title="Link"><Link :size="16" /></button>
          <button type="button" @click="insertMarkdown('`', '`', 'código')" title="Código"><Code :size="16" /></button>
          <button type="button" @click="insertMarkdown('\n> [!TIP]\n> ', '', 'dica importante')" title="Bloco de Dica"><AlertTriangle :size="16" /></button>
          <div class="toolbar-separator"></div>
          <button type="button" @click="triggerImageUpload" :disabled="uploadingImage" title="Upload de Imagem">
            <Upload v-if="!uploadingImage" :size="16" />
            <span v-else class="mini-spinner"></span>
            Imagem
          </button>
          <input ref="imageInput" type="file" accept="image/*" style="display: none;" @change="handleImageUpload" />
        </div>

        <!-- Editor / Preview -->
        <div class="editor-content-area">
          <textarea
            v-if="!showPreview"
            id="markdown-editor"
            v-model="form.content"
            placeholder="# Título do artigo&#10;&#10;Escreva o conteúdo em Markdown..."
            class="markdown-textarea"
          ></textarea>
          <div v-else class="markdown-preview" v-html="renderedContent"></div>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.article-editor {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 80px);
}

/* Header */
.editor-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 1rem;
  flex-shrink: 0;
}
.editor-header h1 {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
  flex: 1;
}
.back-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
  background: none;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  color: #374151;
  transition: all 0.2s;
}
.back-btn:hover { background: #f3f4f6; }
.header-actions { display: flex; align-items: center; gap: 0.75rem; }
.publish-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  user-select: none;
}
.publish-toggle input {
  accent-color: var(--azul-principal);
  width: 16px;
  height: 16px;
}
.btn-outline {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  transition: all 0.2s;
}
.btn-outline:hover { border-color: var(--azul-principal); color: var(--azul-principal); }
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  background: var(--azul-principal);
  color: #fff;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  transition: background 0.2s;
}
.btn-primary:hover { background: var(--azul-escuro); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

/* Body Layout */
.editor-body {
  display: flex;
  gap: 1.5rem;
  flex: 1;
  min-height: 0;
}

/* Sidebar */
.editor-sidebar {
  width: 280px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow-y: auto;
}
.form-group label {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 0.375rem;
  color: #374151;
}
.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-family: inherit;
  transition: border-color 0.2s;
}
.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--azul-principal);
  box-shadow: 0 0 0 3px rgba(0, 87, 255, 0.1);
}
.field-hint { font-size: 0.7rem; color: var(--cinza-texto); margin-top: 0.25rem; display: block; }

/* Main Editor */
.editor-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  overflow: hidden;
}

/* Toolbar */
.editor-toolbar {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  flex-wrap: wrap;
}
.editor-toolbar button {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.5rem;
  background: none;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  color: #374151;
  font-size: 0.8rem;
  transition: all 0.15s;
}
.editor-toolbar button:hover { background: #e5e7eb; }
.editor-toolbar button:disabled { opacity: 0.5; cursor: not-allowed; }
.toolbar-separator { width: 1px; height: 24px; background: #e5e7eb; margin: 0 0.25rem; }

/* Editor area */
.editor-content-area {
  flex: 1;
  min-height: 0;
}
.markdown-textarea {
  width: 100%;
  height: 100%;
  padding: 1rem;
  border: none;
  resize: none;
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
  font-size: 0.875rem;
  line-height: 1.6;
  color: #1f2937;
  background: #fff;
}
.markdown-textarea:focus { outline: none; }
.markdown-textarea::placeholder { color: #d1d5db; }

/* Preview */
.markdown-preview {
  padding: 1.5rem;
  overflow-y: auto;
  height: 100%;
  line-height: 1.7;
  color: #374151;
}
.markdown-preview :deep(h1) { font-size: 1.75rem; margin: 1.5rem 0 1rem; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.5rem; }
.markdown-preview :deep(h2) { font-size: 1.375rem; margin: 1.25rem 0 0.75rem; }
.markdown-preview :deep(h3) { font-size: 1.125rem; margin: 1rem 0 0.5rem; }
.markdown-preview :deep(p) { margin: 0.75rem 0; }
.markdown-preview :deep(ul), .markdown-preview :deep(ol) { padding-left: 1.5rem; margin: 0.75rem 0; }
.markdown-preview :deep(li) { margin: 0.375rem 0; }
.markdown-preview :deep(code) { background: #f3f4f6; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.875em; font-family: monospace; }
.markdown-preview :deep(pre) { background: #1f2937; color: #e5e7eb; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; }
.markdown-preview :deep(pre code) { background: none; padding: 0; }
.markdown-preview :deep(blockquote) { border-left: 4px solid var(--azul-principal); padding: 0.75rem 1rem; background: #eef2ff; margin: 1rem 0; border-radius: 0 0.5rem 0.5rem 0; }
.markdown-preview :deep(img) { max-width: 100%; border-radius: 0.5rem; margin: 1rem 0; }
.markdown-preview :deep(a) { color: var(--azul-principal); text-decoration: underline; }
.markdown-preview :deep(table) { width: 100%; border-collapse: collapse; margin: 1rem 0; }
.markdown-preview :deep(th), .markdown-preview :deep(td) { border: 1px solid #e5e7eb; padding: 0.5rem 0.75rem; text-align: left; }
.markdown-preview :deep(th) { background: #f9fafb; font-weight: 600; }
.markdown-preview :deep(hr) { border: none; border-top: 1px solid #e5e7eb; margin: 1.5rem 0; }

/* Mini spinner */
.mini-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid #d1d5db;
  border-top-color: var(--azul-principal);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
