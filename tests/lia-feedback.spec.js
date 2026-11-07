import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { reactive } from 'vue'
import LiaFeedbackView from '@/views/LiaFeedbackView.vue'
const mocks = vi.hoisted(() => ({ get: vi.fn(), patch: vi.fn(), auth: null }))
vi.mock('@/utils/api', () => ({ default: { get: mocks.get, patch: mocks.patch } }))
vi.mock('@/stores/auth', () => ({ useAuthStore: () => mocks.auth }))
const record = { _id: 'a'.repeat(64), kind: 'report', reason: 'unsafe', status: 'new', version: 1, clinicName: 'Clínica sintética', createdAt: '2026-11-07T12:00:00Z', shareContext: false, note: 'Comentário sintético', reviewHistory: [] }
let wrapper
beforeEach(() => {
  vi.resetAllMocks(); mocks.auth = reactive({ user: { _id: 'admin', role: 'admin' } })
  mocks.get.mockImplementation(async path => ({ data: path === '/lia/feedback' ? { data: [{ ...record }], pagination: { page: 1, pages: 1, total: 1, limit: 20 } } : { data: { ...record } } }))
  mocks.patch.mockResolvedValue({ data: {} })
})
afterEach(() => wrapper?.unmount())
function render() {
  wrapper = mount(LiaFeedbackView, { global: { stubs: {
    AppSelect: { props: ['modelValue', 'options', 'label'], emits: ['update:modelValue'], template: '<label>{{ label }}<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><option v-for="item in options" :value="item.value">{{ item.label }}</option></select></label>' },
    AppModal: { props: ['show'], template: '<section v-if="show"><slot name="title"/><slot/><slot name="footer"/></section>' },
  } } }); return wrapper
}
it('fila mostra denúncia e filtros usam contrato do servidor', async () => {
  render(); await flushPromises(); expect(wrapper.text()).toContain('Clínica sintética'); expect(wrapper.text()).toContain('Denúncia')
  await wrapper.findAll('select')[0].setValue('report'); await flushPromises()
  expect(mocks.get).toHaveBeenLastCalledWith('/lia/feedback', { params: { page: 1, limit: 20, kind: 'report', status: 'new' } })
})
it('admin não busca conversa original quando contexto não foi compartilhado', async () => {
  render(); await flushPromises(); await wrapper.get('tbody button').trigger('click'); await flushPromises()
  expect(wrapper.text()).toContain('O usuário não compartilhou')
  expect(mocks.get.mock.calls.every(([path]) => !path.includes('conversations'))).toBe(true)
  await wrapper.get('textarea').setValue('Em análise')
  await wrapper.get('button.primary').trigger('click'); await flushPromises()
  expect(mocks.patch).toHaveBeenCalledWith('/lia/feedback/' + record._id, { status: 'reviewing', note: 'Em análise', version: 1 })
})
it('contexto compartilhado é texto escapado e perda de identidade apaga detalhes', async () => {
  mocks.get.mockImplementation(async path => ({ data: path === '/lia/feedback' ? { data: [record], pagination: { page: 1, pages: 1, total: 1 } } : { data: { ...record, shareContext: true, answerSnapshot: '<img src=x onerror=alert(1)>', questionSnapshot: 'Pergunta fictícia' } } }))
  render(); await flushPromises(); await wrapper.get('tbody button').trigger('click'); await flushPromises()
  expect(wrapper.text()).toContain('<img src=x onerror=alert(1)>'); expect(wrapper.find('img').exists()).toBe(false)
  mocks.auth.user = null; await flushPromises()
  expect(wrapper.text()).not.toContain('Pergunta fictícia'); expect(wrapper.find('tbody').exists()).toBe(false)
})
