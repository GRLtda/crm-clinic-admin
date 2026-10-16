import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import StoragePanel from "@/components/pages/storage/StoragePanel.vue";
import AppSelect from "@/components/global/AppSelect.vue";
import AppButton from "@/components/global/AppButton.vue";
import { formatGB, formatSize, storageError } from "@/utils/storage";
const mocks = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("@/utils/api", () => ({ default: { get: mocks.get } }));
const GiB = 1024 ** 3;
const totals = {
  totalBytes: 3 * GiB,
  billableBytes: 2 * GiB,
  exemptBytes: GiB,
  reservedBytes: 0,
  files: 4,
  updatedAt: "2026-10-16T12:00:00Z",
};
const clinic = {
  ...totals,
  _id: "a",
  name: "Clínica Alfa",
  quotaUsedBytes: 2 * GiB,
  quotaBytes: 10 * GiB,
  ready: true,
  categories: [
    {
      category: "assinaturas",
      billable: false,
      bytes: GiB,
      files: 1,
      status: "active",
    },
  ],
};
const file = {
  _id: "f1",
  filename: "signature.png",
  category: "assinaturas",
  sizeBytes: GiB,
  billable: false,
  objectCount: 2,
  status: "active",
  createdAt: "2026-10-16T12:00:00Z",
};
const wrappers = [];
function open(props = {}) {
  const wrapper = mount(StoragePanel, {
    props,
    global: {
      stubs: {
        RouterLink: {
          name: "RouterLink",
          props: ["to"],
          template: "<a><slot /></a>",
        },
      },
    },
  });
  wrappers.push(wrapper);
  return wrapper;
}
beforeEach(() => {
  mocks.get.mockReset();
  mocks.get.mockImplementation(async (url) => ({
    data: url.endsWith("/files")
      ? { data: [file], nextCursor: null }
      : url === "/storage"
        ? {
            summary: totals,
            data: [clinic],
            page: 1,
            pages: 1,
            total: 1,
            updatedAt: totals.updatedAt,
          }
        : clinic,
  }));
});
afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount());
  vi.useRealTimers();
});
it("mostra totais em GB, isentos e link para aba da clínica", async () => {
  const wrapper = open();
  await flushPromises();
  expect(wrapper.text()).toContain("3,00 GB");
  expect(wrapper.text()).toContain("Arquivos isentos de cota");
  expect(wrapper.text()).toContain("Clínica Alfa");
  expect(wrapper.findComponent({ name: "RouterLink" }).exists()).toBe(true);
  expect(
    wrapper.findComponent({ name: "RouterLink" }).props("to").query.tab,
  ).toBe("storage");
  expect(mocks.get).toHaveBeenCalledTimes(1);
});
it("detalhe carrega arquivos ocultos e mostra cota separada do total", async () => {
  const wrapper = open({ clinicId: "a" });
  await flushPromises();
  expect(wrapper.text()).toContain("signature.png");
  expect(wrapper.text()).toContain("Assinaturas");
  expect(wrapper.text()).toContain("Isento");
  expect(wrapper.text()).toContain("2,00 GB de 10,00 GB");
  expect(mocks.get).toHaveBeenCalledWith("/storage/clinics/a/files", {
    params: { limit: 20 },
  });
});
it("carregamento usa skeleton e não mostra vazio antes da resposta", async () => {
  mocks.get.mockReturnValue(new Promise(() => {}));
  const wrapper = open();
  expect(wrapper.find("[aria-busy=true]").exists()).toBe(true);
  expect(wrapper.text()).not.toContain("Nenhuma clínica encontrada");
});
it("erro inicial tem causa e nova tentativa, sem falso estado vazio", async () => {
  mocks.get.mockRejectedValueOnce({
    response: { data: { message: "Consulta excedeu o tempo limite" } },
  });
  const wrapper = open();
  await flushPromises();
  expect(wrapper.find("[role=alert]").text()).toContain(
    "Consulta excedeu o tempo limite",
  );
  expect(wrapper.text()).not.toContain("Nenhuma clínica encontrada");
  await wrapper.find("[role=alert] button").trigger("click");
  await flushPromises();
  expect(wrapper.text()).toContain("Clínica Alfa");
});
it("atualização falha preserva totais anteriores", async () => {
  const wrapper = open();
  await flushPromises();
  mocks.get.mockRejectedValueOnce(new Error("network"));
  await wrapper.findComponent(AppButton).trigger("click");
  await flushPromises();
  expect(wrapper.text()).toContain("3,00 GB");
  expect(wrapper.find("[role=alert]").exists()).toBe(true);
});
it("vazio bem-sucedido tem ilustração SVG e texto contextual", async () => {
  mocks.get.mockResolvedValue({
    data: {
      summary: totals,
      data: [],
      page: 1,
      pages: 1,
      total: 0,
      updatedAt: totals.updatedAt,
    },
  });
  const wrapper = open();
  await flushPromises();
  expect(wrapper.text()).toContain("Nenhuma clínica encontrada");
  expect(wrapper.find(".storage-art svg").exists()).toBe(true);
});
it("carregar mais envia cursor e acrescenta arquivos", async () => {
  mocks.get.mockImplementation(async (url) => ({
    data: url.endsWith("/files")
      ? { data: [file], nextCursor: "cursor1" }
      : clinic,
  }));
  const wrapper = open({ clinicId: "a" });
  await flushPromises();
  mocks.get.mockResolvedValueOnce({
    data: {
      data: [{ ...file, _id: "f2", filename: "photo.png" }],
      nextCursor: null,
    },
  });
  await wrapper
    .findAll("button")
    .find((button) => button.text().includes("Carregar mais"))
    .trigger("click");
  await flushPromises();
  expect(mocks.get).toHaveBeenLastCalledWith("/storage/clinics/a/files", {
    params: { limit: 20, cursor: "cursor1" },
  });
  expect(wrapper.text()).toContain("signature.png");
  expect(wrapper.text()).toContain("photo.png");
});
it("filtro de isentos reinicia paginação e passa filtro à API", async () => {
  const wrapper = open({ clinicId: "a" });
  await flushPromises();
  wrapper
    .findAllComponents(AppSelect)[0]
    .vm.$emit("update:modelValue", "exempt");
  await flushPromises();
  expect(mocks.get).toHaveBeenLastCalledWith("/storage/clinics/a/files", {
    params: { limit: 20, billing: "exempt" },
  });
});
it("resposta antiga não aparece depois de trocar de clínica", async () => {
  let resolve;
  mocks.get.mockImplementation((url) =>
    url.includes("/a")
      ? new Promise((done) => {
          resolve = done;
        })
      : Promise.resolve({
          data: url.endsWith("/files")
            ? { data: [{ ...file, filename: "beta.png" }], nextCursor: null }
            : { ...clinic, totalBytes: 9 * GiB },
        }),
  );
  const wrapper = open({ clinicId: "a" });
  await wrapper.setProps({ clinicId: "b" });
  await flushPromises();
  resolve({ data: { data: [file], nextCursor: null } });
  await flushPromises();
  expect(wrapper.text()).toContain("beta.png");
  expect(wrapper.text()).not.toContain("signature.png");
});
it("usa MB, KB e bytes sem ocultar volumes pequenos e limita GB a duas casas", () => {
  expect(formatSize(0)).toBe("0 B");
  expect(formatSize(12)).toBe("12 B");
  expect(formatSize(1024)).toBe("1 KB");
  expect(formatSize(0.302 * GiB)).toBe("309,25 MB");
  expect(formatSize(6.606 * GiB)).toBe("6,61 GB");
});
it("mostra motivo e ocorrências do bloqueio no detalhe e na lista", async () => {
  const blocked = {
    ...clinic,
    blocked: true,
    blockInfo: {
      checkedAt: totals.updatedAt,
      issues: [
        {
          reason: "missing",
          count: 2,
          message: "Objeto inventariado não encontrado no S3",
        },
      ],
    },
  };
  mocks.get.mockImplementation(async (url) => ({
    data: url.endsWith("/files")
      ? { data: [], nextCursor: null }
      : url === "/storage"
        ? { summary: totals, data: [blocked], page: 1, pages: 1, total: 1 }
        : blocked,
  }));
  const detail = open({ clinicId: "a" });
  await flushPromises();
  expect(detail.find("[role=status]").text()).toContain(
    "Objeto inventariado não encontrado no S3",
  );
  expect(detail.find("[role=status]").text()).toContain("2 ocorrências");
  const list = open();
  await flushPromises();
  expect(list.find(".block-reason").text()).toContain(
    "Objeto inventariado não encontrado no S3",
  );
});
it("formata zero e preserva causa de erro padronizada", () => {
  expect(formatGB(0)).toBe("0,00 GB");
  expect(
    storageError({
      response: { data: { error: { message: "Sem permissão" } } },
    }),
  ).toBe("Sem permissão");
});
it("busca aguarda debounce e envia prefixo com página reiniciada", async () => {
  const wrapper = open();
  await flushPromises();
  vi.useFakeTimers();
  await wrapper.find("input").setValue("Alfa");
  expect(mocks.get).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(350);
  expect(mocks.get).toHaveBeenLastCalledWith("/storage", {
    params: { page: 1, limit: 20, search: "Alfa" },
  });
});
it("falha da lista de arquivos mostra causa sem estado vazio enganoso", async () => {
  mocks.get.mockImplementation(async (url) => {
    if (url.endsWith("/files"))
      throw {
        response: { data: { message: "Falha na consulta dos arquivos" } },
      };
    return { data: clinic };
  });
  const wrapper = open({ clinicId: "a" });
  await flushPromises();
  expect(wrapper.find("[role=alert]").text()).toContain(
    "Falha na consulta dos arquivos",
  );
  expect(wrapper.text()).not.toContain("Nenhum arquivo encontrado");
  expect(wrapper.text()).toContain("3,00 GB");
});
