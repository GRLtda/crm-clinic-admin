import { expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import ClinicRetrospectivePanel from '@/components/pages/clinics/ClinicRetrospectivePanel.vue'

const mocks = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('@/utils/api', () => ({ default: { get: mocks.get } }))

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
