<template>
  <div class="chart-card">
    <div class="chart-header">
      <h3 class="chart-title">{{ title }}</h3>
    </div>
    <div class="chart-body">
      <Line :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line } from 'vue-chartjs'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const props = defineProps({
  title: {
    type: String,
    default: 'Gráfico'
  },
  categories: {
    type: Array,
    default: () => []
  },
  series: {
    type: Array,
    default: () => []
  }
})

// Gradient Helper (moved to local scope or utility if shared later)
const getGradient = (ctx, chartArea, colorStart, colorEnd) => {
  const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top)
  gradient.addColorStop(0, colorStart)
  gradient.addColorStop(1, colorEnd)
  return gradient
}

const chartData = computed(() => {
  return {
    labels: props.categories,
    datasets: props.series.map(s => ({
      label: s.name,
      data: s.data,
      borderColor: '#3b82f6',
      backgroundColor: (context) => {
        const chart = context.chart
        const { ctx, chartArea } = chart
        if (!chartArea) return null
        return getGradient(ctx, chartArea, 'rgba(59, 130, 246, 0.0)', 'rgba(59, 130, 246, 0.2)')
      },
      tension: 0.4,
      fill: true,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: '#3b82f6',
      pointBorderColor: '#fff',
      pointBorderWidth: 2
    }))
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#fff',
      titleColor: '#1e293b',
      bodyColor: '#475569',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      padding: 12,
      cornerRadius: 8,
      displayColors: false,
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: '#f1f5f9',
        borderDash: [5, 5]
      },
      ticks: {
        font: { family: "'Montserrat', sans-serif", size: 11 },
        color: '#94a3b8'
      },
      border: { display: false }
    },
    x: {
      grid: { display: false },
      ticks: {
        font: { family: "'Montserrat', sans-serif", size: 11 },
        color: '#94a3b8'
      },
      border: { display: false }
    }
  },
  interaction: {
    intersect: false,
    mode: 'index',
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

.chart-body {
  flex-grow: 1;
  min-height: 300px;
  position: relative;
}
</style>