// Campanhas de autocadastro (ex.: feira "Posicionamento no Digital").
// Contrato da API: api-clinic/docs/ASSINATURA_E_TRIAL.md#campanha-de-autocadastro-com-teste-na-stripe
import api from './api'

export const LANDING_URL = (import.meta.env.VITE_LANDING_URL || 'https://www.agendadoutor.com').replace(/\/$/, '')

// Link divulgado (QR code). A landing page envia o código para o cadastro.
export const campaignLink = (code) => `${LANDING_URL}/evento/${code}`

export const CAMPAIGN_STATUS = {
  open: { label: 'Ativa', variant: 'success' },
  scheduled: { label: 'Agendada', variant: 'neutral' },
  expired: { label: 'Encerrada', variant: 'neutral' },
  inactive: { label: 'Pausada', variant: 'danger' },
}

export const listCampaigns = (params) => api.get('/signup-campaigns', { params })
export const getCampaign = (id) => api.get(`/signup-campaigns/${id}`)
export const createCampaign = (payload) => api.post('/signup-campaigns', payload)
export const updateCampaign = (id, payload) => api.patch(`/signup-campaigns/${id}`, payload)
export const deleteCampaign = (id) => api.delete(`/signup-campaigns/${id}`)
export const listCampaignRegistrations = (id, params) => api.get(`/signup-campaigns/${id}/registrations`, { params })

// Opções do filtro "Origem" em clínicas e usuários.
export async function loadCampaignFilterOptions() {
  try {
    const { data } = await listCampaigns({ limit: 100 })
    return [
      { value: '', label: 'Todas as origens' },
      ...data.data.map((campaign) => ({ value: campaign.code, label: campaign.name })),
    ]
  } catch {
    return [{ value: '', label: 'Todas as origens' }]
  }
}

// O nome gravado no cadastro (snapshot) tem prioridade sobre o código.
export const campaignLabel = (code, storedLabel) => storedLabel || code

// Datas: o formulário usa dia (YYYY-MM-DD) no fuso de São Paulo.
const TIMEZONE = 'America/Sao_Paulo'
export const toDateInput = (iso) => (iso ? new Date(iso).toLocaleDateString('en-CA', { timeZone: TIMEZONE }) : '')
export const startOfDayIso = (day) => (day ? new Date(`${day}T00:00:00-03:00`).toISOString() : null)
export const endOfDayIso = (day) => (day ? new Date(`${day}T23:59:59-03:00`).toISOString() : null)
export const formatDay = (iso) => (iso ? new Date(iso).toLocaleDateString('pt-BR', { timeZone: TIMEZONE }) : '—')
export const formatDateTime = (iso) => (iso
  ? new Date(iso).toLocaleString('pt-BR', { timeZone: TIMEZONE, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  : '—')
