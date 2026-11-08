const number = new Intl.NumberFormat('pt-BR')
const compact = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 })

export const formatInt = (value) => number.format(Math.round(Number(value) || 0))

// 1.234 -> "1.234"; 1.234.567 -> "1,2 mi"
export const formatTokens = (value) => {
  const n = Number(value) || 0
  return n >= 100000 ? compact.format(n) : number.format(Math.round(n))
}

export const formatMs = (value) => {
  const ms = Number(value) || 0
  return ms >= 1000 ? `${(ms / 1000).toFixed(1).replace('.', ',')} s` : `${Math.round(ms)} ms`
}

export const formatPercent = (value) => `${(Number(value) || 0).toFixed(1).replace('.', ',')}%`

export const formatDateTime = (value) =>
  value ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '—'

export const shortDay = (iso) => {
  const [, month, day] = String(iso).split('-')
  return `${day}/${month}`
}

export const PERIOD_OPTIONS = [
  { value: '7', label: 'Últimos 7 dias' },
  { value: '30', label: 'Últimos 30 dias' },
  { value: '90', label: 'Últimos 90 dias' },
]

// Rótulos legíveis para os códigos de erro registrados pela API.
export const ERROR_LABELS = {
  LIA_TIMEOUT: 'Tempo esgotado',
  LIA_RATE_LIMITED: 'Limite de uso atingido',
  LIA_QUOTA_EXCEEDED: 'Cota da clínica excedida',
  LIA_FORBIDDEN: 'Sem permissão',
  LIA_PROVIDER_OR_INTERNAL: 'Falha do provedor ou interna',
  LIA_PATIENT_PERMISSION_DENIED: 'Sem permissão para pacientes',
  RESULT_TOO_LARGE: 'Resultado grande demais',
}
export const errorLabel = (code) => ERROR_LABELS[code] || code

export const plural = (value, one, many) => `${formatInt(value)} ${Number(value) === 1 ? one : many}`

// Nomes legíveis das ferramentas da Lia (o código vem da API).
export const TOOL_LABELS = {
  query_clinic_analytics: 'Indicadores da clínica',
  query_patient_cohort: 'Relatório de pacientes',
  search_patient: 'Buscar paciente',
  get_patient: 'Dados do paciente',
  get_patient_appointments: 'Atendimentos do paciente',
  get_schedule: 'Consultar agenda',
  check_availability: 'Verificar disponibilidade',
  create_appointment: 'Criar atendimento',
  reschedule_appointment: 'Remarcar atendimento',
  cancel_appointment: 'Cancelar atendimento',
  list_clinic_catalog: 'Catálogo da clínica',
  get_financial_account: 'Conta financeira',
}
export const toolLabel = (name) => TOOL_LABELS[name] || name

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
// Valores pequenos (centavos de centavo) precisam de mais casas para não aparecer R$ 0,00.
const smart = (formatter, symbol, value) => {
  const n = Number(value) || 0
  if (n > 0 && n < 0.01) return `${symbol} ${n.toLocaleString(symbol === 'R$' ? 'pt-BR' : 'en-US', { minimumFractionDigits: 3, maximumFractionDigits: 4 })}`
  return formatter.format(n)
}
export const formatBrl = (value) => smart(brl, 'R$', value)
export const formatUsd = (value) => smart(usd, 'US$', value)
