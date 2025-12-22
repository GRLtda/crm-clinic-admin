<template>
  <div class="chart-card">
    <div class="chart-header">
      <h3 class="chart-title">{{ title }}</h3>
    </div>
    <div class="chart-content">
      <div class="legend-container">
        <ul class="custom-legend">
          <li v-for="(item, index) in legendItems" :key="index" class="legend-item">
            <span class="legend-dot" :style="{ backgroundColor: item.color }"></span>
            <div class="legend-info">
              <span class="legend-label">{{ item.label }}</span>
              <span class="legend-percentage">{{ item.percentage }}%</span>
            </div>
          </li>
        </ul>
      </div>
      <div class="canvas-wrapper">
        <Doughnut :data="chartData" :options="chartOptions" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'vue-chartjs'

ChartJS.register(ArcElement, Tooltip, Legend)

const props = defineProps({
  title: String,
  labels: {
    type: Array,
    default: () => []
  },
  series: {
    type: Array,
    default: () => []
  }
})

const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6']

const chartData = computed(() => {
  return {
    labels: props.labels,
    datasets: [
      {
        backgroundColor: colors,
        data: props.series,
        borderWidth: 0,
        hoverOffset: 4
      }
    ]
  }
})

const legendItems = computed(() => {
  const total = props.series.reduce((a, b) => a + b, 0)
  return props.labels.map((label, index) => {
    const value = props.series[index] || 0
    let percentage = 0
    if (total > 0) {
      percentage = Math.round((value / total) * 100)
    }
    return {
      label,
      value,
      color: colors[index % colors.length],
      percentage
    }
  })
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '75%',
  borderRadius: 10,
  spacing: 2,
  plugins: {
    legend: {
      display: false // Use custom legend instead
    },
    tooltip: {
      backgroundColor: '#fff',
      titleColor: '#1e293b',
      bodyColor: '#475569',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      padding: 12,
      cornerRadius: 8,
    }
  }
}
</script>

<style scoped>
.chart-card {
  background-color: var(--branco);
  border: 1px solid #f3f4f6;
  border-radius: 1rem;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  height: 100%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
  transition: all 0.3s ease;
  min-height: 320px;
}

.chart-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02);
  border-color: #e5e7eb;
}

.chart-header {
  margin-bottom: 1.5rem;
}

.chart-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--preto);
  margin: 0;
  font-family: var(--fonte-titulo);
  letter-spacing: -0.01em;
}

.chart-content {
  display: flex;
  align-items: center;
  flex-grow: 1;
  gap: 1rem;
}

.legend-container {
  flex: 1;
}

.canvas-wrapper {
  flex: 1;
  height: 200px; /* Reduced fixed height for the doughnut */
  position: relative;
  display: flex;
  justify-content: center;
}

/* Custom Legend Styles */
.custom-legend {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-family: var(--fonte-principal);
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-info {
  display: flex;
  flex-direction: column;
}

.legend-label {
  font-size: 0.875rem;
  color: var(--cinza-texto);
  font-weight: 500;
}

.legend-percentage {
  font-size: 0.875rem;
  color: var(--preto);
  font-weight: 700;
}

/* Responsive adjustment */
@media (max-width: 1400px) {
  .chart-content {
    flex-direction: column-reverse; /* Chart on top, legend on bottom for smaller screens if needed, or stick to row */
    align-items: stretch;
  }
  .canvas-wrapper {
    height: 180px;
  }
}
</style>