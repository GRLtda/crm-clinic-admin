<template>
  <div class="app-data-table" :aria-busy="loading">
    <div v-if="$slots.filters" class="adt-filters">
      <slot name="filters" />
    </div>

    <div class="adt-scroll" :class="{ 'is-empty': isEmpty }" :style="isEmpty ? null : { maxHeight: height }">
      <table class="adt-table">
        <thead>
          <tr>
            <th v-if="selectable" class="adt-select">
              <input
                type="checkbox"
                aria-label="Selecionar todos desta página"
                :checked="allSelected"
                :indeterminate.prop="someSelected"
                :disabled="loading || !rows.length"
                @change="toggleAll($event.target.checked)"
              />
            </th>
            <th
              v-for="col in columns"
              :key="col.key"
              scope="col"
              :class="`align-${col.align || 'left'}`"
              :style="col.width ? { width: col.width } : null"
            >{{ col.label }}</th>
          </tr>
        </thead>

        <tbody v-if="loading">
          <tr v-for="n in skeletonRows" :key="n" class="adt-row">
            <td v-if="selectable" class="adt-select"><SkeletonLoader width="16px" height="16px" /></td>
            <td v-for="col in columns" :key="col.key" :data-label="col.label" :class="`align-${col.align || 'left'}`">
              <slot :name="`skeleton-${col.key}`">
                <SkeletonLoader :width="col.skeletonWidth || '70%'" height="16px" />
              </slot>
            </td>
          </tr>
        </tbody>

        <tbody v-else-if="rows.length === 0">
          <tr>
            <td :colspan="columns.length + (selectable ? 1 : 0)" class="adt-state">
              <AppEmptyState :title="emptyTitle" :text="emptyText" :icon="emptyIcon">
                <template v-if="$slots['empty-illustration']" #illustration>
                  <slot name="empty-illustration" />
                </template>
              </AppEmptyState>
            </td>
          </tr>
        </tbody>

        <tbody v-else>
          <tr
            v-for="(row, index) in rows"
            :key="row[rowKey]"
            class="adt-row"
            :class="{ 'is-clickable': clickable, 'is-selected': isSelected(row) }"
            :tabindex="clickable ? 0 : undefined"
            @click="clickable && $emit('row-click', row)"
            @keydown.enter="clickable && $emit('row-click', row)"
          >
            <td v-if="selectable" class="adt-select" @click.stop>
              <input
                type="checkbox"
                :aria-label="`Selecionar linha ${index + 1}`"
                :checked="isSelected(row)"
                @change="toggleRow(row, $event.target.checked)"
              />
            </td>
            <td
              v-for="col in columns"
              :key="col.key"
              :data-label="col.label"
              :class="`align-${col.align || 'left'}`"
            >
              <slot :name="`cell-${col.key}`" :row="row" :index="index">
                {{ row[col.key] ?? '—' }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <AppPagination
      v-if="!loading && pagination && pagination.pages > 1"
      class="adt-pagination"
      :current-page="pagination.page"
      :total-pages="pagination.pages"
      :total-items="pagination.total"
      :items-on-page="rows.length"
      @page-changed="$emit('page-change', $event)"
    />
  </div>
</template>

<script setup>
/**
 * Tabela padrão do admin, no mesmo visual da tabela de Pacientes do crm-clinica.
 * Todas as páginas do admin devem usar este componente. Ver docs/TABELA_PADRAO.md.
 */
import { computed } from 'vue'
import { Inbox } from 'lucide-vue-next'
import AppPagination from '@/components/global/AppPagination.vue'
import AppEmptyState from '@/components/global/AppEmptyState.vue'
import SkeletonLoader from '@/components/global/SkeletonLoader.vue'

const props = defineProps({
  // [{ key, label, width?: '120px', align?: 'left'|'center'|'right', skeletonWidth? }]
  columns: { type: Array, required: true },
  rows: { type: Array, default: () => [] },
  rowKey: { type: String, default: '_id' },
  loading: { type: Boolean, default: false },
  skeletonRows: { type: Number, default: 8 },
  // Altura máxima da área de linhas. A tabela nunca cria rolagem na página: o corpo rola
  // por dentro (cabeçalho fixo) e a paginação fica sempre visível. Ajuste só se houver
  // conteúdo extra acima da tabela.
  height: { type: String, default: 'calc(100vh - 21rem)' },
  clickable: { type: Boolean, default: false },
  selectable: { type: Boolean, default: false },
  selectedKeys: { type: Array, default: () => [] },
  pagination: { type: Object, default: null }, // { page, pages, total }
  emptyTitle: { type: String, default: 'Nenhum resultado encontrado' },
  emptyText: { type: String, default: 'Tente ajustar os filtros ou verifique mais tarde.' },
  emptyIcon: { type: [Object, Function], default: () => Inbox },
})

const emit = defineEmits(['row-click', 'page-change', 'update:selectedKeys'])

const isSelected = (row) => props.selectedKeys.includes(row[props.rowKey])
const isEmpty = computed(() => !props.loading && props.rows.length === 0)
const allSelected = computed(() => props.rows.length > 0 && props.rows.every(isSelected))
const someSelected = computed(() => props.rows.some(isSelected) && !allSelected.value)

function toggleRow(row, checked) {
  const keys = new Set(props.selectedKeys)
  if (checked) keys.add(row[props.rowKey])
  else keys.delete(row[props.rowKey])
  emit('update:selectedKeys', [...keys])
}
function toggleAll(checked) {
  const keys = new Set(props.selectedKeys)
  for (const row of props.rows) {
    if (checked) keys.add(row[props.rowKey])
    else keys.delete(row[props.rowKey])
  }
  emit('update:selectedKeys', [...keys])
}
</script>

<style scoped>
.app-data-table {
  display: flex;
  flex-direction: column;
  width: 100%;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 1rem;
  overflow: hidden;
}
.adt-filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
}
.adt-scroll {
  min-height: 16rem;
  overflow: auto;
}
.adt-table {
  width: 100%;
  border-collapse: collapse;
}
.adt-table th,
.adt-table td {
  padding: 1rem 1.25rem;
  text-align: left;
  vertical-align: middle;
  border-bottom: 1px solid #e5e7eb;
  font-size: 0.875rem;
  color: #374151;
}
.adt-table th {
  position: sticky;
  top: 0;
  z-index: 1;
  height: 44px;
  padding-top: 0;
  padding-bottom: 0;
  background: #f5f6f8;
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.01em;
  white-space: nowrap;
  border-bottom: 0;
  box-shadow: inset 0 -1px #e5e7eb;
}
.adt-table tbody tr:last-child td {
  border-bottom: none;
}
.adt-table .align-center { text-align: center; }
.adt-table .align-right { text-align: right; }
.adt-select {
  width: 48px;
  padding-right: 0.5rem !important;
}
.adt-select input {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #2563eb;
}
.adt-row.is-clickable { cursor: pointer; }
.adt-row.is-clickable:hover,
.adt-row.is-clickable:focus-visible,
.adt-row.is-selected {
  background: #f0f4fc;
  outline: none;
}
.adt-scroll.is-empty {
  min-height: 0;
  overflow: hidden;
}
.adt-table td.adt-state {
  padding: 1rem;
  white-space: normal;
}
.adt-state :deep(.state-cell) {
  padding: 2rem 1rem;
}
.adt-state :deep(.empty-state-text) {
  margin-bottom: 0;
}
.adt-pagination {
  border-top: 1px solid #e5e7eb;
  border-radius: 0;
}

@media (max-width: 768px) {
  .app-data-table {
    background: transparent;
    border: none;
    border-radius: 0;
    overflow: visible;
  }
  .adt-filters { padding: 0 0 0.75rem; background: transparent; border: 0; }
  .adt-table thead { display: none; }
  .adt-table,
  .adt-table tbody { display: block; }
  .adt-table tbody tr {
    display: block;
    margin-bottom: 0.75rem;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
  }
  .adt-table td {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #f3f4f6;
    text-align: right;
  }
  .adt-table tbody tr td:last-child { border-bottom: none; }
  .adt-table td[data-label]::before {
    content: attr(data-label);
    font-size: 0.75rem;
    font-weight: 600;
    color: #64748b;
    flex-shrink: 0;
  }
  .adt-table td.adt-state { display: block; background: #fff; border-radius: 0.75rem; }
  .adt-pagination { border: 0; background: transparent; }
}
</style>
