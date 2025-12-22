<template>
    <RouterLink :to="'/clinics/' + clinic._id" class="clinic-card">
      <div class="card-header">
        <div class="logo-wrapper">
          <img v-if="clinic.logoUrl" :src="clinic.logoUrl" :alt="clinic.name" class="logo" />
          <Building2 v-else :size="24" class="logo-placeholder" />
        </div>
        <div class="info-header">
          <h3 class="clinic-name">{{ clinic.name }}</h3>
          <div class="tags-row">
            <span class="clinic-plan">{{ clinic.plan }}</span>
            <span 
              v-if="clinic.subscriptionStatus" 
              class="status-tag"
              :class="statusClasses[clinic.subscriptionStatus] || 'status-gray'"
            >
              {{ statusLabels[clinic.subscriptionStatus] || clinic.subscriptionStatus }}
            </span>
          </div>
        </div>
      </div>
  
      <div class="card-body">
        <div class="info-item">
          <span class="label">Responsável</span>
          <span class="value">{{ clinic.responsibleName || 'Não definido' }}</span>
        </div>
        <div class="info-item">
          <span class="label">Proprietário(a)</span>
          <span class="value">{{ clinic.owner?.name || 'Não definido' }}</span>
        </div>
        <div class="info-item">
          <span class="label">Localização</span>
          <span class="value">
            {{ clinic.address?.city ? `${clinic.address.city} - ${clinic.address.state}` : 'Não informada' }}
          </span>
        </div>
        <div class="info-item">
          <span class="label">CNPJ</span>
          <span class="value">{{ clinic.cnpj || 'Não cadastrado' }}</span>
        </div>
      </div>
  
      <div class="card-footer">
        <span class="date-label">
          <CalendarDays :size="14" />
          Criado em: {{ formatDate(clinic.createdAt) }}
        </span>
      </div>
    </RouterLink>
  </template>
  
  <script setup>
  import { RouterLink } from 'vue-router'
  import { Building2, CalendarDays } from 'lucide-vue-next'
  
  defineProps({
    clinic: {
      type: Object,
      required: true
    }
  })
  
  const formatDate = (dateString) => {
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' }
    return new Date(dateString).toLocaleDateString('pt-BR', options)
  }

  const statusLabels = {
    active: 'Ativo',
    past_due: 'Atrasado',
    canceled: 'Cancelado',
    incomplete: 'Incompleto',
    incomplete_expired: 'Expirado',
    trialing: 'Em Teste',
    unpaid: 'Não Pago',
    lifetime: 'Vitalício'
  }

  const statusClasses = {
    active: 'status-green',
    past_due: 'status-orange',
    canceled: 'status-red',
    incomplete: 'status-gray',
    incomplete_expired: 'status-gray',
    trialing: 'status-blue',
    unpaid: 'status-red',
    lifetime: 'status-purple'
  }
  </script>
  
  <style scoped>
  .clinic-card {
    display: flex;
    flex-direction: column;
    background-color: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    transition: box-shadow 0.2s ease;
    overflow: hidden;
    text-decoration: none;
    color: inherit;
  }
  .clinic-card:hover {
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
    border-color: #d1d5db;
  }
  
  .card-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem;
  }
  
  .logo-wrapper {
    flex-shrink: 0;
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background-color: #f3f4f6;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #e5e7eb;
  }
  .logo {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
  }
  .logo-placeholder {
    color: #9ca3af;
  }
  
  .info-header {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .clinic-name {
    font-size: 1.125rem;
    font-weight: 600;
    color: #111827;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .tags-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .clinic-plan {
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--color-primary, #0284c7);
    background-color: var(--color-primary-light, #e0f2fe);
    padding: 0.125rem 0.5rem;
    border-radius: 99px;
    text-transform: capitalize;
  }
  
  .status-tag {
    font-size: 0.75rem;
    font-weight: 500;
    padding: 0.125rem 0.5rem;
    border-radius: 99px;
    text-transform: capitalize;
  }

  .status-green { color: #166534; background-color: #dcfce7; }
  .status-blue { color: #1e40af; background-color: #dbeafe; }
  .status-orange { color: #9a3412; background-color: #ffedd5; }
  .status-red { color: #991b1b; background-color: #fee2e2; }
  .status-gray { color: #374151; background-color: #f3f4f6; }
  .status-purple { color: #6b21a8; background-color: #f3e8ff; border: 1px solid #d8b4fe; }
  
  .card-body {
    padding: 0 1.5rem 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .info-item {
    display: flex;
    flex-direction: column;
  }
  .label {
    font-size: 0.75rem;
    font-weight: 500;
    color: #6b7280;
    text-transform: uppercase;
    margin-bottom: 0.25rem;
  }
  .value {
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.5rem;
    background-color: #f9fafb;
    border-top: 1px solid #e5e7eb;
  }
  .date-label {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.75rem;
    color: #6b7280;
  }
  </style>