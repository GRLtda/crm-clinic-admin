<script setup>
import { computed, nextTick, ref } from 'vue'
import { Bold, Code2, Heading2, ImagePlus, Italic, Link2, List } from 'lucide-vue-next'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: 'Escreva o conteúdo em Markdown...',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  uploadImage: {
    type: Function,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue'])

const textareaRef = ref(null)
const imageInputRef = ref(null)
const isUploadingImage = ref(false)

const localValue = computed({
  get: () => props.modelValue || '',
  set: (value) => emit('update:modelValue', value),
})

function updateValueWithSelection(nextText, selectionStart, selectionEnd) {
  const textarea = textareaRef.value
  if (!textarea) return

  localValue.value = nextText

  nextTick(() => {
    textarea.focus()
    textarea.setSelectionRange(selectionStart, selectionEnd)
  })
}

function wrapSelection(prefix, suffix = prefix, fallbackText = 'texto') {
  if (props.disabled) return

  const textarea = textareaRef.value
  if (!textarea) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const current = localValue.value
  const selectedText = current.slice(start, end)
  const payload = selectedText || fallbackText
  const insertion = `${prefix}${payload}${suffix}`
  const nextText = `${current.slice(0, start)}${insertion}${current.slice(end)}`

  const selectionCursorStart = start + prefix.length
  const selectionCursorEnd = selectionCursorStart + payload.length

  updateValueWithSelection(nextText, selectionCursorStart, selectionCursorEnd)
}

function insertAtCursor(content) {
  if (props.disabled) return

  const textarea = textareaRef.value
  if (!textarea) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const current = localValue.value
  const nextText = `${current.slice(0, start)}${content}${current.slice(end)}`
  const cursorPosition = start + content.length

  updateValueWithSelection(nextText, cursorPosition, cursorPosition)
}

function handleImageClick() {
  if (props.disabled || !props.uploadImage || isUploadingImage.value) return
  imageInputRef.value?.click()
}

async function handleImageChange(event) {
  const file = event.target.files?.[0]
  if (!file || !props.uploadImage) return

  const altText = window.prompt('Texto alternativo da imagem (opcional):', '') || ''

  try {
    isUploadingImage.value = true
    const imageUrl = await props.uploadImage(file, altText)

    if (imageUrl) {
      const normalizedAlt = altText.trim() || file.name.replace(/\.[^/.]+$/, '')
      insertAtCursor(`![${normalizedAlt}](${imageUrl})`)
    }
  } finally {
    isUploadingImage.value = false
    event.target.value = ''
  }
}
</script>

<template>
  <div class="markdown-editor" :class="{ 'is-disabled': disabled }">
    <div class="toolbar">
      <button type="button" class="tool-btn" @click="wrapSelection('**')" :disabled="disabled">
        <Bold :size="16" />
        <span>Negrito</span>
      </button>

      <button type="button" class="tool-btn" @click="wrapSelection('*')" :disabled="disabled">
        <Italic :size="16" />
        <span>Itálico</span>
      </button>

      <button type="button" class="tool-btn" @click="insertAtCursor('\n## Título\n')" :disabled="disabled">
        <Heading2 :size="16" />
        <span>Título</span>
      </button>

      <button
        type="button"
        class="tool-btn"
        @click="insertAtCursor('\n- Item 1\n- Item 2\n')"
        :disabled="disabled"
      >
        <List :size="16" />
        <span>Lista</span>
      </button>

      <button
        type="button"
        class="tool-btn"
        @click="insertAtCursor('[Título do link](https://)')"
        :disabled="disabled"
      >
        <Link2 :size="16" />
        <span>Link</span>
      </button>

      <button type="button" class="tool-btn" @click="wrapSelection('`')" :disabled="disabled">
        <Code2 :size="16" />
        <span>Código</span>
      </button>

      <button
        type="button"
        class="tool-btn"
        @click="handleImageClick"
        :disabled="disabled || !uploadImage || isUploadingImage"
      >
        <ImagePlus :size="16" />
        <span>{{ isUploadingImage ? 'Enviando...' : 'Imagem' }}</span>
      </button>
    </div>

    <textarea
      ref="textareaRef"
      v-model="localValue"
      class="editor-input"
      :placeholder="placeholder"
      :disabled="disabled"
      spellcheck="false"
    />

    <input
      ref="imageInputRef"
      type="file"
      class="hidden-input"
      accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/svg+xml"
      @change="handleImageChange"
    />
  </div>
</template>

<style scoped>
.markdown-editor {
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  overflow: hidden;
  background-color: #ffffff;
  font-weight: 400;
}

.markdown-editor.is-disabled {
  opacity: 0.72;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
  background-color: #f9fafb;
}

.tool-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border: 1px solid #d1d5db;
  background-color: #ffffff;
  color: #374151;
  border-radius: 0.5rem;
  padding: 0.35rem 0.55rem;
  font-size: 0.78rem;
  font-weight: 400;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tool-btn:hover:not(:disabled) {
  border-color: #3b82f6;
  color: #3b82f6;
}

.tool-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.editor-input {
  width: 100%;
  min-height: 360px;
  border: none;
  padding: 1rem;
  resize: vertical;
  line-height: 1.5;
  font-size: 0.92rem;
  font-weight: 400;
  color: #111827;
}

.editor-input:focus {
  outline: none;
}

.hidden-input {
  display: none;
}
</style>
