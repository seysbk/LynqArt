import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../../lib/api'
import { mediaUrl } from '../../lib/media'
import { ImageUpload } from '../../components/ui/ImageUpload'
import { MarkdownTips } from '../../components/ui/MarkdownTips'
import { Button } from '../../components/ui/Button'
import { QrCode, Download, Eye, Plus, Check, ExternalLink, Sparkles } from 'lucide-react'
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
  const [form, setForm] = useState(empty)
  const [artwork, setArtwork] = useState(null)
  const [categories, setCategories] = useState([])
  const [tags, setTags] = useState([])
  const [newCategory, setNewCategory] = useState('')
  const [newTag, setNewTag] = useState('')
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
      else setForm({ ...form, tag_ids: [...form.tag_ids, data.id] })
      clear('')
      setMessage(`${kind === 'categories' ? 'Category' : 'Tag'} created.`)
    } catch (error) {
      setMessage(errorText(error))
    }
  }

  const toggleTag = (id) =>
    setForm({
      ...form,
      tag_ids: form.tag_ids.includes(id) ? form.tag_ids.filter((tag) => tag !== id) : [...form.tag_ids, id],
    })

  const handleMarkdownInsert = (prefix, suffix, placeholder) => {
    const current = form.markdown_statement || ''
    const addition = `${prefix}${placeholder}${suffix}`
    setForm({ ...form, markdown_statement: current + addition })
  }

  const save = async (event) => {
    event.preventDefault()
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
      setMessage('Artwork saved successfully!')
      if (!artworkSlug) {
        navigate(`/dashboard/artworks/${data.slug}/edit`)
      } else {
        await loadArtwork(data.slug)
      }
    } catch (error) {
      setMessage(errorText(error))
    } finally {
      setSaving(false)
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

      {/* Main Form Surface */}
      <form onSubmit={save} className="surface-card p-6 space-y-6">
        <h2 className="text-sm font-semibold text-[#F4F4F5]">Artwork Specifications</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1 text-xs font-medium text-[#A1A1AA]">
            Title *
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
          Short Description
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
              <option value="draft">Draft (Private)</option>
              <option value="published">Published (Public)</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {/* Artist Statement Markdown Section */}
        <div className="space-y-3 pt-4 border-t border-white/[0.06]">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-sm font-semibold text-[#F4F4F5]">Artist Statement (Markdown)</h2>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="primary"
                onClick={() => setShowAiModal(true)}
                className="!py-1 !px-2.5 text-xs"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>AI Writing Assistant</span>
              </Button>
              <Button type="button" variant="secondary" onClick={() => setPreview(!preview)} className="!py-1 !px-2.5 text-xs">
                <Eye className="h-3.5 w-3.5" />
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

          {/* Interactive Markdown Tips */}
          {!preview && <MarkdownTips onInsert={handleMarkdownInsert} value={form.markdown_statement} />}

          {preview ? (
            <div className="surface-card p-4 min-h-[160px] prose prose-invert max-w-none text-xs text-[#F4F4F5]">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{form.markdown_statement || '*No statement written.*'}</ReactMarkdown>
            </div>
          ) : (
            <textarea
              name="markdown_statement"
              rows={6}
              value={form.markdown_statement || ''}
              onChange={change}
              placeholder="Write your artist statement in Markdown..."
              className={`${inputClass} font-mono text-xs`}
            />
          )}

          <input name="change_note" value={form.change_note || ''} onChange={change} placeholder="Version update note (optional)..." className={inputClass} />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" variant="primary" disabled={saving} className="text-xs">
            <Check className="h-4 w-4" />
            <span>{saving ? 'Saving...' : artwork ? 'Update Artwork' : 'Create & Save Artwork'}</span>
          </Button>
          <Link to="/dashboard">
            <Button variant="secondary" className="text-xs">Cancel</Button>
          </Link>
        </div>
      </form>

      {/* Exhibition Associations Surface */}
      {artwork && (
        <div className="surface-card p-5 space-y-3">
          <h3 className="text-sm font-semibold text-[#F4F4F5]">Associate to Exhibitions</h3>
          <p className="text-xs text-[#71717A]">
            Select one or multiple exhibitions to associate this artwork with. Associated artworks are featured in the digital exhibition catalogue.
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
                  <span className="text-[10px] font-bold shrink-0">{isLinked ? '✓ Associated' : '+ Associate'}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* QR Code & Images when Artwork is active */}
      {artwork && (
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Physical QR Code Section */}
          <div className="surface-card p-5 space-y-3">
            <h3 className="text-sm font-semibold text-[#F4F4F5] flex items-center gap-2">
              <QrCode className="h-4 w-4 text-indigo-400" />
              <span>Physical QR Tag</span>
            </h3>

            {qrCode?.qr_image_url ? (
              <div className="flex items-center gap-4 bg-[#0D0F14] p-3 rounded-[9px] border border-white/[0.06]">
                <img src={mediaUrl(qrCode.qr_image_url)} alt="QR" className="h-20 w-20 bg-white p-1 rounded shrink-0" />
                <div className="space-y-1 text-xs">
                  <p className="font-mono text-[#F4F4F5]">{qrCode.qr_slug}</p>
                  <a href={`${api.defaults.baseURL}/qr/codes/${qrCode.id}/download/`}>
                    <Button variant="primary" className="!py-1 !px-2.5 text-[11px] mt-1">
                      <Download className="h-3 w-3" />
                      <span>Download QR</span>
                    </Button>
                  </a>
                </div>
              </div>
            ) : (
              <Button variant="primary" onClick={generateQr} className="w-full text-xs">
                Generate QR Tag
              </Button>
            )}
          </div>

          {/* Banner Upload */}
          <div className="surface-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#F4F4F5]">Header Banner Graphic</h3>
              {artwork.banner_image && (
                <Button variant="secondary" onClick={deleteBanner} className="!py-1 !px-2.5 text-xs text-red-400 border-red-500/20 hover:bg-red-500/10">
                  Remove Banner
                </Button>
              )}
            </div>
            <p className="text-[11px] text-[#71717A]">Main hero banner header for artwork page</p>
            <ImageUpload label="Upload Banner Graphic" onChange={(f) => upload(f, 'banner')} />
            {artwork.banner_image && (
              <img src={mediaUrl(artwork.banner_image)} alt="Banner" className="h-24 w-full object-cover rounded-[9px]" />
            )}
          </div>

          {/* Gallery & Process Images Upload Section */}
          <div className="surface-card p-5 space-y-4 sm:col-span-2">
            <h3 className="text-sm font-semibold text-[#F4F4F5]">Gallery &amp; Process Images ({artwork.images?.length || 0})</h3>
            <p className="text-xs text-[#71717A]">
              Upload high-resolution artwork detail photos or work-in-progress process shots.
            </p>

            <div className="grid gap-3 sm:grid-cols-2 bg-[#0D0F14] p-4 rounded-[10px] border border-white/[0.06]">
              <div className="space-y-2">
                <input
                  value={imageMeta.caption}
                  onChange={(e) => setImageMeta({ ...imageMeta, caption: e.target.value })}
                  placeholder="Image caption (e.g., Detail of texture)"
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
                <ImageUpload label="Upload Gallery / Process Photo" onChange={(f) => upload(f, 'images')} />
              </div>
            </div>

            {/* List of Previous Images with Deletion Control */}
            {artwork.images?.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-3 pt-2">
                {artwork.images.map((img) => (
                  <div key={img.id} className="relative group surface-card p-2 space-y-2 overflow-hidden">
                    <img src={mediaUrl(img.image_url)} alt={img.caption || 'Artwork photo'} className="h-32 w-full object-cover rounded-[7px]" />
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
        </div>
      )}
    </div>
  )
}