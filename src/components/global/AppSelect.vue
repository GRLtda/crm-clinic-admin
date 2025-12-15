<template>
  <div class="select-wrapper">
    <component v-if="icon" :is="icon" :size="18" class="select-icon" />
    <select
      :value="modelValue"
      @change="$emit('update:modelValue', $event.target.value)"
      class="app-select"
      :class="{ 'has-icon': !!icon }"
    >
      <option v-if="defaultOption" value="">{{ defaultOption }}</option>
      <option
        v-for="option in options"
        :key="option.value"
        :value="option.value"
      >
        {{ option.label }}
      </option>
    </select>
    <ChevronDown :size="16" class="chevron-icon" />
  </div>
</template>

<script setup>
import { ChevronDown } from "lucide-vue-next";

defineProps({
  modelValue: {
    type: String,
    default: "",
  },
  options: {
    type: Array,
    default: () => [], // Formato: [{ value: 'v1', label: 'Label 1' }]
  },
  defaultOption: {
    type: String,
    default: "", // Ex: "Todos"
  },
  icon: {
    type: [Object, Function],
    default: null, // Ícone do Lucide (opcional)
  },
});

defineEmits(["update:modelValue"]);
</script>

<style scoped>
.select-wrapper {
  position: relative;
  width: 220px;
}

.app-select {
  width: 100%;
  padding: 0.625rem 2.5rem 0.625rem 1rem; /* 10px 40px 10px 16px */
  font-size: 0.875rem; /* 14px */
  font-weight: 500;
  line-height: 1.5;
  color: #374151;
  background-color: #fff;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  appearance: none; /* Remove a seta padrão */
  -webkit-appearance: none;
  -moz-appearance: none;
  cursor: pointer;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

/* Padding extra se tiver ícone */
.app-select.has-icon {
  padding-left: 2.5rem;
}

.app-select:focus {
  outline: none;
  border-color: var(--color-primary, #007bff);
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

/* Ícone de Seta (Chevron) */
.chevron-icon {
  position: absolute;
  top: 50%;
  right: 0.875rem;
  transform: translateY(-50%);
  color: #9ca3af;
  pointer-events: none;
}

/* Ícone Opcional (Ex: Filtro) */
.select-icon {
  position: absolute;
  top: 50%;
  left: 0.875rem;
  transform: translateY(-50%);
  color: #9ca3af;
  pointer-events: none;
}
@media (max-width: 768px) {
  .select-wrapper {
    width: 100%; /* 👈 LARGURA TOTAL (Mobile) */
  }
}
</style>
