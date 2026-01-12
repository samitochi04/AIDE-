import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { apiFetch, API_ENDPOINTS } from '../../../config/api'
import { supabase } from '../../../lib/supabaseClient'
import styles from '../shared/ContentManagement.module.css'

export default function AdminContent() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const mediaInputRef = useRef(null)
  const thumbnailInputRef = useRef(null)
    // State
  const [contents, setContents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })
  
  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || '')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '')
  
  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('create')
  const [selectedContent, setSelectedContent] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [contentToDelete, setContentToDelete] = useState(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState({ media: false, thumbnail: false })
  
  // Content types matching database enum: video, image, article, tutorial, guide, infographic
  const contentTypes = [
    { value: 'article', label: t('admin.content.types.article', 'Article'), icon: 'ri-article-line' },
    { value: 'tutorial', label: t('admin.content.types.tutorial', 'Tutorial'), icon: 'ri-slideshow-line' },
    { value: 'guide', label: t('admin.content.types.guide', 'Guide'), icon: 'ri-book-open-line' },
    { value: 'video', label: t('admin.content.types.video', 'Video'), icon: 'ri-video-line' },
    { value: 'image', label: t('admin.content.types.image', 'Image'), icon: 'ri-image-line' },
    { value: 'infographic', label: t('admin.content.types.infographic', 'Infographic'), icon: 'ri-bar-chart-box-line' },
  ]

  // Target profiles matching database user_status enum
  const targetProfiles = [
    { value: 'student', label: t('admin.content.profiles.student', 'Student') },
    { value: 'worker', label: t('admin.content.profiles.worker', 'Worker') },
    { value: 'job_seeker', label: t('admin.content.profiles.jobSeeker', 'Job Seeker') },
    { value: 'retiree', label: t('admin.content.profiles.retiree', 'Retiree') },
    { value: 'tourist', label: t('admin.content.profiles.tourist', 'Tourist') },
    { value: 'other', label: t('admin.content.profiles.other', 'Other') },
  ]

  // Target nationalities matching database nationality_type enum
  const targetNationalities = [
    { value: 'french', label: t('admin.content.nationalities.french', 'French') },
    { value: 'eu_eea', label: t('admin.content.nationalities.euEea', 'EU/EEA') },
    { value: 'non_eu', label: t('admin.content.nationalities.nonEu', 'Non-EU') },
    { value: 'other', label: t('admin.content.nationalities.other', 'Other') },
  ]

  // Languages
  const languages = [
    { value: 'fr', label: '🇫🇷 Français' },
    { value: 'en', label: '🇬🇧 English' },
  ]

  // Fetch contents
  const fetchContents = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })
      
      if (search) params.set('search', search)
      if (typeFilter) params.set('type', typeFilter)
      if (statusFilter) params.set('status', statusFilter)
      
      const response = await apiFetch(`${API_ENDPOINTS.ADMIN.CONTENTS}?${params}`)
      
      setContents(response.data?.contents || [])
      setPagination(prev => ({
        ...prev,
        total: response.data?.pagination?.total || 0,
        totalPages: response.data?.pagination?.totalPages || 0,
      }))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, search, typeFilter, statusFilter])

  useEffect(() => {
    fetchContents()
  }, [fetchContents])

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (typeFilter) params.set('type', typeFilter)
    if (statusFilter) params.set('status', statusFilter)
    setSearchParams(params, { replace: true })
  }, [search, typeFilter, statusFilter, setSearchParams])

  // Handlers
  const handleSearchChange = (e) => {
    setSearch(e.target.value)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleTypeChange = (e) => {
    setTypeFilter(e.target.value)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const clearFilters = () => {
    setSearch('')
    setTypeFilter('')
    setStatusFilter('')
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  // Modal handlers
  const openCreateModal = () => {
    setSelectedContent({
      title: '',
      description: '',
      content_type: 'article', // Default to article
      media_url: '',
      thumbnail_url: '',
      duration_seconds: null,
      tags: [],
      target_profiles: ['student', 'worker', 'job_seeker', 'retiree', 'tourist', 'other'],
      target_nationalities: ['french', 'eu_eea', 'non_eu', 'other'],
      target_regions: null,
      language: 'fr',
      slug: '',
      meta_title: '',
      meta_description: '',
      is_published: false,
      is_featured: false,
      display_order: 0,
    })
    setModalMode('create')
    setShowModal(true)
  }

  const openEditModal = (content) => {
    setSelectedContent({ ...content })
    setModalMode('edit')
    setShowModal(true)
  }

  const openViewModal = (content) => {
    setSelectedContent(content)
    setModalMode('view')
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedContent(null)
    setModalMode('create')
  }

  // Generate slug from title
  const generateSlug = (title, addTimestamp = false) => {
    let slug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    
    // Add timestamp suffix to ensure uniqueness for new content
    if (addTimestamp) {
      slug = `${slug}-${Date.now().toString(36)}`
    }
    
    return slug
  }

  // Get appropriate bucket based on content type
  const getBucket = (contentType, isMedia = true) => {
    if (!isMedia) return 'blog-images' // thumbnails always go to blog-images
    
    switch (contentType) {
      case 'video':
      case 'tutorial':
        return 'tutorial-media'
      case 'article':
      case 'guide':
        return 'blog-images'
      default:
        return 'content-assets'
    }
  }

  // Upload file to Supabase storage
  const uploadFile = async (file, type = 'media') => {
    const isMedia = type === 'media'
    const contentType = selectedContent?.content_type || 'article'
    const bucket = getBucket(contentType, isMedia)
    
    // Generate unique filename
    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const slug = selectedContent?.slug || generateSlug(selectedContent?.title || 'content')
    const filePath = `${slug}/${timestamp}-${sanitizedName}`
    
    setUploading(prev => ({ ...prev, [type]: true }))
    
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })
      
      if (error) throw error
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path)
      
      return publicUrl
    } catch (err) {
      console.error('Upload error:', err)
      setError(t('admin.content.errors.uploadFailed', 'Failed to upload file: ') + err.message)
      return null
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }))
    }
  }

  // Handle media file selection
  const handleMediaUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Validate file size (500MB for videos, 10MB for images)
    const maxSize = selectedContent?.content_type === 'video' || selectedContent?.content_type === 'tutorial' 
      ? 500 * 1024 * 1024 
      : 10 * 1024 * 1024
    
    if (file.size > maxSize) {
      setError(t('admin.content.errors.fileTooLarge', 'File is too large. Max size: ') + (maxSize / 1024 / 1024) + 'MB')
      return
    }
    
    const url = await uploadFile(file, 'media')
    if (url) {
      setSelectedContent(prev => ({ ...prev, media_url: url }))
    }
    
    // Reset input
    if (mediaInputRef.current) {
      mediaInputRef.current.value = ''
    }
  }

  // Handle thumbnail file selection
  const handleThumbnailUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Validate file type (images only)
    if (!file.type.startsWith('image/')) {
      setError(t('admin.content.errors.invalidImageType', 'Please select an image file'))
      return
    }
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError(t('admin.content.errors.imageTooLarge', 'Image is too large. Max size: 5MB'))
      return
    }
    
    const url = await uploadFile(file, 'thumbnail')
    if (url) {
      setSelectedContent(prev => ({ ...prev, thumbnail_url: url }))
    }
    
    // Reset input
    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.value = ''
    }
  }

  // Get accepted file types based on content type
  const getAcceptedMediaTypes = () => {
    const contentType = selectedContent?.content_type
    switch (contentType) {
      case 'video':
      case 'tutorial':
        return 'video/mp4,video/webm,video/quicktime,image/*'
      case 'image':
      case 'infographic':
        return 'image/*'
      default:
        return 'image/*,video/*,application/pdf'
    }
  }

  // Save content
  const handleSave = async () => {
    if (!selectedContent) return
    
    try {
      setSaving(true)
      
      // Validate required fields
      if (!selectedContent.title) {
        setError(t('admin.content.errors.titleRequired', 'Title is required'))
        setSaving(false)
        return
      }
      if (!selectedContent.media_url) {
        setError(t('admin.content.errors.mediaRequired', 'Media URL is required'))
        setSaving(false)
        return
      }
      if (!selectedContent.content_type) {
        setError(t('admin.content.errors.typeRequired', 'Content type is required'))
        setSaving(false)
        return
      }
      
      const payload = {
        title: selectedContent.title,
        description: selectedContent.description || null,
        content_type: selectedContent.content_type || 'article',
        media_url: selectedContent.media_url,
        thumbnail_url: selectedContent.thumbnail_url || null,
        duration_seconds: selectedContent.content_type === 'video' ? (selectedContent.duration_seconds || null) : null,
        tags: selectedContent.tags || [],
        target_profiles: selectedContent.target_profiles || [],
        target_nationalities: selectedContent.target_nationalities || [],
        target_regions: selectedContent.target_regions || null,
        language: selectedContent.language || 'fr',
        // For new content, always generate unique slug; for edit, use existing or generate
        slug: modalMode === 'create' 
          ? generateSlug(selectedContent.title, true) // Add timestamp for uniqueness
          : (selectedContent.slug || generateSlug(selectedContent.title)),
        meta_title: selectedContent.meta_title || null,
        meta_description: selectedContent.meta_description || null,
        is_published: selectedContent.is_published || false,
        is_featured: selectedContent.is_featured || false,
        display_order: selectedContent.display_order || 0,
        published_at: selectedContent.is_published ? (selectedContent.published_at || new Date().toISOString()) : null,
      }

      if (modalMode === 'create') {
        await apiFetch(API_ENDPOINTS.ADMIN.CONTENTS, {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      } else {
        await apiFetch(API_ENDPOINTS.ADMIN.CONTENT(selectedContent.id), {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
      }

      closeModal()
      fetchContents()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // Delete content
  const handleDelete = async () => {
    if (!contentToDelete) return
    
    try {
      setSaving(true)
      await apiFetch(API_ENDPOINTS.ADMIN.CONTENT(contentToDelete.id), {
        method: 'DELETE',
      })
      setShowDeleteConfirm(false)
      setContentToDelete(null)
      fetchContents()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // Toggle featured
  const toggleFeatured = async (content) => {
    try {
      await apiFetch(API_ENDPOINTS.ADMIN.CONTENT(content.id), {
        method: 'PUT',
        body: JSON.stringify({ is_featured: !content.is_featured }),
      })
      fetchContents()
    } catch (err) {
      setError(err.message)
    }
  }

  // Publish/Unpublish
  const togglePublish = async (content) => {
    try {
      const isPublishing = !content.is_published
      await apiFetch(API_ENDPOINTS.ADMIN.CONTENT(content.id), {
        method: 'PUT',
        body: JSON.stringify({ 
          is_published: isPublishing,
          published_at: isPublishing ? new Date().toISOString() : null,
        }),
      })
      fetchContents()
    } catch (err) {
      setError(err.message)
    }
  }

  // Handle tags
  const handleTagsChange = (e) => {
    const tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean)
    setSelectedContent({ ...selectedContent, tags })
  }

  // Handle multi-select for profiles
  const handleProfileToggle = (profile) => {
    const current = selectedContent?.target_profiles || []
    const updated = current.includes(profile)
      ? current.filter(p => p !== profile)
      : [...current, profile]
    setSelectedContent({ ...selectedContent, target_profiles: updated })
  }

  // Handle multi-select for nationalities
  const handleNationalityToggle = (nationality) => {
    const current = selectedContent?.target_nationalities || []
    const updated = current.includes(nationality)
      ? current.filter(n => n !== nationality)
      : [...current, nationality]
    setSelectedContent({ ...selectedContent, target_nationalities: updated })
  }

  // Pagination
  const goToPage = (page) => {
    setPagination(prev => ({ ...prev, page }))
  }

  // Get type icon
  const getTypeIcon = (type) => {
    return contentTypes.find(t => t.value === type)?.icon || 'ri-article-line'
  }

  // Format date
  const formatDate = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Format duration
  const formatDuration = (seconds) => {
    if (!seconds) return '-'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <h1>{t('admin.content.title', 'Content Management')}</h1>
          <p>{t('admin.content.subtitle', 'Manage articles, guides, videos, and infographics')}</p>
        </div>
        <button className={styles.addButton} onClick={openCreateModal}>
          <i className="ri-add-line" />
          {t('admin.content.addContent', 'Add Content')}
        </button>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <i className="ri-article-line" />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{pagination.total}</span>
            <span className={styles.statLabel}>{t('admin.content.totalContent', 'Total Content')}</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <i className="ri-check-double-line" />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>
              {contents.filter(c => c.is_published).length}
            </span>
            <span className={styles.statLabel}>{t('admin.content.published', 'Published')}</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <i className="ri-video-line" />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>
              {contents.filter(c => c.content_type === 'video').length}
            </span>
            <span className={styles.statLabel}>{t('admin.content.videos', 'Videos')}</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <i className="ri-star-line" />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>
              {contents.filter(c => c.is_featured).length}
            </span>
            <span className={styles.statLabel}>{t('admin.content.featured', 'Featured')}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <i className="ri-search-line" />
          <input
            type="text"
            placeholder={t('admin.content.searchPlaceholder', 'Search content...')}
            value={search}
            onChange={handleSearchChange}
          />
        </div>
        
        <select value={typeFilter} onChange={handleTypeChange} className={styles.filterSelect}>
          <option value="">{t('admin.content.allTypes', 'All Types')}</option>
          {contentTypes.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        
        <select value={statusFilter} onChange={handleStatusChange} className={styles.filterSelect}>
          <option value="">{t('admin.content.allStatus', 'All Status')}</option>
          <option value="published">{t('admin.content.statusPublished', 'Published')}</option>
          <option value="draft">{t('admin.content.statusDraft', 'Draft')}</option>
        </select>
        
        {(search || typeFilter || statusFilter) && (
          <button className={styles.clearButton} onClick={clearFilters}>
            <i className="ri-close-line" />
            {t('admin.clear', 'Clear')}
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className={styles.error}>
          <i className="ri-error-warning-line" />
          {error}
          <button onClick={() => setError(null)}>
            <i className="ri-close-line" />
          </button>
        </div>
      )}

      {/* Content table */}
      {loading ? (
        <div className={styles.loading}>
          <i className="ri-loader-4-line ri-spin" />
          <span>{t('admin.loading', 'Loading...')}</span>
        </div>
      ) : contents.length === 0 ? (
        <div className={styles.empty}>
          <i className="ri-article-line" />
          <p>{t('admin.content.noContent', 'No content found')}</p>
          {(search || typeFilter || statusFilter) && (
            <button onClick={clearFilters} className={styles.secondaryButton}>
              {t('admin.clearFilters', 'Clear filters')}
            </button>
          )}
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t('admin.content.titleCol', 'Title')}</th>
                <th>{t('admin.content.type', 'Type')}</th>
                <th>{t('admin.content.language', 'Lang')}</th>
                <th>{t('admin.content.status', 'Status')}</th>
                <th>{t('admin.content.views', 'Views')}</th>
                <th>{t('admin.actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {contents.map(content => (
                <tr key={content.id}>
                  <td className={styles.nameCell}>
                    <span className={styles.itemName}>
                      {content.is_featured && (
                        <i className="ri-star-fill" style={{ color: 'var(--color-warning)', marginRight: '0.5rem' }} />
                      )}
                      {content.title}
                    </span>
                    <span className={styles.itemDesc}>
                      {content.description?.substring(0, 60)}
                      {content.description?.length > 60 ? '...' : ''}
                    </span>
                  </td>
                  <td>
                    <span className={styles.badge + ' ' + styles.badgeInfo}>
                      <i className={getTypeIcon(content.content_type)} />
                      {contentTypes.find(t => t.value === content.content_type)?.label || content.content_type}
                    </span>
                  </td>
                  <td>
                    <span className={styles.badge + ' ' + styles.badgeSecondary}>
                      {content.language === 'fr' ? '🇫🇷' : '🇬🇧'} {content.language?.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${content.is_published ? styles.badgeSuccess : styles.badgeSecondary}`}>
                      {content.is_published ? t('admin.content.published', 'Published') : t('admin.content.draft', 'Draft')}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      {content.view_count || 0}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        className={styles.actionButton}
                        onClick={() => toggleFeatured(content)}
                        title={content.is_featured ? t('admin.removeFeatured', 'Remove from featured') : t('admin.addFeatured', 'Add to featured')}
                        style={content.is_featured ? { color: 'var(--color-warning)' } : {}}
                      >
                        <i className={content.is_featured ? 'ri-star-fill' : 'ri-star-line'} />
                      </button>
                      <button
                        className={styles.actionButton}
                        onClick={() => togglePublish(content)}
                        title={content.is_published ? t('admin.unpublish', 'Unpublish') : t('admin.publish', 'Publish')}
                        style={content.is_published ? { color: 'var(--color-success)' } : {}}
                      >
                        <i className={content.is_published ? 'ri-eye-line' : 'ri-eye-off-line'} />
                      </button>
                      <button
                        className={styles.actionButton}
                        onClick={() => openViewModal(content)}
                        title={t('admin.view', 'View')}
                      >
                        <i className="ri-file-list-line" />
                      </button>
                      <button
                        className={styles.actionButton}
                        onClick={() => openEditModal(content)}
                        title={t('admin.edit', 'Edit')}
                      >
                        <i className="ri-edit-line" />
                      </button>
                      <button
                        className={`${styles.actionButton} ${styles.danger}`}
                        onClick={() => {
                          setContentToDelete(content)
                          setShowDeleteConfirm(true)
                        }}
                        title={t('admin.delete', 'Delete')}
                      >
                        <i className="ri-delete-bin-line" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            disabled={pagination.page === 1}
            onClick={() => goToPage(pagination.page - 1)}
          >
            <i className="ri-arrow-left-s-line" />
          </button>
          <span className={styles.pageInfo}>
            {t('admin.page', 'Page')} {pagination.page} {t('admin.of', 'of')} {pagination.totalPages}
          </span>
          <button
            disabled={pagination.page === pagination.totalPages}
            onClick={() => goToPage(pagination.page + 1)}
          >
            <i className="ri-arrow-right-s-line" />
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={`${styles.modal} ${styles.modalXL}`} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>
                {modalMode === 'create' && t('admin.content.createContent', 'Create Content')}
                {modalMode === 'edit' && t('admin.content.editContent', 'Edit Content')}
                {modalMode === 'view' && t('admin.content.viewContent', 'Content Details')}
              </h2>
              <button className={styles.closeButton} onClick={closeModal}>
                <i className="ri-close-line" />
              </button>
            </div>
            
            <div className={styles.modalBody}>
              {modalMode === 'view' ? (
                <div className={styles.viewDetails}>
                  <div className={styles.detailGroup}>
                    <label>{t('admin.content.title', 'Title')}</label>
                    <p>{selectedContent?.title}</p>
                  </div>
                  <div className={styles.detailGroup}>
                    <label>{t('admin.content.description', 'Description')}</label>
                    <p>{selectedContent?.description || '-'}</p>
                  </div>
                  <div className={styles.detailRow}>
                    <div className={styles.detailGroup}>
                      <label>{t('admin.content.type', 'Type')}</label>
                      <p>{contentTypes.find(t => t.value === selectedContent?.content_type)?.label}</p>
                    </div>
                    <div className={styles.detailGroup}>
                      <label>{t('admin.content.language', 'Language')}</label>
                      <p>{languages.find(l => l.value === selectedContent?.language)?.label}</p>
                    </div>
                    <div className={styles.detailGroup}>
                      <label>{t('admin.content.status', 'Status')}</label>
                      <p>{selectedContent?.is_published ? 'Published' : 'Draft'}</p>
                    </div>
                  </div>
                  <div className={styles.detailGroup}>
                    <label>{t('admin.content.mediaUrl', 'Media URL')}</label>
                    <p><a href={selectedContent?.media_url} target="_blank" rel="noopener noreferrer">{selectedContent?.media_url}</a></p>
                  </div>
                  {selectedContent?.thumbnail_url && (
                    <div className={styles.detailGroup}>
                      <label>{t('admin.content.thumbnail', 'Thumbnail')}</label>
                      <img src={selectedContent.thumbnail_url} alt="Thumbnail" style={{ maxWidth: '200px', borderRadius: '8px' }} />
                    </div>
                  )}
                  {selectedContent?.content_type === 'video' && selectedContent?.duration_seconds && (
                    <div className={styles.detailGroup}>
                      <label>{t('admin.content.duration', 'Duration')}</label>
                      <p>{formatDuration(selectedContent.duration_seconds)}</p>
                    </div>
                  )}
                  <div className={styles.detailGroup}>
                    <label>{t('admin.content.targetProfiles', 'Target Profiles')}</label>
                    <div className={styles.tagList}>
                      {(selectedContent?.target_profiles || []).map(p => (
                        <span key={p} className={styles.badge + ' ' + styles.badgeInfo}>
                          {targetProfiles.find(tp => tp.value === p)?.label || p}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className={styles.detailGroup}>
                    <label>{t('admin.content.tags', 'Tags')}</label>
                    <p>{selectedContent?.tags?.join(', ') || '-'}</p>
                  </div>
                  <div className={styles.detailRow}>
                    <div className={styles.detailGroup}>
                      <label>{t('admin.content.views', 'Views')}</label>
                      <p>{selectedContent?.view_count || 0}</p>
                    </div>
                    <div className={styles.detailGroup}>
                      <label>{t('admin.content.likes', 'Likes')}</label>
                      <p>{selectedContent?.like_count || 0}</p>
                    </div>
                    <div className={styles.detailGroup}>
                      <label>{t('admin.content.shares', 'Shares')}</label>
                      <p>{selectedContent?.share_count || 0}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <form className={styles.form} onSubmit={e => e.preventDefault()}>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>{t('admin.content.contentType', 'Content Type')} <span>*</span></label>
                      <select
                        value={selectedContent?.content_type || 'article'}
                        onChange={e => setSelectedContent({ ...selectedContent, content_type: e.target.value })}
                      >
                        {contentTypes.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label>{t('admin.content.language', 'Language')}</label>
                      <select
                        value={selectedContent?.language || 'fr'}
                        onChange={e => setSelectedContent({ ...selectedContent, language: e.target.value })}
                      >
                        {languages.map(lang => (
                          <option key={lang.value} value={lang.value}>{lang.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label>{t('admin.content.displayOrder', 'Display Order')}</label>
                      <input
                        type="number"
                        value={selectedContent?.display_order || 0}
                        onChange={e => setSelectedContent({ ...selectedContent, display_order: parseInt(e.target.value) || 0 })}
                        min="0"
                      />
                    </div>
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label>{t('admin.content.title', 'Title')} <span>*</span></label>
                    <input
                      type="text"
                      value={selectedContent?.title || ''}
                      onChange={e => {
                        const title = e.target.value
                        setSelectedContent({ 
                          ...selectedContent, 
                          title,
                          slug: selectedContent.slug || generateSlug(title),
                        })
                      }}
                      placeholder="Enter content title"
                      required
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label>{t('admin.content.description', 'Description')}</label>
                    <textarea
                      value={selectedContent?.description || ''}
                      onChange={e => setSelectedContent({ ...selectedContent, description: e.target.value })}
                      placeholder="Brief description of the content"
                      rows={3}
                    />
                  </div>
                  
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>{t('admin.content.mediaUrl', 'Media')} <span>*</span></label>
                      <div className={styles.uploadField}>
                        <input
                          type="text"
                          value={selectedContent?.media_url || ''}
                          onChange={e => setSelectedContent({ ...selectedContent, media_url: e.target.value })}
                          placeholder="https://... or upload a file"
                        />
                        <input
                          type="file"
                          ref={mediaInputRef}
                          onChange={handleMediaUpload}
                          accept={getAcceptedMediaTypes()}
                          style={{ display: 'none' }}
                        />
                        <button
                          type="button"
                          className={styles.uploadButton}
                          onClick={() => mediaInputRef.current?.click()}
                          disabled={uploading.media}
                        >
                          {uploading.media ? (
                            <i className="ri-loader-4-line ri-spin" />
                          ) : (
                            <i className="ri-upload-cloud-line" />
                          )}
                          {uploading.media ? t('common.uploading', 'Uploading...') : t('common.upload', 'Upload')}
                        </button>
                      </div>
                      {selectedContent?.media_url && (
                        <div className={styles.previewLink}>
                          <a href={selectedContent.media_url} target="_blank" rel="noopener noreferrer">
                            <i className="ri-external-link-line" /> {t('admin.content.viewMedia', 'View media')}
                          </a>
                        </div>
                      )}
                    </div>
                    <div className={styles.formGroup}>
                      <label>{t('admin.content.thumbnailUrl', 'Thumbnail')}</label>
                      <div className={styles.uploadField}>
                        <input
                          type="text"
                          value={selectedContent?.thumbnail_url || ''}
                          onChange={e => setSelectedContent({ ...selectedContent, thumbnail_url: e.target.value })}
                          placeholder="https://... or upload an image"
                        />
                        <input
                          type="file"
                          ref={thumbnailInputRef}
                          onChange={handleThumbnailUpload}
                          accept="image/*"
                          style={{ display: 'none' }}
                        />
                        <button
                          type="button"
                          className={styles.uploadButton}
                          onClick={() => thumbnailInputRef.current?.click()}
                          disabled={uploading.thumbnail}
                        >
                          {uploading.thumbnail ? (
                            <i className="ri-loader-4-line ri-spin" />
                          ) : (
                            <i className="ri-image-add-line" />
                          )}
                          {uploading.thumbnail ? t('common.uploading', 'Uploading...') : t('common.upload', 'Upload')}
                        </button>
                      </div>
                      {selectedContent?.thumbnail_url && (
                        <div className={styles.thumbnailPreview}>
                          <img src={selectedContent.thumbnail_url} alt="Thumbnail preview" />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {selectedContent?.content_type === 'video' && (
                    <div className={styles.formGroup}>
                      <label>{t('admin.content.durationSeconds', 'Duration (seconds)')}</label>
                      <input
                        type="number"
                        value={selectedContent?.duration_seconds || ''}
                        onChange={e => setSelectedContent({ ...selectedContent, duration_seconds: parseInt(e.target.value) || null })}
                        placeholder="e.g., 180 for 3 minutes"
                        min="0"
                      />
                    </div>
                  )}
                  
                  <div className={styles.formGroup}>
                    <label>{t('admin.content.slug', 'URL Slug')}</label>
                    <input
                      type="text"
                      value={selectedContent?.slug || ''}
                      onChange={e => setSelectedContent({ ...selectedContent, slug: e.target.value })}
                      placeholder="url-friendly-slug"
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label>{t('admin.content.targetProfiles', 'Target Profiles')}</label>
                    <div className={styles.checkboxGrid}>
                      {targetProfiles.map(profile => (
                        <label key={profile.value} className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            checked={(selectedContent?.target_profiles || []).includes(profile.value)}
                            onChange={() => handleProfileToggle(profile.value)}
                          />
                          <span>{profile.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label>{t('admin.content.targetNationalities', 'Target Nationalities')}</label>
                    <div className={styles.checkboxGrid}>
                      {targetNationalities.map(nat => (
                        <label key={nat.value} className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            checked={(selectedContent?.target_nationalities || []).includes(nat.value)}
                            onChange={() => handleNationalityToggle(nat.value)}
                          />
                          <span>{nat.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label>{t('admin.content.tags', 'Tags')} ({t('admin.content.commaSeparated', 'comma separated')})</label>
                    <input
                      type="text"
                      value={(selectedContent?.tags || []).join(', ')}
                      onChange={handleTagsChange}
                      placeholder="visa, housing, student, tips"
                    />
                  </div>
                  
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>{t('admin.content.metaTitle', 'SEO Title')}</label>
                      <input
                        type="text"
                        value={selectedContent?.meta_title || ''}
                        onChange={e => setSelectedContent({ ...selectedContent, meta_title: e.target.value })}
                        placeholder="SEO title for search engines"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>{t('admin.content.metaDescription', 'SEO Description')}</label>
                      <input
                        type="text"
                        value={selectedContent?.meta_description || ''}
                        onChange={e => setSelectedContent({ ...selectedContent, meta_description: e.target.value })}
                        placeholder="SEO meta description"
                      />
                    </div>
                  </div>
                  
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={selectedContent?.is_published ?? false}
                          onChange={e => setSelectedContent({ ...selectedContent, is_published: e.target.checked })}
                        />
                        <span>{t('admin.content.publish', 'Publish immediately')}</span>
                      </label>
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={selectedContent?.is_featured ?? false}
                          onChange={e => setSelectedContent({ ...selectedContent, is_featured: e.target.checked })}
                        />
                        <span>{t('admin.content.markFeatured', 'Mark as Featured')}</span>
                      </label>
                    </div>
                  </div>
                </form>
              )}
            </div>
            
            <div className={styles.modalFooter}>
              <button className={styles.secondaryButton} onClick={closeModal}>
                {modalMode === 'view' ? t('admin.close', 'Close') : t('admin.cancel', 'Cancel')}
              </button>
              {modalMode !== 'view' && (
                <button
                  className={styles.primaryButton}
                  onClick={handleSave}
                  disabled={saving || !selectedContent?.title || !selectedContent?.media_url}
                >
                  {saving ? (
                    <>
                      <i className="ri-loader-4-line ri-spin" />
                      {t('admin.saving', 'Saving...')}
                    </>
                  ) : modalMode === 'create' ? (
                    <>
                      <i className="ri-add-line" />
                      {t('admin.create', 'Create')}
                    </>
                  ) : (
                    <>
                      <i className="ri-check-line" />
                      {t('admin.save', 'Save')}
                    </>
                  )}
                </button>
              )}
              {modalMode === 'view' && (
                <button className={styles.primaryButton} onClick={() => setModalMode('edit')}>
                  <i className="ri-edit-line" />
                  {t('admin.edit', 'Edit')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className={styles.modalOverlay} onClick={() => setShowDeleteConfirm(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalBody}>
              <div className={styles.deleteConfirm}>
                <i className="ri-delete-bin-line" />
                <h3>{t('admin.content.deleteConfirm', 'Delete Content?')}</h3>
                <p>
                  {t('admin.content.deleteWarning', 'Are you sure you want to delete')} <strong>{contentToDelete?.title}</strong>?
                </p>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.secondaryButton} onClick={() => setShowDeleteConfirm(false)}>
                {t('admin.cancel', 'Cancel')}
              </button>
              <button className={styles.dangerButton} onClick={handleDelete} disabled={saving}>
                {saving ? (
                  <>
                    <i className="ri-loader-4-line ri-spin" />
                    {t('admin.deleting', 'Deleting...')}
                  </>
                ) : (
                  <>
                    <i className="ri-delete-bin-line" />
                    {t('admin.delete', 'Delete')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
