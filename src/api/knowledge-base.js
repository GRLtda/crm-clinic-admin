import api from '@/utils/api'

export const listKnowledgeCategories = () => api.get('/knowledge-base/categories')
export const createKnowledgeCategory = (payload) => api.post('/knowledge-base/categories', payload)
export const updateKnowledgeCategory = (categoryId, payload) =>
  api.put(`/knowledge-base/categories/${categoryId}`, payload)
export const deleteKnowledgeCategory = (categoryId) =>
  api.delete(`/knowledge-base/categories/${categoryId}`)

export const listKnowledgePages = (params = {}) => api.get('/knowledge-base/pages', { params })
export const getKnowledgePageById = (pageId) => api.get(`/knowledge-base/pages/${pageId}`)
export const createKnowledgePage = (payload) => api.post('/knowledge-base/pages', payload)
export const updateKnowledgePage = (pageId, payload) => api.put(`/knowledge-base/pages/${pageId}`, payload)
export const deleteKnowledgePage = (pageId) => api.delete(`/knowledge-base/pages/${pageId}`)

export const uploadKnowledgeImage = (file, alt = '') => {
  const formData = new FormData()
  formData.append('image', file)
  formData.append('alt', alt)

  return api.post('/knowledge-base/assets', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}
