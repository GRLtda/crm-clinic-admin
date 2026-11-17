import { expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import ClinicRetrospectivePanel from '@/components/pages/clinics/ClinicRetrospectivePanel.vue'

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), role: { value: 'admin' } }))
vi.mock('@/utils/api', () => ({ default: { get: mocks.get, post: mocks.post } }))
vi.mock('@/stores/auth', () => ({ useAuthStore: () => ({ user: { role: mocks.role.value } }) }))

const list = [
  {
    _id: 'r2026', year: 2026, status: 'published', publishAt: '2026-12-10T15:00:00Z', publishedAt: '2026-12-10T15:05:00Z',
    reduced: false, storiesCount: 10, generatedAt: '2026-12-01T10:00:00Z', designKey: '2026-v1',
    tracking: { viewCount: 3, firstViewedAt: '2026-12-10T18:30:00Z', shareCount: 4, lastSharedAt: '2026-12-11T09:00:00Z' },
    firstViewedBy: { name: 'Dra. Ana', email: 'ana@clinica.dev' },
  },
  {
    _id: 'r2027', year: 2027, status: 'scheduled', publishAt: '2027-12-10T15:00:00Z', publishedAt: null,
    reduced: true, storiesCount: 4, generatedAt: '2027-12-01T10:00:00Z',
    tracking: { viewCount: 0, firstViewedAt: null, shareCount: 0 },
  },
  { _id: 'r2025', year: 2025, status: 'draft', publishAt: null, reduced: false, storiesCount: 1, tracking: {} },
]

const mountPanel = () => mount(ClinicRetrospectivePanel, { props: { clinicId: 'c1' }, attachTo: document.body })

it('lista um cartão por ano com status, liberação, versão, visualização e compartilhamentos', async () => {
  mocks.get.mockResolvedValueOnce({ data: { data: list } })
  const w = mountPanel()
  await flushPromises()
  expect(mocks.get).toHaveBeenCalledWith('/clinics/c1/retrospectives')
  const cards = w.findAll('article.card')
  expect(cards).toHaveLength(3)

  const published = cards[0].text()
  expect(published).toContain('Retrospectiva 2026')
  expect(published).toContain('Publicada')
  expect(published).toContain('Completa · 10 stories')
  expect(published).toMatch(/Sim, em \d{2}\/\d{2}\/2026/)
  expect(published).toContain('por Dra. Ana')
  expect(published).toContain('3 aberturas')
  expect(cards[0].find('dl').text()).toContain('Compartilhamentos4')

  const scheduled = cards[1].text()
  expect(scheduled).toContain('Agendada')
  expect(scheduled).toContain('Liberação')
  expect(scheduled).toContain('Reduzida · 4 stories')
  expect(cards[1].find('dd.no').text()).toBe('Não')

  expect(cards[2].text()).toContain('Rascunho')
  expect(cards[2].text()).toContain('Liberação—')
  w.unmount()
})

it('"Ver dados gerados" abre o JSON dos stories', async () => {
  mocks.get
    .mockResolvedValueOnce({ data: { data: list } })
    .mockResolvedValueOnce({ data: { data: { year: 2026, designKey: '2026-v1', reduced: false, copyVariant: 2, stories: [{ key: 'total', kind: 'total', data: { total: 1248 } }], tracking: { shareCount: 4 } } } })
  const w = mountPanel()
  await flushPromises()
  await w.findAll('article.card')[0].find('footer button').trigger('click')
  await flushPromises()
  expect(mocks.get).toHaveBeenLastCalledWith('/retrospectives/r2026')
  const json = document.body.querySelector('pre.json')
  expect(json).not.toBeNull()
  expect(json.textContent).toContain('"total": 1248')
  expect(json.textContent).toContain('"copyVariant": 2')
  expect(json.textContent).not.toContain('tracking')
  w.unmount()
})

it('estado vazio claro', async () => {
  mocks.get.mockResolvedValueOnce({ data: { data: [] } })
  const w = mountPanel()
  await flushPromises()
  expect(w.text()).toContain('Nenhuma retrospectiva gerada para esta clínica')
  w.unmount()
})

it('erro de carregamento mostra mensagem amigável', async () => {
  mocks.get.mockRejectedValueOnce(new Error('500'))
  const w = mountPanel()
  await flushPromises()
  expect(w.find('[role="alert"]').text()).toContain('Não foi possível carregar as retrospectivas desta clínica')
  w.unmount()
})

const buttonByText = (w, text) => w.findAll('button').find((b) => b.text().includes(text))

it('sem retrospectiva: "Fazer retrospectiva" gera o rascunho e recarrega a lista', async () => {
  mocks.role.value = 'admin'
  mocks.get.mockResolvedValueOnce({ data: { data: [] } })
  const w = mountPanel()
  await flushPromises()
  mocks.post.mockResolvedValueOnce({ data: { message: 'Retrospectiva gerada como rascunho.' } })
  mocks.get.mockResolvedValueOnce({ data: { data: [list[2]] } })
  await buttonByText(w, 'Fazer retrospectiva').trigger('click')
  await flushPromises()
  expect(mocks.post).toHaveBeenCalledWith('/clinics/c1/retrospectives/generate', { force: false })
  expect(w.find('.feedback.success').text()).toContain('gerada como rascunho')
  expect(w.findAll('article.card')).toHaveLength(1)
  w.unmount()
})

it('rascunho: publicar pede confirmação e mostra o motivo se a API recusar', async () => {
  mocks.role.value = 'super admin'
  mocks.get.mockResolvedValueOnce({ data: { data: [list[2]] } })
  const w = mountPanel()
  await flushPromises()
  expect(buttonByText(w, 'Gerar novamente')).toBeTruthy()
  await buttonByText(w, 'Publicar retrospectiva').trigger('click')
  expect(mocks.post).not.toHaveBeenCalledWith('/retrospectives/r2025/publish')
  expect(w.text()).toContain('o dono desta clínica passa a ver')
  mocks.post.mockRejectedValueOnce({ response: { data: { message: 'Esta retrospectiva não tem nenhum story para mostrar.' } } })
  await buttonByText(w, 'Confirmar publicação').trigger('click')
  await flushPromises()
  expect(mocks.post).toHaveBeenCalledWith('/retrospectives/r2025/publish')
  expect(w.find('.feedback.error').text()).toContain('nenhum story')
  w.unmount()
})

it('suporte só consulta e publicada não tem botões de gerar/publicar', async () => {
  mocks.role.value = 'suporte'
  mocks.get.mockResolvedValueOnce({ data: { data: [list[2]] } })
  const w = mountPanel()
  await flushPromises()
  expect(buttonByText(w, 'Publicar retrospectiva')).toBeUndefined()
  expect(buttonByText(w, 'Gerar novamente')).toBeUndefined()
  w.unmount()

  mocks.role.value = 'admin'
  mocks.get.mockResolvedValueOnce({ data: { data: [list[0]] } })
  const w2 = mountPanel()
  await flushPromises()
  expect(buttonByText(w2, 'Publicar retrospectiva')).toBeUndefined()
  expect(buttonByText(w2, 'Gerar novamente')).toBeUndefined()
  w2.unmount()
})
