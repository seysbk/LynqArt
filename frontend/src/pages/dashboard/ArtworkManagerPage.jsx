import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../../lib/api'
import { mediaUrl } from '../../lib/media'
import { ImageUpload } from '../../components/ui/ImageUpload'
import { MarkdownTips } from '../../components/ui/MarkdownTips'
import { Button } from '../../components/ui/Button'
import { QrCode, Download, Eye, Plus, Check, ExternalLink, Sparkles, ArrowRight, ArrowLeft } from 'lucide-react'
import { AIAssistantModal } from '../../components/ai/AIAssistantModal'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const empty = {
  title: '',
  description: '',
  medium: '',
  year_created: '',
  dimensions: '',
  status: 'draft',
  category_id: '',
  tag_ids: [],
  allow_comments: true,
  is_featured: false,
  markdown_statement: '',
  change_note: '',
}

const inputClass =
  'w-full rounded-[9px] border border-white/[0.09] bg-[#0D0F14] px-3.5 py-2.5 text-xs text-[#F4F4F5] outline-none transition focus:border-indigo-400 placeholder:text-[#71717A]'

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

const errorText = (error) =>
  Object.values(error?.response?.data || {})
    .flat()
    .join(' ') || 'Could not save artwork. Please check form details.'

export function ArtworkManagerPage() {
  const { artworkSlug } = useParams()
  const navigate = useNavigate()
  const [activeStep, setActiveStep] = useState(1)
  const [form, setForm] = useState(empty)
  const [artwork, setArtwork] = useState(null)
  const [categories, setCategories] = useState([])
  const [tags, setTags] = useState([])
  const [newCategory, setNewCategory] = useState('')
  const [imageMeta, setImageMeta] = useState({ caption: '', display_order: 0, is_process_image: false })
  const [exhibitions, setExhibitions] = useState([])
  const [linkedExhibitionIds, setLinkedExhibitionIds] = useState(new Set())
  const [qrCode, setQrCode] = useState(null)
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState(false)
  const [showAiModal, setShowAiModal] = useState(false)

  const loadChoices = () =>
    Promise.all([
      api.get('/artworks/categories/'),
      api.get('/artworks/tags/'),
      api.get('/exhibitions/'),
    ]).then(([categoriesRes, tagsRes, exhRes]) => {
      setCategories(categoriesRes.data.results || categoriesRes.data || [])
      setTags(tagsRes.data.results || tagsRes.data || [])
      setExhibitions(exhRes.data.results || exhRes.data || [])
    })

  const loadArtwork = async (slug) => {
    const { data } = await api.get(`/artworks/${slug}/`)
    setArtwork(data)
    setForm({
      ...empty,
      ...data,
      category_id: data.category_detail?.id || '',
      tag_ids: data.tags?.map((tag) => tag.id) || [],
      markdown_statement: data.current_version_detail?.markdown_statement || '',
      change_note: '',
    })

    const exhLinksRes = await api.get('/exhibitions/artworks/', { params: { artwork: data.id } }).catch(() => ({ data: [] }))
    const exhLinks = exhLinksRes.data.results || exhLinksRes.data || []
    setLinkedExhibitionIds(new Set(exhLinks.map((link) => link.exhibition)))

    const qr = await api
      .get('/qr/codes/', { params: { entity_type: 'artwork', entity_id: data.id } })
      .catch(() => ({ data: [] }))
    setQrCode((qr.data.results || qr.data || [])[0] || null)
  }

  useEffect(() => {
    loadChoices()
    if (artworkSlug) loadArtwork(artworkSlug).catch(() => setMessage('Could not load artwork.'))
  }, [artworkSlug])

  const change = (event) =>
    setForm({
      ...form,
      [event.target.name]: event.target.type === 'checkbox' ? event.target.checked : event.target.value,
    })

  const addChoice = async (kind, value, clear) => {
    if (!value.trim()) return
    try {
      const { data } = await api.post(`/artworks/${kind}/`, { name: value.trim(), slug: slugify(value) })
      await loadChoices()
      if (kind === 'categories') setForm({ ...form, category_id: data.id })
      clear('')
      setMessage(`${kind === 'categories' ? 'Category' : 'Tag'} created.`)
    } catch (error) {
      setMessage(errorText(error))
    }
  }

  const handleMarkdownInsert = (prefix, suffix, placeholder) => {
    const current = form.markdown_statement || ''
    const addition = `${prefix}${placeholder}${suffix}`
    setForm({ ...form, markdown_statement: current + addition })
  }

  const saveArtworkData = async (nextStep = null) => {
    setSaving(true)
    setMessage('')
    try {
      const payload = {
        ...form,
        year_created: form.year_created ? parseInt(form.year_created, 10) : null,
        category_id: form.category_id || null,
      }
      delete payload.markdown_statement
      delete payload.change_note

      const { data } = artwork
        ? await api.patch(`/artworks/${artwork.slug}/`, payload)
        : await api.post('/artworks/', payload)

      // Handle statement version update if changed
      const currentStatement = artwork?.current_version_detail?.markdown_statement || ''
      if (form.markdown_statement.trim() && form.markdown_statement !== currentStatement) {
        const versions = data.versions || artwork?.versions || []
        const nextVersion = Math.max(0, ...versions.map((item) => item.version_number)) + 1
        await api.post('/artworks/versions/', {
          artwork: data.id,
          version_number: nextVersion,
          markdown_statement: form.markdown_statement,
          change_note: form.change_note || `Version ${nextVersion} statement update`,
        })
      }

      // Auto-generate QR Code if not present
      let currentQr = qrCode
      if (!currentQr) {
        try {
          const qrRes = await api.post('/qr/codes/generate_qr/', { entity_type: 'artwork', entity_id: data.id })
          currentQr = qrRes.data
          setQrCode(currentQr)
        } catch {
          // Ignore QR creation error
        }
      }

      await loadArtwork(data.slug)
      setMessage('Artwork saved successfully!')

      if (!artworkSlug) {
        navigate(`/dashboard/artworks/${data.slug}/edit`, { replace: true })
      }

      if (nextStep) {
        setActiveStep(nextStep)
      }
      return data
    } catch (error) {
      setMessage(errorText(error))
      return null
    } finally {
      setSaving(false)
    }
  }

  const handleStepSubmit = async (e, targetStep) => {
    e.preventDefault()
    await saveArtworkData(targetStep)
  }

  const toggleExhibitionLink = async (exhibitionId) => {
    if (!artwork) return
    try {
      const existingRes = await api.get('/exhibitions/artworks/', { params: { artwork: artwork.id, exhibition: exhibitionId } })
      const existing = (existingRes.data.results || existingRes.data || [])[0]
      if (existing) {
        await api.delete(`/exhibitions/artworks/${existing.id}/`)
        setMessage('Artwork removed from exhibition.')
      } else {
        await api.post('/exhibitions/artworks/', { exhibition: exhibitionId, artwork: artwork.id })
        setMessage('Artwork associated to exhibition!')
      }
      await loadArtwork(artwork.slug)
    } catch (error) {
      setMessage(errorText(error))
    }
  }

  const deleteBanner = async () => {
    if (!artwork) return
    try {
      await api.delete(`/artworks/${artwork.slug}/upload_banner/`)
      await loadArtwork(artwork.slug)
      setMessage('Banner image removed.')
    } catch (error) {
      setMessage(errorText(error))
    }
  }

  const deleteGalleryImage = async (imageId) => {
    if (!artwork) return
    try {
      await api.delete(`/artworks/images/${imageId}/`)
      await loadArtwork(artwork.slug)
      setMessage('Gallery image deleted.')
    } catch (error) {
      setMessage(errorText(error))
    }
  }

  const upload = async (file, kind) => {
    if (!file || !artwork) return
    const payload = new FormData()
    payload.append(kind === 'banner' ? 'banner' : 'image', file)
    if (kind === 'images') {
      payload.append('caption', imageMeta.caption)
      payload.append('display_order', imageMeta.display_order)
      payload.append('is_process_image', imageMeta.is_process_image)
    }
    try {
      await api.post(
        `/artworks/${artwork.slug}/${kind === 'banner' ? 'upload_banner' : 'upload_images'}/`,
        payload,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      )
      await loadArtwork(artwork.slug)
      setMessage(`${kind === 'banner' ? 'Banner' : 'Image'} uploaded!`)
    } catch (error) {
      setMessage(errorText(error))
    }
  }

  const generateQr = async () => {
    if (!artwork) return
    try {
      const { data } = await api.post('/qr/codes/generate_qr/', { entity_type: 'artwork', entity_id: artwork.id })
      setQrCode(data)
      setMessage('Physical QR code generated!')
    } catch (error) {
      setMessage(errorText(error))
    }
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Artist Workspace</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F4F4F5]">
            {artwork ? `Edit Artwork: ${artwork.title}` : 'Upload Artwork'}
          </h1>
        </div>

        {artwork && (
          <Link to={`/artworks/${artwork.slug}`} target="_blank">
            <Button variant="secondary" className="!py-1.5 text-xs">
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Public Page</span>
            </Button>
          </Link>
        )}
      </div>

      {message && (
        <div className="rounded-[10px] bg-indigo-500/10 border border-indigo-500/30 p-3 text-xs text-indigo-300">
          {message}
        </div>
      )}

      {/* Multi-Part Stepper Navigation */}
      <div className="grid grid-cols-3 gap-2 p-1.5 bg-[#0D0F14] rounded-[12px] border border-white/[0.08] text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveStep(1)}
          className={`py-3 px-2 rounded-[9px] flex flex-col sm:flex-row items-center justify-center gap-2 transition ${
            activeStep === 1
              ? 'bg-indigo-600 text-white shadow-lg'
              : 'text-[#A1A1AA] hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <span className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center text-[11px]">1</span>
          <span>Part 1: Primary Specs &amp; QR</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveStep(2)}
          className={`py-3 px-2 rounded-[9px] flex flex-col sm:flex-row items-center justify-center gap-2 transition ${
            activeStep === 2
              ? 'bg-indigo-600 text-white shadow-lg'
              : 'text-[#A1A1AA] hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <span className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center text-[11px]">2</span>
          <span>Part 2: Statement &amp; AI</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveStep(3)}
          className={`py-3 px-2 rounded-[9px] flex flex-col sm:flex-row items-center justify-center gap-2 transition ${
            activeStep === 3
              ? 'bg-indigo-600 text-white shadow-lg'
              : 'text-[#A1A1AA] hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <span className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center text-[11px]">3</span>
          <span>Part 3: Media &amp; Exhibitions</span>
        </button>
      </div>

      {/* PART 1: PRIMARY SPECS & QR TAG */}
      {activeStep === 1 && (
        <form onSubmit={(e) => handleStepSubmit(e, 2)} className="surface-card p-6 space-y-6">
          <div className="border-b border-white/[0.06] pb-3">
            <h2 className="text-base font-bold text-[#F4F4F5]">Part 1: Artwork Specifications</h2>
            <p className="text-xs text-[#71717A] mt-0.5">
              Enter primary details for your artwork. Saving will generate its physical QR code tag.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1 text-xs font-medium text-[#A1A1AA]">
              Artwork Title *
              <input required name="title" value={form.title || ''} onChange={change} placeholder="e.g. Echoes of Memory" className={inputClass} />
            </label>

            <label className="space-y-1 text-xs font-medium text-[#A1A1AA]">
              Medium
              <input name="medium" value={form.medium || ''} onChange={change} placeholder="e.g. Oil on linen" className={inputClass} />
            </label>

            <label className="space-y-1 text-xs font-medium text-[#A1A1AA]">
              Year Created
              <input type="number" name="year_created" value={form.year_created || ''} onChange={change} placeholder="2026" className={inputClass} />
            </label>

            <label className="space-y-1 text-xs font-medium text-[#A1A1AA]">
              Dimensions
              <input name="dimensions" value={form.dimensions || ''} onChange={change} placeholder="120 x 90 cm" className={inputClass} />
            </label>
          </div>

          <label className="block space-y-1 text-xs font-medium text-[#A1A1AA]">
            Short Description / Synopsis
            <textarea name="description" rows={2} value={form.description || ''} onChange={change} placeholder="Artwork synopsis..." className={inputClass} />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-medium text-[#A1A1AA]">Category</label>
              <select name="category_id" value={form.category_id || ''} onChange={change} className={inputClass}>
                <option value="">Uncategorized</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Add category" className={inputClass} />
                <Button type="button" variant="secondary" onClick={() => addChoice('categories', newCategory, setNewCategory)} className="!py-1.5 !px-3 text-xs shrink-0">+ Add</Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-[#A1A1AA]">Publication Status</label>
              <select name="status" value={form.status} onChange={change} className={inputClass}>
                <option value="draft">Draft (Private - Hidden from public)</option>
                <option value="published">Published (Public)</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {/* QR Code Tag Surface */}
          <div className="pt-4 border-t border-white/[0.06] space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              <span>Assigned Physical QR Tag</span>
            </h3>

            {qrCode?.qr_image_url ? (
              <div className="flex items-center gap-4 bg-[#0D0F14] p-3.5 rounded-[10px] border border-white/[0.08]">
                <img src={mediaUrl(qrCode.qr_image_url)} alt="QR" className="h-20 w-20 bg-white p-1 rounded shrink-0" />
                <div className="space-y-1 text-xs">
                  <p className="font-mono text-[#F4F4F5] font-semibold">{qrCode.qr_slug}</p>
                  <p className="text-[11px] text-[#71717A]">Scans recorded: {qrCode.scans || 0}</p>
                  <a href={`${api.defaults.baseURL}/qr/codes/${qrCode.id}/download/`}>
                    <Button type="button" variant="primary" className="!py-1 !px-2.5 text-[11px] mt-1">
                      <Download className="h-3 w-3" />
                      <span>Download QR Image</span>
                    </Button>
                  </a>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-[10px] bg-[#0D0F14] border border-white/[0.06] text-xs text-[#71717A] flex items-center justify-between flex-wrap gap-2">
                <span>Clicking <strong>"Save &amp; Continue"</strong> below will save your details and generate your artwork's physical QR tag.</span>
                {artwork && (
                  <Button type="button" variant="primary" onClick={generateQr} className="!py-1 !px-2.5 text-xs">
                    Generate QR Now
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Part 1 Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.06]">
            <Button type="submit" variant="primary" disabled={saving} className="text-xs">
              <span>{saving ? 'Saving Specs...' : 'Save Specs & Continue to Statement'}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </form>
      )}

      {/* PART 2: ARTIST STATEMENT & AI ASSISTANT */}
      {activeStep === 2 && (
        <form onSubmit={(e) => handleStepSubmit(e, 3)} className="surface-card p-6 space-y-6">
          <div className="border-b border-white/[0.06] pb-3 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-base font-bold text-[#F4F4F5]">Part 2: Artist Statement (Markdown)</h2>
              <p className="text-xs text-[#71717A] mt-0.5">
                Draft or refine your artist statement. Use the AI Assistant or interactive markdown tools.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="primary"
                onClick={() => setShowAiModal(true)}
                className="!py-1.5 !px-3 text-xs"
              >
                <Sparkles className="h-4 w-4" />
                <span>AI Writing Assistant</span>
              </Button>
              <Button type="button" variant="secondary" onClick={() => setPreview(!preview)} className="!py-1.5 !px-3 text-xs">
                <Eye className="h-4 w-4" />
                <span>{preview ? 'Editor' : 'Preview'}</span>
              </Button>
            </div>
          </div>

          {showAiModal && (
            <AIAssistantModal
              artworkId={artwork?.id}
              artworkTitle={form.title}
              artworkMedium={form.medium}
              onAccept={(text) => setForm({ ...form, markdown_statement: text })}
              onClose={() => setShowAiModal(false)}
            />
          )}

          {!preview && <MarkdownTips onInsert={handleMarkdownInsert} value={form.markdown_statement} />}

          {preview ? (
            <div className="surface-card p-4 min-h-[200px] prose prose-invert max-w-none text-xs text-[#F4F4F5]">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{form.markdown_statement || '*No statement written.*'}</ReactMarkdown>
            </div>
          ) : (
            <textarea
              name="markdown_statement"
              rows={8}
              value={form.markdown_statement || ''}
              onChange={change}
              placeholder="Write your artist statement in Markdown..."
              className={`${inputClass} font-mono text-xs`}
            />
          )}

          <label className="block space-y-1 text-xs font-medium text-[#A1A1AA]">
            Version Update Note (Optional)
            <input name="change_note" value={form.change_note || ''} onChange={change} placeholder="e.g. Refined second paragraph concept" className={inputClass} />
          </label>

          {/* Part 2 Actions */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-white/[0.06]">
            <Button type="button" variant="secondary" onClick={() => setActiveStep(1)} className="text-xs">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Part 1</span>
            </Button>

            <Button type="submit" variant="primary" disabled={saving} className="text-xs">
              <span>{saving ? 'Saving Statement...' : 'Save Statement & Continue to Media'}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </form>
      )}

      {/* PART 3: MEDIA UPLOADS & EXHIBITIONS */}
      {activeStep === 3 && (
        <div className="space-y-6">
          <form onSubmit={(e) => handleStepSubmit(e, null)} className="surface-card p-6 space-y-6">
            <div className="border-b border-white/[0.06] pb-3">
              <h2 className="text-base font-bold text-[#F4F4F5]">Part 3: Banner, Gallery Shots &amp; Exhibitions</h2>
              <p className="text-xs text-[#71717A] mt-0.5">
                Upload imagery and associate this artwork with digital exhibition catalogues.
              </p>
            </div>

            {/* Header Banner Upload */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-[#F4F4F5]">Header Banner Graphic</h3>
                {artwork?.banner_image && (
                  <Button type="button" variant="secondary" onClick={deleteBanner} className="!py-1 !px-2.5 text-xs text-red-400 border-red-500/20 hover:bg-red-500/10">
                    Remove Banner
                  </Button>
                )}
              </div>
              <ImageUpload label="Upload Banner Graphic" onChange={(f) => upload(f, 'banner')} />
              {artwork?.banner_image && (
                <img src={mediaUrl(artwork.banner_image)} alt="Banner" className="h-28 w-full object-cover rounded-[9px]" />
              )}
            </div>

            {/* Gallery & Process Images Upload */}
            <div className="space-y-4 pt-4 border-t border-white/[0.06]">
              <h3 className="text-xs font-semibold text-[#F4F4F5]">
                Gallery &amp; Process Photos ({artwork?.images?.length || 0})
              </h3>

              <div className="grid gap-3 sm:grid-cols-2 bg-[#0D0F14] p-4 rounded-[10px] border border-white/[0.06]">
                <div className="space-y-2">
                  <input
                    value={imageMeta.caption}
                    onChange={(e) => setImageMeta({ ...imageMeta, caption: e.target.value })}
                    placeholder="Image caption (e.g., Close-up texture)"
                    className={inputClass}
                  />
                  <label className="flex items-center gap-2 text-xs text-[#A1A1AA] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={imageMeta.is_process_image}
                      onChange={(e) => setImageMeta({ ...imageMeta, is_process_image: e.target.checked })}
                      className="rounded border-white/[0.09] text-indigo-600"
                    />
                    <span>Mark as Process / Work-in-Progress Shot</span>
                  </label>
                </div>

                <div>
                  <ImageUpload label="Upload Photo" onChange={(f) => upload(f, 'images')} />
                </div>
              </div>

              {artwork?.images?.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-3 pt-2">
                  {artwork.images.map((img) => (
                    <div key={img.id} className="surface-card p-2 space-y-2 overflow-hidden">
                      <img src={mediaUrl(img.image_url)} alt={img.caption || 'Artwork photo'} className="h-28 w-full object-cover rounded-[7px]" />
                      <div className="flex items-center justify-between text-[11px] text-[#A1A1AA]">
                        <span className="truncate">{img.caption || (img.is_process_image ? 'Process Shot' : 'Gallery Image')}</span>
                        <button
                          type="button"
                          onClick={() => deleteGalleryImage(img.id)}
                          className="text-red-400 hover:text-red-300 font-semibold ml-2 shrink-0"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Exhibition Associations Surface */}
            {artwork && (
              <div className="space-y-3 pt-4 border-t border-white/[0.06]">
                <h3 className="text-xs font-semibold text-[#F4F4F5]">Associate to Exhibitions</h3>
                <p className="text-xs text-[#71717A]">
                  Link this artwork to one or multiple digital exhibition catalogues.
                </p>
                <div className="grid gap-2 sm:grid-cols-2 pt-1">
                  {exhibitions.map((exh) => {
                    const isLinked = linkedExhibitionIds.has(exh.id)
                    return (
                      <div
                        key={exh.id}
                        onClick={() => toggleExhibitionLink(exh.id)}
                        className={`p-3 rounded-[9px] border text-xs cursor-pointer flex items-center justify-between transition ${
                          isLinked ? 'bg-indigo-600/20 border-indigo-400/50 text-[#F4F4F5]' : 'bg-[#0D0F14] border-white/[0.06] text-[#A1A1AA]'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <p className="font-semibold truncate text-[#F4F4F5]">{exh.title}</p>
                          <p className="text-[10px] text-[#71717A] truncate">{exh.location || 'Gallery'}</p>
                        </div>
                        <span className="text-[10px] font-bold shrink-0">{isLinked ? '✓ Linked' : '+ Link'}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Part 3 Bottom Submit Bar */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-white/[0.06]">
              <Button type="button" variant="secondary" onClick={() => setActiveStep(2)} className="text-xs">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Part 2</span>
              </Button>

              <Button type="submit" variant="primary" disabled={saving} className="text-xs">
                <Check className="h-4 w-4" />
                <span>{saving ? 'Finalizing...' : 'Save & Complete Artwork'}</span>
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}