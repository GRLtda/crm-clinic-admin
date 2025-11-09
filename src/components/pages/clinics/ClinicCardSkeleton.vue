<template>
    <div class="clinic-card-skeleton">
      <div class="card-header">
        <SkeletonLoader width="52px" height="52px" radius="50%" />
        <div class="info-header">
          <SkeletonLoader width="180px" height="20px" />
          <SkeletonLoader width="70px" height="18px" />
        </div>
      </div>
      <div class="card-body">
        <SkeletonLoader width="100px" height="12px" />
        <SkeletonLoader width="160px" height="16px" />
        <SkeletonLoader width="100px" height="12px" />
        <SkeletonLoader width="160px" height="16px" />
      </div>
      <div class="card-footer">
        <SkeletonLoader width="120px" height="14px" />
      </div>
    </div>
  </template>
  
  <script setup>
  import SkeletonLoader from '../../global/SkeletonLoader.vue'
  </script>
  
  <style scoped>
  .clinic-card-skeleton {
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    background-color: #fff;
    overflow: hidden;
  }
  .card-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem;
  }
  .info-header {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .card-body {
    padding: 0 1.5rem 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .card-footer {
    padding: 1rem 1.5rem;
    background-color: #f9fafb;
    border-top: 1px solid #e5e7eb;
  }
  </style>