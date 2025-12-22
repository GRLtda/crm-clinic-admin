<template>
  <div class="kpi-card">
    <div class="kpi-header">
      <div class="kpi-icon-wrapper">
        <component :is="icon" :size="20" class="kpi-icon" />
      </div>
      <span class="kpi-title">{{ title }}</span>
    </div>
    <div class="kpi-body">
      <span class="kpi-value">{{ value }}</span>
      <div v-if="trend" class="kpi-trend" :class="{ 'positive': trend > 0, 'negative': trend < 0 }">
        <component :is="trend > 0 ? ArrowUpRight : ArrowDownRight" :size="16" />
        <span>{{ Math.abs(trend) }}%</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ArrowUpRight, ArrowDownRight } from 'lucide-vue-next'

defineProps({
  title: String,
  value: [String, Number],
  icon: Object,
  trend: {
    type: Number,
    default: 0
  }
})
</script>

<style scoped>
.kpi-card {
  display: flex;
  flex-direction: column;
  background-color: var(--branco);
  border: 1px solid #f3f4f6;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
  transition: all 0.3s ease;
  gap: 1rem;
}

.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02);
  border-color: #e5e7eb;
}

.kpi-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.kpi-icon-wrapper {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 0.5rem;
  background-color: #f8fafc;
  color: var(--cinza-texto);
}

.kpi-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--cinza-texto);
  font-family: var(--fonte-principal);
}

.kpi-body {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
}

.kpi-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--preto);
  font-family: var(--fonte-titulo);
  line-height: 1;
  letter-spacing: -0.02em;
}

.kpi-trend {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 999px;
}

.kpi-trend.positive {
  color: #10b981;
  background-color: rgba(16, 185, 129, 0.1);
}

.kpi-trend.negative {
  color: #ef4444;
  background-color: rgba(239, 68, 68, 0.1);
}
</style>