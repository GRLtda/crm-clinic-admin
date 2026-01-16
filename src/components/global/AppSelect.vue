<script setup>
import { ref, computed, watch, nextTick, onUnmounted } from 'vue'
import { ChevronDown } from 'lucide-vue-next'

const props = defineProps({
  modelValue: [String, Number],
  label: String,
  options: { type: Array, required: true },
  required: { type: Boolean, default: false },
  error: { type: Boolean, default: false },
  icon: { type: Object, default: null },
  defaultOption: { type: String, default: 'Selecione' }
})
const emit = defineEmits(['update:modelValue'])

const isOpen = ref(false)
const selectButtonRef = ref(null)
const optionsListRef = ref(null)
const dropdownStyle = ref({})

const selectedLabel = computed(() => {
  // Se não houver valor selecionado (ou se for string vazia que não necessariamente bata com uma opção vazia explícita)
  // Mas cuidado: se uma opção tiver value '', ela deve ser selecionada.
  // Vamos buscar a opção correspondente ao modelValue.
  const selectedOption = props.options.find((opt) => opt.value === props.modelValue)
  
  if (selectedOption) {
    return selectedOption.label
  }
  
  return props.defaultOption
})

async function updateDropdownPosition() {
  if (!isOpen.value || !selectButtonRef.value) return
  await nextTick()
  const rect = selectButtonRef.value.getBoundingClientRect()
  dropdownStyle.value = {
    position: 'absolute',
    top: `${rect.bottom + 4}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
  }
}

const handleClickOutside = (event) => {
  if (
    selectButtonRef.value &&
    !selectButtonRef.value.contains(event.target) &&
    optionsListRef.value &&
    !optionsListRef.value.contains(event.target)
  ) {
    isOpen.value = false
  }
}

watch(isOpen, (newValue) => {
  if (newValue) {
    updateDropdownPosition()
    window.addEventListener('scroll', updateDropdownPosition, true)
    window.addEventListener('resize', updateDropdownPosition)
    nextTick(() => {
      document.addEventListener('click', handleClickOutside)
    })
  } else {
    window.removeEventListener('scroll', updateDropdownPosition, true)
    window.removeEventListener('resize', updateDropdownPosition)
    document.removeEventListener('click', handleClickOutside)
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('scroll', updateDropdownPosition, true)
  window.removeEventListener('resize', updateDropdownPosition)
})

function selectOption(option) {
  emit('update:modelValue', option.value)
  isOpen.value = false
}
</script>

<template>
  <div class="form-group">
    <label v-if="label" class="form-label">
      {{ label }}
      <span v-if="required" class="required-asterisk">*</span>
    </label>
    <div class="styled-select">
      <button
        ref="selectButtonRef"
        type="button"
        class="select-button"
        :class="{ 'has-error': error }"
        @click="isOpen = !isOpen"
      >
        <div class="select-content">
          <component 
            :is="icon" 
            v-if="icon" 
            :size="18" 
            class="select-icon"
          />
          <span class="selected-text">{{ selectedLabel }}</span>
        </div>
        <ChevronDown :size="16" class="arrow-icon" :class="{ 'is-open': isOpen }" />
      </button>

      <Teleport to="body">
        <Transition name="fade">
          <ul v-if="isOpen" ref="optionsListRef" class="options-list" :style="dropdownStyle">
            <li v-if="options.length === 0" class="no-options">
              <slot name="empty">
                Nenhum registro encontrado
              </slot>
            </li>
            <li
              v-else
              v-for="option in options"
              :key="option.value"
              @mousedown.prevent="selectOption(option)"
              class="option-item"
              :class="{ 'is-selected': option.value === modelValue }"
            >
              {{ option.label }}
            </li>
          </ul>
        </Transition>
      </Teleport>
    </div>
  </div>
</template>

<style scoped>
.form-group {
  text-align: left;
}
.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  font-size: 0.875rem;
}
.required-asterisk {
  color: #ef4444;
  margin-left: 0.25rem;
}
.styled-select {
  position: relative;
  width: 100%;
}
.select-button {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 48px;
  padding: 0 1rem;
  background-color: var(--branco, #fff);
  border: 1px solid #d1d5db;
  border-radius: 0.75rem;
  font-size: 1rem;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.select-button.has-error {
  border-color: #ef4444;
}
.select-button:focus,
.select-button:focus-visible {
  outline: none;
  border-color: var(--azul-principal, #3b82f6);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
}

.select-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  overflow: hidden;
}

.select-icon {
  color: #6b7280;
  flex-shrink: 0;
}

.selected-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.arrow-icon {
  color: #6b7281;
  transition: transform 0.2s ease;
  flex-shrink: 0;
  margin-left: 0.5rem;
}
.arrow-icon.is-open {
  transform: rotate(180deg);
}

.options-list {
  position: absolute;
  max-height: 200px;
  overflow-y: auto;
  background-color: var(--branco, #fff);
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  z-index: 5000;
  padding: 0.5rem;
  list-style: none;
  margin: 0;
}
.option-item {
  padding: 0.75rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 500;
  color: #374151;
}
.option-item:hover {
  background-color: #f3f4f6;
}
.option-item.is-selected {
  background-color: #eff6ff;
  color: var(--azul-principal, #3b82f6);
}

.no-options {
  padding: 0.75rem;
  color: #6b7280;
  text-align: center;
  font-size: 0.875rem;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}
</style>
