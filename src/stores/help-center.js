import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../utils/api'
import { useToast } from 'vue-toastification'

export const useHelpCenterStore = defineStore('help-center', () => {
    const toast = useToast()

    // State
    const categories = ref([])
    const articles = ref([])
    const currentArticle = ref(null)
    const loading = ref(false)
    const totalArticles = ref(0)

    // =============================================
    // CATEGORIAS
    // =============================================

    async function fetchCategories() {
        try {
            const { data } = await api.get('/help-center/categories')
            categories.value = data
            return data
        } catch (error) {
            console.error('[HelpCenterStore] Erro ao carregar categorias:', error)
            toast.error('Erro ao carregar categorias.')
            return []
        }
    }

    async function createCategory(payload) {
        loading.value = true
        try {
            const { data } = await api.post('/help-center/categories', payload)
            categories.value.push(data)
            toast.success('Categoria criada com sucesso!')
            return data
        } catch (error) {
            const message = error.response?.data?.message || 'Erro ao criar categoria.'
            toast.error(message)
            throw error
        } finally {
            loading.value = false
        }
    }

    async function updateCategory(id, payload) {
        loading.value = true
        try {
            const { data } = await api.put(`/help-center/categories/${id}`, payload)
            const index = categories.value.findIndex(c => c._id === id)
            if (index !== -1) categories.value[index] = data
            toast.success('Categoria atualizada!')
            return data
        } catch (error) {
            const message = error.response?.data?.message || 'Erro ao atualizar categoria.'
            toast.error(message)
            throw error
        } finally {
            loading.value = false
        }
    }

    async function deleteCategory(id) {
        loading.value = true
        try {
            await api.delete(`/help-center/categories/${id}`)
            categories.value = categories.value.filter(c => c._id !== id)
            toast.success('Categoria excluída!')
        } catch (error) {
            const message = error.response?.data?.message || 'Erro ao excluir categoria.'
            toast.error(message)
            throw error
        } finally {
            loading.value = false
        }
    }

    async function reorderCategories(orderedIds) {
        try {
            await api.put('/help-center/categories/reorder', { orderedIds })
        } catch (error) {
            toast.error('Erro ao reordenar categorias.')
            throw error
        }
    }

    // =============================================
    // ARTIGOS
    // =============================================

    async function fetchArticles(filters = {}) {
        loading.value = true
        try {
            const params = new URLSearchParams()
            if (filters.category) params.append('category', filters.category)
            if (filters.published !== undefined) params.append('published', filters.published)
            if (filters.q) params.append('q', filters.q)

            const { data } = await api.get(`/help-center/articles?${params.toString()}`)
            articles.value = data.articles
            totalArticles.value = data.total
            return data
        } catch (error) {
            console.error('[HelpCenterStore] Erro ao carregar artigos:', error)
            toast.error('Erro ao carregar artigos.')
            return { articles: [], total: 0 }
        } finally {
            loading.value = false
        }
    }

    async function fetchArticle(id) {
        loading.value = true
        try {
            const { data } = await api.get(`/help-center/articles/${id}`)
            currentArticle.value = data
            return data
        } catch (error) {
            console.error('[HelpCenterStore] Erro ao carregar artigo:', error)
            toast.error('Erro ao carregar artigo.')
            return null
        } finally {
            loading.value = false
        }
    }

    async function createArticle(payload) {
        loading.value = true
        try {
            const { data } = await api.post('/help-center/articles', payload)
            toast.success('Artigo criado com sucesso!')
            return data
        } catch (error) {
            const message = error.response?.data?.message || 'Erro ao criar artigo.'
            toast.error(message)
            throw error
        } finally {
            loading.value = false
        }
    }

    async function updateArticle(id, payload) {
        loading.value = true
        try {
            const { data } = await api.put(`/help-center/articles/${id}`, payload)
            currentArticle.value = data
            toast.success('Artigo atualizado!')
            return data
        } catch (error) {
            const message = error.response?.data?.message || 'Erro ao atualizar artigo.'
            toast.error(message)
            throw error
        } finally {
            loading.value = false
        }
    }

    async function deleteArticle(id) {
        loading.value = true
        try {
            await api.delete(`/help-center/articles/${id}`)
            articles.value = articles.value.filter(a => a._id !== id)
            toast.success('Artigo excluído!')
        } catch (error) {
            const message = error.response?.data?.message || 'Erro ao excluir artigo.'
            toast.error(message)
            throw error
        } finally {
            loading.value = false
        }
    }

    async function togglePublish(id) {
        try {
            const { data } = await api.patch(`/help-center/articles/${id}/toggle-publish`)
            const index = articles.value.findIndex(a => a._id === id)
            if (index !== -1) {
                articles.value[index].published = data.published
            }
            toast.success(data.message)
            return data
        } catch (error) {
            toast.error('Erro ao alterar publicação.')
            throw error
        }
    }

    async function uploadImage(file) {
        const formData = new FormData()
        formData.append('image', file)
        try {
            const { data } = await api.post('/help-center/upload-image', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })
            return data
        } catch (error) {
            const message = error.response?.data?.message || 'Erro ao fazer upload da imagem.'
            toast.error(message)
            throw error
        }
    }

    return {
        categories,
        articles,
        currentArticle,
        loading,
        totalArticles,
        fetchCategories,
        createCategory,
        updateCategory,
        deleteCategory,
        reorderCategories,
        fetchArticles,
        fetchArticle,
        createArticle,
        updateArticle,
        deleteArticle,
        togglePublish,
        uploadImage,
    }
})
