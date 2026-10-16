<script setup>
import { ref, computed, watch, onBeforeUnmount } from "vue";
import { RouterLink } from "vue-router";
import { HardDrive, RefreshCw, ArrowRight } from "lucide-vue-next";
import api from "@/utils/api";
import {
  formatGB,
  formatSize,
  categoryLabel,
  storageError,
} from "@/utils/storage";
import AppButton from "@/components/global/AppButton.vue";
import AppPagination from "@/components/global/AppPagination.vue";
import AppSelect from "@/components/global/AppSelect.vue";
import SearchInput from "@/components/global/SearchInput.vue";
import SkeletonLoader from "@/components/global/SkeletonLoader.vue";
import AppEmptyState from "@/components/global/AppEmptyState.vue";
import emptyArt from "@/assets/illustrations/storage-empty.svg?raw";

const props = defineProps({ clinicId: { type: String, default: "" } });
const summary = ref(null);
const rows = ref([]);
const loading = ref(false);
const error = ref("");
const filesError = ref("");
const filesLoading = ref(false);
const files = ref([]);
const nextCursor = ref(null);
const page = ref(1);
const pages = ref(1);
const total = ref(0);
const search = ref("");
const billing = ref("");
const category = ref("");
let requestId = 0,
  fileRequestId = 0,
  timer;
const billingOptions = [
  { value: "", label: "Todos os arquivos" },
  { value: "billable", label: "Consomem cota" },
  { value: "exempt", label: "Isentos de cota" },
];
const categories = computed(() => {
  const grouped = new Map();
  for (const item of summary.value?.categories || []) {
    if (item.status === "reserved") continue;
    const key = `${item.category}:${item.billable}`;
    const prev = grouped.get(key) || {
      category: item.category,
      billable: item.billable,
      bytes: 0,
      files: 0,
    };
    prev.bytes += item.bytes;
    prev.files += item.files;
    grouped.set(key, prev);
  }
  return [...grouped.values()].sort((a, b) => b.bytes - a.bytes);
});
const categoryOptions = computed(() => [
  { value: "", label: "Todas as categorias" },
  ...[
    ...new Set((summary.value?.categories || []).map((item) => item.category)),
  ]
    .sort()
    .map((value) => ({ value, label: categoryLabel(value) })),
]);
const percent = computed(() =>
  summary.value?.quotaBytes
    ? Math.min(
        100,
        (summary.value.quotaUsedBytes / summary.value.quotaBytes) * 100,
      )
    : 0,
);
async function load() {
  const id = ++requestId;
  loading.value = true;
  error.value = "";
  try {
    const { data } = await api.get(
      props.clinicId ? `/storage/clinics/${props.clinicId}` : "/storage",
      {
        params: props.clinicId
          ? {}
          : { page: page.value, limit: 20, search: search.value },
      },
    );
    if (id !== requestId) return;
    summary.value = props.clinicId
      ? data
      : { ...data.summary, updatedAt: data.updatedAt };
    if (!props.clinicId) {
      rows.value = data.data;
      pages.value = data.pages;
      total.value = data.total;
    }
  } catch (err) {
    if (id === requestId) error.value = storageError(err);
  } finally {
    if (id === requestId) loading.value = false;
  }
}
async function loadFiles(append = false) {
  if (!props.clinicId) return;
  const id = ++fileRequestId;
  filesLoading.value = true;
  filesError.value = "";
  try {
    const { data } = await api.get(`/storage/clinics/${props.clinicId}/files`, {
      params: {
        limit: 20,
        ...(append && nextCursor.value ? { cursor: nextCursor.value } : {}),
        ...(billing.value ? { billing: billing.value } : {}),
        ...(category.value ? { category: category.value } : {}),
      },
    });
    if (id !== fileRequestId) return;
    files.value = append ? [...files.value, ...data.data] : data.data;
    nextCursor.value = data.nextCursor;
  } catch (err) {
    if (id === fileRequestId) filesError.value = storageError(err);
  } finally {
    if (id === fileRequestId) filesLoading.value = false;
  }
}
function refresh() {
  load();
  loadFiles();
}
function changePage(value) {
  page.value = value;
  load();
}
watch(search, () => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    page.value = 1;
    load();
  }, 350);
});
watch([billing, category], () => {
  files.value = [];
  nextCursor.value = null;
  loadFiles();
});
watch(
  () => props.clinicId,
  () => {
    requestId++;
    fileRequestId++;
    summary.value = null;
    rows.value = [];
    files.value = [];
    nextCursor.value = null;
    page.value = 1;
    billing.value = "";
    category.value = "";
    refresh();
  },
  { immediate: true },
);
onBeforeUnmount(() => {
  clearTimeout(timer);
  requestId++;
  fileRequestId++;
});
</script>

<template>
  <section class="storage-panel">
    <header class="storage-header">
      <div>
        <h2><HardDrive :size="22" /> Armazenamento</h2>
        <p>
          {{
            clinicId
              ? "Todos os arquivos da clínica, incluindo assinaturas e arquivos isentos."
              : "Espaço ocupado pelas clínicas, incluindo arquivos mantidos pela plataforma."
          }}
        </p>
      </div>
      <AppButton :disabled="loading || filesLoading" @click="refresh"
        ><RefreshCw :size="16" /> Atualizar</AppButton
      >
    </header>
    <div v-if="error" class="storage-error" role="alert">
      {{ error }}
      <AppButton size="sm" @click="load">Tentar novamente</AppButton>
    </div>
    <div v-if="loading && !summary" class="storage-stats" aria-busy="true">
      <div v-for="n in 3" :key="n" class="storage-card">
        <SkeletonLoader width="130px" height="14px" /><SkeletonLoader
          width="180px"
          height="32px"
        />
      </div>
    </div>
    <template v-if="summary">
      <div class="storage-stats">
        <div class="storage-card">
          <span>Total ocupado</span
          ><strong>{{ formatSize(summary.totalBytes) }}</strong
          ><small>{{ summary.files }} arquivos inventariados</small>
        </div>
        <div class="storage-card">
          <span>Arquivos que consomem cota</span
          ><strong>{{ formatSize(summary.billableBytes) }}</strong
          ><small>Imagens, documentos e outros arquivos clínicos</small>
        </div>
        <div class="storage-card">
          <span>Arquivos isentos de cota</span
          ><strong>{{ formatSize(summary.exemptBytes) }}</strong
          ><small>Assinaturas, identidade visual e fotos de perfil</small>
        </div>
      </div>
      <p class="storage-note">
        Atualizado em
        {{ new Date(summary.updatedAt).toLocaleString("pt-BR") }} · 1 GB = 1024³
        bytes. Inclui versões antigas e miniaturas. Reservas:
        {{ formatSize(summary.reservedBytes) }}.
      </p>
      <p v-if="!clinicId" class="storage-note">
        Totais do inventário, atualizado a cada minuto. Arquivos ainda não
        inventariados não estão incluídos.
      </p>
      <div v-if="clinicId" class="storage-card">
        <div class="capacity-heading">
          <strong>Cota da clínica</strong
          ><span
            >{{ formatSize(summary.quotaUsedBytes) }} de
            {{ formatGB(summary.quotaBytes) }}</span
          >
        </div>
        <div class="storage-bar">
          <span :style="{ width: `${percent}%` }"></span>
        </div>
        <div v-if="summary.blocked" class="storage-warning" role="status">
          <strong>Armazenamento bloqueado para verificação</strong>
          <p
            v-for="item in summary.blockInfo?.issues || [
              {
                reason: 'unknown',
                message:
                  'Motivo não registrado. Execute a conciliação para diagnosticar este bloqueio.',
                count: 1,
              },
            ]"
            :key="item.reason"
          >
            {{ item.message
            }}<span v-if="item.count > 1"> ({{ item.count }} ocorrências)</span>
          </p>
          <small v-if="summary.blockInfo?.checkedAt"
            >Verificado em
            {{
              new Date(summary.blockInfo.checkedAt).toLocaleString("pt-BR")
            }}</small
          >
          <p>Assinaturas de pacientes continuam permitidas.</p>
        </div>
        <p v-else-if="!summary.ready" class="storage-warning" role="status">
          Inventário em atualização. Os totais podem estar incompletos.
        </p>
        <div class="storage-categories">
          <div
            v-for="item in categories"
            :key="`${item.category}:${item.billable}`"
          >
            <span
              >{{ categoryLabel(item.category) }}
              <small>{{
                item.billable ? "Consome cota" : "Isento"
              }}</small></span
            ><strong>{{ formatSize(item.bytes) }}</strong
            ><small>{{ item.files }} arquivos</small>
          </div>
        </div>
      </div>
    </template>
    <template v-if="!clinicId">
      <SearchInput
        v-model="search"
        placeholder="Buscar pelo início do nome da clínica"
      />
      <div v-if="loading" class="storage-skeleton" aria-busy="true">
        <SkeletonLoader v-for="n in 5" :key="n" height="50px" />
      </div>
      <div v-else-if="rows.length" class="storage-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Clínica</th>
              <th>Total ocupado</th>
              <th>Consome cota</th>
              <th>Isento</th>
              <th>Inventário</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row._id">
              <td>
                <strong>{{ row.name }}</strong
                ><small>{{ row.files }} arquivos</small>
              </td>
              <td>{{ formatSize(row.totalBytes) }}</td>
              <td>{{ formatSize(row.billableBytes) }}</td>
              <td>{{ formatSize(row.exemptBytes) }}</td>
              <td>
                <span
                  class="storage-badge"
                  :class="{ warning: row.blocked || !row.ready }"
                  >{{
                    row.blocked
                      ? "Bloqueado"
                      : row.ready
                        ? "Verificado"
                        : "Em atualização"
                  }}</span
                >
                <small v-if="row.blocked" class="block-reason">{{
                  row.blockInfo?.issues
                    ?.map((item) => item.message)
                    .join("; ") ||
                  "Motivo não registrado. Consulte o detalhe da clínica."
                }}</small>
              </td>
              <td>
                <RouterLink
                  :to="{
                    name: 'clinic-detail',
                    params: { id: row._id },
                    query: { tab: 'storage' },
                  }"
                  class="storage-link"
                  >Ver arquivos <ArrowRight :size="15"
                /></RouterLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <AppEmptyState
        v-else-if="!error"
        title="Nenhuma clínica encontrada"
        text="Ajuste a busca para consultar o armazenamento."
        ><template #illustration
          ><div class="storage-art" v-html="emptyArt"></div></template
      ></AppEmptyState>
      <AppPagination
        v-if="!loading"
        :current-page="page"
        :total-pages="pages"
        :total-items="total"
        :items-on-page="rows.length"
        label="clínicas"
        @page-changed="changePage"
      />
    </template>
    <template v-else>
      <div class="storage-header">
        <h3>Arquivos da clínica</h3>
        <div class="storage-filters">
          <AppSelect
            v-model="billing"
            :options="billingOptions"
            aria-label="Cobrança dos arquivos"
          /><AppSelect
            v-model="category"
            :options="categoryOptions"
            aria-label="Categoria dos arquivos"
          />
        </div>
      </div>
      <div v-if="filesError" class="storage-error" role="alert">
        {{ filesError }}
        <AppButton size="sm" @click="loadFiles()">Tentar novamente</AppButton>
      </div>
      <div
        v-if="filesLoading && !files.length"
        class="storage-skeleton"
        aria-busy="true"
      >
        <SkeletonLoader v-for="n in 5" :key="n" height="50px" />
      </div>
      <div v-else-if="files.length" class="storage-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Arquivo</th>
              <th>Categoria</th>
              <th>Tamanho</th>
              <th>Cota</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="file in files" :key="file._id">
              <td class="filename">
                <strong>{{ file.filename }}</strong
                ><small
                  >{{ file.objectCount }} objetos / versões ·
                  {{
                    new Date(file.createdAt).toLocaleDateString("pt-BR")
                  }}</small
                >
              </td>
              <td>{{ categoryLabel(file.category) }}</td>
              <td>{{ formatSize(file.sizeBytes) }}</td>
              <td>
                <span class="storage-badge">{{
                  file.billable === false ? "Isento" : "Consome cota"
                }}</span>
              </td>
              <td>
                {{
                  {
                    active: "Armazenado",
                    deleting: "Exclusão pendente",
                    reserved: "Upload pendente",
                  }[file.status]
                }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <AppEmptyState
        v-else-if="!filesError"
        title="Nenhum arquivo encontrado"
        text="Não há arquivos inventariados para os filtros selecionados."
        ><template #illustration
          ><div class="storage-art" v-html="emptyArt"></div></template
      ></AppEmptyState>
      <AppButton
        v-if="nextCursor"
        :loading="filesLoading"
        @click="loadFiles(true)"
        >Carregar mais arquivos</AppButton
      >
    </template>
  </section>
</template>

<style scoped>
.block-reason {
  max-width: 280px;
  white-space: normal;
  line-height: 1.5;
}
.storage-warning p {
  margin: 8px 0;
}
.storage-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
  color: var(--cinza-escuro, #1f2937);
}
.storage-header,
.capacity-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.storage-header h2 {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 22px;
  margin: 0;
}
.storage-header h3 {
  font-size: 16px;
  margin: 0;
}
.storage-header p,
.storage-note {
  font-size: 13px;
  color: #64748b;
  line-height: 1.6;
  margin: 6px 0 0;
}
.storage-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}
.storage-card {
  padding: 22px;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: white;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.storage-card > span {
  font-size: 13px;
  color: #64748b;
}
.storage-card > strong {
  font-size: 28px;
  font-weight: 650;
  color: #1e40af;
}
.storage-card small {
  color: #64748b;
  font-size: 12px;
}
.storage-note {
  margin: 0;
}
.storage-bar {
  height: 10px;
  border-radius: 8px;
  background: #eff4fb;
  overflow: hidden;
}
.storage-bar span {
  display: block;
  height: 100%;
  background: var(--azul-principal, #2563eb);
  transition: width 0.6s;
}
.storage-categories {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.storage-categories > div {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 14px;
  background: #f8fafc;
  border-radius: 10px;
}
.storage-categories span small {
  margin-left: 8px;
}
.storage-table-wrap {
  overflow-x: auto;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: white;
}
table {
  border-collapse: collapse;
  width: 100%;
  font-size: 13px;
  text-align: left;
  white-space: nowrap;
}
th {
  color: #64748b;
  font-weight: 500;
  background: #f8fafc;
}
th,
td {
  padding: 16px;
  border-bottom: 1px solid #f1f5f9;
}
tbody tr:last-child td {
  border-bottom: 0;
}
td small {
  display: block;
  margin-top: 5px;
  color: #64748b;
}
.filename {
  white-space: normal;
  min-width: 200px;
  max-width: 340px;
  overflow-wrap: anywhere;
}
.storage-badge {
  font-size: 11px;
  background: #eff6ff;
  color: #1d4ed8;
  border-radius: 6px;
  padding: 5px 8px;
}
.storage-badge.warning,
.storage-warning {
  background: #fffbeb;
  color: #92400e;
}
.storage-warning {
  padding: 12px;
  border: 1px solid #fde68a;
  border-radius: 8px;
  margin: 0;
  font-size: 13px;
}
.storage-link {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  color: #2563eb;
  text-decoration: none;
}
.storage-error {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  padding: 14px;
  border: 1px solid #fecaca;
  border-radius: 10px;
  background: #fef2f2;
  color: #b91c1c;
}
.storage-skeleton {
  display: grid;
  gap: 12px;
}
.storage-filters {
  display: flex;
  gap: 12px;
}
.storage-art {
  width: 200px;
  max-width: 100%;
}
.storage-art :deep(svg) {
  width: 100%;
  height: auto;
}
@media (max-width: 700px) {
  .storage-stats {
    grid-template-columns: 1fr;
  }
  .storage-card {
    padding: 18px;
  }
  .storage-card > strong {
    font-size: 24px;
  }
  .storage-categories {
    grid-template-columns: 1fr;
  }
  .storage-filters {
    width: 100%;
    flex-wrap: wrap;
  }
  .storage-filters > * {
    flex: 1;
    min-width: 160px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .storage-bar span {
    transition: none;
  }
}
</style>
